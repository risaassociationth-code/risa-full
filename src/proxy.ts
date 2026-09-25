import { NextResponse, type NextRequest } from "next/server";
import { isEnabledAdminPath } from "@/lib/site-scope";

const LOCALES = ["th", "en"] as const;
const DEFAULT_LOCALE = "th";

/**
 * Sends bare paths (`/about`) to a locale-prefixed one (`/th/about`), and makes
 * the active locale available to any server component via a request header —
 * which is what lets <Editable> resolve TH/EN without prop-drilling.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "This tool is disabled." }, { status: 403 });
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (isEnabledAdminPath(pathname)) return NextResponse.next();
    if (request.method !== "GET" && request.method !== "HEAD") return new NextResponse(null, { status: 403 });
    return NextResponse.redirect(new URL("/admin/news", request.url));
  }
  const matched = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (matched) {
    const page = pathname.slice(matched.length + 1);
    // Keep old archive article URLs working for imported content.
    if (page && page !== "/" && !/^\/(news|activities)(\/[^/]+)?\/?$/.test(page) && !/^\/mms-hub\/\d+\/?$/.test(page)) {
      return NextResponse.redirect(new URL(`/${matched}/news`, request.url));
    }
    const headers = new Headers(request.headers);
    headers.set("x-risa-locale", matched);
    headers.set("x-risa-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  const cookieLocale = request.cookies.get("risa_locale")?.value;
  const locale = LOCALES.includes(cookieLocale as (typeof LOCALES)[number])
    ? cookieLocale!
    : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!api|admin|_next|uploads|.*\\..*).*)"],
};
