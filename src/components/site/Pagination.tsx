import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Pagination({
  page, pageCount, basePath, locale,
}: { page: number; pageCount: number; basePath: string; locale: Locale }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  const linkCls = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-line px-3 text-sm transition-colors hover:border-ink";

  return (
    <nav className="risa-pagination mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label={t(locale, "page")}>
      {page > 1 && (
        <Link href={href(page - 1)} className={linkCls} rel="prev">
          <ChevronLeft className="size-4" />
          <span className="sr-only">{t(locale, "previous")}</span>
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-faint">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(linkCls, p === page && "border-ink bg-ink text-white hover:border-ink")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className={linkCls} rel="next">
          <ChevronRight className="size-4" />
          <span className="sr-only">{t(locale, "next")}</span>
        </Link>
      )}
    </nav>
  );
}
