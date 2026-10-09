import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const DIR = path.join(process.cwd(), "supabase", "migrations");

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL or POSTGRES_URL is not set.");
    process.exit(1);
  }
  const sql = postgres(dbUrl, {
    onnotice: (n) => console.log(`    ${n.message}`),
  });

  await sql`create table if not exists schema_migrations (
    name text primary key, applied_at timestamptz not null default now())`;

  const applied = new Set(
    (await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name),
  );
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  · ${file} (already applied)`);
      continue;
    }
    const text = await readFile(path.join(DIR, file), "utf8");
    try {
      // Migrations contain multiple statements, so they go over the simple
      // protocol rather than the prepared-statement path.
      await sql.unsafe(text).simple();
      await sql`insert into schema_migrations (name) values (${file})`;
      console.log(`  ✓ ${file}`);
      ran++;
    } catch (e) {
      console.error(`  ✗ ${file}\n`, e);
      await sql.end();
      process.exit(1);
    }
  }

  console.log(ran === 0 ? "\n  Database already up to date." : `\n  ${ran} migration(s) applied.`);
  await sql.end();
}

main();
