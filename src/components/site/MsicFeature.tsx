import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MsicFeature({ locale }: { locale: string }) {
  const th = locale === "th";
  return (
    <section className="msic-feature">
      <Link
        href={`/${locale}/activities/msic-2026`}
        className="msic-feature-photo group"
        aria-label={
          th
            ? "ดูภาพและรายละเอียดกิจกรรม MedSpark Innovation Competition"
            : "Explore MedSpark Innovation Competition event"
        }
      >
        {/* Viewfinder Corner HUD Brackets */}
        <span className="msic-corner msic-corner-tl" aria-hidden="true" />
        <span className="msic-corner msic-corner-tr" aria-hidden="true" />
        <span className="msic-corner msic-corner-bl" aria-hidden="true" />
        <span className="msic-corner msic-corner-br" aria-hidden="true" />

        {/* Technical crosshair target in top right */}
        <span className="msic-reticle" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="opacity-75"
          >
            <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <line x1="8" y1="0" x2="8" y2="4" stroke="currentColor" strokeWidth="1" />
            <line x1="8" y1="12" x2="8" y2="16" stroke="currentColor" strokeWidth="1" />
            <line x1="0" y1="8" x2="4" y2="8" stroke="currentColor" strokeWidth="1" />
            <line x1="12" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>

        {/* Inner Photograph Container with smooth zoom */}
        <div className="msic-photo-canvas aspect-[16/10] w-full overflow-hidden rounded bg-slate-900">
          <Image
            src="/images/msic-2026/award-group.jpg"
            alt={
              th
                ? "ภาพหมู่ในพิธีมอบรางวัล MSIC"
                : "Group photograph at the MSIC award ceremony"
            }
            width={1609}
            height={1017}
            sizes="(max-width: 800px) 100vw, (max-width: 1240px) 60vw, 660px"
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Cinematic glass sheen on hover */}
          <div className="msic-sheen" aria-hidden="true" />
        </div>
      </Link>

      <div className="msic-feature-copy">
        <h2 lang="en">MedSpark Innovation Competition</h2>
        <p>
          {th
            ? "พื้นที่สำหรับนำเสนอแนวคิด แลกเปลี่ยนมุมมอง และต่อยอดนวัตกรรมทางการแพทย์ของเยาวชน"
            : "A space for young people to present ideas, exchange perspectives and explore medical innovation."}
        </p>
        <Link href={`/${locale}/activities/msic-2026`}>
          {th ? "ชมภาพกิจกรรม" : "Explore the event"}{" "}
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
