import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dependencyRequire = createRequire(import.meta.url);
const root = path.resolve(__dirname, '..');

// Execute actual TypeScript modules; replace only framework, auth and DB edges.
// This runner never imports the database module or reads environment files.
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  const customRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(root, path.dirname(file), name)) + '.ts', mocks);
    return dependencyRequire(name);
  };
  vm.runInNewContext(code, { exports, require: customRequire, Error, URL, TextEncoder, console }, { filename: file });
  return exports;
}

const { sanitizeHtml } = load('src/lib/utils.ts');
test('HTML policy rejects obfuscated protocols, active markup and event handlers', () => {
  for (const input of [
    '<a href=javascript:void(0)>x</a>', '<a href="java&#x73;cript:void(0)">x</a>',
    '<a href="java\nscript:void(0)">x</a>', '<a href="data:text/html,test">x</a>',
    '<a href="//example.invalid">x</a>', '<img src="data:image/svg+xml,test" onerror="void(0)">',
    '<svg><a xlink:href="javascript:void(0)">x</a></svg>', '<iframe srcdoc="test"></iframe>',
  ]) {
    const clean = sanitizeHtml(input);
    assert.doesNotMatch(clean, /javascript|data:|onerror|srcdoc|xlink|<svg|<iframe|href=/i, clean);
  }
});
test('HTML policy preserves editorial formatting, local images and permitted links', () => {
  const clean = sanitizeHtml('<h2 lang="th">ข่าว</h2><p><strong>Bold</strong><em>Emphasis</em></p><ul><li>List</li></ul><img src="/images/photo.jpg" alt="Photo"><a href="https://example.invalid" target="_blank">Source</a><a href="mailto:editor@example.invalid">Email</a>');
  assert.match(clean, /<h2 lang="th">ข่าว<\/h2>/); assert.match(clean, /<strong>Bold<\/strong>/);
  assert.match(clean, /src="\/images\/photo.jpg"/); assert.match(clean, /rel="noopener noreferrer"/);
  assert.match(clean, /mailto:editor@example.invalid/); assert.equal(sanitizeHtml(clean), clean);
});

const { safeLoginReturn } = load('src/lib/login-return.ts');
test('login return only accepts enabled same-origin admin paths', () => {
  for (const input of ['//example.invalid', 'https://example.invalid', '/admin/../news', '/admin/news/../../evil', '/admin/news\\evil', '/admin/%2f%2fevil', '/admin/news/%2e%2e', '/admin/login', '/admin/settings', '/admin/news\n', null]) assert.equal(safeLoginReturn(input), '/admin/news', String(input));
  assert.equal(safeLoginReturn('/admin/activities/new?from=list#form'), '/admin/activities/new?from=list#form');
  assert.equal(safeLoginReturn('/admin/team/abc'), '/admin/team/abc');
});
test('locale links preserve repeated query keys, filters and pagination', () => {
  const { switchLocaleHref } = load('src/lib/navigation.ts');
  assert.equal(switchLocaleHref('/en/news', 'page=2&tag=a&tag=b', 'th'), '/th/news?page=2&tag=a&tag=b');
  assert.equal(switchLocaleHref('/th', '', 'en'), '/en');
  assert.equal(switchLocaleHref('/en/activities/msic-2026', '', 'th'), '/th/activities/msic-2026');
});
test('language markup distinguishes translated English and Thai fallback', () => {
  const { contentLanguage } = load('src/lib/i18n.ts');
  assert.equal(contentLanguage({title_th:'ข่าว',title_en:'ข่าว'},'title','en'),'th');
  assert.equal(contentLanguage({title_th:'ข่าว',title_en:'News'},'title','en'),'en');
  assert.equal(contentLanguage({title_th:'ข่าว',title_en:''},'title','en'),'th');
  assert.equal(contentLanguage({title_th:'',title_en:'News'},'title','th'),'en');
});
test('calendar dates retain the editor day independent of browser timezone', () => {
  const { formatCalendarDate } = load('src/lib/calendar-date.ts');
  assert.equal(formatCalendarDate('2026-08-09T00:00:00.000Z','en-GB'), '09 August 2026');
  assert.equal(formatCalendarDate('2026-08-09','th-TH','short'), '09 ส.ค. 2569');
  assert.equal(formatCalendarDate('2026-02-30','en-GB'), '');
});

function fixture() {
  let rows = new Map([['existing',{id:'existing',slug:'original',title_th:'Original',title_en:'Original',status:'draft',sort:0}],['second',{id:'second',slug:'second',title_th:'Second',status:'draft',sort:1}]]);
  let failAudit = true, sequence = 0, invalidations = 0, history = [];
  const clone = source => new Map([...source].map(([id,row])=>[id,{...row}]));
  function executor(target, transactional, pendingHistory) {
    const sql = (strings,...values) => {
      if (!Array.isArray(strings?.raw)) return { value: strings };
      const query = strings.join('?').replace(/\s+/g,' ').trim();
      if (query.startsWith('select pg_advisory') || query.startsWith('select setval')) return Promise.resolve([]);
      if (query.startsWith('insert into audit_log')) { assert(transactional); if(failAudit) throw new Error('SYNTHETIC_HISTORY_FAILURE'); pendingHistory.push(values); return Promise.resolve([]); }
      if (query.startsWith('select max(sort)')) return Promise.resolve([{n:target.size-1}]);
      if (query.startsWith('select *')) return Promise.resolve(target.has(values[1])?[{...target.get(values[1])}]:[]);
      if (query.startsWith('select id')) return Promise.resolve([...target.values()].filter(r => query.includes('order by') || r.slug === values[2] && r.id !== values[3]).sort((a,b)=>a.sort-b.sort).map(r=>({id:r.id})));
      assert(transactional, 'Every content mutation must use the transaction executor');
      if (query.startsWith('insert into')) {const row={id:`new-${++sequence}`,...values[1].value}; target.set(row.id,row); return Promise.resolve([{id:row.id}]);}
      if (query.startsWith('delete from')) {target.delete(values[1]);return Promise.resolve([]);}
      if (query.startsWith('update')) {const row=target.get(values.at(-1));if(query.includes('set status'))row.status=values[1];else if(query.includes('set sort'))row.sort=values[1];else Object.assign(row,values[1].value);return Promise.resolve([]);}
      throw new Error(`Unexpected SQL ${query}`);
    };
    sql.json=value=>value;
    return sql;
  }
  const sql = (...args) => executor(rows,false,history)(...args);
  sql.begin = async callback => { const draft=clone(rows), pending=[];const result=await callback(executor(draft,true,pending));rows=draft;history.push(...pending);return result; };
  const auth=load('src/lib/auth.ts',{'server-only':{},'next/headers':{},jose:{},bcryptjs:{},'./db':{sql}});
  const actions=load('src/actions/collections.ts',{'next/cache':{revalidatePath:()=>invalidations++},'@/lib/db':{sql},'@/lib/auth':{audit:auth.audit,requireUser:async()=>({username:'synthetic-editor'})},'@/lib/mms-import':{mmsNews:[],mmsActivities:[]}});
  return {actions, snapshot:()=>JSON.stringify([...rows]), history:()=>history, invalidations:()=>invalidations, allowAudit:()=>{failAudit=false;}};
}
const values={title_th:'Synthetic',title_en:'Synthetic',body_th:'<p>Safe</p>',status:'draft'};
for (const [name,run] of [
  ['create',a=>a.createRow('news',values)], ['update',a=>a.updateRow('news','existing',{...values,title_th:'Edited'})],
  ['publish',a=>a.setStatus('news','existing','published')], ['delete',a=>a.deleteRow('news','existing')],
  ['duplicate',a=>a.duplicateRow('news','existing')], ['reorder',a=>a.reorderRow('news','existing','down')],
]) test(`${name}: audit failure rolls back; retry commits exactly one audit`,async()=>{
  const f=fixture(), before=f.snapshot();const failed=await run(f.actions);
  assert.equal(failed.ok,false);assert.doesNotMatch(failed.error,/SYNTHETIC_HISTORY_FAILURE/);
  assert.equal(f.snapshot(),before);assert.equal(f.history().length,0);assert.equal(f.invalidations(),0);
  f.allowAudit();assert.equal((await run(f.actions)).ok,true);assert.notEqual(f.snapshot(),before);
  assert.equal(f.history().length,1);assert.equal(f.invalidations(),2);
});
