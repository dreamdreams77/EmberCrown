# Clay-and-ink vs pixel-art: two lineages of EmberCrown

Comparison only. Nothing was merged, cherry-picked, copied between versions, reverted or pushed to `main`. Both games ran unmodified from isolated worktrees: clay-and-ink at `eeb7539` (branch `ccr-8f845b2c-1nm43x`, titled "Plain Wax"), pixel art at `9f6b3f4` (`main`, titled "EmberCrown") with `settings.hd2d=false` (configuration B).

All screenshots are real gameplay from a fresh profile, same seed, same missions, same viewports (1280x720 desktop, 844x390 phone). Tools are in `tools/`. Contact sheets are in `contact-sheets/`, individual frames in `screenshots/`.

## What each one is

| | Clay-and-ink (`ccr-8f845b2c`) | Pixel art (`main`, B) |
|---|---|---|
| Art | 100% code-drawn: no image files in the repo | LPC sprite and tile sheets plus code-drawn props and UI |
| View | Whole level on one fixed 800x480 canvas | Scrolling camera, zoomed into rooms |
| Size | ~7.9k lines | ~13.5k lines, plus a hub (the Rookery), dungeons, combat, tactics, journal |
| Menus | Canvas panels, one violet-and-gold frame everywhere | DOM overlays, dark ember-and-gold, tabbed journal |
| Licence | All original, MIT-clean | `assets/lpc/` keeps its CC-BY-SA 3.0 / GPL 3.0 / OGA-BY terms (see `CREDITS-LPC.md`) |

## What the screenshots show

**Clay-and-ink.** It reads as a stealth board game: the whole level is visible at once, so every vision cone and patrol is legible, which suits the genre. The faces are the best idea in either game. At close range the dragon sleeps with a smile, guards have expressions, the Candlemaker is a mask over a flame. The title and menus are cohesive and pleasant. But in play it is thin. Every house uses the same rounded-cobble floor, only tinted. There are no rooms, no furniture, no places. Ashfall, Gallowmere, Thornwick and Candlemaker's hall look like one texture in different colours. Characters are about the size of the torch glows, so the faces are invisible at play distance. The lighting is soft blobs and cones, pleasing but flat.

**Pixel art (B).** Every mission is a place: banners and a rug in Ashfall, parquet, chandelier and red carpet in Gallowmere, flooded roofs in the Spire, the forge in Ironvale, a ballroom checkerboard in Dunmoor, a throne room for the Candlemaker. Characters are large enough to read, the HUD and touch controls are properly designed, and the Rookery hub gives the game a home. Bosses are distinct and readable. Its weaknesses: the heroes and guards are recognisably stock LPC (every guard is the same sprite, Shiloh is the generator's default red-haired figure), scales are mixed (the dragon sprite is oversized next to the humans), and the character art has no expressions. The title screen is still vector.

## Artistic assessment

| Question | Verdict |
|---|---|
| Stronger visual identity | **Clay-and-ink, narrowly, on paper.** Its character design and menus feel like one author. In actual play the pixel game has more identity, because each house looks different, while the clay game's board is uniform. |
| More professionally art-directed | **Pixel art.** Rooms, props, palettes per house, readable HUD, mobile controls. The clay UI frame is polished but the playfield is not directed. |
| Character presentation | **Mixed.** Clay has personality but is too small to see. Pixel has size and clarity but generic faces. |
| Environmental presentation | **Pixel art, decisively.** |
| Visual depth | **Pixel art.** Props, walls, layered lighting, scrolling camera. Clay is a flat plane. |
| Cohesion | **Clay-and-ink** (one pipeline, one palette). The pixel game is cohesive within a scene but mixes vector title, LPC art and code-drawn pieces. |
| Potential as a polished premium game | **Pixel art**, with the licence caveat below. It already has the structure of an RPG (hub, rooms, abilities). The clay version would need a new camera, rooms and props before it could look premium. |
| Better foundation for future graphics work | **Pixel art for production, clay for originality.** Pixel art gets you further per hour of work. But its art is borrowed, and the share-alike LPC terms are a real constraint for a commercial release (a licensing question to check properly, not legal advice). The clay lineage has no such constraint. |

## What each does better

**Clay does better:** original, ownable art; expressive faces and creature animation; a single consistent UI language; whole-level stealth legibility; fewer moving parts.

**Pixel does better:** environments and houses that feel different from each other; character scale and readability; camera and depth; HUD, minimap and touch controls; bosses; scope (hub, dungeons, combat, journal).

## Recommendation

**C. Keep the pixel-art version as the foundation (configuration B, HD-2D off or later a lighter setting), and selectively take specific strengths from the clay version.**

Why not A alone: the pixel game's weakest asset is its borrowed identity. It looks good but not like itself, and its character art is generic.

Why not B: returning to clay-and-ink would discard the environments, camera, hub and controls, and the clay playfield would need most of that rebuilt before it reaches the same level.

What option C would involve (described, not done):
1. **Characters first.** Redraw the heroes, guards and bosses as original art in the clay version's spirit (faces, expressions, a sleeping dragon), at pixel-art scale. This gives the game its own identity and removes the main LPC dependence.
2. **Environments next.** Replace the LPC floor and wall tiles house by house with original tiles, keeping the current rooms, props and palettes.
3. **UI.** Keep the pixel version's DOM menus, but borrow the clay version's single frame language and warm paper feel for title, brief and Back Stairs screens.
4. **Stealth legibility.** Consider a toggleable "overview" camera that shows the whole level, as the clay game does, since it makes vision cones easy to plan around.
5. **Licensing.** Decide early whether to keep LPC for a prototype only, and plan to replace it before any commercial release.

If your priority is instead a fully original, ownable look with the least licensing risk, and you accept rebuilding the environments, then the clay lineage is the safer long-term base. That is a bigger job than C.

## Caveats

- The clay game's fixed view means its characters are small in every shot; its close crops (`screenshots/crops/`) use a 3x device scale to show detail the player does not see at once.
- The pixel-art character crops use the game's own debug zoom, so they are softer than the real game looks.
- Clay touch controls are drawn only after a touch event; I did not exercise them, so the phone comparison shows layout only, not touch controls.
- Menus in the clay game are canvas panels, in the pixel game DOM overlays, so their text sharpness is not directly comparable.
- Headless Chromium on software rendering; no performance comparison was made for the clay lineage because the earlier numbers were for the pixel game only.
