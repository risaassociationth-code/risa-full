import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper, UsersRound } from "lucide-react";

export const metadata = { title: "หน้าหลักผู้ดูแล · RISA Admin" };

const actions = [
  { href: "/admin/news", title: "จัดการข่าวสาร", english: "News", description: "เพิ่มข่าวใหม่ แก้ไขข่าวเดิม และเลือกข่าวที่พร้อมเผยแพร่", icon: Newspaper },
  { href: "/admin/activities", title: "จัดการกิจกรรม", english: "Activities", description: "เพิ่มกิจกรรม อัปเดตรายละเอียด และเผยแพร่ให้ผู้เข้าชมทราบ", icon: CalendarDays },
  { href: "/admin/team", title: "จัดการบุคลากร", english: "Personnel", description: "เพิ่มหรือแก้ไขประวัติ รูปภาพ และเลือกบุคลากรที่แสดงบนเว็บไซต์", icon: UsersRound },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl py-3 lg:py-8">
      <header className="mb-8 max-w-2xl lg:mb-12">
        <p className="admin-kicker mb-4">RISA / CONTENT STUDIO</p>
        <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">วันนี้ต้องการจัดการอะไร?</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">เลือกหัวข้อด้านล่างเพื่อเริ่มต้นจัดการเว็บไซต์</p>
      </header>
      <nav aria-label="งานหลักของผู้ดูแล" className="grid gap-5 xl:grid-cols-3">
        {actions.map(({ href, title, english, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-64 flex-col rounded-2xl border border-line bg-paper p-7 shadow-sm transition-colors hover:border-accent hover:bg-accent-soft focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-8 xl:min-h-96"
          >
            <div className="mb-7 flex items-center justify-between">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-ink text-[#dcc99c]">
                <Icon aria-hidden="true" className="size-8" strokeWidth={1.5} />
              </span>
              <span lang="en" className="text-xs font-medium uppercase tracking-widest text-muted">{english}</span>
            </div>
            <h2 className="text-2xl font-semibold leading-snug text-ink">{title}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>
            <span className="mt-auto flex items-center justify-between gap-3 pt-7 font-medium text-ink">
              เปิดรายการ <ArrowRight aria-hidden="true" className="size-5 text-accent" />
            </span>
          </Link>
        ))}
      </nav>
      <p className="mt-7 text-sm leading-relaxed text-muted">เริ่มจากเปิดรายการ แล้วเลือกเพิ่มใหม่หรือแก้ไขรายการที่มีอยู่</p>
    </div>
  );
}
