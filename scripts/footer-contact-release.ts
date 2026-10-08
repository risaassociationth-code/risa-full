import { readFile } from "node:fs/promises";
import type postgres from "postgres";

export async function releaseFooterContact(sql: ReturnType<typeof postgres>) {
  return sql.begin(async (tx) => {
    await tx`set local lock_timeout = '10s'`;
    await tx`set local statement_timeout = '30s'`;
    await tx`select pg_advisory_xact_lock(hashtext('release_footer_contact_2026_10_08'))`;

    // Supabase's existing schema was deployed without the app's optional
    // schema_migrations table. The recovery audit row is the release marker.
    const applied = await tx`select id from audit_log
      where action = 'release_footer_contact_2026_10_08'
        and entity = 'settings' and entity_id = 'singleton' limit 1`;
    if (applied.length) return "already-applied";

    // Both reviewed migrations share one transaction, including the backup.
    // Check the marker first so later settings/schema edits remain untouched.
    for (const name of ["0007_optional_office_coordinates.sql", "0008_correct_footer_contact.sql"]) {
      const migration = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
      await tx.unsafe(migration).simple();
    }
    return "applied";
  });
}

export function releaseFailureMessage(error: unknown) {
  // Never log database messages, URLs, queries, detail or connection objects.
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  const safeCode = typeof code === "string" && /^[A-Z0-9]{5}$/.test(code) ? ` (SQLSTATE ${code})` : "";
  return `Footer data release failed${safeCode}. Build stopped; inspect the scoped settings and audit marker before retrying.`;
}
