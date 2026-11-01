# Embercrown

A stealth-action prototype: a spy and her runt dragon infiltrate feuding houses to stop an engineered war. Inspired by the feel of N64 and PS1 classics, with all-new characters.

**Play:** open `index.html` in any modern browser, on desktop or touchscreen. No build step or dependencies.

**Design doc:** see [PLAYBOOK.md](PLAYBOOK.md).

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | WASD / arrows | Drag the left side of the screen (floating joystick) |
| Sneak (Wren) / Ember Dash (Ashling) | Shift | SNEAK toggle / DASH (same button) |
| Pick lock, steal, poison (hold) | E, or left-click as Wren | ACT (hold) |
| Dragon fire (hold) | Space, or left-click as Ashling (aim with the mouse) | FIRE (hold) |
| Swap Wren and Ashling | Tab, or right-click | SWAP |
| Smoke / whisper bell / bone flute | Q / R / F, or click the slot | SMOKE / BELL / FLUTE |
| Pause, mute, minimap | Esc or P, M, N | Pause button, pause menu |

The layout adapts to phones, tablets and desktops: portrait phones get a dedicated control panel under the game view, landscape devices overlay thumb controls at the corners, and the camera zooms and follows the active character on small screens.

## What's in the game

- **Seven missions** with three endings and three difficulties (Courier, Spy, Shadow), driven by each house's Favor, Fear and Ruin.
- **Lit, animated world.** Baked stone, wood, marble and forge floors; torch-lit walls with banners and windows; dynamic lighting and shadows; sea, fog, embers and ash; rats, bats and gulls.
- **Secrets.** Cracked walls hide annex rooms with ember caches, lore scrolls and one permanent **relic** per mission. Burn a crack with Ashling's fire, or dash into it.
- **Ember Dash.** Ashling's charge stuns a guard, shatters cracks and chips bosses.
- **Oil barrels.** Fire sets them off: a loud blast that stuns nearby guards and can open cracks.
- **Guard types.** Hounds smell you at close range, archers see far through a narrow cone, shielded brutes only fall to fire from behind. Guards now investigate where they last saw you.
- **Progression.** Ember gems extend fire range, relics grant lasting bonuses, missions are ranked S to C, and the Codex records relics and lore.
- **Saves.** Progress, houses, relics and settings persist in `localStorage`; Continue picks up at the next mission.
- **Audio.** Procedural music and effects (WebAudio), no asset files. Toggle in the pause menu.

## Project layout

```
index.html        page shell and touch control markup
style.css         responsive layout, menus, touch controls
js/data.js        missions, maps (with hidden annexes), relics, lore
js/audio.js       procedural music and sound effects
js/game.js        rules: stealth, gadgets, combat, saves
js/render.js      baked tile layer, lighting, characters
js/world.js       props, particles, ambience, world draw pass
js/hud.js         HUD, minimap, animated title scene
js/ui.js          menus, pause, codex, touch and mouse input
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
