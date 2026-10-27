# Embercrown

A stealth-action prototype: a spy and her runt dragon infiltrate feuding houses to stop an engineered war. Inspired by the feel of N64 and PS1 classics, with all-new characters.

**Play:** open `index.html` in any modern browser (keyboard required). No build step or dependencies.

**Design doc:** see [PLAYBOOK.md](PLAYBOOK.md).

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Move |
| Shift | Sneak |
| E (hold) | Pick lock / steal / poison |
| Space | Dragon fire |
| Tab | Swap Wren and Ashling |
| Q / R / F | Smoke / whisper bell / bone flute |

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `embercrown`).
2. Upload `index.html`, `README.md`, and `PLAYBOOK.md`, or push this folder:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/embercrown.git
   git branch -M main
   git push -u origin main
   ```
3. In the repository, open **Settings, Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute the game is live at `https://YOUR-USERNAME.github.io/embercrown/`.

## Status

The full story is playable, seven missions ending in three possible endings (crown a puppet, burn it all down, or break the throne). Missions: Ashfall Keep, Gallowmere, the Drowned Spire (a flight level), Thornwick Abbey (a boss dungeon with the Bell-Warden), Ironvale (a hostage escort through forge vents, ending in a choice), Dunmoor Marsh (one hall in two time states: a masked ball and its ruins, switched at pedestals with F), and the Candlemaker's Crown (a boss fight shaped by how your houses ended up). Your choices raise each house's Favor, Fear, or Ruin, which changes later missions. Pick Courier, Spy, or Shadow difficulty on the title screen with keys 1, 2, 3. See the roadmap in the playbook.
