import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { sql } from "./db";

const SESSION_COOKIE = "risa_session";
const EDIT_COOKIE = "risa_edit";
const MAX_AGE = 60 * 60 * 24 * 7;

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: "admin" | "editor";
};

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set and at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyLogin(username: string, password: string): Promise<AdminUser | null> {
  const rows = await sql<
    { id: string; username: string; name: string; role: "admin" | "editor"; password_hash: string }[]
  >`select id, username, name, role, password_hash from admin_users where username = ${username.toLowerCase().trim()} limit 1`;
  const user = rows[0];
  if (!user) {
    // Constant-ish work so a missing account is not obviously faster than a wrong password.
    await bcrypt.compare(password, "$2a$12$0000000000000000000000000000000000000000000000000000");
    return null;
  }
  if (!(await bcrypt.compare(password, user.password_hash))) return null;
  await sql`update admin_users set last_login_at = now() where id = ${user.id}`;
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

export async function createSession(user: AdminUser) {
  const token = await new SignJWT({ username: user.username, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(EDIT_COOKIE);
}

/** Current admin, or null. Safe to call from any server component. */
export async function getCurrentUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub),
      // Sessions issued before usernames were introduced remain usable until
      // they expire, then the user signs in again with their username.
      username: String(payload.username ?? payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role === "admin" ? "admin" : "editor",
    };
  } catch {
    return null;
  }
}

/** Throws unless a valid admin/editor session exists. Use at the top of every write action. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORISED");
  return user;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

/** Inline editing is on only when an admin is signed in AND has toggled it. */
export async function isEditMode(): Promise<boolean> {
  return false;
}

/** Server-side lock: hidden legacy UI actions must not remain writable. */
export async function requireDisabledFeature(): Promise<AdminUser> {
  await requireUser();
  throw new Error("ขณะนี้เปิดให้จัดการเฉพาะข่าวสาร กิจกรรม และบุคลากร / Only News, Activities and Personnel editing is enabled.");
}

export async function audit(
  actorEmail: string,
  action: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  await sql.begin(async (tx) => {
    // Older imported audit rows may have explicit IDs beyond the sequence's
    // current value. Serialize admin history writes while bringing it forward.
    await tx`select pg_advisory_xact_lock(734029, 1)`;
    await tx`
      select setval(
        pg_get_serial_sequence('audit_log', 'id'),
        greatest(
          coalesce((select max(id) from audit_log), 0),
          nextval(pg_get_serial_sequence('audit_log', 'id'))
        ),
        true
      )`;
    await tx`
      insert into audit_log (actor_email, action, entity, entity_id, before, after)
      values (${actorEmail}, ${action}, ${entity}, ${entityId},
              ${before ? tx.json(before as never) : null},
              ${after ? tx.json(after as never) : null})`;
  });
}
