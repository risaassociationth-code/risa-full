"use client";
import { AdminText } from "@/components/admin/AdminLanguage";


import Link from "next/link";
import { Plus } from "lucide-react";

/** Kept as a tiny client wrapper so the parent (an async server component)
 * can pass a plain string prop without itself becoming a client boundary. */
export function AddPhotoButton({ albumId }: { albumId: string }) {
  return (
    <Link
      href={`/admin/gallery/${albumId}/photos/new`}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-ink hover:brightness-110"
    >
      <Plus className="size-3.5" /><AdminText>{"เพิ่มภาพ"}</AdminText></Link>
  );
}
