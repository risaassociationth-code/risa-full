/** Editorial dates are calendar days, not browser-local instants. */
export function formatCalendarDate(value: string | Date | null | undefined, locale: string, month: "short" | "long" = "long"): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value.slice(0, 10) : Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return "";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month, year: "numeric", timeZone: "UTC" }).format(date);
}
