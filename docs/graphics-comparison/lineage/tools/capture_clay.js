#!/usr/bin/env node
/* usage: node capture_clay.js <gameDir> <outDir> <desktop|mobile>
   Same deterministic harness as ../../tools/capture.js (manual rAF clock, seeded Math.random, fresh profile), for the
   clay-and-ink lineage. Only the game's own functions are used; nothing in the game is changed. */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [gameDir, outDir, profile = 'desktop', filter] = process.argv.slice(2);
const SC = require('./scenes_clay.js').filter((s) => !filter || filter.split(',').some((f) => s.id.includes(f)));
const ROOT = path.resolve(gameDir), OUT = path.resolve(outDir), PORT = 8900 + Math.floor(Math.random() * 500);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const PROFILES = { desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, mobile: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } };
(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const b = await chromium.launch(); const ctx = await b.newContext(PROFILES[profile]);
  await ctx.addInitScript(() => {
    let q = [], now = 0; window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.__step = (ms) => { now += ms; const c = q; q = []; for (const f of c) f(now); };
    let s = 1; window.__seed = (n) => { s = n >>> 0; }; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    try { localStorage.clear(); } catch (e) {}
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/index.html`);
  for (let i = 0; i < 30; i++) await p.evaluate(() => __step(33.333));
  fs.mkdirSync(OUT, { recursive: true });
  await p.evaluate(() => { window.go = (L) => { newGame(); startBrief(L); startPlay(); G.msg = null; G.msgT = 0; G.sayQ = []; for (const k in keys) keys[k] = false; };
    window.quiet = () => { if (G) { G.alert = 0; G.msgT = 0; } }; });
  // menus first
  const shot = async (id, setup, n = 20) => { await p.evaluate((s) => { __seed(4242); for (const k in keys) keys[k] = false; new Function(s)(); }, setup);
    for (let i = 0; i < n; i++) await p.evaluate(() => __step(33.333)); await p.screenshot({ path: path.join(OUT, id + '.png') }); process.stdout.write('m'); };
  await shot('m01-title', "mode='title';");
  await shot('m02-brief', "newGame();lvl=0;mode='brief';");
  await shot('m03-pause', "go(1);mode='pause';");
  await shot('m04-case-file', "go(1);openCase();");
  await shot('m05-choice', "go(4);mode='choice';G.choice=null;try{G.d.finale=false}catch(e){}");
  for (const sc of SC) {
    const f = await p.evaluate(([s, fr]) => { try { __seed(4242); for (const k in keys) keys[k] = false; new Function(s)(); window.__fr = new Function('i', 's', fr); return null; } catch (e) { return String(e.message || e); } }, [sc.setup, sc.frame]);
    if (f) { console.log('SKIP', sc.id, f); continue; }
    for (let i = 0; i < sc.frames; i++) await p.evaluate(([i]) => { try { __fr(i, i / 30); } catch (e) {} if (G && mode === 'play') { G.alert = 0; if (G.msgT > 0) G.msgT = 0; G.grace = 1e9; } __step(33.333); }, [i]);
    await p.screenshot({ path: path.join(OUT, sc.id + '.png') }); process.stdout.write('.');
  }
  console.log('\nerrors:', [...new Set(errs)].slice(0, 4)); await b.close(); srv.close();
})();
