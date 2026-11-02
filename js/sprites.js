// Character sprites and faces: Shiloh, Ashling, Perrin, guards, monks, bosses.
'use strict';

/* ---------- sprites ---------- */
function talking(who) {
  return !!(G.msgT > 0 && G.msg && G.msg.who === who);
}
function sleepZ(hx, hy, R) {
  ctx.fillStyle = 'rgba(244,236,255,.9)';
  ctx.font = 'bold 9px "IM Fell English",Georgia';
  ctx.fillText('z', hx + R + 1, hy - R + Math.sin(now * 2) * 1.5);
  ctx.font = 'bold 6px "IM Fell English",Georgia';
  ctx.fillText('z', hx + R + 6, hy - R - 4 + Math.sin(now * 2 + 1) * 1.5);
}
function shilohMood(w) {
  const al = G.alert;
  if (al > 0.8) return 'panic';
  if (al > 0.45) return 'worry';
  if (G.active !== 'shiloh') return 'sleep';
  if (G.holdT && G.hold > 0) return 'focus';
  if (G.joyT > 0) return 'joy';
  if (G.sneak) return 'sneak';
  return 'calm';
}
function shilohHead(w, hx, hy, mood, talk) {
  const R = 7.2,
    INKL = '#2a1608',
    ex = 2.9,
    ey = hy + 1.3,
    by = ey - 3.5,
    my = hy + 5.3;
  let lx = Math.cos(w.face) * 1.0,
    ly = Math.sin(w.face) * 0.7;
  if (mood === 'focus' && G.holdT) {
    const a = Math.atan2(G.holdT.y - w.y, G.holdT.x - w.x);
    lx = Math.cos(a) * 1.3;
    ly = Math.sin(a) * 1;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ell(hx, hy - 0.4, R + 1.9, R + 1.4, '#4a3878');
  ell(hx, hy + 0.9, R - 0.9, R - 1, '#e8c8a4');
  ell(hx, hy + 7.9, R - 2.3, 1.9, '#c0541c');
  ell(hx + 2.6, hy + 8.9, 1.6, 2.2, '#a8441a', 0.5);
  const gr = ctx.createLinearGradient(hx - R, hy - 9, hx + R * 0.6, hy - 2);
  gr.addColorStop(0, '#9a84d8');
  gr.addColorStop(1, '#4a3878');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.ellipse(hx, hy - 2.6, R + 1.7, R * 0.74, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5b4788';
  ctx.beginPath();
  ctx.moveTo(hx - 3.6, hy - 7.4);
  ctx.quadraticCurveTo(hx + 0.5, hy - 13.5, hx + 4.6, hy - 9.6);
  ctx.quadraticCurveTo(hx + 1.4, hy - 9.2, hx + 1, hy - 7.4);
  ctx.closePath();
  ctx.fill();
  ell(hx - 2.8, hy - 2.2, 2.7, 1.6, '#8a3a1c');
  ell(hx + 1.8, hy - 2.5, 3.3, 1.5, '#8a3a1c');
  ctx.fillStyle = 'rgba(150,80,50,.5)';
  for (const [fx, fy] of [
    [-4.3, 3],
    [-3.3, 3.9],
    [-4.9, 4],
    [4.3, 3],
    [3.3, 3.9],
    [4.9, 4]
  ]) {
    ctx.beginPath();
    ctx.arc(hx + fx, hy + fy, 0.55, 0, 7);
    ctx.fill();
  }
  ell(hx, hy + 3.2, 0.9, 0.8, '#d09a74');
  const wide = mood === 'worry' || mood === 'panic',
    ew = mood === 'panic' ? 2.6 : wide ? 2.3 : 2,
    eh =
      mood === 'panic' ? 3.2 : wide ? 2.8 : mood === 'sneak' ? 1.3 : mood === 'focus' ? 1.9 : 2.3;
  if (mood === 'sleep' || mood === 'joy') {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      if (mood === 'sleep') {
        ctx.moveTo(cx - 1.8, ey - 0.3);
        ctx.quadraticCurveTo(cx, ey + 1.8, cx + 1.8, ey - 0.3);
      } else {
        ctx.moveTo(cx - 1.8, ey + 0.6);
        ctx.quadraticCurveTo(cx, ey - 1.8, cx + 1.8, ey + 0.6);
      }
    }
    ctx.stroke();
  } else
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ell(cx, ey, ew, eh, '#fbf2e0');
      ell(
        cx + lx * 0.9,
        ey + ly * 0.7,
        wide ? (mood === 'panic' ? 0.7 : 0.85) : 1.05,
        wide ? 1.1 : mood === 'sneak' ? 0.8 : 1.2,
        '#241628'
      );
      ell(cx + lx * 0.9 - 0.35, ey + ly * 0.7 - 0.4, 0.35, 0.35, '#ffffff');
      if (mood === 'sneak') {
        ctx.strokeStyle = INKL;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - 2.1, ey - 0.5);
        ctx.lineTo(cx + 2.1, ey - 0.5);
        ctx.stroke();
      }
    }
  ctx.strokeStyle = '#5a2a14';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (wide) {
    ctx.moveTo(hx - ex - 2, by + 0.9);
    ctx.lineTo(hx - ex + 2, by - 1.2);
    ctx.moveTo(hx + ex + 2, by + 0.9);
    ctx.lineTo(hx + ex - 2, by - 1.2);
  } else if (mood === 'focus') {
    ctx.moveTo(hx - ex - 2, by - 0.8);
    ctx.lineTo(hx - ex + 2, by + 0.8);
    ctx.moveTo(hx + ex + 2, by - 0.8);
    ctx.lineTo(hx + ex - 2, by + 0.8);
  } else if (mood === 'sneak') {
    ctx.moveTo(hx - ex - 2, by + 0.8);
    ctx.lineTo(hx - ex + 2, by + 0.4);
    ctx.moveTo(hx + ex - 2, by + 0.4);
    ctx.lineTo(hx + ex + 2, by + 0.8);
  } else if (mood === 'sleep') {
    ctx.moveTo(hx - ex - 1.6, by + 1);
    ctx.lineTo(hx - ex + 1.6, by + 0.8);
    ctx.moveTo(hx + ex - 1.6, by + 0.8);
    ctx.lineTo(hx + ex + 1.6, by + 1);
  } else if (mood === 'joy') {
    ctx.moveTo(hx - ex - 2, by - 0.4);
    ctx.quadraticCurveTo(hx - ex, by - 2, hx - ex + 2, by - 0.4);
    ctx.moveTo(hx + ex - 2, by - 0.4);
    ctx.quadraticCurveTo(hx + ex, by - 2, hx + ex + 2, by - 0.4);
  } else {
    ctx.moveTo(hx - ex - 2, by);
    ctx.lineTo(hx - ex + 2, by - 0.9);
    ctx.moveTo(hx + ex - 2, by + 0.1);
    ctx.lineTo(hx + ex + 2, by + 0.1);
  }
  ctx.stroke();
  if (mood === 'panic') {
    ell(hx, my, 1.5, 2.1, '#3a0c14');
    ell(hx + R + 1.6, hy - 3.4, 1.2, 1.7, '#9ad4ff');
  } else if (talk) {
    ell(hx, my, 1.9, 0.8 + Math.abs(Math.sin(now * 14)) * 1.5, '#3a0c14');
  } else if (mood === 'joy') {
    ell(hx, my - 0.4, 2.6, 1.9, '#3a0c14');
    ell(hx, my + 0.4, 1.6, 0.9, '#e0607a');
  } else {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (mood === 'worry') {
      ctx.moveTo(hx - 2, my + 0.6);
      ctx.quadraticCurveTo(hx - 0.8, my - 0.6, hx, my + 0.2);
      ctx.quadraticCurveTo(hx + 0.8, my + 1, hx + 2, my - 0.2);
    } else if (mood === 'sneak') {
      ctx.moveTo(hx - 1.4, my);
      ctx.lineTo(hx + 1.4, my);
    } else if (mood === 'focus') {
      ctx.moveTo(hx - 1.6, my - 0.2);
      ctx.lineTo(hx + 1.2, my - 0.2);
    } else if (mood === 'sleep') {
      ctx.moveTo(hx - 1.8, my - 0.2);
      ctx.quadraticCurveTo(hx, my + 0.9, hx + 1.8, my - 0.2);
    } else {
      ctx.moveTo(hx - 1.9, my);
      ctx.quadraticCurveTo(hx + 0.4, my + 0.7, hx + 2.1, my - 0.9);
    }
    ctx.stroke();
    if (mood === 'focus') ell(hx + 1.5, my + 0.9, 1.1, 0.9, '#e0607a');
  }
  if (mood === 'sleep') sleepZ(hx, hy, R);
  ctx.lineCap = 'butt';
}
function drawShiloh(w) {
  const sn = G.sneak,
    st = w.mv ? Math.sin(w.walk * 0.3) : 0,
    curl = G.active !== 'shiloh';
  shadowAt(w.x, w.y, 9);
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.save();
  ctx.rotate(w.face);
  if (sn || curl) ctx.scale(0.88, 1.1);
  if (w.mv) {
    ell(3 + st * 4, -4, 3, 2, '#1a1322');
    ell(3 - st * 4, 4, 3, 2, '#1a1322');
  }
  ctx.fillStyle = sn ? '#33264d' : '#46346b';
  ctx.beginPath();
  ctx.moveTo(5, -7);
  ctx.quadraticCurveTo(-5, -11, -14, -4 + st * 2);
  ctx.lineTo(-16, st);
  ctx.lineTo(-14, 4 + st * 2);
  ctx.quadraticCurveTo(-5, 11, 5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -3);
  ctx.lineTo(-12, -2 + st);
  ctx.moveTo(-2, 3);
  ctx.lineTo(-12, 2 + st);
  ctx.stroke();
  ell(3, -6, 3.2, 2.6, '#5b4788');
  ell(3, 6, 3.2, 2.6, '#5b4788');
  ctx.fillStyle = '#7a5a32';
  ctx.fillRect(-6, 4, 6, 4);
  ctx.fillStyle = '#c0541c';
  ctx.beginPath();
  ctx.moveTo(-3, -2.5);
  ctx.quadraticCurveTo(
    -9,
    -5 + Math.sin(G.time * 9) * 1.5,
    -16,
    -3 + st * 2 + Math.sin(G.time * 7)
  );
  ctx.lineTo(-15, 1 + st * 2 + Math.sin(G.time * 7));
  ctx.quadraticCurveTo(-8, 3, -3, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(' + OUTLINE_RGB + ',.7)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ell(0, 0, 6.5, 6, '#6a55a0');
  ctx.restore();
  shilohHead(
    w,
    Math.cos(w.face) * 2.5,
    (sn ? -4.6 : -6.2) + Math.sin(w.face) * 1.6,
    shilohMood(w),
    talking('Shiloh')
  );
  ctx.restore();
}
function ashMood() {
  const al = G.alert;
  if (al > 0.45) return 'worry';
  if (G.active !== 'ash') return 'sleep';
  if (fireHeld()) return 'fire';
  if (G.joyT > 0) return 'joy';
  return 'smug';
}
function ashHead(a, hx, hy, mood, talk) {
  const Rx = 7.4,
    Ry = 6.6,
    INKL = '#2a1208',
    ex = 3.2,
    ey = hy - 1,
    flick = Math.sin(now * 3) * 0.4;
  const lx = Math.cos(a.face) * 0.9,
    ly = Math.sin(a.face) * 0.7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#b8501c';
    ctx.beginPath();
    ctx.moveTo(hx + sd * 5.4, hy - 3);
    ctx.lineTo(hx + sd * 11, hy - 5 + flick);
    ctx.lineTo(hx + sd * 8, hy - 0.8);
    ctx.lineTo(hx + sd * 10.4, hy + 1.6);
    ctx.lineTo(hx + sd * 6, hy + 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe0a8';
    ctx.beginPath();
    ctx.moveTo(hx + sd * 2.2, hy - 5);
    ctx.lineTo(hx + sd * 4.8, hy - 11.5);
    ctx.lineTo(hx + sd * 5.8, hy - 4.4);
    ctx.closePath();
    ctx.fill();
  }
  ell(hx, hy, Rx, Ry, '#ef7434');
  ell(hx, hy + 3.5, 4.7, 3.3, '#f79a5a');
  ell(hx - 1.7, hy + 3.3, 0.65, 0.5, '#7a2a10');
  ell(hx + 1.7, hy + 3.3, 0.65, 0.5, '#7a2a10');
  ctx.fillStyle = '#a8441a';
  for (const dx of [-2.4, 0, 2.4]) {
    diamond(hx + dx, hy - 5.8 - (dx ? 0 : 0.6), 1.1, 1.3);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,130,110,' + (mood === 'fire' ? 0.65 : 0.4) + ')';
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(hx + sd * 5.1, hy + 2.6, mood === 'fire' ? 2.3 : 1.8, 1.2, 0, 0, 7);
    ctx.fill();
  }
  const closed = mood === 'sleep' || mood === 'joy';
  if (closed) {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      if (mood === 'sleep') {
        ctx.moveTo(cx - 2.2, ey);
        ctx.quadraticCurveTo(cx, ey + 2, cx + 2.2, ey);
      } else {
        ctx.moveTo(cx - 2.2, ey + 0.8);
        ctx.quadraticCurveTo(cx, ey - 2.2, cx + 2.2, ey + 0.8);
      }
    }
    ctx.stroke();
  } else
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex,
        wide = mood === 'worry';
      ell(cx, ey, 2.7, 3.1, '#fff6dc');
      ell(cx + lx * 0.8, ey + ly * 0.6, wide ? 1.6 : 1.9, wide ? 2.1 : 2.4, '#e8a020');
      ell(cx + lx * 0.8, ey + ly * 0.6, wide ? 0.5 : 0.7, wide ? 1.7 : 1.9, '#2a1208');
      ell(cx + lx * 0.8 + 0.7, ey + ly * 0.6 - 0.9, 0.6, 0.6, '#ffffff');
      const lidH = mood === 'smug' ? 2.9 : mood === 'fire' ? 2.4 : 0;
      if (lidH) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, ey, 2.8, 3.2, 0, 0, 7);
        ctx.clip();
        ctx.fillStyle = '#ef7434';
        ctx.fillRect(cx - 4, ey - 4, 8, lidH + 0.6);
        ctx.restore();
        ctx.strokeStyle = INKL;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - 2.8, ey - 3.2 + lidH + 0.6);
        ctx.lineTo(cx + 2.8, ey - 3.2 + lidH + 0.6);
        ctx.stroke();
      }
    }
  ctx.strokeStyle = '#a8441a';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  const by = ey - 4.4;
  if (mood === 'worry') {
    ctx.moveTo(hx - ex - 2, by + 1);
    ctx.lineTo(hx - ex + 2, by - 1.2);
    ctx.moveTo(hx + ex + 2, by + 1);
    ctx.lineTo(hx + ex - 2, by - 1.2);
  } else if (mood === 'fire') {
    ctx.moveTo(hx - ex - 2, by - 1);
    ctx.lineTo(hx - ex + 2.4, by + 1.4);
    ctx.moveTo(hx + ex + 2, by - 1);
    ctx.lineTo(hx + ex - 2.4, by + 1.4);
  } else if (mood === 'smug') {
    ctx.moveTo(hx - ex - 2, by - 0.2);
    ctx.lineTo(hx - ex + 2, by - 1.8);
    ctx.moveTo(hx + ex - 2, by + 0.4);
    ctx.lineTo(hx + ex + 2, by + 0.4);
  } else if (mood === 'joy') {
    ctx.moveTo(hx - ex - 2, by);
    ctx.quadraticCurveTo(hx - ex, by - 2, hx - ex + 2, by);
    ctx.moveTo(hx + ex - 2, by);
    ctx.quadraticCurveTo(hx + ex, by - 2, hx + ex + 2, by);
  }
  ctx.stroke();
  const my = hy + 5.4;
  if (mood === 'fire') {
    ell(hx, my - 0.2, 3.3, 2.9, '#5a1408');
    ell(hx, my + 0.7, 2.1, 1.6, '#ffd27a');
    ell(hx, my + 0.9, 1, 0.8, '#ffffff');
  } else if (talk) {
    ell(hx, my, 2.3, 0.8 + Math.abs(Math.sin(now * 14)) * 1.8, '#5a1408');
  } else if (mood === 'joy') {
    ell(hx, my - 0.3, 3, 2.2, '#5a1408');
    ctx.fillStyle = '#fff6dc';
    ctx.beginPath();
    ctx.moveTo(hx + 1, my - 2);
    ctx.lineTo(hx + 2.2, my - 2);
    ctx.lineTo(hx + 1.6, my - 0.6);
    ctx.fill();
    star(hx + Rx + 3, hy - 5, 2.3);
  } else if (mood === 'worry') {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 2.2, my + 0.7);
    ctx.quadraticCurveTo(hx - 1, my - 0.5, hx, my + 0.2);
    ctx.quadraticCurveTo(hx + 1, my + 1, hx + 2.2, my - 0.1);
    ctx.stroke();
    ell(hx + Rx + 1.6, hy - 3.4, 1.2, 1.7, '#9ad4ff');
  } else {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (mood === 'sleep') {
      ctx.moveTo(hx - 2, my - 0.1);
      ctx.quadraticCurveTo(hx, my + 0.9, hx + 2, my - 0.1);
    } else {
      ctx.moveTo(hx - 2.4, my + 0.4);
      ctx.quadraticCurveTo(hx, my + 1, hx + 2.6, my - 0.8);
    }
    ctx.stroke();
    if (mood === 'smug') {
      ctx.fillStyle = '#fff6dc';
      ctx.beginPath();
      ctx.moveTo(hx + 1, my - 0.2);
      ctx.lineTo(hx + 2.3, my - 0.8);
      ctx.lineTo(hx + 1.8, my + 1.2);
      ctx.closePath();
      ctx.fill();
    }
    if (mood === 'sleep') {
      ctx.fillStyle = 'rgba(205,195,220,' + (0.55 - ((now * 5) % 5) / 12) + ')';
      ctx.beginPath();
      ctx.arc(
        hx + 2.4 + Math.sin(now * 2) * 1.2,
        hy + 3 - ((now * 5) % 5) * 1.2,
        1.1 + ((now * 5) % 5) * 0.35,
        0,
        7
      );
      ctx.fill();
    }
  }
  if (mood === 'sleep') sleepZ(hx, hy, Rx);
  ctx.lineCap = 'butt';
}
function drawAsh(a) {
  const fl = G.flight,
    t = G.time,
    flap = Math.sin(t * (fl ? 9 : a.mv ? 14 : 3)) * (fl ? 1 : a.mv ? 0.7 : 0.25);
  const sc = (fl ? 1.3 : 1) * (1 + Math.min(stats.gems, 30) * 0.012);
  shadowAt(a.x + (fl ? 10 : 0), a.y + (fl ? 14 : 0), (fl ? 13 : 10) * sc, fl ? 0.22 : 0.35);
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.scale(sc, sc);
  ctx.save();
  ctx.rotate(a.face);
  const sw = Math.sin(t * 5) * 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#a8441a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.quadraticCurveTo(-14, sw, -21, -sw * 0.6);
  ctx.stroke();
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-21, -sw * 0.6);
  ctx.lineTo(-25, -sw * 0.9);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#ffb069';
  diamond(-26, -sw * 0.95, 2.6, 2.6);
  ctx.fill();
  for (const s of [-1, 1]) {
    const tipY = s * (13 + flap * 5),
      tipX = -3 + flap * 2;
    ctx.fillStyle = 'rgba(176,64,24,.95)';
    ctx.beginPath();
    ctx.moveTo(3, s * 4);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(-7, s * (10 + flap * 3));
    ctx.lineTo(-11, s * (8 + flap * 2));
    ctx.lineTo(-7, s * 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff9a50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, s * 4);
    ctx.lineTo(tipX, tipY);
    ctx.moveTo(-1, s * 5);
    ctx.lineTo(-7, s * (10 + flap * 3));
    ctx.stroke();
  }
  ell(-1, 0, 9, 6.5, '#e2642a');
  ell(0, 0, 6, 3.4, '#ffb069');
  ctx.fillStyle = '#a8441a';
  for (let k = -5; k < 4; k += 3) {
    diamond(k, -5.4, 1.2, 1.4);
    ctx.fill();
  }
  ell(5.5, 0, 4.4, 3.8, '#ef7434');
  ctx.restore();
  ashHead(a, Math.cos(a.face) * 4.5, -5.5 + Math.sin(a.face) * 3, ashMood(), talking('Ashling'));
  ctx.restore();
}
// an upright clay head that always faces the viewer; eyes look where the guard is facing
function guardMood(g) {
  if (g.stun > 0) return 'ko';
  if (g.seeing) return 'alert';
  if (g.bark && /Man down|Intruder|Wake up/.test(g.bark.text)) return 'startled';
  if (g.grog > 0) return 'groggy';
  if (g.lure || g.ret || g.bark) return 'suspicious';
  return 'calm';
}
function guardHead(g, hx, hy, mood, monk, tab) {
  const sk =
    g.sk != null ? g.sk : (g.sk = hash(g.wp ? g.wp[0][0] | 0 : 0, g.wp ? g.wp[0][1] | 0 : 0, 5));
  const skin = monk ? '#e4d4bc' : ['#e6c4a0', '#d4a47c', '#b98560', '#f0d2b0'][(sk * 4) | 0],
    R = 8;
  const lx = Math.cos(g.face) * 1.1,
    ly = Math.sin(g.face) * 0.8,
    ex = 3.2,
    ey = hy + 1.4,
    INKL = '#2a1608';
  if (monk) ell(hx, hy - 0.5, R + 2.2, R + 1.6, '#2a2038');
  else {
    ell(hx - R + 0.4, hy + 1.2, 2, 2.7, skin);
    ell(hx + R - 0.4, hy + 1.2, 2, 2.7, skin);
  }
  ell(hx, hy + 0.4, monk ? R - 1.4 : R, monk ? R - 1 : R * 0.96, skin);
  // nose, and the features that make each guard someone
  ell(
    hx,
    hy + 3.3,
    sk > 0.5 && sk < 0.75 && !monk ? 1.9 : 1.1,
    sk > 0.5 && sk < 0.75 && !monk ? 1.6 : 1,
    shade(skin, -0.16)
  );
  // eyes
  const wide = mood === 'alert' || mood === 'startled',
    narrow = mood === 'suspicious';
  const ew = wide ? 2.7 : 2,
    eh = wide ? 3 : narrow ? 1.3 : 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mood === 'ko') {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ctx.moveTo(cx - 1.5, ey - 1.5);
      ctx.lineTo(cx + 1.5, ey + 1.5);
      ctx.moveTo(cx + 1.5, ey - 1.5);
      ctx.lineTo(cx - 1.5, ey + 1.5);
    }
    ctx.stroke();
  } else if (mood === 'groggy') {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ctx.moveTo(cx - 1.8, ey - 0.2);
      ctx.quadraticCurveTo(cx, ey + 1.9, cx + 1.8, ey - 0.2);
    }
    ctx.stroke();
  } else
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ell(cx, ey, ew, eh, '#fbf2e0');
      if (mood === 'alert') ell(cx + lx * 0.5, ey + ly * 0.4, 1.5, 1.7, '#d02a2a');
      ell(
        cx + lx * 0.9,
        ey + ly * 0.7,
        mood === 'alert' ? 0.85 : 1.05,
        mood === 'alert' ? 1 : narrow ? 0.8 : 1.15,
        '#241628'
      );
      if (narrow) {
        ctx.strokeStyle = INKL;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - 2.1, ey - 0.5);
        ctx.lineTo(cx + 2.1, ey - 0.5);
        ctx.stroke();
      }
    }
  // brows
  ctx.strokeStyle = monk ? '#8a8498' : '#3a2210';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const by = ey - 3.4;
  if (mood === 'alert') {
    ctx.moveTo(hx - ex - 2.2, by - 1.6);
    ctx.lineTo(hx - ex + 2.2, by + 1.4);
    ctx.moveTo(hx + ex + 2.2, by - 1.6);
    ctx.lineTo(hx + ex - 2.2, by + 1.4);
  } else if (mood === 'startled') {
    ctx.moveTo(hx - ex - 2, by);
    ctx.quadraticCurveTo(hx - ex, by - 2.6, hx - ex + 2, by - 0.4);
    ctx.moveTo(hx + ex - 2, by - 0.4);
    ctx.quadraticCurveTo(hx + ex, by - 2.6, hx + ex + 2, by);
  } else if (mood === 'suspicious') {
    ctx.moveTo(hx - ex - 2, by + 0.4);
    ctx.lineTo(hx - ex + 2, by - 1.8);
    ctx.moveTo(hx + ex - 2, by);
    ctx.lineTo(hx + ex + 2, by + 1);
  } else if (mood === 'groggy') {
    ctx.moveTo(hx - ex - 2, by + 1.2);
    ctx.lineTo(hx - ex + 2, by + 0.2);
    ctx.moveTo(hx + ex - 2, by + 0.2);
    ctx.lineTo(hx + ex + 2, by + 1.2);
  } else if (mood === 'ko') {
    ctx.moveTo(hx - ex - 2, by + 0.6);
    ctx.lineTo(hx - ex + 2, by + 0.2);
    ctx.moveTo(hx + ex - 2, by + 0.2);
    ctx.lineTo(hx + ex + 2, by + 0.6);
  } else {
    ctx.moveTo(hx - ex - 2, by);
    ctx.lineTo(hx - ex + 2, by - 0.3);
    ctx.moveTo(hx + ex - 2, by - 0.3);
    ctx.lineTo(hx + ex + 2, by);
  }
  ctx.stroke();
  // individuality
  if (!monk) {
    if (sk < 0.25) {
      ell(hx - 1.5, hy + 4.2, 1.8, 1, '#4a2c18');
      ell(hx + 1.5, hy + 4.2, 1.8, 1, '#4a2c18');
    } else if (sk < 0.5) {
      ctx.strokeStyle = '#9a4a3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + 3.8, hy + 0.6);
      ctx.lineTo(hx + 2, hy + 5);
      ctx.moveTo(hx + 3.4, hy + 2.2);
      ctx.lineTo(hx + 1.8, hy + 1.9);
      ctx.stroke();
    } else if (sk >= 0.75) {
      ctx.fillStyle = 'rgba(150,80,50,.55)';
      for (const [fx, fy] of [
        [-4.4, 3.4],
        [-3.4, 4.4],
        [-5, 4.6],
        [4.4, 3.4],
        [3.4, 4.4],
        [5, 4.6]
      ]) {
        ctx.beginPath();
        ctx.arc(hx + fx, hy + fy, 0.55, 0, 7);
        ctx.fill();
      }
    }
  }
  // mouth
  const my = hy + 5.9,
    talk = g.bark && mood !== 'alert' && mood !== 'ko' && mood !== 'startled';
  if (mood === 'alert') {
    ell(hx, my - 0.2, 2.7, 2.6, '#3a0c14');
    ell(hx, my + 1.1, 1.6, 1, '#e0607a');
    ctx.fillStyle = '#fbf2e0';
    ctx.fillRect(hx - 2, my - 2.5, 4, 0.9);
  } else if (mood === 'startled') {
    ell(hx, my, 1.5, 2, '#3a0c14');
  } else if (mood === 'ko') {
    ell(hx, my, 1.8, 2, '#3a0c14');
    ell(hx + 0.9, my + 1.5, 1.2, 0.9, '#e0607a');
  } else if (talk) {
    ell(hx, my, 1.8, 0.8 + Math.abs(Math.sin(now * 14)) * 1.4, '#3a0c14');
  } else {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (mood === 'suspicious') {
      ctx.moveTo(hx - 2, my + 0.5);
      ctx.lineTo(hx + 2, my - 0.4);
    } else if (mood === 'groggy') {
      ctx.moveTo(hx - 2.2, my);
      ctx.quadraticCurveTo(hx - 1, my - 1, hx, my);
      ctx.quadraticCurveTo(hx + 1, my + 1, hx + 2.2, my);
    } else {
      ctx.moveTo(hx - 2, my - 0.3);
      ctx.quadraticCurveTo(hx, my + 0.9, hx + 2, my - 0.3);
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // helmet or hood over the top of the head
  if (monk) {
    ell(hx, hy - 6.2, R + 1, 3.4, '#2a2038');
    ctx.fillStyle = '#2a2038';
    ctx.beginPath();
    ctx.ellipse(hx, hy - 1.8, R + 0.8, R * 0.62, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ell(hx - 3, hy - 5, 2.2, 1.1, '#4a3c60');
  } else {
    const gr = ctx.createLinearGradient(hx - R, hy - R, hx + R * 0.7, hy);
    gr.addColorStop(0, '#c4cad6');
    gr.addColorStop(0.5, '#8d939f');
    gr.addColorStop(1, '#4d535f');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(hx, hy - 1.2, R + 0.9, R * 0.88, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ell(hx, hy - 1.5, R + 1.6, 1.8, '#6d737f');
    ctx.fillStyle = tab;
    ctx.beginPath();
    ctx.moveTo(hx - 1.9, hy - 7.2);
    ctx.quadraticCurveTo(hx, hy - 12.5, hx + 1.9, hy - 7.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9aa0ac';
    ctx.fillRect(hx - 0.7, hy - 1.3, 1.4, 4.2);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath();
    ctx.ellipse(hx - 3.4, hy - 5.2, 2.6, 1.2, -0.6, 0, 7);
    ctx.fill();
  }
}
function drawSoldier(g) {
  const tab = curPal(G).tab || '#c44a4a',
    st = g.mv ? Math.sin(g.walk * 0.28) : 0,
    monk = G.d.quiet;
  shadowAt(g.x, g.y, 10);
  ctx.save();
  ctx.translate(g.x, g.y);
  if (g.stun > 0) {
    const ang = g.face + 0.6;
    ctx.rotate(ang);
    ell(-3, 0, 13, 7, monk ? '#1e1828' : '#4d525c');
    ell(-3, 0, 10, 4, tab);
    if (!monk) {
      ctx.strokeStyle = '#5a3b22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(10, 13);
      ctx.stroke();
    }
    ctx.restore();
    guardHead(
      g,
      g.x + Math.cos(ang) * 10 - Math.sin(ang),
      g.y + Math.sin(ang) * 10 + Math.cos(ang) - 2,
      'ko',
      monk,
      tab
    );
    ctx.fillStyle = g.stun < 1.5 && Math.sin(now * 20) > 0 ? '#fff' : '#ffd27a';
    for (let k = 0; k < 3; k++) {
      const a = now * 3 + k * 2.1;
      star(g.x + Math.cos(a) * 9, g.y - 18 + Math.sin(a) * 3, 2.4);
    }
    return;
  }
  ctx.rotate(g.face);
  if (monk) {
    if (g.mv) {
      ell(3 + st * 3, -4, 2.5, 2, '#120c18');
      ell(3 - st * 3, 4, 2.5, 2, '#120c18');
    }
    ell(-2, 0, 9, 10, '#1e1828');
    ell(-2, 0, 7, 8, tab);
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(-3, -8, 2, 16);
    ell(5, -3, 2.2, 2, '#c9b08a');
    ell(5, 3, 2.2, 2, '#c9b08a');
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(6, -1, 3, 2);
  } else {
    if (g.mv) {
      ell(2 + st * 4, -5, 3, 2.2, '#22202a');
      ell(2 - st * 4, 5, 3, 2.2, '#22202a');
    }
    ell(-1, 0, 7, 9.5, '#5d636f');
    ell(-1, -6, 4, 3, '#6d737f');
    ell(-1, 6, 4, 3, '#6d737f');
    ell(-1, 0, 5, 7, tab);
    ctx.fillStyle = shade(tab, -0.4);
    ctx.fillRect(-6, -1, 10, 2);
    ctx.strokeStyle = '#5a3b22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(16 + st * 2, 8);
    ctx.stroke();
    ctx.fillStyle = '#c8ccd4';
    ctx.beginPath();
    ctx.moveTo(16 + st * 2, 5.5);
    ctx.lineTo(23 + st * 2, 8);
    ctx.lineTo(16 + st * 2, 10.5);
    ctx.fill();
    ell(3, 8, 2.2, 2.2, '#d8b08a');
    ell(3, -8, 2, 2, '#d8b08a');
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(2, -13, 5, 5);
  }
  ctx.rotate(-g.face);
  guardHead(g, 0, -6, guardMood(g), monk, tab);
  ctx.restore();
}
function bossMood(g) {
  if (g.dead) return 'ko';
  if (g.hurt > 0 && !(g.kind === 'candle' && G.candlesLit > 0)) return 'hurt';
  if (g.kind !== 'candle' && g.toll > 0) return 'toll';
  if (g.kind === 'candle' && g.blink) return 'scheme';
  if (g.seeing) return 'alert';
  if (g.lure || g.ret) return 'suspicious';
  if (g.kind === 'candle' && G.candlesLit > 0) return 'smug';
  return 'calm';
}
function wardenHead(g, hx, hy, mood, worn) {
  const R = 10,
    INKL = '#2a1020',
    ex = 3.7,
    ey = hy + 0.4,
    lx = Math.cos(g.face) * 1.1,
    ly = Math.sin(g.face) * 0.8;
  if (mood === 'toll') hx += Math.sin(now * 50) * 0.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ell(hx, hy - 0.6, R + 2.8, R + 2.2, '#3a2558');
  ctx.strokeStyle = '#e0b040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(hx, hy - 0.6, R + 2.8, R + 2.2, 0, 0.5, 2.6);
  ctx.stroke();
  ell(hx, hy + 0.8, R - 0.8, R - 0.6, '#d8c4b4');
  for (const sd of [-1, 1]) {
    ell(hx + sd * (R - 0.8), hy + 1.4, 1.7, 2.3, '#d8c4b4');
    ell(hx + sd * (R - 0.2), hy + 1.4, 1.1, 1.4, '#eadba2');
  } // wax in the ears
  ctx.strokeStyle = 'rgba(120,90,84,.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const k of [0, 1, 2]) {
    ctx.moveTo(hx - 5, hy - 5.6 + k * 1.5);
    ctx.quadraticCurveTo(hx, hy - 6.6 + k * 1.5, hx + 5, hy - 5.6 + k * 1.5);
  }
  ctx.stroke();
  ell(hx, hy + 2.8, 2.3, 2, '#cc9488');
  // eyes
  const wide = mood === 'alert',
    squeeze = mood === 'hurt' || mood === 'toll';
  if (mood === 'ko') {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ctx.moveTo(cx - 1.8, ey - 1.8);
      ctx.lineTo(cx + 1.8, ey + 1.8);
      ctx.moveTo(cx + 1.8, ey - 1.8);
      ctx.lineTo(cx - 1.8, ey + 1.8);
    }
    ctx.stroke();
  } else if (squeeze) {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ctx.moveTo(cx - 2 * sd, ey - 1.6);
      ctx.lineTo(cx + 2 * sd, ey);
      ctx.lineTo(cx - 2 * sd, ey + 1.6);
    }
    ctx.stroke();
  } else
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex,
        half = mood === 'calm' || mood === 'suspicious';
      ell(cx, ey, 2.6, wide ? 2.8 : half ? 1.5 : 2, '#f4ece4');
      ell(
        cx + lx * 0.9,
        ey + ly * 0.6,
        wide ? 0.95 : 1.15,
        wide ? 1.5 : half ? 1.1 : 1.4,
        wide ? '#c82020' : '#4a5a78'
      );
      ell(cx + lx * 0.9, ey + ly * 0.6, 0.5, 0.6, '#10101c');
    }
  // heavy white brows
  ctx.strokeStyle = '#f2ecf6';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  const by = ey - 3.4;
  if (wide) {
    ctx.moveTo(hx - ex - 3, by - 1.8);
    ctx.lineTo(hx - ex + 2.6, by + 1.6);
    ctx.moveTo(hx + ex + 3, by - 1.8);
    ctx.lineTo(hx + ex - 2.6, by + 1.6);
  } else if (mood === 'hurt' || mood === 'toll') {
    ctx.moveTo(hx - ex - 3, by + 1.2);
    ctx.lineTo(hx - ex + 2.6, by - 1);
    ctx.moveTo(hx + ex + 3, by + 1.2);
    ctx.lineTo(hx + ex - 2.6, by - 1);
  } else if (mood === 'suspicious') {
    ctx.moveTo(hx - ex - 3, by + 0.2);
    ctx.quadraticCurveTo(hx - ex, by - 2.6, hx - ex + 3, by - 1.6);
    ctx.moveTo(hx + ex - 3, by + 0.6);
    ctx.lineTo(hx + ex + 3, by + 1.2);
  } else if (mood === 'ko') {
    ctx.moveTo(hx - ex - 3, by + 0.8);
    ctx.lineTo(hx - ex + 3, by + 0.4);
    ctx.moveTo(hx + ex - 3, by + 0.4);
    ctx.lineTo(hx + ex + 3, by + 0.8);
  } else {
    ctx.moveTo(hx - ex - 3, by + 0.2);
    ctx.lineTo(hx - ex + 3, by + 0.8);
    ctx.moveTo(hx + ex - 3, by + 0.8);
    ctx.lineTo(hx + ex + 3, by + 0.2);
  }
  ctx.stroke();
  // mouth opening under the moustache, then the beard and moustache
  const open = mood === 'toll' || mood === 'alert' || mood === 'ko' || mood === 'hurt';
  if (open) {
    ell(hx, hy + 7.2, mood === 'toll' ? 3.6 : 2.8, mood === 'toll' ? 3.4 : 2.4, '#3a0c14');
    if (mood === 'ko') ell(hx + 1, hy + 9.2, 1.4, 1, '#e0607a');
  }
  const bg = ctx.createLinearGradient(hx, hy + 3, hx, hy + 15);
  bg.addColorStop(0, '#fbf6ff');
  bg.addColorStop(1, '#bfb6cc');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(hx - R + 0.6, hy + 3);
  ctx.quadraticCurveTo(hx - R - 1, hy + 13, hx, hy + 16);
  ctx.quadraticCurveTo(hx + R + 1, hy + 13, hx + R - 0.6, hy + 3);
  ctx.quadraticCurveTo(hx + 4, hy + 6.4, hx, hy + 5.8);
  ctx.quadraticCurveTo(hx - 4, hy + 6.4, hx - R + 0.6, hy + 3);
  ctx.closePath();
  ctx.fill();
  if (open) {
    ell(hx, hy + 7.2, mood === 'toll' ? 3.2 : 2.4, mood === 'toll' ? 3 : 2.1, '#3a0c14');
    if (mood === 'ko') ell(hx + 1, hy + 9, 1.3, 0.9, '#e0607a');
  }
  ell(hx - 2.4, hy + 4.6, 3.2, 1.6, '#fbf6ff');
  ell(hx + 2.4, hy + 4.6, 3.2, 1.6, '#fbf6ff');
  // the hood over the brow
  const hg = ctx.createLinearGradient(hx - R, hy - 12, hx + R * 0.6, hy - 2);
  hg.addColorStop(0, '#7a58b0');
  hg.addColorStop(1, '#3a2558');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(hx, hy - 2.8, R + 2, R * 0.78, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e0b040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(hx - R - 1, hy - 2.6);
  ctx.quadraticCurveTo(hx, hy - 5, hx + R + 1, hy - 2.6);
  ctx.stroke();
  ell(hx, hy - 4.2, 1.3, 1.3, '#e0b040');
  if (mood === 'toll') {
    ctx.strokeStyle = 'rgba(255,215,120,.8)';
    ctx.lineWidth = 1.3;
    for (const k of [0, 1]) {
      ctx.beginPath();
      ctx.arc(hx, hy + 2, R + 6 + k * 4, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy + 2, R + 6 + k * 4, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
    }
  }
  if (worn) {
    ell(hx + R + 2, hy - 4, 1.2, 1.7, '#9ad4ff');
    ctx.fillStyle = 'rgba(90,40,90,.35)';
    ctx.beginPath();
    ctx.ellipse(hx - 4.8, hy + 3, 2, 1.3, 0, 0, 7);
    ctx.fill();
  }
  ctx.lineCap = 'butt';
}
function candleHead(g, hx, hy, mood, worn, talk) {
  const R = 9,
    ex = 3.2,
    ey = hy - 0.3,
    INKL = '#2a1214',
    EMB = '#ff8a3a';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ell(hx, hy - 1, R + 2.4, R + 2.2, '#1a121c');
  ctx.fillStyle = '#221a24';
  ctx.beginPath();
  ctx.moveTo(hx - 5.6, hy - 8);
  ctx.quadraticCurveTo(hx + 1, hy - 18, hx + 6.4, hy - 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(hx + 0.4, hy - 16.2, 2.4, 3.4);
  flame(hx + 1.6, hy - 16.4, 2.3, 4);
  const dead = mood === 'ko';
  ell(hx, hy + 0.8, R - 1.4, R - 0.2, dead ? '#a8a098' : '#f0e8dc');
  ctx.strokeStyle = 'rgba(200,150,130,.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(hx, hy - 1.8);
  ctx.lineTo(hx - 0.6, hy + 2.4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(216,106,90,.55)';
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(hx + sd * 4.6, hy + 3, 1.5, 1, 0, 0, 7);
    ctx.fill();
  }
  const eye = (cx, kind) => {
    if (dead) {
      ctx.strokeStyle = INKL;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 1.6, ey - 1.6);
      ctx.lineTo(cx + 1.6, ey + 1.6);
      ctx.moveTo(cx + 1.6, ey - 1.6);
      ctx.lineTo(cx - 1.6, ey + 1.6);
      ctx.stroke();
      return;
    }
    if (kind === 'happy') {
      ctx.strokeStyle = EMB;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 2.2, ey + 0.8);
      ctx.quadraticCurveTo(cx, ey - 2.2, cx + 2.2, ey + 0.8);
      ctx.stroke();
      addGlow(cx, ey, 6, '255,120,40', 0.55);
      return;
    }
    if (kind === 'wide') {
      ell(cx, ey, 2.4, 2.8, INKL);
      ell(cx, ey, 1.5, 1.7, '#ffb050');
      addGlow(cx, ey, 10, '255,130,40', 0.8);
      return;
    }
    if (kind === 'angry') {
      ctx.fillStyle = INKL;
      ctx.beginPath();
      ctx.moveTo(cx - 2.4, ey - 1.8 * Math.sign(cx - hx));
      ctx.lineTo(cx + 2.4, ey + 0.6);
      ctx.lineTo(cx - 2.2, ey + 1.2);
      ctx.closePath();
      ctx.fill();
      ell(cx, ey + 0.2, 0.9, 0.8, '#ff4a2a');
      addGlow(cx, ey, 7, '255,70,40', 0.75);
      return;
    }
    if (kind === 'shock') {
      ell(cx, ey, 2.2, 2.6, INKL);
      ell(cx, ey, 0.7, 0.8, EMB);
      return;
    }
    ell(cx, ey, 2.2, 1.1, INKL);
    ell(cx, ey, 1.1, 0.8, EMB);
    addGlow(cx, ey, 6, '255,120,40', 0.6);
  };
  const L =
    mood === 'smug'
      ? 'happy'
      : mood === 'scheme'
        ? 'wide'
        : mood === 'alert'
          ? 'angry'
          : mood === 'hurt'
            ? 'shock'
            : 'slit';
  eye(hx - ex, L);
  eye(hx + ex, mood === 'suspicious' ? 'slit' : L);
  if (mood === 'suspicious') eye(hx - ex, 'wide');
  // painted brows and mouth
  ctx.strokeStyle = '#a82a2a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const by = ey - 3.6;
  if (mood === 'alert') {
    ctx.moveTo(hx - ex - 2.4, by - 1.2);
    ctx.lineTo(hx - ex + 2, by + 1.2);
    ctx.moveTo(hx + ex + 2.4, by - 1.2);
    ctx.lineTo(hx + ex - 2, by + 1.2);
  } else if (mood === 'scheme' || mood === 'smug') {
    ctx.moveTo(hx - ex - 2, by + 0.8);
    ctx.quadraticCurveTo(hx - ex + 0.4, by - 1.8, hx - ex + 2.4, by - 1.2);
    ctx.moveTo(hx + ex - 2.4, by - 1.2);
    ctx.quadraticCurveTo(hx + ex - 0.4, by - 1.8, hx + ex + 2, by + 0.8);
  } else if (mood === 'hurt' || dead) {
    ctx.moveTo(hx - ex - 2, by + 1);
    ctx.lineTo(hx - ex + 2, by - 1);
    ctx.moveTo(hx + ex + 2, by + 1);
    ctx.lineTo(hx + ex - 2, by - 1);
  } else if (mood === 'suspicious') {
    ctx.moveTo(hx - ex - 2, by + 0.6);
    ctx.quadraticCurveTo(hx - ex, by - 2.4, hx - ex + 2.4, by - 1);
    ctx.moveTo(hx + ex - 2, by + 0.4);
    ctx.lineTo(hx + ex + 2, by + 0.9);
  } else {
    ctx.moveTo(hx - ex - 2, by + 0.4);
    ctx.quadraticCurveTo(hx - ex, by - 1.2, hx - ex + 2.2, by);
    ctx.moveTo(hx + ex - 2.2, by);
    ctx.quadraticCurveTo(hx + ex, by - 1.2, hx + ex + 2, by + 0.4);
  }
  ctx.stroke();
  const my = hy + 5.6;
  if (talk && !dead) {
    ell(hx, my, 2.2, 0.7 + Math.abs(Math.sin(now * 12)) * 1.8, '#3a0c14');
  } else if (mood === 'hurt') {
    ell(hx, my, 1.6, 2.1, '#3a0c14');
  } else {
    ctx.strokeStyle = '#a82a2a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (mood === 'smug' || mood === 'scheme') {
      ctx.moveTo(hx - 3.6, my - 0.8);
      ctx.quadraticCurveTo(hx, my + 2.4, hx + 3.6, my - 0.8);
      ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = -2; k <= 2; k++) {
        ctx.moveTo(hx + k * 1.2, my + 0.1 + (2 - Math.abs(k) * 0.3) * 0.5);
        ctx.lineTo(hx + k * 1.2, my + 0.9 + (2 - Math.abs(k) * 0.3) * 0.5);
      }
      ctx.stroke();
    } else if (mood === 'alert') {
      ctx.moveTo(hx - 2.6, my + 0.2);
      ctx.lineTo(hx + 2.6, my + 0.2);
      ctx.stroke();
    } else if (mood === 'suspicious') {
      ctx.moveTo(hx - 2.4, my + 0.7);
      ctx.lineTo(hx + 2.4, my - 0.5);
      ctx.stroke();
    } else if (dead) {
      ctx.moveTo(hx - 2.2, my + 0.8);
      ctx.quadraticCurveTo(hx, my - 0.4, hx + 2.2, my + 0.8);
      ctx.stroke();
    } else {
      ctx.moveTo(hx - 2.2, my - 0.2);
      ctx.quadraticCurveTo(hx, my + 1.1, hx + 2.2, my - 0.2);
      ctx.stroke();
    }
  }
  // the mask cracks as he is burned, and splits when he falls
  if (worn || mood === 'hurt' || dead) {
    ctx.strokeStyle = '#5a3a30';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(hx + 3.6, hy - 6);
    ctx.lineTo(hx + 1.8, hy - 2.6);
    ctx.lineTo(hx + 3.4, hy - 0.6);
    ctx.lineTo(hx + 2, hy + 2.4);
    ctx.stroke();
    if (dead || mood === 'hurt') {
      ctx.beginPath();
      ctx.moveTo(hx - 3.2, hy - 5);
      ctx.lineTo(hx - 1.4, hy - 1.6);
      ctx.lineTo(hx - 3, hy + 1);
      ctx.stroke();
    }
  }
  ell(hx, hy - 6.2, R - 0.8, 2.2, '#1a121c');
  ctx.lineCap = 'butt';
}
function drawWarden(g) {
  const dead = g.dead,
    ring = g.toll > 0 ? Math.sin(now * 40) * 0.15 : 0;
  shadowAt(g.x, g.y, 17);
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.save();
  ctx.rotate(g.face);
  ctx.save();
  ctx.translate(-12, 0);
  ctx.rotate(ring);
  ell(0, 0, 9, 10.5, dead ? '#3a3020' : '#7a5a18');
  ell(0, 0, 6.5, 8, dead ? '#4a4030' : '#c89a30');
  ell(-2, -3, 2, 3, 'rgba(255,240,180,.35)');
  ctx.restore();
  ell(-1, 0, 13, 15, dead ? '#2e2638' : g.hurt > 0 ? '#f0b0c0' : '#4a2f6e');
  ell(-1, 0, 9, 11, dead ? '#3a3046' : '#5d3d88');
  ctx.strokeStyle = '#e0b040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-1, 0, 13, 15, 0, -1, 1);
  ctx.stroke();
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, 11);
  ctx.lineTo(19, 12);
  ctx.stroke();
  ctx.fillStyle = '#8a8f98';
  ctx.fillRect(16, 7, 6, 10);
  ctx.restore();
  wardenHead(g, Math.cos(g.face) * 3, -9 + Math.sin(g.face) * 2, bossMood(g), g.hp < g.maxhp * 0.4);
  ctx.restore();
}
function drawCandlemaker(g) {
  const dead = g.dead,
    sw = Math.sin(now * 4) * 2;
  shadowAt(g.x, g.y, 15);
  if (G.candlesLit > 0 && !dead) {
    ctx.strokeStyle = 'rgba(200,160,255,' + (0.35 + 0.2 * Math.sin(now * 5)) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 21, 0, 7);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,160,255,.18)';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 25 + Math.sin(now * 3) * 2, 0, 7);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.save();
  ctx.rotate(g.face);
  ctx.fillStyle = dead ? '#2a2228' : g.hurt > 0 && G.candlesLit === 0 ? '#e0a090' : '#221a24';
  ctx.beginPath();
  ctx.moveTo(6, -10);
  ctx.quadraticCurveTo(-8, -15, -20, -7 + sw);
  ctx.lineTo(-23, sw);
  ctx.lineTo(-20, 7 + sw);
  ctx.quadraticCurveTo(-8, 15, 6, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a3a2a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-18, -4 + sw);
  ctx.moveTo(-4, 8);
  ctx.lineTo(-18, 4 + sw);
  ctx.stroke();
  ell(2, -9, 4.5, 3, '#3a2e3a');
  ell(2, 9, 4.5, 3, '#3a2e3a');
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(0, -14, 4, 5);
  ctx.fillRect(0, 9, 4, 5);
  ell(1, 0, 7, 7, '#1a121c');
  ctx.restore();
  candleHead(
    g,
    Math.cos(g.face) * 3,
    -8 + Math.sin(g.face) * 2,
    bossMood(g),
    g.hp < g.maxhp * 0.4,
    talking('Candlemaker')
  );
  ctx.restore();
}
function drawTower(g) {
  shadowAt(g.x + 5, g.y + 6, 17, 0.4);
  ell(g.x, g.y, 16, 16, '#3e4c4a');
  ell(g.x, g.y, 13, 13, '#5a6c68');
  ell(g.x - 3, g.y - 3, 6, 6, 'rgba(255,255,255,.06)');
  for (let k = 0; k < 8; k++) {
    const a = k * 0.785;
    ctx.fillStyle = '#34413f';
    ctx.fillRect(g.x + Math.cos(a) * 14 - 2.5, g.y + Math.sin(a) * 14 - 2.5, 5, 5);
  }
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.face);
  ctx.fillStyle = '#222';
  ctx.fillRect(-5, -5, 11, 10);
  ctx.fillStyle = '#fff3c0';
  ctx.fillRect(5, -4, 2.5, 8);
  ctx.restore();
}
function drawBoat(g) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.face);
  ctx.strokeStyle = 'rgba(200,240,240,.25)';
  ctx.lineWidth = 1.5;
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(-14 - k * 6, -4 - k * 2.5);
    ctx.lineTo(-10 - k * 6, 0);
    ctx.lineTo(-14 - k * 6, 4 + k * 2.5);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a2e1a';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.quadraticCurveTo(8, -10, -14, -8);
  ctx.lineTo(-14, 8);
  ctx.quadraticCurveTo(8, 10, 18, 0);
  ctx.fill();
  ctx.fillStyle = '#7a5232';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.quadraticCurveTo(6, -7, -11, -6);
  ctx.lineTo(-11, 6);
  ctx.quadraticCurveTo(6, 7, 14, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.3)';
  ctx.lineWidth = 1;
  for (let k = -6; k < 10; k += 5) {
    ctx.beginPath();
    ctx.moveTo(k, -6);
    ctx.lineTo(k, 6);
    ctx.stroke();
  }
  ell(-6, 0, 3.5, 3.5, curPal(G).tab);
  ell(4, -2, 3, 3, '#8d939f');
  ell(4, 3, 3, 3, '#8d939f');
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(12, -1.5, 3, 3);
  ctx.restore();
}
function drawGuard(g) {
  if (g.spin) drawTower(g);
  else if (G.flight) drawBoat(g);
  else if (g.boss) (g.kind === 'candle' ? drawCandlemaker : drawWarden)(g);
  else drawSoldier(g);
}
function drawGuest(s) {
  shadowAt(s.x, s.y, 9, 0.25);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate((s.face || 0) + Math.sin(G.time * 3 + s.ph) * 0.2);
  ell(-2, 0, 10, 11, shade(s.c, -0.35));
  ell(-1, 0, 8, 9, s.c);
  ctx.strokeStyle = shade(s.c, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-1, 0, 8, 9, 0, 1.8, 4.5);
  ctx.stroke();
  ell(1, 0, 4.5, 4.5, '#e6c4a0');
  ell(0, 0, 3, 4, '#3a2618');
  ctx.fillStyle = '#f0d070';
  ctx.fillRect(3.5, -4, 2.5, 8);
  ctx.fillStyle = '#000';
  ctx.fillRect(4.5, -2.5, 1, 1.5);
  ctx.fillRect(4.5, 1, 1, 1.5);
  ctx.restore();
}
function perrinMood(h) {
  const al = G.alert;
  if (al > 0.8) return 'panic';
  if (al > 0.45) return 'worry';
  if (G.exitOpen && Math.hypot(h.x - G.exit.x, h.y - G.exit.y) < 100) return 'joy';
  return 'hope';
}
function perrinHead(h, hx, hy, mood, talk) {
  const R = 7,
    skin = '#ecd0ac',
    INKL = '#2a1608',
    ex = 2.8,
    ey = hy + 1.2,
    by = ey - 3.6,
    my = hy + 5.1;
  const lx = Math.cos(h.face || 0) * 1.0,
    ly = Math.sin(h.face || 0) * 0.7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ell(hx - R + 0.4, hy + 1, 1.9, 2.6, skin);
  ell(hx + R - 0.4, hy + 1, 1.9, 2.6, skin);
  ell(hx, hy + 0.6, R - 0.2, R * 0.98, skin);
  // golden hair swept to one side, with a slim circlet
  const gr = ctx.createLinearGradient(hx - R, hy - 9, hx + R, hy - 1);
  gr.addColorStop(0, '#f6dc84');
  gr.addColorStop(1, '#c8a43c');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.ellipse(hx, hy - 1.8, R + 0.7, R * 0.8, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - R - 0.5, hy - 1.6);
  ctx.quadraticCurveTo(hx - R - 1, hy + 2.6, hx - R + 1.8, hy + 3);
  ctx.quadraticCurveTo(hx - R + 1.4, hy, hx - R + 2.6, hy - 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + R + 0.5, hy - 1.6);
  ctx.quadraticCurveTo(hx + R + 1, hy + 2.6, hx + R - 1.8, hy + 3);
  ctx.quadraticCurveTo(hx + R - 1.4, hy, hx + R - 2.6, hy - 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6dc84';
  ctx.beginPath();
  ctx.moveTo(hx - 5.5, hy - 2.4);
  ctx.quadraticCurveTo(hx - 0.6, hy - 0.2, hx + 4.2, hy - 3);
  ctx.quadraticCurveTo(hx + 0.8, hy - 2.8, hx - 2.2, hy - 4.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(hx - R + 0.8, hy - 3.7);
  ctx.quadraticCurveTo(hx, hy - 6, hx + R - 0.8, hy - 3.7);
  ctx.stroke();
  ell(hx, hy - 5.2, 1, 1, '#4aa8e0');
  ell(hx, hy + 3.1, 1, 0.9, '#d0a47c');
  const wide = mood === 'worry' || mood === 'panic',
    ew = mood === 'panic' ? 2.6 : wide ? 2.4 : 2.1,
    eh = mood === 'panic' ? 3.2 : wide ? 2.9 : 2.4;
  if (mood === 'joy') {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ctx.moveTo(cx - 1.8, ey + 0.6);
      ctx.quadraticCurveTo(cx, ey - 1.8, cx + 1.8, ey + 0.6);
    }
    ctx.stroke();
  } else
    for (const sd of [-1, 1]) {
      const cx = hx + sd * ex;
      ell(cx, ey, ew, eh, '#fbf2e0');
      ell(cx + lx * 0.9, ey + ly * 0.7, wide ? 1.15 : 1.4, wide ? 1.35 : 1.55, '#3a78b8');
      ell(cx + lx * 0.9, ey + ly * 0.7, 0.6, 0.7, '#101a28');
      ell(cx + lx * 0.9 - 0.45, ey + ly * 0.7 - 0.5, 0.4, 0.4, '#ffffff');
      if (mood === 'captive') {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, ey, ew, eh, 0, 0, 7);
        ctx.clip();
        ctx.fillStyle = skin;
        ctx.fillRect(cx - 4, ey - 4, 8, 2.6);
        ctx.restore();
        ctx.strokeStyle = INKL;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - ew, ey - 1.4);
        ctx.lineTo(cx + ew, ey - 1.4);
        ctx.stroke();
      }
    }
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (wide || mood === 'captive') {
    ctx.moveTo(hx - ex - 2, by + 1);
    ctx.lineTo(hx - ex + 2, by - 1.2);
    ctx.moveTo(hx + ex + 2, by + 1);
    ctx.lineTo(hx + ex - 2, by - 1.2);
  } else if (mood === 'joy') {
    ctx.moveTo(hx - ex - 2, by);
    ctx.quadraticCurveTo(hx - ex, by - 2, hx - ex + 2, by);
    ctx.moveTo(hx + ex - 2, by);
    ctx.quadraticCurveTo(hx + ex, by - 2, hx + ex + 2, by);
  } else {
    ctx.moveTo(hx - ex - 2, by);
    ctx.quadraticCurveTo(hx - ex, by - 1.6, hx - ex + 2, by - 0.4);
    ctx.moveTo(hx + ex - 2, by - 0.4);
    ctx.quadraticCurveTo(hx + ex, by - 1.6, hx + ex + 2, by);
  }
  ctx.stroke();
  if (mood === 'captive') {
    ctx.fillStyle = 'rgba(70,40,80,.28)';
    ctx.beginPath();
    ctx.ellipse(hx + 4.2, hy + 3.4, 1.8, 1.1, 0, 0, 7);
    ctx.fill();
    ell(hx - ex - 1.2, ey + 3.6, 0.7, 1.1, '#9ad4ff');
  }
  if (mood === 'panic') {
    ell(hx, my, 1.5, 2.1, '#3a0c14');
    ell(hx + R + 1.5, hy - 3, 1.2, 1.7, '#9ad4ff');
  } else if (talk) {
    ell(hx, my, 1.9, 0.8 + Math.abs(Math.sin(now * 14)) * 1.5, '#3a0c14');
  } else if (mood === 'joy') {
    ell(hx, my - 0.4, 2.6, 1.9, '#3a0c14');
    ell(hx, my + 0.4, 1.6, 0.9, '#e0607a');
  } else {
    ctx.strokeStyle = INKL;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (mood === 'worry' || mood === 'captive') {
      ctx.moveTo(hx - 2, my + 0.7);
      ctx.quadraticCurveTo(hx, my - 0.7, hx + 2, my + 0.7);
    } else {
      ctx.moveTo(hx - 2, my - 0.3);
      ctx.quadraticCurveTo(hx, my + 0.9, hx + 2, my - 0.3);
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}
function drawPerrin(h) {
  const st = h.mv ? Math.sin(h.walk * 0.3) : 0;
  shadowAt(h.x, h.y, 9);
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.save();
  ctx.rotate(h.face || 0);
  if (h.mv) {
    ell(3 + st * 4, -4, 3, 2, '#1a2430');
    ell(3 - st * 4, 4, 3, 2, '#1a2430');
  }
  ell(-1, 0, 7, 8.5, '#2f5f8a');
  ell(-1, 0, 4, 6, '#7fd0ff');
  ctx.fillStyle = '#999';
  ctx.fillRect(1, -10, 3, 3);
  ctx.fillRect(1, 7, 3, 3);
  ell(1, -8.6, 2.2, 2, '#a8aeb8');
  ell(1, 8.6, 2.2, 2, '#a8aeb8');
  ctx.restore();
  perrinHead(
    h,
    Math.cos(h.face || 0) * 2.2,
    -5.8 + Math.sin(h.face || 0) * 1.5,
    perrinMood(h),
    talking('Perrin')
  );
  ctx.restore();
}
