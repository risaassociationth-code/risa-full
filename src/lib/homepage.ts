import "server-only";
import { mmsRecords } from "./mms-import";
import { getActivities, getNews, getPartners } from "./queries";

const archivedNews = new Map(
  mmsRecords.filter((record) => record.category === "1").map((record) => [`risa-${record.id}`, record.url]),
);
const archivedActivities = new Map(
  mmsRecords.filter((record) => record.category === "2").map((record) => [`risa-${record.id}`, record.url]),
);
const bangkokDay = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Bangkok",
});

// Postgres returns a Date for a DATE column. Archived records use ISO strings.
function editorialDay(value: Date | string | null): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value?.slice(0, 10) || null;
}

export async function getHomepageContent() {
  const [articles, activityRecords, partners] = await Promise.all([
    getNews(Number.MAX_SAFE_INTEGER),
    getActivities(Number.MAX_SAFE_INTEGER),
    getPartners(),
  ]);
  const today = bangkokDay.format(new Date());
  const publishedNews = articles
    .map((item) => ({
      ...item,
      published_at: editorialDay(item.published_at) ?? "",
      sourceUrl: archivedNews.get(item.slug) ?? null,
    }))
    .filter((item) => item.published_at <= today);
  const news = publishedNews.slice(0, 3);
  const networkStory = publishedNews.find((item) => item.slug === "risa-286");
  const msicProgramme = activityRecords.find((item) => item.slug === "risa-297");
  const msicProgrammeUrl = msicProgramme ? archivedActivities.get(msicProgramme.slug) : undefined;

  // The archive can use an article's publication date when event dates are unknown.
  // Only independently scheduled activities belong in the association's plans.
  const activities = activityRecords
    .filter((item) => !archivedActivities.has(item.slug))
    .map((item) => ({
      ...item,
      start_date: editorialDay(item.start_date),
      end_date: editorialDay(item.end_date),
    }))
    .filter((item): item is typeof item & { start_date: string } =>
      item.start_date !== null && item.start_date >= today,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 3);

  return { news, activities, partners, networkStory, msicProgrammeUrl };
}
