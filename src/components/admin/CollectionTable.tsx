"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { matchesContentFilters } from "@/lib/content-status";
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
import { useAdminLanguage } from "./AdminLanguage";

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
  const { locale } = useAdminLanguage();
  const th = locale === "th";
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
  const guided = config.key === "news" || config.key === "activities";
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);
  const [visibilityChange, setVisibilityChange] = useState<Row | null>(null);
  const router = useRouter();

  const search = searchableColumns(config);

  const filtered = useMemo(() => {
    let list = rows;
    list = list.filter((r) => matchesContentFilters(r, statusFilter));
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

  async function onToggleStatus(row: Row, confirmed = false) {
    if (config.key === "team" && !confirmed) {
      setVisibilityChange(row);
      return;
    }
    const id = String(row.id);
    const next = row.status === "published" ? "draft" : "published";
    setBusyId(id);
    const res = await setStatus(config.key, id, next);
    setBusyId(null);
    if (!res.ok) return toast.error(res.error);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    setVisibilityChange(null);
    toast.success(next === "published" ? (th ? "เผยแพร่แล้ว" : "Published") : (th ? "เปลี่ยนเป็นฉบับร่างแล้ว" : "Changed to draft"));
    refresh();
  }

  async function onDuplicate(id: string) {
    setBusyId(id);
    const res = await duplicateRow(config.key, id);
    setBusyId(null);
    if (!res.ok) return toast.error(res.error);
    toast.success(th ? "ทำสำเนาแล้ว" : "Duplicated");
    refresh();
  }

  async function askDelete(id: string) {
    const res = await describeRow(config.key, id);
    setConfirm({ id, title: res.ok ? res.data.title : (th ? "รายการนี้" : "this record") });
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
        toast.success(th ? "ลบแล้ว" : "Deleted");
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
            placeholder={th ? "ค้นหา…" : "Search..."}
            aria-label={th ? `ค้นหา${config.label}` : `Search ${config.label}`}
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
                {s === "all" ? (th ? "ทั้งหมด" : "All") : (th ? STATUS_LABEL[s] : s === "published" ? "Published" : "Draft")}
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
            {th ? `เพิ่ม${config.singular}` : `Add ${config.singular}`}
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? (th ? `ยังไม่มี${config.singular}` : `No ${config.singular} yet`) : (th ? "ไม่พบรายการที่ค้นหา" : "No records found")}
            hint={rows.length === 0 ? (th ? `เริ่มต้นด้วยการเพิ่ม${config.singular}รายการแรก` : `Get started by adding your first ${config.singular}`) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-line-soft text-left text-xs font-semibold uppercase tracking-wide text-faint">
                  {config.hasSort && <th className="w-16 px-4 py-2.5">{th ? "ลำดับ" : "Sort"}</th>}
                  {config.columns.map((col) => (
                    <th key={col.name} className={cn("px-4 py-2.5", col.className)}>
                      {col.label}
                    </th>
                  ))}
                  {config.hasStatus && <th className="px-4 py-2.5">{th ? "สถานะ" : "Status"}</th>}
                  <th className="px-4 py-2.5 text-right">{th ? "จัดการ" : "Manage"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const id = String(row.id);
                  const imported = (config.key === "news" || config.key === "activities") && id.startsWith("mms-");
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
                              aria-label={th ? "เลื่อนขึ้น" : "Move up"}
                              className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-30"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || i === filtered.length - 1}
                              onClick={() => onMove(id, "down")}
                              aria-label={th ? "เลื่อนลง" : "Move down"}
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
                            col.name === config.titleField ? <ManageImportedNewsButton kind={config.key === "activities" ? "activities" : "news"} slug={String(row.slug)} label={cellText(row, col.name, !!col.bilingual) || (th ? "(ไม่มีชื่อ)" : "(Untitled)")} /> : <span>{cellText(row, col.name, !!col.bilingual) || "—"}</span>
                          ) : (
                            <Link href={linkFor(id)} className="line-clamp-2 font-medium text-ink hover:text-accent">
                              {cellText(row, col.name, !!col.bilingual) || <span className="text-faint">{th ? "(ไม่มีชื่อ)" : "(Untitled)"}</span>}
                            </Link>
                          )}
                        </td>
                      ))}
                      {config.hasStatus && (
                        <td className="px-4 py-2.5">
                          {guided ? <StatusBadge status={String(row.status)} /> : <button
                            type="button"
                            disabled={busy}
                            onClick={() => onToggleStatus(row)}
                            className="disabled:opacity-50"
                            title={config.key === "team" ? (th ? "เปิดหน้าต่างยืนยันการเผยแพร่หรือซ่อนโปรไฟล์" : "Toggle profile visibility") : (th ? "คลิกเพื่อสลับสถานะ" : "Click to toggle status")}
                          >
                            <StatusBadge status={row.status as string} />
                          </button>}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {busy && <Loader2 className="size-3.5 animate-spin text-faint" />}
                          {guided && !imported && <>
                            <Link href={linkFor(id)} className="rounded-lg border border-line px-2 py-1 text-xs text-accent">{th ? "แก้ไข" : "Edit"}</Link>
                          </>}
                          {!imported && <button
                            type="button"
                            onClick={() => onDuplicate(id)}
                            disabled={busy}
                            title={th ? "ทำสำเนา" : "Duplicate"}
                            aria-label={th ? "ทำสำเนา" : "Duplicate"}
                            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                          >
                            <Copy className="size-3.5" />
                          </button>}
                          {!imported && !((config.key === "news" || config.key === "activities") && /^mms-hub-\d+$/.test(String(row.slug ?? ""))) && <button
                            type="button"
                            onClick={() => askDelete(id)}
                            disabled={busy}
                            title={th ? "ลบ" : "Delete"}
                            aria-label={th ? "ลบ" : "Delete"}
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
        open={visibilityChange !== null}
        onOpenChange={(open) => !open && !pending && setVisibilityChange(null)}
        title={visibilityChange?.status === "published" ? (th ? "ซ่อนโปรไฟล์จากเว็บไซต์?" : "Hide this profile?") : (th ? "เผยแพร่โปรไฟล์นี้?" : "Publish this profile?")}
        description={visibilityChange ? `${cellText(visibilityChange, "name", true)} — ${visibilityChange.status === "published" ? (th ? "บุคคลทั่วไปจะไม่เห็นโปรไฟล์นี้ ข้อมูลยังเก็บไว้แก้ไขได้" : "The profile will be hidden; its information remains saved.") : (th ? "ทุกคนจะเห็นรูป ประวัติ และข้อมูลติดต่อที่กรอกไว้บนเว็บไซต์ โปรดตรวจสอบว่าอนุญาตให้เผยแพร่" : "The photo, biography and entered contact details will be public. Confirm they may be shared.")}` : ""}
        confirmLabel={visibilityChange?.status === "published" ? (th ? "ยืนยันซ่อน" : "Hide profile") : (th ? "ยืนยันเผยแพร่" : "Publish profile")}
        pending={pending}
        onConfirm={() => { if (visibilityChange) startTransition(async () => { await onToggleStatus(visibilityChange, true); }); }}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={th ? `ลบ${config.singular}นี้?` : `Delete this ${config.singular}?`}
        description={confirm ? (th ? `"${confirm.title}" จะถูกลบอย่างถาวรและกู้คืนไม่ได้` : `"${confirm.title}" will be permanently deleted.`) : ""}
        confirmLabel={th ? "ลบ" : "Delete"}
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
