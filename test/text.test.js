const test = require('node:test');
const assert = require('node:assert/strict');
const { open } = require('./helpers');

// Every string the game draws (menus, dialogue, barks, endings) plus the level text.
test('text: no dash punctuation, and the hero is called Shiloh everywhere', async (t) => {
  const { page, close } = await open();
  t.after(close);

  const { strings } = await page.evaluate(() => {
    const seen = new Set();
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
      seen.add(String(text));
      return fillText.call(this, text, ...rest);
    };
    for (let d = 0; d < 3; d++) {
      diff = d;
      mode = 'title';
      draw();
    }
    mode = 'court';
    draw();
    for (let L = 0; L < 7; L++) {
      lvl = L;
      houses.grell.favor = 1;
      startBrief(L);
      draw();
      startPlay();
      G.ash.on = true;
      for (const k of ['q', 'r', 'f', 'tab']) playPress(k);
      for (const it of G.items) {
        if ('OPBLHC'.includes(it.type)) completeTarget({ kind: 'item', ref: it });
      }
      if (G.boss) G.boss.dead = true;
      for (let i = 0; i < 12; i++) {
        update(1 / 60);
        draw();
      }
      for (const m of ['choice', 'win', 'lose', 'end']) {
        mode = m;
        G.choice = G.choice || 'return';
        if (m === 'win' || m === 'end') applyOutcome();
        draw();
      }
      mode = 'play';
    }
    for (const choice of ['puppet', 'burn', 'break']) {
      const e = finaleEnding(choice);
      e.lines.forEach((l) => seen.add(l));
      seen.add(e.title);
    }
    for (const l of LEVELS) {
      l.intro.forEach((x) => seen.add(x));
      seen.add(l.opening);
      Object.values(l.labels).forEach((x) => seen.add(x));
    }
    return { strings: [...seen] };
  });

  assert.ok(strings.length > 200, 'collected ' + strings.length + ' strings');
  const dashes = strings.filter((s) => /[\u2010-\u2015\u2212]| - |--/.test(s));
  assert.deepEqual(dashes, []);
  assert.deepEqual(
    strings.filter((s) => /Wren/.test(s)),
    []
  );
  assert.ok(strings.some((s) => /Shiloh/.test(s)));
});
