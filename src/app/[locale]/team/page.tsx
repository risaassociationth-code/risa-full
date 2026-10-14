import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getLocale } from "@/lib/request";
import type { StaffProfile } from "@/lib/staff";
import { StaffCard } from "@/components/site/StaffCard";
import { Section } from "@/components/site/Section";
import { OrgChartBackground } from "@/components/site/OrgChartBackground";
import { cn } from "@/lib/utils";
import { Sparkles, MoveHorizontal } from "lucide-react";

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
  badge: { en: string; th: string };
  beaconColor: string;
  cardWidth: string;
  items: (StaffProfile & { id: string })[];
  locale: "th" | "en";
  hasTopConnector?: boolean;
  hasBottomConnector?: boolean;
  cardSize?: "md" | "sm";
  isHeadTier?: boolean;
}

function TierGroup({
  badge,
  beaconColor,
  cardWidth,
  items,
  locale,
  hasTopConnector = false,
  hasBottomConnector = false,
  cardSize = "md",
  isHeadTier = false,
}: TierGroupProps) {
  if (items.length === 0) return null;
  const th = locale === "th";
  const total = items.length;

  return (
    <div className={cn("relative z-10 flex flex-col items-center", isHeadTier && "tier-head")}>
      {/* 1. Incoming Vertical Connector from Tier Above */}
      {hasTopConnector && (
        <div className="flex flex-col items-center">
          <div className="h-9 w-0.5 bg-gradient-to-b from-[#8cb9e6]/50 via-accent to-accent" />
          <div
            className="size-3 -my-1 rounded-full ring-4 ring-[#050a16] shadow-lg z-20"
            style={{
              backgroundColor: beaconColor,
              boxShadow: `0 0 12px ${beaconColor}`,
            }}
          />
          <div className="h-6 w-0.5 bg-gradient-to-b from-accent to-accent/40" />
        </div>
      )}

      {/* 2. Executive Tier Status Badge */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-line/70 bg-[#091222]/80 px-4 py-1.5 shadow-md backdrop-blur-md">
        <span
          className="size-2 rounded-full animate-pulse"
          style={{
            backgroundColor: beaconColor,
            boxShadow: `0 0 8px ${beaconColor}`,
          }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
          {th ? badge.th : badge.en}
        </span>
      </div>

      {/* 3. Cards Row with Synchronized Branch Bus Lines */}
      <div className="flex justify-center items-start gap-6 sm:gap-8">
        {items.map((member, idx) => (
          <div
            key={member.id}
            className={cn("flex flex-col items-center shrink-0", cardWidth)}
          >
            {/* Top Branch connector into each card (when multiple cards in this tier) */}
            {total > 1 ? (
              <div className="relative w-full h-8 flex justify-center">
                {/* Horizontal branch line segment bridging to sibling columns */}
                <div
                  className={cn(
                    "absolute top-0 h-0.5 bg-gradient-to-r from-accent/40 via-accent to-accent/40",
                    idx === 0 && "left-1/2 -right-3 sm:-right-4 rounded-l-full",
                    idx === total - 1 && "-left-3 sm:-left-4 right-1/2 rounded-r-full",
                    idx > 0 && idx < total - 1 && "-left-3 sm:-left-4 -right-3 sm:-right-4"
                  )}
                />
                {/* Vertical drop stem down into card */}
                <div className="relative h-full w-0.5 bg-gradient-to-b from-accent to-accent/40">
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-accent ring-2 ring-[#050a16] shadow-sm"
                    style={{ boxShadow: `0 0 6px ${beaconColor}` }}
                  />
                </div>
              </div>
            ) : (
              /* Single card in tier: simple straight feeder stem */
              <div className="h-4 w-0.5 bg-gradient-to-b from-accent to-accent/40" />
            )}

            {/* Card Frame */}
            <div className="w-full">
              <StaffCard member={member} locale={locale} size={cardSize} />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Outgoing Vertical Trunk to Next Tier */}
      {hasBottomConnector && (
        <div className="flex flex-col items-center mt-2">
          <div className="h-10 w-0.5 bg-gradient-to-b from-accent/50 via-accent to-[#8cb9e6]/60" />
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
        <div className="mb-10 border-b border-line/60 pb-8 md:pb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1 text-xs font-medium uppercase tracking-[.22em] text-accent backdrop-blur-md mb-4">
            <Sparkles className="size-3 text-accent" />
            <span>RISA · {th ? "โครงสร้างบุคลากร" : "Organization Architecture"}</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-5xl md:text-6xl text-ink">
            {th ? "ผังองค์กรสมาคม" : "Organization Chart"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            {th
              ? "โครงสร้างการบริหารและการเชื่อมโยงเครือข่ายนักวิจัยผู้ทรงคุณวุฒิในการขับเคลื่อนมาตรฐานงานวิจัยและอุตสาหกรรมไทย"
              : "Executive governance hierarchy, advisory council, and specialized research network driving research and industry advancement in Thailand."}
          </p>

          {/* Mobile Swipe Guidance Pill */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent lg:hidden">
            <MoveHorizontal className="size-3.5 shrink-0" />
            <span>
              {th
                ? "ปัดซ้าย-ขวาเพื่อสำรวจผังองค์กรแนวกว้าง"
                : "Swipe horizontally to explore the full organization tree"}
            </span>
          </div>
        </div>

        {/* Scrollable Tree Viewport (Keeps all tiers in unified mathematical alignment) */}
        <div className="w-full overflow-x-auto pb-20 pt-4 custom-scrollbar">
          <div className="inline-flex flex-col items-center min-w-full px-4 sm:px-8 risa-org-tree">
            {/* === TIER 1: Executive Leadership (President / Head) === */}
            <TierGroup
              badge={{
                en: "Executive Leadership",
                th: "คณะผู้บริหารระดับสูง",
              }}
              beaconColor="#d6bf91"
              cardWidth="w-[320px]"
              items={heads}
              locale={locale}
              hasTopConnector={false}
              hasBottomConnector={hasT2 || hasT3 || hasT4}
              cardSize="md"
              isHeadTier={true}
            />

            {/* === TIER 2: Advisory Council === */}
            <TierGroup
              badge={{
                en: "Advisory Council",
                th: "คณะที่ปรึกษาสมาคม",
              }}
              beaconColor="#38bdf8"
              cardWidth="w-[270px]"
              items={advisors}
              locale={locale}
              hasTopConnector={true}
              hasBottomConnector={hasT3 || hasT4}
              cardSize="md"
            />

            {/* === TIER 3: Executive Committee & Managers === */}
            <TierGroup
              badge={{
                en: "Executive Committee",
                th: "คณะทำงานบริหาร",
              }}
              beaconColor="#10b981"
              cardWidth="w-[245px]"
              items={managers}
              locale={locale}
              hasTopConnector={true}
              hasBottomConnector={hasT4}
              cardSize="sm"
            />

            {/* === TIER 4: Research Fellows & Specialists === */}
            <TierGroup
              badge={{
                en: "Research Fellows & Specialists",
                th: "คณะนักวิจัยและผู้เชี่ยวชาญ",
              }}
              beaconColor="#818cf8"
              cardWidth="w-[210px]"
              items={staff}
              locale={locale}
              hasTopConnector={true}
              hasBottomConnector={false}
              cardSize="sm"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
