import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Topbar } from "@/components/admin/Topbar";

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?next=/admin");

  return (
    <div className="min-h-full">
      <Topbar user={user} />
      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
