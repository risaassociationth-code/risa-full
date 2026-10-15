import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getLocale } from "@/lib/request";
import type { StaffProfile } from "@/lib/staff";
import { StaffCard } from "@/components/site/StaffCard";
import { Section } from "@/components/site/Section";
import { OrgChartBackground } from "@/components/site/OrgChartBackground";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const th = (await getLocale()) === "th";
  return {
    title: th ? "ผังองค์กร" : "Organization Chart",
    description: th
      ? "โครงสร้างและบุคลากรผู้ขับเคลื่อนสมาคม RISA"
      : "Meet the leadership structure and professional research team behind RISA.",
  };
}

interface TierGroupProps {
  beaconColor: string;
  items: (StaffProfile & { id: string })[];
  locale: "th" | "en";
  hasTopConnector?: boolean;
  hasBottomConnector?: boolean;
  cardSize?: "md" | "sm";
  isHeadTier?: boolean;
  tierType: "head" | "advisor" | "manager" | "staff";
}

function TierGroup({
  beaconColor,
  items,
  locale,
  hasTopConnector = false,
  hasBottomConnector = false,
  cardSize = "md",
  isHeadTier = false,
  tierType,
}: TierGroupProps) {
  if (items.length === 0) return null;
  const total = items.length;

  return (
    <div className={cn("relative z-10 flex flex-col items-center w-full", isHeadTier && "tier-head", `tier-${tierType}`)}>
      {/* 1. Incoming Vertical Connector from Tier Above */}
      {hasTopConnector && (
        <div className="flex flex-col items-center">
          <div className="h-6 sm:h-8 w-0.5 bg-gradient-to-b from-[#8cb9e6]/50 via-accent to-accent" />
          <div
            className="size-2.5 sm:size-3 -my-0.5 rounded-full ring-4 ring-[#050a16] shadow-lg z-20"
            style={{
              backgroundColor: beaconColor,
              boxShadow: `0 0 12px ${beaconColor}`,
            }}
          />
          <div className="h-5 sm:h-7 w-0.5 bg-accent" />
        </div>
      )}

      {/* 2. Responsive Cards Row with Continuous Branch Bus Lines */}
      {tierType === "staff" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4 w-full max-w-7xl mx-auto">
          {items.map((member, idx) => (
            <div key={member.id} className="flex flex-col items-center w-full">
              {/* Branch connector into each card */}
              <div className="relative w-full h-6 sm:h-7 flex justify-center">
                {/* Horizontal bridging line connecting all 6 columns on desktop */}
                <div
                  className={cn(
                    "absolute top-0 h-0.5 bg-accent hidden lg:block",
                    idx === 0 && "left-1/2 -right-2 rounded-l-full",
                    idx === total - 1 && "-left-2 right-1/2 rounded-r-full",
                    idx > 0 && idx < total - 1 && "-left-2 -right-2"
                  )}
                />
                {/* Vertical drop stem into the card */}
                <div className="relative h-full w-0.5 bg-accent">
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-accent ring-2 ring-[#050a16]"
                    style={{ boxShadow: `0 0 6px ${beaconColor}` }}
                  />
                </div>
              </div>

              {/* Card Frame */}
              <div className="w-full h-full">
                <StaffCard member={member} locale={locale} size={cardSize} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center items-stretch gap-6 sm:gap-8 w-full max-w-5xl mx-auto">
          {items.map((member, idx) => (
            <div
              key={member.id}
              className={cn(
                "flex flex-col items-center",
                tierType === "head" && "w-full max-w-[280px] sm:max-w-[320px]",
                tierType === "advisor" && "w-full max-w-[260px] sm:max-w-[290px]",
                tierType === "manager" && "w-full max-w-[240px] sm:max-w-[270px]"
              )}
            >
              {/* Branch connector into card (only for tiers below Level 1) */}
              {hasTopConnector && (
                <div className="relative w-full h-6 sm:h-7 flex justify-center">
                  {total > 1 && (
                    <div
                      className={cn(
                        "absolute top-0 h-0.5 bg-accent",
                        idx === 0 && "left-1/2 -right-3 sm:-right-4 rounded-l-full",
                        idx === total - 1 && "-left-3 sm:-left-4 right-1/2 rounded-r-full",
                        idx > 0 && idx < total - 1 && "-left-3 sm:-left-4 -right-3 sm:-right-4"
                      )}
                    />
                  )}
                  {/* Vertical drop stem into the card */}
                  <div className="relative h-full w-0.5 bg-accent">
                    {total > 1 && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-accent ring-2 ring-[#050a16]"
                        style={{ boxShadow: `0 0 6px ${beaconColor}` }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Card Frame */}
              <div className="w-full h-full">
                <StaffCard member={member} locale={locale} size={cardSize} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Outgoing Vertical Trunk to Next Tier */}
      {hasBottomConnector && (
        <div className="flex flex-col items-center">
          <div className="h-6 sm:h-8 w-0.5 bg-gradient-to-b from-accent to-[#8cb9e6]/60" />
        </div>
      )}
    </div>
  );
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
      <div className="relative isolate min-h-screen">
        <OrgChartBackground />
        <Section className="relative z-10">
          <div className="mb-12 border-b border-line pb-10 md:pb-14">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-accent">
              <Sparkles className="size-3.5 text-accent" />
              RISA · {th ? "ทีมงานของเรา" : "Our people"}
            </p>
            <h1 className="text-4xl font-normal tracking-tight md:text-6xl text-ink">
              {th ? "ผังองค์กร" : "Organization Chart"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
              {th
                ? "โครงสร้างและบุคลากรผู้ขับเคลื่อนสมาคม RISA"
                : "The leadership structure and specialized researchers behind RISA."}
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-line bg-surface/80 backdrop-blur-md px-6 py-16 text-center">
            <h2 className="text-xl text-ink">
              {th ? "กำลังจัดเตรียมข้อมูลผังองค์กร" : "Organization chart coming soon"}
            </h2>
            <p className="mt-3 text-sm text-muted">
              {th
                ? "เราจะนำเสนอโครงสร้างและทีมงานของ RISA ที่นี่เร็ว ๆ นี้"
                : "We look forward to presenting the RISA organization chart here."}
            </p>
            <Link
              href={`/${locale}/news`}
              className="mt-6 inline-block text-accent underline underline-offset-4"
            >
              {th ? "ติดตามข่าวสารจาก RISA" : "Read the latest RISA news"}
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  // --- ORG CHART CONFIGURATION ---
  const heads = members.filter((m) => m.tier === "head");
  const advisors = members.filter((m) => m.tier === "advisor");
  const managers = members.filter((m) => m.tier === "manager");
  const staff = members.filter((m) => m.tier === "staff");

  const hasT2 = advisors.length > 0;
  const hasT3 = managers.length > 0;
  const hasT4 = staff.length > 0;

  return (
    <div className="relative isolate min-h-screen risa-org-page">
      <OrgChartBackground />

      <Section className="relative z-10">
        {/* Page Hero Header */}
        <div className="mb-6 border-b border-line/60 pb-6 md:pb-8">
          <h1 className="text-3xl font-medium tracking-tight sm:text-5xl md:text-6xl text-ink">
            {th ? "ผังองค์กรสมาคม" : "Organization Chart"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            {th
              ? "โครงสร้างการบริหารและการเชื่อมโยงเครือข่ายนักวิจัยผู้ทรงคุณวุฒิในการขับเคลื่อนมาตรฐานงานวิจัยและอุตสาหกรรมไทย"
              : "Executive governance hierarchy, advisory council, and specialized research network driving research and industry advancement in Thailand."}
          </p>
        </div>

        {/* Tree Viewport (Fits screen width naturally without requiring side-scrolling) */}
        <div className="w-full flex flex-col items-center pb-20 pt-0 risa-org-tree">
          {/* === TIER 1: Executive Leadership (President / Head) === */}
          <TierGroup
            beaconColor="#d6bf91"
            items={heads}
            locale={locale}
            hasTopConnector={false}
            hasBottomConnector={hasT2 || hasT3 || hasT4}
            cardSize="md"
            isHeadTier={true}
            tierType="head"
          />

          {/* === TIER 2: Advisory Council === */}
          <TierGroup
            beaconColor="#38bdf8"
            items={advisors}
            locale={locale}
            hasTopConnector={true}
            hasBottomConnector={hasT3 || hasT4}
            cardSize="md"
            tierType="advisor"
          />

          {/* === TIER 3: Executive Committee & Managers === */}
          <TierGroup
            beaconColor="#10b981"
            items={managers}
            locale={locale}
            hasTopConnector={true}
            hasBottomConnector={hasT4}
            cardSize="sm"
            tierType="manager"
          />

          {/* === TIER 4: Research Fellows & Specialists === */}
          <TierGroup
            beaconColor="#818cf8"
            items={staff}
            locale={locale}
            hasTopConnector={true}
            hasBottomConnector={false}
            cardSize="sm"
            tierType="staff"
          />
        </div>
      </Section>
    </div>
  );
}
