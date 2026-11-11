'use strict';
/* EMBERCROWN - missions 5 to 7 reworked (level index 4-6).
   Ironvale: a siege and escape. Perrin follows, waits, hides in crates and panics near fire; steam presses, slag
   channels, an ore lift and overpressured vents are both weapons and routes; freeing him starts a timed breakout.
   Dunmoor Marsh: a co-op time puzzle. Ashling's fire in one year changes the other, Shiloh can send Ashling across
   time alone, dance with masked guests to pass as one, and guards laid out at the ball never reach the war.
   The Candlemaker's Crown: an assault. A lamp-tower gauntlet, a sabotage of the candle supply (three choices),
   then the boss with falling censers and the Hallow bell.
   Everything hooks the engine's globals by wrapping them, so game.js is untouched. Test hook: window.MisB. */
(function(){
const M={};
const INK='#140c10';
const ctr=(x,y)=>({x:x*T+16,y:y*T+16});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const S=()=>G&&G.mb;
const mod=()=>{const s=S();return s?M[s.lv]:null;};
const say_=(w,t,a)=>{try{say(w,t,a);}catch(e){}};
const snd=k=>{try{Aud.S[k]&&Aud.S[k]();}catch(e){}};
function tg(ref,label,need,x,y,fn,r){return{kind:'mb',ref,label,need:need*(typeof quickMul==='function'?quickMul():1),x,y,fn,r:r||38};}
// is Ashling's flame on this point right now?
function fireAt(x,y,extra){
  if(!G.fireOn||G.active!=='ash')return false;
  const a=G.ash,r=(G.fireRange||70)+(extra||0),dx=x-a.x,dy=y-a.y,d=Math.hypot(dx,dy);
  return d<r&&(d<18||angDiff(Math.atan2(dy,dx),a.face)<.65)&&los(a.x,a.y,x,y);
}
const KINDS={hound:{spd:1.35,kr:.7,half:1},archer:{spd:.9,kr:1.45,half:.34},brute:{spd:.85,kr:1,half:.55}};
function mkGuard(wp,kind){
  const K=KINDS[kind]||{spd:1,kr:1,half:.62},p=wp.map(q=>[q[0]*T+16,q[1]*T+16]);
  return{x:p[0][0],y:p[0][1],wp:p,i:p.length>1?1:0,face:p.length>1?Math.atan2(p[1][1]-p[0][1],p[1][0]-p[0][0]):0,stun:0,pause:0,lure:null,back:null,ret:false,
    seeing:false,spd:56*K.spd,rm:1,kind:kind||'guard',kr:K.kr,half:K.half,ph:Math.random()*6,was:false,seen:null,bang:0,quest:0};
}
function moving(){return !!(keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright||touch.jx||touch.jy);}
function stunG(g,t,txt){if(g.boss||g.spin)return;g.stun=Math.max(g.stun,t);G.st.stuns++;floatText(g.x,g.y-22,txt,'#ffd27a',11);}
// a tile path for followers (BFS); pass(tx,ty) says which tiles may be walked
function path(fx,fy,tx,ty,pass){
  const W=G.gw,H=G.gh,prev=new Int32Array(W*H).fill(-1),q=[fy*W+fx];prev[fy*W+fx]=fy*W+fx;
  for(let h=0;h<q.length&&h<900;h++){
    const c=q[h],cx=c%W,cy=(c/W)|0;if(cx===tx&&cy===ty)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy,n=ny*W+nx;
      if(nx<0||ny<0||nx>=W||ny>=H||prev[n]>=0||!pass(nx,ny))continue;prev[n]=c;q.push(n);}
  }
  const end=ty*W+tx;if(prev[end]<0)return null;
  const out=[];for(let c=end;c!==fy*W+fx;c=prev[c])out.push([c%W,(c/W)|0]);
  return out.reverse();
}

/* =====================================================================
   IRONVALE (4): siege, rescue and breakout
   ===================================================================== */
const IV={
  presses:[[6,8,5,9],[6,11,5,12],[11,5,12,4]],
  chanA:[[1,7],[2,7],[3,7],[4,7],[5,7]],chanB:[[7,13],[8,13],[9,13],[10,13],[11,13],[12,13]],sluice:[2,10],
  liftA:[23,4],liftB:[23,10],hides:[[19,2],[13,7],[22,9],[4,10],[4,3]],winch:[3,1],
  rein:[[[7,6],[16,6]],[[7,8],[7,12]]],reinExtra:[[2,12],[2,8]]
};
M[4]={
  init(g){
    const s=g.mb;
    s.press=IV.presses.map((p,k)=>({x:p[0],y:p[1],lx:p[2],ly:p[3],ph:k*1.7,h:1,man:0,force:0,cd:0,down:false,warn:false}));
    s.chan={flow:'A',heat:{A:1,B:0},surge:0,cd:0};
    s.lift={at:'a',cd:0,anim:0,dest:null};
    s.per={st:'none',t:0,path:null,pt:0,calm:0,whine:0,hideT:0};
    s.vent={};s.bo=null;s.hp=null;
  },
  pre(g){g.mb.hp=g.host&&g.host.on?{x:g.host.x,y:g.host.y}:null;},
  restore(g){const s=g.mb;if(s.hp&&g.host&&g.host.on){g.host.x=s.hp.x;g.host.y=s.hp.y;}},
  post(g,dt){
    const s=g.mb,steamOff=G.ventOff>0,period=s.bo?3.6:5;
    for(const p of s.press)stepPress(p,dt,period,steamOff);
    stepChannel(dt);stepVentSteam(dt);
    if(s.lift.cd>0)s.lift.cd-=dt;if(s.lift.anim>0)s.lift.anim-=dt;
    stepPerrin(dt);stepBreakout(dt);
  },
  targets(A){
    const s=G.mb,L=[];if(A!==G.wren)return L;
    for(const p of s.press)if(!(p.man>0)&&p.cd<=0&&!(G.ventOff>0)){const c=ctr(p.lx,p.ly);L.push(tg(p,'Trip the press',.35,c.x,c.y,()=>tripPress(p),34));}
    const sl=ctr(...IV.sluice);if(s.chan.cd<=0)L.push(tg(s.chan,s.chan.flow==='A'?'Divert the slag south':'Divert the slag north',.8,sl.x,sl.y,divert,34));
    if(s.lift.cd<=0)for(const k of ['a','b']){const c=ctr(...(k==='a'?IV.liftA:IV.liftB));L.push(tg(s.lift,'Ride the ore lift',.5,c.x,c.y,()=>ride(k),26));}
    const h=G.host,P=s.per;
    if(freed()){
      const hp=P.st==='hidden'?P.spot:h;
      if(P.st==='cower'||P.st==='panic')L.push(tg(P,'Calm Perrin',.5,hp.x,hp.y,calmPerrin,40));
      else if(P.st==='follow')L.push(tg(P,'Tell Perrin to wait',.3,hp.x,hp.y,()=>setWait(true),36));
      else L.push(tg(P,P.st==='hidden'?'Call Perrin out':'Tell Perrin to follow',.3,hp.x,hp.y,()=>setWait(false),36));
    }
    if(s.bo&&s.bo.lock&&!s.bo.raised){const c=ctr(...IV.winch);L.push(tg(s.bo,'Raise the portcullis',3,c.x,c.y,raiseGate,36));}
    return L;
  },
  lines(){
    const s=G.mb,L=[];
    L.push({text:'Divert the slag for Perrin (sluice)',done:s.chan.flow==='B'});
    if(s.bo){
      if(!s.bo.lock)L.push({text:'Lockdown in '+Math.ceil(s.bo.t)+'s',done:false});
      else L.push({text:'Raise the yard portcullis (winch)',done:!!s.bo.raised});
      L.push({text:'Perrin: '+({follow:'following',wait:'waiting',hidden:'hidden',panic:'PANICKING',cower:'cowering'}[s.per.st]||'...'),done:s.per.st!=='panic'&&s.per.st!=='cower'});
    }
    return L;
  },
  drawFloor(c){drawIronFloor(c);},
  drawTop(c){drawIronTop(c);}
};
function freed(){const h=G.items.find(i=>i.type==='H');return !!(h&&h.done);}
function hotTile(tx,ty){
  const s=G.mb;if(!s||!s.chan)return false;
  for(const k of ['A','B'])if(s.chan.heat[k]>.35)for(const t of (k==='A'?IV.chanA:IV.chanB))if(t[0]===tx&&t[1]===ty)return true;
  return false;
}
function pressDanger(tx,ty){for(const p of G.mb.press)if(p.x===tx&&p.y===ty&&(p.down||p.warn||p.man>0))return true;return false;}
function stepPress(p,dt,period,off){
  p.cd=Math.max(0,p.cd-dt);
  const was=p.down;
  if(p.man>0){p.man-=dt;p.warn=true;p.down=false;if(p.man<=0){p.man=0;p.force=.5;}}
  else if(p.force>0){p.force-=dt;p.down=true;p.warn=false;p.manual=true;}
  else if(off){p.down=false;p.warn=false;p.manual=false;}
  else{const c=(G.time+p.ph)%period;p.warn=c>period-1.05&&c<period-.35;p.down=c>=period-.35;p.manual=false;}
  if(p.down&&!was)slam(p);
  const tg_=p.down?0:p.warn?.72:1;p.h+=(tg_-p.h)*Math.min(1,dt*(p.down?40:6));
  if(p.down&&p.manual){const c=ctr(p.x,p.y);for(const g of G.guards)if(!g.boss&&!g.spin&&g.stun<=0&&Math.hypot(g.x-c.x,g.y-c.y)<20)stunG(g,10,'CRUSHED');}
  if(p.down){const c=ctr(p.x,p.y);
    for(const ch of [G.wren,G.ash])if(ch&&(ch!==G.ash||G.ash.on)&&!ch.hidden&&dist(ch,c)<15){
      if(hurtTeam(1,c.x,c.y,'press')&&ch===G.wren&&!G.pressSaid){G.pressSaid=true;say_('Ashling','Watch the hammers! They do not care who you are.');}}}
}
function slam(p){
  const c=ctr(p.x,p.y);
  snd('slam');burst(c.x,c.y+6,12,'#8a7a70',80,.6,4,{k:'smoke',gr:6});
  if(Math.hypot(c.x-act().x,c.y-act().y)<7*T)shake(p.manual?7:3);
  if(p.manual){
    let hit=0;for(const g of G.guards)if(!g.boss&&!g.spin&&Math.hypot(g.x-c.x,g.y-c.y)<22){stunG(g,10,'CRUSHED');hit++;}
    for(const f of G.foes||[])if(f.state!=='dead'&&Math.hypot(f.x-c.x,f.y-c.y)<24&&typeof damageFoe==='function')damageFoe(f,4,{stagger:true,sx:c.x,sy:c.y});
    lureNear(c.x,c.y,5*T,true);
    if(hit)say_('Ashling','Flat. Very flat.');
  }
  const h=G.host;if(freed()&&h.on&&Math.hypot(h.x-c.x,h.y-c.y)<1.6*T)panic(c);
}
function act(){return G.active==='wren'?G.wren:G.ash;}
function tripPress(p){p.man=.35;p.cd=4;snd('wind');}
function divert(){
  const s=G.mb,ch=s.chan;ch.flow=ch.flow==='A'?'B':'A';ch.surge=1.2;ch.cd=3;
  snd('gate');shake(4);
  const tiles=ch.flow==='A'?IV.chanA:IV.chanB;
  for(const t of tiles){const c=ctr(t[0],t[1]);burst(c.x,c.y,6,'#ffb040',90,.6,2.4,{add:true,g:-30});}
  for(const g of G.guards)for(const t of tiles)if(Math.floor(g.x/T)===t[0]&&Math.floor(g.y/T)===t[1]){stunG(g,9,'SCALDED');break;}
  lureNear(ctr(...IV.sluice).x,ctr(...IV.sluice).y,4*T,true);
  say_('Shiloh',ch.flow==='B'?'The slag runs south. The yard trough will cool.':'Back north. The yard is a river again.');
}
function stepChannel(dt){
  const ch=G.mb.chan;ch.cd=Math.max(0,ch.cd-dt);ch.surge=Math.max(0,ch.surge-dt);
  for(const k of ['A','B']){if(ch.flow===k)ch.heat[k]=Math.min(1,ch.heat[k]+dt*2.5);else ch.heat[k]=Math.max(0,ch.heat[k]-dt/1.6);}
  const w=G.wren;
  if(!w.hidden&&hotTile(Math.floor(w.x/T),Math.floor(w.y/T))){
    if(hurtTeam(1,w.x,w.y-20,'slag')){w.ky=(w.ky||0)-120;if(!G.slagSaid){G.slagSaid=true;say_('Shiloh','Molten slag. Ashling, I am not you.');}}
  }
}
function stepVentSteam(dt){
  const s=G.mb;
  for(const v of G.vents){
    const k=v.x+','+v.y,c=ctr(v.x,v.y);s.vent[k]=s.vent[k]||{p:0,cd:0};const st=s.vent[k];
    st.cd=Math.max(0,st.cd-dt);
    if(!v.on&&st.cd<=0&&fireAt(c.x,c.y)){st.p+=dt;if(st.p>.7){st.p=0;st.cd=9;
      G.smoke.push({x:c.x,y:c.y,r:66,t:5.5,t0:5.5});snd('smoke');burst(c.x,c.y,18,'#e8e8f0',70,1.2,7,{k:'smoke',gr:12,dr:1.2});
      floatText(c.x,c.y-18,'STEAM','#e8eef8',11);if(!G.steamSaid){G.steamSaid=true;say_('Ashling','Overheated it. Instant fog. You are welcome.');}}}
    else st.p=Math.max(0,st.p-dt);
  }
}
function ride(from){
  const s=G.mb,L=s.lift,a=ctr(...IV.liftA),b=ctr(...IV.liftB),src=from==='a'?a:b,dst=from==='a'?b:a,w=G.wren;
  L.cd=4;L.anim=1;L.dest=dst;snd('gate');shake(4);
  const mv=o=>{o.x=dst.x+(o.x-src.x)*.4;o.y=dst.y+(o.y-src.y)*.4;unstick(o);};
  G.rings.push({x:src.x,y:src.y,t:.5,r:40,c:'200,170,140'});
  if(G.ash.on&&Math.hypot(G.ash.x-src.x,G.ash.y-src.y)<3*T)mv(G.ash);
  const h=G.host,P=s.per;if(freed()&&h.on&&P.st==='follow'&&Math.hypot(h.x-src.x,h.y-src.y)<3*T){mv(h);s.hp={x:h.x,y:h.y};}
  w.x=dst.x;w.y=dst.y;
  for(const g of G.guards)if(!g.boss&&!g.spin&&Math.hypot(g.x-dst.x,g.y-dst.y)<26){stunG(g,9,'CRUSHED');g.x+=20;}
  G.rings.push({x:dst.x,y:dst.y,t:.6,r:50,c:'255,190,120'});burst(dst.x,dst.y,16,'#8a7a70',90,.7,4,{k:'smoke',gr:6});
  lureNear(src.x,src.y,6*T,true);lureNear(dst.x,dst.y,6*T,true);
}
/* ----- Perrin ----- */
function perrinPass(tx,ty){return !solidTile(tx,ty)&&!propTile(tx,ty)&&!hotTile(tx,ty)&&!pressDanger(tx,ty);}
function setWait(on){
  const P=G.mb.per,h=G.host;
  if(on){P.st='wait';P.hideT=0;say_('Perrin',['Waiting. Quietly. I can do quietly.','Here? Fine. Here.'][Math.random()*2|0]);}
  else{if(P.st==='hidden'){h.on=true;h.x=P.spot.x;h.y=P.spot.y;G.mb.hp={x:h.x,y:h.y};}P.st='follow';P.path=null;say_('Perrin','Right behind you.');}
}
function calmPerrin(){const P=G.mb.per;P.st='follow';P.calm=2.5;P.path=null;say_('Shiloh','Breathe. Look at me, not the fire.');say_('Perrin','Yes. Sorry. Yes.',2.2);}
function panic(src){
  const P=G.mb.per,h=G.host;if(P.st==='panic'||P.st==='cower'||P.st==='hidden'||P.calm>0)return;
  P.st='panic';P.t=1.3;P.src={x:src.x,y:src.y};
  floatText(h.x,h.y-22,'!!','#ff8a5a',15);snd('alert');lureNear(h.x,h.y,4.5*T,true);
  say_('Perrin',['Fire! FIRE! Not again!','I cannot, I cannot, not the fire!','Get it away from me!'][Math.random()*3|0]);
  if(!G.mb.panicSaid){G.mb.panicSaid=true;say_('Shiloh','He was burned in the cells. Keep him clear of flame, or hold E to calm him.',2.6);}
}
function fireNear(h){
  for(const v of G.vents)if(v.on&&Math.hypot(v.x*T+16-h.x,v.y*T+16-h.y)<1.5*T)return ctr(v.x,v.y);
  const tx=Math.floor(h.x/T),ty=Math.floor(h.y/T);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(hotTile(tx+dx,ty+dy)&&Math.hypot((tx+dx)*T+16-h.x,(ty+dy)*T+16-h.y)<1.05*T)return ctr(tx+dx,ty+dy);
  if(fireAt(h.x,h.y,10))return{x:G.ash.x,y:G.ash.y};
  return null;
}
function stepPerrin(dt){
  const s=G.mb,P=s.per,h=G.host,w=G.wren;
  if(!freed())return;
  if(P.st==='none'){P.st='follow';}
  if(P.calm>0)P.calm-=dt;if(P.whine>0)P.whine-=dt;
  if(P.st==='follow'||P.st==='wait'){const src=fireNear(h);if(src)panic(src);}
  const step=(tx,ty,spd)=>{const d=Math.hypot(tx-h.x,ty-h.y);if(d<1)return true;const k=Math.min(d,spd*dt)/d,nx=h.x+(tx-h.x)*k,ny=h.y+(ty-h.y)*k;
    h.face=Math.atan2(ty-h.y,tx-h.x);h.ph+=spd*dt*.2;if(!blocked(nx,h.y,7))h.x=nx;if(!blocked(h.x,ny,7))h.y=ny;return d<3;};
  if(P.st==='follow'){
    const d=dist(h,w);
    if(d>30){
      P.pt-=dt;const wt=[Math.floor(w.x/T),Math.floor(w.y/T)];
      if(P.pt<=0||!P.path){P.pt=.35;P.path=path(Math.floor(h.x/T),Math.floor(h.y/T),wt[0],wt[1],perrinPass);}
      if(P.path&&P.path.length){
        const n=P.path[0],c=P.path.length===1?{x:w.x,y:w.y}:ctr(n[0],n[1]);
        if(step(c.x,c.y,d>3*T?100:82)&&P.path.length>1)P.path.shift();
      } else if(d>2.5*T&&P.whine<=0){P.whine=7;say_('Perrin',hotTile(Math.floor(h.x/T),Math.floor(h.y/T)+0)?'I am not walking through that.':'I cannot get through! Find another way!');}
    }
  } else if(P.st==='panic'){
    P.t-=dt;const a=Math.atan2(h.y-P.src.y,h.x-P.src.x);step(h.x+Math.cos(a)*40,h.y+Math.sin(a)*40,118);
    if(P.t<=0){P.st='cower';P.t=3.2;}
  } else if(P.st==='cower'){P.t-=dt;if(P.t<=0){P.st='follow';P.calm=2;}}
  else if(P.st==='wait'){
    let spot=null;for(const q of IV.hides){const c=ctr(q[0],q[1]);if(dist(c,h)<30){spot=c;break;}}
    if(spot){P.hideT+=dt;if(P.hideT>.5){P.st='hidden';P.spot=spot;h.on=false;h.x=spot.x;h.y=spot.y;floatText(spot.x,spot.y-20,'HIDDEN','#9fd8ff',10);}}
  }
  if(P.st!=='hidden')h.on=true;
}
function stepBreakout(dt){
  const s=G.mb;
  if(freed()&&!s.bo){
    const t=[95,80,65][typeof diff==='number'?diff:1]||80;
    s.bo={t,spawn:4.5,lock:false,raised:false};
    toast('BREAKOUT',t+' seconds before Kest locks the yard.','#ff7a4a');snd('alert');
    say_('Shiloh','The cell bell. They know. Move, and keep him away from the fire.',3.2);
  }
  const b=s.bo;if(!b)return;
  if(b.spawn>0){b.spawn-=dt;if(b.spawn<=0)reinforce();}
  if(!b.lock){b.t-=dt;if(b.t<=0)lockdown();}
}
function reinforce(){
  const B=G.items.find(i=>i.type==='B'),burnt=!!(B&&B.done),list=IV.rein.slice(0,burnt?1:2);
  if(!burnt)list.push(IV.reinExtra);
  for(const wp of list){const g=mkGuard(wp,'guard');g.rein=true;G.guards.push(g);G.rings.push({x:g.x,y:g.y,t:.8,r:60,c:'255,120,60'});}
  toast('Kest musters',burnt?'The beacon is dark: one squad answers.':'The muster beacon still burns: '+list.length+' squads answer.','#ff9a6a');
  G.mb.reinN=list.length;
}
function lockdown(){
  const b=G.mb.bo;b.lock=true;b.t=0;
  G.doors['1,1']={x:1,y:1,open:false,gate:true};
  for(const o of [G.wren,G.ash,G.host])if(o)unstick(o);
  for(const g of G.guards)if(!g.boss&&!g.spin){g.spd*=1.12;g.rm=(g.rm||1)*1.08;}
  toast('LOCKDOWN','The yard portcullis drops. Raise it at the winch.','#ff5a4a');snd('gate');shake(9);
  say_('Ashling','That was the gate. The big one. With spikes.');
}
function raiseGate(){
  const b=G.mb.bo,d=G.doors['1,1'];b.raised=true;if(d)d.open=true;
  const c=ctr(...IV.winch);lureNear(c.x,c.y,8*T,true);snd('gate');shake(5);
  toast('Portcullis raised','The yard is open. Go.','#7be08a');
}
/* ----- Ironvale drawing ----- */
function chanTiles(c,tiles,heat,t){
  for(const [x,y] of tiles){
    const px=x*T,py=y*T;
    c.fillStyle='#1c1412';c.fillRect(px+1,py+8,T-2,T-16);
    c.fillStyle='#3a2c26';c.fillRect(px+1,py+6,T-2,3);c.fillRect(px+1,py+T-9,T-2,3);
    if(heat>.02){
      c.globalAlpha=Math.min(1,heat*1.2);
      const g=c.createLinearGradient(0,py+9,0,py+T-9);g.addColorStop(0,'#ff6a1a');g.addColorStop(.5,'#ffd060');g.addColorStop(1,'#ff6a1a');
      c.fillStyle=g;c.fillRect(px+1,py+9,T-2,T-18);
      c.fillStyle='rgba(120,30,10,.55)';
      for(let i=0;i<3;i++){const o=((t*28+i*13+x*7)%T);c.fillRect(px+o,py+11+i*3,6,2);}
      c.globalAlpha=1;
    } else {c.fillStyle='#2e2622';c.fillRect(px+1,py+9,T-2,T-18);c.strokeStyle='rgba(255,90,40,.25)';c.lineWidth=1;c.beginPath();c.moveTo(px+4,py+13);c.lineTo(px+14,py+17);c.lineTo(px+26,py+12);c.stroke();}
    c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(px+1.5,py+6.5,T-3,T-13);
  }
}
function drawLever(c,x,y,on,col){
  shadowAt(x+1,y+7,7,3,.3);
  c.fillStyle='#3a3036';rr(c,x-6,y,12,7,2);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();
  c.strokeStyle='#8a8f9a';c.lineWidth=2.2;c.beginPath();c.moveTo(x,y+3);c.lineTo(x+(on?7:-7),y-9);c.stroke();
  c.fillStyle=col||'#b3262c';circ(c,x+(on?7:-7),y-9,2.8);c.fill();c.strokeStyle=INK;c.lineWidth=.8;c.stroke();
}
function drawPress(c,p,t){
  const cx=p.x*T+16,cy=p.y*T+16,lift=p.h*16;
  // floor plate with hazard chevrons
  c.fillStyle='#2a2224';c.fillRect(cx-14,cy-14,28,28);
  c.fillStyle=p.warn?'rgba(255,80,40,'+(.35+.3*Math.sin(t*20))+')':'rgba(230,180,60,.28)';
  for(let i=0;i<4;i++){c.fillRect(cx-14+i*8,cy-14,4,3);c.fillRect(cx-14+i*8,cy+11,4,3);}
  // guide rails
  c.fillStyle='#4a4044';c.fillRect(cx-16,cy-22,3,30);c.fillRect(cx+13,cy-22,3,30);
  // shadow of the hammer on the floor: tighter as it falls
  c.fillStyle='rgba(0,0,0,'+(.45-.25*p.h)+')';ell(c,cx,cy+2,13-p.h*3,9-p.h*2);c.fill();
  // the hammer head
  const hy=cy-lift-4;
  const g=c.createLinearGradient(cx-13,0,cx+13,0);g.addColorStop(0,'#3a3438');g.addColorStop(.45,'#7a727a');g.addColorStop(1,'#2a2428');
  c.fillStyle=g;rr(c,cx-13,hy-10,26,16,3);c.fill();
  c.fillStyle='#9a929a';c.fillRect(cx-12,hy-10,24,2);
  c.fillStyle=p.warn||p.down?'#ff7a3a':'#5a5056';c.fillRect(cx-11,hy+3,22,2);
  c.strokeStyle=INK;c.lineWidth=1.2;rr(c,cx-13,hy-10,26,16,3);c.stroke();
  c.fillStyle='#5a5258';c.fillRect(cx-3,hy-26,6,16);c.strokeStyle=INK;c.strokeRect(cx-3,hy-26,6,16);
  if(p.down){c.fillStyle='rgba(255,220,160,.5)';c.fillRect(cx-15,cy+5,30,2);}
}
function drawCrate(c,x,y,peek){
  shadowAt(x+2,y+9,14,6,.35);
  c.fillStyle='#5a3e28';rr(c,x-13,y-12,26,22,2);c.fill();
  c.fillStyle='#6e4c32';c.fillRect(x-12,y-11,24,4);
  c.strokeStyle='#3a2616';c.lineWidth=1.4;c.beginPath();c.moveTo(x-12,y-6);c.lineTo(x+12,y+8);c.moveTo(x-12,y+1);c.lineTo(x+12,y+1);c.stroke();
  c.strokeStyle=INK;c.lineWidth=1.2;rr(c,x-13,y-12,26,22,2);c.stroke();
  if(peek){c.fillStyle='#0c0808';c.fillRect(x-8,y-14,16,4);c.fillStyle='#f0e0b0';circ(c,x-3,y-12,1.2);c.fill();circ(c,x+3,y-12,1.2);c.fill();}
}
function drawIronFloor(c){
  const s=G.mb,t=G.time;
  chanTiles(c,IV.chanA,s.chan.heat.A,t);chanTiles(c,IV.chanB,s.chan.heat.B,t);
  if(Q.tier<2){c.globalCompositeOperation='lighter';
    for(const k of ['A','B'])if(s.chan.heat[k]>.1)for(const [x,y] of (k==='A'?IV.chanA:IV.chanB)){c.fillStyle='rgba(255,110,40,'+(.08*s.chan.heat[k])+')';ell(c,x*T+16,y*T+16,26,20);c.fill();}
    c.globalCompositeOperation='source-over';}
  const sl=ctr(...IV.sluice);drawLever(c,sl.x,sl.y,s.chan.flow==='B','#ff9a3a');
  for(const p of s.press){const l=ctr(p.lx,p.ly);drawLever(c,l.x,l.y,p.man>0||p.force>0,'#cfd6e6');}
  for(const k of ['a','b']){const q=ctr(...(k==='a'?IV.liftA:IV.liftB));
    c.fillStyle='#2a2428';c.fillRect(q.x-15,q.y-15,30,30);c.strokeStyle='#8a7050';c.lineWidth=2;c.strokeRect(q.x-13,q.y-13,26,26);
    c.strokeStyle='rgba(138,112,80,.6)';c.lineWidth=1;c.beginPath();c.moveTo(q.x-13,q.y-13);c.lineTo(q.x+13,q.y+13);c.moveTo(q.x+13,q.y-13);c.lineTo(q.x-13,q.y+13);c.stroke();
    c.strokeStyle=INK;c.strokeRect(q.x-15.5,q.y-15.5,31,31);
    if(s.lift.anim>0&&s.lift.dest&&s.lift.dest.x===q.x&&s.lift.dest.y===q.y){const k2=s.lift.anim;c.strokeStyle='rgba(255,200,130,'+k2+')';c.lineWidth=3;c.strokeRect(q.x-15-8*k2,q.y-15-8*k2,30+16*k2,30+16*k2);}
  }
  const P=s.per;
  for(const q of IV.hides){const cc=ctr(q[0],q[1]);drawCrate(c,cc.x,cc.y,P.st==='hidden'&&P.spot&&P.spot.x===cc.x&&P.spot.y===cc.y);}
  if(s.bo&&s.bo.lock){const wc=ctr(...IV.winch);c.fillStyle='#4a4044';circ(c,wc.x,wc.y,9);c.fill();c.strokeStyle='#cfd6e6';c.lineWidth=2;
    for(let i=0;i<4;i++){const a=i*1.57+(s.bo.raised?0:t*.5);c.beginPath();c.moveTo(wc.x,wc.y);c.lineTo(wc.x+Math.cos(a)*9,wc.y+Math.sin(a)*9);c.stroke();}
    c.strokeStyle=INK;c.lineWidth=1;circ(c,wc.x,wc.y,9);c.stroke();}
  for(const p of s.press)drawPress(c,p,t);
}
function drawIronTop(c){
  const s=G.mb,P=s.per,h=G.host;
  if(freed()&&h.on&&(P.st==='panic'||P.st==='cower')){c.font='bold 10px '+HEAD;c.textAlign='center';c.fillStyle=P.st==='panic'?'#ff8a5a':'#ffd27a';c.fillText(P.st==='panic'?'PANIC':'COWERING',h.x,h.y-24);}
  else if(freed()&&h.on&&P.st==='wait'){c.font='bold 8px '+HEAD;c.textAlign='center';c.fillStyle='#cfd6e6';c.fillText('WAITING',h.x,h.y-22);}
  if(s.bo&&!s.bo.lock&&!G.wren.hidden){const k=s.bo.t;c.font='bold 9px '+HEAD;c.textAlign='center';c.fillStyle=k<15?'#ff6a4a':'#ffd27a';c.fillText('LOCKDOWN '+Math.ceil(k),G.wren.x,G.wren.y-30);}
}

/* =====================================================================
   DUNMOOR MARSH (5): two years, two hands
   ===================================================================== */
const DM={rafter:[20,7],clock:[12,7],pocket:[[10,7],[11,8],[12,8],[13,8]],east:[21,6]};
M[5]={
  init(g){const s=g.mb;s.rafter={p:0,burnt:false};s.clock={p:0,burnt:false,struck:false,strikeT:0};s.dance=null;s.dcd=0;s.anchor=null;s.acd=0;s.ko=0;s.hop=null;s.wasDash=false;},
  pre(g){
    const s=g.mb;
    if(s.dance){s.rm0=g.rangeMul;s.rmSt=g.state;g.rangeMul*=.42;}
    if(s.anchor){s.realW=g.wren;g.wren=DUMMY;}
  },
  restore(g){const s=g.mb;if(s.rm0!=null){if(g.state===s.rmSt)g.rangeMul=s.rm0;s.rm0=null;}if(s.realW){g.wren=s.realW;s.realW=null;}},
  post(g,dt){
    const s=g.mb;
    if(s.dcd>0)s.dcd-=dt;if(s.acd>0)s.acd-=dt;
    // Ashling's fire on the rotten rafter (ball) and the stopped clock (ruins)
    const rc=ctr(...DM.rafter),cc=ctr(...DM.clock);
    if(G.state==='ball'&&!s.rafter.burnt){if(fireAt(rc.x,rc.y)){s.rafter.p+=dt;if(Math.random()<dt*14)pt(rc.x+rrand(-8,8),rc.y-6,0,-20,.4,2,'#ffb060',{add:true});if(s.rafter.p>1){s.rafter.burnt=true;snd('crack');burst(rc.x,rc.y,22,'#ffb040',100,.8,3,{add:true});
      toast('The rafter smoulders','Three years on, it will have fallen.','#ffb070');say_('Ashling','That beam is charcoal now. Give it three years.');}}else s.rafter.p=Math.max(0,s.rafter.p-dt*.5);}
    if(G.state==='ruin'&&!s.clock.burnt){if(fireAt(cc.x,cc.y)){s.clock.p+=dt;if(s.clock.p>1){s.clock.burnt=true;snd('toll');burst(cc.x,cc.y,26,'#ffd27a',110,.9,3,{add:true});
      toast('The clock melts','Its hands fuse at midnight. The ball will hear it strike.','#ffd27a');say_('Ashling','I melted time. Is that allowed?');}}else s.clock.p=Math.max(0,s.clock.p-dt*.5);}
    stepHop(dt);stepDance(dt);stepAnchor(dt);stepClock(dt);
  },
  shift(toRuin){
    const s=G.mb;
    if(toRuin){
      for(const [x,y] of DM.pocket)G.grid[y][x]='#';
      if(!s.rafter.burnt){G.grid[DM.east[1]][DM.east[0]]='#';}
      for(const o of [G.wren,G.ash])if(o&&!o.hidden)unstick(o);
      if(!s.rafter.burnt&&!G.planted&&!s.sealSaid){s.sealSaid=true;say_('Shiloh','The throne room is sealed. In the ball, something must be weakened first: a rafter, or the treaty.',2.4);}
      // guards laid out at the ball never reach the war
      let n=0;for(const g of G.otherGuards)if(g.stun>0&&!g.mbKO){g.mbKO=true;if(s.ko<2&&G.guards.length>1){
        let bi=0,bd=-1;G.guards.forEach((x,k)=>{const d=Math.hypot(x.x-G.wren.x,x.y-G.wren.y);if(d>bd&&!x.boss){bd=d;bi=k;}});
        G.guards.splice(bi,1);s.ko++;n++;}}
      if(n)toast('One fewer veteran','The guard you laid out tonight never made it to the war.','#cfd6e6');
      G.dirty=true;
    } else if(s.clock.burnt&&!s.clock.struck){
      s.clock.struck=true;s.clock.strikeT=10;snd('toll');shake(6);
      toast('Midnight','The great clock strikes. Every eye turns to the dance floor.','#ffd27a');
      say_('Shiloh','Midnight, three years early. Go.',1.4);
    }
  },
  targets(A){
    const s=G.mb,L=[];if(A!==G.wren||s.anchor)return L;
    if(G.state==='ball'&&!s.dance&&s.dcd<=0&&G.guests){let best=null,bd=30;for(const q of G.guests){const d=dist(q,A);if(d<bd){bd=d;best=q;}}
      if(best)L.push(tg(best,"Take a dancer's arm",.4,best.x,best.y,()=>startDance(best),30));}
    if(G.ash.on&&s.acd<=0)for(const p of G.peds)L.push(tg(p,'Send Ashling across time',.6,p.x,p.y,()=>startAnchor(p),40));
    return L;
  },
  lines(){
    const s=G.mb,L=[];
    L.push({text:'Ball: Ashling burns the rotten rafter',done:s.rafter.burnt});
    L.push({text:'Ruins: Ashling melts the great clock',done:s.clock.burnt});
    if(s.dance)L.push({text:'Dancing (disguised) '+Math.ceil(s.dance.t)+'s',done:false});
    if(s.anchor)L.push({text:'Ashling across time '+Math.ceil(s.anchor.t)+'s',done:false});
    return L;
  },
  drawFloor(c){drawDunFloor(c);},
  drawTop(c){drawDunTop(c);}
};
const DUMMY={get x(){return -9000;},set x(v){},get y(){return -9000;},set y(v){},face:0,ph:0,hidden:true,vx:0,vy:0};
function startDance(q){const s=G.mb;s.dance={g:q,t:12,side:Math.random()<.5?1:-1};snd('swap');floatText(G.wren.x,G.wren.y-22,'DISGUISED','#e8f4ff',11);
  if(!s.danceSaid){s.danceSaid=true;say_('Shiloh','Arm in arm with a stranger. Guards see two masks, not one thief. Move and the dance ends.');}}
function endDance(why){const s=G.mb;if(!s.dance)return;s.dance=null;s.dcd=4;if(why)floatText(G.wren.x,G.wren.y-22,why,'#cfd6e6',10);}
function stepDance(dt){
  const s=G.mb,d=s.dance;if(!d)return;
  if(G.state!=='ball'||G.active!=='wren'){endDance('');return;}
  if(moving()&&d.t<11.7){endDance('SLIPPED AWAY');return;}
  d.t-=dt;if(d.t<=0){endDance('THE DANCE ENDS');return;}
  const q=d.g,a=Math.atan2(q.y-(q.py||q.y),q.x-(q.px||q.x))+Math.PI/2*d.side,nx=q.x+Math.cos(a)*12,ny=q.y+Math.sin(a)*12;
  q.px=q.x;q.py=q.y;
  const w=G.wren;if(!blocked(nx,ny,8)){w.face=Math.atan2(ny-w.y,nx-w.x)||w.face;w.ph+=Math.hypot(nx-w.x,ny-w.y)*.2;w.x=nx;w.y=ny;}
}
function startAnchor(p){
  const s=G.mb;if(s.dance)endDance('');
  s.anchor={t:25,stand:0,ped:p};
  G.ash.x=G.wren.x+12;G.ash.y=G.wren.y;
  shiftTime();
  G.wren.hidden=true;G.active='ash';unstick(G.ash);
  toast('Across time','Ashling goes alone. Shiloh waits in the other year. Land on a pedestal to return.','#cfe0ff');
  say_('Ashling','Just me? In the future? Fine. Do not move.',1);
}
function endAnchor(){
  const s=G.mb,a=s.anchor;if(!a)return;s.anchor=null;s.acd=4;
  G.wren.hidden=false;
  shiftTime();
  G.ash.x=G.wren.x+14;G.ash.y=G.wren.y;unstick(G.ash);unstick(G.wren);
  G.active='wren';G.rings.push({x:G.wren.x,y:G.wren.y,t:.6,r:60,c:'200,220,255'});
  say_('Shiloh','Back. Tell me you did something useful.',.8);
}
function stepAnchor(dt){
  const s=G.mb,a=s.anchor;if(!a)return;
  a.t-=dt;
  let on=false;for(const p of G.peds)if(dist(p,G.ash)<22)on=true;
  a.stand=on&&a.t<24.5?a.stand+dt:0;
  if(a.stand>.7||a.t<=0)endAnchor();
}
function stepHop(dt){
  const s=G.mb,A=G.ash,dashing=G.dash.t>0;
  if(s.hop){s.hop.t+=dt;const k=Math.min(1,s.hop.t/.38);A.x=s.hop.fx+(s.hop.tx-s.hop.fx)*k;A.y=s.hop.fy+(s.hop.ty-s.hop.fy)*k;A.hop=Math.sin(k*Math.PI)*18;
    if(k>=1){s.hop=null;A.hop=0;burst(A.x,A.y,10,'#cfc0a8',60,.5,3,{k:'smoke',gr:5});}return;}
  const fresh=G.dash.hit&&G.dash.hit!==s.lastHit;s.lastHit=G.dash.hit;
  if(fresh&&G.state==='ruin'&&G.active==='ash'){
    const a=G.dash.a,dx=Math.round(Math.cos(a)),dy=Math.round(Math.sin(a));
    if(dx||dy){const tx=Math.floor(A.x/T),ty=Math.floor(A.y/T),r1=[tx+dx,ty+dy],r2=[tx+2*dx,ty+2*dy];
      const rub=(x,y)=>G.grid[y]&&G.grid[y][x]==='#'&&G.baseGrid[y]&&G.baseGrid[y][x]!=='#';
      if(rub(r1[0],r1[1])&&G.grid[r2[1]]&&G.grid[r2[1]][r2[0]]==='.'&&!G.doors[r2[0]+','+r2[1]]){
        G.dash.t=0;const to=ctr(r2[0],r2[1]);s.hop={fx:A.x,fy:A.y,tx:to.x,ty:to.y,t:0};snd('dash');
        if(!s.hopSaid){s.hopSaid=true;say_('Ashling','Wings! I have wings! Over the rubble!');}
      }}
  }
  s.wasDash=dashing;
}
function stepClock(dt){
  const s=G.mb,k=s.clock;if(!(k.strikeT>0))return;
  k.strikeT-=dt;if(G.state!=='ball')return;
  const cc=ctr(...DM.clock);
  for(const g of G.guards){if(g.boss||g.seeing||g.stun>0)continue;g.lure=null;g.ret=false;g.search=null;g.pause=Math.max(g.pause,.3);g.face=Math.atan2(cc.y-g.y,cc.x-g.x);}
  if(k.strikeT<=0)toast('The clock falls silent','The guards remember their posts.','#cfd6e6');
}
function drawDunFloor(c){
  const s=G.mb,t=G.time,rc=ctr(...DM.rafter),cc=ctr(...DM.clock);
  if(G.state==='ball'){
    // the rotten rafter, propped against the wall: smoulders once burnt
    c.save();c.translate(rc.x,rc.y);c.rotate(-.5);
    c.fillStyle=s.rafter.burnt?'#2a1a14':'#6a4a32';c.fillRect(-16,-4,32,8);
    c.fillStyle=s.rafter.burnt?'rgba(255,120,40,'+(.4+.3*Math.sin(t*6))+')':'#8a6a48';c.fillRect(-16,-4,32,2);
    c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(-16,-4,32,8);c.restore();
    // the dance-floor clock (standing)
    shadowAt(cc.x+2,cc.y+10,9,4,.3);
    c.fillStyle='#4a3a5a';rr(c,cc.x-7,cc.y-20,14,28,3);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    c.fillStyle='#e8e0c8';circ(c,cc.x,cc.y-12,5);c.fill();c.strokeStyle='#2a2030';c.lineWidth=1;c.stroke();
    const hh=s.clock.strikeT>0?-1.57:t*.2;c.beginPath();c.moveTo(cc.x,cc.y-12);c.lineTo(cc.x+Math.cos(hh)*4,cc.y-12+Math.sin(hh)*4);c.stroke();
    c.fillStyle='#d9a441';c.fillRect(cc.x-1,cc.y-4,2,7+Math.sin(t*3)*2);
  } else {
    // the fallen clock in its rubble pocket
    c.save();c.translate(cc.x,cc.y);c.rotate(1.2);
    c.fillStyle=s.clock.burnt?'#2a2020':'#3a3040';rr(c,-7,-14,14,28,3);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    c.fillStyle=s.clock.burnt?'#6a5a40':'#bab4a0';circ(c,0,-6,5);c.fill();c.restore();
    if(!s.clock.burnt){c.strokeStyle='rgba(255,210,120,'+(.25+.2*Math.sin(t*3))+')';c.lineWidth=1.4;circ(c,cc.x,cc.y,16);c.stroke();}
    if(s.rafter.burnt){const e=ctr(...DM.east);c.fillStyle='#3a2a22';for(let i=0;i<4;i++){c.save();c.translate(e.x+i*5-8,e.y+(i%2)*6);c.rotate(.3*i);c.fillRect(-9,-2,18,4);c.restore();}}
  }
  // Shiloh, out of time, waiting at the pedestal
  if(s.anchor&&G.wren.hidden){const w=G.wren;c.globalAlpha=.35+.15*Math.sin(t*4);c.strokeStyle='#cfe0ff';c.lineWidth=1.5;circ(c,w.x,w.y,12);c.stroke();
    c.fillStyle='rgba(200,220,255,.35)';ell(c,w.x,w.y,7,9);c.fill();c.globalAlpha=1;}
}
function drawDunTop(c){
  const s=G.mb;
  if(s.dance&&!G.wren.hidden){const w=G.wren,q=s.dance.g;c.strokeStyle='rgba(232,244,255,.7)';c.lineWidth=1.2;c.beginPath();c.moveTo(w.x,w.y);c.lineTo(q.x,q.y);c.stroke();
    c.strokeStyle='rgba(232,244,255,.8)';c.lineWidth=2;c.beginPath();c.arc(w.x,w.y,19,-1.57,-1.57+6.283*s.dance.t/12);c.stroke();
    c.fillStyle='#e8f4ff';c.beginPath();c.ellipse(w.x,w.y-20,6,3,0,0,6.283);c.fill();c.fillStyle='#1a1018';circ(c,w.x-2.4,w.y-20,1.2);c.fill();circ(c,w.x+2.4,w.y-20,1.2);c.fill();}
  if(s.anchor){const a=G.ash;c.font='bold 9px '+HEAD;c.textAlign='center';c.fillStyle='#cfe0ff';c.fillText('ACROSS TIME '+Math.ceil(s.anchor.t),a.x,a.y-30);}
  if(G.ash.hop){c.fillStyle='rgba(0,0,0,.25)';ell(c,G.ash.x,G.ash.y+8,10,4);c.fill();}
  if(s.clock.strikeT>0&&G.state==='ball'){const cc=ctr(...DM.clock);c.strokeStyle='rgba(255,215,130,'+(.3+.3*Math.sin(G.time*8))+')';c.lineWidth=2;circ(c,cc.x,cc.y-12,22+8*Math.sin(G.time*4));c.stroke();}
}

/* =====================================================================
   THE CANDLEMAKER'S CROWN (6): approach, sabotage, assault
   ===================================================================== */
const CR={gate:[12,14],vats:[20,16],wick:[22,16],lever:[23,15],bell:[11,3],cens:[[8,6],[16,6],[12,10]],burnSnuff:[[3,11],[21,11]]};
M[6]={
  init(g){
    const s=g.mb;
    g.doors[CR.gate.join(',')]={x:CR.gate[0],y:CR.gate[1],open:false,gate:true};
    s.sab=null;s.vp=0;s.gateOpen=false;s.bellCd=0;
    s.cens=CR.cens.map(q=>({x:q[0],y:q[1],st:'hang',p:0,t:0}));
  },
  post(g,dt){
    const s=g.mb,B=G.boss;
    if(s.bellCd>0)s.bellCd-=dt;
    if(!s.gateOpen&&B&&!B.eng){B.blinkT=Math.max(B.blinkT,8);B.blink=null;}
    const v=ctr(...CR.vats);
    if(!s.sab&&fireAt(v.x,v.y)){s.vp+=dt;if(s.vp>1)sabotage('burn');}else s.vp=Math.max(0,s.vp-dt*.5);
    if(s.sab==='poison'&&B&&!B.dead)B.flareCd=Math.max(B.flareCd||0,6);
    for(const k of s.cens){
      const c=ctr(k.x,k.y);
      if(k.st==='hang'){if(fireAt(c.x,c.y-12,6)){k.p+=dt;if(Math.random()<dt*12)pt(c.x+rrand(-5,5),c.y-30,0,-16,.4,2,'#ffb060',{add:true});if(k.p>.45){k.st='fall';k.t=.75;snd('crack');}}else k.p=Math.max(0,k.p-dt*.4);}
      else if(k.st==='fall'){k.t-=dt;if(k.t<=0){k.st='down';censerImpact(c);}}
    }
  },
  targets(A){
    const s=G.mb,L=[];if(A!==G.wren)return L;
    if(!s.sab){const v=ctr(...CR.vats),w=ctr(...CR.wick);
      L.push(tg('vats','Poison the wax',1.4,v.x,v.y,()=>sabotage('poison'),36));
      L.push(tg('wick','Steal the master wick',1,w.x,w.y,()=>sabotage('wick'),34));}
    if(!s.gateOpen){const l=ctr(...CR.lever);L.push(tg('lever',s.sab?'Raise the hall gate':'Gate lever (chained)',s.sab?1:.3,l.x,l.y,openGate,34));}
    if(s.gateOpen&&s.bellCd<=0){const b=ctr(...CR.bell);L.push(tg('bell','Ring the Hallow bell',.6,b.x,b.y,ringBell,36));}
    return L;
  },
  lines(){
    const s=G.mb,L=[];
    L.push({text:'Sabotage the candle supply',done:!!s.sab});
    L.push({text:'Raise the hall gate',done:s.gateOpen});
    if(s.sab)L.push({text:{poison:'Wax poisoned: no candle sparks',wick:'Master wick: snuffs stagger longer',burn:'Stores burnt: two candles starved'}[s.sab],done:true});
    return L;
  },
  drawFloor(c){drawCrownFloor(c);},
  drawTop(c){drawCrownTop(c);}
};
function sabotage(kind){
  const s=G.mb;if(s.sab)return;s.sab=kind;const v=ctr(...CR.vats);
  if(kind==='poison'){snd('scroll');toast('The wax is tainted','His candles will gutter instead of spitting fire.','#9fe0a0');say_('Shiloh','Nightshade in the tallow. Let him light that.');}
  else if(kind==='wick'){snd('relic');toast('The master wick','Every snuffed candle will stagger him longer.','#ffd27a');say_('Shiloh','His master wick. Every candle in the hall was lit from this.');}
  else{
    snd('explode');shake(10);G.flash={t:.35,c:'255,200,120'};burst(v.x,v.y,46,'#ffb040',220,.9,4,{add:true,g:40});burst(v.x,v.y,20,'#5a4a42',120,1.4,8,{k:'smoke',gr:12});
    for(const [x,y] of CR.burnSnuff){const it=G.items.find(i=>i.type==='C'&&i.x===x*T+16&&i.y===y*T+16);if(it)it.done=true;}
    lureNear(v.x,v.y,9*T,true);s.loud=true;
    toast('The stores burn','Two candles starve. Everyone heard that.','#ff9a4a');say_('Ashling','Oops. On purpose. Oops on purpose.');
  }
  run.npc=run.npc||{flags:{}};(run.npc.flags=run.npc.flags||{}).crown_sab=kind;
}
function openGate(){
  const s=G.mb;
  if(!s.sab){say_('Shiloh','Chained. The candle supply first: the vats, the wick rack, or Ashling\'s fire.');return;}
  s.gateOpen=true;const d=G.doors[CR.gate.join(',')];if(d)d.open=true;
  snd('gate');shake(6);toast('The hall gate rises','Five candles. One throne. One old student of Quill.','#ffd27a');
  const gc=ctr(...CR.gate);
  if(s.loud){lureNear(gc.x,gc.y-T,12*T);if(G.boss&&!G.boss.eng)G.boss.blinkT=1.5;say_('Candlemaker','You burned my stores. Come in, then. Quickly.',1);}
}
function ringBell(){
  const s=G.mb,b=ctr(...CR.bell),B=G.boss;s.bellCd=16;
  snd('toll');shake(5);G.rings.push({x:b.x,y:b.y,t:.9,r:6*T,c:'255,210,120'});
  if(B&&!B.dead&&B.eng&&B.st!=='roar'){B.st='stagger';B.t=1.7;B.stg=1.7;B.blink=null;B.face=Math.atan2(b.y-B.y,b.x-B.x);floatText(B.x,B.y-34,'HE TURNS TO THE BELL','#ffd27a',12);}
  else lureNear(b.x,b.y,10*T);
  if(!s.bellSaid){s.bellSaid=true;say_('Shiloh','The house bell. He was a Hallow page once. He still turns when it rings.');}
}
function censerImpact(c){
  const B=G.boss;snd('explode');shake(9);burst(c.x,c.y,30,'#ffd27a',160,.7,3,{add:true});burst(c.x,c.y,14,'#6a5a48',90,1.1,6,{k:'smoke',gr:8});
  G.rings.push({x:c.x,y:c.y,t:.6,r:1.6*T,c:'255,200,120'});
  if(B&&!B.dead&&Math.hypot(B.x-c.x,B.y-c.y)<1.6*T){
    if(!B.eng){bossEngage(B);}
    else if(B.st!=='roar'){B.st='stagger';B.t=2;B.stg=2;B.blink=null;
      if(G.candlesLit<=0){B.hp-=12;B.hurt=.3;floatText(B.x,B.y-34,'-12','#ffe27a',15);if(typeof bossCheck==='function')bossCheck(B);}
      else floatText(B.x,B.y-34,'STAGGERED','#ffd27a',12);}
  }
  for(const g of G.guards)if(!g.boss&&!g.spin&&Math.hypot(g.x-c.x,g.y-c.y)<1.6*T)stunG(g,9,'FLATTENED');
  for(const f of G.foes||[])if(f.state!=='dead'&&Math.hypot(f.x-c.x,f.y-c.y)<1.6*T&&typeof damageFoe==='function')damageFoe(f,5,{stagger:true,sx:c.x,sy:c.y});
  for(const ch of [G.wren,G.ash])if(ch&&!ch.hidden&&(ch!==G.ash||G.ash.on)&&Math.hypot(ch.x-c.x,ch.y-c.y)<1.1*T){hurtTeam(1,c.x,c.y,'censer');break;}
}
function drawCrownFloor(c){
  const s=G.mb,t=G.time;
  // chandlery: wax vats, the master wick rack, the gate lever
  const v=ctr(...CR.vats),w=ctr(...CR.wick),l=ctr(...CR.lever);
  for(let i=-1;i<=1;i+=2){const x=v.x+i*9;shadowAt(x+2,v.y+9,10,4,.35);
    c.fillStyle=s.sab==='burn'?'#2a1a14':'#6a5038';ell(c,x,v.y,10,8);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
    c.fillStyle=s.sab==='poison'?'#7aa070':s.sab==='burn'?'#3a2a20':'#efe2b8';ell(c,x,v.y-1,7.5,5.5);c.fill();
    if(s.sab==='burn'&&Math.random()<.2)pt(x+rrand(-5,5),v.y-4,0,-24,.6,2,'#ff9a40',{add:true});}
  c.fillStyle='#4a3a2a';c.fillRect(w.x-10,w.y-12,20,4);c.fillRect(w.x-9,w.y-12,2,18);c.fillRect(w.x+7,w.y-12,2,18);
  if(s.sab!=='wick'){c.strokeStyle='#efe2b8';c.lineWidth=1.4;for(let i=0;i<4;i++){c.beginPath();c.moveTo(w.x-6+i*4,w.y-8);c.quadraticCurveTo(w.x-6+i*4+2,w.y-1,w.x-6+i*4,w.y+4);c.stroke();}}
  drawLever(c,l.x,l.y,s.gateOpen,s.sab?'#ffd27a':'#6a6a72');
  if(!s.sab){c.strokeStyle='#8a8f9a';c.lineWidth=1;c.beginPath();for(let i=0;i<6;i++)c.lineTo(l.x-8+i*3,l.y+(i%2?2:-2));c.stroke();}
  // the Hallow bell in the throne alcove
  const b=ctr(...CR.bell);shadowAt(b.x+2,b.y+8,11,4,.3);
  c.fillStyle='#4a3a20';c.fillRect(b.x-12,b.y-14,24,3);
  const g=c.createRadialGradient(b.x-3,b.y-6,1,b.x,b.y-3,11);g.addColorStop(0,'#f6dc8a');g.addColorStop(1,'#8a6a20');
  c.fillStyle=g;c.beginPath();c.moveTo(b.x-9,b.y+4);c.quadraticCurveTo(b.x-9,b.y-11,b.x,b.y-11);c.quadraticCurveTo(b.x+9,b.y-11,b.x+9,b.y+4);c.closePath();c.fill();
  c.strokeStyle=INK;c.lineWidth=1.1;c.stroke();
  if(s.bellCd>0){c.strokeStyle='rgba(255,210,120,.5)';c.lineWidth=1.5;c.beginPath();c.arc(b.x,b.y-3,15,-1.57,-1.57+6.283*(1-s.bellCd/16));c.stroke();}
  // fallen censers leave a burning wax pool
  for(const k of s.cens){const cc=ctr(k.x,k.y);
    if(k.st==='down'){c.fillStyle='rgba(240,210,140,.55)';ell(c,cc.x,cc.y+3,16,9);c.fill();c.fillStyle='#4a3a2a';ell(c,cc.x+3,cc.y,9,6);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();}
    else{const k2=k.st==='fall'?1-k.t/.75:0;c.fillStyle='rgba(0,0,0,'+(.2+.3*k2)+')';ell(c,cc.x,cc.y+4,8+8*k2,4+4*k2);c.fill();
      if(k.st==='fall'){c.strokeStyle='rgba(255,140,60,.8)';c.lineWidth=2;circ(c,cc.x,cc.y,1.6*T*(1-k2*.4));c.stroke();}}}
}
function drawCrownTop(c){
  const s=G.mb,t=G.time;
  for(const k of s.cens){if(k.st==='down')continue;const cc=ctr(k.x,k.y),drop=k.st==='fall'?(1-k.t/.75)*30:0,y=cc.y-30+drop+Math.sin(t*1.3+k.x)*1.5;
    c.strokeStyle='#5a4a3a';c.lineWidth=1.2;c.beginPath();c.moveTo(cc.x,y-40);c.lineTo(cc.x,y-6);c.stroke();
    c.fillStyle='#6a5030';c.beginPath();c.moveTo(cc.x-9,y-4);c.lineTo(cc.x+9,y-4);c.lineTo(cc.x+5,y+5);c.lineTo(cc.x-5,y+5);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();
    c.fillStyle=k.p>0?'#ffb060':'#ffd27a';for(let i=-1;i<=1;i++){circ(c,cc.x+i*5,y-6-Math.abs(Math.sin(t*9+i))*2,1.6);c.fill();}
    if(k.p>0){c.strokeStyle='rgba(255,160,60,.8)';c.lineWidth=2;c.beginPath();c.arc(cc.x,y,13,-1.57,-1.57+6.283*k.p/.45);c.stroke();}}
}

/* =====================================================================
   hooks
   ===================================================================== */
function wrap(name,fn){const o=window[name];if(typeof o==='function')window[name]=fn(o);}
wrap('loadLevel',o=>function(i){
  const g=o(i);
  if(typeof i==='number'&&M[i]){g.mb={lv:i};M[i].init(g);}
  return g;
});
wrap('update',o=>function(dt){
  const g=G,m=g&&g.mb?M[g.mb.lv]:null;
  if(!m)return o(dt);
  const live=!g.talk&&!g.cine;
  if(live&&m.pre)m.pre(g,dt);
  try{o(dt);}finally{if(live&&m.restore)m.restore(g);}
  if(live&&G===g&&m.post&&mode==='play')m.post(g,dt);
});
wrap('findTarget',o=>function(A){
  let t=o(A);const m=mod();
  if(m&&m.targets){let bd=t?Math.hypot(t.x-A.x,t.y-A.y):1e9;for(const q of m.targets(A)){const d=Math.hypot(q.x-A.x,q.y-A.y);if(d<q.r&&d<bd){bd=d;t=q;}}}
  return t;
});
wrap('completeTarget',o=>function(t){if(t&&t.kind==='mb'){t.fn();return;}return o(t);});
wrap('shiftTime',o=>function(){const toRuin=G.state==='ball';o();const m=mod();if(m&&m.shift)m.shift(toRuin);});
wrap('swapChar',o=>function(){const s=S();if(s&&s.anchor)return;return o();});
wrap('candleSnuffed',o=>function(B){o(B);const s=S();if(s&&s.sab==='wick'&&B&&B.st==='stagger'){B.t+=1.2;B.stg=Math.max(B.stg||0,B.t);}});
wrap('objectiveLines',o=>function(){const L=o();const m=mod();if(m&&m.lines&&!(G.d&&G.d.hub))try{for(const l of m.lines())L.push(l);}catch(e){}return L;});
wrap('drawBeams',o=>function(){o();const m=mod();if(m&&m.drawFloor){ctx.save();m.drawFloor(ctx);ctx.restore();}});
wrap('drawPrompt',o=>function(){const m=mod();if(m&&m.drawTop){ctx.save();m.drawTop(ctx);ctx.restore();}o();});

window.MisB={M,IV,DM,CR,freed,divert,tripPress,ride,setWait,calmPerrin,panic,lockdown,raiseGate,reinforce,hotTile,
  startDance,endDance,startAnchor,endAnchor,sabotage,openGate,ringBell,censerImpact,mkGuard,path};
})();
