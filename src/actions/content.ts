"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { audit, requireDisabledFeature as requireUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/utils";
import { REGISTRY } from "@/content/registry";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Save one content block. Used by every inline editor on the public site. */
export async function saveContentBlock(
  key: string,
  valueTh: string,
  valueEn: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    // New registered slots can be saved without reseeding existing user content.
    const page = REGISTRY.find(p => p.sections.some(s => s.blocks.some(b => b.key === key)));
    const section = page?.sections.find(s => s.blocks.some(b => b.key === key));
    const definition = section?.blocks.find(b => b.key === key);
    if (page && section && definition) {
      await sql`insert into content_blocks (key, page, section, label, type, value_th, value_en, sort)
        values (${key}, ${page.page}, ${section.section}, ${definition.label}, ${definition.type ?? "text"}, ${definition.th}, ${definition.en}, ${section.blocks.indexOf(definition)})
        on conflict (key) do nothing`;
    }
    const [before] = await sql<{ value_th: string; value_en: string; type: string }[]>`
      select value_th, value_en, type from content_blocks where key = ${key}`;
    if (!before) return { ok: false, error: `Unknown content key: ${key}` };

    const clean = (v: string) => (before.type === "richtext" ? sanitizeHtml(v) : v);
    const th = clean(valueTh);
    const en = clean(valueEn);

    await sql`
      update content_blocks
      set value_th = ${th}, value_en = ${en}, updated_by = ${user.username}
      where key = ${key}`;

    await audit(user.username, "update", "content_blocks", key, before, { value_th: th, value_en: en });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}
