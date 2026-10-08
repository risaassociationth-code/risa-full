import type { Metadata } from "next";
import { ExternalLink, MapPin } from "lucide-react";
import { content, getSettings } from "@/lib/content";
import { getLocale } from "@/lib/request";
import { pick, t } from "@/lib/i18n";
import { getLocations } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Editable } from "@/components/editable/Editable";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { EmptyState } from "@/components/site/EmptyState";
import { CtaBand } from "@/components/site/CtaBand";
import { MapView, type MapPoint } from "@/components/site/MapView";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: await content("map.seo.title", locale),
    description: await content("map.seo.description", locale),
  };
}

/**
 * Legend order. Each swatch class must stay in step with `KIND_COLOR` in
 * components/site/MapView.tsx, which paints the markers themselves.
 */
const KINDS = [
  { kind: "office", titleKey: "map.kind.office", swatch: "bg-accent" },
  { kind: "branch", titleKey: "map.kind.branch", swatch: "bg-ink" },
  { kind: "partner", titleKey: "map.kind.partner", swatch: "bg-muted" },
  { kind: "member", titleKey: "map.kind.member", swatch: "bg-faint" },
] as const;

const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export default async function MapPage() {
  const [locale, locations, settings] = await Promise.all([
    getLocale(),
    getLocations(),
    getSettings(),
  ]);

  const directionsLabel = await content("contact.map.directions_label", locale);

  const points: MapPoint[] = locations.map((row) => ({
    id: row.id,
    name: pick(row, "name", locale),
    address: pick(row, "address", locale),
    lat: row.lat,
    lng: row.lng,
    kind: row.kind,
    url: row.url || undefined,
  }));

  return (
    <>
      <PageHero
        eyebrowKey="map.hero.eyebrow"
        titleKey="map.hero.title"
        subtitleKey="map.hero.subtitle"
      />

      <Section>
        {/* ── legend ──────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
          <Editable
            k="map.legend.title"
            as="h2"
            className="text-[13px] font-semibold uppercase tracking-[0.14em] text-faint"
          />
          <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
            {KINDS.map((entry) => (
              <li key={entry.kind} className="flex items-center gap-2 text-[15px] text-ink-2">
                <span
                  aria-hidden
                  className={cn("size-2.5 shrink-0 rounded-full", entry.swatch)}
                />
                <Editable k={entry.titleKey} />
                <span className="font-mono text-xs text-faint">
                  {locations.filter((row) => row.kind === entry.kind).length}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {settings.map_lat != null && settings.map_lng != null && <MapView
          points={points}
          center={{ lat: settings.map_lat, lng: settings.map_lng }}
          zoom={settings.map_zoom}
          className="h-[26rem] md:h-[34rem]"
        />}
      </Section>

      {/* ── the same information as text, for readers without the map ─────── */}
      <Section tone="surface">
        {locations.length === 0 ? (
          <EmptyState label={t(locale, "noResults")} />
        ) : (
          <div className="space-y-12">
            {KINDS.map((entry) => {
              const group = locations.filter((row) => row.kind === entry.kind);
              if (group.length === 0) return null;
              return (
                <div key={entry.kind}>
                  <h2 className="mb-5 flex items-center gap-2.5 border-b border-line pb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-faint">
                    <span
                      aria-hidden
                      className={cn("size-2.5 shrink-0 rounded-full", entry.swatch)}
                    />
                    <Editable k={entry.titleKey} />
                    <span className="ml-auto font-mono text-xs normal-case tracking-normal">
                      {group.length}
                    </span>
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((row) => {
                      const name = pick(row, "name", locale);
                      const address = pick(row, "address", locale);
                      return (
                        <li
                          key={row.id}
                          className="flex flex-col rounded-2xl border border-line bg-paper p-5"
                        >
                          <h3 className="text-[17px] font-semibold">{name}</h3>
                          {address && (
                            <p className="mt-1.5 text-sm leading-relaxed text-muted">{address}</p>
                          )}
                          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                            <a
                              href={directionsUrl(row.lat, row.lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                            >
                              <MapPin className="size-3.5 shrink-0" strokeWidth={1.7} />
                              {directionsLabel}
                            </a>
                            {row.url && (
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted hover:text-ink hover:underline"
                              >
                                <ExternalLink className="size-3.5 shrink-0" strokeWidth={1.7} />
                                <span className="truncate">
                                  {row.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                                </span>
                              </a>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <CtaBand />
    </>
  );
}
