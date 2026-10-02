import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MsicFeature({ locale }: { locale: string }) {
  const th = locale === "th";
  return <section className="msic-feature">
    <Link href={`/${locale}/activities/msic-2026`} className="msic-feature-photo">
      <Image src="/images/msic-2026/award-group.jpg" alt={th ? "ภาพหมู่ในพิธีมอบรางวัล MSIC" : "Group photograph at the MSIC award ceremony"} width={1609} height={1017} sizes="(max-width: 800px) 100vw, (max-width: 1240px) 60vw, 660px" loading="eager" fetchPriority="high" />
    </Link>
    <div className="msic-feature-copy">
      <p className="minimal-eyebrow">{th ? "ภาพกิจกรรมที่ผ่านมา · MSIC" : "EVENT HIGHLIGHT · MSIC"}</p>
      <h2 lang="en">MedSpark Innovation Competition</h2>
      <p>{th ? "พื้นที่สำหรับนำเสนอแนวคิด แลกเปลี่ยนมุมมอง และต่อยอดนวัตกรรมทางการแพทย์ของเยาวชน" : "A space for young people to present ideas, exchange perspectives and explore medical innovation."}</p>
      <Link href={`/${locale}/activities/msic-2026`}>{th ? "ชมภาพกิจกรรม" : "Explore the event"} <ArrowRight size={18} aria-hidden /></Link>
    </div>
  </section>;
}
