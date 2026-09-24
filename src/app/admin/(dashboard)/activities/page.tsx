import { CollectionTable } from "@/components/admin/CollectionTable";
import { getCollection } from "@/components/admin/collection-config";
import { listRows } from "@/components/admin/collection-data";
import { mmsActivities } from "@/lib/mms-import";
import { PageHeader } from "@/components/admin/ui";
import type { Row } from "@/components/admin/collection-config";
import Link from "next/link";

export default async function Page() {
  const config = getCollection("activities");
  const rows = await listRows("activities");
  const managedSlugs = new Set(rows.map((row) => row.slug));
  const imported = mmsActivities.filter((activity) => !managedSlugs.has(activity.slug));
  const all: Row[] = [...rows, ...imported.map((activity) => ({ ...activity } as Row))];
  return <div>
    <PageHeader title="กิจกรรม" description={`${all.length} รายการ · ${rows.length} รายการในตัวแก้ไข · ${imported.length} รายการจาก MMS Hub`} />
    <p className="mb-4 text-sm text-muted">คลิกชื่อกิจกรรมจาก MMS Hub เพื่อนำเข้าและแก้ไข วันที่เผยแพร่ต้นฉบับไม่ใช่วันจัดกิจกรรม โปรดเพิ่มวันจัดจริงก่อนเผยแพร่</p>
    <CollectionTable config={{ ...config, hasSort: false }} rows={all} />
    <Link href="/th/mms-hub" className="mt-5 inline-block text-sm text-accent hover:underline">ดูคลัง MMS Hub ทั้งหมด ↗</Link>
  </div>;
}
