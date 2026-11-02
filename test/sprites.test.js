const test = require('node:test');
const assert = require('node:assert/strict');
const { open } = require('./helpers');

// Draws every character in every expression we have. A broken face shows up as an
// exception, which would otherwise freeze that frame for the player.
test('every character expression renders', async (t) => {
  const { page, problems, close } = await open();
  t.after(close);

  const failures = await page.evaluate(() => {
    const bad = [];
    const attempt = (label) => {
      try {
        draw();
      } catch (e) {
        bad.push(label + ': ' + e.message);
      }
    };
    const fresh = (L) => {
      lvl = L;
      startPlay();
      G.msgT = 0;
      G.ash.on = true;
    };

    // guards and monks
    for (const L of [0, 3]) {
      const states = {
        calm: () => {},
        suspicious: (g) => (g.lure = { x: 0, y: 0, t: 9 }),
        alert: (g) => (g.seeing = true),
        startled: (g) => (g.bark = { text: 'One down!', kind: 'body', t: 9 }),
        talking: (g) => (g.bark = { text: 'Hm.', kind: 'hear', t: 9 }),
        groggy: (g) => (g.grog = 9),
        knockedOut: (g) => (g.stun = 9)
      };
      for (const [name, set] of Object.entries(states)) {
        fresh(L);
        set(G.guards[0]);
        attempt(`mission ${L} guard ${name}`);
      }
    }

    // Shiloh and Ashling
    const hero = {
      calm: () => {},
      worried: () => (G.alert = 0.6),
      panicked: () => (G.alert = 0.9),
      sneaking: () => (G.sneak = true),
      focused: () => {
        G.holdT = { kind: 'item', ref: { x: 100, y: 100, type: 'O' }, x: 100, y: 100 };
        G.hold = 0.3;
      },
      joyful: () => (G.joyT = 5),
      asleep: () => (G.active = 'ash'),
      fire: () => {
        G.active = 'ash';
        keys[' '] = true;
      },
      talking: () => {
        G.msg = { who: 'Shiloh', text: 'x' };
        G.msgT = 9;
      }
    };
    for (const [name, set] of Object.entries(hero)) {
      fresh(1);
      set();
      attempt('hero ' + name);
      keys[' '] = false;
    }

    // Perrin, caged and free
    fresh(4);
    attempt('Perrin caged');
    for (const [name, alert] of [
      ['hopeful', 0],
      ['worried', 0.6],
      ['panicked', 0.9]
    ]) {
      fresh(4);
      G.items.find((i) => i.type === 'H').done = true;
      G.host.on = true;
      G.host.x = 300;
      G.host.y = 300;
      G.alert = alert;
      attempt('Perrin ' + name);
    }

    // the bosses
    for (const L of [3, 6]) {
      const states = {
        calm: () => {},
        hurt: (B) => (B.hurt = 9),
        alert: (B) => (B.seeing = true),
        worn: (B) => (B.hp = B.maxhp * 0.2),
        tolling: (B) => (B.toll = 9),
        scheming: (B) => (B.blink = { x: 200, y: 200, t: 9 }),
        beaten: (B) => ((B.dead = true), (B.hp = 0))
      };
      for (const [name, set] of Object.entries(states)) {
        fresh(L);
        set(G.boss);
        attempt(`mission ${L} boss ${name}`);
      }
    }
    return bad;
  });
  assert.deepEqual(failures, []);
  assert.deepEqual(problems, []);
});
