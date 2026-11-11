'use strict';
/* EMBERCROWN - mission mechanics A: Ashfall Keep, Gallowmere, the Drowned Spire, Thornwick Abbey.
   Everything is data in LEVELS[i].mech (js/data.js). This file wraps a few engine functions (loadLevel, update, findTarget,
   completeTarget, solidTile, blocked, los, lightAt, novaPress, collectLights, drawPots, drawRings, drawHud) and never edits
   them: a level without a mech table plays exactly as before.
   mech keys (tile coordinates):
    gates   [{id,x,y,open,label}]          portcullis: solid and sight-blocking while down
    levers  [{id,x,y,by:'wren'|'ash'|'any',label,fx,hold,once,need}]   hold: stays pulled only while Shiloh stands at it
    plates  [{x,y,kind:'dart'|'rattle'|'alarm',hidden}]  Shiloh's weight trips them (a rattle plate not while sneaking); Ashling is too light
    rot     {tiles:[[x,y]],to:[x,y]}        rotten boards: break under a hurrying Shiloh; with `to` she drops there, else she falls and is hurt
    pits    [{id,tiles}]                    chasm: Shiloh and guards cannot cross, Ashling flies over; fx {bridge:id} lays planks
    ducts   [{id,tiles,need}]               drains and grates in the wall that only Ashling can crawl (need: a held lever)
    stairs  [{id,a,b,label,hidden}]         hatches and stairs: hold E to take both characters to the other end
    drops   [{id,x,y,r,rope}]               chandeliers: fx {drop:id} or burn the rope anchor; stuns below, very loud
    steam   [{id,x,y,per,on,ph}]            vents that hide you in steam on a cycle and scald Shiloh
    oil     [{x,y,w,h}]                     lamp oil: Ashling's fire ignites it; burning oil stuns guards who walk in
    disguise{at,steward,doors,uses}         servant livery (see stepDis)
    bells   {list:[[x,y,n]],seq,fx}         bell-sequence puzzle
    caches  [{id,x,y,label,kind,rew,secret,hidden,chal}]   reward containers
    challenge {id,name,zone,goal,time,rings,rew}
    air     {drakes,ballistae,wind,gulls,fog}  flight encounters
    guards  [{wp,kind,name}] extra guards    events {O:fx,...} fx when an objective is completed
    notes   [{x,y,title,text}]              carved hints (hold E to read)    keep [[x0,y0,x1,y1]] rooms kept clear of furniture */
(function(){
const K=(x,y)=>x+y*256;
const C=v=>v*T+16;
const INK='#120c14';
let M=null; // G.mis of the running level

/* ---------------- setup ---------------- */
function mkGuard(wp,kind){
  const KD={hound:{spd:1.35,kr:.7,half:1.0},archer:{spd:.9,kr:1.45,half:.34},brute:{spd:.85,kr:1,half:.55}}[kind]||{spd:1,kr:1,half:.62};
  const p=wp.map(q=>[C(q[0]),C(q[1])]);
  return{x:p[0][0],y:p[0][1],wp:p,i:p.length>1?1:0,face:p.length>1?Math.atan2(p[1][1]-p[0][1],p[1][0]-p[0][0]):0,stun:0,pause:0,lure:null,back:null,ret:false,seeing:false,
    spd:56*KD.spd,rm:1,kind:kind||'guard',kr:KD.kr,half:KD.half,ph:Math.random()*6,was:false,seen:null,bang:0,quest:0};
}
function init(g){
  g.mis=null;const m=g.d&&g.d.mech;if(!m)return;
  const s={m,t:0,gates:{},levers:[],plates:[],rot:[],pitT:new Map(),pitSet:new Set(),ashPass:new Set(),ducts:[],stairs:[],drops:[],steam:[],oil:[],caches:[],
    notes:[],dis:null,bells:null,ch:null,air:null,ahold:0,aT:null,wx:g.wren.x,wy:g.wren.y,wsp:0,safe:{x:g.wren.x,y:g.wren.y},gateSolid:new Set(),said:{},flash:[]};
  for(const q of m.gates||[])s.gates[q.id]=Object.assign({},q,{open:!!q.open,anim:q.open?1:0});
  s.levers=(m.levers||[]).map(q=>Object.assign({by:'wren',need:.7},q,{on:false,used:false,rel:0}));
  s.plates=(m.plates||[]).map(q=>Object.assign({},q,{armed:true,on:false,rev:!q.hidden,cd:0}));
  if(m.rot)s.rot=m.rot.tiles.map(([x,y])=>({x,y,st:0,t:0}));
  for(const p of m.pits||[]){const P={id:p.id,tiles:p.tiles.map(a=>a.slice()),bridged:[]};s.pitT.set(p.id,P);for(const [x,y] of p.tiles)s.pitSet.add(K(x,y));}
  s.ducts=(m.ducts||[]).map(q=>({id:q.id,tiles:q.tiles,need:q.need||null}));
  s.stairs=(m.stairs||[]).map(q=>Object.assign({},q,{found:!q.hidden}));
  s.drops=(m.drops||[]).map(q=>Object.assign({r:2.2},q,{st:'up',t:0,p:0}));
  s.steam=(m.steam||[]).map((q,k)=>Object.assign({per:6,on:2.4,ph:k*1.7},q,{live:false,puff:0,off:false}));
  s.oil=(m.oil||[]).map(q=>Object.assign({},q,{st:'wet',t:0,hit:new Set()}));
  s.caches=(m.caches||[]).map(q=>Object.assign({kind:'chest',need:1},q,{open:false,seen:!q.hidden}));
  s.notes=(m.notes||[]).map(q=>Object.assign({},q,{read:false}));
  for(const c of s.caches)if(c.secret)g.secretsTotal++;
  for(const st of s.stairs)if(st.secret)g.secretsTotal++;
  if(m.disguise){const D=m.disguise;s.dis={at:D.at,on:false,uses:D.uses||2,run:0,blown:0,doors:(D.doors||[]).map(([x,y])=>({x,y,open:false,t:0})),steward:null};
    if(D.steward!=null){const w=g.d.guards[D.steward];if(w){const sg=g.guards.find(q=>q.wp[0][0]===C(w[0][0])&&q.wp[0][1]===C(w[0][1]));if(sg){sg.steward=true;s.dis.steward=sg;}}}}
  if(m.bells)s.bells={list:m.bells.list.map(([x,y,n])=>({x,y,n,ring:0})),seq:m.bells.seq,p:0,solved:false,fx:m.bells.fx};
  if(m.challenge)s.ch=Object.assign({},m.challenge,{st:'idle',t:0,ri:0});
  for(const q of m.guards||[]){const gd=mkGuard(q.wp,q.kind);if(q.name)gd.mname=q.name;g.guards.push(gd);}
  if(m.air){const A=m.air;s.air={
    drakes:(A.drakes||[]).map(d=>({x:C(d.wp[0][0]),y:C(d.wp[0][1]),wp:d.wp.map(p=>[C(p[0]),C(p[1])]),i:1,face:0,st:'patrol',hp:1.3,cd:1.5,tele:0,see:0,lost:0,stun:0,ph:Math.random()*6,fall:0,last:null})),
    ball:(A.ballistae||[]).map(b=>({x:C(b[0]),y:C(b[1]),base:b[2],a:b[2],cd:2,tele:0,stun:0,burn:0,see:0})),
    wind:(A.wind||[]).map(w=>({x:w[0]*T,y:w[1]*T,w:w[2]*T,h:w[3]*T,vx:w[4],vy:w[5]})),
    gulls:(A.gulls||[]).map(([x,y])=>({x:C(x),y:C(y),st:'sit',t:0,birds:[0,1,2,3,4].map(k=>({ox:Math.cos(k*1.3)*10,oy:Math.sin(k*2.1)*7,ph:k}))})),
    fog:(A.fog||[]).map(([x,y,r])=>({x:C(x),y:C(y),r:r*T})),
    shots:[]};}
  // rooms we use stay clear of furniture: drop any prop on or next to a mechanism, then rebuild the blocking set
  const prot=new Set(),mark=(x,y,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)prot.add(K(x+i,y+j));};
  for(const [x0,y0,x1,y1] of m.keep||[])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)prot.add(K(x,y));
  for(const q of [...(m.gates||[]),...(m.levers||[]),...(m.caches||[]),...(m.notes||[])])mark(q.x,q.y,1);
  for(const q of [...(m.plates||[]),...(m.steam||[])])mark(q.x,q.y,0);
  for(const st of m.stairs||[]){mark(st.a[0],st.a[1],1);mark(st.b[0],st.b[1],1);}
  if(m.rot)for(const [x,y] of m.rot.tiles)mark(x,y,1);
  for(const p of m.pits||[])for(const [x,y] of p.tiles)mark(x,y,1);
  for(const o of m.oil||[])for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)mark(x,y,0);
  for(const d of m.ducts||[])for(const [x,y] of d.tiles)mark(x,y,1);
  if(m.disguise){mark(m.disguise.at[0],m.disguise.at[1],1);for(const [x,y] of m.disguise.doors||[])mark(x,y,1);}
  if(m.bells)for(const [x,y] of m.bells.list)mark(x,y,1);
  for(const q of m.guards||[])for(const [x,y] of q.wp)mark(x,y,0);
  if(g.props&&g.props.length){
    g.props=g.props.filter(p=>{for(let j=0;j<p.h;j++)for(let i=0;i<p.w;i++)if(prot.has(K(p.x+i,p.y+j)))return false;return true;});
    g.pblock=new Set();for(const p of g.props)for(let j=0;j<p.h;j++)for(let i=0;i<p.w;i++)g.pblock.add(K(p.x+i,p.y+j));
    if(g.pots)g.pots=g.pots.filter(p=>!prot.has(K(p.x,p.y)));
  }
  g.mis=s;
  refreshSolid(s);
}
function refreshSolid(s){
  s.gateSolid=new Set();
  for(const id in s.gates){const q=s.gates[id];if(!q.open)s.gateSolid.add(K(q.x,q.y));}
  if(s.dis)for(const d of s.dis.doors)if(!d.open)s.gateSolid.add(K(d.x,d.y));
  s.ashPass=new Set();
  for(const d of s.ducts){if(d.need){const lv=s.levers.find(l=>l.id===d.need);if(!lv||!lv.on)continue;}for(const [x,y] of d.tiles)s.ashPass.add(K(x,y));}
  s.holes=new Set();for(const r of s.rot)if(r.st===2)s.holes.add(K(r.x,r.y));
}

/* ---------------- engine wrappers ---------------- */
const oLoad=loadLevel;
loadLevel=function(i){const g=oLoad(i);try{if(typeof i==='number')init(g);}catch(e){console.error(e);g.mis=null;}return g;};
const oSolid=solidTile;
solidTile=function(tx,ty){if(oSolid(tx,ty))return true;const s=G&&G.mis;return !!(s&&s.gateSolid.size&&s.gateSolid.has(K(tx,ty)));};
const oBlocked=blocked;
blocked=function(x,y,r){
  const s=G&&G.mis;if(!s)return oBlocked(x,y,r);
  const ash=r===10&&G.active==='ash';
  if(ash?!s.ashPass.size:!s.pitSet.size)return oBlocked(x,y,r);
  const cs=[[Math.floor((x-r)/T),Math.floor((y-r)/T)],[Math.floor((x+r)/T),Math.floor((y-r)/T)],[Math.floor((x-r)/T),Math.floor((y+r)/T)],[Math.floor((x+r)/T),Math.floor((y+r)/T)]];
  if(ash&&s.ashPass.size){
    for(const [tx,ty] of cs){const k=K(tx,ty);if(s.ashPass.has(k))continue;if(propTile(tx,ty)||solidTile(tx,ty))return true;}
    return false;
  }
  if(oBlocked(x,y,r))return true;
  if(!ash&&s.pitSet.size)for(const [tx,ty] of cs)if(s.pitSet.has(K(tx,ty)))return true;
  return false;
};
const oLos=los;
los=function(x1,y1,x2,y2){
  const s=G&&G.mis;
  if(s){
    if(s.dis&&s.dis.on&&x2===G.wren.x&&y2===G.wren.y){
      for(const g of G.guards)if(g.x===x1&&g.y===y1){if(!(g.steward||g.kind==='hound'||s.dis.run>.25))return false;break;}
    }
    if(s.air&&s.air.fog.length){for(const f of s.air.fog)if(Math.hypot(x2-f.x,y2-f.y)<f.r&&Math.hypot(x2-x1,y2-y1)>1.6*T)return false;}
  }
  return oLos(x1,y1,x2,y2);
};
const oLight=lightAt;
lightAt=function(x,y){let m=oLight(x,y);const s=G&&G.mis;if(s)for(const o of s.oil)if(o.st==='burn'){const cx=(o.x+o.w/2)*T,cy=(o.y+o.h/2)*T,d=Math.hypot(cx-x,cy-y),r=(Math.max(o.w,o.h)/2+2.4)*T;if(d<r)m=Math.max(m,Math.min(1,(1-d/r)*1.2));}return m;};
const oFind=findTarget;
findTarget=function(A){
  let t=oFind(A);const s=G&&G.mis;if(!s)return t;
  const who=A===G.wren?'wren':'ash',bd=t?Math.hypot(t.x-A.x,t.y-A.y)-4:1e9;
  const mt=mechTarget(A,who);
  if(mt&&(!t||mt.d<bd))return mt;
  return t;
};
const oComplete=completeTarget;
completeTarget=function(t){
  M=G&&G.mis;if(t&&t.kind==='mech'){activate(t);return;}
  const s=G&&G.mis;
  if(s&&s.dis&&s.dis.on&&t&&t.kind==='item'&&seenBy(G.wren))blow('Caught in the act.');
  oComplete(t);
  if(s&&t&&t.kind==='item'&&s.m.events&&s.m.events[t.ref.type])applyFx(s.m.events[t.ref.type],t.ref);
};
if(typeof novaPress==='function'){const oNova=novaPress;novaPress=function(){const s=M=G&&G.mis;if(s&&G.active==='ash'&&!G.flight&&mechTarget(G.ash,'ash')){touch.act=true;s.novaBlock=true;return;}return oNova();};}
const oUpdate=update;
update=function(dt){
  // in these missions the two work apart: the idle partner stays where it was left instead of being yanked along by the tether
  const s0=G&&G.mis,P=s0&&G.ash&&G.ash.on&&!G.flight?(G.active==='wren'?G.ash:G.wren):null,px=P&&P.x,py=P&&P.y;
  oUpdate(dt);
  if(P&&G.mis===s0&&Math.hypot(P.x-px,P.y-py)>5*T&&!s0.moved){P.x=px;P.y=py;G.rings=G.rings.filter(r=>!(r.c==='180,120,255'&&r.t>.38));}
  if(s0)s0.moved=false;
  const s=G&&G.mis;
  if(!s||mode!=='play'||G.cine||G.talk)return;
  M=s;try{step(dt);}catch(e){console.error(e);}
};

/* ---------------- helpers ---------------- */
function near(a,x,y,r){return Math.hypot(a.x-x,a.y-y)<r;}
function onTile(a,x,y,pad){return Math.abs(a.x-C(x))<(pad||12)&&Math.abs(a.y-C(y))<(pad||12);}
function tileOf(a){return[Math.floor(a.x/T),Math.floor(a.y/T)];}
function inFire(x,y,pad){
  if(!G.fireOn)return false;const a=G.ash,dx=x-a.x,dy=y-a.y,r=G.fireRange||80;
  return Math.hypot(dx,dy)<r+(pad||0)&&angDiff(Math.atan2(dy,dx),a.face)<.62&&oLos(a.x,a.y,x,y);
}
function seenBy(t){ // is this character inside any awake guard's cone right now (ignoring the livery)
  for(const g of G.guards){
    if(g.stun>0||g.eng||g.spin||g.dead)continue;
    const dx=t.x-g.x,dy=t.y-g.y,d=Math.hypot(dx,dy),R=5.2*T*G.rangeMul*(g.rm||1)*(g.kr||1);
    if(d<R&&(d<T*.9||angDiff(Math.atan2(dy,dx),g.face)<(g.half||.62))&&oLos(g.x,g.y,t.x,t.y))return g;
  }
  return null;
}
function grace(){return G.grace>0?0:G.graceRamp>0?1-G.graceRamp/1.6:1;}
function setGate(id,open){
  for(const one of [].concat(id)){const q=M.gates[one];if(!q||q.open===open||(!open&&q.pinned))continue;q.open=open;
    Aud.S.gate&&Aud.S.gate();shake(3);burst(C(q.x),C(q.y),10,'#9a8f84',60,.7,3,{k:'smoke',gr:5});
    if(!open)for(const c of [G.wren,G.ash,...G.guards])if(c&&tileOf(c)[0]===q.x&&tileOf(c)[1]===q.y)nudge(c);}
  refreshSolid(M);
}
function nudge(c){ // a closing gate pushes whoever stands under it to the nearest open side
  const [tx,ty]=tileOf(c);
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]){const nx=C(tx+dx),ny=C(ty+dy);if(!oBlocked(nx,ny,8)&&!M.pitSet.has(K(tx+dx,ty+dy))){c.x=nx;c.y=ny;return;}}
}
function applyFx(f,src){
  if(!f)return;
  if(f.open)setGate(f.open,true);
  if(f.close)setGate(f.close,false);
  if(f.pin)for(const id of [].concat(f.pin)){const q=M.gates[id];if(q){setGate(id,true);q.pinned=true;}}
  if(f.toggle)for(const id of [].concat(f.toggle))setGate(id,!M.gates[id].open);
  if(f.drop)dropChand(f.drop);
  if(f.bridge)bridge(f.bridge);
  if(f.reveal)for(const id of [].concat(f.reveal)){const st=M.stairs.find(q=>q.id===id);if(st)st.found=true;const c=M.caches.find(q=>q.id===id);if(c)c.seen=true;}
  if(f.steamOff)for(const v of M.steam)if(!f.steamOff.length||f.steamOff.includes(v.id))v.off=true;
  if(f.toast)toast(f.toast[0],f.toast[1]||'',f.toast[2]);
  if(f.say)say(f.say[0],f.say[1]);
  if(f.say2)say(f.say2[0],f.say2[1],2.8);
  if(f.noise&&src)lureNear(src.x,src.y,f.noise*T,true);
  refreshSolid(M);
}
function reward(r,x,y){
  if(!r)return;const parts=[];
  if(r.cin){const v=cinderValue(r.cin);G.cinders+=v;floatText(x,y-16,'+'+v+' cinders','#ffd27a',11);parts.push(v+' cinders');}
  if(r.item){let ok=false;try{ok=typeof grantItem==='function'?!!grantItem(r.item):!!(window.giveItem&&window.giveItem(r.item));}catch(e){}
    if(!ok){const v=cinderValue(60);G.cinders+=v;parts.push(v+' cinders');}}
  if(r.gad)for(const k in r.gad){G.gad[k]=(G.gad[k]||0)+r.gad[k];parts.push('+'+r.gad[k]+' '+k);}
  if(r.hp){G.hp=Math.min(G.maxHp,G.hp+r.hp);parts.push('+'+r.hp+' heart');}
  return parts.join(', ');
}

/* ---------------- interaction targets ---------------- */
function mechTarget(A,who){
  const s=M=G.mis;let best=null,bd=1e9;
  const offer=(ref,x,y,r,label,need,extra)=>{const d=Math.hypot(x-A.x,y-A.y);if(d<r&&d<bd){bd=d;best=Object.assign({kind:'mech',ref,x,y,label,need:need*(who==='wren'?quickMul():1),d},extra||{});}};
  const can=by=>by==='any'||by===who;
  for(const l of s.levers){if(l.once&&l.used&&!l.hold)continue;if(l.on&&l.hold)continue;if(!can(l.by))continue;offer(l,C(l.x),C(l.y),38,l.label||'Pull the lever',l.need,{mk:'lever'});}
  if(who==='wren'||G.flight){
    for(const c of s.caches){if(c.open||!c.seen)continue;if(G.flight!==(c.by==='ash'))continue;offer(c,C(c.x),C(c.y),36,c.label||'Open',c.need,{mk:'cache'});}
  }
  if(who==='wren'){
    for(const st of s.stairs){
      if(!st.found&&!st.hidden)continue;
      for(const [end,o] of [[st.a,st.b],[st.b,st.a]]){
        const near_=Math.hypot(C(end[0])-A.x,C(end[1])-A.y)<(st.found?36:30);if(!near_)continue;
        if(!st.found){if(Math.hypot(C(end[0])-A.x,C(end[1])-A.y)<30)offer(st,C(end[0]),C(end[1]),30,st.findLabel||'Shift the slab',1.3,{mk:'find'});}
        else offer(st,C(end[0]),C(end[1]),36,(end===st.a?st.label:st.labelB)||st.label||'Take the stairs',.5,{mk:'stairs',to:o});
      }
    }
    if(s.dis){
      const D=s.dis,[x,y]=D.at;
      if(!D.on&&D.uses>0)offer(D,C(x),C(y),36,'Put on the livery',1.0,{mk:'livery'});
      if(D.on)for(const d of D.doors)if(!d.open)offer(d,C(d.x),C(d.y),40,"Servants' door",.35,{mk:'sdoor'});
    }
    if(s.bells&&!s.bells.solved)for(const b of s.bells.list)offer(b,C(b.x),C(b.y),34,'Ring bell '+['','I','II','III','IV','V'][b.n],.3,{mk:'bell'});
    for(const n of s.notes)offer(n,C(n.x),C(n.y),34,n.read?'Read again':'Read',.5,{mk:'note'});
  }
  return best;
}
function activate(t){
  const r=t.ref;
  if(t.mk==='lever'){
    r.on=true;r.used=true;r.rel=0;Aud.S.unlock&&Aud.S.unlock();
    burst(C(r.x),C(r.y),8,'#c9a06a',40,.5,2,{k:'smoke',gr:3});
    applyFx(r.fx,{x:C(r.x),y:C(r.y)});
    if(r.hold&&!M.said['hold'+r.id]){M.said['hold'+r.id]=1;say('Shiloh',r.holdSay||'I will hold it. Swap to Ashling. Go.');}
    refreshSolid(M);
  } else if(t.mk==='cache'){
    if(r.chal&&M.ch&&M.ch.st!=='run'&&M.ch.st!=='done'){say('Shiloh',M.ch.st==='fail'?'Sealed. Leave the room and try the run again.':'Locked by the trial. Start it properly.');return;}
    r.open=true;Aud.S.chest?Aud.S.chest():Aud.S.cache();burst(C(r.x),C(r.y),26,'#ffd27a',110,.9,2.5,{add:true,g:40});
    const got=reward(r.rew,C(r.x),C(r.y));
    if(r.secret){G.secretsFound++;toast(r.title||'Secret found',got,'#ffe9a0');}else toast(r.title||'Found',got,'#ffd27a');
    if(r.say)say(r.say[0],r.say[1]);
    if(r.chal&&M.ch&&M.ch.st==='run')finishChal();
  } else if(t.mk==='find'){
    r.found=true;Aud.S.crack();shake(3);burst(t.x,t.y,16,'#9a8f84',70,.9,4,{k:'smoke',gr:6});
    if(r.secret){G.secretsFound++;toast(r.title||'Hidden way',r.sub||'Stairs lead down into the dark.','#ffe9a0');}
    if(r.findSay)say(r.findSay[0],r.findSay[1]);
  } else if(t.mk==='stairs'){
    travel(t.to,r);
  } else if(t.mk==='livery'){
    r.on=true;r.uses--;r.run=0;Aud.S.swap();burst(G.wren.x,G.wren.y,14,'#e8c060',50,.6,2,{add:true});
    toast('Servant livery','Walk (hold SNEAK) and nobody looks twice. Running, the steward or Ashling at your side give you away.','#e8c060');
    if(!M.said.liv){M.said.liv=1;say('Shiloh','Red and gold. Every servant here is invisible. Let us see if I am.');say('Ashling','I will be... elsewhere. Dragons do not come in livery.',3);}
  } else if(t.mk==='sdoor'){
    r.open=true;r.t=4;Aud.S.open();refreshSolid(M);
  } else if(t.mk==='bell'){
    ringBell(r);
  } else if(t.mk==='note'){
    r.read=true;G.loreCard={title:r.title,text:r.text,t:7,t0:7};Aud.S.scroll&&Aud.S.scroll();
  }
}
function travel(to,st){
  const W=G.wren,A=G.ash,x=C(to[0]),y=C(to[1]);
  burst(W.x,W.y,12,'#6a5a50',40,.6,3,{k:'smoke',gr:4});
  W.x=x;W.y=y;W.kx=W.ky=0;
  if(A.on&&!G.flight){
    const sp=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]];A.x=x;A.y=y;
    for(const [dx,dy] of sp)if(!oBlocked(x+dx*T,y+dy*T,10)&&!M.pitSet.has(K(to[0]+dx,to[1]+dy))){A.x=x+dx*T;A.y=y+dy*T;break;}
    A.kx=A.ky=0;
  }
  G.flash={t:.35,c:'10,8,14'};Aud.S.step&&Aud.S.step(true);
  if(typeof camUpdate==='function')camUpdate(0,true);
  if(st&&st.say&&!st.saidT){st.saidT=1;say(st.say[0],st.say[1]);}
}
function ringBell(b){
  const B=M.bells;b.ring=1;Aud.S.bell();G.rings.push({x:C(b.x),y:C(b.y),t:.7,r:90,c:'240,200,120'});
  lureNear(C(b.x),C(b.y),4*T,true);
  if(b.n===B.seq[B.p]){B.p++;floatText(C(b.x),C(b.y)-20,['','I','II','III','IV','V'][b.n],'#ffe0a0',13);
    if(B.p>=B.seq.length){B.solved=true;Aud.S.relic();G.rings.push({x:C(b.x),y:C(b.y),t:1.2,r:180,c:'200,220,255'});
      toast('The bells agree','Somewhere close, a gate rises.','#bfe0ff');applyFx(B.fx,{x:C(b.x),y:C(b.y)});}
  } else {
    B.p=0;Aud.S.toll&&Aud.S.toll();shake(5);G.rings.push({x:C(b.x),y:C(b.y),t:1,r:240,c:'255,120,80'});
    lureNear(C(b.x),C(b.y),8*T,true);G.alert=Math.min(.95,G.alert+.1*grace());
    toast('Discord','Wrong bell. The sequence starts over, and the dead are listening.','#ff8a6a');
  }
}
function dropChand(id){
  const d=M.drops.find(q=>q.id===id);if(!d||d.st!=='up')return;
  d.st='fall';d.t=.5;Aud.S.crack();
  say('Ashling','Look out below. Or do not. Your choice, guards.');
}
function bridge(id){
  const P=M.pitT.get(id);if(!P)return;const m=M.m.pits.find(p=>p.id===id);
  for(const [x,y] of m.bridge||[]){M.pitSet.delete(K(x,y));P.bridged.push([x,y]);}
  Aud.S.gate&&Aud.S.gate();shake(4);toast('Bridge down','Planks drop across the chasm.','#ffd27a');
}
function blow(why){
  const D=M.dis;if(!D||!D.on)return;D.on=false;D.run=0;
  toast('Disguise blown',why,'#ff7a5a');Aud.S.alert();
  G.alert=Math.min(.95,G.alert+.22*grace());
  burst(G.wren.x,G.wren.y,16,'#c0303a',70,.6,2.5,{add:false});
  const g=seenBy(G.wren);if(g){g.say={t:1.6,x:'Not one of ours!'};g.bang=1;}
}

/* ---------------- per-frame ---------------- */
function step(dt){
  const s=M;s.t+=dt;
  const W=G.wren;s.wsp=Math.hypot(W.x-s.wx,W.y-s.wy)/Math.max(dt,1e-4);s.wx=W.x;s.wy=W.y;
  const hurry=G.active==='wren'&&!G.sneak&&s.wsp>66&&s.wsp<200;
  // levers that must be held
  for(const l of s.levers){
    if(!l.hold||!l.on)continue;
    if(Math.hypot(W.x-C(l.x),W.y-C(l.y))>1.3*T){l.rel+=dt;if(l.rel>.35){l.on=false;l.rel=0;
      const f=l.fx||{};if(f.open)setGate(f.open,false);if(f.close)setGate(f.close,true);
      refreshSolid(s);ejectAsh();toast('Released',l.relText||'Shiloh let go. It drops shut.','#c9b8a0');}}
    else l.rel=0;
  }
  // pressure plates (Shiloh's weight)
  for(const p of s.plates){
    p.cd=Math.max(0,p.cd-dt);
    if(!p.rev&&inFire(C(p.x),C(p.y),12)){p.rev=true;burst(C(p.x),C(p.y),8,'#ff6040',30,.6,2,{add:true});if(!s.said.rev){s.said.rev=1;say('Ashling','That plate glows. The scorched ones are wired to something.');}}
    const on=!W.hidden&&onTile(W,p.x,p.y,11);
    if(on&&!p.on&&p.cd<=0&&!(p.kind==='rattle'&&G.sneak&&G.active==='wren'))tripPlate(p);
    p.on=on;
  }
  // rotten boards
  for(const r of s.rot){
    if(r.st===2){if(s.m.rot.to&&onTile(W,r.x,r.y,9))fall(true);continue;}
    if(onTile(W,r.x,r.y,13)&&hurry){r.t+=dt;if(r.st===0){r.st=1;Aud.S.crack();burst(C(r.x),C(r.y),5,'#7a5a3a',30,.4,2,{k:'smoke',gr:2});}
      if(r.t>.28){r.st=2;refreshSolid(s);burst(C(r.x),C(r.y),18,'#6a4a2a',90,.8,3,{k:'smoke',gr:6});shake(4);
        if(s.m.rot.to)fall(true);else{s.pitSet.add(K(r.x,r.y));fall(false);}}}
    else if(r.st===1&&!onTile(W,r.x,r.y,13))r.t=Math.max(0,r.t-dt*.3);
  }
  // remember a safe place to put Shiloh back after a fall
  {const [tx,ty]=tileOf(W);if(!s.pitSet.has(K(tx,ty))&&!s.rot.some(r=>r.st>0&&r.x===tx&&r.y===ty)&&!oBlocked(W.x,W.y,8))s.safe={x:W.x,y:W.y};}
  // steam
  for(const v of s.steam){
    const c=(s.t+v.ph)%v.per,was=v.live;v.live=!v.off&&c<v.on;v.warn=!v.off&&c>v.per-.7;
    if(v.live){v.puff-=dt;if(v.puff<=0){v.puff=.35;G.smoke.push({x:C(v.x)+(Math.random()-.5)*10,y:C(v.y)-6,r:44,t:1.1,t0:1.1,steam:true});}
      if(!was)Aud.S.smoke&&Aud.S.smoke();
      if(Math.random()<dt*20)pt(C(v.x)+(Math.random()-.5)*14,C(v.y),(Math.random()-.5)*16,-40-Math.random()*30,.8,4+Math.random()*4,'rgba(230,236,245,.5)',{k:'smoke',gr:8});
      if(G.active==='wren'||true){if(!W.hidden&&near(W,C(v.x),C(v.y),15)){G.alert+=1.1*dt*grace();if(!s.said.steam){s.said.steam=1;say('Shiloh','Scalding. The steam hides me, the vent does not.');}}}
    } else if(v.warn&&Math.random()<dt*8)pt(C(v.x),C(v.y),0,-20,.4,2,'rgba(230,236,245,.6)',{k:'smoke',gr:2});
  }
  // lamp oil
  for(const o of s.oil){
    const cx=(o.x+o.w/2)*T,cy=(o.y+o.h/2)*T;
    if(o.st==='wet'){let lit=false;for(let y=o.y;y<o.y+o.h&&!lit;y++)for(let x=o.x;x<o.x+o.w;x++)if(inFire(C(x),C(y),16)){lit=true;break;}
      if(lit){o.st='burn';o.t=7;Aud.S.explode&&Aud.S.ember();shake(4);lureNear(cx,cy,5*T,true);G.rings.push({x:cx,y:cy,t:.6,r:90,c:'255,150,60'});
        if(!s.said.oil){s.said.oil=1;say('Ashling','Lamp oil! It burns. Nobody walk through that. Except them.');}}}
    else if(o.st==='burn'){o.t-=dt;
      for(let k=0;k<2;k++)if(Math.random()<.7*Q.amb+.2)pt(o.x*T+Math.random()*o.w*T,o.y*T+Math.random()*o.h*T,(Math.random()-.5)*10,-50-Math.random()*40,.6,3+Math.random()*3,Math.random()<.5?'#ff9a3c':'#ffd060',{add:true,g:-20});
      const inside=c=>c.x>o.x*T-4&&c.x<(o.x+o.w)*T+4&&c.y>o.y*T-4&&c.y<(o.y+o.h)*T+4;
      for(const g of G.guards)if(!g.boss&&!g.spin&&!o.hit.has(g)&&inside(g)){o.hit.add(g);g.stun=Math.max(g.stun,4.5);G.st.stuns++;floatText(g.x,g.y-20,'SCORCHED','#ffb060');}
      if(!W.hidden&&inside(W))hurtTeam(1,cx,cy,'oil');
      if(o.t<=0)o.st='spent';}
  }
  // chandeliers
  for(const d of s.drops){
    if(d.st==='up'&&d.rope&&inFire(C(d.rope[0]),C(d.rope[1]))){d.p+=dt;if(Math.random()<dt*14)pt(C(d.rope[0]),C(d.rope[1]),0,-14,.5,2,'#ffb060',{add:true});if(d.p>.6)dropChand(d.id);}
    else if(d.st==='fall'){d.t-=dt;if(d.t<=0){d.st='down';impact(d);}}
  }
  // hidden caches: Ashling's nose finds them from further away than Shiloh's eyes
  for(const q of s.caches)if(!q.seen){const x=C(q.x),y=C(q.y);
    if((G.ash.on&&near(G.ash,x,y,(G.flight?2.6:2.2)*T))||(!W.hidden&&near(W,x,y,1.3*T))){q.seen=true;burst(x,y,12,'#ffe9a0',50,.8,2,{add:true});
      say(G.ash.on?'Ashling':'Shiloh',q.find||(G.ash.on?'Something behind there smells of old smoke and older money.':'That stone is loose.'));}}
  stepDis(dt,hurry);
  stepBells(dt);
  stepChal(dt);
  if(s.air)stepAir(dt);
  stepAshHold(dt);
  if(s.dis)for(const d of s.dis.doors)if(d.open){d.t-=dt;const occ=[G.wren,G.ash,...G.guards].some(c=>c&&onTile(c,d.x,d.y,20));if(d.t<=0&&!occ){d.open=false;refreshSolid(s);}}
  // the partner may never end up inside a wall (tether into a drain, closing gates)
  if(G.active==='ash'&&!G.flight&&oBlocked(W.x,W.y,8)&&!s.ashPass.has(K(...tileOf(W)))){W.x=s.safe.x;W.y=s.safe.y;}
  if(G.active==='wren'&&G.ash.on&&!G.flight&&s.ashPass.has(K(...tileOf(G.ash)))){/* Ashling waits in the drain: fine */}
}
function ejectAsh(){ // a duct closed with Ashling inside: he scrambles out the nearest end
  const A=G.ash;if(!A.on)return;const [tx,ty]=tileOf(A);
  if(G.grid[ty]&&G.grid[ty][tx]==='#'&&!M.ashPass.has(K(tx,ty))){
    let best=null,bd=1e9;for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const nx=C(tx+i),ny=C(ty+j);if(!oBlocked(nx,ny,10)){const d=Math.abs(i)+Math.abs(j);if(d<bd){bd=d;best=[nx,ny];}}}
    if(best){A.x=best[0];A.y=best[1];}
  }
}
function tripPlate(p){
  const x=C(p.x),y=C(p.y);p.cd=2.5;p.rev=true;
  if(p.kind==='dart'){
    for(let k=0;k<3;k++)pt(x-40,y-6+k*6,240,0,.18,2,'#d8d0c0',{});
    Aud.S.hit();hurtTeam(1,x-30,y,'dart');floatText(x,y-20,'DARTS','#ff9a7a');
  } else if(p.kind==='alarm'){
    Aud.S.bell();G.rings.push({x,y,t:1,r:260,c:'255,90,60'});lureNear(x,y,9*T);G.alert=Math.min(.95,G.alert+.25*grace());floatText(x,y-20,'ALARM BELL','#ff7a5a');
  } else {
    Aud.S.bell();G.rings.push({x,y,t:.6,r:140,c:'220,210,190'});lureNear(x,y,6*T,true);G.alert=Math.min(.95,G.alert+.06*grace());floatText(x,y-20,'*rattle*','#e8dcc0',10);
  }
  if(!M.said['p'+p.kind]){M.said['p'+p.kind]=1;say('Shiloh',p.kind==='rattle'?'Bone chimes under the boards. Sneak over those.':p.kind==='dart'?'Darts. Ashling is too light to set them off. I am not.':'A bell-wire under the floor. Stupid, stupid.');}
  if(M.ch&&M.ch.st==='run'&&inZone(p.x,p.y))failChal('A plate gave you away.');
}
function fall(drop){
  const W=G.wren;
  if(drop){
    const to=M.m.rot.to;W.x=C(to[0]);W.y=C(to[1]);W.kx=W.ky=0;
    G.flash={t:.3,c:'20,14,10'};shake(6);Aud.S.hurt();lureNear(W.x,W.y,6*T,true);
    toast('The floor gave way','Shiloh drops into the cellar.','#d8a060');
    if(!M.said.fall){M.said.fall=1;say('Shiloh','Rotten boards. Running was a mistake.');say('Ashling','Was that you? That sounded like you.',2.6);}
    if(typeof camUpdate==='function'&&G.active==='wren')camUpdate(0,true);
  } else {
    hurtTeam(1,W.x,W.y-10,'fall');W.x=M.safe.x;W.y=M.safe.y;W.kx=W.ky=0;
    toast('Fell','The floor crumbled away.','#d8a060');
    if(M.ch&&M.ch.st==='run')failChal('You fell.');
  }
}
function impact(d){
  const x=C(d.x),y=C(d.y),R=d.r*T;
  Aud.S.explode();shake(12);G.flash={t:.3,c:'255,220,160'};
  burst(x,y,40,'#ffd27a',200,.8,3,{add:true,g:60});burst(x,y,20,'#6a5a4a',120,1.2,6,{k:'smoke',gr:10});
  G.rings.push({x,y,t:.8,r:R*1.3,c:'255,200,120'});
  let n=0;for(const g of G.guards){if(g.spin||g.boss)continue;if(Math.hypot(g.x-x,g.y-y)<R){g.stun=Math.max(g.stun,6);n++;G.st.stuns++;floatText(g.x,g.y-20,'FLATTENED','#ffd27a');}}
  for(const c of [G.wren,G.ash.on?G.ash:null])if(c&&!c.hidden&&Math.hypot(c.x-x,c.y-y)<R*.6){hurtTeam(1,x,y,'chandelier');break;}
  lureNear(x,y,10*T,true);
  if(G.chand&&G.chand.length){let bi=-1,bd=1e9;G.chand.forEach((c,k)=>{const dd=Math.hypot(c.x-x,c.y-y);if(dd<bd){bd=dd;bi=k;}});if(bi>=0&&bd<2*T)G.chand.splice(bi,1);}
  if(n)toast('Chandelier down',n+' guard'+(n>1?'s':'')+' flattened. Everyone heard it.','#ffd27a');
}
function stepDis(dt,hurry){
  const D=M.dis;if(!D||!D.on)return;
  const W=G.wren;
  if(D.steward&&D.steward.stun<=0&&Math.hypot(D.steward.x-W.x,D.steward.y-W.y)<2.6*T&&oLos(D.steward.x,D.steward.y,W.x,W.y)){blow('The steward knows every servant in this house by name.');return;}
  const g=seenBy(W);
  if(g&&(hurry||G.roll.t>0||G.time-(G.strike.last||-9)<.2)){D.run+=dt*(hurry?1:4);if(D.run>.55){blow('Servants do not run.');return;}}
  else D.run=Math.max(0,D.run-dt*.8);
  if(G.ash.on&&!G.flight&&Math.hypot(G.ash.x-W.x,G.ash.y-W.y)<3*T&&seenBy(G.ash)){blow('A servant with a dragon at her heel? No.');return;}
  if(G.alert>=.8)blow('They have seen through it.');
}
function stepBells(dt){if(!M.bells)return;for(const b of M.bells.list)b.ring=Math.max(0,b.ring-dt*1.4);}
function inZone(x,y){const z=M.ch&&M.ch.zone;return z&&x>=z[0]&&x<=z[2]&&y>=z[1]&&y<=z[3];}
function stepChal(dt){
  const c=M.ch;if(!c)return;
  const A=G.flight?G.ash:G.wren;
  if(c.rings){
    if(c.st==='done')return;
    const r=c.rings[c.ri],hit=r&&Math.hypot(A.x-C(r[0]),A.y-C(r[1]))<26;
    if(c.st!=='run'){if(c.ri===0&&hit){c.st='run';c.t=c.time;c.ri=1;Aud.S.wind?Aud.S.wind():Aud.S.swap();toast(c.name,c.desc||'Fly through every ring in order.','#9fd8ff');}return;}
    c.t-=dt;
    if(hit){c.ri++;Aud.S.gem();G.rings.push({x:C(r[0]),y:C(r[1]),t:.5,r:60,c:'160,220,255'});
      if(c.ri>=c.rings.length)finishChal();}
    if(c.t<=0&&c.st==='run'){c.st='idle';c.ri=0;toast('Too slow','The gale run resets. Try the first ring again.','#ff9a6a');}
    return;
  }
  const [tx,ty]=tileOf(A),inside=inZone(tx,ty)&&(G.active==='wren'||G.flight);
  if(c.st==='idle'&&inside){c.st='run';c.t=c.time;toast(c.name,c.desc||('Reach the prize within '+c.time+' seconds.'),'#ffd27a');Aud.S.sting?Aud.S.sting():Aud.S.alert();}
  else if(c.st==='run'){c.t-=dt;if(c.t<=0)failChal('Out of time.');}
  else if(c.st==='fail'&&!inZone(...tileOf(G.wren))){c.st='idle';for(const p of M.plates)if(inZone(p.x,p.y)){p.rev=!p.hidden?true:p.rev;}for(const r of M.rot)if(inZone(r.x,r.y)&&!M.m.rot.to){r.st=0;r.t=0;M.pitSet.delete(K(r.x,r.y));}refreshSolid(M);}
}
function failChal(why){const c=M.ch;if(!c||c.st!=='run')return;c.st='fail';toast(c.name+' failed',why+' Step out and back in to try again.','#ff7a5a');Aud.S.lost&&Aud.S.back();}
function finishChal(){
  const c=M.ch;c.st='done';Aud.S.win();
  const got=reward(c.rew,(G.flight?G.ash:G.wren).x,(G.flight?G.ash:G.wren).y);
  toast(c.name+' complete',got||'Well done.','#7be08a');G.st.trials=(G.st.trials||0)+1;
  G.rings.push({x:(G.flight?G.ash:G.wren).x,y:(G.flight?G.ash:G.wren).y,t:1,r:160,c:'120,240,150'});
}
/* Ashling's own hands (E / ACT as Ashling outside the flight mission) */
function stepAshHold(dt){
  if(G.active!=='ash'||G.flight){M.ahold=0;M.aT=null;M.novaBlock=false;return;}
  const tg=mechTarget(G.ash,'ash');
  const held=!!(keys['e']||touch.act);
  if(!held&&M.novaBlock){M.novaBlock=false;touch.act=false;}
  if(tg&&held){if(M.aT&&M.aT.ref===tg.ref)M.ahold+=dt;else{M.ahold=0;M.aT=tg;}
    if(M.ahold>=tg.need){activate(tg);M.ahold=0;M.aT=null;}}
  else{M.ahold=0;M.aT=null;}
  if(tg&&!M.ahold)G.prompt=tg;
  if(tg&&!M.said.ashE){M.said.ashE=1;say('Ashling','I can reach that. Hold E. (ACT on touch.)');}
}

/* ---------------- flight encounters (the Drowned Spire) ---------------- */
function stepAir(dt){
  const S=M.air,A=G.ash,gm=grace(),W=G.gw*T,H=G.gh*T;
  // wind currents push Ashling
  for(const w of S.wind){if(A.x>w.x&&A.x<w.x+w.w&&A.y>w.y&&A.y<w.y+w.h){A.x=Math.max(10,Math.min(W-10,A.x+w.vx*dt));A.y=Math.max(10,Math.min(H-10,A.y+w.vy*dt));
    if(!M.said.wind){M.said.wind=1;say('Ashling','A current! With it I am fast. Against it, I am a kite.');}}}
  // gull flocks scatter loudly
  for(const f of S.gulls){
    if(f.st==='sit'&&Math.hypot(A.x-f.x,A.y-f.y)<1.5*T){f.st='fly';f.t=18;Aud.S.wind?Aud.S.wind():Aud.S.swap();G.alert=Math.min(.95,G.alert+.12*gm);
      G.rings.push({x:f.x,y:f.y,t:.6,r:120,c:'240,240,255'});floatText(f.x,f.y-14,'*SCREE*','#f0f0ff',11);
      for(const d of S.drakes)if(d.st!=='dead'&&Math.hypot(d.x-f.x,d.y-f.y)<8*T){d.st='search';d.last={x:f.x,y:f.y};d.lost=3;}
      if(!M.said.gull){M.said.gull=1;say('Ashling','Gulls. Loud, rude gulls. Everyone heard that.');}}
    else if(f.st==='fly'){f.t-=dt;if(f.t<=0)f.st='sit';}
  }
  // drakes
  const R=4.4*T*G.rangeMul;
  for(const d of S.drakes){
    d.ph+=dt*8;
    if(d.st==='dead'){d.fall+=dt;continue;}
    if(!d.last)d.last={x:d.x,y:d.y};
    if(d.stun>0){d.stun-=dt;continue;}
    const dx=A.x-d.x,dy=A.y-d.y,dist=Math.hypot(dx,dy);
    const sees=dist<R&&(dist<T||angDiff(Math.atan2(dy,dx),d.face)<.8)&&los(d.x,d.y,A.x,A.y);
    if(sees){d.see=Math.min(1,d.see+dt*2);d.last={x:A.x,y:A.y};d.lost=3.5;
      if(d.st!=='chase'){d.st='chase';d.say=1.4;Aud.S.alert();}
      G.alert+=(.2+(1-dist/R)*.45)*dt*G.gain*gm;}
    else d.see=Math.max(0,d.see-dt);
    let tx,ty,sp=72;
    if(d.st==='chase'){tx=d.last.x;ty=d.last.y;sp=sees?112:96;if(!sees){d.lost-=dt;if(d.lost<=0)d.st='search';}
      d.cd-=dt;
      if(sees&&dist<3.4*T&&d.cd<=0&&d.tele<=0){d.tele=.55;d.aim=Math.atan2(dy,dx);}
      if(dist<2.2*T)sp=20;}
    else if(d.st==='search'){tx=d.last.x;ty=d.last.y;sp=80;if(Math.hypot(tx-d.x,ty-d.y)<10){d.lost-=dt;if(d.lost<=0)d.st='patrol';}}
    else{const w=d.wp[d.i];tx=w[0];ty=w[1];if(Math.hypot(tx-d.x,ty-d.y)<8)d.i=(d.i+1)%d.wp.length;}
    if(d.tele>0){d.tele-=dt;d.aim=Math.atan2(A.y-d.y,A.x-d.x)*.3+d.aim*.7;sp=10;
      if(d.tele<=0){d.cd=2.3;const v=230;S.shots.push({x:d.x+Math.cos(d.aim)*14,y:d.y+Math.sin(d.aim)*14,vx:Math.cos(d.aim)*v,vy:Math.sin(d.aim)*v,t:1.7,k:'fire'});Aud.S.orb?Aud.S.orb():Aud.S.ember();}}
    const ex=tx-d.x,ey=ty-d.y,el=Math.hypot(ex,ey)||1,want=Math.atan2(ey,ex);
    let da=want-d.face;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;d.face+=Math.max(-3*dt,Math.min(3*dt,da));
    if(el>4){d.x+=Math.cos(d.face)*sp*dt;d.y+=Math.sin(d.face)*sp*dt;}
    // Ashling's fire and dash
    if(inFire(d.x,d.y,8)){d.hp-=dt;d.hurt=.1;if(d.st==='patrol'){d.st='chase';d.last={x:A.x,y:A.y};d.lost=3;}if(d.hp<=0)killDrake(d);}
    if(G.dash.t>0&&dist<26)killDrake(d);
    if(d.say>0)d.say-=dt;
  }
  // ballista crews on the roofs
  for(const b of S.ball){
    if(b.stun>0){b.stun-=dt;b.tele=0;continue;}
    if(inFire(b.x,b.y,14)){b.burn+=dt;if(b.burn>.5){b.stun=12;b.burn=0;G.st.stuns++;floatText(b.x,b.y-20,'CREW SCATTERED','#ffd27a');Aud.S.stun();continue;}}else b.burn=Math.max(0,b.burn-dt);
    const dx=A.x-b.x,dy=A.y-b.y,dist=Math.hypot(dx,dy),want=Math.atan2(dy,dx);
    const sees=dist<6.4*T*G.rangeMul&&angDiff(want,b.a)<1.0&&los(b.x,b.y,A.x,A.y);
    b.cd-=dt;
    if(b.tele>0){b.tele-=dt;if(b.tele<=0){b.cd=3.2;S.shots.push({x:b.x+Math.cos(b.a)*18,y:b.y+Math.sin(b.a)*18,vx:Math.cos(b.a)*430,vy:Math.sin(b.a)*430,t:1.2,k:'bolt',a:b.a});Aud.S.slash?Aud.S.slash():Aud.S.hit();shake(2);}continue;}
    if(sees){b.see=1;G.alert+=.25*dt*G.gain*gm;let da=want-b.a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;b.a+=Math.max(-1.3*dt,Math.min(1.3*dt,da));
      if(Math.abs(da)<.14&&b.cd<=0)b.tele=.8;}
    else{b.see=0;b.a=b.base+Math.sin(M.t*.5+b.x)*.75;}
  }
  // shots
  for(const p of S.shots){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt;
    if(p.k==='fire'&&inFire(p.x,p.y)){p.t=0;burst(p.x,p.y,6,'#ffb060',60,.3,2,{add:true});continue;}
    if(Math.hypot(p.x-A.x,p.y-A.y)<13){p.t=0;hurtTeam(1,p.x-p.vx*.05,p.y-p.vy*.05,p.k);}
    if(p.k==='fire'&&Math.random()<.5)pt(p.x,p.y,0,0,.3,3,'#ff8a3c',{add:true});}
  S.shots=S.shots.filter(p=>p.t>0);
}
function killDrake(d){d.st='dead';d.fall=0;G.st.stuns++;Aud.S.foeDie?Aud.S.foeDie():Aud.S.stun();burst(d.x,d.y,20,'#ffb060',110,.6,2.5,{add:true});floatText(d.x,d.y-18,'DOWNED','#ffd27a');
  if(!M.said.drake){M.said.drake=1;say('Ashling','Into the sea with you. Splash.');}}

/* ---------------- light ---------------- */
const oCollect=collectLights;
collectLights=function(){
  const L=oCollect(),s=G&&G.mis;if(!s)return L;
  const vr=viewRect(),add=(x,y,r,a,col,gl)=>{if(x<vr.x-r-64||x>vr.x+vr.w+r+64||y<vr.y-r-64||y>vr.y+vr.h+r+64)return;L.push({x,y,r,a,col,gl:gl==null?.5:gl});};
  for(const o of s.oil)if(o.st==='burn')add((o.x+o.w/2)*T,(o.y+o.h/2)*T,(Math.max(o.w,o.h)/2+2.6)*T*(1+Math.sin(G.time*13)*.04),1,'255,140,50',.8);
  for(const c of s.caches)if(!c.open&&c.seen&&!c.dark)add(C(c.x),C(c.y),46,.5,'255,210,120',.4);
  for(const l of s.levers)add(C(l.x),C(l.y),l.by==='ash'?40:30,.45,l.by==='ash'?'255,150,70':'230,200,150',.3);
  for(const st of s.stairs)if(st.found){add(C(st.a[0]),C(st.a[1]),38,.4,'200,190,255',.3);add(C(st.b[0]),C(st.b[1]),38,.4,'200,190,255',.3);}
  if(s.bells)for(const b of s.bells.list)add(C(b.x),C(b.y),36+b.ring*60,.5,'255,220,140',.4);
  for(const n of s.notes)add(C(n.x),C(n.y),30,.4,'200,220,255',.3);
  if(s.air)for(const p of s.air.shots)if(p.k==='fire')add(p.x,p.y,40,.7,'255,130,50',.6);
  return L;
};

/* ---------------- drawing: floor layer (before characters, under the darkness) ---------------- */
let VR=null;
function vis(x,y,m){const v=VR||viewRect();m=m||40;return x>v.x-m&&x<v.x+v.w+m&&y>v.y-m&&y<v.y+v.h+m;}
/* static pieces are drawn once into small offscreen sprites (2x) and stamped */
const SPR=new Map();
function spr(key,fn){let cv=SPR.get(key);if(!cv){cv=document.createElement("canvas");cv.width=cv.height=T*2;const g=cv.getContext("2d");g.scale(2,2);fn(g);SPR.set(key,cv);}return cv;}
const oPots=drawPots;
drawPots=function(){oPots();const s=G&&G.mis;if(!s)return;ctx.save();try{drawFloor(s);}catch(e){console.error(e);}ctx.restore();};
function drawFloor(s){VR=viewRect();M=s;
  const c=ctx,t=G.time;
  for(const o of s.oil)if(vis((o.x+o.w/2)*T,(o.y+o.h/2)*T,o.w*T))drawOil(c,o,t);
  for(const P of s.pitT.values())drawPit(c,P,s);
  for(const r of s.rot)if(vis(C(r.x),C(r.y)))drawRot(c,r,t);
  if(s.ch&&s.ch.floor){const [x0,y0,x1,y1]=s.ch.floor;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(vis(C(x),C(y)))plateTile(c,x*T,y*T,false,false);}
  for(const p of s.plates)if(vis(C(p.x),C(p.y)))drawPlate(c,p,t);
  for(const d of s.ducts)for(const [x,y] of d.tiles)if(vis(C(x),C(y)))drawGrate(c,x*T,y*T,!d.need||s.ashPass.has(K(x,y)),false);
  for(const st of s.stairs){for(const [end,k] of [[st.a,0],[st.b,1]])if(vis(C(end[0]),C(end[1])))drawStairs(c,st,end,k,t);}
  for(const v of s.steam)if(vis(C(v.x),C(v.y)))drawVentGrille(c,v,t);
  for(const l of s.levers)if(vis(C(l.x),C(l.y)))drawLever(c,l,t);
  for(const q of s.caches)if(q.seen&&vis(C(q.x),C(q.y)))drawCache(c,q,t);
  for(const n of s.notes)if(vis(C(n.x),C(n.y)))drawNote(c,n,t);
  if(s.bells)for(const b of s.bells.list)if(vis(C(b.x),C(b.y)))drawBell(c,b,t,s.bells);
  if(s.dis){const [x,y]=s.dis.at;if(vis(C(x),C(y)))drawWardrobe(c,x*T,y*T,s.dis);for(const d of s.dis.doors)if(vis(C(d.x),C(d.y)))drawServDoor(c,d,t);}
  for(const id in s.gates){const q=s.gates[id];q.anim+=((q.open?1:0)-q.anim)*Math.min(1,1/60*6);if(vis(C(q.x),C(q.y)))drawPortcullis(c,q,t);}
  for(const d of s.drops)if(d.st==='down'&&vis(C(d.x),C(d.y),80))drawWreck(c,d);else if(d.rope&&d.st==='up'&&vis(C(d.rope[0]),C(d.rope[1])))drawCleat(c,d,t);
  if(s.air){for(const f of s.air.fog)if(vis(f.x,f.y,f.r))drawFogBank(c,f,t);for(const b of s.air.ball)if(vis(b.x,b.y,60))drawBallista(c,b,t);
    for(const f of s.air.gulls)if(f.st==='sit'&&vis(f.x,f.y))drawGullsSit(c,f,t);}
}
function ink(c,w){c.strokeStyle=INK;c.lineWidth=w||1.2;c.stroke();}
function plateTile(c,x,y,trap,lit){c.drawImage(spr("pl"+(trap?1:0)+(lit?1:0),g=>plateRaw(g,0,0,trap,lit)),x,y,T,T);}
function plateRaw(c,x,y,trap,lit){
  c.fillStyle='#3e3a44';c.fillRect(x+3,y+3,T-6,T-6);
  const g=c.createLinearGradient(x,y,x+T,y+T);g.addColorStop(0,'#6a6472');g.addColorStop(1,'#4a4552');
  c.fillStyle=g;c.fillRect(x+4,y+4,T-8,T-9);
  c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x+4,y+4,T-8,2);
  c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(x+3.5,y+3.5,T-7,T-7);
  c.strokeStyle='rgba(0,0,0,.3)';c.beginPath();c.moveTo(x+16,y+6);c.lineTo(x+16,y+T-7);c.stroke();
  if(trap){c.fillStyle=lit?'rgba(255,80,50,.75)':'rgba(255,90,60,.45)';c.beginPath();c.moveTo(x+16,y+9);c.lineTo(x+22,y+16);c.lineTo(x+16,y+23);c.lineTo(x+10,y+16);c.closePath();c.fill();}
}
function drawPlate(c,p,t){
  const x=p.x*T,y=p.y*T,dn=p.on?1.5:0;
  if(p.hidden&&!p.rev){plateTile(c,x,y,false,false);return;}
  c.save();c.translate(0,dn);
  if(p.kind==='rattle'){plateTile(c,x,y,false,false);
    c.strokeStyle='#d8ccb0';c.lineWidth=1.4;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+9+i*7,y+8);c.lineTo(x+9+i*7,y+13+Math.sin(t*3+i)*1);c.stroke();}
    c.fillStyle='#e8dcc0';for(let i=0;i<3;i++){c.beginPath();c.ellipse(x+9+i*7,y+15,2,3,0,0,6.28);c.fill();}
  } else plateTile(c,x,y,true,p.kind==='alarm'||p.on);
  c.restore();
  if(p.kind==='dart'){c.fillStyle=INK;for(let i=0;i<3;i++){circ(c,x+1,y+10+i*6,1.4);c.fill();}}
}
function drawRot(c,r,t){c.drawImage(spr("rot"+r.st,g=>rotRaw(g,{x:0,y:0,st:r.st})),r.x*T,r.y*T,T,T);}
function rotRaw(c,r){
  const x=r.x*T,y=r.y*T;
  if(r.st===2){
    const g=c.createRadialGradient(x+16,y+16,2,x+16,y+16,18);g.addColorStop(0,'#000');g.addColorStop(1,'#1a120c');
    c.fillStyle=g;c.fillRect(x+1,y+1,T-2,T-2);
    c.fillStyle='#5a3a22';for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+i*8,y+1);c.lineTo(x+i*8+5,y+1);c.lineTo(x+i*8+2,y+6+(i%2)*3);c.fill();c.beginPath();c.moveTo(x+i*8+2,y+T-1);c.lineTo(x+i*8+7,y+T-1);c.lineTo(x+i*8+5,y+T-6);c.fill();}
    return;
  }
  for(let i=0;i<4;i++){
    const px=x+1+i*7.5,sh=(i%2)*.06;
    c.fillStyle=i%2?'#6a4a2e':'#5e4128';c.fillRect(px,y+1,7,T-2);
    c.fillStyle='rgba(0,0,0,.35)';c.fillRect(px+6,y+1,1,T-2);
    c.fillStyle='rgba(255,220,170,.07)';c.fillRect(px,y+1,1.5,T-2);
  }
  c.strokeStyle='rgba(20,10,4,.75)';c.lineWidth=1;c.beginPath();
  c.moveTo(x+6,y+8);c.lineTo(x+12,y+14);c.lineTo(x+10,y+20);c.moveTo(x+20,y+4);c.lineTo(x+24,y+12);c.moveTo(x+18,y+24);c.lineTo(x+26,y+27);c.stroke();
  if(r.st===1){c.strokeStyle='rgba(0,0,0,.9)';c.lineWidth=1.6;c.beginPath();c.moveTo(x+3,y+16);c.lineTo(x+12,y+13);c.lineTo(x+19,y+19);c.lineTo(x+29,y+15);c.stroke();}
  c.fillStyle='#2a1c12';circ(c,x+4,y+5,1);c.fill();circ(c,x+27,y+27,1);c.fill();
}
function drawPit(c,P,s){
  if(!P.set)P.set=new Set(P.tiles.map(([x,y])=>K(x,y)));
  const has=(x,y)=>P.set.has(K(x,y));
  for(const [x,y] of P.tiles){
    if(!vis(C(x),C(y)))continue;
    const mk=(has(x,y-1)?1:0)|(has(x-1,y)?2:0)|(has(x+1,y)?4:0)|(has(x,y+1)?8:0),br=P.bridged.some(q=>q[0]===x&&q[1]===y);
    c.drawImage(spr('pit'+mk+(br?'b':''),g=>pitTile(g,mk,br)),x*T,y*T,T,T);
  }
}
function pitTile(c,mk,br){
  const x=0,y=0,P={bridged:br?[[0,0]]:[]},has=(a,b)=>!!(mk&(b<0?1:a<0?2:a>0?4:8));
  {const X=0,Y=0;
    c.fillStyle='#030205';c.fillRect(X,Y,T,T);
    const m=c.createLinearGradient(X,Y,X,Y+T);m.addColorStop(0,'rgba(90,80,130,.04)');m.addColorStop(1,'rgba(90,80,130,.14)');
    c.fillStyle=m;c.fillRect(X,Y,T,T);
    if(!has(x,y-1)){ // the far wall of the chasm, falling away into the dark
      const f=c.createLinearGradient(X,Y,X,Y+14);f.addColorStop(0,'#4a4456');f.addColorStop(1,'rgba(20,16,26,0)');
      c.fillStyle=f;c.fillRect(X,Y,T,14);c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;c.beginPath();c.moveTo(X,Y+5);c.lineTo(X+T,Y+5);c.moveTo(X+11,Y);c.lineTo(X+11,Y+5);c.moveTo(X+25,Y+5);c.lineTo(X+25,Y+10);c.stroke();}
    for(const [dx,lx] of [[-1,X],[1,X+T-4]])if(!has(x+dx,y)){ // stone lips on either side
      const f=c.createLinearGradient(dx<0?X:X+T,0,dx<0?X+10:X+T-10,0);f.addColorStop(0,'rgba(0,0,0,.7)');f.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=f;c.fillRect(dx<0?X:X+T-10,Y,10,T);
      c.fillStyle='#6a6478';c.fillRect(lx,Y,4,T);c.fillStyle='rgba(255,255,255,.14)';c.fillRect(dx<0?lx:lx+3,Y,1,T);
      c.fillStyle=INK;c.fillRect(dx<0?lx+4:lx-1,Y,1,T);}
    if(!has(x,y+1)){c.fillStyle='#5a5466';c.fillRect(X,Y+T-3,T,3);c.fillStyle=INK;c.fillRect(X,Y+T-4,T,1);}
    if(P.bridged.some(q=>q[0]===x&&q[1]===y)){
      shadowAt(X+16,Y+T-4,18,4,.5);
      for(let i=0;i<5;i++){c.fillStyle=i%2?'#7a5634':'#6a4a2c';c.fillRect(X+i*6.4,Y+5,6,T-10);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(X+i*6.4+5.4,Y+5,.8,T-10);c.fillStyle='rgba(255,220,170,.08)';c.fillRect(X+i*6.4,Y+5,1,T-10);}
      c.strokeStyle='#c8b088';c.lineWidth=1.3;c.beginPath();c.moveTo(X,Y+7);c.lineTo(X+T,Y+7.5);c.moveTo(X,Y+T-7);c.lineTo(X+T,Y+T-7.5);c.stroke();
    }
  }
}
function drawGrate(c,x,y,open,over){
  c.fillStyle=over?'rgba(18,14,22,.55)':'#0e0a12';if(!over)c.fillRect(x+5,y+7,T-10,T-12);
  c.strokeStyle=over?'rgba(110,104,120,.85)':'#5a5662';c.lineWidth=2;
  for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+8+i*5.4,y+7);c.lineTo(x+8+i*5.4,y+T-5);c.stroke();}
  c.strokeStyle=INK;c.lineWidth=1.2;c.strokeRect(x+5.5,y+7.5,T-11,T-13);
  if(!over){c.fillStyle=open?'rgba(255,150,70,.55)':'rgba(140,130,150,.35)';circ(c,x+16,y+T-3,1.6);c.fill();}
}
function drawStairs(c,st,end,k,t){
  const x=end[0]*T,y=end[1]*T;
  if(!st.found){ // a slab that does not quite sit right
    const near_=Math.hypot(G.wren.x-C(end[0]),G.wren.y-C(end[1]))<2.6*T;
    c.strokeStyle='rgba(0,0,0,'+(near_?.6:.25)+')';c.lineWidth=1;c.strokeRect(x+4.5,y+4.5,T-9,T-9);
    if(near_){c.strokeStyle='rgba(190,170,255,'+(.25+.2*Math.sin(t*3))+')';c.beginPath();c.arc(x+16,y+14,4,Math.PI,0);c.lineTo(x+21,y+19);c.lineTo(x+11,y+19);c.closePath();c.stroke();}
    return;
  }
  const kind=(k?st.kindB:st.kind)||'hatch';
  if(kind==='stairs'){
    for(let i=0;i<5;i++){const v=60-i*11;c.fillStyle='rgb('+v+','+(v-4)+','+(v+6)+')';c.fillRect(x+3,y+3+i*5.4,T-6,5.4);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x+3,y+3+i*5.4,T-6,1);}
    c.strokeStyle=INK;c.lineWidth=1.2;c.strokeRect(x+2.5,y+2.5,T-5,T-5);
  } else if(kind==='well'){
    c.fillStyle='#4a4450';circ(c,x+16,y+16,13);c.fill();ink(c,1.4);c.fillStyle='#050308';circ(c,x+16,y+16,9);c.fill();
    c.fillStyle='#6a5a48';c.fillRect(x+4,y+4,24,3);c.strokeStyle='#c8b088';c.lineWidth=1;c.beginPath();c.moveTo(x+16,y+6);c.lineTo(x+16,y+16);c.stroke();
  } else { // wooden hatch with an iron ring
    c.fillStyle='#120c10';c.fillRect(x+3,y+3,T-6,T-6);
    for(let i=0;i<3;i++){c.fillStyle=i%2?'#6a4a2c':'#5a3e26';c.fillRect(x+5+i*7.4,y+5,7,T-10);}
    c.fillStyle='#3a3440';c.fillRect(x+5,y+9,T-10,2.4);c.fillRect(x+5,y+T-11,T-10,2.4);
    c.strokeStyle='#8a8494';c.lineWidth=1.6;circ(c,x+16,y+17,3.4);c.stroke();
    c.strokeStyle=INK;c.lineWidth=1.2;c.strokeRect(x+3.5,y+3.5,T-7,T-7);
  }
}
function drawVentGrille(c,v,t){
  const x=C(v.x),y=C(v.y);
  c.fillStyle='#2a2630';circ(c,x,y,11);c.fill();ink(c,1.2);
  c.strokeStyle=v.live?'#d8e0ea':v.warn?'#a8b0bc':'#5a5662';c.lineWidth=1.6;
  for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(x-7,y+i*4);c.lineTo(x+7,y+i*4);c.stroke();}
  if(v.off){c.strokeStyle='#8a6a3a';c.lineWidth=2;c.beginPath();c.moveTo(x-8,y-8);c.lineTo(x+8,y+8);c.stroke();}
}
function drawLever(c,l,t){
  const x=C(l.x),y=C(l.y),on=l.on||(l.used&&l.once&&!l.hold);
  shadowAt(x+1,y+9,11,4,.3);
  // winch drum on a post
  c.fillStyle='#4a3424';c.fillRect(x-3,y-4,6,14);c.strokeStyle=INK;c.lineWidth=1.1;c.strokeRect(x-3,y-4,6,14);
  const g=c.createLinearGradient(x-10,y-8,x-10,y+2);g.addColorStop(0,'#9a7a54');g.addColorStop(1,'#5a4028');
  c.fillStyle=g;rr(c,x-10,y-9,20,10,3);c.fill();ink(c,1.1);
  c.strokeStyle='#c8b088';c.lineWidth=.8;for(let i=-7;i<=7;i+=3){c.beginPath();c.moveTo(x+i,y-9);c.lineTo(x+i,y+1);c.stroke();}
  const a=on?.9:-.9;c.strokeStyle='#3a3440';c.lineWidth=2.4;c.beginPath();c.moveTo(x+10,y-4);c.lineTo(x+10+Math.cos(a)*8,y-4+Math.sin(a)*8);c.stroke();
  c.fillStyle='#8a8494';circ(c,x+10+Math.cos(a)*8,y-4+Math.sin(a)*8,2.2);c.fill();
  if(l.by==='ash'){c.fillStyle='rgba(255,150,70,'+(.55+.3*Math.sin(t*4))+')';c.beginPath();c.moveTo(x-12,y+6);c.lineTo(x-7,y+1);c.lineTo(x-6,y+8);c.closePath();c.fill();}
  if(l.hold&&l.on){c.strokeStyle='rgba(255,220,140,'+(.5+.3*Math.sin(t*8))+')';c.lineWidth=1.4;circ(c,x,y,15);c.stroke();}
}
function drawCache(c,q,t){
  const x=C(q.x),y=C(q.y),o=q.open;
  if(q.kind==='stone'){
    c.fillStyle=o?'#120c10':'#5a5462';c.fillRect(x-9,y-8,18,13);c.strokeStyle=INK;c.lineWidth=1.1;c.strokeRect(x-9,y-8,18,13);
    if(!o){c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x-9,y-8,18,2);c.strokeStyle='rgba(255,230,160,'+(.2+.2*Math.sin(t*2))+')';c.strokeRect(x-10.5,y-9.5,21,16);}
    else{c.fillStyle='#5a5462';c.fillRect(x+6,y+4,16,10);ink(c,1);}
    return;
  }
  if(q.kind==='wreck'){
    c.save();c.translate(x,y);c.rotate(-.3);
    c.fillStyle='#3a2a1c';c.beginPath();c.moveTo(-18,-4);c.quadraticCurveTo(0,10,18,-4);c.lineTo(14,-8);c.lineTo(-14,-8);c.closePath();c.fill();ink(c,1.3);
    c.strokeStyle='#5a4028';c.lineWidth=1;for(let i=-10;i<=10;i+=5){c.beginPath();c.moveTo(i,-8);c.lineTo(i*.8,2);c.stroke();}
    c.strokeStyle='#4a3a2a';c.lineWidth=2;c.beginPath();c.moveTo(-2,-6);c.lineTo(6,-22);c.stroke();
    c.restore();
    if(!o){c.fillStyle='rgba(255,220,140,'+(.4+.3*Math.sin(t*3))+')';circ(c,x+4,y-2,2.2);c.fill();}
    return;
  }
  // chest / strongbox / reliquary
  shadowAt(x+1,y+8,13,4,.35);
  const col=q.kind==='reliquary'?['#c8c0d8','#7a7290']:q.kind==='box'?['#6a6a78','#3a3a46']:['#8a5a34','#4a2e1a'];
  const g=c.createLinearGradient(x,y-10,x,y+8);g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);
  c.fillStyle=g;rr(c,x-12,y-6,24,14,2);c.fill();ink(c,1.2);
  c.fillStyle=q.kind==='box'?'#8a8a98':'#d8a84a';c.fillRect(x-12,y-1,24,2.4);c.fillRect(x-2,y-3,4,6);
  if(o){c.fillStyle=col[1];c.beginPath();c.moveTo(x-12,y-6);c.lineTo(x-10,y-15);c.lineTo(x+14,y-15);c.lineTo(x+12,y-6);c.closePath();c.fill();ink(c,1);}
  else{c.fillStyle=col[0];rr(c,x-12,y-11,24,6,3);c.fill();ink(c,1);
    c.fillStyle='rgba(255,230,160,'+(.25+.2*Math.sin(t*3))+')';circ(c,x,y-1,1.6);c.fill();}
  if(q.chal&&M.ch&&M.ch.st!=='done'){c.strokeStyle=M.ch.st==='run'?'rgba(120,240,150,.8)':'rgba(255,200,120,.5)';c.lineWidth=1.4;circ(c,x,y,18+Math.sin(t*3)*1.5);c.stroke();}
}
function drawNote(c,n,t){
  const x=C(n.x),y=C(n.y);
  c.fillStyle='#5a5664';rr(c,x-9,y-12,18,22,3);c.fill();ink(c,1.1);
  c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x-8,y-11,16,2);
  c.strokeStyle='rgba(30,24,36,.9)';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x-5,y-6+i*4);c.lineTo(x+5-(i%2)*3,y-6+i*4);c.stroke();}
  if(!n.read){c.strokeStyle='rgba(190,220,255,'+(.3+.25*Math.sin(t*2.5))+')';c.lineWidth=1;rr(c,x-11,y-14,22,26,4);c.stroke();}
}
function drawBell(c,b,t,B){if(b.ring<=0){c.drawImage(spr('bell'+b.n,g=>bellRaw(g,{x:0,y:0,n:b.n,ring:0},0)),b.x*T,b.y*T,T,T);return;}bellRaw(c,b,t);}
function bellRaw(c,b,t){
  const x=C(b.x),y=C(b.y),sz=5+b.n*1.6,sw=Math.sin(t*20)*b.ring*.35;
  shadowAt(x+1,y+11,13,4,.3);
  c.fillStyle='#4a3424';c.fillRect(x-12,y-14,3,24);c.fillRect(x+9,y-14,3,24);c.fillRect(x-12,y-15,24,3);
  c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(x-12,y-15,24,3);
  c.save();c.translate(x,y-12);c.rotate(sw);
  const g=c.createLinearGradient(-sz,0,sz,0);g.addColorStop(0,'#7a5a20');g.addColorStop(.4,'#f0d070');g.addColorStop(1,'#8a6a20');
  c.fillStyle=g;c.beginPath();c.moveTo(-sz*.45,2);c.quadraticCurveTo(-sz*.55,sz*1.1,-sz,sz*1.5);c.lineTo(sz,sz*1.5);c.quadraticCurveTo(sz*.55,sz*1.1,sz*.45,2);c.closePath();c.fill();ink(c,1.1);
  c.fillStyle='#3a2a10';circ(c,0,sz*1.5+1.5,1.8);c.fill();
  c.restore();
  c.fillStyle='#2a1c10';c.font='bold 7px '+(typeof HEAD!=='undefined'?HEAD:'serif');c.textAlign='center';c.fillText(['','I','II','III','IV','V'][b.n],x,y+9);
  if(b.ring>0){c.strokeStyle='rgba(255,230,160,'+b.ring+')';c.lineWidth=1.2;circ(c,x,y-6,14+(1-b.ring)*14);c.stroke();}
}
function drawWardrobe(c,x,y,D){
  const cx=x+16;shadowAt(cx+1,y+29,14,4,.35);
  const g=c.createLinearGradient(x+3,0,x+29,0);g.addColorStop(0,'#5a3420');g.addColorStop(.5,'#7a4a2c');g.addColorStop(1,'#4a2a18');
  c.fillStyle=g;rr(c,x+3,y-6,26,34,2);c.fill();ink(c,1.3);
  c.fillStyle='#2a160c';c.fillRect(x+15.5,y-3,1,29);
  // livery hanging in the open half
  if(D.uses>0&&!D.on){c.fillStyle='#8a1f28';c.fillRect(x+6,y-1,8,18);c.fillStyle='#d8a84a';c.fillRect(x+6,y-1,8,2);c.fillRect(x+9,y+2,2,14);c.strokeStyle=INK;c.lineWidth=.8;c.strokeRect(x+6,y-1,8,18);}
  c.fillStyle='#d8a84a';circ(c,x+13,y+11,1.2);c.fill();circ(c,x+19,y+11,1.2);c.fill();
  c.fillStyle='#c8a050';c.fillRect(x+3,y-8,26,3);
}
function drawServDoor(c,d,t){
  const x=d.x*T,y=d.y*T;
  if(d.open){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+2,y+3,T-4,T-6);c.fillStyle='#6a2a20';c.fillRect(x+1,y+3,4,T-6);return;}
  const g=c.createLinearGradient(x,y,x+T,y);g.addColorStop(0,'#4a1a18');g.addColorStop(.5,'#7a2a24');g.addColorStop(1,'#4a1a18');
  c.fillStyle=g;c.fillRect(x+2,y+2,T-4,T-4);c.strokeStyle=INK;c.lineWidth=1.2;c.strokeRect(x+2.5,y+2.5,T-5,T-5);
  c.fillStyle='#d8a84a';c.beginPath();c.moveTo(x+16,y+8);c.lineTo(x+21,y+14);c.lineTo(x+16,y+20);c.lineTo(x+11,y+14);c.closePath();c.fill();
  c.fillStyle='#2a1010';c.fillRect(x+22,y+16,3,3);
  const D=G.mis.dis;if(!D.on&&Math.hypot(G.wren.x-C(d.x),G.wren.y-C(d.y))<1.6*T&&!G.mis.said.sd){G.mis.said.sd=1;say('Shiloh',"A servants' door. It opens for livery, not for me.");}
}
function drawPortcullis(c,q,t){
  const x=q.x*T,y=q.y*T,up=q.anim*(T-7);
  c.fillStyle='#14101a';c.fillRect(x,y+1,3,T-2);c.fillRect(x+T-3,y+1,3,T-2);
  c.save();c.beginPath();c.rect(x,y,T,T);c.clip();
  const by=y-up;
  c.strokeStyle='#2a2630';c.lineWidth=3.6;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+4+i*6,by);c.lineTo(x+4+i*6,by+T-2);c.stroke();}
  c.strokeStyle='#6a6676';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+4+i*6,by);c.lineTo(x+4+i*6,by+T-2);c.stroke();}
  c.strokeStyle='#4a4654';c.lineWidth=2.6;c.beginPath();c.moveTo(x+1,by+9);c.lineTo(x+T-1,by+9);c.moveTo(x+1,by+T-11);c.lineTo(x+T-1,by+T-11);c.stroke();
  c.fillStyle='#8a8494';for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+2.5+i*6,by+T-2);c.lineTo(x+4+i*6,by+T+2);c.lineTo(x+5.5+i*6,by+T-2);c.fill();}
  c.restore();
}
function drawOil(c,o,t){
  const x=o.x*T,y=o.y*T,w=o.w*T,h=o.h*T;
  c.save();c.beginPath();c.ellipse(x+w/2,y+h/2,w/2-2,h/2-2,0,0,6.283);
  c.fillStyle=o.st==='spent'?'rgba(20,14,10,.75)':'rgba(16,12,10,.82)';c.fill();
  if(o.st==='wet'){c.clip();const g=c.createLinearGradient(x,y,x+w,y+h);const k=(Math.sin(t*.7)+1)/2;
    g.addColorStop(0,'rgba(120,60,160,0)');g.addColorStop(.3+k*.2,'rgba(110,80,170,.22)');g.addColorStop(.5+k*.2,'rgba(60,150,140,.2)');g.addColorStop(1,'rgba(200,160,60,0)');
    c.fillStyle=g;c.fillRect(x,y,w,h);c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.ellipse(x+w*.35,y+h*.35,w*.12,h*.06,-.3,0,6.283);c.fill();}
  c.restore();
  if(o.st==='burn'){
    c.globalCompositeOperation='lighter';
    for(let i=0;i<Math.max(3,o.w*o.h*2);i++){const fx=x+((i*37)%(w-8))+4,fy=y+((i*53)%(h-6))+6,fh=8+6*Math.sin(t*11+i*1.7);
      c.fillStyle='rgba(255,'+(110+((i*29)%80))+',40,.55)';c.beginPath();c.moveTo(fx-4,fy);c.quadraticCurveTo(fx,fy-fh*1.4,fx+4,fy);c.closePath();c.fill();}
    c.globalCompositeOperation='source-over';
  }
}
function drawCleat(c,d,t){
  const x=C(d.rope[0]),y=C(d.rope[1]);
  c.fillStyle='#5a5664';c.fillRect(x-5,y-12,10,6);ink(c,1);
  c.strokeStyle='#c8b088';c.lineWidth=1.6;c.beginPath();c.moveTo(x,y-9);c.quadraticCurveTo(x+4,y,x-1,y+8);c.stroke();
  if(d.p>0){c.fillStyle='rgba(255,150,60,'+Math.min(1,d.p*1.5)+')';circ(c,x,y-2,3);c.fill();}
}
function drawWreck(c,d){
  const x=C(d.x)-16,y=C(d.y);
  shadowAt(x,y+6,30,10,.35);
  c.strokeStyle='#3a3440';c.lineWidth=5;c.beginPath();c.ellipse(x,y,24,9,.15,.3,5.6);c.stroke();
  c.strokeStyle='#8a7a5a';c.lineWidth=2.4;c.beginPath();c.ellipse(x,y,24,9,.15,.3,5.6);c.stroke();
  for(let i=0;i<6;i++){const a=i*1.1,cx=x+Math.cos(a)*28,cy=y+Math.sin(a)*12;c.fillStyle='#e8dcc0';c.save();c.translate(cx,cy);c.rotate(a);c.fillRect(-1.5,-5,3,8);c.restore();}
  c.fillStyle='#6a5a3a';for(let i=0;i<5;i++){c.beginPath();c.arc(x-20+i*10,y+8+(i%2)*4,2,0,6.28);c.fill();}
}
function drawFogBank(c,f,t){
  const k=.55+.15*Math.sin(t*.4+f.x);
  for(let i=0;i<3;i++){const ox=Math.sin(t*.2+i*2)*f.r*.25,oy=Math.cos(t*.17+i)*f.r*.15,r=f.r*(.7+i*.15);
    const g=c.createRadialGradient(f.x+ox,f.y+oy,r*.1,f.x+ox,f.y+oy,r);g.addColorStop(0,'rgba(200,220,230,'+(.22*k)+')');g.addColorStop(1,'rgba(200,220,230,0)');
    c.fillStyle=g;c.fillRect(f.x+ox-r,f.y+oy-r,r*2,r*2);}
}
function drawBallista(c,b,t){
  const x=b.x,y=b.y;
  shadowAt(x+2,y+6,16,6,.35);
  c.fillStyle='#4a3a2c';circ(c,x,y,11);c.fill();ink(c,1.3);c.fillStyle='#6a5440';circ(c,x,y,7);c.fill();
  c.save();c.translate(x,y);c.rotate(b.a);
  c.fillStyle='#7a5a3a';c.fillRect(-6,-3,24,6);c.strokeStyle=INK;c.lineWidth=1.1;c.strokeRect(-6,-3,24,6);
  c.strokeStyle='#5a3e26';c.lineWidth=3;c.beginPath();c.moveTo(10,-14);c.quadraticCurveTo(16,0,10,14);c.stroke();
  c.strokeStyle='#d8d0c0';c.lineWidth=.8;c.beginPath();c.moveTo(10,-14);c.lineTo(b.tele>0?-2:4,0);c.lineTo(10,14);c.stroke();
  if(b.cd<.5||b.tele>0){c.fillStyle='#c8c0b0';c.fillRect(0,-1,22,2);c.fillStyle='#8a8494';c.beginPath();c.moveTo(22,-3);c.lineTo(27,0);c.lineTo(22,3);c.fill();}
  c.restore();
  // two crew in Ostrander blue
  for(const s of [-1,1]){const a=b.a+Math.PI+s*.7,cx=x+Math.cos(a)*14,cy=y+Math.sin(a)*14,dz=b.stun>0;
    c.fillStyle=dz?'#4a5a64':'#2f6f84';circ(c,cx,cy,5);c.fill();ink(c,1);c.fillStyle='#e0b890';circ(c,cx,cy-1,2.6);c.fill();
    if(dz){c.fillStyle='#ffe0a0';c.font='7px serif';c.fillText('z',cx+4,cy-6-Math.sin(t*3)*2);}}
}
function drawGullsSit(c,f,t){
  const bird=spr('gull',g=>{const x=16,y=16;g.fillStyle='#e8ecf0';g.beginPath();g.ellipse(x,y,4,2.6,0,0,6.283);g.fill();g.strokeStyle=INK;g.lineWidth=.8;g.stroke();
    g.fillStyle='#8a929a';g.fillRect(x-3,y-1,4,1.4);g.fillStyle='#f0c040';g.fillRect(x+3.4,y-.6,2,1);});
  for(const b of f.birds)c.drawImage(bird,f.x+b.ox-16,f.y+b.oy+Math.sin(t*2+b.ph)*1.2-16,T,T);
}

/* ---------------- drawing: overlay (after characters) ---------------- */
const oRings=drawRings;
drawRings=function(){oRings();const s=G&&G.mis;if(!s)return;ctx.save();try{drawOver(s);}catch(e){console.error(e);}ctx.restore();};
function drawOver(s){VR=viewRect();M=s;
  const c=ctx,t=G.time;
  // the drain grates sit over Ashling while he crawls
  for(const d of s.ducts)for(const [x,y] of d.tiles){if(Math.abs(G.ash.x-C(x))<24&&Math.abs(G.ash.y-C(y))<24&&vis(C(x),C(y)))drawGrate(c,x*T,y*T,true,true);}
  for(const d of s.drops)if(d.st!=='down'){const x=C(d.x)-16,y=C(d.y);if(!vis(x,y,80))continue;
    if(d.st==='fall'){const k=1-d.t/.5;c.fillStyle='rgba(0,0,0,'+(.2+.4*k)+')';c.beginPath();c.ellipse(x,y+6,18+k*12,6+k*4,0,0,6.283);c.fill();}
    else if(!G.chand||!G.chand.length){/* engine chandelier is drawn elsewhere */}}
  if(s.dis&&s.dis.on)drawLivery(c,G.wren,t);
  if(s.dis&&s.dis.steward&&!s.dis.steward.dead){const g=s.dis.steward;if(vis(g.x,g.y)){c.fillStyle='#d8a84a';c.strokeStyle=INK;c.lineWidth=1;
    c.beginPath();c.arc(g.x,g.y-31,3.4,0,6.283);c.fill();c.stroke();c.fillRect(g.x-1,g.y-28,2,4);
    if(s.dis.on){c.strokeStyle='rgba(255,200,90,.35)';c.setLineDash([3,4]);circ(c,g.x,g.y,2.6*T);c.stroke();c.setLineDash([]);}}}
  for(const g of G.guards)if(g.mname&&vis(g.x,g.y)&&Math.hypot(g.x-G.wren.x,g.y-G.wren.y)<4*T){c.fillStyle='rgba(234,223,208,.75)';c.font='bold 8px '+(typeof HEAD!=='undefined'?HEAD:'serif');c.textAlign='center';c.fillText(g.mname,g.x,g.y-30);}
  if(s.air)drawAirOver(c,s.air,t);
  if(s.ch&&s.ch.rings&&s.ch.st!=='done')s.ch.rings.forEach((r,k)=>{const x=C(r[0]),y=C(r[1]);if(!vis(x,y,40))return;
    const nxt=k===s.ch.ri,past=k<s.ch.ri&&s.ch.st==='run';
    c.strokeStyle=past?'rgba(120,240,150,.25)':nxt?'rgba(160,220,255,'+(.7+.3*Math.sin(t*6))+')':'rgba(160,220,255,.28)';c.lineWidth=nxt?4:2;
    c.beginPath();c.ellipse(x,y,20,24,0,0,6.283);c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=1;c.beginPath();c.ellipse(x,y,16,20,0,0,6.283);c.stroke();
    if(nxt){c.fillStyle='rgba(220,240,255,.8)';c.font='bold 8px serif';c.textAlign='center';c.fillText(String(k+1),x,y+3);}});
  // Ashling's hold progress on his own interactions
  if(s.aT&&s.ahold>0){c.strokeStyle='#ff9a4a';c.lineWidth=3;c.beginPath();c.arc(s.aT.x,s.aT.y,17,-1.57,-1.57+6.28*Math.min(1,s.ahold/s.aT.need));c.stroke();}
  if(G.holdT&&G.holdT.kind==='mech'&&G.hold>0){c.strokeStyle='#f0b44c';c.lineWidth=3;c.beginPath();c.arc(G.holdT.x,G.holdT.y,17,-1.57,-1.57+6.28*Math.min(1,G.hold/G.holdT.need));c.stroke();}
}
function drawLivery(c,w,t){ // a red-and-gold Grell tabard and cap over Shiloh
  const x=w.x,y=w.y,bob=Math.sin(w.ph||0)*.6;
  c.save();c.translate(x,y+bob);c.scale(1.25,1.25);
  c.fillStyle='#8a1f28';c.beginPath();c.moveTo(-5,-9);c.lineTo(5,-9);c.lineTo(6.5,5);c.lineTo(-6.5,5);c.closePath();c.fill();
  c.strokeStyle=INK;c.lineWidth=.9;c.stroke();
  c.fillStyle='#d8a84a';c.fillRect(-.9,-9,1.8,14);c.fillRect(-6.5,3.6,13,1.4);
  c.fillStyle='#f0ead8';c.beginPath();c.ellipse(0,-17.5,5.2,2.2,0,Math.PI,0);c.fill();c.stroke();
  c.restore();
}
function drawAirOver(c,S,t){
  for(const w of S.wind){if(!vis(w.x+w.w/2,w.y+w.h/2,w.w))continue;
    const sp=Math.hypot(w.vx,w.vy),ux=w.vx/sp,uy=w.vy/sp,n=Math.round(w.w*w.h/(T*T)*.6);
    c.strokeStyle='rgba(220,240,255,.22)';c.lineWidth=1.2;c.beginPath();
    for(let i=0;i<n;i++){const k=((t*sp*.012+i*.618)%1),px=w.x+((i*97+(ux?k*w.w*ux*1.2:0))%w.w),py=w.y+((i*61+(uy?k*w.h*uy*1.2:0))%w.h);
      c.moveTo(px,py);c.lineTo(px+ux*16,py+uy*16+Math.sin(t*3+i)*1.5);}
    c.stroke();}
  for(const f of S.gulls)if(f.st==='fly'&&vis(f.x,f.y,120)){const k=18-f.t;for(const b of f.birds){const r=20+k*30,a=b.ph*1.25+k*.6,x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r*.6-k*8,fl=Math.sin(t*14+b.ph)*3;
    c.strokeStyle='#f0f2f6';c.lineWidth=1.4;c.beginPath();c.moveTo(x-5,y-fl);c.quadraticCurveTo(x-2,y-2,x,y);c.quadraticCurveTo(x+2,y-2,x+5,y-fl);c.stroke();}}
  for(const b of S.ball)if(b.tele>0&&vis(b.x,b.y,240)){c.strokeStyle='rgba(255,90,60,'+(.35+.5*(1-b.tele/.8))+')';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x+Math.cos(b.a)*7*T,b.y+Math.sin(b.a)*7*T);c.stroke();c.setLineDash([]);}
  for(const d of S.drakes)if(vis(d.x,d.y,60))drawDrake(c,d,t);
  for(const p of S.shots){if(p.k==='bolt'){c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle='#d8d0c0';c.fillRect(-12,-1,20,2);c.fillStyle='#8a8494';c.beginPath();c.moveTo(8,-3);c.lineTo(13,0);c.lineTo(8,3);c.fill();c.restore();}
    else{c.fillStyle='#ffd060';circ(c,p.x,p.y,4);c.fill();c.fillStyle='rgba(255,120,40,.5)';circ(c,p.x,p.y,7);c.fill();}}
}
function drawDrake(c,d,t){
  const dead=d.st==='dead';if(dead&&d.fall>1.4)return;
  const sc=dead?Math.max(.2,1-d.fall*.6):1,fl=Math.sin(d.ph)*(dead?.2:1);
  c.save();c.translate(d.x,d.y+(dead?d.fall*20:0));c.rotate(d.face+(dead?d.fall*4:0));c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(-4,16,14,5,0,0,6.283);c.fill();
  const body=d.hurt>0?'#c8d8d8':'#3e6a72',belly='#a8c8c0',wing='#2a4a54';
  // wings
  for(const s of [-1,1]){c.fillStyle=wing;c.beginPath();c.moveTo(2,s*2);c.quadraticCurveTo(-2,s*(12+fl*6),-12,s*(16+fl*7));c.quadraticCurveTo(-8,s*8,-10,s*3);c.closePath();c.fill();ink(c,1);
    c.strokeStyle='rgba(160,210,210,.35)';c.lineWidth=.8;c.beginPath();c.moveTo(1,s*2);c.lineTo(-11,s*(15+fl*6));c.stroke();}
  // tail
  c.strokeStyle=body;c.lineWidth=3;c.beginPath();c.moveTo(-8,0);c.quadraticCurveTo(-16,Math.sin(t*5+d.ph)*4,-22,Math.sin(t*5+d.ph+1)*5);c.stroke();
  // body and head
  c.fillStyle=body;c.beginPath();c.ellipse(-1,0,10,4.4,0,0,6.283);c.fill();ink(c,1.1);
  c.fillStyle=belly;c.beginPath();c.ellipse(0,1.2,7,1.8,0,0,6.283);c.fill();
  c.fillStyle=body;c.beginPath();c.moveTo(7,-3);c.lineTo(15,-1);c.lineTo(15,1.5);c.lineTo(7,3);c.closePath();c.fill();ink(c,1);
  c.fillStyle=d.st==='chase'?'#ff6a3a':'#e8f0a0';circ(c,11,-1.5,1.1);c.fill();
  c.restore();
  if(!dead&&d.tele>0){c.strokeStyle='rgba(255,130,50,'+(1-d.tele/.55)+')';c.lineWidth=1.6;circ(c,d.x,d.y,16+d.tele*20);c.stroke();}
  if(!dead&&d.st==='chase'){c.fillStyle='#ff5a4a';c.font='bold 12px serif';c.textAlign='center';c.fillText('!',d.x,d.y-20);}
  else if(!dead&&d.st==='search'){c.fillStyle='#ffd27a';c.font='bold 11px serif';c.textAlign='center';c.fillText('?',d.x,d.y-20);}
}

/* ---------------- HUD: livery state and trial timer ---------------- */
if(typeof drawHud==='function'){const oHud=drawHud;drawHud=function(){oHud();const s=G&&G.mis;if(!s||mode!=='play')return;ctx.save();try{hud(s);}catch(e){console.error(e);}ctx.restore();};}
function hud(s){
  const c=ctx,U=V.U||1,W=V.w,H=V.h;
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  const lines=[];
  if(s.dis&&s.dis.on)lines.push(['IN LIVERY'+(s.dis.run>.05?'  -  slow down!':''),s.dis.run>.05?'#ff9a6a':'#e8c060']);
  if(s.ch&&s.ch.st==='run')lines.push([s.ch.name.toUpperCase()+'  '+Math.max(0,s.ch.t).toFixed(1)+'s'+(s.ch.rings?'  '+s.ch.ri+'/'+s.ch.rings.length:''),'#9fe0b0']);
  if(!lines.length)return;
  const fs=Math.max(10,Math.round(11*U));c.font='bold '+fs+'px '+(typeof HEAD!=='undefined'?HEAD:'serif');c.textAlign='center';
  let y=Math.round(H*(V.coarse?.2:.16));
  for(const [txt,col] of lines){const w=c.measureText(txt).width+18;c.fillStyle='rgba(14,10,20,.78)';rr(c,W/2-w/2,y-fs,w,fs+8,5);c.fill();c.strokeStyle=col;c.lineWidth=1;rr(c,W/2-w/2,y-fs,w,fs+8,5);c.stroke();
    c.fillStyle=col;c.fillText(txt,W/2,y+1);y+=fs+12;}
}

window.MisA={init,step:dt=>{M=G.mis;step(dt);},target:(A,w)=>mechTarget(A,w),activate:t=>{M=G.mis;activate(t);},get M(){return G&&G.mis;}};
})();
