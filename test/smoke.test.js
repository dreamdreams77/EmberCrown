const test = require('node:test');
const assert = require('node:assert/strict');
const { open } = require('./helpers');

test('smoke: the whole game flow', async (t) => {
  const { page, problems, close } = await open();
  t.after(close);

  await t.test('loads without errors and starts on the title screen', async () => {
    assert.equal(await page.evaluate(() => mode), 'title');
    assert.deepEqual(problems, []);
  });

  await t.test(
    'plays through all seven missions and the ending with real key presses',
    async () => {
      const log = await page.evaluate(() => {
        const log = [];
        const step = (n) => {
          for (let i = 0; i < n; i++) update(1 / 60);
          draw();
        };
        press('2');
        press('enter');
        log.push(mode);
        press('enter');
        log.push(mode);
        for (let L = 0; L < 7; L++) {
          // finish every objective, switch off the guards, and stand on the exit
          for (const it of G.items) if ('OPBLHC'.includes(it.type)) it.done = true;
          if (G.boss) {
            G.boss.dead = true;
            G.boss.hp = 0;
            G.boss.stun = 1e9;
          }
          if (G.host) {
            G.host.on = true;
            G.host.x = G.exit.x;
            G.host.y = G.exit.y;
          }
          G.alert = 0;
          for (const g of G.guards) g.stun = 1e9;
          G.shiloh.x = G.exit.x;
          G.shiloh.y = G.exit.y;
          G.active = 'shiloh';
          if (G.flight) {
            G.ash.x = G.exit.x;
            G.ash.y = G.exit.y;
          }
          step(3);
          if (mode === 'choice') {
            draw();
            press(G.d.finale ? '3' : '1');
            if (mode === 'choice') press('1'); // the third ending needs more gems
          }
          log.push(L + ':' + mode);
          press('enter');
          if (mode === 'court') press('1');
          if (mode === 'brief') press('enter');
        }
        log.push(mode);
        draw();
        return log;
      });
      assert.equal(log[log.length - 1], 'end', log.join(' '));
      assert.ok(log.filter((x) => x.endsWith(':win')).length === 7, log.join(' '));
    }
  );

  await t.test('being caught and pressing Enter restarts the mission', async () => {
    const result = await page.evaluate(() => {
      mode = 'title';
      press('enter');
      press('enter');
      G.alert = 2;
      update(0.1);
      const caught = mode;
      draw();
      press('enter');
      return [caught, mode];
    });
    assert.deepEqual(result, ['lose', 'play']);
  });

  await t.test('every screen renders', async () => {
    const failures = await page.evaluate(() => {
      const bad = [];
      for (const m of ['title', 'brief', 'court', 'play', 'choice', 'win', 'lose', 'end']) {
        mode = m;
        try {
          draw();
        } catch (e) {
          bad.push(m + ': ' + e.message);
        }
      }
      return bad;
    });
    assert.deepEqual(failures, []);
  });

  await t.test('switching render resolution mid-mission works', async () => {
    await page.evaluate(() => {
      lvl = 5;
      startPlay();
      setRes(1);
      draw();
      setRes(2);
      draw();
      setRes(1);
    });
  });

  assert.deepEqual(problems, []);
});
