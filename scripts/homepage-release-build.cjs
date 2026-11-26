'use strict';
// Deployment-only entry point. Contains no service credentials.
const {spawn} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname,'homepage-published.json'),'utf8'));
const origin = 'https://risa-association.com';
const digest = paths => createHash('sha256').update(paths.map(p=>new URL(p,origin).pathname).sort().join('\n')).digest('hex');
const getPaths = (xml, allowLegacy=false) => Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), m=>{ const u=new URL(m[1]); if(u.origin!==origin && !(allowLegacy && u.origin==='http://localhost:3000')) throw new Error('Noncanonical sitemap hostname'); return u.pathname; });
async function run() {
  const local = process.env.VERCEL !== '1' && process.env.RISA_LOCAL_BASELINE; const live = local ? null : await fetch(origin+'/sitemap.xml', {redirect:'error',signal:AbortSignal.timeout(15000)});
  const baseline = getPaths(local ? JSON.parse(fs.readFileSync(local,'utf8')).sitemap : await live.text(),true);
  if ((live && !live.ok) || baseline.length < 8 || baseline.length !== snapshot.pathCount || digest(baseline)!==snapshot.pathDigest) throw new Error('Public baseline changed; refresh the verified published rows before building.');
  const sockets = new Set();
  const db = net.createServer(socket=>{
    sockets.add(socket);
    socket.on('error',()=>{});
    socket.on('close',()=>sockets.delete(socket));
    socket.once('data',()=>{
      const body=Buffer.from('SFATAL\0VFATAL\0C28000\0MNo database attached to release compilation.\0\0');
      const header=Buffer.alloc(5); header[0]=0x45; header.writeInt32BE(body.length+4,1);
      socket.end(Buffer.concat([header,body]));
    });
  });
  await new Promise((resolve,reject)=>{ db.once('error',reject);db.listen(0,'127.0.0.1',resolve); });
  try {
    const env = {...process.env};
    for (const name of Object.keys(env)) if (/^(PG|POSTGRES|DATABASE|SUPABASE)|^(SESSION_SECRET|BLOB_READ_WRITE_TOKEN)$/.test(name)) delete env[name];
    env.DATABASE_URL='postgresql://fixture@127.0.0.1:'+db.address().port+'/fixture?sslmode=disable';
    env.NEXT_PUBLIC_SITE_URL=origin;
    env.RISA_BUILD_SITEMAP_ROWS=JSON.stringify(snapshot.rows);
    const code = await new Promise((resolve,reject)=>{
      const proc=spawn(process.execPath,['./node_modules/next/dist/bin/next','build'],{cwd:root,env,stdio:'inherit',windowsHide:true});
      proc.once('error',reject);proc.once('exit',resolve);
    });
    if (code!==0) throw new Error('Direct Next.js build failed.');
    const built=getPaths(fs.readFileSync(path.join(root,'.next/server/app/sitemap.xml.body'),'utf8'));
    if (built.length!==baseline.length || digest(built)!==digest(baseline)) throw new Error('Generated sitemap does not match production.');
    console.log('Published sitemap parity verified: '+built.length+' canonical paths.');
  } finally { for (const socket of sockets) socket.destroy(); db.close(); }
}
run().catch(err=>{console.error(err.message);process.exitCode=1;});
