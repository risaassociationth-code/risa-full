import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mmsRecords, sourceBody } from '@/lib/mms-import';
import { getLocale } from '@/lib/request';
import { sanitizeHtml } from '@/lib/utils';
export default async function ImportedPage({params}:PageProps<'/[locale]/mms-hub/[id]'>){
 const {id}=await params;const locale=await getLocale();const record=mmsRecords.find(r=>r.id===id);if(!record || !['1','2'].includes(record.category))notFound();
 return <article className="container-page py-12"><div className="mx-auto max-w-4xl"><Link href={`/${locale}/${record.category==='1'?'news':'activities'}`}>← {locale==='th'?(record.category==='1'?'ข่าวสาร':'กิจกรรม'):(record.category==='1'?'News':'Activities')}</Link><h1 lang="th" className="my-8 text-3xl">{record.title}</h1>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 {record.cover&&<div className="mb-8 aspect-[16/9] overflow-hidden rounded-2xl border border-line"><img src={`${record.cover}?v=4`} alt={record.title} className="size-full object-cover"/></div>}
 <div lang="th" className="prose-risa" dangerouslySetInnerHTML={{__html:sanitizeHtml(sourceBody(record))}}/></div></article>;
}
