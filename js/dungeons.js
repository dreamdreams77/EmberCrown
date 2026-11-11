'use strict';
/* EMBERCROWN - Dungeons: hidden optional sub-levels under the missions, joined by the Ember Warrens.
   A secret in a mission (Ironvale's slag grate, Dunmoor's ruined cellar stair, the Hallow vestry seal) leads down.
   Each dungeon is built from one skeleton (entry room, puzzle hall, sealed vault, challenge room) and loaded by the
   normal engine (loadLevel with a level object, as the Rookery does). The mission's world is parked, untouched, and
   restored exactly when you climb back. Loot is banked at once and kept apart from the mission's; progress lives
   in the optional save field run.dng = {found, solved, solved2, cleared, chal}.
   Puzzles: pressure plates and ore carts (Undercroft), a moonbeam and mirrors (Mirror Cellars), bells and
   braziers (Bell Ossuary). Challenge rooms hold unique gear and lore. Test hook: window.Dungeons. */
(function(){
const INK='#140c10';
const ctr=(x,y)=>({x:x*T+16,y:y*T+16});
const snd=k=>{try{Aud.S[k]&&Aud.S[k]();}catch(e){}};
const say_=(w,t,a)=>{try{say(w,t,a);}catch(e){}};
const SKEL=[
 "#####################",
 "#....X#.............#",
 "#..S..#.............#",
 "#...................#",
 "#.....#.............#",
 "#.....#.............#",
 "###Y###.............#",
 "#.....#.............#",
 "#.....#######Y#######",
 "#.....#.............#",
 "#.....#.............#",
 "#.....#.............#",
 "#####################"];
const VGATE=[3,6],CGATE=[13,8],STAIR=[1,1],BOX=[3,9],WARREN=[[1,5],[5,5]];

/* unique rewards: kept out of the shop and random chests */
const UNIQUE=[
 {id:'undertongs',slot:'gear',rar:'epic',name:'Undercroft Tongs',flavor:'Kest\'s first smith held the first ember with these. They are still warm.',b:{fire:12,stun:.8},unique:true},
 {id:'veyraglass',slot:'charm',rar:'epic',name:"Veyra's Hand-Mirror",flavor:'It shows the room behind you, and who is in it.',b:{shade:.12,mend:.25},unique:true},
 {id:'clapper',slot:'blade',rar:'epic',name:'Ossuary Clapper',flavor:'A bell tongue filed to an edge. It rings when it lands.',b:{dmg:1,finisher:1},unique:true}];
if(typeof ITEMS!=='undefined')for(const u of UNIQUE)if(!ITEMS.some(i=>i.id===u.id))ITEMS.push(u);
const LOREX={
 undercroft:[{t:'The Undercroft Ledger',x:'Kest weighed every ingot twice: once for the house, once for a buyer whose column is headed only with a ring of plain wax.'},
             {t:'The Anvil Oath',x:'Strike once for the forge, once for the house, once for the hand that holds the hammer. The third strike was later scratched out.'}],
 mirrors:[{t:'Ottoline\'s Letter',x:'"Mirrors remember the faces that pass them. I had them all turned to the wall the night Q. came to dinner."'},
          {t:'The Echo Rule',x:'In the cellars below the ballroom, a candle lit in one year can be seen in another. The servants called it the echo, and never stayed late.'}],
 ossuary:[{t:'Hallow Bell-Psalm',x:'Sun for the house, moon for the dead, eye for the watchers, key for the heir. The psalm was rung backwards the night Hallow fell.'},
          {t:'The Sixth Socket',x:'Five candles for five houses that betrayed Hallow. The sixth socket waits for the one who taught the Candlemaker to count.'}]};
const BASE={undercroft:4,mirrors:5,ossuary:6};
for(const id in LOREX){const L=typeof LORE!=='undefined'&&LORE[BASE[id]];if(L)for(const e of LOREX[id])if(!L.some(q=>q.t===e.t))L.push(e);}

const DUNGEONS={
 undercroft:{name:'The Kest Undercroft',sigil:'kest',base:4,opening:'Ore carts and pressure plates. Kest kept its oldest secrets under its weight.',
  plates:[[9,2],[17,2],[13,6]],carts:[[13,4],[10,5]],
  chal:{at:[13,10],label:'Strike the anvil',kind:'waves',limit:75,waves:[['cinder','cinder'],['mite','wisp','cinder'],['husk','cinder']],reward:'undertongs'},
  insp:[[16,6,'Weighing Plates','Three plates, two thieves, one cart. Kest trusted nothing that could not be weighed.']]},
 mirrors:{name:'The Mirror Cellars',sigil:'dunmoor',base:5,opening:'Moonlight through a grate, and mirrors turned to the wall. Point the light.',
  source:{x:8,y:1,d:[0,1]},mirrors:[[8,5,'|'],[14,5,'\\'],[14,2,'|'],[18,2,'/'],[11,4,'|']],lock:[18,7],braz:[[19,4,-1,0]],lock2:[11,1],
  chal:{at:[13,10],label:'Wake the echo',kind:'candles',limit:35,candles:[[8,9],[10,11],[16,9],[18,11],[13,9]],foes:['wisp','wisp'],reward:'veyraglass'},
  insp:[[16,7,'Scratched Mirror-Frame','"/ then \\, then let it through." Someone wrote the answer for the next fool.']]},
 ossuary:{name:'The Bell Ossuary',sigil:'hallow',base:6,opening:'Four bells and a mural. Hallow buried its dead to music.',
  bells:[[8,2,0],[12,2,1],[16,2,2],[18,6,3]],order:[2,0,3,1],mural:[10,6],braz2:[[8,6],[18,4]],
  chal:{at:[13,10],label:'Rouse the ossuary',kind:'waves',limit:70,waves:[['warder','husk'],['husk','mite','mite'],['warder','cinder','cinder']],reward:'clapper'},
  insp:[]}
};
const ORDER=['undercroft','mirrors','ossuary'];
const ENTRIES={4:{x:15,y:9,reveal:'fire',dg:'undercroft',label:'Descend the slag grate'},
               5:{x:2,y:8,reveal:'ruin',dg:'mirrors',label:'Climb down the cellar stair'},
               6:{x:10,y:16,reveal:'fire',dg:'ossuary',label:'Open the bell-shaft'}};
function addEntry(lv,e){ENTRIES[lv]=e;}

/* ---------- save field ---------- */
function D(){const r=run.dng||(run.dng={});for(const k of ['found','solved','solved2','cleared','chal'])r[k]=r[k]||{};return r;}
function wrap(name,fn){const o=window[name];if(typeof o==='function')window[name]=fn(o);}
wrap('writeSave',o=>function(stage,next,complete){o(stage,next,complete);
  if(!complete&&run.dng){try{const s=lsGet(SAVE_KEY);if(s&&s.run){s.run.dng=run.dng;lsSet(SAVE_KEY,s);saved=s;}}catch(e){}}});
wrap('continueGame',o=>function(){try{run.dng=saved&&saved.run&&saved.run.dng?JSON.parse(JSON.stringify(saved.run.dng)):{};}catch(e){run.dng={};}return o();});
wrap('newGame',o=>function(){run.dng={};stack.length=0;return o();});
for(const fnName of ['rollItem','shopStock'])wrap(fnName,o=>function(){ // uniques never appear in shops or random chests
  const out=[];for(let i=ITEMS.length-1;i>=0;i--)if(ITEMS[i].unique)out.push(ITEMS.splice(i,1)[0]);
  try{return o.apply(this,arguments);}finally{for(const u of out.reverse())ITEMS.push(u);}});

/* ---------- level objects ---------- */
function levelDef(id){
  const S_=DUNGEONS[id],L=LEVELS[S_.base];
  return{name:S_.name,house:L.house,sigil:S_.sigil,dng:id,map:SKEL.slice(),guards:[],kinds:{},gadgets:{smoke:0,bell:0,flute:0},opening:S_.opening,intro:[],labels:{},
    th:Object.assign({},L.th,{torch:.12,banner:0,tapestry:0,tablecloth:false}),pal:L.palRuin||L.pal,inspect:(S_.insp||[])};
}
const stack=[];let pending=null;
function inDng(){return !!(G&&G.dng);}
function cam(){V.ww=G.gw*T;V.wh=G.gh*T;layout();camUpdate(0,true);if(typeof initCritters==='function')initCritters();G.dirty=true;G.iris={st:performance.now(),dur:700,dir:1};touch.sneak=false;}
function build(id,arrive){
  const parent=stack[0].G,S_=DUNGEONS[id],st=D();
  const g=loadLevel(levelDef(id));
  g.props=[];g.pblock=new Set();g.pots=[];g.chests=[];g.inspects=[];
  g.exit={x:-9999,y:-9999};g.grace=1e9;g.ash.on=true;g.gad=parent.gad;g.hp=parent.hp;g.maxHp=parent.maxHp;g.cinders=0;
  const dg={id,t:0,carts:(S_.carts||[]).map(c=>({x:c[0],y:c[1],fx:c[0],fy:c[1],a:1,push:0})),plates:(S_.plates||[]).map(p=>({x:p[0],y:p[1],on:false})),
    mirrors:(S_.mirrors||[]).map(m=>({x:m[0],y:m[1],s:m[2]})),braz:(S_.braz||S_.braz2||[]).map(b=>({x:b[0],y:b[1],dx:b[2]||0,dy:b[3]||0,lit:false,p:0})),
    bells:(S_.bells||[]).map(b=>({x:b[0],y:b[1],n:b[2],ring:0})),seq:[],ch:null,beam:null,beam2:[],loot:0};
  g.dng=dg;
  for(const c of dg.carts)g.pblock.add(pkey(c.x,c.y));
  if(st.solved[id])openGate(g,VGATE,true);
  if(st.solved2[id]||(st.solved[id]&&S_.plates))openGate(g,CGATE,true);
  if(st.solved[id]&&S_.mirrors){const sol={0:'\\',1:'/',2:'/',3:'\\'};dg.mirrors.forEach((m,k)=>{if(sol[k])m.s=sol[k];});}
  if(st.solved2[id])for(const b of dg.braz)b.lit=true;
  // where you arrive: the stair, or the warren gate that leads back where you came from
  let at=ctr(3,2);
  if(arrive){const k=ORDER.filter(x=>x!==id).indexOf(arrive);if(k>=0)at=ctr(WARREN[k][0]+(k?-1:1),WARREN[k][1]-1);}
  g.wren.x=at.x;g.wren.y=at.y;g.ash.x=at.x+14;g.ash.y=at.y+6;g.active='wren';
  return g;
}
function openGate(g,p,quiet){const d=g.doors[p[0]+','+p[1]];if(d&&!d.open){d.open=true;if(!quiet){snd('gate');shake(6);G.rings.push({x:p[0]*T+16,y:p[1]*T+16,t:.8,r:90,c:'255,210,120'});}}}
function enter(id,from){
  if(!DUNGEONS[id])return false;
  if(!inDng()){if(!G||mode!=='play')return false;stack.length=0;stack.push({G,lv:lvl});}
  const st=D();st.found[id]=1;
  PT.length=0;
  G=build(id,from);
  cam();
  try{Aud.setTheme(Object.assign({},G.d.th.music,{root:G.d.th.music.root*.84,tempo:G.d.th.music.tempo*.8}));}catch(e){}
  toast(DUNGEONS[id].name,from?'Through the Ember Warrens.':'Below '+LEVELS[stack[0].lv].name+'. The mission waits above, exactly as you left it.','#ffd27a');
  say_('Ashling',from?'More tunnels. Warm ones, at least.':DUNGEONS[id].opening);
  return true;
}
function leave(dead){
  if(!stack.length)return false;
  const g=G,top=stack[0];stack.length=0;
  G=top.G;PT.length=0;
  G.hp=dead?1:Math.max(1,Math.min(G.maxHp,g.hp));
  if(dead){G.inv=2;}
  cam();
  try{Aud.setTheme(G.d.th.music);}catch(e){}
  if(g.dng.loot)toast('Back to '+G.d.name,'+'+g.dng.loot+' cinders banked from below.','#ffd27a');
  else toast('Back to '+G.d.name,dead?'Ashling dragged you up the stair.':'Right where you left it.','#cfd6e6');
  return true;
}
function bank(n,x,y){const v=typeof cinderValue==='function'?cinderValue(n):n;run.cinders+=v;G.dng.loot+=v;floatText(x,y-14,'+'+v+' banked','#ffd27a',11);snd('cinder');}
function giveLore(e){if(!run.lore.includes(e.t))run.lore.push(e.t);if(!meta.lore.includes(e.t))meta.lore.push(e.t);G.loreCard={title:e.t,text:e.x,t:6.5,t0:6.5};snd('scroll');}
function save(){try{if(typeof persistRun==='function')persistRun();}catch(e){}}

/* ---------- interactions ---------- */
function tg(ref,label,need,x,y,fn,r){return{kind:'dg',ref,label,need,x,y,fn,r:r||36};}
function targets(A){
  const L=[];
  if(inDng()){
    const dg=G.dng,id=dg.id,S_=DUNGEONS[id],st=D();
    const s=ctr(...STAIR);L.push(tg('stair','Climb back up',.5,s.x,s.y,()=>{pending={k:'leave'};}));
    ORDER.filter(x=>x!==id).forEach((to,k)=>{const w=ctr(...WARREN[k]),open=st.found[to]||st.solved[id];
      L.push(tg('warren'+k,open?'Warren: '+DUNGEONS[to].name:'Warren passage (sealed)',open?.6:.3,w.x,w.y,()=>{
        if(open)pending={k:'go',to,from:id};else say_('Shiloh','Sealed from this side. Maybe solving this place loosens it.');}));});
    if(!st.cleared[id]&&st.solved[id]){const b=ctr(...BOX);L.push(tg('box','Open the strongbox',1,b.x,b.y,()=>openBox()));}
    for(const m of dg.mirrors){const c=ctr(m.x,m.y);L.push(tg(m,'Turn the mirror',.3,c.x,c.y,()=>{m.s=m.s==='|'?'/':m.s==='/'?'\\':'|';snd('click');},30));}
    for(const b of dg.bells){const c=ctr(b.x,b.y);L.push(tg(b,'Ring the bell',.3,c.x,c.y,()=>ringBell(b),30));}
    if(S_.mural){const c=ctr(...S_.mural);L.push(tg('mural','Read the mural',.4,c.x,c.y,()=>{G.loreCard={title:'The Bell Mural',text:'Four symbols carved left to right: '+S_.order.map(n=>['a sun','a moon','an eye','a key'][n]).join(', then ')+'. Under them: "Ring as the dead were rung."',t:7,t0:7};snd('scroll');}));}
    const ch=dg.ch,C=S_.chal;
    if(C&&!(ch&&ch.on)){const c=ctr(...C.at),done=st.chal[id];
      if(G.doors[CGATE.join(',')].open)L.push(tg('chal',done?C.label+' (again)':C.label,.8,c.x,c.y,()=>startChal()));}
    if(ch&&ch.on&&ch.kind==='candles')for(const k of ch.candles)if(k.lit){const c=ctr(k.x,k.y);L.push(tg(k,'Snuff the candle',.35,c.x,c.y,()=>{k.lit=false;snd('snuff');burst(c.x,c.y-8,10,'#8a8a96',30,1,4,{k:'smoke',g:-30});},30));}
    return L;
  }
  const e=ENTRIES[lvl];if(!e||!G.dgE||!visible(e))return L;
  const c=ctr(e.x,e.y);L.push(tg('entry',e.label,.6,c.x,c.y,()=>{pending={k:'enter',to:e.dg};},34));
  return L;
}
function visible(e){return e.reveal==='ruin'?G.state==='ruin':(G.dgE.revealed||!!D().found[e.dg]);}
function ringBell(b){
  const dg=G.dng,S_=DUNGEONS[dg.id],c=ctr(b.x,b.y);if(b.ring>0)return;
  b.ring=.9;snd('toll');G.rings.push({x:c.x,y:c.y,t:.7,r:70,c:'255,215,140'});
  if(D().solved[dg.id])return;
  const want=S_.order[dg.seq.length];
  if(b.n===want){dg.seq.push(b.n);floatText(c.x,c.y-22,dg.seq.length+'/'+S_.order.length,'#ffd27a',12);
    if(dg.seq.length===S_.order.length)solve();}
  else{dg.seq=[];floatText(c.x,c.y-22,'DISCORD','#ff7a6a',12);shake(4);if(typeof spawnFoe==='function')spawnFoe('mite',c.x,c.y+40);
    if(!dg.discordSaid){dg.discordSaid=true;say_('Ashling','Wrong note. The bones did not like that. Check the mural.');}}
}
function solve(){
  const dg=G.dng,id=dg.id,st=D();if(st.solved[id])return;
  st.solved[id]=1;openGate(G,VGATE);
  if(DUNGEONS[id].plates)openGate(G,CGATE);
  toast('The vault opens',DUNGEONS[id].name+': the strongbox waits behind the gate.','#ffd27a');
  say_('Shiloh','There. Something heavy just moved.');save();
}
function solve2(){const dg=G.dng,st=D();if(st.solved2[dg.id])return;st.solved2[dg.id]=1;openGate(G,CGATE);toast('A second door opens','A challenge waits beyond.','#ff9a6a');save();}
function openBox(){
  const id=G.dng.id,st=D(),b=ctr(...BOX);if(st.cleared[id])return;
  st.cleared[id]=1;snd('chest');burst(b.x,b.y,30,'#ffd27a',130,.9,2.8,{add:true,g:-30});
  bank(80,b.x,b.y);giveLore(LOREX[id][0]);
  toast('Strongbox','80 cinders and a page of '+DUNGEONS[id].name.replace('The ','')+' lore. The warrens are open.','#ffd27a');save();
}
function startChal(){
  const dg=G.dng,C=DUNGEONS[dg.id].chal,c=ctr(...C.at);
  dg.ch={on:true,kind:C.kind,t:C.limit,wave:0,waves:C.waves||[],calm:0,candles:(C.candles||[]).map(k=>({x:k[0],y:k[1],lit:true}))};
  const d=G.doors[CGATE.join(',')];if(d)d.open=false;
  unstickAll();
  snd('roar');shake(8);toast('CHALLENGE',C.label+': '+C.limit+' seconds.','#ff9a4a');
  if(C.kind==='waves')spawnWave();else for(const k of C.foes||[])spawnFoe(k,c.x+rrand(-60,60),c.y);
}
function unstickAll(){for(const o of [G.wren,G.ash])unstick(o);}
function spawnWave(){const dg=G.dng,ch=dg.ch,ks=ch.waves[ch.wave++]||[];ks.forEach((k,i)=>spawnFoe(k,(9+i*4)*T+16,10*T+16));toast('Wave '+ch.wave+' / '+ch.waves.length,'','#ff9a4a');}
function endChal(win){
  const dg=G.dng,ch=dg.ch,id=dg.id,C=DUNGEONS[id].chal,st=D(),c=ctr(...C.at);ch.on=false;dg.ch=null;
  const d=G.doors[CGATE.join(',')];if(d)d.open=true;
  for(const f of G.foes)if(f.state!=='dead'){f.state='dead';f.hp=0;burst(f.x,f.y,10,'#8a8a96',60,.6,3,{k:'smoke'});}
  if(!win){snd('lost');toast('Challenge failed','The room resets. Try again when you are ready.','#ff7a6a');return;}
  snd('win');
  if(!st.chal[id]){st.chal[id]=1;const it=typeof grantItem==='function'?grantItem(C.reward):null;if(!it)bank(120,c.x,c.y);giveLore(LOREX[id][1]);bank(60,c.x,c.y);
    toast('Challenge complete',(it?it.name+' is yours.':'A purse of cinders.'),'#7be08a');}
  else{bank(30,c.x,c.y);toast('Challenge complete','Practice pays a little.','#7be08a');}
  save();
}

/* ---------- per-frame ---------- */
function tileOf(o){return[Math.floor(o.x/T),Math.floor(o.y/T)];}
function fireAt(x,y){
  if(!G.fireOn||G.active!=='ash')return false;
  const a=G.ash,r=G.fireRange||70,dx=x-a.x,dy=y-a.y,d=Math.hypot(dx,dy);
  return d<r&&(d<18||angDiff(Math.atan2(dy,dx),a.face)<.65)&&los(a.x,a.y,x,y);
}
function stepDng(dt){
  const dg=G.dng,id=dg.id,S_=DUNGEONS[id],st=D();dg.t+=dt;
  // ore carts: walk into one to shove it a tile
  const A=G.active==='wren'?G.wren:G.ash,movingNow=G.lastMoveT===G.time;
  for(const c of dg.carts){
    if(c.a<1){c.a=Math.min(1,c.a+dt*5);continue;}
    const f=A.face,dx=Math.abs(Math.cos(f))>Math.abs(Math.sin(f))?Math.sign(Math.cos(f)):0,dy=dx?0:Math.sign(Math.sin(f)),at=tileOf(A);
    if(movingNow&&at[0]+dx===c.x&&at[1]+dy===c.y&&Math.hypot(A.x-(c.x*T+16),A.y-(c.y*T+16))<30){
      c.push+=dt;
      if(c.push>.2){c.push=0;const nx=c.x+dx,ny=c.y+dy;
        if(!solidTile(nx,ny)&&!dg.carts.some(o=>o.x===nx&&o.y===ny)){G.pblock.delete(pkey(c.x,c.y));c.fx=c.x;c.fy=c.y;c.x=nx;c.y=ny;c.a=0;G.pblock.add(pkey(nx,ny));snd('slam');}
        else snd('deflect');}
    } else c.push=0;
  }
  // pressure plates
  if(dg.plates.length){
    const occ=(p)=>dg.carts.some(c=>c.x===p.x&&c.y===p.y&&c.a>=1)||[G.wren,G.ash].some(o=>{const t=tileOf(o);return t[0]===p.x&&t[1]===p.y;});
    let all=true;for(const p of dg.plates){const was=p.on;p.on=occ(p);if(p.on&&!was)snd('click');if(!p.on)all=false;}
    if(all&&!st.solved[id])solve();
  }
  // braziers: Ashling lights them
  for(const b of dg.braz)if(!b.lit){const c=ctr(b.x,b.y);if(fireAt(c.x,c.y)){b.p+=dt;if(b.p>.6){b.lit=true;snd('brazier');burst(c.x,c.y-6,20,'#ffb060',110,.7,2.6,{add:true,g:-40});}}else b.p=Math.max(0,b.p-dt*.5);}
  // light: trace the moonbeam and the brazier beams through the mirrors
  if(S_.source){
    dg.beam=trace(S_.source.x,S_.source.y,S_.source.d[0],S_.source.d[1],dg);
    if(dg.beam.hit==='lock'&&!st.solved[id])solve();
    dg.beam2=dg.braz.filter(b=>b.lit&&(b.dx||b.dy)).map(b=>trace(b.x,b.y,b.dx,b.dy,dg));
    if(dg.beam2.some(b=>b.hit==='lock2')&&!st.solved2[id])solve2();
  } else if(S_.braz2&&dg.braz.length&&dg.braz.every(b=>b.lit)&&!st.solved2[id])solve2();
  for(const b of dg.bells)if(b.ring>0)b.ring-=dt;
  // Ashling can ring a bell by dashing into it
  if(G.dash.t>0)for(const b of dg.bells){const c=ctr(b.x,b.y);if(b.ring<=0&&Math.hypot(G.ash.x-c.x,G.ash.y-c.y)<24)ringBell(b);}
  // challenge
  const ch=dg.ch;
  if(ch&&ch.on){
    ch.t-=dt;
    if(ch.kind==='waves'){if(foesAlive()===0){ch.calm+=dt;if(ch.calm>.8){ch.calm=0;if(ch.wave<ch.waves.length)spawnWave();else endChal(true);}}else ch.calm=0;}
    else if(ch.candles.every(k=>!k.lit))endChal(true);
    if(dg.ch&&ch.t<=0)endChal(false);
  }
}
function trace(sx,sy,dx,dy,dg){
  const S_=DUNGEONS[dg.id],pts=[[sx,sy]];let x=sx,y=sy,hit=null;
  for(let n=0;n<80;n++){
    x+=dx;y+=dy;
    if(solidTile(x,y)){pts.push([x-dx*.5,y-dy*.5]);break;}
    const m=dg.mirrors.find(q=>q.x===x&&q.y===y);
    if(m&&m.s!=='|'){pts.push([x,y]);const ox=dx;if(m.s==='/'){dx=-dy;dy=-ox;}else{dx=dy;dy=ox;}}
    if(S_.lock&&x===S_.lock[0]&&y===S_.lock[1]){hit='lock';pts.push([x,y]);break;}
    if(S_.lock2&&x===S_.lock2[0]&&y===S_.lock2[1]){hit='lock2';pts.push([x,y]);break;}
  }
  return{pts,hit};
}
function stepEntry(dt){
  const e=ENTRIES[lvl];if(!e)return;
  if(!G.dgE)G.dgE={p:0,revealed:false,hint:false};
  const E=G.dgE,c=ctr(e.x,e.y);
  if(e.reveal==='fire'&&!E.revealed&&!D().found[e.dg]){
    if(fireAt(c.x,c.y)){E.p+=dt;if(Math.random()<dt*14)pt(c.x+rrand(-8,8),c.y-4,0,-18,.4,2,'#ffb060',{add:true});
      if(E.p>.9){E.revealed=true;snd('crack');burst(c.x,c.y,24,'#ffb040',110,.8,3,{add:true});G.secretsFound++;
        toast('A hidden way down',DUNGEONS[e.dg].name+'. Optional; the mission waits while you are below.','#ffd27a');say_('Ashling','It was hollow! There are stairs under there!');}}
    else E.p=Math.max(0,E.p-dt*.5);
    if(!E.hint&&G.ash.on&&Math.hypot(G.ash.x-c.x,G.ash.y-c.y)<2.6*T){E.hint=true;say_('Ashling','Warm air, coming up through the floor. Burn that crust?');}
  }
  if(e.reveal==='ruin'&&G.state==='ruin'&&!E.revealed&&Math.hypot(G.wren.x-c.x,G.wren.y-c.y)<2.5*T){E.revealed=true;toast('A cellar stair','The ruin has opened a way down. Optional.','#ffd27a');}
}
wrap('update',o=>function(dt){
  const g=G;
  if(g&&g.dng)g.alert=Math.min(g.alert,.6);
  o(dt);
  if(g&&G===g&&!g.cine&&!g.talk){
    if(g.dng){if(mode==='lose'){stats.caught=Math.max(0,stats.caught-1);setMode('play');pending={k:'leave',dead:true};}
      else if(mode==='play')stepDng(dt);}
    else if(mode==='play'&&!g.d.hub&&typeof lvl==='number'&&ENTRIES[lvl])stepEntry(dt);
  }
  if(pending){const p=pending;pending=null;
    if(p.k==='enter')enter(p.to);else if(p.k==='go')enter(p.to,p.from);else if(p.k==='leave')leave(p.dead);}
});
wrap('findTarget',o=>function(A){
  let t=o(A);
  if(!G||G.d.hub)return t;
  let bd=t?Math.hypot(t.x-A.x,t.y-A.y):1e9;
  for(const q of targets(A)){const d=Math.hypot(q.x-A.x,q.y-A.y);if(d<q.r&&d<bd){bd=d;t=q;}}
  return t;
});
wrap('completeTarget',o=>function(t){if(t&&t.kind==='dg'){t.fn();return;}return o(t);});
wrap('objectiveLines',o=>function(){
  if(!inDng())return o();
  const dg=G.dng,id=dg.id,S_=DUNGEONS[id],st=D(),L=[];
  L.push({text:S_.plates?'Weigh all three plates at once':S_.source?'Lead the moonbeam to the sun-lock':'Ring the bells as the dead were rung',done:!!st.solved[id]});
  L.push({text:'Open the strongbox',done:!!st.cleared[id]});
  L.push({text:'Challenge: '+S_.chal.label+(dg.ch&&dg.ch.on?' ('+Math.ceil(dg.ch.t)+'s)':''),done:!!st.chal[id]});
  L.push({text:'Climb back up (top-left stair)',done:false});
  return L;
});

/* ---------- drawing ---------- */
function drawStair(c,x,y){
  c.fillStyle='#0c0808';c.fillRect(x-13,y-13,26,26);
  for(let i=0;i<4;i++){c.fillStyle=['#5a4a40','#4a3c34','#3a2e28','#2a2020'][i];c.fillRect(x-12+i*2,y-12+i*6,24-i*4,5);}
  c.strokeStyle=INK;c.lineWidth=1.2;c.strokeRect(x-13.5,y-13.5,27,27);
}
function drawGrate(c,x,y,open,glow){
  c.fillStyle=open?'#0a0606':'#2a2220';c.fillRect(x-12,y-10,24,20);
  c.strokeStyle=open?'#6a5a50':'#4a3c36';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-10+i*5,y-9);c.lineTo(x-10+i*5,y+9);c.stroke();}
  c.strokeStyle=INK;c.lineWidth=1.2;c.strokeRect(x-12.5,y-10.5,25,21);
  if(glow>0){c.fillStyle='rgba(255,140,60,'+(glow*.4)+')';c.fillRect(x-12,y-10,24,20);}
}
function drawEntry(c){
  const e=ENTRIES[lvl];if(!e||!G.dgE)return;const p=ctr(e.x,e.y),E=G.dgE,t=G.time;
  if(e.reveal==='ruin'){if(G.state!=='ruin')return;drawStair(c,p.x,p.y);return;}
  if(visible(e)){drawGrate(c,p.x,p.y,true,0);return;}
  // a crust of slag or wax: a faint shimmer gives it away to a careful eye
  c.fillStyle='#3a2c26';ell(c,p.x,p.y,13,9);c.fill();c.strokeStyle='rgba(255,150,80,'+(.10+.08*Math.sin(t*2))+')';c.lineWidth=1;ell(c,p.x,p.y,10,6);c.stroke();
  if(E.p>0){c.strokeStyle='rgba(255,160,60,.8)';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,15,-1.57,-1.57+6.283*E.p/.9);c.stroke();}
}
const SYM=(c,n,x,y,s)=>{c.beginPath();
  if(n===0){circ(c,x,y,s*.45);c.fill();for(let i=0;i<8;i++){const a=i*.785;c.fillRect(x+Math.cos(a)*s*.7-1,y+Math.sin(a)*s*.7-1,2,2);}}
  else if(n===1){c.arc(x,y,s*.6,.6,5.7);c.arc(x+s*.25,y,s*.45,5.2,1.1,true);c.fill();}
  else if(n===2){c.ellipse(x,y,s*.7,s*.38,0,0,6.283);c.fill();c.fillStyle=INK;circ(c,x,y,s*.18);c.fill();}
  else{circ(c,x,y-s*.3,s*.3);c.fill();c.fillRect(x-1.2,y-s*.1,2.4,s*.8);c.fillRect(x,y+s*.45,s*.3,2);}};
function drawDng(c){
  const dg=G.dng,id=dg.id,S_=DUNGEONS[id],st=D(),t=G.time;
  const s=ctr(...STAIR);drawStair(c,s.x,s.y);
  ORDER.filter(x=>x!==id).forEach((to,k)=>{const w=ctr(...WARREN[k]),open=st.found[to]||st.solved[id];
    c.fillStyle='#1a1214';rr(c,w.x-12,w.y-14,24,26,10);c.fill();c.strokeStyle=open?'rgba(255,170,80,'+(.6+.3*Math.sin(t*3+k))+')':'#4a3c36';c.lineWidth=2;rr(c,w.x-12,w.y-14,24,26,10);c.stroke();
    c.strokeStyle=INK;c.lineWidth=1;rr(c,w.x-13.5,w.y-15.5,27,29,11);c.stroke();
    if(open){c.fillStyle='rgba(255,140,60,.25)';rr(c,w.x-9,w.y-11,18,20,8);c.fill();}});
  if(st.solved[id]){const b=ctr(...BOX);shadowAt(b.x+2,b.y+8,12,5,.35);c.fillStyle=st.cleared[id]?'#3a2a20':'#6a4428';rr(c,b.x-11,b.y-8,22,15,2);c.fill();
    c.fillStyle='#c9a04a';c.fillRect(b.x-11,b.y-3,22,2);c.fillRect(b.x-2,b.y-5,4,5);c.strokeStyle=INK;c.lineWidth=1.2;rr(c,b.x-11,b.y-8,22,15,2);c.stroke();}
  for(const p of dg.plates){const q=ctr(p.x,p.y);c.fillStyle=p.on?'#8a7040':'#4a4040';rr(c,q.x-12,q.y-12,24,24,3);c.fill();
    c.fillStyle=p.on?'rgba(255,210,120,.5)':'rgba(0,0,0,.3)';rr(c,q.x-9,q.y-9,18,18,2);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;rr(c,q.x-12,q.y-12,24,24,3);c.stroke();}
  for(const cart of dg.carts){const k=cart.a,x=(cart.fx+(cart.x-cart.fx)*k)*T+16,y=(cart.fy+(cart.y-cart.fy)*k)*T+16;
    shadowAt(x+2,y+10,13,5,.4);c.fillStyle='#4a3a30';rr(c,x-13,y-11,26,19,3);c.fill();c.fillStyle='#6a5a4a';c.fillRect(x-12,y-11,24,3);
    c.fillStyle='#3a3a42';for(const ox of [-8,8]){circ(c,x+ox,y+9,3.4);c.fill();}
    c.fillStyle='#8a6a50';for(let i=0;i<4;i++){circ(c,x-6+i*4,y-11,2.6);c.fill();}
    c.strokeStyle=INK;c.lineWidth=1.2;rr(c,x-13,y-11,26,19,3);c.stroke();}
  if(S_.source){const so=ctr(S_.source.x,S_.source.y);c.fillStyle='#cfe0ff';rr(c,so.x-10,so.y-14,20,8,2);c.fill();c.strokeStyle=INK;c.stroke();}
  for(const lk of [S_.lock,S_.lock2])if(lk){const q=ctr(...lk),lit=(lk===S_.lock&&st.solved[id])||(lk===S_.lock2&&st.solved2[id]);
    c.fillStyle=lit?'#ffe9a0':'#5a5060';circ(c,q.x,q.y,10);c.fill();c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();
    c.strokeStyle=lit?'#fff6d0':'#8a8098';c.lineWidth=1.4;for(let i=0;i<8;i++){const a=i*.785;c.beginPath();c.moveTo(q.x+Math.cos(a)*5,q.y+Math.sin(a)*5);c.lineTo(q.x+Math.cos(a)*8,q.y+Math.sin(a)*8);c.stroke();}}
  for(const m of dg.mirrors){const q=ctr(m.x,m.y);c.fillStyle='#2a2430';circ(c,q.x,q.y,11);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    const a=m.s==='/'?-.785:m.s==='\\'?.785:1.571;c.save();c.translate(q.x,q.y);c.rotate(a);
    const gr=c.createLinearGradient(-10,0,10,0);gr.addColorStop(0,'#8aa0c0');gr.addColorStop(.5,'#eef4ff');gr.addColorStop(1,'#8aa0c0');
    c.fillStyle=gr;c.fillRect(-11,-2.2,22,4.4);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(-11,-2.2,22,4.4);c.restore();}
  for(const b of dg.braz){const q=ctr(b.x,b.y);c.fillStyle='#4a3a30';c.beginPath();c.moveTo(q.x-9,q.y-4);c.lineTo(q.x+9,q.y-4);c.lineTo(q.x+5,q.y+8);c.lineTo(q.x-5,q.y+8);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    if(b.lit){c.fillStyle='#ffb040';c.beginPath();c.moveTo(q.x-6,q.y-4);c.quadraticCurveTo(q.x,q.y-20-3*Math.sin(t*9),q.x+6,q.y-4);c.fill();c.fillStyle='#fff0b0';c.beginPath();c.moveTo(q.x-3,q.y-4);c.quadraticCurveTo(q.x,q.y-12,q.x+3,q.y-4);c.fill();}
    else if(b.p>0){c.strokeStyle='rgba(255,160,60,.8)';c.lineWidth=2;c.beginPath();c.arc(q.x,q.y,14,-1.57,-1.57+6.283*b.p/.6);c.stroke();}}
  for(const b of dg.bells){const q=ctr(b.x,b.y),sw=b.ring>0?Math.sin(b.ring*30)*b.ring*.5:0;
    c.fillStyle='#3a2a1a';c.fillRect(q.x-13,q.y-16,26,3);c.save();c.translate(q.x,q.y-14);c.rotate(sw);
    const gr=c.createRadialGradient(-3,6,1,0,9,12);gr.addColorStop(0,'#f6dc8a');gr.addColorStop(1,'#7a5a1a');c.fillStyle=gr;
    c.beginPath();c.moveTo(-10,20);c.quadraticCurveTo(-10,3,0,2);c.quadraticCurveTo(10,3,10,20);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    c.fillStyle='#3a2410';SYM(c,b.n,0,12,9);c.restore();}
  if(S_.mural){const q=ctr(...S_.mural);c.fillStyle='#4a4038';rr(c,q.x-22,q.y-10,44,18,2);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    S_.order.forEach((n,i)=>{c.fillStyle=(dg.seq.length>i||st.solved[id])?'#ffd27a':'#d8ccb0';SYM(c,n,q.x-15+i*10,q.y-1,7);});}
  const C=S_.chal;if(C){const q=ctr(...C.at);
    if(C.kind==='waves'){c.fillStyle='#3a3a42';rr(c,q.x-12,q.y-6,24,11,3);c.fill();c.fillStyle='#5a5a66';c.fillRect(q.x-14,q.y-8,28,4);c.strokeStyle=INK;c.lineWidth=1.2;rr(c,q.x-12,q.y-6,24,11,3);c.stroke();}
    else{c.fillStyle='#4a5068';circ(c,q.x,q.y,9);c.fill();c.strokeStyle=INK;c.stroke();c.strokeStyle='rgba(200,220,255,'+(.4+.3*Math.sin(t*3))+')';circ(c,q.x,q.y,13);c.stroke();}
    if(st.chal[id]){c.fillStyle='#ffd27a';c.font='bold 8px '+HEAD;c.textAlign='center';c.fillText('CLEARED',q.x,q.y+20);}}
  if(dg.ch&&dg.ch.kind==='candles')for(const k of dg.ch.candles){const q=ctr(k.x,k.y);c.fillStyle='#efe2b8';c.fillRect(q.x-2.5,q.y-10,5,12);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(q.x-2.5,q.y-10,5,12);
    if(k.lit){c.fillStyle='#ffb040';c.beginPath();c.ellipse(q.x,q.y-14,2.6,4.6+Math.sin(t*12+k.x),0,0,6.283);c.fill();}}
}
function drawBeams_(c){
  const dg=G.dng;if(!dg||!dg.beam)return;
  const line=(b,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();b.pts.forEach((p,i)=>{const x=p[0]*T+16,y=p[1]*T+16;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();};
  c.globalCompositeOperation='lighter';
  for(const b of [dg.beam,...dg.beam2]){const warm=b!==dg.beam;
    line(b,warm?'rgba(255,150,60,.18)':'rgba(170,200,255,.18)',9);line(b,warm?'rgba(255,200,120,.7)':'rgba(220,235,255,.75)',2.2);}
  c.globalCompositeOperation='source-over';
}
wrap('drawBeams',o=>function(){o();try{if(inDng()){ctx.save();drawDng(ctx);ctx.restore();}else if(G&&!G.d.hub&&ENTRIES[lvl]){ctx.save();drawEntry(ctx);ctx.restore();}}catch(e){console.error('dungeons',e);}});
wrap('drawPrompt',o=>function(){if(inDng()){ctx.save();drawBeams_(ctx);ctx.restore();}o();});

window.Dungeons={DUNGEONS,ENTRIES,ORDER,UNIQUE,addEntry,enter,leave,stack,state:D,solve,solve2,startChal,endChal,openBox,trace,
  inDungeon:inDng,get pending(){return pending;},flush(){if(pending){const p=pending;pending=null;if(p.k==='enter')enter(p.to);else if(p.k==='go')enter(p.to,p.from);else leave(p.dead);}}};
})();
