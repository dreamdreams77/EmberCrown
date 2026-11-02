const test = require('node:test');
const assert = require('node:assert/strict');
const { open, POINTER_HELPER } = require('./helpers');

const reload = async (page) => {
  await page.reload();
  await page.waitForFunction(() => typeof frame === 'function' && typeof startPlay === 'function');
  await page.waitForTimeout(150);
};

test('pausing', async (t) => {
  const { page, problems, close } = await open({ touch: true });
  t.after(close);
  await page.evaluate(POINTER_HELPER);
  await page.evaluate(() => {
    lvl = 1;
    startPlay();
    G.rangeMul = 0;
  });

  await t.test('P pauses, the world freezes, and Enter resumes', async () => {
    await page.keyboard.press('p');
    assert.equal(await page.evaluate(() => mode), 'pause');
    const t0 = await page.evaluate(() => G.time);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => G.time), t0);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => mode), 'play');
    await page.waitForTimeout(300);
    assert.ok((await page.evaluate(() => G.time)) > t0);
  });

  await t.test('Escape also pauses and resumes', async () => {
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => mode), 'pause');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => mode), 'play');
  });

  await t.test('the pause icon and menu work by touch, and held fingers are dropped', async () => {
    const r = await page.evaluate(() => {
      P('down', 1, 300, 300);
      P('move', 1, 360, 300);
      const held = !!TOUCH.mover;
      P('up', 2, 0, 0);
      P('down', 3, 750, 15);
      P('up', 3, 750, 15);
      const paused = mode;
      const dropped = !TOUCH.mover;
      const y = 154 + 2 * 25.5; // Resume
      P('down', 4, 400, y);
      P('up', 4, 400, y);
      return { held, paused, dropped, after: mode };
    });
    assert.deepEqual(r, { held: true, paused: 'pause', dropped: true, after: 'play' });
  });

  await t.test('restart replaces the level, and quit goes to the title', async () => {
    const r = await page.evaluate(() => {
      const before = G;
      press('p');
      press('3');
      const restarted = G !== before && mode === 'play';
      press('p');
      press('4');
      return { restarted, quit: mode };
    });
    assert.deepEqual(r, { restarted: true, quit: 'title' });
  });

  await t.test('hiding the tab pauses the game', async () => {
    const r = await page.evaluate(() => {
      lvl = 1;
      startPlay();
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      const out = mode;
      delete document.hidden;
      return out;
    });
    assert.equal(r, 'pause');
  });

  assert.deepEqual(problems, []);
});

test('saving and continuing', async (t) => {
  const { page, problems, close } = await open();
  t.after(close);
  await page.evaluate(() => localStorage.clear());
  await reload(page);

  await t.test('a fresh start has nothing to continue', async () => {
    assert.equal(await page.evaluate(() => SAVED), null);
  });

  await t.test('starting writes a save, and a reload offers to continue it', async () => {
    await page.evaluate(() => {
      press('2'); // Spy
      press('enter');
      houses.grell.favor = 2;
      houses.kest.fear = 1;
      stats.gems = 7;
      stats.cleared = [0, 1];
      perks = { 1: 0 };
      diff = 2;
      startBrief(2); // saves
    });
    await reload(page);
    const r = await page.evaluate(() => {
      const strings = [];
      const ft = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
        strings.push(String(text));
        return ft.call(this, text, ...rest);
      };
      draw();
      CanvasRenderingContext2D.prototype.fillText = ft;
      return { saved: !!SAVED, line: strings.find((x) => x.startsWith('Saved game')) };
    });
    assert.equal(r.saved, true);
    assert.match(r.line, /mission 3, The Drowned Spire/);
  });

  await t.test(
    'continuing restores houses, gems, choices, difficulty and the mission',
    async () => {
      await page.keyboard.press('Enter');
      const r = await page.evaluate(() => ({
        mode,
        lvl,
        grell: houses.grell.favor,
        kest: houses.kest.fear,
        gems: stats.gems,
        cleared: stats.cleared,
        perks,
        diff
      }));
      assert.deepEqual(r, {
        mode: 'brief',
        lvl: 2,
        grell: 2,
        kest: 1,
        gems: 7,
        cleared: [0, 1],
        perks: { 1: 0 },
        diff: 2
      });
    }
  );

  await t.test('finishing a mission saves at the Back Stairs and continues there', async () => {
    await page.evaluate(() => {
      lvl = 2;
      startPlay();
      G.choice = null;
      finishLevel();
    });
    await reload(page);
    await page.keyboard.press('Enter');
    const r = await page.evaluate(() => ({ mode, lvl, cleared: stats.cleared }));
    assert.deepEqual(r, { mode: 'court', lvl: 2, cleared: [0, 1, 2] });
  });

  await t.test('N starts over and wipes the old progress', async () => {
    await reload(page);
    await page.keyboard.press('n');
    const r = await page.evaluate(() => ({
      mode,
      lvl,
      grell: houses.grell.favor,
      gems: stats.gems,
      perks: Object.keys(perks).length,
      cleared: stats.cleared.length
    }));
    assert.deepEqual(r, { mode: 'brief', lvl: 0, grell: 0, gems: 0, perks: 0, cleared: 0 });
  });

  await t.test('a corrupt or foreign save is ignored', async () => {
    for (const junk of ['not json', '{"v":2}', '{"v":1,"lvl":99,"stage":"brief","houses":{}}']) {
      await page.evaluate((j) => localStorage.setItem('plainwax_save', j), junk);
      await reload(page);
      assert.equal(await page.evaluate(() => SAVED), null, junk);
    }
  });

  await t.test('finishing the last mission clears the save', async () => {
    await page.evaluate(() => {
      localStorage.clear();
      newGame();
      lvl = 6;
      startPlay();
      G.choice = 'break';
      finishLevel();
    });
    assert.equal(await page.evaluate(() => localStorage.getItem('plainwax_save')), null);
  });

  await t.test('the title offers to start over by touch', async () => {
    const { page: p2, close: close2, problems: pr2 } = await open({ touch: true });
    await p2.evaluate(POINTER_HELPER);
    await p2.evaluate(() => {
      newGame();
      startBrief(3);
      houses.sable.fear = 2;
      mode = 'title';
      draw();
    });
    const r = await p2.evaluate(() => {
      const band = UI.newGameBand;
      const y = (band[0] + band[1]) / 2;
      P('down', 1, 400, y);
      P('up', 1, 400, y);
      return { mode, lvl, sable: houses.sable.fear };
    });
    await close2();
    assert.deepEqual(r, { mode: 'brief', lvl: 0, sable: 0 });
    assert.deepEqual(pr2, []);
  });

  assert.deepEqual(problems, []);
});

test('the Back Stairs changes each mission', async (t) => {
  const { page, problems, close } = await open();
  t.after(close);
  await page.evaluate(() => {
    window.start = (L, choice) => {
      resetHouses();
      perks = choice == null ? {} : { [L]: choice };
      lvl = L;
      startPlay();
      mode = 'paused';
      return G;
    };
    window.step = (n) => {
      for (let i = 0; i < n; i++) update(1 / 60);
    };
  });

  const check = (name, fn) => t.test(name, async () => assert.equal(await page.evaluate(fn), true));

  await check(
    'Gallowmere: bribe drops a guard, blackmail speeds recovery, taint blinds them',
    () => {
      const base = start(1);
      const n = base.guards.length,
        decay = base.decay,
        range = base.rangeMul,
        spd = base.guards[0].spd;
      return (
        start(1, 0).guards.length === n - 1 &&
        Math.abs(start(1, 1).decay / decay - 2.5) < 1e-6 &&
        Math.abs(start(1, 2).rangeMul / range - 0.75) < 1e-6 &&
        start(1, 2).guards[0].spd < spd
      );
    }
  );

  await check('Drowned Spire: the boat can be called off, the lights slowed or dimmed', () => {
    const base = start(2);
    const boats = (g) => g.guards.filter((x) => !x.spin).length;
    const spin = base.guards.find((x) => x.spin).spin;
    return (
      boats(base) === 1 &&
      boats(start(2, 0)) === 0 &&
      Math.abs(start(2, 1).guards.find((x) => x.spin).spin / spin - 0.6) < 1e-6 &&
      Math.abs(start(2, 2).rangeMul / base.rangeMul - 0.75) < 1e-6
    );
  });

  await check('Thornwick: more bells, quieter footsteps, slower monks', () => {
    const base = start(3);
    const bells = base.gad.bell,
      spd = base.guards[0].spd;
    const quiet = start(3, 1);
    return (
      start(3, 0).gad.bell === bells + 3 &&
      quiet.fx.noise === 0.65 &&
      start(3, 2).guards[0].spd < spd
    );
  });

  await check('Ironvale: shorter vents, extra kit, faster locks', () => {
    const duty = (g) => {
      let on = 0;
      for (let f = 0; f < 240; f++) {
        update(1 / 60);
        if (g.vents[0].on) on++;
      }
      return on;
    };
    const slow = duty(start(4));
    const short = duty(start(4, 0));
    const kit = start(4, 1);
    const base = start(4);
    const lockNeed = (g) => {
      const d = Object.values(g.doors)[0];
      g.shiloh.x = d.x * 32 + 16 - 20;
      g.shiloh.y = d.y * 32 + 16;
      return findTarget(g.shiloh).need;
    };
    return (
      short < slow &&
      kit.gad.smoke === base.gad.smoke + 2 &&
      kit.gad.bell === base.gad.bell + 2 &&
      Math.abs(lockNeed(start(4, 2)) / lockNeed(start(4)) - 0.5) < 1e-6
    );
  });

  await check('Dunmoor: a guard looks away, the music hides the song, the punch slows them', () => {
    const base = start(5);
    const n = base.guards.length,
      range = base.rangeMul;
    const heardAt = (choice) => {
      const g = start(5, choice);
      const guard = g.guards[0];
      // five tiles away with a clear line: inside a loud song, outside a muffled one
      guard.x = g.shiloh.x + 5 * T;
      guard.y = g.shiloh.y;
      g.grid[Math.floor(guard.y / T)][Math.floor(guard.x / T)] = '.';
      lureNear(g.shiloh.x, g.shiloh.y, 8 * T * (g.fx.timeNoise || 1));
      return !!guard.lure;
    };
    return (
      start(5, 0).guards.length === n - 1 &&
      heardAt(null) === true &&
      heardAt(1) === false &&
      Math.abs(start(5, 2).rangeMul / range - 0.9) < 1e-6
    );
  });

  await check('the last mission: a satchel, a tonic or a cloak', () => {
    const base = start(6);
    return (
      start(6, 0).gad.smoke === base.gad.smoke + 2 &&
      start(6, 0).gad.bell === base.gad.bell + 2 &&
      Math.abs(start(6, 1).decay / base.decay - 1.6) < 1e-6 &&
      Math.abs(start(6, 2).rangeMul / base.rangeMul - 0.85) < 1e-6
    );
  });

  await t.test('each action leaves its mark on the house afterwards', async () => {
    const lines = await page.evaluate(() => {
      const out = [];
      for (let L = 1; L <= 5; L++) {
        for (let k = 0; k < 3; k++) {
          resetHouses();
          perks = { [L]: k };
          lvl = L;
          startPlay();
          G.choice = 'return';
          finishLevel();
          out.push(G.outLines.join(' | '));
          const ledger = TEXT.stairs[L].options[k].ledger;
          const h = houses[ledger[0]][ledger[1]];
          if (h < 1) out.push('NOT RECORDED ' + L + ' ' + k);
        }
      }
      return out;
    });
    assert.ok(!lines.some((l) => l.startsWith('NOT RECORDED')), lines.join('\n'));
    assert.match(lines[0], /House Grell: \+1 Favor\. The steward remembers your coin\./);
  });

  await t.test('choosing at the Back Stairs by key sets the action and moves on', async () => {
    const r = await page.evaluate(() => {
      perks = {};
      lvl = 3;
      mode = 'court';
      press('3');
      return { perk: perks[4], mode, lvl };
    });
    assert.deepEqual(r, { perk: 2, mode: 'brief', lvl: 4 });
  });

  assert.deepEqual(problems, []);
});

test('the case file', async (t) => {
  const { page, problems, close } = await open({ touch: true });
  t.after(close);
  await page.evaluate(POINTER_HELPER);
  const strings = (fn) => page.evaluate(fn).then((r) => r);

  await t.test('it starts empty, fills in as missions are cleared, and closes back', async () => {
    const r = await page.evaluate(() => {
      const seen = () => {
        const out = [];
        const ft = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
          out.push(String(text));
          return ft.call(this, text, ...rest);
        };
        draw();
        CanvasRenderingContext2D.prototype.fillText = ft;
        return out.join('\n');
      };
      newGame();
      press('c');
      const opened = mode;
      const empty = seen();
      stats.cleared = [0, 1];
      const partial = seen();
      press('enter');
      const page2 = casePage;
      press('enter');
      return { opened, empty, partial, page2, closed: mode };
    });
    assert.equal(r.opened, 'casefile');
    assert.equal((r.empty.match(/Not found yet\./g) || []).length, 7);
    assert.match(r.partial, /Ashfall Keep: The egg crate was sealed with a ring of plain wax/);
    assert.equal((r.partial.match(/Not found yet\./g) || []).length, 5);
    assert.equal(r.page2, 1);
    assert.equal(r.closed, 'brief');
  });

  await t.test('the verdict appears only when every mission is cleared', async () => {
    const r = await page.evaluate(() => {
      const text = () => {
        const out = [];
        const ft = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (t, ...rest) {
          out.push(String(t));
          return ft.call(this, t, ...rest);
        };
        draw();
        CanvasRenderingContext2D.prototype.fillText = ft;
        return out.join('\n');
      };
      mode = 'casefile';
      casePage = 0;
      stats.cleared = [0, 1, 2, 3, 4, 5];
      const before = text();
      stats.cleared = [0, 1, 2, 3, 4, 5, 6];
      return { before, after: text() };
    });
    assert.doesNotMatch(r.before, /Quill wrote the war/);
    assert.match(r.after, /Quill wrote the war\. I carried it\./);
  });

  await t.test(
    'the second page says how each house feels and what you did on the stairs',
    async () => {
      const r = await page.evaluate(() => {
        resetHouses();
        houses.grell.favor = 1;
        houses.marrow.fear = 1;
        houses.sable.ruin = 2;
        perks = { 1: 0, 4: 2 };
        return {
          grell: houseMood('grell'),
          marrow: houseMood('marrow'),
          sable: houseMood('sable'),
          kest: houseMood('kest'),
          both: (() => {
            houses.dunmoor.favor = 1;
            houses.dunmoor.fear = 1;
            return houseMood('dunmoor');
          })()
        };
      });
      assert.deepEqual(r, {
        grell: 'owes you',
        marrow: 'afraid of you',
        sable: 'in ruins',
        kest: 'does not know your name',
        both: 'watching you'
      });
    }
  );

  await t.test('the briefing and the pause menu open it, and closing returns to them', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      lvl = 1;
      startBrief(1);
      press('c');
      press('escape');
      out.brief = mode;
      startPlay();
      press('p');
      press('2');
      out.fromPause = mode;
      press('c');
      out.backToPause = mode;
      return out;
    });
    assert.deepEqual(r, { brief: 'brief', fromPause: 'casefile', backToPause: 'pause' });
  });

  await t.test('by touch: the corner link opens it and taps turn the pages', async () => {
    const r = await page.evaluate(() => {
      startBrief(1);
      P('down', 1, 100, 446);
      P('up', 1, 100, 446);
      const opened = mode;
      P('down', 1, 400, 240);
      P('up', 1, 400, 240);
      const second = casePage;
      P('down', 1, 400, 240);
      P('up', 1, 400, 240);
      return { opened, second, closed: mode };
    });
    assert.deepEqual(r, { opened: 'casefile', second: 1, closed: 'brief' });
  });

  assert.deepEqual(problems, []);
});
