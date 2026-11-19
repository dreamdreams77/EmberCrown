# Graphics comparison: index

Start with **REPORT.md**. Everything here is real gameplay from the real game; nothing is mocked up.

| Folder or file | What it holds |
|---|---|
| `REPORT.md` | Findings, numbers, scorecard, recommendations |
| `contact-sheets/master-desktop-default-camera-part1.jpg`, `part2.jpg` | Every scene, A / B / C side by side, the camera a player gets. **Best place to start.** |
| `contact-sheets/master-desktop-close-camera-*` | Same, at the trailer's close zoom |
| `contact-sheets/master-mobile-default-camera-*` | Same, phone-sized |
| `contact-sheets/by-scene/` | One sheet per scene with all four versions (A, X, B, C) |
| `contact-sheets/D-new-player-desktop.jpg`, `-mobile.jpg` | What a new player sees, in order |
| `contact-sheets/tier2-lighter-hd2d.jpg` | B, full HD-2D, and the game's own lighter tier |
| `crops/` | Matched, enlarged, lossless crops (A / B / C): sprite and floor, top band (blur), brightest light (bloom) |
| `screenshots/<profile>/<camera>/<scene>/` | The individual frames, one per version, plus `C2_...tier2` where captured |
| `screenshots/D_new-player/` | The new-player frames |
| `metrics*.json`, `perf-stepped.json`, `fps-real.json` | The measurements behind the report |
| `tools/` | The scripts that produced all of this (`capture.js`, `new_player.js`, `build_sheets.py`, `hd2d_impact.py`, `perf_bench.js`, `fps_real.js`) |

Versions: **A** `a26562d` (before HD-2D) · **X** `890363b` (first HD-2D pass) · **B** `9f6b3f4` with HD-2D off · **C** `9f6b3f4` with HD-2D on · **D** `9f6b3f4`, fresh profile.

Reproduce: check out each commit in its own worktree, then `node tools/capture.js <worktree> <label> <outDir> <on|off|na> <desktop|mobile>` and `python3 tools/build_sheets.py <rawDir> .`.
