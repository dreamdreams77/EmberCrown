'use strict';
/* EMBERCROWN - actors: Shiloh, Ashling, foes, bosses, and combat effects. */

/* Faces: drawn in local head space, facing +x, from above. mood: calm|wary|alarm|hurt|ko|focus|shout|joy|rage */
function drawFace(c,x,y,sc,mood,ph,eyeCol,skinCol){
  const bl=(G.time*.7+ph)%3.7<.11,ink='#2a1a1a';
  c.save();c.translate(x,y);c.scale(sc,sc);c.lineCap='round';c.lineJoin='round';
  for(const sd of[-1,1]){
    const ey=sd*1.45;
    c.strokeStyle=ink;c.fillStyle=eyeCol||ink;c.lineWidth=.42;
    if(mood==='ko'){c.beginPath();c.moveTo(-.5,ey-.5);c.lineTo(.5,ey+.5);c.moveTo(-.5,ey+.5);c.lineTo(.5,ey-.5);c.stroke();}
    else if(bl||mood==='hurt'){c.beginPath();if(mood==='hurt'){c.moveTo(-.5,ey-sd*.5);c.lineTo(.5,ey);c.lineTo(-.5,ey+sd*.5);}else{c.moveTo(-.4,ey);c.lineTo(.5,ey);}c.stroke();}
    else if(mood==='alarm'){c.fillStyle='#fff';ell(c,0,ey,.95,.95);c.fill();c.fillStyle=eyeCol||ink;circ(c,.28,ey,.48);c.fill();}
    else if(mood==='joy'){c.beginPath();c.arc(0,ey,.6,3.5,6.0);c.stroke();}
    else{const ry=(mood==='wary'||mood==='focus'||mood==='rage')?.36:.6;ell(c,0,ey,.62,ry);c.fill();}
    // brows sit behind the eyes (toward the crown of the head)
    let xi=-1,xo=-1;
    if(mood==='wary'||mood==='focus'){xi=-.55;xo=-1.45;}
    else if(mood==='rage'){xi=-.2;xo=-1.7;}
    else if(mood==='alarm'){xi=-1.6;xo=-.8;}
    else if(mood==='hurt'){xi=-1.5;xo=-.9;}
    if(mood!=='ko'&&mood!=='joy'){c.lineWidth=.5;c.beginPath();c.moveTo(xi,sd*.7);c.lineTo(xo,sd*2.1);c.stroke();}
  }
  c.lineWidth=.45;c.strokeStyle=ink;
  if(mood==='alarm'||mood==='shout'||mood==='ko'){c.fillStyle='#4a1010';ell(c,2.2,0,mood==='ko'?.45:.6,mood==='shout'?1.0:.8);c.fill();}
  else if(mood==='wary'||mood==='rage'){c.beginPath();c.moveTo(1.8,-.8);c.quadraticCurveTo(2.5,0,1.8,.8);c.stroke();}
  else if(mood==='hurt'){c.beginPath();c.moveTo(2,-.9);c.lineTo(2.3,-.3);c.lineTo(2,.3);c.lineTo(2.3,.9);c.stroke();}
  else if(mood==='joy'){c.beginPath();c.moveTo(1.7,-1);c.quadraticCurveTo(2.7,0,1.7,1);c.stroke();}
  else{c.beginPath();c.moveTo(2.1,-.7);c.lineTo(2.1,.7);c.stroke();}
  c.restore();
}
function guardMood(g){
  if(g.stun>0)return g.ko?'ko':'hurt';
  if(g.boss&&g.p2)return'rage';
  if(g.seeing||g.bang>0||g.eng)return g.boss?'rage':'alarm';
  if(g.quest>0||g.lure)return'wary';
  return'calm';
}
function bodyFlash(o){return o.hitT>0||o.hurt>0;}
function drawKO(g,col,trim){
  const c=ctx,t=G.time;
  shadowAt(g.x,g.y+3,15,6,.4);
  c.save();c.translate(g.x,g.y+2);c.rotate((g.ph%1)*.4+1.2);c.scale(1,.78);
  c.fillStyle='#2a2226';ell(c,-9,-3,3.6,2.2);c.fill();ell(c,-10,4,3.6,2.2);c.fill();
  c.fillStyle=sh(col,.72);ell(c,0,0,7.4,9.2);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.stroke();
  c.fillStyle=trim;c.fillRect(-1,-8,2,16);
  c.fillStyle='#8a8f9e';circ(c,6,0,5.4);c.fill();c.fillStyle='#d8b898';ell(c,9,0,2.8,3.3);c.fill();drawFace(c,9,0,1,'ko',g.ph);
  c.restore();
  c.strokeStyle='#8a7a60';c.lineWidth=1.6;c.beginPath();c.moveTo(g.x-14,g.y+12);c.lineTo(g.x+14,g.y+8);c.stroke();
  for(let i=0;i<3;i++){const k=((t*.7+i*.33)%1);c.fillStyle='rgba(200,220,255,'+(1-k)*.9+')';c.font='bold '+(8+k*5)+'px '+HEAD;c.fillText('z',g.x+6+k*8,g.y-12-k*16);}
}

/* ---------- Shiloh ---------- */
/* secondary motion: a chain of points hanging behind a root, each lagging and keeping its link length */
function ropeChain(o,key,n,len,rx,ry,bx,by,k,dt,flut,t){
  let ch=o[key];
  if(!ch||ch.length!==n||Math.hypot(ch[0].x-rx,ch[0].y-ry)>46){ch=o[key]=[];for(let i=0;i<n;i++)ch.push({x:rx+bx*len*i,y:ry+by*len*i});}
  ch[0].x=rx;ch[0].y=ry;
  const nx=-by,ny=bx,kk=Math.min(1,dt*k);
  for(let i=1;i<n;i++){
    const p=ch[i],q=ch[i-1],w=Math.sin(t*flut+i*1.1+(o.ph||0)*.3)*.6*(i/n);
    p.x+=(q.x+(bx+nx*w)*len-p.x)*kk;p.y+=(q.y+(by+ny*w)*len-p.y)*kk;
    const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy)||1;
    p.x=q.x+dx/d*len;p.y=q.y+dy/d*len;
  }
  return ch;
}
/* tapered strip along a chain: widths[i] is the half width at point i */
function strip(c,ch,wd,fill,stroke,lw){
  const n=ch.length,L=[],R=[];
  for(let i=0;i<n;i++){
    const a=ch[Math.max(0,i-1)],b=ch[Math.min(n-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,m=Math.hypot(dx,dy)||1,nx=-dy/m*wd[i],ny=dx/m*wd[i];
    L.push(ch[i].x+nx,ch[i].y+ny);R.push(ch[i].x-nx,ch[i].y-ny);
  }
  c.beginPath();c.moveTo(L[0],L[1]);
  for(let i=1;i<n;i++)c.lineTo(L[i*2],L[i*2+1]);
  for(let i=n-1;i>=0;i--)c.lineTo(R[i*2],R[i*2+1]);
  c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||1;c.lineJoin='round';c.stroke();}
}
function charState(o,active,dt0){
  const t=G.time,dt=Math.min(.05,Math.max(0,t-(o._ct==null?t:o._ct)));o._ct=t;
  const lose=mode==='lose'&&active,now=performance.now()/1000;
  if(lose){if(o._d0==null)o._d0=now;}else o._d0=null;
  return{dt,death:lose?Math.min(1,(now-o._d0)/.9):0,hurt:active&&G.hurtFlash>0?G.hurtFlash/.4:0};
}
const WOL='rgba(16,8,30,.9)';
function drawWren(w,active){
  const c=ctx,t=G.time,sp=Math.hypot(w.vx||0,w.vy||0),mv=sp>14,sneak=G.sneak&&active,f=vfa(w);
  const st=charState(w,active),dt=st.dt,death=st.death,hk=st.hurt;
  const roll=w.rollAnim>0?1-w.rollAnim/.3:-1,atk=w.atk&&w.atk.a!==undefined?w.atk:null;
  const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!death;
  c.globalAlpha=blink?.35:1;
  const cf=Math.cos(f),sf=Math.sin(f);
  shadowAt(w.x,w.y+4,roll>=0?8:10+death*4,5.5+death*1.5,.38);
  if(hasT('cloak')){c.globalCompositeOperation='lighter';c.fillStyle='rgba(150,110,255,'+(.10+.05*Math.sin(G.time*3)+(sneak?.08:0))+')';circ(c,w.x,w.y,17);c.fill();c.globalCompositeOperation='source-over';}
  // cloak tail: three-link chain that swings when she turns and settles when she stops
  const drag=roll>=0?.4:1;
  const cl=ropeChain(w,'_cl',5,mv?4.6*drag:4,w.x-cf*4,w.y-sf*4,-cf,-sf,mv?11:7,dt,mv?13:2.2,t);
  const wid=sneak?[6.4,6,4.8,3.2,1.2]:[7,6.6,5.4,3.6,1.2];
  if(roll<0&&!death){
    strip(c,cl,wid,'#43357a',WOL,1.1);
    strip(c,cl,wid.map(v=>v*.5),'rgba(143,123,208,.55)');
    // hem notches
    c.fillStyle='rgba(16,8,30,.55)';const e=cl[4],d=cl[3];c.beginPath();c.moveTo(e.x,e.y);c.lineTo(d.x+(e.y-d.y)*.9,d.y-(e.x-d.x)*.9);c.lineTo(d.x-(e.y-d.y)*.9,d.y+(e.x-d.x)*.9);c.fill();
  }
  // scarf: two bright ribbons that flutter in her own wind
  const sc1=ropeChain(w,'_sc',6,3.3,w.x+cf*1.5-sf*2.4,w.y+sf*1.5+cf*2.4,-cf,-sf,mv?16:9,dt,mv?24:9,t);
  const sc2=ropeChain(w,'_sd',5,2.9,w.x+cf*1.5+sf*2.4,w.y+sf*1.5-cf*2.4,-cf,-sf,mv?14:8,dt,mv?20:8,t+1.7);
  if(roll<0&&!death){
    strip(c,sc2,[1.9,1.7,1.4,1,.5],'#b8403e','rgba(60,12,20,.7)',.8);
    strip(c,sc1,[2,1.9,1.6,1.2,.8,.4],'#e0605a','rgba(60,12,20,.7)',.8);
  }
  c.save();c.translate(w.x,w.y);
  if(roll>=0){ // tumbling roll: tucked ball with a speed smear
    c.rotate(f);c.fillStyle='rgba(75,58,130,.28)';ell(c,-10,0,9,6);c.fill();ell(c,-17,0,6,4);c.fill();
    c.rotate(roll*12.5);c.scale(.9,.8);
    c.fillStyle='#43357a';ell(c,0,0,9,8);c.fill();c.strokeStyle=WOL;c.lineWidth=1.2;c.stroke();
    c.fillStyle='#8f7bd0';ell(c,-2,-2,5,4);c.fill();
    c.fillStyle='#2f2352';circ(c,5,0,4.6);c.fill();c.stroke();c.fillStyle='#d9534f';c.fillRect(-1,-8,3,16);
    c.restore();c.globalAlpha=1;return;
  }
  c.rotate(f);
  // pose
  const u=atk?1-atk.t/atk.t0:0,sgn=atk?((atk.combo%2)?-1:1):1,ang=atk?(-1.2+2.4*ease(u))*sgn:0;
  let lean=atk?.22:(sneak?.1:0);
  const step=mv?Math.sin(w.ph*2):0,br=1+Math.sin(t*2.4)*.02*(mv?0:1);
  if(atk){c.rotate(ang*.16);c.translate(Math.sin(u*Math.PI)*(atk.combo===2?3.4:2),0);}
  if(hk>0){c.translate(-hk*3.2,0);c.rotate(Math.sin(t*55)*.07*hk);}
  if(death>0){c.rotate(death*1.25);c.translate(0,death*2);}
  c.scale((sneak?.96:br)*(1+step*.02)*(1+death*.12),(sneak?.88:br)*(1-step*.015)*(1-death*.3)*(1-hk*.08));
  c.translate(lean*6+(mv&&!sneak?.6:0),0);
  c.lineJoin='round';c.lineCap='round';
  // boots
  const sw=Math.sin(w.ph),stride=(sneak?2.4:3.6)*(mv?1:0);
  c.fillStyle='#241a30';c.strokeStyle=WOL;c.lineWidth=.9;
  ell(c,sw*stride,-4.6,3.4,2.3);c.fill();c.stroke();ell(c,-sw*stride,4.6,3.4,2.3);c.fill();c.stroke();
  c.fillStyle='#4a3a28';ell(c,sw*stride+1.4,-4.6,1.2,1.4);c.fill();ell(c,-sw*stride+1.4,4.6,1.2,1.4);c.fill();
  // torso
  const g=c.createRadialGradient(-1,-2,1,0,0,10);g.addColorStop(0,bodyFlash(w)?'#fff':'#9a84dc');g.addColorStop(.6,'#5e4aa0');g.addColorStop(1,'#43357a');
  c.fillStyle=g;ell(c,0,0,7.2,9);c.fill();c.strokeStyle=WOL;c.lineWidth=1.2;c.stroke();
  // cloak folds and a shoulder mantle
  c.strokeStyle='rgba(20,10,40,.4)';c.lineWidth=.8;c.beginPath();c.moveTo(-4,-5);c.quadraticCurveTo(-6,0,-4,5);c.moveTo(-1,-7);c.quadraticCurveTo(-3,0,-1,7);c.stroke();
  c.fillStyle='rgba(180,160,240,.28)';ell(c,1,-3,4,2.2,.2);c.fill();
  // belt, pouch
  c.fillStyle='#3a2a1a';c.fillRect(-2,-8.2,3,2.6);c.fillStyle='#6a4a2a';c.fillRect(-1.4,-7.8,1.6,1.5);
  c.fillStyle='#2a1a10';c.fillRect(-3,5.4,4,3);
  // arms
  const as=mv?Math.sin(w.ph+1.5)*(sneak?2:3.2):0;
  c.fillStyle='#43357a';c.strokeStyle=WOL;c.lineWidth=.9;
  if(atk){
    const bx=3+Math.cos(ang)*8,by=-7*sgn+Math.sin(ang)*8,bl=atk.combo===2?20:15;
    ell(c,bx*.6+2,by*.6,4,2.6,ang);c.fill();c.stroke();
    ell(c,2.5,-sgn*-8,4,2.6,.3*-sgn);c.fill();
    const tx=bx+Math.cos(ang)*bl,ty=by+Math.sin(ang)*bl;
    c.strokeStyle='rgba(16,16,28,.8)';c.lineWidth=3.2;c.beginPath();c.moveTo(bx,by);c.lineTo(tx,ty);c.stroke();
    c.strokeStyle='#eef2fa';c.lineWidth=1.8;c.stroke();
    c.strokeStyle='#8a6a30';c.lineWidth=2;c.beginPath();c.moveTo(bx-Math.sin(ang)*2.2,by+Math.cos(ang)*2.2);c.lineTo(bx+Math.sin(ang)*2.2,by-Math.cos(ang)*2.2);c.stroke();
    c.fillStyle='#e8c8a8';circ(c,bx,by,1.9);c.fill();
  } else {
    ell(c,2.5+as,-8,4,2.6,.3);c.fill();c.stroke();ell(c,2.5-as,8,4,2.6,-.3);c.fill();c.stroke();
    c.fillStyle='#e8c8a8';circ(c,6.4+as,-8.6,1.8);c.fill();circ(c,6.4-as,8.6,1.8);c.fill();
    // sheathed dagger at the hip, drawn and held low while sneaking
    c.strokeStyle='rgba(16,16,28,.8)';c.lineWidth=2.6;c.beginPath();c.moveTo(4,9.8);c.lineTo(sneak?11:9,11.5);c.stroke();
    c.strokeStyle='#d8dce8';c.lineWidth=1.3;c.stroke();
  }
  // head: hood with a back point, looks around when idle
  const look=mv?0:Math.sin(t*.8+1)*.3+Math.sin(t*.37)*.2;
  c.save();c.translate(sneak?3:2,0);c.rotate(look+(atk?ang*.1:0));
  c.fillStyle='#2f2352';c.strokeStyle=WOL;c.lineWidth=1.1;
  c.beginPath();c.moveTo(-5.2,-2.4);c.lineTo(-9.4+Math.sin(t*3+w.ph)*.5,0);c.lineTo(-5.2,2.4);c.fill();c.stroke();
  circ(c,0,0,5.8);c.fill();c.stroke();
  c.strokeStyle='rgba(150,130,220,.35)';c.lineWidth=.8;c.beginPath();c.arc(0,0,4.6,2.3,4);c.stroke();
  c.fillStyle='#e8c8a8';circ(c,3.2,0,3.2);c.fill();
  const wm=death>.3?'ko':bodyFlash(w)||hk>0?'hurt':atk?'shout':G.alert>.7?'alarm':sneak?'focus':'calm';
  drawFace(c,4.3,0,.9,wm,w.ph>0?1.3:0,'#3a2a1a');
  c.restore();
  // scarf collar
  c.fillStyle='#d9534f';c.strokeStyle='rgba(60,12,20,.7)';c.lineWidth=.8;
  c.beginPath();c.moveTo(-1,-5.5);c.quadraticCurveTo(1,-7,3,-5);c.lineTo(3,5);c.quadraticCurveTo(1,7,-1,5.5);c.closePath();c.fill();c.stroke();
  if(bodyFlash(w)){c.fillStyle='rgba(255,255,255,.5)';ell(c,0,0,8,9.5);c.fill();}
  c.restore();c.globalAlpha=1;
}

/* ---------- Ashling ---------- */
function drawAsh(a,active){
  const c=ctx,t=G.time,fl=G.flight,sp=Math.hypot(a.vx||0,a.vy||0),mv=sp>14,f=vfa(a);
  const st=charState(a,active),dt=st.dt,death=st.death,hk=st.hurt;
  const dashing=G.dash.t>0,nova=a.novaAnim>0,cel=a.celebrate>0;
  if(cel)a.celebrate-=.016;
  const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!death;
  c.globalAlpha=blink?.35:1;
  const gk=Math.min(12,stats.gems)/12,cf=Math.cos(f),sf=Math.sin(f);
  const sc=(fl?1.4:1)*(nova?1+Math.sin((1-a.novaAnim/.55)*3.14)*.35:1),hover=fl?Math.sin(t*3)*2:(cel?-Math.abs(Math.sin(t*9))*9:0);
  shadowAt(a.x+(fl?7:0),a.y+(fl?14:5),(fl?13:11)*(cel?.8:1)*(1+gk*.15),fl?6:5.5,fl?.25:.38);
  const OL='rgba(60,16,6,.9)';
  // tail: seven-link chain, longer with every few gems, tipped with a flame that grows
  const tl=3.3+gk*.9,fire=G.fireOn&&active;
  const tc=ropeChain(a,'_tl',7,tl,a.x-cf*6,a.y-sf*6,-cf,-sf,mv||dashing?12:6,dt,mv?15:3.2,t);
  const tw=[3.2,2.9,2.5,2,1.5,1,.5];
  if(!death){
    strip(c,tc,tw,'#c24a18',OL,1);strip(c,tc,tw.map(v=>v*.5),'#f07a2a');
    const e=tc[6],d=tc[5],ta=Math.atan2(e.y-d.y,e.x-d.x),fs=1+gk*.9;
    c.save();c.translate(e.x,e.y);c.rotate(ta);
    c.fillStyle='#ffd27a';c.strokeStyle=OL;c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.lineTo(-1,-2.6*fs);c.lineTo(5*fs,0);c.lineTo(-1,2.6*fs);c.closePath();c.fill();c.stroke();
    c.restore();
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,70,'+(.35+gk*.2+Math.sin(t*9)*.08)+')';circ(c,e.x,e.y,4+gk*4);c.fill();c.globalCompositeOperation='source-over';
  }
  c.save();c.translate(a.x,a.y+hover);c.rotate(f);
  if(hk>0){c.translate(-hk*3,0);c.rotate(Math.sin(t*55)*.08*hk);}
  if(death>0){c.rotate(death*.9);c.translate(0,death*2);}
  if(dashing)c.scale(1.28,.8);else c.scale(sc*(fire?.96:1)*(1+death*.1),sc*(1-death*.3)*(1-hk*.08));
  c.lineJoin='round';c.lineCap='round';
  // wings: bigger with ember gems, folded at rest, swept out when airborne, shaken out every so often
  const air=fl||dashing||cel||nova,shake=!air&&!mv&&(t%9)<.7?Math.sin(t*44)*1.6:0;
  const spread=death?.5:air?1:mv?.95:.8,ws=(1+gk*.5)*(nova||cel?1.4:1)*spread;
  const flap=Math.sin(t*(air?16:(mv?11:2.2)))*((fl||nova||cel)?5:(mv?3:1.2))+shake;
  const wcol=bodyFlash(a)?'#ffd0b0':'#a8401a';
  for(const s of[-1,1]){
    const ex=-2,ey=s*(9+flap*.5)*ws,tx=-13*(1+gk*.2),ty=s*(15+flap)*ws,lag=Math.sin(t*(air?16:11)-.7)*(air?2.4:1)*s,tyy=ty+lag;
    const p1x=-10.5,p1y=s*10.5*ws,p2x=-9.5,p2y=s*7.5*ws;
    c.fillStyle=wcol;c.beginPath();c.moveTo(1,s*4.5);c.lineTo(ex,ey);c.lineTo(tx,tyy);c.quadraticCurveTo(-9.5,(tyy+p1y)/2,p1x,p1y);c.quadraticCurveTo(-8.4,(p1y+p2y)/2+s*1.2,p2x,p2y);c.quadraticCurveTo(-9.6,s*5.2,-8,s*4);c.closePath();c.fill();
    c.strokeStyle=OL;c.lineWidth=1;c.stroke();
    c.strokeStyle='#ff9a4a';c.lineWidth=.9;c.beginPath();c.moveTo(1,s*4.5);c.lineTo(ex,ey);c.lineTo(tx,tyy);c.moveTo(ex,ey);c.lineTo(p1x,p1y);c.moveTo(ex,ey);c.lineTo(p2x,p2y);c.stroke();
    c.fillStyle='rgba(255,200,120,.16)';c.beginPath();c.moveTo(ex,ey);c.lineTo(tx,tyy);c.lineTo(p1x,p1y);c.closePath();c.fill();
  }
  // back plates: more as she grows
  const np=4+Math.round(gk*4);
  c.fillStyle='#ffd27a';c.strokeStyle=OL;c.lineWidth=.6;
  for(let i=0;i<np;i++){const x=-1-i*2.7;c.beginPath();c.moveTo(x,-1.4);c.lineTo(x-2.2,0);c.lineTo(x,1.4);c.closePath();c.fill();}
  // body
  const g=c.createRadialGradient(-1,-3,1,0,0,10);g.addColorStop(0,bodyFlash(a)?'#fff':'#ffa660');g.addColorStop(1,'#d04a18');
  c.fillStyle=g;ell(c,1,0,9,7);c.fill();c.strokeStyle=OL;c.lineWidth=1.1;c.stroke();
  c.fillStyle='rgba(255,225,160,.7)';ell(c,2.4,0,5,3.4);c.fill();
  c.strokeStyle='rgba(180,70,20,.45)';c.lineWidth=.6;c.beginPath();for(let i=0;i<3;i++){c.moveTo(1+i*2.2-1,-2.6);c.lineTo(1+i*2.2-1,2.6);}c.stroke();
  // ember gem on the withers: glows brighter the more she has
  if(stats.gems>0){c.save();c.translate(-1,0);c.fillStyle='#ffd27a';c.strokeStyle=OL;c.lineWidth=.6;const gs=1.4+gk*1.4;c.beginPath();c.moveTo(gs,0);c.lineTo(0,-gs*.8);c.lineTo(-gs,0);c.lineTo(0,gs*.8);c.closePath();c.fill();c.stroke();
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,60,'+(.28+.12*Math.sin(t*4))+')';circ(c,0,0,3.5+gk*3);c.fill();c.globalCompositeOperation='source-over';c.restore();}
  const sw=Math.sin(a.ph),sd=mv?3:0;c.fillStyle='#b8401a';c.strokeStyle=OL;c.lineWidth=.8;
  ell(c,3+sw*sd,-6.5,2.8,1.9);c.fill();c.stroke();ell(c,3-sw*sd,6.5,2.8,1.9);c.fill();c.stroke();
  // head: tilts up and opens its jaw when breathing fire, looks about when idle
  const firing=fire,look=mv||firing?0:Math.sin(t*.9)*.18+Math.sin(t*.31)*.12;
  const hb=firing?-.14:Math.sin(t*2.2)*.05+look;
  c.save();c.translate(9+(firing?1.4:0),0);c.rotate(hb);
  const hl=3+gk*2.2;
  c.fillStyle='#ffe0a0';c.strokeStyle=OL;c.lineWidth=.7; // horns, longer with age
  c.beginPath();c.moveTo(-2.4,-3);c.lineTo(-3-hl,-3.4-hl*.9);c.lineTo(-.6,-4.2);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(-2.4,3);c.lineTo(-3-hl,3.4+hl*.9);c.lineTo(-.6,4.2);c.closePath();c.fill();c.stroke();
  c.fillStyle='#ff7a2f';ell(c,0,0,5.6,4.8);c.fill();c.strokeStyle=OL;c.lineWidth=1;c.stroke();
  c.fillStyle='#ffa050';ell(c,4.2,0,3.4,2.8);c.fill();c.strokeStyle='rgba(60,16,6,.6)';c.lineWidth=.7;c.stroke();
  if(firing){c.fillStyle='#3a1008';ell(c,5.6,0,2.6,1.9);c.fill();}
  c.fillStyle='#6a2a10';circ(c,6.4,-1,.7);c.fill();circ(c,6.4,1,.7);c.fill();
  const sq=firing||dashing?.5:1,am=bodyFlash(a)||hk>0?1:0;
  if(death>.3){c.strokeStyle='#2a1008';c.lineWidth=.8;c.beginPath();for(const y of[-2.5,2.5]){c.moveTo(.8,y-.8);c.lineTo(2.4,y+.8);c.moveTo(.8,y+.8);c.lineTo(2.4,y-.8);}c.stroke();}
  else{
    const bl=(t*.6+a.ph)%4.3<.12;
    c.fillStyle='#fff4a0';ell(c,1.4,-2.5,1.5,(bl?.25:1.5)*sq);c.fill();ell(c,1.4,2.5,1.5,(bl?.25:1.5)*sq);c.fill();
    if(!bl){c.fillStyle='#2a1008';circ(c,1.7,-2.5,.75*sq);c.fill();circ(c,1.7,2.5,.75*sq);c.fill();}
  }
  c.strokeStyle='#8a3010';c.lineWidth=.9;c.beginPath();
  const bw=am||G.alert>.7,bf=firing||dashing;
  c.moveTo(.4,-1.3);c.lineTo(bf?-0.4:bw?-1.2:.1,-4.1);c.moveTo(.4,1.3);c.lineTo(bf?-0.4:bw?-1.2:.1,4.1);c.stroke();
  if(am&&death<=.3){c.strokeStyle='#2a1008';c.lineWidth=.8;c.beginPath();c.moveTo(1,-2.5);c.lineTo(2.4,-2.5);c.moveTo(1,2.5);c.lineTo(2.4,2.5);c.stroke();}
  if(firing){c.fillStyle='rgba(255,220,120,.9)';circ(c,7,0,3);c.fill();}
  c.restore();
  if(bodyFlash(a)){c.fillStyle='rgba(255,255,255,.5)';ell(c,1,0,10,8);c.fill();}
  if(dashing){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,160,60,.35)';ell(c,-6,0,14,6);c.fill();c.globalCompositeOperation='source-over';}
  c.restore();c.globalAlpha=1;
}

/* ---------- foes ---------- */
function drawFoe(f){
  const c=ctx,t=G.time,fa=vfa(f);
  let al=1,sc=1;
  if(f.state==='spawn'){const u=1-f.t/.7;al=ease(u);sc=.4+.6*easeOut(u);}
  if(f.state==='dead'){const u=1-f.t/.5;al=1-u;sc=1+u*.3;}
  c.globalAlpha=al;
  const wind=f.state==='wind'||f.state==='charge',rec=f.state==='recover'||f.state==='stagger';
  const flash=f.hitT>0;
  if(f.kind==='cinder'){
    shadowAt(f.x,f.y+5,9*sc,4,.35);
    c.save();c.translate(f.x,f.y);c.rotate(fa);
    let sx=1,sy=1;if(wind){sx=1.15+Math.sin(t*40)*.04;sy=.8;}else if(f.state==='lunge'){sx=1.5;sy=.7;}else if(rec){sx=.9;sy=1.1;}
    c.scale(sc*sx,sc*sy);
    const leg=Math.sin(f.age*14)*(f.state==='chase'?3:0);
    c.fillStyle='#1c1412';ell(c,leg,-5,3,2);c.fill();ell(c,-leg,5,3,2);c.fill();
    const gr=c.createRadialGradient(-1,-2,1,0,0,10);gr.addColorStop(0,flash?'#fff':'#5a3a30');gr.addColorStop(1,'#1c1210');
    c.fillStyle=gr;ell(c,0,0,8,7.4);c.fill();c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1.1;c.stroke();
    const glow=wind?.9+Math.sin(t*30)*.1:.55+Math.sin(t*5+f.ph)*.2;
    c.strokeStyle='rgba(255,'+(110+glow*70|0)+',40,'+glow+')';c.lineWidth=1.5;
    c.beginPath();c.moveTo(-5,-3);c.lineTo(-1,0);c.lineTo(-4,3);c.moveTo(1,-5);c.lineTo(3,-1);c.lineTo(1,4);c.stroke();
    c.fillStyle='#2a1a14';ell(c,6,0,4.4,4);c.fill();c.stroke();
    c.fillStyle='#3a2018';c.beginPath();c.moveTo(4,-3);c.lineTo(1,-7);c.lineTo(6,-4);c.fill();c.beginPath();c.moveTo(4,3);c.lineTo(1,7);c.lineTo(6,4);c.fill();
    c.fillStyle=wind?'#fff':'#ffcf50';circ(c,7,-1.7,1.2);c.fill();circ(c,7,1.7,1.2);c.fill();
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,120,40,'+(glow*.35)+')';circ(c,0,0,12);c.fill();c.globalCompositeOperation='source-over';
    c.restore();
  } else if(f.kind==='wisp'){
    const y=f.y-8+(f.flyH||0);
    shadowAt(f.x,f.y+8,6*sc,2.6,.25);
    c.save();c.translate(f.x,y);c.scale(sc,sc);
    const chg=f.state==='charge'?1-f.t/.62:0;
    c.globalCompositeOperation='lighter';
    for(let i=0;i<5;i++){const k=i/5;c.fillStyle='rgba(255,'+(120+i*18)+',50,'+(.35-k*.3)+')';circ(c,-Math.cos(fa)*k*10,-Math.sin(fa)*k*10+Math.sin(t*9+i)*2,8-k*5+chg*3);c.fill();}
    c.globalCompositeOperation='source-over';
    const gr=c.createRadialGradient(-2,-2,1,0,0,8+chg*3);gr.addColorStop(0,flash?'#fff':'#fff2c0');gr.addColorStop(.5,'#ff9a3a');gr.addColorStop(1,'#c4421a');
    c.fillStyle=gr;circ(c,0,0,7+chg*3);c.fill();c.strokeStyle='rgba(120,30,10,.55)';c.lineWidth=1;c.stroke();
    c.fillStyle='#2a0e08';c.save();c.rotate(fa);ell(c,3,-2.2,1.6,2.6,.2);c.fill();ell(c,3,2.2,1.6,2.6,-.2);c.fill();c.restore();
    if(chg>0){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,200,100,'+(chg*.5)+')';circ(c,Math.cos(fa)*(10+chg*4),Math.sin(fa)*(10+chg*4),3+chg*6);c.fill();c.globalCompositeOperation='source-over';}
    c.restore();
  } else if(f.kind==='husk'){
    shadowAt(f.x,f.y+7,15*sc,6,.4);
    c.save();c.translate(f.x,f.y);c.rotate(fa);c.scale(sc,sc);
    const wi=f.state==='wind'?1-f.t/.95:0,sl=f.state==='recover'?1:0;
    const step=Math.sin(f.age*5)*(f.state==='chase'?2:0);
    c.fillStyle='#1c1614';ell(c,step,-7,5,3);c.fill();ell(c,-step,7,5,3);c.fill();
    const gr=c.createRadialGradient(-2,-3,2,0,0,17);gr.addColorStop(0,flash?'#fff':'#6a5a52');gr.addColorStop(1,'#2a201c');
    c.fillStyle=gr;ell(c,sl*-1,0,13,15);c.fill();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1.4;c.stroke();
    const glow=.6+Math.sin(t*4+f.ph)*.2+wi*.4;
    c.strokeStyle='rgba(255,130,40,'+glow+')';c.lineWidth=2;c.beginPath();c.moveTo(-6,-8);c.lineTo(-2,-2);c.lineTo(-7,3);c.lineTo(-3,10);c.moveTo(3,-9);c.lineTo(5,-3);c.lineTo(2,4);c.stroke();
    // arms raise overhead when winding up the slam
    const raise=wi*1.2-sl*.2;
    c.fillStyle='#3a2c26';for(const s of[-1,1]){c.save();c.translate(2,s*14);c.rotate(s*(-.3-raise));ell(c,6+raise*5,0,9,4.6);c.fill();c.fillStyle='#e0b040';circ(c,14+raise*6,0,2);c.fill();c.fillStyle='#3a2c26';c.restore();}
    c.fillStyle='#4a3a34';ell(c,8,0,8,7);c.fill();c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(255,170,60,'+(glow)+')';c.fillRect(11,-3.4,3,2);c.fillRect(11,1.4,3,2);
    c.restore();
  } else if(typeof drawFoeNew==='function')drawFoeNew(f,sc);
  if(typeof drawFoeOver==='function')drawFoeOver(f);
  if(f.state==='recover'||f.state==='stagger'){
    for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,f.x+Math.cos(a)*8,f.y-16+Math.sin(a)*3,1.6);c.fill();}
  }
  if(f.hp<f.max&&f.kind!=='cantor'&&f.state!=='dead'&&f.state!=='spawn'){
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(f.x-11,f.y-foeBarY(f),22,3.4);
    c.fillStyle='#e05050';c.fillRect(f.x-10.5,f.y-foeBarY(f)+.5,21*Math.max(0,f.hp)/f.max,2.4);
  }
  c.globalAlpha=1;
}

/* ---------- combat effects: telegraphs, shock rings, projectiles, slashes ---------- */
function drawTelegraphs(){
  const c=ctx;
  for(const z of G.tele){
    const u=clamp(1-z.t/z.t0,0,1),a=.10+.17*u+(Math.sin(G.time*30)*.03*u);
    if(z.t<0)continue;
    c.fillStyle='rgba('+z.col+','+a+')';c.strokeStyle='rgba('+z.col+','+(.6+.4*u)+')';c.lineWidth=2.4;
    if(z.type==='circle'){circ(c,z.x,z.y,z.r);c.fill();c.stroke();c.fillStyle='rgba('+z.col+','+(.14+.16*u)+')';circ(c,z.x,z.y,z.r*u);c.fill();}
    else if(z.type==='line'){
      c.save();c.translate(z.x,z.y);c.rotate(z.a);
      c.fillRect(0,-z.w/2,z.len,z.w);c.strokeRect(0,-z.w/2,z.len,z.w);c.fillStyle='rgba('+z.col+','+(.25+.3*u)+')';c.fillRect(0,-z.w/2,z.len*u,z.w);c.restore();
    } else if(z.type==='cone'){
      c.beginPath();c.moveTo(z.x,z.y);c.arc(z.x,z.y,z.r,z.a-z.half,z.a+z.half);c.closePath();c.fill();c.stroke();
      c.fillStyle='rgba('+z.col+','+(.25+.3*u)+')';c.beginPath();c.moveTo(z.x,z.y);c.arc(z.x,z.y,z.r*u,z.a-z.half,z.a+z.half);c.closePath();c.fill();
    }
  }
}
function drawCombatOver(){
  const c=ctx;
  if(typeof drawTacticsOver==='function')drawTacticsOver();
  for(const s of G.shock){
    if(s.delay>0)continue;
    const k=1-s.r/s.max;c.strokeStyle='rgba(255,220,150,'+(.75*k)+')';c.lineWidth=s.w*.5;circ(c,s.x,s.y,s.r);c.stroke();
    c.strokeStyle='rgba(255,120,50,'+(.5*k)+')';c.lineWidth=s.w*.9;circ(c,s.x,s.y,s.r-3);c.stroke();
  }
  c.globalCompositeOperation='lighter';
  for(const p of G.proj){
    const g=c.createRadialGradient(p.x,p.y,1,p.x,p.y,13);g.addColorStop(0,'rgba(255,240,200,.95)');g.addColorStop(.4,'rgba('+p.col+',.7)');g.addColorStop(1,'rgba('+p.col+',0)');
    c.fillStyle=g;c.fillRect(p.x-13,p.y-13,26,26);
  }
  c.globalCompositeOperation='source-over';
  for(const p of G.proj){c.fillStyle='#fff4d0';circ(c,p.x,p.y,2.4);c.fill();}
  for(const e of G.fx){
    const u=1-e.t/e.t0;
    if(e.k==='slash'){
      const r=e.big?40:32,a0=e.a-1.25,sweep=2.5*easeOut(u*1.4);
      c.globalCompositeOperation='lighter';
      c.lineCap='round';
      for(const [w,al,rr_] of [[e.big?9:6,.35,r],[e.big?4:2.6,.95,r],[1.4,.8,r+4]]){
        c.strokeStyle='rgba('+e.col+','+al*(1-u*.8)+')';c.lineWidth=w*(1-u*.4);
        c.beginPath();c.arc(e.x,e.y,rr_,a0+Math.max(0,sweep-1.6),a0+sweep);c.stroke();
      }
      c.globalCompositeOperation='source-over';c.lineCap='butt';
    } else if(e.k==='nova'){
      const R=84*easeOut(u),g=c.createRadialGradient(e.x,e.y,R*.5,e.x,e.y,R);g.addColorStop(0,'rgba(255,200,100,0)');g.addColorStop(.8,'rgba(255,170,70,'+(.5*(1-u))+')');g.addColorStop(1,'rgba(255,240,200,'+(.8*(1-u))+')');
      c.globalCompositeOperation='lighter';c.fillStyle=g;circ(c,e.x,e.y,R);c.fill();c.globalCompositeOperation='source-over';
    }
  }
}

/* ---------- bosses ---------- */
function drawBoss(g){
  const c=ctx,t=G.time,f=vfa(g);
  const eng=g.eng,st=g.st;
  const roar=g.roar||0,dead=g.dead,dt_=g.deathT||0;
  const stag=g.stg>0,flash=g.hurt>0;
  const blink=false;
  if(g.kind==='candle'){
    const hv=-4+Math.sin(t*2.4)*3-(dead?0:0);
    c.globalAlpha=dead?Math.max(0,1-dt_/1.4):1;
    shadowAt(g.x,g.y+12,18,8,.35);
    c.save();c.translate(g.x,g.y+hv);c.rotate(f);
    const sc=1+roar*.14+(st==='volleyWind'||st==='ringWind'?.08:0);c.scale(sc,sc);
    // trailing robe
    c.fillStyle=flash?'#ffd0d0':'#1c1424';c.beginPath();c.moveTo(2,-14);c.quadraticCurveTo(-24,-16-Math.sin(t*3)*2,-30,0);c.quadraticCurveTo(-24,16+Math.sin(t*3)*2,2,14);c.closePath();c.fill();
    c.fillStyle='#2a1c38';c.beginPath();c.moveTo(0,-10);c.quadraticCurveTo(-18,-8,-22,Math.sin(t*3)*3);c.quadraticCurveTo(-18,8,0,10);c.closePath();c.fill();
    c.fillStyle=flash?'#fff':'#2e2040';ell(c,0,0,11,14);c.fill();
    c.strokeStyle='#d9a441';c.lineWidth=1.6;ell(c,0,0,11,14);c.stroke();c.fillStyle='#d9a441';c.fillRect(-1,-14,2,28);
    const arm=st==='slashWind'?(1-g.t/.42)*1.4-.7:(st==='volleyWind'?-.5:0);
    c.fillStyle='#2e2040';ell(c,6,-14,6,3,-.3+arm);c.fill();ell(c,6,14,6,3,.3-arm);c.fill();
    c.fillStyle='#ece4d0';circ(c,3,0,7.4);c.fill();
    const cm=dead?'ko':flash?'hurt':stag?'alarm':roar>0?'shout':(st==='slashWind'||st==='volleyWind'||st==='ringWind'||g.p2)?'rage':'joy';
    drawFace(c,5.2,0,1.6,cm,g.ph||0,'#14101a');
    if(cm==='rage'||cm==='shout'){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,160,60,.55)';circ(c,5.2,-2.3,1.1);c.fill();circ(c,5.2,2.3,1.1);c.fill();c.globalCompositeOperation='source-over';}
    if(!dead)for(let i=0;i<6;i++){
      const a=i/6*6.283+t*.6,cx=3+Math.cos(a)*10,cy=Math.sin(a)*10;
      c.fillStyle='#e8e0c0';c.fillRect(cx-1,cy-1,2,3);
      c.fillStyle='#ffb040';c.beginPath();c.moveTo(cx,cy-5-Math.sin(t*12+i)*1);c.lineTo(cx+1.7,cy-1);c.lineTo(cx-1.7,cy-1);c.fill();
    }
    if(G.candlesLit>0&&eng){ // candle shield aura
      c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,190,90,'+(.3+.2*Math.sin(t*6))+')';c.lineWidth=3;circ(c,0,0,22+Math.sin(t*4)*1.5);c.stroke();c.globalCompositeOperation='source-over';
    }
    if(st==='volleyWind'||st==='ringWind'){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,70,.5)';circ(c,16,0,5+Math.sin(t*30)*1.5);c.fill();c.globalCompositeOperation='source-over';}
    c.restore();
    if(stag&&!dead)for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,g.x+Math.cos(a)*10,g.y-24+Math.sin(a)*3,2);c.fill();}
    c.globalAlpha=1;
    return;
  }
  // Bell-Warden
  const tollP=st==='toll'?Math.sin((1-g.t/.95)*Math.PI):(g.toll>0?Math.sin((1-g.toll/.9)*Math.PI):0);
  const toll=tollP*3;
  const collapse=dead?Math.min(1,dt_/1.2):0;
  c.globalAlpha=dead?Math.max(0,1-Math.max(0,dt_-1)/1.6):1;
  const lift=st==='leap'?Math.sin((g.leapU||0)*Math.PI)*46:0,crouch=st==='windLeap'?.12*Math.min(1,1-g.t/(g.p2?.75:.95)):0;
  shadowAt(g.x,g.y+10,26*(1-lift/140),12*(1-lift/140),.42-lift/200);
  c.save();c.translate(g.x,g.y-lift);c.rotate(f);c.scale(1+lift/260-crouch*-1,1-crouch);
  let sx=1+roar*.15,sy=1+roar*.15,lean=0;
  if(st==='windCharge'){sx=1.05;sy=.92;lean=-.06;}
  if(st==='charge'){sx=1.18;sy=.88;}
  if(st==='stagger'||dead){sy=.92-collapse*.3;sx=1+collapse*.1;}
  c.scale(sx*1.0,sy);
  if(st==='roar'||roar>0)c.translate(Math.sin(t*50)*roar*1.4,0);
  const slam=st==='windSlam'?1-g.t/(g.p2?.7:.9):(st==='stagger'?-.15:0);
  c.fillStyle=dead?'#443a50':'#2a2038';c.beginPath();c.moveTo(-6,-20);c.quadraticCurveTo(-26,-14,-26,0);c.quadraticCurveTo(-26,14,-6,20);c.closePath();c.fill();
  const gr=c.createRadialGradient(-1,-3,2,0,0,22);gr.addColorStop(0,flash?'#ffd0d0':'#8a5ab8');gr.addColorStop(1,flash?'#e08080':'#3a2458');
  c.fillStyle=gr;ell(c,0,0,15,19);c.fill();
  c.strokeStyle='#e0b040';c.lineWidth=2.6;ell(c,0,0,15,19);c.stroke();
  const bx=-10,r1=11+toll;
  c.fillStyle='#8a6a20';circ(c,bx,0,r1+1.5);c.fill();
  const bg=c.createRadialGradient(bx-3,-3,1,bx,0,r1);bg.addColorStop(0,'#fff0a0');bg.addColorStop(1,'#b88a28');
  c.fillStyle=bg;circ(c,bx,0,r1);c.fill();c.strokeStyle='#6a4a10';c.lineWidth=1;circ(c,bx,0,r1*.62);c.stroke();circ(c,bx,0,r1*.3);c.stroke();
  c.fillStyle='#3a2a10';circ(c,bx,0,2);c.fill();
  // arms; the hammer arm rises for the slam
  c.fillStyle='#3a2a50';ell(c,6,-17,6,3,.2);c.fill();
  c.save();c.translate(4,17);c.rotate(-slam*2.1);
  c.fillStyle='#3a2a50';ell(c,3,0,6,3);c.fill();
  c.strokeStyle='#9a8a70';c.lineWidth=2.4;c.beginPath();c.moveTo(0,0);c.lineTo(22,0);c.stroke();
  c.fillStyle='#6a6a78';c.fillRect(20,-5,9,10);c.fillStyle='#8a8a98';c.fillRect(20,-5,9,2);
  c.restore();
  c.fillStyle='#4a4058';circ(c,6,0,8);c.fill();c.strokeStyle='#e0b040';c.lineWidth=1.8;circ(c,6,0,8);c.stroke();
  c.fillStyle='#d8b898';ell(c,10.4,0,3.8,4.6);c.fill();
  const wm=dead?'ko':flash||st==='stagger'?'hurt':roar>0?'shout':(g.p2||st==='windSlam'||st==='windCharge'||st==='windLeap'||st==='charge'||st==='leap'||st==='toll')?'rage':'wary';
  drawFace(c,10,0,1.35,wm,g.ph||0,'#14101a');
  c.strokeStyle='#e0b040';c.lineWidth=1.2;c.beginPath();c.moveTo(7.6,-4.4);c.lineTo(13.6,-3.2);c.moveTo(7.6,4.4);c.lineTo(13.6,3.2);c.stroke();
  c.restore();
  if(st==='charge'&&Math.random()<.9)pt(g.x-Math.cos(g.dir)*16,g.y-Math.sin(g.dir)*16,rrand(-20,20),rrand(-20,20),.5,5,'#8a7a6a',{k:'smoke',gr:6});
  if(stag&&!dead)for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,g.x+Math.cos(a)*12,g.y-26+Math.sin(a)*3.4,2.2);c.fill();}
  c.globalAlpha=1;
}
