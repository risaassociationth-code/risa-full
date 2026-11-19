import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { Editable } from "@/components/editable/Editable";
import { blockValue, getContentMap } from "@/lib/content";
import type { getHomepageContent } from "@/lib/homepage";
import { contentLanguage, formatDate, localePath, pick, type Locale } from "@/lib/i18n";
import { safePhotoUrl } from "@/lib/staff";
import styles from "./listings.module.css";

type Props = {
  locale: Locale;
  content: Awaited<ReturnType<typeof getHomepageContent>>;
};

export async function Listings({ locale, content }: Props) {
  const { activities, news, partners } = content;
  const blocks = await getContentMap();
  const th = locale === "th";
  const label = (key: string, fallback: string) =>
    blockValue(blocks.get(key), locale) ? <Editable k={key} /> : fallback;

  return (
    <>
      <section id="plans" aria-labelledby="plans-title" className={styles.plans}>
        <div className={`${styles.wrap} ${styles.plansLayout}`}>
          <div>
            <h2 id="plans-title" className={styles.heading}>
              {label("home.activities.title", th ? "กิจกรรมที่กำลังจะมาถึง" : "Upcoming activities")}
            </h2>
            <Link className={styles.button} href={localePath(locale, "/calendar")}>
              <CalendarDays size={18} aria-hidden />
              {th ? "ดูปฏิทินกิจกรรม" : "View the calendar"}
            </Link>
          </div>
          {activities.length ? (
            <ol className={styles.activityList}>
              {activities.map((item) => {
                const venue = pick(item, "venue", locale);
                const summary = pick(item, "excerpt", locale);
                return (
                  <li key={item.id}>
                    <div className={styles.date}>
                      <time dateTime={item.start_date}>{formatDate(item.start_date, locale)}</time>
                      {item.end_date && item.end_date > item.start_date && (
                        <> – <time dateTime={item.end_date}>{formatDate(item.end_date, locale)}</time></>
                      )}
                    </div>
                    <h3 className={styles.itemTitle} lang={contentLanguage(item, "title", locale)}>
                      <Link href={localePath(locale, `/activities/${item.slug}`)}>
                        {pick(item, "title", locale)} <ArrowRight size={18} aria-hidden />
                      </Link>
                    </h3>
                    {summary && <p className={styles.summary} lang={contentLanguage(item, "excerpt", locale)}>{summary}</p>}
                    {venue && <p className={styles.venue} lang={contentLanguage(item, "venue", locale)}>
                      <MapPin size={16} aria-hidden />{venue}
                    </p>}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={styles.planEmpty}>
              {th ? "ยังไม่มีกิจกรรมที่ประกาศวันจัดครั้งถัดไปในรายการนี้" : "No upcoming activity dates are listed here yet."}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="news-title" className={styles.news}>
        <div className={styles.wrap}>
          <div className={styles.newsHeading}>
            <h2 id="news-title" className={styles.heading}>
              {label("home.news.title", th ? "ข่าวสารล่าสุด" : "Latest news")}
            </h2>
            <Link className={styles.textLink} href={localePath(locale, "/news")}>
              {label("home.news.link_label", th ? "ดูข่าวทั้งหมด" : "All news")}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
          {news.length ? (
            <ul className={styles.newsList}>
              {news.map((item) => (
                <li key={item.id}>
                  {item.published_at && <time className={styles.date} dateTime={item.published_at}>
                    {formatDate(item.published_at, locale)}
                  </time>}
                  <div className={styles.newsCopy}>
                    <h3 lang={contentLanguage(item, "title", locale)} className={styles.itemTitle}>
                      <Link href={localePath(locale, `/news/${item.slug}`)}>{pick(item, "title", locale)}</Link>
                    </h3>
                    {item.sourceUrl && <a className={styles.source} href={item.sourceUrl}>
                      {th ? "จากคลังข่าว MMS Hub" : "From the MMS Hub archive"}
                      <ArrowUpRight size={14} aria-hidden />
                    </a>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>{th ? "ยังไม่มีข่าวเผยแพร่" : "No news has been published yet."}</p>}
        </div>
      </section>

      <section aria-labelledby="partners-title" className={styles.partners}>
        <div className={`${styles.wrap} ${styles.partnerLayout}`}>
          <h2 id="partners-title" className={styles.heading}>
            {label("home.partners.title", th ? "เครือข่ายและพันธมิตร" : "Network & partners")}
          </h2>
          {partners.length ? (
            <ul className={styles.partnerList}>
              {partners.map((partner) => {
                const logo = safePhotoUrl(partner.logo_url);
                const website = /^https?:\/\//i.test(partner.url) && safePhotoUrl(partner.url);
                const identity = (
                  <>
                    {logo && (
                      // Published partner logos can be hosted outside the site's image domains.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" loading="lazy" width={128} height={56} />
                    )}
                    <span>{partner.name}</span>
                  </>
                );
                return <li key={partner.id}>
                  {website ? <a href={website}>{identity}<ArrowUpRight size={16} aria-hidden /></a> : identity}
                </li>;
              })}
            </ul>
          ) : (
            <p className={styles.empty}>
              {th ? "ยังไม่มีรายชื่อองค์กรที่เผยแพร่ในส่วนนี้" : "The association has yet to publish its partner list."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
