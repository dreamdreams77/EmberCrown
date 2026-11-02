// Web Audio engine: synthesized sound effects, generative music, mute control.
'use strict';

/* ---------- sound: everything is synthesized in the browser, no audio files ---------- */
const SND = {
  ctx: null,
  mode: 0,
  toast: '',
  toastT: 0,
  prevG: null,
  cur: null,
  tk: null,
  tg: null,
  nextT: 0,
  step: 0,
  I: 0,
  hbT: 0,
  holdTk: 0,
  stepT: 0,
  alertCool: 0,
  crackT: 0,
  talkCool: 0,
  lastMode: 'title'
};
try {
  const m = +localStorage.getItem('ec_snd');
  if (m >= 0 && m <= 2) SND.mode = m;
} catch (_) {}
const SND_LABELS = ['Sound on', 'Sound effects only', 'Sound off'];
const clamp1 = (v) => Math.max(-1, Math.min(1, v));
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
SND.init = function () {
  if (SND.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let c;
  try {
    c = new AC();
  } catch (_) {
    return;
  }
  SND.ctx = c;
  SND.master = c.createGain();
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 5;
  comp.attack.value = 0.004;
  comp.release.value = 0.2;
  SND.an = c.createAnalyser();
  SND.an.fftSize = 1024;
  SND.master.connect(comp);
  comp.connect(SND.an);
  SND.an.connect(c.destination);
  SND.sfxBus = c.createGain();
  SND.sfxBus.gain.value = 0.9;
  SND.sfxBus.connect(SND.master);
  SND.musBus = c.createGain();
  SND.musBus.connect(SND.master);
  // a short stereo reverb built from decaying noise
  const len = c.sampleRate * 2.2,
    ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7);
  }
  const cv2 = c.createConvolver();
  cv2.buffer = ir;
  SND.rev = c.createGain();
  SND.rev.connect(cv2);
  const rg = c.createGain();
  rg.gain.value = 0.55;
  cv2.connect(rg);
  rg.connect(SND.master);
  SND.nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  {
    const d = SND.nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  // continuous dragon fire: a roaring noise bed we open and close
  const fs = c.createBufferSource();
  fs.buffer = SND.nb;
  fs.loop = true;
  const fb = c.createBiquadFilter();
  fb.type = 'bandpass';
  fb.frequency.value = 1000;
  fb.Q.value = 0.6;
  const fl = c.createBiquadFilter();
  fl.type = 'lowpass';
  fl.frequency.value = 260;
  SND.fireG = c.createGain();
  SND.fireG.gain.value = 0;
  fs.connect(fb);
  fb.connect(SND.fireG);
  fs.connect(fl);
  fl.connect(SND.fireG);
  SND.fireG.connect(SND.sfxBus);
  fs.start();
  SND.applyMode(true);
  setInterval(SND.pump, 30);
};
SND.unlock = function () {
  SND.init();
  if (SND.ctx && SND.ctx.state === 'suspended' && SND.mode !== 2 && !document.hidden)
    SND.ctx.resume();
};
SND.applyMode = function (first) {
  if (!SND.ctx) return;
  const t = SND.ctx.currentTime;
  SND.master.gain.setTargetAtTime(SND.mode === 2 ? 0 : 1, t, first ? 0.01 : 0.05);
  SND.musBus.gain.setTargetAtTime(SND.mode === 0 ? 0.5 : 0, t, first ? 0.01 : 0.12);
  if (SND.mode !== 2 && SND.ctx.state === 'suspended' && !document.hidden) SND.ctx.resume();
};
SND.cycle = function () {
  SND.mode = (SND.mode + 1) % 3;
  try {
    localStorage.setItem('ec_snd', String(SND.mode));
  } catch (_) {}
  SND.toast = SND_LABELS[SND.mode];
  SND.toastT = 2;
  SND.init();
  SND.applyMode();
  if (SND.mode !== 2) sfx('ui');
};
document.addEventListener('visibilitychange', () => {
  if (!SND.ctx) return;
  if (document.hidden) SND.ctx.suspend();
  else if (SND.mode !== 2) SND.ctx.resume();
});
function sfx(name, ...a) {
  if (!SND.ctx || SND.mode === 2 || SND.ctx.state !== 'running') return;
  try {
    SFX[name](...a);
  } catch (e) {
    console.warn('sfx ' + name, e);
  }
}

/* building blocks */
function sout(g, o) {
  const c = SND.ctx;
  let n = g;
  if (o.pan && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = clamp1(o.pan);
    g.connect(p);
    n = p;
  }
  n.connect(o.dest || SND.sfxBus);
  if (o.rev) {
    const s = c.createGain();
    s.gain.value = o.rev;
    n.connect(s);
    s.connect(SND.rev);
  }
}
function tone(f, dur, type, vol, o) {
  const c = SND.ctx;
  o = o || {};
  const t = o.t || c.currentTime,
    a = o.a || 0.005;
  const os = c.createOscillator(),
    g = c.createGain();
  os.type = type || 'sine';
  os.frequency.setValueAtTime(f, t);
  if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
  if (o.det) os.detune.value = o.det;
  let n = os;
  if (o.lp) {
    const fl = c.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = o.lp;
    os.connect(fl);
    n = fl;
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  if (o.sus) {
    g.gain.setValueAtTime(vol, t + Math.max(a, dur - 0.7));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
  } else g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(g);
  sout(g, o);
  os.start(t);
  os.stop(t + dur + 0.05);
}
function noise(dur, vol, type, f1, o) {
  const c = SND.ctx;
  o = o || {};
  const t = o.t || c.currentTime,
    a = o.a || 0.005;
  const s = c.createBufferSource();
  s.buffer = SND.nb;
  s.loop = true;
  const f = c.createBiquadFilter();
  f.type = type || 'bandpass';
  f.frequency.setValueAtTime(f1, t);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
  f.Q.value = o.q || 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  sout(g, o);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
}
function bellTone(f, vol, dur, o) {
  o = o || {};
  for (const [r, v, d] of [
    [1, 1, 1],
    [2.01, 0.5, 0.8],
    [2.76, 0.42, 0.6],
    [5.4, 0.2, 0.4],
    [8.93, 0.1, 0.25]
  ])
    tone(f * r, dur * d, 'sine', vol * v, Object.assign({ a: 0.003 }, o));
}
// position of a sound in the world: quieter when far from whoever you control, panned left or right
function at(x, y) {
  const A = G && G.active === 'shiloh' ? G.shiloh : G && G.ash;
  if (!A) return { vol: 1, pan: 0 };
  const d = Math.hypot(x - A.x, y - A.y);
  return { vol: Math.max(0.12, 1 - d / (12 * T)), pan: clamp1((x - A.x) / 320) };
}
const SFX = {
  ui() {
    tone(660, 0.09, 'triangle', 0.22);
    tone(990, 0.12, 'triangle', 0.16, { t: SND.ctx.currentTime + 0.05 });
  },
  tick() {
    tone(900, 0.05, 'square', 0.06);
  },
  step(v, x) {
    const j = Math.random();
    noise(0.07, 0.16 * v, 'bandpass', 650 + j * 350, { q: 1.4 });
    tone(95, 0.08, 'sine', 0.2 * v, { slide: 55 });
  },
  flap() {
    noise(0.25, 0.1, 'bandpass', 500, { f2: 900, q: 0.8, a: 0.06 });
  },
  doorTick() {
    tone(2300 + Math.random() * 400, 0.03, 'square', 0.07);
  },
  hold(kind, p) {
    if (kind === 'door') return SFX.doorTick();
    if (kind === 'guard') {
      tone(110 + p * 40, 0.07, 'sine', 0.2, { slide: 80 });
      return;
    }
    tone(420 + 680 * p, 0.08, 'triangle', 0.13, { rev: 0.2 });
  },
  doorOpen(x, y) {
    const s = at(x, y);
    noise(0.55, 0.2 * s.vol, 'bandpass', 260, { f2: 900, q: 2, pan: s.pan, a: 0.08 });
    tone(120, 0.5, 'sawtooth', 0.1 * s.vol, { slide: 70, lp: 600, pan: s.pan });
    tone(70, 0.12, 'sine', 0.25 * s.vol, { t: SND.ctx.currentTime + 0.5, pan: s.pan });
  },
  objective() {
    [523, 659, 784].forEach((f, i) =>
      tone(f, 0.35, 'triangle', 0.15, { t: SND.ctx.currentTime + i * 0.09, rev: 0.35 })
    );
  },
  gem() {
    tone(1318, 0.2, 'sine', 0.16, { a: 0.002, rev: 0.3 });
    tone(1760, 0.3, 'sine', 0.14, { t: SND.ctx.currentTime + 0.07, a: 0.002, rev: 0.3 });
  },
  egg() {
    const t = SND.ctx.currentTime;
    for (let i = 0; i < 4; i++) noise(0.06, 0.3, 'highpass', 2000 + i * 500, { t: t + i * 0.07 });
    noise(0.8, 0.3, 'lowpass', 2500, { f2: 200, t: t + 0.35 });
    tone(600, 0.3, 'triangle', 0.18, { slide: 1500, t: t + 0.35, rev: 0.3 });
    objectiveLater(0.55);
  },
  beacon() {
    noise(1, 0.28, 'lowpass', 2200, { f2: 150, a: 0.05 });
    for (let i = 0; i < 6; i++)
      noise(0.03, 0.15, 'highpass', 3500, { t: SND.ctx.currentTime + 0.05 + Math.random() * 0.7 });
  },
  paper() {
    noise(0.12, 0.15, 'highpass', 3500);
    tone(260, 0.1, 'sine', 0.18, { t: SND.ctx.currentTime + 0.1, slide: 140 });
  },
  poison() {
    for (let i = 0; i < 3; i++)
      tone(900 - i * 180, 0.18, 'sine', 0.13, {
        slide: 300,
        t: SND.ctx.currentTime + i * 0.1,
        rev: 0.3
      });
  },
  snuff() {
    noise(0.4, 0.2, 'bandpass', 1600, { f2: 350, q: 1.2 });
    tone(420, 0.35, 'sine', 0.1, { slide: 140 });
  },
  song() {
    [392, 440, 523, 587].forEach((f, i) => {
      tone(f, 0.5, 'sine', 0.14, { t: SND.ctx.currentTime + i * 0.16, a: 0.03, rev: 0.5 });
      noise(0.3, 0.03, 'bandpass', f * 2, { t: SND.ctx.currentTime + i * 0.16 });
    });
  },
  free() {
    [659, 784, 988].forEach((f, i) =>
      tone(f, 0.3, 'triangle', 0.14, { t: SND.ctx.currentTime + i * 0.08, rev: 0.4 })
    );
  },
  smoke() {
    noise(0.8, 0.28, 'lowpass', 2200, { f2: 260, a: 0.03 });
  },
  bell() {
    bellTone(1175, 0.1, 1.4, { rev: 0.55 });
  },
  flute() {
    [523, 659, 587].forEach((f, i) => {
      tone(f, 0.35, 'sine', 0.2, { t: SND.ctx.currentTime + i * 0.14, a: 0.04, rev: 0.4 });
      noise(0.25, 0.05, 'bandpass', f * 2, { t: SND.ctx.currentTime + i * 0.14 });
    });
  },
  time() {
    const t = SND.ctx.currentTime;
    tone(180, 0.9, 'sine', 0.2, { slide: 1500, a: 0.5, rev: 0.7 });
    tone(272, 0.9, 'triangle', 0.1, { slide: 2200, a: 0.5, rev: 0.7 });
    noise(0.9, 0.18, 'bandpass', 300, { f2: 3000, a: 0.6, rev: 0.5 });
    bellTone(660, 0.1, 1.6, { t: t + 0.9, rev: 0.7 });
  },
  swap() {
    tone(500, 0.12, 'triangle', 0.16, { slide: 950 });
    tone(1500, 0.08, 'sine', 0.08, { t: SND.ctx.currentTime + 0.06 });
  },
  exit() {
    [392, 494, 587].forEach((f, i) =>
      tone(f, 1, 'sine', 0.1, { t: SND.ctx.currentTime + i * 0.05, a: 0.05, rev: 0.5 })
    );
  },
  alert(x, y) {
    const s = at(x, y);
    tone(480, 0.16, 'square', 0.13 * s.vol + 0.04, { slide: 960, pan: s.pan, lp: 3000 });
    tone(1000, 0.22, 'sawtooth', 0.09 * s.vol + 0.03, {
      t: SND.ctx.currentTime + 0.07,
      pan: s.pan,
      lp: 2500
    });
  },
  voice(g, kind) {
    const s = at(g.x, g.y);
    if (G.d.quiet) {
      // the monks keep their vow: a breath, a hiss, a rap of knuckles
      noise(0.18, 0.08 * s.vol, 'bandpass', kind === 'body' ? 3200 : 2200, { pan: s.pan, q: 2 });
      return;
    }
    const sk = g.sk != null ? g.sk : 0.5,
      base = 95 + sk * 85,
      n = kind === 'body' ? 3 : kind === 'hear' ? 1 : 2,
      t0 = SND.ctx.currentTime;
    for (let i = 0; i < n; i++) {
      const f = base * (kind === 'body' ? 1.5 : 1) * (1 + (kind === 'lost' ? -i * 0.12 : i * 0.08)),
        t = t0 + i * 0.11;
      const os = SND.ctx.createOscillator(),
        fl = SND.ctx.createBiquadFilter(),
        gg = SND.ctx.createGain();
      os.type = kind === 'hear' ? 'triangle' : 'sawtooth';
      os.frequency.setValueAtTime(f, t);
      os.frequency.linearRampToValueAtTime(f * (kind === 'hear' ? 0.9 : 1.12), t + 0.09);
      fl.type = 'bandpass';
      fl.frequency.value = kind === 'body' ? 1100 : 650 + (i % 2) * 450;
      fl.Q.value = 4;
      gg.gain.setValueAtTime(0.0001, t);
      gg.gain.linearRampToValueAtTime(0.16 * s.vol, t + 0.015);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      os.connect(fl);
      fl.connect(gg);
      sout(gg, { pan: s.pan });
      os.start(t);
      os.stop(t + 0.12);
    }
  },
  stun(x, y) {
    const s = at(x, y);
    tone(150, 0.16, 'sine', 0.3 * s.vol, { slide: 60, pan: s.pan });
    noise(0.12, 0.15 * s.vol, 'lowpass', 1200, { pan: s.pan });
    for (let i = 0; i < 3; i++)
      tone(1200 + i * 300, 0.08, 'sine', 0.05 * s.vol, {
        t: SND.ctx.currentTime + 0.1 + i * 0.05,
        pan: s.pan
      });
  },
  takedown(x, y) {
    const s = at(x, y);
    tone(120, 0.18, 'sine', 0.38 * s.vol, { slide: 45, pan: s.pan });
    noise(0.1, 0.18 * s.vol, 'lowpass', 900, { pan: s.pan });
  },
  groan(x, y) {
    const s = at(x, y);
    tone(210, 0.4, 'sawtooth', 0.08 * s.vol, { slide: 120, lp: 600, pan: s.pan, a: 0.05 });
  },
  toll(x, y) {
    const s = at(x, y);
    bellTone(98, 0.28 * s.vol + 0.06, 2.6, { pan: s.pan, rev: 0.5 });
  },
  mark() {
    noise(0.5, 0.12, 'bandpass', 500, { f2: 2600, a: 0.3, rev: 0.3 });
  },
  blink(x, y) {
    const s = at(x, y);
    noise(0.3, 0.22 * s.vol, 'bandpass', 3000, { f2: 300, pan: s.pan });
    tone(1500, 0.25, 'sine', 0.12 * s.vol, { slide: 180, pan: s.pan });
  },
  bossdown() {
    const t = SND.ctx.currentTime;
    tone(80, 1.2, 'sine', 0.5, { slide: 28 });
    noise(1.2, 0.3, 'lowpass', 1800, { f2: 90 });
    [196, 233, 294].forEach((f, i) =>
      tone(f, 1.4, 'triangle', 0.1, { t: t + 0.3 + i * 0.05, a: 0.1, rev: 0.6 })
    );
  },
  vent(x, y) {
    const s = at(x, y);
    if (s.vol < 0.2) return;
    noise(0.55, 0.3 * s.vol, 'lowpass', 1800, { f2: 400, pan: s.pan, a: 0.04 });
    tone(70, 0.4, 'sine', 0.14 * s.vol, { pan: s.pan });
  },
  thunder() {
    noise(2, 0.5, 'lowpass', 500, { f2: 60, a: 0.12 });
    tone(48, 1.5, 'sine', 0.25, { a: 0.15 });
  },
  heart(a) {
    const v = 0.25 + 0.35 * a;
    tone(62, 0.16, 'sine', v, { slide: 38 });
    tone(58, 0.16, 'sine', v * 0.8, { slide: 36, t: SND.ctx.currentTime + 0.19 });
  },
  crackle() {
    noise(0.03, 0.1, 'highpass', 3000 + Math.random() * 2000);
  },
  caught() {
    const t = SND.ctx.currentTime;
    [440, 392, 349, 294].forEach((f, i) =>
      tone(f, 0.45, 'sawtooth', 0.1, { t: t + i * 0.16, lp: 1400, rev: 0.4 })
    );
    tone(70, 0.8, 'sine', 0.4, { t: t + 0.5, slide: 35 });
  },
  win() {
    const t = SND.ctx.currentTime;
    [
      [392, 0],
      [494, 0.14],
      [587, 0.28],
      [784, 0.46]
    ].forEach(([f, d]) => {
      tone(f, 0.7, 'sawtooth', 0.08, { t: t + d, lp: 1800, a: 0.03, rev: 0.4 });
      tone(f * 2, 0.9, 'sine', 0.05, { t: t + d, rev: 0.5 });
    });
    bellTone(1568, 0.05, 1.6, { t: t + 0.5, rev: 0.6 });
  },
  ending() {
    const t = SND.ctx.currentTime;
    [
      [294, 0],
      [370, 0.2],
      [440, 0.4],
      [587, 0.7],
      [740, 1]
    ].forEach(([f, d]) => {
      tone(f, 1.6, 'triangle', 0.1, { t: t + d, a: 0.05, rev: 0.7 });
      tone(f / 2, 1.8, 'sine', 0.08, { t: t + d, rev: 0.7 });
    });
  },
  talk(who, txt) {
    if (who === 'Tip') return SFX.tick();
    const f0 = { Shiloh: 300, Ashling: 200, Perrin: 340, Candlemaker: 118 }[who] || 240,
      n = Math.max(2, Math.min(5, ((txt || '').length / 12) | 0)),
      t0 = SND.ctx.currentTime;
    for (let i = 0; i < n; i++) {
      const f = f0 * (1 + Math.random() * 0.35),
        t = t0 + i * 0.075;
      tone(f, 0.06, who === 'Ashling' || who === 'Candlemaker' ? 'sawtooth' : 'triangle', 0.09, {
        t,
        lp: who === 'Ashling' ? 900 : 2200,
        a: 0.004
      });
    }
  }
};
function objectiveLater(d) {
  setTimeout(() => sfx('objective'), d * 1000);
}

/* ---------- music: a short generative theme per level that swells with suspicion ---------- */
const SC = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phryg: [0, 1, 4, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  harm: [0, 2, 3, 5, 7, 8, 11]
};
const TRACKS = {
  title: {
    root: 57,
    sc: SC.minor,
    bpm: 74,
    spb: 16,
    prog: [0, 5, 3, 4],
    pad: 'choir',
    lt: 'bell',
    perc: 'none',
    bass: 'x.......x.......',
    lead: ['7...9...a...9.7.', '8...7...5...7...', '7.5.7.9.8.....7.', '6...7...9.....5.']
  },
  l0: {
    root: 50,
    sc: SC.minor,
    bpm: 80,
    spb: 16,
    prog: [0, 0, 5, 4],
    pad: 'warm',
    lt: 'pluck',
    perc: 'soft',
    bass: 'x.....x.x.......',
    lead: ['....7.......5...', '..3.....5.......', '....7...9...7...', '......5.....3...']
  },
  l1: {
    root: 52,
    sc: SC.phryg,
    bpm: 112,
    spb: 12,
    prog: [0, 0, 3, 0],
    pad: 'warm',
    lt: 'saw',
    perc: 'waltz',
    bass: 'x...........',
    comp: '....x...x...',
    lead: ['7..9..a..9..', 'a..c..a..9..', '9..7..5..7..', '7..5..4.....']
  },
  l2: {
    root: 55,
    sc: SC.lydian,
    bpm: 92,
    spb: 16,
    prog: [0, 4, 5, 3],
    pad: 'choir',
    lt: 'harp',
    perc: 'soft',
    bass: 'x.......x.......',
    sea: true,
    lead: ['0.2.4.7.4.2.0.2.', '4.6.7.9.7.6.4.2.', '5.7.9.b.9.7.5.4.', '3.5.7.9.7.5.3.2.']
  },
  l3: {
    root: 50,
    sc: SC.dorian,
    bpm: 52,
    spb: 16,
    prog: [0, 3, 0, 4],
    pad: 'choir',
    lt: 'bell',
    perc: 'none',
    bass: 'x...............',
    lead: ['........7.......', '....5...........', '......9.........', '..........5.....']
  },
  l4: {
    root: 45,
    sc: SC.minor,
    bpm: 96,
    spb: 16,
    prog: [0, 0, 5, 4],
    pad: 'warm',
    lt: 'saw',
    perc: 'forge',
    bass: 'x.x.x.x.x.x.x.x.',
    forgeBass: true,
    lead: ['0...2...3...2...', '0...2...3.5.3...', '7...5...3...2...', '0.......2.3.....']
  },
  l5: {
    root: 59,
    sc: SC.minor,
    bpm: 104,
    spb: 12,
    prog: [0, 5, 3, 4],
    pad: 'strings',
    lt: 'strings',
    perc: 'waltz',
    bass: 'x...........',
    comp: '....x...x...',
    lead: ['7..9..a..9..', 'c..a..9..7..', '8..a..c..a..', '9..7..5.....']
  },
  l5r: {
    root: 47,
    sc: SC.minor,
    bpm: 58,
    spb: 12,
    prog: [0, 5, 3, 4],
    pad: 'choir',
    lt: 'bell',
    perc: 'none',
    bass: 'x...........',
    lead: ['7..........9', '........a...', '9...........', '....7.......']
  },
  l6: {
    root: 50,
    sc: SC.harm,
    bpm: 72,
    spb: 16,
    prog: [0, 5, 3, 4],
    pad: 'strings',
    lt: 'choir',
    perc: 'epic',
    bass: 'x.......x.......',
    lead: ['7.......8.......', 'a...9...8...7...', '7...8...a...c...', 'b...a...8.......']
  }
};
SND.setTrack = function (name) {
  if (!SND.ctx || SND.cur === name) return;
  const c = SND.ctx,
    t = c.currentTime;
  if (SND.tg) {
    const old = SND.tg;
    old.gain.cancelScheduledValues(t);
    old.gain.setTargetAtTime(0, t, 0.45);
    setTimeout(() => {
      try {
        old.disconnect();
      } catch (_) {}
    }, 3500);
  }
  SND.cur = name;
  SND.tk = name ? TRACKS[name] : null;
  if (!SND.tk) {
    SND.tg = null;
    return;
  }
  SND.tg = c.createGain();
  SND.tg.gain.value = 0;
  SND.tg.gain.setTargetAtTime(1, t, 0.7);
  SND.tg.connect(SND.musBus);
  SND.nextT = t + 0.2;
  SND.step = 0;
};
SND.pump = function () {
  const c = SND.ctx;
  if (!c || !SND.tk || SND.mode !== 0 || c.state !== 'running') {
    if (c) SND.nextT = c.currentTime + 0.1;
    return;
  }
  const tk = SND.tk,
    dur = 60 / tk.bpm / 4;
  try {
    while (SND.nextT < c.currentTime + 0.3) {
      schedStep(tk, SND.step, SND.nextT, dur);
      SND.nextT += dur;
      SND.step++;
    }
  } catch (e) {
    console.warn('music', e);
    SND.nextT = c.currentTime + 0.5;
  }
};
function schedStep(tk, step, t, dur) {
  const spb = tk.spb,
    sib = step % spb,
    bar = Math.floor(step / spb) % tk.prog.length,
    root = tk.prog[bar],
    I = SND.I,
    dest = SND.tg;
  const deg = (v) => tk.root + tk.sc[((v % 7) + 7) % 7] + 12 * Math.floor(v / 7);
  const barDur = dur * spb;
  if (sib === 0) {
    const notes = [deg(root) - 12, deg(root), deg(root + 2), deg(root + 4)];
    for (const m of notes) {
      const f = mf(m);
      if (tk.pad === 'warm') {
        tone(f, barDur + 0.4, 'sawtooth', 0.03, { t, a: 0.5, sus: true, lp: 650, dest, det: -6 });
        tone(f, barDur + 0.4, 'sawtooth', 0.03, { t, a: 0.5, sus: true, lp: 650, dest, det: 6 });
      } else if (tk.pad === 'choir') {
        tone(f, barDur + 0.5, 'sine', 0.05, { t, a: 0.9, sus: true, dest, rev: 0.7 });
        tone(f * 2, barDur + 0.5, 'triangle', 0.018, { t, a: 1.1, sus: true, dest, rev: 0.7 });
      } else {
        tone(f, barDur + 0.3, 'sawtooth', 0.032, {
          t,
          a: 0.35,
          sus: true,
          lp: 1100,
          dest,
          det: -5,
          rev: 0.3
        });
        tone(f, barDur + 0.3, 'sawtooth', 0.032, {
          t,
          a: 0.35,
          sus: true,
          lp: 1100,
          dest,
          det: 5,
          rev: 0.3
        });
      }
    }
    if (tk.sea) noise(barDur, 0.1, 'lowpass', 500, { f2: 1400, a: barDur * 0.5, dest, t });
    if (I > 0.65 && tk.perc !== 'none') {
      for (const m of [deg(root), deg(root + 4), deg(root) + 12])
        tone(mf(m), 0.55, 'sawtooth', 0.045 + I * 0.04, { t, a: 0.04, lp: 1400, dest, det: 3 });
    }
  }
  if (tk.bass[sib] === 'x') {
    const f = mf(deg(root) - 12);
    if (tk.forgeBass) tone(f, dur * 1.8, 'sawtooth', 0.12, { t, lp: 380, dest });
    else {
      tone(f, dur * 3, 'sine', 0.2, { t, dest });
      tone(f * 2, dur * 2, 'triangle', 0.05, { t, dest });
    }
  }
  if (tk.comp && tk.comp[sib] === 'x') {
    for (const m of [deg(root), deg(root + 2), deg(root + 4)])
      tone(mf(m + 12), dur * 2.2, 'sawtooth', 0.03, { t, lp: 1500, dest });
  }
  const ch = tk.lead[bar][sib];
  if (ch && ch !== '.') {
    const v = parseInt(ch, 16),
      f = mf(deg(v) + 12);
    if (tk.lt === 'pluck') {
      tone(f, 0.45, 'triangle', 0.15, { t, a: 0.004, dest, rev: 0.25 });
      tone(f * 2, 0.2, 'sine', 0.04, { t, dest });
    } else if (tk.lt === 'bell') bellTone(f, 0.1, 1.8, { t, dest, rev: 0.5 });
    else if (tk.lt === 'harp') {
      tone(f, 0.9, 'sine', 0.12, { t, a: 0.003, dest, rev: 0.4 });
      tone(f * 2, 0.4, 'sine', 0.04, { t, dest, rev: 0.4 });
    } else if (tk.lt === 'saw')
      tone(f, dur * 2.6, 'sawtooth', 0.07, { t, a: 0.01, lp: 1800, dest, rev: 0.15 });
    else if (tk.lt === 'strings') {
      tone(f, dur * 3, 'sawtooth', 0.05, { t, a: 0.08, lp: 1500, dest, det: -6, rev: 0.35 });
      tone(f, dur * 3, 'sawtooth', 0.05, { t, a: 0.08, lp: 1500, dest, det: 6, rev: 0.35 });
    } else {
      tone(f, 1.4, 'sine', 0.09, { t, a: 0.12, dest, rev: 0.7 });
      tone(f * 1.5, 1.2, 'triangle', 0.03, { t, a: 0.2, dest, rev: 0.7 });
    }
  }
  // percussion and tension layers grow with suspicion
  const P = tk.perc,
    vol = 0.12 + I * 0.2,
    kick = () => tone(125, 0.22, 'sine', vol * 1.8, { t, slide: 45, dest }),
    hat = () => noise(0.04, 0.05 + I * 0.05, 'highpass', 7000, { t, dest }),
    snare = () => {
      noise(0.12, 0.1 + I * 0.1, 'highpass', 1800, { t, dest });
      tone(190, 0.08, 'triangle', 0.08, { t, dest });
    },
    anvil = (v) => {
      for (const [r, vv] of [
        [620, 1],
        [1180, 0.6],
        [1710, 0.35]
      ])
        tone(r, 0.55, 'triangle', v * vv, { t, dest, rev: 0.2 });
      noise(0.03, v * 1.5, 'highpass', 4000, { t, dest });
    };
  if (P === 'soft') {
    if (I > 0.3 && (sib === 0 || sib === 8)) kick();
    if (I > 0.55 && sib % 4 === 2) hat();
    if (I > 0.7 && (sib === 4 || sib === 12)) snare();
  } else if (P === 'forge') {
    if (sib === 4 || sib === 12) anvil(0.06 + I * 0.08);
    if (I > 0.4 && (sib === 0 || sib === 8)) kick();
    if (I > 0.6 && sib % 4 === 2) hat();
  } else if (P === 'waltz') {
    if (I > 0.2 && sib === 0) kick();
    if (I > 0.45 && (sib === 4 || sib === 8)) hat();
  } else if (P === 'epic') {
    if (sib === 0 || sib === 8) tone(70, 0.5, 'sine', 0.12 + I * 0.2, { t, slide: 36, dest });
    if (I > 0.45 && (sib === 4 || sib === 12))
      tone(95, 0.35, 'sine', 0.1 + I * 0.12, { t, slide: 48, dest });
  }
  if (P === 'none' && I > 0.5 && sib === 0)
    tone(55, 0.9, 'sine', 0.1 + I * 0.1, { t, slide: 40, dest });
}
// every frame: pick the right track, follow suspicion, and play the stingers for screen changes
SND.sync = function () {
  if (!SND.ctx) return;
  if (mode !== SND.lastMode) {
    if (mode === 'win') sfx('win');
    else if (mode === 'lose') sfx('caught');
    else if (mode === 'end') sfx('ending');
    SND.lastMode = mode;
  }
  let name = null;
  if (mode === 'title' || mode === 'brief' || mode === 'court' || mode === 'end') name = 'title';
  else if ((mode === 'play' || mode === 'choice' || mode === 'pause') && G)
    name = G.d.timeshift && G.state === 'ruin' ? 'l5r' : 'l' + lvl;
  SND.setTrack(name);
  if (mode !== 'play') SND.fireG.gain.setTargetAtTime(0, SND.ctx.currentTime, 0.05);
  let target = 0;
  if (mode === 'play' && G) {
    target = Math.max(0, Math.min(1, (G.alert - 0.08) * 1.25));
    if (G.d.finale) target = Math.min(1, target + (5 - (G.candlesLit || 0)) * 0.1);
  }
  SND.I += (target - SND.I) * 0.05;
  if (SND.toastT > 0) SND.toastT -= fdt;
};
// gameplay sounds, found by watching what changed since the last frame
SND.watch = function (dt) {
  if (!SND.ctx) return;
  if (SND.prevG !== G) {
    SND.prevG = G;
    for (const it of G.items) it._s = it.done;
    for (const k in G.doors) G.doors[k]._s = G.doors[k].open;
    for (const v of G.vents) v._on = v.on;
    for (const g of G.guards) {
      g._see = false;
      g._stun = g.stun > 0;
      g._bk = g.bark;
      g._tl = false;
      g._bl = false;
    }
    G._gems = G.gems;
    G._act = G.active;
    G._sm = G.smoke.length;
    G._bell = G.gad.bell;
    G._flute = G.gad.flute;
    G._state = G.state;
    G._ex = false;
    G._fl = 0;
    return;
  }
  const A = G.active === 'shiloh' ? G.shiloh : G.ash;
  // footsteps and wing beats
  if (A.mv) {
    SND.stepT -= dt;
    if (SND.stepT <= 0) {
      if (G.flight) {
        sfx('flap');
        SND.stepT = 0.42;
      } else {
        sfx('step', G.sneak ? 0.3 : 1, A.x);
        SND.stepT = G.sneak ? 0.55 : G.active === 'shiloh' ? 0.34 : 0.27;
      }
    }
  } else SND.stepT = 0;
  // holding to pick, steal, snuff
  if (G.holdT && G.hold > 0) {
    SND.holdTk -= dt;
    if (SND.holdTk <= 0) {
      SND.holdTk = G.holdT.kind === 'door' ? 0.14 : 0.12;
      sfx('hold', G.holdT.kind, G.hold / G.holdT.need);
    }
  } else SND.holdTk = 0;
  // dragon fire
  const fire = G.active === 'ash' && fireHeld();
  SND.fireG.gain.setTargetAtTime(fire && SND.mode !== 2 ? 0.2 : 0, SND.ctx.currentTime, 0.05);
  if (fire) {
    SND.crackT -= dt;
    if (SND.crackT <= 0) {
      sfx('crackle');
      SND.crackT = 0.05 + Math.random() * 0.09;
    }
  }
  // objectives, doors, gems, gadgets
  for (const it of G.items) {
    if (it.type === 'g') continue;
    if (it.done && !it._s) {
      it._s = true;
      if (it.type === 'B') sfx('beacon');
      else if (it.type === 'O') {
        if (lvl === 0 && !G.d.song) sfx('egg');
        else if (G.d.song) sfx('objective');
        else sfx('paper');
      } else if (it.type === 'P') {
        if (G.flight || G.d.timeshift) sfx('paper');
        else sfx('poison');
      } else if (it.type === 'L') sfx('song');
      else if (it.type === 'H') sfx('free');
      else if (it.type === 'C') sfx('snuff');
      if (it.type !== 'O' || lvl !== 0) setTimeout(() => sfx('objective'), 120);
    }
  }
  for (const k in G.doors) {
    const d = G.doors[k];
    if (d.open && !d._s) {
      d._s = true;
      sfx('doorOpen', d.x * T + 16, d.y * T + 16);
    }
  }
  if (G.gems > G._gems) sfx('gem');
  G._gems = G.gems;
  if (G.smoke.length > G._sm) sfx('smoke');
  G._sm = G.smoke.length;
  if (G.gad.bell < G._bell) sfx('bell');
  G._bell = G.gad.bell;
  if (G.gad.flute < G._flute) sfx('flute');
  G._flute = G.gad.flute;
  if (G.state !== G._state) sfx('time');
  G._state = G.state;
  if (G.active !== G._act) sfx('swap');
  G._act = G.active;
  if (G.exitOpen && !G._ex) {
    G._ex = true;
    sfx('exit');
  }
  if (G.flash > G._fl) sfx('thunder');
  G._fl = G.flash;
  // vents
  for (const v of G.vents) {
    if (v.on && !v._on) sfx('vent', v.x * T + 16, v.y * T + 16);
    v._on = v.on;
  }
  // guards
  if (SND.alertCool > 0) SND.alertCool -= dt;
  for (const g of G.guards) {
    if (g.seeing && !g._see && SND.alertCool <= 0) {
      SND.alertCool = 0.7;
      sfx('alert', g.x, g.y);
    }
    g._see = g.seeing;
    const st = g.stun > 0;
    if (st && !g._stun && !g.boss)
      sfx(G.holdT && G.holdT.ref === g ? 'takedown' : 'stun', g.x, g.y);
    else if (!st && g._stun && !g.dead && !g.boss) sfx('groan', g.x, g.y);
    g._stun = st;
    if (g.bark && g.bark !== g._bk && !g.boss) sfx('voice', g, g.bark.kind);
    g._bk = g.bark;
    if (g.boss) {
      if (g.toll > 0 && !g._tl) sfx('toll', g.x, g.y);
      g._tl = g.toll > 0;
      if (g.blink && !g._bl) sfx('mark');
      if (!g.blink && g._bl) sfx('blink', g.x, g.y);
      g._bl = !!g.blink;
      if (g.dead && !g._dd) {
        g._dd = true;
        sfx('bossdown');
      }
    }
  }
  // the heartbeat quickens as you are about to be caught
  if (G.alert > 0.55) {
    SND.hbT -= dt;
    if (SND.hbT <= 0) {
      sfx('heart', G.alert);
      SND.hbT = 0.95 - 0.5 * Math.min(1, G.alert);
    }
  } else SND.hbT = 0;
};
function drawSoundIcon() {
  const x = 780,
    y = 15,
    m = SND.mode;
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,40,.8)';
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#e8c870';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = m === 2 ? '#8a7a9a' : '#f3e6cc';
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 2.2);
  ctx.lineTo(x - 3.4, y - 2.2);
  ctx.lineTo(x + 0.4, y - 5.5);
  ctx.lineTo(x + 0.4, y + 5.5);
  ctx.lineTo(x - 3.4, y + 2.2);
  ctx.lineTo(x - 6, y + 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = m === 2 ? '#8a7a9a' : '#f3e6cc';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (m === 2) {
    ctx.moveTo(x + 3, y - 3);
    ctx.lineTo(x + 8, y + 3);
    ctx.moveTo(x + 8, y - 3);
    ctx.lineTo(x + 3, y + 3);
  } else {
    ctx.arc(x + 0.4, y, 3.8, -0.9, 0.9);
    if (m === 0)
      (ctx.moveTo(x + 0.4 + 7.4 * Math.cos(-0.85), y + 7.4 * Math.sin(-0.85)),
        ctx.arc(x + 0.4, y, 7.4, -0.85, 0.85));
  }
  ctx.stroke();
  if (SND.toastT > 0) {
    ctx.globalAlpha = Math.min(1, SND.toastT);
    ctx.font = 'bold 12px "IM Fell English",Georgia';
    ctx.textAlign = 'right';
    const w = ctx.measureText(SND.toast).width + 16;
    ctx.fillStyle = 'rgba(20,10,40,.88)';
    rrect(792 - w, 32, w, 20, 6);
    ctx.fill();
    ctx.strokeStyle = '#e8c870';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f3e6cc';
    ctx.fillText(SND.toast, 784, 46);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
