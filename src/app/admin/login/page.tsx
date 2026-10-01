import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeLoginReturn } from "@/lib/login-return";
import { LoginForm } from "@/components/admin/LoginForm";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata = { title: "เข้าสู่ระบบ · RISA Admin" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const target = safeLoginReturn(next);
  if (await getCurrentUser()) redirect(target);

  return (
    <div className="admin-login">
      <section className="admin-login-intro">
        <Link href="/th" aria-label="RISA — กลับสู่เว็บไซต์">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/risa-lockup.png" alt="RISA" className="h-10 w-auto brightness-0 invert" />
        </Link>
        <div>
          <span className="text-[11px] tracking-[.2em] text-[#dcc99c]">RISA / CONTENT STUDIO</span>
          <h2>ทุกเรื่องราวของ RISA<br />เริ่มต้นได้ที่นี่</h2>
          <p>พื้นที่สำหรับทีมงานในการเผยแพร่ข่าวสาร กิจกรรม และองค์ความรู้ของสมาคม</p>
        </div>
        <p className="text-xs">RESEARCH · KNOWLEDGE · COMMUNITY</p>
      </section>
      <main className="admin-login-form">
        <div className="w-full max-w-sm">
          <p className="admin-kicker mb-4">WELCOME BACK</p>
          <h1 className="mb-3 text-3xl font-normal">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="mb-8 text-sm text-muted">จัดการเนื้อหาและอัปเดตเว็บไซต์ RISA</p>
          <LoginForm next={target} />
          <p className="mt-6 border-t border-line pt-5 text-xs text-muted">ยังไม่มีบัญชีหรือลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบของสมาคม</p>
          <Link href="/th" className="mt-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> กลับสู่เว็บไซต์ <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
