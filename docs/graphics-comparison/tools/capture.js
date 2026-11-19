#!/usr/bin/env node
/* Captures the same scenes from one version of the game.
   usage: node capture.js <gameDir> <label> <outDir> <hd2d:on|off|na> <profile:desktop|mobile> [zoom:default|close|both] [sceneFilter,comma]
   Serves <gameDir>, takes over requestAnimationFrame so the game advances in exact 1/30 s steps, seeds Math.random,
   starts from a fresh profile, and writes <outDir>/<zoom>/<scene>.png plus timings.json. Nothing in the game or its
   renderer is changed: only the game's own settings (settings.hd2d) and its own debug zoom are used. */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [gameDir, label, outDir, hd2d, profile = 'desktop', zoomArg = 'both', filter] = process.argv.slice(2);
const SCENES = require('./scenes.js').filter((s) => !filter || filter.split(',').some((f) => s.id.includes(f)));
const ROOT = path.resolve(gameDir), OUT = path.resolve(outDir), PORT = 8300 + Math.floor(Math.random() * 600);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
const PROFILES = {
  desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }
};
(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext(PROFILES[profile]);
  await ctx.addInitScript(() => {
    let q = [], now = 0;
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.__step = (ms) => { now += ms; const c = q; q = []; for (const f of c) f(now); };
    let s = 1; window.__seed = (n) => { s = n >>> 0; };
    Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    try { localStorage.clear(); } catch (e) {}
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/index.html`);
  for (let i = 0; i < 30; i++) await p.evaluate(() => __step(33.333));
  const info = await p.evaluate(([hd2d]) => {
    settings.lpc = true; if (hd2d !== 'na') settings.hd2d = hd2d === 'on';
    settings.sfx = false; settings.music = false; settings.hints = false;
    window.go = (L) => { newGame(); startBrief(L); startPlay(); G.cine = null; G.iris = null; G.grace = 1e9; G.graceRamp = 0; G.god = true; G.alert = 0; G.msg = null; G.msgT = 0; for (const k in keys) keys[k] = false; };
    return { hd2d: settings.hd2d, lpc: settings.lpc, hasHD2D: typeof HD2D !== 'undefined', coarse: V.coarse, tier: Q.tier };
  }, [hd2d]);
  console.log(label, profile, JSON.stringify(info));
  const timings = {};
  for (const zoom of zoomArg === 'both' ? ['default', 'close'] : [zoomArg]) {
    fs.mkdirSync(path.join(OUT, zoom), { recursive: true });
    for (const sc of SCENES) {
      const setup = zoom === 'default' ? sc.setup.replace(/V\.dbgZoom=[\d.]+;?/g, '') : sc.setup;
      const failed = await p.evaluate(([setup, frame, seedN]) => {
        try {
          __seed(seedN);
          for (const k in keys) keys[k] = false;
          delete V.dbgZoom;
          new Function(setup)();
          window.__fr = new Function('i', 's', frame);
          return null;
        } catch (e) { return String(e && e.message || e); }
      }, [setup, sc.frame, 4242]);
      if (failed) { console.log('  SKIP', sc.id, failed); continue; }
      const ms = [];
      for (let i = 0; i < sc.frames; i++) {
        const t0 = Date.now();
        await p.evaluate(([i]) => { try { __fr(i, i / 30); } catch (e) {} if (G) { G.grace = 1e9; G.alert = 0; if (G.msgT > 0) G.msgT = 0; } __step(33.333); }, [i]);
        if (i >= sc.frames - 20) ms.push(Date.now() - t0);
      }
      const q = await p.evaluate(() => ({ tier: Q.tier, hd2dOn: typeof HD2D !== 'undefined' ? HD2D.on() : null }));
      await p.screenshot({ path: path.join(OUT, zoom, sc.id + '.png') });
      ms.sort((a, b) => a - b);
      timings[zoom + '/' + sc.id] = { medianMs: ms[Math.floor(ms.length / 2)], p90Ms: ms[Math.floor(ms.length * .9)], ...q };
      process.stdout.write('.');
    }
  }
  fs.writeFileSync(path.join(OUT, 'timings.json'), JSON.stringify({ label, profile, info, timings, errors: [...new Set(errs)].slice(0, 6) }, null, 1));
  console.log('\n' + label + ' ' + profile + (errs.length ? ' ERRORS: ' + [...new Set(errs)].slice(0, 3).join(' | ') : ' no page errors'));
  await b.close(); srv.close();
})();
