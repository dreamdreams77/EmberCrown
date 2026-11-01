# Embercrown

A stealth-action prototype: a spy and her runt dragon infiltrate feuding houses to stop an engineered war. Inspired by the feel of N64 and PS1 classics, with all-new characters.

**Play:** open `index.html` in any modern browser, on desktop or touchscreen. No build step or dependencies.

**Design doc:** see [PLAYBOOK.md](PLAYBOOK.md).

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | WASD / arrows | Drag the left side of the screen (floating joystick) |
| Strike (Wren) / Fire (Ashling) | Space, or left-click (aim with the mouse) | STRIKE / FIRE (hold) |
| Sneak / roll (Wren), Dash (Ashling) | Shift (tap twice, or C, to roll) | SNEAK toggle (double-tap to roll) / DASH |
| Interact: pick, steal, open, examine (hold) | E | ACT (hold) |
| Ember Nova (Ashling, after learning it) | E | NOVA (the ACT button) |
| Swap Wren and Ashling | Tab, or right-click | SWAP |
| Smoke / whisper bell / bone flute | Q / R / F, or click the slot | SMOKE / BELL / FLUTE |
| Wide scouting view | hold Z | tap the minimap |
| Pause, mute, minimap | Esc or P, M, N | Pause button |

The camera follows the action close-up on every screen size and leans toward threats. Portrait phones get a control panel under the game view, landscape devices overlay thumb controls at the corners.

## What's in the game

- **Seven missions**, three endings, three difficulties (Courier, Spy, Shadow). Stealth is still the core: guards see in cones, hounds smell, archers snipe, brutes carry shields.
- **Cinematics.** Every mission opens with a fly-over of its objectives, bosses make a dramatic entrance and fall in slow motion, and each mission ends on a victory sequence.
- **Action combat.** Wren strikes in a three-hit combo, takes guards down silently from behind, and rolls through danger. Ashling breathes fire, dashes (with invulnerability), and learns Ember Nova. Enemies telegraph every attack: Cinderlings lunge, Ashwisps fire orbs, Hollow Husks slam the ground. You have hearts, i-frames, knockback and hit-stop.
- **Boss fights.** The Bell-Warden slams, charges and tolls; the Candlemaker blinks, slashes, fires volleys and summons wisps while his candles shield him. Both have two phases and a stagger window that rewards good timing.
- **Furnished, lit worlds.** Auto-dressed rooms with tables, benches, bookcases, anvils, statues and breakable pots; chandeliers, rafters and doorway lintels in the foreground; a parallax scenery backdrop beyond the walls; distinct atmosphere in every area.
- **Exploration.** Each mission has a hidden **vault**: burn or dash through a cracked wall, light three braziers with Ashling's fire to open the inner gate, take the relic, survive the guardian trial, then open the reward chest. Examine glinting remains for story fragments; the Codex records everything.
- **Progression.** Cinders (from pots, foes, chests, secrets and rank) buy permanent talents at the **Ember Forge**: 12 upgrades across Wren, Ashling and shared branches, including extra hearts, Twin Dash, Ember Nova and Phoenix Spark. Relics, ember gems and S-C mission ranks still count.
- **Saves.** Progress, talents, cinders, relics and settings persist in `localStorage` (older saves keep working). Cinders and relics are only banked when a mission is completed.
- **Audio.** Procedural music, ambient beds per area, and combat intensity layers. No asset files.

## Project layout

```
index.html        page shell and touch control markup
style.css         responsive layout, menus, touch controls, Forge
js/data.js        missions, maps and vault generator, relics, lore
js/audio.js       procedural music, ambience and sound effects
js/game.js        rules: stealth, gadgets, saves, main update
js/render.js      camera, baked tile layer, lighting, guards
js/cine.js        cinematic director (intro, boss, victory)
js/props.js       furniture placement and art, foreground, vault interactables
js/talents.js     Ember Forge talents
js/combat.js      hearts, foes, projectiles, strikes, bosses
js/actors.js      Wren, Ashling, foes, bosses, combat effects
js/world.js       props, particles, ambience, parallax, world draw pass
js/hud.js         HUD, minimap, screen effects, title scene
js/ui.js          menus, Forge, pause, codex, touch and mouse input
js/main.js        boot, main loop, adaptive quality
```

No build step or dependencies. Serve the folder (or open `index.html`) in any modern browser.

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `embercrown`).
2. Upload `index.html`, `style.css`, the `js/` folder and the docs, or push this folder:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/embercrown.git
   git branch -M main
   git push -u origin main
   ```
3. In the repository, open **Settings, Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute the game is live at `https://YOUR-USERNAME.github.io/embercrown/`.

## Status

The full story is playable, seven missions ending in three possible endings (crown a puppet, burn it all down, or break the throne). Missions: Ashfall Keep, Gallowmere, the Drowned Spire (a flight level), Thornwick Abbey (a boss dungeon with the Bell-Warden), Ironvale (a hostage escort through forge vents, ending in a choice), Dunmoor Marsh (one hall in two time states: a masked ball and its ruins, switched at pedestals with F), and the Candlemaker's Crown (a boss fight shaped by how your houses ended up). Your choices raise each house's Favor, Fear, or Ruin, which changes later missions. Pick Courier, Spy, or Shadow difficulty on the title screen with keys 1, 2, 3. See the roadmap in the playbook.
