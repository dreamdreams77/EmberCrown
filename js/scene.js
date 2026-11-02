// Scene composition: vision cones, lighting, overlays, weather, drawWorld.
'use strict';

function coneRange(g) {
  return 5.2 * T * G.rangeMul * (g.rm || 1);
}
function visPoly(g, range) {
  const half = 0.62,
    pts = [[g.x, g.y]];
  for (let i = 0; i <= 20; i++) {
    const a = g.face - half + (half * 2 * i) / 20;
    let r = 0;
    for (; r < range; r += 6)
      if (
        solidTile(Math.floor((g.x + Math.cos(a) * r) / T), Math.floor((g.y + Math.sin(a) * r) / T))
      )
        break;
    pts.push([g.x + Math.cos(a) * r, g.y + Math.sin(a) * r]);
  }
  return pts;
}
function polyPath(c, pts) {
  c.beginPath();
  pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
  c.closePath();
}
function drawLighting(p, polys) {
  let amb = p.amb == null ? 0.5 : p.amb;
  if (G.d.finale) amb = Math.min(0.8, amb + (5 - G.candlesLit) * 0.08);
  if (G.flash > 0) amb *= 1 - Math.min(1, G.flash * 2.5);
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  lctx.clearRect(0, 0, 800, 480);
  lctx.fillStyle = NIGHT_COLOR;
  lctx.globalAlpha = Math.min(1, amb * 1.05);
  lctx.fillRect(0, 0, 800, 480);
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'destination-out';
  for (const L of G.lights) {
    const f = L.fl
        ? 0.9 + 0.07 * Math.sin(now * 11 + L.fl) + 0.04 * Math.sin(now * 23 + L.fl * 3)
        : 1,
      r = L.r * f;
    lctx.globalAlpha = Math.min(1, L.k * f);
    lctx.drawImage(L.half ? SOFT_HALF : SOFT, L.x - r, L.y - r, r * 2, r * 2);
  }
  lctx.globalAlpha = 0.3;
  lctx.fillStyle = '#fff';
  for (const [, pts] of polys) {
    polyPath(lctx, pts);
    lctx.fill();
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCv, 0, 0, 800, 480);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of G.lights)
    if (L.c) {
      const r = L.r * 0.85;
      ctx.globalAlpha = 0.26 * L.k;
      ctx.drawImage(glow(L.c, L.half), L.x - r, L.y - r, r * 2, r * 2);
    }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function drawEmissive() {
  for (const t of G.torches) flame(t.x, t.y - 1, 4.5, t.ph);
  for (const it of G.items) {
    if (it.type === 'B' && !it.done) {
      addGlow(it.x, it.y - 8, 34, '255,120,40', 0.6);
      flame(it.x - 4, it.y - 6, 5, it.x);
      flame(it.x + 4, it.y - 6, 5, it.x + 3);
      flame(it.x, it.y - 7, 7, it.y);
    } else if (it.type === 'C' && !it.done) flame(it.x, it.y - 6, 3.6, it.x + it.y);
    else if (it.type === 'g' && !it.done && Math.sin(now * 2 + it.x) > 0.92) {
      ctx.fillStyle = '#fff';
      star(it.x + 2, it.y - 4 + Math.sin(now * 3 + it.x * 0.1) * 2, 3.5);
    }
  }
  for (const v of G.vents) if (v.on) addGlow(v.x * T + 16, v.y * T + 16, 22, '255,210,120', 0.8);
  for (const g of G.guards) {
    if (g.stun > 0 || g.spin) continue;
    if (g.boss && g.kind === 'candle' && !g.dead) {
      const c = Math.cos(g.face),
        s = Math.sin(g.face);
      for (const sd of [-11.5, 11.5])
        flame(g.x + c * 2 - s * sd, g.y + s * 2 + c * sd - 2, 2.6, sd);
    } else if (!g.boss && !G.flight) {
      const c = Math.cos(g.face),
        s = Math.sin(g.face),
        lx = g.x + c * (G.d.quiet ? 7.5 : 4.5) + s * (G.d.quiet ? 0 : 10.5),
        ly = g.y + s * (G.d.quiet ? 7.5 : 4.5) - c * (G.d.quiet ? 0 : 10.5);
      addGlow(lx, ly, G.d.quiet ? 6 : 9, '255,210,120', 0.9);
    }
  }
  if (G.ash.on && G.active === 'ash' && fireHeld())
    addGlow(
      G.ash.x + Math.cos(G.ash.face) * 14,
      G.ash.y + Math.sin(G.ash.face) * 14,
      26,
      '255,190,90',
      0.7
    );
}
function drawCones(polys) {
  for (const [g, pts] of polys) {
    const R = coneRange(g),
      gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, R);
    const c = g.seeing
      ? '255,70,60'
      : g.lure || g.ret
        ? '255,170,60'
        : G.flight
          ? '255,245,190'
          : '255,225,140';
    gr.addColorStop(0, 'rgba(' + c + ',' + (g.seeing ? 0.42 : 0.24) + ')');
    gr.addColorStop(0.7, 'rgba(' + c + ',' + (g.seeing ? 0.22 : 0.1) + ')');
    gr.addColorStop(1, 'rgba(' + c + ',.02)');
    ctx.fillStyle = gr;
    polyPath(ctx, pts);
    ctx.fill();
    // a pencil edge that wobbles a little each frame
    const bi = ((now * 5) | 0) % 3,
      sd = (g.x | 0) + (g.y | 0) * 7;
    ctx.beginPath();
    pts.forEach((q, i) => {
      const jx = i ? (hash(i, bi, sd) - 0.5) * 2.4 : 0,
        jy = i ? (hash(i, bi + 3, sd) - 0.5) * 2.4 : 0;
      i ? ctx.lineTo(q[0] + jx, q[1] + jy) : ctx.moveTo(q[0], q[1]);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(' + c + ',' + (g.seeing ? 0.6 : 0.32) + ')';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}
function bubble(x, y, text, col) {
  ctx.font = 'bold 10px "IM Fell English",Georgia';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(240,226,188,.96)';
  rrect(x - w / 2, y - 13, w, 15, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 2);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x + 3, y + 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(' + OUTLINE_RGB + ',.85)';
  ctx.lineWidth = 1.1;
  rrect(x - w / 2, y - 13, w, 15, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 2);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x + 3, y + 2);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 2);
  ctx.textAlign = 'left';
}
function holdTargetPos(t) {
  return t.kind === 'door' ? { x: t.ref.x * T + 16, y: t.ref.y * T + 16 } : t.ref;
}
function drawOverlays() {
  // effect rings
  for (const r of G.rings) {
    ctx.strokeStyle = 'rgba(' + r.c + ',' + Math.min(1, r.t * 2) * (r.a || 1) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r * (1 - Math.min(1, r.t)), 0, 7);
    ctx.stroke();
  }
  if (G.boss && G.boss.blink) {
    const q = G.boss.blink;
    ctx.strokeStyle = 'rgba(255,130,60,' + (0.5 + 0.5 * Math.sin(G.time * 14)) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 18, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(q.x, q.y, 8, 0, 7);
    ctx.stroke();
    addGlow(q.x, q.y, 30, '255,110,50', 0.5);
  }
  // awareness marks and barks above guards
  for (const g of G.guards) {
    if (g.boss && !g.dead) {
      const w = 48,
        x = g.x - w / 2,
        y = g.y - 32;
      ctx.fillStyle = 'rgba(10,6,14,.85)';
      rrect(x - 2, y - 2, w + 4, 9, 3);
      ctx.fill();
      ctx.fillStyle = g.hurt > 0 ? '#ffb0a0' : '#d04848';
      ctx.fillRect(x, y, (w * Math.max(0, g.hp)) / (g.maxhp || 100), 5);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(x, y, (w * Math.max(0, g.hp)) / (g.maxhp || 100), 1);
    }
    if (g.stun > 0 || g.spin) continue;
    const top = g.y - (g.boss ? 40 : 27) + Math.sin(now * 6) * 1.5;
    if (g.bark) bubble(g.x, top - 12, g.bark.text, g.seeing ? '#a01c10' : '#3a2a1a');
    else if (g.seeing) {
      ctx.font = 'bold 16px "IM Fell English",Georgia';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText('!', g.x + 1, top + 1);
      ctx.fillStyle = '#ff5a4a';
      ctx.fillText('!', g.x, top);
      ctx.textAlign = 'left';
    } else if (g.lure || g.ret) {
      ctx.font = 'bold 14px "IM Fell English",Georgia';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText('?', g.x + 1, top + 1);
      ctx.fillStyle = '#f0b44c';
      ctx.fillText('?', g.x, top);
      ctx.textAlign = 'left';
    }
  }
  // hold progress and interact prompt
  if (G.holdT && G.hold > 0) {
    const p = holdTargetPos(G.holdT);
    ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, 7);
    ctx.stroke();
    ctx.strokeStyle = '#f0b44c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, -1.57, -1.57 + 6.28 * Math.min(1, G.hold / G.holdT.need));
    ctx.stroke();
  } else if (G.near) {
    const t = G.near,
      p = holdTargetPos(t),
      ty = t.kind === 'item' ? t.ref.type : t.kind;
    const lab = {
      door: 'Pick lock',
      guard: 'Knock out',
      L: 'Learn song',
      H: 'Free Perrin',
      C: 'Snuff',
      O: G.d.song
        ? 'Take ledger'
        : lvl === 0
          ? 'Steal egg'
          : G.d.timeshift
            ? 'Take signet'
            : 'Swap seal',
      P: G.flight ? 'Drop letters' : G.d.timeshift ? 'Plant treaty' : 'Poison cup'
    }[ty];
    bubble(p.x, p.y - 22, (TOUCH.used ? 'Hold  ' : 'E  ') + lab, '#3a2a1a');
  }
}
function drawWeather(p) {
  if (p.weather === 'rain') {
    ctx.strokeStyle = 'rgba(170,195,230,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of G.rain) {
      if (mode === 'play') {
        d.y += 560 * fdt;
        d.x -= 140 * fdt;
      }
      if (d.y > 490) {
        d.y = -10;
        d.x = Math.random() * 900;
      }
      if (d.x < -20) d.x += 900;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.l * 0.25, d.y - d.l);
    }
    ctx.stroke();
  } else if (p.weather === 'fog') {
    for (const f of G.fog) {
      if (mode === 'play') f.x += f.v * fdt;
      if (f.x - f.r > 820) f.x = -f.r;
      ctx.globalAlpha = 0.09;
      ctx.drawImage(glow('190,205,235'), f.x - f.r * 1.6, f.y - f.r * 0.6, f.r * 3.2, f.r * 1.2);
    }
    ctx.globalAlpha = 1;
  }
}
function drawActiveMarker() {
  const a = G.active === 'shiloh' ? G.shiloh : G.ash;
  if (a.hidden) return;
  const r = (G.active === 'shiloh' ? 17 : 20) + Math.sin(now * 4) * 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -now * 10;
  ctx.beginPath();
  ctx.ellipse(a.x, a.y + 4, r, r * 0.6, 0, 0, 7);
  ctx.stroke();
  ctx.setLineDash([]);
}
function drawWorld() {
  const p = curPal(G);
  ctx.save();
  if (G.shake > 0) {
    G.shake = Math.max(0, G.shake - fdt);
    const s = G.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  ctx.fillStyle = '#07050a';
  ctx.fillRect(-20, -20, 840, 520);
  ctx.drawImage(G.bg, 0, 0, 800, 480);
  if (G.flight) {
    ctx.strokeStyle = 'rgba(150,220,230,.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const w of G.waves) {
      const o = Math.sin(now * 1.6 + w.ph) * 4;
      ctx.moveTo(w.x + o - 6, w.y);
      ctx.quadraticCurveTo(w.x + o, w.y - 3, w.x + o + 6, w.y);
    }
    ctx.stroke();
  }
  const polys = [];
  for (const g of G.guards) if (g.stun <= 0) polys.push([g, visPoly(g, coneRange(g))]);
  drawActiveMarker();
  // props and characters are painted on their own layer, then given a soft outline and a clay grain
  const main = ctx;
  SHC = main;
  ctx = layerCv.getContext('2d');
  ctx.clearRect(0, 0, 800, 480);
  CLAY = true;
  drawFloorThings();
  const actors = [];
  // sprites are drawn larger than their hitboxes so the little people read as characters
  const spr = (o, k, f) => () => {
    const fc = o.face || 0,
      a =
        o.stun > 0
          ? 0
          : o.mv
            ? 0.07 * Math.sin((o.walk || 0) * 0.55)
            : 0.022 * Math.sin(now * 2.3 + o.x * 0.05);
    SPR = k;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(fc);
    ctx.scale(k * (1 + a), k * (1 - a));
    ctx.rotate(-fc);
    ctx.translate(-o.x, -o.y);
    f();
    ctx.restore();
    SPR = 1;
  };
  for (const g of G.guards)
    actors.push([
      g.stun > 0 ? g.y - 20 : g.y,
      spr(g, g.spin ? 1 : g.boss ? 1.15 : G.flight ? 1.25 : 1.3, () => drawGuard(g))
    ]);
  if (G.guests && G.state === 'ball')
    for (const s of G.guests) actors.push([s.y, spr(s, 1.2, () => drawGuest(s))]);
  if (G.host && G.host.on) actors.push([G.host.y, spr(G.host, 1.3, () => drawPerrin(G.host))]);
  if (!G.shiloh.hidden) actors.push([G.shiloh.y, spr(G.shiloh, 1.35, () => drawShiloh(G.shiloh))]);
  if (G.ash.on) actors.push([G.flight ? 1e9 : G.ash.y, spr(G.ash, 1.2, () => drawAsh(G.ash))]);
  actors.sort((a, b) => a[0] - b[0]).forEach((a) => a[1]());
  CLAY = false;
  ctx = main;
  outlineCtx.globalCompositeOperation = 'copy';
  outlineCtx.drawImage(layerCv, 0, 0, 800, 480);
  outlineCtx.globalCompositeOperation = 'source-in';
  outlineCtx.fillStyle = 'rgb(' + OUTLINE_RGB + ')';
  outlineCtx.fillRect(0, 0, 800, 480);
  outlineCtx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.6;
  for (const [dx, dy] of [
    [1.3, 1.1],
    [-0.9, 0.9],
    [0.9, -0.9],
    [1.1, 0.2]
  ])
    ctx.drawImage(outlineCv, dx, dy, 800, 480);
  ctx.globalAlpha = 1;
  texx.globalCompositeOperation = 'copy';
  texx.drawImage(CLAYTEX, 0, 0, 800, 480);
  texx.globalCompositeOperation = 'destination-in';
  texx.drawImage(layerCv, 0, 0, 800, 480);
  texx.globalCompositeOperation = 'source-over';
  ctx.drawImage(layerCv, 0, 0, 800, 480);
  ctx.drawImage(texCv, 0, 0, 800, 480);
  drawSmoke();
  drawParts(false);
  drawLighting(p, polys);
  drawEmissive();
  drawParts(true);
  drawCones(polys);
  drawWeather(p);
  drawOverlays();
  if (G.state === 'ruin') {
    ctx.fillStyle = 'rgba(70,20,10,.16)';
    ctx.fillRect(0, 0, 800, 480);
  } else if (G.state === 'ball') {
    ctx.fillStyle = 'rgba(40,60,130,.06)';
    ctx.fillRect(0, 0, 800, 480);
  }
  if (G.flash > 0) {
    ctx.fillStyle = 'rgba(220,230,255,' + Math.min(0.5, G.flash * 1.4) + ')';
    ctx.fillRect(0, 0, 800, 480);
  }
  ctx.drawImage(VIG, 0, 0, 800, 480);
  if (G.alert > 0.45) {
    const k = Math.min(1, (G.alert - 0.45) / 0.55),
      beat = 0.6 + 0.4 * Math.sin(now * (6 + k * 8));
    ctx.globalAlpha = k * beat * 0.8;
    ctx.drawImage(VIG, 0, 0, 800, 480);
    ctx.fillStyle = 'rgba(200,30,30,' + k * beat * 0.12 + ')';
    ctx.fillRect(0, 0, 800, 480);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
