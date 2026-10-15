import Link from "next/link";
import { ArrowRight, CalendarDays, Mail } from "lucide-react";
import { getLocale } from "@/lib/request";
import { localePath } from "@/lib/i18n";

export async function CtaBand() {
  const locale = await getLocale();
  const th = locale === "th";
  const L = (h: string) => (h.startsWith("/") ? localePath(locale, h) : h);

  return (
    <section className="risa-cta-band bg-ink text-white">
      <div className="container-page flex flex-col gap-8 py-14 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold md:text-[1.75rem]">
            {th ? "ร่วมขับเคลื่อนงานวิจัยและมาตรฐานอุตสาหกรรมกับ RISA" : "Advance Research & Industrial Standards with RISA"}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/70">
            {th
              ? "ติดตามกำหนดการกิจกรรมประจำปี โครงการประกวดนวัตกรรม หรือติดต่อประสานความร่วมมือกับสมาคม"
              : "Explore our annual event schedule, innovation competitions, or get in touch for research collaboration."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href={L("/calendar")}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 text-[15px] font-medium text-accent-ink transition-[filter] hover:brightness-110"
          >
            <CalendarDays className="size-4" />
            {th ? "ปฏิทินกิจกรรม" : "Event Calendar"}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={L("/activities")}
            className="inline-flex h-12 items-center rounded-lg border border-white/25 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
          >
            {th ? "กิจกรรมทั้งหมด" : "All Activities"}
          </Link>
          <a
            href="mailto:risathailand@gmail.com"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
          >
            <Mail className="size-4" />
            {th ? "ติดต่อเรา" : "Contact Us"}
          </a>
        </div>
      </div>
    </section>
  );
}
