# Ember art slice: report

## What was built (all playable in Ashfall Keep)
1. **Hero: Shiloh.** A new courier: copper curl of hair, teal waxed coat, wax-red scarf that trails when moving, satchel, brass buckles. Three drawn views
   (front, back, side; right is the side mirrored), idle, 6-frame walk, 5-frame dagger strike with a pale crescent, hurt, knocked-down.
2. **Two guards who do not share a silhouette.** *Pell*, the pikeman: tall kettle helm, bone-white crest stub, plum tabard with Marrow's crescent, a long spear.
   *Sergeant Gaunt*: broad, bald, stubbled temples, bone breastplate and pauldrons, a hooded lantern. The game alternates them along the keep.
3. **Expression system.** Faces are a separate atlas drawn on the head every frame, so every character blinks and changes face with the game state: calm, blink,
   wary (lured), alarm (sees you), rage, hurt, knocked-out, joy. Shiloh narrows her eyes when sneaking and gasps when seen; a guard who spots you hops and gapes.
4. **Enemy: the Cinderling** (the coal-sprite from the Marrow vault). Angry grin and brows, flame crest, squash when it winds up, stretch when it lunges, face-down when it dies.
5. **Ashling**, the runt dragon, redrawn to match (big head, glossy eyes, tail flame, wings; idle, walk, fire, hurt, down).
6. **A redesigned Marrow room.** Original flagstone floors (four variants, mostly large calm slabs), stone walls with ossuary niches and arrow slits, plum banners with a
   bone crescent, iron wall sconces with a 3-frame flame, and furniture: crates, barrel, table with candle and bowl, bench, cot with a plum blanket, weapon rack, sacks, the hooded
   mourner statue, a sarcophagus, plus skulls, bones, webs and chains. Bone is Marrow's ornament.
7. **One UI language.** HUD panels, hearts, objective box, ability bar, dialogue bubble, title, menus, cards, journal and the touch buttons share plum ink panels, a dark edge, a thin gold rule,
   chamfered corners and a hard pixel shadow. Dialogue portraits for Shiloh and Ashling are cut from the very sprites and faces used in play.
8. **Lighting and effects.** HD-2D is off by default (configuration B) and still selectable. The fire light on Ashling's breath is now a warm pool that keeps floor detail instead of a white-out.

Gameplay code is unchanged: same movement, stealth, combat, vision cones, KO, bosses. The full test suite passes, plus `tests/ember.test.js`.

## Honest assessment
**What works.** The characters are now unmistakably this game's own. At normal zoom you can see who is calm, who is suspicious and who has spotted you, which the original figures
(small, expressionless) could not show. The two guards read as different people. Banners, sconces and furniture give Ashfall a place-specific, Marrow-specific look.
The UI finally looks like one piece with the art, on desktop and on the phone layout.

**What is not good enough yet** (so you do not have to find it):
* **The room is paler and busier than it should be.** The new floor and wall are lighter than the original and the 16px slab grid is visible everywhere. The ambient darkness is
  the game's old one; the slice has not had a proper lighting pass (warm pools around sconces, cooler shadow in corners, floor decals, rugs in the Marrow palette). This is the next thing to do.
* **Mixed leftovers in the same room.** Pots/urns, braziers, the doors, chests, Pip and the other NPCs are still the old art. It is a slice, not a replacement.
* **Scale.** Ember figures are about a quarter bigger than the LPC ones (so faces survive normal zoom). Doors, ceilings and NPCs have not been resized to match.
* **Walk and strike are 6 and 5 frames.** Convincing, not luxurious: no anticipation or follow-through on the strike beyond the crescent, the guards have no attack or talk animations.
* **Right-facing figures are mirrors**, so asymmetric details (satchel, sword hand) flip sides.
* **Not measured:** performance on a real phone. The slice adds no render passes (it is sprites and tiles), so cost should be close to the LPC art, but I have only run it in headless Chromium.
* The hosted/phone build was tested as a local file in a phone-sized emulator with touch input, not on a physical device.

## Is it working as a direction?
Yes for characters, UI and the room's identity. Not yet for atmosphere. I would not start a full replacement until you have judged the characters and the room in the playable build.

## Extending it to every House and mission
The slice was built so each new House is a costume and a set, not a new engine.

**Reusable now (done once):** the painter and light model (`pix.py`), the biped skeleton and animation (`biped.py`), the expression atlas (`faces.py`), the draw wrappers and run-time face overlay (`js/ember.js`),
the UI skin (`ember.css`, `panelBox`), the bundle and screenshot tooling. A new person is a config: a few ramps, a head function and one body function, about 60 lines.

**Per House (new art):** one tileset (4 floors, 6 wall faces, a top), about 12 to 15 props, 2 guard costumes and 1 or 2 officers, the House's NPCs, and its boss or champion where it has one.
Faces and animation are inherited.

| House (mission) | Palette | Architecture and materials | Signature props | People |
|---|---|---|---|---|
| Marrow (Ashfall Keep) *done* | ash-violet, plum, bone | pale flagstone, bone niches, arrow slits | plum banners, sconces, mourner statue, sarcophagus | Pell, Gaunt, Cinderling |
| Grell (Gallowmere) | oxblood, gilt, walnut | parquet, red carpet, painted beams | chandelier, feast table, ledgers, vases | fat-coated stewards, a banker-captain |
| Ostrander (Drowned Spire) | teal, wet slate, lantern amber | flooded roofs, pilings, rope and tar | lanterns, nets, rowboats, bells | oilskin watchmen, harbour pilot |
| Sable (Thornwick Abbey) | night blue, candle gold, pale stone | vaulted abbey, stained glass, choir stalls | bell, lecterns, bookcases, choir stalls | cowled brothers, the Bell-Warden (boss) |
| Kest (Ironvale) | forge orange, soot, iron | riveted plate, slag channels | anvils, furnaces, tool racks, coal | smiths in leather aprons, a foreman |
| Dunmoor (Dunmoor Marsh) | marsh blue, mist, pearl | ballroom checkerboard, then the ruined hall at night | mirrors, masks, strings of lights, clock | masked guests, ruin-dwellers |
| The Hollow Crown (Candlemaker's Crown) | wax gold, bone, black | throne room, candle-shrine, wax drips | candle-stands, the throne, shrine | the Candlemaker (boss), wick-acolytes |
| the Rookery (hub) | warm timber, straw, sky | wooden yard, the Rookery walls | dummies, bunks, notice boards | the hub NPCs |

Count: seven Houses plus the Hollow Crown, with the hub on top. Marrow is done.

**Order I would take:**
1. Fix the slice's atmosphere first (lighting pools, floor contrast, decals, rug), because every House inherits it.
2. Redraw the remaining shared pieces once: doors, chests, pots, braziers, hold-to-interact markers, the NPC base (so Pip and company join the family).
3. The Hub next, because players see it between every mission.
4. Then one House per pass, in play order (Grell, Ostrander, Sable, Kest, Dunmoor, the Crown). For each: tileset, props, two guard costumes, and a review of screenshots next to the original before moving on.
5. Bosses last and by hand: the Bell-Warden and the Candlemaker get bespoke animation, bigger scale and their own faces.

**Rough size:** the slice (3 people, 1 enemy, the dragon, 1 tileset, about 15 props, UI) is a bit over one working week of art at this quality. I would expect each further House to take
somewhat less than that thanks to the shared pieces, with the two bosses and the hub costing more.

**Licensing.** The slice contains no third-party art. Replacing every House removes the CC-BY-SA/GPL LPC dependency (see `CREDITS-LPC.md`) from the shipped game.

**Risks to watch:** inconsistent scale between old and new during the transition (do not ship a mixed mission), keeping faces readable on phones (test each costume at phone zoom), and palette drift: every ramp should be a
named constant in the pipeline, not a one-off.

---

# Round 2: review of the rendered build, and what changed

Reviewed by playing and photographing the real game (every room of Ashfall Keep at 1280x720 and 844x390, the whole keep zoomed out, close-ups, real keyboard and touch input).
Sheets: `contact-sheets/round2/`. Raw frames: `review/`.

## What the rendered review found (round 1 build)
* The whole keep was one flat lavender wash: floors, walls and light were the same value, no warm light anywhere, no dark corners.
* Rooms were empty slabs with old-style black-pit rugs. Doors, chests, pots, braziers and Pip were still the old art, and the ruined state had no Ember art at all.
* Characters were fine; the world around them was not.

## What was done (all hand-authored sprites and tiles, built by `tools/ember_art/`)
1. **Lighting, as a model and not a filter.** Cool indigo ambient (a warmer dark when ruined); every light is now a pixel-stepped pool of four bands with an ordered dither between them, drawn at 2 world units per cell (4 once the game has dropped quality). Warm sconce and brazier light gets a strong pool, cool light (vault wards, the exit) stays gentle, so nothing blows out to white. The old smooth black wall gradient is replaced by dithered, indigo wall-shadow tiles (north, west, east and corner pieces), so corners are cool and dark.
2. **Floor detail.** Floors are now large calm slabs with seven drawn detail tiles scattered at about 8%: drain grate with a damp trail, puddle with a highlight, scorch, bones and a skull, a long crack, a faint plum rune circle, rubble. All darker than round 1 so figures read against them.
3. **A Marrow rug kit.** Corner, edge, field and a bone-crescent medallion in plum and bone with a gold rule, assembled to any room size, two colourways. It replaces the black-pit rugs.
4. **Doors, gates, chests, pots, urns, braziers.** Plank door with iron straps, open door, portcullis (down and raised), the plum rune seal (two frames), banded chest with a bone inlay (closed, open with coins), a terracotta pot, a plum-glazed urn, a tripod brazier (three flame frames and unlit).
5. **Pip and Hale.** Pip: a small scullion with a flat cap, goggles pushed up, freckles, a slop pail and a grubby apron. Hale: striped jersey, red bandana, grey beard, manacles; unchained once freed. Both have walk and idle in three views, blink and react, and their dialogue portraits come from the same sprites and faces.
6. **The ruined state, for every prop and surface.** Burnt versions of every prop, chest, pot, urn and door (their own ramps re-mapped to charred and ash tones, then chipped, cracked, sooted and glinted with embers), five collapsed floor tiles (plain, cracked, ash-drifted, charred, pit), three broken wall faces with gaps and soot streaks, scorched wall tops, rubble piles beside burnt props, and a scorched rug. This is processing of designed sprites plus hand-drawn rubble, not a filter on the screen.
7. **Checks.** Full suite: 33 of 33 pass, with `tests/ember.test.js` now covering the ruined state, stepped light, the saved-profile skin and the toggle. Real-input gameplay run on the final single-file build: 24 of 24 checks pass on desktop (keyboard) and phone (touch): start from the title, walk, strike, take a guard down, talk to Pip, swap to Ashling, breathe fire, pause, resume, get caught, retry.

## Performance (headless Chromium, software rendering: read the gap, not the numbers)
| | Original | Ember |
|---|---|---|
| Desktop, real time | 57.2 fps | 57.0 fps |
| Phone viewport, 4x CPU throttle, real time | 22.5 fps (quality tier 3) | 22.2 fps (quality tier 3) |
| Desktop, JS time per frame | 8.6 ms | 8.0 ms |
| Phone, JS time per frame, 4x throttle | 39 ms | 36.5 ms |

No measurable cost. The finer light layer is the one thing that could cost; it falls back to the coarse grid when the game drops quality.

## Remaining issues, honestly
* **The ruined state never happens in Ashfall Keep.** In the game only Dunmoor Marsh time-shifts into ruin, and Dunmoor is not part of this slice. I made the Ember art handle `G.state==='ruin'` and verified it by forcing the state in Ashfall (tests and `normal-vs-ruin` sheets); it has not been seen in a real Dunmoor run, and Dunmoor would still draw its own non-Ember art.
* **Chests are not on the normal Ashfall route.** They appear in the vault. I verified them by placing them in the game (closed, open, ruined), not by reaching them in play.
* **Light pools are soft and a little pink-grey** rather than a clean orange, and the 2-pixel dither can read as faint grain over large areas. A hand-tuned palette per light would be better.
* **The room is still mostly one family of purple.** Contrast is better, but a premium finish would add a second material (timber floors in barracks, rush mats, a cold stone cellar) so rooms differ from each other.
* **Still the old art in this room:** gems, egg, beacon and key pickups, hold-to-interact rings, story-point scenes, hidden-chamber cracks, the stained-glass windows, floating text and speech bubbles, the vision cones, pipe and small fires, the vault's chalk glyphs. The title, brief, win and lose screens have the new UI skin but not new illustration.
* **Characters:** right-facing is a mirror; Hale has no seated or chained pose and no side-view beard; Pip and Hale have idle and walk only; guards have no attack or talk animation; Shiloh's strike is 5 frames. Ember figures are about a quarter bigger than the old ones and doors and ceilings were not rescaled to match.
* **Not measured on a real phone.** The phone numbers are an emulated, throttled viewport.
* **Scope:** this is still Ashfall Keep only. Other missions, the hub, and the other NPCs keep LPC art.
