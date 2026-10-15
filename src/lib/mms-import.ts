import records from '@/content/imports/mms-hub.json';
import type { Activity, News } from './queries';

export const mmsRecords = records;
export function sourceBody(record: (typeof records)[number]) {
  const gallery = record.images && record.images.length > 0
    ? `<div class="mms-photo-gallery not-prose"><h3 class="mms-photo-gallery-title">ประมวลภาพกิจกรรม / Photo Gallery</h3><div class="mms-photo-grid">${record.images.map(src => `<div class="mms-photo-card"><img src="${src}?v=4" alt="ภาพประกอบกิจกรรม" loading="lazy"></div>`).join('')}</div></div>`
    : '';
  return `${record.body}${gallery}`;
}
export const mmsNews: News[] = records.filter(r=>r.category==='1').map(r=>({
  id:`mms-${r.id}`, slug:`mms-hub-${r.id}`, title_th:r.title,title_en:r.title,
  excerpt_th:r.excerpt,excerpt_en:r.excerpt,
  body_th:sourceBody(r),body_en:sourceBody(r),cover_url:r.cover ? `${r.cover}?v=4` : '',tags:[],
  published_at:r.publishedAt || '',status:'published',
}));

/** Archive events retain their original content; event dates are left blank
 * when only the publication date was recorded. */
export const mmsActivities: Activity[] = records.filter(r => r.category === '2').map(r => ({
  id: `mms-${r.id}`, slug: `mms-hub-${r.id}`,
  title_th: r.title, title_en: r.title,
  excerpt_th: r.excerpt,
  excerpt_en: r.excerpt,
  body_th: sourceBody(r), body_en: sourceBody(r), cover_url: r.cover ? `${r.cover}?v=4` : '',
  start_date: null, end_date: null, venue_th: '', venue_en: '', register_url: '',
  status: 'published',
}));
