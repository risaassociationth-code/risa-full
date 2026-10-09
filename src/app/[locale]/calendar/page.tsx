import type { Metadata } from "next";
import { getLocale } from "@/lib/request";
import { getCalendarEvents } from "@/lib/queries";
import { CalendarSection } from "@/components/site/CalendarSection";
import { Section } from "@/components/site/Section";

export async function generateMetadata(): Promise<Metadata> {
  const th = (await getLocale()) === "th";
  return { title: th ? "ปฏิทิน" : "Calendar" };
}

export default async function CalendarPage() {
  const [locale, events] = await Promise.all([getLocale(), getCalendarEvents()]);
  const th = locale === "th";
  return <Section>
    <div className="mb-12 border-b border-line pb-10 md:pb-14">
      <p className="mb-5 text-xs font-medium uppercase tracking-[.24em] text-accent">RISA · {th ? "กิจกรรมประจำปี" : "Yearly events"}</p>
      <h1 className="text-4xl font-normal tracking-tight md:text-6xl">{th ? "ปฏิทิน" : "Calendar"}</h1>
    </div>
    {events.length ? <CalendarSection events={events} locale={locale} />
      : <p className="text-muted">{th ? "ยังไม่มีกิจกรรม" : "No events yet."}</p>}
  </Section>;
}
