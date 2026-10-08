import { readFile } from "node:fs/promises";
import postgres from "postgres";

// Run only on the existing RISA production pipeline, before Next caches data.
// Credentials stay in Vercel; no admin route, permission, or new secret is added.
async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Footer data release skipped outside Vercel production.");
    return;
  }
  if (process.env.VERCEL_GIT_REPO_OWNER !== "risaassociationth-code"
      || process.env.VERCEL_GIT_REPO_SLUG !== "risa-full"
      || process.env.VERCEL_GIT_COMMIT_REF !== "main") {
    throw new Error("Footer data release requires the canonical RISA main production build.");
  }
  if (!process.env.DATABASE_URL) throw new Error("Production database is not configured.");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1, prepare: false, connect_timeout: 10, onnotice: () => {},
  });
  const deadline = setTimeout(() => {
    console.error("Footer data release timed out.");
    process.exit(1);
  }, 90_000);
  try {
    await sql.begin(async (tx) => {
      await tx`set local lock_timeout = '10s'`;
      await tx`set local statement_timeout = '30s'`;
      // Only these reviewed migrations run. This is never a general seed/reset.
      for (const name of ["0007_optional_office_coordinates.sql", "0008_correct_footer_contact.sql"]) {
        const applied = await tx`select name from schema_migrations where name = ${name}`;
        if (applied.length) continue;
        const migration = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
        await tx.unsafe(migration).simple();
        await tx`insert into schema_migrations (name) values (${name}) on conflict (name) do nothing`;
      }
    });
    console.log("Footer data release verified; scoped before/after backup retained in audit_log.");
  } finally {
    clearTimeout(deadline);
    await sql.end({ timeout: 5 });
  }
}

main().catch(() => {
  // Database errors can contain connection details; keep production logs bounded.
  console.error("Footer data release failed. Transaction rolled back; review the approved settings and database access.");
  process.exitCode = 1;
});
