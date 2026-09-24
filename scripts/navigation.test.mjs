import test from 'node:test';
import assert from 'node:assert/strict';
import { singleHomeLink } from '../src/lib/navigation.ts';

for (const locale of ['th', 'en']) {
  test(`${locale}: seven home links become one and other links stay ordered`, () => {
    const home = {href:`/${locale}`, children:[], label:locale === 'th' ? 'หน้าแรก' : 'Home'};
    const news = {href:`/${locale}/news`, children:[], label:'News'};
    const research = {href:`/${locale}/research`, children:[], label:'Research'};
    const input = [...Array.from({length:7}, () => ({...home})), news, research];
    assert.deepEqual(singleHomeLink(input), [home, news, research]);
    assert.equal(input.length, 9);
  });
}
test('home aliases collapse, groups and anchor links are preserved', () => {
  const items = ['/', '/th/', '/en/', '/news', '/#news'].map(href => ({href, children:[]}));
  const group = {href:'/', children:[{href:'/about'}]};
  assert.deepEqual(singleHomeLink([...items, group]), [items[0], items[3], items[4], group]);
});
test('empty and home-free menus remain unchanged', () => {
  assert.deepEqual(singleHomeLink([]), []);
  const items = [{href:'/th/news',children:[]}, {href:'',children:[]}];
  assert.deepEqual(singleHomeLink(items), items);
});
