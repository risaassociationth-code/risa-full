import records from '@/content/imports/mms-hub.json';
import type { Activity, News } from './queries';

export const mmsRecords = records;
export function sourceBody(record: (typeof records)[number]) {
  return `<p><strong>MMS Hub — เนื้อหาจากเครือข่าย / Partner content</strong><br>เผยแพร่ตามต้นฉบับ ไม่ใช่ประกาศหรือผลงานของ RISA โดยอัตโนมัติ / Reproduced from MMS Hub; original organizational roles are retained. <a href="${record.url}" target="_blank" rel="noreferrer">ต้นฉบับ / Original source</a></p>${record.body}${record.images.map(src => `<p><img src="${src}" alt="ภาพประกอบจาก MMS Hub" loading="lazy"></p>`).join('')}`;
}
export const mmsNews: News[] = records.filter(r=>r.category==='1').map(r=>({
  id:`mms-${r.id}`, slug:`mms-hub-${r.id}`, title_th:r.title,title_en:r.title,
  excerpt_th:`จาก MMS Hub · ${r.excerpt}`,excerpt_en:`MMS Hub · Original-language source: ${r.excerpt}`,
  body_th:sourceBody(r),body_en:sourceBody(r),cover_url:r.cover,tags:['MMS Hub'],
  published_at:r.publishedAt || '',status:'published',
}));

/** Archive events are partner content, not RISA-hosted events. Event dates are
 * intentionally blank: the source publication date is not the event date. */
export const mmsActivities: Activity[] = records.filter(r => r.category === '2').map(r => ({
  id: `mms-${r.id}`, slug: `mms-hub-${r.id}`,
  title_th: r.title, title_en: r.title,
  excerpt_th: `จาก MMS Hub · ${r.excerpt}`,
  excerpt_en: `MMS Hub · Original-language source: ${r.excerpt}`,
  body_th: sourceBody(r), body_en: sourceBody(r), cover_url: r.cover,
  start_date: null, end_date: null, venue_th: '', venue_en: '', register_url: '',
  status: 'published',
}));
