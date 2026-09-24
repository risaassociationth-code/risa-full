import Link from "next/link";
import { listRows } from "@/components/admin/collection-data";
import { ContentDesk, type DeskItem } from "@/components/admin/ContentDesk";
import { PageHeader } from "@/components/admin/ui";
import { mmsActivities, mmsNews } from "@/lib/mms-import";

export default async function Page() {
  const [news, activities] = await Promise.all([listRows("news"), listRows("activities")]);
  const items: DeskItem[] = [];
  for (const [kind, managed, archive] of [["news", news, mmsNews], ["activities", activities, mmsActivities]] as const) {
    const slugs = new Set(managed.map(row => row.slug));
    for (const row of [...managed, ...archive.filter(row => !slugs.has(row.slug))]) {
      items.push({ id: String(row.id), kind, title: String(row.title_th ?? ""), titleEn: String(row.title_en ?? ""), slug: String(row.slug ?? ""), status: String(row.status ?? "draft"), imported: String(row.id).startsWith("mms-"), partner: /^mms-hub-\d+$/.test(String(row.slug)), cover: String(row.cover_url ?? "") });
    }
  }
  return <div>
    <Link href="/admin" className="mb-4 inline-block text-sm text-accent">← กลับโต๊ะทำงาน</Link>
    <PageHeader title="ข่าวและกิจกรรมทั้งหมด" description="ค้นหาเรื่องเดิม เปิดแก้ไข หรือดูรายการที่เผยแพร่อยู่บนเว็บไซต์" />
    <p className="mb-5 text-sm text-muted">เนื้อหาจากคลัง MMS Hub คงเครดิตต้นฉบับไว้ กิจกรรมที่เปิดแก้ไขครั้งแรกจะเริ่มเป็นฉบับร่างเพื่อให้ตรวจข้อมูลก่อนเผยแพร่</p>
    <ContentDesk items={items} />
  </div>;
}
