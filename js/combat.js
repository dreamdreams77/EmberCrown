'use strict';
/* EMBERCROWN - combat: loot, damage, foes, projectiles, boss fights. */
const rrand=(a,b)=>a+Math.random()*(b-a);

/* ---------- loot ---------- */
function spawnPick(type,x,y,val){
  G.pick.push({type,x,y,vx:rrand(-70,70),vy:rrand(-70,70),h:0,vz:rrand(90,170),val:val||1,t:0,ph:Math.random()*6});
}
function cinderValue(v){return Math.round(v*(hasT('scav')?1.3:1));}
function dropLoot(x,y,seed,rich){
  const r=mulberry(Math.floor((seed||Math.random())*1e6)),n=rich?5:1+Math.floor(r()*3);
  for(let i=0;i<n;i++)spawnPick('cinder',x,y,3+Math.floor(r()*5));
  if(r()<(rich?.4:.14))spawnPick('heart',x,y,1);
}
function addCinders(n,x,y){
  const v=cinderValue(n);G.cinders+=v;
  if(x!=null)floatText(x,y-10,'+'+v,'#ffd27a',10);
}
function stepPickups(dt){
  const A=G.active==='wren'?G.wren:G.ash;
  for(let i=G.pick.length-1;i>=0;i--){
    const p=G.pick[i];p.t+=dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-4*dt);p.vy*=Math.max(0,1-4*dt);
    if(blocked(p.x,p.y,3)){p.x-=p.vx*dt*2;p.y-=p.vy*dt*2;p.vx=p.vy=0;}
    p.vz-=520*dt;p.h+=p.vz*dt;if(p.h<0){p.h=0;p.vz=Math.abs(p.vz)*.35;if(p.vz<30)p.vz=0;}
    const d=Math.hypot(A.x-p.x,A.y-p.y);
    if(p.t>.45&&d<64){const k=(1-d/64)*260*dt;p.x+=(A.x-p.x)/(d||1)*k;p.y+=(A.y-p.y)/(d||1)*k;}
    if(p.t>.3&&d<15){
      if(p.type==='heart'){
        if(G.hp<G.maxHp){G.hp=Math.min(G.maxHp,G.hp+1);Aud.S.heart();floatText(p.x,p.y-12,'+1 HEART','#ff7a8a',10);burst(p.x,p.y,12,'#ff7a8a',70,.6,2,{add:true});}
        else{addCinders(10,p.x,p.y);}
      } else {addCinders(p.val,p.x,p.y);Aud.S.cinder();}
      G.pick.splice(i,1);continue;
    }
    if(p.t>40)G.pick.splice(i,1);
  }
}
function drawPickups(){
  const c=ctx,t=G.time;
  for(const p of G.pick){
    const y=p.y-p.h-6;
    c.fillStyle='rgba(0,0,0,.3)';ell(c,p.x,p.y+3,4,1.8);c.fill();
    if(p.type==='heart'){
      const s=1+Math.sin(t*6+p.ph)*.08;c.save();c.translate(p.x,y-2);c.scale(s,s);
      c.fillStyle='#ff4a5e';c.beginPath();c.moveTo(0,5);c.bezierCurveTo(-9,-1,-5,-8,0,-3);c.bezierCurveTo(5,-8,9,-1,0,5);c.fill();
      c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(-3,-3,1.5,0,6.3);c.fill();c.restore();
    } else {
      c.save();c.translate(p.x,y);c.rotate(Math.sin(t*4+p.ph)*.3);
      c.fillStyle='#ffb040';c.beginPath();c.moveTo(0,-4);c.lineTo(3,0);c.lineTo(0,4);c.lineTo(-3,0);c.fill();
      c.fillStyle='rgba(255,240,180,.85)';c.fillRect(-.8,-2,1.6,2.4);c.restore();
    }
  }
}
function hasT(id){return run.talents.includes(id);}

/* ======================================================================
   TEAM: hearts, damage, knockback, i-frames
   ====================================================================== */
function activeChar(){return G.active==='wren'?G.wren:G.ash;}
function partnerChar(){return G.active==='wren'?(G.ash.on&&!G.flight?G.ash:null):(G.flight?null:G.wren);}
function teamChars(){
  const a=activeChar(),p=partnerChar(),L=[{c:a,r:11}];
  if(p)L.push({c:p,r:8});
  return L;
}
function iframes(){return G.inv>0||G.dash.t>0||G.dash.grace>0||G.roll.t>0||G.roll.grace>0||G.god;}
function hurtTeam(d,sx,sy,why){
  if(iframes()||G.cine)return false;
  G.hp-=d;G.inv=1.15;G.hurtFlash=.4;G.hpShake=.5;
  const A=activeChar(),ang=Math.atan2(A.y-sy,A.x-sx);
  A.kx=(A.kx||0)+Math.cos(ang)*230;A.ky=(A.ky||0)+Math.sin(ang)*230;
  hitstop(.075);shake(10);punch(.7);Aud.S.hurt();
  burst(A.x,A.y,16,'#ff5a5a',140,.5,2.4,{add:true});
  floatText(A.x,A.y-18,'-'+d,'#ff7a7a',14);
  if(G.hp<=0){
    if(hasT('phoenix')&&!G.phoenixUsed){
      G.phoenixUsed=true;G.hp=2;G.inv=2.4;
      burst(A.x,A.y,60,'#ffd27a',220,1.2,3.4,{add:true,g:-30});G.rings.push({x:A.x,y:A.y,t:1,r:180,c:'255,210,120'});
      G.flash={t:.6,c:'255,220,140'};Aud.S.relic();toast('Phoenix Spark!','You rise from the ash.','#ffd27a');
      for(const f of G.foes)if(f.state!=='dead')f.kx=(f.x-A.x)*3,f.ky=(f.y-A.y)*3;
      return true;
    }
    G.hp=0;G.defeat='down';setMode('lose');stats.caught++;Aud.fire(false);Aud.S.lost();shake(12);G.caughtAt={x:A.x,y:A.y};
  }
  return true;
}
function applyKnockback(c,dt){
  if(!c.kx&&!c.ky)return;
  const nx=c.x+c.kx*dt,ny=c.y+c.ky*dt,r=c===G.wren?8:10;
  if(!blocked(nx,c.y,r))c.x=nx;else c.kx=0;
  if(!blocked(c.x,ny,r))c.y=ny;else c.ky=0;
  const f=Math.max(0,1-9*dt);c.kx*=f;c.ky*=f;if(Math.abs(c.kx)<4)c.kx=0;if(Math.abs(c.ky)<4)c.ky=0;
}
function trackMotion(c,dt){
  if(c.px===undefined){c.px=c.x;c.py=c.y;c.vx=c.vy=0;c.trail=[];c.vf=c.face;}
  if(dt>0){
    let vx=(c.x-c.px)/dt,vy=(c.y-c.py)/dt;const m=Math.hypot(vx,vy);if(m>320){vx*=320/m;vy*=320/m;}
    c.vx+=(vx-c.vx)*Math.min(1,dt*12);c.vy+=(vy-c.vy)*Math.min(1,dt*12);
  }
  c.px=c.x;c.py=c.y;
  const tr=c.trail,l=tr[0];
  if(!l||Math.hypot(c.x-l.x,c.y-l.y)>3.2){tr.unshift({x:c.x,y:c.y});if(tr.length>16)tr.pop();}
  else{l.x+=(c.x-l.x)*.2;l.y+=(c.y-l.y)*.2;}
  if(Math.hypot(c.x-tr[tr.length-1].x,c.y-tr[tr.length-1].y)>400)tr.length=1;
}
function easeFace(o,dt,rate){
  if(o.vf===undefined)o.vf=o.face;
  let d=o.face-o.vf;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;
  o.vf+=d*Math.min(1,dt*(rate||14));
}
function vfa(o){return o.vf===undefined?o.face:o.vf;}

/* ======================================================================
   TELEGRAPHS, SHOCKWAVES, PROJECTILES
   ====================================================================== */
function tele(o){G.tele.push(Object.assign({t:.6,t0:.6,col:'255,70,50'},o));}
function shockwave(x,y,max,spd,dmg,o){G.shock.push(Object.assign({x,y,r:6,max,spd,dmg,hit:false,w:16},o||{}));}
function fireOrb(x,y,ang,spd,o){
  G.proj.push(Object.assign({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,r:5,dmg:1,life:4.5,col:'255,130,40',ph:Math.random()*6},o||{}));
}
function stepProjectiles(dt){
  for(let i=G.proj.length-1;i>=0;i--){
    const p=G.proj[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.curve){const a=Math.atan2(p.vy,p.vx)+p.curve*dt,s=Math.hypot(p.vx,p.vy);p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s;}
    if(Math.random()<.7)pt(p.x,p.y,(Math.random()-.5)*20,(Math.random()-.5)*20,.3,2+Math.random()*2,'#ff9a3a',{add:true});
    let dead=p.life<=0||solidTile(Math.floor(p.x/T),Math.floor(p.y/T));
    if(dead&&p.life>0){burst(p.x,p.y,8,'#ffb060',90,.35,2,{add:true});}
    if(!dead)for(const t of teamChars()){
      if(Math.hypot(t.c.x-p.x,t.c.y-p.y)<p.r+t.r){if(hurtTeam(p.dmg,p.x-p.vx,p.y-p.vy)){dead=true;burst(p.x,p.y,10,'#ff7a3a',100,.4,2.4,{add:true});}break;}
    }
    if(dead)G.proj.splice(i,1);
  }
}
function stepShocks(dt){
  for(let i=G.shock.length-1;i>=0;i--){
    const s=G.shock[i];if(s.delay>0){s.delay-=dt;continue;}s.r+=s.spd*dt;
    if(!s.hit)for(const t of teamChars()){
      const d=Math.hypot(t.c.x-s.x,t.c.y-s.y);
      if(Math.abs(d-s.r)<s.w*.5+t.r*.5&&hurtTeam(s.dmg,s.x,s.y)){s.hit=true;}
    }
    if(s.r>=s.max)G.shock.splice(i,1);
  }
  for(let i=G.tele.length-1;i>=0;i--){G.tele[i].t-=dt;if(G.tele[i].t<=-.1)G.tele.splice(i,1);}
}

/* ======================================================================
   FOES
   ====================================================================== */
const FOEDEF={
  cinder:{hp:2,r:9,spd:94,name:'Cinderling'},
  wisp:{hp:2,r:8,spd:66,name:'Ashwisp'},
  husk:{hp:6,r:13,spd:46,name:'Hollow Husk'}
};
function blockedFly(x,y,r){
  return solidTile(Math.floor((x-r)/T),Math.floor((y-r)/T))||solidTile(Math.floor((x+r)/T),Math.floor((y-r)/T))||
         solidTile(Math.floor((x-r)/T),Math.floor((y+r)/T))||solidTile(Math.floor((x+r)/T),Math.floor((y+r)/T));
}
function spawnFoe(kind,x,y,o){
  const d=FOEDEF[kind],A=activeChar();
  const f=Object.assign({kind,x,y,r:d.r,hp:d.hp,max:d.hp,face:Math.atan2(A.y-y,A.x-x),vf:0,state:'spawn',t:.7,cd:1+Math.random(),hitT:0,kx:0,ky:0,age:0,
    ph:Math.random()*6,last:null,lost:0,vuln:0,dir:0,ph2:0,lure:null,burst:0,flyH:0},o||{});
  f.vf=f.face;
  G.foes.push(f);
  burst(x,y,22,'#ff8a3a',100,.7,2.6,{add:true,g:-40});
  G.rings.push({x,y,t:.6,r:50,c:'255,130,50'});Aud.S.ember();
  return f;
}
function foesAlive(){return G.foes.filter(f=>f.state!=='dead').length;}
function moveFoe(f,dx,dy,dt){
  const fly=f.kind==='wisp',bl=fly?blockedFly:blocked;
  const nx=f.x+dx*dt,ny=f.y+dy*dt;
  if(!bl(nx,f.y,f.r*.8))f.x=nx;
  if(!bl(f.x,ny,f.r*.8))f.y=ny;
}
function foeTarget(f){
  const L=teamChars();let best=L[0],bd=1e9;
  for(const t of L){const d=Math.hypot(t.c.x-f.x,t.c.y-f.y)*(t.c===activeChar()?.8:1);if(d<bd){bd=d;best=t;}}
  return best.c;
}
function stepFoes(dt){
  for(let i=G.foes.length-1;i>=0;i--){
    const f=G.foes[i];f.age+=dt;f.hitT=Math.max(0,f.hitT-dt);f.cd-=dt;f.vuln=Math.max(0,f.vuln-dt);
    if(f.kx||f.ky){moveFoe(f,f.kx,f.ky,dt);const k=Math.max(0,1-8*dt);f.kx*=k;f.ky*=k;}
    easeFace(f,dt,12);
    if(f.state==='dead'){f.t-=dt;if(f.t<=0)G.foes.splice(i,1);continue;}
    if(f.state==='spawn'){f.t-=dt;if(f.t<=0)f.state='chase';continue;}
    const tg=foeTarget(f),dx=tg.x-f.x,dy=tg.y-f.y,dist=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx);
    const sees=los(f.x,f.y,tg.x,tg.y);
    if(sees){f.last={x:tg.x,y:tg.y};f.lost=0;}else f.lost+=dt;
    if(f.lure){f.lure.t-=dt;if(f.lure.t<=0)f.lure=null;}
    const goal=f.lure&&!sees?f.lure:(sees?{x:tg.x,y:tg.y}:f.last);
    const spd=FOEDEF[f.kind].spd*(G.boss&&G.boss.p2?1.08:1);
    const gx=goal?goal.x-f.x:0,gy=goal?goal.y-f.y:0,gd=Math.hypot(gx,gy)||1;
    if(f.state==='stagger'){f.t-=dt;if(f.t<=0)f.state='chase';continue;}
    if(f.kind==='cinder'){
      if(f.state==='chase'){
        f.face=sees?ang:Math.atan2(gy,gx);
        if(goal&&gd>6){
          const px=-gy/gd,py=gx/gd,w=Math.sin(f.age*3+f.ph)*28;
          moveFoe(f,gx/gd*spd+px*w,gy/gd*spd+py*w,dt);
        }
        if(sees&&dist<62&&f.cd<=0){f.state='wind';f.t=.46;f.dir=ang;Aud.S.wind();tele({type:'line',x:f.x,y:f.y,a:ang,len:84,w:18,t:.46,t0:.46});}
      } else if(f.state==='wind'){
        f.t-=dt;f.face=f.dir;
        if(f.t<=0){f.state='lunge';f.t=.26;Aud.S.swing();}
      } else if(f.state==='lunge'){
        f.t-=dt;
        const sx=Math.cos(f.dir)*330,sy=Math.sin(f.dir)*330;
        const ox=f.x,oy=f.y;moveFoe(f,sx,sy,dt);
        if(Math.random()<.8)pt(f.x,f.y,0,0,.3,3,'#ff7a2a',{add:true});
        for(const t of teamChars())if(Math.hypot(t.c.x-f.x,t.c.y-f.y)<f.r+t.r+3){if(hurtTeam(1,f.x,f.y)||iframes()){f.t=0;}}
        if(Math.hypot(f.x-ox,f.y-oy)<.5)f.t=0;
        if(f.t<=0){f.state='recover';f.t=.8;f.vuln=.8;f.cd=1.4;}
      } else if(f.state==='recover'){f.t-=dt;if(f.t<=0)f.state='chase';}
    } else if(f.kind==='wisp'){
      f.face=ang;f.flyH=Math.sin(f.age*3+f.ph)*3;
      if(f.state==='chase'||f.state==='hover'){
        f.state='hover';
        const want=sees?140:20;
        let mx=0,my=0;
        if(dist<want-30){mx=-dx/dist*spd;my=-dy/dist*spd;}
        else if(dist>want+50||!sees){mx=(goal?gx/gd:0)*spd;my=(goal?gy/gd:0)*spd;}
        const so=Math.sin(f.age*.9+f.ph)>0?1:-1;mx+=-dy/dist*so*38;my+=dx/dist*so*38;
        moveFoe(f,mx,my,dt);
        if(sees&&f.cd<=0&&dist<260){f.state='charge';f.t=.62;Aud.S.wind();}
      } else if(f.state==='charge'){
        f.t-=dt;
        if(f.t<=0){
          const n=f.burst||1;
          for(let k=0;k<n;k++){const a=Math.atan2(tg.y-f.y,tg.x-f.x)+(k-(n-1)/2)*.28;fireOrb(f.x+Math.cos(a)*10,f.y+Math.sin(a)*10,a,160+(G.lvlBoost||0)*8);}
          Aud.S.orb();f.state='hover';f.cd=2.3+Math.random()*1.2;
        }
      }
    } else if(f.kind==='husk'){
      if(f.state==='chase'){
        f.face=sees?ang:Math.atan2(gy,gx);
        if(goal&&gd>8)moveFoe(f,gx/gd*spd,gy/gd*spd,dt);
        if(sees&&dist<86&&f.cd<=0){f.state='wind';f.t=.95;f.dir=ang;Aud.S.wind();tele({type:'circle',x:f.x+Math.cos(ang)*40,y:f.y+Math.sin(ang)*40,r:62,t:.95,t0:.95});}
      } else if(f.state==='wind'){
        f.t-=dt;
        if(f.t<=0){
          const cx=f.x+Math.cos(f.dir)*40,cy=f.y+Math.sin(f.dir)*40;
          for(const t of teamChars())if(Math.hypot(t.c.x-cx,t.c.y-cy)<62+t.r*.4)hurtTeam(1,cx,cy);
          shockwave(cx,cy,110,200,1);Aud.S.slam();shake(9);hitstop(.05);
          burst(cx,cy,22,'#6a5a4a',130,.8,5,{k:'smoke',gr:10,dr:1.4});burst(cx,cy,16,'#ffb060',160,.5,2.4,{add:true});
          f.state='recover';f.t=1.35;f.vuln=1.35;f.cd=1.6;
        }
      } else if(f.state==='recover'){f.t-=dt;if(f.t<=0)f.state='chase';}
    }
  }
}
function foeFront(f,sx,sy){let d=Math.atan2(sy-f.y,sx-f.x)-f.vf;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return Math.abs(d)<1.25;}
function damageFoe(f,dmg,o){
  o=o||{};
  if(f.state==='dead'||f.state==='spawn')return false;
  let m=1;
  if(f.vuln>0)m=1.5;
  else if(f.kind==='husk'&&foeFront(f,o.sx!=null?o.sx:G.wren.x,o.sy!=null?o.sy:G.wren.y)&&!o.back)m=.5;
  f.hp-=dmg*m;f.hitT=.16;
  if(o.kx!=null){f.kx+=o.kx;f.ky+=o.ky;}
  if(!o.fire){
    if(f.kind!=='husk'||dmg>=2||o.stagger){if(f.state==='wind'||f.state==='charge'){f.state='stagger';f.t=.4;}}
    burst(f.x,f.y,8,'#ffd27a',130,.3,2,{add:true});Aud.S.hit();
    floatText(f.x+rrand(-6,6),f.y-18,String(Math.round(dmg*m*10)/10).replace(/\.0$/,''),m>1?'#ffe27a':'#fff',m>1?14:11);
    if(o.hs)hitstop(o.hs);if(o.pn)punch(o.pn);if(o.sh)shake(o.sh);
  } else if(Math.random()<.2)burst(f.x,f.y,2,'#ff9a3a',70,.3,2,{add:true});
  if(f.hp<=0)killFoe(f);
  return true;
}
function killFoe(f){
  f.state='dead';f.t=.5;f.hp=0;G.st.kills=(G.st.kills||0)+1;
  burst(f.x,f.y,28,'#ff8a3a',150,.9,3,{add:true,g:-30,dr:1});burst(f.x,f.y,10,'#3a2a26',90,.8,5,{k:'smoke',gr:8});
  Aud.S.foeDie();hitstop(.06);
  const n=2+Math.floor(Math.random()*2);
  for(let i=0;i<n;i++)spawnPick('cinder',f.x,f.y,f.kind==='husk'?9:5);
  if(Math.random()<(f.kind==='husk'?.35:.1))spawnPick('heart',f.x,f.y,1);
  if(typeof onFoeDeath==='function')onFoeDeath(f);
}
function foesInCone(a,range,half){
  const L=[];
  for(const f of G.foes){if(f.state==='dead'||f.state==='spawn')continue;
    const dx=f.x-a.x,dy=f.y-a.y;if(Math.hypot(dx,dy)<range+f.r&&angDiff(Math.atan2(dy,dx),a.face)<half&&los(a.x,a.y,f.x,f.y))L.push(f);}
  return L;
}

/* ======================================================================
   WREN: strike, takedown, roll    ASHLING: nova
   ====================================================================== */
function strikePress(){
  const A=G.wren;
  if(G.active!=='wren'||G.strike.cd>0||G.roll.t>0||G.cine)return;
  let ang=A.face;
  if(mouse.used&&mouse.world&&!V.coarse)ang=Math.atan2(mouse.world.y-A.y,mouse.world.x-A.x);
  else{ // aim assist toward the nearest thing worth hitting
    let best=null,bd=76;
    const cand=[...G.guards.filter(g=>!g.spin&&g.stun<=0||g.stun>0&&!g.spin),...G.foes.filter(f=>f.state!=='dead')];
    for(const o of cand){const d=Math.hypot(o.x-A.x,o.y-A.y);if(d<bd&&angDiff(Math.atan2(o.y-A.y,o.x-A.x),A.face)<1.2){bd=d;best=o;}}
    if(best)ang=Math.atan2(best.y-A.y,best.x-A.x);
  }
  A.face=ang;
  if(G.time-G.strike.last>.9)G.strike.combo=0;
  const cb=G.strike.combo;G.strike.combo=(cb+1)%3;G.strike.last=G.time;
  A.atk={t:cb===2?.3:.22,t0:cb===2?.3:.22,a:ang,combo:cb};
  G.strike.cd=cb===2?.5:.34;G.strike.pend=.05;G.strike.ang=ang;G.strike.cb=cb;
  A.kx=(A.kx||0)+Math.cos(ang)*(cb===2?170:100);A.ky=(A.ky||0)+Math.sin(ang)*(cb===2?170:100);
  Aud.S.swing();
}
function resolveStrike(){
  const A=G.wren,ang=G.strike.ang,cb=G.strike.cb,reach=cb===2?44:36;
  let hit=0;
  const inArc=(o,r)=>{const dx=o.x-A.x,dy=o.y-A.y;return Math.hypot(dx,dy)<reach+(r||0)&&angDiff(Math.atan2(dy,dx),ang)<1.15;};
  G.fx.push({k:'slash',x:A.x,y:A.y,a:ang,t:.2,t0:.2,big:cb===2,col:'200,230,255'});
  for(const g of G.guards){
    if(g.spin||g.dead||g.boss||!inArc(g,6))continue;
    const behind=angDiff(Math.atan2(A.y-g.y,A.x-g.x),g.face)>1.5,unaware=!g.seeing&&g.stun<=0;
    hit++;
    if(unaware&&behind&&!g.lure){ // silent takedown
      g.stun=Math.max(g.stun,hasT('silent')?16:9);g.ko=true;G.st.takedowns=(G.st.takedowns||0)+1;G.st.stuns++;
      floatText(g.x,g.y-24,'TAKEDOWN','#9fd8ff',12);hitstop(.1);punch(.6);shake(5);
      burst(g.x,g.y,18,'#bfe4ff',130,.4,2,{add:true});Aud.S.hit();
      if(!hasT('silent'))lureNear(g.x,g.y,2*T,true);
    } else if(g.kind==='brute'&&!behind){
      Aud.S.deflect();burst(g.x+Math.cos(g.face)*10,g.y+Math.sin(g.face)*10,8,'#cfd6e6',120,.3,1.6,{add:true});floatText(g.x,g.y-22,'BLOCKED','#cfd6e6',10);
      A.kx-=Math.cos(ang)*140;A.ky-=Math.sin(ang)*140;
    } else {
      g.stun=Math.max(g.stun,1.8+(cb===2?1.2:0));g.ko=false;G.st.stuns++;
      const kx=Math.cos(ang)*16,ky=Math.sin(ang)*16;if(!blocked(g.x+kx,g.y+ky,8)){g.x+=kx;g.y+=ky;}
      G.alert=Math.min(.95,G.alert+.1);lureNear(g.x,g.y,4*T,true);
      floatText(g.x,g.y-22,'STUNNED','#ffd27a');hitstop(.06);punch(.4);shake(4);Aud.S.hit();burst(g.x,g.y,10,'#ffd27a',120,.3,2,{add:true});
    }
  }
  for(const f of G.foes){
    if(f.state==='dead'||!inArc(f,f.r))continue;
    const back=!foeFront(f,A.x,A.y);
    damageFoe(f,(cb===2?2:1)+(hasT('silent')?1:0)+(back?1:0),{kx:Math.cos(ang)*(cb===2?260:150),ky:Math.sin(ang)*(cb===2?260:150),hs:.06,pn:.5,sh:5,back,sx:A.x,sy:A.y,stagger:cb===2});hit++;
  }
  const B=G.boss;
  if(B&&!B.dead&&inArc(B,16)){bossHit(B,{type:'strike',combo:cb,sx:A.x,sy:A.y});hit++;}
  for(const p of G.pots)if(p.hp>0&&inArc({x:p.x*T+16,y:p.y*T+16},8)){breakPot(p);hit++;}
  for(const it of G.items)if(it.type==='o'&&!it.done&&it.fuse<0&&inArc(it,8)){it.fuse=.3;hit++;}
  for(const b of G.brazier||[])if(false)b.lit=true;
  if(hit)G.strike.cd*=.8;
}
function rollPress(){
  const A=G.wren;
  if(G.active!=='wren'||G.roll.cd>0||G.roll.t>0||G.cine)return;
  let a=A.face;const mx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0),my=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0);
  if(mx||my)a=Math.atan2(my,mx);else if(touch.jx||touch.jy)a=Math.atan2(touch.jy,touch.jx);
  G.roll={t:.3,cd:.85,a,grace:0};A.face=a;A.rollAnim=.3;
  Aud.S.swing();burst(A.x,A.y+4,8,'#a89a88',60,.4,3,{k:'smoke',gr:6});
}
function novaPress(){
  const A=G.ash;
  if(G.active!=='ash'||!hasT('nova')||G.nova.cd>0||G.flight||G.cine)return;
  G.nova.cd=6;G.nova.pend=.2;A.atk={kind:'nova',t:.55,t0:.55};A.novaAnim=.55;
  Aud.S.nova();Aud.fire(false);
  G.rings.push({x:A.x,y:A.y,t:.9,r:130,c:'255,170,70'});
}
function resolveNova(){
  const A=G.ash,R=84;
  burst(A.x,A.y,60,'#ffb040',250,.8,3.5,{add:true,dr:1.2});burst(A.x,A.y,24,'#5a4a42',120,1,8,{k:'smoke',gr:12,dr:1.2});
  G.fx.push({k:'nova',x:A.x,y:A.y,t:.55,t0:.55});
  G.flash={t:.35,c:'255,200,120'};shake(13);punch(1);hitstop(.07);
  for(const f of G.foes){
    const d=Math.hypot(f.x-A.x,f.y-A.y);if(d>R+f.r||f.state==='dead')continue;
    const a=Math.atan2(f.y-A.y,f.x-A.x);damageFoe(f,2,{kx:Math.cos(a)*380,ky:Math.sin(a)*380,stagger:true,sx:A.x,sy:A.y,back:true});f.vuln=Math.max(f.vuln,.9);
  }
  for(const g of G.guards){
    if(g.spin||g.boss||Math.hypot(g.x-A.x,g.y-A.y)>R+10)continue;
    g.stun=Math.max(g.stun,g.kind==='brute'?2:3.5);G.st.stuns++;floatText(g.x,g.y-22,'STUNNED','#ffd27a');
  }
  const B=G.boss;if(B&&!B.dead&&Math.hypot(B.x-A.x,B.y-A.y)<R+22)bossHit(B,{type:'nova'});
  G.proj=G.proj.filter(p=>Math.hypot(p.x-A.x,p.y-A.y)>R+10||(burst(p.x,p.y,6,'#ffb060',80,.3,2,{add:true}),false));
  for(const p of G.pots)if(p.hp>0&&Math.hypot(p.x*T+16-A.x,p.y*T+16-A.y)<R)breakPot(p);
  for(const it of G.items)if(it.type==='o'&&!it.done&&it.fuse<0&&Math.hypot(it.x-A.x,it.y-A.y)<R)it.fuse=.2;
  for(const k in G.cracks){const c=G.cracks[k];if(Math.hypot(c.x*T+16-A.x,c.y*T+16-A.y)<R-10)openCrack(c);}
  if(typeof igniteNear==='function')igniteNear(A.x,A.y,R);
}

/* ======================================================================
   per-frame combat step
   ====================================================================== */
function stepCombat(dt){
  const s=G.strike,r=G.roll,n=G.nova;
  s.cd=Math.max(0,s.cd-dt);r.cd=Math.max(0,r.cd-dt);n.cd=Math.max(0,n.cd-dt);
  if(s.pend>0){s.pend-=dt;if(s.pend<=0)resolveStrike();}
  if(n.pend>0){n.pend-=dt;if(n.pend<=0)resolveNova();}
  if(G.inv>0)G.inv-=dt;
  if(G.dash.grace>0)G.dash.grace-=dt;if(r.grace>0)r.grace-=dt;
  if(G.hpShake>0)G.hpShake-=dt;
  for(const c of [G.wren,G.ash]){if(c.atk){c.atk.t-=dt;if(c.atk.t<=0)c.atk=null;}if(c.rollAnim>0)c.rollAnim-=dt;if(c.novaAnim>0)c.novaAnim-=dt;if(c.hurtT>0)c.hurtT-=dt;}
  stepFoes(dt);stepProjectiles(dt);stepShocks(dt);stepPickups(dt);
  for(let i=G.fx.length-1;i>=0;i--){G.fx[i].t-=dt;if(G.fx[i].t<=0)G.fx.splice(i,1);}
  if(typeof stepBoss==='function')stepBoss(dt);
  if(typeof stepTrial==='function')stepTrial(dt);
  Aud.setCombat(Math.min(1,(foesAlive()*.25)+(G.boss&&G.boss.eng&&!G.boss.dead?.7:0)));
}

/* ======================================================================
   BOSSES: engagement cinematic, attack patterns, phases, defeat
   ====================================================================== */
const BOSSINFO={
  warden:{name:'THE BELL-WARDEN',sub:'Keeper of the Silence',col:'#f0c060'},
  candle:{name:'THE CANDLEMAKER',sub:'Always one step ahead',col:'#ff9a4a'}
};
function bossEngage(B,quiet){
  if(B.eng||B.dead)return;
  B.eng=true;B.st='roar';B.t=1.4;B.stg=0;B.tollCd=6;B.cd=2;B.sumCd=10;B.sign=1;B.walk=0;B.lure=null;B.ret=false;B.blink=null;B.p2=false;
  G.alert=Math.min(G.alert,.15);
  const info=BOSSINFO[B.kind==='candle'?'candle':'warden'];
  if(quiet)return;
  const A=activeChar();
  startCine('boss',{dur:3.4,minSkip:1.3,
    banner:{title:info.name,sub:info.sub,t0:.85,t1:3.1,col:info.col,dy:V.h*.2},
    cam:(u,t)=>{
      const k=ease(Math.min(1,t/.75)),back=ease(Math.max(0,(t-2.75)/.6));
      const bx=A.x+(B.x-A.x)*k*(1-back),by=A.y+(B.y-A.y)*k*(1-back);
      return{x:bx,y:by,z:1+.55*k*(1-back)+.05*Math.sin(t*2)};
    },
    tick:(c,dt)=>{
      B.roar=Math.max(0,Math.min(1,(c.t-.7)/.5))*(c.t<1.9?1:Math.max(0,1-(c.t-1.9)/.4));
      if(!c.r1&&c.t>.8){c.r1=1;Aud.S.roar();shake(14);hitstop(.08);
        G.rings.push({x:B.x,y:B.y,t:1,r:240,c:'255,190,90'},{x:B.x,y:B.y,t:.7,r:140,c:'255,255,220'});
        burst(B.x,B.y,40,'#ffb040',200,.9,3,{add:true});G.flash={t:.4,c:'255,220,150'};}
      if(c.r1&&Math.random()<.4)pt(B.x+rrand(-30,30),B.y+rrand(-10,20),0,rrand(-60,-20),.7,2,'#ffb040',{add:true});
    },
    onEnd:()=>{B.st='idle';B.t=.7;B.roar=0;
      say(B.kind==='candle'?'Candlemaker':'Ashling',B.kind==='candle'?'You came all this way to snuff my candles? How thoughtful.':'He is awake! Hit him when he is dazed, or from behind!');}
  });
}
function bossDeath(B){
  if(B.dead)return;
  B.dead=true;B.st='dead';B.hp=0;B.deathT=0;B.stun=1e9;
  G.proj.length=0;G.tele.length=0;G.shock.length=0;
  for(const f of G.foes)if(f.state!=='dead')killFoe(f);
  dropLoot(B.x,B.y,.5,true);for(let i=0;i<6;i++)spawnPick('cinder',B.x,B.y,12);spawnPick('heart',B.x,B.y,1);
  Aud.S.boom();hitstop(.22);punch(1);
  const info=BOSSINFO[B.kind==='candle'?'candle':'warden'];
  startCine('bossdeath',{dur:3.6,minSkip:1.8,
    banner:{title:'VICTORY',sub:info.name.charAt(0)+info.name.slice(1).toLowerCase()+' falls',t0:1.1,t1:3.3,col:'#ffe27a',dy:V.h*.2},
    cam:(u,t)=>({x:B.x,y:B.y,z:1+.7*easeOut(t/1.6)}),
    tick:(c,dt)=>{
      G.tsT=c.t<1.3?.28:1;
      if(!c.f1){c.f1=1;G.flash={t:.7,c:'255,245,220'};burst(B.x,B.y,90,'#ffd27a',280,1.4,3.6,{add:true,g:40,dr:.8});G.rings.push({x:B.x,y:B.y,t:1.2,r:260,c:'255,230,160'});shake(16);}
      c.fw=(c.fw||0)-dt;if(c.fw<=0&&c.t<2.4){c.fw=.12;burst(B.x+rrand(-26,26),B.y+rrand(-26,26),14,['#ffd27a','#ff9a4a','#fff'][Math.random()*3|0],150,.9,2.6,{add:true,g:30,dr:1});}
      if(c.t>1.3&&!c.f2){c.f2=1;Aud.S.win();}
    },
    onEnd:()=>{
      if(B.kind==='candle')say('Candlemaker','Burn it, crown it, break it. I was always one step ahead.');
      else say('Ashling','The bell is quiet. So is he. Mostly.');
    }
  });
}
function bossPhase2(B){
  if(B.p2)return;B.p2=true;
  G.rings.push({x:B.x,y:B.y,t:.9,r:200,c:'255,120,60'});shake(10);Aud.S.roar();
  burst(B.x,B.y,40,'#ff7a3a',180,.8,3,{add:true});
  toast('The '+(B.kind==='candle'?'Candlemaker':'Warden')+' grows desperate','He fights harder, and calls for help.','#ff9a4a');
  if(B.kind!=='candle'||true){for(let i=0;i<2;i++){const a=Math.random()*6.28;spawnFoe('cinder',B.x+Math.cos(a)*70,B.y+Math.sin(a)*70);}}
}
function bossVuln(B){return B.stg>0;}
function bossHit(B,o){
  if(B.dead)return false;
  const sx=o.sx!=null?o.sx:G.wren.x,sy=o.sy!=null?o.sy:G.wren.y;
  const behind=angDiff(Math.atan2(sy-B.y,sx-B.x),B.face)>1.3;
  const shield=B.kind==='candle'&&G.candlesLit>0;
  if(!B.eng){
    const sneak=!B.seeing&&behind&&!shield&&(o.type==='strike'||o.type==='dash');
    bossEngage(B);
    if(sneak){B.hp-=14;B.hurt=.3;floatText(B.x,B.y-34,'BACKSTAB -14','#ffe27a',14);Aud.S.hit();G.punch=1;}
  }
  if(shield){
    if(o.type!=='fire'||Math.random()<.04){Aud.S.deflect();burst(B.x,B.y,6,'#ffd27a',90,.25,1.6,{add:true});}
    B.hurt=.08;
    if(!G.shieldSaid&&o.type==='fire'){G.shieldSaid=true;say('Ashling','My fire slides right off. The candles are shielding him!');}
    return false;
  }
  const vuln=B.stg>0||(behind&&o.type==='fire')||(behind&&B.kind!=='candle'&&o.type!=='strike');
  let dmg=0;
  switch(o.type){
    case'fire':dmg=vuln?22*o.dt:0;break;
    case'strike':dmg=B.stg>0?(o.combo===2?5:3):(behind?1.6:.8);break;
    case'dash':dmg=B.stg>0?10:(behind?8:3);break;
    case'nova':dmg=B.stg>0?10:4;break;
    case'barrel':dmg=10;break;
  }
  if(o.type==='fire'&&!vuln){
    if(Math.random()<.05){Aud.S.deflect();burst(B.x+Math.cos(B.vf||0)*14,B.y+Math.sin(B.vf||0)*14,4,'#cfd6e6',90,.25,1.6,{add:true});}
    return false;
  }
  if(dmg<=0)return false;
  const was=B.hp;B.hp-=dmg;B.hurt=.14;
  if(o.type==='fire'){if(Math.floor(was/10)!==Math.floor(B.hp/10)){Aud.S.hit();floatText(B.x+rrand(-18,18),B.y-34,'-10','#ff8a60',12);}}
  else{Aud.S.hit();floatText(B.x+rrand(-14,14),B.y-34,'-'+Math.round(dmg),dmg>=5?'#ffe27a':'#fff',dmg>=5?15:11);hitstop(o.type==='strike'?.07:.1);shake(6);punch(.5);
    burst(B.x,B.y,10,'#ffd27a',130,.35,2,{add:true});}
  if(B.eng&&!B.p2&&B.hp<B.maxhp*.5&&B.hp>0)bossPhase2(B);
  if(B.hp<=0)bossDeath(B);
  return true;
}
function bossMove(B,dx,dy,dt,r){
  const nx=B.x+dx*dt,ny=B.y+dy*dt;
  let moved=false;
  if(!blocked(nx,B.y,r||13)){B.x=nx;moved=true;}
  if(!blocked(B.x,ny,r||13)){B.y=ny;moved=true;}
  return moved;
}
function stepBoss(dt){
  const B=G.boss;if(!B)return;
  if(B.hurt>0)B.hurt-=dt;
  easeFace(B,dt,B.st==='windCharge'||B.st==='charge'?4:9);
  if(B.dead){B.deathT=(B.deathT||0)+dt;return;}
  const A=activeChar();
  if(!B.eng){
    const d=Math.hypot(A.x-B.x,A.y-B.y);
    if(B.seeing||(d<4.2*T&&los(B.x,B.y,A.x,A.y)))bossEngage(B);
    return;
  }
  B.stg=Math.max(0,B.stg-dt);B.cd-=dt;B.tollCd-=dt;B.sumCd-=dt;
  if(B.kind==='candle')candleAI(B,A,dt);else wardenAI(B,A,dt);
}
function wardenAI(B,A,dt){
  const dx=A.x-B.x,dy=A.y-B.y,d=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx),p2=B.p2;
  switch(B.st){
    case'roar':B.t-=dt;if(B.t<=0){B.st='idle';B.t=.6;}break;
    case'idle':
      B.t-=dt;B.face=ang;
      if(d>96){B.walk+=dt*6;bossMove(B,dx/d*(p2?66:52),dy/d*(p2?66:52),dt);}
      if(B.t<=0){
        if(B.tollCd<=0){B.st='toll';B.t=.95;B.tollCd=p2?7:10;Aud.S.toll();G.rings.push({x:B.x,y:B.y,t:.95,r:7*T,c:'255,200,80'});B.movedAt=G.time;}
        else if(d<3.2*T&&Math.random()<.8){B.st='windSlam';B.t=p2?.7:.9;B.dir=ang;Aud.S.wind();tele({type:'circle',x:B.x+Math.cos(ang)*46,y:B.y+Math.sin(ang)*46,r:68,t:B.t,t0:B.t});}
        else if(d>2.8*T&&B.cd<=0){B.st='windCharge';B.t=p2?.65:.85;B.dir=ang;Aud.S.wind();tele({type:'line',x:B.x,y:B.y,a:ang,len:280,w:34,t:B.t,t0:B.t});}
        else B.t=.35;
      }
      break;
    case'windSlam':
      B.t-=dt;if(B.t>.25)B.face=B.dir=ang;
      if(B.t<=0){
        const cx=B.x+Math.cos(B.dir)*46,cy=B.y+Math.sin(B.dir)*46;
        for(const t of teamChars())if(Math.hypot(t.c.x-cx,t.c.y-cy)<68+t.r*.3)hurtTeam(p2?2:1,cx,cy);
        shockwave(cx,cy,p2?200:140,230,1);if(p2)shockwave(cx,cy,230,230,1,{delay:.35});
        Aud.S.slam();shake(13);hitstop(.07);G.rings.push({x:cx,y:cy,t:.5,r:90,c:'255,230,170'});
        burst(cx,cy,28,'#6a5a4a',160,.9,6,{k:'smoke',gr:10,dr:1.3});burst(cx,cy,22,'#ffb060',190,.5,2.6,{add:true});
        for(const k in G.cracks){const c=G.cracks[k];if(Math.hypot(c.x*T+16-cx,c.y*T+16-cy)<80)openCrack(c);}
        B.st='stagger';B.t=1.5;B.stg=1.5;
      }
      break;
    case'windCharge':
      B.t-=dt;if(B.t>.3)B.face=B.dir=ang;
      if(B.t<=0){B.st='charge';B.t=.95;B.dir=B.face;Aud.S.roar();}
      break;
    case'charge':{
      B.t-=dt;const sp=p2?360:320;
      const ok=bossMove(B,Math.cos(B.dir)*sp,Math.sin(B.dir)*sp,dt,14);
      B.walk+=dt*20;
      if(Math.random()<.9)pt(B.x,B.y+8,0,0,.4,5,'#8a7a6a',{k:'smoke',gr:6});
      for(const t of teamChars())if(Math.hypot(t.c.x-B.x,t.c.y-B.y)<22+t.r)hurtTeam(1,B.x,B.y);
      const hitWall=blocked(B.x+Math.cos(B.dir)*20,B.y+Math.sin(B.dir)*20,13);
      if(!ok||hitWall){
        shake(15);hitstop(.09);Aud.S.slam();burst(B.x+Math.cos(B.dir)*20,B.y+Math.sin(B.dir)*20,26,'#7a6a5a',170,.8,5,{k:'smoke',gr:8});
        burst(B.x,B.y,16,'#ffd27a',150,.4,2,{add:true});floatText(B.x,B.y-34,'DAZED!','#ffe27a',13);
        B.st='stagger';B.t=2.2;B.stg=2.2;B.cd=3;
      } else if(B.t<=0){B.st='stagger';B.t=.9;B.stg=.6;B.cd=2.5;}
      break;}
    case'toll':
      B.t-=dt;
      if(B.t<=0){
        if(G.time-(G.lastMoveT||-9)<.3&&d<7*T)hurtTeam(1,B.x,B.y);
        if(p2&&foesAlive()<3){const a=Math.random()*6.28;spawnFoe('cinder',B.x+Math.cos(a)*60,B.y+Math.sin(a)*60);}
        B.st='idle';B.t=.5;
      }
      break;
    case'stagger':B.t-=dt;if(B.t<=0){B.st='idle';B.t=.5;}break;
  }
}
function candleAI(B,A,dt){
  const dx=A.x-B.x,dy=A.y-B.y,d=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx),p2=B.p2,shielded=G.candlesLit>0;
  switch(B.st){
    case'roar':B.t-=dt;if(B.t<=0){B.st='float';B.t=.8;}break;
    case'float':{
      B.t-=dt;B.face=ang;
      const want=165,rad=(d-want)*.9,tx=-dy/d*B.sign*46,ty=dx/d*B.sign*46;
      bossMove(B,dx/d*rad+tx,dy/d*rad+ty,dt,12);
      if(Math.random()<dt*.25)B.sign*=-1;
      if(B.t<=0){
        const r=Math.random();
        if(B.sumCd<=0&&foesAlive()<2&&(shielded||p2)){B.st='summon';B.t=1;B.sumCd=14;Aud.S.wind();}
        else if(r<.42){B.st='volleyWind';B.t=p2?.55:.7;Aud.S.wind();}
        else if(r<.78){
          for(let n=0;n<30;n++){const a=Math.random()*6.283,rr=(1.7+Math.random()*1.2)*T,x=A.x+Math.cos(a)*rr,y=A.y+Math.sin(a)*rr;
            if(!blocked(x,y,12)){B.blink={x,y,t:1.05};G.rings.push({x,y,t:1.05,r:40,c:'255,120,60'});Aud.S.blink();break;}}
          B.st=B.blink?'blinkWind':'volleyWind';B.t=B.blink?1.05:.7;
        } else if(p2){B.st='ringWind';B.t=.85;Aud.S.wind();}
        else{B.st='volleyWind';B.t=.7;}
      }
      break;}
    case'volleyWind':
      B.t-=dt;B.face=ang;
      if(Math.random()<dt*20)pt(B.x+Math.cos(B.vf)*16,B.y+Math.sin(B.vf)*16,0,0,.3,3,'#ffb040',{add:true});
      if(B.t<=0){const n=p2?5:3;for(let k=0;k<n;k++)fireOrb(B.x,B.y,ang+(k-(n-1)/2)*(p2?.26:.34),150+(p2?25:0));Aud.S.orb();B.st='float';B.t=p2?.95:1.35;}
      break;
    case'blinkWind':
      B.t-=dt;
      if(B.t<=0&&B.blink){
        const q=B.blink;burst(B.x,B.y,24,'#ff8a40',100,.6,2.5,{add:true});
        B.x=q.x;B.y=q.y;B.blink=null;B.face=Math.atan2(A.y-B.y,A.x-B.x);B.vf=B.face;
        G.rings.push({x:B.x,y:B.y,t:.6,r:70,c:'255,120,60'});burst(B.x,B.y,26,'#ff8a40',140,.7,3,{add:true});Aud.S.blink();shake(4);
        B.st='slashWind';B.t=.42;Aud.S.wind();tele({type:'cone',x:B.x,y:B.y,a:B.face,r:62,half:1.0,t:.42,t0:.42});
      }
      break;
    case'slashWind':
      B.t-=dt;if(B.t>.15)B.face=ang;
      if(B.t<=0){
        G.fx.push({k:'slash',x:B.x,y:B.y,a:B.face,t:.25,t0:.25,big:true,col:'255,150,70'});Aud.S.slash();shake(6);
        for(const t of teamChars()){const ddx=t.c.x-B.x,ddy=t.c.y-B.y;if(Math.hypot(ddx,ddy)<62+t.r&&angDiff(Math.atan2(ddy,ddx),B.face)<1.0)hurtTeam(1,B.x,B.y);}
        B.st='stagger';B.t=1.25;B.stg=1.25;
      }
      break;
    case'ringWind':
      B.t-=dt;
      if(B.t<=0){const off=Math.random()*6.28;for(let k=0;k<8;k++)fireOrb(B.x,B.y,off+k*.7854,115,{curve:.35});Aud.S.orb();B.st='float';B.t=1.6;}
      break;
    case'summon':
      B.t-=dt;if(Math.random()<dt*30)pt(B.x+rrand(-30,30),B.y+rrand(-30,30),0,-30,.6,2,'#ffb040',{add:true});
      if(B.t<=0){const a=Math.random()*6.28;spawnFoe('wisp',B.x+Math.cos(a)*50,B.y+Math.sin(a)*50);B.st='float';B.t=1;}
      break;
    case'stagger':B.t-=dt;if(B.t<=0){B.st='float';B.t=.6;}break;
  }
}
