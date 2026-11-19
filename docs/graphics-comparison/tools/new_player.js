#!/usr/bin/env node
/* D: what a new player sees. Fresh profile, current code, NO setting overrides (pixel art and HD-2D at their
   defaults), real key presses from the title. The game advances on a deterministic clock, as in capture.js.
   usage: node new_player.js <gameDir> <outDir> [desktop|mobile] */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [gameDir, outDir, profile = 'desktop'] = process.argv.slice(2);
const ROOT = path.resolve(gameDir), OUT = path.resolve(outDir), PORT = 8900 + Math.floor(Math.random() * 90);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
const PROFILES = { desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => srv.listen(PORT, r));
  const b = await chromium.launch();
  const log = {};
  // 1) the first-visit trailer (automated browsers never autoplay it, so it is opened the way the page does: ?intro=1)
  {
    const p = await (await b.newContext(PROFILES[profile])).newPage();
    await p.goto(`http://localhost:${PORT}/index.html?intro=1`); await p.waitForTimeout(2500);
    log.intro = await p.evaluate(() => { const v = document.querySelector('#intro video'); return { open: Intro.isOpen(), hasVideo: !!v, readyState: v && v.readyState, error: v && v.error && v.error.code, currentTime: v && v.currentTime, canH264: v && v.canPlayType('video/mp4; codecs="avc1.42E01E"') }; });
    await p.screenshot({ path: path.join(OUT, '01-first-visit-trailer-overlay.png') });
    await p.close();
  }
  // 2) title -> new game -> first minute, on a manual clock
  const ctx = await b.newContext(PROFILES[profile]);
  await ctx.addInitScript(() => {
    let q = [], now = 0; window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.__step = (ms) => { now += ms; const c = q; q = []; for (const f of c) f(now); };
    let s = 7; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    try { localStorage.clear(); } catch (e) {}
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/index.html`);
  const adv = async (n) => { for (let i = 0; i < n; i++) await p.evaluate(() => __step(33.333)); };
  const shot = async (name) => p.screenshot({ path: path.join(OUT, name + '.png') });
  await adv(45);
  log.defaults = await p.evaluate(() => ({ lpc: settings.lpc, hd2d: settings.hd2d, hints: settings.hints, cinema: settings.cinema, minimap: settings.minimap, mode, hd2dOnAtTitle: HD2D.on(), coarse: V.coarse }));
  await shot('02-title');
  const seq = [['Enter', 30, '03-after-enter'], ['Enter', 30, '04-after-second-enter']];
  for (const [k, n, name] of seq) {
    if (profile === 'mobile') { await p.evaluate(() => { const c = document.querySelector('canvas'); }); }
    await p.keyboard.press(k); await adv(n); await shot(name);
    log[name] = await p.evaluate(() => ({ mode, lvl: typeof lvl !== 'undefined' ? lvl : null, hd2dOn: HD2D.on(), cine: !!(G && G.cine) }));
  }
  // let the opening play out and take the first seconds of real play
  for (const [sec, name] of [[1.5, '05-opening-1.5s'], [4, '06-opening-4s'], [8, '07-play-8s'], [20, '08-play-20s']]) {
    await adv(Math.round(sec * 30) - (name === '05-opening-1.5s' ? 0 : 0));
    await shot(name);
    log[name] = await p.evaluate(() => ({ mode, hd2dOn: HD2D.on(), cine: !!(G && G.cine), tier: Q.tier }));
  }
  log.errors = [...new Set(errs)].slice(0, 5);
  fs.writeFileSync(path.join(OUT, 'new-player.json'), JSON.stringify(log, null, 1));
  console.log(JSON.stringify(log, null, 1));
  await b.close(); srv.close();
})();
