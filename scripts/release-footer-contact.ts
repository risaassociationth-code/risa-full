import postgres from "postgres";
import { releaseFailureMessage, releaseFooterContact } from "./footer-contact-release";

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
    const result = await releaseFooterContact(sql);
    console.log(`Footer data release ${result}; scoped before/after backup retained in audit_log.`);
  } finally {
    clearTimeout(deadline);
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(releaseFailureMessage(error));
  process.exitCode = 1;
});
