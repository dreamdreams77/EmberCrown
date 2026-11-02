const test = require('node:test');
const assert = require('node:assert/strict');
const { open } = require('./helpers');

// Random keys, gadgets, fire and time shifts in every mission at every difficulty.
// Looks for exceptions, runaway particles, and characters leaving the map.
test('fuzz: random input in every mission and difficulty', async (t) => {
  const { page, problems, close } = await open({ audio: true });
  t.after(close);
  await page.keyboard.press('Shift'); // start the audio engine too, so sound code is fuzzed as well

  const bad = await page.evaluate(() => {
    const bad = [];
    let seed = 1;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const names = ['w', 'a', 's', 'd', 'shift', 'e', ' ', 'arrowup', 'arrowleft'];
    for (let d = 0; d < 3; d++) {
      for (let L = 0; L < 7; L++) {
        diff = d;
        lvl = L;
        startPlay();
        if (L > 0) G.ash.on = true;
        for (let f = 0; f < 1800; f++) {
          if (f % 25 === 0) for (const k of names) keys[k] = rnd() < 0.35;
          if (f % 90 === 0) playPress(['tab', 'q', 'r', 'f'][(rnd() * 4) | 0]);
          if (f % 400 === 0 && G.d.timeshift && G.peds[0]) {
            G.shiloh.x = G.peds[0].x;
            G.shiloh.y = G.peds[0].y;
            G.active = 'shiloh';
            playPress('f');
          }
          update(1 / 60);
          if (f % 300 === 0) draw();
          if (mode !== 'play') {
            mode = 'play';
            G.alert = 0;
          }
          const everyone = [G.shiloh, G.ash, ...G.guards, ...(G.host ? [G.host] : [])];
          for (const e of everyone) {
            if (
              !isFinite(e.x) ||
              !isFinite(e.y) ||
              e.x < -50 ||
              e.x > 850 ||
              e.y < -50 ||
              e.y > 530
            ) {
              bad.push(`diff ${d} mission ${L} frame ${f}: position ${e.x},${e.y}`);
              break;
            }
          }
          if (!isFinite(G.alert)) bad.push(`diff ${d} mission ${L}: alert is ${G.alert}`);
          if (G.parts.length > 800) bad.push(`diff ${d} mission ${L}: ${G.parts.length} particles`);
          if (bad.length > 5) return bad;
        }
        for (const k in keys) keys[k] = false;
      }
    }
    return bad;
  });
  assert.deepEqual(bad, []);
  assert.deepEqual(problems, []);
});
