import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/request";

export const metadata = { title: "MedSpark Innovation Competition | RISA" };

const photos = [
  ["student-presentation", "การนำเสนอแนวคิดของนักเรียน", "Students presenting their ideas"],
  ["discussion", "การแลกเปลี่ยนความคิดเห็นระหว่างกิจกรรม", "A participant contributing to the discussion"],
  ["event-room", "บรรยากาศภายในงาน", "The audience and stage during the event"],
  ["first-prize", "การมอบรางวัลชนะเลิศ", "First-prize award presentation"],
  ["stage-group", "ภาพหมู่บนเวที", "Group photograph on the event stage"],
];

export default async function MsicPage() {
  const locale = await getLocale();
  const th = locale === "th";
  return <article className="container-page msic-story">
    <Link href={`/${locale}/activities`} className="msic-back">← {th ? "กิจกรรมทั้งหมด" : "All activities"}</Link>
    <header>
      <h1>MedSpark Innovation Competition</h1>
      <p className="msic-summary">{th ? "จากการนำเสนอแนวคิดสู่การแลกเปลี่ยนความคิดเห็นและการมอบรางวัล — ภาพบรรยากาศเวทีนวัตกรรมทางการแพทย์สำหรับเยาวชน" : "From student presentations to discussion and awards — moments from a medical-innovation competition for young people."}</p>
    </header>
    <figure className="msic-cover">
      <Image src="/images/msic-2026/award-group.jpg" alt={th ? "ผู้ร่วมงานในพิธีมอบรางวัล MSIC" : "Participants at the MSIC award ceremony"} width={1609} height={1017} priority sizes="(max-width: 1360px) 100vw, 1296px" />
      <figcaption>{th ? "ภาพหมู่ในพิธีมอบรางวัล" : "Together at the award ceremony"}</figcaption>
    </figure>
    <section aria-label={th ? "ภาพกิจกรรม" : "Event photographs"} className="msic-gallery">
      {photos.map(([file, thai, english]) => <figure key={file}>
        <Image src={`/images/msic-2026/${file}.jpg`} alt={th ? thai : english} width={2048} height={1365} sizes="(max-width: 640px) 100vw, 50vw" />
        <figcaption>{th ? thai : english}</figcaption>
      </figure>)}
    </section>
  </article>;
}
