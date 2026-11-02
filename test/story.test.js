const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { open, POINTER_HELPER } = require('./helpers');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');

test('story text is complete and fits the screen', async (t) => {
  const { page, problems, close } = await open({ touch: true });
  t.after(close);
  await page.evaluate(POINTER_HELPER);

  await t.test('every line the code asks for exists in text.js', async () => {
    const wanted = new Set();
    for (const f of fs.readdirSync(path.join(__dirname, '..', 'js'))) {
      for (const m of read(f).matchAll(/TEXT\.(lines|ledger)\.(\w+)/g))
        wanted.add(m[1] + '.' + m[2]);
    }
    for (const m of read('story.js').matchAll(/entry\('(\w+)'/g)) wanted.add('ledger.' + m[1]);
    const missing = await page.evaluate(
      (list) =>
        list.filter((k) => {
          const [group, key] = k.split('.');
          return TEXT[group][key] === undefined;
        }),
      [...wanted]
    );
    assert.ok(wanted.size > 30, 'found ' + wanted.size + ' references');
    assert.deepEqual(missing, []);
  });

  await t.test('every mission has barks of every kind, and they stay in the mission', async () => {
    const r = await page.evaluate(() => {
      const bad = [];
      LEVELS.forEach((l, i) => {
        for (const k of ['lure', 'lost', 'body', 'hear', 'wake']) {
          if (!l.barks || !l.barks[k]) bad.push(`mission ${i} lacks ${k}`);
        }
      });
      // a guard's bark comes from its own house
      const seen = {};
      for (const L of [0, 1, 3]) {
        lvl = L;
        startPlay();
        const g = G.guards[0];
        bark(g, 'lure');
        seen[L] = g.bark.text;
        if (![].concat(G.d.barks.lure).includes(g.bark.text))
          bad.push('bark not from mission ' + L);
        if (g.bark.kind !== 'lure') bad.push('bark kind lost');
      }
      return { bad, seen };
    });
    assert.deepEqual(r.bad, []);
    assert.ok(r.seen[3].startsWith('*'), 'the monks mime: ' + r.seen[3]);
  });

  await t.test('lines are short enough for the screen', async () => {
    const r = await page.evaluate(() => {
      const bad = [];
      const flat = (v) => (typeof v === 'string' ? [v] : [v.keys, v.touch]);
      TEXT.levels.forEach((l, i) => {
        l.intro
          .flatMap(flat)
          .forEach((s) => s.length > 92 && bad.push(`intro ${i}: ${s.length} ${s}`));
        if (l.opening.length > 80) bad.push('opening ' + i);
        Object.values(l.labels).forEach((s) => s.length > 26 && bad.push('label ' + s));
      });
      for (const [k, v] of Object.entries(TEXT.lines)) {
        const strings = Array.isArray(v) ? v : flat(v);
        strings.forEach((s) => s.length > 90 && bad.push(`line ${k}: ${s.length}`));
      }
      return bad;
    });
    assert.deepEqual(r, []);
  });

  await t.test('no screen draws a line wider than its plaque', async () => {
    const wide = await page.evaluate(() => {
      const bad = [];
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, x, ...rest) {
        if (this.textAlign === 'center' && x === 400 && this.measureText(text).width > 690) {
          bad.push(Math.round(this.measureText(text).width) + ' ' + text);
        }
        return fillText.call(this, text, x, ...rest);
      };
      houses.grell.favor = 2;
      houses.kest.fear = 3;
      houses.sable.ruin = 2;
      for (let L = 0; L < 7; L++) {
        lvl = L;
        startBrief(L);
        draw();
      }
      for (let L = 0; L < 6; L++) {
        lvl = L;
        mode = 'court';
        draw();
        mode = 'brief';
        draw();
      }
      mode = 'pause';
      draw();
      for (casePage = 0; casePage < CASE_PAGES; casePage++) {
        mode = 'casefile';
        draw();
      }
      houses.grell.favor = 1;
      stats.cleared = [0, 1, 2, 3, 4, 5, 6];
      perks = { 1: 0, 2: 1, 3: 2, 4: 0, 5: 1, 6: 2 };
      for (casePage = 0; casePage < CASE_PAGES; casePage++) {
        mode = 'casefile';
        draw();
      }
      lvl = 6;
      startPlay();
      for (const ending of ['puppet', 'burn', 'break']) {
        G.choice = ending;
        houses.marrow.ruin = 5;
        mode = 'win';
        applyOutcome();
        mode = 'end';
        draw();
      }
      mode = 'choice';
      draw();
      G.d.finale = false;
      draw();
      return bad;
    });
    assert.deepEqual(wide, []);
  });

  await t.test('the egg scene plays out in order: Shiloh, Ashling, then the tip', async () => {
    const heard = await page.evaluate(() => {
      lvl = 0;
      startPlay();
      mode = 'paused';
      G.rangeMul = 0;
      G.msgT = 0;
      const order = [];
      const egg = G.items.find((i) => i.type === 'O');
      completeTarget({ kind: 'item', ref: egg });
      order.push(G.msg.who);
      let last = G.msg.who;
      for (let f = 0; f < 60 * 8; f++) {
        update(1 / 60);
        if (G.msg.who !== last) {
          order.push(G.msg.who);
          last = G.msg.who;
        }
      }
      return order;
    });
    assert.deepEqual(heard, ['Shiloh', 'Ashling', 'Tip']);
  });

  await t.test('the letter drops, the signet and the Candlemaker speak in sequence', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      lvl = 2;
      startPlay();
      mode = 'paused';
      G.msgT = 0;
      const [a, b] = G.items.filter((i) => i.type === 'P');
      a.done = true;
      completeTarget({ kind: 'item', ref: a });
      out.first = G.msg.text;
      b.done = true;
      completeTarget({ kind: 'item', ref: b });
      out.second = G.msg.text;

      lvl = 5;
      startPlay();
      mode = 'paused';
      G.state = 'ruin';
      const signet = G.items.find((i) => i.type === 'O');
      completeTarget({ kind: 'item', ref: signet });
      out.signet = G.msg.text;
      for (let f = 0; f < 60 * 4; f++) update(1 / 60);
      out.after = G.msg.text;

      lvl = 6;
      startPlay();
      mode = 'paused';
      G.rangeMul = 0;
      G.ash.on = true;
      G.active = 'ash';
      for (const it of G.items) if (it.type === 'C') it.done = true;
      const B = G.boss;
      B.x = 12 * 32 + 16;
      B.y = 10 * 32 + 16;
      B.face = 0;
      B.pause = 999;
      B.blinkT = 99;
      B.hp = 0.1;
      G.ash.x = B.x - 40;
      G.ash.y = B.y;
      G.ash.face = 0;
      G.fireSaid = true; // the first-flame quip would otherwise talk over him
      keys[' '] = true;
      const said = [];
      let last = '';
      for (let f = 0; f < 60 * 9; f++) {
        update(1 / 60);
        if (G.msg && G.msg.text !== last && G.msg.who === 'Candlemaker') {
          said.push(G.msg.text);
          last = G.msg.text;
        }
      }
      keys[' '] = false;
      out.dying = said;
      return out;
    });
    assert.match(r.first, /receipt book/);
    assert.match(r.second, /Seven receipts/);
    assert.match(r.signet, /Do nothing until the treaty is found/);
    assert.match(r.after, /I planted that treaty/);
    assert.deepEqual(r.dying, [
      'Burn it and she rebuilds.',
      'Crown it and she holds the strings.',
      'Break it, and she has nothing to hold.'
    ]);
  });

  await t.test('instructions use keyboard or touch wording to suit the player', async () => {
    const r = await page.evaluate(() => {
      const hint = TEXT.levels[1].intro[3];
      TOUCH.used = false;
      const keys = lineText(hint);
      TOUCH.used = true;
      const touch = lineText(hint);
      TOUCH.used = false;
      return { keys, touch };
    });
    assert.match(r.keys, /TAB\./);
    assert.match(r.touch, /TAB button/);
  });

  await t.test('menu taps still land on the right option after the rewrite', async () => {
    const r = await page.evaluate(() => {
      lvl = 0;
      mode = 'court';
      draw();
      const y = 154 + 3 * 25.5; // the second option
      P('down', 1, 400, y);
      P('up', 1, 400, y);
      return { second: perks[1], mode };
    });
    assert.equal(r.second, 1);
    assert.equal(r.mode, 'brief');
  });

  await t.test('the caught screen shows one of the written pairs', async () => {
    const ok = await page.evaluate(() => {
      lvl = 1;
      startPlay();
      G.alert = 2;
      update(0.1);
      draw();
      return mode === 'lose' && TEXT.caught[G.caughtPick] !== undefined;
    });
    assert.equal(ok, true);
  });

  assert.deepEqual(problems, []);
});
