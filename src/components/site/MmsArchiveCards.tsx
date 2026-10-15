import Link from 'next/link';
import { mmsRecords } from '@/lib/mms-import';

export function MmsArchiveCards({locale, categories, excludedIds = []}: {locale:string;categories:string[];excludedIds?:string[]}) {
 return <section className="my-10">
  <h2 className="mb-3 text-2xl">{locale==='th'?'คลังเนื้อหา':'Archive'}</h2>
  <p className="mb-6 text-sm text-muted">{locale==='th'?'บทความและภาพที่บันทึกไว้ในระบบ':'Archived articles and photographs recorded in the system.'}</p>
  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{mmsRecords.filter(r=>categories.includes(r.category) && !excludedIds.includes(r.id)).map(r=><Link key={r.id} href={`/${locale}/mms-hub/${r.id}`} className="risa-archive-card block border-b border-line pb-6">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   {r.cover&&<img src={`${r.cover}?v=4`} alt={r.title} loading="lazy" className="mb-4 aspect-[16/9] w-full rounded-xl object-cover"/>}
   <h3 lang="th" className="text-lg">{r.title}</h3><span className="mt-3 block text-sm text-muted">{locale==='th'?'อ่านรายละเอียด':'Read more'} ↗</span>
  </Link>)}</div>
 </section>;
}
