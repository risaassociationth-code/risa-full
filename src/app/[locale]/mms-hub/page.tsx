import { getLocale } from '@/lib/request';
import { MmsArchiveCards } from '@/components/site/MmsArchiveCards';
export const metadata={title:'Archive · RISA'};
export default async function Archive(){const locale=await getLocale();return <main className="container-page py-12"><h1 className="text-4xl">{locale==='th'?'คลังเนื้อหา RISA':'RISA Content Archive'}</h1><p className="mt-4">{locale==='th'?'คลังข่าวสารและกิจกรรมที่บันทึกไว้ในระบบ':'Archived news and activity records'}</p>{[['1'],['2'],['5']].map(categories=><MmsArchiveCards key={categories.join()} locale={locale} categories={categories}/>)}</main>;}
