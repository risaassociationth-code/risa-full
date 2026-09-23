"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createFooterLink, createNavItem, deleteFooterLink, deleteNavItem,
  reorderFooterLink, reorderNavItem, updateFooterLink, updateNavItem,
} from "@/actions/admin";
import { Input } from "@/components/ui/field";
import { Card, CardHead, EmptyState } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";

function LinkField({ label, hint, ...props }: React.ComponentProps<typeof Input> & { label: string; hint?: string }) {
  return (
    <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-xs text-muted">
      <span className="font-medium text-ink">{label}</span>
      <Input {...props} className="h-10 w-full text-sm" />
      {hint && <span className="text-xs leading-relaxed">{hint}</span>}
    </label>
  );
}

function EditingHelp() {
  return <p className="border-b border-line-soft px-5 py-3 text-sm leading-relaxed text-muted"><AdminText>{"แก้ไขข้อความแล้วคลิกออกจากช่องเพื่อบันทึกอัตโนมัติ การเพิ่ม ลบ และเปลี่ยนลำดับมีผลทันที ใช้ปุ่มลูกศรเพื่อเลื่อนรายการขึ้นหรือลง"}</AdminText></p>;
}

type NavRow = {
  id: string; label_th: string; label_en: string; href: string;
  parent_id: string | null; new_tab: boolean; status: string; sort: number;
};
type FooterRow = {
  id: string; column_key: string; label_th: string; label_en: string;
  href: string; new_tab: boolean; status: string; sort: number;
};

// ── main menu ────────────────────────────────────────────────────────────

export function NavItemsEditor({ items }: { items: NavRow[] }) {
  const [rows, setRows] = useState(items);
  const roots = rows.filter((r) => !r.parent_id).sort((a, b) => a.sort - b.sort);
  const childrenOf = (id: string) => rows.filter((r) => r.parent_id === id).sort((a, b) => a.sort - b.sort);

  function patchRow(id: string, patch: Partial<NavRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function addRoot() {
    const res = await createNavItem({ label_th: "เมนูใหม่", label_en: "New menu", href: "/", parent_id: null });
    if (!res.ok) return toast.error(res.error);
    setRows((prev) => [...prev, {
      id: res.data.id, label_th: "เมนูใหม่", label_en: "New menu", href: "/",
      parent_id: null, new_tab: false, status: "published", sort: prev.length,
    }]);
  }

  async function addChild(parentId: string) {
    const res = await createNavItem({ label_th: "เมนูย่อยใหม่", label_en: "New item", href: "/", parent_id: parentId });
    if (!res.ok) return toast.error(res.error);
    setRows((prev) => [...prev, {
      id: res.data.id, label_th: "เมนูย่อยใหม่", label_en: "New item", href: "/",
      parent_id: parentId, new_tab: false, status: "published", sort: childrenOf(parentId).length,
    }]);
  }

  return (
    <Card>
      <CardHead
        title="1. เมนูด้านบนเว็บไซต์"
        hint="เมนูหลักอยู่บนแถบด้านบน ส่วนเมนูย่อยจะแสดงใต้เมนูหลักนั้นเมื่อเปิดเมนู"
        actions={
          <button
            type="button"
            onClick={addRoot}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-ink hover:brightness-110"
          >
            <Plus className="size-3.5" /><AdminText>{"เพิ่มเมนูหลัก"}</AdminText></button>
        }
      />
      <EditingHelp />
      <div className="divide-y divide-line-soft">
        {roots.length === 0 ? (
          <EmptyState title="ยังไม่มีเมนู" className="border-0" />
        ) : (
          roots.map((root) => (
            <div key={root.id} className="p-4">
              <NavRowEditor
                row={root}
                siblingCount={roots.length}
                index={roots.indexOf(root)}
                onPatch={(patch) => patchRow(root.id, patch)}
                onRemove={() => setRows((prev) => prev.filter((r) => r.id !== root.id && r.parent_id !== root.id))}
              />
              <div className="ml-6 mt-2 space-y-2 border-l border-line pl-4">
                {childrenOf(root.id).map((child, i) => (
                  <NavRowEditor
                    key={child.id}
                    row={child}
                    siblingCount={childrenOf(root.id).length}
                    index={i}
                    onPatch={(patch) => patchRow(child.id, patch)}
                    onRemove={() => setRows((prev) => prev.filter((r) => r.id !== child.id))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addChild(root.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
                >
                  <Plus className="size-3" /><AdminText>{"เพิ่มเมนูย่อยใต้ “"}</AdminText>{root.label_th}”
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function NavRowEditor({
  row, siblingCount, index, onPatch, onRemove,
}: { row: NavRow; siblingCount: number; index: number; onPatch: (p: Partial<NavRow>) => void; onRemove: () => void }) {
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function save(patch: Partial<NavRow>) {
    onPatch(patch);
    start(async () => {
      const res = await updateNavItem(row.id, patch);
      if (!res.ok) toast.error(res.error);
    });
  }

  function move(direction: "up" | "down") {
    start(async () => {
      const res = await reorderNavItem(row.id, direction, row.parent_id);
      if (!res.ok) toast.error(res.error);
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteNavItem(row.id);
      if (!res.ok) { toast.error(res.error); setConfirmOpen(false); return; }
      onRemove();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface/60 p-2.5">
      <div className="flex shrink-0 flex-col">
        <button type="button" aria-label="เลื่อนขึ้น" title="เลื่อนขึ้น" disabled={pending || index === 0} onClick={() => move("up")} className="rounded p-0.5 text-faint hover:text-ink disabled:opacity-30">
          <ArrowUp className="size-3" />
        </button>
        <button type="button" aria-label="เลื่อนลง" title="เลื่อนลง" disabled={pending || index === siblingCount - 1} onClick={() => move("down")} className="rounded p-0.5 text-faint hover:text-ink disabled:opacity-30">
          <ArrowDown className="size-3" />
        </button>
      </div>
      <LinkField label="ชื่อเมนูภาษาไทย"
        defaultValue={row.label_th}
        onBlur={(e) => e.target.value !== row.label_th && save({ label_th: e.target.value })}
        placeholder="ป้ายกำกับ (ไทย)"
        className="h-8 w-36 text-[13px]"
      />
      <LinkField label="ชื่อเมนูภาษาอังกฤษ"
        defaultValue={row.label_en}
        onBlur={(e) => e.target.value !== row.label_en && save({ label_en: e.target.value })}
        placeholder="Label (English)"
        className="h-8 w-36 text-[13px]"
      />
      <LinkField label="ลิงก์ปลายทาง" hint="หน้าในเว็บ เช่น /about · เว็บอื่น เช่น https://example.com"
        defaultValue={row.href}
        onBlur={(e) => e.target.value !== row.href && save({ href: e.target.value })}
        placeholder="/about หรือ https://…"
        className="h-8 flex-1 min-w-40 font-mono text-[12.5px]"
      />
      <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
        <input
          type="checkbox"
          defaultChecked={row.new_tab}
          onChange={(e) => save({ new_tab: e.target.checked })}
        /><AdminText>{"เปิดลิงก์ในแท็บใหม่"}</AdminText></label>
      <button
        type="button"
        disabled={pending}
        aria-label={row.status === "published" ? "ซ่อนเมนูนี้จากเว็บไซต์" : "แสดงเมนูนี้บนเว็บไซต์"}
        onClick={() => save({ status: row.status === "published" ? "draft" : "published" })}
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          row.status === "published" ? "bg-green-50 text-green-700" : "bg-surface-2 text-muted"
        }`}
      >
        {row.status === "published" ? "แสดงอยู่ · คลิกเพื่อซ่อน" : "ซ่อนอยู่ · คลิกเพื่อแสดง"}
      </button>
      {pending && <Loader2 className="size-3.5 shrink-0 animate-spin text-faint" />}
      <button type="button" onClick={() => setConfirmOpen(true)} aria-label="ลบเมนู" className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
        <Trash2 className="size-3.5" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="ลบเมนูนี้?"
        description={row.parent_id ? undefined : "เมนูย่อยทั้งหมดภายใต้เมนูนี้จะถูกลบไปด้วย"}
        confirmLabel="ลบ"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}

// ── footer ───────────────────────────────────────────────────────────────

const FOOTER_COLUMNS: { value: string; label: string }[] = [
  { value: "menu", label: "คอลัมน์: เมนูลัด" },
  { value: "resources", label: "คอลัมน์: ทรัพยากร" },
];

export function FooterLinksEditor({ links }: { links: FooterRow[] }) {
  const [rows, setRows] = useState(links);

  function patchRow(id: string, patch: Partial<FooterRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function addLink(columnKey: string) {
    const res = await createFooterLink({ column_key: columnKey, label_th: "ลิงก์ใหม่", label_en: "New link", href: "/" });
    if (!res.ok) return toast.error(res.error);
    setRows((prev) => [...prev, {
      id: res.data.id, column_key: columnKey, label_th: "ลิงก์ใหม่", label_en: "New link",
      href: "/", new_tab: false, status: "published", sort: prev.length,
    }]);
  }

  return (
    <Card>
      <CardHead title="2. ลิงก์ส่วนท้ายเว็บไซต์ (ฟุตเตอร์)" hint="ลิงก์ที่ผู้เข้าชมเห็นเมื่อเลื่อนลงไปล่างสุดของหน้า แบ่งเป็นกลุ่มเมนูลัดและทรัพยากร" />
      <EditingHelp />
      <div className="grid gap-5 p-5">
        {FOOTER_COLUMNS.map((col) => {
          const list = rows.filter((r) => r.column_key === col.value).sort((a, b) => a.sort - b.sort);
          return (
            <div key={col.value}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{col.label}</p>
              <div className="space-y-2">
                {list.map((row, i) => (
                  <FooterRowEditor
                    key={row.id}
                    row={row}
                    index={i}
                    siblingCount={list.length}
                    onPatch={(patch) => patchRow(row.id, patch)}
                    onRemove={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addLink(col.value)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
                >
                  <Plus className="size-3" /><AdminText>{"เพิ่มลิงก์ใน"}</AdminText>{col.label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function FooterRowEditor({
  row, index, siblingCount, onPatch, onRemove,
}: { row: FooterRow; index: number; siblingCount: number; onPatch: (p: Partial<FooterRow>) => void; onRemove: () => void }) {
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function save(patch: Partial<FooterRow>) {
    onPatch(patch);
    start(async () => {
      const res = await updateFooterLink(row.id, patch);
      if (!res.ok) toast.error(res.error);
    });
  }

  function move(direction: "up" | "down") {
    start(async () => {
      const res = await reorderFooterLink(row.id, direction, row.column_key);
      if (!res.ok) toast.error(res.error);
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteFooterLink(row.id);
      if (!res.ok) { toast.error(res.error); setConfirmOpen(false); return; }
      onRemove();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-surface/60 p-2">
      <div className="flex shrink-0 flex-col">
        <button type="button" aria-label="เลื่อนขึ้น" title="เลื่อนขึ้น" disabled={pending || index === 0} onClick={() => move("up")} className="rounded p-0.5 text-faint hover:text-ink disabled:opacity-30">
          <ArrowUp className="size-3" />
        </button>
        <button type="button" aria-label="เลื่อนลง" title="เลื่อนลง" disabled={pending || index === siblingCount - 1} onClick={() => move("down")} className="rounded p-0.5 text-faint hover:text-ink disabled:opacity-30">
          <ArrowDown className="size-3" />
        </button>
      </div>
      <LinkField label="ชื่อลิงก์ภาษาไทย"
        defaultValue={row.label_th}
        onBlur={(e) => e.target.value !== row.label_th && save({ label_th: e.target.value })}
        placeholder="ป้ายกำกับ (ไทย)"
        className="h-8 w-28 text-[13px]"
      />
      <LinkField label="ชื่อลิงก์ภาษาอังกฤษ"
        defaultValue={row.label_en}
        onBlur={(e) => e.target.value !== row.label_en && save({ label_en: e.target.value })}
        placeholder="English"
        className="h-8 w-28 text-[13px]"
      />
      <LinkField label="ลิงก์ปลายทาง" hint="หน้าในเว็บ เช่น /about · เว็บอื่น เช่น https://example.com"
        defaultValue={row.href}
        onBlur={(e) => e.target.value !== row.href && save({ href: e.target.value })}
        className="h-8 flex-1 min-w-24 font-mono text-[12px]"
      />
      {pending && <Loader2 className="size-3.5 shrink-0 animate-spin text-faint" />}
      <button type="button" onClick={() => setConfirmOpen(true)} aria-label="ลบลิงก์" className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
        <Trash2 className="size-3.5" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="ลบลิงก์นี้?"
        confirmLabel="ลบ"
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}
