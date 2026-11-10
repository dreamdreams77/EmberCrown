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
function drawKO(g){
  const c=ctx,t=G.time,h=houseKey(),kind=g.kind==='archer'||g.kind==='brute'?g.kind:'guard',sk=Math.floor(g.ph*7)%4;
  shadowAt(g.x,g.y+3,15,6,.4);
  c.save();c.translate(g.x,g.y+2);c.rotate((g.ph%1)*.4+1.2);c.scale(kind==='brute'?1.25:1,(kind==='brute'?1.25:1)*.82);
  c.fillStyle='#1c1620';ell(c,-9,-3.4,3.6,2.3);c.fill();ell(c,-10,4.6,3.6,2.3);c.fill();
  SPR.draw(c,'gd|'+h+'|'+kind+'|ko|'+sk,72,48,cc=>paintGuard(cc,h,kind,'ko',true,SKINS[sk]),4,0);
  c.restore();
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
const WOL=INK;
/* equipment looks: the cloak recolours hood, mantle and tail; the blade swaps the weapon; the charm is a brooch or hood ornament */
const CLOAK_ART={
  _:        {c:'#43357a',trim:'#b9a6f0',pat:''},
  shawl:    {c:'#5c5666',trim:'#d8d2c8',pat:'fringe'},
  ashcape:  {c:'#6e6660',trim:'#e8703a',pat:'ember'},
  wavecloak:{c:'#2a6f84',trim:'#e8f8ff',pat:'wave'},
  kesthood: {c:'#2a262e',trim:'#c8743a',pat:'rivet'},
  mantle:   {c:'#8f8cae',trim:'#f0eeff',pat:'ghost'},
  moonless: {c:'#14121f',trim:'#cfd6ff',pat:'star'}
};
const BLADE_LEN={_:11,shiv:7.5,whisperpoint:15,wardenbreaker:12,quillcutter:13,snuffedge:13,hallowfang:14};
function heroGear(){return(typeof run!=='undefined'&&run&&run.equipped)||{};}
function paintBlade(c,id){ // grip at the origin, blade along +x
  const L=BLADE_LEN[id]||11;
  if(id==='shiv'){
    poly(c,[0,-1.5,L-2,-1.9,L,.4,L-3,1.5,0,1.3]);inked(c,'#8e8a84',.8);line(c,[3,-.6,L-3,-.9],'#c8c4bc',.5);
    rr(c,-3.4,-1.2,3.8,2.4,.8);inked(c,'#b89a6a',.7);line(c,[-2.4,-1.2,-1.6,1.2],'#5a4024',.5);line(c,[-1,-1.2,-.2,1.2],'#5a4024',.5);return;}
  if(id==='whisperpoint'){
    poly(c,[0,-.9,L,0,0,.9]);inked(c,'#dfeeff',.7);line(c,[1,0,L-2,0],'#8fb4e0',.4);
    circ(c,0,0,1.7);inked(c,'#c8d0e0',.7);rr(c,-4,-.8,3.4,1.6,.7);inked(c,'#2a3050',.6);return;}
  if(id==='wardenbreaker'){
    poly(c,[0,-1.2,L-3,-3.4,L,-1.6,L-1,2.2,0,1.4]);inked(c,'#c89a3a',.9);line(c,[1,-.4,L-3,-2],'#ffe9a0',.6);c.fillStyle='#6a4a14';circ(c,L-3.4,.2,.8);c.fill();
    rr(c,-.8,-2.6,1.6,5.2,.6);inked(c,'#8a6a20',.6);rr(c,-4.2,-.9,3.6,1.8,.7);inked(c,'#4a3424',.6);
    for(const x of[-5.4,-7])  {circ(c,x,.9,.9);c.strokeStyle=INK;c.lineWidth=1.1;c.stroke();c.strokeStyle='#c89a3a';c.lineWidth=.5;c.stroke();}return;}
  if(id==='quillcutter'){
    c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(L*.5,-4.6,L,0);c.quadraticCurveTo(L*.5,1.2,0,.6);c.closePath();inked(c,'#f6f4ee',.8);
    c.strokeStyle='#b8b4c4';c.lineWidth=.4;c.beginPath();for(let x=2;x<L-1;x+=1.7){c.moveTo(x,.3);c.lineTo(x+1.6,-2.2+Math.abs(x-L*.5)*.3);}c.stroke();
    poly(c,[L-3,-.9,L+.6,0,L-3,.8]);c.fillStyle='#1c1830';c.fill();rr(c,-3.6,-.7,3.8,1.6,.7);inked(c,'#3a2a50',.6);return;}
  if(id==='snuffedge'){
    c.beginPath();c.moveTo(0,-1.3);c.quadraticCurveTo(L*.6,-3.4,L,1.4);c.quadraticCurveTo(L*.5,.6,0,1.3);c.closePath();inked(c,'#1e1b28',.9,'#000');
    c.beginPath();c.moveTo(1,-1.1);c.quadraticCurveTo(L*.6,-3,L-.6,.8);c.strokeStyle='#b8bcd0';c.lineWidth=.6;c.stroke();
    c.beginPath();c.moveTo(L-4,-2.6);c.quadraticCurveTo(L-2,-5.4,L-5,-6.4);c.strokeStyle='rgba(200,200,220,.6)';c.lineWidth=.7;c.stroke();
    rr(c,-.7,-2.2,1.4,4.4,.6);inked(c,'#5a566a',.6);rr(c,-4,-.8,3.4,1.6,.7);inked(c,'#14121c',.6);return;}
  if(id==='hallowfang'){
    c.fillStyle='rgba(255,200,90,.28)';ell(c,L*.55,-.6,L*.6,3.6);c.fill();
    c.beginPath();c.moveTo(0,-1.7);c.quadraticCurveTo(L*.7,-3.2,L,1.8);c.quadraticCurveTo(L*.5,1,0,1.7);c.closePath();inked(c,'#f2c64a',.9,'#4a2c08');
    c.beginPath();c.moveTo(1,.5);c.quadraticCurveTo(L*.55,-.9,L-1.4,.6);c.strokeStyle='#fff6d8',c.lineWidth=.9;c.stroke();
    poly(c,[-.4,-3,1.2,0,-.4,3,-1.6,0]);inked(c,'#d9534f',.6);rr(c,-4.4,-.9,3.4,1.8,.7);inked(c,'#6a3a14',.6);circ(c,-4.6,0,1.1);inked(c,'#f2c64a',.5);return;}
  poly(c,[0,-1.5,L-3.4,-1.3,L,0,L-3.4,1.3,0,1.5]);inked(c,'#dfe4f0',.8);line(c,[.8,0,L-1.4,0],'#98a2b8',.45);
  rr(c,-.8,-2.7,1.6,5.4,.6);inked(c,'#c8982e',.6);rr(c,-4.2,-.9,3.6,1.8,.7);inked(c,'#5a3a22',.6);circ(c,-4.5,0,1);inked(c,'#c8982e',.5);
}
function drawBlade(c,id,x,y,a,sc){c.save();c.translate(x,y);c.rotate(a);if(sc)c.scale(sc,sc);SPR.draw(c,'bl|'+id,36,18,cc=>paintBlade(cc,id),8,0);c.restore();}
function paintCharm(c,ch,x,y){
  if(!ch)return;
  c.save();c.translate(x,y);
  if(ch==='tinbell'){c.beginPath();c.moveTo(-1.4,-1.5);c.quadraticCurveTo(1.6,-1.8,1.7,0);c.quadraticCurveTo(1.6,1.8,-1.4,1.5);c.closePath();inked(c,'#b4bac6',.6);circ(c,-1.6,0,.6);c.fillStyle='#5a5e6a';c.fill();}
  else if(ch==='clasp'){poly(c,[2,0,0,-1.7,-2,0,0,1.7]);inked(c,'#ff8a3a',.6);c.fillStyle='#ffe0a0';circ(c,0,0,.6);c.fill();}
  else if(ch==='hearthstone'){c.fillStyle='rgba(255,90,50,.35)';circ(c,0,0,3);c.fill();circ(c,0,0,1.7);inked(c,'#d83a2a',.6);c.fillStyle='#ffb090';circ(c,-.4,-.5,.6);c.fill();}
  else if(ch==='thread'){rr(c,-1.6,-1.2,3.2,2.4,.6);inked(c,'#58b070',.6);line(c,[-1.6,-.4,1.6,.4],'#d8ffd8',.4);line(c,[1.6,0,4.4,-3.6],'#58b070',.5);}
  c.restore();
}
function paintWrenBody(c,CL,charm){
  // jerkin with front lacing
  cel(c,()=>blob(c,[6.4,0,5,-4.4,2,-7.6,-3,-7,-5,0,-3,7,2,7.6,5,4.4]),'#4a3550',[1.4,0,5,6],null,1);
  // bandolier with two vials
  line(c,[5,-4.4,-1,7],INK,2.6);line(c,[5,-4.4,-1,7],'#a87a48',1.5);
  // mantle: shoulder cape with a scalloped back hem, open at the chest
  const M=()=>blob(c,[4.4,-6.2,1.6,-10.2,-4,-10.2,-8.8,-6.8,-7,-3.3,-10.2,0,-7,3.3,-8.8,6.8,-4,10.2,1.6,10.2,4.4,6.2,1.4,3.6,.2,0,1.4,-3.6]);
  cel(c,M,CL.c,[-1.6,0,5.2,9],[.4,-6.4,2.8,1.5,.5],1.1);
  c.fillStyle=sh(CL.c,1.34);ell(c,.4,6.4,2.8,1.5,-.5);c.fill();
  c.beginPath();c.moveTo(-3.6,-9.2);c.quadraticCurveTo(-7.6,-6.4,-6.2,-3.4);c.quadraticCurveTo(-9,0,-6.2,3.4);c.quadraticCurveTo(-7.6,6.4,-3.6,9.2);c.strokeStyle=CL.trim;c.lineWidth=.7;c.stroke();
  if(CL.pat==='fringe'){c.strokeStyle=CL.trim;c.lineWidth=.5;c.beginPath();for(let y=-7;y<=7;y+=1.75){c.moveTo(-8.2+Math.abs(y)*.1,y);c.lineTo(-10.6+Math.abs(y)*.1,y*1.08);}c.stroke();}
  else if(CL.pat==='ember'){c.fillStyle='#ffb060';for(const p of[[-5,-6],[-6.4,-1],[-5.4,4.6],[-3,7.6]]){circ(c,p[0],p[1],.6);c.fill();}}
  else if(CL.pat==='wave'){c.strokeStyle='rgba(232,248,255,.8)';c.lineWidth=.6;c.beginPath();c.moveTo(-3,-8);for(let y=-8;y<8;y+=2.6)c.quadraticCurveTo(-5.6,y+.65,-3.2,y+1.3),c.quadraticCurveTo(-.8,y+1.95,-3,y+2.6);c.stroke();}
  else if(CL.pat==='rivet'){c.fillStyle=CL.trim;for(const s of[-1,1])for(const x of[-2.6,0,2.4]){circ(c,x,s*8.6,.6);c.fill();}}
  else if(CL.pat==='ghost'){c.fillStyle='rgba(255,255,255,.3)';ell(c,-3.4,0,2.4,6);c.fill();}
  else if(CL.pat==='star'){c.fillStyle='#fff';for(const p of[[-4,-6.6,.5],[-6,-1.6,.4],[-3.4,2.6,.55],[-5.4,6,.4],[-1.6,8,.35]]){circ(c,p[0],p[1],p[2]);c.fill();}
    c.beginPath();c.arc(-.6,-7.6,1.3,.6,4.4);c.strokeStyle='#cfd6ff';c.lineWidth=.6;c.stroke();}
  // scarf wrap round the neck with a knot behind the left ear
  circ(c,1.8,0,4.9);inked(c,'#d9534f',.9,'#4a0e16');circ(c,-1.8,-3.4,1.6);inked(c,'#b8403e',.7,'#4a0e16');
  paintCharm(c,charm,-.6,8);
}
function paintWrenHead(c,CL,charm,mood){
  // hood: a drooping back point gives her a facing even when she stands still
  blob(c,[-3.4,-3.4,-8,-2.6,-12,.9,-7.4,2.8,-3.4,3.4]);inked(c,sh(CL.c,.8),1);
  cel(c,()=>circ(c,0,0,5.7),CL.c,[.8,0,4.2,4.4],[-.4,-2.6,2.6,1,.2],1.1);
  line(c,[-10,.8,-4,.2],sh(CL.c,1.6),.5);
  c.fillStyle='#e8c8a8';ell(c,3.4,0,3,3.6);c.fill();
  c.fillStyle='rgba(40,20,60,.22)';ell(c,2.2,0,1.6,3.4);c.fill();
  c.beginPath();c.arc(3.4,0,3.7,1.75,4.53);c.strokeStyle=CL.trim;c.lineWidth=.7;c.stroke();
  // auburn fringe swept to her left, one stray lock on the right
  blob(c,[1.4,-3.8,4.6,-5.3,6.9,-3,4.6,-2.2,2.4,-2]);inked(c,'#b8502a',.6,'#3a1408');
  poly(c,[1.6,3.6,3.6,4.4,2.8,2.6]);inked(c,'#b8502a',.5,'#3a1408');
  stillFace(c,4.5,0,.9,mood,'#3a2a1a');
  if(charm==='feather'){c.beginPath();c.moveTo(-1,4.6);c.quadraticCurveTo(-5,9.4,-9,8.4);c.quadraticCurveTo(-5.4,6.4,-2.4,3.6);c.closePath();inked(c,'#ff8a3a',.6,'#5a1c08');line(c,[-1.8,4.4,-7.6,8],'#ffe0a0',.4);}
  if(charm==='magpie'){c.beginPath();c.arc(0,0,4.6,1.1,5.18);c.strokeStyle=INK;c.lineWidth=2;c.stroke();c.strokeStyle='#f2c64a';c.lineWidth=1.1;c.stroke();
    for(const a of[2.2,3.14,4.08]){const x=Math.cos(a)*4.6,y=Math.sin(a)*4.6;poly(c,[x,y-.9,x-2,y,x,y+.9]);inked(c,'#f2c64a',.5);}circ(c,-4.6,0,.7);c.fillStyle='#7ad8ff';c.fill();}
}
function heroArm(c,sx,sy,hx,hy,col){
  c.beginPath();c.moveTo(sx,sy);c.lineTo(hx,hy);c.strokeStyle=INK;c.lineWidth=5;c.stroke();c.strokeStyle=col;c.lineWidth=3.2;c.stroke();
  c.fillStyle='#e8c8a8';circ(c,hx,hy,1.9);c.fill();c.strokeStyle=INK;c.lineWidth=.7;c.stroke();
}
function drawWren(w,active){
  const c=ctx,t=G.time,sp=Math.hypot(w.vx||0,w.vy||0),mv=sp>14,sneak=G.sneak&&active,f=vfa(w);
  const st=charState(w,active),dt=st.dt,death=st.death,hk=st.hurt;
  const roll=w.rollAnim>0?1-w.rollAnim/.3:-1,atk=w.atk&&w.atk.a!==undefined?w.atk:null;
  const eq=heroGear(),ck=CLOAK_ART[eq.cloak]?eq.cloak:'_',CL=CLOAK_ART[ck],bid=BLADE_LEN[eq.blade]?eq.blade:'_',charm=eq.charm||'';
  const win=mode==='win'&&!death,parry=active&&G.parryT>0&&!death;
  const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!death;
  c.globalAlpha=blink?.35:1;
  const cf=Math.cos(f),sf=Math.sin(f);
  shadowAt(w.x,w.y+4,roll>=0?8:10+death*4,5.5+death*1.5,.38);
  if(hasT('cloak')){c.globalCompositeOperation='lighter';c.fillStyle='rgba(150,110,255,'+(.10+.05*Math.sin(t*3)+(sneak?.08:0))+')';circ(c,w.x,w.y,17);c.fill();c.globalCompositeOperation='source-over';}
  // cloak tail: a chain that swings when she turns and settles when she stops
  const drag=roll>=0?.4:1;
  const cl=ropeChain(w,'_cl',5,mv?4.8*drag:4.1,w.x-cf*5,w.y-sf*5,-cf,-sf,mv?11:7,dt,mv?13:2.2,t);
  const wid=sneak?[6.6,6.2,5,3.3,1.2]:[7.4,7,5.7,3.8,1.2];
  if(roll<0&&!death){
    if(CL.pat==='ghost')c.globalAlpha*=.78;
    strip(c,cl,wid,CL.c,INK,1.1);
    strip(c,cl,wid.map(v=>v*.45),sh(CL.c,1.38,.6));
    const e=cl[4],d=cl[3],m=cl[2];
    c.strokeStyle=CL.trim;c.lineWidth=1;c.beginPath();c.moveTo(d.x+(e.y-d.y)*.8,d.y-(e.x-d.x)*.8);c.lineTo(e.x,e.y);c.lineTo(d.x-(e.y-d.y)*.8,d.y+(e.x-d.x)*.8);c.stroke();
    if(CL.pat==='star'){c.fillStyle='#fff';circ(c,m.x,m.y,.7);c.fill();circ(c,(d.x+cl[1].x)/2+1.6,(d.y+cl[1].y)/2-1.2,.5);c.fill();}
    else if(CL.pat==='ember'){c.fillStyle='rgba(255,150,70,'+(.6+Math.sin(t*7)*.25)+')';circ(c,e.x,e.y,1.5);c.fill();}
    c.globalAlpha=blink?.35:1;
  }
  // scarf: two bright ribbons that flutter in her own wind
  const sc1=ropeChain(w,'_sc',6,3.3,w.x-cf*1.2-sf*3.2,w.y-sf*1.2+cf*3.2,-cf,-sf,mv?16:9,dt,mv?24:9,t);
  const sc2=ropeChain(w,'_sd',5,2.9,w.x-cf*1.6-sf*2,w.y-sf*1.6+cf*2,-cf,-sf,mv?14:8,dt,mv?20:8,t+1.7);
  if(!death){
    strip(c,sc2,[1.9,1.7,1.4,1,.5],'#b8403e','#4a0e16',.8);
    strip(c,sc1,[2,1.9,1.6,1.2,.8,.4],'#e0605a','#4a0e16',.8);
  }
  c.save();c.translate(w.x,w.y);
  if(roll>=0){ // tumbling roll: tucked ball with a speed smear
    c.rotate(f);c.fillStyle=sh(CL.c,1,.3);ell(c,-10,0,9,6);c.fill();ell(c,-17,0,6,4);c.fill();
    c.rotate(roll*12.5);c.scale(.92,.82);
    SPR.draw(c,'wr|'+ck,24,24,cc=>{
      cel(cc,()=>blob(cc,[9,0,6.4,-6.6,0,-8.4,-6.6,-6,-9,0,-6.4,6,0,8.4,6.4,6.6]),CL.c,[0,0,6.4,6],[-1,-3.4,3.6,1.4],1.2);
      cc.beginPath();cc.arc(0,0,6,-.4,2.4);cc.strokeStyle=CL.trim;cc.lineWidth=.8;cc.stroke();
      circ(cc,4.6,-1,3.6);inked(cc,sh(CL.c,.8),.9);rr(cc,-2,-8,3,16,1.2);inked(cc,'#d9534f',.7,'#4a0e16');
      ell(cc,-5,3,2.6,1.9,.5);inked(cc,'#241a30',.7);});
    c.restore();c.globalAlpha=1;return;
  }
  c.rotate(f);
  // pose
  const u=atk?1-atk.t/atk.t0:0,cb=atk?atk.combo:0,thrust=atk&&cb===2,sgn=(cb%2)?-1:1,ang=atk&&!thrust?(-1.3+2.6*ease(u))*sgn:0;
  const ext=thrust?easeOut(Math.min(1,u*2.4))*(1-Math.max(0,u-.6)*1.6):0;
  const step=mv?Math.sin(w.ph*2):0,br=1+Math.sin(t*2.4)*.022*(mv?0:1),hop=win?Math.abs(Math.sin(t*5.2))*.07:0;
  if(atk&&!thrust){c.rotate(ang*.2);c.translate(Math.sin(u*Math.PI)*2,0);}
  if(thrust)c.translate(ext*4.4,0);
  if(hk>0){c.translate(-hk*3.4,0);c.rotate(Math.sin(t*55)*.07*hk);}
  if(death>0){c.rotate(death*1.25);c.translate(0,death*2);}
  c.scale((sneak?.97:br+hop)*(1+step*.02)*(1+death*.12),(sneak?.86:br+hop)*(1-step*.015)*(1-death*.3)*(1-hk*.08));
  c.translate((sneak?1.6:0)+(mv&&!sneak?.6:0),0);
  c.lineJoin='round';c.lineCap='round';
  // boots
  const sw=Math.sin(w.ph),stride=(sneak?2.6:3.9)*(mv?1:0)+(thrust?ext*3:0);
  c.fillStyle='#241a30';c.strokeStyle=INK;c.lineWidth=.9;
  ell(c,sw*stride+(thrust?ext*2:0),-4.6,3.5,2.3);c.fill();c.stroke();ell(c,-sw*stride-(thrust?ext*2.4:0),4.6,3.5,2.3);c.fill();c.stroke();
  // hands (R is +y and holds the blade) and blade pose
  const as=mv?Math.sin(w.ph+1.5)*(sneak?1.6:3.2):0,sleeve=sh(CL.c,.86),BL=BLADE_LEN[bid];
  let rx=5.2+as,ry=8.6,lx=5.2-as,ly=-8.6,ba=0,bx=0,by=0,drawn=true,bs=1;
  if(death>0||hk>0){rx=-1+hk;ry=11.6;lx=-1+hk;ly=-11.6;drawn=false;}
  else if(parry){rx=8.6;ry=3.4;lx=8.2;ly=-3.6;bx=9.4;by=5.6;ba=-1.5;}
  else if(thrust){rx=6.4+ext*7;ry=1.8;lx=4.6+ext*5.6;ly=-1.8;bx=rx+1;by=1;ba=0;bs=1.2;}
  else if(atk){rx=3.4+Math.cos(ang)*7;ry=Math.sin(ang)*9;lx=1-Math.cos(ang)*2;ly=-sgn*9.4*Math.sign(Math.cos(ang*.5));bx=rx+Math.cos(ang)*1.4;by=ry+Math.sin(ang)*1.4;ba=ang;
    ly=Math.sin(ang)>0?-9.4:9.4;}
  else if(win){rx=7.4;ry=8.4;lx=1.6;ly=-10.4;bx=8.6;by=9;ba=.5+Math.sin(t*5.2)*.5;bs=1.1;}
  else if(sneak){rx=3.6+as;ry=9.4;lx=8.6-as;ly=-5;bx=3;by=10.2;ba=2.72;}
  else drawn=false;
  if(atk&&!thrust&&!parry&&u>.12){ // slash trail
    const R=8.5+BL,a0=-1.3*sgn,k=1-u;
    c.beginPath();c.arc(3.4,0,R,Math.min(a0,ang),Math.max(a0,ang));c.strokeStyle='rgba(255,255,255,'+(k*.55)+')';c.lineWidth=3.4*k+.6;c.stroke();
  } else if(thrust&&ext>.2){c.fillStyle='rgba(255,255,255,'+(.4*ext)+')';poly(c,[rx,-2.4,rx+BL*1.3+6,0,rx,2.4]);c.fill();}
  if(!drawn)drawBlade(c,bid,-1.4,8.8,2.78,.9); // sheathed across the hip
  heroArm(c,1,-7.4,lx,ly,sleeve);heroArm(c,1,7.4,rx,ry,sleeve);
  if(drawn)drawBlade(c,bid,bx,by,ba,bs);
  SPR.draw(c,'wb|'+ck+'|'+charm,30,30,cc=>paintWrenBody(cc,CL,charm));
  // head: looks around when idle, turns into a swing
  const look=mv||win?0:Math.sin(t*.8+1)*.3+Math.sin(t*.37)*.2;
  const wm=death>.3?'ko':bodyFlash(w)||hk>0?'hurt':atk?'shout':win?'joy':G.alert>.7?'alarm':sneak||parry?'focus':'calm';
  c.translate(sneak?3.2:2,0);c.rotate(look+(atk?ang*.12:0)-(hk>0?.3*hk:0));
  SPR.draw(c,'wh|'+ck+'|'+charm+'|'+wm,32,26,cc=>paintWrenHead(cc,CL,charm,wm),-2,0);
  if(parry){c.fillStyle='#fff';const gx=7.6,gy=1;poly(c,[gx-3,gy,gx,gy-.7,gx+3,gy,gx,gy+.7]);c.fill();poly(c,[gx,gy-3,gx+.7,gy,gx,gy+3,gx-.7,gy]);c.fill();}
  if(bodyFlash(w)){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,255,255,.45)';ell(c,-2,0,8,9.5);c.fill();c.globalCompositeOperation='source-over';}
  c.restore();c.globalAlpha=1;
}

/* ---------- Ashling ---------- */
const AOL='#3c1006';
function paintAshWing(c){ // right wing; origin at the shoulder, opens toward +y, trails toward -x
  const M=()=>{c.beginPath();c.moveTo(0,0);c.lineTo(3,7);c.lineTo(-1,14.5);c.lineTo(-15,17.5);c.quadraticCurveTo(-10.6,12.6,-13.5,9.5);c.quadraticCurveTo(-9.2,6.2,-10,3.5);c.quadraticCurveTo(-7.6,2.2,-7,.5);c.closePath();};
  M();c.fillStyle='#a53a16';c.fill();
  c.save();M();c.clip();c.fillStyle='#cf5a22';poly(c,[-1,14.5,-15,17.5,-13.5,9.5]);c.fill();poly(c,[3,7,-13.5,9.5,-10,3.5]);c.fill();
  c.fillStyle='rgba(60,16,6,.28)';ell(c,-8,1,7,3.4);c.fill();c.restore();
  M();c.strokeStyle=AOL;c.lineWidth=1;c.stroke();
  for(const p of[[-15,17.5],[-13.5,9.5],[-10,3.5]]){line(c,[-1,14.5,p[0],p[1]],AOL,1.5);line(c,[-1,14.5,p[0],p[1]],'#ff9a4a',.75);}
  line(c,[0,0,3,7,-1,14.5],AOL,2.9);line(c,[0,0,3,7,-1,14.5],'#f0742a',1.6);
  poly(c,[-1.6,14,1.8,17.4,.4,13.6]);inked(c,'#ffe0a0',.6,AOL);
}
function paintAshBody(c,tier,gear){
  for(const s of[-1,1])cel(c,()=>ell(c,-4.6,s*5,4.6,3.3,s*.35),'#c8481a',[-4.2,s*4.6,3.2,2.2],null,1,AOL);
  const T=()=>blob(c,[9.5,0,7.5,-3.8,1.5,-6.3,-5,-4.8,-9.4,0,-5,4.8,1.5,6.3,7.5,3.8]);
  cel(c,T,'#e8641f',[1.6,0,8.4,4.4],[3,-1.9,4,1.3,.1],1.1,AOL);
  c.save();T();c.clip();c.strokeStyle='rgba(150,44,14,.6)';c.lineWidth=1.1;c.beginPath();for(const x of[-5,-1.6,1.8]){c.moveTo(x+1.6,-6.4);c.lineTo(x,-2.2);c.moveTo(x+1.6,6.4);c.lineTo(x,2.2);}c.stroke();
  c.fillStyle='rgba(255,214,150,.5)';ell(c,5.4,0,3.4,2.2);c.fill();c.restore();
  for(const s of[-1,1]){circ(c,3.4,s*4.8,1.9);inked(c,'#c8481a',.8,AOL);}
  if(gear==='kiln'){c.fillStyle='#ffd27a';for(const y of[-1.8,0,1.8])c.fillRect(6,y-.45,2.6,.9);}
  if(gear==='bridle'||gear==='kiln'||gear==='collar'){for(const s of[-1,1])line(c,[9,s*2.2,2.4,s*3.4],gear==='bridle'?'#bfe8ff':'#8a5a30',.6);}
  // dorsal plates: more with every growth tier
  const np=3+tier;
  for(let i=0;i<np;i++){const x=4.6-i*(11/np);poly(c,[x,-1.5,x-2.5,0,x,1.5]);inked(c,'#ffd27a',.6,AOL);}
  if(gear==='scale'){poly(c,[2.6,0,.8,-3.4,-2.8,-3.4,-4.6,0,-2.8,3.4,.8,3.4]);inked(c,'#3a3440',.9);poly(c,[.6,0,-1,-1.6,-2.6,0,-1,1.6]);c.fillStyle='#ff9a3a';c.fill();c.fillStyle='#7a7684';circ(c,1,-2.2,.45);c.fill();circ(c,1,2.2,.45);c.fill();}
  if(gear==='collar'||gear==='kiln'){rr(c,7,-3.9,2.4,7.8,1);inked(c,gear==='kiln'?'#c8982e':'#6a4424',.8);c.fillStyle='#ffd27a';for(const y of[-2.4,0,2.4]){circ(c,8.2,y,.55);c.fill();}}
}
function paintAshHead(c,tier,gear,st){
  const hl=3+tier*.75;
  for(const s of[-1,1]){ // horns sweep back, frills flare at the cheeks
    c.beginPath();c.moveTo(-.6,s*2.2);c.quadraticCurveTo(-3-hl*.6,s*2.4,-4.4-hl,s*(4.4+hl*.55));c.quadraticCurveTo(-2.2-hl*.3,s*4.9,.2,s*4.3);c.closePath();inked(c,'#ffe6b0',.7,AOL);
    poly(c,[.4,s*4,-1.6,s*7,.9,s*5.4,1.5,s*7.4,2.9,s*4.4]);inked(c,'#c8481a',.7,AOL);
  }
  const Hd=()=>blob(c,[9.4,0,7.8,-2.5,3.4,-4.9,-1.4,-4.7,-3.2,0,-1.4,4.7,3.4,4.9,7.8,2.5]);
  cel(c,Hd,'#f0742a',[2.4,0,6.4,3.5],[3.4,-1.6,2.8,.9],1,AOL);
  c.fillStyle='#ffa458';ell(c,6.4,0,2.5,1.8);c.fill();
  poly(c,[1.4,-.8,-1.2,0,1.4,.8]);c.fillStyle='#ffd27a';c.fill();
  if(st==='fire'){c.fillStyle='#3a1008';ell(c,8.2,0,2.3,1.9);c.fill();c.fillStyle='#ffd27a';ell(c,8.6,0,1.3,1.1);c.fill();}
  else{c.fillStyle='#6a2a10';circ(c,8.2,-.9,.5);c.fill();circ(c,8.2,.9,.5);c.fill();}
  for(const s of[-1,1]){
    const ex=2.4,ey=s*2.9;
    line(c,[.2,s*1.5,st==='fire'||st==='hurt'?3.6:3.2,s*(st==='alarm'?4.6:st==='fire'?3.2:3.9)],'#8a2c0c',.9);
    if(st==='ko'){line(c,[ex-.8,ey-.8,ex+.8,ey+.8],AOL,.7);line(c,[ex-.8,ey+.8,ex+.8,ey-.8],AOL,.7);}
    else if(st==='hurt'){line(c,[ex-.8,ey-s*.7,ex+.6,ey,ex-.8,ey+s*.7],AOL,.7);}
    else if(st==='joy'){c.beginPath();c.arc(ex-.4,ey,1.1,-1.2,1.2);c.strokeStyle=AOL;c.lineWidth=.75;c.stroke();}
    else{const ry=st==='fire'?.6:st==='alarm'?1.5:1.2;ell(c,ex,ey,1.7,ry,s*.3);inked(c,'#fff4a0',.55,AOL);ell(c,ex+.3,ey,st==='alarm'?.45:.5,ry*.86,s*.3);c.fillStyle='#2a1008';c.fill();c.fillStyle='#fff';circ(c,ex+.9,ey-s*.4,.3);c.fill();}
  }
  if(gear==='bridle'){line(c,[5,-3.6,5,3.6],INK,1.6);line(c,[5,-3.6,5,3.6],'#bfe8ff',.8);line(c,[5,-3.4,-2,-4.4],'#bfe8ff',.6);line(c,[5,3.4,-2,4.4],'#bfe8ff',.6);poly(c,[6.2,0,5,-1.1,3.8,0,5,1.1]);inked(c,'#7ad8ff',.5);}
  if(gear==='kiln'){circ(c,-.4,0,2.9);c.strokeStyle=INK;c.lineWidth=2.2;c.stroke();c.strokeStyle='#f2c64a';c.lineWidth=1.2;c.stroke();
    for(let i=0;i<5;i++){const a=1.2+i*.97,x=-.4+Math.cos(a)*2.9,y=Math.sin(a)*2.9;poly(c,[x+Math.cos(a)*2.2,y+Math.sin(a)*2.2,x-Math.sin(a)*.9,y+Math.cos(a)*.9,x+Math.sin(a)*.9,y-Math.cos(a)*.9]);inked(c,'#f2c64a',.45);}
    circ(c,-.4,0,1.2);c.fillStyle='#ff8a3a';c.fill();}
}
function drawAsh(a,active){
  const c=ctx,t=G.time,fl=G.flight,sp=Math.hypot(a.vx||0,a.vy||0),mv=sp>14,f=vfa(a);
  const st=charState(a,active),dt=st.dt,death=st.death,hk=st.hurt;
  const dashing=G.dash.t>0,nova=a.novaAnim>0,win=mode==='win'&&!death,cel_=a.celebrate>0||win;
  if(a.celebrate>0)a.celebrate-=.016;
  const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!death;
  c.globalAlpha=blink?.35:1;
  const gk=Math.min(12,stats.gems)/12,tier=Math.min(4,Math.floor(gk*4.01)),cf=Math.cos(f),sf=Math.sin(f),gear=heroGear().gear||'';
  const sc=(fl?1.4:1)*(nova?1+Math.sin((1-a.novaAnim/.55)*3.14)*.35:1),hover=fl?Math.sin(t*3)*2:(cel_?-Math.abs(Math.sin(t*9))*8:0);
  shadowAt(a.x+(fl?7:0),a.y+(fl?14:5),(fl?13:11)*(cel_?.8:1)*(1+gk*.15),fl?6:5.5,fl?.25:.38);
  // tail: seven-link chain, longer with every few gems, tipped with a flame that grows
  const tl=3.4+gk*.9,fire=G.fireOn&&active&&!death;
  const tc=ropeChain(a,'_tl',7,tl,a.x-cf*7,a.y-sf*7,-cf,-sf,mv||dashing?12:6,dt,mv?15:3.2,t);
  const tw=[3.4,3,2.6,2.1,1.6,1.1,.6];
  if(!death){
    strip(c,tc,tw,'#c8481a',AOL,1);strip(c,tc,tw.map(v=>v*.45),'#f0843a');
    const e=tc[6],d=tc[5],ta=Math.atan2(e.y-d.y,e.x-d.x),fs=1+gk*.9,fk=1+Math.sin(t*13)*.14;
    c.save();c.translate(e.x,e.y);c.rotate(ta);
    c.beginPath();c.moveTo(-1,-2.2*fs);c.quadraticCurveTo(2.4*fs,-3*fs,6*fs*fk,0);c.quadraticCurveTo(2.4*fs,3*fs,-1,2.2*fs);c.quadraticCurveTo(1,0,-1,-2.2*fs);c.closePath();inked(c,'#ff9a3a',.8,AOL);
    ell(c,1.6*fs,0,1.8*fs,.9*fs);c.fillStyle='#fff0b0';c.fill();
    c.restore();
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,70,'+(.3+gk*.2+Math.sin(t*9)*.08)+')';circ(c,e.x,e.y,4+gk*4);c.fill();c.globalCompositeOperation='source-over';
  }
  c.save();c.translate(a.x,a.y+hover);c.rotate(f);
  if(hk>0){c.translate(-hk*3,0);c.rotate(Math.sin(t*55)*.08*hk);}
  if(death>0){c.rotate(death*.9);c.translate(0,death*2);}
  if(dashing)c.scale(1.3,.8);else c.scale(sc*(fire?.97:1)*(1+death*.1),sc*(1-death*.3)*(1-hk*.08));
  c.lineJoin='round';c.lineCap='round';
  const air=fl||dashing||cel_||nova;
  // feet: tucked when airborne, planted wide when breathing fire
  if(!air&&!death){
    const sw=Math.sin(a.ph),sd=mv?2.8:0,br=fire?1.2:0;
    c.fillStyle=gear==='talons'?'#d8a838':'#b23c16';c.strokeStyle=AOL;c.lineWidth=.8;
    ell(c,5.4+sw*sd+br,-6.6-br,2.9,1.9);c.fill();c.stroke();ell(c,5.4-sw*sd+br,6.6+br,2.9,1.9);c.fill();c.stroke();
    ell(c,-4.4-sw*sd,-8,3,2);c.fill();c.stroke();ell(c,-4.4+sw*sd,8,3,2);c.fill();c.stroke();
  }
  // wings: folded at rest, half open on the move, spread to glide, swept for the dash, flared for fire and flare
  const shake=!air&&!mv&&(t%9)<.7?Math.sin(t*44)*.06:0;
  let rot=.92,open=.6,len=1,rate=2.2,amp=.04;
  if(death){rot=.5;open=.8;}
  else if(hk>0){rot=1;open=.48;}
  else if(dashing){rot=1.12;open=.5;len=1.12;rate=30;amp=.03;}
  else if(nova||cel_){rot=-.2;open=1.2;rate=16;amp=.16;}
  else if(fl){rot=-.08;open=1.12;rate=5;amp=.1;}
  else if(fire){rot=-.3;open=.86;rate=22;amp=.03;}
  else if(mv){rot=.66;open=.74;rate=11;amp=.06;}
  const ws=(1+gk*.5),flap=1+Math.sin(t*rate)*amp+shake;
  for(const s of[-1,1]){
    c.save();c.translate(3.4,s*4.6);c.scale(1,s);c.rotate(rot+(fl?Math.sin(t*5-.6)*.05:0));c.scale(ws*len,ws*open*flap);
    SPR.draw(c,'aw',26,24,paintAshWing,-6,9);
    c.restore();
  }
  SPR.draw(c,'ab|'+tier+'|'+gear,26,20,cc=>paintAshBody(cc,tier,gear));
  // ember gem on the withers: glows brighter the more she has
  if(stats.gems>0){const gs=1.3+gk*1.2;c.fillStyle='#fff0b0';poly(c,[-1+gs,0,-1,-gs*.8,-1-gs,0,-1,gs*.8]);c.fill();
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,60,'+(.28+.12*Math.sin(t*4))+')';circ(c,-1,0,3.5+gk*3);c.fill();c.globalCompositeOperation='source-over';}
  if(fire||nova){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,200,110,'+(.3+Math.sin(t*26)*.1)+')';ell(c,6,0,5,4);c.fill();c.globalCompositeOperation='source-over';}
  // head: stretches out and opens its jaw when breathing fire, looks about when idle
  const look=mv||fire?0:Math.sin(t*.9)*.2+Math.sin(t*.31)*.13;
  const hs=death>.3?'ko':bodyFlash(a)||hk>0?'hurt':fire||dashing?'fire':cel_?'joy':G.alert>.7?'alarm':'calm';
  c.translate(10.4+(fire?1.8:0)-(hk>0?1:0),0);c.rotate(fire?Math.sin(t*30)*.03:Math.sin(t*2.2)*.05+look);
  SPR.draw(c,'ah|'+tier+'|'+gear+'|'+hs,34,28,cc=>paintAshHead(cc,tier,gear,hs),0,0);
  if(fire){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,220,120,.85)';circ(c,9.6,0,2.6+Math.sin(t*40)*.5);c.fill();c.globalCompositeOperation='source-over';}
  c.rotate(0);
  if(bodyFlash(a)){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,255,255,.45)';ell(c,-8,0,11,8);c.fill();c.globalCompositeOperation='source-over';}
  if(dashing){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,160,60,.35)';ell(c,-16,0,14,6);c.fill();c.globalCompositeOperation='source-over';}
  c.restore();c.globalAlpha=1;
}

/* ---------- foes ---------- */
function emberCracks(c,pts,w){for(const p of pts){line(c,p,'#ff7a28',w);line(c,p,'#ffe08a',w*.4);}}
function paintCinder(c,wind,H){ // ember imp: hunched charcoal body, horned head, claws out front
  for(const s of[-1,1]){line(c,[1,s*5.6,7.4,s*8],INK,3.4);line(c,[1,s*5.6,7.4,s*8],'#3a2620',2);
    c.strokeStyle='#ffb050';c.lineWidth=.7;c.beginPath();for(const a of[-.5,0,.5]){c.moveTo(7.6,s*8);c.lineTo(10+Math.cos(a)*.6,s*8+a*2.4);}c.stroke();}
  for(const x of[-3.4,-6,-8.2]){poly(c,[x,-1.6,x-3,0,x,1.6]);inked(c,'#1c1210',.6);}
  cel(c,()=>blob(c,[7,0,5,-5.6,-1,-7.6,-7,-5,-9,0,-7,5,-1,7.6,5,5.6]),'#3e2a22',[.6,0,5.6,5.4],[1.6,-3,2.6,1.1],1.1);
  emberCracks(c,[[-5.4,-3,-1.6,-.4,-4.4,3.2],[.6,-5.2,2.4,-1.4,.8,4.4]],1.3);
  rr(c,2.4,-3.6,1.5,7.2,.6);inked(c,H.trim,.5);
  for(const s of[-1,1]){c.beginPath();c.moveTo(4.6,s*2.6);c.quadraticCurveTo(3.4,s*7.4,-.6,s*8.4);c.quadraticCurveTo(3,s*5.6,6.6,s*3.6);c.closePath();inked(c,'#2a1a14',.7);}
  cel(c,()=>blob(c,[11.6,0,9.4,-3.5,5,-4.6,2.2,-2.6,2.2,2.6,5,4.6,9.4,3.5]),'#4c3228',[6.6,0,4,3],null,1);
  c.fillStyle='#f0e4c8';for(const y of[-1.5,-.5,.5,1.5]){poly(c,[10.4,y-.45,11.8,y,10.4,y+.45]);c.fill();}
  c.fillStyle=wind?'#fff':'#ffcf50';for(const s of[-1,1]){ell(c,7.4,s*2,1.5,1,s*.5);c.fill();}
  if(!wind){c.fillStyle='#3a1008';for(const s of[-1,1]){circ(c,7.8,s*1.9,.45);c.fill();}}
}
function paintHuskBody(c,H){ // a burnt suit of house armour with something still walking inside it
  cel(c,()=>blob(c,[12,0,10,-9,3,-15,-7,-13.4,-12.4,-6,-13.4,0,-12.4,6,-7,13.4,3,15,10,9]),'#4e423c',[1,0,9,11],[3,-6,5,2.2,.3],1.4);
  emberCracks(c,[[-7,-9,-2.4,-2.6,-7.6,3,-3.4,10.4],[3.4,-10,5.6,-3.4,2.2,4.4]],1.8);
  // one surviving pauldron and a torn tabard strip in the house colours
  cel(c,()=>blob(c,[6,-11,3,-18,-5,-17,-6.6,-11,0,-9]),H.plate,[0,-13.4,4.4,3.4],null,1.1);
  line(c,[-3.4,-15.4,3,-12.4],sh(H.plate,.6),.7);
  poly(c,[-2,-3,-11.6,-4.4,-10,0,-12,4,-2,3]);inked(c,H.body,.9);line(c,[-3,0,-9.6,0],H.trim,.7);
  // helm: half of it is gone
  cel(c,()=>blob(c,[16,0,14,-5.6,8,-7.2,2.4,-5,1,0,2.4,5,8,7.2,14,5.6]),'#5a4a42',[8,0,6,5],null,1.2);
  c.beginPath();c.moveTo(1.6,-3);c.lineTo(8,-7.2);c.lineTo(14,-5.6);c.lineTo(15.6,-1);c.lineTo(11,-2.2);c.lineTo(8.4,.6);c.lineTo(4.4,-.6);c.closePath();inked(c,H.plate,.9);
  c.fillStyle='#1c1210';rr(c,11.6,-4.4,2.6,2,.6);c.fill();c.fillStyle='#ffb040';c.fillRect(12.2,-3.9,1.5,1);
  c.fillStyle='#ffb040';ell(c,12.4,2.8,1.7,1.3);c.fill();c.fillStyle='#fff2c0';circ(c,12.8,2.8,.6);c.fill();
}
function paintHuskArm(c){ // origin at the shoulder, fist along +x
  cel(c,()=>blob(c,[16,0,13,-4.6,3,-5,-3,0,3,5,13,4.6]),'#3e322c',[6,0,8,3],null,1.2);
  circ(c,15,0,4.4);inked(c,'#5a4a42',1.1);emberCracks(c,[[13,-2,15.4,0,13.4,2.4]],1);
}
function drawFoe(f){
  const c=ctx,t=G.time,fa=vfa(f);
  let al=1,sc=1;
  if(f.state==='spawn'){const u=1-f.t/.7;al=ease(u);sc=.4+.6*easeOut(u);}
  if(f.state==='dead'){const u=1-f.t/.5;al=1-u;sc=1+u*.3;}
  c.globalAlpha=al;
  const wind=f.state==='wind'||f.state==='charge',rec=f.state==='recover'||f.state==='stagger';
  const flash=f.hitT>0,hk=houseKey(),H=HOUSE_ART[hk];
  if(f.kind==='cinder'){
    shadowAt(f.x,f.y+5,9*sc,4,.35);
    c.save();c.translate(f.x,f.y);c.rotate(fa);
    let sx=1,sy=1;if(wind){sx=1.15+Math.sin(t*40)*.04;sy=.8;}else if(f.state==='lunge'){sx=1.5;sy=.7;}else if(rec){sx=.9;sy=1.1;}
    c.scale(sc*sx,sc*sy);
    const leg=Math.sin(f.age*14)*(f.state==='chase'?3:0);
    c.fillStyle='#1c1412';ell(c,leg-2,-5.4,3,2);c.fill();ell(c,-leg-2,5.4,3,2);c.fill();
    SPR.draw(c,'fc|'+hk+(wind?'w':''),30,24,cc=>paintCinder(cc,wind,H),1,0);
    const glow=wind?.9+Math.sin(t*30)*.1:.5+Math.sin(t*5+f.ph)*.2;
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,120,40,'+(glow*.32+(flash?.5:0))+')';circ(c,0,0,flash?10:12);c.fill();c.globalCompositeOperation='source-over';
    c.restore();
  } else if(f.kind==='wisp'){
    const y=f.y-8+(f.flyH||0);
    shadowAt(f.x,f.y+8,6*sc,2.6,.25);
    c.save();c.translate(f.x,y);c.scale(sc,sc);
    const chg=f.state==='charge'?1-f.t/.62:0;
    c.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){const k=i/4;c.fillStyle='rgba(255,'+(120+i*18)+',50,'+(.35-k*.3)+')';circ(c,-Math.cos(fa)*k*10,-Math.sin(fa)*k*10+Math.sin(t*9+i)*2,8-k*5+chg*3);c.fill();}
    c.globalCompositeOperation='source-over';
    c.rotate(fa);
    // a flame-shaped body with a hot core and hooded eyes
    const r=7+chg*3,fk=Math.sin(t*14+f.ph)*1.2;
    c.beginPath();c.moveTo(r,0);c.quadraticCurveTo(r*.6,-r,-r*.5,-r*.8);c.quadraticCurveTo(-r*1.2,-r*.5,-r*1.9-fk,-r*.2);c.quadraticCurveTo(-r*1.1,0,-r*1.7+fk,r*.5);c.quadraticCurveTo(-r*.9,r*.9,-r*.3,r*.85);c.quadraticCurveTo(r*.6,r,r,0);c.closePath();
    inked(c,flash?'#fff':'#ff9a3a',1,'#7a1e0a');
    c.fillStyle='#fff2c0';ell(c,.6,0,r*.52,r*.46);c.fill();
    c.fillStyle='#2a0e08';ell(c,3,-2.2,1.6,2.4,.3);c.fill();ell(c,3,2.2,1.6,2.4,-.3);c.fill();
    if(chg>0){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,200,100,'+(chg*.5)+')';circ(c,10+chg*4,0,3+chg*6);c.fill();c.globalCompositeOperation='source-over';}
    c.restore();
  } else if(f.kind==='husk'){
    shadowAt(f.x,f.y+7,15*sc,6,.4);
    c.save();c.translate(f.x,f.y);c.rotate(fa);c.scale(sc,sc);
    const wi=f.state==='wind'?1-f.t/.95:0,sl=f.state==='recover'?1:0;
    const step=Math.sin(f.age*5)*(f.state==='chase'?2:0);
    c.fillStyle='#1c1614';ell(c,step,-7,5,3);c.fill();ell(c,-step,7,5,3);c.fill();
    // arms raise overhead when winding up the slam
    const raise=wi*1.2-sl*.2;
    for(const s of[-1,1]){c.save();c.translate(1,s*13);c.rotate(s*(-.3-raise));c.scale(1+raise*.3,1);SPR.draw(c,'fha',26,14,paintHuskArm,7,0);c.restore();}
    SPR.draw(c,'fh|'+hk,36,40,cc=>paintHuskBody(cc,H),1,0);
    const glow=.07+Math.sin(t*4+f.ph)*.04+wi*.3+(flash?.45:0);
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,130,40,'+glow+')';ell(c,-1,0,11,12);c.fill();c.globalCompositeOperation='source-over';
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
function glowDot(c,x,y,r,col){c.globalCompositeOperation='lighter';c.fillStyle=col;circ(c,x,y,r);c.fill();c.globalCompositeOperation='source-over';}
/* The Bell-Warden: a giant of the abbey who carries its great bell on his back */
function paintWardenBody(c){
  blob(c,[4,-13,-4,-22,-20,-20,-30,-10,-27.6,0,-30,10,-20,20,-4,22,4,13]);inked(c,'#1b1728',1.6);
  c.strokeStyle='rgba(150,130,200,.3)';c.lineWidth=1;c.beginPath();for(const y of[-14,-7,7,14]){c.moveTo(-8,y);c.quadraticCurveTo(-20,y*1.05,-27,y*.74);}c.stroke();
  c.beginPath();c.moveTo(-19,-18.6);c.quadraticCurveTo(-28,-10,-25.8,0);c.quadraticCurveTo(-28,10,-19,18.6);c.strokeStyle='#c9c4e0';c.lineWidth=1;c.setLineDash([2.2,1.8]);c.stroke();c.setLineDash([]);
  cel(c,()=>blob(c,[15,0,12.4,-11,4,-19.4,-6,-18.4,-13.4,-10,-15.4,0,-13.4,10,-6,18.4,4,19.4,12.4,11]),'#40306a',[2,0,10,14.4],[5,-8,5,2.4,.4],1.7);
  c.beginPath();c.ellipse(0,0,11.6,15.6,0,0,6.3);c.strokeStyle='#e0b040';c.lineWidth=1.3;c.stroke();
  // bell harness: chains from each shoulder to the yoke
  for(const s of[-1,1]){line(c,[9,s*9,-9,s*4],INK,2.6);c.setLineDash([1.6,1.2]);line(c,[9,s*9,-9,s*4],'#c8a040',1.4);c.setLineDash([]);}
  // bell-dome pauldrons
  for(const s of[-1,1]){cel(c,()=>circ(c,2,s*17.4,6.8),'#c89a30',[1,s*17.4-1,4.6,4.6],[0,s*17.4-2.6,2.4,1.2],1.4);circ(c,2,s*17.4,4.3);c.strokeStyle='#6a4a10';c.lineWidth=.8;c.stroke();circ(c,2,s*17.4,1.5);inked(c,'#3a2a10',.6);}
}
function paintWardenBell(c,ph){
  circ(c,0,0,12.6);inked(c,'#7a5a18',1.6);
  cel(c,()=>circ(c,0,0,11),'#d8a838',[-1.6,-1.6,7.6,7.6],[-3.6,-4,3.4,2,-.6],1);
  c.strokeStyle='#6a4a10';c.lineWidth=1;circ(c,0,0,7);c.stroke();circ(c,0,0,3.6);c.stroke();
  c.strokeStyle='#8a6414';c.lineWidth=.9;c.beginPath();for(let i=0;i<12;i++){const a=i*.5236;c.moveTo(Math.cos(a)*8.2,Math.sin(a)*8.2);c.lineTo(Math.cos(a+.16)*9.9,Math.sin(a+.16)*9.9);}c.stroke();
  circ(c,0,0,2.2);inked(c,'#3a2a10',.8);
  if(ph>0){const cr=[[-11,-3,-6.6,-1.6,-4.4,-5,-1,-1.4,2.4,-2.6]];if(ph>1)cr.push([1,2,3.6,6,7.6,5.4,10.6,8],[-3,3,-5.6,7,-4.4,10.6]);
    for(const p of cr){line(c,p,'#2a1608',2.2);line(c,p,ph>1?'#ffb060':'#c890ff',.9);}}
}
function paintWardenHead(c,mood){
  // bell-clapper crest behind an iron-banded cowl
  line(c,[-4,0,-11,0],INK,3.4);line(c,[-4,0,-11,0],'#8a6a20',1.9);circ(c,-11.6,0,2.6);inked(c,'#d8a838',1);
  cel(c,()=>circ(c,0,0,8.4),'#2f2646',[.6,0,6,6.4],[-.6,-4,3.6,1.5,.2],1.5);
  c.strokeStyle='#8f96a8';c.lineWidth=1.3;c.beginPath();c.moveTo(-8,0);c.lineTo(2,0);c.moveTo(-1.6,-8.2);c.quadraticCurveTo(-3.4,0,-1.6,8.2);c.stroke();
  c.fillStyle='#565c6c';for(const p of[[-5,0],[-1.9,-5],[-1.9,5]]){circ(c,p[0],p[1],.9);c.fill();}
  // face in shadow behind a cage of three bars
  ell(c,5,0,4.2,5.4);c.fillStyle='#0e0a18';c.fill();c.strokeStyle='#e0b040';c.lineWidth=1.1;c.stroke();
  const hot=mood==='rage'||mood==='shout';
  c.fillStyle=mood==='ko'?'#4a4458':hot?'#ff7a3a':'#ffe08a';
  for(const s of[-1,1]){const ey=s*2.2;
    if(mood==='ko'){line(c,[4.6,ey-.9,6.2,ey+.9],'#8a84a0',.7);line(c,[4.6,ey+.9,6.2,ey-.9],'#8a84a0',.7);}
    else if(mood==='hurt'){line(c,[4.4,ey-s,6.2,ey,4.4,ey+s],'#ffe08a',.8);}
    else{poly(c,[4,ey-s*(hot?1.6:.9),6.8,ey-s*.2,6.2,ey+s*.9,4.2,ey+s*.6]);c.fill();}}
  if(mood==='shout'){c.fillStyle='#ff7a3a';ell(c,7.4,0,.9,1.6);c.fill();}
  c.strokeStyle='#8f96a8';c.lineWidth=.8;c.beginPath();for(const y of[-3,0,3]){c.moveTo(3,y*1.1);c.lineTo(9,y*.8);}c.stroke();
}
function paintWardenHammer(c){ // origin at the grip, head along +x
  shaft(c,-4,0,24,0,'#6a5038',2.6);
  c.strokeStyle='#c8a040';c.lineWidth=.9;c.beginPath();for(const x of[2,5,8]){c.moveTo(x,-1.5);c.lineTo(x+1,1.5);}c.stroke();
  cel(c,()=>blob(c,[30,0,29,-7,24,-8,20,-5.4,20,5.4,24,8,29,7]),'#c89a30',[24.6,0,4,6],[23.4,-4,2,1.4],1.5);
  line(c,[22,-5.6,22,5.6],'#6a4a10',.9);line(c,[27.6,-6.6,27.6,6.6],'#6a4a10',.9);
  poly(c,[30,-2.4,34.4,0,30,2.4]);inked(c,'#e8ecf4',.9);
}
function drawWarden(g){
  const c=ctx,t=G.time,f=vfa(g),st=g.st,roar=g.roar||0,dead=g.dead,dt_=g.deathT||0,flash=g.hurt>0,stag=g.stg>0;
  const ph=g.p3?2:g.p2?1:0;
  const tollP=st==='toll'?Math.sin((1-g.t/.95)*Math.PI):(g.toll>0?Math.sin((1-g.toll/.9)*Math.PI):0);
  if(dead){ // the bell splits, light pours through, and the pieces stay where they fall
    const k=Math.min(1,dt_/1.1),k2=Math.min(1,Math.max(0,dt_-.5)/1.1),e=easeOut(k);
    shadowAt(g.x,g.y+8,26,11,.4);
    c.save();c.translate(g.x,g.y);c.rotate(f);
    c.save();c.scale(1+e*.08,1-e*.2);c.globalAlpha=1-k2*.45;SPR.draw(c,'wdb',72,56,paintWardenBody,-8,0);
    c.translate(7-e*2,0);c.rotate(e*.5);SPR.draw(c,'wdh|ko',36,24,cc=>paintWardenHead(cc,'ko'),-2,0);c.restore();
    c.save();c.translate(10+e*8,17+e*5);c.rotate(-1.2*e+.3);SPR.draw(c,'wdm',48,22,paintWardenHammer,13,0);c.restore();
    if(dt_<1.7){const rk=Math.sin(Math.min(1,dt_/1.7)*Math.PI);c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,220,150,'+rk*.5+')';
      for(let i=0;i<7;i++){const a=i*.9+t*.4,L=18+rk*40;poly(c,[-10,0,-10+Math.cos(a-.07)*L,Math.sin(a-.07)*L,-10+Math.cos(a+.07)*L,Math.sin(a+.07)*L]);c.fill();}
      c.fillStyle='rgba(255,240,200,'+rk*.6+')';circ(c,-10,0,8+rk*8);c.fill();c.globalCompositeOperation='source-over';}
    for(const s of[-1,1]){c.save();c.translate(-10-e*3,s*e*9);c.rotate(s*e*.5);c.beginPath();c.rect(-14,s>0?0:-14,28,14);c.clip();SPR.draw(c,'wbl|2',28,28,cc=>paintWardenBell(cc,2));c.restore();}
    c.restore();return;
  }
  const lift=st==='leap'?Math.sin((g.leapU||0)*Math.PI)*46:0,crouch=st==='windLeap'?.12*Math.min(1,1-g.t/(g.p2?.75:.95)):0;
  shadowAt(g.x,g.y+10,26*(1-lift/140),12*(1-lift/140),.42-lift/200);
  const slam=st==='windSlam'?1-g.t/(g.p2?.7:.9):(st==='stagger'?-.15:0);
  c.save();c.translate(g.x,g.y-lift);c.rotate(f);
  // telegraphs drawn on the floor under him
  if(st==='windCharge'){const k=(t*5)%1;c.fillStyle='rgba(255,90,60,'+(.55-k*.3)+')';for(let i=0;i<3;i++){const x=26+i*13+k*6;poly(c,[x,-9,x+7,0,x,9,x+3,0]);c.fill();}}
  if(st==='windLeap'){const k=Math.min(1,1-g.t/(g.p2?.75:.95));c.strokeStyle='rgba(255,220,150,'+(.3+k*.5)+')';c.lineWidth=2;circ(c,0,0,44-k*22);c.stroke();}
  if(st==='windSlam'){c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,200,110,'+(.25+slam*.5)+')';c.lineWidth=4;c.beginPath();c.arc(4,17,30,-slam*2.1,0);c.stroke();c.globalCompositeOperation='source-over';}
  c.scale(1+lift/260+crouch,1-crouch);
  let sx=1+roar*.15,sy=1+roar*.15;
  if(st==='windCharge'){sx=1.05;sy=.92;}
  if(st==='charge'){sx=1.18;sy=.88;}
  if(st==='stagger')sy=.92;
  c.scale(sx,sy);
  if(st==='roar'||roar>0)c.translate(Math.sin(t*50)*roar*1.4,0);
  c.lineJoin='round';c.lineCap='round';
  // off arm braces forward on the charge, hammer arm rises for the slam
  const brace=st==='windCharge'||st==='charge'?1:0;
  c.save();c.translate(4,-17);c.rotate(.2-brace*.5);cel(c,()=>ell(c,5+brace*3,0,7.4,3.6),'#3a2c5c',[4,0,6,2.4],null,1.3);circ(c,12+brace*3,0,3);inked(c,'#d8b898',1);c.restore();
  SPR.draw(c,'wdb',72,56,paintWardenBody,-8,0);
  // the bell swells as it tolls and glows through its cracks once it is broken
  const bs=1+tollP*.26;
  c.save();c.translate(-10,0);c.scale(bs,bs);SPR.draw(c,'wbl|'+ph,28,28,cc=>paintWardenBell(cc,ph));c.restore();
  if(ph>0||tollP>0){c.globalCompositeOperation='lighter';c.fillStyle=ph>1?'rgba(255,150,60,'+(.22+Math.sin(t*7)*.1)+')':'rgba(190,140,255,'+(.16+Math.sin(t*5)*.07+tollP*.3)+')';circ(c,-10,0,13+tollP*5);c.fill();
    if(tollP>0){c.strokeStyle='rgba(255,236,170,'+(1-tollP*.5)+')';c.lineWidth=2.4;circ(c,-10,0,14+tollP*16);c.stroke();c.lineWidth=1.2;circ(c,-10,0,14+tollP*28);c.stroke();}
    c.globalCompositeOperation='source-over';}
  c.save();c.translate(4,17);c.rotate(-slam*2.1+(st==='charge'?.5:0));
  cel(c,()=>ell(c,3,0,7.4,3.8),'#3a2c5c',[2,0,6,2.6],null,1.3);
  SPR.draw(c,'wdm',48,22,paintWardenHammer,13,0);circ(c,9,0,3);inked(c,'#d8b898',1);
  if(slam>0)glowDot(c,25,0,6+slam*8,'rgba(255,200,110,'+(.25+slam*.45)+')');
  c.restore();
  const wm=flash||st==='stagger'?'hurt':roar>0?'shout':(g.p2||st==='windSlam'||st==='windCharge'||st==='windLeap'||st==='charge'||st==='leap'||st==='toll')?'rage':'wary';
  c.translate(7,0);c.rotate(st==='stagger'?Math.sin(t*9)*.2:Math.sin(t*1.3)*.06);
  SPR.draw(c,'wdh|'+wm,36,24,cc=>paintWardenHead(cc,wm),-2,0);
  if(flash){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,170,.5)';ell(c,-7,0,16,20);c.fill();c.globalCompositeOperation='source-over';}
  c.restore();
  if(st==='charge'&&Math.random()<.9)pt(g.x-Math.cos(g.dir)*16,g.y-Math.sin(g.dir)*16,rrand(-20,20),rrand(-20,20),.5,5,'#8a7a6a',{k:'smoke',gr:6});
  if(stag)for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,g.x+Math.cos(a)*12,g.y-26+Math.sin(a)*3.4,2.2);c.fill();}
}
/* The Candlemaker: a dark robe run over with wax, a mask, and a crown of lit candles */
function paintCandleBody(c){
  const drip='#4a3414';
  blob(c,[2,-15,-12,-17.4,-21,-13,-26,-15.6,-26.6,-8,-31.6,-5,-30,0,-31.6,5,-26.6,8,-26,15.6,-21,13,-12,17.4,2,15]);inked(c,'#1a1222',1.5);
  blob(c,[0,-10,-12,-10,-20,-5,-24,0,-20,5,-12,10,0,10]);c.fillStyle='#2e1f40';c.fill();
  c.strokeStyle='rgba(217,164,65,.6)';c.lineWidth=.9;c.beginPath();c.moveTo(-10,-16);c.quadraticCurveTo(-27,-9,-28.6,0);c.quadraticCurveTo(-27,9,-10,16);c.stroke();
  cel(c,()=>ell(c,0,0,11.4,14.4),'#33234a',[1.4,0,7.4,10.4],[3,-6,3.6,1.7,.4],1.5);
  rr(c,-1.3,-14,2.6,28,1);inked(c,'#d9a441',.8);c.fillStyle='#fff2c0';for(const y of[-10,-5,5,10]){poly(c,[0,y-1.3,1,y,0,y+1.3,-1,y]);c.fill();}
  // wax running off the shoulders
  for(const s of[-1,1]){
    blob(c,[5,s*9.6,4,s*15.6,-1,s*17.4,-4,s*14.6,-7.6,s*15.4,-9.6,s*11,-6,s*9.6,-5,s*6,-2,s*8.4,1,s*6.4]);inked(c,'#efe4bd',1,drip);
    c.fillStyle='rgba(224,160,56,.5)';ell(c,-5,s*12.4,2.2,1.4);c.fill();
    for(const p of[[2,s*13,1.9],[-2.4,s*14.4,1.5]]){circ(c,p[0],p[1],p[2]);inked(c,'#fff6da',.6,drip);c.fillStyle='#3a240c';circ(c,p[0],p[1],.5);c.fill();}
  }
}
function paintCandleHead(c,mood){
  const drip='#4a3414';
  // crown: five candles fused into a gold band round the back of the skull
  for(let i=0;i<5;i++){const a=1.75+i*.7,x=Math.cos(a)*7.6,y=Math.sin(a)*7.6;
    c.save();c.translate(x,y);c.rotate(a);
    c.beginPath();c.moveTo(1.6,0);c.quadraticCurveTo(4.4,-1.9,8.6,0);c.quadraticCurveTo(4.4,1.9,1.6,0);inked(c,'#ffb040',.6,'#8a3a08');ell(c,3.8,0,1.5,.6);c.fillStyle='#fff2c0';c.fill();
    circ(c,0,0,2.3);inked(c,'#fff6da',.8,drip);c.restore();}
  c.beginPath();c.arc(0,0,7.6,1.5,4.78);c.strokeStyle=INK;c.lineWidth=3;c.stroke();c.strokeStyle='#d9a441';c.lineWidth=1.7;c.stroke();
  cel(c,()=>blob(c,[9.4,0,7.6,-5,2,-7,-4.4,-6,-7,0,-4.4,6,2,7,7.6,5]),'#efe4bd',[2,0,6,5.4],[1.6,-3.6,3.4,1.3],1.3,drip);
  line(c,[-5,-1.6,-1.4,-.6,-3,2.4],'rgba(74,52,20,.6)',.6);
  const hot=mood==='rage'||mood==='shout';
  for(const s of[-1,1]){const ey=s*2.7;
    if(mood==='ko'){line(c,[4,ey-1,6,ey+1],drip,.9);line(c,[4,ey+1,6,ey-1],drip,.9);continue;}
    c.fillStyle='#1c1008';
    if(mood==='hurt'){line(c,[4,ey-s*1.1,6,ey,4,ey+s*1.1],drip,.9);continue;}
    poly(c,[3.2,ey-s*(hot?2:1.3),6.8,ey-s*(hot?.2:.6),6.4,ey+s*1.3,3.6,ey+s*1.1]);c.fill();
    c.fillStyle=hot?'#fff2c0':'#ffa838';circ(c,5.2,ey+s*.2,hot?1:.75);c.fill();
    c.fillStyle='rgba(224,160,56,.7)';ell(c,7.2,ey+s*1.4,.5,1);c.fill();
  }
  if(mood==='shout'||mood==='alarm'){c.fillStyle='#1c1008';ell(c,8,0,1,1.9);c.fill();}
  else{c.beginPath();c.moveTo(7.4,-2.2);c.quadraticCurveTo(mood==='joy'?9.2:8.2,0,7.4,2.2);c.strokeStyle=drip;c.lineWidth=.8;c.stroke();if(mood!=='ko'){c.beginPath();for(const y of[-1.2,0,1.2]){c.moveTo(7.6,y);c.lineTo(8.8,y);}c.lineWidth=.5;c.stroke();}}
}
function paintCandleArm(c){ // sleeve and a long wax hand, origin at the shoulder
  cel(c,()=>blob(c,[10,0,8,-3.4,0,-3.6,-3,0,0,3.6,8,3.4]),'#33234a',[3,0,6,2.2],null,1.2);
  c.strokeStyle=INK;c.lineWidth=2;c.beginPath();for(const a of[-.5,0,.5]){c.moveTo(10,a*2);c.lineTo(15.4,a*5.4);}c.stroke();c.strokeStyle='#efe4bd';c.lineWidth=1;c.stroke();
  circ(c,10.4,0,2.3);inked(c,'#efe4bd',.8,'#4a3414');
}
function paintOrbitCandle(c){
  rr(c,-1.9,-1.6,3.8,5.4,1);inked(c,'#fff6da',.8,'#4a3414');c.fillStyle='rgba(224,160,56,.6)';c.fillRect(-1.9,.6,1.2,2.2);
  c.beginPath();c.moveTo(0,-8.4);c.quadraticCurveTo(2.9,-4,0,-1.6);c.quadraticCurveTo(-2.9,-4,0,-8.4);inked(c,'#ffb040',.6,'#8a3a08');ell(c,0,-3.6,.8,1.5);c.fillStyle='#fff2c0';c.fill();
}
function drawCandlemaker(g){
  const c=ctx,t=G.time,f=vfa(g),st=g.st,roar=g.roar||0,dead=g.dead,dt_=g.deathT||0,flash=g.hurt>0,stag=g.stg>0;
  if(dead){ // the flames go out one by one and he melts into a pool that stays on the floor
    const k=Math.min(1,dt_/1.5),e=easeOut(k);
    c.save();c.translate(g.x,g.y+6);
    blob(c,[30*e+8,0,22*e+6,-12*e-4,0,-15*e-5,-24*e-6,-11*e-4,-32*e-8,2,-22*e-6,13*e+4,2,16*e+5,22*e+6,11*e+4]);inked(c,'#efe4bd',1.2,'#4a3414');
    c.fillStyle='rgba(224,160,56,.45)';ell(c,-4*e,2*e,16*e+3,7*e+2);c.fill();
    c.rotate(f);
    if(k<1){c.globalAlpha=1-k;c.scale(1+e*.5,1+e*.5);SPR.draw(c,'cmb',48,40,paintCandleBody,-12,0);c.globalAlpha=1;c.scale(1/(1+e*.5),1/(1+e*.5));}
    c.translate(3+e*9,e*5);c.rotate(e*1.1);c.scale(1-e*.15,1-e*.15);SPR.draw(c,'cmh|ko',36,36,cc=>paintCandleHead(cc,'ko'));
    c.restore();
    for(let i=0;i<6;i++){const lit=dt_<.2+i*.2,a=i/6*6.283+f,r=15+e*14,x=g.x+Math.cos(a)*r,y=g.y+6+Math.sin(a)*r*.8;
      c.save();c.translate(x,y);c.rotate(lit?0:1.2+i);if(lit)SPR.draw(c,'cmo',10,14,paintOrbitCandle,0,-2);else{rr(c,-1.9,-1.6,3.8,5.4,1);inked(c,'#e6dcb8',.8,'#4a3414');}c.restore();
      if(!lit&&dt_<1.2+i*.2){const u=(dt_-.2-i*.2);c.strokeStyle='rgba(200,200,215,'+Math.max(0,.6-u*.6)+')';c.lineWidth=1.2;c.beginPath();c.moveTo(x,y-4);c.quadraticCurveTo(x+4,y-10-u*14,x-2,y-16-u*24);c.stroke();}}
    return;
  }
  const hv=-4+Math.sin(t*2.4)*3,wind=st==='volleyWind'||st==='ringWind',bw=st==='blinkWind';
  const p=g.p3?2:g.p2?1:0;
  shadowAt(g.x,g.y+12,18,8,.35);
  // floor telegraphs
  if(st==='ringWind'){const k=(t*2.2)%1;c.strokeStyle='rgba(255,170,70,'+(.75-k*.5)+')';c.lineWidth=2.4;c.beginPath();c.ellipse(g.x,g.y+10,46-k*30,(46-k*30)*.62,0,0,6.3);c.stroke();}
  if(st==='summon'||st==='rain'){c.save();c.translate(g.x,g.y+10);c.scale(1,.62);c.rotate(t*1.4);c.strokeStyle='rgba(255,190,90,.7)';c.lineWidth=1.8;circ(c,0,0,26);c.stroke();poly(c,[26,0,-13,22.5,-13,-22.5]);c.stroke();poly(c,[-26,0,13,22.5,13,-22.5]);c.stroke();c.restore();}
  c.save();c.translate(g.x,g.y+hv);c.rotate(f);
  if(bw)c.globalAlpha=.35+Math.abs(Math.sin(t*30))*.3;
  const sc=1+roar*.14+(wind?.08:0);c.scale(sc,sc);
  c.lineJoin='round';c.lineCap='round';
  if(st==='slashWind'){const k=1-g.t/.42;c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,70,'+(.16+k*.3)+')';c.beginPath();c.moveTo(4,0);c.arc(4,0,40,-.9,.9);c.closePath();c.fill();c.globalCompositeOperation='source-over';}
  // arms: thrown wide for the volley and ring, swept for the slash, raised for rain and summons
  const sl=st==='slashWind'?(1-g.t/.42)*1.4-.7:0,up=wind?-.55:(st==='rain'||st==='summon'||roar>0)?-.9:Math.sin(t*1.8)*.08;
  for(const s of[-1,1]){c.save();c.translate(4,s*12.6);c.rotate(s*(.35+up)+(s>0?-sl:sl*.3));SPR.draw(c,'cma',26,14,paintCandleArm,6,0);
    if(wind||st==='rain')glowDot(c,15,0,3.4+Math.sin(t*30+s)*1.2,'rgba(255,170,70,.55)');c.restore();}
  SPR.draw(c,'cmb',48,40,paintCandleBody,-12,0);
  const cm=flash?'hurt':stag?'alarm':roar>0?'shout':(st==='slashWind'||wind||bw||g.p2)?'rage':'joy';
  c.save();c.translate(3,0);c.rotate(Math.sin(t*1.1)*.08+(stag?Math.sin(t*10)*.15:0));SPR.draw(c,'cmh|'+cm,36,36,cc=>paintCandleHead(cc,cm));
  glowDot(c,0,0,13+Math.sin(t*8)*1.2,'rgba(255,170,70,'+(.1+p*.05)+')');c.restore();
  if(wind){ // sparks drawn in toward the casting point
    c.strokeStyle='rgba(255,210,130,.8)';c.lineWidth=1.2;c.beginPath();for(let i=0;i<6;i++){const a=i*1.047+t*3,k=1-((t*3+i*.37)%1);c.moveTo(18+Math.cos(a)*k*16,Math.sin(a)*k*16);c.lineTo(18+Math.cos(a)*k*11,Math.sin(a)*k*11);}c.stroke();
    glowDot(c,18,0,5+Math.sin(t*30)*1.5,'rgba(255,170,70,.6)');}
  if(flash){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,200,200,.5)';ell(c,-6,0,18,15);c.fill();c.globalCompositeOperation='source-over';}
  c.restore();
  // orbiting candles: faster and wider with each phase; they stay upright
  const n=6,R=17+p*2+(wind?4:0),spd=.6+p*.5;
  for(let i=0;i<n;i++){const a=i/n*6.283+t*spd,x=g.x+Math.cos(a)*R,y=g.y+hv+Math.sin(a)*R*.86;c.drawImage(SPR.get('cmo',10,14,paintOrbitCandle,0,-2),x-5,y-9,10,14);}
  if(G.candlesLit>0&&g.eng){c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,190,90,'+(.3+.2*Math.sin(t*6))+')';c.lineWidth=3;circ(c,g.x,g.y+hv,25+Math.sin(t*4)*1.5);c.stroke();c.globalCompositeOperation='source-over';}
  c.globalAlpha=1;
  if(stag)for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,g.x+Math.cos(a)*10,g.y-24+Math.sin(a)*3,2);c.fill();}
}
function drawBoss(g){
  if(g.kind==='candle')drawCandlemaker(g);else drawWarden(g);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
