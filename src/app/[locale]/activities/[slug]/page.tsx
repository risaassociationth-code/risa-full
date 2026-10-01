import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { getLocale } from "@/lib/request";
import { contentLanguage, formatDate, localePath, pick, t } from "@/lib/i18n";
import { getActivityBySlug } from "@/lib/queries";
import { sanitizeHtml } from "@/lib/utils";
import { Placeholder } from "@/components/site/Placeholder";
import { CtaBand } from "@/components/site/CtaBand";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/activities/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const item = await getActivityBySlug(slug);
  if (!item) return {};
  return { title: pick(item, "title", locale), description: pick(item, "excerpt", locale) };
}

export default async function ActivityDetailPage({
  params,
}: PageProps<"/[locale]/activities/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const item = await getActivityBySlug(slug);
  if (!item) notFound();

  const registerHref = item.register_url.startsWith("/")
    ? localePath(locale, item.register_url)
    : item.register_url;

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="container-page py-12 md:py-16">
          <Link
            href={localePath(locale, "/activities")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {t(locale, "back")}
          </Link>
          <h1 lang={contentLanguage(item, "title", locale)} className="max-w-3xl text-[1.9rem] font-semibold leading-tight md:text-[2.5rem]">
            {pick(item, "title", locale)}
          </h1>
          {pick(item, "excerpt", locale) && (
            <p lang={contentLanguage(item, "excerpt", locale)} className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">
              {pick(item, "excerpt", locale)}
            </p>
          )}
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-8">
          <div className="mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
            {item.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.cover_url} alt="" className="size-full object-cover" />
            ) : (
              <Placeholder seed={item.slug} className="size-full" />
            )}
          </div>
          <div
            lang={contentLanguage(item, "body", locale)}
            className="prose-risa"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(pick(item, "body", locale)) }}
          />
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-2xl border border-line bg-surface p-6">
            <dl className="space-y-5 text-sm">
              {item.start_date && (
                <div>
                  <dt className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-faint">
                    <CalendarDays className="size-3.5" strokeWidth={1.7} />
                    {t(locale, "date")}
                  </dt>
                  <dd className="font-medium">
                    {formatDate(item.start_date, locale)}
                    {item.end_date && item.end_date !== item.start_date && (
                      <> – {formatDate(item.end_date, locale)}</>
                    )}
                  </dd>
                </div>
              )}
              {pick(item, "venue", locale) && (
                <div>
                  <dt className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-faint">
                    <MapPin className="size-3.5" strokeWidth={1.7} />
                    {t(locale, "venue")}
                  </dt>
                  <dd className="leading-relaxed">{pick(item, "venue", locale)}</dd>
                </div>
              )}
            </dl>
            {item.register_url && (
              <a
                href={registerHref}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-ink transition-[filter] hover:brightness-110"
              >
                {t(locale, "register")}
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </aside>
      </div>

      <CtaBand />
    </>
  );
}
