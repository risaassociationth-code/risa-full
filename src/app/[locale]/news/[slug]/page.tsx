import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale } from "@/lib/request";
import { contentLanguage, formatDate, localePath, pick, t } from "@/lib/i18n";
import { getNews, getNewsBySlug } from "@/lib/queries";
import { sanitizeHtml } from "@/lib/utils";
import { Section } from "@/components/site/Section";
import { NewsCard } from "@/components/site/Cards";
import { Placeholder } from "@/components/site/Placeholder";
import { CtaBand } from "@/components/site/CtaBand";

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const item = await getNewsBySlug(slug);
  if (!item) return {};
  return {
    title: pick(item, "title", locale),
    description: pick(item, "excerpt", locale),
    openGraph: { images: item.cover_url ? [item.cover_url] : undefined, type: "article" },
  };
}

export default async function NewsDetailPage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const item = await getNewsBySlug(slug);
  if (!item) notFound();

  const related = (await getNews(4)).filter((n) => n.id !== item.id).slice(0, 3);

  return (
    <>
      <article>
        <div className="border-b border-line bg-surface">
          <div className="container-page py-12 md:py-16">
            <Link
              href={localePath(locale, "/news")}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="size-3.5" />
              {t(locale, "back")}
            </Link>
            <time
              dateTime={item.published_at}
              className="block text-[13px] font-medium uppercase tracking-wide text-accent"
            >
              {formatDate(item.published_at, locale)}
            </time>
            <h1 lang={contentLanguage(item, "title", locale)} className="mt-3 max-w-3xl text-[1.9rem] font-semibold leading-tight md:text-[2.5rem]">
              {pick(item, "title", locale)}
            </h1>
            {pick(item, "excerpt", locale) && (
              <p lang={contentLanguage(item, "excerpt", locale)} className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">
                {pick(item, "excerpt", locale)}
              </p>
            )}
            {item.tags.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="container-page py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
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
        </div>
      </article>

      {related.length > 0 && (
        <Section tone="surface">
          <h2 className="mb-8 text-xl font-semibold">{t(locale, "readMore")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((n) => <NewsCard key={n.id} item={n} locale={locale} />)}
          </div>
        </Section>
      )}

      <CtaBand />
    </>
  );
}
