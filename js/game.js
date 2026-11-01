'use strict';
/* EMBERCROWN - game logic. Rendering lives in render.js, menus/touch in ui.js. */
const cv=document.getElementById('c'),ctx=cv.getContext('2d');

let mode='title',lvl=0,perk=null,G=null,diff=1;
const HOUSE_NAMES={marrow:'Marrow',grell:'Grell',ostrander:'Ostrander',sable:'Sable',kest:'Kest',dunmoor:'Dunmoor'};
let houses={};
function resetHouses(){houses={};for(const k in HOUSE_NAMES)houses[k]={favor:0,fear:0,ruin:0};}
resetHouses();
const run={relics:[],lore:[],ranks:{},secrets:{}};      // this playthrough
const meta={relics:[],lore:[],best:{}};                  // remembered between playthroughs (codex)
const stats={gems:0,caught:0,time:0,byLvl:[]};
const keys={};
const touch={act:false,fire:false,sneak:false,jx:0,jy:0,on:false};
const mouse={x:0,y:0,down:false,inside:false,used:false};

function rep(){let f=0,e=0,r=0;for(const k in houses){f+=houses[k].favor;e+=houses[k].fear;r+=houses[k].ruin;}
  return{f,e,r,decay:1+.1*Math.min(f,4),sight:Math.max(.8,1-.03*e),gain:1+.05*e,fled:Math.floor(r/2),chaos:1+.05*r};}
function applyOutcome(){
  const L=[];
  const add=(h,t,n,msg)=>{houses[h][t]+=n;L.push('House '+HOUSE_NAMES[h]+': +'+n+' '+t[0].toUpperCase()+t.slice(1)+'. '+msg);};
  if(lvl===0)add('marrow','fear',1,'The thief who walked through their keep.');
  else if(lvl===1){
    if(perk==='bribe')add('grell','favor',1,'The steward remembers your coin.');
    else if(perk==='blackmail')add('grell','fear',1,'The chamberlain keeps your secret, for now.');
    else add('grell','ruin',1,'Grell wakes to a signature he does not remember.');
  } else if(lvl===2){
    add('ostrander','fear',1,'The beacons went dark in one night.');
    add('ostrander','ruin',1,'Forged letters turn their house on itself.');
  } else if(lvl===3){
    add('sable','fear',1,'The ledger names every bribe they took.');
    add('sable','ruin',1,'Their Bell-Warden is silenced.');
  } else if(lvl===4){
    add('kest','fear',1,'Their prize hostage walked out of Ironvale.');
    if(G.choice==='return')add('ostrander','favor',1,'Their heir comes home, unharmed.');
    else add('ostrander','fear',1,'You hold their heir over their heads.');
  } else if(lvl===5){
    add('dunmoor','ruin',1,'The forged treaty is now the first page of their war.');
    add('dunmoor','fear',1,"Veyra's signet is in your pocket.");
  } else if(lvl===6){
    G.ending=finaleEnding(G.choice);
    L.push(G.ending.sum);
  }
  G.outLines=L;
}
function houseCounts(){let f=0,e=0,r=0;for(const k in houses){if(houses[k].favor>0)f++;if(houses[k].fear>0)e++;if(houses[k].ruin>0)r++;}return{f,e,r};}
function finaleEnding(choice){
  const R=rep(),keys=Object.keys(houses);
  const stub=hasRelic('stub')?'The Hallow candle-stub sits cold in Wren\'s pocket. She does not throw it away.':null;
  if(choice==='puppet'){
    let best=keys[0],bs=-1;
    for(const k of keys){const s=houses[k].fear*2+houses[k].favor;if(s>bs){bs=s;best=k;}}
    houses[best].fear+=1;
    return{title:'Ending: The Puppet Crown',col:'#c8b4ff',
      lines:['House '+HOUSE_NAMES[best]+' wears the crown, and every string runs back to the Hollow Crown.',
        R.e>=4?'The houses obey because they are afraid, not because they agree.':'The houses go along with it. Peace holds, for now.',
        R.f>=2?'A few of them even thank you. Wren does not sleep well anyway.':'Wren holds the strings and does not sleep well.'].concat(stub?[stub]:[]),
      sum:'House '+HOUSE_NAMES[best]+': crowned, +1 Fear.'};
  }
  if(choice==='burn'){
    for(const k of keys)houses[k].ruin+=1;
    return{title:'Ending: Ash and Ember',col:'#ff9a4a',
      lines:['Ashling burns the throne to slag, and then, with enthusiasm, the hall.',
        R.r>=4?'The houses you ruined along the way have nothing left to rebuild with. The marsh smolders for a generation.':'The houses are bruised, not broken. They rebuild fast, and find a new throne by spring.',
        'Ashling: In my defense, it was very flammable.'].concat(stub?[stub]:[]),
      sum:'Every house: +1 Ruin.'};
  }
  for(const k of keys)houses[k].favor+=1;
  return{title:'Ending: The Broken Throne',col:'#7be08a',
    lines:['Ashling, full grown, shatters the throne. No crown is left to fight over.',
      R.f>=3?'The houses you helped meet in the rubble and draft a charter. It holds.':'The houses scramble for order. It is a hard winter, but nobody has a crown to steal.',
      'Wren sends one last letter. This time she knows what it says.'].concat(stub?[stub]:[]),
    sum:'Every house: +1 Favor.'};
}
const DIFFS=[
 {name:'Courier',range:1,decay:1.3,smoke:1,bell:1,flute:0,blurb:'Gentler guards, extra gadgets'},
 {name:'Spy',range:1.1,decay:1,smoke:0,bell:0,flute:0,blurb:'The intended experience'},
 {name:'Shadow',range:1.2,decay:.7,smoke:-1,bell:-1,flute:-1,blurb:'Sharper eyes, slow recovery, no flute'}];
const BASE_GEMS=LEVELS.reduce((s,l)=>s+l.map.join('').split('g').length-1,0);
const TOTAL_GEMS=BASE_GEMS+3*LEVELS.reduce((s,l)=>s+l.map.join('').split('G').length-1,0);
const BREAK_GEMS=Math.round(BASE_GEMS*.6);

/* ---------- save / settings ---------- */
const SAVE_KEY='embercrown.save.v2',SET_KEY='embercrown.settings.v1';
const settings={sfx:true,music:true,minimap:true,shake:true,hints:true};
function lsGet(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function loadSettings(){const s=lsGet(SET_KEY);if(s)Object.assign(settings,s);
  Aud.set.sfx=settings.sfx;Aud.set.music=settings.music;}
function saveSettings(){lsSet(SET_KEY,settings);}
let saved=null;
function loadSave(){
  const s=lsGet(SAVE_KEY);saved=null;
  if(!s||s.v!==2)return null;
  if(s.meta){meta.relics=s.meta.relics||[];meta.lore=s.meta.lore||[];meta.best=s.meta.best||{};}
  if(s.run&&!s.complete)saved=s;
  return s;
}
function writeSave(stage,next,complete){
  const s={v:2,meta:{relics:meta.relics,lore:meta.lore,best:meta.best}};
  if(complete)s.complete=true;
  else s.run={stage,next,diff,perk,houses,stats:{gems:stats.gems,caught:stats.caught,time:stats.time,byLvl:Array.from(stats.byLvl,v=>v||0)},relics:run.relics,lore:run.lore,ranks:run.ranks,secrets:run.secrets};
  lsSet(SAVE_KEY,s);
  saved=complete?null:s;
}
function continueGame(){
  const s=saved;if(!s||!s.run)return false;
  const r=s.run;diff=r.diff;perk=r.perk;houses=r.houses;
  stats.gems=r.stats.gems;stats.caught=r.stats.caught;stats.time=r.stats.time;stats.byLvl=r.stats.byLvl.slice();
  run.relics=(r.relics||[]).slice();run.lore=(r.lore||[]).slice();run.ranks=r.ranks||{};run.secrets=r.secrets||{};
  if(r.stage==='court'){lvl=0;setMode('court');}else startBrief(r.next);
  return true;
}
function newGame(){
  stats.gems=0;stats.caught=0;stats.time=0;stats.byLvl=[];perk=null;resetHouses();
  run.relics=[];run.lore=[];run.ranks={};run.secrets={};
  saved=null;lsSet(SAVE_KEY,{v:2,meta:{relics:meta.relics,lore:meta.lore,best:meta.best}});
  startBrief(0);
}
function hasRelic(id){return run.relics.includes(id)||!!(G&&G.gotRelics&&G.gotRelics.includes(id));}

/* ---------- helpers ---------- */
function setMode(m){mode=m;if(m==='title'||m==='brief'||m==='court'||m==='end')PT.length=0;if(typeof UI!=='undefined')UI.onMode(m);}
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d);}
function solidTile(tx,ty){
  if(!(tx>=0&&ty>=0&&tx<G.gw&&ty<G.gh))return true; // also catches NaN
  if(G.flight)return false;
  const c=G.grid[ty][tx];
  if(c==='#'||c===' ')return true;
  const d=G.doors[tx+','+ty];return !!(d&&!d.open);
}
function blocked(x,y,r){
  return solidTile(Math.floor((x-r)/T),Math.floor((y-r)/T))||solidTile(Math.floor((x+r)/T),Math.floor((y-r)/T))||
         solidTile(Math.floor((x-r)/T),Math.floor((y+r)/T))||solidTile(Math.floor((x+r)/T),Math.floor((y+r)/T));
}
function inSmoke(x,y){
  return G.smoke.some(s=>Math.hypot(s.x-x,s.y-y)<s.r)||
    (G.state==='ball'&&G.guests&&G.guests.some(s=>Math.hypot(s.x-x,s.y-y)<11));
}
function unstick(c){
  if(!blocked(c.x,c.y,8))return;
  const tx=Math.floor(c.x/T),ty=Math.floor(c.y/T);
  for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    const nx=(tx+dx)*T+16,ny=(ty+dy)*T+16;
    if(!blocked(nx,ny,8)){c.x=nx;c.y=ny;return;}
  }
}
function los(x1,y1,x2,y2){
  const d=Math.hypot(x2-x1,y2-y1),n=Math.ceil(d/6);
  for(let i=1;i<n;i++){
    const x=x1+(x2-x1)*i/n,y=y1+(y2-y1)*i/n;
    if(solidTile(Math.floor(x/T),Math.floor(y/T))||inSmoke(x,y))return false;
  }
  return true;
}
/* line of sight to a solid tile (cracked wall): stop just short of its centre */
function reachTile(a,tx,ty,range){
  const cx=tx*T+16,cy=ty*T+16,d=Math.hypot(cx-a.x,cy-a.y);
  if(d>range+10)return false;
  const k=Math.max(0,d-20)/(d||1);
  return los(a.x,a.y,a.x+(cx-a.x)*k,a.y+(cy-a.y)*k);
}
function say(who,text){G.msg={who,text};G.msgT=4;}
function toast(title,sub,col){G.toasts.push({title,sub:sub||'',col:col||'#f0b44c',t:3.4,t0:3.4});}

/* ---------- particles ---------- */
const PT=[];
const Q={maxP:460,amb:1,dprCap:2,tier:0};
function pt(x,y,vx,vy,life,size,col,o){
  if(PT.length>=Q.maxP)return;
  o=o||{};
  PT.push({x,y,vx,vy,l:life,m:life,s:size,c:col,g:o.g||0,add:!!o.add,k:o.k||'dot',gr:o.gr||0,dr:o.dr||0,txt:o.txt||null,rot:o.rot||0});
}
function burst(x,y,n,col,spd,life,size,o){
  for(let i=0;i<n;i++){const a=Math.random()*6.283,s=spd*(.3+Math.random()*.7);
    pt(x,y,Math.cos(a)*s,Math.sin(a)*s,life*(.6+Math.random()*.6),size*(.5+Math.random()),col,o);}
}
function floatText(x,y,text,col,size){pt(x,y,0,-26,1.1,size||11,col||'#fff',{k:'text',txt:text,dr:2});}
function updateFX(dt){
  for(let i=PT.length-1;i>=0;i--){
    const p=PT[i];p.l-=dt;
    if(p.l<=0){PT[i]=PT[PT.length-1];PT.pop();continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;
    if(p.dr){const f=Math.max(0,1-p.dr*dt);p.vx*=f;p.vy*=f;}
    p.s+=p.gr*dt;p.rot+=dt;
  }
  if(G){if(G.shake>0)G.shake=Math.max(0,G.shake-dt*22);}
}
function shake(a){if(G&&settings.shake)G.shake=Math.max(G.shake||0,a);}

/* ---------- time shift ---------- */
function shiftTime(){
  const ts=G.d.timeshift,toRuin=G.state==='ball';
  G.state=toRuin?'ruin':'ball';
  const t=G.guards;G.guards=G.otherGuards;G.otherGuards=t;
  G.grid=G.baseGrid.map(r=>r.slice());
  if(toRuin){
    for(const [x,y] of ts.ruin.open)G.grid[y][x]='.';
    if(G.planted)for(const [x,y] of ts.ruin.openIfPlanted)G.grid[y][x]='.';
    for(const [x,y] of ts.ruin.block)G.grid[y][x]='#';
  }
  G.vents=toRuin?G.ruinVents:[];
  G.rangeMul=G.baseRange*(toRuin?1.1:.9);
  unstick(G.wren);unstick(G.ash);
  G.rings.push({x:G.wren.x,y:G.wren.y,t:1,r:220,c:toRuin?'220,130,80':'240,210,130'});
  G.dirty=true;G.flash={t:.8,c:toRuin?'255,140,80':'200,220,255'};G.shiftT=1.2;
  Aud.S.shift();shake(5);
  burst(G.wren.x,G.wren.y,26,toRuin?'#ffb070':'#cfe0ff',120,1.1,2.4,{add:true,dr:1.5});
  lureNear(G.wren.x,G.wren.y,8*T);
  say('Wren',toRuin?'Three years on. The hall remembers what it became.':'The ball again. Mind the masks.');
  Aud.setTheme(Object.assign({},G.d.th.music,{root:G.d.th.music.root*(toRuin?.84:1)}));
}

/* ---------- level loading ---------- */
function loadLevel(i){
  const d=LEVELS[i];
  const g={d,grid:[],items:[],doors:{},cracks:{},smoke:[],rings:[],active:'wren',alert:0,hold:0,holdT:null,
    time:0,gems:0,msg:null,msgT:0,fireSaid:false,doneSaid:false,sneak:false,gad:{...d.gadgets},exitOpen:false,flight:!!d.flight,vents:[],peds:[],ventSaid:false,gain:1,choice:null,outLines:[],
    host:d.choice?{x:0,y:0,on:false,host:true,face:0,ph:0}:null,
    gh:d.map.length,gw:d.map[0].length,toasts:[],shake:0,intro:3.2,dirty:true,gotRelics:[],gotLore:[],
    st:{stuns:0,detect:0,maxAlert:0,barrels:0,secrets:0},dash:{t:0,cd:0,a:0,hit:null},
    cam:null,flash:null,prompt:null,crit:[],fireOn:false,secretsTotal:0,secretsFound:0,loreSeen:{}};
  const D=DIFFS[diff];
  if(!d.flight)for(const k of ['smoke','bell','flute'])g.gad[k]=Math.max(0,g.gad[k]+D[k]);
  if(!d.flight){if(run.relics.includes('purse'))g.gad.bell++;if(run.relics.includes('stub'))g.gad.smoke++;}
  let start,ex,loreN=0;
  d.map.forEach((row,y)=>{
    g.grid[y]=[];
    for(let x=0;x<g.gw;x++){
      let c=row[x];
      if(c==='S'){start=[x,y];c='.';}
      else if(c==='X'){ex=[x,y];c='.';}
      else if(c==='D'){g.doors[x+','+y]={x,y,open:false};c='.';}
      else if(c==='Z'){g.doors[x+','+y]={x,y,open:false,sealed:true};c='.';}
      else if(c==='T'){g.peds.push({x:x*T+16,y:y*T+16});c='.';}
      else if(c==='V'){g.vents.push({x,y,ph:(x*.7+y*1.3)%4,on:false,warn:false});c='.';}
      else if(c==='k'){g.cracks[x+','+y]={x,y,p:0};g.secretsTotal++;c='#';}
      else if('gGOPBLHCrso'.includes(c)){
        const it={x:x*T+16,y:y*T+16,type:c,done:false,p:0,ph:Math.random()*6,fuse:-1};
        if(c==='s'){it.lore=(LORE[i]||[])[loreN++]||null;}
        if(c==='G'||c==='r'||x>=25||y>=15){it.secret=true;g.secretsTotal++;}
        g.items.push(it);c='.';
      }
      g.grid[y][x]=c;
    }
  });
  g.exit={x:ex[0]*T+16,y:ex[1]*T+16};
  g.wren={x:start[0]*T+16,y:start[1]*T+16,face:0,ph:0};
  g.ash={x:g.wren.x+(i>0?T:0),y:g.wren.y,face:0,on:i>0,ph:0};
  if(g.flight){g.wren.hidden=true;g.ash.x=g.wren.x;g.ash.y=g.wren.y;g.active='ash';}
  const R=rep();
  g.rangeMul=((perk==='poison'&&i===1)?0.75:1)*D.range*R.sight;
  g.decay=((perk==='blackmail'&&i===1)?2.5:1)*D.decay*R.decay*(run.relics.includes('mask')?1.2:1);
  g.gain=R.gain*(run.relics.includes('cowl')?.9:1);
  const spd=(perk==='poison'&&i===1)?44:56;
  const KIND={hound:{spd:1.35,kr:.7,half:1.0},archer:{spd:.9,kr:1.45,half:.34},brute:{spd:.85,kr:1,half:.55}};
  g.guards=d.guards.map((wp,k)=>({wp,k})).filter(o=>!(perk==='bribe'&&i===1&&o.k===d.bribeIdx)).map(o=>{
    const wp=o.wp,kd=(d.kinds||{})[o.k],K=KIND[kd]||{spd:1,kr:1,half:.62};
    return{x:wp[0][0]*T+16,y:wp[0][1]*T+16,wp:wp.map(p=>[p[0]*T+16,p[1]*T+16]),i:1,
    face:Math.atan2(wp[1][1]-wp[0][1],wp[1][0]-wp[0][0]),stun:0,pause:0,lure:null,back:null,ret:false,seeing:false,spd:spd*K.spd,rm:d.flight?.8:1,
    kind:kd||'guard',kr:K.kr,half:K.half,ph:Math.random()*6,was:false,seen:null,bang:0,quest:0};});
  if(R.fled>0)g.guards.splice(Math.max(1,g.guards.length-R.fled),Math.min(R.fled,g.guards.length-1));
  for(const x of g.guards)x.spd*=R.chaos;
  if(d.finale){
    const hc=houseCounts(),n=Math.min(3,hc.e);
    if(n>0)g.guards.splice(Math.max(1,g.guards.length-n),Math.min(n,g.guards.length-1));
    g.gad.bell+=Math.min(3,hc.f);
  }
  if(d.boss){const wp=d.boss.wp,cm=d.boss.kind==='candle',bhp=cm?100-8*houseCounts().r:100;
    g.boss={x:wp[0][0]*T+16,y:wp[0][1]*T+16,wp:wp.map(p=>[p[0]*T+16,p[1]*T+16]),i:1,boss:true,kind:d.boss.kind||'warden',hp:bhp,maxhp:bhp,
      blinkT:5,blink:null,hurt:0,dead:false,tollT:4,toll:0,ph:0,half:.62,kr:1,
      face:Math.atan2(wp[1][1]-wp[0][1],wp[1][0]-wp[0][0]),stun:0,pause:0,lure:null,back:null,ret:false,seeing:false,spd:cm?46:40,rm:1,was:false,seen:null,bang:0,quest:0};
    g.guards.push(g.boss);}
  g.noiseT=0;
  for(const t of (d.towers||[]))g.guards.push({x:t[0]*T+16,y:t[1]*T+16,wp:[[t[0]*T+16,t[1]*T+16]],i:0,face:t[2],spin:t[3],
    stun:0,pause:0,lure:null,back:null,ret:false,seeing:false,spd:0,rm:.8,kind:'tower',kr:1,half:.62,ph:0,was:false,seen:null,bang:0,quest:0});
  if(d.timeshift){
    const ts=d.timeshift;
    const mk=wp=>({x:wp[0][0]*T+16,y:wp[0][1]*T+16,wp:wp.map(p=>[p[0]*T+16,p[1]*T+16]),i:1,
      face:Math.atan2(wp[1][1]-wp[0][1],wp[1][0]-wp[0][0]),stun:0,pause:0,lure:null,back:null,ret:false,seeing:false,spd:spd*R.chaos,rm:1,
      kind:'guard',kr:1,half:.62,ph:Math.random()*6,was:false,seen:null,bang:0,quest:0});
    g.state='ball';g.planted=false;g.shiftSaid=false;
    g.otherGuards=ts.ruin.guards.map(mk);
    if(R.fled>0)g.otherGuards.splice(Math.max(1,g.otherGuards.length-R.fled),Math.min(R.fled,g.otherGuards.length-1));
    g.baseGrid=g.grid.map(r=>r.slice());
    g.ruinVents=(ts.ruin.vents||[]).map(v=>({x:v[0],y:v[1],ph:(v[0]*.7+v[1]*1.3)%4,on:false,warn:false}));
    g.baseRange=g.rangeMul;g.rangeMul=g.baseRange*.9;
    g.guests=ts.guests.map((s,k)=>({a:[s[0][0]*T+16,s[0][1]*T+16],b:[s[1][0]*T+16,s[1][1]*T+16],ph:k*1.7,
      x:s[0][0]*T+16,y:s[0][1]*T+16,c:['#d9a441','#6aa0d9','#c06a9a','#7fc08a'][k%4]}));
  }
  return g;
}
function startBrief(i){lvl=i;setMode('brief');}
function startPlay(){
  PT.length=0;
  G=loadLevel(lvl);
  setMode('play');
  Aud.S.confirm();
  Aud.setTheme(G.d.th.music);
  say(G.flight?'Ashling':'Wren',G.d.opening);
  if(typeof onLevelStart==='function')onLevelStart();
}

/* ---------- input ---------- */
addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(['tab',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  Aud.init();
  if(!e.repeat)press(k);
  keys[k]=true;
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;touch.act=touch.fire=false;mouse.down=false;if(mode==='play')pauseGame(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pauseGame(true);});

function makeChoice(k){ // k = 1..3
  if(mode!=='choice')return;
  if(G.d.finale){
    if(k===3&&stats.gems<BREAK_GEMS)return;
    if(k<1||k>3)return;
    G.choice=['puppet','burn','break'][k-1];finishLevel();
  } else if(k===1||k===2){G.choice=k===1?'return':'leverage';finishLevel();}
}
function continueFromWin(){
  if(lvl===0)setMode('court');
  else if(lvl+1<LEVELS.length)startBrief(lvl+1);
  else setMode('end');
}
function pickPerk(k){ if(mode!=='court')return; perk=['bribe','blackmail','poison'][k-1];writeSave('brief',lvl+1);startBrief(lvl+1); }
function pauseGame(on){
  if(on&&mode==='play'){setMode('pause');Aud.fire(false);}
  else if(!on&&mode==='pause'){setMode('play');}
}
function press(k){
  if(typeof UI!=='undefined'&&UI.handleKey(k))return;
  if(mode==='title'&&['1','2','3'].includes(k)){diff=+k-1;if(typeof UI!=='undefined')UI.onMode('title');Aud.S.click();}
  else if(mode==='title'&&k==='enter'){if(saved&&continueGame()){}else newGame();}
  else if(mode==='choice'&&['1','2','3'].includes(k))makeChoice(+k);
  else if(mode==='brief'&&k==='enter')startPlay();
  else if(mode==='lose'&&k==='enter')startPlay();
  else if(mode==='win'&&k==='enter')continueFromWin();
  else if(mode==='court'&&['1','2','3'].includes(k))pickPerk(+k);
  else if(mode==='end'&&k==='enter')toTitle();
  else if(mode==='pause'&&(k==='escape'||k==='p'||k==='enter'))pauseGame(false);
  else if(mode==='play'&&(k==='escape'||k==='p'))pauseGame(true);
  else if(mode==='play')playPress(k);
  if(k==='m'){settings.sfx=!settings.sfx;settings.music=settings.sfx;Aud.setOpt('sfx',settings.sfx);Aud.setOpt('music',settings.music);saveSettings();if(typeof UI!=='undefined')UI.refresh();}
}
function toTitle(){
  Aud.fire(false);Aud.setTheme({root:73,mode:'minor',tempo:.6});
  G=null;PT.length=0;setMode('title');
}
function playPress(k){
  if(k==='tab'&&G.ash.on&&!G.flight)swapChar();
  else if(k==='q')useSmoke();
  else if(k==='r')useBell();
  else if(k==='f')useFlute();
  else if(k==='shift')dashPress();
  else if(k==='n'){settings.minimap=!settings.minimap;saveSettings();}
}
function swapChar(){
  if(!G.ash.on||G.flight)return;
  G.active=G.active==='wren'?'ash':'wren';const a=G.active==='wren'?G.wren:G.ash;
  G.rings.push({x:a.x,y:a.y,t:.4,r:40,c:'255,255,255'});Aud.S.swap();
}
function useSmoke(){
  if(G.active!=='wren'||G.gad.smoke<=0)return;
  G.gad.smoke--;G.smoke.push({x:G.wren.x,y:G.wren.y,r:58,t:6,t0:6});Aud.S.smoke();
  burst(G.wren.x,G.wren.y,18,'#d6d6e2',50,1.2,6,{k:'smoke',gr:10,dr:1.2});
}
function lureNear(x,y,r,noise){
  for(const g of G.guards){
    if(g.stun>0||(noise&&g.boss))continue;
    if(Math.hypot(g.x-x,g.y-y)<r&&los(g.x,g.y,x,y)){
      if(!g.lure&&!g.ret)g.back={x:g.x,y:g.y};
      g.lure={x,y,t:3};g.ret=false;g.quest=1.4;
    }
  }
}
function useBell(){
  if(G.active!=='wren'||G.gad.bell<=0)return;
  G.gad.bell--;
  const w=G.wren,cx=Math.cos(w.face),cy=Math.sin(w.face);
  let x=w.x,y=w.y;
  for(let i=0;i<4*T;i+=4){
    const nx=w.x+cx*i,ny=w.y+cy*i;
    if(solidTile(Math.floor(nx/T),Math.floor(ny/T)))break;
    x=nx;y=ny;
  }
  G.rings.push({x,y,t:.8,r:100,c:'240,180,76'});
  Aud.S.bell();burst(x,y,10,'#ffd27a',60,.7,2,{add:true});
  lureNear(x,y,9*T);
}
function useFlute(){
  if(G.active!=='wren')return;
  if(G.gad.flute<=0){if(G.d.song)say('Wren','I do not know the Song yet. Find the lectern.');return;}
  if(G.d.timeshift){
    for(const p of G.peds)if(Math.hypot(p.x-G.wren.x,p.y-G.wren.y)<46){shiftTime();return;}
  }
  let best=null,bd=3*T;
  for(const k in G.doors){
    const d=G.doors[k];if(d.open)continue;
    const dd=Math.hypot(d.x*T+16-G.wren.x,d.y*T+16-G.wren.y);
    if(dd<bd){bd=dd;best=d;}
  }
  if(!best){say('Wren','Nothing close enough to open.');return;}
  G.gad.flute--;best.open=true;
  G.rings.push({x:G.wren.x,y:G.wren.y,t:1,r:140,c:'160,220,255'});
  Aud.S.flute();Aud.S.open();
  burst(best.x*T+16,best.y*T+16,14,'#a8d8ff',70,.8,2,{add:true});
  lureNear(G.wren.x,G.wren.y,8*T);
  say('Ashling','Subtle. Real subtle.');
}
function dashPress(){
  if(G.active!=='ash'||G.dash.t>0||G.dash.cd>0)return;
  const A=G.ash;
  G.dash.t=.22;G.dash.cd=hasRelic('forgeheart')?1.7:2.6;G.dash.a=A.face;G.dash.hit=new Set();
  Aud.S.dash();burst(A.x,A.y,10,'#ffb060',90,.4,2.5,{add:true});
}
function openCrack(c){
  if(!G.cracks[c.x+','+c.y])return;
  delete G.cracks[c.x+','+c.y];
  G.grid[c.y][c.x]='.';if(G.baseGrid)G.baseGrid[c.y][c.x]='.';
  G.dirty=true;
  const x=c.x*T+16,y=c.y*T+16;
  burst(x,y,30,'#9a8f84',120,1.1,4,{k:'smoke',gr:8,dr:1.4});
  burst(x,y,14,'#ffb060',140,.7,2,{add:true,g:120});
  G.rings.push({x,y,t:.7,r:90,c:'255,200,140'});
  Aud.S.crack();shake(7);
  G.secretsFound++;
  toast('Hidden passage!','Something was sealed in the stone.','#ffd27a');
  lureNear(x,y,6*T,true);
}

/* ---------- update ---------- */
function moveG(g,tx,ty,dt,spd){
  const dx=tx-g.x,dy=ty-g.y,d=Math.hypot(dx,dy);
  if(d<3)return true;
  g.face=Math.atan2(dy,dx);
  const st=Math.min(d,spd*dt),nx=g.x+dx/d*st,ny=g.y+dy/d*st;
  if(blocked(nx,ny,8))return true;
  g.x=nx;g.y=ny;g.ph+=st*.18;return false;
}
function stepGuard(g,dt){
  if(g.stun>0){g.stun-=dt;return;}
  if(g.seeing)return;
  if(g.spin){g.face+=g.spin*.7*dt;return;}
  if(g.lure){
    if(moveG(g,g.lure.x,g.lure.y,dt,g.spd*1.3)){g.lure.t-=dt;if(g.lure.t<=0){g.lure=null;g.ret=true;}}
    return;
  }
  if(g.ret){if(moveG(g,g.back.x,g.back.y,dt,g.spd))g.ret=false;return;}
  if(g.pause>0){g.pause-=dt;return;}
  const w=g.wp[g.i];
  if(moveG(g,w[0],w[1],dt,g.spd)){g.i=(g.i+1)%g.wp.length;g.pause=.6;}
}
function completeTarget(t){
  if(t.kind==='door'){t.ref.open=true;Aud.S.open();
    burst(t.ref.x*T+16,t.ref.y*T+16,10,'#c9a06a',50,.6,2.5,{k:'smoke',gr:4});return;}
  const it=t.ref;it.done=true;
  Aud.S.confirm();burst(it.x,it.y,14,'#ffe0a0',70,.7,2,{add:true});
  if(it.type==='H'){
    G.host.on=true;G.host.x=it.x;G.host.y=it.y;
    say('Perrin','You are the spy? You are shorter than I was told. And is that a dragon?');
  } else if(it.type==='C'){
    const left=G.items.filter(i=>i.type==='C'&&!i.done).length;
    G.rings.push({x:it.x,y:it.y,t:.5,r:50,c:'200,200,255'});Aud.S.snuff();
    burst(it.x,it.y-8,12,'#8a8a96',30,1.2,5,{k:'smoke',g:-30,gr:6});
    say('Wren',left?'Snuffed. '+left+' to go.':'The last candle. Now he has nowhere to hide.');
  } else if(it.type==='L'){
    G.song=true;G.gad.flute=999;
    G.rings.push({x:G.wren.x,y:G.wren.y,t:1,r:120,c:'160,220,255'});Aud.S.flute();
    toast('Song of Opening learned','Press F near a sealed door. It is loud.','#9fd8ff');
    say('Wren','The Song of Opening. Press F near a sealed door. It is loud.');
  } else if(it.type==='O'&&G.d.song){say('Wren','The ledger. Every bribe Sable ever took, in one hand.');
  } else if(it.type==='O'){
    if(lvl===0){
      G.ash.on=true;G.ash.x=G.wren.x+14;G.ash.y=G.wren.y+14;
      G.rings.push({x:G.wren.x,y:G.wren.y,t:1,r:90,c:'255,140,60'});
      burst(G.wren.x,G.wren.y,30,'#ff9a4a',120,1,3,{add:true});shake(5);
      toast('Ashling hatches!','TAB swaps characters. SPACE breathes fire. SHIFT dashes.','#ff9a4a');
      say('Ashling','Oh. I hatched. Press TAB to swap, SPACE to burn.');
    } else if(G.d.timeshift)say('Wren',"Veyra's signet, still warm from a three-year-old fire.");
    else say('Wren','Seal swapped. Grell will sign his own surrender.');
  } else if(it.type==='P'){
    if(G.d.timeshift){G.planted=true;say('Wren','Treaty planted. Dunmoor will find it, and so will its enemies.');}
    else say(G.flight?'Ashling':'Wren',G.flight?'Letter dropped. Ostrander will find a very convincing forgery.':'One cup. One very bad evening for the guest of honor.');
  }
}
function findTarget(A){
  let tgt=null,bd=1e9;
  for(const k in G.doors){
    const d=G.doors[k];if(d.open||d.sealed)continue;
    const dd=Math.hypot(d.x*T+16-A.x,d.y*T+16-A.y);
    if(dd<44&&dd<bd){bd=dd;tgt={kind:'door',ref:d,need:.9,x:d.x*T+16,y:d.y*T+16,label:'Pick lock'};}
  }
  for(const it of G.items){
    if('OPLHC'.includes(it.type)&&!it.done&&
       (!G.d.timeshift||(it.type==='P'?G.state==='ball':it.type==='O'?G.state==='ruin':true))){
      const dd=Math.hypot(it.x-A.x,it.y-A.y);
      if(dd<34&&dd<bd){bd=dd;
        const lab={O:G.d.song?'Take the ledger':lvl===0?'Steal the egg':G.d.timeshift?'Take the signet':'Swap the seal',P:G.flight?'Drop the letter':G.d.timeshift?'Plant the treaty':'Poison the cup',L:'Learn the Song',H:'Free Perrin',C:'Snuff the candle'}[it.type];
        tgt={kind:'item',ref:it,need:it.type==='H'?1.6:it.type==='C'?.8:1.2,x:it.x,y:it.y,label:lab};}
    }
  }
  return tgt;
}
function explode(it){
  if(it.done)return;
  it.done=true;G.st.barrels++;
  const x=it.x,y=it.y,R=2.7*T;
  burst(x,y,46,'#ffb040',230,.9,4,{add:true,g:40,dr:1});
  burst(x,y,22,'#5a4a42',130,1.4,8,{k:'smoke',gr:12,dr:1.2});
  G.rings.push({x,y,t:.8,r:R*1.2,c:'255,170,70'},{x,y,t:.5,r:R*.7,c:'255,240,180'});
  G.flash={t:.35,c:'255,200,120'};
  Aud.S.explode();shake(11);
  let hit=0;
  for(const g of G.guards){
    if(g.spin)continue;
    if(Math.hypot(g.x-x,g.y-y)<R&&los(x,y,g.x,g.y)){
      if(g.boss){if(g.kind!=='candle'||G.candlesLit===0){g.hp-=10;g.hurt=.3;floatText(g.x,g.y-24,'-10','#ff8a60',13);}continue;}
      g.stun=Math.max(g.stun,g.kind==='brute'?2:4.5);hit++;G.st.stuns++;
      floatText(g.x,g.y-20,'STUNNED','#ffd27a');
    }
  }
  for(const o of G.items)if(o.type==='o'&&!o.done&&Math.hypot(o.x-x,o.y-y)<2.6*T)o.fuse=.28;
  for(const k in G.cracks){const c=G.cracks[k];if(Math.hypot(c.x*T+16-x,c.y*T+16-y)<2.4*T){openCrack(c);}}
  if(!G.flight&&Math.hypot(G.wren.x-x,G.wren.y-y)<1.5*T){G.alert=Math.min(.95,G.alert+.3);say('Wren','Too close. That stung.');}
  else if(hit)say('Ashling','Boom. You are welcome.');
  lureNear(x,y,9*T,true);
}
function collectItem(it,by){
  it.done=true;
  const x=it.x,y=it.y;
  if(it.type==='g'){
    G.gems++;stats.byLvl[lvl]=Math.max(stats.byLvl[lvl]||0,G.gems);
    stats.gems=stats.byLvl.reduce((a,b)=>a+(b||0),0);
    G.rings.push({x,y,t:.5,r:36,c:'255,154,60'});Aud.S.gem();
    burst(x,y,8,'#ffb060',60,.5,2,{add:true});
    const rn=62+Math.min(stats.gems,12)*8;
    if(stats.gems<=12)floatText(x,y-8,'+1','#ffd27a',10);
    if(stats.gems<=12&&stats.gems%3===0)toast('Ember mastery','Ashling\'s fire reaches further ('+Math.round(rn)+').','#ff9a4a');
  } else if(it.type==='G'){
    G.gems+=3;stats.byLvl[lvl]=Math.max(stats.byLvl[lvl]||0,G.gems);
    stats.gems=stats.byLvl.reduce((a,b)=>a+(b||0),0);
    Aud.S.cache();burst(x,y,36,'#ffb040',140,1,3,{add:true,g:60});G.rings.push({x,y,t:.8,r:80,c:'255,170,60'});
    G.secretsFound++;toast('Ember cache!','+3 ember gems','#ffb040');
  } else if(it.type==='r'){
    const key=['boots','purse','stormglass','cowl','forgeheart','mask','stub'][lvl];
    G.gotRelics.push(key);G.secretsFound++;
    Aud.S.relic();burst(x,y,60,'#ffe9a0',170,1.6,3,{add:true,g:-20,dr:.8});G.rings.push({x,y,t:1.2,r:140,c:'255,230,150'});
    G.flash={t:.5,c:'255,235,170'};shake(4);
    G.relicNow=RELICS[key];
    toast('RELIC: '+RELICS[key].name,RELICS[key].desc,'#ffe9a0');
  } else if(it.type==='s'&&it.lore){
    G.gotLore.push(it.lore.t);if(it.secret)G.secretsFound++;
    Aud.S.scroll();burst(x,y,10,'#e8dcc0',50,.6,2,{add:true});
    G.loreCard={title:it.lore.t,text:it.lore.x,t:6,t0:6};
  }
}
function update(dt){
  G.time+=dt;stats.time+=dt;
  if(G.intro>0)G.intro-=dt;
  G.candlesLit=G.items.filter(i=>i.type==='C'&&!i.done).length;
  const A=G.active==='wren'?G.wren:G.ash;
  const dashing=G.dash.t>0;
  G.dash.cd=Math.max(0,G.dash.cd-dt);
  let mx0=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);
  let my0=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0);
  let jm=0;
  if(touch.jx||touch.jy){mx0=touch.jx;my0=touch.jy;jm=Math.min(1,Math.hypot(mx0,my0));}
  G.sneak=G.active==='wren'&&(!!keys['shift']||touch.sneak);
  const actHeld=!!(keys['e']||touch.act||(mouse.down&&G.active==='wren'));
  const fireHeld=!!(keys[' ']||touch.fire||(mouse.down&&G.active==='ash'));
  if(mouse.down&&G.active==='ash'&&mouse.world){A.face=Math.atan2(mouse.world.y-A.y,mouse.world.x-A.x);}
  let moving=false;
  if(dashing){
    const dd=G.dash;dd.t-=dt;
    const steps=3;
    for(let s=0;s<steps;s++){
      const sp=430*dt/steps,nx=A.x+Math.cos(dd.a)*sp,ny=A.y+Math.sin(dd.a)*sp;
      // cracked wall ahead? shatter it
      const hx=Math.floor((A.x+Math.cos(dd.a)*16)/T),hy=Math.floor((A.y+Math.sin(dd.a)*16)/T);
      const ck=G.cracks[hx+','+hy];
      if(ck){openCrack(ck);dd.t=0;break;}
      if(blocked(nx,ny,10)){dd.t=0;break;}
      A.x=nx;A.y=ny;
    }
    A.face=dd.a;
    if(Math.random()<.9)pt(A.x-Math.cos(dd.a)*8,A.y-Math.sin(dd.a)*8,(Math.random()-.5)*30,(Math.random()-.5)*30,.35,3+Math.random()*3,'#ff9a3c',{add:true});
    for(const g of G.guards){
      if(g.spin||dd.hit.has(g))continue;
      if(Math.hypot(g.x-A.x,g.y-A.y)<(g.boss?26:22)){
        dd.hit.add(g);
        if(g.kind==='brute'||(g.boss&&g.kind==='candle'&&G.candlesLit>0)){
          Aud.S.deflect();burst(g.x,g.y,10,'#cfd6e6',100,.3,1.6,{add:true});dd.t=0;G.alert=Math.min(.95,G.alert+.08);floatText(g.x,g.y-22,'BLOCKED','#cfd6e6',10);
        } else if(g.boss){g.hp-=8;g.hurt=.2;Aud.S.hit();shake(5);floatText(g.x,g.y-26,'-8','#ff8a60',13);
          if(g.hp<=0){g.hp=0;g.dead=true;g.stun=1e9;}
        } else if(g.stun<=0){
          g.stun=hasRelic('forgeheart')?4:2.8;G.st.stuns++;G.alert=Math.min(.95,G.alert+.08);
          Aud.S.hit();shake(4);burst(g.x,g.y,14,'#ffd27a',130,.4,2,{add:true});floatText(g.x,g.y-20,'STUNNED','#ffd27a');
        }
      }
    }
    moving=true;
  } else if(mx0||my0){
    const l=Math.hypot(mx0,my0),mx=mx0/l,my=my0/l;
    A.face=Math.atan2(my,mx);moving=true;
    const sneakSp=hasRelic('boots')?60:48;
    const sp=G.active==='wren'?(G.sneak?sneakSp:92):135,r=G.active==='wren'?8:10;
    const nx=A.x+mx*sp*dt;if(!blocked(nx,A.y,r))A.x=nx;
    const ny=A.y+my*sp*dt;if(!blocked(A.x,ny,r))A.y=ny;
    A.ph+=sp*dt*.2;
    A.sd=(A.sd||0)+sp*dt;
    if(A.sd>(G.active==='wren'?(G.sneak?30:22):24)){A.sd=0;Aud.S.step(G.sneak);
      if(!G.flight&&Math.random()<.6)pt(A.x,A.y+5,(Math.random()-.5)*10,(Math.random()-.5)*10,.5,2.5,'rgba(120,110,100,.5)',{k:'smoke',gr:3});}
  }
  // tether: the other one is pulled along if too far
  if(G.ash.on&&!G.flight){
    const O=G.active==='wren'?G.ash:G.wren;
    if(Math.hypot(O.x-A.x,O.y-A.y)>7.5*T){
      G.rings.push({x:O.x,y:O.y,t:.4,r:30,c:'180,120,255'});
      O.x=A.x;O.y=A.y;
      G.rings.push({x:O.x,y:O.y,t:.4,r:30,c:'180,120,255'});
    }
  }
  // idle follower sways toward its partner a little (cosmetic, no collision effect)
  // hostage follows Wren
  if(G.host&&G.host.on){
    const h=G.host,w=G.wren,hd=Math.hypot(w.x-h.x,w.y-h.y);
    if(hd>6*T){h.x=w.x;h.y=w.y;}
    else if(hd>30){
      const nx=h.x+(w.x-h.x)/hd*88*dt,ny=h.y+(w.y-h.y)/hd*88*dt;
      h.face=Math.atan2(w.y-h.y,w.x-h.x);h.ph+=88*dt*.2;
      if(!blocked(nx,h.y,8))h.x=nx;
      if(!blocked(h.x,ny,8))h.y=ny;
    }
  }
  // masked guests drift through the ball (they block sight lines)
  if(G.guests&&G.state==='ball')for(const s of G.guests){
    const q=(1+Math.sin(G.time*.45+s.ph))/2;
    s.x=s.a[0]+(s.b[0]-s.a[0])*q;s.y=s.a[1]+(s.b[1]-s.a[1])*q;
  }
  // forge vents: Wren burns, Ashling does not
  for(const v of G.vents){
    const c=(G.time+v.ph)%4,was=v.on;v.on=c<1.4;v.warn=c>3.3;
    if(v.on&&!was){Aud.S.ember();}
    if(v.on&&Math.random()<.6)pt(v.x*T+16+(Math.random()-.5)*14,v.y*T+16,(Math.random()-.5)*20,-50-Math.random()*40,.9,2+Math.random()*2,'#ffa040',{add:true,g:-20});
    if(v.on&&!G.flight&&Math.hypot(G.wren.x-(v.x*T+16),G.wren.y-(v.y*T+16))<17){
      G.alert+=1.6*dt;
      if(!G.ventSaid){G.ventSaid=true;say('Ashling','Hot. Very hot. For you, anyway.');}
    }
  }
  // silence: noise draws nearby monks (not the deaf Bell-Warden)
  if(G.d.quiet&&moving&&!(G.active==='wren'&&G.sneak)){
    G.noiseT-=dt;
    if(G.noiseT<=0){G.noiseT=.7;lureNear(A.x,A.y,(G.active==='wren'?4:5)*T,true);G.rings.push({x:A.x,y:A.y,t:.35,r:30,c:'150,100,200'});}
  }
  // hold-to-interact (Wren only)
  const holding=actHeld&&(G.active==='wren'||G.flight);
  const tgtNow=(G.active==='wren'||G.flight)?findTarget(A):null;
  G.prompt=tgtNow;
  if(holding){
    const tgt=tgtNow;
    if(tgt&&G.holdT&&G.holdT.ref===tgt.ref)G.hold+=dt;else{G.hold=0;G.holdT=tgt;}
    if(tgt&&G.hold>=tgt.need){completeTarget(tgt);G.hold=0;G.holdT=null;}
    else if(tgt&&Math.random()<dt*10)pt(tgt.x+(Math.random()-.5)*16,tgt.y+(Math.random()-.5)*10,0,-14,.5,1.6,'#ffe0a0',{add:true});
  } else {G.hold=0;G.holdT=null;}
  // pickups
  for(const it of G.items){
    if(!'gGrs'.includes(it.type)||it.done)continue;
    for(const c of [G.flight?null:G.wren,G.ash.on?G.ash:null]){
      if(c&&!it.done&&Math.hypot(it.x-c.x,it.y-c.y)<(it.type==='g'?16:20)){collectItem(it,c);}
    }
  }
  // barrel fuses
  for(const it of G.items)if(it.type==='o'&&!it.done&&it.fuse>0){it.fuse-=dt;if(it.fuse<=0)explode(it);}
  // dragon fire
  const firing=G.active==='ash'&&fireHeld&&!dashing;
  if(firing!==G.fireOn){G.fireOn=firing;Aud.fire(firing);}
  if(firing){
    const a=G.ash,range=62+Math.min(stats.gems,12)*8+(hasRelic('stormglass')?14:0);
    G.fireRange=range;
    for(let i=0;i<3;i++){
      const dd=Math.random()*range,sp=(Math.random()-.5)*.7,an=a.face+sp;
      const sx=a.x+Math.cos(a.face)*9,sy=a.y+Math.sin(a.face)*9;
      const v=(range/.5)*(.55+Math.random()*.45);
      pt(sx,sy,Math.cos(an)*v,Math.sin(an)*v,Math.min(.55,range/v),4+Math.random()*4,Math.random()<.5?'#ff8a2a':'#ffd060',{add:true,gr:9,dr:.4});
    }
    const inCone=(x,y)=>{const dx=x-a.x,dy=y-a.y;return Math.hypot(dx,dy)<range&&angDiff(Math.atan2(dy,dx),a.face)<.6&&los(a.x,a.y,x,y);};
    for(const g of G.guards){
      if(g.stun>0||!inCone(g.x,g.y))continue;
      const behind=angDiff(Math.atan2(a.y-g.y,a.x-g.x),g.face)>1.3;
      if(g.boss){
        if(g.kind==='candle'&&G.candlesLit>0){
          g.hurt=.1;
          if(!G.shieldSaid){G.shieldSaid=true;say('Ashling','My fire slides right off. The candles are shielding him!');}
        } else if(behind){
          const was=g.hp;g.hp-=22*dt;g.hurt=.15;
          if(Math.floor(was/10)!==Math.floor(g.hp/10)){Aud.S.hit();floatText(g.x+(Math.random()-.5)*20,g.y-26,'-10','#ff8a60',12);}
          if(g.hp<=0){g.hp=0;g.dead=true;g.stun=1e9;shake(10);Aud.S.boom();burst(g.x,g.y,50,'#ffb040',200,1.2,4,{add:true});
            if(g.kind==='candle')say('Candlemaker','Burn it, crown it, break it. I was always one step ahead.');
            else say('Ashling','The bell is quiet. So is he. Mostly.');}
        } else G.alert=Math.min(.95,G.alert+.5*dt);
      } else if(g.kind==='brute'){
        if(behind){g.stun=4;G.st.stuns++;G.alert=Math.min(.95,G.alert+.15);Aud.S.stun();floatText(g.x,g.y-22,'STUNNED','#ffd27a');}
        else{G.alert=Math.min(.95,G.alert+.5*dt);g.hurt=.1;
          if(Math.random()<dt*8){Aud.S.deflect();burst(g.x+Math.cos(g.face)*10,g.y+Math.sin(g.face)*10,3,'#cfd6e6',90,.25,1.4,{add:true});}
          if(!G.bruteSaid){G.bruteSaid=true;say('Ashling','The shield eats my fire! Get behind him.');}}
      } else {g.stun=5;G.st.stuns++;G.alert=Math.min(.95,G.alert+.15);Aud.S.stun();floatText(g.x,g.y-20,'STUNNED','#ffd27a');}
    }
    for(const it of G.items){
      if(it.type==='B'&&!it.done&&inCone(it.x,it.y)){
        it.p+=dt;
        if(it.p>=1){it.done=true;Aud.S.confirm();burst(it.x,it.y,20,'#ffb040',100,.8,3,{add:true});say('Ashling','Signal is out. You are welcome.');}
      } else if(it.type==='o'&&!it.done&&it.fuse<0&&inCone(it.x,it.y)){it.fuse=.22;}
    }
    for(const k in G.cracks){
      const c=G.cracks[k];
      if(reachTile(a,c.x,c.y,range)&&angDiff(Math.atan2(c.y*T+16-a.y,c.x*T+16-a.x),a.face)<.7){
        c.p+=dt;
        if(Math.random()<dt*14)pt(c.x*T+16+(Math.random()-.5)*20,c.y*T+16+(Math.random()-.5)*20,0,-10,.5,2,'#ffb060',{add:true});
        if(c.p>=1.1){openCrack(c);}
      } else c.p=Math.max(0,c.p-dt*.6);
    }
    if(!G.fireSaid){G.fireSaid=true;say('Ashling','Barbecue time.');}
  } else {
    for(const it of G.items)if(it.type==='B'&&!it.done)it.p=Math.max(0,it.p-dt*.5);
    for(const k in G.cracks){const c=G.cracks[k];c.p=Math.max(0,c.p-dt*.6);}
  }
  // curious dragon: hint at nearby cracked walls
  if(G.ash.on&&!G.crackHinted){
    for(const k in G.cracks){const c=G.cracks[k];
      if(Math.hypot(c.x*T+16-G.ash.x,c.y*T+16-G.ash.y)<3.2*T&&Math.hypot(c.x*T+16-G.wren.x,c.y*T+16-G.wren.y)<4.5*T){
        G.crackHinted=true;say('Ashling','That wall is wheezing. Burn it? Or I could just run at it.');break;}}
  }
  // detection
  let best=0;
  const targets=G.flight?[]:[G.wren];if(G.ash.on)targets.push(G.ash);
  if(G.host&&G.host.on)targets.push(G.host);
  for(const g of G.guards){
    g.seeing=false;
    if(g.bang>0)g.bang-=dt;if(g.quest>0)g.quest-=dt;
    if(g.stun>0){g.was=false;continue;}
    for(const t of targets){
      const isActive=t.host?true:(t===G.wren)===(G.active==='wren');
      let mul=(t===G.ash?1.45:1)*(isActive?1:.6)*G.rangeMul;
      if(t===G.wren&&G.sneak)mul*=.6;
      const range=5.2*T*mul*(g.rm||1)*(g.kr||1),dx=t.x-g.x,dy=t.y-g.y,dist=Math.hypot(dx,dy);
      let see=dist<range&&(dist<T*.9||angDiff(Math.atan2(dy,dx),g.face)<(g.half||.62))&&los(g.x,g.y,t.x,t.y);
      if(!see&&g.kind==='hound'&&dist<2.5*T*mul&&los(g.x,g.y,t.x,t.y))see=true; // the nose knows
      if(see){
        g.seeing=true;g.face=Math.atan2(dy,dx);g.seen={x:t.x,y:t.y};
        best=Math.max(best,.45+(1-dist/range)*1.1);
      }
    }
    if(g.seeing&&!g.was){g.bang=1;G.st.detect++;if(!G.alertSfxT||G.time-G.alertSfxT>1.2){G.alertSfxT=G.time;Aud.S.alert();}}
    if(!g.seeing&&g.was&&!g.spin&&!g.boss&&g.seen){
      // lost sight: go and look
      if(!g.lure&&!g.ret)g.back={x:g.x,y:g.y};
      g.lure={x:g.seen.x,y:g.seen.y,t:1.6};g.ret=false;g.quest=1.4;
    }
    g.was=g.seeing;
  }
  if(best>0)G.alert+=best*dt*G.gain;else G.alert-=dt*.22*G.decay;
  G.alert=Math.max(0,G.alert);
  G.st.maxAlert=Math.max(G.st.maxAlert,Math.min(1,G.alert));
  for(const g of G.guards)stepGuard(g,dt);
  // Bell-Warden: the bell tolls; whoever you control must stand still when it lands
  const B=G.boss;
  if(B){
    if(B.hurt>0)B.hurt-=dt;
    if(B.kind==='candle'&&!B.dead){
      B.blinkT-=dt;
      if(B.blink){
        B.blink.t-=dt;
        if(B.blink.t<=0){
          const q=B.blink;
          burst(B.x,B.y,20,'#ff8a40',90,.6,2.5,{add:true});
          B.x=q.x;B.y=q.y;B.face=Math.atan2(A.y-B.y,A.x-B.x);B.lure=null;B.ret=false;B.pause=.8;B.blink=null;
          G.rings.push({x:q.x,y:q.y,t:.6,r:70,c:'255,120,60'});
          burst(q.x,q.y,26,'#ff8a40',140,.7,3,{add:true});Aud.S.blink();shake(4);
          if(Math.hypot(A.x-q.x,A.y-q.y)<2.2*T){G.alert+=.45;say('Candlemaker','Still one step behind, little courier?');}
        }
      } else if(B.blinkT<=0){
        B.blinkT=8;
        for(let n=0;n<40;n++){
          const ang=Math.random()*6.283,rr=(1.6+Math.random()*1.4)*T,x=A.x+Math.cos(ang)*rr,y=A.y+Math.sin(ang)*rr;
          if(!blocked(x,y,12)){B.blink={x,y,t:1.3};G.rings.push({x,y,t:1.3,r:40,c:'255,120,60'});Aud.S.blink();break;}
        }
      }
    }
    if(!B.dead&&B.kind!=='candle'){
      B.tollT-=dt;
      if(B.tollT<=0&&B.toll<=0){B.tollT=6;B.toll=.9;G.rings.push({x:B.x,y:B.y,t:.9,r:7*T,c:'255,200,80'});Aud.S.toll();shake(5);
        if(!G.tollSaid){G.tollSaid=true;say('Ashling','The bell! Freeze when it rings!');}}
      if(B.toll>0){B.toll-=dt;
        if(B.toll<=0&&moving&&Math.hypot(A.x-B.x,A.y-B.y)<7*T){G.alert+=.3;say('Wren','It heard me move.');}}
    }
  }
  // timers
  G.smoke=G.smoke.filter(s=>(s.t-=dt)>0);
  G.rings=G.rings.filter(r=>(r.t-=dt)>0);
  if(G.msgT>0)G.msgT-=dt;
  for(const t of G.toasts)t.t-=dt;G.toasts=G.toasts.filter(t=>t.t>0);
  if(G.loreCard){G.loreCard.t-=dt;if(G.loreCard.t<=0)G.loreCard=null;}
  if(G.flash){G.flash.t-=dt;if(G.flash.t<=0)G.flash=null;}
  if(G.shiftT>0)G.shiftT-=dt;
  // exit
  const req=G.items.filter(i=>'OPBLHC'.includes(i.type));
  G.exitOpen=req.every(i=>i.done)&&(!G.boss||G.boss.dead);
  if(G.exitOpen&&!G.doneSaid){G.doneSaid=true;Aud.S.win();toast('Objectives complete',G.flight?'Land on the green pad.':'Get Wren to the gate.','#7be08a');say(G.flight?'Ashling':'Wren',G.flight?'Done. Land on the green pad.':'Objectives done. Get Wren to the gate.');}
  const ex=G.flight?G.ash:G.wren;
  if(G.exitOpen&&(G.flight||G.active==='wren')&&Math.hypot(ex.x-G.exit.x,ex.y-G.exit.y)<20
     &&(!G.host||Math.hypot(G.host.x-G.exit.x,G.host.y-G.exit.y)<90)){
    if(G.d.choice||G.d.finale){setMode('choice');Aud.fire(false);}else finishLevel();
  }
  if(G.alert>=1){
    setMode('lose');stats.caught++;Aud.fire(false);Aud.S.lost();shake(9);
    G.caughtAt={x:A.x,y:A.y};
  }
}
/* ---------- rank & finishing ---------- */
function rankFor(g){
  const s=g.st;
  let score=100-30*s.maxAlert-3*s.detect-Math.max(0,(g.time-150)/12)+4*g.secretsFound;
  score=Math.max(0,Math.min(110,score));
  g.score=Math.round(score);
  return score>=92?'S':score>=76?'A':score>=56?'B':'C';
}
function finishLevel(){
  Aud.fire(false);
  applyOutcome();
  G.rank=rankFor(G);
  const order={S:4,A:3,B:2,C:1};
  if(!run.ranks[lvl]||order[G.rank]>order[run.ranks[lvl]])run.ranks[lvl]=G.rank;
  if(!meta.best[lvl]||order[G.rank]>order[meta.best[lvl]])meta.best[lvl]=G.rank;
  run.secrets[lvl]=Math.max(run.secrets[lvl]||0,G.secretsFound);
  for(const r of G.gotRelics){if(!run.relics.includes(r))run.relics.push(r);if(!meta.relics.includes(r))meta.relics.push(r);}
  for(const t of G.gotLore){if(!run.lore.includes(t))run.lore.push(t);if(!meta.lore.includes(t))meta.lore.push(t);}
  const last=lvl+1>=LEVELS.length;
  if(last)writeSave(null,null,true);
  else writeSave(lvl===0?'court':'brief',lvl+1);
  Aud.S.win();
  setMode('win');
}
