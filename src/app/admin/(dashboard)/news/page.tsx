import { CollectionListScreen } from "@/components/admin/CollectionTable";
import { getCollection } from "@/components/admin/collection-config";
import { listRows } from "@/components/admin/collection-data";
import Link from "next/link";
import { mmsNews } from "@/lib/mms-import";

export default async function Page() {
  const config = getCollection("news");
  const rows = await listRows("news");
  const imported = mmsNews.filter((article) => !rows.some((row) => row.slug === article.slug));
  return <div>
    <CollectionListScreen config={config} rows={rows} description={`${rows.length} ข่าวในตัวแก้ไข · ${imported.length} ข่าวจากคลัง MMS Hub บนเว็บไซต์`} />
    <section className="mt-8 rounded-xl border border-line bg-paper p-5">
      <h2 className="text-lg font-semibold">ข่าวที่นำเข้าจาก MMS Hub ({imported.length})</h2>
      <p className="mt-2 text-sm text-muted">ข่าวเหล่านี้เผยแพร่บนเว็บไซต์แล้ว โดยเก็บเป็นคลังต้นฉบับแยกจากข่าวที่เขียนในตัวแก้ไข</p>
      <ul className="mt-5 divide-y divide-line-soft">
        {imported.map((article) => <li key={article.id} className="py-3">
          <Link href={`/th/news/${article.slug}`} className="text-sm font-medium text-ink hover:text-accent">{article.title_th} ↗</Link>
        </li>)}
      </ul>
      <Link href="/th/mms-hub" className="mt-4 inline-block text-sm text-accent hover:underline">ดูคลัง MMS Hub ทั้งหมด (ข่าว กิจกรรม และเนื้อหาอื่น) ↗</Link>
    </section>
  </div>;
}
