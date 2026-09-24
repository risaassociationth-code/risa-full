import Link from "next/link";
import { ArrowUpRight, CalendarPlus, FilePenLine, ImagePlus, Plus } from "lucide-react";
import { sql } from "@/lib/db";
import { PageHeader, Card, CardHead, EmptyState, formatThaiDateTime } from "@/components/admin/ui";
import { mmsActivities, mmsNews } from "@/lib/mms-import";

const COUNTS = [
  { table: "news", label: "ข่าวสาร", href: "/admin/news" },
  { table: "activities", label: "กิจกรรม", href: "/admin/activities" },
  { table: "committee_members", label: "กรรมการ", href: "/admin/committee" },
  { table: "documents", label: "เอกสาร", href: "/admin/documents" },
] as const;

const ACTION_LABEL: Record<string, string> = {
  create: "เพิ่ม", update: "แก้ไข", delete: "ลบ", duplicate: "ทำสำเนา",
  reorder: "จัดลำดับ", status: "เปลี่ยนสถานะ",
};

export default async function DashboardPage() {
  const [counts, newSubmissions, submissionTotal, recentAudit] = await Promise.all([
    Promise.all(
      COUNTS.map(async (c) => {
        if (c.table === "news" || c.table === "activities") {
          const rows = await sql<{ slug: string; status: string }[]>`select slug, status from ${sql(c.table)}`;
          const slugs = new Set(rows.map((row) => row.slug));
          const archive = c.table === "news" ? mmsNews : mmsActivities;
          return { ...c, n: rows.length, drafts: rows.filter((row) => row.status === "draft").length, imported: archive.filter((article) => !slugs.has(article.slug)).length };
        }
        const [row] = await sql<{ n: number }[]>`select count(*)::int as n from ${sql(c.table)}`;
        return { ...c, n: row?.n ?? 0, drafts: 0, imported: 0 };
      }),
    ),
    sql<{ id: string; kind: string; name: string; subject: string; created_at: string }[]>`
      select id, kind, name, subject, created_at from submissions
      where status = 'new' order by created_at desc limit 5`,
    sql<{ n: number }[]>`select count(*)::int as n from submissions where status = 'new'`,
    sql<{ id: number; actor_email: string; action: string; entity: string; entity_id: string; created_at: string }[]>`
      select id, actor_email, action, entity, entity_id, created_at
      from audit_log order by created_at desc limit 8`,
  ]);

  return (
    <div>
      <p className="admin-kicker mb-4">RISA / CONTENT STUDIO</p>
      <PageHeader title="โต๊ะทำงานเว็บไซต์" description="วันนี้อยากอัปเดตอะไร? เลือกงานด้านล่าง หรือเปิดรายการเดิมเพื่อแก้ไข" />

      <div className="mb-10 grid gap-4 xl:grid-cols-3">
        <Link href="/admin/news/new" className="admin-quick-link">
          <Plus className="size-6" /><div><h2 className="text-base font-medium">เขียนข่าวใหม่</h2><p>เพิ่มหัวข้อ เนื้อหา และภาพประกอบ</p></div><ArrowUpRight className="size-4" />
        </Link>
        <Link href="/admin/activities/new" className="admin-quick-link">
          <CalendarPlus className="size-6" /><div><h2 className="text-base font-medium">เพิ่มกิจกรรม</h2><p>ใส่รายละเอียด วันจัด และรูปภาพ</p></div><ArrowUpRight className="size-4" />
        </Link>
        <Link href="/admin/pages" className="admin-quick-link">
          <FilePenLine className="size-6" /><div><h2 className="text-base font-medium">แก้ไขหน้าเว็บไซต์</h2><p>ปรับข้อความและรูปภาพในแต่ละหน้า</p></div><ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5">
        <div className="mr-auto"><h2 className="font-semibold">หาเรื่องที่เคยลงไว้</h2><p className="mt-1 text-sm text-muted">ค้นหาข่าว กิจกรรม ฉบับร่าง และเนื้อหาจาก MMS Hub ในที่เดียว</p><p className="mt-1 text-sm text-muted">มี {counts.reduce((n, c) => n + c.drafts, 0)} ฉบับร่างให้กลับมาเขียนต่อ</p></div>
        <Link href="/admin/content" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">เปิดข่าวและกิจกรรมทั้งหมด →</Link>
        <Link href="/admin/media" className="inline-flex items-center gap-1 text-sm text-accent underline"><ImagePlus className="size-4" /> คลังรูปภาพ</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {counts.map((c) => (
          <Link
            key={c.table}
            href={c.href}
            className="admin-metric"
          >
            <strong>{(c.n + c.imported).toLocaleString("th-TH")}</strong>
            <p className="mt-1 text-sm text-muted">{c.label}</p>
            {(c.table === "news" || c.table === "activities") && <p className="mt-1 text-xs text-muted">{c.drafts} ฉบับร่าง · {c.imported} จากคลัง MMS Hub</p>}
          </Link>
        ))}
        <Link
          href="/admin/submissions"
          className="admin-metric"
        >
          <strong className="text-accent">{submissionTotal[0]?.n ?? 0}</strong>
          <p className="mt-1 text-sm text-muted">ข้อความใหม่</p>
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHead
            title="ข้อความใหม่"
            actions={
              <Link href="/admin/submissions" className="text-xs font-medium text-accent hover:underline">
                ดูทั้งหมด
              </Link>
            }
          />
          {newSubmissions.length === 0 ? (
            <EmptyState title="ยังไม่มีข้อความใหม่" className="border-0" />
          ) : (
            <ul className="divide-y divide-line-soft">
              {newSubmissions.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{s.name || "(ไม่ระบุชื่อ)"}</p>
                    <span className="shrink-0 text-xs text-faint">{formatThaiDateTime(s.created_at)}</span>
                  </div>
                  <p className="truncate text-[13px] text-muted">{s.subject || s.kind}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHead title="ประวัติการแก้ไขล่าสุด" actions={
            <Link href="/admin/audit" className="text-xs font-medium text-accent hover:underline">
              ดูทั้งหมด
            </Link>
          } />
          {recentAudit.length === 0 ? (
            <EmptyState title="ยังไม่มีการแก้ไข" className="border-0" />
          ) : (
            <ul className="divide-y divide-line-soft">
              {recentAudit.map((a) => (
                <li key={a.id} className="px-5 py-3 text-[13px]">
                  <span className="font-medium">{a.actor_email}</span>{" "}
                  <span className="text-muted">
                    {ACTION_LABEL[a.action] ?? a.action} {a.entity}
                  </span>
                  <span className="float-right text-xs text-faint">{formatThaiDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
