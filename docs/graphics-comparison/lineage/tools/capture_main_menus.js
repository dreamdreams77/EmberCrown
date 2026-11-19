#!/usr/bin/env node
/* usage: node capture_main_menus.js <gameDir> <outDir> <desktop|mobile>   (pixel-art lineage, settings.hd2d=false = configuration B)
   Same deterministic harness; captures the DOM menus and journals using the game's own entry points. */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [gameDir, outDir, profile = 'desktop'] = process.argv.slice(2);
const ROOT = path.resolve(gameDir), OUT = path.resolve(outDir), PORT = 9400 + Math.floor(Math.random() * 400);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const PROFILES = { desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, mobile: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } };
(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const b = await chromium.launch(); const ctx = await b.newContext(PROFILES[profile]);
  await ctx.addInitScript(() => { let q = [], now = 0; window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.__step = (ms) => { now += ms; const c = q; q = []; for (const f of c) f(now); };
    let s = 1; window.__seed = (n) => { s = n >>> 0; }; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/index.html`);
  for (let i = 0; i < 30; i++) await p.evaluate(() => __step(33.333));
  await p.evaluate(() => { settings.lpc = true; settings.hd2d = false; settings.sfx = false; settings.music = false;
    window.go = (L) => { newGame(); startBrief(L); startPlay(); G.cine = null; G.iris = null; G.grace = 1e9; G.god = true; G.alert = 0; G.msg = null; G.msgT = 0; for (const k in keys) keys[k] = false; }; });
  fs.mkdirSync(OUT, { recursive: true });
  const shot = async (id, setup, n = 40) => { const f = await p.evaluate((s) => { try { __seed(4242); new Function(s)(); return null; } catch (e) { return String(e.message || e); } }, setup);
    if (f) { console.log('SKIP', id, f); return; }
    for (let i = 0; i < n; i++) await p.evaluate(() => { if (typeof G !== 'undefined' && G && mode === 'play') { G.grace = 1e9; G.alert = 0; } __step(33.333); });
    await p.screenshot({ path: path.join(OUT, id + '.png') }); process.stdout.write('m'); };
  await shot('m01-title', "toTitle();");
  await shot('m02-brief', "newGame();startBrief(0);");
  await shot('m03-pause', "go(1);pauseGame(true);");
  await shot('m04-case-file', "go(1);UI.openJournal('case');");
  await shot('m05-court', "newGame();lvl=1;setMode('court');");
  await shot('m06-hub', "newGame();run.ranks[0]='A';Hub.enter(1);G.grace=1e9;G.god=true;G.cine=null;", 60);
  console.log('\nerrors:', [...new Set(errs)].slice(0, 4)); await b.close(); srv.close();
})();
