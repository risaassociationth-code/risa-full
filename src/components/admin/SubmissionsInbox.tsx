"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { updateSubmission } from "@/actions/admin";
import { cn } from "@/lib/utils";
import { formatThaiDateTime, EmptyState } from "./ui";

type Submission = {
  id: string; kind: "contact" | "membership" | "job";
  name: string; email: string; subject: string;
  payload: Record<string, unknown>; status: "new" | "read" | "archived";
  notes: string; created_at: string;
};

const KIND_LABEL: Record<Submission["kind"], string> = {
  contact: "ติดต่อทั่วไป", membership: "สมัครสมาชิก", job: "สมัครงาน",
};
const STATUS_LABEL: Record<Submission["status"], string> = {
  new: "ใหม่", read: "อ่านแล้ว", archived: "เก็บเข้าคลัง",
};

export function SubmissionsInbox({ items }: { items: Submission[] }) {
  const [rows, setRows] = useState(items);
  const [tab, setTab] = useState<"all" | Submission["kind"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (tab === "all" ? rows : rows.filter((r) => r.kind === tab)),
    [rows, tab],
  );

  function patch(id: string, next: Partial<Submission>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-line p-0.5">
          {(["all", "contact", "membership", "job"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === k ? "bg-ink text-white" : "text-muted hover:bg-surface",
              )}
            >
              {k === "all" ? "ทั้งหมด" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <a
          href={`/admin/submissions/export${tab !== "all" ? `?kind=${tab}` : ""}`}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink-2 hover:bg-surface"
        >
          <Download className="size-3.5" /><AdminText>{"ส่งออก CSV"}</AdminText></a>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="ไม่มีข้อความในหมวดนี้" />
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <SubmissionRow
              key={row.id}
              row={row}
              open={openId === row.id}
              onToggle={() => setOpenId((id) => (id === row.id ? null : row.id))}
              onPatch={(next) => patch(row.id, next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  row, open, onToggle, onPatch,
}: { row: Submission; open: boolean; onToggle: () => void; onPatch: (n: Partial<Submission>) => void }) {
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(row.notes);

  function setStatus(status: Submission["status"]) {
    onPatch({ status });
    start(async () => {
      const res = await updateSubmission(row.id, { status });
      if (!res.ok) toast.error(res.error);
    });
  }

  function saveNotes() {
    if (notes === row.notes) return;
    start(async () => {
      const res = await updateSubmission(row.id, { notes });
      if (!res.ok) { toast.error(res.error); return; }
      onPatch({ notes });
      toast.success("บันทึกหมายเหตุแล้ว");
    });
  }

  return (
    <div className={cn("rounded-xl border bg-paper", row.status === "new" ? "border-accent/40" : "border-line")}>
      <button
        type="button"
        onClick={() => {
          onToggle();
          if (row.status === "new") setStatus("read");
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {row.status === "new" && <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{row.name || "(ไม่ระบุชื่อ)"}</p>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
              {KIND_LABEL[row.kind]}
            </span>
          </div>
          <p className="truncate text-[13px] text-muted">{row.subject || row.email}</p>
        </div>
        <span className="shrink-0 text-xs text-faint">{formatThaiDateTime(row.created_at)}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-line-soft px-4 py-4">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Item label="ชื่อ" value={row.name} />
            <Item label="อีเมล" value={row.email} />
            {Object.entries(row.payload).map(([k, v]) => (
              <Item key={k} label={k} value={String(v ?? "")} />
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["new", "read", "archived"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  row.status === s ? "bg-ink text-white" : "bg-surface-2 text-muted hover:bg-surface",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
            {pending && <Loader2 className="size-3.5 animate-spin text-faint" />}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-ink-2"><AdminText>{"หมายเหตุภายใน"}</AdminText></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={2}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:bg-paper"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-faint">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
