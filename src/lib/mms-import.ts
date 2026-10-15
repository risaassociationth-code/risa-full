import records from '@/content/imports/mms-hub.json';
import type { Activity, News } from './queries';

type ImportedRecord = (typeof records)[number] & {
  titleEn?: string;
  excerptEn?: string;
  bodyEn?: string;
  startDate?: string;
  endDate?: string;
  venueTh?: string;
  venueEn?: string;
};

export const mmsRecords = records as ImportedRecord[];

/** Map legacy mms-hub-* slugs to canonical risa-* slugs. */
export function normalizeImportedSlug(slug: string): string {
  return String(slug ?? '').trim().replace(/^mms-hub-/, 'risa-');
}

export function sourceBody(record: ImportedRecord, locale: 'th' | 'en' = 'th') {
  const galleryTitle = locale === 'th' ? 'ประมวลภาพกิจกรรม' : 'Photo Gallery';
  const altText = locale === 'th' ? 'ภาพประกอบกิจกรรม' : 'Event photograph';
  const gallery = record.images && record.images.length > 0
    ? `<div class="mms-photo-gallery not-prose"><h3 class="mms-photo-gallery-title">${galleryTitle}</h3><div class="mms-photo-grid">${record.images.map(src => `<div class="mms-photo-card"><img src="${src}?v=4" alt="${altText}" loading="lazy"></div>`).join('')}</div></div>`
    : '';
  const body = locale === 'en' && record.bodyEn ? record.bodyEn : record.body;
  return `${body}${gallery}`;
}

export const mmsNews: News[] = mmsRecords.filter(r => r.category === '1').map(r => ({
  id: `mms-${r.id}`,
  slug: `risa-${r.id}`,
  title_th: r.title,
  title_en: r.titleEn || r.title,
  excerpt_th: r.excerpt,
  excerpt_en: r.excerptEn || r.excerpt,
  body_th: sourceBody(r, 'th'),
  body_en: sourceBody(r, 'en'),
  cover_url: r.cover ? `${r.cover}?v=4` : '',
  tags: [],
  published_at: r.publishedAt || '',
  status: 'published',
}));

export const mmsActivities: Activity[] = mmsRecords.filter(r => r.category === '2').map(r => ({
  id: `mms-${r.id}`,
  slug: `risa-${r.id}`,
  title_th: r.title,
  title_en: r.titleEn || r.title,
  excerpt_th: r.excerpt,
  excerpt_en: r.excerptEn || r.excerpt,
  body_th: sourceBody(r, 'th'),
  body_en: sourceBody(r, 'en'),
  cover_url: r.cover ? `${r.cover}?v=4` : '',
  start_date: r.startDate ?? (r.publishedAt ? r.publishedAt.slice(0, 10) : null),
  end_date: r.endDate ?? r.startDate ?? (r.publishedAt ? r.publishedAt.slice(0, 10) : null),
  venue_th: r.venueTh ?? '',
  venue_en: r.venueEn ?? '',
  register_url: '',
  status: 'published',
}));

