'use strict';
/* EMBERCROWN - Ashling's abilities and Shiloh's techniques.
   Ashling: Glide, Ember Lantern, Scorch, Roar (plus Ember Nova when learned at the Forge). E (or the touch ACT/NOVA button
   while Ashling leads) uses the selected one; G (or the small ring button beside ACT on touch) cycles. Each has an
   exploration use and a combat use:
     glide    carries Shiloh across a chasm, slag or a gap (landing on firm ground) / landing slam staggers and stuns
     lantern  lights dark rooms, reveals hidden runes, pressure plates and hidden caches / the flare dazzles; but guards see by it too
     scorch   burns webs, vines, rotten doors and wax seals / sets foes alight and stuns guards in a short cone
     roar     scares guards off, stuns the close ones, shakes loose hanging cages and chandeliers / staggers foes; very loud
   Unlocks: Forge talents (scorch, roar), Hesper's roost chain (ember_roost -> glide), the Rookery perch (growth from ember
   gems: any of the four), and quest fx {abil:'<id>'}. Learned ids live in run.npc.abil (already saved with the run).
   Shiloh's techniques come from mastery rank: lockpick tiers (2/6/10), silent dash (3), shadow-step (5), disguise (8).
   Data hooks: SPOTS[level] places webs, vines, rotten doors, wax seals, runes, dark rooms and hanging cages. */
(function(){
const DEFS={
 glide:{name:'Glide',tag:'E to carry Shiloh over a gap. G to choose.',col:'#9fe0ff',cd:4,desc:'Ashling hoists Shiloh over a chasm, slag or gap and lands hard enough to stagger whatever is underneath.',src:"Hesper's roost or the perch"},
 lantern:{name:'Ember Lantern',short:'Lantern',tag:'Lights the dark and shows what hides in it.',col:'#ffd27a',cd:4,dur:14,desc:'A glow in her throat: lights dark rooms, shows hidden runes, plates and caches, dazzles foes when lit. Guards see by it too.',src:'The perch'},
 scorch:{name:'Scorch',tag:'Burns webs, vines, rot and wax.',col:'#ff8a3a',cd:2.5,desc:'A short white-hot jet: burns webs, vines, rotten doors and wax seals; sets foes alight and stuns guards.',src:'Forge talent or the perch'},
 roar:{name:'Roar',tag:'Stuns, scatters, shakes things loose.',col:'#e08aff',cd:9,desc:'Guards close by are stunned, the rest scatter; hanging cages and chandeliers shake loose. Everyone hears it.',src:'Forge talent or the perch'}
};
const ORDER=['glide','lantern','scorch','roar'];
const ALIAS={ember_roost:'glide'}; // hub quest rewards that also teach an ability
const C=v=>v*T+16;

/* ---------- learned state ---------- */
function R(){if(!run.npc)run.npc={flags:{}};return run.npc;}
function learned(){const r=R();return Array.isArray(r.abil)?r.abil:(r.abil=[]);}
function has(id){if(!DEFS[id])return id==='nova'?hasT('nova'):learned().includes(id);return learned().includes(id)||(typeof hasT==='function'&&hasT(id));}
function unlock(id,quiet){
  const a=ALIAS[id];if(a)unlock(a,quiet);
  if(!DEFS[id])return false;
  const L=learned();if(L.includes(id))return false;L.push(id);
  if(!quiet&&typeof G!=='undefined'&&G&&G.toasts){toast('Ashling learned '+DEFS[id].name,DEFS[id].tag,DEFS[id].col);try{Aud.S.learn?Aud.S.learn():Aud.S.relic();}catch(e){}}
  R().absel=id;return true;
}
function list(){const o=[];if(typeof hasT==='function'&&hasT('nova'))o.push('nova');for(const id of ORDER)if(has(id))o.push(id);return o;}
function selected(){const L=list();if(!L.length)return null;const s=R().absel;return L.includes(s)?s:L[0];}
function cycle(){const L=list();if(L.length<2)return selected();const i=L.indexOf(selected());R().absel=L[(i+1)%L.length];
  try{Aud.S.tick?Aud.S.tick():Aud.S.click();}catch(e){}
  if(typeof G!=='undefined'&&G&&G.ash)floatText(G.ash.x,G.ash.y-30,nameOf(R().absel).toUpperCase(),colOf(R().absel),10);return R().absel;}
function nameOf(id){return id==='nova'?'Ember Nova':DEFS[id]?DEFS[id].short||DEFS[id].name:id;}
function colOf(id){return id==='nova'?'#ffd27a':DEFS[id]?DEFS[id].col:'#fff';}
function cdMul(){return Math.max(.5,1-equipBonus('abcd'));}

/* perch growth: one point per 5 ember gems fed (max 4), spent on any ability */
function perchPts(){const r=R();return Math.max(0,Math.min(4,Math.floor(((typeof stats!=='undefined'&&stats.gems)||0)/5))-(r.abperch||0));}
function teach(id){if(!DEFS[id]||has(id)||perchPts()<=0)return false;R().abperch=(R().abperch||0)+1;unlock(id);return true;}

/* ---------- per level state ---------- */
/* SPOTS[level]: k web|vine|wax (a cache wrapped up until scorched), door (a rotten door: scorch opens it), rune (shows only in
   lantern light; touch it), dark (a room that stays black outside lantern light), hang (a cage on a rope: roar drops it) */
const SPOTS={
 0:[{k:'dark',x0:1,y0:17,x1:4,y1:20},{k:'rune',x:3,y:19,rew:{cin:30,item:'phantomlocket'},title:'A rune under the soot',say:['Ashling','Writing. On the floor. In the dark. Someone wanted only a dragon to read it.']},
    {k:'door',x:12,y:11},{k:'hang',x:18,y:6,rew:{cin:25,item:'drakebarding'},title:'The gibbet cage'},
    {k:'web',x:14,y:20,rew:{cin:20},title:'A webbed strongbox'}],
 1:[{k:'web',x:9,y:12,rew:{cin:20,item:'duelcoat'},title:"A fencing master's trunk"},{k:'door',x:8,y:7},{k:'hang',x:20,y:11,rew:{cin:30},title:'A hanging larder'}],
 3:[{k:'dark',x0:5,y0:15,x1:9,y1:18},{k:'rune',x:7,y:16,rew:{cin:40},title:'The penitent rune',say:['Shiloh','A map scratched where no candle ever reached. The crypt goes deeper than the abbey admits.']},
    {k:'web',x:2,y:12,rew:{cin:25},title:'A cobwebbed alms box'},{k:'door',x:3,y:4}],
 4:[{k:'hang',x:12,y:9,rew:{cin:30,item:'retortcaps'},title:'An ore bucket on a chain'},{k:'door',x:20,y:5}],
 5:[{k:'vine',x:4,y:4,rew:{cin:25,item:'alchsatchel'},title:'A vine-choked satchel'},{k:'rune',x:20,y:8,rew:{cin:35},title:'A rune behind the panelling'},{k:'dark',x0:19,y0:7,x1:23,y1:11}],
 6:[{k:'wax',x:20,y:12,rew:{cin:40,item:'drakelance'},title:'A wax-sealed reliquary',say:['Ashling','Wax. My favourite. It runs.']},{k:'hang',x:12,y:4,rew:{cin:30},title:'A hanging censer'}]
};
function okTile(g,tx,ty){const r=g.grid[ty];if(!r)return false;const c=r[tx];return c!=null&&c!=='#'&&c!==' '&&!(g.pblock&&g.pblock.has&&g.pblock.has(tx+','+ty));}
function nudge(g,s){
  if(okTile(g,s.x,s.y))return true;
  for(let r=1;r<=2;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(okTile(g,s.x+dx,s.y+dy)){s.x+=dx;s.y+=dy;return true;}
  return false;
}
function initLevel(g,i){
  g.ab={cd:{},lant:0,glide:null,flare:0,spots:[],shadeT:0,stepCd:0,maskT0:0,said:{}};
  if(typeof i!=='number'||g.flight||(g.d&&g.d.hub))return;
  for(const q of SPOTS[i]||[]){
    const s=Object.assign({},q,{done:false,seen:q.k!=='rune',t:0});
    if(s.k==='dark'){g.ab.spots.push(s);continue;}
    if(s.k==='door'){const d=g.doors&&g.doors[s.x+','+s.y];if(!d||d.gate||d.sealed)continue;d.rotten=true;s.door=d;g.ab.spots.push(s);continue;}
    if(!nudge(g,s))continue;
    if(s.k==='hang')s.st='up';
    g.ab.spots.push(s);
  }
  // Shiloh's disguise skill: one more turn in the livery
  if(tech('disguise')&&g.mis&&g.mis.dis)g.mis.dis.uses+=1;
}

/* ---------- Shiloh's techniques (mastery) ---------- */
const TECHS=[
 {id:'pick1',L:2,name:'Lockpick I',desc:'Locks, pockets and snuffing 10% faster.'},
 {id:'silent',L:3,name:'Silent Dash',desc:'A roll while sneaking stays quiet and hides you in your own cloak for a moment.'},
 {id:'shadow',L:5,name:'Shadow-step',desc:'A roll while sneaking in the dark becomes a step from one shadow to the next.'},
 {id:'pick2',L:6,name:'Lockpick II',desc:'20% faster.'},
 {id:'disguise',L:8,name:'Disguise Skill',desc:'Masks last half again as long; servant livery gets one more use.'},
 {id:'pick3',L:10,name:'Lockpick III',desc:'30% faster.'}
];
function mLevel(){return typeof masteryLevel==='function'?masteryLevel((run.mastery&&run.mastery.xp)||0):1;}
function tech(id){const t=TECHS.find(x=>x.id===id);return !!t&&mLevel()>=t.L;}
function techs(){const L=mLevel();return TECHS.map(t=>Object.assign({on:L>=t.L},t));}

/* ---------- using abilities ---------- */
function ready(id){const A=G&&G.ab;return !!A&&!(A.cd[id]>0);}
function can(){return !!(G&&G.ab&&G.ash&&G.ash.on&&G.active==='ash'&&!G.flight&&!G.cine&&!G.talk&&mode==='play');}
function use(id){
  id=id||selected();if(!id)return false;
  if(id==='nova'){if(typeof oNova==='function')oNova();return true;}
  if(!has(id)||!can())return false;
  if(!ready(id)&&!(id==='lantern'&&G.ab.lant>0)){try{Aud.S.back();}catch(e){}return false;}
  const ok=FX[id]();
  if(ok!==false&&id!=='lantern')G.ab.cd[id]=DEFS[id].cd*cdMul();
  return ok!==false;
}
function dirOf(A){return A.face||0;}
function guardsNear(x,y,r){return G.guards.filter(g=>!g.boss&&!g.spin&&!g.eng&&Math.hypot(g.x-x,g.y-y)<r);}
function foesNear(x,y,r){return(G.foes||[]).filter(f=>f.state!=='dead'&&f.state!=='spawn'&&Math.hypot(f.x-x,f.y-y)<r+(f.r||10));}
const FX={
 glide(){
  const A=G.ash,W=G.wren,a=dirOf(A),ca=Math.cos(a),sa=Math.sin(a),carry=Math.hypot(W.x-A.x,W.y-A.y)<76;
  const maxD=150+equipBonus('glide');let land=null;
  const pathOk=d=>{for(let k=8;k<=d;k+=8){const x=A.x+ca*k,y=A.y+sa*k;if(solidTile(Math.floor(x/T),Math.floor(y/T)))return false;}return true;};
  const hot=(x,y)=>window.MisB&&MisB.hotTile&&(()=>{try{return MisB.hotTile(Math.floor(x/T),Math.floor(y/T));}catch(e){return false;}})();
  for(let d=maxD;d>=40;d-=8){const x=A.x+ca*d,y=A.y+sa*d;if(!pathOk(d))continue;
    if(blocked(x,y,8)||hot(x,y))continue;land={x,y};break;}
  if(!land){floatText(A.x,A.y-26,'NO FOOTING','#9fe0ff',10);return false;}
  G.ab.glide={t:0,dur:.6,ax:A.x,ay:A.y,wx:W.x,wy:W.y,ox:W.x-A.x,oy:W.y-A.y,lx:land.x,ly:land.y,carry};
  A.face=a;try{Aud.S.glide();}catch(e){}
  burst(A.x,A.y,10,'#cfe8ff',90,.4,2,{k:'smoke',gr:6});
  if(carry&&!G.ab.said.glide){G.ab.said.glide=1;say('Shiloh','Do not drop me. Do not drop me. Do not -');}
 },
 lantern(){
  const A=G.ash,L=G.ab;
  if(L.lant>0){L.lant=0;L.cd.lantern=1.2;try{Aud.S.snuff();}catch(e){}return;}
  L.lant=DEFS.lantern.dur+equipBonus('lant');L.flare=.5;try{Aud.S.lantern();}catch(e){}
  G.rings.push({x:A.x,y:A.y,t:.6,r:110,c:'255,215,120'});
  for(const f of foesNear(A.x,A.y,90)){f.vuln=Math.max(f.vuln||0,1.2);floatText(f.x,f.y-24,'DAZZLED','#ffe9a0',10);}
  for(const g of guardsNear(A.x,A.y,70))if(los(A.x,A.y,g.x,g.y)){g.stun=Math.max(g.stun,1.2);}
 },
 scorch(){
  const A=G.ash,a=dirOf(A),R=86+equipBonus('fire')*.5;
  const inCone=(x,y,pad)=>{const d=Math.hypot(x-A.x,y-A.y);if(d>R+(pad||0))return false;if(d<14)return true;return Math.abs(angDiff(Math.atan2(y-A.y,x-A.x),a))<.5;};
  for(let i=0;i<26;i++){const k=Math.random()*R,s=(Math.random()-.5)*.8;pt(A.x+Math.cos(a)*14,A.y+Math.sin(a)*14,Math.cos(a+s)*(140+k*2),Math.sin(a+s)*(140+k*2),.35+Math.random()*.2,3+Math.random()*3,Math.random()<.5?'#fff2c0':'#ff8a3a',{add:true,dr:2});}
  try{Aud.S.scorch();}catch(e){}
  let hit=0;
  for(const s of G.ab.spots){if(s.done)continue;
    if((s.k==='web'||s.k==='vine'||s.k==='wax')&&inCone(C(s.x),C(s.y),14)){burnSpot(s);hit++;}
    else if(s.k==='door'&&!s.door.open&&inCone(C(s.x),C(s.y),16)){s.done=true;s.door.open=true;s.door.burnt=true;burst(C(s.x),C(s.y),24,'#ff9a40',120,.6,3,{add:true});burst(C(s.x),C(s.y),12,'#4a3a32',60,1,6,{k:'smoke',gr:8});
      toast('Rotten door','It burns through. No lock, no noise.','#ff9a40');hit++;}}
  for(const f of foesNear(A.x,A.y,R))if(inCone(f.x,f.y,f.r)){damageFoe(f,1,{fire:true,stagger:true,sx:A.x,sy:A.y,kx:Math.cos(a)*160,ky:Math.sin(a)*160});f.burnT=Math.max(f.burnT||0,2.6);hit++;}
  for(const g of guardsNear(A.x,A.y,R))if(inCone(g.x,g.y,8)&&los(A.x,A.y,g.x,g.y)){g.stun=Math.max(g.stun,2.5+equipBonus('stun'));G.st.stuns++;floatText(g.x,g.y-22,'SCORCHED','#ff9a40');hit++;}
  if(typeof igniteNear==='function')igniteNear(A.x+Math.cos(a)*R*.6,A.y+Math.sin(a)*R*.6,R*.5);
  const B=G.boss;if(B&&!B.dead&&B.eng&&inCone(B.x,B.y,22)&&typeof bossHit==='function')bossHit(B,{type:'fire'});
  return true;
 },
 roar(){
  const A=G.ash,R0=72,R1=140+equipBonus('roar');
  try{Aud.S.roar();}catch(e){}shake(8);G.rings.push({x:A.x,y:A.y,t:.7,r:R1,c:'224,138,255'});G.rings.push({x:A.x,y:A.y,t:.45,r:R0,c:'255,255,255'});
  for(const g of guardsNear(A.x,A.y,R1)){
    const d=Math.hypot(g.x-A.x,g.y-A.y);
    if(d<R0){g.stun=Math.max(g.stun,2.2);G.st.stuns++;floatText(g.x,g.y-22,'STUNNED','#e08aff');continue;}
    // scare: run four tiles directly away from the dragon
    const a=Math.atan2(g.y-A.y,g.x-A.x);let tx=g.x,ty=g.y;
    for(let k=T;k<=4*T;k+=8){const x=g.x+Math.cos(a)*k,y=g.y+Math.sin(a)*k;if(blocked(x,y,8))break;tx=x;ty=y;}
    if(!g.lure&&!g.ret)g.back={x:g.x,y:g.y};g.lure={x:tx,y:ty,t:3.5};g.ret=false;g.quest=2;g.scared=1.5;floatText(g.x,g.y-22,'!!','#e08aff',12);
  }
  // far guards hear it and come looking
  for(const g of G.guards){if(g.boss||g.eng||g.stun>0)continue;const d=Math.hypot(g.x-A.x,g.y-A.y);if(d>=R1&&d<R1+110){if(!g.lure&&!g.ret)g.back={x:g.x,y:g.y};g.lure={x:A.x,y:A.y,t:3};g.ret=false;g.quest=1.4;}}
  for(const f of foesNear(A.x,A.y,R1*.8)){const a=Math.atan2(f.y-A.y,f.x-A.x);damageFoe(f,1,{noEq:true,stagger:true,kx:Math.cos(a)*260,ky:Math.sin(a)*260,sx:A.x,sy:A.y});f.vuln=Math.max(f.vuln||0,1);}
  for(const s of G.ab.spots)if(s.k==='hang'&&s.st==='up'&&Math.hypot(C(s.x)-A.x,C(s.y)-A.y)<R1+30){s.st='fall';s.t=0;}
  const M=G.mis;if(M&&M.drops&&window.MisA&&MisA.drop)for(const d of M.drops)if(d.st==='up'&&Math.hypot(C(d.x)-A.x,C(d.y)-A.y)<R1+30)MisA.drop(d.id);
  G.alert=Math.min(.95,(G.alert||0)+.12);
  return true;
 }
};
function reward(s){
  const r=s.rew||{},got=[];
  if(r.cin){G.cinders=(G.cinders||0)+r.cin;got.push('+'+r.cin+' cinders');for(let i=0;i<Math.min(6,r.cin/5);i++)typeof spawnPick==='function'&&spawnPick('cinder',C(s.x),C(s.y),0);}
  if(r.item&&typeof grantItem==='function'){const it=grantItem(r.item,true);if(it){(G.itemDrops=G.itemDrops||[]).push(it);got.push(it.name);}}
  toast(s.title||'Found',got.join(', ')||'Something, once.','#ffe9a0');try{Aud.S.chest();}catch(e){}
  if(s.say)say(s.say[0],s.say[1]);
}
function burnSpot(s){
  s.done=true;const x=C(s.x),y=C(s.y);
  burst(x,y,26,s.k==='wax'?'#ffe0a0':'#ff9a40',120,.6,3,{add:true});burst(x,y,10,'#5a4a42',60,1,6,{k:'smoke',gr:8});
  reward(s);
}

/* ---------- per frame ---------- */
function step(dt){
  const S=G.ab;if(!S)return;
  for(const k in S.cd)if(S.cd[k]>0)S.cd[k]-=dt;
  if(S.shadeT>0)S.shadeT-=dt;if(S.stepCd>0)S.stepCd-=dt;if(S.flare>0)S.flare-=dt;
  if(S.lant>0){S.lant-=dt;if(S.lant<=0){S.lant=0;S.cd.lantern=DEFS.lantern.cd*cdMul();}}
  // disguise skill: stretch a freshly put-on mask
  if(G.maskT>0&&G.maskT>S.maskT0+1&&tech('disguise'))G.maskT*=1.5;S.maskT0=G.maskT||0;
  const A=G.ash,W=G.wren,gl=S.glide;
  if(gl){
    gl.t+=dt;const k=Math.min(1,gl.t/gl.dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    A.x=gl.ax+(gl.lx-gl.ax)*e;A.y=gl.ay+(gl.ly-gl.ay)*e;A.lift=Math.sin(k*Math.PI)*14;
    if(gl.carry){W.x=A.x;W.y=A.y+2;W.lift=A.lift;}
    if(Math.random()<dt*30)pt(A.x,A.y,0,0,.4,2,'rgba(220,240,255,.6)',{dr:1});
    if(k>=1){S.glide=null;A.lift=0;W.lift=0;
      if(gl.carry){const off=[[0,0],[-14,0],[14,0],[0,-14],[0,14]];for(const [dx,dy] of off)if(!blocked(gl.lx+dx,gl.ly+dy,8)){W.x=gl.lx+dx;W.y=gl.ly+dy;break;}
        if(G.mis){G.mis.safe={x:W.x,y:W.y};G.mis.wx=W.x;G.mis.wy=W.y;}}
      burst(A.x,A.y+6,12,'#a89a88',70,.4,3,{k:'smoke',gr:6});try{Aud.S.land();}catch(e){}
      for(const f of foesNear(A.x,A.y,40))damageFoe(f,1,{noEq:true,stagger:true,sx:A.x,sy:A.y});
      for(const g of guardsNear(A.x,A.y,40)){g.stun=Math.max(g.stun,1.5);floatText(g.x,g.y-22,'FLATTENED','#9fe0ff');}}
  }
  if(S.lant>0){
    const R=120;
    const M=G.mis;
    if(M){for(const p of M.plates||[])if(!p.rev&&Math.hypot(C(p.x)-A.x,C(p.y)-A.y)<R){p.rev=true;floatText(C(p.x),C(p.y)-10,'PLATE','#ffd27a',9);}
      for(const c of M.caches||[])if(!c.seen&&!c.open&&Math.hypot(C(c.x)-A.x,C(c.y)-A.y)<R){c.seen=true;floatText(C(c.x),C(c.y)-14,'SOMETHING HIDDEN','#ffe9a0',9);}
      for(const st of M.stairs||[])if(!st.found&&st.a&&Math.hypot(C(st.a[0])-A.x,C(st.a[1])-A.y)<R&&!st.glint){st.glint=1;floatText(C(st.a[0]),C(st.a[1])-14,'A WORN SLAB','#ffe9a0',9);}}
    for(const s of S.spots)if(s.k==='rune'&&!s.seen&&Math.hypot(C(s.x)-A.x,C(s.y)-A.y)<R){s.seen=true;try{Aud.S.rune();}catch(e){}}
  }
  for(const s of S.spots){
    if(s.k==='rune'&&s.seen&&!s.done){for(const P of [W,A])if((P!==A||A&&G.ash.on)&&Math.hypot(P.x-C(s.x),P.y-C(s.y))<18){s.done=true;burst(C(s.x),C(s.y),20,'#ffd27a',80,.6,2.5,{add:true});reward(s);break;}}
    if(s.k==='hang'&&s.st==='fall'){s.t+=dt;if(s.t>=.45){s.st='down';const x=C(s.x),y=C(s.y);shake(6);try{Aud.S.slam();}catch(e){}
      burst(x,y,16,'#8a7a6a',90,.6,3,{k:'smoke',gr:10});
      for(const g of guardsNear(x,y,1.3*T)){g.stun=Math.max(g.stun,3);G.st.stuns++;floatText(g.x,g.y-22,'CRUSHED','#e08aff');}
      for(const f of foesNear(x,y,1.2*T))damageFoe(f,3,{noEq:true,heavy:true,sx:x,sy:y-40});
      if(typeof lureNear==='function')lureNear(x,y,4*T,true);
      reward(s);s.done=true;}}
  }
}

/* ---------- drawing (world space) ---------- */
function vis(x,y,m){const v=viewRect();m=m||40;return x>v.x-m&&x<v.x+v.w+m&&y>v.y-m&&y<v.y+v.h+m;}
const INK='#120c14';
function drawWorld(c){
  const S=G.ab,t=G.time,A=G.ash,lit=S.lant>0&&G.ash.on;
  for(const s of S.spots){
    if(s.k==='dark'||s.k==='door'&&s.done)continue;
    const x=C(s.x),y=C(s.y);if(!vis(x,y,60))continue;
    if((s.k==='web'||s.k==='vine'||s.k==='wax')&&!s.done)drawWrap(c,s,x,y,t);
    else if(s.k==='rune'&&s.seen&&!s.done)drawRune(c,x,y,t);
    else if(s.k==='door')drawRot(c,x,y);
    else if(s.k==='hang'&&s.st!=='down')drawHang(c,s,x,y,t);
    else if(s.k==='hang')drawWreck(c,x,y);
  }
  // dark rooms: black outside the lantern's reach
  for(const s of S.spots){if(s.k!=='dark')continue;
    const x0=s.x0*T,y0=s.y0*T,w=(s.x1-s.x0+1)*T,h=(s.y1-s.y0+1)*T;if(!vis(x0+w/2,y0+h/2,w))continue;
    c.save();c.beginPath();c.rect(x0,y0,w,h);c.clip();
    c.fillStyle='rgba(4,3,8,.86)';c.beginPath();c.rect(x0,y0,w,h);
    if(lit){c.moveTo(A.x+124,A.y);c.arc(A.x,A.y,124,0,6.2832,true);}
    c.fill('evenodd');
    if(lit){const g=c.createRadialGradient(A.x,A.y,60,A.x,A.y,126);g.addColorStop(0,'rgba(4,3,8,0)');g.addColorStop(1,'rgba(4,3,8,.8)');c.fillStyle=g;c.beginPath();c.arc(A.x,A.y,126,0,6.2832);c.fill();}
    c.restore();}
  if(lit){ // the lantern glow in her throat
    c.save();c.globalCompositeOperation='lighter';const r=10+Math.sin(t*7)*1.5;c.fillStyle='rgba(255,190,90,.35)';c.beginPath();c.arc(A.x,A.y-(A.lift||0),r,0,6.2832);c.fill();c.restore();}
  const gl=S.glide;if(gl&&gl.carry){c.strokeStyle='rgba(30,20,30,.7)';c.lineWidth=1.2;c.beginPath();c.moveTo(A.x,A.y-(A.lift||0));c.lineTo(G.wren.x,G.wren.y-(G.wren.lift||0)-8);c.stroke();}
}
function drawWrap(c,s,x,y,t){
  // the cache itself
  c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(x,y+9,13,4,0,0,6.2832);c.fill();
  c.fillStyle=s.k==='wax'?'#7a5a34':'#5a3e26';c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.rect(x-11,y-6,22,14);c.fill();c.stroke();
  c.fillStyle='#c8983a';c.fillRect(x-2,y-3,4,5);
  if(s.k==='web'){c.strokeStyle='rgba(230,230,240,.75)';c.lineWidth=.7;c.beginPath();
    for(let i=0;i<7;i++){const a=i*.9;c.moveTo(x,y);c.lineTo(x+Math.cos(a)*16,y+Math.sin(a)*13);}
    for(let r=5;r<=15;r+=5){for(let i=0;i<=7;i++){const a=i*.9,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.8;i?c.lineTo(px,py):c.moveTo(px,py);}}c.stroke();}
  else if(s.k==='vine'){c.lineWidth=2.2;c.strokeStyle='#2f5a2a';c.beginPath();
    for(let i=0;i<4;i++){c.moveTo(x-14+i*8,y+9);c.bezierCurveTo(x-8+i*6,y-4,x+4-i*3,y-2,x-10+i*7,y-10);}c.stroke();
    c.fillStyle='#4a8a3a';for(let i=0;i<6;i++){c.beginPath();c.ellipse(x-10+i*4.4,y-6+((i*37)%9),2.6,1.4,i,0,6.2832);c.fill();}}
  else{c.fillStyle='#e8d8a8';c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(x-12,y-7);c.quadraticCurveTo(x,y-11,x+12,y-7);c.lineTo(x+12,y-2);c.quadraticCurveTo(x,y+1,x-12,y-2);c.closePath();c.fill();c.stroke();
    c.fillStyle='#b03a2a';c.beginPath();c.arc(x,y+2,4,0,6.2832);c.fill();c.stroke();c.fillStyle='#e05a3a';c.beginPath();c.arc(x-1,y+1,1.4,0,6.2832);c.fill();}
  if(has('scorch')&&Math.hypot(G.ash.x-x,G.ash.y-y)<110){c.fillStyle='rgba(255,140,60,'+(.5+.3*Math.sin(t*5))+')';c.font='bold 7px serif';c.textAlign='center';c.fillText('SCORCH',x,y-16);}
}
function drawRune(c,x,y,t){
  c.save();c.globalCompositeOperation='lighter';const a=.55+.35*Math.sin(t*3);
  c.strokeStyle='rgba(255,200,100,'+a+')';c.lineWidth=1.6;c.beginPath();c.arc(x,y,10,0,6.2832);
  c.moveTo(x,y-10);c.lineTo(x,y+10);c.moveTo(x-7,y-4);c.lineTo(x+7,y+4);c.moveTo(x+7,y-4);c.lineTo(x-3,y+6);c.stroke();
  c.fillStyle='rgba(255,180,80,'+a*.25+')';c.beginPath();c.arc(x,y,16,0,6.2832);c.fill();c.restore();
}
function drawRot(c,x,y){
  c.strokeStyle='rgba(80,110,60,.7)';c.lineWidth=1;c.beginPath();
  for(let i=0;i<4;i++){c.moveTo(x-10+i*6,y-12);c.lineTo(x-8+i*6,y+12);}c.stroke();
  c.fillStyle='rgba(90,120,70,.45)';c.beginPath();c.ellipse(x-4,y+6,5,3,0,0,6.2832);c.ellipse(x+6,y-6,4,2.4,0,0,6.2832);c.fill();
}
function drawHang(c,s,x,y,t){
  const fall=s.st==='fall'?s.t/.45:0,oy=-26+fall*fall*26,sw=Math.sin(t*1.6+s.x)*2*(1-fall);
  if(s.st==='up'){c.strokeStyle='#3a2e28';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y-60);c.lineTo(x+sw,y+oy-8);c.stroke();}
  c.fillStyle='rgba(0,0,0,'+(.15+.2*fall)+')';c.beginPath();c.ellipse(x,y+8,10+fall*4,3.5,0,0,6.2832);c.fill();
  const cx=x+sw,cy=y+oy;
  c.fillStyle='#4a3a30';c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.moveTo(cx-8,cy-6);c.lineTo(cx+8,cy-6);c.lineTo(cx+9,cy+8);c.lineTo(cx-9,cy+8);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#8a7a60';c.lineWidth=1;c.beginPath();for(let i=-5;i<=5;i+=3.3){c.moveTo(cx+i,cy-6);c.lineTo(cx+i*1.1,cy+8);}c.stroke();
  c.fillStyle='#e8b84a';c.beginPath();c.arc(cx,cy+4,2.2,0,6.2832);c.fill();
  c.strokeStyle=INK;c.beginPath();c.arc(cx,cy-9,3,Math.PI,0);c.stroke();
  if(has('roar')&&s.st==='up'&&Math.hypot(G.ash.x-x,G.ash.y-y)<170){c.fillStyle='rgba(224,138,255,'+(.5+.3*Math.sin(t*5))+')';c.font='bold 7px serif';c.textAlign='center';c.fillText('ROAR',x,y-46);}
}
function drawWreck(c,x,y){
  c.fillStyle='#3a2e28';c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.moveTo(x-11,y+2);c.lineTo(x+4,y-6);c.lineTo(x+12,y+6);c.lineTo(x-6,y+9);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#8a7a60';c.beginPath();c.moveTo(x-6,y+1);c.lineTo(x+6,y+4);c.moveTo(x-2,y-2);c.lineTo(x+2,y+7);c.stroke();
}

/* ---------- HUD slot and touch ring ---------- */
const ICONS={
 glide(c,s){c.beginPath();c.moveTo(-.48*s,.05*s);c.quadraticCurveTo(-.2*s,-.38*s,0,-.05*s);c.quadraticCurveTo(.2*s,-.38*s,.48*s,.05*s);c.quadraticCurveTo(.2*s,-.12*s,0,.12*s);c.quadraticCurveTo(-.2*s,-.12*s,-.48*s,.05*s);c.fill();
   c.beginPath();c.moveTo(-.3*s,.32*s);c.lineTo(.3*s,.32*s);c.stroke();},
 lantern(c,s){c.beginPath();c.moveTo(-.18*s,-.3*s);c.lineTo(.18*s,-.3*s);c.lineTo(.24*s,.3*s);c.lineTo(-.24*s,.3*s);c.closePath();c.stroke();
   c.beginPath();c.moveTo(0,.18*s);c.quadraticCurveTo(-.12*s,0,0,-.16*s);c.quadraticCurveTo(.12*s,0,0,.18*s);c.fill();c.beginPath();c.arc(0,-.38*s,.08*s,0,6.28);c.stroke();},
 scorch(c,s){c.beginPath();c.moveTo(-.45*s,.25*s);c.quadraticCurveTo(0,.05*s,.48*s,-.3*s);c.quadraticCurveTo(.1*s,.32*s,-.45*s,.25*s);c.fill();
   c.beginPath();c.moveTo(-.4*s,-.05*s);c.lineTo(.1*s,-.25*s);c.stroke();},
 roar(c,s){c.beginPath();c.arc(-.22*s,0,.12*s,0,6.28);c.fill();for(const r of [.22,.36,.5]){c.beginPath();c.arc(-.22*s,0,r*s,-.7,.7);c.stroke();}}
};
if(typeof icon==='function'){const oIcon=icon;icon=function(c,name,x,y,s,col,dim){
  if(!ICONS[name])return oIcon.apply(this,arguments);
  c.save();c.translate(x,y);c.globalAlpha=dim?.35:1;c.fillStyle=col;c.strokeStyle=col;c.lineWidth=Math.max(1.5,s*.09);c.lineCap='round';c.lineJoin='round';
  ICONS[name](c,s);c.restore();};}
// called by the HUD's ability slot (hud.js); returns true when it drew the slot
function slot(slotFn,wr){
  const id=selected();if(!id||!G||G.flight||!G.ash.on&&id!=='nova')return false;
  const n=list().length,key=n>1?'E  G':'E';
  if(id==='nova'){slotFn('Nova',key,'nova','#ffd27a',null,!wr&&G.nova.cd<=0,novaPress,true,G.nova.cd>0?G.nova.cd/Math.max(2,6-equipBonus('nova')):0);return true;}
  const S=G.ab||{cd:{}},cd=S.cd[id]>0?S.cd[id]/(DEFS[id].cd*cdMul()):0;
  slotFn(DEFS[id].name,key,id,DEFS[id].col,id==='lantern'&&S.lant>0?Math.ceil(S.lant):null,!wr&&cd<=0,()=>{if(G.active==='ash')use();},true,cd);
  return true;
}
let ring=null;
function touchUi(){
  if(typeof V==='undefined'||!V.coarse){if(ring)ring.style.display='none';return;}
  const act=document.querySelector('#btns [data-act="act"]');if(!act)return;
  const L=list(),sel=selected(),show=mode==='play'&&G&&G.active==='ash'&&!G.flight&&G.ash.on&&!(G.d&&G.d.hub);
  if(show&&sel){const lab=nameOf(sel).split(' ').pop().toUpperCase(),sp=act.querySelector('span');if(sp&&sp.textContent!==lab)sp.textContent=lab;
    const S=G.ab||{cd:{}},dis=sel==='nova'?G.nova.cd>0:(S.cd[sel]>0&&!(sel==='lantern'&&S.lant>0));act.classList.toggle('dis',!!dis);}
  if(!ring){ring=document.createElement('button');ring.type='button';ring.className='abring';ring.setAttribute('aria-label','Next ability');
    ring.style.cssText='position:fixed;z-index:30;width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,233,168,.8);background:radial-gradient(circle at 35% 30%,#5a4a6a,#241a2e);color:#ffe9a8;font:700 15px/30px serif;text-align:center;padding:0;touch-action:none;pointer-events:auto';
    ring.textContent='↻';
    ring.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{Aud.init();}catch(_){}if(mode==='play')cycle();});
}
  if(!ring.isConnected)document.body.appendChild(ring);
  const vis_=show&&L.length>1;ring.style.display=vis_?'':'none';
  if(vis_){const r=act.getBoundingClientRect(),x=Math.round(r.left-22),y=Math.round(r.top-22);
    if(ring._x!==x||ring._y!==y){ring._x=x;ring._y=y;ring.style.left=x+'px';ring.style.top=y+'px';}
    ring.style.borderColor=colOf(sel);}
}

/* ---------- the Rookery perch: choose Ashling's growth ---------- */
function open(){
  const pts=perchPts(),opts=ORDER.filter(id=>!has(id));
  if(typeof G!=='undefined'&&G&&window.NPC&&NPC.openTalk){
    const tree={s:{t:(pts>0?'Ashling is restless: there is growth in her ('+pts+' to choose). ':'Feed her more ember gems; every five wake something new. ')+
      'Learned: '+(ORDER.filter(has).map(id=>DEFS[id].name).join(', ')||'nothing yet')+'.',
      c:opts.map(id=>({l:(pts>0?'Teach her '+DEFS[id].name:DEFS[id].name+' (needs more gems)'),to:pts>0?'l_'+id:'d_'+id,fx:pts>0?{fn:()=>teach(id)}:undefined})).concat([{l:'Leave',end:1}])}};
    for(const id of opts){tree['l_'+id]={t:DEFS[id].desc+' She tries it at once, and the rafters agree it worked.',c:[{l:'Back',to:'s'},{l:'Leave',end:1}]};tree['d_'+id]={t:DEFS[id].desc+' ('+DEFS[id].src+')',c:[{l:'Back',to:'s'}]};}
    try{NPC.openTalk({id:'_abperch',name:"Ashling's Perch",role:'Growth',look:{},tree,px:G.wren.x,py:G.wren.y,face:0,ph:0,fade:1});return true;}catch(e){console.error(e);}
  }
  return false;
}

/* ---------- wiring ---------- */
function wrap(name,fn){const o=window[name];if(typeof o==='function')window[name]=fn(o);}
const oNova=window.novaPress;
wrap('novaPress',o=>function(){
  if(G&&G.active==='ash'&&!G.flight&&G.ab){
    if(G.mis&&window.MisA&&MisA.target&&MisA.target(G.ash,'ash'))return o();
    const s=selected();if(s&&s!=='nova')return use(s);
  }
  return o();
});
wrap('playPress',o=>function(k){if(k==='g'){if(G&&!G.flight)cycle();return;}return o(k);});
wrap('loadLevel',o=>function(i){const g=o(i);try{initLevel(g,i);}catch(e){console.error(e);g.ab={cd:{},spots:[],lant:0};}return g;});
wrap('update',o=>function(dt){
  o(dt);
  if(!G||mode!=='play'||G.cine||G.talk)return;
  if(!G.ab)G.ab={cd:{},lant:0,glide:null,flare:0,spots:[],shadeT:0,stepCd:0,maskT0:0,said:{}};
  try{step(dt);}catch(e){console.error(e);}
});
wrap('drawRings',o=>function(){o();if(!G||!G.ab)return;ctx.save();try{drawWorld(ctx);}catch(e){console.error(e);}ctx.restore();});
wrap('lightAt',o=>function(x,y){let m=o(x,y);const S=G&&G.ab;
  if(S&&S.lant>0&&G.ash.on){const A=G.ash,d=Math.hypot(A.x-x,A.y-y);if(d<120){const v=Math.min(1,(1-d/120)*1.1);if(v>m&&(d<14||los(A.x,A.y,x,y)))m=v;}}return m;});
wrap('collectLights',o=>function(){const L=o();const S=G&&G.ab;
  if(S&&S.lant>0&&G.ash.on&&Array.isArray(L))L.push({x:G.ash.x,y:G.ash.y-4,r:120+Math.sin(G.time*8)*4,a:.85,col:'255,190,100',gl:.6});return L;});
wrap('equipBonus',o=>function(key){let v=o(key);const S=typeof G!=='undefined'&&G&&G.ab;
  if(S&&S.shadeT>0&&key==='shade')v+=.45;
  if(key==='sneak'&&S&&tech('disguise')&&G.mis&&G.mis.dis&&G.mis.dis.on)v+=.04;
  return v;});
// Shiloh: silent dash and shadow-step ride on the roll
wrap('rollPress',o=>function(){
  const W=G&&G.wren;if(!W||G.active!=='wren'||G.roll.cd>0||G.roll.t>0||G.cine||!G.ab)return o();
  if(G.sneak&&tech('shadow')&&!(G.ab.stepCd>0)&&lightAt(W.x,W.y)<.3){
    const a=W.face;let land=null;
    for(let d=96;d>=40;d-=8){const x=W.x+Math.cos(a)*d,y=W.y+Math.sin(a)*d;
      let clear=true;for(let k=8;k<=d;k+=8)if(solidTile(Math.floor((W.x+Math.cos(a)*k)/T),Math.floor((W.y+Math.sin(a)*k)/T))){clear=false;break;}
      if(clear&&!blocked(x,y,8)&&lightAt(x,y)<.35){land={x,y};break;}}
    if(land){burst(W.x,W.y,12,'#3a2e52',60,.5,4,{k:'smoke',gr:6});W.x=land.x;W.y=land.y;burst(W.x,W.y,10,'#3a2e52',50,.5,4,{k:'smoke',gr:6});
      G.ab.stepCd=3;G.ab.shadeT=.8;G.roll.cd=Math.max(.4,.85-equipBonus('rollCd'));try{Aud.S.shadow();}catch(e){}
      if(!G.ab.said.shadow){G.ab.said.shadow=1;floatText(W.x,W.y-26,'SHADOW-STEP','#b9a6f0',10);}return;}
  }
  const r=o();
  if(G.sneak&&tech('silent')&&G.roll.t>0){G.ab.shadeT=Math.max(G.ab.shadeT,.6);}
  return r;
});

window.Abilities={DEFS,ORDER,SPOTS,TECHS,has,unlock,use,list,selected,cycle,teach,perchPts,open,openMenu:open,show:open,slot,techs,tech,nameOf,
  ready,step,touchUi,get state(){return G&&G.ab;}};
// touch: keep the ACT label and the ring button in step with the selection
setInterval(()=>{try{touchUi();}catch(e){}},150);
})();
