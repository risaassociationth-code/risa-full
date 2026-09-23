"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ImagePlus, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "./button";
import { UPLOAD_SIZE_HINT, validateUploadSize } from "@/lib/upload-limits";

export type MediaItem = {
  id: string; url: string; filename: string; mime: string; size_bytes: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (url: string) => void;
  kind?: "image" | "document";
};

export function MediaPickerDialog({ open, onOpenChange, onSelect, kind = "image" }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function load(query = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // `load` sets its own loading state before the fetch resolves — a
    // fetch-on-open effect with no render-time equivalent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      Array.from(files).forEach(validateUploadSize);
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", kind);
        const res = await fetch("/api/media/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      }
      toast.success("อัปโหลดแล้ว");
      await load(q);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    await fetch(`/api/media?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[91] flex max-h-[85vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
          <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
            <Dialog.Title className="text-sm font-semibold"><AdminText>{"คลังไฟล์ / Media library"}</AdminText></Dialog.Title>
            <Dialog.Description className="sr-only"><AdminText>{"เลือกรูปภาพหรือเอกสาร ·"}</AdminText>{UPLOAD_SIZE_HINT}</Dialog.Description>
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(q)}
                placeholder="ค้นหาชื่อไฟล์"
                className="h-8 w-44 rounded-lg border border-line bg-surface pl-8 pr-2 text-xs outline-none focus:border-accent focus:bg-paper"
              />
            </div>
            <Button size="sm" variant="accent" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}<AdminText>{"อัปโหลด"}</AdminText></Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept={kind === "document" ? undefined : "image/*"}
              onChange={(e) => upload(e.target.files)}
            />
            <Dialog.Close className="rounded p-1.5 text-muted hover:bg-surface" aria-label="ปิด">
              <X className="size-4" />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <p className="mb-4 text-xs text-muted">{UPLOAD_SIZE_HINT}</p>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-lg bg-surface" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <ImagePlus className="size-8 text-faint" />
                <p className="text-sm text-muted"><AdminText>{"ยังไม่มีไฟล์ในคลัง — อัปโหลดไฟล์แรกได้เลย"}</AdminText></p>
                <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}><AdminText>{"เลือกไฟล์"}</AdminText></Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {items.map((item) => {
                  const isImage = item.mime.startsWith("image/");
                  return (
                    <div key={item.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(item.url);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "block w-full overflow-hidden rounded-lg border border-line bg-surface transition-all hover:border-accent hover:ring-2 hover:ring-accent/20",
                        )}
                      >
                        <span className="flex aspect-square items-center justify-center overflow-hidden">
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="px-2 text-center font-mono text-[10px] uppercase text-muted">
                              {item.mime.split("/").pop()}
                            </span>
                          )}
                        </span>
                      </button>
                      <p className="mt-1 truncate text-[11px] text-muted" title={item.filename}>
                        {item.filename}
                      </p>
                      <p className="text-[10px] text-faint">{formatBytes(item.size_bytes)}</p>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label="ลบไฟล์"
                        className="absolute right-1.5 top-1.5 rounded-md bg-paper/90 p-1 text-muted opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
