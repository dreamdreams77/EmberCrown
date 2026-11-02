const test = require('node:test');
const assert = require('node:assert/strict');
const { open } = require('./helpers');

// Each case sets up a mission, steps the simulation by hand (mode 'paused' keeps the
// real-time loop out of the way), and checks the rule the playbook promises.
test('stealth and combat rules', async (t) => {
  const { page, problems, close } = await open();
  t.after(close);
  await page.evaluate(() => {
    window.step = (n) => {
      for (let i = 0; i < n; i++) update(1 / 60);
    };
    window.setup = (L) => {
      lvl = L;
      startPlay();
      mode = 'paused';
      G.msgT = 0;
    };
  });

  await t.test('sneaking up behind a guard and holding E knocks them out', async () => {
    const stunned = await page.evaluate(() => {
      setup(1);
      const g = G.guards[0];
      g.pause = 99;
      g.scan = null;
      g.face = 0;
      G.shiloh.x = g.x - 20;
      G.shiloh.y = g.y;
      keys.e = true;
      keys.shift = true;
      step(45);
      keys.e = keys.shift = false;
      return g.stun > 0;
    });
    assert.equal(stunned, true);
  });

  await t.test('a guard who sees a fallen comrade raises suspicion and goes to check', async () => {
    const r = await page.evaluate(() => {
      setup(1);
      const down = G.guards[0];
      down.stun = 20;
      const watcher = G.guards[1];
      watcher.x = down.x + 60;
      watcher.y = down.y;
      watcher.face = Math.PI;
      watcher.pause = 5;
      watcher.scan = null;
      G.shiloh.x = 40;
      G.shiloh.y = 40;
      const before = G.alert;
      step(2);
      return { found: down.found, jump: G.alert - before, investigating: !!watcher.lure };
    });
    assert.equal(r.found, true);
    assert.ok(r.jump > 0.15, 'suspicion jump ' + r.jump);
    assert.equal(r.investigating, true);
  });

  await t.test('running turns heads, sneaking does not', async () => {
    const r = await page.evaluate(() => {
      const trial = (sneak) => {
        setup(1);
        const g = G.guards[2];
        g.pause = 99;
        g.scan = null;
        g.face = 0;
        G.shiloh.x = g.x - 50;
        G.shiloh.y = g.y;
        keys.d = true;
        keys.shift = sneak;
        step(12);
        keys.d = keys.shift = false;
        return Math.abs(g.face) > 2;
      };
      return { run: trial(false), sneak: trial(true) };
    });
    assert.deepEqual(r, { run: true, sneak: false });
  });

  await t.test('a guard who loses sight of you searches where you were last seen', async () => {
    const r = await page.evaluate(() => {
      setup(1);
      const g = G.guards[2];
      g.pause = 99;
      g.scan = null;
      g.face = 0;
      G.shiloh.x = g.x + 70;
      G.shiloh.y = g.y;
      step(1);
      const saw = g.seeing;
      G.shiloh.x = 40;
      G.shiloh.y = 40;
      step(1);
      return { saw, searching: !!g.lure && Math.abs(g.lure.x - (g.x + 70)) < 3 };
    });
    assert.deepEqual(r, { saw: true, searching: true });
  });

  await t.test('torchlight is bright and most of the floor is shadow', async () => {
    const r = await page.evaluate(() => {
      setup(0);
      gatherLights();
      const torch = G.torches[0];
      let shadow = 0;
      let total = 0;
      for (let y = 1; y < GH - 1; y++) {
        for (let x = 1; x < GW - 1; x++) {
          if (G.grid[y][x] === '#') continue;
          total++;
          if (lightAt(x * T + 16, y * T + 16) < 0.25) shadow++;
        }
      }
      return { lit: lightAt(torch.x, torch.y + 20), shadow: shadow / total };
    });
    assert.ok(r.lit > 0.5, 'near a torch: ' + r.lit);
    assert.ok(r.shadow > 0.3, 'shadow share ' + r.shadow);
  });

  await t.test('dragon fire stuns a guard', async () => {
    const stunned = await page.evaluate(() => {
      setup(1);
      G.ash.on = true;
      G.active = 'ash';
      const g = G.guards[2];
      g.pause = 99;
      g.face = 0;
      G.ash.x = g.x - 40;
      G.ash.y = g.y;
      G.ash.face = 0;
      keys[' '] = true;
      step(10);
      keys[' '] = false;
      return g.stun > 0;
    });
    assert.equal(stunned, true);
  });

  await t.test('the Bell-Warden only burns from behind', async () => {
    const r = await page.evaluate(() => {
      const trial = (behind) => {
        setup(3);
        G.ash.on = true;
        G.active = 'ash';
        const B = G.boss;
        B.x = 16 * 32 + 16;
        B.y = 3 * 32 + 16;
        B.face = 0;
        B.pause = 999;
        G.ash.x = B.x + (behind ? -40 : 40);
        G.ash.y = B.y;
        G.ash.face = behind ? 0 : Math.PI;
        keys[' '] = true;
        step(20);
        keys[' '] = false;
        return B.hp < B.maxhp;
      };
      return { behind: trial(true), front: trial(false) };
    });
    assert.deepEqual(r, { behind: true, front: false });
  });

  await t.test('the Candlemaker is shielded while any candle burns', async () => {
    const r = await page.evaluate(() => {
      const trial = (snuffed) => {
        setup(6);
        G.ash.on = true;
        G.active = 'ash';
        if (snuffed) for (const it of G.items) if (it.type === 'C') it.done = true;
        const B = G.boss;
        B.x = 12 * 32 + 16;
        B.y = 10 * 32 + 16;
        B.face = 0;
        B.pause = 999;
        B.blinkT = 99;
        G.ash.x = B.x - 40;
        G.ash.y = B.y;
        G.ash.face = 0;
        keys[' '] = true;
        step(20);
        keys[' '] = false;
        return B.hp < B.maxhp;
      };
      return { lit: trial(false), snuffed: trial(true) };
    });
    assert.deepEqual(r, { lit: false, snuffed: true });
  });

  await t.test('the Song of Time switches the hall between ball and ruins', async () => {
    const r = await page.evaluate(() => {
      setup(5);
      const guards = G.guards.length;
      G.shiloh.x = G.peds[0].x;
      G.shiloh.y = G.peds[0].y;
      G.active = 'shiloh';
      playPress('f');
      const ruin = { state: G.state, guards: G.guards.length };
      playPress('f');
      return { guards, ruin, back: G.state };
    });
    assert.equal(r.ruin.state, 'ruin');
    assert.notEqual(r.ruin.guards, r.guards);
    assert.equal(r.back, 'ball');
  });

  await t.test('house reputation changes later missions', async () => {
    const r = await page.evaluate(() => {
      resetHouses();
      const plain = rep();
      houses.marrow.fear = 2;
      houses.grell.favor = 2;
      houses.sable.ruin = 2;
      return { plain, shaped: rep() };
    });
    assert.ok(r.shaped.sight < r.plain.sight, 'Fear shrinks guard sight');
    assert.ok(r.shaped.decay > r.plain.decay, 'Favor speeds recovery');
    assert.ok(r.shaped.fled >= 1, 'Ruin sends guards away');
  });

  assert.deepEqual(problems, []);
});
