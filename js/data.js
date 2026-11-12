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
    rect:[...tr(1,1),...tr(7,5)],center:tr(3,3),inner:tr(6,3),deco:T_([[2,2],[3,4],[1,3],[3,2],[2,4],[4,3]])}};
}
const VW=[['cinder','cinder'],['cinder','cinder','cinder']];

const RELICS={
  boots:{name:"Cat's-Paw Boots",icon:'boots',desc:'Shiloh creeps 25% faster while sneaking.'},
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
 mkVault('N',[7,14],['The Unsung Song','Notes scratched into the stone. Whoever carved them could not read music, only feel it.'],[['cinder','wisp'],['husk','mite'],['cantor']]),
 mkVault('E',[24,8],['Forge-Heart Chamber','The first anvil of House Kest, cracked in two. It rang once when it broke, and nobody has forgotten the sound.'],[['husk','cinder'],['wisp','mite','mite']]),
 mkVault('E',[24,9],["Veyra's Mirror",'A mirror turned to face the wall. The back is covered in tally marks, one per guest.'],[['warder','cinder','cinder'],['husk','wisp']]),
 mkVault('N',[4,14],["Candle-Wright's Vault",'Wicks without wax, wax without wicks. Whoever made five candles meant to make a sixth.'],[['husk','cinder','cinder'],['wisp','warder','husk']])
];

const LEVELS=[
{name:'Ashfall Keep',house:'House Marrow',sigil:'marrow',alarm:true,
 th:{floor:'stone',wall:'brick',amb:[14,9,22,.40],part:'ash',tapestry:.05,rack:.06,wood:'#6a4a30',stone:'#8a8694',rafters:true,chains:.05,web:.05,grade:'rgba(90,70,140,.20)',bg:'night',wood:'#6a4a30',stone:'#8a8694',rafters:true,chains:.05,web:.05,grade:'rgba(90,70,140,.20)',bg:'night',torch:.16,banner:.07,bannerCol:'#cfc9bd',bones:.045,guard:'#8d8a98',trim:'#d9d4c4',music:{root:98,mode:'minor',tempo:.9}},
 pal:{f1:'#24202c',f2:'#282431',w:'#4a4458',wt:'#615a73'},
 intro:["Six months ago you carried a letter across a border. A war started.", "Everyone remembers the courier. Nobody remembers who wrote it.", "Mother Quill of the Hollow Crown has offered you a way back in.", "House Marrow took an egg that belongs to her. Bring it home.", "", "Take the egg from the north-east tower, burn the beacon, leave by the gate."],
 opening:"The culvert under the keep. Nobody guards a drain. Almost nobody.",
 barks:{"lure": ["Report.", "East wall.", "Check it."], "lost": ["Gone.", "Fan out.", "Again."], "alert": ["Intruder!", "Stop there."]},
 labels:{O:'Steal the dragon egg',B:'Burn the signal beacon'},
 gadgets:{smoke:3,bell:3,flute:1},
 map:buildMap([
 "#########################",
 "#....#.........#.......O#",
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
 [VAULTS[0].annex,{ox:0,oy:16,rows:[
 "#########################",
 "#....#.........#........#",
 "#..............#........#",
 "#....#..................#",
 "#....#.........#........#",
 "#########################"]},
 /* the culvert: a hand-built way in that teaches one thing per room (see mech.lessons) before the keep opens up */
 {ox:0,oy:22,rows:[
 "#########################",
 "#.....#.......#.........#",
 "#.....#.......#.........#",
 "#.S.....................#",
 "#.....#.......#.........#",
 "#.....#.......#.........#",
 "#########################"]}]),
 vault:VAULTS[0].info,
 /* mission mechanics (js/mis_a.js): the culvert opening (grates that rattle unless you sneak, a guard with his back turned,
    a guard watching a door, then a ladder into the keep); coal chute, store hatch and yard well into the cellar; rotten boards before the egg-store
    door; the Ossuary dart trial; a sapper's cache; the yard portcullis drops when the egg is taken and Ashling can raise it
    from inside through the drain */
 mech:{
  stairs:[{id:'culvert',entry:true,a:[23,27],b:[2,2],label:'Climb the ladder into the keep',labelB:'Climb down to the culvert',kind:'stairs',kindB:'hatch',
     say:['Shiloh','Inside. Marrow stamps a bone on everything. Look for the bone.']},
   {id:'chute',a:[4,1],b:[2,17],label:'Climb into the coal chute',labelB:'Climb the coal chute',kind:'hatch',kindB:'stairs',
     say:['Shiloh','The cellar. Dark, damp, and nobody guards a coal chute.']},
   {id:'store',a:[17,1],b:[13,17],label:'Go down the store hatch',labelB:'Climb to the egg store',kind:'hatch',kindB:'stairs'},
   {id:'well',a:[11,13],b:[2,20],label:'Climb down the well',labelB:'Climb the well rope',kind:'well',kindB:'stairs'}],
  rot:{tiles:[[13,2],[14,2],[13,3],[14,3]],to:[10,18]},
  lessons:[
   {zone:[12,23,15,27],title:'Lure',touch:'The next guard is watching the door. Throw a BELL and slip past while he checks the noise.',keys:'The next guard is watching the door. Throw a bell (R) and slip past while he checks the noise.'},
   {zone:[7,23,13,27],title:'Takedown',touch:'He has his back to you. Sneak up behind him and STRIKE.',keys:'He has his back to you. Sneak up behind him and strike (SPACE).'},
   {zone:[1,23,6,27],title:'Sneak',touch:'Loose grates ahead. Hold SNEAK to cross them without a sound.',keys:'Loose grates ahead. Hold SHIFT to sneak across them without a sound.'},
   {zone:[16,23,23,27],title:'The way in',touch:'The ladder in the corner climbs into the keep.',keys:'The ladder in the corner climbs into the keep.'}],
  plates:[{x:6,y:25,kind:'rattle'},{x:7,y:24,kind:'rattle'},{x:7,y:25,kind:'rattle'},{x:7,y:26,kind:'rattle'},
   {x:8,y:18,kind:'rattle'},{x:11,y:19,kind:'rattle'},{x:12,y:17,kind:'rattle'},{x:7,y:20,kind:'rattle'},
   {x:18,y:17,kind:'dart'},{x:21,y:17,kind:'dart'},{x:17,y:18,kind:'dart'},{x:22,y:18,kind:'dart'},{x:20,y:19,kind:'dart'},{x:18,y:20,kind:'dart'},{x:21,y:20,kind:'dart'},{x:16,y:17,kind:'dart'}],
  guards:[{wp:[[7,17],[13,17],[13,20],[7,20]],name:'Jailer'},
   {wp:[[11,25]],face:0,name:'Drain-keeper'},{wp:[[20,25]],face:Math.PI,name:'Ladder watch'}],
  gates:[{id:'yard',x:5,y:8,open:true}],
  ducts:[{id:'drain',tiles:[[8,8]]}],
  levers:[{id:'yardwinch',x:9,y:9,by:'any',label:'Turn the yard winch',fx:{open:'yard',say:['Ashling','Winch turned. Tiny claws, big results.']},once:true}],
  events:{O:{close:'yard',toast:['The yard gate drops','Marrow seals the courtyard. The drain, the well or the beacon wing.','#ff9a6a']}},
  challenge:{id:'ossuary',name:'The Ossuary Walk',zone:[16,17,23,20],goal:'reliq',time:14,desc:'Reach the reliquary in 14 seconds. Darts wait under the holed plates.',rew:{item:'ashcape',cin:50}},
  caches:[{id:'reliq',x:23,y:17,kind:'reliquary',label:'Open the reliquary',chal:true,title:'The reliquary',rew:{cin:20}},
   {id:'sapper',x:1,y:20,kind:'stone',label:'Pry the loose stone',secret:true,hidden:true,title:"A sapper's cache",rew:{gad:{smoke:2},cin:45,item:'shiv'},
    say:['Shiloh','Black powder and a knife, wrapped in oilcloth. Someone meant to bring this keep down.']}],
  notes:[{x:14,y:19,title:'Ossuary of the Marrow Saints',text:'Walk where the saints walked. The plates that bite have holes beside them. Run, and the saints will not wait for you.'}],
  keep:[[1,17,23,20],[1,23,23,27]]},
 inspect:[[1,5,'Scorched Barracks Wall','Tally marks, hundreds of them, ending abruptly. Under the last: "They never opened the egg room. They only fed the fire."'],[23,9,'Marrow Banner, Torn','The banner shows a skull wearing a crown of bone. Someone has stitched a small, careful candle into the corner.']],
 extra:[[9,6,'o'],[20,11,'o'],[3,13,'s']],
 guards:[
  [[7,2],[12,2]],
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
 intro:["Lord Grell throws a feast every time he borrows money. Tonight the hall is full.", "The treaty on the head table is the one his lender wants signed.", "Swap its seal, spoil the wine cup before the toast, and burn the beacon.", "", "Ashling has opinions about the food. Swap between you with TAB."],
 opening:"Sixty guests, one Grell. The cup with the gold rim is his.",
 barks:{"lure": ["Is that the toast?", "Was that gold?"], "lost": ["Gone! Search the pantry.", "Where did they go?"], "alert": ["Thief at the feast!", "Hic. Intruder!"]},
 labels:{O:'Swap the seal',P:'Poison the wine cup',B:'Burn the signal beacon'},
 gadgets:{smoke:3,bell:3,flute:1},
 bribeIdx:4,feast:{at:70,len:9,table:[11.5,3.5]},
 map:buildMap([
 "#########################",
 "#S...#.....P...........O#",
 "#....#...........#......#",
 "#....D...........D......#",
 "#....#.....g.....#......#",
 "##.#######.##.#.#########",
 "#.......#.....g.........#",
 "#...g...D...............#",
 "#.......#...............#",
 "###.#####.#####.#########",
 "#.......................#",
 "#..#...#.........#...#..#",
 "#.......................#",
 "#X.....................B#",
 "#########################"],
 [VAULTS[1].annex,{ox:24,oy:0,rows:["#########","#.......#","........#","#.......#"]}]),
 vault:VAULTS[1].info,
 /* mission mechanics (js/mis_a.js): servant livery (cross the feast unchallenged, open servants' doors, never near the steward),
    kitchen steam, the feast chandelier, lamp oil in the cellar, the dumbwaiter shaft (Shiloh braces the rope, Ashling drops to
    the cellar), Grell's counting room trial and a strongbox behind the portrait */
 mech:{
  disguise:{at:[5,8],steward:0,doors:[[17,1],[13,5],[24,2]],uses:2},
  steam:[{id:'k1',x:3,y:6,per:6,on:2.6},{id:'k2',x:6,y:8,per:6,on:2.6,ph:3}],
  drops:[{id:'chand',x:11,y:3,r:2.3,rope:[16,1]}],
  levers:[{id:'cutrope',x:6,y:1,by:'wren',label:'Cut the chandelier rope',fx:{drop:'chand'},once:true},
   {id:'dumb',x:22,y:8,by:'wren',hold:true,label:'Brace the dumbwaiter rope',holdSay:'I have the rope. Swap to Ashling and drop down the shaft.',relText:'Shiloh let go of the rope. The dumbwaiter slams shut.'}],
  ducts:[{id:'shaft',tiles:[[23,9]],need:'dumb'}],
  oil:[{x:14,y:10,w:3,h:3}],
  plates:[{x:27,y:2,kind:'alarm',hidden:true},{x:26,y:3,kind:'alarm',hidden:true},{x:28,y:3,kind:'alarm',hidden:true},{x:29,y:1,kind:'alarm',hidden:true},{x:30,y:2,kind:'alarm',hidden:true},{x:31,y:1,kind:'alarm',hidden:true}],
  challenge:{id:'counting',name:"Grell's Counting Room",zone:[25,1,31,3],floor:[25,1,31,3],goal:'strongbox',time:30,
   desc:'Six plates ring the house bell. Let Ashling breathe on the floor first: heat shows the wire.',rew:{item:'clasp',cin:70}},
  caches:[{id:'strongbox',x:31,y:2,kind:'box',label:'Crack the strongbox',chal:true,title:"Grell's strongbox",rew:{cin:30}},
   {id:'portrait',x:12,y:6,kind:'box',label:'Look behind the portrait',secret:true,hidden:true,title:'Behind the portrait',rew:{item:'hearthstone',gad:{bell:1},cin:40},
    find:'That portrait hangs crooked. Grell never hangs anything crooked unless it hides something.',say:['Shiloh','A strongbox, and a note: "For when the lenders come." They came.']}],
  notes:[{x:19,y:1,title:"The ledger-master's warning",text:'Six plates ring the bell. I walk the rest blind and drunk. If you are not me: heat shows the wire.'}],
  keep:[[25,1,31,3]]},
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
 intro:["Ostrander rings a bell for the tide, for supper, and for the dead.", "Shiloh waits on the rocks with the forged letters. Ashling carries them.", "Burn four beacons. Drop the letters in two war rooms (hold E). Land on the green pad.", "Walls and water do not stop you. Searchlights do."],
 opening:"She hides on the rocks. I fly. Please note that.",
 barks:{"lure": ["Off the port side.", "Hail that."], "lost": ["Lost her.", "Fog took her."], "alert": ["Who is aloft?", "Raise the bell!"]},
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
 /* mission mechanics (js/mis_a.js): sea-drake patrols that chase and spit fire, ballista crews on the roofs, a gale band,
    a down-draught and a westward sea wind, gull flocks that scream when you pass, fog banks to hide in, the Gale Run trial
    and a drowned longboat */
 mech:{
  air:{drakes:[{wp:[[8,5],[16,5],[16,8],[8,8]]},{wp:[[19,0],[27,0],[27,5],[19,5]]},{wp:[[2,10],[9,11],[9,13],[2,13]]}],
   ballistae:[[6,3,0.8],[20,10,-2.4]],
   wind:[[0,7,26,2,90,0],[9,0,2,5,0,80],[0,14,29,1,-70,0]],
   gulls:[[9,4],[23,7],[3,11],[17,13]],
   fog:[[24,12,1.7],[13,0,1.4],[1,9,1.3]]},
  challenge:{id:'galerun',name:'The Gale Run',rings:[[2,5],[8,8],[14,7],[20,8],[25,10],[24,13]],time:12,
   desc:'Six rings, twelve seconds. Ride the gale.',rew:{item:'wavecloak',cin:80}},
  caches:[{id:'wreck',x:28,y:13,kind:'wreck',by:'ash',label:'Search the wreck',secret:true,hidden:true,title:'A drowned longboat',
   find:'A longboat, upside down in the fog. Something in it is still shining.',rew:{item:'collar',cin:60},say:['Ashling','A captain\'s strongbox. Ostrander seal. Finders keepers, sea-law, probably.']}]},
 kinds:{}},
{name:'Thornwick Abbey',house:'House Sable',sigil:'sable',quiet:true,song:true,
 th:{floor:'stone',wall:'brick',amb:[8,8,22,.50],part:'dust',shelf:.12,wood:'#4a3426',stone:'#6a6a82',cloth:'#4a3a70',chains:.06,web:.12,grade:'rgba(90,110,220,.22)',bg:'moon',wood:'#4a3426',stone:'#6a6a82',cloth:'#4a3a70',chains:.06,web:.12,grade:'rgba(90,110,220,.22)',bg:'moon',torch:.1,banner:.08,bannerCol:'#2a2438',bones:0,windows:.14,guard:'#4a3a66',trim:'#b99cff',music:{root:82,mode:'phrygian',tempo:.7}},
 pal:{f1:'#1c1a22',f2:'#201e27',w:'#3a3547',wt:'#524b66'},
 intro:["Sable keeps a vow of silence. The monks keep it because they are paid to.", "The abbot's ledger shows who pays. It is behind a sealed door.", "Learn the Song of Opening at the lectern, then take the ledger.", "The Bell-Warden hears nothing but bells. Use one (R). Fire only hurts him from behind.", "When his bell tolls, stand still."],
 opening:"Sable's silence is paid for. Walk softly.",
 barks:{"lure": ["*points*", "*raps the wall*"], "lost": ["*stares*", "*shakes head*"], "alert": ["*hisses*", "*stamps*"]},
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
 [VAULTS[3].annex,{ox:12,oy:15,rows:[
 "#################",
 "#...#...#.....#.#",
 "#...#...#.....#.#",
 "#...............#",
 "#...#...#.....#.#",
 "#...#...#.....#.#",
 "#.###############",
 "#...............#",
 "#...............#",
 "#################"]}]),
 /* mission mechanics (js/mis_a.js): a worn slab in the south hall hides the crypts; four bells must be rung in the order the
    inscription gives to raise the crypt gate; in the undercroft Shiloh hauls the cage chain while Ashling flies the chasm and
    kicks the bridge winch; stairs climb behind the Bell-Warden. The Silent Ossuary trial, a loose stone, and a drain from the
    court into the bell hall that only Ashling fits through */
 mech:{
  stairs:[{id:'slab',a:[13,12],b:[14,17],hidden:true,secret:true,findLabel:'Lift the worn slab',label:'Descend into the crypt',labelB:'Climb to the south hall',
     kind:'stairs',kindB:'stairs',title:'The hidden crypt',sub:'Steps under the slab, worn by bare feet.',findSay:['Shiloh','The slab has a bell carved on it, upside down. Nobody carves a bell upside down by accident.']},
   {id:'under',a:[27,16],b:[23,3],label:'Climb to the bell hall',labelB:'Climb down to the undercroft',kind:'stairs',kindB:'hatch',
     say:['Shiloh','Behind him. He never looks behind him.']}],
  bells:{list:[[17,16,1],[19,16,2],[17,20,3],[19,20,4]],seq:[3,1,4,2],fx:{open:'crypt',say:['Ashling','The gate. The bells opened the gate. I hate this abbey.']}},
  gates:[{id:'crypt',x:20,y:18},{id:'cage',x:26,y:18}],
  pits:[{id:'chasm',tiles:[[23,16],[24,16],[23,17],[24,17],[23,18],[24,18],[23,19],[24,19],[23,20],[24,20]],bridge:[[23,18],[24,18]]}],
  levers:[{id:'brace',x:21,y:16,by:'wren',hold:true,label:'Haul the cage chain',fx:{open:'cage'},holdSay:'I have the chain. Fly the gap, Ashling. Quickly.',relText:'Shiloh let go of the chain. The cage drops.'},
   {id:'bridgew',x:27,y:18,by:'ash',label:'Kick the bridge winch',fx:{bridge:'chasm',pin:'cage',say:['Shiloh','A bridge. And the cage is wedged. Good dragon.']},once:true}],
  ducts:[{id:'courtdrain',tiles:[[13,8]]}],
  guards:[{wp:[[13,18],[19,18]],name:'Ossuary keeper'}],
  plates:[{x:16,y:22,kind:'rattle'},{x:18,y:23,kind:'rattle'},{x:21,y:22,kind:'rattle'},{x:24,y:23,kind:'rattle'},{x:25,y:22,kind:'rattle'}],
  rot:{tiles:[[19,22],[19,23],[22,22],[22,23],[26,23]]},
  challenge:{id:'silent',name:'The Silent Ossuary',zone:[14,22,27,23],goal:'choir',time:16,
   desc:'Sixteen seconds. Bone chimes and rotten boards: sneak over them, run everywhere else.',rew:{item:'thread',cin:60}},
  caches:[{id:'choir',x:27,y:23,kind:'reliquary',label:'Open the reliquary',chal:true,title:'The choir reliquary',rew:{cin:20}},
   {id:'ink',x:15,y:20,kind:'stone',label:'Pry the loose stone',secret:true,hidden:true,title:"A bell-ringer's hoard",rew:{item:'wardenbreaker',cin:40},
    say:['Shiloh','A blade wrapped in bell-rope. Someone down here meant to silence that Warden long before we came.']}],
  notes:[{x:13,y:16,title:'Inscription of the Waking',text:'Wake the bells as the abbey wakes its dead: the third, the first, the fourth, the second. A wrong note wakes the wrong dead.'}],
  keep:[[13,16,27,23]]},
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
 intro:["House Kest hammers iron and grudges. It holds Perrin Ostrander in a cell.", "Pick the cell lock, free him, burn the muster beacon, and walk him out. Burn it first and fewer men answer the breakout.", "He is terrified of fire. Tell him to wait, hide him in crates, keep him off the slag.", "Presses, slag sluices and the ore lift kill as well as they carry. Ashling can overheat a vent into fog.", "", "At the gate you decide what he is worth."],
 opening:"The floor is breathing. Watch the vents.",
 barks:{"lure": ["Hey.", "Who is that?"], "lost": ["Slipped us.", "Hammer take it."], "alert": ["Hold there!", "Iron's up!"]},
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
 intro:["Lady Ottoline Dunmoor hosts a masked ball. In a back room, she hosts a war.", "While the ball lasts, plant the forged treaty at the head table. Take a dancer's arm to pass as a guest.", "At a pedestal press F to play the Song of Time, or hold E to send Ashling across alone.", "Take her signet from the ruined throne room, and burn the beacon, in either year.", "", "What you burn or plant tonight decides which walls are still standing."],
 opening:"Masks on. The crowd is cover. Find a pedestal when you are ready.",
 barks:{"lure": ["How curious.", "Not on the list."], "lost": ["How rude.", "They have slipped away."], "alert": ["Guards, if you please!", "An uninvited guest!"]},
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
 intro:["House Hallow burned out thirty years ago. Someone keeps its hall lit.", "The Candlemaker was trained by the same hands as you. He knows your habits.", "First the Wax Road: lamp towers sweep it. Then the chandlery that feeds his candles: poison it, rob it, or burn it.", "In the hall, snuff all five candles. While one burns, he cannot be hurt.", "Burn him from behind. Drop the censers on him; ring the old house bell and he turns to it.", "", "The throne waits at the far end. What you do there ends the war."],
 opening:"Five candles. I know this trick. Quill taught it to both of us.",
 barks:{"lure": ["The candles lean."], "lost": ["The flame moved."], "alert": ["Quiet. Listen.", "A light moved."]},
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
 "#.......................#",
 "#########################"],
 [VAULTS[6].annex,{ox:8,oy:14,rows:[ // the approach: the Wax Road gauntlet, the vestry and the chandlery
 "####.############",
 "#.......#.......#",
 "#.......#.......#",
 "#...............#",
 "#.......#.......#",
 "####.#######.####",
 "#...............#",
 "#...............#",
 "#...............#",
 "#.......S.......#",
 "#################"]}]),
 vault:VAULTS[6].info,
 inspect:[[1,5,'Hallow Crown Fragment','A shard of gold bent around a single cold wick. It hums when you stand near it.'],[23,3,'The Last Entry','If the courier survives to read this, tell her the knots were never about escape. They were about holding on.']],
 extra:[[5,10,'o'],[19,8,'o'],[20,12,'s']],
 guards:[
  [[2,2],[8,2]],
  [[16,2],[22,2]],
  [[2,9],[2,12]],
  [[22,9],[22,12]],
  [[7,12],[17,12]],
  [[10,16],[14,16],[14,18],[10,18]],
  [[11,21],[21,21]],
  [[18,18],[22,18]]],
 kinds:{4:'brute',5:'hound',7:'archer'},
 towers:[[9,20,0,.7],[23,23,3.14,-.6]],
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

/* ---------- The Back Stairs: before each mission after the first, turn one servant of the house you are about to rob ---------- */
// Indexed by the mission that follows. fx keys: drop (one fewer guard), decay, sight, speed, spin (searchlight rate), gad ({smoke,bell}), noise, vents, pick.
const STAIRS=[null,
 {intro:"Every house runs on its servants. Before Gallowmere, you may turn one of Grell's.",foot:'Servants talk. Every favor you buy will be repeated.',options:[
  {name:'Bribe the steward',desc:'One guard sleeps through the feast.',short:'bribed the steward',fx:{drop:true},led:['grell','favor','The steward remembers your coin.']},
  {name:'Blackmail the chamberlain',desc:'Suspicion fades much faster.',short:'blackmailed the chamberlain',fx:{decay:2.5},led:['grell','fear','The chamberlain keeps your secret, for now.']},
  {name:'Taint the wine',desc:'Drowsy guards: shorter sight, slower steps.',short:'tainted the wine',fx:{sight:.75,speed:44},led:['grell','ruin','Grell wakes to a signature he does not remember.']}]},
 {intro:'Ostrander runs on a handful of people who talk. Before the Spire, turn one.',foot:'On the sea road, a rumor travels faster than a ship.',options:[
  {name:'Pay the harbor pilot',desc:'The harbor watch shuts down one searchlight.',short:'paid the harbor pilot',fx:{drop:true},led:['ostrander','favor','The harbor pilot remembers your coin.']},
  {name:'Frighten the bell-ringer',desc:'The searchlights sweep slower.',short:'frightened the bell-ringer',fx:{spin:.6},led:['ostrander','fear','The bell-ringer has stopped sleeping.']},
  {name:'Spoil the lamp oil',desc:'The searchlights see less far.',short:'spoiled the lamp oil',fx:{sight:.75},led:['ostrander','ruin','The lamp oil was cut with seawater.']}]},
 {intro:"Sable's silence is paid for, and what is paid for can be paid for again.",foot:'In an abbey of silence, the cellars are the loudest place.',options:[
  {name:'Pay the gatekeeper',desc:'Three extra whisper bells.',short:'paid the gatekeeper',fx:{gad:{bell:3}},led:['sable','favor','The gatekeeper has a new coat.']},
  {name:'Threaten the choirmaster',desc:'The monks hear less.',short:'threatened the choirmaster',fx:{noise:.65},led:['sable','fear','The choirmaster no longer sings alone.']},
  {name:'Water the refectory wine',desc:'Drowsy, slower monks.',short:'watered the refectory wine',fx:{speed:45},led:['sable','ruin','The monks were drowsy at vespers.']}]},
 {intro:"Kest's furnaces run on foremen and favors. Before Ironvale, find the soft spot.",foot:'A forge is only as hard as the people who stoke it.',options:[
  {name:'Bribe the foreman',desc:'The vents burn for less time.',short:'bribed the foreman',fx:{vents:.9},led:['kest','favor','The foreman retired early, with a pension.']},
  {name:'Blackmail the quartermaster',desc:'Two extra smoke bombs and two bells.',short:'blackmailed the quartermaster',fx:{gad:{smoke:2,bell:2}},led:['kest','fear','The quartermaster counts the stores twice now.']},
  {name:'Loosen the cell hinges',desc:'Locks pick in half the time.',short:'loosened the cell hinges',fx:{pick:.5},led:['kest','ruin','Three cell doors in Ironvale failed in one week.']}]},
 {intro:'A ball needs a doorman, musicians and wine. Before Dunmoor, buy one.',foot:'At a masked ball, everyone is someone else, including the staff.',options:[
  {name:'Slip the doorman a coin',desc:'One guard looks the other way.',short:'tipped the doorman',fx:{drop:true},led:['dunmoor','favor','The doorman lost your invitation, politely.']},
  {name:'Blackmail the first violin',desc:'The music covers your mistakes: suspicion fades faster.',short:'blackmailed the first violin',fx:{decay:2},led:['dunmoor','fear','The first violin plays what he is told.']},
  {name:'Spike the punch',desc:'Tipsy guards see less and walk slower.',short:'spiked the punch',fx:{sight:.9,speed:45},led:['dunmoor','ruin','The punch bowl was blamed on the staff.']}]},
 {intro:'Quill left caches across the city for her couriers. There is time to reach one.',foot:'Quill is thorough. Every cache is exactly where you would have put it.',options:[
  {name:"The courier's satchel",desc:'Two extra smoke bombs and two bells.',short:"took the courier's satchel",fx:{gad:{smoke:2,bell:2}},led:null},
  {name:"The apothecary's tonic",desc:'Suspicion fades far faster.',short:"took the apothecary's tonic",fx:{decay:1.6},led:null},
  {name:"The tailor's gray cloak",desc:'Guards see you less well.',short:"took the tailor's cloak",fx:{sight:.85},led:null}]}
];
const CLUES=[
 'The egg crate was sealed with a ring of plain wax. Marrow stamps a bone.',
 "The same blank ring under Grell's treaty seal.",
 "Ostrander's receipt book: seven letters, one courier. S. Sallow.",
 'Counting House gold bought the silence of Sable.',
 'Kest took its orders from a courier who ties her satchel as I do.',
 "A note in Ottoline's signet case, signed Q. The Crown's rings hang in the ruins.",
 'The Candlemaker was trained by Quill too. He lights a candle for every crown she empties.'];
