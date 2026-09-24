"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { manageImportedNews } from "@/actions/import-news";

export function ManageImportedNewsButton({ slug, label }: { slug: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <button type="button" disabled={pending} className="line-clamp-2 text-left font-medium text-ink hover:text-accent disabled:opacity-50" onClick={() => startTransition(async () => {
    const result = await manageImportedNews(slug);
    if (!result.ok) { toast.error(result.error); return; }
    router.push(`/admin/news/${result.data.id}`);
    router.refresh();
  })}>{pending ? "กำลังเปิด…" : label}</button>;
}
