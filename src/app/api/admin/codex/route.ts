import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

function reply(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 4000
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return reply({ error: "ไม่มีสิทธิ์เข้าถึง" }, 403);

  // A key on its own never enables billing. Both settings must be present.
  const key = process.env.RISA_OPENAI_API_KEY;
  if (process.env.RISA_CODEX_ENABLED !== "1" || !key) {
    return reply({ error: "AI ในเว็บไซต์ยังไม่เปิดใช้งาน" }, 503);
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return reply({ error: "คำขอไม่ถูกต้อง" }, 403);
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 16000) {
    return reply({ error: "ข้อความยาวเกินไป" }, 413);
  }
  const raw = await request.text();
  if (raw.length > 16000) return reply({ error: "ข้อความยาวเกินไป" }, 413);

  let messages: unknown;
  try {
    const parsed = JSON.parse(raw) as { messages?: unknown };
    messages = parsed.messages;
  } catch {
    return reply({ error: "รูปแบบข้อความไม่ถูกต้อง" }, 400);
  }
  if (
    !Array.isArray(messages) ||
    messages.length < 1 ||
    messages.length > 7 ||
    !messages.every(isMessage) ||
    messages[messages.length - 1].role !== "user"
  ) {
    return reply({ error: "กรุณาตรวจสอบข้อความแล้วลองอีกครั้ง" }, 400);
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-6-sol",
        instructions:
          "You are a bilingual Thai-English writing assistant for RISA's website administrators. Help explain the admin interface and draft or review website text. You have no tools or direct access to site data. Never claim to have edited, published, verified, or inspected content you were not given. Ask for missing facts; avoid inventing organizational claims. Do not request or reproduce passwords or secrets. Answer in the user's language.",
        input: messages,
        reasoning: { effort: "low" },
        max_output_tokens: 800,
        store: false,
      }),
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });

    if (!upstream.ok) return reply({ error: "บริการ AI ยังตอบไม่ได้ กรุณาลองอีกครั้ง" }, 502);
    const result = (await upstream.json()) as {
      output?: { type?: string; role?: string; content?: { type?: string; text?: string }[] }[];
    };
    const text = result.output
      ?.filter((item) => item.type === "message" && item.role === "assistant")
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n");
    if (!text) return reply({ error: "AI ยังไม่มีคำตอบ กรุณาลองอีกครั้ง" }, 502);
    return reply({ reply: text }, 200);
  } catch {
    return reply({ error: "การเชื่อมต่อ AI ล้มเหลว กรุณาลองอีกครั้ง" }, 502);
  }
}
