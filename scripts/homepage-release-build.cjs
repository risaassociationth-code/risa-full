'use strict';

const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');

const expectedSitemap = '271182e66f1e367f85aedc63489b182d365641f1b0696c6fc68aeb8f9ec3fe73';

function checkSitemap(xml) {
  const paths = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => new URL(match[1]).pathname).sort();
  const digest = createHash('sha256').update(paths.join('\n')).digest('hex');
  if (digest !== expectedSitemap) {
    throw new Error('Published sitemap parity failed with ' + paths.length + ' paths.');
  }
  console.log('Published sitemap parity passed with ' + paths.length + ' paths.');
}

// Every application-data read in this diagnostic uses a single server-enforced
// read-only transaction. Closing it releases the transaction's settings.
async function inspectPublishedSource() {
  const uri = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!uri) throw new Error('Missing configured database binding.');
  let pool;
  let deadline;
  try {
    pool = require('postgres')(uri, { max: 1, prepare: false, connect_timeout: 8, idle_timeout: 2 });
    const port = Number([pool.options.port].flat()[0]);
    const tls = pool.options.ssl;
    const knownTls = ['require', 'allow', 'prefer', 'verify-ca', 'verify-full', 'disable'];
    const tlsLabel = !tls ? 'unspecified-or-disabled' : knownTls.includes(tls) ? tls : 'enabled';
    console.log('RISA connection metadata: port=' + port + ', TLS setting=' + tlsLabel);
    const probe = pool.begin('read only', async tx => {
      const [mode] = await tx`SELECT current_setting('transaction_read_only') AS actual,
        current_setting('default_transaction_read_only') AS default_mode,
        pg_is_in_recovery() AS replica,
        has_table_privilege(current_user, 'public.news', 'INSERT,UPDATE,DELETE') AS news_write_grant`;
      if (mode.actual !== 'on') throw new Error('Read-only transaction unavailable');
      const published = await tx`SELECT 'news' AS kind, slug FROM public.news WHERE status = 'published'
        UNION ALL SELECT 'activities' AS kind, slug FROM public.activities WHERE status = 'published'`;
      const paths = ['/th','/en','/th/news','/en/news','/th/activities','/en/activities','/th/team','/en/team'];
      for (const { kind, slug } of published) {
        for (const locale of ['th','en']) paths.push(new URL('https://example.invalid/' + locale + '/' + kind + '/' + slug).pathname);
      }
      const digest = createHash('sha256').update(paths.sort().join('\n')).digest('hex');
      console.log('RISA source check: transaction=' + mode.actual + ', default=' + mode.default_mode +
        ', replica=' + mode.replica + ', existing news write grant=' + mode.news_write_grant +
        ', published paths=' + paths.length + ', baseline equal=' + (digest === expectedSitemap));
      if (digest !== expectedSitemap) throw new Error('Published source differs from the public baseline');
      return mode.default_mode === 'on' || mode.replica === true;
    });
    return await Promise.race([probe, new Promise((_, reject) => {
      deadline = setTimeout(() => reject(new Error('Connection deadline')), 16000);
    })]);
  } catch {
    throw new Error('Could not verify the real published source in a bounded read-only transaction.');
  } finally {
    clearTimeout(deadline);
    if (pool) await pool.end({ timeout: 1 });
  }
}

async function build() {
  if (!(await inspectPublishedSource())) {
    throw new Error('The verified transaction served the published data, but this pooler is not a read-only target by default. The original target gate has been preserved.');
  }
  process.env.PGTARGETSESSIONATTRS = 'read-only';
  try {
    const uri = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!uri || require('postgres')(uri).options.target_session_attrs !== 'read-only') throw new Error();
  } catch {
    throw new Error('The configured database connection does not select read-only targets.');
  }

  const run = spawnSync(process.execPath, ['./node_modules/next/dist/bin/next', 'build'], { stdio: 'inherit' });
  if (run.status !== 0) throw new Error('Direct Next.js build failed.');
  checkSitemap(fs.readFileSync('.next/server/app/sitemap.xml.body', 'utf8'));
}

if (require.main === module) build().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { checkSitemap };
