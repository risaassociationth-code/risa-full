"use client";

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
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

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/95 pl-16 pr-4 backdrop-blur lg:pl-8 lg:pr-8">
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
