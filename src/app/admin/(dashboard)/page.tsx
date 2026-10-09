import { requireUser } from "@/lib/auth";
import { listRows } from "@/components/admin/collection-data";
import { ConstellationMap, type ConstellationData, type MapCollection } from "@/components/admin/ConstellationMap";

export const metadata = { title: "หน้าหลักผู้ดูแล · RISA Admin" };

import { sql } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();
  const keys: MapCollection[] = ["news", "activities", "calendar", "team"];
  const entries = await Promise.all(keys.map(async key => {
    const rows = await listRows(key);
    const title = key === "team" ? "name" : "title";
    return [key, { total: rows.length, records: rows.map(row => ({
      id: String(row.id), title_th: String(row[`${title}_th`] ?? ""), title_en: String(row[`${title}_en`] ?? ""),
      slug: String(row.slug ?? ""), status: String(row.status ?? "draft"),
    })) }] as const;
  }));
  return <ConstellationMap workspaceKey={user.id} data={Object.fromEntries(entries) as ConstellationData} />;
}
