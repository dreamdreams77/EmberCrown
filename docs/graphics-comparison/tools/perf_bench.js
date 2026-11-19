#!/usr/bin/env node
/* Frame cost per configuration. Runs one scene at a time on the deterministic clock and times each step
   (update + draw + the browser's paint) in wall-clock milliseconds. Headless Chromium rasterises on the CPU with
   no GPU, so absolute numbers are pessimistic; compare configurations with each other, not with a phone.
   The phone profile is also throttled 4x with the DevTools CPU throttle.
   usage: node perf_bench.js <gameDir> <label> <hd2d:on|off|na> <profile:desktop|mobile> <tier:0|2> <outJson> [shotDir] */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [gameDir, label, hd2d, profile, tierArg, outJson, shotDir] = process.argv.slice(2);
const ROOT = path.resolve(gameDir), PORT = 9100 + Math.floor(Math.random() * 400);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const PROFILES = { desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, mobile: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } };
const SC = require('./scenes.js').filter((s) => ['01-', '04-', '07-', '12-'].some((x) => s.id.startsWith(x)));
(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const b = await chromium.launch(); const ctx = await b.newContext(PROFILES[profile]);
  await ctx.addInitScript(() => { let q = [], now = 0; window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.__step = (ms) => { now += ms; const c = q; q = []; for (const f of c) f(now); };
    let s = 1; window.__seed = (n) => { s = n >>> 0; }; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto(`http://localhost:${PORT}/index.html`);
  for (let i = 0; i < 20; i++) await p.evaluate(() => __step(33.333));
  if (profile === 'mobile') { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await p.evaluate(([hd2d, tier]) => { settings.lpc = true; if (hd2d !== 'na') settings.hd2d = hd2d === 'on'; settings.sfx = false; settings.music = false; settings.hints = false; window.__tier = +tier;
    window.go = (L) => { newGame(); startBrief(L); startPlay(); G.cine = null; G.iris = null; G.grace = 1e9; G.god = true; G.alert = 0; G.msg = null; G.msgT = 0; for (const k in keys) keys[k] = false; }; }, [hd2d, tierArg]);
  const out = { label, profile, tier: +tierArg, scenes: {} };
  for (const sc of SC) {
    const setup = sc.setup.replace(/V\.dbgZoom=[\d.]+;?/g, '');
    await p.evaluate(([setup, frame]) => { __seed(4242); new Function(setup)(); Q.tier = window.__tier; if (Q.tier >= 2) { Q.maxP = 150; Q.amb = .3; } window.__fr = new Function('i', 's', frame); }, [setup, sc.frame]);
    const ms = [];
    for (let i = 0; i < 90; i++) { const t0 = Date.now();
      await p.evaluate(([i]) => { try { __fr(i, i / 30); } catch (e) {} G.grace = 1e9; G.alert = 0; if (G.msgT > 0) G.msgT = 0; __step(33.333); }, [i]);
      await p.evaluate(() => new Promise((r) => requestAnimationFrame ? r() : r()));
      if (i >= 30) ms.push(Date.now() - t0); }
    ms.sort((a, c) => a - c);
    out.scenes[sc.id] = { medianMs: ms[ms.length >> 1], p90Ms: ms[Math.floor(ms.length * .9)] };
    if (shotDir) { fs.mkdirSync(shotDir, { recursive: true }); await p.screenshot({ path: path.join(shotDir, sc.id + '.png') }); }
  }
  fs.writeFileSync(outJson, JSON.stringify(out, null, 1)); console.log(label, profile, 'tier', tierArg, JSON.stringify(Object.fromEntries(Object.entries(out.scenes).map(([k, v]) => [k.slice(0, 2), v.medianMs]))));
  await b.close(); srv.close();
})();
