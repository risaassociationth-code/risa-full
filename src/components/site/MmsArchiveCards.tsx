import Link from 'next/link';
import { mmsRecords } from '@/lib/mms-import';

export function MmsArchiveCards({locale, categories, excludedIds = []}: {locale:string;categories:string[];excludedIds?:string[]}) {
 return <section className="my-10">
  <h2 className="mb-3 text-2xl">MMS Hub · {locale==='th'?'เนื้อหาจากเครือข่าย':'Partner archive'}</h2>
  <p className="mb-6 text-sm text-muted">{locale==='th'?'บทความและภาพจาก MMS Hub โดยคงบทบาทและเครดิตของต้นฉบับ':'Source-language content and photographs from MMS Hub, with original roles and credits retained.'}</p>
  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{mmsRecords.filter(r=>categories.includes(r.category) && !excludedIds.includes(r.id)).map(r=><Link key={r.id} href={`/${locale}/mms-hub/${r.id}`} className="block border-b border-line pb-6">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   {r.cover&&<img src={r.cover} alt={r.title} loading="lazy" className="mb-4 h-52 w-full object-contain"/>}
   <h3 className="text-lg">{r.title}</h3><span className="mt-3 block text-sm text-muted">{locale==='th'?'อ่านต้นฉบับที่นำเข้า':'Read imported source'} ↗</span>
  </Link>)}</div>
 </section>;
}
