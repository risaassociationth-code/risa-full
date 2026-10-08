import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
function load(name, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(read(name), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code, {exports, require:name => Object.hasOwn(mocks,name) ? mocks[name] : require(name)});
  return exports;
}
const settings = {org_name_th:'สมาคม RISA',org_name_en:'RISA Association',address_th:'',address_en:'',phone:'082-793-4431',email:'risa.association.th@gmail.com',map_lat:null,map_lng:null,facebook_url:'',youtube_url:'',linkedin_url:'',x_url:''};
for (const locale of ['th','en']) {
  test(`${locale}: footer retains navigation/logo and only the verified contact destinations`, async () => {
    const Editable = ({k,as='span',...props}) => React.createElement(as, props, k);
    const {Footer} = load('src/components/site/Footer.tsx', {
      'next/link':{default:({children,...props})=>React.createElement('a',props,children)},
      '@/lib/content':{getSettings:async()=>settings}, '@/lib/request':{getLocale:async()=>locale},
      '@/lib/i18n':{pick:(row,key,loc)=>row[`${key}_${loc}`]},
      '@/lib/site-scope':load('src/lib/site-scope.ts'),
      '@/components/editable/Editable':{Editable,EditableRich:Editable},
      './SocialIcons':{SocialIcon:()=>null},
    });
    const html = renderToStaticMarkup(await Footer());
    assert.match(html, /href="tel:\+66827934431"/);
    assert.match(html, /href="mailto:risa\.association\.th@gmail\.com"/);
    assert.match(html, /082-793-4431/);
    assert.match(html, /global.footer.contact_title/);
    assert.match(html, /risa-lockup.png/);
    for (const path of ['', '/news','/activities','/team']) assert.ok(html.includes(`href="/${locale}${path}"`));
    assert.doesNotMatch(html, /google.com\/maps|facebook.com|youtube.com|linkedin.com|02-123-4567|info@risa.or.th|global.footer.address_title|global.footer.social_title|global.footer.map_label/);
  });
}
