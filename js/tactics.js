'use strict';
/* EMBERCROWN - tactics: guard teamwork and searching, hound scent trails, parry / charged strike / counter,
   ember flare combo, new foes (Pyre Mite, Hollow Chanter), the Ashen Cantor mini-boss and boss mechanics. */

/* ---------- small scheduler (runs on scaled combat time) ---------- */
function later(t,fn){(G.sched=G.sched||[]).push({t,fn});}
function stepSched(dt){
  const s=G.sched;if(!s||!s.length)return;
  for(let i=s.length-1;i>=0;i--){s[i].t-=dt;if(s[i].t<=0){const f=s[i].fn;s.splice(i,1);f();}}
}
function slowmo(d){G.tsT=.35;G.slowT=d;}

function stepTactics(dt){
  stepSched(dt);
  if(G.parryT>0)G.parryT-=dt;
  if(G.counterT>0)G.counterT-=dt;
  if(G.slowT>0){G.slowT-=dt;if(G.slowT<=0&&!G.cine)G.tsT=1;}
  if(G.strike.hvy>0){G.strike.hvy-=dt;if(G.strike.hvy<=0)resolveHeavy();}
  stepCharge(dt);stepScent(dt);
  for(const g of G.guards)if(g.gbk>0)g.gbk-=dt;
  for(const f of G.foes)if(f.burnT>0)f.burnT-=dt;
}

/* ======================================================================
   SHILOH: parry window, perfect dodge, counter, charged strike, finisher
   ====================================================================== */
function strikeExtras(cb){
  const A=G.wren;
  if(cb===0)G.parryT=.2+eqb('parry'); // the first swing of a chain is a ready blade: time it against an attack
  G.chg={t:0,ready:false};
  G.strike.counter=false;
  if(G.counterT>0){ // riposte after a parry or perfect dodge: a guaranteed heavy swing
    G.counterT=0;G.strike.counter=true;G.strike.cb=2;A.atk.combo=2;A.atk.t=A.atk.t0=.3;G.strike.cd=.5;
    G.fx.push({k:'slash',x:A.x,y:A.y,a:G.strike.ang,t:.28,t0:.28,big:true,col:'255,255,200'});
  }
}
function tryParry(sx,sy){
  if(!(G.parryT>0)||G.active!=='wren'||G.cine)return false;
  const A=G.wren;G.parryT=0;G.counterT=1.6+eqb('parry')*2;G.pdAt=G.time;
  const a=Math.atan2(sy-A.y,sx-A.x);
  Aud.S.deflect();Aud.S.hit();hitstop(.12);shake(7);punch(.8);slowmo(.1);
  G.rings.push({x:A.x,y:A.y,t:.45,r:64,c:'200,235,255'});
  burst(A.x+Math.cos(a)*14,A.y+Math.sin(a)*14,16,'#e8f6ff',200,.35,2,{add:true});
  floatText(A.x,A.y-26,'PARRY','#bfe8ff',14);
  for(const f of G.foes){
    if(f.state==='dead'||Math.hypot(f.x-A.x,f.y-A.y)>78)continue;
    stunFoe(f,1.0,1.4);
  }
  const B=G.boss;
  if(B&&!B.dead&&B.eng&&Math.hypot(B.x-A.x,B.y-A.y)<84)bossHit(B,{type:'parry',sx:A.x,sy:A.y});
  return true;
}
function stunFoe(f,t,vuln){ // knocks a foe out of its attack and opens it up
  if(f.kind==='cantor'||f.kind==='mite'&&f.state==='fuse')return;
  f.state=(f.kind==='wisp'||f.kind==='warder')?'stagger':'recover';f.t=t;f.vuln=Math.max(f.vuln,vuln||t);
}
function dodged(){ // called from hurtTeam when an attack lands on invulnerable frames
  if(G.god||G.time-(G.pdAt||-9)<.8)return;
  const A=activeChar();
  if(G.active==='wren'&&(G.roll.t>0||G.roll.grace>0)){
    G.pdAt=G.time;G.counterT=1.6;G.roll.cd=0;
    floatText(A.x,A.y-26,'PERFECT DODGE','#9fe8ff',13);
  } else if(G.active==='ash'&&(G.dash.t>0||G.dash.grace>0)){
    G.pdAt=G.time;G.dash.cd=0;if(G.dash.ch<G.dash.max)G.dash.ch++;
    floatText(A.x,A.y-26,'PERFECT DASH','#ffd27a',13);
    flareAt(A.x,A.y,52,1,false);
  } else return;
  Aud.S.relic();slowmo(.12);punch(.6);
  G.rings.push({x:A.x,y:A.y,t:.5,r:70,c:'160,230,255'});
  burst(A.x,A.y,14,'#bfe8ff',150,.4,2,{add:true});
}
function stepCharge(dt){
  const ch=G.chg;if(!ch)return;
  if(G.active!=='wren'||G.cine||G.roll.t>0||G.mode==='lose'){G.chg=null;return;}
  const held=!!(keys[' ']||touch.fire||mouse.down);
  if(held){
    ch.t+=dt;
    if(!ch.ready&&ch.t>=.55){ch.ready=true;Aud.S.relic();G.rings.push({x:G.wren.x,y:G.wren.y,t:.3,r:34,c:'255,240,180'});burst(G.wren.x,G.wren.y,10,'#fff2c0',90,.3,2,{add:true});}
  } else {G.chg=null;if(ch.ready)heavyStrike();}
}
function heavyStrike(){
  const A=G.wren;let ang=A.face;
  if(mouse.used&&mouse.world&&!V.coarse)ang=Math.atan2(mouse.world.y-A.y,mouse.world.x-A.x);
  A.face=ang;G.strike.ang=ang;G.strike.hvy=.1;G.strike.cd=.8;G.strike.combo=0;G.strike.last=G.time;
  A.atk={t:.42,t0:.42,a:ang,combo:2};
  A.kx=(A.kx||0)+Math.cos(ang)*60;A.ky=(A.ky||0)+Math.sin(ang)*60;
  Aud.S.swing();Aud.S.slam();
}
function resolveHeavy(){
  const A=G.wren,ang=G.strike.ang,reach=54;
  const inArc=(o,r)=>{const dx=o.x-A.x,dy=o.y-A.y;return Math.hypot(dx,dy)<reach+(r||0)&&angDiff(Math.atan2(dy,dx),ang)<1.4;};
  G.fx.push({k:'slash',x:A.x,y:A.y,a:ang,t:.3,t0:.3,big:true,col:'255,235,170'});
  G.rings.push({x:A.x+Math.cos(ang)*30,y:A.y+Math.sin(ang)*30,t:.35,r:54,c:'255,220,150'});
  shake(9);hitstop(.05);let hit=0;
  for(const g of G.guards){
    if(g.spin||g.dead||g.boss||g.stun>0&&g.ko||!inArc(g,13))continue;
    hit++;
    if(g.kind==='brute'){g.gbk=4;g.stun=Math.max(g.stun,3.4);floatText(g.x,g.y-24,'GUARD BREAK','#ffe27a',12);}
    else {g.stun=Math.max(g.stun,3.6);floatText(g.x,g.y-22,'STUNNED','#ffd27a');}
    g.ko=false;G.st.stuns++;G.alert=Math.min(.95,G.alert+.12);lureNear(g.x,g.y,4*T,true);
    const kx=Math.cos(ang)*22,ky=Math.sin(ang)*22;if(!blocked(g.x+kx,g.y+ky,8)){g.x+=kx;g.y+=ky;}
    Aud.S.hit();hitstop(.09);burst(g.x,g.y,14,'#ffe27a',150,.4,2,{add:true});
  }
  for(const f of G.foes){
    if(f.state==='dead'||!inArc(f,f.r))continue;
    hit++;
    if(damageFoe(f,3+eqb('dmg'),{heavy:true,kx:Math.cos(ang)*360,ky:Math.sin(ang)*360,hs:.09,pn:.7,sh:7,sx:A.x,sy:A.y,stagger:true,noEq:true})){
      if(f.state!=='dead'){f.vuln=Math.max(f.vuln,1.2);if(f.kind!=='cantor')f.state=f.kind==='wisp'||f.kind==='warder'?'stagger':'recover',f.t=.9;floatText(f.x,f.y-30,'GUARD BREAK','#ffe27a',11);}
    }
  }
  const B=G.boss;
  if(B&&!B.dead&&inArc(B,16)){bossHit(B,{type:'heavy',sx:A.x,sy:A.y});hit++;}
  for(const p of G.pots)if(p.hp>0&&inArc({x:p.x*T+16,y:p.y*T+16},8)){breakPot(p);hit++;}
  for(const it of G.items)if(it.type==='o'&&!it.done&&it.fuse<0&&inArc(it,8)){it.fuse=.3;hit++;}
  G.proj=G.proj.filter(p=>!(inArc(p,6)&&(burst(p.x,p.y,6,'#ffe0a0',90,.3,2,{add:true}),true)));
  if(!hit)G.strike.cd=.5;
}
function finisherBurst(A,ang,counter){
  const x=A.x+Math.cos(ang)*22,y=A.y+Math.sin(ang)*22,R=counter?64:50,bonus=eqb('finisher');
  G.rings.push({x,y,t:.4,r:R+10,c:counter?'255,255,200':'200,230,255'});
  burst(x,y,counter?30:18,counter?'#fff2b0':'#bfe4ff',190,.45,2.4,{add:true});
  hitstop(.1);shake(8);punch(.9);Aud.S.slam();
  floatText(A.x,A.y-30,counter?'COUNTER!':'FINISHER','#fff2b0',13);
  for(const f of G.foes){
    if(f.state==='dead'||Math.hypot(f.x-x,f.y-y)>R+f.r)continue;
    if(bonus>0)damageFoe(f,bonus,{sx:A.x,sy:A.y,noEq:true});
    stunFoe(f,.6,.8);
    const a=Math.atan2(f.y-y,f.x-x);f.kx+=Math.cos(a)*220;f.ky+=Math.sin(a)*220;
  }
  for(const g of G.guards){if(g.spin||g.boss||g.stun>0||Math.hypot(g.x-x,g.y-y)>R)continue;g.stun=Math.max(g.stun,counter?2.6:1.4);}
  G.roll.cd=Math.min(G.roll.cd,.2);
}

/* ---------- Ashling: fire-and-dash flare ---------- */
function flareAt(x,y,R,dmg,announce){
  G.rings.push({x,y,t:.5,r:R+14,c:'255,170,70'});
  burst(x,y,26,'#ffb040',200,.5,2.8,{add:true});burst(x,y,8,'#5a4a42',90,.7,6,{k:'smoke',gr:8});
  Aud.S.boom();shake(8);hitstop(.07);
  if(announce)floatText(x,y-30,'EMBER FLARE','#ffb860',13);
  for(const f of G.foes){
    if(f.state==='dead'||Math.hypot(f.x-x,f.y-y)>R+f.r)continue;
    f.burnT=0;damageFoe(f,dmg,{flare:true,fire:false,stagger:true,sx:x,sy:y,back:true,kx:(f.x-x)*5,ky:(f.y-y)*5,noEq:true});
  }
  for(const g of G.guards){if(g.spin||g.boss||g.stun>0||Math.hypot(g.x-x,g.y-y)>R)continue;g.stun=Math.max(g.stun,g.kind==='brute'?1.5:2.6);G.st.stuns++;}
  for(const it of G.items)if(it.type==='o'&&!it.done&&it.fuse<0&&Math.hypot(it.x-x,it.y-y)<R)it.fuse=.2;
  if(typeof igniteNear==='function')igniteNear(x,y,R);
}

/* ======================================================================
   GUARDS: calling allies with roles, methodical searching, hound scent
   ====================================================================== */
const SHOUT={brute:'Hold the line!',archer:'Overwatch!',hound:'Find it!',guard:'This way!'};
function callAllies(g){
  if(g.boss||g.spin||g.kind==='tower'||g.run||G.time-(G.callT||-9)<3)return;
  const P=g.seen||{x:G.wren.x,y:G.wren.y};
  const al=G.guards.filter(o=>o!==g&&!o.boss&&!o.spin&&!o.eng&&!o.run&&o.stun<=0&&!o.seeing&&!o.toastT&&o.kind!=='tower'&&Math.hypot(o.x-g.x,o.y-g.y)<6.5*T)
    .sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y));
  if(!al.length)return;
  G.callT=G.time;
  G.rings.push({x:g.x,y:g.y-8,t:.5,r:62,c:'255,210,120'});
  let n=0,side=1;const cap=diff===0?1:2;
  for(const o of al){
    if(n>=cap)break;n++;
    const a=Math.atan2(P.y-o.y,P.x-o.x);
    if(o.kind==='archer'){ // overwatch: hold position and cover the spot
      o.lure=null;o.ret=false;o.search=null;o.face=a;o.pause=3;o.role='overwatch';
    } else if(o.kind==='hound'){
      if(!o.lure&&!o.ret&&!o.search)o.back={x:o.x,y:o.y};
      o.hunt=1;o.seen=o.seen||{x:P.x,y:P.y};o.lure=null;o.ret=false;o.role='tracker';
      if(!startSearch(o))o.lure={x:P.x,y:P.y,t:2.4};
    } else {
      let tx=P.x,ty=P.y;
      if(o.kind==='guard'){ // flanker: come at the spot from the side
        const off=1.2*T*side;side=-side;tx=P.x+Math.cos(a+1.5708)*off;ty=P.y+Math.sin(a+1.5708)*off;
        if(blocked(tx,ty,8)||!los(P.x,P.y,tx,ty)){tx=P.x;ty=P.y;}
        o.role='flank';
      } else o.role='wall';
      if(!o.lure&&!o.ret&&!o.search)o.back={x:o.x,y:o.y};
      o.search=null;o.lure={x:tx,y:ty,t:2.4,called:1};o.ret=false;
    }
    o.quest=1.6;o.say={t:1.5,x:SHOUT[o.kind]||'This way!'};
  }
}
function scentPath(g){
  const sc=G.scent;if(!sc||sc.length<3)return null;
  let bi=-1,bd=3.6*T;
  for(let i=0;i<sc.length;i++){const d=Math.hypot(sc[i].x-g.x,sc[i].y-g.y);if(d<bd){bd=d;bi=i;}}
  if(bi<0)return null;
  const path=[];for(let i=bi;i<sc.length;i+=2)path.push({x:sc[i].x,y:sc[i].y});
  path.push({x:sc[sc.length-1].x,y:sc[sc.length-1].y});
  return path;
}
function startSearch(g){
  if(g.boss||g.spin||g.kind==='tower'||g.run||!g.hunt)return false;
  g.hunt=0;
  const s=g.seen||{x:g.x,y:g.y};
  if(!g.back)g.back={x:g.x,y:g.y};
  if(g.kind==='hound'){
    const path=scentPath(g);
    if(path){g.search={mode:'scent',path,i:0,t:0,age:0};g.say={t:1.6,x:'*sniff sniff*'};g.quest=3;return true;}
  }
  const a0=Math.atan2(s.y-g.y,s.x-g.x),pts=[];
  for(const sg of [1,-1]){
    const a=a0+sg*1.5708;
    for(const dd of [1.9*T,1.2*T]){const x=s.x+Math.cos(a)*dd,y=s.y+Math.sin(a)*dd;if(!blocked(x,y,8)&&los(s.x,s.y,x,y)){pts.push([x,y]);break;}}
  }
  if(diff===0)pts.length=Math.min(pts.length,1);
  g.search={mode:'sweep',pts,k:-1,t:1.7,base:Number.isFinite(a0)?a0:g.face,age:0};
  g.quest=3;return true;
}
function searchStep(g,dt){ // true while the guard is busy searching
  const s=g.search;if(!s)return false;
  s.age+=dt;g.quest=Math.max(g.quest,.4);
  if(s.mode==='scent'){
    const w=s.path[s.i];
    if(!w||s.age>14){g.search={mode:'sweep',pts:[],k:-1,t:1.5,base:g.face,age:0};return true;}
    if(moveG(g,w.x,w.y,dt,g.spd*1.2))s.i++;
    return true;
  }
  if(s.k<0){s.t-=dt;g.face=s.base+Math.sin(s.age*2.6)*1.1;if(s.t<=0)s.k=0;return true;}
  if(s.k<s.pts.length){
    const p=s.pts[s.k];
    if(!s.arr){if(moveG(g,p[0],p[1],dt,g.spd))s.arr=.9;}
    else{s.arr-=dt;g.face+=dt*2.2;if(s.arr<=0){s.k++;s.arr=0;}}
    return true;
  }
  g.search=null;g.ret=true;return false;
}
function stepScent(dt){
  if(!G.scent)G.scent=[];
  const l=G.scent,A=activeChar();
  const last=l[l.length-1];
  if(!G.flight&&(!last||Math.hypot(A.x-last.x,A.y-last.y)>(G.sneak?30:14)))l.push({x:A.x,y:A.y,t:G.time});
  while(l.length&&(G.time-l[0].t>10||l.length>90))l.shift();
  if(G.smoke.length)for(let i=l.length-1;i>=0;i--)for(const s of G.smoke)if(Math.hypot(l[i].x-s.x,l[i].y-s.y)<s.r){l.splice(i,1);break;}
}

/* ======================================================================
   NEW FOES
   ====================================================================== */
function wardOk(f){
  if(f.kind==='cantor'&&f.choir)return G.foes.some(m=>m.kind==='mite'&&m.owner===f&&m.state!=='dead');
  return !!f.wardBy&&f.wardBy.state!=='dead';
}
function wardBroke(f){
  if(f.kind==='cantor'){
    f.state='recover';f.t=2;f.vuln=2;
    floatText(f.x,f.y-40,'CHOIR BROKEN','#d8b8ff',13);Aud.S.deflect();shake(6);
    G.rings.push({x:f.x,y:f.y,t:.6,r:90,c:'200,160,255'});burst(f.x,f.y,24,'#c8a0ff',150,.6,2.6,{add:true});
  }
}
function miteAI(f,C){
  const{dist,ang,sees,goal,gx,gy,gd,spd,dt}=C;
  if(f.state==='chase'){
    f.face=sees?ang:Math.atan2(gy,gx);
    if(goal&&gd>6){const w=Math.sin(f.age*9+f.ph)*28,px=-gy/gd,py=gx/gd;moveFoe(f,gx/gd*spd+px*w,gy/gd*spd+py*w,dt);}
    const primed=G.foes.filter(o=>o!==f&&o.kind==='mite'&&o.state==='fuse').length;
    if(sees&&dist<48&&f.cd<=0&&primed<2){f.state='fuse';f.t=.8;Aud.S.wind();tele({type:'circle',x:f.x,y:f.y,r:54,t:.8,t0:.8});}
  } else if(f.state==='fuse'){f.t-=dt;if(f.t<=0)miteBlast(f,true);}
  else if(f.state==='recover'){f.t-=dt;if(f.t<=0)f.state='chase';}
}
function miteBlast(f,self){
  const R=54;
  burst(f.x,f.y,34,'#ffb040',210,.5,2.8,{add:true});burst(f.x,f.y,8,'#5a4a42',100,.7,6,{k:'smoke',gr:8});
  G.rings.push({x:f.x,y:f.y,t:.45,r:R+16,c:'255,150,60'});shockwave(f.x,f.y,R+6,230,0,{r:10});
  Aud.S.boom();shake(7);hitstop(.05);
  for(const t of teamChars())if(Math.hypot(t.c.x-f.x,t.c.y-f.y)<R+t.r*.3)hurtTeam(1,f.x,f.y);
  for(const o of G.foes){
    if(o===f||o.state==='dead'||Math.hypot(o.x-f.x,o.y-f.y)>R+o.r)continue;
    const a=Math.atan2(o.y-f.y,o.x-f.x);
    damageFoe(o,o.kind==='cantor'?5:2,{blast:true,kx:Math.cos(a)*260,ky:Math.sin(a)*260,sx:f.x,sy:f.y,back:true,noEq:true});
    if(o.kind==='cantor')floatText(o.x,o.y-42,'BACKFIRE','#ffd27a',12);
  }
  for(const it of G.items)if(it.type==='o'&&!it.done&&it.fuse<0&&Math.hypot(it.x-f.x,it.y-f.y)<R)it.fuse=.25;
  lureNear(f.x,f.y,6*T,true);
  if(self){f.boom=false;killFoe(f);}
}
function warderAI(f,C){
  const{dx,dy,dist,ang,sees,goal,gx,gy,gd,spd,dt}=C;
  if(f.state==='chase'||f.state==='hover'){
    f.state='hover';f.face=ang;
    const want=sees?170:30;let mx=0,my=0;
    if(dist<want-35){mx=-dx/dist*spd*1.4;my=-dy/dist*spd*1.4;}
    else if(dist>want+50||!sees){mx=(goal?gx/gd:0)*spd;my=(goal?gy/gd:0)*spd;}
    const so=Math.sin(f.age*.8+f.ph)>0?1:-1;mx+=-dy/dist*so*28;my+=dx/dist*so*28;
    moveFoe(f,mx,my,dt);
    if(f.cd<=0&&sees&&G.foes.some(o=>o!==f&&o.state!=='dead'&&o.state!=='spawn'&&o.kind!=='warder'&&!(o.ward>0)&&Math.hypot(o.x-f.x,o.y-f.y)<130)){
      f.state='cast';f.t=.95;Aud.S.wind();tele({type:'circle',x:f.x,y:f.y,r:130,t:.95,t0:.95,col:'120,170,255'});
    }
  } else if(f.state==='cast'){
    f.t-=dt;f.face=ang;
    if(f.t<=0){
      for(const o of G.foes){
        if(o===f||o.state==='dead'||o.kind==='warder'||Math.hypot(o.x-f.x,o.y-f.y)>130)continue;
        o.ward=4.5;o.wardBy=f;burst(o.x,o.y,10,'#9ac4ff',70,.4,2,{add:true});
      }
      G.rings.push({x:f.x,y:f.y,t:.5,r:130,c:'130,180,255'});Aud.S.relic();
      f.state='hover';f.cd=5.5;
    }
  } else if(f.state==='stagger'){}
}

/* ---------- the Ashen Cantor: optional mini-boss ---------- */
function cantorIntro(f){
  f.state='idle';f.t=0;f.cd=1.8;f.choirCd=5;f.engaged=true;
  const A=activeChar();
  startCine('boss',{dur:3.2,minSkip:1.2,
    banner:{title:'THE ASHEN CANTOR',sub:'Last voice of the Choir',t0:.8,t1:2.9,col:'#d8b8ff',dy:V.h*.2},
    cam:(u,t)=>{
      const k=ease(Math.min(1,t/.7)),back=ease(Math.max(0,(t-2.55)/.6));
      return{x:A.x+(f.x-A.x)*k*(1-back),y:A.y+(f.y-A.y)*k*(1-back),z:1+.6*k*(1-back)+.04*Math.sin(t*2)};
    },
    tick:(c,dt)=>{
      f.roar=Math.max(0,Math.min(1,(c.t-.6)/.4))*(c.t<1.8?1:Math.max(0,1-(c.t-1.8)/.4));
      if(!c.r1&&c.t>.8){c.r1=1;Aud.S.roar();shake(12);hitstop(.08);
        G.rings.push({x:f.x,y:f.y,t:1,r:220,c:'200,160,255'},{x:f.x,y:f.y,t:.7,r:130,c:'255,255,255'});
        burst(f.x,f.y,36,'#c8a0ff',190,.9,3,{add:true});G.flash={t:.35,c:'210,180,255'};}
    },
    onEnd:()=>{f.roar=0;say('Ashling','A singer. Of course there is a singer. Keep away from the beam, and pop his helpers on him!');}
  });
}
function cantorAI(f,C){
  const{dx,dy,dist,ang,sees,goal,gx,gy,gd,spd,dt}=C;
  const p2=f.hp<f.max*.5;
  if(p2&&!f.p2said){f.p2said=true;toast('The Cantor raises his voice','The hymn spreads outward in rings.','#d8b8ff');G.rings.push({x:f.x,y:f.y,t:.8,r:180,c:'200,160,255'});shake(8);Aud.S.roar();}
  f.choirCd-=dt;
  const st=f.state;
  if(st==='chase'||st==='idle'){
    f.state='idle';f.face=sees?ang:Math.atan2(gy,gx);
    const want=sees?125:20;let mx=0,my=0;
    if(dist<want-35){mx=-dx/dist*spd*1.2;my=-dy/dist*spd*1.2;}
    else if(dist>want+45||!sees){mx=(goal?gx/gd:0)*spd;my=(goal?gy/gd:0)*spd;}
    const so=Math.sin(f.age*.7)>0?1:-1;mx+=-dy/dist*so*22;my+=dx/dist*so*22;
    moveFoe(f,mx,my,dt);
    if(f.cd<=0&&sees){
      const mites=G.foes.some(m=>m.kind==='mite'&&m.owner===f&&m.state!=='dead');
      if(!mites&&f.choirCd<=0){f.state='choir';f.t=1.3;Aud.S.wind();tele({type:'circle',x:f.x,y:f.y,r:84,t:1.3,t0:1.3,col:'190,120,255'});}
      else if(p2&&Math.random()<.5){f.state='hymn';f.t=1.1;Aud.S.wind();tele({type:'circle',x:f.x,y:f.y,r:44,t:1.1,t0:1.1,col:'190,120,255'});}
      else{
        const dir=Math.random()<.5?1:-1;f.sw0=ang-dir*.95;f.sw1=ang+dir*.95;f.swDur=p2?.85:1.1;
        f.state='swWind';f.t=1.0;f.face=f.sw0;Aud.S.wind();
        tele({type:'cone',x:f.x,y:f.y,a:ang,r:155,half:1.05,t:1.0,t0:1.0,col:'190,120,255'});
      }
    }
  } else if(st==='swWind'){f.t-=dt;f.face=f.sw0;f.beam=f.sw0;if(f.t<=0){f.state='sweep';f.t=f.swDur;Aud.S.slash();}}
  else if(st==='sweep'){
    f.t-=dt;const u=1-Math.max(0,f.t)/f.swDur;f.beam=f.sw0+(f.sw1-f.sw0)*u;f.face=f.beam;
    for(const t of teamChars()){
      const rx=t.c.x-f.x,ry=t.c.y-f.y,al=rx*Math.cos(f.beam)+ry*Math.sin(f.beam),pe=Math.abs(-rx*Math.sin(f.beam)+ry*Math.cos(f.beam));
      if(al>8&&al<160&&pe<9+t.r*.6&&los(f.x,f.y,t.c.x,t.c.y))hurtTeam(1,f.x,f.y);
    }
    if(Math.random()<.7)pt(f.x+Math.cos(f.beam)*rrand(20,150),f.y+Math.sin(f.beam)*rrand(20,150),0,0,.25,2.5,'#d8b8ff',{add:true});
    if(f.t<=0){f.state='recover';f.t=1.5;f.vuln=1.5;f.cd=1.4;f.beam=null;}
  }
  else if(st==='choir'){
    f.t-=dt;
    if(f.t<=0){
      for(const s of [-1,1]){const a=ang+s*1.5708;spawnFoe('mite',f.x+Math.cos(a)*44,f.y+Math.sin(a)*44,{owner:f});}
      f.choir=true;f.ward=60;f.wardBy=null;f.choirCd=16;f.state='idle';f.cd=2.2;
      floatText(f.x,f.y-42,'WARDED BY THE CHOIR','#d8b8ff',11);G.rings.push({x:f.x,y:f.y,t:.6,r:100,c:'200,160,255'});Aud.S.relic();
      if(!G.cantorSaid){G.cantorSaid=true;say('Ashling','His helpers are the ward! Break them, or let them blow up next to him.');}
    }
  }
  else if(st==='hymn'){
    f.t-=dt;
    if(f.t<=0){
      shockwave(f.x,f.y,210,150,1,{r:20});shockwave(f.x,f.y,230,150,1,{r:20,delay:.95});
      Aud.S.slam();shake(10);hitstop(.06);burst(f.x,f.y,24,'#c8a0ff',170,.6,2.6,{add:true});
      f.state='recover';f.t=1.7;f.vuln=1.5;f.cd=1.2;
    }
  }
  else if(st==='recover'){f.t-=dt;if(f.t<=0)f.state='idle';}
  else if(st==='stagger'){f.t-=dt;if(f.t<=0)f.state='idle';}
}
function cantorDeath(f){
  G.proj.length=0;G.tele.length=0;
  for(const o of G.foes)if(o!==f&&o.state!=='dead')killFoe(o);
  dropLoot(f.x,f.y,.7,true);for(let i=0;i<4;i++)spawnPick('cinder',f.x,f.y,11);spawnPick('heart',f.x,f.y,1);spawnPick('heart',f.x,f.y,1);
  G.flash={t:.5,c:'235,215,255'};G.rings.push({x:f.x,y:f.y,t:1,r:200,c:'210,170,255'});
  burst(f.x,f.y,70,'#d8b8ff',240,1.2,3.2,{add:true,g:30,dr:.8});slowmo(.2);shake(14);Aud.S.win();
  toast('The Choir falls silent','The Ashen Cantor is no more.','#d8b8ff');
  addCinders(60,f.x,f.y-14);
  say('Ashling','Hear that? Nothing. Wonderful.',1.2);
}

/* ======================================================================
   BOSS MECHANICS (hooks used by combat.js)
   ====================================================================== */
function bossCheck(B){
  if(B.eng&&!B.p2&&B.hp<B.maxhp*.5&&B.hp>0)bossPhase2(B);
  if(B.eng&&B.p2&&!B.p3&&B.hp<B.maxhp*.25&&B.hp>0)bossPhase3(B);
  if(B.hp<=0)bossDeath(B);
}
function bossPhase3(B){
  B.p3=true;shake(12);Aud.S.roar();G.flash={t:.35,c:'255,170,100'};
  G.rings.push({x:B.x,y:B.y,t:1,r:240,c:'255,110,50'});burst(B.x,B.y,50,'#ff7a3a',220,.9,3.2,{add:true});
  if(B.kind==='candle'){toast('The last wick','Two rings now, and the flames strike faster.','#ffb060');say('Candlemaker','Do you hear it? That is the sound of a candle running short.',.5);}
  else{toast('THE BELL CRACKS','Double tolls and heavier rain. He is nearly done.','#ffd080');say('Ashling','The bell is splitting! One more push!',.5);}
}
function debrisRain(B,A,n){
  const pa=Math.atan2(A.y-B.y,A.x-B.x)+1.5708,d=Math.hypot(A.x-B.x,A.y-B.y);
  const sp=[
    {x:A.x+(A.vx||0)*.45,y:A.y+(A.vy||0)*.45},
    {x:B.x+(A.x-B.x)*.38,y:B.y+(A.y-B.y)*.38},
    {x:A.x+Math.cos(pa)*72,y:A.y+Math.sin(pa)*72}];
  if(n>3)sp.push({x:A.x-Math.cos(pa)*72,y:A.y-Math.sin(pa)*72});
  if(n>4)sp.push({x:B.x+Math.cos(pa+Math.PI/2)*40,y:B.y+Math.sin(pa+Math.PI/2)*40});
  const R=36;
  for(const q of sp){
    if(blocked(q.x,q.y,10))continue;
    tele({type:'circle',x:q.x,y:q.y,r:R,t:1.05,t0:1.05,col:'255,200,90'});
    later(1.05,()=>debrisHit(B,q.x,q.y,R,true));
  }
  Aud.S.wind();
}
function debrisHit(B,x,y,R,self){
  burst(x,y,18,'#6a5a4a',140,.7,5,{k:'smoke',gr:8,dr:1.2});burst(x,y,12,'#cfc0a0',150,.5,3);
  G.rings.push({x,y,t:.4,r:R+14,c:'255,230,170'});shockwave(x,y,R+22,170,0,{r:8});
  Aud.S.slam();shake(6);
  for(const t of teamChars())if(Math.hypot(t.c.x-x,t.c.y-y)<R+t.r*.3)hurtTeam(1,x,y);
  if(self&&!B.dead&&Math.hypot(B.x-x,B.y-y)<R+12){
    B.hp-=6;B.hurt=.3;floatText(B.x,B.y-38,'BELL-STONE -6','#ffe27a',14);Aud.S.hit();hitstop(.1);
    if(['idle','toll','windSlam','windCharge','windLeap','rain','stagger'].includes(B.st)){B.st='stagger';B.t=Math.max(B.t,1.8);B.stg=Math.max(B.stg,1.8);}
    bossCheck(B);
  }
}
function bossReward(B){
  const clean=!B.tookHit;
  later(.4,()=>{
    addCinders(B.kind==='candle'?70:60,B.x,B.y-10);
    toast(B.kind==='candle'?"The Candlemaker's last wick":"The Warden's silent clapper",'Bonus cinders'+(clean?' and a flawless bonus.':'.'),'#ffe27a');
    if(clean){addCinders(60,B.x,B.y-24);spawnPick('heart',B.x,B.y,1);}
    G.st.bossClean=clean;
  });
}
function candleFlares(B,dt){
  if(B.st==='roar'||B.st==='stagger')return;
  B.flareCd=(B.flareCd==null?3:B.flareCd)-dt;
  if(B.flareCd>0||G.candlesLit<=0)return;
  const lit=G.items.filter(i=>i.type==='C'&&!i.done);if(!lit.length)return;
  const it=lit[Math.floor(Math.random()*lit.length)],A=activeChar(),a=Math.atan2(A.y-(it.y-6),A.x-it.x);
  tele({type:'line',x:it.x,y:it.y-6,a,len:300,w:9,t:.95,t0:.95,col:'255,170,70'});
  G.rings.push({x:it.x,y:it.y-6,t:.95,r:26,c:'255,170,70'});Aud.S.wind();
  later(.95,()=>{if(!B.dead&&!it.done)fireOrb(it.x,it.y-6,a,86,{col:'255,170,60'});});
  B.flareCd=(B.p3?3.4:B.p2?4.2:5.6)+Math.random();
  if(!G.flareSaid){G.flareSaid=true;say('Ashling','The candles are shooting at us! Snuff them!');}
}
function pickBlink(A){
  for(let n=0;n<30;n++){const a=Math.random()*6.283,rr=(1.7+Math.random()*1.2)*T,x=A.x+Math.cos(a)*rr,y=A.y+Math.sin(a)*rr;
    if(!blocked(x,y,12))return{x,y,t:1.05};}
  return null;
}

/* ======================================================================
   DRAWING
   ====================================================================== */
function foeBarY(f){return({wisp:26,husk:28,cantor:40,warder:24,mite:16})[f.kind]||20;}
function drawFoeNew(f,sc){
  const c=ctx,t=G.time,fa=vfa(f),flash=f.hitT>0;
  if(f.kind==='mite'){
    const fz=f.state==='fuse',u=fz?1-f.t/.8:0,pulse=fz?(Math.sin(t*(18+u*30))>0):false;
    shadowAt(f.x,f.y+5,7*sc,3,.3);
    c.save();c.translate(f.x,f.y);c.rotate(fa);c.scale(sc*(1+u*.35),sc*(1+u*.35));
    const leg=Math.sin(f.age*20)*(f.state==='chase'?2.4:0);
    c.strokeStyle='#2a1612';c.lineWidth=1.4;for(const s of[-1,1]){c.beginPath();c.moveTo(-1,s*3);c.lineTo(-3+leg*s,s*7);c.moveTo(3,s*3);c.lineTo(5-leg*s,s*7);c.stroke();}
    const gr=c.createRadialGradient(-1,-1,1,0,0,8);gr.addColorStop(0,flash||pulse?'#fff':'#ff9a5a');gr.addColorStop(1,pulse?'#ff4020':'#7a2a14');
    c.fillStyle=gr;ell(c,0,0,7,6);c.fill();
    c.fillStyle=fz?'#fff':'#ffd878';circ(c,3,-2,1.3);c.fill();circ(c,3,2,1.3);c.fill();
    c.fillStyle='#ffe27a';circ(c,-6,0,1.6+Math.sin(t*30)*.6);c.fill(); // spark fuse
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,'+(pulse?220:110)+',50,'+(.25+u*.4)+')';circ(c,0,0,11+u*5);c.fill();c.globalCompositeOperation='source-over';
    c.restore();
  } else if(f.kind==='warder'){
    const y=f.y-6+Math.sin(f.age*2.4+f.ph)*2,cast=f.state==='cast'?1-f.t/.95:0;
    shadowAt(f.x,f.y+8,8*sc,3,.28);
    c.save();c.translate(f.x,y);c.scale(sc,sc);
    c.fillStyle=flash?'#fff':'#24304a';c.beginPath();c.moveTo(0,-11);c.lineTo(9,9);c.lineTo(-9,9);c.closePath();c.fill();
    c.strokeStyle='rgba(120,170,255,.7)';c.lineWidth=1.2;c.stroke();
    c.fillStyle='#10182a';circ(c,0,-8,4.6);c.fill();
    c.fillStyle='rgba(150,200,255,.95)';c.fillRect(-2.6,-9,1.8,1.6);c.fillRect(.8,-9,1.8,1.6);
    const lg=.55+cast*.45+Math.sin(t*5+f.ph)*.1;
    c.globalCompositeOperation='lighter';
    c.fillStyle='rgba(120,180,255,'+lg*.5+')';circ(c,0,-19-cast*3,5+cast*5);c.fill();
    c.fillStyle='rgba(220,240,255,'+lg+')';circ(c,0,-19-cast*3,2.4);c.fill();
    c.globalCompositeOperation='source-over';
    c.restore();
  } else if(f.kind==='cantor'){
    const wind=f.state==='swWind'||f.state==='choir'||f.state==='hymn',sing=(f.roar||0)+(f.state==='sweep'?1:0)+(wind?.7:0);
    const rec=f.state==='recover'?1:0;
    shadowAt(f.x,f.y+10,17*sc,6,.4);
    c.save();c.translate(f.x,f.y);c.scale(sc,sc);
    // robe (always upright), hood, glowing mouth
    const gr=c.createLinearGradient(0,-24,0,14);gr.addColorStop(0,flash?'#fff':'#4a3a68');gr.addColorStop(1,'#1c1428');
    c.fillStyle=gr;c.beginPath();c.moveTo(-6,-18);c.bezierCurveTo(-18,-6,-20,8,-17,14);c.lineTo(17,14);c.bezierCurveTo(20,8,18,-6,6,-18);c.closePath();c.fill();
    c.strokeStyle='rgba(200,160,255,.55)';c.lineWidth=1.4;c.stroke();
    c.strokeStyle='rgba(216,184,255,'+(.4+sing*.4)+')';c.lineWidth=1.2;
    for(const k of[-8,0,8]){c.beginPath();c.moveTo(k,-4);c.lineTo(k*1.2,12);c.stroke();}
    c.fillStyle='#120c1c';circ(c,0,-18,8);c.fill();
    c.fillStyle='rgba(240,225,255,.95)';ell(c,0,-16,2.2+sing*2,1.4+sing*3);c.fill(); // singing mouth
    c.fillStyle='#d8b8ff';circ(c,-3.4,-20,1.3);c.fill();circ(c,3.4,-20,1.3);c.fill();
    // raised arms
    const raise=Math.min(1,sing+rec*.2);
    c.fillStyle='#34284c';for(const s of[-1,1]){c.save();c.translate(s*14,-2);c.rotate(s*(.3+raise*.9));ell(c,0,-6,3.6,9);c.fill();c.restore();}
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(190,140,255,'+(.12+sing*.2)+')';circ(c,0,-4,26+sing*6);c.fill();c.globalCompositeOperation='source-over';
    c.restore();
    if(f.ward>0){ // a ring of the sung notes
      for(let i=0;i<4;i++){const a=t*1.5+i*1.571;c.fillStyle='#d8b8ff';circ(c,f.x+Math.cos(a)*24,f.y-6+Math.sin(a)*10,2);c.fill();}
    }
  }
}
function drawFoeOver(f){
  const c=ctx,t=G.time;
  if(f.state==='dead'||f.state==='spawn')return;
  if(f.ward>0&&f.kind!=='cantor'){
    c.strokeStyle='rgba(140,190,255,'+(.45+Math.sin(t*8)*.15)+')';c.lineWidth=1.6;circ(c,f.x,f.y-4,f.r+6);c.stroke();
    c.fillStyle='rgba(140,190,255,.12)';c.fill();
    if(f.wardBy&&f.wardBy.state!=='dead'){c.strokeStyle='rgba(140,190,255,.35)';c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(f.wardBy.x,f.wardBy.y-12);c.lineTo(f.x,f.y-4);c.stroke();c.setLineDash([]);}
  }
  if(f.burnT>0){
    c.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){const a=t*9+i*2.1;c.fillStyle='rgba(255,'+(120+i*30)+',40,.7)';circ(c,f.x+Math.cos(a)*f.r*.55,f.y-f.r*.5-Math.abs(Math.sin(a*1.3))*5,2.2);c.fill();}
    c.globalCompositeOperation='source-over';
  }
  if(f.kind==='cantor'){
    const w=52,x=f.x-w/2,y=f.y-foeBarY(f);
    c.fillStyle='rgba(0,0,0,.65)';c.fillRect(x-1,y-1,w+2,6.4);
    c.fillStyle='#b080ff';c.fillRect(x,y,w*Math.max(0,f.hp)/f.max,4.4);
    c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x,y,w*Math.max(0,f.hp)/f.max,1.6);
    c.font='bold 7px sans-serif';c.textAlign='center';c.fillStyle='#e8d8ff';c.fillText('ASHEN CANTOR',f.x,y-3);c.textAlign='left';
  }
}
function drawTacticsOver(){
  const c=ctx,t=G.time;
  // Ashen Cantor beam
  for(const f of G.foes){
    if(f.kind==='cantor'&&f.state==='sweep'&&f.beam!=null){
      c.save();c.translate(f.x,f.y);c.rotate(f.beam);c.globalCompositeOperation='lighter';
      c.fillStyle='rgba(190,120,255,.35)';c.fillRect(0,-9,160,18);c.fillStyle='rgba(240,225,255,.9)';c.fillRect(0,-2.4,160,4.8);
      c.restore();c.globalCompositeOperation='source-over';
    }
  }
  // hound scent trail, only while a hound is following it
  if(G.scent&&G.guards.some(g=>g.search&&g.search.mode==='scent')){
    c.fillStyle='rgba(180,220,160,.35)';
    for(let i=0;i<G.scent.length;i++){const p=G.scent[i];c.beginPath();c.arc(p.x+Math.sin(t*3+i)*1.5,p.y+Math.cos(t*2+i)*1.5,1.6,0,6.3);c.fill();}
  }
  // Shiloh: ready blade, charge ring, counter aura
  const A=G.wren;
  if(G.active==='wren'&&!A.hidden){
    if(G.parryT>0){c.strokeStyle='rgba(210,240,255,'+Math.min(1,G.parryT*6)*.8+')';c.lineWidth=2;c.beginPath();c.arc(A.x,A.y,15,A.face-1,A.face+1);c.stroke();}
    if(G.counterT>0){const k=Math.min(1,G.counterT);c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,245,190,'+(.35+Math.sin(t*20)*.2)*k+')';c.lineWidth=2;circ(c,A.x,A.y,14+Math.sin(t*14)*1.5);c.stroke();c.globalCompositeOperation='source-over';}
    const ch=G.chg;
    if(ch&&ch.t>.15){
      const u=Math.min(1,ch.t/.55);
      c.strokeStyle=ch.ready?'rgba(255,240,170,'+(.7+Math.sin(t*30)*.3)+')':'rgba(220,235,255,.55)';c.lineWidth=ch.ready?2.6:1.6;
      c.beginPath();c.arc(A.x,A.y,17,-1.5708,-1.5708+6.283*u);c.stroke();
    }
  }
}
