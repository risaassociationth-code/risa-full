import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sid")?.slice(0, 64);
  const isNew = url.searchParams.get("new") === "1";

  let active = 1;
  let total = 1;

  try {
    // 1. If session provided, record presence
    if (sessionId) {
      await sql`
        insert into public.active_visitors (session_id, last_seen)
        values (${sessionId}, now())
        on conflict (session_id) do update set last_seen = now()
      `.catch(() => {});

      if (isNew) {
        await sql`
          insert into public.site_visits (id, total_views)
          values ('global', 1)
          on conflict (id) do update set total_views = public.site_visits.total_views + 1, updated_at = now()
        `.catch(() => {});
      }
    }

    // 2. Cleanup stale sessions (> 3 minutes ago)
    await sql`
      delete from public.active_visitors where last_seen < now() - interval '3 minutes'
    `.catch(() => {});

    // 3. Count exact active sessions
    const activeRes = await sql<{ count: string }[]>`
      select count(*)::text as count from public.active_visitors
      where last_seen >= now() - interval '3 minutes'
    `.catch(() => []);

    const dbActive = activeRes[0]?.count ? parseInt(activeRes[0].count, 10) : 0;
    // Current visitor is connected, so active count is at least 1
    active = Math.max(1, dbActive);

    // 4. Get total visits
    const totalRes = await sql<{ total_views: string }[]>`
      select total_views::text from public.site_visits where id = 'global' limit 1
    `.catch(() => []);

    if (totalRes[0]?.total_views) {
      total = Math.max(1, parseInt(totalRes[0].total_views, 10));
    }
  } catch {
    // Use fallback metrics if database is initializing
  }

  return NextResponse.json(
    {
      active,
      total,
      updated_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(request: Request) {
  return GET(request);
}
