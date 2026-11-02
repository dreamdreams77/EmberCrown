const test = require('node:test');
const assert = require('node:assert/strict');
const { open, POINTER_HELPER } = require('./helpers');

// The sound is synthesized, so we can check it without listening: the engine's
// analyser shows whether signal is coming out, and a spy shows which effects fire.
test('audio', async (t) => {
  const { page, problems, close } = await open({ audio: true, touch: true });
  t.after(close);
  await page.evaluate(POINTER_HELPER);

  const peak = () =>
    page.evaluate(async () => {
      let top = 0;
      for (let i = 0; i < 20; i++) {
        const a = new Float32Array(1024);
        SND.an.getFloatTimeDomainData(a);
        top = Math.max(top, Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length));
        await new Promise((r) => setTimeout(r, 50));
      }
      return top;
    });

  await t.test('audio stays off until the first key press, then music starts', async () => {
    assert.equal(await page.evaluate(() => !!SND.ctx), false);
    await page.keyboard.press('Shift');
    await page.waitForTimeout(1800);
    assert.equal(await page.evaluate(() => SND.ctx.state), 'running');
    assert.equal(await page.evaluate(() => SND.cur), 'title');
    assert.ok((await peak()) > 0.003, 'title music is audible');
  });

  await t.test('every sound effect runs without errors', async () => {
    const failures = await page.evaluate(() => {
      lvl = 1;
      startPlay();
      const g = G.guards[0];
      g.sk = 0.4;
      const args = {
        step: [1, 100],
        hold: ['item', 0.5],
        doorOpen: [100, 100],
        alert: [100, 100],
        voice: [g, 'Man down!'],
        stun: [100, 100],
        takedown: [100, 100],
        groan: [100, 100],
        toll: [100, 100],
        blink: [100, 100],
        vent: [100, 100],
        heart: [0.8],
        talk: ['Ashling', 'Barbecue time. Burn it.']
      };
      const bad = [];
      for (const k in SFX) {
        try {
          SFX[k](...(args[k] || []));
        } catch (e) {
          bad.push(k + ': ' + e.message);
        }
      }
      return bad;
    });
    assert.deepEqual(failures, []);
    await page.waitForTimeout(400);
    assert.ok((await peak()) > 0.02, 'effects are audible');
  });

  await t.test('every track schedules notes', async () => {
    const result = await page.evaluate(async () => {
      const out = {};
      for (const n of Object.keys(TRACKS)) {
        SND.setTrack(n);
        SND.I = 0.9;
        await new Promise((r) => setTimeout(r, 400));
        out[n] = SND.step > 0;
      }
      return out;
    });
    for (const [name, ok] of Object.entries(result)) assert.ok(ok, name + ' did not play');
  });

  await t.test('M cycles all sound, effects only, off, and the choice is remembered', async () => {
    const seen = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('m');
      await page.waitForTimeout(500);
      seen.push({
        mode: await page.evaluate(() => SND.mode),
        music: await page.evaluate(() => SND.musBus.gain.value),
        master: await page.evaluate(() => SND.master.gain.value),
        level: await peak()
      });
    }
    assert.deepEqual(
      seen.map((s) => s.mode),
      [1, 2, 0]
    );
    // effects only keeps the effects channel open but closes the music channel
    assert.ok(seen[0].music < 0.02 && seen[0].master > 0.9, 'effects only: music channel closed');
    // off closes everything, so the output is silent
    assert.ok(seen[1].master < 0.02 && seen[1].level < 0.0005, 'off: silent');
    assert.ok(seen[2].music > 0.4 && seen[2].level > 0.003, 'on again: music audible');
    assert.equal(await page.evaluate(() => localStorage.getItem('ec_snd')), '0');
    await page.keyboard.press('m');
    assert.equal(await page.evaluate(() => localStorage.getItem('ec_snd')), '1');
    await page.keyboard.press('m');
    await page.keyboard.press('m');
  });

  await t.test('the corner speaker icon toggles sound by touch', async () => {
    const r = await page.evaluate(() => {
      const before = SND.mode;
      P('down', 1, 780, 15);
      P('up', 1, 780, 15);
      return [before, SND.mode];
    });
    assert.deepEqual(r, [0, 1]);
    await page.keyboard.press('m');
    await page.keyboard.press('m');
  });

  await t.test('gameplay events trigger the right sounds', async () => {
    const heard = await page.evaluate(() => {
      const log = [];
      for (const k of Object.keys(SFX)) {
        const f = SFX[k];
        SFX[k] = (...a) => {
          log.push(k);
          return f(...a);
        };
      }
      SND.mode = 0;
      SND.applyMode();
      const step = (n) => {
        for (let i = 0; i < n; i++) update(1 / 60);
      };
      const heard = {};
      const record = (name) => {
        heard[name] = [...new Set(log)].join(',');
        log.length = 0;
      };
      const scene = (L) => {
        lvl = L;
        startPlay();
        mode = 'paused';
        G.rangeMul = 0;
        step(2);
        log.length = 0;
      };
      scene(1);
      keys.d = true;
      step(70);
      keys.d = false;
      record('walk');
      const d = Object.values(G.doors)[0];
      G.shiloh.x = d.x * 32 + 16 - 20;
      G.shiloh.y = d.y * 32 + 16;
      keys.e = true;
      step(80);
      keys.e = false;
      record('lock');
      const gem = G.items.find((i) => i.type === 'g');
      G.shiloh.x = gem.x;
      G.shiloh.y = gem.y;
      step(3);
      record('gem');
      playPress('q');
      step(3);
      record('smoke');
      playPress('r');
      step(3);
      record('bell');
      G.ash.on = true;
      playPress('tab');
      step(3);
      record('swap');
      for (const [name, L, type] of [
        ['egg', 0, 'O'],
        ['beacon', 0, 'B'],
        ['seal', 1, 'O'],
        ['poison', 1, 'P'],
        ['song', 3, 'L'],
        ['freed', 4, 'H'],
        ['snuff', 6, 'C']
      ]) {
        scene(L);
        G.items.find((i) => i.type === type).done = true;
        step(2);
        record(name);
      }
      scene(3);
      G.boss.toll = 0.9;
      step(2);
      record('toll');
      G.boss.dead = true;
      step(2);
      record('bossdown');
      scene(2);
      G.flashT = 0;
      step(3);
      record('thunder');
      mode = 'win';
      SND.sync();
      record('win');
      mode = 'lose';
      SND.sync();
      record('caught');
      return heard;
    });
    const expect = {
      walk: 'step',
      lock: 'doorOpen',
      gem: 'gem',
      smoke: 'smoke',
      bell: 'bell',
      swap: 'swap',
      egg: 'egg',
      beacon: 'beacon',
      seal: 'paper',
      poison: 'poison',
      song: 'song',
      freed: 'free',
      snuff: 'snuff',
      toll: 'toll',
      bossdown: 'bossdown',
      thunder: 'thunder',
      win: 'win',
      caught: 'caught'
    };
    for (const [name, sound] of Object.entries(expect)) {
      assert.ok(
        heard[name].split(',').includes(sound),
        `${name}: expected ${sound}, heard "${heard[name]}"`
      );
    }
  });

  assert.deepEqual(problems, []);
});
