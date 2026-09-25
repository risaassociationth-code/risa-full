"use server";

import { createRow, type ActionResult } from "@/actions/collections";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { mmsActivities } from "@/lib/mms-import";
import type { Row } from "@/components/admin/collection-config";

/** Make an archived partner event editable without changing its source identity. */
export async function manageImportedActivity(slug: string): Promise<ActionResult<{ id: string }>> {
  await requireUser();
  const activity = mmsActivities.find((item) => item.slug === slug);
  if (!activity) return { ok: false, error: "ไม่พบกิจกรรมจากคลัง MMS Hub" };
  const existing = (await sql<{ id: string }[]>`select id from activities where slug = ${slug} limit 1`)[0];
  if (existing) return { ok: true, data: { id: existing.id } };
  // Importing an already-public archive item must preserve its visibility.
  // Existing drafts above are deliberately left unchanged.
  return createRow("activities", { ...activity } as Row);
}
