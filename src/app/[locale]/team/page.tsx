import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getLocale } from "@/lib/request";
import type { StaffProfile } from "@/lib/staff";
import { StaffCard } from "@/components/site/StaffCard";
import { Section } from "@/components/site/Section";

export async function generateMetadata(): Promise<Metadata> {
  const th = (await getLocale()) === "th";
  return { title: th ? "บุคลากร" : "Personnel", description: th ? "รู้จักบุคลากรและช่องทางติดต่อของ RISA" : "Meet the RISA team and find their professional contact details." };
}

export default async function TeamPage() {
  const locale = await getLocale();
  const th = locale === "th";
  const members = await sql<(StaffProfile & { id: string })[]>`
    select id, name_th, name_en, position_th, position_en, department_th, department_en,
      bio_th, bio_en, photo_url, photo_position, email, phone
    from staff_members where status = 'published' order by sort, created_at`;
  return <Section>
    <div className="mb-12 border-b border-line pb-10 md:pb-14">
      <p className="mb-5 text-xs font-medium uppercase tracking-[.24em] text-accent">RISA · {th ? "ทีมงานของเรา" : "Our people"}</p>
      <h1 className="text-4xl font-normal tracking-tight md:text-6xl">{th ? "บุคลากร" : "Personnel"}</h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{th ? "รู้จักทีมงานที่ร่วมขับเคลื่อน RISA พร้อมบทบาท ความเชี่ยวชาญ และช่องทางติดต่อสำหรับงาน" : "Meet the people behind RISA—their roles, expertise, and professional contact details."}</p>
    </div>
    {members.length ? <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{members.map(member => <StaffCard key={member.id} member={member} locale={locale} />)}</div>
      : <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center"><h2 className="text-xl text-ink">{th ? "กำลังจัดเตรียมข้อมูลบุคลากร" : "Our team profiles are coming soon"}</h2><p className="mt-3 text-sm text-muted">{th ? "เราจะนำเสนอทีมงานของ RISA ที่นี่เร็ว ๆ นี้" : "We look forward to introducing the RISA team here."}</p><Link href={`/${locale}/news`} className="mt-6 inline-block text-accent underline underline-offset-4">{th ? "ติดตามข่าวสารจาก RISA" : "Read the latest RISA news"}</Link></div>}
  </Section>;
}
