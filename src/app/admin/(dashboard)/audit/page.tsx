
import { AdminText } from "@/components/admin/AdminLanguage";
import Link from "next/link";
import { sql } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { AuditLog } from "@/components/admin/AuditLog";

const PER_PAGE = 40;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [entries, [{ n: total }]] = await Promise.all([
    sql<
      { id: number; actor_email: string; action: string; entity: string; entity_id: string;
        before: unknown; after: unknown; created_at: string }[]
    >`select id, actor_email, action, entity, entity_id, before, after, created_at
      from audit_log order by created_at desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    sql<{ n: number }[]>`select count(*)::int as n from audit_log`,
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <PageHeader title="ประวัติการแก้ไข" description="บันทึกทุกการเพิ่ม แก้ไข และลบข้อมูลในระบบ" />
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center text-sm text-muted"><AdminText>{"ยังไม่มีประวัติการแก้ไข"}</AdminText></div>
      ) : (
        <>
          <AuditLog entries={entries} />
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {page > 1 && <Link href={`/admin/audit?page=${page - 1}`} className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"><AdminText>{"ก่อนหน้า"}</AdminText></Link>}
              <span className="text-muted"><AdminText>{"หน้า"}</AdminText>{page} / {pageCount}</span>
              {page < pageCount && <Link href={`/admin/audit?page=${page + 1}`} className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"><AdminText>{"ถัดไป"}</AdminText></Link>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
