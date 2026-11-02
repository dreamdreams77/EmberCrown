const test = require('node:test');
const assert = require('node:assert/strict');
const { open, POINTER_HELPER } = require('./helpers');

test('touch controls', async (t) => {
  const { page, problems, close } = await open({ touch: true });
  t.after(close);
  await page.evaluate(POINTER_HELPER);
  await page.evaluate(() => {
    window.step = (n) => {
      for (let i = 0; i < n; i++) update(1 / 60);
      draw();
    };
  });

  await t.test('menus respond to taps', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      out.diffBefore = diff;
      P('down', 1, 400, 380);
      P('up', 1, 400, 380);
      out.diffAfter = diff;
      out.stillTitle = mode;
      P('down', 1, 400, 200);
      P('up', 1, 400, 200);
      out.afterTap = mode;
      return out;
    });
    assert.notEqual(r.diffBefore, r.diffAfter);
    assert.equal(r.stillTitle, 'title');
    assert.equal(r.afterTap, 'brief');
  });

  const walk = (dx) =>
    page.evaluate((dx) => {
      lvl = 1;
      startPlay();
      G.msgT = 0;
      G.rangeMul = 0;
      G.shiloh.x = 100;
      G.shiloh.y = 200;
      P('down', 1, 400, 300);
      P('move', 1, 400 + dx, 300);
      const x0 = G.shiloh.x;
      step(60);
      const out = { dist: G.shiloh.x - x0, sneak: G.sneak };
      P('up', 1, 400 + dx, 300);
      return out;
    }, dx);

  await t.test('a short drag sneaks and a long drag runs', async () => {
    const slow = await walk(25);
    const fast = await walk(60);
    assert.equal(slow.sneak, true);
    assert.equal(fast.sneak, false);
    assert.ok(fast.dist > slow.dist * 1.6, `run ${fast.dist} vs sneak ${slow.dist}`);
  });

  await t.test('a tiny movement inside the deadzone does not walk', async () => {
    assert.equal((await walk(4)).dist, 0);
  });

  await t.test('the anchor follows the thumb and lifting the finger stops', async () => {
    const r = await page.evaluate(() => {
      startPlay();
      G.rangeMul = 0;
      P('down', 1, 300, 300);
      P('move', 1, 500, 300);
      const t = TOUCH.mover;
      const stretch = Math.hypot(t.x - t.ax, t.y - t.ay);
      P('up', 1, 500, 300);
      const x = G.shiloh.x;
      step(30);
      return { stretch, stopped: G.shiloh.x === x };
    });
    assert.ok(r.stretch <= 67, 'stretch ' + r.stretch);
    assert.equal(r.stopped, true);
  });

  await t.test('holding still next to a lock picks it, moving cancels', async () => {
    const r = await page.evaluate(() => {
      const setup = () => {
        lvl = 0;
        startPlay();
        G.rangeMul = 0;
        const d = Object.values(G.doors)[0];
        G.shiloh.x = d.x * 32 + 16 - 20;
        G.shiloh.y = d.y * 32 + 16;
        return d;
      };
      let d = setup();
      P('down', 1, 400, 300);
      step(100);
      const opened = d.open;
      P('up', 1, 400, 300);
      d = setup();
      P('down', 1, 400, 300);
      P('move', 1, 400, 360);
      step(40);
      const cancelled = G.hold === 0;
      P('up', 1, 400, 360);
      return { opened, cancelled };
    });
    assert.deepEqual(r, { opened: true, cancelled: true });
  });

  await t.test('a second finger breathes fire as Ashling and a quick tap swaps', async () => {
    const r = await page.evaluate(() => {
      lvl = 1;
      startPlay();
      G.rangeMul = 0;
      G.ash.on = true;
      G.active = 'ash';
      P('down', 1, 200, 300);
      P('down', 2, 600, 300);
      const firing = TOUCH.fire;
      step(10);
      const flames = G.parts.filter((q) => q.k === 'fire').length;
      P('up', 2, 600, 300);
      const released = !TOUCH.fire;
      P('up', 1, 200, 300);
      startPlay();
      G.ash.on = true;
      G.active = 'shiloh';
      P('down', 1, 200, 300);
      P('down', 2, 600, 300);
      P('up', 2, 600, 300);
      const swapped = G.active;
      P('up', 1, 200, 300);
      return { firing, flames, released, swapped };
    });
    assert.equal(r.firing, true);
    assert.ok(r.flames > 0);
    assert.equal(r.released, true);
    assert.equal(r.swapped, 'ash');
  });

  await t.test('the bottom bar buttons use gadgets', async () => {
    const r = await page.evaluate(() => {
      lvl = 1;
      startPlay();
      G.rangeMul = 0;
      G.ash.on = true;
      G.active = 'shiloh';
      step(2);
      const smoke0 = G.gad.smoke;
      const bell0 = G.gad.bell;
      const hit = (k) => {
        const h = HOT.find((h) => h.key === k);
        P('down', 3, h.x + h.w / 2, 465);
        P('up', 3, h.x + h.w / 2, 465);
      };
      hit('q');
      hit('r');
      const used = { smoke: smoke0 - G.gad.smoke, bell: bell0 - G.gad.bell };
      hit('tab');
      return { used, active: G.active, walking: !!TOUCH.mover };
    });
    assert.deepEqual(r.used, { smoke: 1, bell: 1 });
    assert.equal(r.active, 'ash');
    assert.equal(r.walking, false);
  });

  await t.test('a portrait phone is asked to turn sideways', async () => {
    const { page: p2, close: close2 } = await open({ touch: true, width: 400, height: 800 });
    const shown = await p2.evaluate(
      () => getComputedStyle(document.getElementById('turn')).display
    );
    await p2.click('#turnok');
    const hidden = await p2.evaluate(
      () => getComputedStyle(document.getElementById('turn')).display
    );
    await close2();
    assert.equal(shown, 'flex');
    assert.equal(hidden, 'none');
  });

  assert.deepEqual(problems, []);
});
