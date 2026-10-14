import { getLocale } from '@/lib/request';
import { MmsArchiveCards } from '@/components/site/MmsArchiveCards';
export const metadata={title:'Archive · RISA'};
export default async function Archive(){const locale=await getLocale();return <main className="container-page py-12"><h1 className="text-4xl">MMS Hub</h1><p className="mt-4">{locale==='th'?'คลังเนื้อหาจากเว็บไซต์ MMS Hub — นำเข้าเมื่อ 15 กันยายน 2026':'MMS Hub website archive — imported 15 September 2026'}</p>{[['about'],['1'],['2'],['5'],['7'],['3','4']].map(categories=><MmsArchiveCards key={categories.join()} locale={locale} categories={categories}/>)}</main>;}
