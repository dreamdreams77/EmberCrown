// Game state, house reputation (Favor / Fear / Ruin), mission outcomes, endings, difficulty.
'use strict';

let mode = 'title',
  lvl = 0,
  perk = null,
  G = null,
  diff = 1;
const HOUSE_NAMES = {
  marrow: 'Marrow',
  grell: 'Grell',
  ostrander: 'Ostrander',
  sable: 'Sable',
  kest: 'Kest',
  dunmoor: 'Dunmoor'
};
let houses = {};
function resetHouses() {
  houses = {};
  for (const k in HOUSE_NAMES) houses[k] = { favor: 0, fear: 0, ruin: 0 };
}
resetHouses();
function rep() {
  let f = 0,
    e = 0,
    r = 0;
  for (const k in houses) {
    f += houses[k].favor;
    e += houses[k].fear;
    r += houses[k].ruin;
  }
  return {
    f,
    e,
    r,
    decay: 1 + 0.1 * Math.min(f, 4),
    sight: Math.max(0.8, 1 - 0.03 * e),
    gain: 1 + 0.05 * e,
    fled: Math.floor(r / 2),
    chaos: 1 + 0.05 * r
  };
}
function applyOutcome() {
  const L = [];
  const add = (h, t, n, msg) => {
    houses[h][t] += n;
    L.push(
      'House ' + HOUSE_NAMES[h] + ': +' + n + ' ' + t[0].toUpperCase() + t.slice(1) + '. ' + msg
    );
  };
  const entry = (key) => {
    const [h, t, msg] = TEXT.ledger[key];
    add(h, t, 1, msg);
  };
  if (lvl === 0) entry('marrow');
  else if (lvl === 1)
    entry(
      perk === 'bribe' ? 'grellBribe' : perk === 'blackmail' ? 'grellBlackmail' : 'grellPoison'
    );
  else if (lvl === 2) {
    entry('ostranderFear');
    entry('ostranderRuin');
  } else if (lvl === 3) {
    entry('sableFear');
    entry('sableRuin');
  } else if (lvl === 4) {
    entry('kest');
    entry(G.choice === 'return' ? 'ostranderHome' : 'ostranderKept');
  } else if (lvl === 5) {
    entry('dunmoorRuin');
    entry('dunmoorFear');
  } else if (lvl === 6) {
    G.ending = finaleEnding(G.choice);
    L.push(G.ending.sum);
  }
  G.outLines = L;
}
function houseCounts() {
  let f = 0,
    e = 0,
    r = 0;
  for (const k in houses) {
    if (houses[k].favor > 0) f++;
    if (houses[k].fear > 0) e++;
    if (houses[k].ruin > 0) r++;
  }
  return { f, e, r };
}
function finaleEnding(choice) {
  const R = rep(),
    keys = Object.keys(houses);
  if (choice === 'puppet') {
    const T0 = TEXT.endings.puppet;
    let best = keys[0],
      bs = -1;
    for (const k of keys) {
      const s = houses[k].fear * 2 + houses[k].favor;
      if (s > bs) {
        bs = s;
        best = k;
      }
    }
    houses[best].fear += 1;
    const v = { house: HOUSE_NAMES[best] };
    return {
      title: T0.title,
      col: '#c8b4ff',
      lines: [
        fill(T0.first, v),
        R.e >= 4 ? T0.afraid : T0.calm,
        R.f >= 2 ? T0.thanked : T0.alone,
        T0.quill
      ],
      sum: fill(T0.summary, v)
    };
  }
  if (choice === 'burn') {
    const T0 = TEXT.endings.burn;
    for (const k of keys) houses[k].ruin += 1;
    return {
      title: T0.title,
      col: '#ff9a4a',
      lines: [T0.first, ...(R.r >= 4 ? T0.ruined : [T0.bruised]), T0.joke, T0.quill],
      sum: T0.summary
    };
  }
  const T0 = TEXT.endings.break;
  for (const k of keys) houses[k].favor += 1;
  return {
    title: T0.title,
    col: '#7be08a',
    lines: [T0.first, ...(R.f >= 3 ? T0.helped : T0.scramble), T0.last],
    sum: T0.summary
  };
}
function finishLevel() {
  mode = 'win';
  applyOutcome();
}
const DIFFS = [
  {
    name: 'Courier',
    range: 1,
    decay: 1.3,
    smoke: 1,
    bell: 1,
    flute: 0,
    blurb: 'Gentler guards, extra gadgets'
  },
  {
    name: 'Spy',
    range: 1.1,
    decay: 1,
    smoke: 0,
    bell: 0,
    flute: 0,
    blurb: 'The intended experience'
  },
  {
    name: 'Shadow',
    range: 1.2,
    decay: 0.7,
    smoke: -1,
    bell: -1,
    flute: -1,
    blurb: 'Sharper eyes, slow recovery, no flute'
  }
];
const stats = { gems: 0, caught: 0, time: 0, byLvl: [] };
const TOTAL_GEMS = LEVELS.reduce((s, l) => s + l.map.join('').split('g').length - 1, 0);
const BREAK_GEMS = Math.round(TOTAL_GEMS * 0.6);
const keys = {};
