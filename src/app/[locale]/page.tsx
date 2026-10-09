import Link from "next/link";
import { MsicFeature } from "@/components/site/MsicFeature";
import { ArrowRight, CalendarDays } from "lucide-react";
import { getLocale } from "@/lib/request";
import { contentLanguage, localePath, pick } from "@/lib/i18n";
import { formatCalendarDate } from "@/lib/calendar-date";
import { getSettings } from "@/lib/content";
import { getNews, getUpcomingActivities, getCalendarEvents } from "@/lib/queries";
import { Editable, EditableRich } from "@/components/editable/Editable";
import { CalendarSection } from "@/components/site/CalendarSection";

export default async function HomePage() {
  const [locale, news, activities, settings, calendarEvents] = await Promise.all([
    getLocale(), getNews(4), getUpcomingActivities(2), getSettings(), getCalendarEvents()
  ]);
  const L = (href: string) => href.startsWith("/") ? localePath(locale, href) : href;
  const featured = news[0];
  const latestNews = news.slice(1);
  const th = locale === "th";
  return (
    <div className="minimal-home">
      <section className="container-page risa-introduction">
        <div><p className="minimal-eyebrow">RISA</p><h1>{pick(settings, "org_name", locale)}</h1></div>
        <div className="risa-mission"><EditableRich k="global.footer.about_body" /><Link href={L("/activities")} className="risa-gold-link"><Editable k="home.hero.secondary_label" /><ArrowRight size={20} aria-hidden /></Link></div>
      </section>
      <div className="container-page risa-event-first"><MsicFeature locale={locale} /></div>
      <section className="minimal-hero risa-featured-news">
        <div className="minimal-hero-copy">
          <p className="minimal-eyebrow">{featured?.slug.startsWith("mms-hub-") ? (th ? "จากเครือข่าย · MMS Hub" : "PARTNER ARCHIVE · MMS Hub") : (th ? "ข่าวสารล่าสุด · RISA" : "LATEST NEWS · RISA")}</p>
          <h2 lang={featured ? contentLanguage(featured, "title", locale) : locale}>{featured ? pick(featured, "title", locale) : th ? "ข่าวสารจาก RISA" : "News from RISA"}</h2>
          <p className="minimal-intro" lang={featured ? contentLanguage(featured, "excerpt", locale) : locale}>{featured ? pick(featured, "excerpt", locale) : th ? "ติดตามข่าวสารและความเคลื่อนไหวของสมาคมได้เร็ว ๆ นี้" : "Association news and updates are coming soon."}</p>
          {featured?.published_at && <p className="minimal-news-date mt-5"><time dateTime={featured.published_at}>{formatCalendarDate(featured.published_at, th ? "th-TH" : "en-GB")}</time></p>}
          <Link href={L(featured ? `/news/${featured.slug}` : "/news")} className="minimal-hero-link">
            <span className="minimal-circle"><ArrowRight size={22} aria-hidden /></span>
            <span>{featured ? (th ? "อ่านข่าวต่อ" : "Read the story") : (th ? "ดูข่าวทั้งหมด" : "View all news")}</span>
          </Link>
        </div>
        {featured?.cover_url ? <Link href={L(`/news/${featured.slug}`)} className="minimal-news-cover">
          {/* The admin media library accepts external image URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featured.cover_url} alt={pick(featured, "title", locale)} fetchPriority="high" />
        </Link> : <div className="minimal-news-panel">
          <p className="minimal-eyebrow">{th ? "ข่าวและความเคลื่อนไหว" : "NEWS & UPDATES"}</p>
          <span className="minimal-news-word" aria-hidden>{th ? "ข่าวสาร" : "News"}</span>
          <Link href={L("/news")}>{th ? "ดูข่าวทั้งหมด" : "View all news"} <ArrowRight size={20} aria-hidden /></Link>
        </div>}
      </section>
      <section className="container-page minimal-updates">
        <div className="minimal-updates-heading"><Editable k="home.news.title" as="h2" /><Link href={L("/news")}><Editable k="home.news.link_label" /> <ArrowRight size={16} aria-hidden /></Link></div>
        {latestNews.length ? <div className="minimal-news-list">{latestNews.map(item => <Link key={item.id} href={L(`/news/${item.slug}`)} className="minimal-news-item"><span className="minimal-news-date">{item.published_at ? formatCalendarDate(item.published_at, th ? "th-TH" : "en-GB", "short") : ""}</span><h3 lang={contentLanguage(item, "title", locale)}>{pick(item, "title", locale)}</h3><ArrowRight size={18} aria-hidden /></Link>)}</div> : !featured && <p className="text-muted">{locale === "th" ? "ติดตามข่าวสารจาก RISA ได้เร็ว ๆ นี้" : "Updates from RISA are coming soon."}</p>}
        {activities.length > 0 && <div className="minimal-activities"><Link href={L("/activities")} className="minimal-activity-label"><Editable k="home.activities.title" /></Link>{activities.map(item => <Link key={item.id} href={L(`/activities/${item.slug}`)}>{pick(item, "title", locale)} <ArrowRight size={16} aria-hidden /></Link>)}</div>}
      </section>
      {calendarEvents.length > 0 && <CalendarSection events={calendarEvents} locale={locale} />}
    </div>
  );
}
