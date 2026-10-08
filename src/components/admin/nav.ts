import { Map, FileText, CalendarDays, UsersRound } from "lucide-react";

/** Content workflows exposed in the simplified admin. */
export type NavLink = { href: string; label: string; icon: any };
export type NavGroup = { label: string; links: NavLink[] };
export const ADMIN_NAV: NavGroup[] = [{ label: "จัดการเนื้อหา", links: [
  { href: "/admin", label: "หน้าหลัก", icon: Map },
  { href: "/admin/news", label: "ข่าวสาร", icon: FileText },
  { href: "/admin/activities", label: "กิจกรรม", icon: CalendarDays },
  { href: "/admin/team", label: "บุคลากร / Personnel", icon: UsersRound },
] }];
