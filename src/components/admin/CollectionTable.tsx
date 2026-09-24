"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Copy, Loader2, Plus, Search, Trash2,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import {
  deleteRow, describeRow, duplicateRow, reorderRow, setStatus,
} from "@/actions/collections";
import type { CollectionConfig, Row } from "./collection-config";
import { STATUS_LABEL, searchableColumns } from "./collection-config";
import { Card, EmptyState, Mono, PageHeader, StatusBadge, formatThaiDate } from "./ui";
import { Icon } from "@/components/site/Icon";
import { ConfirmDialog } from "./ConfirmDialog";
import { ManageImportedNewsButton } from "./ManageImportedNewsButton";

type Props = {
  config: CollectionConfig;
  rows: Row[];
  /** For scoped collections (list_items, gallery_photos) editing one group. */
  scopeValue?: string;
  /** Where "เพิ่ม…" and row links point; defaults to `${config.adminPath}/{id}`. */
  hrefFor?: (id: string) => string;
  newHref?: string;
  hideNew?: boolean;
};

function cellText(row: Row, name: string, bilingual: boolean): string {
  if (bilingual) {
    const th = row[`${name}_th`];
    const en = row[`${name}_en`];
    return String((typeof th === "string" && th) || (typeof en === "string" && en) || "");
  }
  const v = row[name];
  return v === null || v === undefined ? "" : String(v);
}

export function CollectionTable({ config, rows: initialRows, scopeValue, hrefFor, newHref, hideNew }: Props) {
  const [rows, setRows] = useState(initialRows);

  // Resync when the server sends fresh rows (e.g. after router.refresh()
  // following a duplicate) — useState's initializer only runs on mount, so
  // without this, a same-instance prop update would otherwise be dropped.
  // Adjusting during render (rather than in an effect) avoids an extra pass.
  const [priorRows, setPriorRows] = useState(initialRows);
  if (initialRows !== priorRows) {
    setPriorRows(initialRows);
    setRows(initialRows);
  }
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);
  const router = useRouter();

  const search = searchableColumns(config);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((r) =>
        search.some((col) => String(r[col] ?? "").toLowerCase().includes(needle)),
      );
    }
    return list;
  }, [rows, q, statusFilter, search]);

  function linkFor(id: string) {
    return hrefFor ? hrefFor(id) : `${config.adminPath}/${id}`;
  }

  function refresh() {
    router.refresh();
  }

  async function onMove(id: string, direction: "up" | "down") {
    setBusyId(id);
    const res = await reorderRow(config.key, id, direction, scopeValue ?? null);
    setBusyId(null);
    if (!res.ok) return toast.error(res.error);
    // Optimistic local swap so the row doesn't jump before the refresh lands.
    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    refresh();
  }

  async function onToggleStatus(row: Row) {
    const id = String(row.id);
    const next = row.status === "published" ? "draft" : "published";
    setBusyId(id);
    const res = await setStatus(config.key, id, next);
    setBusyId(null);
    if (!res.ok) return toast.error(res.error);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    toast.success(next === "published" ? "เผยแพร่แล้ว" : "เปลี่ยนเป็นฉบับร่างแล้ว");
    refresh();
  }

  async function onDuplicate(id: string) {
    setBusyId(id);
    const res = await duplicateRow(config.key, id);
    setBusyId(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("ทำสำเนาแล้ว");
    refresh();
  }

  async function askDelete(id: string) {
    const res = await describeRow(config.key, id);
    setConfirm({ id, title: res.ok ? res.data.title : "รายการนี้" });
  }

  function onConfirmDelete() {
    if (!confirm) return;
    const { id } = confirm;
    startTransition(async () => {
      const res = await deleteRow(config.key, id);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("ลบแล้ว");
        refresh();
      }
      setConfirm(null);
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา…"
            className="h-9 w-56 rounded-lg border border-line bg-paper pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        {config.hasStatus && (
          <div className="flex items-center rounded-lg border border-line p-0.5">
            {(["all", "published", "draft"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === s ? "bg-ink text-white" : "text-muted hover:bg-surface",
                )}
              >
                {s === "all" ? "ทั้งหมด" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        {!hideNew && (
          <Link
            href={newHref ?? `${config.adminPath}/new`}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:brightness-110"
          >
            <Plus className="size-4" />
            เพิ่ม{config.singular}
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? `ยังไม่มี${config.singular}` : "ไม่พบรายการที่ค้นหา"}
            hint={rows.length === 0 ? `เริ่มต้นด้วยการเพิ่ม${config.singular}รายการแรก` : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-line-soft text-left text-xs font-semibold uppercase tracking-wide text-faint">
                  {config.hasSort && <th className="w-16 px-4 py-2.5">ลำดับ</th>}
                  {config.columns.map((col) => (
                    <th key={col.name} className={cn("px-4 py-2.5", col.className)}>
                      {col.label}
                    </th>
                  ))}
                  {config.hasStatus && <th className="px-4 py-2.5">สถานะ</th>}
                  <th className="px-4 py-2.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const id = String(row.id);
                  const imported = config.key === "news" && id.startsWith("mms-");
                  const busy = busyId === id;
                  return (
                    <tr key={id} className="border-b border-line-soft last:border-0 hover:bg-surface/60">
                      {config.hasSort && (
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={busy || i === 0}
                              onClick={() => onMove(id, "up")}
                              aria-label="เลื่อนขึ้น"
                              className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-30"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || i === filtered.length - 1}
                              onClick={() => onMove(id, "down")}
                              aria-label="เลื่อนลง"
                              className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-30"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                      {config.columns.map((col) => (
                        <td key={col.name} className={cn("max-w-56 px-4 py-2.5 align-top", col.className)}>
                          {col.kind === "image" ? (
                            row[col.name] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={String(row[col.name])}
                                alt=""
                                className="size-10 rounded-md border border-line object-cover"
                              />
                            ) : (
                              <span className="flex size-10 items-center justify-center rounded-md border border-dashed border-line text-faint">
                                —
                              </span>
                            )
                          ) : col.kind === "code" ? (
                            row[col.name] ? (
                              col.name === "icon" ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon name={String(row[col.name])} className="size-4 text-muted" />
                                  <Mono>{String(row[col.name])}</Mono>
                                </span>
                              ) : (
                                <Mono className="block max-w-56 truncate">{String(row[col.name])}</Mono>
                              )
                            ) : (
                              <span className="text-faint">—</span>
                            )
                          ) : col.kind === "date" ? (
                            formatThaiDate(row[col.name] as string | null)
                          ) : col.kind === "number" ? (
                            row[col.name] === "size_bytes" ? formatBytes(row[col.name] as number)
                            : String(row[col.name] ?? "—")
                          ) : col.kind === "tags" ? (
                            <div className="flex flex-wrap gap-1">
                              {(row[col.name] as string[] | null)?.length ? (
                                (row[col.name] as string[]).map((tag) => (
                                  <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2">
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-faint">—</span>
                              )}
                            </div>
                          ) : imported ? (
                            <ManageImportedNewsButton slug={String(row.slug)} label={cellText(row, col.name, !!col.bilingual) || "(ไม่มีชื่อ)"} />
                          ) : (
                            <Link href={linkFor(id)} className="line-clamp-2 font-medium text-ink hover:text-accent">
                              {cellText(row, col.name, !!col.bilingual) || <span className="text-faint">(ไม่มีชื่อ)</span>}
                            </Link>
                          )}
                        </td>
                      ))}
                      {config.hasStatus && (
                        <td className="px-4 py-2.5">
                          {imported ? <StatusBadge status="published" /> : <button
                            type="button"
                            disabled={busy}
                            onClick={() => onToggleStatus(row)}
                            className="disabled:opacity-50"
                            title="คลิกเพื่อสลับสถานะ"
                          >
                            <StatusBadge status={row.status as string} />
                          </button>}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {busy && <Loader2 className="size-3.5 animate-spin text-faint" />}
                          {imported ? <Link href={`/th/news/${String(row.slug)}`} className="text-xs text-accent hover:underline">ดูหน้าเว็บ ↗</Link> : <button
                            type="button"
                            onClick={() => onDuplicate(id)}
                            disabled={busy}
                            title="ทำสำเนา"
                            aria-label="ทำสำเนา"
                            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                          >
                            <Copy className="size-3.5" />
                          </button>}
                          {!imported && !(config.key === "news" && /^mms-hub-\d+$/.test(String(row.slug ?? ""))) && <button
                            type="button"
                            onClick={() => askDelete(id)}
                            disabled={busy}
                            title="ลบ"
                            aria-label="ลบ"
                            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="size-3.5" />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={`ลบ${config.singular}นี้?`}
        description={confirm ? `"${confirm.title}" จะถูกลบอย่างถาวรและกู้คืนไม่ได้` : ""}
        confirmLabel="ลบ"
        destructive
        pending={pending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}

export function CollectionListScreen({
  config, rows, scopeValue, hrefFor, newHref, hideNew, description,
}: Props & { description?: string }) {
  return (
    <div>
      <PageHeader title={config.label} description={description} />
      <CollectionTable
        config={config}
        rows={rows}
        scopeValue={scopeValue}
        hrefFor={hrefFor}
        newHref={newHref}
        hideNew={hideNew}
      />
    </div>
  );
}
