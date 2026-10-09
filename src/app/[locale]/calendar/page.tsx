import { getLocale } from "@/lib/request";
import { getCalendarEvents } from "@/lib/queries";
import { CalendarSection } from "@/components/site/CalendarSection";
import { pick } from "@/lib/i18n";
import { Topbar } from "@/components/site/Topbar";
import { Footer } from "@/components/site/Footer";

export default async function CalendarPage() {
  const [locale, events] = await Promise.all([getLocale(), getCalendarEvents()]);
  return (
    <>
      <Topbar locale={locale} />
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-page">
          <h1 className="text-4xl font-bold mb-4">{locale === 'th' ? 'ปฏิทินกิจกรรม RISA' : 'RISA Event Calendar'}</h1>
          <p className="text-lg text-slate-500 mb-12">{locale === 'th' ? 'กำหนดการและกิจกรรมที่กำลังจะเกิดขึ้น' : 'Upcoming schedules and events.'}</p>
        </div>
        <CalendarSection events={events} locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
