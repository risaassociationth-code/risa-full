"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { manageImportedNews } from "@/actions/import-news";

export function ManageImportedNewsButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <button type="button" disabled={pending} className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface disabled:opacity-50" onClick={() => startTransition(async () => {
    const result = await manageImportedNews(slug);
    if (!result.ok) { toast.error(result.error); return; }
    router.push(`/admin/news/${result.data.id}`);
    router.refresh();
  })}>{pending ? "กำลังเปิด…" : "นำเข้าเพื่อแก้ไข"}</button>;
}
