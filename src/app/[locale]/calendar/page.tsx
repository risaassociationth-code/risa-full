import { getLocale } from "@/lib/request";
import { getCalendarEvents } from "@/lib/queries";
import { CalendarSection } from "@/components/site/CalendarSection";


export default async function CalendarPage() {
  const [locale, events] = await Promise.all([getLocale(), getCalendarEvents()]);
  return (
    <div className="pt-32 pb-20">
      <div className="container-page">
        <h1 className="text-4xl font-bold mb-4">{locale === 'th' ? 'ปฏิทินกิจกรรม RISA' : 'RISA Event Calendar'}</h1>
        <p className="text-lg text-slate-500 mb-12">{locale === 'th' ? 'กำหนดการและกิจกรรมที่กำลังจะเกิดขึ้น' : 'Upcoming schedules and events.'}</p>
      </div>
      <CalendarSection events={events} locale={locale} />
    </div>
  );
}
