"use client";

import { FormEvent, useState } from "react";
import { Card, CardHead } from "@/components/admin/ui";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  { label: "เขียนข่าว", prompt: "ช่วยร่างข่าวภาษาไทยและภาษาอังกฤษสำหรับเว็บไซต์ RISA จากข้อมูลนี้: " },
  { label: "ปรับหน้าเว็บ", prompt: "ช่วยตรวจและเสนอการปรับปรุงหน้าเว็บไซต์ RISA นี้ โดยยังไม่แก้ไขหรือเผยแพร่อะไร: " },
  { label: "ตรวจเนื้อหา", prompt: "ช่วยตรวจความชัดเจน ความถูกต้อง และความเหมาะสมของเนื้อหา RISA นี้: " },
];

export function CodexWorkspace({ liveEnabled }: { liveEnabled: boolean }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function copyTask() {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft.trim());
      setNotice("คัดลอกแล้ว — วางข้อความนี้ในแอป Codex เพื่อทำงานต่อ");
    } catch {
      setNotice("คัดลอกไม่ได้ กรุณาเลือกและคัดลอกข้อความด้วยตนเอง");
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !liveEnabled || busy) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/codex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-5) }),
      });
      const result: { reply?: string; error?: string } = await response.json();
      if (!response.ok || !result.reply) throw new Error(result.error || "ไม่สามารถรับคำตอบได้");
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (error) {
      setMessages(messages);
      setDraft(content);
      setNotice(error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHead
          title={liveEnabled ? "พูดคุยกับ AI" : "เตรียมงานให้ Codex"}
          hint={liveEnabled ? "ผู้ช่วยในหน้านี้เป็น API แยกจากบทสนทนาในแอป Codex" : "ยังไม่เปิดการเชื่อมต่อ AI ในเว็บไซต์ — การคัดลอกงานใช้งานได้ทันที"}
        />
        <div className="p-5">
          {messages.length > 0 && (
            <div aria-live="polite" className="mb-5 max-h-[420px] space-y-3 overflow-y-auto border-b border-line-soft pb-5">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "ml-8 rounded-lg bg-surface p-4" : "mr-8 rounded-lg border border-line p-4"}>
                  <p className="mb-1 text-xs font-medium text-muted">{message.role === "user" ? "คุณ" : "AI ผู้ช่วย"}</p>
                  <p className="whitespace-pre-wrap break-words text-sm text-ink">{message.content}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button key={starter.label} type="button" onClick={() => setDraft(starter.prompt)} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2 hover:bg-surface">
                {starter.label}
              </button>
            ))}
          </div>
          <form onSubmit={send}>
            <label htmlFor="codex-task" className="mb-2 block text-sm font-medium">อยากให้ช่วยอะไร?</label>
            <textarea
              id="codex-task"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={4000}
              rows={6}
              placeholder="เช่น ช่วยร่างข่าวจากข้อมูลกิจกรรมนี้..."
              className="w-full resize-y rounded-lg border border-line bg-white p-3 text-sm outline-none focus:border-accent"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={copyTask} disabled={!draft.trim()} className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50">
                คัดลอกไป Codex
              </button>
              {liveEnabled && (
                <button type="submit" disabled={!draft.trim() || busy} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {busy ? "กำลังตอบ..." : "ส่งให้ AI"}
                </button>
              )}
              <span className="text-xs text-faint">{draft.length}/4000</span>
            </div>
            {notice && <p role="status" className="mt-3 text-sm text-ink-2">{notice}</p>}
          </form>
        </div>
      </Card>
      <Card className="self-start p-5">
        <h2 className="text-sm font-semibold">การเข้าถึงและค่าใช้จ่าย</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-muted">
          <li>ส่วนนี้เปิดให้บัญชีผู้ดูแลระบบเท่านั้น</li>
          <li>การคัดลอกงานไปแอป Codex ไม่เรียก API จากเว็บไซต์</li>
          <li>{liveEnabled ? "การส่งข้อความในหน้านี้ใช้ OpenAI API และอาจมีค่าใช้จ่ายแยกต่างหาก" : "AI ในหน้านี้ยังปิดอยู่ จึงไม่มีการเรียก OpenAI API"}</li>
          <li>AI ในหน้านี้ช่วยตอบและร่างข้อความเท่านั้น ยังแก้ไขหรือเผยแพร่เว็บไซต์ไม่ได้</li>
          <li>อย่าใส่รหัสผ่านหรือข้อมูลลับในข้อความ</li>
        </ul>
      </Card>
    </div>
  );
}
