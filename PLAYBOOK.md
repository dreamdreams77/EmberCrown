# EMBERCROWN: The Playbook

*Working design document. The playable prototype in `index.html` plays all seven missions from Ashfall Keep to the Candlemaker's Crown, with three difficulty settings and three endings.*

---

## 1. Pitch

A third-person stealth-action adventure. You play **Wren Sallow**, a disgraced courier turned spy, and **Ashling**, a runt dragon hatched from the egg she stole. Together you infiltrate the strongholds of seven feuding houses to stop a war that someone is engineering.

**Design pillars**

1. **Mission-based infiltration.** Every castle is a self-contained mission with objectives that change by difficulty.
2. **Two bodies, one plan.** Wren is quiet and clever. Ashling is loud, fast, and fireproof. Good plans use both.
3. **Everyone is playing someone.** Bribes, blackmail, and poison move the houses. Houses can rise, betray you, or fall.
4. **Castles are dungeons.** Locked doors, learned songs, bosses, and places that change over time.

---

## 2. Inspirations and what we took

| Inspiration | What we took | Where it lives |
|---|---|---|
| GoldenEye 007 (N64) | Objective-based missions, difficulty that adds objectives, gadgets, split-screen | Missions, gadgets, co-op |
| Spyro the Dragon (PS1) | Gliding, charging, fire, gem collecting, portal hubs | Ashling's kit, ember gems, hub gates |
| Game of Thrones | Houses, betrayal, shifting alliances, consequences | Court system, house states |
| Zelda 64 | Lock-on targeting, dungeon structure, songs that open things, time change | Targeting, bosses, bone flute, time-shift |

All characters, houses, and places are original.

---

## 3. Controls

| Key | Action |
|---|---|
| WASD / arrows | Move |
| Shift | Sneak (Wren only; much harder to spot) |
| E (hold) | Pick a lock, steal the objective, poison the cup |
| Space | Dragon fire (Ashling only) |
| Tab | Swap between Wren and Ashling |
| Q | Smoke powder |
| R | Whisper bell |
| F | Bone flute: opens the nearest door, but is loud |

---

## 4. Core rules (as implemented)

**Stealth**
- Guards see in a cone (about 70 degrees) up to 5.2 tiles. Walls, closed doors, and smoke block sight.
- Suspicion is a single meter. It rises faster the closer you are and falls slowly when unseen. At 100% you are caught and the mission restarts.
- Sneaking multiplies Wren's visibility range by 0.6. The character you are *not* controlling counts as curled up, also 0.6.
- Ashling is 1.45x more visible than Wren. Power comes with a price.

**Gadgets (per mission)**
- Smoke powder x3: a cloud for 6 seconds that blocks sight lines.
- Whisper bell x3: thrown up to 4 tiles ahead; guards within 9 tiles with a clear line walk over for 3 seconds, then return.
- Bone flute x1: opens the nearest door within 3 tiles, but lures guards within 8 tiles to you.

**Ashling**
- Faster than Wren (135 vs 92 px/s).
- Fire stuns a guard for 5 seconds and adds a little suspicion. Fire reach grows with ember gems (+8 px per gem, capped at 12).
- Fire is the only way to burn signal beacons (hold the flame on it for 1 second).
- If the two are more than 7.5 tiles apart, the tether pulls the idle one to the active one.

**The Whisper Court (intrigue, prototype version)**
Between missions you pick one servant of the next house to turn: bribe the steward (one fewer guard), blackmail the chamberlain (suspicion fades 2.5x faster), or taint the wine (guards see less far and walk slower). The epilogue remembers what you chose.

---

## 5. Cast

- **Wren Sallow.** Raised a courier's orphan. She once delivered a letter that started a border war and was blamed for it. The Hollow Crown gave her a second chance. Dry, observant, bad at trusting anyone.
- **Ashling.** Hatched too early, so he is small and insecure and covers it with sarcasm. Starts with sparks, grows into a storm.
- **Lady Veyra Dunmoor.** Rules the northern marshes. Believes a short, controlled war will prevent a longer one. Gracious, patient, wrong.
- **The Candlemaker.** A masked assassin and a former Hollow Crown agent trained by the same mentor as Wren. Always one step ahead.
- **Lord Tobias Grell.** A cowardly warlord who belongs to whoever flattered him last.
- **Mother Quill.** The Hollow Crown's quartermaster. Hands out gadgets and secrets, and may be hiding her own agenda.

---

## 6. The seven houses

| House | Seat | Flavor | Mission hook |
|---|---|---|---|
| **Marrow** | Ashfall Keep | Bone-white, ash-gray, bitter | Retrieve the egg (tutorial) |
| **Grell** | Gallowmere | Gold and red, loud, greedy | Feast-night forgery and poisoning |
| **Ostrander** | The Drowned Spire | Sea fortress, bells, storms | Dragon-led flight: burn the beacons |
| **Sable** | Thornwick Abbey | Black-robed monks, silence | Dungeon crawl; learn the Song of Opening |
| **Kest** | Ironvale | Forges, iron, pride | Rescue a hostage, then decide what to do with them |
| **Dunmoor** | Dunmoor Marsh | Fog, lanterns, masks | Time-shift: ball, then ruins |
| **Hallow** (extinct) | The Candlemaker's Crown | Ruined, candle-lit | Finale |

---

## 7. Missions

Each mission has three difficulties. Higher ones add objectives and tighten the rules (less suspicion decay, fewer gadgets).

**Chapter I (playable)**

1. **Ashfall Keep** (tutorial)
   - *Courier:* steal the egg, burn the beacon.
   - *Spy:* also open the lower vault door without the flute.
   - *Shadow:* never be seen by more than one guard at a time; no flute.
2. **Gallowmere** (feast)
   - *Courier:* swap the seal, poison the cup, burn the beacon.
   - *Spy:* also steal Grell's ring from the head table.
   - *Shadow:* do all of it without a stunned guard anywhere.

3. **The Drowned Spire** (flight level, playable)
   - You fly Ashling alone over a sea fortress; walls and water do not block you or sight lines.
   - Five rotating searchlight towers and one patrol boat (slightly shorter sight than land guards).
   - Objectives: burn four signal beacons with fire (hold 1 second) and drop Wren's forged letters at two war rooms (hold E).
   - Wren hides offscreen, so gadgets are unavailable. Land on the green pad to finish.

4. **Thornwick Abbey** (dungeon with a boss, playable)
   - *Silence is law:* moving without sneaking makes noise (Wren 4 tiles, Ashling 5) that draws monks who have a clear line to you.
   - Find the lectern and hold E to learn the **Song of Opening**. Until then the flute is silent. After, F opens any door within 3 tiles, including **sealed doors** (purple rune) that lockpicking cannot open, and it never runs out (still loud).
   - The sealed door leads to the bell hall, where the **Bell-Warden** patrols with the abbot's ledger behind him.
   - *Boss rules:* he is deaf to footsteps but not to the whisper bell, so Wren lures him and Ashling burns him from behind. Fire only hurts from behind (about 4.5 seconds of flame to win, health does not regrow). Fire into his front only raises suspicion.
   - *Toll:* every 6 seconds his bell tolls (a gold ring telegraphs it for 0.9 seconds). Whoever you control must stand still if within 7 tiles, or suspicion jumps.
   - Objectives: learn the Song, take the ledger, silence the Warden. The exit opens when all three are done.

5. **Ironvale** (escort and choice, playable)
   - Pick the cell lock (hold E on the door), then hold E on **Perrin Ostrander**, heir of the Drowned Spire, to free him. He follows Wren and guards can see him too.
   - Burn the muster beacon with Ashling, then walk Perrin to the gate. The exit needs him close.
   - **Forge vents** burst into flame on a cycle (they glow orange just before). Standing on a live vent makes Wren suspicious fast. Ashling is immune.
   - **The choice:** return Perrin to House Ostrander (Favor) or hold him as leverage (Fear). Kest gains Fear either way.

**Difficulty (implemented as tuning; extra objectives still planned)**

| Setting | Guard sight | Suspicion recovery | Gadgets |
|---|---|---|---|
| Courier | x1.0 | x1.3 | +1 smoke, +1 bell |
| Spy | x1.1 | x1.0 | standard |
| Shadow | x1.2 | x0.7 | -1 smoke, -1 bell, no flute |

6. **Dunmoor Marsh** (time-shift, playable)
   - One hall in two states. **The ball:** crowded and dim, six masked guests drift through and block sight lines, eight guards patrol, and guards see 10% less far. **The ruins, three years later:** four guards, but they see 10% farther, rubble blocks the middle of the hall, and forge-style fire vents flare on a cycle.
   - Stand on a **pedestal** (three in the hall) and press F to play the **Song of Time** and switch states. It is loud: guards within 8 tiles come to investigate. Your position, stuns, burned beacons, and picked-up gems carry over; if rubble lands on someone, they are nudged to open floor.
   - **Plant the forged treaty** at the head table (hold E, ball only). **Take Veyra's signet** from the ruined throne room (hold E, ruins only). **Burn the muster beacon** with Ashling (either state).
   - *What survives:* the throne room is walled off in the ball. In the ruins a collapse always opens a route from the east corridor (past the vents), but if you planted the treaty first, the wall facing the ballroom has also fallen, giving a much safer way in.
   - Results: Dunmoor gets +Ruin and +Fear.

7. **The Candlemaker's Crown** (finale, playable)
   - A ruined hall of extinct House Hallow, lit by five candles. The Candlemaker, a former Hollow Crown agent trained by Wren's own mentor, patrols it.
   - **Candles:** snuff all five (hold E, Wren only). While any candle burns he is shielded and Ashling's fire does nothing. The hall gets darker with each one snuffed.
   - **The boss:** like the Bell-Warden, fire only hurts him from behind (22 health per second), and the whisper bell lures him. His signature is the **blink**: every 8 seconds he marks a spot 1.6 to 3 tiles from whoever you control (a pulsing orange ring), then appears there 1.3 seconds later facing you. If you are still within about 2 tiles, suspicion jumps. Move off the ring.
   - **Your houses shape the fight** (the briefing screen shows the numbers):
     - Each house with Favor sends help: +1 whisper bell (up to +3).
     - Each house with Fear stands down: one guard fewer (up to 3).
     - Each house with Ruin has crumbled: he starts with 8 less health per house, from 100.
   - **The throne:** once the candles are out and he is down, the throne opens. Reaching it ends the game with a choice.

**The three endings**

| Choice | Requirement | What happens |
|---|---|---|
| Crown a puppet | none | The house you hold the most Fear over (then Favor) wears the crown. The epilogue changes with your total Fear and Favor. |
| Burn it all down | none | Ashling burns the throne and the hall. Every house takes +1 Ruin. The epilogue is harsher if you already ruined many houses (4 or more). |
| Break the throne | 20 of 33 ember gems (60%) | Ashling shatters the throne and no crown remains. Every house gets +1 Favor. The epilogue is kinder if you helped three or more houses. |

The ending screen shows the ending title, a short epilogue, ember gems, times caught, rank (Ghost, Courier, or Loud), and every house's Favor/Fear/Ruin. Gems are counted once per mission, so replaying a mission after being caught cannot inflate the total.

---

## 8. Dragon growth (ember gems)

| Gems | Ashling | Unlock |
|---|---|---|
| 0 | Hatchling | Sparks, short flame |
| 6 | Fledgling | Glide over pits and low walls |
| 14 | Wyrmling | Charge attack: smashes brittle doors |
| 24 | Drake | Wide flame; can carry Wren across gaps |
| 36 | Dragon | Full flame; unlocks the finale ending choice |

The prototype implements flame reach only, plus the finale gate: the **Break the throne** ending needs 20 of the 33 gems in the game (60%). The thresholds above are the full-game design and will be rescaled to the final gem count.

---

## 9. House state system (prototype implemented)

**As implemented.** Each house tracks Favor, Fear, and Ruin, and each finished mission adds to them based on what you did:

| Mission | Result |
|---|---|
| Ashfall Keep | Marrow +Fear |
| Gallowmere | Grell: bribe = +Favor, blackmail = +Fear, poison = +Ruin |
| Drowned Spire | Ostrander +Fear and +Ruin |
| Thornwick Abbey | Sable +Fear and +Ruin |
| Ironvale | Kest +Fear; Ostrander +Favor (return Perrin) or +Fear (leverage) |
| Dunmoor Marsh | Dunmoor +Ruin and +Fear |

The totals across all houses shape every later mission (shown on the briefing screen):

- **Favor:** suspicion fades 10% faster per point (up to 4 points).
- **Fear:** guard sight shrinks 3% per point (to a minimum of 80%), but suspicion builds 5% faster per point. They look away, and they resent you.
- **Ruin:** every 2 points, one patrol guard has fled, and the remaining guards move 5% faster per point.

The ending screen lists every house as Favor/Fear/Ruin. Per-house effects (a house helping or hindering only its own mission) are still planned.

**Original design (planned in full).**

Each house tracks three values: **Favor**, **Fear**, **Ruin**.

- Favor: they help you. Open doors, patrol gaps, hints.
- Fear: they obey but resent you. Cheaper bribes, riskier betrayals.
- Ruin: they fall between missions. Fewer guards, but also fewer allies and more chaos.

Houses you ignore slowly rise in Ruin. Houses you lie to rise in Fear. The Whisper Court screen before each mission offers 3 to 5 actions from a pool: bribe, blackmail, poison, flatter, expose, forge.

---

## 10. Time-shift mechanic (implemented in Dunmoor Marsh)

The prototype version is described under mission 6 above. The full design:

The same castle exists in two states:

- **Feast:** crowded, loud, lots of cover, guards watch each other.
- **After the war:** ruined, empty, few guards, but collapsed routes and fire hazards.

The bone flute's Song of Time switches state at special pedestals. Objects you move or burn in one state persist in the other.

---

## 11. Bone flute songs

| Song | Effect |
|---|---|
| Opening | Opens sealed doors (implemented: learn it in Thornwick Abbey, F near a door) |
| Calling | Summons Ashling to Wren's position (planned) |
| Hush | Muffles footsteps for 10 seconds (planned) |
| Time | Switches feast and ruin states (implemented: F at a pedestal in Dunmoor Marsh) |
| Ember | Ignites braziers and beacons from a distance (planned) |

---

## 12. Split-screen co-op (planned)

Player 1 is Wren. Player 2 is Ashling. Each has their own camera. Objectives require both, such as Ashling distracting guards while Wren steals. Suspicion is shared.

---

## 13. Art and audio direction

- **Look:** low-poly N64/PS1 silhouettes with modern lighting. Chunky textures, saturated torch colors, long shadows.
- **Palette:** each house owns a color (Marrow ash-gray, Grell gold, Ostrander sea-green, Sable black, Kest iron-red, Dunmoor fog-blue).
- **Audio:** a bass-and-percussion spy theme that bends into a horn-driven war theme as suspicion rises. Ashling's voice is gravelly and fast.

---

## 14. Prototype status and roadmap

**Done (v1.0 prototype):** all seven missions are playable start to finish: the Drowned Spire flight level, the Thornwick Abbey boss dungeon (silence rule, sealed doors, learnable Song of Opening, Bell-Warden), Ironvale (escort, forge vents, hostage choice), Dunmoor Marsh (two time states, Song of Time pedestals, state-gated objectives), and the Candlemaker's Crown finale (candle shield, blink, houses shaping the fight, three endings); house Favor/Fear/Ruin that changes later missions; rotating searchlight towers, difficulty select (Courier, Spy, Shadow), stealth cones with line of sight, guard patrols, lures, dragon fire and beacons, ember gems, locks, gadgets, Whisper Court choice, ending screen.

**Next:**
- v0.2.1: lock-on targeting, extra objectives on Spy and Shadow.
- v1.1: remaining bone flute songs (Calling, Hush, Ember), per-house effects (a house helping or hindering only its own mission).
- v1.2: the dragon growth unlocks (glide, charge, carry) and per-ending variations by house.
- v1.3: split-screen co-op.
- Later: a 3D or pseudo-3D presentation to match the N64/PS1 look described in the art direction.

**Level design checklist**
- Every objective reachable by at least two routes.
- At least one route that needs the dragon and one that needs a lock.
- Guard patrols leave a gap of at least 2 seconds.
- No fail state from fire alone.
- A visible signpost for every objective in the first 10 seconds.

---

## 9. Depth systems added after the prototype

**Secrets and discovery**
- Each mission hides one annex room behind a *cracked wall* (`k` in the map data). Ashling opens it by holding fire on it for about a second, or by dashing into it. Explosions also break cracks.
- Annexes hold an *ember cache* (+3 gems; the Break-the-Throne gem requirement still counts only regular gems), a lore scroll, and the mission's **relic**.
- Relics are permanent for the playthrough and carry into later missions: Cat's-Paw Boots (faster sneaking), Grell's Gilded Purse (+1 bell), Stormglass Lens (+14 fire reach), Hush Cowl (-10% suspicion gain), Forgeheart Ember (faster, longer-stunning dash), Veyra's Silver Mask (+20% suspicion decay), Hallow Candle-Stub (+1 smoke).
- Lore scrolls are logged in the Codex, which also remembers relics across playthroughs.

**Combat and encounters**
- *Ember Dash* (Shift as Ashling): a short charge, 2.6 s cooldown. Stuns ordinary guards, is blocked by brutes and the Candlemaker's candle shield, chips the Bell-Warden for 8, shatters cracked walls.
- *Oil barrels* (`o`): ignite with fire. Blast radius 2.7 tiles stuns guards (brutes 2 s, others 4.5 s), hurts Wren if she is within 1.5 tiles, lures every guard within 9 tiles, and chains to neighbouring barrels.
- *Guard types* (assigned per mission): **hound** (fast, short wide cone, smells within 2.5 tiles through any facing), **archer** (1.45x range, narrow 40 degree cone, slower), **brute** (shield: fire only stuns from behind, 4 s).
- Guards who lose sight of you walk to your last seen position for about 1.6 s before returning to their patrol.

**Ranking.** Missions are scored from peak suspicion, times spotted, time taken and secrets found: S, A, B or C.

**Presentation.** Dynamic lighting from torches, candles, vents, beacons, gems and the characters; screen shake and floating combat text; alert (`!`) and curious (`?`) markers over guards; interaction prompts; a fog-of-war minimap that pings objectives.

---

## 10. Combat, bosses, vaults and the Forge

**Hearts and damage.** The team shares 4 hearts (up to 6 with talents). A hit costs 1 heart (slams and the Warden's phase-2 slam cost 2 in damage terms), grants 1.15 s of invulnerability, and knocks the active character back. Rolling (Wren) and dashing (Ashling) are fully invulnerable. Hearts reach zero: *Overwhelmed*, retry the mission. Reaching 100% suspicion still means *Caught*, as before.

**Wren.** Strike: 3-hit combo (third hit is heavier). Hitting an unaware guard from behind is a silent *takedown* (9 s KO, 16 s with Silent Blade). Facing or alerted guards are only staggered and the noise draws others. Shielded brutes block frontal strikes. Roll: 0.3 s, i-frames, 0.85 s cooldown.

**Ashling.** Fire (damages foes, burns beacons, lights braziers, destroys fire orbs), Ember Dash (2.6 s, charges with Twin Dash), Ember Nova (84 unit radius, 6 s cooldown, unlocked at the Forge).

**Foes.** *Cinderling*: 2 HP, winds up for 0.46 s then lunges; vulnerable while recovering. *Ashwisp*: 2 HP, hovers and fires orbs after a 0.62 s charge. *Hollow Husk*: 6 HP, 0.95 s slam with a ground telegraph, takes half damage from the front, dazed while recovering. Smoke breaks their line of sight and whisper bells pull them away.

**Bosses.** Both stay stealth puzzles until they notice you (or you hit them), then a cinematic introduces the fight. 100 HP, a second phase at 50%, and damage rules that reward reading the pattern:
- *Bell-Warden*: slam (telegraphed circle + shockwaves), charge (telegraphed line; crashing into a wall dazes him for 2.2 s), bell toll (stand still or take damage). He can only be burned from behind or while dazed.
- *Candlemaker*: shielded while any candle burns. Volleys, blink-strikes with a cone telegraph, phase-2 orb rings, and summoned wisps. Snuff the candles, then punish the stagger after each blink-strike.

**Vaults.** A 9x7 wing behind each cracked wall (not in the flight mission): left chamber has 3 unlit braziers (Ashling's fire), pots and an inspect point; the gate at the centre opens when all three burn. The relic chamber holds the relic, an ember cache and a lore scroll; taking the relic seals the vault and starts two waves of guardians suited to the area. Clearing them opens the gate and spawns a chest.

**Cinders and talents.** Cinders come from pots, foes, chests, examined story points, secrets and mission rank (S 150, A 100, B 60, C 30), and are banked when the mission is completed. Twelve talents, 90-320 cinders each: Quick Fingers, Deep Pockets, Silent Blade, Shadow Cloak; Dragon's Lung, Searing Flame, Twin Dash, Ember Nova; Stout Heart I and II, Scavenger, Phoenix Spark.

**Presentation.** Letterboxed fly-over intros (skippable), boss entrance and defeat cinematics with slow motion, a victory fireworks sequence, hit-stop, zoom punch, screen shake, iris transitions, per-area colour grading and a parallax scenery backdrop.
