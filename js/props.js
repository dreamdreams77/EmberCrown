// Props and effects in the world: items, doors, exit, vents, smoke, particles.
'use strict';

function drawGem(it) {
  const b = Math.sin(now * 3 + it.x * 0.1) * 2,
    x = it.x,
    y = it.y + b;
  ell(x, it.y + 8, 5, 2, 'rgba(0,0,0,.3)');
  ctx.fillStyle = '#b8461a';
  diamond(x, y, 7, 9);
  ctx.fill();
  ctx.fillStyle = '#ff9a3c';
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 7, y);
  ctx.lineTo(x, y + 2);
  ctx.lineTo(x - 7, y);
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 3, y - 2);
  ctx.lineTo(x - 3, y - 2);
  ctx.fill();
}
// A ring of plain wax with nothing pressed into it: the Hollow Crown's seal.
function waxRing(c, x, y, r) {
  c.save();
  c.translate(x, y);
  c.fillStyle = 'rgba(20,6,20,.35)';
  c.beginPath();
  c.ellipse(0.6, 0.9, r + 0.8, r * 0.86, 0, 0, 7);
  c.fill();
  c.beginPath();
  c.ellipse(0, 0, r, r * 0.88, 0, 0, 6.283);
  c.closePath();
  c.moveTo(r * 0.5, 0);
  c.ellipse(0, 0, r * 0.5, r * 0.44, 0, 0, 6.283);
  c.closePath();
  const g = c.createRadialGradient(-r * 0.3, -r * 0.4, 0, 0, 0, r * 1.2);
  g.addColorStop(0, '#d8523a');
  g.addColorStop(0.5, '#a3321f');
  g.addColorStop(1, '#5a1410');
  c.fillStyle = g;
  c.fill('evenodd');
  c.strokeStyle = 'rgba(255,220,200,.4)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.arc(0, 0, r * 0.88, -2.7, -1.4);
  c.stroke();
  c.restore();
}
function drawItem(it) {
  const x = it.x,
    y = it.y;
  if (it.type === 'O') {
    if (G.d.song) {
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 14, y - 4, 28, 14);
      ctx.fillStyle = '#6a2a1a';
      ctx.fillRect(x - 10, y - 9, 20, 15);
      ctx.fillStyle = '#e0b040';
      ctx.fillRect(x - 10, y - 9, 3, 15);
      ctx.fillStyle = '#eadfd0';
      ctx.fillRect(x - 6, y - 8, 15, 12);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      for (let k = 0; k < 4; k++) ctx.fillRect(x - 4, y - 6 + k * 3, 11, 1);
    } else if (lvl === 0) {
      ell(x, y + 4, 14, 7, '#3a2a1a');
      waxRing(ctx, x + 15, y + 8, 5.5);
      ctx.strokeStyle = '#6a4a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 13, 6, 0, 0, 7);
      ctx.stroke();
      const wob = Math.sin(now * 2) > 0.85 ? Math.sin(now * 40) * 0.15 : 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(wob);
      ell(0, 0, 9, 12, '#e8dcc0');
      ell(-3, -4, 3, 4, 'rgba(255,255,255,.4)');
      ctx.fillStyle = '#c0541c';
      ctx.fillRect(-4, -1, 3, 2);
      ctx.fillRect(2, 4, 3, 2);
      ctx.fillRect(1, -7, 2, 2);
      ctx.strokeStyle = 'rgba(255,140,60,' + (0.4 + 0.3 * Math.sin(now * 3)) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(-2, 0);
      ctx.lineTo(1, 3);
      ctx.lineTo(5, 1);
      ctx.stroke();
      ctx.restore();
    } else if (G.d.timeshift) {
      ell(x, y + 2, 11, 8, '#5a1a2a');
      ctx.strokeStyle = '#e0b040';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 7);
      ctx.stroke();
      ell(x, y - 5, 2.6, 2.6, '#5fd0a0');
    } else {
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(x - 15, y - 8, 30, 18);
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(x - 11, y - 6, 20, 13);
      ctx.fillStyle = '#c8b898';
      ctx.fillRect(x - 13, y - 7, 3, 15);
      ctx.fillRect(x + 8, y - 7, 3, 15);
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      for (let k = 0; k < 3; k++) ctx.fillRect(x - 8, y - 3 + k * 3, 12, 1);
      waxRing(ctx, x + 4, y + 4, 5);
    }
  } else if (it.type === 'C') {
    ell(x, y + 10, 6, 2.5, 'rgba(0,0,0,.4)');
    ctx.fillStyle = '#d8d0b8';
    ctx.fillRect(x - 4, y - 3, 8, 13);
    ctx.fillStyle = '#b8b098';
    ctx.fillRect(x + 1, y - 3, 3, 13);
    ctx.fillStyle = '#ece4cc';
    ctx.fillRect(x - 4, y - 3, 3, 6);
    ctx.fillRect(x + 2, y - 3, 2, 4);
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 0.5, y - 6, 1, 3);
  } else if (it.type === 'H') {
    if (!it.done) {
      for (const sd of [-1, 1])
        for (let k = 0; k < 4; k++)
          ell(
            x + sd * (14 - k * 2.3),
            y - 12 + k * 2.6,
            2.1,
            1.4,
            k % 2 ? '#8a909c' : '#b8bcc6',
            sd * 0.8
          );
      shadowAt(x, y, 8);
      ell(x, y + 3, 8, 6, '#2f5f8a');
      ell(x, y + 3, 5, 4, '#7fd0ff');
      const A = G.active === 'shiloh' ? G.shiloh : G.ash;
      perrinHead({ face: Math.atan2(A.y - y, A.x - x) }, x, y - 4, 'captive', talking('Perrin'));
    }
  } else if (it.type === 'L') {
    ell(x, y + 8, 10, 3, 'rgba(0,0,0,.4)');
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(x - 2, y, 4, 9);
    ctx.fillStyle = '#6a4a30';
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 9);
    ctx.lineTo(x + 11, y - 9);
    ctx.lineTo(x + 9, y + 1);
    ctx.lineTo(x - 9, y + 1);
    ctx.fill();
    ctx.fillStyle = '#eadfd0';
    ctx.fillRect(x - 9, y - 8, 8, 8);
    ctx.fillRect(x + 1, y - 8, 8, 8);
    if (!it.done) {
      ctx.fillStyle = 'rgba(150,210,255,' + (0.6 + 0.3 * Math.sin(now * 3)) + ')';
      ctx.fillRect(x - 7, y - 6, 4, 1);
      ctx.fillRect(x - 7, y - 3, 5, 1);
      ctx.fillRect(x + 3, y - 6, 4, 1);
      ctx.fillRect(x + 3, y - 3, 3, 1);
    }
  } else if (it.type === 'P' && G.flight) {
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(x - 14, y - 10, 28, 20);
    ctx.fillStyle = '#c8b080';
    ctx.fillRect(x - 11, y - 7, 22, 14);
    ctx.strokeStyle = '#6a5030';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 2);
    ctx.lineTo(x - 2, y - 5);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x + 8, y - 3);
    ctx.stroke();
    ctx.fillStyle = '#c44a4a';
    ctx.fillRect(x - 1, y + 1, 3, 3);
  } else if (it.type === 'P' && G.d.timeshift) {
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x - 30, y - 10, 60, 20);
    ctx.fillStyle = '#f0e8d8';
    ctx.fillRect(x - 28, y - 8, 56, 16);
    for (let k = -20; k <= 20; k += 10) {
      ell(x + k, y - 2, 3, 3, '#c0c8d0');
    }
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(x - 6, y - 1, 12, 8);
    ctx.fillStyle = '#a82020';
    ctx.fillRect(x - 1, y + 3, 3, 3);
  } else if (it.type === 'P') {
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x - 30, y - 10, 60, 20);
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(x - 28, y - 8, 56, 16);
    for (let k = -20; k <= 20; k += 10)
      if (k) {
        ell(x + k, y + 1, 3.5, 3.5, '#d8d8d8');
      }
    ctx.fillStyle = '#e0b040';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 9);
    ctx.lineTo(x + 6, y - 9);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x - 3, y);
    ctx.fill();
    ctx.fillRect(x - 1, y, 2, 6);
    ctx.fillRect(x - 5, y + 5, 10, 2);
    ell(x, y - 8, 5, 1.6, '#5a1a3a');
  } else if (it.type === 'B') {
    ell(x, y + 9, 13, 4, 'rgba(0,0,0,.45)');
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 9);
    ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 9, y + 9);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = '#3a3a42';
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 6);
    ctx.lineTo(x + 11, y - 6);
    ctx.lineTo(x + 7, y + 2);
    ctx.lineTo(x - 7, y + 2);
    ctx.fill();
    ell(x, y - 6, 11, 3.5, it.done ? '#2a1a14' : '#5a2a10');
    if (it.done) {
      for (let k = 0; k < 5; k++)
        ell(
          x - 6 + k * 3,
          y - 6 + (k % 2),
          1.4,
          1.2,
          'rgba(255,90,30,' + (0.3 + 0.3 * Math.sin(now * 3 + k)) + ')'
        );
    }
    if (!it.done && it.p > 0) {
      ctx.strokeStyle = '#ffd27a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 3, 17, -1.57, -1.57 + 6.28 * it.p);
      ctx.stroke();
    }
  }
}
function drawDoor(d) {
  const hz = isWallAt(G, d.x - 1, d.y) || isWallAt(G, d.x + 1, d.y);
  ctx.save();
  ctx.translate(d.x * T + 16, d.y * T + 16);
  if (!hz) ctx.rotate(1.5708);
  if (d.open) {
    ctx.fillStyle = '#3a2414';
    ctx.save();
    ctx.translate(-15, -5);
    ctx.rotate(-1.35);
    ctx.fillRect(0, -3, 26, 6);
    ctx.fillStyle = '#22222a';
    ctx.fillRect(5, -3, 2, 6);
    ctx.fillRect(18, -3, 2, 6);
    ctx.restore();
  } else if (d.sealed) {
    ctx.fillStyle = '#231b33';
    ctx.fillRect(-16, -10, 32, 20);
    ctx.fillStyle = '#2f2545';
    ctx.fillRect(-14, -8, 28, 16);
    const a = 0.55 + 0.35 * Math.sin(now * 2.5);
    ctx.strokeStyle = 'rgba(190,160,255,' + a + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-8, 0);
    ctx.moveTo(8, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, 7);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#2a1a0e';
    ctx.fillRect(-16, -8, 32, 16);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k % 2 ? '#6a4526' : '#5e3d21';
      ctx.fillRect(-15 + k * 6, -7, 6, 14);
    }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    for (let k = 1; k < 5; k++) ctx.fillRect(-15 + k * 6, -7, 1, 14);
    ctx.fillStyle = '#2a2a32';
    ctx.fillRect(-15, -5, 30, 2);
    ctx.fillRect(-15, 3, 30, 2);
    ctx.fillStyle = '#d8a24a';
    ctx.fillRect(5, -2.5, 5, 5);
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(7, -1.5, 1, 3);
  }
  ctx.restore();
}
function drawExit() {
  const e = G.exit,
    o = G.exitOpen;
  if (G.flight) {
    ell(e.x, e.y, 17, 17, '#2e3a38');
    ell(e.x, e.y, 14, 14, '#3e4e4a');
    ctx.strokeStyle = o ? 'rgba(140,255,170,' + (0.6 + 0.4 * Math.sin(now * 4)) + ')' : '#5a6a66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 15, 0, 7);
    ctx.stroke();
    ctx.fillStyle = o ? '#bff5cf' : '#667a6c';
    ctx.fillRect(e.x - 6, e.y - 1, 12, 2);
    ctx.fillRect(e.x - 1, e.y - 6, 2, 12);
  } else if (G.d.exitLabel) {
    ell(e.x, e.y + 12, 24, 6, 'rgba(0,0,0,.45)');
    ctx.fillStyle = '#4a3a10';
    ctx.fillRect(e.x - 18, e.y - 14, 36, 24);
    ctx.fillStyle = o ? '#e0b040' : '#8a7030';
    ctx.fillRect(e.x - 16, e.y - 16, 32, 10);
    for (let k = -12; k <= 12; k += 8) {
      ctx.beginPath();
      ctx.moveTo(k + e.x - 3, e.y - 16);
      ctx.lineTo(k + e.x, e.y - 24);
      ctx.lineTo(k + e.x + 3, e.y - 16);
      ctx.fill();
    }
    ctx.fillStyle = '#6a1a1a';
    ctx.fillRect(e.x - 11, e.y - 5, 22, 12);
    ctx.fillStyle = o ? '#c89a30' : '#6a5a28';
    ctx.fillRect(e.x - 18, e.y - 6, 5, 16);
    ctx.fillRect(e.x + 13, e.y - 6, 5, 16);
  } else {
    ctx.fillStyle = '#08070a';
    ctx.beginPath();
    ctx.moveTo(e.x - 14, e.y + 14);
    ctx.lineTo(e.x - 14, e.y - 4);
    ctx.arc(e.x, e.y - 4, 14, 3.1416, 0);
    ctx.lineTo(e.x + 14, e.y + 14);
    ctx.fill();
    ctx.strokeStyle = '#5a5262';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(e.x - 15, e.y + 14);
    ctx.lineTo(e.x - 15, e.y - 4);
    ctx.arc(e.x, e.y - 4, 15, 3.1416, 0);
    ctx.lineTo(e.x + 15, e.y + 14);
    ctx.stroke();
    if (o) {
      const gr = ctx.createLinearGradient(0, e.y - 18, 0, e.y + 14);
      gr.addColorStop(0, 'rgba(120,255,160,0)');
      gr.addColorStop(1, 'rgba(120,255,160,.45)');
      ctx.fillStyle = gr;
      ctx.fillRect(e.x - 13, e.y - 18, 26, 32);
    } else {
      ctx.strokeStyle = '#3e3a44';
      ctx.lineWidth = 2;
      for (let k = -10; k <= 10; k += 5) {
        ctx.beginPath();
        ctx.moveTo(e.x + k, e.y - 16);
        ctx.lineTo(e.x + k, e.y + 14);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(e.x - 13, e.y);
      ctx.lineTo(e.x + 13, e.y);
      ctx.moveTo(e.x - 13, e.y + 8);
      ctx.lineTo(e.x + 13, e.y + 8);
      ctx.stroke();
    }
  }
}
function drawFloorThings() {
  for (const v of G.vents) {
    const vx = v.x * T,
      vy = v.y * T;
    ctx.fillStyle = '#0c0606';
    ctx.fillRect(vx + 3, vy + 3, T - 6, T - 6);
    if (v.warn || v.on) {
      const gr = ctx.createRadialGradient(vx + 16, vy + 16, 0, vx + 16, vy + 16, 14);
      gr.addColorStop(0, v.on ? 'rgba(255,200,90,.95)' : 'rgba(255,110,30,.6)');
      gr.addColorStop(1, 'rgba(120,30,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(vx + 3, vy + 3, T - 6, T - 6);
    }
    ctx.fillStyle = '#3a2a28';
    for (let i = 0; i < 4; i++) ctx.fillRect(vx + 4, vy + 7 + i * 6, T - 8, 2);
    ctx.strokeStyle = '#4a3a36';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx + 3.5, vy + 3.5, T - 7, T - 7);
  }
  for (const pd of G.peds) {
    ell(pd.x, pd.y + 4, 15, 6, 'rgba(0,0,0,.4)');
    ell(pd.x, pd.y, 14, 14, '#2a2040');
    ell(pd.x, pd.y, 11, 11, '#3a2e58');
    const c = G.state === 'ruin' ? '224,160,112' : '185,200,255';
    ctx.save();
    ctx.translate(pd.x, pd.y);
    ctx.rotate(now * 0.6);
    ctx.strokeStyle = 'rgba(' + c + ',.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, 7);
    ctx.stroke();
    for (let k = 0; k < 6; k++) {
      ctx.rotate(1.047);
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(9, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(' + c + ',.9)';
    ctx.beginPath();
    ctx.moveTo(pd.x, pd.y - 4);
    ctx.lineTo(pd.x, pd.y + 4);
    ctx.moveTo(pd.x - 4, pd.y);
    ctx.lineTo(pd.x + 4, pd.y);
    ctx.stroke();
  }
  for (const k in G.doors) drawDoor(G.doors[k]);
  drawExit();
  for (const it of G.items) {
    if (it.type === 'g') {
      if (!it.done) drawGem(it);
      continue;
    }
    const off =
      G.d.timeshift &&
      ((it.type === 'P' && G.state !== 'ball') || (it.type === 'O' && G.state !== 'ruin'));
    ctx.globalAlpha = off ? 0.22 : it.done && !'BC'.includes(it.type) ? 0.35 : 1;
    drawItem(it);
    ctx.globalAlpha = 1;
  }
  if (G.d.bellAt) {
    const bx = G.d.bellAt[0] * T + 16,
      by = G.d.bellAt[1] * T + 16,
      sw = G.boss && G.boss.toll > 0 ? Math.sin(now * 30) * 0.25 : Math.sin(now) * 0.04;
    ell(bx, by + 12, 18, 5, 'rgba(0,0,0,.45)');
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(bx - 20, by - 18, 4, 30);
    ctx.fillRect(bx + 16, by - 18, 4, 30);
    ctx.fillRect(bx - 20, by - 20, 40, 5);
    ctx.save();
    ctx.translate(bx, by - 16);
    ctx.rotate(sw);
    ctx.fillStyle = '#7a5a18';
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.quadraticCurveTo(-8, 14, -14, 22);
    ctx.lineTo(14, 22);
    ctx.quadraticCurveTo(8, 14, 6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c89a30';
    ctx.beginPath();
    ctx.moveTo(-4, 3);
    ctx.quadraticCurveTo(-6, 14, -10, 20);
    ctx.lineTo(2, 20);
    ctx.quadraticCurveTo(0, 12, 0, 3);
    ctx.closePath();
    ctx.fill();
    ell(0, 23, 3, 2, '#3a2a10');
    ctx.restore();
  }
}
function drawSmoke() {
  for (const s of G.smoke) {
    const a = Math.min(0.75, s.t / 2.5);
    for (const p of s.puffs) {
      const ang = p.a + G.time * p.v,
        d = p.d * Math.min(1, (6 - s.t) * 1.5 + 0.4),
        r = p.s * (1.2 + (6 - s.t) * 0.06);
      ctx.globalAlpha = a * 0.8;
      ctx.drawImage(
        glow('195,195,205'),
        s.x + Math.cos(ang) * d - r * 1.4,
        s.y + Math.sin(ang) * d - r * 1.4,
        r * 2.8,
        r * 2.8
      );
    }
    ctx.globalAlpha = 1;
  }
}
function drawParts(add) {
  if (add) ctx.globalCompositeOperation = 'lighter';
  for (const q of G.parts) {
    const isAdd = !(q.k === 'smoke' || q.k === 'ash');
    if (isAdd !== add) continue;
    const f = Math.max(0, q.t / q.t0);
    if (q.k === 'fire') {
      const r = (q.r + (1 - f) * 5) * 2.2;
      ctx.globalAlpha = Math.min(1, f * 1.4);
      ctx.drawImage(
        glow(f > 0.6 ? '255,225,140' : f > 0.3 ? '255,130,40' : '190,50,15'),
        q.x - r,
        q.y - r,
        r * 2,
        r * 2
      );
    } else if (q.k === 'smoke') {
      const r = q.r * (2.6 - f * 1.4);
      ctx.globalAlpha = f * 0.4;
      ctx.drawImage(glow('70,66,76'), q.x - r, q.y - r, r * 2, r * 2);
    } else if (q.k === 'ash') {
      ctx.globalAlpha = 0.5 * Math.min(1, f * 3);
      ctx.fillStyle = '#b8b0b8';
      ctx.fillRect(q.x, q.y, q.r * 1.6, q.r);
    } else if (q.k === 'dust') {
      ctx.globalAlpha = 0.35 * Math.sin(f * 3.14);
      ctx.fillStyle = '#fff0d0';
      ctx.fillRect(q.x, q.y, 1.2, 1.2);
    } else {
      const r = q.r * 3.5;
      ctx.globalAlpha = Math.min(1, f * 2) * (q.k === 'ember' ? 0.7 : 1);
      ctx.drawImage(glow('255,170,70'), q.x - r, q.y - r, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
