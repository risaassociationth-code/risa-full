import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/components/admin/constellation-layout.ts',import.meta.url),'utf8');
const exports={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {boundRect,defaultWorkspaceLayout,parseWorkspaceLayout}=exports;

test('workspace preferences round-trip and reject corrupt or unsupported records',()=>{
  const original=defaultWorkspaceLayout();
  assert.deepEqual(parseWorkspaceLayout(JSON.stringify(original)),original);
  for(const raw of [null,'{','{}','{"version":2}',JSON.stringify({...original,panels:{}})])assert.equal(parseWorkspaceLayout(raw),null);
  const invalid=defaultWorkspaceLayout();invalid.nodes.news.x='12px';assert.equal(parseWorkspaceLayout(JSON.stringify(invalid)),null);
  invalid.nodes.news.x=Infinity;assert.equal(parseWorkspaceLayout(JSON.stringify(invalid)),null);
});

test('loaded nodes cannot cover the task prompt or another branch',()=>{
  const center=defaultWorkspaceLayout();center.nodes.news={x:408,y:234,width:220,height:88};
  assert.equal(parseWorkspaceLayout(JSON.stringify(center)),null);
  const overlap=defaultWorkspaceLayout();overlap.nodes.news={...overlap.nodes.team};
  assert.equal(parseWorkspaceLayout(JSON.stringify(overlap)),null);
});

test('move and resize stay within a shrinking viewport and preserve usable minimum sizes',()=>{
  const bounds={width:390,height:380,minWidth:240,minHeight:180};
  for(const rect of [{x:-200,y:-20,width:1,height:1},{x:2000,y:2000,width:1000,height:900},{x:250,y:240,width:360,height:340}]){
    const result=boundRect(rect,bounds);
    assert.ok(result.x>=0&&result.y>=0);
    assert.ok(result.x+result.width<=bounds.width&&result.y+result.height<=bounds.height);
    assert.ok(result.width>=240&&result.height>=180);
  }
  const narrow=boundRect({x:0,y:0,width:360,height:340},{width:200,height:160,minWidth:240,minHeight:180});
  assert.equal(narrow.width,200);assert.equal(narrow.height,160);
});
