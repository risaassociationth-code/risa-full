"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { audit, hashPassword, requireDisabledFeature as requireAdmin, requireDisabledFeature as requireUser } from "@/lib/auth";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function message(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "UNAUTHORISED") return "กรุณาเข้าสู่ระบบอีกครั้ง";
    if (e.message === "FORBIDDEN") return "บัญชีนี้ไม่มีสิทธิ์ดำเนินการ";
    return e.message;
  }
  return "ดำเนินการไม่สำเร็จ";
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

// ── settings ─────────────────────────────────────────────────────────────

const HEX = /^#[0-9a-fA-F]{6}$/;
const SettingsSchema = z.object({
  org_name_th: z.string().min(1), org_name_en: z.string(),
  org_short: z.string().min(1), tagline_th: z.string(), tagline_en: z.string(),
  logo_url: z.string(), favicon_url: z.string(),
  color_accent: z.string().regex(HEX, "รูปแบบสีไม่ถูกต้อง (เช่น #1B4DFF)"),
  color_ink: z.string().regex(HEX, "รูปแบบสีไม่ถูกต้อง"),
  radius: z.string().min(1),
  address_th: z.string(), address_en: z.string(),
  phone: z.string(), email: z.string(), line_id: z.string(),
  facebook_url: z.string(), x_url: z.string(), youtube_url: z.string(), linkedin_url: z.string(),
  map_lat: z.coerce.number(), map_lng: z.coerce.number(), map_zoom: z.coerce.number().int(),
  ga_id: z.string(),
});

export async function updateSettings(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = SettingsSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

    const [before] = await sql`select * from settings where id = true`;
    await sql`update settings set ${sql(parsed.data)} where id = true`;

    await audit(user.username, "update", "settings", "singleton", before, parsed.data);
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

// ── navigation ───────────────────────────────────────────────────────────

const NavSchema = z.object({
  label_th: z.string().min(1), label_en: z.string(),
  href: z.string(), new_tab: z.boolean().optional(),
  parent_id: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function createNavItem(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = NavSchema.parse(values);
    const [{ n }] = await sql<{ n: number }[]>`
      select coalesce(max(sort), -1) + 1 as n from nav_items
      where parent_id is not distinct from ${data.parent_id ?? null}`;
    const [row] = await sql<{ id: string }[]>`
      insert into nav_items (label_th, label_en, href, new_tab, parent_id, status, sort)
      values (${data.label_th}, ${data.label_en}, ${data.href}, ${data.new_tab ?? false},
              ${data.parent_id ?? null}, ${data.status ?? "published"}, ${n})
      returning id`;
    await audit(user.username, "create", "nav_items", row.id, null, data);
    revalidateSite();
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function updateNavItem(id: string, values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = NavSchema.partial().parse(values);
    const [before] = await sql`select * from nav_items where id = ${id}`;
    if (!before) return { ok: false, error: "ไม่พบเมนูนี้" };
    await sql`update nav_items set ${sql(data)} where id = ${id}`;
    await audit(user.username, "update", "nav_items", id, before, data);
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function deleteNavItem(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [before] = await sql`select * from nav_items where id = ${id}`;
    if (!before) return { ok: false, error: "ไม่พบเมนูนี้" };
    await sql`delete from nav_items where id = ${id}`;
    await audit(user.username, "delete", "nav_items", id, before, null);
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function reorderNavItem(
  id: string, direction: "up" | "down", parentId: string | null,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await sql.begin(async (tx) => {
      const rows = await tx<{ id: string }[]>`
        select id from nav_items where parent_id is not distinct from ${parentId}
        order by sort asc, created_at asc`;
      const order = rows.map((r) => r.id);
      const i = order.indexOf(id);
      if (i === -1) throw new Error("ไม่พบเมนูนี้");
      const j = direction === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < order.length) [order[i], order[j]] = [order[j], order[i]];
      for (let k = 0; k < order.length; k++) {
        await tx`update nav_items set sort = ${k} where id = ${order[k]}`;
      }
    });
    await audit(user.username, "reorder", "nav_items", id, null, { direction });
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

// ── footer links ─────────────────────────────────────────────────────────

const FooterSchema = z.object({
  column_key: z.string().min(1), label_th: z.string().min(1), label_en: z.string(),
  href: z.string(), new_tab: z.boolean().optional(), status: z.enum(["draft", "published"]).optional(),
});

export async function createFooterLink(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = FooterSchema.parse(values);
    const [{ n }] = await sql<{ n: number }[]>`
      select coalesce(max(sort), -1) + 1 as n from footer_links where column_key = ${data.column_key}`;
    const [row] = await sql<{ id: string }[]>`
      insert into footer_links (column_key, label_th, label_en, href, new_tab, status, sort)
      values (${data.column_key}, ${data.label_th}, ${data.label_en}, ${data.href},
              ${data.new_tab ?? false}, ${data.status ?? "published"}, ${n})
      returning id`;
    await audit(user.username, "create", "footer_links", row.id, null, data);
    revalidateSite();
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function updateFooterLink(id: string, values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = FooterSchema.partial().parse(values);
    const [before] = await sql`select * from footer_links where id = ${id}`;
    if (!before) return { ok: false, error: "ไม่พบลิงก์นี้" };
    await sql`update footer_links set ${sql(data)} where id = ${id}`;
    await audit(user.username, "update", "footer_links", id, before, data);
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function deleteFooterLink(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [before] = await sql`select * from footer_links where id = ${id}`;
    if (!before) return { ok: false, error: "ไม่พบลิงก์นี้" };
    await sql`delete from footer_links where id = ${id}`;
    await audit(user.username, "delete", "footer_links", id, before, null);
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function reorderFooterLink(
  id: string, direction: "up" | "down", columnKey: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await sql.begin(async (tx) => {
      const rows = await tx<{ id: string }[]>`
        select id from footer_links where column_key = ${columnKey} order by sort asc, created_at asc`;
      const order = rows.map((r) => r.id);
      const i = order.indexOf(id);
      if (i === -1) throw new Error("ไม่พบลิงก์นี้");
      const j = direction === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < order.length) [order[i], order[j]] = [order[j], order[i]];
      for (let k = 0; k < order.length; k++) {
        await tx`update footer_links set sort = ${k} where id = ${order[k]}`;
      }
    });
    await audit(user.username, "reorder", "footer_links", id, null, { direction });
    revalidateSite();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

// ── submissions ──────────────────────────────────────────────────────────

export async function updateSubmission(
  id: string, values: { status?: "new" | "read" | "archived"; notes?: string },
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [before] = await sql`select * from submissions where id = ${id}`;
    if (!before) return { ok: false, error: "ไม่พบข้อความนี้" };
    const patch: Record<string, string> = {};
    if (values.status) patch.status = values.status;
    if (values.notes !== undefined) patch.notes = values.notes;
    if (Object.keys(patch).length === 0) return { ok: true };
    await sql`update submissions set ${sql(patch)} where id = ${id}`;
    await audit(user.username, "update", "submissions", id, { status: before.status }, patch);
    revalidatePath("/admin/submissions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

// ── admin users ──────────────────────────────────────────────────────────

const UserSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,31}$/, "ชื่อผู้ใช้ต้องมี 3–32 ตัวอักษร ใช้ a-z, 0-9, _ หรือ - ได้"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  role: z.enum(["admin", "editor"]),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});

export async function createAdminUser(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAdmin();
    const data = UserSchema.parse(values);
    const existing = await sql`select id from admin_users where username = ${data.username}`;
    if (existing.length > 0) return { ok: false, error: "มีบัญชีนี้อยู่แล้ว" };

    const hash = await hashPassword(data.password);
    const [row] = await sql<{ id: string }[]>`
      insert into admin_users (username, name, role, password_hash)
      values (${data.username}, ${data.name}, ${data.role}, ${hash})
      returning id`;
    await audit(user.username, "create", "admin_users", row.id, null, { username: data.username, role: data.role });
    revalidatePath("/admin/users");
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

async function adminCount(excludeId?: string): Promise<number> {
  const rows = excludeId
    ? await sql<{ n: number }[]>`select count(*)::int as n from admin_users where role = 'admin' and id <> ${excludeId}`
    : await sql<{ n: number }[]>`select count(*)::int as n from admin_users where role = 'admin'`;
  return rows[0]?.n ?? 0;
}

export async function updateAdminUserRole(id: string, role: "admin" | "editor"): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    const [target] = await sql<{ username: string; role: string }[]>`
      select username, role from admin_users where id = ${id}`;
    if (!target) return { ok: false, error: "ไม่พบผู้ใช้นี้" };
    if (target.role === "admin" && role === "editor" && (await adminCount(id)) === 0) {
      return { ok: false, error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนเสมอ" };
    }
    await sql`update admin_users set role = ${role} where id = ${id}`;
    await audit(actor.username, "update", "admin_users", id, { role: target.role }, { role });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function resetAdminUserPassword(id: string, password: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    if (password.length < 8) return { ok: false, error: "รหัสผ่านอย่างน้อย 8 ตัวอักษร" };
    const [target] = await sql`select username from admin_users where id = ${id}`;
    if (!target) return { ok: false, error: "ไม่พบผู้ใช้นี้" };
    const hash = await hashPassword(password);
    await sql`update admin_users set password_hash = ${hash} where id = ${id}`;
    await audit(actor.username, "update", "admin_users", id, null, { action: "reset_password" });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function deleteAdminUser(id: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    if (actor.id === id) return { ok: false, error: "ไม่สามารถลบบัญชีของตัวเองได้" };
    const [target] = await sql<{ username: string; role: string }[]>`
      select username, role from admin_users where id = ${id}`;
    if (!target) return { ok: false, error: "ไม่พบผู้ใช้นี้" };
    if (target.role === "admin" && (await adminCount(id)) === 0) {
      return { ok: false, error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนเสมอ" };
    }
    await sql`delete from admin_users where id = ${id}`;
    await audit(actor.username, "delete", "admin_users", id, target, null);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}
