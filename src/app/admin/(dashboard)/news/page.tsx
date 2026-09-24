import { CollectionTable } from "@/components/admin/CollectionTable";
import { getCollection } from "@/components/admin/collection-config";
import { listRows } from "@/components/admin/collection-data";
import Link from "next/link";
import { mmsNews } from "@/lib/mms-import";
import { PageHeader } from "@/components/admin/ui";
import type { Row } from "@/components/admin/collection-config";

export default async function Page() {
  const config = getCollection("news");
  const rows = await listRows("news");
  const managedSlugs = new Set(rows.map((row) => row.slug));
  const imported = mmsNews.filter((article) => !managedSlugs.has(article.slug));
  const allNews: Row[] = [...rows, ...imported.map((article) => ({ ...article } as Row))]
    .sort((a, b) => (Date.parse(String(b.published_at ?? "")) || 0) - (Date.parse(String(a.published_at ?? "")) || 0));
  return <div>
    <Link href="/admin/content" className="mb-4 inline-block text-sm text-accent">ดูข่าวและกิจกรรมในที่เดียว →</Link>
    <PageHeader title="ข่าวสาร" description={`${allNews.length} ข่าวบนหน้าจัดการ · ${rows.length} ข่าวในตัวแก้ไข · ${imported.length} ข่าวจาก MMS Hub`} />
    <p className="mb-4 text-sm text-muted">คลิกหัวข้อหรือ “แก้ไข” แล้วทำตามขั้นตอน เนื้อหา → รูปภาพ → ดูตัวอย่าง → เผยแพร่ ข่าวจาก MMS Hub จะคงเครดิตต้นฉบับไว้</p>
    <CollectionTable config={{ ...config, hasSort: false }} rows={allNews} />
    <Link href="/th/mms-hub" className="mt-5 inline-block text-sm text-accent hover:underline">ดูคลัง MMS Hub ทั้งหมด (กิจกรรมและเนื้อหาอื่น) ↗</Link>
  </div>;
}
