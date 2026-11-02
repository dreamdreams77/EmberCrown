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
  if (lvl === 0) add('marrow', 'fear', 1, 'The thief who walked through their keep.');
  else if (lvl === 1) {
    if (perk === 'bribe') add('grell', 'favor', 1, 'The steward remembers your coin.');
    else if (perk === 'blackmail')
      add('grell', 'fear', 1, 'The chamberlain keeps your secret, for now.');
    else add('grell', 'ruin', 1, 'Grell wakes to a signature he does not remember.');
  } else if (lvl === 2) {
    add('ostrander', 'fear', 1, 'The beacons went dark in one night.');
    add('ostrander', 'ruin', 1, 'Forged letters turn their house on itself.');
  } else if (lvl === 3) {
    add('sable', 'fear', 1, 'The ledger names every bribe they took.');
    add('sable', 'ruin', 1, 'Their Bell-Warden is silenced.');
  } else if (lvl === 4) {
    add('kest', 'fear', 1, 'Their prize hostage walked out of Ironvale.');
    if (G.choice === 'return') add('ostrander', 'favor', 1, 'Their heir comes home, unharmed.');
    else add('ostrander', 'fear', 1, 'You hold their heir over their heads.');
  } else if (lvl === 5) {
    add('dunmoor', 'ruin', 1, 'The forged treaty is now the first page of their war.');
    add('dunmoor', 'fear', 1, "Veyra's signet is in your pocket.");
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
    return {
      title: 'Ending: The Puppet Crown',
      col: '#c8b4ff',
      lines: [
        'House ' +
          HOUSE_NAMES[best] +
          ' wears the crown, and every string runs back to the Hollow Crown.',
        R.e >= 4
          ? 'The houses obey because they are afraid, not because they agree.'
          : 'The houses go along with it. Peace holds, for now.',
        R.f >= 2
          ? 'A few of them even thank you. Shiloh does not sleep well anyway.'
          : 'Shiloh holds the strings and does not sleep well.'
      ],
      sum: 'House ' + HOUSE_NAMES[best] + ': crowned, +1 Fear.'
    };
  }
  if (choice === 'burn') {
    for (const k of keys) houses[k].ruin += 1;
    return {
      title: 'Ending: Ash and Ember',
      col: '#ff9a4a',
      lines: [
        'Ashling burns the throne to slag, and then, with enthusiasm, the hall.',
        R.r >= 4
          ? 'The houses you ruined along the way have nothing left to rebuild with. The marsh smolders for a generation.'
          : 'The houses are bruised, not broken. They rebuild fast, and find a new throne by spring.',
        'Ashling: In my defense, it was very flammable.'
      ],
      sum: 'Every house: +1 Ruin.'
    };
  }
  for (const k of keys) houses[k].favor += 1;
  return {
    title: 'Ending: The Broken Throne',
    col: '#7be08a',
    lines: [
      'Ashling, full grown, shatters the throne. No crown is left to fight over.',
      R.f >= 3
        ? 'The houses you helped meet in the rubble and draft a charter. It holds.'
        : 'The houses scramble for order. It is a hard winter, but nobody has a crown to steal.',
      'Shiloh sends one last letter. This time she knows what it says.'
    ],
    sum: 'Every house: +1 Favor.'
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
