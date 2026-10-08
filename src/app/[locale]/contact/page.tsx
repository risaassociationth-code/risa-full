import type { Metadata } from "next";
import { ExternalLink, MapPin } from "lucide-react";
import { content, getSettings } from "@/lib/content";
import { getLocale } from "@/lib/request";
import { pick } from "@/lib/i18n";
import { Editable } from "@/components/editable/Editable";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { ListSection } from "@/components/site/ListSection";
import { MapView } from "@/components/site/MapView";
import { ContactForm } from "@/components/site/forms/ContactForm";
import { CtaBand } from "@/components/site/CtaBand";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: await content("contact.seo.title", locale),
    description: await content("contact.seo.description", locale),
  };
}

export default async function ContactPage() {
  const [locale, settings] = await Promise.all([getLocale(), getSettings()]);

  const lat = Number(settings.map_lat);
  const lng = Number(settings.map_lng);
  const address = pick(settings, "address", locale);
  const hasOfficeMap = address && settings.map_lat != null && settings.map_lng != null;
  const office = {
    id: "office",
    name: pick(settings, "org_name", locale),
    address,
    lat,
    lng,
    kind: "office" as const,
  };
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <>
      <PageHero
        eyebrowKey="contact.hero.eyebrow"
        titleKey="contact.hero.title"
        subtitleKey="contact.hero.subtitle"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ── channels ────────────────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <Editable
              k="contact.channels.title"
              as="h2"
              className="mb-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent"
            />
            {/* columns={1}: ListSection's narrowest built-in grid is two-up. */}
            <ListSection
              listKey="contact.channels"
              columns={2}
              variant="plain"
              className="sm:grid-cols-1"
            />
            <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
              <Editable
                k="contact.hours.label"
                as="h3"
                className="text-[13px] font-semibold uppercase tracking-wide text-faint"
              />
              <Editable
                k="contact.hours.value"
                as="p"
                multiline
                className="mt-2 text-[15px] leading-relaxed text-ink-2"
              />
            </div>
          </div>

          {/* ── form ────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-paper p-6 md:p-8">
              <Editable
                k="contact.form.title"
                as="h2"
                className="text-2xl font-semibold md:text-[1.75rem]"
              />
              <Editable
                k="contact.form.body"
                as="p"
                className="mt-3 text-[16px] leading-relaxed text-muted"
              />
              <div className="mt-8">
                <ContactForm locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── map ───────────────────────────────────────────────────────────── */}
      {hasOfficeMap && <Section tone="surface">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Editable
              k="contact.map.title"
              as="h2"
              className="text-2xl font-semibold md:text-[2rem]"
            />
            {address && (
              <p className="mt-3 flex items-start gap-2 text-[16px] leading-relaxed text-muted">
                <MapPin className="mt-1 size-4 shrink-0 text-faint" strokeWidth={1.7} aria-hidden />
                <span className="whitespace-pre-line">{address}</span>
              </p>
            )}
          </div>
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-line bg-paper px-5 text-sm font-medium transition-colors hover:border-ink hover:bg-surface"
          >
            <Editable k="contact.map.directions_label" />
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>

        <MapView
          points={[office]}
          center={{ lat, lng }}
          zoom={settings.map_zoom}
          className="h-[420px] w-full overflow-hidden rounded-2xl border border-line md:h-[480px]"
        />
      </Section>}

      <CtaBand />
    </>
  );
}
