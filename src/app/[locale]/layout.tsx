import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContentMap, blockValue, getSettings } from "@/lib/content";
import { isLocale } from "@/lib/i18n";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export async function generateStaticParams() {
  return [{ locale: "th" }, { locale: "en" }];
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const [settings, map] = await Promise.all([getSettings(), getContentMap()]);
  const loc = isLocale(locale) ? locale : "th";
  const name = loc === "th" ? settings.org_name_th : settings.org_name_en;
  return {
    title: {
      default: blockValue(map.get("home.seo.title"), loc) || name,
      template: `%s · ${settings.org_short}`,
    },
    description: blockValue(map.get("home.seo.description"), loc),
    icons: { icon: settings.favicon_url || "/favicon.ico" },
    openGraph: { siteName: name, locale: loc === "th" ? "th_TH" : "en_US", type: "website" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div lang={locale} className="risa-public flex min-h-full flex-col">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
