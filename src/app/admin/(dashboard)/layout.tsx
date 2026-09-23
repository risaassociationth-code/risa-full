
import { AdminText } from "@/components/admin/AdminLanguage";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?next=/admin");

  return (
    <div className="min-h-full lg:pl-60">
      <Sidebar />
      <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/95 pl-16 pr-4 backdrop-blur lg:pl-8 lg:pr-8">
        <Link
          href="/th"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
        >
          <ExternalLink className="size-3.5" /><AdminText>{"ดูเว็บไซต์"}</AdminText></Link>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-[13px] font-medium">{user.name || user.username}</p>
            <p className="text-[11px] text-faint">{user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้แก้ไข"}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
              className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
