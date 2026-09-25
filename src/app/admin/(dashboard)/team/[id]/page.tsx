import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { getCollection } from "@/components/admin/collection-config";
import { getRow } from "@/components/admin/collection-data";
import { PageHeader } from "@/components/admin/ui";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = getCollection("team");
  const labels: Record<string, string> = { name: "ชื่อ-นามสกุล / Full name", position: "ตำแหน่ง / Role", department: "ฝ่าย / Department", photo_url: "รูปถ่าย / Portrait", photo_position: "ตำแหน่งภาพ / Photo alignment", email: "อีเมลสาธารณะ / Public email", phone: "เบอร์ติดต่อสาธารณะ / Public phone", bio: "แนะนำตัว / Short biography", status: "การแสดงผล / Visibility" };
  const editorConfig = { ...config, fields: config.fields.map(field => ({ ...field, label: labels[field.name] ?? field.label, ...(field.name === "status" ? { options: [{value: "draft", label: "ฉบับร่าง — ยังไม่แสดง / Draft — hidden"}, {value: "published", label: "เผยแพร่ — ทุกคนเห็น / Published — public"}] } : {}) })) };
  const initial = id === "new" ? null : await getRow("team", id);
  if (id !== "new" && !initial) notFound();
  return <div>
    <PageHeader title={id === "new" ? "เพิ่มบุคลากร / Add personnel" : "แก้ไขบุคลากร / Edit personnel"} description="กรอกข้อมูลไทยและอังกฤษ แล้วตรวจตัวอย่างก่อนบันทึก / Add Thai and English details, then check the preview before saving. Contact details become public when published." />
    <CollectionForm key={id} config={editorConfig} initial={initial} backHref={config.adminPath} />
  </div>;
}
