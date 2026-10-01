import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import type { Activity, News } from "@/lib/queries";
import { contentLanguage, formatDate, localePath, pick, t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Placeholder } from "./Placeholder";

function Cover({ url, seed, className }: { url: string; seed: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <Placeholder seed={seed} className="size-full" />
      )}
    </div>
  );
}

export function NewsCard({ item, locale }: { item: News; locale: Locale }) {
  const href = localePath(locale, `/news/${item.slug}`);
  return (
    <article className="risa-content-card group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-ink/25">
      <Link href={href} className="flex h-full flex-col">
        <Cover url={item.cover_url} seed={item.slug} className="aspect-[16/10]" />
        <div className="flex flex-1 flex-col p-5">
          <time dateTime={item.published_at} className="text-xs font-medium uppercase tracking-wide text-faint">
            {formatDate(item.published_at, locale)}
          </time>
          <h3 lang={contentLanguage(item, "title", locale)} className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug">
            {pick(item, "title", locale)}
          </h3>
          <p lang={contentLanguage(item, "excerpt", locale)} className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {pick(item, "excerpt", locale)}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
            {t(locale, "readMore")}
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ActivityCard({ item, locale }: { item: Activity; locale: Locale }) {
  const href = localePath(locale, `/activities/${item.slug}`);
  const upcoming = item.end_date ? new Date(item.end_date) >= new Date() : false;
  return (
    <article className="risa-content-card group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-ink/25">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative">
          <Cover url={item.cover_url} seed={item.slug} className="aspect-[16/10]" />
          {upcoming && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-ink">
              {t(locale, "upcoming")}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 lang={contentLanguage(item, "title", locale)} className="line-clamp-2 text-[17px] font-semibold leading-snug">
            {pick(item, "title", locale)}
          </h3>
          <p lang={contentLanguage(item, "excerpt", locale)} className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
            {pick(item, "excerpt", locale)}
          </p>
          <dl className="mt-4 space-y-1.5 border-t border-line-soft pt-3 text-[13px] text-muted">
            {item.start_date && (
              <div className="flex items-start gap-2">
                <dt className="sr-only">{t(locale, "date")}</dt>
                <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.7} />
                <dd>
                  {formatDate(item.start_date, locale)}
                  {item.end_date && item.end_date !== item.start_date &&
                    ` – ${formatDate(item.end_date, locale)}`}
                </dd>
              </div>
            )}
            {pick(item, "venue", locale) && (
              <div className="flex items-start gap-2">
                <dt className="sr-only">{t(locale, "venue")}</dt>
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.7} />
                <dd className="line-clamp-1">{pick(item, "venue", locale)}</dd>
              </div>
            )}
          </dl>
        </div>
      </Link>
    </article>
  );
}
