// Touch and keyboard input, and the gadgets (smoke, bell, flute).
'use strict';

/* ---------- touch: drag anywhere to walk, no on-screen controls ---------- */
const TOUCH = {
  capable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  used: false,
  mover: null,
  fire: false,
  hold: false,
  stillT: 0,
  run: false,
  ptr: new Map()
};
const HOT = [],
  DEAD = 7,
  SNEAK_R = 36,
  MAXR = 66;
document
  .getElementById('turnok')
  .addEventListener('click', () => document.getElementById('turn').classList.add('off'));
function gpos(e) {
  const r = cv.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * 800, y: ((e.clientY - r.top) / r.height) * 480 };
}
// menu taps: the same lines the keyboard numbers pick
function menuTap(g) {
  // the small case-file link in the lower left of the briefing and the Back Stairs
  if ((mode === 'brief' || mode === 'court') && g.x < 190 && g.y > 428) {
    sfx('ui');
    openCase();
    return;
  }
  if (mode === 'title') {
    if (UI.newGameBand && g.y > UI.newGameBand[0] && g.y < UI.newGameBand[1]) {
      sfx('ui');
      newGame();
    } else if (g.y > UI.diffBand[0] && g.y < UI.diffBand[1]) {
      diff = (diff + 1) % 3;
      sfx('ui');
    } else press('enter');
  } else if (mode === 'court' || mode === 'choice' || mode === 'pause') {
    for (let n = 1; n <= (mode === 'pause' ? 4 : 3); n++) {
      const ly = 154 + (n + 1) * 25.5;
      if (Math.abs(g.y - ly) < 17) {
        press(String(n));
        return;
      }
    }
  } else press('enter');
}
cv.addEventListener(
  'pointerdown',
  (e) => {
    e.preventDefault();
    const g = gpos(e);
    SND.unlock();
    if (g.y < 34 && g.x > 766) {
      SND.cycle();
      return;
    }
    if (g.y < 34 && g.x > 734 && mode === 'play') {
      pauseGame();
      return;
    }
    if (e.pointerType === 'mouse' && mode === 'play') return;
    TOUCH.used = e.pointerType !== 'mouse' || TOUCH.used;
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (_) {}
    if (mode !== 'play') {
      TOUCH.ptr.set(e.pointerId, { role: 'menu' });
      menuTap(g);
      return;
    }
    const rec = { x: g.x, y: g.y, ax: g.x, ay: g.y, t0: performance.now(), moved: 0 };
    TOUCH.ptr.set(e.pointerId, rec);
    if (g.y > 448 || g.y < 28) {
      rec.role = 'hud';
      if (g.y > 448)
        for (const h of HOT)
          if (g.x >= h.x && g.x <= h.x + h.w) {
            playPress(h.key);
            break;
          }
      return;
    }
    if (!TOUCH.mover) {
      rec.role = 'move';
      TOUCH.mover = rec;
      TOUCH.stillT = 0;
    } else if (G.active === 'ash') {
      rec.role = 'fire';
      TOUCH.fire = true;
    } else rec.role = 'tap';
  },
  { passive: false }
);
cv.addEventListener(
  'pointermove',
  (e) => {
    const r = TOUCH.ptr.get(e.pointerId);
    if (!r || r.role === 'menu' || r.role === 'hud') return;
    e.preventDefault();
    const g = gpos(e);
    r.moved += Math.hypot(g.x - r.x, g.y - r.y);
    r.x = g.x;
    r.y = g.y;
    if (r.role === 'move') {
      const dx = r.x - r.ax,
        dy = r.y - r.ay,
        d = Math.hypot(dx, dy);
      if (d > MAXR) {
        r.ax = r.x - (dx / d) * MAXR;
        r.ay = r.y - (dy / d) * MAXR;
      } // the anchor follows, so the thumb never runs out of room
    }
  },
  { passive: false }
);
function touchEnd(e) {
  const r = TOUCH.ptr.get(e.pointerId);
  if (!r) return;
  TOUCH.ptr.delete(e.pointerId);
  if (r.role === 'move') {
    TOUCH.mover = null;
    TOUCH.hold = false;
    TOUCH.stillT = 0;
  } else if (r.role === 'fire') TOUCH.fire = false;
  else if (
    r.role === 'tap' &&
    mode === 'play' &&
    performance.now() - r.t0 < 300 &&
    r.moved < 14 &&
    G.ash.on &&
    !G.flight
  )
    playPress('tab');
}
cv.addEventListener('pointerup', touchEnd);
cv.addEventListener('pointercancel', touchEnd);
addEventListener('blur', () => {
  TOUCH.ptr.clear();
  TOUCH.mover = null;
  TOUCH.fire = false;
  TOUCH.hold = false;
});
// the walking vector: returns [x,y] unit-ish and whether it is a slow sneak
function touchMove(dt) {
  const t = TOUCH.mover;
  if (!t) {
    TOUCH.hold = false;
    return null;
  }
  const dx = t.x - t.ax,
    dy = t.y - t.ay,
    d = Math.hypot(dx, dy);
  if (d < DEAD) {
    TOUCH.stillT += dt;
    TOUCH.hold = TOUCH.stillT > 0.18;
    return null;
  }
  TOUCH.stillT = 0;
  TOUCH.hold = false;
  TOUCH.run = d > SNEAK_R;
  return [dx / d, dy / d];
}
function fireHeld() {
  return !!(keys[' '] || TOUCH.fire);
}
function drawTouch() {
  const t = TOUCH.mover;
  if (t) {
    const d = Math.hypot(t.x - t.ax, t.y - t.ay);
    ctx.save();
    ctx.fillStyle = 'rgba(240,208,120,.07)';
    ctx.beginPath();
    ctx.arc(t.ax, t.ay, MAXR, 0, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,208,120,.28)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.arc(t.ax, t.ay, SNEAK_R, 0, 7);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(240,208,120,.18)';
    ctx.beginPath();
    ctx.arc(t.ax, t.ay, MAXR, 0, 7);
    ctx.stroke();
    const run = d > SNEAK_R,
      col = d < DEAD ? '255,255,255' : run ? '255,170,70' : '170,200,255';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(glow(col), t.x - 18, t.y - 18, 36, 36);
    ctx.restore();
    if (TOUCH.hold && G.near) {
      ctx.strokeStyle = 'rgba(240,208,120,.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.ax, t.ay, 13, 0, 7);
      ctx.stroke();
    }
  }
  for (const r of TOUCH.ptr.values())
    if (r.role === 'fire') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6;
      ctx.drawImage(glow('255,140,50'), r.x - 22, r.y - 22, 44, 44);
      ctx.restore();
    }
}

/* ---------- input ---------- */
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k))
    e.preventDefault();
  SND.unlock();
  if (k === 'm' && !e.repeat) {
    SND.cycle();
    return;
  }
  if (!e.repeat) press(k);
  keys[k] = true;
});
addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
});

function press(k) {
  if (mode !== 'play' && (k === 'enter' || k === '1' || k === '2' || k === '3' || k === '4'))
    sfx('ui');
  if (mode === 'title' && ['1', '2', '3'].includes(k)) diff = +k - 1;
  else if (mode === 'title' && k === 'n') newGame();
  else if (mode === 'title' && k === 'enter') {
    if (SAVED) continueGame(SAVED);
    else newGame();
  } else if (mode === 'choice' && G.d.finale && ['1', '2', '3'].includes(k)) {
    if (k === '3' && stats.gems < BREAK_GEMS) return;
    G.choice = ['puppet', 'burn', 'break'][+k - 1];
    finishLevel();
  } else if (mode === 'choice' && !G.d.finale && (k === '1' || k === '2')) {
    G.choice = k === '1' ? 'return' : 'leverage';
    finishLevel();
  } else if (mode === 'brief' && k === 'enter') startPlay();
  else if (mode === 'brief' && k === 'c') openCase();
  else if (mode === 'lose' && k === 'enter') startPlay();
  else if (mode === 'win' && k === 'enter') {
    if (lvl + 1 < LEVELS.length) mode = 'court';
    else mode = 'end';
  } else if (mode === 'court' && ['1', '2', '3'].includes(k)) {
    perks[lvl + 1] = +k - 1;
    startBrief(lvl + 1);
  } else if (mode === 'court' && k === 'c') openCase();
  else if (mode === 'pause') {
    if (k === '1' || k === 'enter' || k === 'escape' || k === 'p') mode = 'play';
    else if (k === '2' || k === 'c') openCase();
    else if (k === '3') startPlay();
    else if (k === '4') mode = 'title';
  } else if (mode === 'casefile') {
    if (k === 'enter' || k === 'arrowright' || k === ' ') {
      casePage++;
      if (casePage >= CASE_PAGES) closeCase();
    } else if (k === 'escape' || k === 'c') closeCase();
    else if (k === 'arrowleft' && casePage > 0) casePage--;
  } else if (mode === 'end' && k === 'enter') mode = 'title';
  else if (mode === 'play') playPress(k);
}
// Pausing drops anything held, so a finger lifted during the pause cannot leave you walking.
function pauseGame() {
  if (mode !== 'play') return;
  TOUCH.ptr.clear();
  TOUCH.mover = null;
  TOUCH.fire = false;
  TOUCH.hold = false;
  mode = 'pause';
  sfx('ui');
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});
function playPress(k) {
  if (k === 'p' || k === 'escape') pauseGame();
  else if (k === 'tab' && G.ash.on && !G.flight) {
    G.active = G.active === 'shiloh' ? 'ash' : 'shiloh';
    const a = G.active === 'shiloh' ? G.shiloh : G.ash;
    G.rings.push({ x: a.x, y: a.y, t: 0.4, r: 40, c: '255,255,255' });
  } else if (k === 'q') useSmoke();
  else if (k === 'r') useBell();
  else if (k === 'f') useFlute();
}
function useSmoke() {
  if (G.active !== 'shiloh' || G.gad.smoke <= 0) return;
  G.gad.smoke--;
  G.smoke.push({
    x: G.shiloh.x,
    y: G.shiloh.y,
    r: 58,
    t: 6,
    puffs: Array.from({ length: 10 }, () => ({
      a: Math.random() * 6.283,
      d: Math.random() * 34,
      s: 20 + Math.random() * 16,
      v: (Math.random() - 0.5) * 0.6
    }))
  });
  burst(G.shiloh.x, G.shiloh.y, 14, 'smoke', 70, 1.4);
}
function lureNear(x, y, r, noise) {
  for (const g of G.guards) {
    if (g.stun > 0 || (noise && g.boss)) continue;
    if (Math.hypot(g.x - x, g.y - y) < r && los(g.x, g.y, x, y)) {
      if (!g.lure && !g.ret) {
        g.back = { x: g.x, y: g.y };
        bark(g, 'lure');
      }
      g.lure = { x, y, t: 3 };
      g.ret = false;
    }
  }
}
function useBell() {
  if (G.active !== 'shiloh' || G.gad.bell <= 0) return;
  G.gad.bell--;
  const w = G.shiloh,
    cx = Math.cos(w.face),
    cy = Math.sin(w.face);
  let x = w.x,
    y = w.y;
  for (let i = 0; i < 4 * T; i += 4) {
    const nx = w.x + cx * i,
      ny = w.y + cy * i;
    if (solidTile(Math.floor(nx / T), Math.floor(ny / T))) break;
    x = nx;
    y = ny;
  }
  G.rings.push({ x, y, t: 0.8, r: 100, c: '240,180,76' });
  lureNear(x, y, 9 * T);
}
function useFlute() {
  if (G.active !== 'shiloh') return;
  if (G.gad.flute <= 0) {
    if (G.d.song) say('Shiloh', TEXT.lines.noSong);
    return;
  }
  if (G.d.timeshift) {
    for (const p of G.peds)
      if (Math.hypot(p.x - G.shiloh.x, p.y - G.shiloh.y) < 46) {
        shiftTime();
        return;
      }
  }
  let best = null,
    bd = 3 * T;
  for (const k in G.doors) {
    const d = G.doors[k];
    if (d.open) continue;
    const dd = Math.hypot(d.x * T + 16 - G.shiloh.x, d.y * T + 16 - G.shiloh.y);
    if (dd < bd) {
      bd = dd;
      best = d;
    }
  }
  if (!best) {
    say('Shiloh', TEXT.lines.nothingToOpen);
    return;
  }
  G.gad.flute--;
  best.open = true;
  G.rings.push({ x: G.shiloh.x, y: G.shiloh.y, t: 1, r: 140, c: '160,220,255' });
  lureNear(G.shiloh.x, G.shiloh.y, 8 * T);
  say('Ashling', TEXT.lines.fluteLoud);
}
