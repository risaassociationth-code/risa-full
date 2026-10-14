"use client";

import { useEffect, useState } from "react";
import { Activity, Eye } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function LiveVisitorCount({ locale = "th" }: { locale?: Locale }) {
  const th = locale === "th";
  const [stats, setStats] = useState<{ active: number; total: number }>({
    active: 1,
    total: 1,
  });

  useEffect(() => {
    // Generate or retrieve persistent anonymous session ID
    let sid = "";
    let isNew = false;
    try {
      sid = sessionStorage.getItem("risa_visitor_sid") || "";
      if (!sid) {
        sid = "sid_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        sessionStorage.setItem("risa_visitor_sid", sid);
        isNew = true;
      }
    } catch {
      sid = "sid_" + Math.random().toString(36).substring(2, 15);
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/visitors?sid=${encodeURIComponent(sid)}&new=${isNew ? "1" : "0"}`);
        if (res.ok) {
          const data = await res.json();
          if (data.active != null && data.total != null) {
            setStats({ active: data.active, total: data.total });
          }
        }
      } catch {
        // keep current fallback values
      }
      isNew = false;
    };

    fetchStats();

    // Heartbeat every 25 seconds
    const interval = setInterval(fetchStats, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-5 inline-flex flex-wrap items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-[#06121e]/85 px-3.5 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      {/* Live Pulsing Beacon */}
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          LIVE
        </span>
      </div>

      <span className="h-3 w-px bg-white/15" aria-hidden="true" />

      {/* Concurrent Online Count */}
      <div className="flex items-center gap-1.5 text-xs text-[#e2e8f0]">
        <Activity className="size-3 text-emerald-400 shrink-0" />
        <span className="font-semibold text-white font-mono">
          {stats.active}
        </span>
        <span className="text-muted text-[11px]">
          {th ? "กำลังออนไลน์" : "Online now"}
        </span>
      </div>

      <span className="h-3 w-px bg-white/15 hidden sm:inline" aria-hidden="true" />

      {/* Total Visits Count */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#cbd5e1]">
        <Eye className="size-3 text-accent shrink-0" />
        <span className="font-medium text-ink font-mono">
          {stats.total.toLocaleString()}
        </span>
        <span className="text-muted text-[11px]">
          {th ? "การเข้าชม" : "Visits"}
        </span>
      </div>
    </div>
  );
}
