"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Search, Trash2, Upload } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { EmptyState } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { UPLOAD_SIZE_HINT, validateUploadSize } from "@/lib/upload-limits";

type MediaItem = { id: string; url: string; filename: string; mime: string; size_bytes: number | null; created_at: string };

export function MediaLibraryScreen({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function search(query: string) {
    const res = await fetch(`/api/media?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      Array.from(files).forEach(validateUploadSize);
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", file.type.startsWith("image/") ? "image" : "document");
        const res = await fetch("/api/media/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      }
      toast.success("อัปโหลดแล้ว");
      await search(q);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("ลบไม่สำเร็จ"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPendingDelete(null);
    toast.success("ลบแล้ว");
  }

  function copy(url: string, id: string) {
    navigator.clipboard.writeText(new URL(url, window.location.origin).toString()).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    });
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted"><AdminText>{"รูปภาพและเอกสารสำหรับเว็บไซต์ ·"}</AdminText>{UPLOAD_SIZE_HINT}</p>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(q)}
            placeholder="ค้นหาชื่อไฟล์…"
            className="h-9 w-56 rounded-lg border border-line bg-paper pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:brightness-110 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}<AdminText>{"อัปโหลดไฟล์"}</AdminText></button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {items.length === 0 ? (
        <EmptyState title="ยังไม่มีไฟล์ในคลัง" hint="อัปโหลดรูปภาพหรือเอกสารไฟล์แรกได้เลย" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isImage = item.mime.startsWith("image/");
            return (
              <div key={item.id} className="group relative rounded-xl border border-line bg-paper p-2">
                <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="px-2 text-center font-mono text-[10px] uppercase text-muted">
                      {item.mime.split("/").pop() || "file"}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] font-medium" title={item.filename}>{item.filename}</p>
                <p className="text-[10px] text-faint">{formatBytes(item.size_bytes)}</p>
                <div className="mt-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => copy(item.url, item.id)}
                    className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-surface text-[11px] text-ink-2 hover:bg-surface-2"
                  >
                    {copiedId === item.id ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedId === item.id ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(item.id)}
                    aria-label="ลบไฟล์"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title="ลบไฟล์นี้?"
        description="ไฟล์จะถูกลบออกจากคลัง แต่หน้าเว็บที่อ้างอิงไฟล์นี้อยู่จะแสดงรูปว่างแทน"
        confirmLabel="ลบ"
        destructive
        onConfirm={() => pendingDelete && remove(pendingDelete)}
      />
    </div>
  );
}
