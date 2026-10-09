import type { CalendarEvent } from "@/lib/queries";
import { pick, type Locale } from "@/lib/i18n";

export function CalendarSection({ events, locale }: { events: CalendarEvent[]; locale: Locale }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {events.map(e => {
        const body = pick(e, "body", locale);
        return (
          <li key={e.id} className="grid gap-2 py-7 md:grid-cols-[14rem_1fr] md:gap-10">
            <p className="text-sm font-medium text-accent">{pick(e, "approx_date", locale)}</p>
            <div>
              <h2 className="text-xl text-ink md:text-2xl">{pick(e, "title", locale)}</h2>
              {body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{body}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
