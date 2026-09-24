import "server-only";
import { cache } from "react";
import { sql } from "./db";
import { mmsNews } from './mms-import';

type Status = { status: string };

export type News = {
  id: string; slug: string;
  title_th: string; title_en: string;
  excerpt_th: string; excerpt_en: string;
  body_th: string; body_en: string;
  cover_url: string; tags: string[];
  published_at: string;
} & Status;

export type Activity = {
  id: string; slug: string;
  title_th: string; title_en: string;
  excerpt_th: string; excerpt_en: string;
  body_th: string; body_en: string;
  cover_url: string;
  start_date: string | null; end_date: string | null;
  venue_th: string; venue_en: string; register_url: string;
} & Status;

export type CommitteeMember = {
  id: string; name_th: string; name_en: string;
  position_th: string; position_en: string;
  org_th: string; org_en: string; bio_th: string; bio_en: string;
  photo_url: string; group_key: "president" | "committee" | "advisor";
  term: string; email: string; sort: number;
};

export type ListItem = {
  id: string; list_key: string; icon: string;
  title_th: string; title_en: string;
  body_th: string; body_en: string;
  href: string; image_url: string; sort: number;
};

export type Stat = { id: string; value: string; suffix: string; label_th: string; label_en: string };

export type ServiceCard = {
  id: string; icon: string; title_th: string; title_en: string;
  body_th: string; body_en: string; href: string;
};

export type TimelineEvent = {
  id: string; year_th: string; year_en: string;
  title_th: string; title_en: string; body_th: string; body_en: string;
};

export type ResearchItem = {
  cover_url?: string;
  id: string; title_th: string; title_en: string; authors: string;
  venue_th: string; venue_en: string; abstract_th: string; abstract_en: string;
  year: number; doi: string; pdf_url: string; tags: string[];
};

export type AwardItem = {
  id: string; year: number; category_th: string; category_en: string;
  recipient_th: string; recipient_en: string;
  citation_th: string; citation_en: string; photo_url: string;
};

export type JobPost = {
  id: string; slug: string; title_th: string; title_en: string;
  org_th: string; org_en: string; location_th: string; location_en: string;
  description_th: string; description_en: string;
  employment_type: string; salary_range: string;
  deadline: string | null; apply_url: string;
};

export type GalleryAlbum = {
  id: string; slug: string; title_th: string; title_en: string;
  description_th: string; description_en: string;
  cover_url: string; event_date: string | null; photo_count?: number;
};

export type GalleryPhoto = {
  id: string; album_id: string; image_url: string;
  caption_th: string; caption_en: string; sort: number;
};

export type DocumentItem = {
  id: string; title_th: string; title_en: string;
  description_th: string; description_en: string;
  category_th: string; category_en: string;
  file_url: string; mime: string; size_bytes: number | null; download_count: number;
};

export type LocationItem = {
  id: string; name_th: string; name_en: string;
  address_th: string; address_en: string;
  lat: number; lng: number; kind: "office" | "branch" | "partner" | "member"; url: string;
};

export type Partner = { id: string; name: string; logo_url: string; url: string };

// ── public reads (published only) ──────────────────────────────────────────

export const getNews = cache(async (limit = 50, offset = 0) => {
  const own = await sql<News[]>`select * from news order by published_at desc, created_at desc`;
  const managedSlugs = new Set(own.map((article) => article.slug));
  return [...own.filter((article) => article.status === 'published'), ...mmsNews.filter((article) => !managedSlugs.has(article.slug))]
    .sort((a,b)=>(Date.parse(b.published_at)||0)-(Date.parse(a.published_at)||0)).slice(offset,offset+limit);
});

export const countNews = cache(async () =>
  (await getNews(Number.MAX_SAFE_INTEGER)).length);

export const getNewsBySlug = cache(async (slug: string) => {
  const managed = (await sql<News[]>`select * from news where slug = ${slug} limit 1`)[0];
  return managed ? (managed.status === 'published' ? managed : undefined) : mmsNews.find((article) => article.slug === slug);
});

export const getActivities = cache(async (limit = 50, offset = 0) =>
  sql<Activity[]>`select * from activities where status = 'published'
                  order by start_date desc nulls last, created_at desc limit ${limit} offset ${offset}`);

/** Archive cards disappear once an editor claims a partner event, even as Draft. */
export const getManagedMmsActivityIds = cache(async () =>
  (await sql<{ slug: string }[]>`select slug from activities where slug like 'mms-hub-%'`)
    .map((row) => row.slug.replace(/^mms-hub-/, '')));

export const getUpcomingActivities = cache(async (limit = 3) =>
  sql<Activity[]>`select * from activities where status = 'published'
                  and (end_date is null or end_date >= current_date)
                  order by start_date asc nulls last limit ${limit}`);

export const countActivities = cache(async () =>
  (await sql<{ n: number }[]>`select count(*)::int as n from activities where status = 'published'`)[0].n);

export const getActivityBySlug = cache(async (slug: string) =>
  (await sql<Activity[]>`select * from activities where slug = ${slug} and status = 'published' limit 1`)[0]);

export const getCommittee = cache(async () =>
  sql<CommitteeMember[]>`select * from committee_members where status = 'published' order by sort, created_at`);

export const getListItems = cache(async (listKey: string) =>
  sql<ListItem[]>`select * from list_items where list_key = ${listKey} and status = 'published' order by sort, created_at`);

export const getStats = cache(async () =>
  sql<Stat[]>`select * from stats where status = 'published' order by sort, created_at`);

export const getServiceCards = cache(async () =>
  sql<ServiceCard[]>`select * from service_cards where status = 'published' order by sort, created_at`);

export const getTimeline = cache(async () =>
  sql<TimelineEvent[]>`select * from timeline_events where status = 'published' order by sort, created_at`);

export const getResearch = cache(async () =>
  sql<ResearchItem[]>`select * from research_items where status = 'published' order by year desc, sort`);

export const getAwards = cache(async () =>
  sql<AwardItem[]>`select * from awards where status = 'published' order by year desc, sort`);

export const getJobs = cache(async () =>
  sql<JobPost[]>`select * from job_posts where status = 'published'
                 order by (deadline is null), deadline asc, sort`);

export const getJobBySlug = cache(async (slug: string) =>
  (await sql<JobPost[]>`select * from job_posts where slug = ${slug} and status = 'published' limit 1`)[0]);

export const getAlbums = cache(async () =>
  sql<GalleryAlbum[]>`select a.*, (select count(*)::int from gallery_photos p where p.album_id = a.id) as photo_count
                      from gallery_albums a where a.status = 'published'
                      order by a.event_date desc nulls last, a.sort`);

export const getAlbumBySlug = cache(async (slug: string) =>
  (await sql<GalleryAlbum[]>`select * from gallery_albums where slug = ${slug} and status = 'published' limit 1`)[0]);

export const getAlbumPhotos = cache(async (albumId: string) =>
  sql<GalleryPhoto[]>`select * from gallery_photos where album_id = ${albumId} order by sort, created_at`);

export const getDocuments = cache(async () =>
  sql<DocumentItem[]>`select * from documents where status = 'published' order by sort, created_at`);

export const getLocations = cache(async () =>
  sql<LocationItem[]>`select * from locations where status = 'published' order by sort, created_at`);

export const getPartners = cache(async () =>
  sql<Partner[]>`select * from partners where status = 'published' order by sort, created_at`);
