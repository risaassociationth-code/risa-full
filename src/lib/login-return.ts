import { isEnabledAdminPath } from "./site-scope";

/** Only return to an enabled editor screen after signing in. */
export function safeLoginReturn(value: unknown): string {
  const fallback = "/admin";
  if (typeof value !== "string" || !/^\/admin(?:[/?#]|$)/.test(value) || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const base = "https://risa.invalid";
    const url = new URL(value, base);
    if (url.origin !== base || !isEnabledAdminPath(url.pathname) || url.pathname === "/admin/login") return fallback;
    // Reject encoded path separators and dot segments rather than normalizing them.
    if (decodeURIComponent(url.pathname) !== url.pathname || value.split(/[?#]/)[0] !== url.pathname) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
