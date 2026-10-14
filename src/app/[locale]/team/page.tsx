import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getLocale } from "@/lib/request";
import type { StaffProfile } from "@/lib/staff";
import { StaffCard } from "@/components/site/StaffCard";
import { Section } from "@/components/site/Section";

import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const th = (await getLocale()) === "th";
  return { title: th ? "บุคลากร" : "Personnel", description: th ? "รู้จักบุคลากรและช่องทางติดต่อของ RISA" : "Meet the RISA team and find their professional contact details." };
}

export default async function TeamPage() {
  const locale = await getLocale();
  const th = locale === "th";
  const members = await sql<(StaffProfile & { id: string })[]>`
    select id, name_th, name_en, position_th, position_en, department_th, department_en,
      bio_th, bio_en, photo_url, photo_position, email, phone, tier
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

  // --- ORG CHART CONFIGURATION ---
  // The layout is driven directly by the 'tier' field configured on the Cosmic Board.
  const heads = members.filter(m => m.tier === 'head');
  const advisors = members.filter(m => m.tier === 'advisor');
  const managers = members.filter(m => m.tier === 'manager');
  const staff = members.filter(m => m.tier === 'staff');

  return (
    <Section>
      <div className="mb-12 border-b border-line pb-10 md:pb-14">
        <p className="mb-5 text-xs font-medium uppercase tracking-[.24em] text-accent">RISA · {th ? "ทีมงานของเรา" : "Our people"}</p>
        <h1 className="text-4xl font-normal tracking-tight md:text-6xl">{th ? "ผังองค์กร" : "Organization Chart"}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{th ? "โครงสร้างและบุคลากรผู้ขับเคลื่อน RISA" : "The leadership structure and team behind RISA."}</p>
      </div>

      <div className="flex flex-col items-center pb-20">
        
        {/* === TIER 1: Head / President === */}
        {heads.length > 0 && (
          <div className="relative z-10 w-full">
            <div className="flex flex-wrap justify-center">
              {heads.map((head, index) => (
                <div key={head.id} className="flex flex-col items-center px-4">
                  {heads.length > 1 && (
                    <div className="relative h-8 w-full">
                      <div
                        className={cn(
                          "absolute top-0 h-px bg-line",
                          index === 0 && "left-1/2 right-0",
                          index === heads.length - 1 && "left-0 right-1/2",
                          index > 0 && index < heads.length - 1 && "left-0 right-0"
                        )}
                        aria-hidden
                      />
                      <div className="mx-auto h-full w-px bg-line" aria-hidden />
                    </div>
                  )}
                  <div className="w-full max-w-[320px]">
                    <StaffCard member={head} locale={locale} />
                  </div>
                </div>
              ))}
            </div>
            {/* Connector from Tier 1 down to the next tier */}
            {(advisors.length > 0 || managers.length > 0 || staff.length > 0) && (
              <div className="mx-auto h-10 w-px bg-line" aria-hidden />
            )}
          </div>
        )}

        {/* === TIER 2: Advisors / VP === */}
        {advisors.length > 0 && (
          <div className="relative z-10 w-full">
            <div className="flex flex-wrap justify-center">
              {advisors.map((member, index) => (
                <div key={member.id} className="flex flex-col items-center px-4 sm:px-6">
                  <div className="relative h-8 w-full">
                    {advisors.length > 1 && (
                      <div
                        className={cn(
                          "absolute top-0 h-px bg-line",
                          index === 0 && "left-1/2 right-0",
                          index === advisors.length - 1 && "left-0 right-1/2",
                          index > 0 && index < advisors.length - 1 && "left-0 right-0"
                        )}
                        aria-hidden
                      />
                    )}
                    <div className="mx-auto h-full w-px bg-line" aria-hidden />
                  </div>
                  <div className="w-full max-w-[320px]">
                    <StaffCard member={member} locale={locale} />
                  </div>
                </div>
              ))}
            </div>
            {/* Connector from Tier 2 down to the next tier */}
            {(managers.length > 0 || staff.length > 0) && (
              <div className="mx-auto h-10 w-px bg-line" aria-hidden />
            )}
          </div>
        )}

        {/* === TIER 3: Managers / Committee === */}
        {managers.length > 0 && (
          <div className="relative z-10 w-full">
            <div className="flex flex-wrap justify-center">
              {managers.map((member, index) => (
                <div key={member.id} className="flex flex-col items-center px-3 sm:px-4">
                  <div className="relative h-8 w-full">
                    {managers.length > 1 && (
                      <div
                        className={cn(
                          "absolute top-0 h-px bg-line",
                          index === 0 && "left-1/2 right-0",
                          index === managers.length - 1 && "left-0 right-1/2",
                          index > 0 && index < managers.length - 1 && "left-0 right-0"
                        )}
                        aria-hidden
                      />
                    )}
                    <div className="mx-auto h-full w-px bg-line" aria-hidden />
                  </div>
                  <div className="w-[200px] sm:w-[240px] max-w-[280px]">
                    <StaffCard member={member} locale={locale} />
                  </div>
                </div>
              ))}
            </div>
            {/* Connector from Tier 3 down to Tier 4 */}
            {staff.length > 0 && (
              <div className="mx-auto h-10 w-px bg-line" aria-hidden />
            )}
          </div>
        )}

        {/* === TIER 4: Researchers / Staff === */}
        {staff.length > 0 && (
          <div className="relative z-10 w-full max-w-7xl mx-auto overflow-x-auto pb-4">
            <div className="flex justify-center min-w-max mx-auto">
              {staff.map((member, index) => (
                <div key={member.id} className="flex flex-col items-center px-1.5 sm:px-2.5 lg:px-3">
                  <div className="relative h-8 w-full">
                    {staff.length > 1 && (
                      <div
                        className={cn(
                          "absolute top-0 h-px bg-line",
                          index === 0 && "left-1/2 right-0",
                          index === staff.length - 1 && "left-0 right-1/2",
                          index > 0 && index < staff.length - 1 && "left-0 right-0"
                        )}
                        aria-hidden
                      />
                    )}
                    <div className="mx-auto h-full w-px bg-line" aria-hidden />
                  </div>
                  <div className="w-[125px] sm:w-[145px] lg:w-[165px]">
                    <StaffCard member={member} locale={locale} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Section>
  );
}
