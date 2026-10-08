import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const sourceUrl = new URL('./footer-contact-release.ts', import.meta.url);
const source = fs.readFileSync(sourceUrl, 'utf8').replaceAll('import.meta.url', JSON.stringify(sourceUrl.href));
const exports = {};
vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports,require,URL});
const {releaseFooterContact,releaseFailureMessage} = exports;

function database({marker=false,failMigration=false}={}) {
  const statements = [];
  let committed = false;
  const tx = async parts => {
    const query = parts.join('?');
    statements.push(query);
    if (query.includes('schema_migrations')) throw Object.assign(new Error('relation does not exist'),{code:'42P01'});
    return query.includes('select id from audit_log') && marker ? [{id:1}] : [];
  };
  tx.unsafe = text => ({simple: async () => {
    statements.push(text);
    if (failMigration && text.includes('Approved contact correction')) throw Object.assign(new Error('unreviewed setting'),{code:'P0001'});
  }});
  return {sql:{begin:async callback => {const result=await callback(tx);committed=true;return result;}},statements,get committed(){return committed;}};
}

test('release works when app migration bookkeeping is absent',async () => {
  const db=database();
  assert.equal(await releaseFooterContact(db.sql),'applied');
  assert.equal(db.committed,true);
  assert.equal(db.statements.filter(q=>q.includes('alter table settings')).length,1);
  assert.equal(db.statements.filter(q=>q.includes('Approved contact correction')).length,1);
  assert.ok(db.statements.some(q=>q.includes('pg_advisory_xact_lock')));
  assert.ok(!db.statements.some(q=>q.includes('schema_migrations')));
});

test('an existing audit marker prevents later settings or schema edits being changed',async () => {
  const db=database({marker:true});
  assert.equal(await releaseFooterContact(db.sql),'already-applied');
  assert.equal(db.committed,true);
  assert.ok(!db.statements.some(q=>q.includes('alter table')||q.includes('update settings')));
});

test('unreviewed settings abort the transaction instead of continuing the build',async () => {
  const db=database({failMigration:true});
  await assert.rejects(releaseFooterContact(db.sql),error=>error.code==='P0001');
  assert.equal(db.committed,false);
});

test('release diagnostics expose only a bounded SQLSTATE',() => {
  const secret='postgres://private-user:private-password@private-host/db';
  const message=releaseFailureMessage({code:'42P01',message:secret,detail:secret,query:secret});
  assert.match(message,/SQLSTATE 42P01/);
  assert.ok(!message.includes(secret));
  assert.ok(!releaseFailureMessage({code:secret}).includes(secret));
  assert.ok(!releaseFailureMessage(new Error(secret)).includes(secret));
});
