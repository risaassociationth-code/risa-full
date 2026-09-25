import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchesContentFilters } from "../src/lib/content-status";
import { mmsActivities, mmsNews } from "../src/lib/mms-import";

for (const item of [...mmsNews, ...mmsActivities]) {
  assert(matchesContentFilters(item, "published"));
  assert(matchesContentFilters(item, "published", "mms"));
  assert(!matchesContentFilters(item, "draft"));
  assert(!matchesContentFilters(item, "published", "risa"));
  assert(matchesContentFilters({ ...item, status: "draft" }, "draft", "mms"));
  assert(!matchesContentFilters({ ...item, status: "draft" }, "published"));
}
assert(matchesContentFilters({ slug: "risa-event", status: "published" }, "published", "risa"));
assert(!matchesContentFilters({ slug: "risa-event", status: "draft" }, "published"));
// Guard against reintroducing the first-open visibility regression.
const action = readFileSync(new URL("../src/actions/import-activities.ts", import.meta.url), "utf8");
assert.match(action, /if \(existing\) return/);
assert.match(action, /createRow\("activities", \{ \.\.\.activity \} as Row\)/);
assert.doesNotMatch(action, /status:\s*["']draft["']/);
console.log(`Status checks passed for ${mmsNews.length} news and ${mmsActivities.length} activities, plus managed drafts and RISA items.`);
