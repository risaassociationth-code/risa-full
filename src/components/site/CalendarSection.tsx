import type { CalendarEvent } from "@/lib/queries";
import { pick, type Locale } from "@/lib/i18n";

export function CalendarSection({ events, locale }: { events: CalendarEvent[]; locale: Locale }) {
  return (
    <ol className="flex flex-col gap-10">
      {events.map(e => {
        const body = pick(e, "body", locale);
        const dateText = pick(e, "approx_date", locale);
        return (
          <li key={e.id} className="flex flex-col sm:flex-row gap-6 md:gap-10 group">
            {/* The Calendar Page Graphic */}
            <div
              className="flex-shrink-0 w-full sm:w-40 rounded-2xl border border-line bg-surface overflow-hidden flex flex-col shadow-sm transition-transform duration-300 group-hover:-translate-y-1"
              aria-hidden="true"
            >
               {/* Calendar Header (Binding) */}
               <div className="h-10 bg-accent/5 border-b border-line flex items-center justify-center">
                 {/* Punch holes / Ring binder metaphor */}
                 <div className="flex gap-8">
                   <div className="w-2.5 h-2.5 rounded-full bg-surface shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-line/50"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-surface shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-line/50"></div>
                 </div>
               </div>
               {/* Calendar Body (Date) */}
               <div className="flex-1 flex items-center justify-center p-5 text-center min-h-[6rem]">
                 <p className="text-sm md:text-base font-bold text-accent leading-tight">
                   {dateText}
                 </p>
               </div>
            </div>

            {/* Event Info */}
            <div className="flex-1 sm:pt-4 border-b border-line pb-10 sm:border-0 sm:pb-0">
              <span className="sr-only">{dateText}</span>
              <h2 className="text-xl md:text-2xl font-medium text-ink">{pick(e, "title", locale)}</h2>
              {body && <p className="mt-4 whitespace-pre-line text-sm md:text-base leading-relaxed text-muted max-w-2xl">{body}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
