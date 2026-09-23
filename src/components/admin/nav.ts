/** The admin sidebar's structure. Plain data so both the shell and the tests can read it. */

export type NavLink = { href: string; label: string };
export type NavGroup = { label: string; links: NavLink[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "ภาพรวม",
    links: [
      { href: "/admin", label: "แดชบอร์ด" },
      { href: "/admin/codex", label: "Codex" },
    ],
  },
  {
    label: "เนื้อหาหน้าเว็บ",
    links: [
      { href: "/admin/pages", label: "ข้อความในหน้า" },
      { href: "/admin/lists", label: "รายการย่อย" },
    ],
  },
  {
    label: "คอนเทนต์",
    links: [
      { href: "/admin/news", label: "ข่าวสาร" },
      { href: "/admin/activities", label: "กิจกรรม" },
      { href: "/admin/committee", label: "คณะกรรมการ" },
      { href: "/admin/team", label: "บุคลากร" },
      { href: "/admin/research", label: "งานวิจัย" },
      { href: "/admin/awards", label: "รางวัล" },
      { href: "/admin/jobs", label: "ตำแหน่งงาน" },
      { href: "/admin/gallery", label: "ประมวลภาพ" },
      { href: "/admin/documents", label: "เอกสาร" },
      { href: "/admin/timeline", label: "เส้นเวลา" },
      { href: "/admin/stats", label: "ตัวเลขสถิติ" },
      { href: "/admin/services", label: "การ์ดบริการ" },
      { href: "/admin/locations", label: "สถานที่" },
      { href: "/admin/partners", label: "พันธมิตร" },
    ],
  },
  {
    label: "ระบบ",
    links: [
      { href: "/admin/navigation", label: "เมนูและฟุตเตอร์" },
      { href: "/admin/media", label: "คลังไฟล์" },
      { href: "/admin/submissions", label: "กล่องข้อความ" },
      { href: "/admin/settings", label: "ตั้งค่าเว็บไซต์" },
      { href: "/admin/users", label: "ผู้ดูแลระบบ" },
      { href: "/admin/audit", label: "ประวัติการแก้ไข" },
    ],
  },
];
