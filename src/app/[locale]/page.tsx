import { ArrowDown, ArrowRight, ArrowUpRight, Images, MessagesSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EditableRich } from "@/components/editable/Editable";
import { blockValue, getContentMap } from "@/lib/content";
import { getHomepageContent } from "@/lib/homepage";
import { contentLanguage, formatDate, localePath, pick } from "@/lib/i18n";
import { getLocale } from "@/lib/request";
import { Listings } from "./_home/Listings";
import styles from "./_home/home.module.css";

export default async function HomePage() {
  const [locale, content, blocks] = await Promise.all([getLocale(), getHomepageContent(), getContentMap()]);
  const vision = blockValue(blocks.get("about.vision.body"), locale);
  const th = locale === "th";
  const gallery = localePath(locale, "/activities/msic-2026");
  const { networkStory, msicProgrammeUrl } = content;

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-vision">
        <div className={styles.heroGrid}>
          <div className={styles.lead}>
            <h1 id="home-vision">
              {th ? "เชื่อมงานวิจัย" : "Connecting research"}
              <span>{th ? "กับอุตสาหกรรมไทย" : "with Thai industry"}</span>
            </h1>
            {vision && <div className={styles.vision}>
              <strong>{th ? "วิสัยทัศน์ของ RISA" : "RISA’s vision"}</strong>
              <EditableRich k="about.vision.body" />
            </div>}
            <div className={styles.actions}>
              <a href="#field-story" className={styles.primary}>
                {th ? "เรื่องเล่าจากกิจกรรม" : "Explore the field story"} <ArrowDown size={17} aria-hidden />
              </a>
              <a href="#plans" className={styles.plansLink}>
                {th ? "กิจกรรมที่กำลังจะมาถึง" : "Upcoming activities"} <ArrowRight size={16} aria-hidden />
              </a>
            </div>
          </div>
          <figure className={styles.heroFigure}>
            <div className={styles.heroImage}>
              <Image
                src="/images/msic-2026/student-presentation.jpg"
                alt={th ? "นักเรียนสามคนบนเวที MedSpark คนหนึ่งถือไมโครโฟนนำเสนอแนวคิด" : "Three students on the MedSpark stage, one presenting with a microphone."}
                width={1567} height={1045} sizes="(max-width: 800px) 93vw, (max-width: 1400px) 49vw, 660px"
                fetchPriority="high" loading="eager"
              />
            </div>
            <figcaption>
              <span className={styles.captionMark} aria-hidden />
              <span>{th ? "นักเรียนนำเสนอแนวคิดบนเวที MedSpark" : "Student presentations at MedSpark"}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="field-story" className={styles.field} aria-labelledby="field-title">
        <div className={styles.fieldGrid}>
          <div className={styles.fieldText}>
            <h2 id="field-title">{th ? "จากแนวคิดเครื่องมือแพทย์ สู่เวที MedSpark" : "Medical-device ideas take the stage at MedSpark"}</h2>
            <p>{th
              ? "ที่งาน MedSpark Innovation Competition นักเรียนขึ้นเวทีนำเสนอแนวคิดและแลกเปลี่ยนความคิดเห็นกับผู้ร่วมงาน ภาพกิจกรรมบันทึกเรื่องราวตั้งแต่การนำเสนอไปจนถึงพิธีมอบรางวัล"
              : "At the MedSpark Innovation Competition, students presented their ideas and discussed them with the audience. The photographs follow the event from the presentations to the awards."}</p>
            {msicProgrammeUrl && <p className={styles.programme}>
              {th ? "โจทย์การประกวดครั้งนี้คือเครื่องมือแพทย์ชนิดบุกรุกน้อย " : "The competition focused on minimally invasive medical devices. "}
              <a href={msicProgrammeUrl}>{th ? "ดูกำหนดการจาก MMS Hub" : "Competition programme from MMS Hub"} <ArrowUpRight size={13} aria-hidden /></a>
            </p>}
            <Link className={styles.storyLink} href={gallery}>
              <Images size={19} aria-hidden /> {th ? "ชมภาพและอ่านเรื่องราว" : "Read the photo story"} <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <figure className={styles.storyFigure}>
            <Image src="/images/msic-2026/discussion.jpg"
              alt={th ? "ผู้ร่วมงานถือไมโครโฟนแลกเปลี่ยนความคิดเห็นจากที่นั่งด้านหน้า" : "A participant speaks into a microphone from the front row."}
              width={2048} height={1365} sizes="(max-width: 800px) 90vw, (max-width: 1400px) 43vw, 600px" />
            <figcaption>{th ? "ช่วงแลกเปลี่ยนความคิดเห็นในงาน MedSpark" : "A conversation with the audience at MedSpark."}</figcaption>
          </figure>
        </div>

        {networkStory && (
          <aside className={styles.network} aria-labelledby="network-title">
            <div className={styles.networkHeading}>
              <MessagesSquare size={24} aria-hidden />
              <h3 id="network-title">{th ? "เครือข่ายผู้เชี่ยวชาญด้านเครื่องมือแพทย์" : "Medical-device expert networks"}</h3>
            </div>
            <div>
              <Link className={styles.networkLink} href={localePath(locale, `/news/${networkStory.slug}`)}>
                <span lang={contentLanguage(networkStory, "title", locale)}>{pick(networkStory, "title", locale)}</span>
                <ArrowRight size={17} aria-hidden />
              </Link>
              <p className={styles.source}>
                {networkStory.sourceUrl && <a href={networkStory.sourceUrl}>{th ? "จากคลังข่าว MMS Hub" : "From the MMS Hub archive"} <ArrowUpRight size={13} aria-hidden /></a>}
                {networkStory.published_at && <time dateTime={networkStory.published_at}>{formatDate(networkStory.published_at, locale)}</time>}
              </p>
            </div>
          </aside>
        )}
      </section>
      <Listings locale={locale} content={content} />
    </div>
  );
}
