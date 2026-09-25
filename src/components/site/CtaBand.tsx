import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale } from "@/lib/request";
import { localePath } from "@/lib/i18n";

export async function CtaBand() {
  const locale = await getLocale();
  const th = locale === "th";
  const L = (h: string) => (h.startsWith("/") ? localePath(locale, h) : h);
  const primaryHref = "/news";
  const secondaryHref = "/activities";

  return (
    <section className="bg-ink text-white">
      <div className="container-page flex flex-col gap-8 py-14 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold md:text-[1.75rem]">{th ? "ติดตามความเคลื่อนไหวของ RISA" : "Keep up with RISA"}</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/70">{th ? "ข่าวสารและกิจกรรมล่าสุดจากเรา" : "Our latest news and activities"}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href={L(primaryHref)}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 text-[15px] font-medium text-accent-ink transition-[filter] hover:brightness-110"
          >
            {th ? "ข่าวสาร" : "News"}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={L(secondaryHref)}
            className="inline-flex h-12 items-center rounded-lg border border-white/25 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
          >
            {th ? "กิจกรรม" : "Activities"}
          </Link>
        </div>
      </div>
    </section>
  );
}
