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

function build() {
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

if (require.main === module) build();
module.exports = { checkSitemap };
