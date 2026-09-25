export const CONTENT_COLLECTIONS = ["news", "activities", "team"] as const;
export function isContentCollection(key: string) {
  return CONTENT_COLLECTIONS.some(value => value === key);
}
export function isEnabledAdminPath(path: string) {
  return path === "/admin/login" || /^\/admin\/(news|activities|team)(\/[^/]+)?\/?$/.test(path);
}
export function publicTabs(locale: string) {
  return [
    { href: `/${locale}`, label: locale === "th" ? "หน้าแรก" : "Home", newTab: false, children: [] },
    { href: `/${locale}/news`, label: locale === "th" ? "ข่าวสาร" : "News", newTab: false, children: [] },
    { href: `/${locale}/activities`, label: locale === "th" ? "กิจกรรม" : "Activities", newTab: false, children: [] },
    { href: `/${locale}/team`, label: locale === "th" ? "บุคลากร" : "Personnel", newTab: false, children: [] },
  ];
}
