# EmberCrown graphics comparison: report

Investigation only. No game code, asset or setting was changed, and nothing was pushed to `main`. All screenshots are real gameplay captured from the real game (deterministic clock, same scene, same seed, same camera in every version).

## 1. What was compared (exact commits)

| Label | Commit | What it is |
|---|---|---|
| **A** | `a26562d` (2026-11-12, PR #5 merge) | The last version before HD-2D. Pixel art (LPC sprites) is already on, but only Ashfall has LPC floor and wall tiles, and the bosses are the old code-drawn figures. |
| **X** | `890363b` (2026-11-18) | First HD-2D pass on the A assets: bloom, torch light shafts, dust, tilt-shift depth of field, grade and vignette (`js/hd2d.js`, 120 lines). Also adds the trailer. Shown as an extra column so the two updates can be judged separately. |
| **B** | `9f6b3f4` with `settings.hd2d = false` | Current code and art: per-house LPC floors and walls, LPC bosses (from `8a057dd`), HD-2D switched off with the game's own setting. |
| **C** | `9f6b3f4` with `settings.hd2d = true` | The complete current graphics system. |
| **D** | `9f6b3f4`, fresh profile, no overrides | What a new player gets: pixel art on, HD-2D on in play (off on the title screen), first-visit trailer, then Ashfall's opening. |

`8a057dd` ("Pixel art on every house") changed floors, walls, bosses and the per-house HD-2D grade. `9f6b3f4` only adds the first-visit trailer. So B and C are `8a057dd` in effect.

**Important finding about the repository.** `origin/main` (`9f6b3f4`) is a different codebase lineage from the clay-and-ink version built earlier in the same conversation. They share only the original upload `dde3c37`. My earlier commits are intact on branch `ccr-8f845b2c-1nm43x`, and a `backup/main-parallel-rewrite` branch also exists. Nothing here touches either.

**Where the "default" and "earlier" art come from.** The game has a "Pixel art" toggle. Turning it off shows the original code-drawn vector art. That is not part of this comparison; A is the pixel-art version before HD-2D.

## 2. How it was tested

- Headless Chromium on a deterministic 1/30 s clock with seeded randomness, one fresh browser profile per version, same 13 scenes, 1280x720 desktop and 844x390 at 2x (phone). Scenes run through the game's own functions (`newGame`, `startPlay`, `bossEngage`, `shiftTime`, `Hub.enter`) in the same god-mode as the trailer recorder.
- Two cameras: the **default** camera (what a player sees) and the **close** camera (the trailer's zoom, 1.1 to 1.5x). The trailer hides the HUD and uses hand-picked close shots, so it flatters the look; the default set does not.
- Scenes: Ashfall (start and patrol), Gallowmere (hall and fire), Drowned Spire (outdoor flight), Thornwick (hall), Warden boss, Ironvale, Dunmoor (ball and ruins), Candlemaker (hall and boss, candles), the Rookery hub (outdoor).
- Limits: software rendering (no GPU), so absolute speeds are pessimistic; phone results are a 4x CPU throttle, not a real phone. Committed screenshots are JPEG q92 (4:4:4); the lossless PNGs were used for every measurement.

## 3. Findings

**Update 2 (`8a057dd`, LPC floors, walls, bosses): a real improvement.** Compare A and B in any sheet: floors gain real pattern (Gallowmere's wood parquet, Dunmoor's checkerboard, the Rookery's parquet), walls gain stone detail (the Warden's hall), and the bosses match the sprite style. It costs no speed (A 20 ms, B 21 ms per frame on desktop). Pixel sharpness is the best of all configurations.

**Update 1 (HD-2D, `890363b`): good in moderation, too much in places, and expensive.**
- *Where it helps:* soft warm glow on torches, candles, the forge and the feast (Gallowmere, Ironvale, the Candlemaker's hall, Ashfall's torches). In these, bloom brightens under 5% of the screen and detail under the glow is kept at 91 to 97%.
- *Where it is too strong:* the Warden fight brightens **37%** of the visible world by more than 20 luma (4.5% by more than 60), the Candlemaker fight 23%, Gallowmere's fire 15%, Thornwick's hall 14%. In Thornwick the warm torch light on a blue palette becomes a white-lilac wash that wipes out the new stone detail (`crops/3-brightest-light-bloom-3x/default/07-warden-boss.png`), and the Warden's gold armour loses contrast. Near-white pixels (luma 235 or more) in the visible world rise from 1.1% to 1.9% in the Candlemaker fight and from 0.4% to 1.2% in the Warden fight.
- *Depth of field blurs the pixel art.* The top and bottom bands are smoothed. The top 20% of the screen loses a median 22% of its sharpness (7 of 13 scenes lose more than 20%; worst: Rookery -47%, Gallowmere fire -42%, Ironvale -37%, Thornwick -33%) while the middle is untouched (median 1.02x). Floor patterns and emblems at the top smear (`crops/2-top-band-depth-of-field-2x/default/13-rookery-hub.png`), and it is the area where guards approach from.
- *Colour grade:* tiny (at most 3 RGB levels in unlit areas). House identity survives in every version: hues barely move and the spread between the seven houses is unchanged (0.167 in A, 0.176 in B, 0.175 in C). Two weaknesses are older than HD-2D: Gallowmere and Ironvale are the closest pair in every version (both orange), and Dunmoor's blue saturation fell from 0.35 to 0.26 in the new floors.

**Bosses.** The Warden changed from a code-drawn bronze bell machine (unique silhouette, clashes with the pixel art) to an armoured LPC knight (consistent, readable, but the bell is gone). Under HD-2D his gold armour washes into the bloom. The Candlemaker's white mask stays readable in all versions; with HD-2D the whole hall goes heavy orange and contrast drops.

**Performance (software rendering, relative).**
| | A | X | B | C | C at the game's lower tier 2 |
|---|---|---|---|---|---|
| Desktop, ms per frame (mean of 4 scenes) | 20 | 46 | 21 | 47 | 34 |
| Phone (4x throttle), ms per frame | 100 | 268 | 99 | 253 | 196 |
| Real-time fps, desktop, Gallowmere / Warden | 57 / 46 | not run | 59 / 54 | 25 / 22 then 28 / 29 | |
| Real-time fps, phone, Gallowmere / Warden (first 3 s, after 12 s) | 12 / 9 then 25 / 18 | not run | 11 / 9 then 21 / 18 | **4 / 4** then 13 / 9 | |

HD-2D roughly doubles frame cost. The game's adaptive quality lowers tiers when frames are slow, but on the throttled phone it starts at about 4 fps and takes around 9 to 12 seconds to settle, and even at the lowest tier it runs at about half the rate of the versions without HD-2D. Tier 2 (no depth of field, dust or shafts) saves about a quarter of the cost.

## 4. Scorecard (my judgement from the sheets and measurements)

| | A earlier | B current, HD-2D off | C current, HD-2D on |
|---|---|---|---|
| Pixel sharpness | good | **best** | weaker (blur, glow) |
| Sprites and animation | good | good | good, washed in glow |
| Floor and wall texture | thin (Ashfall only) | **best** | good, hidden under bloom |
| Environmental detail | thin | **best** | good |
| Lighting and atmosphere | plain | good | **best in half the scenes, overdone in four** |
| Bloom and exposure | n/a | n/a | too strong in four scenes |
| Depth of field | n/a | n/a | harms pixel clarity |
| House identity | good | good (Dunmoor muted) | good |
| Boss readability | mixed (clashes) | good | mixed in bloom |
| Consistency between houses | uneven | **best** | uneven |
| Mobile performance | good | good | poor |

## 5. Recommendations (not implemented)

1. **Strongest overall graphics:** **B** (current art, HD-2D off) is the strongest and most consistent version today. C has the strongest individual moments (the Gallowmere feast, Ironvale's forge, the Candlemaker's hall) but is the least consistent, and the version I would most like to see is B's art with a gentler HD-2D, which the game does not offer as a setting yet. The closest thing it already has is its own tier 2 (`contact-sheets/tier2-lighter-hd2d.jpg`), which keeps the glow and drops the blur and the worst white-out.
2. **Did the two updates improve the game?** Update 2: clearly yes, keep all of it. Update 1: partly. It improves mood in roughly half the scenes, hurts pixel clarity and boss readability in several, and costs about twice the frame time.
3. **Too strong in:** Thornwick and the Warden fight (worst), the Candlemaker fight, Gallowmere's fire. Fine in Ashfall, the Spire, Dunmoor and the hub.
4. **Older elements worth retaining:** A's darker, cooler value range in the Candlemaker's hall, Dunmoor's ball (deeper blue) and the Rookery (the new orange is bright and flat); the Warden's bell identity; A's red-carpet-on-dark Gallowmere read, which the new yellow floor makes louder.
5. **Default:** today, `hd2d: false` (B) for everyone is the safest default. A better default, after the changes below, is HD-2D "light" on desktop and off on touch devices.
6. **Small adjustments** (each is a tuning change, no new art):
   - Turn depth of field off by default (or limit it to the title, hub and cinematics). It is the one effect that works against the pixel-art style.
   - Cap bloom: lower the per-light alpha caps in `js/hd2d.js` (0.42 / 0.6 / 0.9), tint the hot core with the light's colour instead of near-white, and keep additive coverage to about 10% of the screen. Thornwick, the Warden and the Candlemaker fight first.
   - Make light shafts warm-only, shorter and fainter, and skip them in cool houses where they read white.
   - Keep bosses out of the wash: draw the bloom under actors, or lower it near a boss, and add the bell back to the Warden figure.
   - On touch devices, default HD-2D off, or start at a lower tier so players do not sit at 4 fps for ten seconds.
   - Make HD-2D a three-way setting: Off, Light, Full.
   - Separate Gallowmere (gold) from Ironvale (iron-red), and restore Dunmoor's blue.

Nothing above is changed. Say which you want and I will implement them on a separate branch, one at a time, with before and after sheets.
