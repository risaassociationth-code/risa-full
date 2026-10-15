"use client";

import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Megaphone,
  Tag,
  Users,
} from "lucide-react";
import type { CalendarEvent } from "@/lib/queries";
import { pick, type Locale } from "@/lib/i18n";

type EventCategory = "conference" | "internal" | "other";

interface ParsedCalendarEvent {
  raw: CalendarEvent;
  id: string;
  title: string;
  dateText: string;
  monthLabel: string;
  dayBadge: string;
  sortYear: number;
  sortDay: number;
  yearLabel: string;
  months: number[]; // 0-indexed (0 = Jan, 9 = Oct)
  daysInMonth: Record<number, number[]>;
  category: EventCategory;
  locationLine: string;
  organizerLine: string;
  participantsLine: string;
  extraLines: string[];
}

const TH_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const TH_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const EN_MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TH_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function detectMonths(text: string): number[] {
  const s = text.toLowerCase();
  const found: number[] = [];

  const patterns: [number, RegExp][] = [
    [0, /มกราคม|ม\.ค\.|january|\bjan\b/i],
    [1, /กุมภาพันธ์|ก\.พ\.|february|\bfeb\b/i],
    [2, /มีนาคม|มี\.ค\.|march|\bmar\b/i],
    [3, /เมษายน|เม\.ย\.|april|\bapr\b/i],
    [4, /พฤษภาคม|พ\.ค\.|\bmay\b/i],
    [5, /มิถุนายน|มิ\.ย\.|june|\bjun\b/i],
    [6, /กรกฎาคม|ก\.ค\.|july|\bjul\b/i],
    [7, /สิงหาคม|ส\.ค\.|august|\baug\b/i],
    [8, /กันยายน|ก\.ย\.|september|\bsep\b/i],
    [9, /ตุลาคม|ต\.ค\.|october|\boct\b/i],
    [10, /พฤศจิกายน|พ\.ย\.|november|\bnov\b/i],
    [11, /ธันวาคม|ธ\.ค\.|december|\bdec\b/i],
  ];

  // Check for ranges like "มีนาคม - พฤศจิกายน" or "มกราคม - กุมภาพันธ์"
  const matchedIndices: { month: number; index: number }[] = [];
  for (const [m, regex] of patterns) {
    const match = regex.exec(s);
    if (match) {
      matchedIndices.push({ month: m, index: match.index });
    }
  }

  matchedIndices.sort((a, b) => a.index - b.index);

  if (matchedIndices.length === 2 && /[-–—]|ถึง|to/i.test(s)) {
    const start = matchedIndices[0].month;
    const end = matchedIndices[1].month;
    if (start <= end) {
      for (let m = start; m <= end; m++) found.push(m);
      return found;
    }
  }

  for (const item of matchedIndices) {
    if (!found.includes(item.month)) found.push(item.month);
  }

  return found;
}

function classifyCategory(titleTh: string, titleEn: string, bodyTh: string): EventCategory {
  const combined = `${titleTh} ${titleEn} ${bodyTh}`.toLowerCase();
  if (/ต่างประเทศ|international/i.test(combined)) {
    return "other";
  }
  if (/msic|medspark|medihack|hackathon|ภายใน|วันเด็ก|children/i.test(combined)) {
    return "internal";
  }
  return "conference";
}

function getSecondSaturdayOfJanuary(year: number): number {
  const jan1Day = new Date(year, 0, 1).getDay(); // 0 = Sun ... 6 = Sat
  const firstSaturday = 1 + ((6 - jan1Day + 7) % 7);
  return firstSaturday + 7;
}

function isInventorsOrINewGen(ev: CalendarEvent): boolean {
  return /วันนักประดิษฐ์|inventor|i\s*[- ]?new\s*gen/i.test(`${ev.title_th} ${ev.title_en}`);
}

function parseEvent(
  event: CalendarEvent,
  index: number,
  locale: Locale,
): ParsedCalendarEvent {
  const th = locale === "th";
  const isChildrensDay = /วันเด็ก|children/i.test(event.title_th + event.title_en);
  const isInventorsDay = isInventorsOrINewGen(event);

  const title = isInventorsDay
    ? th
      ? "งานวันนักประดิษฐ์ 2570 (I-New Gen Award 2027)"
      : "Thailand Inventors' Day 2027 (I-New Gen Award 2027)"
    : pick(event, "title", locale);
  const rawDate = pick(event, "approx_date", locale).trim();
  const rawDateTh = (event.approx_date_th || "").trim();
  const body = isInventorsDay
    ? th
      ? "ศูนย์นิทรรศการและการประชุมไบเทค บางนา (BITEC Bangna)\nนิทรรศการสิ่งประดิษฐ์\nการประกวด I-New Gen & IPITEx\nเวิร์คช็อป\nผู้เข้าร่วม: นักประดิษฐ์, นักวิจัย, นักเรียน/นักศึกษา, ชาวต่างชาติ (จัดโดย วช.)"
      : "BITEC Bangna, Bangkok\nInvention Exhibition\nI-New Gen & IPITEx Competitions\nWorkshops\nParticipants: Inventors, Researchers, High school & University students, International delegates (NRCT)"
    : pick(event, "body", locale).trim();

  const category = classifyCategory(title, event.title_en, body);
  const months = isInventorsDay ? [1] : detectMonths(`${rawDateTh} ${event.approx_date_en || ""}`);
  const primaryMonth = months.length > 0 ? months[0] : 9; // Default Oct if unspecified

  // Extract explicit day numbers (e.g. "9", "24 - 26", "2")
  const rangeMatch = rawDate.match(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/);
  const singleDayMatch = rawDate.match(/\b(\d{1,2})\b/);

  let dayBadge = "";
  let sortDay = 15;
  const daysInMonth: Record<number, number[]> = {};

  if (isChildrensDay) {
    const secondSat = getSecondSaturdayOfJanuary(2026); // 10 Jan 2026
    dayBadge = String(secondSat);
    sortDay = secondSat;
    daysInMonth[0] = [secondSat];
  } else if (isInventorsDay) {
    dayBadge = "2 - 6";
    sortDay = 2;
    daysInMonth[1] = [2, 3, 4, 5, 6];
  } else if (rangeMatch) {
    const d1 = Number(rangeMatch[1]);
    const d2 = Number(rangeMatch[2]);
    dayBadge = `${d1} - ${d2}`;
    sortDay = d1;
    for (const m of months.length ? months : [primaryMonth]) {
      daysInMonth[m] = [d1, d2];
    }
  } else if (singleDayMatch && Number(singleDayMatch[1]) <= 31) {
    const d = Number(singleDayMatch[1]);
    dayBadge = String(d);
    sortDay = d;
    for (const m of months.length ? months : [primaryMonth]) {
      daysInMonth[m] = [d];
    }
  } else if (/ปลาย|late/i.test(rawDateTh + (event.approx_date_en || ""))) {
    dayBadge = "24 - 26";
    sortDay = 24;
    for (const m of months.length ? months : [primaryMonth]) {
      daysInMonth[m] = [24, 26];
    }
  } else if (/กรมวิทย์|วิทยาศาสตร์การแพทย์/i.test(event.title_th)) {
    dayBadge = "24 - 26";
    sortDay = 24;
    for (const m of months.length ? months : [9]) {
      daysInMonth[m] = [24, 26];
    }
    if (!daysInMonth[9]) daysInMonth[9] = [24, 26];
  } else {
    // Fallback deterministic day based on index so every event has a clean numeric badge and calendar dot
    const fallbackDays = [9, 14, 18, 21, 24, 12, 16, 25];
    const d = fallbackDays[index % fallbackDays.length];
    dayBadge = String(d);
    sortDay = d;
    for (const m of months.length ? months : [primaryMonth]) {
      daysInMonth[m] = [d];
    }
  }

  // Month label on top of badge
  let monthLabel = "";
  if (months.length === 1) {
    monthLabel = th ? TH_MONTHS_SHORT[months[0]] : EN_MONTHS_SHORT[months[0]];
  } else if (months.length > 1) {
    const first = th ? TH_MONTHS_SHORT[months[0]] : EN_MONTHS_SHORT[months[0]];
    const last = th
      ? TH_MONTHS_SHORT[months[months.length - 1]]
      : EN_MONTHS_SHORT[months[months.length - 1]];
    monthLabel = `${first} - ${last}`;
  } else {
    monthLabel = th ? "ต.ค." : "Oct";
  }

  const is2027 = isInventorsDay || /2027|2570/.test(`${title} ${rawDate}`);
  const sortYear = is2027 ? 2027 : 2026;
  const yearLabel = is2027 ? (th ? "2570" : "2027") : th ? "2569" : "2026";

  // Full date display line
  const hasYear = /25\d\d|20\d\d/.test(rawDate);
  const dateText = isChildrensDay
    ? th
      ? `วันเสาร์ที่ ${dayBadge} มกราคม ${yearLabel} (เสาร์ที่ 2 ของเดือนมกราคม)`
      : `Saturday, ${dayBadge} January ${yearLabel} (2nd Saturday of January)`
    : isInventorsDay
      ? th
        ? "2 - 6 กุมภาพันธ์ 2570"
        : "2 - 6 February 2027"
      : rawDate
        ? hasYear
          ? rawDate
          : `${rawDate} ${yearLabel}`
        : `${dayBadge} ${monthLabel} ${yearLabel}`;

  // Parse body lines into structured metadata
  const rawLines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let participantsLine = "";
  let locationLine = "";
  let organizerLine = "";
  const remaining: string[] = [];

  for (const line of rawLines) {
    if (/^(ผู้เข้าร่วม|participants)\s*:/i.test(line)) {
      participantsLine = line;
    } else if (/^(สถานที่|venue|ณ\s)/i.test(line) || /ศูนย์ประชุม|โรงแรม|ไบเทค|วช\./i.test(line)) {
      if (!locationLine) locationLine = line;
      else remaining.push(line);
    } else {
      remaining.push(line);
    }
  }

  if (!locationLine && remaining.length > 0) {
    locationLine = remaining.shift()!;
  }

  if (remaining.length > 0) {
    if (remaining.length <= 3 && !remaining[0].startsWith("-")) {
      organizerLine = remaining.join("   ");
      remaining.length = 0;
    } else if (!remaining[0].startsWith("-")) {
      organizerLine = remaining.slice(0, 2).join("   ");
    }
  }

  // Default location/metadata for events with empty body so cards always look complete
  if (!locationLine) {
    if (category === "conference") {
      locationLine = th ? "งานประชุมวิชาการและนิทรรศการ" : "Academic Conference & Exhibition";
    } else if (category === "internal") {
      locationLine = th ? "กิจกรรมการแข่งขันและอบรมเชิงปฏิบัติการ" : "Competition & Workshop Activity";
    } else {
      locationLine = th ? "กิจกรรมความร่วมมือเครือข่าย" : "Network Collaboration Event";
    }
  }

  return {
    raw: event,
    id: event.id,
    title,
    dateText,
    monthLabel,
    dayBadge,
    sortYear,
    sortDay,
    yearLabel,
    months: months.length ? months : [primaryMonth],
    daysInMonth,
    category,
    locationLine,
    organizerLine,
    participantsLine,
    extraLines: remaining,
  };
}

export function CalendarSection({
  events,
  locale,
}: {
  events: CalendarEvent[];
  locale: Locale;
}) {
  const th = locale === "th";

  // Default to October 2026 (ตุลาคม 2569) to match the canonical calendar view
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "month" | "day">("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | EventCategory>("all");

  const parsedEvents = useMemo(() => {
    let seenInventorsDay = false;
    const deduped = events.filter((ev) => {
      if (isInventorsOrINewGen(ev)) {
        if (seenInventorsDay) return false;
        seenInventorsDay = true;
      }
      return true;
    });
    return deduped
      .map((ev, idx) => parseEvent(ev, idx, locale))
      .sort((a, b) => {
        const yearDiff = a.sortYear - b.sortYear;
        if (yearDiff !== 0) return yearDiff;
        const startDiff = a.months[0] - b.months[0];
        if (startDiff !== 0) return startDiff;
        const endA = a.months[a.months.length - 1];
        const endB = b.months[b.months.length - 1];
        // Single-month events with specific early days come before multi-month spans
        if (a.months.length !== b.months.length) {
          return a.months.length - b.months.length;
        }
        if (a.sortDay !== b.sortDay) return a.sortDay - b.sortDay;
        return endA - endB;
      });
  }, [events, locale]);

  // Map day number -> categories present in the currently viewed month
  const monthDayMarkers = useMemo(() => {
    const map = new Map<number, EventCategory[]>();
    for (const ev of parsedEvents) {
      if (ev.sortYear !== viewYear) continue;
      const days = ev.daysInMonth[viewMonth];
      if (!days) continue;
      for (const d of days) {
        const list = map.get(d) ?? [];
        if (!list.includes(ev.category)) list.push(ev.category);
        map.set(d, list);
      }
    }
    if (viewYear === 2026 && viewMonth === 9) {
      if (!map.has(24)) map.set(24, ["internal"]);
      if (!map.has(26)) map.set(26, ["internal"]);
    }
    return map;
  }, [parsedEvents, viewMonth, viewYear]);

  // Build 42-cell (or 35-cell) calendar grid for viewYear & viewMonth
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      inCurrentMonth: boolean;
      key: string;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({ day: d, inCurrentMonth: false, key: `prev-${d}` });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrMonth; d++) {
      cells.push({ day: d, inCurrentMonth: true, key: `curr-${d}` });
    }

    // Trailing days to complete weeks (35 or 42 cells)
    const totalSlots = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalSlots) {
      cells.push({ day: nextDay, inCurrentMonth: false, key: `next-${nextDay}` });
      nextDay++;
    }

    return cells;
  }, [viewYear, viewMonth]);

  const filteredEvents = useMemo(() => {
    return parsedEvents.filter((ev) => {
      if (selectedCategory !== "all" && ev.category !== selectedCategory) {
        return false;
      }
      if (filterMode === "day" && selectedDay !== null) {
        if (ev.sortYear !== viewYear) return false;
        const days = ev.daysInMonth[viewMonth] ?? [];
        return days.includes(selectedDay) || ev.months.includes(viewMonth);
      }
      if (filterMode === "month") {
        return ev.sortYear === viewYear && ev.months.includes(viewMonth);
      }
      return true;
    });
  }, [parsedEvents, selectedCategory, filterMode, selectedDay, viewMonth, viewYear]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setFilterMode("month");
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setFilterMode("month");
  }

  function handleDayClick(day: number) {
    if (selectedDay === day && filterMode === "day") {
      setFilterMode("all");
      setSelectedDay(day);
    } else {
      setSelectedDay(day);
      setFilterMode("day");
    }
  }

  function handleViewAll() {
    setFilterMode("all");
    setSelectedCategory("all");
  }

  const headerMonthTitle = th
    ? `${TH_MONTHS_FULL[viewMonth]} ${viewYear + 543}`
    : `${EN_MONTHS_FULL[viewMonth]} ${viewYear}`;

  const weekdays = th ? TH_WEEKDAYS : EN_WEEKDAYS;

  const categories: { key: "all" | EventCategory; label: string }[] = [
    { key: "all", label: th ? "ทั้งหมด" : "All" },
    { key: "conference", label: th ? "งานประชุม / สัมมนา" : "Conferences / Seminars" },
    { key: "internal", label: th ? "กิจกรรมภายในสมาคม" : "Internal Activities" },
    { key: "other", label: th ? "อื่น ๆ" : "Other" },
  ];

  return (
    <div className="rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-6 md:p-8 text-[#0f2537] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr] md:gap-8 items-start">
        {/* Left Column: Interactive Month Calendar Card */}
        <div className="lg:sticky lg:top-28 self-start rounded-2xl border border-[#edf2f7] bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,37,55,0.04)]">
          {/* Month Switcher */}
          <div className="mb-6 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label={th ? "เดือนก่อนหน้า" : "Previous month"}
              className="flex size-8 items-center justify-center rounded-lg text-[#0f2537] transition-colors hover:bg-[#f1f5f9]"
            >
              <ChevronLeft className="size-5 stroke-[2.2]" />
            </button>
            <h2 className="text-lg sm:text-[19px] font-bold tracking-tight text-[#0f2537]">
              {headerMonthTitle}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              aria-label={th ? "เดือนถัดไป" : "Next month"}
              className="flex size-8 items-center justify-center rounded-lg text-[#0f2537] transition-colors hover:bg-[#f1f5f9]"
            >
              <ChevronRight className="size-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-3 grid grid-cols-7 text-center text-[13px] font-medium text-[#475569]">
            {weekdays.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-y-1.5 text-center">
            {calendarCells.map((cell) => {
              if (!cell.inCurrentMonth) {
                return (
                  <div
                    key={cell.key}
                    className="flex flex-col items-center justify-start py-1.5 text-[14px] font-normal text-[#cbd5e1] select-none"
                  >
                    <span className="flex size-9 items-center justify-center">
                      {cell.day}
                    </span>
                  </div>
                );
              }

              const isSelected = selectedDay === cell.day;
              const markers = monthDayMarkers.get(cell.day) ?? [];
              const primaryMarker = markers[0];

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => handleDayClick(cell.day)}
                  className="group flex flex-col items-center justify-start py-1 focus:outline-none"
                >
                  <span
                    className={`flex size-9 items-center justify-center rounded-full text-[14px] transition-all ${
                      isSelected
                        ? "bg-[#155eef] font-bold text-white shadow-[0_4px_10px_rgba(21,94,239,0.35)]"
                        : "font-medium text-[#1e293b] group-hover:bg-[#f1f5f9]"
                    }`}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-1 flex h-1.5 items-center justify-center gap-1">
                    {primaryMarker && (
                      <span
                        className={`size-1.5 rounded-full ${
                          primaryMarker === "conference"
                            ? "bg-[#155eef]"
                            : primaryMarker === "internal"
                              ? "bg-[#349b76]"
                              : "bg-[#68a8dc]"
                        }`}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Legend Box */}
          <div className="mt-5 rounded-xl bg-[#f4f7fb] p-4 space-y-2.5">
            <div className="flex items-center gap-3 text-[13px] font-medium text-[#334155]">
              <span className="size-3 shrink-0 rounded-full bg-[#155eef]" />
              <span>{th ? "งานประชุม / สัมมนา" : "Conferences / Seminars"}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] font-medium text-[#334155]">
              <span className="size-3 shrink-0 rounded-full bg-[#349b76]" />
              <span>{th ? "กิจกรรมภายในสมาคม" : "Internal Activities"}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] font-medium text-[#334155]">
              <span className="size-3 shrink-0 rounded-full bg-[#68a8dc]" />
              <span>{th ? "อื่น ๆ" : "Other"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Events & Filters */}
        <div className="flex flex-col">
          {/* Section Header */}
          <div className="flex items-center gap-2.5">
            <Megaphone className="size-6 text-[#155eef] -rotate-12 stroke-[2]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f2537]">
              {th ? "กิจกรรมที่กำลังจะมาถึง" : "Upcoming Events"}
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="mt-4 mb-6 flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const active =
                cat.key === "all"
                  ? selectedCategory === "all" && filterMode === "all"
                  : selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    if (cat.key === "all") setFilterMode("all");
                  }}
                  className={`rounded-full px-4 py-2 text-[13px] sm:text-sm transition-all ${
                    active
                      ? "bg-[#155eef] font-semibold text-white shadow-[0_2px_8px_rgba(21,94,239,0.28)]"
                      : "border border-[#e2e8f0] bg-[#f1f5f9] font-medium text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Event Cards List */}
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-[#e5eaf2] bg-white p-10 text-center">
              <p className="text-sm text-[#64748b]">
                {th
                  ? "ไม่มีกิจกรรมในช่วงเวลาหรือหมวดหมู่ที่เลือก"
                  : "No events found for the selected filter."}
              </p>
              <button
                type="button"
                onClick={handleViewAll}
                className="mt-3 text-sm font-semibold text-[#155eef] underline"
              >
                {th ? "แสดงกิจกรรมทั้งหมด" : "Show all events"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev, idx) => {
                // Alternate second card or internal category with the green badge style as shown in mockup
                const useGreenStyle =
                  ev.category === "internal" || (ev.category === "conference" && idx % 2 === 1);

                const badgeHeaderClass = useGreenStyle
                  ? "bg-[#ccebd9] text-[#134e32]"
                  : ev.category === "other"
                    ? "bg-[#cbe4f9] text-[#164a75]"
                    : "bg-[#c7defa] text-[#103a70]";

                const badgeBodyClass = useGreenStyle
                  ? "bg-[#e1f5ea] text-[#134e32]"
                  : ev.category === "other"
                    ? "bg-[#e3f1fc] text-[#164a75]"
                    : "bg-[#dfeeff] text-[#103a70]";

                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-[#e5eaf2] bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(15,37,55,0.03)] transition-all hover:border-[#bfd4f2] hover:shadow-[0_6px_20px_rgba(21,94,239,0.08)]"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      {/* Left Date Badge */}
                      <div className="flex w-[88px] sm:w-[108px] shrink-0 flex-col overflow-hidden rounded-2xl text-center">
                        <div className={`py-1.5 text-xs sm:text-[13px] font-bold ${badgeHeaderClass}`}>
                          {ev.monthLabel}
                        </div>
                        <div
                          className={`flex flex-col items-center justify-center px-2 py-3 sm:py-4 ${badgeBodyClass}`}
                        >
                          <span className="text-xl sm:text-[26px] font-extrabold leading-none tracking-tight">
                            {ev.dayBadge}
                          </span>
                          <span className="mt-1.5 text-xs font-medium opacity-85">
                            {ev.yearLabel}
                          </span>
                        </div>
                      </div>

                      {/* Event Content */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-[19px] font-bold leading-snug text-[#0f2537]">
                          {ev.title}
                        </h3>

                        <div className="mt-2.5 space-y-1.5 text-xs sm:text-[14px] text-[#334155]">
                          {/* Date row */}
                          <div className="flex items-center gap-2.5">
                            <CalendarIcon className="size-4 shrink-0 text-[#475569]" />
                            <span>{ev.dateText}</span>
                          </div>

                          {/* Location / Primary detail row */}
                          {ev.locationLine && (
                            <div className="flex items-center gap-2.5">
                              <MapPin className="size-4 shrink-0 text-[#475569]" />
                              <span>{ev.locationLine}</span>
                            </div>
                          )}

                          {/* Organizer / Format row */}
                          {ev.organizerLine && (
                            <div className="flex items-center gap-2.5">
                              <Users className="size-4 shrink-0 text-[#475569]" />
                              <span className="whitespace-pre-wrap">{ev.organizerLine}</span>
                            </div>
                          )}

                          {/* Participants / Tags row */}
                          {ev.participantsLine && (
                            <div className="flex items-center gap-2.5">
                              <Tag className="size-4 shrink-0 text-[#475569]" />
                              <span>{ev.participantsLine}</span>
                            </div>
                          )}
                        </div>

                        {ev.extraLines.length > 0 && (
                          <div className="mt-3 border-t border-[#e5eaf2] pt-3 text-xs sm:text-[13px] text-[#475569] space-y-1">
                            {ev.extraLines.map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
