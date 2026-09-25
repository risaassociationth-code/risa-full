import Link from "next/link";
import { CollectionListScreen } from "@/components/admin/CollectionTable";
import { getCollection } from "@/components/admin/collection-config";
import { listRows } from "@/components/admin/collection-data";

export default async function Page() {
  const config = getCollection("team");
  const rows = await listRows("team");
  return <>
    <div className="mb-6 rounded-lg border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
      <h2 className="text-base font-medium text-ink">จัดการทีมงาน RISA / Manage RISA personnel</h2>
      <p className="mt-2">เพิ่มบุคลากร → ใส่ชื่อ ตำแหน่ง และรูปภาพ → ตรวจตัวอย่างภาษาไทย/อังกฤษ → บันทึกและเผยแพร่เมื่อพร้อม</p>
      <p className="mt-1">Add a profile → enter names, role and photo → preview Thai/English → save and publish when ready.</p>
      <p className="mt-3">ใช้เฉพาะภาพและข้อมูลติดต่อที่อนุญาตให้เผยแพร่ / Only include photos and contact details approved for public display.</p>
      <div className="mt-4 flex flex-wrap gap-5"><Link href="/th/team" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">ดูหน้าไทย ↗</Link><Link href="/en/team" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">View English page ↗</Link></div>
    </div>
    <CollectionListScreen config={{ ...config, label: "บุคลากร / Personnel", singular: "บุคลากร / Add person" }} rows={rows} />
  </>;
}
