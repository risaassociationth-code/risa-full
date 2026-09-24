"use client";

import { useState } from "react";
import Link from "next/link";
import { ManageImportedNewsButton } from "./ManageImportedNewsButton";

export type DeskItem = {
  id: string; kind: "news" | "activities"; title: string; titleEn: string;
  slug: string; status: string; imported: boolean; partner: boolean; cover: string;
};

export function ContentDesk({ items }: { items: DeskItem[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = items.filter(item =>
    (kind === "all" || item.kind === kind) &&
    (status === "all" || (status === "imported" ? item.imported : !item.imported && item.status === status)) &&
    `${item.title} ${item.titleEn} ${item.partner ? "MMS Hub" : ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div>
    <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <label className="text-sm">ค้นหาหัวข้อ<input className="mt-1 block w-full rounded-lg border border-line bg-paper p-3" value={query} onChange={e => setQuery(e.target.value)} placeholder="พิมพ์ชื่อข่าว กิจกรรม หรือ MMS Hub…" /></label>
      <label className="text-sm">ประเภท<select className="mt-1 block w-full rounded-lg border border-line bg-paper p-3" value={kind} onChange={e => setKind(e.target.value)}><option value="all">ข่าวและกิจกรรม</option><option value="news">ข่าว</option><option value="activities">กิจกรรม</option></select></label>
      <label className="text-sm">สถานะ<select className="mt-1 block w-full rounded-lg border border-line bg-paper p-3" value={status} onChange={e => setStatus(e.target.value)}><option value="all">ทุกสถานะ</option><option value="published">เผยแพร่แล้ว</option><option value="draft">ฉบับร่าง</option><option value="imported">จากคลัง MMS Hub</option></select></label>
    </div>
    <p className="mb-3 text-sm text-muted" aria-live="polite">พบ {filtered.length} จาก {items.length} รายการ</p>
    <div className="space-y-3">
      {filtered.map(item => <article key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-paper p-4">
        {item.cover && <img src={item.cover} alt="" className="h-16 w-24 rounded-lg object-cover" /> /* eslint-disable-line @next/next/no-img-element */}
        <div className="min-w-0 flex-1 basis-48">
          <div className="mb-2 flex flex-wrap gap-2 text-xs"><span>{item.kind === "news" ? "ข่าว" : "กิจกรรม"}</span><span className="rounded-full bg-surface px-2 py-0.5">{item.imported ? "จากคลัง MMS Hub" : item.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง — ยังไม่แสดงบนหน้าเว็บ"}</span>{item.partner && !item.imported && <span>MMS Hub · เนื้อหาจากเครือข่าย</span>}</div>
          <h2 className="font-medium">{item.title || item.titleEn || "ยังไม่มีหัวข้อ"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {item.imported ? <ManageImportedNewsButton kind={item.kind} slug={item.slug} label="เปิดในตัวแก้ไข →" /> : <Link className="rounded-lg bg-accent px-3 py-2 font-medium text-accent-ink" href={`/admin/${item.kind}/${item.id}`}>แก้ไข</Link>}
          {(item.imported || item.status === "published") && <Link className="text-accent underline" target="_blank" rel="noreferrer" href={item.imported && item.kind === "activities" ? `/th/mms-hub/${item.id.slice(4)}` : `/th/${item.kind}/${item.slug}`}>ดูบนเว็บไซต์ ↗</Link>}
        </div>
      </article>)}
      {!filtered.length && <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">ไม่พบรายการ ลองล้างคำค้นหาหรือเลือกทุกสถานะ</p>}
    </div>
  </div>;
}
