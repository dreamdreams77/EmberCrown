// Collision, line of sight, time shift, and building a level from its data.
'use strict';

/* ---------- helpers ---------- */
function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}
function solidTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return true;
  if (G.flight) return false;
  if (G.grid[ty][tx] === '#') return true;
  const d = G.doors[tx + ',' + ty];
  return !!(d && !d.open);
}
function blocked(x, y, r) {
  return (
    solidTile(Math.floor((x - r) / T), Math.floor((y - r) / T)) ||
    solidTile(Math.floor((x + r) / T), Math.floor((y - r) / T)) ||
    solidTile(Math.floor((x - r) / T), Math.floor((y + r) / T)) ||
    solidTile(Math.floor((x + r) / T), Math.floor((y + r) / T))
  );
}
function inSmoke(x, y) {
  return (
    G.smoke.some((s) => Math.hypot(s.x - x, s.y - y) < s.r) ||
    (G.state === 'ball' && G.guests && G.guests.some((s) => Math.hypot(s.x - x, s.y - y) < 11))
  );
}
function unstick(c) {
  if (!blocked(c.x, c.y, 8)) return;
  const tx = Math.floor(c.x / T),
    ty = Math.floor(c.y / T);
  for (let r = 1; r < 8; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = (tx + dx) * T + 16,
          ny = (ty + dy) * T + 16;
        if (!blocked(nx, ny, 8)) {
          c.x = nx;
          c.y = ny;
          return;
        }
      }
}
function shiftTime() {
  const ts = G.d.timeshift,
    toRuin = G.state === 'ball';
  G.state = toRuin ? 'ruin' : 'ball';
  const t = G.guards;
  G.guards = G.otherGuards;
  G.otherGuards = t;
  G.grid = G.baseGrid.map((r) => r.slice());
  if (toRuin) {
    for (const [x, y] of ts.ruin.open) G.grid[y][x] = '.';
    if (G.planted) for (const [x, y] of ts.ruin.openIfPlanted) G.grid[y][x] = '.';
    for (const [x, y] of ts.ruin.block) G.grid[y][x] = '#';
  }
  buildBg(G);
  G.shake = 0.3;
  G.vents = toRuin ? G.ruinVents : [];
  G.rangeMul = G.baseRange * (toRuin ? 1.1 : 0.9);
  unstick(G.shiloh);
  unstick(G.ash);
  G.rings.push({
    x: G.shiloh.x,
    y: G.shiloh.y,
    t: 1,
    r: 220,
    c: toRuin ? '220,130,80' : '240,210,130'
  });
  lureNear(G.shiloh.x, G.shiloh.y, 8 * T * (G.fx.timeNoise || 1));
  say('Shiloh', toRuin ? TEXT.lines.toRuins : TEXT.lines.toBall);
}
function los(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1),
    n = Math.ceil(d / 6);
  for (let i = 1; i < n; i++) {
    const x = x1 + ((x2 - x1) * i) / n,
      y = y1 + ((y2 - y1) * i) / n;
    if (solidTile(Math.floor(x / T), Math.floor(y / T)) || inSmoke(x, y)) return false;
  }
  return true;
}
function say(who, text) {
  text = lineText(text);
  G.msg = { who, text };
  G.msgT = 4;
  sfx('talk', who, text);
}
// A line that follows after a pause, so a short exchange can play out.
function sayLater(delay, who, text) {
  G.sayQ.push({ t: delay, who, text });
}

/* ---------- level loading ---------- */
function loadLevel(i) {
  const d = LEVELS[i];
  const g = {
    d,
    grid: [],
    items: [],
    doors: {},
    smoke: [],
    parts: [],
    lights: [],
    rings: [],
    active: 'shiloh',
    alert: 0,
    hold: 0,
    holdT: null,
    time: 0,
    gems: 0,
    msg: null,
    msgT: 0,
    sayQ: [],
    fx: stairsFx(i),
    fireSaid: false,
    doneSaid: false,
    sneak: false,
    gad: { ...d.gadgets },
    exitOpen: false,
    flight: !!d.flight,
    vents: [],
    peds: [],
    ventSaid: false,
    gain: 1,
    choice: null,
    outLines: [],
    host: d.choice ? { x: 0, y: 0, on: false, host: true, face: 0 } : null
  };
  const D = DIFFS[diff];
  const fx = g.fx;
  if (!d.flight) {
    for (const k of ['smoke', 'bell', 'flute']) {
      g.gad[k] = Math.max(0, g.gad[k] + D[k] + ((fx.gad && fx.gad[k]) || 0));
    }
  }
  let start, ex;
  d.map.forEach((row, y) => {
    g.grid[y] = [];
    for (let x = 0; x < GW; x++) {
      let c = row[x];
      if (c === 'S') {
        start = [x, y];
        c = '.';
      } else if (c === 'X') {
        ex = [x, y];
        c = '.';
      } else if (c === 'D') {
        g.doors[x + ',' + y] = { x, y, open: false };
        c = '.';
      } else if (c === 'Z') {
        g.doors[x + ',' + y] = { x, y, open: false, sealed: true };
        c = '.';
      } else if (c === 'T') {
        g.peds.push({ x: x * T + 16, y: y * T + 16 });
        c = '.';
      } else if (c === 'V') {
        g.vents.push({ x, y, ph: (x * 0.7 + y * 1.3) % 4, on: false, warn: false });
        c = '.';
      } else if ('gOPBLHC'.includes(c)) {
        g.items.push({ x: x * T + 16, y: y * T + 16, type: c, done: false, p: 0 });
        c = '.';
      }
      g.grid[y][x] = c;
    }
  });
  g.exit = { x: ex[0] * T + 16, y: ex[1] * T + 16 };
  g.shiloh = { x: start[0] * T + 16, y: start[1] * T + 16, face: 0 };
  g.ash = { x: g.shiloh.x + (i > 0 ? T : 0), y: g.shiloh.y, face: 0, on: i > 0 };
  if (g.flight) {
    g.shiloh.hidden = true;
    g.ash.x = g.shiloh.x;
    g.ash.y = g.shiloh.y;
    g.active = 'ash';
  }
  const R = rep();
  g.rangeMul = (fx.sight || 1) * D.range * R.sight;
  g.decay = (fx.decay || 1) * D.decay * R.decay;
  g.gain = R.gain;
  const spd = fx.speed || 56;
  g.guards = d.guards
    .filter((_, k) => !(fx.drop && k === d.bribeIdx))
    .map((wp) => ({
      x: wp[0][0] * T + 16,
      y: wp[0][1] * T + 16,
      wp: wp.map((p) => [p[0] * T + 16, p[1] * T + 16]),
      i: 1,
      face: Math.atan2(wp[1][1] - wp[0][1], wp[1][0] - wp[0][0]),
      stun: 0,
      pause: 0,
      lure: null,
      back: null,
      ret: false,
      seeing: false,
      spd,
      rm: d.flight ? 0.8 : 1
    }));
  if (R.fled > 0)
    g.guards.splice(Math.max(1, g.guards.length - R.fled), Math.min(R.fled, g.guards.length - 1));
  for (const x of g.guards) x.spd *= R.chaos;
  // Ashling starts on the open tile beside Shiloh that is farthest from any guard
  if (!g.flight) {
    let bs = -1;
    for (const [ox, oy] of [
      [T, 0],
      [0, -T],
      [0, T],
      [-T, 0],
      [0, 0]
    ]) {
      const x = g.shiloh.x + ox,
        y = g.shiloh.y + oy;
      if (g.grid[(y / T) | 0][(x / T) | 0] === '#') continue;
      const s = Math.min(...g.guards.map((q) => Math.hypot(q.x - x, q.y - y)));
      if (s > bs + 1) {
        bs = s;
        g.ash.x = x;
        g.ash.y = y;
      }
    }
  }
  if (d.finale) {
    const hc = houseCounts(),
      n = Math.min(3, hc.e);
    if (n > 0) g.guards.splice(Math.max(1, g.guards.length - n), Math.min(n, g.guards.length - 1));
    g.gad.bell += Math.min(3, hc.f);
  }
  if (d.boss) {
    const wp = d.boss.wp,
      cm = d.boss.kind === 'candle',
      bhp = cm ? 100 - 8 * houseCounts().r : 100;
    g.boss = {
      x: wp[0][0] * T + 16,
      y: wp[0][1] * T + 16,
      wp: wp.map((p) => [p[0] * T + 16, p[1] * T + 16]),
      i: 1,
      boss: true,
      kind: d.boss.kind || 'warden',
      hp: bhp,
      maxhp: bhp,
      blinkT: 5,
      blink: null,
      hurt: 0,
      dead: false,
      tollT: 4,
      toll: 0,
      face: Math.atan2(wp[1][1] - wp[0][1], wp[1][0] - wp[0][0]),
      stun: 0,
      pause: 0,
      lure: null,
      back: null,
      ret: false,
      seeing: false,
      spd: cm ? 46 : 40,
      rm: 1
    };
    g.guards.push(g.boss);
  }
  g.noiseT = 0;
  for (const t of d.towers || [])
    g.guards.push({
      x: t[0] * T + 16,
      y: t[1] * T + 16,
      wp: [[t[0] * T + 16, t[1] * T + 16]],
      i: 0,
      face: t[2],
      spin: t[3] * (fx.spin || 1),
      stun: 0,
      pause: 0,
      lure: null,
      back: null,
      ret: false,
      seeing: false,
      spd: 0,
      rm: 0.8
    });
  if (d.timeshift) {
    const ts = d.timeshift;
    const mk = (wp) => ({
      x: wp[0][0] * T + 16,
      y: wp[0][1] * T + 16,
      wp: wp.map((p) => [p[0] * T + 16, p[1] * T + 16]),
      i: 1,
      face: Math.atan2(wp[1][1] - wp[0][1], wp[1][0] - wp[0][0]),
      stun: 0,
      pause: 0,
      lure: null,
      back: null,
      ret: false,
      seeing: false,
      spd: spd * R.chaos,
      rm: 1
    });
    g.state = 'ball';
    g.planted = false;
    g.shiftSaid = false;
    g.otherGuards = ts.ruin.guards.map(mk);
    if (R.fled > 0)
      g.otherGuards.splice(
        Math.max(1, g.otherGuards.length - R.fled),
        Math.min(R.fled, g.otherGuards.length - 1)
      );
    g.baseGrid = g.grid.map((r) => r.slice());
    g.ruinVents = (ts.ruin.vents || []).map((v) => ({
      x: v[0],
      y: v[1],
      ph: (v[0] * 0.7 + v[1] * 1.3) % 4,
      on: false,
      warn: false
    }));
    g.baseRange = g.rangeMul;
    g.rangeMul = g.baseRange * 0.9;
    g.guests = ts.guests.map((s, k) => ({
      a: [s[0][0] * T + 16, s[0][1] * T + 16],
      b: [s[1][0] * T + 16, s[1][1] * T + 16],
      ph: k * 1.7,
      x: s[0][0] * T + 16,
      y: s[0][1] * T + 16,
      face: 0,
      c: ['#d9a441', '#6aa0d9', '#c06a9a', '#7fc08a'][k % 4]
    }));
  }
  g.stepT = 0;
  g.ambT = 0;
  g.flash = 0;
  g.flashT = 4;
  g.shake = 0;
  g.rain = Array.from({ length: 150 }, () => ({
    x: Math.random() * 900,
    y: Math.random() * 480,
    l: 8 + Math.random() * 10
  }));
  g.fog = Array.from({ length: 12 }, (_, k) => ({
    x: Math.random() * 900 - 50,
    y: 40 + k * 36,
    r: 90 + Math.random() * 80,
    v: 6 + Math.random() * 10
  }));
  g.waves = [];
  for (let k = 0; k < 90; k++) {
    const x = Math.random() * 800,
      y = Math.random() * 480;
    if (g.grid[(y / T) | 0][(x / T) | 0] !== '#') g.waves.push({ x, y, ph: Math.random() * 6 });
  }
  buildBg(g);
  return g;
}
function startBrief(i) {
  lvl = i;
  mode = 'brief';
  saveGame('brief');
}
function startPlay() {
  G = loadLevel(lvl);
  gatherLights();
  mode = 'play';
  say(G.flight ? 'Ashling' : 'Shiloh', G.d.opening);
}
