import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SocialIcon, type SocialName } from "./SocialIcons";
import { getSettings } from "@/lib/content";
import { publicTabs } from "@/lib/site-scope";
import { getLocale } from "@/lib/request";
import { pick } from "@/lib/i18n";
import { Editable, EditableRich } from "@/components/editable/Editable";

export async function Footer() {
  const [locale, settings] = await Promise.all([
    getLocale(), getSettings(),
  ]);
  const links = publicTabs(locale).map((item) => ({ id: item.href, href: item.href, label_th: item.label, label_en: item.label, new_tab: false, column_key: "menu" }));
  const address = pick(settings, "address", locale);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${settings.map_lat},${settings.map_lng}`;

  const columns = [
    { key: "menu", titleKey: "global.footer.menu_title" },
  ];

  const socials = [
    { href: settings.facebook_url, name: "facebook" as SocialName, label: "Facebook" },
    { href: settings.youtube_url, name: "youtube" as SocialName, label: "YouTube" },
    { href: settings.linkedin_url, name: "linkedin" as SocialName, label: "LinkedIn" },
    { href: settings.x_url, name: "x" as SocialName, label: "X" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/risa-lockup.png" alt="RISA" className="h-11 w-auto" />
          <Editable
            k="global.footer.about_title"
            as="h2"
            className="mt-5 text-[13px] font-semibold uppercase tracking-wider text-ink"
          />
          <p className="mt-2 text-[15px] font-medium">{pick(settings, "org_name", locale)}</p>
          <EditableRich k="global.footer.about_body" className="mt-2 text-sm text-muted" />
          {socials.length > 0 && (
            <div className="mt-5">
              <Editable
                k="global.footer.social_title"
                as="p"
                className="mb-2.5 text-[13px] font-semibold uppercase tracking-wider text-ink"
              />
              <div className="flex gap-2">
                {socials.map(({ href, name, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-paper text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    <SocialIcon name={name} className="size-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {columns.map((col) => (
          <nav key={col.key} className="md:col-span-2" aria-label={col.key}>
            <Editable
              k={col.titleKey}
              as="h2"
              className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink"
            />
            <ul className="space-y-2">
              {links
                .filter((l) => l.column_key === col.key)
                .map((l) => (
                  <li key={l.id}>
                    <Link
                      href={l.href}
                      target={l.new_tab ? "_blank" : undefined}
                      className="text-sm text-muted transition-colors hover:text-accent"
                    >
                      {pick(l, "label", locale)}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-4">
          <Editable
            k="global.footer.address_title"
            as="h2"
            className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink"
          />
          <address className="space-y-2.5 text-sm not-italic text-muted">
            <p className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-faint" strokeWidth={1.7} />
              <span>{address}</span>
            </p>
            {settings.phone && (
              <p className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-faint" strokeWidth={1.7} />
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hover:text-accent">
                  {settings.phone}
                </a>
              </p>
            )}
            {settings.email && (
              <p className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-faint" strokeWidth={1.7} />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-accent">
                  {settings.email}
                </a>
              </p>
            )}
          </address>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-accent underline underline-offset-4"
          >
            <Editable k="global.footer.map_label" />
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page py-5">
          <Editable k="global.footer.copyright" as="p" className="text-xs text-faint" />
        </div>
      </div>
    </footer>
  );
}
