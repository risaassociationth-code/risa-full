"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ExternalLink, LogOut } from "lucide-react";
import { AdminLanguageSwitch, useAdminLanguage } from "./AdminLanguage";

type TopbarProps = {
  user: {
    name?: string | null;
    username: string;
    role: string;
  };
};

export function Topbar({ user }: TopbarProps) {
  const { locale } = useAdminLanguage();
  const th = locale === "th";
  const pathname = usePathname();
  const onBoard = pathname === "/admin";

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/95 pl-4 pr-4 backdrop-blur lg:pl-8 lg:pr-8">
      {!onBoard && (
        <Link
          href="/admin"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[14px] font-medium text-ink hover:bg-surface"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {th ? "กลับหน้าหลัก" : "Back to board"}
        </Link>
      )}
      <Link
        href={th ? "/th" : "/en"}
        target="_blank"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
      >
        <ExternalLink className="size-3.5" />
        {th ? "ดูเว็บไซต์" : "View site"}
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <AdminLanguageSwitch />
        <div className="text-right leading-tight">
          <p className="text-[13px] font-medium">{user.name || user.username}</p>
          <p className="text-[11px] text-faint">
            {user.role === "admin"
              ? th ? "ผู้ดูแลระบบ" : "Admin"
              : th ? "ผู้แก้ไข" : "Editor"}
          </p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            title={th ? "ออกจากระบบ" : "Log out"}
            aria-label={th ? "ออกจากระบบ" : "Log out"}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
