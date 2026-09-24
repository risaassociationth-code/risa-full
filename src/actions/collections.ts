"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { audit, requireUser } from "@/lib/auth";
import { sanitizeHtml, slugify } from "@/lib/utils";
import { validateStaff } from "@/lib/staff";
import { mmsNews } from "@/lib/mms-import";
import {
  columnKinds,
  getCollection,
  rowTitle,
  type CollectionConfig,
  type ColumnKind,
  type Row,
} from "@/components/admin/collection-config";

/** Everything postgres.js will accept as a bound parameter in this console. */
export type DbValue = string | number | boolean | string[] | null;
type Payload = Record<string, DbValue>;

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

const STATUSES = ["draft", "published"] as const;
export type RowStatus = (typeof STATUSES)[number];

function message(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "UNAUTHORISED") return "กรุณาเข้าสู่ระบบอีกครั้ง";
    if (e.message === "FORBIDDEN") return "บัญชีนี้ไม่มีสิทธิ์ดำเนินการ";
    return e.message;
  }
  return "ดำเนินการไม่สำเร็จ";
}

// ── coercion ────────────────────────────────────────────────────────────────

function coerce(kind: ColumnKind, raw: unknown): DbValue {
  switch (kind) {
    case "number": {
      if (raw === "" || raw === null || raw === undefined) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "date": {
      if (raw === "" || raw === null || raw === undefined) return null;
      return String(raw).slice(0, 10);
    }
    case "tags": {
      const list = Array.isArray(raw)
        ? raw.map(String)
        : String(raw ?? "").split(",");
      return list.map((t) => t.trim()).filter(Boolean);
    }
    case "richtext":
      return sanitizeHtml(String(raw ?? ""));
    default:
      return String(raw ?? "");
  }
}

/**
 * Reduces a client-supplied object to the columns this collection declares.
 * Anything not in the config is dropped, so no client string can ever become
 * an SQL identifier.
 */
function sanitizeValues(config: CollectionConfig, values: Row): Payload {
  const kinds = columnKinds(config);
  const payload: Payload = {};
  for (const [column, kind] of kinds) {
    if (!Object.prototype.hasOwnProperty.call(values, column)) continue;
    payload[column] = coerce(kind, values[column]);
  }
  return payload;
}

function readStatus(values: Row): RowStatus | null {
  const raw = values.status;
  return typeof raw === "string" && (STATUSES as readonly string[]).includes(raw)
    ? (raw as RowStatus)
    : null;
}

function revalidate(config: CollectionConfig) {
  revalidatePath("/", "layout");
  revalidatePath(config.adminPath);
}

async function nextSort(config: CollectionConfig, scopeValue?: string | null): Promise<number> {
  const rows =
    config.scopeColumn && scopeValue != null
      ? await sql<{ n: number | null }[]>`
          select max(sort) as n from ${sql(config.table)}
          where ${sql(config.scopeColumn)} = ${scopeValue}`
      : await sql<{ n: number | null }[]>`select max(sort) as n from ${sql(config.table)}`;
  return (rows[0]?.n ?? -1) + 1;
}

/** Slug collections get a unique, URL-safe slug even when the field is left blank. */
async function ensureSlug(
  config: CollectionConfig,
  payload: Payload,
  currentId?: string,
): Promise<void> {
  const field = config.fields.find((f) => f.type === "slug");
  if (!field) return;

  const source = field.slugFrom ?? config.titleField;
  const seed =
    String(payload[field.name] ?? "").trim() ||
    String(payload[`${source}_en`] ?? "").trim() ||
    String(payload[`${source}_th`] ?? "").trim() ||
    String(payload[source] ?? "").trim();

  let candidate = slugify(seed);
  for (let attempt = 0; attempt < 25; attempt++) {
    const clash = currentId
      ? await sql<{ id: string }[]>`
          select id from ${sql(config.table)}
          where ${sql(field.name)} = ${candidate} and id <> ${currentId} limit 1`
      : await sql<{ id: string }[]>`
          select id from ${sql(config.table)}
          where ${sql(field.name)} = ${candidate} limit 1`;
    if (clash.length === 0) break;
    candidate = `${slugify(seed)}-${attempt + 2}`;
  }
  payload[field.name] = candidate;
}

// ── actions ─────────────────────────────────────────────────────────────────

export async function createRow(
  key: string,
  values: Row,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const config = getCollection(key);
    const payload = sanitizeValues(config, values);

    if (key === "team") {
      const error = validateStaff(payload);
      if (error) return { ok: false, error };
    }

    if (config.scopeColumn && !payload[config.scopeColumn]) {
      return { ok: false, error: "ไม่พบกลุ่มของรายการที่จะเพิ่ม" };
    }
    await ensureSlug(config, payload);
    if (config.hasStatus) payload.status = readStatus(values) ?? "draft";
    if (config.hasSort) {
      payload.sort = await nextSort(
        config,
        config.scopeColumn ? String(payload[config.scopeColumn]) : null,
      );
    }

    const columns = Object.keys(payload);
    if (columns.length === 0) return { ok: false, error: "ไม่มีข้อมูลให้บันทึก" };

    const [row] = await sql<{ id: string }[]>`
      insert into ${sql(config.table)} ${sql(payload, columns)} returning id`;

    await audit(user.username, "create", config.table, row.id, null, payload);
    revalidate(config);
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function updateRow(
  key: string,
  id: string,
  values: Row,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const config = getCollection(key);

    const [before] = await sql<Row[]>`
      select * from ${sql(config.table)} where id = ${id} limit 1`;
    if (!before) return { ok: false, error: "ไม่พบรายการที่ต้องการแก้ไข" };

    const payload = sanitizeValues(config, values);
    if (key === "team") {
      const error = validateStaff({ ...before, ...payload });
      if (error) return { ok: false, error };
    }
    await ensureSlug(config, payload, id);
    if (key === "news" && mmsNews.some((article) => article.slug === before.slug)) {
      // Keep the source slug so a Draft reliably hides the archive version.
      payload.slug = String(before.slug);
    }
    if (config.hasStatus) {
      const status = readStatus(values);
      if (status) payload.status = status;
    }

    const columns = Object.keys(payload);
    if (columns.length === 0) return { ok: false, error: "ไม่มีข้อมูลให้บันทึก" };

    await sql`
      update ${sql(config.table)} set ${sql(payload, columns)} where id = ${id}`;

    await audit(user.username, "update", config.table, id, before, payload);
    revalidate(config);
    return { ok: true, data: { id } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function deleteRow(key: string, id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const config = getCollection(key);

    const [before] = await sql<Row[]>`
      select * from ${sql(config.table)} where id = ${id} limit 1`;
    if (!before) return { ok: false, error: "ไม่พบรายการที่ต้องการลบ" };

    if (key === "news" && mmsNews.some((article) => article.slug === before.slug)) {
      return { ok: false, error: "ข่าวจาก MMS Hub ต้องใช้สถานะฉบับร่างเพื่อซ่อนจากหน้าข่าว" };
    }

    await sql`delete from ${sql(config.table)} where id = ${id}`;
    await audit(user.username, "delete", config.table, id, before, null);
    revalidate(config);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function duplicateRow(
  key: string,
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const config = getCollection(key);

    const [source] = await sql<Row[]>`
      select * from ${sql(config.table)} where id = ${id} limit 1`;
    if (!source) return { ok: false, error: "ไม่พบรายการที่ต้องการทำสำเนา" };

    const payload: Payload = {};
    for (const column of columnKinds(config).keys()) {
      payload[column] = (source[column] ?? null) as DbValue;
    }

    // Mark the copy so the two are distinguishable in the list.
    const titleTh = `${config.titleField}_th`;
    const titleEn = `${config.titleField}_en`;
    if (typeof payload[titleTh] === "string") payload[titleTh] = `${payload[titleTh]} (สำเนา)`;
    if (typeof payload[titleEn] === "string" && payload[titleEn]) {
      payload[titleEn] = `${payload[titleEn]} (copy)`;
    }
    if (typeof payload[config.titleField] === "string") {
      payload[config.titleField] = `${payload[config.titleField]} (สำเนา)`;
    }

    const slugField = config.fields.find((f) => f.type === "slug");
    if (slugField) payload[slugField.name] = "";
    await ensureSlug(config, payload);

    if (config.hasStatus) payload.status = "draft";
    if (config.hasSort) {
      payload.sort = await nextSort(
        config,
        config.scopeColumn ? String(payload[config.scopeColumn]) : null,
      );
    }

    const columns = Object.keys(payload);
    const [row] = await sql<{ id: string }[]>`
      insert into ${sql(config.table)} ${sql(payload, columns)} returning id`;

    await audit(user.username, "duplicate", config.table, row.id, source, payload);
    revalidate(config);
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

/**
 * Moves a row one place up or down, then renumbers the whole (scoped) list so
 * `sort` stays a dense 0..n-1 sequence no matter what the data looked like.
 */
export async function reorderRow(
  key: string,
  id: string,
  direction: "up" | "down",
  scopeValue?: string | null,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const config = getCollection(key);
    if (!config.hasSort) return { ok: false, error: "ชุดข้อมูลนี้เรียงลำดับเองไม่ได้" };

    const scopeColumn = config.scopeColumn;
    const scope = scopeValue ?? null;

    await sql.begin(async (tx) => {
      const rows =
        scopeColumn && scope !== null
          ? await tx<{ id: string }[]>`
              select id from ${tx(config.table)}
              where ${tx(scopeColumn)} = ${scope}
              order by sort asc, created_at asc`
          : await tx<{ id: string }[]>`
              select id from ${tx(config.table)} order by sort asc, created_at asc`;

      const order = rows.map((r) => r.id);
      const index = order.indexOf(id);
      if (index === -1) throw new Error("ไม่พบรายการที่ต้องการย้าย");

      const target = direction === "up" ? index - 1 : index + 1;
      if (target >= 0 && target < order.length) {
        [order[index], order[target]] = [order[target], order[index]];
      }
      for (let i = 0; i < order.length; i++) {
        await tx`update ${tx(config.table)} set sort = ${i} where id = ${order[i]}`;
      }
    });

    await audit(user.username, "reorder", config.table, id, null, { direction });
    revalidate(config);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function setStatus(
  key: string,
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const config = getCollection(key);
    if (!config.hasStatus) return { ok: false, error: "ชุดข้อมูลนี้ไม่มีสถานะเผยแพร่" };
    if (!(STATUSES as readonly string[]).includes(status)) {
      return { ok: false, error: "สถานะไม่ถูกต้อง" };
    }

    const [before] = await sql<Row[]>`
      select * from ${sql(config.table)} where id = ${id} limit 1`;
    if (!before) return { ok: false, error: "ไม่พบรายการ" };

    await sql`update ${sql(config.table)} set status = ${status} where id = ${id}`;
    await audit(user.username, "status", config.table, id, { status: before.status }, { status });
    revalidate(config);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

/** Used by the delete dialog to name the row it is about to remove. */
export async function describeRow(key: string, id: string): Promise<ActionResult<{ title: string }>> {
  try {
    await requireUser();
    const config = getCollection(key);
    const [row] = await sql<Row[]>`
      select * from ${sql(config.table)} where id = ${id} limit 1`;
    if (!row) return { ok: false, error: "ไม่พบรายการ" };
    return { ok: true, data: { title: rowTitle(config, row) } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}
