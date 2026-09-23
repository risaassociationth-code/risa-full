import "server-only";
import postgres from "postgres";

declare global {
  var __risa_sql: ReturnType<typeof postgres> | undefined;
}

const connection = process.env.DATABASE_URL;
if (!connection) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

const rawSql =
  global.__risa_sql ??
  postgres(connection, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: { undefined: null },
    // Supabase's Supavisor transaction-mode pooler (port 6543) does not
    // support prepared statements — each connection can be handed to a
    // different backend between queries.
    prepare: false,
  });

// Vercel can reuse a server instance for many requests. Keep its pool alive
// for that instance instead of opening a new database client on every render.
global.__risa_sql = rawSql;

const QUERY_TIMEOUT_MS = 15_000;

/**
 * postgres.js never rejects a query stuck on a failed connection — on a
 * connect error it calls its own internal `reconnect()` and retries with
 * backoff forever, so a caller just hangs (confirmed: no pg_stat_activity
 * row is ever created for these attempts). `connect_timeout` only bounds a
 * single attempt, not that retry loop, so a bad network path between the
 * build region and the database can hang a page indefinitely. Forcing a
 * real rejection here lets Next's own page-generation retry actually get a
 * fresh attempt instead of waiting out the full per-page timeout.
 */
export const sql = new Proxy(rawSql, {
  apply(target, thisArg, args) {
    const result = Reflect.apply(target, thisArg, args);
    // sql(identifier) / sql(row, ...cols) — postgres.js's dynamic-value
    // helpers, used nested inside a real tagged call (e.g. `${sql(table)}`).
    // These return an Identifier/Builder, not a Query, and aren't awaitable
    // — postgres.js itself throws if you try. Only a genuine tagged-template
    // call (args[0].raw is an array) produces the Query we want to guard.
    const isTaggedCall = Array.isArray((args[0] as { raw?: unknown })?.raw);
    if (!isTaggedCall) return result;

    const query = result as Promise<unknown>;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Database query timed out after ${QUERY_TIMEOUT_MS}ms`)),
        QUERY_TIMEOUT_MS,
      );
      query.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (err) => { clearTimeout(timer); reject(err); },
      );
    });
  },
}) as typeof rawSql;
