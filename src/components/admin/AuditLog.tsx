"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mono, formatThaiDateTime } from "./ui";

type Entry = {
  id: number; actor_email: string; action: string; entity: string; entity_id: string;
  before: unknown; after: unknown; created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  create: "เพิ่ม", update: "แก้ไข", delete: "ลบ", duplicate: "ทำสำเนา",
  reorder: "จัดลำดับ", status: "เปลี่ยนสถานะ",
};

const ACTION_TONE: Record<string, string> = {
  create: "bg-green-50 text-green-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-700",
  duplicate: "bg-surface-2 text-ink-2",
  reorder: "bg-surface-2 text-ink-2",
  status: "bg-amber-50 text-amber-700",
};

export function AuditLog({ entries }: { entries: Entry[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="divide-y divide-line-soft">
        {entries.map((e) => (
          <div key={e.id}>
            <button
              type="button"
              onClick={() => setOpenId((id) => (id === e.id ? null : e.id))}
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface/60"
            >
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", ACTION_TONE[e.action] ?? "bg-surface-2 text-ink-2")}>
                {ACTION_LABEL[e.action] ?? e.action}
              </span>
              <span className="text-sm font-medium">{e.entity}</span>
              <Mono className="hidden sm:inline">{e.entity_id.slice(0, 8)}</Mono>
              <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{e.actor_email}</span>
              <span className="shrink-0 text-xs text-faint">{formatThaiDateTime(e.created_at)}</span>
              <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", openId === e.id && "rotate-180")} />
            </button>
            {openId === e.id && (
              <div className="grid gap-4 border-t border-line-soft bg-surface/50 px-5 py-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint"><AdminText>{"ก่อนแก้ไข"}</AdminText></p>
                  <pre className="max-h-56 overflow-auto rounded-lg bg-paper p-3 text-[11px] leading-relaxed text-ink-2">
                    {JSON.stringify(e.before, null, 2) ?? "—"}
                  </pre>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint"><AdminText>{"หลังแก้ไข"}</AdminText></p>
                  <pre className="max-h-56 overflow-auto rounded-lg bg-paper p-3 text-[11px] leading-relaxed text-ink-2">
                    {JSON.stringify(e.after, null, 2) ?? "—"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
