# Plain Wax: design notes

How the game works as it is built today, then what is still only an idea. Numbers here match the code.

## Premise

Six months ago Shiloh Sallow carried a sealed letter across a border and a war started. She was blamed and her guild dropped her. Mother Quill of the Hollow Crown, a network of couriers and spies, gives her a way back in: steal back a dragon egg, and then, house by house, find out who wants the war. The egg hatches Ashling, a runt dragon who covers his insecurity with sarcasm and wants, above everything, to be written down.

Design goals:

1. Every castle is a self-contained mission with objectives.
2. Two bodies, one plan: Shiloh is quiet and clever, Ashling is fast, loud and fireproof.
3. Your choices change the houses, and the houses change the later missions.
4. Castles behave like dungeons: locked doors, a learned song, bosses with rules, a place that changes over time.

## Story (spoilers)

The Hollow Crown engineered the war. It wrote seven letters, one per house, each telling a lie about another, and needed one courier who would never read them and could take the blame. That was Shiloh. The Crown wants the houses exhausted and in debt to the Counting House, so that whoever ends up on the throne is on the Crown's strings.

The recurring motif is the **blank wax ring**: every Crown seal is a ring of plain wax with nothing pressed into it. Shiloh notices it in every mission before she understands it. Each mission adds one clue:

| Mission | Clue |
|---|---|
| 1. Ashfall Keep | The egg crate is sealed with a blank ring. Marrow stamps a bone on everything. |
| 2. Gallowmere | Under Grell's treaty seal is the same ring. |
| 3. The Drowned Spire | A receipt book in each war room is signed "S. Sallow, courier". She delivered all seven letters. |
| 4. Thornwick Abbey | The abbot's ledger: Counting House gold, paid for silence about seven letters carried by one courier. |
| 5. Ironvale | Perrin says the courier who brought Kest its raid orders tied her satchel as Shiloh does. |
| 6. Dunmoor Marsh | In the signet case, a note from Quill. In the ruins, three years on, the Crown's ring hangs where Dunmoor's banner was. |
| 7. The Candlemaker's Crown | The Candlemaker was trained by Quill too. He lights a candle for every crown she has emptied. |

This is why the endings mean something: crowning a puppet finishes Quill's plan, burning it all down lets her rebuild, and only breaking the throne leaves her holding nothing. The Candlemaker says so as he falls.

Each house has its own register in its guards' barks and lines: Marrow cold and clipped, Grell loud and drunk, Ostrander nautical, Sable hushed (the monks mime), Kest blunt, Dunmoor elegant, Hallow candle-lit and quiet. All of it lives in `js/text.js`.

## Stealth

- A guard sees in a cone about 71 degrees wide (0.62 radians either side) out to 5.2 tiles. Walls, closed doors and smoke block sight. A guard always notices someone within 0.9 tiles unless Shiloh is sneaking.
- Suspicion is one meter. It rises faster the closer you are and falls slowly when unseen. At 100% you are caught and the mission restarts.
- Sneaking shrinks Shiloh's visibility to 0.6x and halves her speed (48 against 92 pixels per second). The character you are not controlling counts as curled up and is also 0.6x. Ashling is 1.45x more visible than Shiloh and moves at 135.
- **Light.** Wall torches, lit beacons, candles, live forge vents, guard lanterns and Ashling's fire are light sources. How lit you are scales guard sight on you from 0.82x in shadow to 1.22x in full light. A gem in the HUD shows Shadow, Dim or Lit. Not used on the flight mission.
- **Noise.** Outside Thornwick Abbey, a running Shiloh (1.8 tiles) or a walking Ashling (2.4 tiles) makes a footstep every 0.45 seconds. A guard in range who is facing away turns toward it and pauses. Sneaking is silent.
- **Searching.** A guard who loses sight of you walks to where he last saw you, searches for 2.4 seconds, then returns to his patrol. Guards also look left and right when they pause at a waypoint.
- **Takedown.** Sneak up behind an unaware guard (not a boss or a tower) and hold E for 0.6 seconds. He is out for 10 seconds. Fire stuns for 5 seconds and adds a little suspicion.
- **Bodies.** A guard who sees a stunned comrade within 4.2 tiles adds 0.22 suspicion and goes to check. Each body is found once. Waking guards are groggy and look around first.
- **Tether.** If the two characters get more than 7.5 tiles apart, the idle one is pulled to the active one.

## Gadgets

| Gadget | Effect |
|---|---|
| Smoke powder | A cloud for 6 seconds that blocks sight. |
| Whisper bell | Thrown up to 4 tiles ahead. Guards within 9 tiles with a clear line walk over for 3 seconds, then return. |
| Bone flute | Opens the nearest door within 3 tiles but lures guards within 8 tiles. At Thornwick it is silent until you learn the Song of Opening. |

Each mission sets the starting counts. Difficulty adjusts them (below).

## Ashling and ember gems

Fire is the only way to burn signal beacons (hold the flame on one for a second). Each ember gem you have collected extends flame reach by 8 pixels, up to 12 gems. There are 33 gems across the game, each counted once per mission, and the third ending needs 20 of them.

## Houses

Each house tracks Favor, Fear and Ruin. Finishing a mission adds to them based on what you did:

| Mission | Result |
|---|---|
| Ashfall Keep | Marrow +Fear |
| Gallowmere | Grell +Favor (bribe), +Fear (blackmail) or +Ruin (poison) |
| The Drowned Spire | Ostrander +Fear and +Ruin |
| Thornwick Abbey | Sable +Fear and +Ruin |
| Ironvale | Kest +Fear. Ostrander +Favor (return Perrin) or +Fear (hold him) |
| Dunmoor Marsh | Dunmoor +Ruin and +Fear |

The totals across all houses shape every later mission (the briefing screen shows them):

- **Favor:** suspicion fades 10% faster per point, up to 4 points.
- **Fear:** guard sight shrinks 3% per point to a floor of 80%, but suspicion builds 5% faster per point.
- **Ruin:** every 2 points, one patrol guard has fled, and the remaining guards move 5% faster per point.

### The Back Stairs

Before Gallowmere you turn one servant of House Grell: bribe the steward (one guard fewer), blackmail the chamberlain (suspicion fades 2.5x faster) or taint the wine (guards see 25% less far and walk slower). The epilogue remembers it.

## Difficulty

| | Guard sight | Suspicion recovery | Gadgets |
|---|---|---|---|
| Courier | 1.0x | 1.3x | +1 smoke, +1 bell |
| Spy | 1.1x | 1.0x | as set by the mission |
| Shadow | 1.2x | 0.7x | -1 smoke, -1 bell, no flute |

Difficulty is currently only tuning. It does not add objectives.

## Missions

Seven missions. Each house has a palette: Marrow ash-gray, Grell gold and red, Ostrander sea-green, Sable black, Kest iron-red, Dunmoor fog-blue.

1. **Ashfall Keep** (House Marrow). Steal the egg, which hatches Ashling, burn the signal beacon, leave by the gate.
2. **Gallowmere** (House Grell). Swap the seal on the treaty, poison the wine cup, burn the beacon. Preceded by the Back Stairs.
3. **The Drowned Spire** (House Ostrander). A flight mission as Ashling alone. Walls and water do not block you or the guards' sight. Five rotating searchlight towers and a patrol boat. Burn four beacons, drop forged letters in two war rooms, land on the green pad.
4. **Thornwick Abbey** (House Sable). Silence is law: walking without sneaking makes noise (4 tiles for Shiloh, 5 for Ashling) that draws monks. Learn the Song of Opening at the lectern, which lets the flute open sealed doors that picking cannot, and take the abbot's ledger. The Bell-Warden guards it. He is deaf to footsteps but not to the whisper bell, and fire only hurts him from behind (about 4.5 seconds of flame, health does not regrow). Every 6 seconds his bell tolls, telegraphed by a gold ring for 0.9 seconds: whoever you control must stand still within 7 tiles or suspicion jumps.
5. **Ironvale** (House Kest). Pick the cell lock, free Perrin Ostrander, burn the muster beacon and walk him to the gate. He follows Shiloh and guards can see him. Forge vents flare on a 4-second cycle and glow just before; they raise suspicion fast on Shiloh, and Ashling is immune. At the gate you decide whether to return him to House Ostrander or hold him as leverage.
6. **Dunmoor Marsh** (House Dunmoor). One hall in two states, switched with the Song of Time at one of three pedestals (loud: guards within 8 tiles come to look). The masked ball has eight guards, six drifting guests who block sight, and guards see 10% less far. The ruins, three years later, have four guards who see 10% farther, rubble and forge vents. Plant the forged treaty at the head table (ball only), take Ottoline's signet from the ruined throne room (ruins only), burn the muster beacon. If you planted the treaty first, the throne room wall has also fallen in the ruins, giving a safer route.
7. **The Candlemaker's Crown** (House Hallow, extinct). Five candles light the hall. Snuff them all (hold E, Shiloh only). While any burns, the Candlemaker is shielded from fire. Fire only hurts him from behind (22 health per second from 100, minus 8 per house with Ruin). Every 8 seconds he marks a spot near you with an orange ring and blinks there 1.3 seconds later. Your houses shape the fight: each house with Favor gives one more whisper bell (up to 3), each with Fear removes one guard (up to 3). Reaching the throne ends the game with a choice.

## Endings

| Choice | Requirement | Result |
|---|---|---|
| The Strings (crown a puppet) | none | The house you hold the most Fear over (then Favor) wears the crown. The epilogue shifts with your total Fear and Favor. |
| The Bonfire Year (burn it all down) | none | Every house gets +1 Ruin. Harsher if you already ruined 4 or more houses. |
| The Charter (break the throne) | 20 of 33 ember gems | Every house gets +1 Favor. Kinder if you helped 3 or more houses. |

The ending screen shows the epilogue, gems, times caught, a rank (Ghost, Courier or Loud), and every house's Favor, Fear and Ruin.

## Presentation

- **Look.** 2D canvas, drawn as pressed clay: puffy floor slabs with embossed fingerprint swirls, rounded stone walls, a sea made of stacked lens-shaped plates, characters built from lit gradients with a soft outline and a shared clay grain. A plum darkness layer is lit by torches, beacons, candles and lanterns. Heads are drawn upright and facing the viewer, with expressions for the hero, Ashling, Perrin, guards, monks and both bosses. Renders at 2x on large or high-DPI screens and drops to 1x if frames run slow.
- **Sound.** Everything is synthesized with the Web Audio API. Each mission has its own generative theme; as suspicion rises it adds a kick, hats, a snare and horn stabs, and past 55% a heartbeat. About 35 sound effects, with guard sounds panned and attenuated by position. See `js/audio.js`.
- **Input.** Keyboard, or touch with drag-to-walk and no on-screen controls over the playfield.

## Not built yet

- Saving and pausing.
- Scrolling maps and larger levels. Every mission is a single 25 by 15 tile screen.
- Dialogue beyond one-line barks and the Back Stairs menu.
- The Back Stairs before every mission, with a wider pool of actions (flatter, expose, forge).
- Dragon growth beyond flame reach: gliding over pits, a charge that smashes doors, carrying Shiloh across gaps.
- Flute songs besides Opening and Time: Calling (summon Ashling), Hush (muffle footsteps), Ember (light braziers from afar).
- Per-house effects on a single mission, and extra objectives on Spy and Shadow difficulty.
- Lock-on targeting.
- Split-screen co-op, with Shiloh and Ashling on two cameras and a shared suspicion meter.
