import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper, UsersRound } from "lucide-react";

export const metadata = { title: "หน้าหลักผู้ดูแล · RISA Admin" };

const actions = [
  { href: "/admin/news", title: "ข่าวสาร", english: "News", tone: "bg-[#173f85] hover:bg-[#12346e]", icon: Newspaper },
  { href: "/admin/activities", title: "กิจกรรม", english: "Activities", tone: "bg-[#0e625a] hover:bg-[#0a504a]", icon: CalendarDays },
  { href: "/admin/team", title: "บุคลากร", english: "Personnel", tone: "bg-[#624186] hover:bg-[#50346e]", icon: UsersRound },
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
        {actions.map(({ href, title, english, tone, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`group flex min-h-80 min-w-0 flex-col rounded-3xl p-7 text-white shadow-md transition-colors focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ink sm:p-8 xl:min-h-[26rem] ${tone}`}
          >
            <div className="mb-8 flex items-center justify-between gap-3">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Icon aria-hidden="true" className="size-8" strokeWidth={1.5} />
              </span>
              <span lang="en" className="text-sm font-semibold uppercase tracking-widest">{english}</span>
            </div>
            <h2 className="text-[clamp(2.5rem,4vw,3.5rem)] font-bold leading-[1.4]">
              <span className="block">จัดการ</span><span className="block">{title}</span>
            </h2>
            <span aria-hidden="true" className="mt-auto flex justify-end pt-6">
              <span className="flex size-12 items-center justify-center rounded-full border border-white/40 group-hover:bg-white/15"><ArrowRight className="size-6" /></span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
