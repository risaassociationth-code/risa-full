import Link from "next/link";
import { CurtainEntrance } from "./CurtainEntrance";
import { getContentMap, blockValue, getNav, getSettings } from "@/lib/content";
import { getLocale } from "@/lib/request";
import { localePath, pick, t } from "@/lib/i18n";
import { HeaderNav, type NavNode } from "./HeaderNav";
import { LocaleSwitch } from "./LocaleSwitch";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  const [locale, nav, settings, map] = await Promise.all([
    getLocale(), getNav(), getSettings(), getContentMap(),
  ]);
  const L = (href: string) => localePath(locale, href);

  const items: NavNode[] = nav.map((n) => ({
    label: pick(n, "label", locale),
    href: n.href ? L(n.href) : "",
    newTab: n.new_tab,
    children: n.children.map((c) => ({
      label: pick(c, "label", locale),
      href: c.href ? L(c.href) : "",
      newTab: c.new_tab,
      children: [],
    })),
  }));

  const ctaLabel = blockValue(map.get("global.header.cta_label"), locale);
  const ctaHref = blockValue(map.get("global.header.cta_href"), locale);
  const orgName = pick(settings, "org_name", locale);

  return (
    <CurtainEntrance locale={locale}>
    <header className="sticky top-0 z-[60] border-b border-line bg-paper/92 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        {t(locale, "skipToContent")}
      </a>
      <div className="container-page flex h-16 items-center gap-3">
        <Link href={L("/")} scroll={false} className="flex min-w-0 shrink-0 items-center gap-3" aria-label={orgName}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logo_url || "/risa-wordmark.png"}
            alt="RISA"
            className="h-10 w-auto max-w-[140px] shrink-0 object-contain md:h-14 md:max-w-[180px]"
          />
          <span className="hidden min-w-0 border-l border-line pl-3 text-[11px] leading-tight text-muted min-[1440px]:block">
            <span className="line-clamp-2 max-w-[15rem]">{orgName}</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <HeaderNav
            items={items}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref.startsWith("/") ? L(ctaHref) : ctaHref}
            menuLabel={t(locale, "menu")}
          />
          <ThemeToggle locale={locale} />
          <LocaleSwitch current={locale} />
        </div>
      </div>
    </header>
    </CurtainEntrance>
  );
}
