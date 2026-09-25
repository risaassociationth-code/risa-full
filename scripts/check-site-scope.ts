import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";
import { ADMIN_NAV } from "../src/components/admin/nav";
import { isContentCollection, publicTabs } from "../src/lib/site-scope";
assert.deepEqual(ADMIN_NAV.flatMap(g => g.links.map(l => l.href)), ["/admin/news", "/admin/activities", "/admin/team"]);
for (const locale of ["th", "en"]) {
  assert.deepEqual(publicTabs(locale).map(t => t.href), [`/${locale}`, `/${locale}/news`, `/${locale}/activities`, `/${locale}/team`]);
  assert.equal(publicTabs(locale)[3].label, locale === "th" ? "บุคลากร" : "Personnel");
  assert.equal(publicTabs(locale)[0].label, locale === "th" ? "หน้าแรก" : "Home");
  assert.equal(proxy(new NextRequest(`https://risa-association.com/${locale}`)).status, 200);
  for (const path of ["news", "activities", "news/story", "activities/msic-2026", "team"]) {
    assert.equal(proxy(new NextRequest(`https://risa-association.com/${locale}/${path}`)).status, 200);
  }
  assert.equal(proxy(new NextRequest(`https://risa-association.com/${locale}/research`)).headers.get("location"), `https://risa-association.com/${locale}/news`);
}
for (const path of ["/admin", "/admin/settings", "/admin/pages", "/admin/content", "/admin/navigation", "/admin/codex"]) {
  assert.equal(proxy(new NextRequest(`https://risa-association.com${path}`)).headers.get("location"), "https://risa-association.com/admin/news");
  assert.equal(proxy(new NextRequest(`https://risa-association.com${path}`, {method:"POST"})).status, 403);
}
for (const path of ["/admin/login", "/admin/news", "/admin/activities/new", "/admin/news/123", "/admin/team", "/admin/team/new", "/admin/team/123"]) {
  assert.equal(proxy(new NextRequest(`https://risa-association.com${path}`)).status, 200);
}
assert.equal(proxy(new NextRequest("https://risa-association.com/api/admin/codex", {method:"POST"})).status,403);
assert(isContentCollection("news")); assert(isContentCollection("activities")); assert(isContentCollection("team"));
for (const key of ["stats", "services", "lists", "research", "navigation", "settings"]) assert(!isContentCollection(key));
console.log("News, Activities and Personnel navigation, route protection, and collection scope checks passed.");
