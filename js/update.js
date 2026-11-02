// Gameplay: guard behaviour, interactions, detection, bosses, the per-frame update.
'use strict';

/* ---------- update ---------- */
// What a guard says, by situation: 'lure' (noticed a noise), 'lost' (lost you), 'body'
// (found a fallen guard), 'hear' (heard footsteps), 'wake' (came round). Each mission has its
// own set in text.js, in its own house's voice.
function bark(g, kind) {
  if (g.boss || g.spin) return;
  const set = G.d.barks[kind];
  g.bark = { text: Array.isArray(set) ? set[(Math.random() * set.length) | 0] : set, kind, t: 1.8 };
}
function burst(x, y, n, k, sp, life) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283,
      v = sp * (0.3 + Math.random() * 0.7);
    G.parts.push({
      k,
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      t: life,
      t0: life,
      r: k === 'smoke' ? 7 : 1.5
    });
  }
}
function moveG(g, tx, ty, dt, spd) {
  const dx = tx - g.x,
    dy = ty - g.y,
    d = Math.hypot(dx, dy);
  if (d < 3) return true;
  g.face = Math.atan2(dy, dx);
  const st = Math.min(d, spd * dt),
    nx = g.x + (dx / d) * st,
    ny = g.y + (dy / d) * st;
  if (blocked(nx, ny, 8)) return true;
  g.x = nx;
  g.y = ny;
  return false;
}
function stepGuard(g, dt) {
  if (g.bark && (g.bark.t -= dt) <= 0) g.bark = null;
  if (g.grog > 0) g.grog -= dt;
  if (g.stun > 0) {
    g.stun -= dt;
    // waking up: groggy, looks around before resuming the patrol
    if (g.stun <= 0 && !g.dead) {
      g.pause = 1.6;
      g.scan = g.face;
      g.grog = 1.8;
      bark(g, 'wake');
    }
    return;
  }
  if (G.holdT && G.holdT.ref === g && G.hold > 0) return;
  if (g.seeing) return;
  if (g.spin) {
    g.face += g.spin * 0.7 * dt;
    return;
  }
  if (g.lure) {
    if (moveG(g, g.lure.x, g.lure.y, dt, g.spd * 1.3)) {
      g.lure.t -= dt;
      g.face += Math.sin(g.lure.t * 5) * dt * 1.5;
      if (g.lure.t <= 0) {
        g.lure = null;
        g.ret = true;
      }
    }
    return;
  }
  if (g.ret) {
    if (moveG(g, g.back.x, g.back.y, dt, g.spd)) g.ret = false;
    return;
  }
  if (g.pause > 0) {
    g.pause -= dt;
    if (g.scan != null) g.face = g.scan + Math.sin(g.pause * 4.5) * 0.6;
    return;
  }
  const w = g.wp[g.i];
  if (moveG(g, w[0], w[1], dt, g.spd)) {
    g.i = (g.i + 1) % g.wp.length;
    g.pause = 0.9;
    g.scan = g.face;
  }
}
function completeTarget(t) {
  if (t.kind === 'door') {
    t.ref.open = true;
    burst(t.ref.x * T + 16, t.ref.y * T + 16, 6, 'spark', 40, 0.4);
    return;
  }
  if (t.kind === 'guard') {
    const g = t.ref;
    g.stun = 10;
    g.found = false;
    g.seeing = false;
    g.wasSee = false;
    burst(g.x, g.y, 8, 'smoke', 30, 0.8);
    if (!G.koSaid) {
      G.koSaid = true;
      say('Shiloh', TEXT.lines.knockedOut);
    }
    return;
  }
  const it = t.ref;
  it.done = true;
  if (it.type === 'H') {
    G.host.on = true;
    G.host.x = it.x;
    G.host.y = it.y;
    say('Perrin', TEXT.lines.perrinFreed);
    sayLater(2.8, 'Ashling', TEXT.lines.perrinReply);
    sayLater(9, 'Perrin', TEXT.lines.perrinClue);
  } else if (it.type === 'C') {
    const left = G.items.filter((i) => i.type === 'C' && !i.done).length;
    G.rings.push({ x: it.x, y: it.y, t: 0.5, r: 50, c: '200,200,255' });
    burst(it.x, it.y - 10, 10, 'smoke', 18, 1.6);
    if (left === 4) say('Candlemaker', TEXT.lines.candleFirst);
    else say('Shiloh', left ? fill(TEXT.lines.candleLeft, { n: left }) : TEXT.lines.candleLast);
  } else if (it.type === 'L') {
    G.song = true;
    G.gad.flute = 999;
    G.rings.push({ x: G.shiloh.x, y: G.shiloh.y, t: 1, r: 120, c: '160,220,255' });
    say('Shiloh', TEXT.lines.songLearned);
  } else if (it.type === 'O' && G.d.song) {
    say('Shiloh', TEXT.lines.ledger);
  } else if (it.type === 'O') {
    if (lvl === 0) {
      G.ash.on = true;
      G.ash.x = G.shiloh.x + 14;
      G.ash.y = G.shiloh.y + 14;
      G.rings.push({ x: G.shiloh.x, y: G.shiloh.y, t: 1, r: 90, c: '255,140,60' });
      burst(it.x, it.y, 24, 'spark', 90, 0.8);
      burst(it.x, it.y, 8, 'smoke', 40, 1.2);
      say('Shiloh', TEXT.lines.eggCrate);
      sayLater(3.2, 'Ashling', TEXT.lines.hatch);
      sayLater(6.4, 'Tip', TEXT.lines.hatchTip);
    } else if (G.d.timeshift) {
      say('Shiloh', TEXT.lines.signet);
      sayLater(3.4, 'Shiloh', TEXT.lines.signetAfter);
    } else say('Shiloh', TEXT.lines.sealSwapped);
  } else if (it.type === 'P') {
    if (G.d.timeshift) {
      G.planted = true;
      say('Shiloh', TEXT.lines.treatyPlanted);
    } else if (G.flight) {
      const dropped = G.items.filter((i) => i.type === 'P' && i.done).length;
      say('Ashling', dropped === 1 ? TEXT.lines.letterFirst : TEXT.lines.letterSecond);
    } else say('Shiloh', TEXT.lines.cupPoisoned);
  }
}
// what E would act on right now: a lock, an objective, or an unaware guard's back
function findTarget(A) {
  let tgt = null,
    bd = 1e9;
  for (const k in G.doors) {
    const d = G.doors[k];
    if (d.open || d.sealed) continue;
    const dd = Math.hypot(d.x * T + 16 - A.x, d.y * T + 16 - A.y);
    if (dd < 44 && dd < bd) {
      bd = dd;
      tgt = { kind: 'door', ref: d, need: 0.9, x: d.x * T + 16, y: d.y * T + 16 };
    }
  }
  for (const it of G.items) {
    if (
      'OPLHC'.includes(it.type) &&
      !it.done &&
      (!G.d.timeshift ||
        (it.type === 'P' ? G.state === 'ball' : it.type === 'O' ? G.state === 'ruin' : true))
    ) {
      const dd = Math.hypot(it.x - A.x, it.y - A.y);
      if (dd < 34 && dd < bd) {
        bd = dd;
        tgt = {
          kind: 'item',
          ref: it,
          need: it.type === 'H' ? 1.6 : it.type === 'C' ? 0.8 : 1.2,
          x: it.x,
          y: it.y
        };
      }
    }
  }
  if (G.active === 'shiloh' && !G.flight)
    for (const g of G.guards) {
      if (g.boss || g.spin || g.stun > 0 || g.seeing || g.lure) continue;
      const dd = Math.hypot(g.x - A.x, g.y - A.y);
      if (dd < 30 && dd < bd && angDiff(Math.atan2(A.y - g.y, A.x - g.x), g.face) > 1.9) {
        bd = dd;
        tgt = { kind: 'guard', ref: g, need: 0.6, x: g.x, y: g.y };
      }
    }
  return tgt;
}
function gatherLights() {
  const L = [],
    add = (x, y, r, k, c, vis, fl, half) => L.push({ x, y, r, k, c, vis, fl, half });
  for (const t of G.torches) add(t.x, t.y, 112, 0.95, '255,150,70', true, t.ph + 1, true);
  for (const it of G.items) {
    if (it.type === 'B' && !it.done) add(it.x, it.y - 4, 100, 1, '255,120,40', true, it.x);
    else if (it.type === 'C' && !it.done) add(it.x, it.y - 8, 85, 0.9, '255,190,100', true, it.y);
    else if (it.type === 'g' && !it.done) add(it.x, it.y, 28, 0.55, '255,150,60', false);
    else if (it.type === 'L' && !it.done) add(it.x, it.y, 45, 0.6, '150,200,255', false);
    else if (it.type === 'O' && !it.done && lvl === 0)
      add(it.x, it.y, 44, 0.55, '255,170,90', false, 3);
  }
  for (const v of G.vents) {
    const vx = v.x * T + 16,
      vy = v.y * T + 16;
    if (v.on) add(vx, vy, 90, 1, '255,110,30', true, v.x);
    else if (v.warn) add(vx, vy, 40, 0.6, '255,90,20', false);
  }
  for (const pd of G.peds)
    add(pd.x, pd.y, 42, 0.5, G.state === 'ruin' ? '230,150,90' : '170,190,255', false);
  for (const k in G.doors) {
    const d = G.doors[k];
    if (d.sealed && !d.open) add(d.x * T + 16, d.y * T + 16, 40, 0.5, '180,140,255', false);
  }
  if (G.exitOpen) add(G.exit.x, G.exit.y, 64, 0.75, '120,255,160', false);
  for (const g of G.guards) {
    if (g.stun > 0 || g.boss) continue;
    if (g.spin) add(g.x, g.y, 48, 0.8, '255,230,150', false);
    else {
      const c = Math.cos(g.face),
        s = Math.sin(g.face);
      add(
        g.x + c * 4 + s * 10,
        g.y + s * 4 - c * 10,
        G.d.quiet ? 40 : 56,
        0.75,
        '255,200,110',
        false,
        g.x
      );
    }
  }
  const B = G.boss;
  if (B && B.kind === 'candle' && !B.dead) add(B.x, B.y, 52, 0.6, '255,170,80', false, 2);
  if (G.ash.on) {
    const fire = G.active === 'ash' && fireHeld();
    add(G.ash.x, G.ash.y, fire ? 115 : 46, fire ? 1 : 0.5, '255,130,50', fire, fire ? 5 : 0);
  }
  const A = G.active === 'shiloh' ? G.shiloh : G.ash;
  if (!A.hidden) add(A.x, A.y, 72, 0.45, null, false);
  G.lights = L;
}
// how lit a spot is, 0 (shadow) to 1 (torchlight); only lights that give you away count
function lightAt(x, y) {
  let l = 0;
  for (const s of G.lights) {
    if (!s.vis || (s.half && y < s.y - 6)) continue;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < s.r) l += (1 - d / s.r) * s.k;
  }
  return Math.min(1, l);
}
function anim(c) {
  if (!c) return;
  const d = Math.hypot(c.x - (c.lx ?? c.x), c.y - (c.ly ?? c.y));
  c.mv = d > 0.15 && d < 40;
  if (c.mv) c.walk = (c.walk || 0) + d;
  c.lx = c.x;
  c.ly = c.y;
}
function update(dt) {
  G.time += dt;
  stats.time += dt;
  G.candlesLit = G.items.filter((i) => i.type === 'C' && !i.done).length;
  const A = G.active === 'shiloh' ? G.shiloh : G.ash,
    pal = curPal(G);
  let mx0 = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  let my0 = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  const tv = touchMove(dt);
  let tsneak = false;
  if (tv) {
    mx0 = tv[0];
    my0 = tv[1];
    tsneak = !TOUCH.run;
  }
  G.sneak = G.active === 'shiloh' && (!!keys['shift'] || tsneak);
  if (mx0 || my0) {
    const l = Math.hypot(mx0, my0),
      mx = mx0 / l,
      my = my0 / l;
    A.face = Math.atan2(my, mx);
    const sp = G.active === 'shiloh' ? (G.sneak ? 48 : 92) : 135,
      r = G.active === 'shiloh' ? 8 : 10;
    const nx = A.x + mx * sp * dt;
    if (!blocked(nx, A.y, r)) A.x = nx;
    const ny = A.y + my * sp * dt;
    if (!blocked(A.x, ny, r)) A.y = ny;
  }
  // tether: the other one is pulled along if too far
  if (G.ash.on && !G.flight) {
    const O = G.active === 'shiloh' ? G.ash : G.shiloh;
    if (Math.hypot(O.x - A.x, O.y - A.y) > 7.5 * T) {
      G.rings.push({ x: O.x, y: O.y, t: 0.4, r: 30, c: '180,120,255' });
      O.x = A.x;
      O.y = A.y;
      G.rings.push({ x: O.x, y: O.y, t: 0.4, r: 30, c: '180,120,255' });
    }
  }
  const moving = !!(mx0 || my0);
  // hostage follows Shiloh
  if (G.host && G.host.on) {
    const h = G.host,
      w = G.shiloh,
      hd = Math.hypot(w.x - h.x, w.y - h.y);
    if (hd > 6 * T) {
      h.x = w.x;
      h.y = w.y;
    } else if (hd > 30) {
      const nx = h.x + ((w.x - h.x) / hd) * 88 * dt,
        ny = h.y + ((w.y - h.y) / hd) * 88 * dt;
      h.face = Math.atan2(w.y - h.y, w.x - h.x);
      if (!blocked(nx, h.y, 8)) h.x = nx;
      if (!blocked(h.x, ny, 8)) h.y = ny;
    }
  }
  // masked guests drift through the ball (they block sight lines)
  if (G.guests && G.state === 'ball')
    for (const s of G.guests) {
      const q = (1 + Math.sin(G.time * 0.45 + s.ph)) / 2,
        ox = s.x,
        oy = s.y;
      s.x = s.a[0] + (s.b[0] - s.a[0]) * q;
      s.y = s.a[1] + (s.b[1] - s.a[1]) * q;
      if (Math.hypot(s.x - ox, s.y - oy) > 0.01) s.face = Math.atan2(s.y - oy, s.x - ox);
    }
  // forge vents: Shiloh burns, Ashling does not
  for (const v of G.vents) {
    const c = (G.time + v.ph) % 4;
    v.on = c < 1.4;
    v.warn = c > 3.3;
    const vx = v.x * T + 16,
      vy = v.y * T + 16;
    if (v.on && Math.random() < dt * 26)
      G.parts.push({
        k: 'fire',
        x: vx + (Math.random() - 0.5) * 14,
        y: vy + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 20,
        vy: -40 - Math.random() * 50,
        t: 0.55,
        t0: 0.55,
        r: 3 + Math.random() * 3
      });
    if (v.warn && Math.random() < dt * 10)
      G.parts.push({
        k: 'spark',
        x: vx,
        y: vy,
        vx: (Math.random() - 0.5) * 30,
        vy: -30 - Math.random() * 30,
        t: 0.6,
        t0: 0.6,
        r: 1
      });
    if (v.on && !G.flight && Math.hypot(G.shiloh.x - vx, G.shiloh.y - vy) < 17) {
      G.alert += 1.6 * dt;
      if (!G.ventSaid) {
        G.ventSaid = true;
        say('Ashling', TEXT.lines.vent);
      }
    }
  }
  // silence: noise draws nearby monks (not the deaf Bell-Warden)
  if (G.d.quiet && moving && !(G.active === 'shiloh' && G.sneak)) {
    G.noiseT -= dt;
    if (G.noiseT <= 0) {
      G.noiseT = 0.7;
      lureNear(A.x, A.y, (G.active === 'shiloh' ? 4 : 5) * T, true);
      G.rings.push({ x: A.x, y: A.y, t: 0.35, r: 30, c: '150,100,200' });
    }
  }
  // footsteps: running (or a stomping dragon) turns heads close by
  if (!G.d.quiet && !G.flight && moving && !(G.active === 'shiloh' && G.sneak)) {
    G.stepT -= dt;
    if (G.stepT <= 0) {
      G.stepT = 0.45;
      const r = (G.active === 'shiloh' ? 1.8 : 2.4) * T;
      G.rings.push({ x: A.x, y: A.y, t: 0.3, r, c: '210,200,230', a: 0.22 });
      for (const g of G.guards) {
        if (g.stun > 0 || g.seeing || g.lure || g.ret || g.spin || (g.boss && g.kind !== 'candle'))
          continue;
        const ang = Math.atan2(A.y - g.y, A.x - g.x);
        if (Math.hypot(g.x - A.x, g.y - A.y) < r && angDiff(ang, g.face) > 0.62) {
          g.face = ang;
          g.scan = null;
          g.pause = Math.max(g.pause, 0.9);
          bark(g, 'hear');
          if (!G.stepSaid && G.active === 'shiloh') {
            G.stepSaid = true;
            say('Ashling', TEXT.lines.sneakHint);
          }
        }
      }
    }
  }
  // hold-to-interact
  G.near = G.active === 'shiloh' || G.flight ? findTarget(A) : null;
  if ((keys['e'] || TOUCH.hold) && G.near) {
    const tgt = G.near;
    if (G.holdT && G.holdT.ref === tgt.ref) G.hold += dt;
    else {
      G.hold = 0;
      G.holdT = tgt;
    }
    if (G.hold >= tgt.need) {
      completeTarget(tgt);
      G.hold = 0;
      G.holdT = null;
    }
  } else {
    G.hold = 0;
    G.holdT = null;
  }
  // gems
  for (const it of G.items) {
    if (it.type !== 'g' || it.done) continue;
    for (const c of [G.flight ? null : G.shiloh, G.ash.on ? G.ash : null]) {
      if (c && Math.hypot(it.x - c.x, it.y - c.y) < 16) {
        it.done = true;
        G.gems++;
        G.joyT = 0.9;
        stats.byLvl[lvl] = Math.max(stats.byLvl[lvl] || 0, G.gems);
        stats.gems = stats.byLvl.reduce((a, b) => a + (b || 0), 0);
        G.rings.push({ x: it.x, y: it.y, t: 0.5, r: 36, c: '255,154,60' });
        burst(it.x, it.y, 12, 'spark', 80, 0.6);
        break;
      }
    }
  }
  // dragon fire
  const firing = G.active === 'ash' && fireHeld();
  if (firing) {
    const a = G.ash,
      range = 62 + Math.min(stats.gems, 12) * 8;
    for (let i = 0; i < 3; i++) {
      const sp = (Math.random() - 0.5) * 0.65,
        v = range * (3.6 + Math.random() * 1.6);
      G.parts.push({
        k: 'fire',
        x: a.x + Math.cos(a.face) * 10,
        y: a.y + Math.sin(a.face) * 10,
        vx: Math.cos(a.face + sp) * v,
        vy: Math.sin(a.face + sp) * v,
        t: 0.32,
        t0: 0.32,
        r: 3 + Math.random() * 3,
        drag: 1
      });
    }
    if (Math.random() < dt * 20)
      G.parts.push({
        k: 'spark',
        x: a.x,
        y: a.y,
        vx: Math.cos(a.face) * range * 2 + (Math.random() - 0.5) * 60,
        vy: Math.sin(a.face) * range * 2 + (Math.random() - 0.5) * 60,
        t: 0.5,
        t0: 0.5,
        r: 1
      });
    const inCone = (x, y) => {
      const dx = x - a.x,
        dy = y - a.y;
      return (
        Math.hypot(dx, dy) < range &&
        angDiff(Math.atan2(dy, dx), a.face) < 0.6 &&
        los(a.x, a.y, x, y)
      );
    };
    for (const g of G.guards) {
      if (g.stun > 0 || !inCone(g.x, g.y)) continue;
      if (g.boss) {
        if (g.kind === 'candle' && G.candlesLit > 0) {
          g.hurt = 0.1;
          if (!G.shieldSaid) {
            G.shieldSaid = true;
            say('Ashling', TEXT.lines.shield);
          }
        } else if (angDiff(Math.atan2(a.y - g.y, a.x - g.x), g.face) > 1.3) {
          g.hp -= 22 * dt;
          g.hurt = 0.15;
          if (g.hp <= 0) {
            g.hp = 0;
            g.dead = true;
            g.stun = 1e9;
            G.shake = 0.4;
            burst(g.x, g.y, 30, 'spark', 120, 1);
            if (g.kind === 'candle') {
              TEXT.lines.dying.forEach((line, k) => {
                if (k === 0) say('Candlemaker', line);
                else sayLater(k * 2.6, 'Candlemaker', line);
              });
            } else say('Ashling', TEXT.lines.wardenDown);
          }
        } else G.alert = Math.min(0.95, G.alert + 0.5 * dt);
      } else {
        g.stun = 5;
        g.found = false;
        G.alert = Math.min(0.95, G.alert + 0.15);
        burst(g.x, g.y, 6, 'smoke', 25, 1);
      }
    }
    for (const it of G.items) {
      if (it.type === 'B' && !it.done && inCone(it.x, it.y)) {
        it.p += dt;
        if (it.p >= 1) {
          it.done = true;
          burst(it.x, it.y - 6, 20, 'spark', 90, 0.8);
          const burned = G.items.filter((i) => i.type === 'B' && i.done).length;
          say('Ashling', TEXT.lines.beacon[lvl < 2 ? lvl : 2 + (burned % 2)]);
        }
      }
    }
    if (!G.fireSaid) {
      G.fireSaid = true;
      say('Ashling', TEXT.lines.firstFire);
    }
  } else
    for (const it of G.items) if (it.type === 'B' && !it.done) it.p = Math.max(0, it.p - dt * 0.5);
  // living fire: beacons, torches, and the weather
  for (const it of G.items)
    if (it.type === 'B') {
      if (!it.done) {
        if (Math.random() < dt * 16)
          G.parts.push({
            k: 'fire',
            x: it.x + (Math.random() - 0.5) * 10,
            y: it.y - 6,
            vx: (Math.random() - 0.5) * 12,
            vy: -30 - Math.random() * 30,
            t: 0.5,
            t0: 0.5,
            r: 3 + Math.random() * 2
          });
        if (Math.random() < dt * 3)
          G.parts.push({
            k: 'spark',
            x: it.x,
            y: it.y - 8,
            vx: (Math.random() - 0.5) * 30,
            vy: -50 - Math.random() * 40,
            t: 1,
            t0: 1,
            r: 1
          });
      } else if (Math.random() < dt * 4)
        G.parts.push({
          k: 'smoke',
          x: it.x,
          y: it.y - 4,
          vx: (Math.random() - 0.5) * 6,
          vy: -14,
          t: 2.2,
          t0: 2.2,
          r: 5
        });
    }
  for (const t of G.torches)
    if (Math.random() < dt * 0.35)
      G.parts.push({
        k: 'spark',
        x: t.x,
        y: t.y - 6,
        vx: (Math.random() - 0.5) * 14,
        vy: -25 - Math.random() * 20,
        t: 0.9,
        t0: 0.9,
        r: 1
      });
  G.ambT -= dt;
  while (G.ambT <= 0) {
    const wx = pal.weather;
    G.ambT += wx === 'ash' ? 0.15 : 0.09;
    if (wx === 'embers')
      G.parts.push({
        k: 'ember',
        x: Math.random() * 800,
        y: 485,
        vx: 0,
        vy: -(15 + Math.random() * 25),
        t: 9,
        t0: 9,
        r: 1 + Math.random()
      });
    else if (wx === 'dust')
      G.parts.push({
        k: 'dust',
        x: Math.random() * 800,
        y: Math.random() * 480,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 4,
        t: 5,
        t0: 5,
        r: 1
      });
    else if (wx === 'ash')
      G.parts.push({
        k: 'ash',
        x: Math.random() * 900 - 100,
        y: -5,
        vx: 10 + Math.random() * 8,
        vy: 16 + Math.random() * 10,
        t: 28,
        t0: 28,
        r: 1.3
      });
  }
  if (pal.weather === 'rain') {
    G.flashT -= dt;
    if (G.flashT <= 0) {
      G.flashT = 6 + Math.random() * 8;
      G.flash = 0.35;
      G.shake = Math.max(G.shake, 0.12);
    }
  }
  if (G.flash > 0) G.flash -= dt;
  // detection: light and shadow change how far a guard can see you
  gatherLights();
  let best = 0;
  const targets = G.flight ? [] : [G.shiloh];
  if (G.ash.on) targets.push(G.ash);
  if (G.host && G.host.on) targets.push(G.host);
  for (const g of G.guards) {
    g.seeing = false;
    if (g.stun > 0) continue;
    for (const t of targets) {
      const isActive = t.host ? true : (t === G.shiloh) === (G.active === 'shiloh');
      let mul = (t === G.ash ? 1.45 : 1) * (isActive ? 1 : 0.6) * G.rangeMul;
      if (t === G.shiloh && G.sneak) mul *= 0.6;
      if (!G.flight) mul *= 0.82 + 0.4 * lightAt(t.x, t.y);
      const range = 5.2 * T * mul * (g.rm || 1),
        dx = t.x - g.x,
        dy = t.y - g.y,
        dist = Math.hypot(dx, dy);
      if (
        dist < range &&
        ((dist < T * 0.9 && !(t === G.shiloh && G.sneak)) ||
          angDiff(Math.atan2(dy, dx), g.face) < 0.62) &&
        los(g.x, g.y, t.x, t.y)
      ) {
        g.seeing = true;
        g.face = Math.atan2(dy, dx);
        g.saw = { x: t.x, y: t.y };
        best = Math.max(best, 0.45 + (1 - dist / range) * 1.1);
      }
    }
  }
  if (best > 0) G.alert += best * dt * G.gain;
  else G.alert -= dt * 0.22 * G.decay;
  G.alert = Math.max(0, G.alert);
  // a guard who loses sight of you goes to look where you were
  for (const g of G.guards) {
    if (g.wasSee && !g.seeing && g.stun <= 0 && !g.spin && g.saw) {
      if (!g.lure && !g.ret) g.back = { x: g.x, y: g.y };
      g.lure = { x: g.saw.x, y: g.saw.y, t: 2.4 };
      g.ret = false;
      bark(g, 'lost');
    }
    g.wasSee = g.seeing;
  }
  // a guard who spots a fallen comrade raises suspicion and goes to check
  for (const b of G.guards) {
    if (b.stun <= 0 || b.found || b.boss || b.spin) continue;
    for (const g of G.guards) {
      if (g === b || g.stun > 0 || g.spin || g.boss) continue;
      const dx = b.x - g.x,
        dy = b.y - g.y,
        dd = Math.hypot(dx, dy);
      if (
        dd < 4.2 * T * G.rangeMul &&
        angDiff(Math.atan2(dy, dx), g.face) < 0.62 &&
        los(g.x, g.y, b.x, b.y)
      ) {
        b.found = true;
        G.alert = Math.min(0.95, G.alert + 0.22 * G.gain);
        if (!g.lure && !g.ret) g.back = { x: g.x, y: g.y };
        g.lure = { x: b.x, y: b.y, t: 2.5 };
        g.ret = false;
        bark(g, 'body');
        if (!G.bodySaid) {
          G.bodySaid = true;
          say('Shiloh', TEXT.lines.bodyFound);
        }
        break;
      }
    }
  }
  for (const g of G.guards) stepGuard(g, dt);
  // Bell-Warden: the bell tolls; whoever you control must stand still when it lands
  const B = G.boss;
  if (B) {
    if (B.hurt > 0) B.hurt -= dt;
    if (B.kind === 'candle' && !B.dead) {
      // the Candlemaker is always one step ahead: he marks a spot near you, then blinks there
      B.blinkT -= dt;
      if (B.blink) {
        B.blink.t -= dt;
        if (B.blink.t <= 0) {
          const q = B.blink;
          burst(B.x, B.y, 14, 'smoke', 50, 0.9);
          B.x = q.x;
          B.y = q.y;
          B.face = Math.atan2(A.y - B.y, A.x - B.x);
          B.lure = null;
          B.ret = false;
          B.pause = 0.8;
          B.blink = null;
          G.rings.push({ x: q.x, y: q.y, t: 0.6, r: 70, c: '255,120,60' });
          burst(q.x, q.y, 16, 'spark', 90, 0.6);
          G.shake = Math.max(G.shake, 0.15);
          if (Math.hypot(A.x - q.x, A.y - q.y) < 2.2 * T) {
            G.alert += 0.45;
            say('Candlemaker', TEXT.lines.blinkTaunt);
          }
        }
      } else if (B.blinkT <= 0) {
        B.blinkT = 8;
        for (let n = 0; n < 40; n++) {
          const ang = Math.random() * 6.283,
            rr = (1.6 + Math.random() * 1.4) * T,
            x = A.x + Math.cos(ang) * rr,
            y = A.y + Math.sin(ang) * rr;
          if (!blocked(x, y, 12)) {
            B.blink = { x, y, t: 1.3 };
            G.rings.push({ x, y, t: 1.3, r: 40, c: '255,120,60' });
            break;
          }
        }
      }
    }
    if (!B.dead && B.kind !== 'candle') {
      B.tollT -= dt;
      if (B.tollT <= 0 && B.toll <= 0) {
        B.tollT = 6;
        B.toll = 0.9;
        G.rings.push({ x: B.x, y: B.y, t: 0.9, r: 7 * T, c: '255,200,80' });
        if (!G.tollSaid) {
          G.tollSaid = true;
          say('Ashling', TEXT.lines.tollWarning);
        }
      }
      if (B.toll > 0) {
        B.toll -= dt;
        if (B.toll <= 0) {
          G.shake = Math.max(G.shake, 0.2);
          if (moving && Math.hypot(A.x - B.x, A.y - B.y) < 7 * T) {
            G.alert += 0.3;
            say('Shiloh', TEXT.lines.tollHeard);
          }
        }
      }
    }
  }
  // timers and particles
  G.smoke = G.smoke.filter((s) => (s.t -= dt) > 0);
  G.rings = G.rings.filter((r) => (r.t -= dt) > 0);
  for (const q of G.parts) {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.t -= dt;
    if (q.drag) {
      q.vx *= 1 - 3 * dt;
      q.vy *= 1 - 3 * dt;
      if (!G.flight && solidTile(Math.floor(q.x / T), Math.floor(q.y / T))) {
        q.vx = q.vy = 0;
        q.t = Math.min(q.t, 0.08);
      }
    } else if (q.k === 'ember' || q.k === 'ash' || q.k === 'dust')
      q.vx += Math.sin(G.time * 1.7 + q.t0 * 7 + q.y * 0.02) * 8 * dt;
    else if (q.k === 'smoke') {
      q.vx *= 1 - 1.5 * dt;
      q.vy *= 1 - 1.5 * dt;
    }
  }
  G.parts = G.parts.filter((q) => q.t > 0);
  if (G.parts.length > 700) G.parts.splice(0, G.parts.length - 700);
  if (G.msgT > 0) G.msgT -= dt;
  if (G.joyT > 0) G.joyT -= dt;
  for (const q of G.sayQ) q.t -= dt;
  const due = G.sayQ.filter((q) => q.t <= 0);
  G.sayQ = G.sayQ.filter((q) => q.t > 0);
  for (const q of due) say(q.who, q.text);
  // exit
  const req = G.items.filter((i) => 'OPBLHC'.includes(i.type));
  G.exitOpen = req.every((i) => i.done) && (!G.boss || G.boss.dead);
  if (G.exitOpen && !G.doneSaid) {
    G.doneSaid = true;
    sayLater(
      3.6,
      G.flight ? 'Ashling' : 'Shiloh',
      G.flight ? TEXT.lines.flightDone : TEXT.lines.groundDone
    );
  }
  const ex = G.flight ? G.ash : G.shiloh;
  if (
    G.exitOpen &&
    (G.flight || G.active === 'shiloh') &&
    Math.hypot(ex.x - G.exit.x, ex.y - G.exit.y) < 20 &&
    (!G.host || Math.hypot(G.host.x - G.exit.x, G.host.y - G.exit.y) < 90)
  ) {
    if (G.d.choice || G.d.finale) mode = 'choice';
    else finishLevel();
  }
  anim(G.shiloh);
  anim(G.ash);
  anim(G.host);
  for (const g of G.guards) anim(g);
  if (G.guests) for (const s of G.guests) anim(s);
  SND.watch(dt);
  if (G.alert >= 1) {
    mode = 'lose';
    G.caughtPick = (Math.random() * TEXT.caught.length) | 0;
    stats.caught++;
    G.shake = 0.5;
  }
}
