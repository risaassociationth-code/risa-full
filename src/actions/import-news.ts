"use server";

import { createRow, type ActionResult } from "@/actions/collections";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { mmsNews, normalizeImportedSlug } from "@/lib/mms-import";
import type { Row } from "@/components/admin/collection-config";

/** Copy an existing partner article into RISA's editor. The original source remains credited. */
export async function manageImportedNews(slug: string): Promise<ActionResult<{ id: string }>> {
  await requireUser();
  const canonical = normalizeImportedSlug(slug);
  const legacy = canonical.replace(/^risa-/, "mms-hub-");
  const article = mmsNews.find((item) => item.slug === canonical);
  if (!article) return { ok: false, error: "ไม่พบข่าวจากคลังข้อมูล" };
  const existing = (await sql<{ id: string }[]>`select id from news where slug in (${canonical}, ${legacy}) limit 1`)[0];
  if (existing) return { ok: true, data: { id: existing.id } };
  return createRow("news", { ...article } as Row);
}
