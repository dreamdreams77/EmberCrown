// HUD, menus, title screen, and the main loop.
'use strict';

/* ---------- HUD and screens ---------- */

// gold-trimmed plum clay plaques with embossed swirls, painted once and cached
const PLAQUES = {};
function plaque(w, h, seed, rad) {
  rad = rad || 14;
  const key = w + 'x' + h + '/' + seed;
  if (PLAQUES[key]) return PLAQUES[key];
  const c = mkCanvas(w * 2, h * 2),
    x = c.getContext('2d'),
    R = mulberry(seed * 7919 + w);
  x.scale(2, 2);
  const rr = (i) => rrectOn(x, i, i, w - i * 2, h - i * 2, Math.max(2, rad - i));
  rr(1.5);
  x.save();
  x.clip();
  const gr = x.createLinearGradient(0, 0, w * 0.3, h);
  gr.addColorStop(0, '#5a4c92');
  gr.addColorStop(0.5, '#3e3470');
  gr.addColorStop(1, '#2a2150');
  x.fillStyle = gr;
  x.fillRect(0, 0, w, h);
  for (let k = 0; k < Math.max(10, (w * h) / 2800); k++)
    blot(
      x,
      R() * w,
      R() * h,
      10 + R() * 40,
      R() < 0.5 ? '150,130,220' : '14,6,36',
      0.1 + R() * 0.08
    );
  for (let k = 0; k < (w * h) / 5200; k++) {
    const cx = R() * w,
      cy = R() * h,
      a = R() * 6.28,
      m = 6 + R() * 9;
    for (let r = 2.5; r < m; r += 2.8) {
      x.beginPath();
      x.arc(cx + 1, cy + 1, r, a + r * 0.3, a + r * 0.3 + 4.2);
      x.strokeStyle = 'rgba(8,2,24,.2)';
      x.lineWidth = 1.3;
      x.stroke();
      x.beginPath();
      x.arc(cx, cy, r, a + r * 0.3, a + r * 0.3 + 4.2);
      x.strokeStyle = 'rgba(200,185,255,.14)';
      x.lineWidth = 1;
      x.stroke();
    }
  }
  for (let k = 0; k < (w * h) / 260; k++) {
    x.fillStyle = R() < 0.5 ? 'rgba(210,195,255,.12)' : 'rgba(8,2,24,.16)';
    x.fillRect(R() * w, R() * h, 1.4, 1.4);
  }
  const sh = x.createLinearGradient(0, 0, 0, h * 0.55);
  sh.addColorStop(0, 'rgba(255,245,255,.2)');
  sh.addColorStop(1, 'rgba(255,245,255,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, w, h * 0.55);
  const bt = x.createLinearGradient(0, h * 0.6, 0, h);
  bt.addColorStop(0, 'rgba(8,2,24,0)');
  bt.addColorStop(1, 'rgba(8,2,24,.42)');
  x.fillStyle = bt;
  x.fillRect(0, h * 0.6, w, h * 0.4);
  x.restore();
  rr(1.5);
  x.strokeStyle = 'rgba(10,4,24,.9)';
  x.lineWidth = 3.4;
  x.stroke();
  const gold = x.createLinearGradient(0, 0, w, h);
  gold.addColorStop(0, '#fbe79a');
  gold.addColorStop(0.45, '#c8963a');
  gold.addColorStop(0.7, '#f0d078');
  gold.addColorStop(1, '#8a5c1c');
  rr(2.6);
  x.strokeStyle = gold;
  x.lineWidth = 2.2;
  x.stroke();
  rr(6);
  x.strokeStyle = 'rgba(232,196,104,.55)';
  x.lineWidth = 1;
  x.stroke();
  if (w > 200 && h > 60)
    for (const [cx, cy] of [
      [9, 9],
      [w - 9, 9],
      [9, h - 9],
      [w - 9, h - 9]
    ]) {
      x.fillStyle = gold;
      x.beginPath();
      x.arc(cx, cy, 2.6, 0, 7);
      x.fill();
    }
  return (PLAQUES[key] = c);
}
function drawPlaque(x, y, w, h, seed, tear, sh) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = sh == null ? 14 : sh;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(plaque(w, h, seed, w > 400 && h > 200 ? 20 : 12), x, y, w, h);
  ctx.restore();
}
// a gold hairline rule with a little flourish
function goldRule(x1, x2, y, gap) {
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, 'rgba(232,196,104,0)');
  g.addColorStop(0.3, 'rgba(240,210,120,.9)');
  g.addColorStop(0.7, 'rgba(240,210,120,.9)');
  g.addColorStop(1, 'rgba(232,196,104,0)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 + (x2 - x1) / 2 - gap, y);
  ctx.moveTo(x1 + (x2 - x1) / 2 + gap, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}
function keyCap(x, y, k) {
  ctx.font = 'bold 10px "IM Fell English",Georgia';
  const w = Math.max(15, ctx.measureText(k).width + 8);
  const gr = ctx.createLinearGradient(0, y - 11, 0, y + 4);
  gr.addColorStop(0, '#f0d78a');
  gr.addColorStop(1, '#b8863a');
  ctx.fillStyle = gr;
  rrect(x, y - 11, w, 15, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,8,30,.85)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#2a1608';
  ctx.textAlign = 'center';
  ctx.fillText(k, x + w / 2, y);
  ctx.textAlign = 'left';
  return w;
}
function icon(kind, x, y) {
  if (kind === 'smoke') {
    for (const [a, b, r] of [
      [-3, 1, 4],
      [3, 1, 4],
      [0, -3, 4.5]
    ])
      ell(x + a, y + b, r, r, '#b8b8c4');
  } else if (kind === 'bell') {
    ctx.fillStyle = '#e0b040';
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 6);
    ctx.quadraticCurveTo(x - 4, y, x - 7, y + 4);
    ctx.lineTo(x + 7, y + 4);
    ctx.quadraticCurveTo(x + 4, y, x + 2, y - 6);
    ctx.closePath();
    ctx.fill();
    ell(x, y + 5, 1.6, 1.4, '#7a5a18');
  } else if (kind === 'flute') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(-8, -2, 16, 4);
    ell(-8, 0, 2.4, 3, '#e8dcc0');
    ell(8, 0, 2.4, 3, '#e8dcc0');
    ctx.fillStyle = '#5a4a3a';
    for (let k = -4; k <= 4; k += 4) ctx.fillRect(k - 0.5, -1, 1.5, 2);
    ctx.restore();
  } else if (kind === 'gem') {
    ctx.fillStyle = '#b8461a';
    diamond(x, y, 5, 7);
    ctx.fill();
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x, y + 1);
    ctx.lineTo(x - 5, y);
    ctx.fill();
  } else if (kind === 'fire') {
    ctx.fillStyle = '#ff7a2f';
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 5);
    ctx.quadraticCurveTo(x - 6, y - 1, x, y - 7);
    ctx.quadraticCurveTo(x + 6, y - 1, x + 4, y + 5);
    ctx.fill();
    ell(x, y + 2, 2, 3, '#ffd27a');
  } else if (kind === 'letter') {
    ctx.fillStyle = '#eadfd0';
    ctx.fillRect(x - 6, y - 4, 12, 9);
    ctx.strokeStyle = '#8a7a6a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 4);
    ctx.lineTo(x, y + 1);
    ctx.lineTo(x + 6, y - 4);
    ctx.stroke();
  }
}
function portrait(who, x, y) {
  ell(x, y, 12, 12, '#2a1a40');
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, 7);
  ctx.stroke();
  if (who === 'Shiloh') {
    ell(x, y + 3, 9, 7, '#46346b');
    ell(x, y - 1, 6.5, 7, '#6a55a0');
    ell(x, y, 4, 4.6, '#e6c4a0');
    ell(x - 1.5, y, 0.8, 0.9, '#2a1a2a');
    ell(x + 1.5, y, 0.8, 0.9, '#2a1a2a');
  } else {
    ctx.fillStyle = '#ffe0a8';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 3);
    ctx.lineTo(x - 7, y - 9);
    ctx.lineTo(x - 1, y - 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 3);
    ctx.lineTo(x + 7, y - 9);
    ctx.lineTo(x + 1, y - 5);
    ctx.fill();
    ell(x, y, 7, 6.5, '#ef7434');
    ell(x, y + 3.5, 4, 3, '#e2642a');
    ell(x - 2.5, y - 1, 1.2, 1.2, '#fff2a0');
    ell(x + 2.5, y - 1, 1.2, 1.2, '#fff2a0');
  }
}
function drawHud() {
  const IT = '#f3e6cc',
    F = '"IM Fell English",Georgia',
    GOLD = '#e8c870';
  HOT.length = 0;
  drawPlaque(-10, -12, 820, 42, 11, 0, 10);
  drawPlaque(-10, 450, 820, 42, 12, 0, 10);
  ctx.font = 'bold 14px ' + F;
  let x = 10;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,8,30,.9)';
  ctx.lineWidth = 3;
  ctx.strokeText(G.d.name, x, 18);
  const gt = ctx.createLinearGradient(0, 6, 0, 20);
  gt.addColorStop(0, '#ffe9a0');
  gt.addColorStop(1, '#d09a34');
  ctx.fillStyle = gt;
  ctx.fillText(G.d.name, x, 18);
  x += ctx.measureText(G.d.name).width + 18;
  ctx.font = '12px ' + F;
  for (const t of ['L', 'H', 'C', 'O', 'P', 'B', 'W']) {
    const l = G.d.labels[t];
    if (!l) continue;
    let its, n, done;
    if (t === 'W') {
      done = !!G.boss.dead;
      its = [0];
      n = done ? 1 : 0;
    } else {
      its = G.items.filter((i) => i.type === t);
      n = its.filter((i) => i.done).length;
      done = n === its.length;
    }
    ctx.fillStyle = 'rgba(10,4,24,.55)';
    rrect(x, 8, 10, 10, 2.5);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2;
    rrect(x + 0.5, 8.5, 9, 9, 2.5);
    ctx.stroke();
    if (done) {
      ctx.strokeStyle = '#8fe08a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + 1.5, 13);
      ctx.lineTo(x + 4.5, 17);
      ctx.lineTo(x + 10, 6);
      ctx.stroke();
    }
    ctx.fillStyle = done ? '#9fe89a' : IT;
    const s = l + (its.length > 1 ? ' ' + n + '/' + its.length : '');
    ctx.fillText(s, x + 14, 18);
    x += ctx.measureText(s).width + 28;
  }
  const who = G.active === 'shiloh' ? 'Shiloh' : 'Ashling',
    y = 471;
  CLAY = true;
  portrait(who, 20, 466);
  ctx.font = 'bold 13px ' + F;
  ctx.fillStyle = who === 'Shiloh' ? '#c8b4ff' : '#ff9a4a';
  ctx.fillText(who, 38, y);
  x = 38 + ctx.measureText(who).width + 8;
  if (G.ash.on && !G.flight) {
    const x0 = x;
    x += keyCap(x, y, 'TAB') + 12;
    HOT.push({ x: x0 - 6, w: x - x0 + 4, key: 'tab' });
  } else x += 6;
  ctx.font = 'bold 12px ' + F;
  const gad = (k, ic, val, dim) => {
    const x0 = x;
    x += keyCap(x, y, k) + 12;
    ctx.globalAlpha = dim ? 0.4 : 1;
    icon(ic, x, y - 4);
    ctx.fillStyle = IT;
    ctx.font = 'bold 12px ' + F;
    ctx.fillText(val, x + 11, y);
    x += ctx.measureText(val).width + 24;
    ctx.globalAlpha = 1;
    HOT.push({ x: x0 - 6, w: x - x0, key: k.toLowerCase() });
  };
  if (G.flight) {
    gad('SPACE', 'fire', 'Fire');
    gad('E', 'letter', 'Drop letters');
  } else {
    const wr = G.active !== 'shiloh';
    gad('Q', 'smoke', '' + G.gad.smoke, wr || !G.gad.smoke);
    gad('R', 'bell', '' + G.gad.bell, wr || !G.gad.bell);
    gad(
      'F',
      'flute',
      G.d.timeshift ? 'Time' : G.gad.flute > 50 ? 'Song' : '' + G.gad.flute,
      wr || !G.gad.flute
    );
  }
  icon('gem', x, y - 4);
  ctx.fillStyle = '#ffb870';
  ctx.fillText('' + stats.gems, x + 9, y);
  x += ctx.measureText('' + stats.gems).width + 22;
  if (G.d.timeshift) {
    ctx.fillStyle = G.state === 'ball' ? '#a8c0ff' : '#ffb070';
    ctx.fillText(G.state === 'ball' ? 'BALL' : 'RUINS', x, y);
  }
  if (!G.flight) {
    const A = G.active === 'shiloh' ? G.shiloh : G.ash,
      l = lightAt(A.x, A.y),
      lx = 556;
    const c = l < 0.25 ? '90,100,190' : l < 0.6 ? '230,160,80' : '255,225,120';
    addGlow(lx, y - 4, 9 + l * 9, c, 0.55);
    ctx.fillStyle = 'rgb(' + c + ')';
    diamond(lx, y - 4, 5, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,8,30,.85)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '11px ' + F;
    ctx.fillStyle = '#d8c8f0';
    ctx.fillText(l < 0.25 ? 'Shadow' : l < 0.6 ? 'Dim' : 'Lit', lx + 9, y);
  }
  const a = Math.min(1, G.alert),
    ex = 612,
    ey = y - 4,
    open = 1.5 + a * 4.5;
  ctx.fillStyle = '#f6ecd8';
  ctx.beginPath();
  ctx.moveTo(ex - 9, ey);
  ctx.quadraticCurveTo(ex, ey - open * 1.4, ex + 9, ey);
  ctx.quadraticCurveTo(ex, ey + open * 1.4, ex - 9, ey);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,8,30,.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ell(
    ex,
    ey,
    Math.min(3.4, open * 0.7),
    Math.min(3.4, open * 0.7),
    a < 0.5 ? '#3a8a5a' : a < 0.8 ? '#c08a20' : '#d02828'
  );
  CLAY = false;
  const col = a < 0.5 ? '#5ac05a' : a < 0.8 ? '#e8aa38' : '#e0402e';
  ctx.fillStyle = '#160c2a';
  rrect(626, 460, 164, 12, 6);
  ctx.fill();
  if (a > 0) {
    ctx.save();
    rrect(626, 460, 164, 12, 6);
    ctx.clip();
    const g2 = ctx.createLinearGradient(626, 0, 790, 0);
    g2.addColorStop(0, '#3a8a4a');
    g2.addColorStop(1, col);
    ctx.fillStyle = g2;
    ctx.fillRect(626, 460, 164 * a, 12);
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillRect(626, 460, 164 * a, 3.5);
    ctx.restore();
  }
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.4;
  rrect(626.5, 460.5, 164, 12, 6);
  ctx.stroke();
  if (G.msgT > 0 && G.msg) {
    const c =
      G.msg.who === 'Ashling'
        ? '#ff9a4a'
        : G.msg.who === 'Perrin'
          ? '#7fd0ff'
          : G.msg.who === 'Candlemaker'
            ? '#f0d080'
            : G.msg.who === 'Tip'
              ? '#e8c870'
              : '#c8b4ff';
    ctx.font = 'bold 13px ' + F;
    const nw = ctx.measureText(G.msg.who + ':').width;
    ctx.font = '13px ' + F;
    const tw = nw + ctx.measureText(G.msg.text).width + 44,
      bw = Math.max(300, Math.ceil(tw / 20) * 20),
      bx = 400 - bw / 2;
    ctx.globalAlpha = Math.min(1, G.msgT);
    drawPlaque(bx, 406, bw, 42, ((bw / 20) | 0) + 3, 0, 12);
    ctx.font = 'bold 13px ' + F;
    ctx.fillStyle = c;
    ctx.fillText(G.msg.who + ':', bx + 20, 432);
    ctx.fillStyle = IT;
    ctx.font = '13px ' + F;
    ctx.fillText(G.msg.text, bx + 20 + nw + 8, 432);
    ctx.globalAlpha = 1;
  }
}
function drawBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, 480);
  g.addColorStop(0, '#1c1024');
  g.addColorStop(0.65, '#100a14');
  g.addColorStop(1, '#060408');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 800, 480);
  addGlow(400, 470, 330, '255,110,40', 0.35);
  ctx.drawImage(SKY, 0, 0, 800, 480);
  ctx.globalCompositeOperation = 'lighter';
  for (const e of TITLE_EMBERS) {
    e.y -= e.v * fdt;
    e.x += Math.sin(now + e.ph) * 8 * fdt;
    if (e.y < -10) {
      e.y = 490;
      e.x = Math.random() * 800;
    }
    const r = e.r * 4;
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now * 3 + e.ph);
    ctx.drawImage(glow('255,150,60'), e.x - r, e.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
const TRAIL = [];
function drawTitleDragon() {
  const per = 15,
    u = (now % per) / per,
    x = -70 + u * 940,
    y = 62 + Math.sin(now * 1.7) * 20 + u * 12,
    flap = Math.sin(now * 9);
  if (Math.random() < 0.9)
    TRAIL.push({
      x: x - 24,
      y: y + (Math.random() - 0.5) * 6,
      t: 1.1,
      vy: -8 - Math.random() * 10
    });
  ctx.globalCompositeOperation = 'lighter';
  for (const q of TRAIL) {
    q.t -= fdt;
    q.y += q.vy * fdt;
    const r = 3 + (1.1 - q.t) * 5;
    ctx.globalAlpha = Math.max(0, q.t / 1.1) * 0.8;
    ctx.drawImage(glow(q.t > 0.6 ? '255,210,120' : '255,110,40'), q.x - r, q.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  while (TRAIL.length && TRAIL[0].t <= 0) TRAIL.shift();
  const was = CLAY;
  CLAY = true;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.9, 1.9);
  ctx.rotate(Math.cos(now * 1.7) * 0.12);
  const sw = Math.sin(now * 5) * 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#a8441a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.quadraticCurveTo(-14, sw, -21, -sw * 0.6);
  ctx.stroke();
  ctx.lineCap = 'butt';
  for (const sd of [-1, 1]) {
    ctx.fillStyle = 'rgba(176,64,24,.95)';
    ctx.beginPath();
    ctx.moveTo(3, sd * 4);
    ctx.lineTo(-3 + flap * 2, sd * (15 + flap * 7));
    ctx.lineTo(-8, sd * (11 + flap * 3));
    ctx.lineTo(-11, sd * 8);
    ctx.lineTo(-7, sd * 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff9a50';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ell(-1, 0, 9, 6.5, '#e2642a');
  ell(0, 0, 6, 3.4, '#ffb069');
  ell(8, 0, 5, 4.2, '#ef7434');
  ell(11.5, 0, 2.4, 2.6, '#e2642a');
  ell(10, -2, 1.3, 1.1, '#fff2a0');
  ell(10, 2, 1.3, 1.1, '#fff2a0');
  ctx.restore();
  CLAY = was;
}
// The Hollow Crown's seal: a ring of plain wax with nothing pressed into it.
function drawSeal(x, y, s) {
  ctx.save();
  ctx.translate(x, y + Math.sin(now * 1.6) * 2);
  ctx.rotate(Math.sin(now * 1.1) * 0.05);
  ctx.scale(s, s);
  addGlow(0, 0, 40 + Math.sin(now * 2.2) * 4, '255,120,60', 0.35);
  const blob = (r, k) => {
    ctx.beginPath();
    for (let a = 0; a <= 12; a++) {
      const t = (a / 12) * Math.PI * 2,
        rr = r * (1 + 0.07 * Math.sin(t * 3 + k) + 0.04 * Math.sin(t * 5 + k * 2));
      ctx[a ? 'lineTo' : 'moveTo'](Math.cos(t) * rr, Math.sin(t) * rr * 0.92);
    }
    ctx.closePath();
  };
  blob(22, 1);
  ctx.moveTo(11, 0);
  ctx.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(-7, -9, 2, 0, 0, 28);
  g.addColorStop(0, '#e0604a');
  g.addColorStop(0.5, '#a3321f');
  g.addColorStop(1, '#4a0e0c');
  ctx.fillStyle = g;
  ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(20,6,20,.85)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,205,.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 18, -2.7, -1.3);
  ctx.stroke();
  ctx.restore();
}
function panel(title, lines, foot, col, overlay) {
  col = col || '#f0b44c';
  const F = '"IM Fell English",Georgia';
  if (TOUCH.capable)
    foot = foot
      .replace('Press Enter to', 'Tap to')
      .replace(/Press 1, 2 or 3|Press 1 or 2/, 'Tap your choice');
  if (overlay) {
    ctx.fillStyle = 'rgba(8,5,16,.7)';
    ctx.fillRect(0, 0, 800, 480);
    ctx.drawImage(VIG, 0, 0, 800, 480);
  } else drawBackdrop();
  drawPlaque(34, 16, 732, 448, 5 + (title.length % 5), 0, 22);
  ctx.textAlign = 'center';
  const big = title === TEXT.title;
  if (big) drawSeal(400, 52, 0.95);
  ctx.font = 'bold ' + (big ? 50 : 38) + 'px ' + F;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(18,6,34,.95)';
  ctx.lineWidth = big ? 7 : 6;
  const ty = big ? 108 : 98;
  ctx.strokeText(title, 400, ty);
  if (big) {
    const gr = ctx.createLinearGradient(0, 70, 0, 112);
    gr.addColorStop(0, '#ffe9a0');
    gr.addColorStop(0.55, '#f08a2c');
    gr.addColorStop(1, '#b02c14');
    ctx.fillStyle = gr;
  } else {
    const gr = ctx.createLinearGradient(0, ty - 30, 0, ty + 4);
    gr.addColorStop(0, shade(col, 0.55));
    gr.addColorStop(1, col);
    ctx.fillStyle = gr;
  }
  ctx.fillText(title, 400, ty);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, ty - 44, 800, 22);
  ctx.clip();
  ctx.fillText(title, 400, ty - 1);
  ctx.restore();
  const tw = ctx.measureText(title).width / 2 + 30,
    ly = big ? 124 : 116;
  goldRule(400 - tw, 400 + tw, ly, 10);
  ctx.fillStyle = '#f0d078';
  diamond(400, ly, 5, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,8,30,.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '16px ' + F;
  ctx.fillStyle = '#f3e6cc';
  // a line too wide for the plaque breaks at the space nearest its middle
  const shown = [];
  for (const l of lines) {
    if (ctx.measureText(l).width <= 640) shown.push(l);
    else {
      let cut = -1;
      for (let k = 0; k < l.length; k++) {
        if (
          l[k] === ' ' &&
          (cut < 0 || Math.abs(k - l.length / 2) < Math.abs(cut - l.length / 2))
        ) {
          cut = k;
        }
      }
      shown.push(l.slice(0, cut), l.slice(cut + 1));
    }
  }
  const step = Math.min(25.5, Math.max(17.5, 262 / (shown.length - 1)));
  if (step < 22) ctx.font = '15px ' + F;
  shown.forEach((l, i) => ctx.fillText(l, 400, 154 + i * step));
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(now * 3);
  ctx.fillStyle = '#d8c4f0';
  ctx.font = 'italic 15px ' + F;
  ctx.fillText(foot, 400, 438);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  if (big) drawTitleDragon();
}
function fmt(s) {
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}
function draw() {
  if (mode === 'title') {
    panel(
      TEXT.title,
      [
        TEXT.tagline,
        '',
        ...(TOUCH.capable
          ? [
              'Drag anywhere to walk: a short drag sneaks, a long drag runs',
              'Hold still next to something to pick, steal, poison, or knock out',
              'Tap Q R F and TAB in the bar below, hold a second finger to breathe fire',
              ''
            ]
          : [
              'WASD / Arrows  move      Shift  sneak      Space  dragon fire      Tab  swap',
              'E (hold)  pick a lock, steal, poison, or knock out a guard you sneak up behind',
              'Q  smoke powder      R  whisper bell      F  bone flute (opens a door, loud)',
              ''
            ]),
        'Stay out of the cones. Torchlight gives you away; shadows hide you.',
        'Running is loud. Guards hunt where they last saw you, and notice the fallen.',
        '',
        (TOUCH.capable ? 'Difficulty (tap to change):   ' : 'Difficulty (press 1, 2 or 3):   ') +
          DIFFS.map(
            (d, i) =>
              (i === diff ? '[ ' : '  ') + (i + 1) + ' ' + d.name + (i === diff ? ' ]' : '  ')
          ).join('   '),
        DIFFS[diff].blurb
      ],
      'Press Enter to begin. Chapter I: The Hollow Crown'
    );
  } else if (mode === 'brief') {
    const d = LEVELS[lvl];
    const R = rep(),
      extra =
        R.f + R.e + R.r > 0
          ? [
              '',
              fill(TEXT.menus.standing, { f: R.f, e: R.e, r: R.r }),
              fill(TEXT.menus.effects, {
                decay: Math.round((R.decay - 1) * 100),
                sight: Math.round((1 - R.sight) * 100),
                gain: Math.round((R.gain - 1) * 100),
                fled: R.fled
              })
            ]
          : [];
    let fin = [];
    if (d.finale) {
      const hc = houseCounts();
      fin = [
        fill(TEXT.menus.finale, {
          bells: Math.min(3, hc.f),
          guards: Math.min(3, hc.e),
          hp: 100 - 8 * hc.r
        })
      ];
    }
    panel(
      d.name,
      ['Mission ' + (lvl + 1) + ': ' + d.house, ''].concat(d.intro.map(lineText), extra, fin),
      'Press Enter to begin'
    );
  } else if (mode === 'court') {
    panel(TEXT.menus.court.title, TEXT.menus.court.lines, 'Press 1, 2 or 3');
  } else if (mode === 'play') {
    drawWorld();
    drawHud();
    drawTouch();
  } else if (mode === 'choice' && G.d.finale) {
    drawWorld();
    drawHud();
    const can = stats.gems >= BREAK_GEMS;
    const lines = TEXT.menus.throne.lines.slice();
    if (!can) lines[4] = fill(TEXT.menus.throne.locked, { gems: BREAK_GEMS, have: stats.gems });
    panel(
      TEXT.menus.throne.title,
      lines,
      can ? 'Press 1, 2 or 3' : 'Press 1 or 2',
      '#f0d080',
      true
    );
  } else if (mode === 'choice') {
    drawWorld();
    drawHud();
    panel(TEXT.menus.perrin.title, TEXT.menus.perrin.lines, 'Press 1 or 2', '#7fd0ff', true);
  } else if (mode === 'win') {
    drawWorld();
    drawHud();
    const tot = G.items.filter((i) => i.type === 'g').length;
    panel(
      'Mission Complete',
      [
        G.d.name + ' is behind you.',
        '',
        'Ember gems: ' + G.gems + ' / ' + tot + '     Time: ' + fmt(G.time),
        'Total gems: ' + stats.gems + '  (more gems, longer dragon fire)',
        ''
      ].concat(G.outLines),
      'Press Enter to continue',
      '#7be08a',
      true
    );
  } else if (mode === 'lose') {
    drawWorld();
    drawHud();
    const pair = TEXT.caught[G.caughtPick || 0];
    panel(
      'CAUGHT',
      ['Shiloh: ' + pair[0], 'Ashling: ' + pair[1]],
      'Press Enter to retry the mission',
      '#e05050',
      true
    );
  } else if (mode === 'end') {
    const epi = {
      bribe: 'The steward drinks your coin and your secrets. Grell trusts no one now.',
      blackmail: 'The chamberlain will keep your secret until he cannot. Tick, tick.',
      poison: 'Grell wakes with a headache and a signature he does not remember.',
      null: 'You took no favors, and owe none.'
    }[perk];
    const rank = stats.caught === 0 ? 'Ghost' : stats.caught < 3 ? 'Courier' : 'Loud';
    const E = G.ending || { title: 'Chapter I Complete', lines: [epi], col: '#f0b44c' };
    panel(
      E.title,
      E.lines.concat([
        '',
        'Ember gems: ' +
          stats.gems +
          ' / ' +
          TOTAL_GEMS +
          '     Times caught: ' +
          stats.caught +
          '     Time: ' +
          fmt(stats.time),
        'Rank: ' + rank + '   (' + DIFFS[diff].name + ')',
        '',
        'Houses (Favor/Fear/Ruin):',
        Object.keys(houses)
          .slice(0, 3)
          .map(
            (k) =>
              HOUSE_NAMES[k] + ' ' + houses[k].favor + '/' + houses[k].fear + '/' + houses[k].ruin
          )
          .join('     '),
        Object.keys(houses)
          .slice(3)
          .map(
            (k) =>
              HOUSE_NAMES[k] + ' ' + houses[k].favor + '/' + houses[k].fear + '/' + houses[k].ruin
          )
          .join('     ')
      ]),
      'Press Enter to return to the title',
      E.col
    );
  }
}
let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  ctx = MAINCTX;
  CLAY = false;
  SHC = null;
  SPR = 1; // a bad frame must not leave drawing pointed at a side layer
  const dt = Math.min(0.05, (t - last) / 1000 || 0);
  last = t;
  now = t / 1000;
  fdt = dt;
  if (RES > 1 && mode === 'play') {
    perfT += t - (frame.prev || t);
    perfN++;
    if (perfN >= 45) {
      if (perfT / perfN > 24) setRes(1);
      perfT = perfN = 0;
    }
  }
  frame.prev = t;
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  if (mode === 'play') update(dt);
  draw();
  SND.sync();
  // everything sits on warm, grainy paper
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.3;
  ctx.drawImage(PAPER, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  drawSoundIcon();
}
requestAnimationFrame(frame);
