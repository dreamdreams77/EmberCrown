'use strict';
/* EMBERCROWN - data: missions, themes, relics, lore.
   Map legend:  # wall   . floor   S start   X exit   D locked door   Z sealed door
   g gem  G ember cache (3 gems, hidden)  O/P/B/L/H/C objectives  T time pedestal  V forge vent
   k cracked wall (burn it / dash into it)  r relic  s lore scroll  o oil barrel  ' ' void */
const T=32;

function buildMap(base,annexes){
  const rows=base.map(r=>r.split(''));
  for(const a of annexes||[]){
    const needH=a.oy+a.rows.length;
    while(rows.length<needH)rows.push([]);
    const needW=a.ox+Math.max(...a.rows.map(r=>r.length));
    const W=Math.max(needW,...rows.map(r=>r.length));
    for(const r of rows)while(r.length<W)r.push(' ');
    a.rows.forEach((s,j)=>{for(let i=0;i<s.length;i++)if(s[i]!=='~')rows[a.oy+j][a.ox+i]=s[i];});
  }
  const W=Math.max(...rows.map(r=>r.length));
  return rows.map(r=>{while(r.length<W)r.push(' ');return r.join('');});
}
/* small helper: put a single character into a base map */
function stamp(map,x,y,ch){const r=map[y].split('');r[x]=ch;map[y]=r.join('');return map;}


/* Vault: a 9x7 dungeon wing behind a cracked wall. Left chamber holds a brazier puzzle, a gate (Y) guards the relic
   chamber, taking the relic wakes the guardians. orient 'E' = entrance on the west, 'N' = entrance on the north. */
function mkVault(orient,crack,inspect,waves){
  const base=["#########","#....#..#","#....#..#","k....Y..#","#....#..#","#....#..#","#########"];
  const g=base.map(r=>r.split(''));
  g[3][7]='r';g[1][7]='G';g[5][7]='s';
  let rows,ox,oy,tr;
  if(orient==='E'){rows=g.map(r=>r.join(''));ox=crack[0];oy=crack[1]-3;tr=(c,r)=>[ox+c,oy+r];}
  else{rows=[];for(let c=0;c<9;c++){let s='';for(let r=0;r<7;r++)s+=g[r][c];rows.push(s);}ox=crack[0]-3;oy=crack[1];tr=(c,r)=>[ox+r,oy+c];}
  const keep=[];for(let c=1;c<=7;c++)for(let r=1;r<=5;r++){const p=tr(c,r);keep.push([p[0],p[1],0]);}
  const T_=a=>a.map(([c,r])=>tr(c,r));
  const ex=tr(-0,3);
  return{annex:{ox,oy,rows},info:{
    braz:T_([[1,1],[4,1],[4,5]]),pots:T_([[1,5],[2,1]]),inspect:[...tr(3,5),inspect[0],inspect[1]],
    spawns:T_([[2,2],[3,4],[2,4],[3,2]]),gate:tr(5,3),outer:tr(0,3),chest:tr(6,1),keep,waves,
    rect:[...tr(1,1),...tr(7,5)],center:tr(3,3),inner:tr(6,3)}};
}
const VW=[['cinder','cinder'],['cinder','cinder','cinder']];

const RELICS={
  boots:{name:"Cat's-Paw Boots",icon:'boots',desc:'Wren creeps 25% faster while sneaking.'},
  purse:{name:"Grell's Gilded Purse",icon:'purse',desc:'Every mission starts with one extra whisper bell.'},
  stormglass:{name:'Stormglass Lens',icon:'lens',desc:'Ashling\'s fire reaches 14 units further.'},
  cowl:{name:'Hush Cowl',icon:'cowl',desc:'Suspicion builds 10% slower.'},
  forgeheart:{name:'Forgeheart Ember',icon:'ember',desc:'Ember Dash recharges faster and stuns longer.'},
  mask:{name:"Veyra's Silver Mask",icon:'mask',desc:'Suspicion fades 20% faster when unseen.'},
  stub:{name:'Hallow Candle-Stub',icon:'candle',desc:'Every mission starts with one extra smoke powder.'}
};


const VAULTS=[
 mkVault('E',[24,12],['Marrow Reliquary','Bones arranged by size, tenderly. The egg was not the first thing they tried to keep.'],[['cinder','cinder'],['cinder','cinder','cinder']]),
 mkVault('E',[24,7],["Grell's Real Treasury",'Empty, except for a ledger: every coin has already been spent twice.'],[['cinder','cinder'],['wisp','cinder','cinder']]),
 null,
 mkVault('N',[7,14],['The Unsung Song','Notes scratched into the stone. Whoever carved them could not read music, only feel it.'],[['cinder','wisp'],['husk']]),
 mkVault('E',[24,8],['Forge-Heart Chamber','The first anvil of House Kest, cracked in two. It rang once when it broke, and nobody has forgotten the sound.'],[['husk','cinder'],['wisp','wisp','cinder']]),
 mkVault('E',[24,9],["Veyra's Mirror",'A mirror turned to face the wall. The back is covered in tally marks, one per guest.'],[['wisp','cinder','cinder'],['husk','wisp']]),
 mkVault('N',[4,14],["Candle-Wright's Vault",'Wicks without wax, wax without wicks. Whoever made five candles meant to make a sixth.'],[['husk','cinder','cinder'],['wisp','wisp','husk']])
];

const LEVELS=[
{name:'Ashfall Keep',house:'House Marrow',sigil:'marrow',
 th:{floor:'stone',wall:'brick',amb:[14,9,22,.40],part:'ash',tapestry:.05,rack:.06,wood:'#6a4a30',stone:'#8a8694',rafters:true,chains:.05,web:.05,grade:'rgba(90,70,140,.20)',bg:'night',wood:'#6a4a30',stone:'#8a8694',rafters:true,chains:.05,web:.05,grade:'rgba(90,70,140,.20)',bg:'night',torch:.16,banner:.07,bannerCol:'#cfc9bd',bones:.045,guard:'#8d8a98',trim:'#d9d4c4',music:{root:98,mode:'minor',tempo:.9}},
 pal:{f1:'#24202c',f2:'#282431',w:'#4a4458',wt:'#615a73'},
 intro:['House Marrow keeps a stolen dragon egg in its north-east tower.','Steal it, then burn the signal beacon so no alarm travels.','Then slip out through the gate.','','Something in that egg is going to be very annoyed.'],
 opening:'Egg is in the north-east tower. Quiet feet.',
 labels:{O:'Steal the dragon egg',B:'Burn the signal beacon'},
 gadgets:{smoke:3,bell:3,flute:1},
 map:buildMap([
 "#########################",
 "#S...#.........#.......O#",
 "#....#....g....#........#",
 "#.........#....D........#",
 "####.######....#####.####",
 "#...........#...........#",
 "#.....g.....#.....g.....#",
 "#...........D...........#",
 "#####.#######...#########",
 "#...........#...........#",
 "#...........#.....B.....#",
 "#.....g.....D...........#",
 "#...........#...........#",
 "#X..........#...........#",
 "#########################"],
 [VAULTS[0].annex]),
 vault:VAULTS[0].info,
 inspect:[[1,5,'Scorched Barracks Wall','Tally marks, hundreds of them, ending abruptly. Under the last: "They never opened the egg room. They only fed the fire."'],[23,9,'Marrow Banner, Torn','The banner shows a skull wearing a crown of bone. Someone has stitched a small, careful candle into the corner.']],
 extra:[[9,6,'o'],[20,11,'o'],[3,13,'s']],
 guards:[
  [[7,2],[13,2]],
  [[17,2],[22,2],[22,3],[17,3]],
  [[2,5],[10,5]],
  [[14,6],[22,6]],
  [[2,10],[10,10],[10,12],[2,12]],
  [[14,12],[22,12]]],
 kinds:{}},
{name:'Gallowmere',house:'House Grell',sigil:'grell',
 th:{floor:'wood',wall:'brick',amb:[30,14,10,.30],part:'gold',tapestry:.08,wood:'#7a4a2a',cloth:'#8a2a30',tablecloth:true,wine:true,stone:'#b89a5a',statueGold:true,rafters:true,grade:'rgba(255,150,80,.16)',bg:'dusk',wood:'#7a4a2a',cloth:'#8a2a30',tablecloth:true,wine:true,stone:'#b89a5a',statueGold:true,rafters:true,grade:'rgba(255,150,80,.16)',bg:'dusk',torch:.2,banner:.12,bannerCol:'#b3262c',bones:0,coins:.1,guard:'#b3262c',trim:'#e0b040',music:{root:110,mode:'dorian',tempo:1.1},
  rugs:[[7,1,9,4,'#6a1f2a'],[1,10,23,1,'#5a1a22']]},
 pal:{f1:'#33232a',f2:'#37262e',w:'#6b4a4a',wt:'#8a6262'},
 intro:['Feast night at Gallowmere. Lord Grell is drunk on flattery.','Swap the seal on the treaty, poison the wine cup,','and burn the signal beacon. Then leave before the toast.','','Ashling is awake now. Press TAB to swap between you.'],
 opening:'Feast night. Seal, wine, beacon. Any order.',
 labels:{O:'Swap the seal',P:'Poison the wine cup',B:'Burn the signal beacon'},
 gadgets:{smoke:3,bell:3,flute:1},
 bribeIdx:4,
 map:buildMap([
 "#########################",
 "#S...#.....P.....#.....O#",
 "#....#...........#......#",
 "#....D...........D......#",
 "#....#.....g.....#......#",
 "##.#######.####.#########",
 "#.......#.....g.........#",
 "#...g...D...............#",
 "#.......#...............#",
 "###.#####.#####.#########",
 "#.......................#",
 "#..#...#.........#...#..#",
 "#.......................#",
 "#X.....................B#",
 "#########################"],
 [VAULTS[1].annex]),
 vault:VAULTS[1].info,
 inspect:[[1,10,"Servants' Corridor",'A mop abandoned mid-stroke. Every servant who saw the treaty hall has been reassigned north. Nobody says why.'],[23,6,'Wine Cellar Door','Four hundred barrels ordered, four delivered. Someone has written POISON on the other 396. In a different hand: sold.']],
 extra:[[6,7,'o'],[12,11,'o'],[3,12,'s']],
 set:[[9,3,'longtable',5,1]],chand:[[11.5,3]],
 set:[[9,3,'longtable',5,1]],chand:[[11.5,3]],
 guards:[
  [[7,2],[15,2],[15,4],[7,4]],
  [[19,2],[22,2],[22,4],[19,4]],
  [[10,7],[22,7]],
  [[1,6],[7,6]],
  [[2,10],[22,10]],
  [[2,12],[22,12]]],
 kinds:{2:'hound',3:'archer'}},
{name:'The Drowned Spire',house:'House Ostrander',sigil:'ostrander',flight:true,
 th:{floor:'sea',wall:'roof',amb:[6,22,34,.30],part:'sea',grade:'rgba(60,160,200,.14)',bg:'sea',grade:'rgba(60,160,200,.14)',bg:'sea',torch:0,banner:0,bones:0,guard:'#3f8fa0',trim:'#e8f4ff',music:{root:87,mode:'lydian',tempo:.8}},
 pal:{f1:'#10303a',f2:'#123540',w:'#3f6f6a',wt:'#6fa89a'},
 intro:['A sea fortress of bells and searchlights. Wren hides on the rocks.','This one is a flight. You are Ashling, carrying her forged letters.','Burn all four signal beacons. Drop the letters in two war rooms (hold E).','Fly over walls and water. Searchlights sweep; boats patrol.','','Land on the green pad when done.'],
 opening:'Wren is hiding. I do the flying. Try not to look smug.',
 labels:{P:'Plant the forged letters',B:'Burn the four beacons'},
 gadgets:{smoke:0,bell:0,flute:0},
 map:buildMap([
 ".........................",
 ".S.......g.......g....B..",
 "....####.......####......",
 "....####...P...####......",
 "....####.......####.....X",
 ".........................",
 "..g.......####.......g...",
 "B.........####...........",
 ".........................",
 "....####...........####..",
 "....####....g......####..",
 ".........................",
 "..g.........P.......B....",
 ".B.......g..........g....",
 "........................."],
 [{ox:25,oy:0,rows:['....','....','..G.','....','....','....','.###','.#r#','.###','....','....','.s..','....','....','....']}]),
 extra:[[11,5,'s']],
 guards:[[[1,14],[23,14]]],
 towers:[[12,2,1.57,1],[20,6,3.14,-1],[6,8,0,1],[15,11,1.57,-1],[3,4,0.5,1]],
 kinds:{}},
{name:'Thornwick Abbey',house:'House Sable',sigil:'sable',quiet:true,song:true,
 th:{floor:'stone',wall:'brick',amb:[8,8,22,.50],part:'dust',shelf:.12,wood:'#4a3426',stone:'#6a6a82',cloth:'#4a3a70',chains:.06,web:.12,grade:'rgba(90,110,220,.22)',bg:'moon',wood:'#4a3426',stone:'#6a6a82',cloth:'#4a3a70',chains:.06,web:.12,grade:'rgba(90,110,220,.22)',bg:'moon',torch:.1,banner:.08,bannerCol:'#2a2438',bones:0,windows:.14,guard:'#4a3a66',trim:'#b99cff',music:{root:82,mode:'phrygian',tempo:.7}},
 pal:{f1:'#1c1a22',f2:'#201e27',w:'#3a3547',wt:'#524b66'},
 intro:['Black-robed monks. A vow of silence. Footsteps carry here.','Find the lectern and learn the Song of Opening on the bone flute.','Then open the sealed door (F) and take the abbot\'s ledger.','The Bell-Warden guards it. His bell tolls: freeze when it does.','','Fire only hurts him from behind. Lure him with the bell (R).'],
 opening:'Silence is law here. Sneak (Shift), or the monks will come looking.',
 labels:{L:'Learn the Song of Opening',O:'Take the ledger',W:'Silence the Bell-Warden'},
 gadgets:{smoke:3,bell:5,flute:0},
 bellAt:[18.5,5],
 map:buildMap([
 "#########################",
 "#..L..#......#........O.#",
 "#.....#...g..#..........#",
 "#.....#......#...g......#",
 "###D#####.####..........#",
 "#............#..........#",
 "#.....#......Z..........#",
 "#...g........#..........#",
 "#........#...#...g......#",
 "#............#..........#",
 "####.#####.##############",
 "#...........g...........#",
 "#.....#.........#.......#",
 "#S.....................X#",
 "#########################"],
 [VAULTS[3].annex]),
 vault:VAULTS[3].info,
 inspect:[[1,5,'Cell of the Silent','The monk who lived here carved a hundred bells into the wall, one for every word he was forbidden.'],[23,11,'Mural of Two Students','Two small figures hold one candle. One has been scratched out. The other wears a mask.']],
 extra:[[5,8,'o'],[9,11,'s']],
 guards:[
  [[8,2],[11,2],[11,3],[8,3]],
  [[2,5],[12,5]],
  [[2,9],[11,9]],
  [[12,7],[8,7],[8,9],[12,9]],
  [[3,11],[11,11]],
  [[8,13],[20,13]],
  [[14,11],[22,11]],
  [[15,9],[22,9]]],
 kinds:{5:'hound',6:'archer',7:'brute'},
 boss:{wp:[[16,3],[21,3],[21,7],[16,7]]}},
{name:'Ironvale',house:'House Kest',sigil:'kest',choice:true,
 th:{floor:'forge',wall:'iron',amb:[26,8,4,.40],part:'sparks',grate:.1,wood:'#4a3a38',stone:'#6a5048',chains:.1,grade:'rgba(255,90,30,.22)',bg:'forge',wood:'#4a3a38',stone:'#6a5048',chains:.1,grade:'rgba(255,90,30,.22)',bg:'forge',torch:.14,banner:.05,bannerCol:'#a64a2a',bones:0,pipes:.12,guard:'#8a5a40',trim:'#ff9a4a',music:{root:73,mode:'minor',tempo:1.15}},
 pal:{f1:'#2a1c1a',f2:'#2e1f1c',w:'#5a3a34',wt:'#7a4e44'},
 intro:['House Kest holds Perrin Ostrander, heir to the Drowned Spire, in its foundry cells.','Pick the cell lock (hold E on his door, then on him), burn the muster beacon,','and walk him to the gate. Forge vents belch fire on a cycle:','Ashling is fireproof. Wren is not.','','At the gate you decide what to do with him. The houses are watching.'],
 opening:'Foundry heat. Watch the vents, and keep Perrin close.',
 labels:{H:'Free Perrin Ostrander',B:'Burn the muster beacon'},
 gadgets:{smoke:3,bell:3,flute:1},
 map:buildMap([
 "#########################",
 "#X....#..........#....H.#",
 "#.....#....g.....#......#",
 "#.....#..........#...g..#",
 "#.....#..........#......#",
 "#.....#####.########D####",
 "#.....#.................#",
 "#.....#..#.....#....#...#",
 "#.......g..........g....#",
 "#.....#...V.........V...#",
 "#.....#.#.......#....#..#",
 "#.......V.......V.......#",
 "#.....#.......B.........#",
 "#S......................#",
 "#########################"],
 [VAULTS[4].annex]),
 vault:VAULTS[4].info,
 inspect:[[1,9,"Foreman's Rules",'A hearth cooled early is a hearth cooled by order. Report cold iron. Do not report cold men.'],[23,12,'Ostrander Colors, Scorched','A blue pennant, used as a rag. Perrin\'s cell door bears scratch marks in groups of five. Forty-one days.']],
 extra:[[10,10,'o'],[21,7,'o'],[3,8,'s']],
 set:[[11,3,'furnace']],
 set:[[11,3,'furnace']],
 guards:[
  [[8,2],[15,2],[15,4],[8,4]],
  [[19,3],[22,3]],
  [[8,6],[22,6]],
  [[8,8],[19,8]],
  [[12,9],[12,12]],
  [[16,11],[22,11]],
  [[3,3],[3,12]],
  [[8,13],[22,13]]],
 kinds:{3:'brute',5:'hound',6:'archer'}},
{name:'Dunmoor Marsh',house:'House Dunmoor',sigil:'dunmoor',
 th:{floor:'marble',wall:'brick',amb:[12,18,44,.34],part:'fog',tapestry:.06,wood:'#8a9ab8',cloth:'#4a6aa6',tablecloth:true,stone:'#a8b4d0',vines:.05,grade:'rgba(60,120,200,.18)',bg:'marsh',wood:'#8a9ab8',cloth:'#4a6aa6',tablecloth:true,stone:'#a8b4d0',vines:.05,grade:'rgba(60,120,200,.18)',bg:'marsh',torch:.12,banner:.08,bannerCol:'#4a6aa6',bones:0,guard:'#4a5f86',trim:'#d7e2ff',music:{root:92,mode:'lydian',tempo:.85},
  ruin:{amb:[34,12,6,.46],part:'embers'}},
 pal:{f1:'#1d2a3a',f2:'#21304a',w:'#4a5f86',wt:'#7d95c4'},
 palRuin:{f1:'#241a16',f2:'#291e19',w:'#4a3a32',wt:'#6e5648'},
 intro:['A masked ball in the marsh hall of House Dunmoor. Lanterns, fog, a crowd.','Plant the forged treaty at the head table while the ball lasts (hold E).','Then find a pedestal and play the Song of Time (F) to see the hall after the war.','Take Lady Veyra\'s signet from the ruined throne room, and burn the muster beacon.','','Planting the treaty changes what survives: the throne room wall falls open.'],
 opening:'Masks on. The crowd is cover. Find a pedestal when you are ready to see the end.',
 labels:{P:'Plant the treaty (ball)',O:'Take the signet (ruins)',B:'Burn the beacon'},
 gadgets:{smoke:3,bell:3,flute:99},
 map:buildMap([
 "#########################",
 "#B....#...........#.....#",
 "#..g..#...........#...O.#",
 "#.....#.....P.....#.....#",
 "#.................#.....#",
 "#.....#...g.......#.....#",
 "#..T..#...........#######",
 "#.....#...........#.....#",
 "#.....#...........#..g..#",
 "#.......................#",
 "#.....#...........#..T..#",
 "#.g...#..........T#.....#",
 "###.#####.###########.###",
 "#S.....................X#",
 "#########################"],
 [VAULTS[5].annex]),
 vault:VAULTS[5].info,
 inspect:[[1,3,'Guest List','Names crossed out in tidy handwriting. Yours is not among them, which is the most worrying part.'],[23,5,'Mask of the Hostess','A silver mask resting on a cushion, still warm. Veyra never wears the same face twice.']],
 extra:[[14,9,'o'],[3,13,'s']],
 chand:[[12,7]],
 chand:[[12,7]],
 guards:[
  [[8,2],[16,2]],
  [[8,5],[16,5]],
  [[8,8],[16,8]],
  [[8,10],[15,10]],
  [[2,2],[2,10]],
  [[19,7],[23,7]],
  [[2,13],[22,13]],
  [[19,11],[23,11]]],
 kinds:{4:'archer',6:'hound'},
 timeshift:{
  guests:[[[8,4],[16,4]],[[16,6],[8,6]],[[9,7],[15,7]],[[12,9],[8,9]],[[12,2],[12,10]],[[14,9],[10,3]]],
  ruin:{
   open:[[21,6]],
   openIfPlanted:[[18,2]],
   block:[[10,6],[11,6],[12,6],[13,6],[14,6],[13,7],[10,8],[9,5]],
   vents:[[21,8],[20,10],[22,7]],
   guards:[
    [[8,3],[16,3]],
    [[8,9],[16,9]],
    [[19,4],[23,4]],
    [[2,13],[22,13]]]}}},
{name:"The Candlemaker's Crown",house:'House Hallow (extinct)',sigil:'hallow',finale:true,exitLabel:'THRONE',
 th:{floor:'ruin',wall:'brick',amb:[18,12,6,.38],part:'wax',stone:'#7a6a48',web:.1,chains:.05,grade:'rgba(255,170,60,.18)',bg:'crown',stone:'#7a6a48',web:.1,chains:.05,grade:'rgba(255,170,60,.18)',bg:'crown',torch:0,banner:.05,bannerCol:'#d9a441',bones:.05,guard:'#7a6a48',trim:'#ffd27a',music:{root:65,mode:'minor',tempo:1}},
 pal:{f1:'#2a2216',f2:'#2f2619',w:'#4d4030',wt:'#7a6a48'},
 intro:['A ruined hall lit by five candles that never gutter. He knows every trick you know.','Snuff all five candles (hold E). While one burns, he cannot be hurt.','Then burn him from behind with Ashling. He blinks: the orange mark is where he lands.','Reach the throne to decide how the war ends.'],
 opening:'Five candles. Snuff them all, and he has nowhere to hide.',
 labels:{C:'Snuff the candles',W:'Defeat the Candlemaker'},
 gadgets:{smoke:3,bell:3,flute:0},
 map:buildMap([
 "#########################",
 "#.........#.X.#.........#",
 "#....g....#...#....g....#",
 "#..C......#...#......C..#",
 "#.......................#",
 "#.......g.......g.......#",
 "#..##...............##..#",
 "#..##.......C.......##..#",
 "#.......................#",
 "#.........#..g..#.......#",
 "#.......................#",
 "#..C.................C..#",
 "#.......................#",
 "#...........S...........#",
 "#########################"],
 [VAULTS[6].annex]),
 vault:VAULTS[6].info,
 inspect:[[1,5,'Hallow Crown Fragment','A shard of gold bent around a single cold wick. It hums when you stand near it.'],[23,3,'The Last Entry','If the courier survives to read this, tell her the knots were never about escape. They were about holding on.']],
 extra:[[5,10,'o'],[19,8,'o'],[20,12,'s']],
 guards:[
  [[2,2],[8,2]],
  [[16,2],[22,2]],
  [[2,9],[2,12]],
  [[22,9],[22,12]],
  [[7,12],[17,12]]],
 kinds:{4:'brute'},
 boss:{kind:'candle',wp:[[7,6],[17,6],[17,10],[7,10]]}}
];
/* the extra[] list stamps barrels and scrolls onto open floor */
LEVELS.forEach(L=>{
  const m=L.map.slice();
  for(const [x,y,ch] of L.extra||[])if(m[y][x]==='.')stamp(m,x,y,ch);
  L.map=m;
});

/* Lore scrolls, in the order they appear in each map (row by row). */
const LORE=[
 [{t:"A Courier's Tally",x:'"Letter delivered, Ostrander to Marrow. Result: one war. Fee: unpaid." Someone has underlined unpaid three times.'},
  {t:'The Egg Ledger',x:'Marrow did not steal the egg. It was bought, with a name that is not in any register. The buyer paid in candle wax.'}],
 [{t:'Menu for the Feast',x:'Fourteen courses. Thirteen are poisoned already, by thirteen different cooks, none of whom know about the others.'},
  {t:'Grell Counting-House',x:'Lord Grell owes every house in the realm. He has promised each of them the same castle.'}],
 [{t:'Harbor Bell Log',x:'The beacons were lit nine times last winter. Not once for a ship. Someone was talking to the north.'},
  {t:"Message in a Bottle",x:'"If you are reading this, the Spire is lying about the tide tables. Check the lighthouse. Burn what you find."'}],
 [{t:'Rule of Silence',x:'Brothers shall not speak, whistle, hum, or sing. The Song of Opening is therefore kept, and never sung.'},
  {t:"Abbot's Marginalia",x:'In the margin, in a hurry: "He was one of ours. He taught the courier girl the same knots. Two students. One candle."'}],
 [{t:'Foundry Orders',x:'Forge-masters are reminded: vents run on the four-count. Anything that walks the floor on the three-count is acceptable loss.'},
  {t:'Prisoner Tally, Kest',x:'Perrin Ostrander, heir. Fed well. Told nothing. Asks every day what year it is, as though he does not trust the answer.'}],
 [{t:'Invitation, Gilt-edged',x:'"Lady Veyra requests the pleasure of your masks." The reverse side lists, in tidy handwriting, who will not be leaving.'},
  {t:'Veyra, to Herself',x:'A short war is a vaccine. I will not enjoy it. That is how you know it is the right thing to do.'}],
 [{t:'The Last Hallow',x:'The crown was never lost. It was handed down, quietly, one liar to the next, each sure they would be the last.'},
  {t:'Candle-Wright Notes',x:'Five wicks. One flame, split five ways. Put one out and the rest burn brighter. Put them all out and he is just a man.'}]
];
