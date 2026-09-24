import type { Metadata } from "next";
import { MmsArchiveCards } from '@/components/site/MmsArchiveCards';
import { MsicFeature } from "@/components/site/MsicFeature";
import { content } from "@/lib/content";
import { getLocale } from "@/lib/request";
import { t } from "@/lib/i18n";
import { getActivities, getManagedMmsActivityIds } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { ActivityCard } from "@/components/site/Cards";
import { CtaBand } from "@/components/site/CtaBand";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: await content("activities.seo.title", locale),
    description: await content("activities.seo.description", locale),
  };
}

export default async function ActivitiesPage() {
  const [locale, all, managedMmsIds] = await Promise.all([getLocale(), getActivities(100), getManagedMmsActivityIds()]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter((a) => (a.end_date ?? a.start_date ?? "") >= today);
  const past = all.filter((a) => (a.end_date ?? a.start_date ?? "") < today);

  return (
    <>
      <PageHero
        eyebrowKey="activities.hero.eyebrow"
        titleKey="activities.hero.title"
        subtitleKey="activities.hero.subtitle"
      />

      <Section>
        <MsicFeature locale={locale} />
        <MmsArchiveCards locale={locale} categories={['2']} excludedIds={managedMmsIds} />
        {all.length > 0 && (
          <div className="space-y-14">
            {[
              { label: t(locale, "upcoming"), items: upcoming },
              { label: t(locale, "past"), items: past },
            ]
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.label}>
                  <h2 className="mb-6 border-b border-line pb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
                    {group.label}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <ActivityCard key={item.id} item={item} locale={locale} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Section>

      <CtaBand />
    </>
  );
}
