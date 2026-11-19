#!/usr/bin/env node
/* Real-time frame rate on the game's own animation loop (not stepped), so its adaptive quality logic runs as it
   would for a player. Software rasterisation (no GPU); the phone profile is throttled 4x. Compare versions with each
   other; absolute numbers are pessimistic.
   usage: node fps_real.js <gameDir> <label> <hd2d:on|off|na> <profile> <sceneIdPrefix> <outJson> */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [gameDir, label, hd2d, profile, scenePrefix, outJson] = process.argv.slice(2);
const ROOT = path.resolve(gameDir), PORT = 9600 + Math.floor(Math.random() * 300);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const PROFILES = { desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, mobile: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } };
const sc = require('./scenes.js').find((s) => s.id.startsWith(scenePrefix));
(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const b = await chromium.launch(); const ctx = await b.newContext(PROFILES[profile]);
  const p = await ctx.newPage(); await p.goto(`http://localhost:${PORT}/index.html`); await p.waitForTimeout(800);
  if (profile === 'mobile') { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await p.evaluate(([hd2d, setup]) => { settings.lpc = true; if (hd2d !== 'na') settings.hd2d = hd2d === 'on'; settings.sfx = false; settings.music = false; settings.hints = false;
    window.go = (L) => { newGame(); startBrief(L); startPlay(); G.cine = null; G.iris = null; G.grace = 1e9; G.god = true; G.alert = 0; G.msg = null; G.msgT = 0; };
    new Function(setup.replace(/V\.dbgZoom=[\d.]+;?/g, ''))(); window.__n = 0; (function c() { window.__n++; requestAnimationFrame(c); })(); }, [hd2d, sc.setup]);
  const out = { label, profile, scene: sc.id, samples: [] };
  for (let i = 0; i < 4; i++) {                       // four 3-second windows: shows the tier settling as the game degrades
    const n0 = await p.evaluate(() => window.__n); await p.waitForTimeout(3000); const n1 = await p.evaluate(() => window.__n);
    out.samples.push({ window: i + 1, fps: +((n1 - n0) / 3).toFixed(1), tier: await p.evaluate(() => Q.tier) });
  }
  fs.writeFileSync(outJson, JSON.stringify(out, null, 1));
  console.log(label.padEnd(20), profile.padEnd(8), sc.id.slice(0, 2), out.samples.map((s) => `${s.fps}fps/t${s.tier}`).join('  '));
  await b.close(); srv.close();
})();
