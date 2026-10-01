import { formatCalendarDate } from "./calendar-date";

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";

export function isLocale(v: string | undefined): v is Locale {
  return v === "th" || v === "en";
}

/** Pick the `_th` / `_en` variant of a bilingual record field. */
export function pick<T extends Record<string, unknown>>(
  row: T,
  base: string,
  locale: Locale,
): string {
  const primary = row[`${base}_${locale}`];
  if (typeof primary === "string" && primary.trim() !== "") return primary;
  const fallback = row[`${base}_${locale === "th" ? "en" : "th"}`];
  return typeof fallback === "string" ? fallback : "";
}

/** Mark untranslated Thai fields correctly without changing source content. */
export function contentLanguage<T extends Record<string, unknown>>(row: T, base: string, locale: Locale): Locale {
  const value = pick(row, base, locale);
  if (locale === "en" && value === row[`${base}_th`] && /[\u0e00-\u0e7f]/.test(value)) return "th";
  const primary = row[`${base}_${locale}`];
  return typeof primary === "string" && primary.trim() ? locale : locale === "th" ? "en" : "th";
}

/** UI chrome strings that are not part of editable page content. */
const DICT = {
  th: {
    skipToContent: "ข้ามไปยังเนื้อหาหลัก",
    menu: "เมนู",
    close: "ปิด",
    readMore: "อ่านต่อ",
    viewAll: "ดูทั้งหมด",
    back: "ย้อนกลับ",
    search: "ค้นหา",
    filterAll: "ทั้งหมด",
    noResults: "ยังไม่มีข้อมูลในส่วนนี้",
    loading: "กำลังโหลด…",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
    page: "หน้า",
    publishedOn: "เผยแพร่เมื่อ",
    date: "วันที่",
    venue: "สถานที่",
    register: "ลงทะเบียน",
    download: "ดาวน์โหลด",
    apply: "สมัคร",
    deadline: "ปิดรับสมัคร",
    submit: "ส่งข้อมูล",
    sending: "กำลังส่ง…",
    required: "จำเป็นต้องกรอก",
    name: "ชื่อ-นามสกุล",
    email: "อีเมล",
    phone: "โทรศัพท์",
    subject: "หัวข้อ",
    message: "ข้อความ",
    organization: "หน่วยงาน / บริษัท",
    position: "ตำแหน่ง",
    sentOk: "ส่งข้อมูลเรียบร้อยแล้ว ขอบคุณครับ/ค่ะ",
    sentFail: "ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง",
    editMode: "โหมดแก้ไข",
    photos: "รูปภาพ",
    term: "วาระ",
    upcoming: "กิจกรรมที่กำลังจะมาถึง",
    past: "กิจกรรมที่ผ่านมา",
  },
  en: {
    skipToContent: "Skip to main content",
    menu: "Menu",
    close: "Close",
    readMore: "Read more",
    viewAll: "View all",
    back: "Back",
    search: "Search",
    filterAll: "All",
    noResults: "Nothing here yet.",
    loading: "Loading…",
    previous: "Previous",
    next: "Next",
    page: "Page",
    publishedOn: "Published",
    date: "Date",
    venue: "Venue",
    register: "Register",
    download: "Download",
    apply: "Apply",
    deadline: "Deadline",
    submit: "Submit",
    sending: "Sending…",
    required: "Required",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    subject: "Subject",
    message: "Message",
    organization: "Organisation / Company",
    position: "Position",
    sentOk: "Thank you — your message has been sent.",
    sentFail: "Could not send. Please try again.",
    editMode: "Edit mode",
    photos: "Photos",
    term: "Term",
    upcoming: "Upcoming",
    past: "Past",
  },
} as const;

export type UiKey = keyof (typeof DICT)["th"];
export function t(locale: Locale, key: UiKey): string {
  return DICT[locale][key];
}

const DATE_LOCALE = { th: "th-TH", en: "en-GB" } as const;

export function formatDate(d: Date | string | null | undefined, locale: Locale): string {
  return formatCalendarDate(d, DATE_LOCALE[locale]);
}

export function localePath(locale: Locale, href: string): string {
  if (!href.startsWith("/")) return href;
  return `/${locale}${href === "/" ? "" : href}`;
}
