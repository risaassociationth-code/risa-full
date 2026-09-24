import { CollectionTable } from "@/components/admin/CollectionTable";
import { getCollection } from "@/components/admin/collection-config";
import { listRows } from "@/components/admin/collection-data";
import Link from "next/link";
import { mmsNews } from "@/lib/mms-import";
import { PageHeader } from "@/components/admin/ui";
import { ManageImportedNewsButton } from "@/components/admin/ManageImportedNewsButton";

export default async function Page() {
  const config = getCollection("news");
  const rows = await listRows("news");
  const imported = mmsNews.filter((article) => !rows.some((row) => row.slug === article.slug));
  return <div>
    <PageHeader title="ข่าวสาร" description="ข่าวที่เขียนใน RISA และข่าวจากคลัง MMS Hub" />
    {rows.length ? <section><h2 className="mb-4 text-lg font-semibold">ข่าวที่จัดการใน RISA ({rows.length})</h2><CollectionTable config={config} rows={rows} /></section> :
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="text-lg font-semibold">ข่าวที่จัดการใน RISA (0)</h2>
        <p className="mt-2 text-sm text-muted">ยังไม่มีข่าวที่สร้างผ่านตัวแก้ไข ข่าวจาก MMS Hub แสดงอยู่ด้านล่าง</p>
        <Link href="/admin/news/new" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink">เขียนข่าวใหม่</Link>
      </section>}
    <section className="mt-8 rounded-xl border border-line bg-paper p-5">
      <h2 className="text-lg font-semibold">ข่าวจาก MMS Hub ({imported.length})</h2>
      <p className="mt-2 text-sm text-muted">คลิก “นำเข้าเพื่อแก้ไข” เพื่อเปิดข่าวในตัวแก้ไข RISA จากนั้นใช้สถานะ “เผยแพร่” หรือ “ฉบับร่าง” เพื่อแสดงหรือซ่อนจากหน้าข่าว</p>
      <ul className="mt-5 divide-y divide-line-soft">
        {imported.map((article) => <li key={article.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href={`/th/news/${article.slug}`} className="text-sm font-medium text-ink hover:text-accent">{article.title_th} ↗</Link>
          <ManageImportedNewsButton slug={article.slug} />
        </li>)}
      </ul>
      <Link href="/th/mms-hub" className="mt-4 inline-block text-sm text-accent hover:underline">ดูคลัง MMS Hub ทั้งหมด (ข่าว กิจกรรม และเนื้อหาอื่น) ↗</Link>
    </section>
  </div>;
}
