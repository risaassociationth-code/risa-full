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

  if (!members.length) {
    return (
      <Section>
        <div className="mb-12 border-b border-line pb-10 md:pb-14">
          <p className="mb-5 text-xs font-medium uppercase tracking-[.24em] text-accent">RISA · {th ? "ทีมงานของเรา" : "Our people"}</p>
          <h1 className="text-4xl font-normal tracking-tight md:text-6xl">{th ? "ผังองค์กร" : "Organization Chart"}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{th ? "โครงสร้างและบุคลากรผู้ขับเคลื่อน RISA" : "The leadership structure and team behind RISA."}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <h2 className="text-xl text-ink">{th ? "กำลังจัดเตรียมข้อมูลผังองค์กร" : "Organization chart coming soon"}</h2>
          <p className="mt-3 text-sm text-muted">{th ? "เราจะนำเสนอโครงสร้างและทีมงานของ RISA ที่นี่เร็ว ๆ นี้" : "We look forward to presenting the RISA organization chart here."}</p>
          <Link href={`/${locale}/news`} className="mt-6 inline-block text-accent underline underline-offset-4">{th ? "ติดตามข่าวสารจาก RISA" : "Read the latest RISA news"}</Link>
        </div>
      </Section>
    );
  }

  // The first person is the head (President/Highest Position)
  const head = members[0];
  // The rest are subordinates
  const team = members.slice(1);

  return (
    <Section>
      <div className="mb-12 border-b border-line pb-10 md:pb-14">
        <p className="mb-5 text-xs font-medium uppercase tracking-[.24em] text-accent">RISA · {th ? "ทีมงานของเรา" : "Our people"}</p>
        <h1 className="text-4xl font-normal tracking-tight md:text-6xl">{th ? "ผังองค์กร" : "Organization Chart"}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{th ? "โครงสร้างและบุคลากรผู้ขับเคลื่อน RISA" : "The leadership structure and team behind RISA."}</p>
      </div>

      <div className="flex flex-col items-center pb-20">
        {/* TOP LEVEL: The Head of the Organization */}
        <div className="relative z-10 w-full max-w-[320px]">
          <StaffCard member={head} locale={locale} />
          {/* Vertical line dropping from the top card */}
          {team.length > 0 && (
            <div className="absolute left-1/2 top-full h-12 w-px -translate-x-1/2 bg-line" aria-hidden />
          )}
        </div>

        {/* SUBORDINATES LEVEL */}
        {team.length > 0 && (
          <div className="relative mt-12 w-full pt-8">
            {/* Horizontal line to connect the drops. We stretch it only if there are multiple people on this level. 
                Using responsive utilities so on small screens it only connects what fits, but generally 
                a CSS org chart handles branching by connecting columns. 
                For a grid, we center it and draw a line across. */}
            {team.length > 1 && (
              <div 
                className="absolute left-[10%] right-[10%] top-0 h-px bg-line sm:left-[20%] sm:right-[20%] md:left-[15%] md:right-[15%]" 
                aria-hidden 
              />
            )}

            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {team.map((member) => (
                <div key={member.id} className="relative mx-auto w-full max-w-[320px]">
                  {/* Vertical line dropping into each subordinate card */}
                  <div className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-line" aria-hidden />
                  <StaffCard member={member} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
