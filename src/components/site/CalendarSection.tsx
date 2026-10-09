import { CalendarDays } from "lucide-react";
import type { CalendarEvent } from "@/lib/queries";
import { pick } from "@/lib/i18n";

export function CalendarSection({ events, locale }: { events: CalendarEvent[], locale: string }) {
  const th = locale === "th";
  return (
    <section className="container-page minimal-calendar-section my-16">
      <div className="minimal-updates-heading mb-8">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          <CalendarDays size={24} className="text-blue-500" />
          {th ? "ปฏิทินกิจกรรม RISA" : "RISA Event Calendar"}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e, index) => (
          <div key={e.id} className="minimal-calendar-card p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
              {pick(e, "approx_date", locale)}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              {pick(e, "title", locale)}
            </h3>
            {pick(e, "body", locale) && (
              <div className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">
                {pick(e, "body", locale)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
