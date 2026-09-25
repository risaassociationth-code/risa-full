/** Only the two content workflows are exposed in the simplified admin. */
export type NavLink = { href: string; label: string };
export type NavGroup = { label: string; links: NavLink[] };
export const ADMIN_NAV: NavGroup[] = [{ label: "จัดการเนื้อหา", links: [
  { href: "/admin/news", label: "ข่าวสาร" },
  { href: "/admin/activities", label: "กิจกรรม" },
] }];
