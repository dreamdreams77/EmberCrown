// Drawing foundation: canvases, the clay material, baked level backgrounds.
'use strict';

/* ---------- art: textures, light, sprites ---------- */
let now = 0,
  fdt = 0;
function hash(x, y, s) {
  let h =
    (Math.imul(x | 0, 374761393) +
      Math.imul(y | 0, 668265263) +
      Math.imul((s | 0) + 1, 1442695041)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const SHADE_C = {};
function shade(hex, k) {
  const key = hex + k;
  if (SHADE_C[key]) return SHADE_C[key];
  const n = parseInt(hex.slice(1), 16);
  return (SHADE_C[key] =
    'rgb(' +
    [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
      Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))
    ) +
    ')');
}
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
// a full-screen buffer at render resolution, drawn in 800x480 game units
function mkLayer() {
  const c = mkCanvas(800 * RES, 480 * RES);
  c.getContext('2d').setTransform(RES, 0, 0, RES, 0, 0);
  return c;
}
const SOFT = (() => {
  const c = mkCanvas(128, 128),
    x = c.getContext('2d'),
    g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return c;
})();
// a wall torch only lights the room in front of it
const SOFT_HALF = (() => {
  const c = mkCanvas(128, 128),
    x = c.getContext('2d');
  x.drawImage(SOFT, 0, 0);
  x.globalCompositeOperation = 'destination-out';
  const g = x.createLinearGradient(0, 40, 0, 64);
  g.addColorStop(0, '#000');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 64);
  return c;
})();
const GLOWS = {};
function glow(c, half) {
  const key = c + (half ? 'h' : '');
  if (!GLOWS[key]) {
    const s = mkCanvas(128, 128),
      x = s.getContext('2d');
    x.drawImage(half ? SOFT_HALF : SOFT, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = 'rgb(' + c + ')';
    x.fillRect(0, 0, 128, 128);
    GLOWS[key] = s;
  }
  return GLOWS[key];
}
const mkVig = () => {
  const c = mkLayer(),
    x = c.getContext('2d'),
    g = x.createRadialGradient(400, 240, 190, 400, 240, 520);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.65)');
  x.fillStyle = g;
  x.fillRect(0, 0, 800, 480);
  return c;
};
const mkSky = () => {
  const c = mkLayer(),
    x = c.getContext('2d');
  for (let layer = 0; layer < 2; layer++) {
    x.fillStyle = layer ? '#050307' : '#120a16';
    const base = layer ? 440 : 410;
    for (let px = -20; px < 820;) {
      const w = (30 + hash(px, layer, 9) * 70) | 0,
        h = (20 + hash(px, layer, 10) * (layer ? 60 : 110)) | 0;
      x.fillRect(px, base - h, w, 480);
      for (let b = 0; b < w; b += 8) x.fillRect(px + b, base - h - 5, 4, 5);
      if (hash(px, layer, 11) > 0.6) {
        x.fillRect(px + w / 2 - 6, base - h - 30, 12, 30);
        x.beginPath();
        x.moveTo(px + w / 2 - 9, base - h - 30);
        x.lineTo(px + w / 2, base - h - 48);
        x.lineTo(px + w / 2 + 9, base - h - 30);
        x.fill();
      }
      if (layer)
        for (let k = 0; k < 3; k++)
          if (hash(px, k, 12) > 0.55) {
            x.fillStyle = 'rgba(255,170,80,.7)';
            x.fillRect(px + 6 + k * 9, base - h + 12 + k * 7, 2, 4);
            x.fillStyle = '#050307';
          }
      px += w + ((hash(px, layer, 13) * 20) | 0);
    }
  }
  return c;
};
let VIG = mkVig(),
  SKY = mkSky();
const TITLE_EMBERS = Array.from({ length: 70 }, () => ({
  x: Math.random() * 800,
  y: Math.random() * 480,
  v: 12 + Math.random() * 30,
  r: 0.8 + Math.random() * 1.6,
  ph: Math.random() * 6
}));
const lightCv = mkCanvas(400, 240),
  lctx = lightCv.getContext('2d');
lctx.setTransform(0.5, 0, 0, 0.5, 0, 0);

function isWallAt(g, tx, ty) {
  return tx < 0 || ty < 0 || tx >= GW || ty >= GH || g.grid[ty][tx] === '#';
}
function curPal(g) {
  return g.state === 'ruin' && g.d.palRuin ? g.d.palRuin : g.d.pal;
}
// Level backgrounds are baked once per level (and again on a time shift): slabs of pressed clay
const OUTLINE_RGB = '26,12,40';
function mulberry(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function blot(c, x, y, r, col, a) {
  c.globalAlpha = a;
  c.drawImage(glow(col), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = 1;
}
// the stones (or planks, plates, tiles) that make up one floor tile
function tileRects(tx, ty, S, fl) {
  const px = tx * T,
    py = ty * T,
    r = hash(tx, ty, S),
    r2 = hash(tx, ty, S + 1);
  if (fl === 'wood') {
    const o = (hash(tx, ty, S + 5) * 14) | 0;
    return [
      [px, py, o + 10, 16],
      [px + o + 10, py, T - o - 10, 16],
      [px, py + 16, T - o - 6, 16],
      [px + T - o - 6, py + 16, o + 6, 16]
    ];
  }
  if (fl === 'iron' || fl === 'marble') return [[px, py, T, T]];
  if (r2 < 0.45) {
    const a = 8 + ((r * 10) | 0),
      b = 14 + ((r2 * 12) | 0);
    return [
      [px, py, a, 15],
      [px + a, py, T - a, 15],
      [px, py + 15, b, 17],
      [px + b, py + 15, T - b, 17]
    ];
  }
  const c = 9 + ((r * 14) | 0);
  return [
    [px, py, c, T],
    [px + c, py, T - c, T]
  ];
}
function buildBg(g) {
  const p = curPal(g),
    W = (a, b) => isWallAt(g, a, b),
    ruin = g.state === 'ruin',
    S = lvl * 31 + (ruin ? 7 : 0),
    fl = g.flight ? 'sea' : p.floor || 'flag';
  const c = g.bg || (g.bg = mkLayer()),
    x = c.getContext('2d'),
    R0 = mulberry(S * 977 + 3);
  x.clearRect(0, 0, 800, 480);
  g.torches = [];
  const floorPath = new Path2D(),
    wallPath = new Path2D();
  for (let ty = 0; ty < GH; ty++)
    for (let tx = 0; tx < GW; tx++) (W(tx, ty) ? wallPath : floorPath).rect(tx * T, ty * T, T, T);
  // grout and ground colour, mottled like pressed clay
  x.save();
  x.clip(floorPath);
  x.fillStyle = shade(p.f1, -0.5);
  x.fillRect(0, 0, 800, 480);
  x.restore();
  x.save();
  x.clip(wallPath);
  x.fillStyle = shade(p.w, -0.5);
  x.fillRect(0, 0, 800, 480);
  x.restore();
  const slab = (rx, ry, rw, rh, base, v, rad) => {
    const gr = x.createLinearGradient(rx, ry, rx + rw * 0.6, ry + rh);
    gr.addColorStop(0, shade(base, v + 0.3));
    gr.addColorStop(0.55, shade(base, v + 0.06));
    gr.addColorStop(1, shade(base, v - 0.16));
    rrectOn(x, rx, ry, rw, rh, rad);
    x.fillStyle = gr;
    x.fill();
    const bv = x.createLinearGradient(rx, ry, rx + rw, ry + rh);
    bv.addColorStop(0, 'rgba(255,240,225,.42)');
    bv.addColorStop(0.5, 'rgba(255,240,225,0)');
    bv.addColorStop(1, 'rgba(14,4,30,.5)');
    rrectOn(x, rx + 0.7, ry + 0.7, rw - 1.4, rh - 1.4, rad);
    x.strokeStyle = bv;
    x.lineWidth = 1.4;
    x.stroke();
  };
  const swirl = (cx, cy, maxr, R, a) => {
    const a0 = R() * 6.28;
    for (let r = 2.5; r < maxr; r += 2.7) {
      x.beginPath();
      x.arc(cx + 1, cy + 1, r, a0 + r * 0.35, a0 + r * 0.35 + 4.3);
      x.strokeStyle = 'rgba(12,4,28,' + a * 1.2 + ')';
      x.lineWidth = 1.3;
      x.stroke();
      x.beginPath();
      x.arc(cx, cy, r, a0 + r * 0.35, a0 + r * 0.35 + 4.3);
      x.strokeStyle = 'rgba(255,240,225,' + a + ')';
      x.lineWidth = 1;
      x.stroke();
    }
  };
  const speck = (px, py, r) => {
    x.fillStyle = 'rgba(12,4,28,.28)';
    x.beginPath();
    x.arc(px + 0.8, py + 0.8, r, 0, 7);
    x.fill();
    x.fillStyle = 'rgba(255,240,225,.3)';
    x.beginPath();
    x.arc(px, py, r * 0.8, 0, 7);
    x.fill();
  };
  if (g.flight) {
    x.save();
    x.clip(floorPath);
    const sea = x.createLinearGradient(0, 0, 0, 480);
    sea.addColorStop(0, shade(p.f2, 0.05));
    sea.addColorStop(1, shade(p.f1, -0.25));
    x.fillStyle = sea;
    x.fillRect(0, 0, 800, 480);
    // the sea is stacked, overlapping lens-shaped plates of clay
    for (let k = 0; k < 150; k++) {
      const cx = R0() * 800,
        cy = R0() * 480,
        w = 34 + R0() * 70,
        h = 6 + R0() * 9,
        t = R0();
      x.fillStyle = 'rgba(6,20,36,.3)';
      x.beginPath();
      x.ellipse(cx + 2, cy + h * 0.5 + 2, w / 2, h * 0.62, 0, 0, 7);
      x.fill();
      const gr = x.createLinearGradient(0, cy - h, 0, cy + h);
      gr.addColorStop(0, shade(p.wt, 0.1 + t * 0.25));
      gr.addColorStop(1, shade(p.f2, 0.0 - t * 0.1));
      x.fillStyle = gr;
      x.beginPath();
      x.ellipse(cx, cy, w / 2, h * 0.7, 0, 0, 7);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,' + (0.12 + t * 0.14) + ')';
      x.beginPath();
      x.ellipse(cx - w * 0.1, cy - h * 0.28, w * 0.3, h * 0.16, 0, 0, 7);
      x.fill();
    }
    x.restore();
  } else
    for (let ty = 0; ty < GH; ty++)
      for (let tx = 0; tx < GW; tx++) {
        if (W(tx, ty)) continue;
        const px = tx * T,
          py = ty * T,
          r = hash(tx, ty, S),
          r2 = hash(tx, ty, S + 1);
        for (const [rx, ry, rw, rh] of tileRects(tx, ty, S, fl)) {
          const v = (hash(rx, ry, S + 2) - 0.5) * 0.3,
            base =
              fl === 'marble'
                ? (tx + ty) % 2
                  ? p.f2
                  : p.f1
                : hash(ry, rx, S + 3) < 0.5
                  ? p.f1
                  : p.f2;
          slab(rx + 1.2, ry + 1.2, rw - 2.4, rh - 2.4, base, v + 0.12, fl === 'iron' ? 3 : 5);
          const R = mulberry((rx * 91 + ry * 7 + S) | 0);
          if (fl === 'marble') {
            x.strokeStyle = 'rgba(255,255,255,.2)';
            x.lineWidth = 1;
            x.beginPath();
            x.moveTo(rx + R() * rw, ry + 2);
            x.quadraticCurveTo(rx + R() * rw, ry + rh / 2, rx + R() * rw, ry + rh - 2);
            x.stroke();
          } else if (fl === 'wood') {
            x.strokeStyle = 'rgba(12,4,28,.2)';
            x.lineWidth = 0.9;
            x.beginPath();
            const gy = ry + rh / 2;
            x.moveTo(rx + 4, gy);
            x.quadraticCurveTo(
              rx + rw * 0.4,
              gy + (R() - 0.5) * 3,
              rx + rw - 5,
              gy + (R() - 0.5) * 2
            );
            x.stroke();
          } else if (fl === 'iron') {
            for (const [ax, ay] of [
              [5, 5],
              [rw - 6, 5],
              [5, rh - 6],
              [rw - 6, rh - 6]
            ])
              speck(rx + ax, ry + ay, 1.7);
          } else if (Math.min(rw, rh) >= 12)
            swirl(
              rx + rw * (0.35 + R() * 0.3),
              ry + rh * (0.35 + R() * 0.3),
              Math.min(rw, rh) * 0.36,
              R,
              0.12
            );
          if (R() < 0.45) speck(rx + 3 + R() * (rw - 6), ry + 3 + R() * (rh - 6), 0.9 + R() * 0.9);
        }
        if (r2 > 0.8) blot(x, px + 16, py + 16, 15, '12,4,28', 0.2);
        if (ruin && r > 0.5) {
          blot(x, px + r2 * 32, py + r * 32, 14, '10,4,2', 0.35);
          for (let k = 0; k < 3; k++) {
            const a = px + hash(tx + k, ty, S + 9) * 26,
              b = py + hash(tx, ty + k, S + 10) * 26,
              q = 3 + hash(k, tx, ty) * 4;
            const gr = x.createLinearGradient(a, b, a + q, b + q);
            gr.addColorStop(0, shade(p.w, 0.3));
            gr.addColorStop(1, shade(p.w, -0.3));
            x.fillStyle = gr;
            x.beginPath();
            x.moveTo(a, b + q);
            x.lineTo(a + q * 0.4, b);
            x.lineTo(a + q, b + q * 0.3);
            x.lineTo(a + q * 0.8, b + q);
            x.closePath();
            x.fill();
          }
        }
      }
  // walls: puffy stone blocks, and a brick face where the wall faces the viewer
  const every = p.torch || 0;
  for (let ty = 0; ty < GH; ty++) {
    let lastT = -99;
    for (let tx = 0; tx < GW; tx++) {
      if (!W(tx, ty)) continue;
      const px = tx * T,
        py = ty * T,
        face = !W(tx, ty + 1),
        capH = face ? 17 : T,
        v = (hash(tx, ty, S + 4) - 0.5) * 0.2;
      slab(px + 1, py + 1, T - 2, capH - 1.5, p.w, v + 0.18, 6);
      if (!W(tx, ty - 1)) {
        x.fillStyle = 'rgba(255,245,230,.22)';
        rrectOn(x, px + 5, py + 2.5, T - 10, 2, 1);
        x.fill();
      }
      if (capH === T && hash(tx, ty, S + 6) > 0.55)
        swirl(
          px + 8 + hash(tx, ty, S + 7) * 16,
          py + 8 + hash(tx, ty, S + 8) * 16,
          7,
          mulberry(tx * 13 + ty),
          0.1
        );
      if (face) {
        const fy = py + capH;
        for (let row = 0; row < 2; row++) {
          const by = fy + 1 + row * 7.6,
            off = row ? -7 : 1;
          for (let b = off; b < T; b += 15) {
            const bx = Math.max(px + 1, px + b),
              bw = Math.min(px + b + 14, px + T - 1) - bx;
            if (bw < 3) continue;
            slab(bx, by, bw, 6.2, p.w, v - 0.22, 2.4);
          }
        }
        const sg = x.createLinearGradient(0, fy, 0, fy + 4);
        sg.addColorStop(0, 'rgba(8,2,20,.55)');
        sg.addColorStop(1, 'rgba(8,2,20,0)');
        x.fillStyle = sg;
        x.fillRect(px, fy, T, 4);
        if (every && tx - lastT >= every && tx > 0 && tx < GW - 1 && hash(tx, ty, S + 5) < 0.6) {
          lastT = tx;
          g.torches.push({ x: px + 16, y: fy + 4, ph: hash(tx, ty, S + 4) * 10 });
        }
      }
    }
  }
  // shadows fall down and to the right in cool violet
  for (let ty = 0; ty < GH; ty++)
    for (let tx = 0; tx < GW; tx++) {
      if (W(tx, ty)) continue;
      const px = tx * T,
        py = ty * T;
      if (W(tx, ty - 1)) {
        const gr = x.createLinearGradient(0, py, 0, py + 16);
        gr.addColorStop(0, 'rgba(20,8,40,.62)');
        gr.addColorStop(1, 'rgba(20,8,40,0)');
        x.fillStyle = gr;
        x.fillRect(px, py, T, 16);
      }
      if (W(tx - 1, ty)) {
        const gr = x.createLinearGradient(px, 0, px + 10, 0);
        gr.addColorStop(0, 'rgba(20,8,40,.45)');
        gr.addColorStop(1, 'rgba(20,8,40,0)');
        x.fillStyle = gr;
        x.fillRect(px, py, 10, T);
      }
    }
  for (const t of g.torches) {
    ell0(x, t.x, t.y + 4, 2.6, 5.5, '#5a4632');
    x.fillStyle = '#8a7050';
    rrectOn(x, t.x - 5.5, t.y - 2.5, 11, 4, 2);
    x.fill();
    x.fillStyle = 'rgba(255,240,210,.35)';
    x.fillRect(t.x - 4, t.y - 2, 6, 1);
  }
  g.bgs = [c, c, c];
}
function ell0(x, cx, cy, rx, ry, col) {
  const gr = x.createRadialGradient(
    cx - rx * 0.3,
    cy - ry * 0.4,
    0,
    cx,
    cy,
    Math.max(rx, ry) * 1.2
  );
  gr.addColorStop(0, shade(col, 0.4));
  gr.addColorStop(1, shade(col, -0.4));
  x.fillStyle = gr;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, 7);
  x.fill();
}
function rrectOn(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
// While CLAY is set, ellipses are modelled like pressed clay: lit from the upper left, with a soft specular dab
let CLAY = false,
  SHC = null;
function ell(x, y, rx, ry, c, rot) {
  rx = Math.max(0.1, rx);
  ry = Math.max(0.1, ry);
  if (CLAY && rx > 1.6 && ry > 1.6 && c[0] === '#') {
    const m = Math.max(rx, ry),
      g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.45, 0, x, y, m * 1.15);
    g.addColorStop(0, shade(c, 0.55));
    g.addColorStop(0.4, c);
    g.addColorStop(1, shade(c, -0.5));
    ctx.fillStyle = g;
  } else ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, 7);
  ctx.fill();
  if (CLAY && rx > 3.5 && ry > 3.5 && c[0] === '#') {
    ctx.fillStyle = 'rgba(255,250,235,.3)';
    ctx.beginPath();
    ctx.ellipse(x - rx * 0.34, y - ry * 0.42, rx * 0.3, ry * 0.18, -0.55, 0, 7);
    ctx.fill();
  }
}
// Shadows go straight onto the world, under the sprite layer, falling down and to the right
let SPR = 1;
function shadowAt(x, y, r, a) {
  const c = SHC || ctx;
  r *= SPR;
  c.fillStyle = 'rgba(24,10,40,' + (a || 0.35) * 1.1 + ')';
  c.beginPath();
  c.ellipse(x + r * 0.25, y + r * 0.5, Math.max(0.1, r * 1.05), Math.max(0.1, r * 0.5), 0, 0, 7);
  c.fill();
}
const PAPER = (() => {
  const c = mkCanvas(800, 480),
    x = c.getContext('2d');
  x.fillStyle = '#fff8ec';
  x.fillRect(0, 0, 800, 480);
  for (const [w, h, a] of [
    [40, 24, 0.12],
    [160, 96, 0.07]
  ]) {
    const s = mkCanvas(w, h),
      sx = s.getContext('2d');
    for (let i = 0; i < w; i++)
      for (let j = 0; j < h; j++) {
        const v = (205 + Math.random() * 50) | 0;
        sx.fillStyle = 'rgb(' + v + ',' + (v - 6) + ',' + (v - 16) + ')';
        sx.fillRect(i, j, 1, 1);
      }
    x.globalAlpha = a;
    x.drawImage(s, 0, 0, 800, 480);
  }
  x.globalAlpha = 1;
  const im = x.getImageData(0, 0, 800, 480),
    d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random() * 14 - 7;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  x.putImageData(im, 0, 0);
  x.strokeStyle = 'rgba(140,110,80,.08)';
  x.lineWidth = 0.6;
  for (let k = 0; k < 450; k++) {
    const a = Math.random() * 800,
      b = Math.random() * 480,
      an = Math.random() * 6.28,
      l = 4 + Math.random() * 12;
    x.beginPath();
    x.moveTo(a, b);
    x.quadraticCurveTo(
      a + Math.cos(an + 1) * l * 0.5,
      b + Math.sin(an + 1) * l * 0.5,
      a + Math.cos(an) * l,
      b + Math.sin(an) * l
    );
    x.stroke();
  }
  return c;
})();
const NIGHT_COLOR = 'rgb(24,12,44)';
const CLAYTEX = (() => {
  const c = mkCanvas(800, 480),
    x = c.getContext('2d'),
    R = mulberry(77);
  const im = x.createImageData(800, 480),
    d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = R(),
      dark = r < 0.5;
    d[i] = dark ? 20 : 255;
    d[i + 1] = dark ? 8 : 244;
    d[i + 2] = dark ? 40 : 226;
    d[i + 3] = Math.pow(R(), 3) * (dark ? 60 : 48);
  }
  x.putImageData(im, 0, 0);
  for (let k = 0; k < 26; k++) {
    const cx = R() * 800,
      cy = R() * 480,
      a = R() * 6.28;
    for (let r = 3; r < 16; r += 3) {
      x.beginPath();
      x.arc(cx + 1, cy + 1, r, a + r * 0.3, a + r * 0.3 + 4.2);
      x.strokeStyle = 'rgba(12,4,28,.1)';
      x.lineWidth = 1.2;
      x.stroke();
      x.beginPath();
      x.arc(cx, cy, r, a + r * 0.3, a + r * 0.3 + 4.2);
      x.strokeStyle = 'rgba(255,240,225,.1)';
      x.lineWidth = 1;
      x.stroke();
    }
  }
  return c;
})();

let layerCv = mkLayer(),
  outlineCv = mkLayer(),
  outlineCtx = outlineCv.getContext('2d'),
  texCv = mkLayer(),
  texx = texCv.getContext('2d');
// drop to 1x if 2x rendering cannot keep up on this machine
function setRes(r) {
  RES = r;
  cv.width = GW * T * RES;
  cv.height = GH * T * RES;
  VIG = mkVig();
  SKY = mkSky();
  layerCv = mkLayer();
  outlineCv = mkLayer();
  outlineCtx = outlineCv.getContext('2d');
  texCv = mkLayer();
  texx = texCv.getContext('2d');
  if (G && G.bgs) {
    G.bg = null;
    G.bgs = null;
    buildBg(G);
  }
}
let perfT = 0,
  perfN = 0;
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function diamond(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
}
function star(x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = k * 0.785,
      rr = k % 2 ? r * 0.4 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
function addGlow(x, y, r, c, a) {
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a;
  ctx.drawImage(glow(c), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function flame(x, y, s, seed) {
  const f = Math.sin(now * 17 + seed) * 0.15 + Math.sin(now * 29 + seed * 2) * 0.1;
  addGlow(x, y - s * 0.4, s * 3.2, '255,140,50', 0.55);
  ctx.fillStyle = '#ff6a1a';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.6, y);
  ctx.quadraticCurveTo(x - s * 0.7, y - s * 0.9, x + f * s, y - s * (1.9 + f));
  ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.9, x + s * 0.6, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y);
  ctx.quadraticCurveTo(x - s * 0.35, y - s * 0.6, x + f * s * 0.6, y - s * (1.1 + f * 0.5));
  ctx.quadraticCurveTo(x + s * 0.35, y - s * 0.6, x + s * 0.3, y);
  ctx.closePath();
  ctx.fill();
}
