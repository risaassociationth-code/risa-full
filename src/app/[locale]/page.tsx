import Link from "next/link";
import { MsicFeature } from "@/components/site/MsicFeature";
import { ArrowRight } from "lucide-react";
import { getLocale } from "@/lib/request";
import { localePath, pick } from "@/lib/i18n";
import { getNews, getUpcomingActivities } from "@/lib/queries";
import { Editable } from "@/components/editable/Editable";

export default async function HomePage() {
  const [locale, news, activities] = await Promise.all([
    getLocale(), getNews(3), getUpcomingActivities(2),
  ]);
  const L = (href: string) => href.startsWith("/") ? localePath(locale, href) : href;
  const featured = news[0];
  const th = locale === "th";
  const features = [
    { href: "/activities", number: "", th: "กิจกรรม", en: "Activities", subTh: "เชื่อมโยงงานวิจัยกับภาคอุตสาหกรรม", subEn: "Connecting research with industry" },
  ];
  return (
    <div className="minimal-home">
      <section className="minimal-hero">
        <div className="minimal-hero-copy">
          <p className="minimal-eyebrow">{th ? "ข่าวสารล่าสุด · RISA" : "LATEST NEWS · RISA"}</p>
          <h1>{featured ? pick(featured, "title", locale) : th ? "ข่าวสารจาก RISA" : "News from RISA"}</h1>
          <p className="minimal-intro">{featured ? pick(featured, "excerpt", locale) : th ? "ติดตามข่าวสารและความเคลื่อนไหวของสมาคมได้เร็ว ๆ นี้" : "Association news and updates are coming soon."}</p>
          {featured?.published_at && <p className="minimal-news-date mt-5"><time dateTime={featured.published_at}>{new Intl.DateTimeFormat(th ? "th-TH" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(featured.published_at))}</time></p>}
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
      <section className="container-page minimal-features" style={{ gridTemplateColumns: "1fr" }} aria-label={locale === "th" ? "กิจกรรม" : "Activities"}>
        {features.map((feature) => (
          <div className="minimal-feature" key={feature.href}>
            <div className="minimal-feature-image" style={{ backgroundImage: "url('/images/msic-2026/student-presentation.jpg')", backgroundSize: "cover", backgroundPosition: "center", filter: "none" }} aria-hidden />
            <Link href={L(feature.href)}>
            <div className="minimal-feature-heading"><span>{feature.number}</span><h2>{locale === "th" ? feature.th : feature.en}</h2><ArrowRight size={18} aria-hidden /></div>
            <p>{locale === "th" ? feature.subTh : feature.subEn}</p>
            </Link>
          </div>
        ))}
      </section>
      <section className="container-page minimal-updates">
        <MsicFeature locale={locale} />
        <div className="minimal-updates-heading"><Editable k="home.news.title" as="h2" /><Link href={L("/news")}><Editable k="home.news.link_label" /> <ArrowRight size={16} aria-hidden /></Link></div>
        {news.length ? <div className="minimal-news-list">{news.map(item => <Link key={item.id} href={L(`/news/${item.slug}`)} className="minimal-news-item"><span className="minimal-news-date">{item.published_at ? new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.published_at)) : ""}</span><h3>{pick(item, "title", locale)}</h3><ArrowRight size={18} aria-hidden /></Link>)}</div> : <p className="text-muted">{locale === "th" ? "ติดตามข่าวสารจาก RISA ได้เร็ว ๆ นี้" : "Updates from RISA are coming soon."}</p>}
        {activities.length > 0 && <div className="minimal-activities"><Link href={L("/activities")} className="minimal-activity-label"><Editable k="home.activities.title" /></Link>{activities.map(item => <Link key={item.id} href={L(`/activities/${item.slug}`)}>{pick(item, "title", locale)} <ArrowRight size={16} aria-hidden /></Link>)}</div>}
      </section>
    </div>
  );
}
