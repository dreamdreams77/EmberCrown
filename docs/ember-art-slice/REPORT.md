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
