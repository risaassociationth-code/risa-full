import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { CodexWorkspace } from "@/components/admin/CodexWorkspace";

export const dynamic = "force-dynamic";

export default async function CodexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?next=/admin/codex");
  if (user.role !== "admin") redirect("/admin");

  const liveEnabled =
    process.env.RISA_CODEX_ENABLED === "1" && Boolean(process.env.RISA_OPENAI_API_KEY);

  return (
    <div>
      <p className="admin-kicker mb-4">RISA / CODEX</p>
      <PageHeader
        title="Codex"
        description="เตรียมงานให้ Codex และพูดคุยกับผู้ช่วย AI สำหรับผู้ดูแลระบบ"
      />
      <CodexWorkspace liveEnabled={liveEnabled} />
    </div>
  );
}
