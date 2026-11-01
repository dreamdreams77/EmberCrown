'use strict';
/* EMBERCROWN - world rendering: baked tile layer, lighting, characters, particles. */
const V={w:800,h:480,dpr:1,sc:1,cx:400,cy:240,ww:800,wh:480,coarse:false,U:1,sx:0,sy:0};
const HEAD='"Cinzel","Trajan Pro","Palatino Linotype",Georgia,serif',BODY='Georgia,"Times New Roman",serif';

/* ---------- small utils ---------- */
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function sh(h,m,a){const c=hx(h);return'rgba('+Math.min(255,c[0]*m|0)+','+Math.min(255,c[1]*m|0)+','+Math.min(255,c[2]*m|0)+','+(a==null?1:a)+')';}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function ell(c,x,y,rx,ry,rot){c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,6.2832);}
function circ(c,x,y,r){c.beginPath();c.arc(x,y,r,0,6.2832);}
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- layout & camera ---------- */
function layout(){
  const r=cv.getBoundingClientRect();
  V.w=Math.max(120,r.width);V.h=Math.max(120,r.height);
  V.dpr=Math.min(window.devicePixelRatio||1,Q.dprCap);
  const pw=Math.round(V.w*V.dpr),ph=Math.round(V.h*V.dpr);
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}
  V.coarse=touch.on||matchMedia('(pointer:coarse)').matches;
  V.U=clamp(Math.min(V.w,V.h*1.6)/760,.8,1.3);
  if(G){G.dirty=true;}
}
function worldScale(){
  const fit=Math.min(V.w/V.ww,V.h/V.wh);
  let sc=fit;
  if(V.coarse||V.w<640){const want=(V.coarse?(V.h>V.w?36:34):30)/T;sc=Math.max(fit,want);}
  return Math.min(sc,4);
}
function camUpdate(dt,snap){
  if(!G)return;
  V.ww=G.gw*T;V.wh=G.gh*T;
  V.sc=worldScale();
  const A=G.active==='wren'?G.wren:G.ash;
  const look=22;
  let tx=A.x+Math.cos(A.face)*look*.6,ty=A.y+Math.sin(A.face)*look*.6;
  const vw=V.w/V.sc,vh=V.h/V.sc;
  tx=vw>=V.ww?V.ww/2:clamp(tx,vw/2,V.ww-vw/2);
  ty=vh>=V.wh?V.wh/2:clamp(ty,vh/2,V.wh-vh/2);
  if(snap||!G.cam)G.cam={x:tx,y:ty};
  else{const k=Math.min(1,dt*5);G.cam.x+=(tx-G.cam.x)*k;G.cam.y+=(ty-G.cam.y)*k;}
  V.cx=G.cam.x;V.cy=G.cam.y;
  V.sx=0;V.sy=0;
  if(G.shake>0){V.sx=(Math.random()-.5)*G.shake;V.sy=(Math.random()-.5)*G.shake;}
}
function setWorldTransform(){
  const s=V.sc*V.dpr;
  ctx.setTransform(s,0,0,s,(V.w/2-V.cx*V.sc+V.sx)*V.dpr,(V.h/2-V.cy*V.sc+V.sy)*V.dpr);
}
function screenToWorld(px,py){return{x:(px-V.w/2-V.sx)/V.sc+V.cx,y:(py-V.h/2-V.sy)/V.sc+V.cy};}
function worldToScreen(x,y){return{x:(x-V.cx)*V.sc+V.w/2+V.sx,y:(y-V.cy)*V.sc+V.h/2+V.sy};}
function viewRect(){const vw=V.w/V.sc,vh=V.h/V.sc;return{x:V.cx-vw/2,y:V.cy-vh/2,w:vw,h:vh};}

/* ---------- baked static layer ---------- */
const ST={cv:document.createElement('canvas'),sc:1};
const LT={cv:document.createElement('canvas'),k:4};
const spriteCache={};
function lightSprite(){
  if(spriteCache.light)return spriteCache.light;
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.62)');gr.addColorStop(.7,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);return spriteCache.light=c;
}
function glowSprite(col){
  if(spriteCache[col])return spriteCache[col];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba('+col+',.9)');gr.addColorStop(.4,'rgba('+col+',.32)');gr.addColorStop(1,'rgba('+col+',0)');
  g.fillStyle=gr;g.fillRect(0,0,64,64);return spriteCache[col]=c;
}
function softSprite(col){
  const key='s'+col;if(spriteCache[key])return spriteCache[key];
  let rgb;
  if(col[0]==='#'){const c=hx(col);rgb=c[0]+','+c[1]+','+c[2];}
  else{const m=col.match(/\d+/g);rgb=m[0]+','+m[1]+','+m[2];}
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');
  const gr=g.createRadialGradient(24,24,0,24,24,24);
  gr.addColorStop(0,'rgba('+rgb+',.85)');gr.addColorStop(.55,'rgba('+rgb+',.4)');gr.addColorStop(1,'rgba('+rgb+',0)');
  g.fillStyle=gr;g.fillRect(0,0,48,48);return spriteCache[key]=c;
}
const TORCHCOL={marrow:'255,176,90',grell:'255,160,70',ostrander:'200,230,255',sable:'170,185,255',kest:'255,120,50',dunmoor:'255,205,130',hallow:'255,190,90'};

function themePal(){return(G.state==='ruin'&&G.d.palRuin)?G.d.palRuin:G.d.pal;}
function isW(x,y){const r=G.grid[y];return!r||r[x]===undefined||r[x]==='#'||r[x]===' ';}
function isVoid(x,y){const r=G.grid[y];return!r||r[x]===undefined||r[x]===' ';}

function floorTile(c,x,y,p,fs,rnd,th){
  const px=x*T,py=y*T,alt=(x+y)%2,base=alt?p.f1:p.f2;
  c.fillStyle=base;c.fillRect(px,py,T,T);
  if(fs==='stone'||fs==='ruin'||fs==='rubble'){
    // quarter slabs with bevel
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      const v=.9+rnd()*.28;c.fillStyle=sh(base,v,.55);c.fillRect(px+i*16+1,py+j*16+1,14,14);
    }
    c.fillStyle='rgba(0,0,0,.30)';c.fillRect(px,py+15,T,2);c.fillRect(px+15,py,2,T);
    c.fillStyle='rgba(255,255,255,.045)';c.fillRect(px,py,T,1);c.fillRect(px,py,1,T);
    c.fillStyle='rgba(0,0,0,.35)';c.fillRect(px,py+T-1,T,1);c.fillRect(px+T-1,py,1,T);
    for(let i=0;i<5;i++){c.fillStyle=rnd()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.16)';c.fillRect(px+rnd()*T,py+rnd()*T,1+rnd()*2.4,1+rnd()*1.6);}
    if(rnd()<(fs==='stone'?.07:.14)){
      c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.beginPath();let cx=px+rnd()*T,cy=py+rnd()*T;c.moveTo(cx,cy);
      for(let i=0;i<4;i++){cx+=(rnd()-.5)*12;cy+=(rnd()-.5)*12;c.lineTo(cx,cy);}c.stroke();
    }
    if(fs==='rubble'&&rnd()<.22){c.fillStyle='rgba(10,6,4,.35)';ell(c,px+rnd()*T,py+rnd()*T,4+rnd()*6,3+rnd()*4,rnd()*3);c.fill();}
    if(fs==='rubble'&&rnd()<.10){c.fillStyle=sh('#6a5a4a',.7+rnd()*.4);c.beginPath();const bx=px+6+rnd()*18,by=py+6+rnd()*18;c.moveTo(bx,by);c.lineTo(bx+4+rnd()*4,by+1);c.lineTo(bx+2,by+4+rnd()*3);c.fill();}
    if(fs==='ruin'&&rnd()<.05){c.fillStyle='rgba(255,200,100,.05)';c.fillRect(px,py,T,T);}
  } else if(fs==='wood'){
    for(let j=0;j<4;j++){
      c.fillStyle=sh(base,.88+rnd()*.3,.9);c.fillRect(px,py+j*8,T,8);
      c.fillStyle='rgba(0,0,0,.34)';c.fillRect(px,py+j*8+7,T,1);
      const sx=px+((rnd()*T)|0);c.fillStyle='rgba(0,0,0,.28)';c.fillRect(sx,py+j*8,1,7);
      c.strokeStyle='rgba(0,0,0,.09)';c.lineWidth=1;c.beginPath();c.moveTo(px,py+j*8+2+rnd()*4);c.lineTo(px+T,py+j*8+2+rnd()*4);c.stroke();
      c.fillStyle='rgba(255,230,190,.10)';c.fillRect(px,py+j*8,T,1);
    }
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(px+2,py+3,1.4,1.4);c.fillRect(px+T-3,py+11,1.4,1.4);c.fillRect(px+4,py+19,1.4,1.4);c.fillRect(px+T-5,py+27,1.4,1.4);
  } else if(fs==='marble'){
    c.fillStyle=alt?'rgba(255,255,255,.06)':'rgba(0,0,0,.16)';c.fillRect(px,py,T,T);
    const gr=c.createLinearGradient(px,py,px+T,py+T);gr.addColorStop(0,'rgba(255,255,255,.12)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.18)');
    c.fillStyle=gr;c.fillRect(px,py,T,T);
    c.strokeStyle='rgba(225,195,120,.16)';c.lineWidth=1;c.strokeRect(px+.5,py+.5,T-1,T-1);
    c.strokeStyle='rgba(255,255,255,.07)';c.beginPath();c.moveTo(px+rnd()*T,py);c.quadraticCurveTo(px+rnd()*T,py+16,px+rnd()*T,py+T);c.stroke();
    if(!alt){c.fillStyle='rgba(225,195,120,.18)';c.beginPath();c.moveTo(px+16,py+10);c.lineTo(px+22,py+16);c.lineTo(px+16,py+22);c.lineTo(px+10,py+16);c.fill();}
  } else if(fs==='forge'){
    c.fillStyle=sh(base,.9+rnd()*.25,.8);c.fillRect(px+1,py+1,T-2,T-2);
    c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1.5;c.strokeRect(px+.75,py+.75,T-1.5,T-1.5);
    c.strokeStyle='rgba(255,170,110,.07)';c.lineWidth=1;c.beginPath();c.moveTo(px+2,py+2);c.lineTo(px+T-2,py+2);c.stroke();
    c.fillStyle='rgba(20,10,8,.8)';for(const [ox,oy] of [[4,4],[T-4,4],[4,T-4],[T-4,T-4]]){circ(c,px+ox,py+oy,1.5);c.fill();}
    c.fillStyle='rgba(255,190,130,.14)';for(const [ox,oy] of [[4,4],[T-4,4]]){circ(c,px+ox-.4,py+oy-.4,.8);c.fill();}
    if(rnd()<.13){
      c.strokeStyle='rgba(255,90,20,.20)';c.lineWidth=4;c.beginPath();let cx=px+4,cy=py+8+rnd()*16;c.moveTo(cx,cy);
      for(let i=0;i<4;i++){cx+=6+rnd()*3;cy+=(rnd()-.5)*10;c.lineTo(cx,cy);}c.stroke();
      c.strokeStyle='rgba(255,170,60,.7)';c.lineWidth=1.2;c.stroke();
    }
    for(let i=0;i<3;i++){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(px+rnd()*T,py+rnd()*T,2,1);}
  }
  // decals
  if(th.bones&&rnd()<th.bones){
    c.strokeStyle='rgba(225,220,200,.6)';c.lineWidth=1.6;c.lineCap='round';
    const bx=px+8+rnd()*16,by=py+8+rnd()*16,a=rnd()*3;
    c.beginPath();c.moveTo(bx,by);c.lineTo(bx+Math.cos(a)*8,by+Math.sin(a)*8);c.stroke();
    c.beginPath();c.moveTo(bx+2,by+3);c.lineTo(bx+2+Math.cos(a+1.2)*6,by+3+Math.sin(a+1.2)*6);c.stroke();
    if(rnd()<.35){c.fillStyle='rgba(225,220,200,.7)';ell(c,bx-3,by-3,3,2.6);c.fill();c.fillStyle='rgba(0,0,0,.6)';c.fillRect(bx-4.5,by-4,1.2,1.2);c.fillRect(bx-2.5,by-4,1.2,1.2);}
    c.lineCap='butt';
  }
  if(th.coins&&rnd()<th.coins){c.fillStyle='#e0b040';circ(c,px+6+rnd()*20,py+6+rnd()*20,1.8);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.fillRect(px+8+rnd()*10,py+8+rnd()*10,1,1);}
  if(G.state==='ruin'&&rnd()<.07){c.fillStyle='rgba(40,70,90,.5)';ell(c,px+16,py+16,8+rnd()*6,5+rnd()*4,rnd()*3);c.fill();c.fillStyle='rgba(180,210,230,.18)';ell(c,px+14,py+14,4,2,0);c.fill();}
  if(th.part==='fog'&&G.state==='ball'&&rnd()<.06){c.fillStyle='rgba(60,90,70,.18)';ell(c,px+rnd()*T,py+rnd()*T,6,4,0);c.fill();}
}

function wallTile(c,x,y,p,th,rnd,flight){
  const px=x*T,py=y*T;
  const front=!isW(x,y+1)&&y+1<G.gh;
  if(flight){
    // fortress roof seen from above
    c.fillStyle='rgba(0,0,0,.30)';c.fillRect(px+5,py+7,T,T);
    c.fillStyle=sh(p.w,.7+rnd()*.18);c.fillRect(px,py,T,T);
    for(let j=0;j<4;j++){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(px,py+j*8+7,T,1);c.fillStyle='rgba(255,255,255,.07)';c.fillRect(px,py+j*8,T,1);
      c.fillStyle='rgba(0,0,0,.14)';c.fillRect(px+((j%2)*8+rnd()*3|0),py+j*8,1,7);c.fillRect(px+16+((j%2)*8),py+j*8,1,7);}
    if(isW(x,y-1)===false||y===0){c.fillStyle=p.wt;c.fillRect(px,py,T,2);}
    if(isW(x-1,y)===false){c.fillStyle='rgba(255,255,255,.12)';c.fillRect(px,py,2,T);}
    if(isW(x+1,y)===false){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(px+T-2,py,2,T);}
    if(isW(x,y+1)===false){c.fillStyle='rgba(0,0,0,.4)';c.fillRect(px,py+T-2,T,2);}
    return;
  }
  if(front){
    const cap=9;
    const g=c.createLinearGradient(0,py+cap,0,py+T);g.addColorStop(0,sh(p.w,.95));g.addColorStop(1,sh(p.w,.55));
    c.fillStyle=g;c.fillRect(px,py+cap,T,T-cap);
    if(th.wall==='iron'){
      c.fillStyle='rgba(0,0,0,.28)';c.fillRect(px+15,py+cap,2,T-cap);
      c.fillStyle='rgba(255,255,255,.07)';c.fillRect(px+1,py+cap+1,T-2,1);
      c.fillStyle='rgba(15,8,6,.85)';for(const [ox,oy] of [[4,cap+4],[T-4,cap+4],[4,T-4],[T-4,T-4],[T/2-5,cap+11],[T/2+7,cap+11]]){circ(c,px+ox,py+oy,1.4);c.fill();}
      if(rnd()<.35){c.fillStyle='rgba(255,120,40,.18)';c.fillRect(px+4,py+T-3,T-8,2);}
    } else {
      for(let j=0;j<3;j++){
        const y0=py+cap+j*7.6,off=(j%2)*8+rnd()*2;
        c.fillStyle='rgba(0,0,0,.30)';c.fillRect(px,y0+6.4,T,1.2);
        for(let i=-1;i<3;i++){const bx=px+off+i*16;c.fillStyle='rgba(0,0,0,.26)';c.fillRect(bx,y0,1.2,7);
          if(rnd()<.5){c.fillStyle='rgba(255,255,255,.04)';c.fillRect(bx+2,y0+1,12,2);}}
      }
      if(rnd()<.18){c.fillStyle='rgba(0,0,0,.14)';c.fillRect(px+rnd()*20,py+cap+rnd()*10,8,4);}
    }
    const g2=c.createLinearGradient(0,py,0,py+cap);g2.addColorStop(0,sh(p.wt,1.1));g2.addColorStop(1,sh(p.wt,.78));
    c.fillStyle=g2;c.fillRect(px,py,T,cap);
    c.fillStyle='rgba(255,255,255,.16)';c.fillRect(px,py,T,1.5);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(px,py+cap-1,T,1.5);
  } else {
    c.fillStyle=sh(p.wt,.74+rnd()*.08);c.fillRect(px,py,T,T);
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(px,py+15,T,1);c.fillRect(px+15,py,1,T);
    for(let i=0;i<3;i++){c.fillStyle='rgba(255,255,255,.03)';c.fillRect(px+rnd()*T,py+rnd()*T,3,2);}
    if(!isW(x,y-1)&&y>0){c.fillStyle='rgba(255,255,255,.10)';c.fillRect(px,py,T,1.5);}
    if(!isW(x-1,y)){c.fillStyle='rgba(255,255,255,.06)';c.fillRect(px,py,1.5,T);}
    if(!isW(x+1,y)){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(px+T-1.5,py,1.5,T);}
  }
}

function bakeStatic(){
  const gw=G.gw,gh=G.gh,W=gw*T,H=gh*T,th=G.d.th;
  let s=Math.max(1,Math.min(2.5,Math.round(V.sc*V.dpr*2)/2));if(W*s>4096)s=4096/W;
  ST.sc=s;ST.cv.width=Math.ceil(W*s);ST.cv.height=Math.ceil(H*s);
  const c=ST.cv.getContext('2d');c.setTransform(s,0,0,s,0,0);
  const p=themePal(),ruin=G.state==='ruin',rnd=mulberry(4242+lvl*131+(ruin?9999:0));
  const fs=G.flight?'sea':ruin?'rubble':th.floor;
  c.fillStyle='#06040a';c.fillRect(0,0,W,H);
  G.torches=[];G.beams=[];
  // floors
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    if(isVoid(x,y))continue;
    if(G.flight){
      if(G.grid[y][x]==='#')continue;
      const v=rnd();c.fillStyle=(x+y)%2?p.f1:p.f2;c.fillRect(x*T,y*T,T,T);
      c.fillStyle='rgba(120,210,220,'+(.03+v*.04)+')';c.fillRect(x*T,y*T,T,T);
      continue;
    }
    if(G.grid[y][x]==='#')continue;
    floorTile(c,x,y,p,fs,rnd,th);
  }
  // rugs
  if(!ruin)for(const [rx,ry,rw,rh,col] of th.rugs||[]){
    c.fillStyle='rgba(0,0,0,.28)';c.fillRect(rx*T+2,ry*T+3,rw*T,rh*T);
    c.fillStyle=col;c.fillRect(rx*T+2,ry*T+2,rw*T-4,rh*T-4);
    c.strokeStyle='rgba(224,176,64,.65)';c.lineWidth=2;c.strokeRect(rx*T+5,ry*T+5,rw*T-10,rh*T-10);
    c.strokeStyle='rgba(224,176,64,.28)';c.lineWidth=1;c.strokeRect(rx*T+9,ry*T+9,rw*T-18,rh*T-18);
    c.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<rw*T/5;i++)c.fillRect(rx*T+3+i*5,ry*T+3,1,rh*T-6);
  }
  // rune circle
  if(G.d.finale){
    const cx=12.5*T,cy=7.5*T;
    c.strokeStyle='rgba(255,200,110,.30)';c.lineWidth=2;circ(c,cx,cy,78);c.stroke();circ(c,cx,cy,66);c.stroke();
    c.lineWidth=1;circ(c,cx,cy,50);c.stroke();
    for(let i=0;i<10;i++){const a=i/10*6.283;c.beginPath();c.moveTo(cx+Math.cos(a)*66,cy+Math.sin(a)*66);c.lineTo(cx+Math.cos(a)*78,cy+Math.sin(a)*78);c.stroke();
      c.save();c.translate(cx+Math.cos(a+.3)*58,cy+Math.sin(a+.3)*58);c.rotate(a);c.fillStyle='rgba(255,200,110,.3)';c.fillRect(-3,-1,6,2);c.restore();}
    c.beginPath();for(let i=0;i<5;i++){const a=-1.57+i*2.513;const px=cx+Math.cos(a)*50,py=cy+Math.sin(a)*50;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.stroke();
  }
  // wall shadows on floors
  if(!G.flight)for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    if(isW(x,y))continue;
    const px=x*T,py=y*T;
    if(isW(x,y-1)){const g=c.createLinearGradient(0,py,0,py+14);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(px,py,T,14);}
    if(isW(x-1,y)){const g=c.createLinearGradient(px,0,px+9,0);g.addColorStop(0,'rgba(0,0,0,.30)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(px,py,9,T);}
    if(isW(x+1,y)){const g=c.createLinearGradient(px+T,0,px+T-7,0);g.addColorStop(0,'rgba(0,0,0,.2)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(px+T-7,py,7,T);}
  }
  // walls
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    if(G.grid[y][x]!=='#')continue;
    wallTile(c,x,y,p,th,rnd,G.flight);
  }
  // sea foam around roofs
  if(G.flight){
    c.strokeStyle='rgba(220,245,255,.22)';c.lineWidth=2;
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){if(G.grid[y][x]!=='#')continue;
      if(!isW(x,y+1)&&y+1<gh){c.beginPath();c.moveTo(x*T,y*T+T+2);c.lineTo(x*T+T,y*T+T+2);c.stroke();}
      if(!isW(x-1,y)){c.beginPath();c.moveTo(x*T-2,y*T);c.lineTo(x*T-2,y*T+T);c.stroke();}
      if(!isW(x+1,y)){c.beginPath();c.moveTo(x*T+T+2,y*T);c.lineTo(x*T+T+2,y*T+T);c.stroke();}}
  }
  // wall-mounted decor
  if(!G.flight){
    const tc=TORCHCOL[G.d.sigil]||'255,170,70';
    let lastTorch=-9;
    for(let y=0;y<gh-1;y++)for(let x=0;x<gw;x++){
      if(G.grid[y][x]!=='#'||isW(x,y+1)||y+1>=gh)continue;
      const px=x*T,py=y*T,r=rnd();
      const nearDoor=G.doors[x+','+(y+1)];
      if(r<(th.torch||0)&&Math.abs(x-lastTorch)>2&&!ruin||(ruin&&r<(th.torch||0)*.5)){
        lastTorch=x;
        c.fillStyle='#2a2018';c.fillRect(px+14,py+13,4,10);c.fillStyle='#4a3a28';c.fillRect(px+12,py+21,8,3);
        c.fillStyle='#1a1410';c.fillRect(px+15,py+9,2,6);
        G.torches.push({x:px+16,y:py+12,ph:rnd()*6,col:tc,out:ruin&&rnd()<.4});
      } else if(r<(th.torch||0)+(th.banner||0)&&!nearDoor){
        const bc=th.bannerCol||'#8a4a4a';
        c.fillStyle='#2a2018';c.fillRect(px+7,py+10,18,2);
        c.fillStyle=bc;c.beginPath();c.moveTo(px+9,py+11);c.lineTo(px+23,py+11);c.lineTo(px+23,py+T-6);c.lineTo(px+16,py+T-10);c.lineTo(px+9,py+T-6);c.closePath();c.fill();
        c.fillStyle='rgba(0,0,0,.25)';c.fillRect(px+16,py+11,7,T-17);
        c.fillStyle=th.trim;c.globalAlpha=.8;c.beginPath();c.moveTo(px+16,py+15);c.lineTo(px+19,py+19);c.lineTo(px+16,py+23);c.lineTo(px+13,py+19);c.closePath();c.fill();c.globalAlpha=1;
        if(ruin){c.fillStyle='rgba(0,0,0,.5)';c.fillRect(px+9,py+22,5,8);}
      } else if(r<(th.torch||0)+(th.banner||0)+(th.windows||0)&&!nearDoor&&!ruin){
        c.fillStyle='#0b0a14';c.beginPath();c.moveTo(px+8,py+T-3);c.lineTo(px+8,py+16);c.arc(px+16,py+16,8,Math.PI,0);c.lineTo(px+24,py+T-3);c.closePath();c.fill();
        const gl=['#6a4aa8','#4a6ac8','#a84a8a'];
        for(let i=0;i<3;i++){c.fillStyle=gl[i];c.globalAlpha=.75;c.fillRect(px+9+i*5.2,py+13+(i===1?-2:0),4.2,15-(i===1?-2:0));}c.globalAlpha=1;
        c.strokeStyle='#2a2438';c.lineWidth=1;c.strokeRect(px+8.5,py+13.5,15,14);
        G.beams.push({x:px+16,y:py+T,w:T});
      } else if(th.pipes&&r<(th.torch||0)+(th.banner||0)+th.pipes){
        c.fillStyle='#2a1a16';c.fillRect(px,py+16,T,6);c.fillStyle='rgba(255,170,120,.18)';c.fillRect(px,py+16,T,1.5);
        c.fillStyle='#4a2a22';c.fillRect(px+5,py+14,3,10);c.fillRect(px+T-9,py+14,3,10);
        G.torches.push({x:px+16,y:py+22,ph:rnd()*6,col:'255,100,40',pipe:true});
      }
    }
  }
  G.lightsBaked=true;
}

/* ---------- lighting ---------- */
function drawLights(c,list,amb){
  // c: low-res darkness canvas ctx
  const k=LT.k;
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
  c.clearRect(0,0,LT.cv.width,LT.cv.height);
  c.fillStyle='rgba('+amb[0]+','+amb[1]+','+amb[2]+','+amb[3]+')';c.fillRect(0,0,LT.cv.width,LT.cv.height);
  c.globalCompositeOperation='destination-out';
  const spr=lightSprite();
  for(const l of list){
    c.globalAlpha=clamp(l.a,0,1);
    c.drawImage(spr,(l.x-l.r)/k,(l.y-l.r)/k,l.r*2/k,l.r*2/k);
  }
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
}
function collectLights(){
  const L=[],t=G.time,A=G.active==='wren'?G.wren:G.ash;
  const vr=viewRect(),pad=140;
  const add=(x,y,r,a,col,gl)=>{
    if(x<vr.x-r-pad||x>vr.x+vr.w+r+pad||y<vr.y-r-pad||y>vr.y+vr.h+r+pad)return;
    L.push({x,y,r,a,col,gl:gl==null?.5:gl});};
  for(const tr of G.torches||[]){
    if(tr.out)continue;
    const fl=1+Math.sin(t*9+tr.ph)*.06+Math.sin(t*23+tr.ph*2)*.05;
    add(tr.x,tr.y+14,tr.pipe?80:118*fl,.95,tr.col,.55);
  }
  for(const it of G.items){
    if(it.done&&it.type!=='B')continue;
    if(it.type==='C')add(it.x,it.y-4,100+Math.sin(t*7+it.ph)*5,.9,'255,175,70',.6);
    else if(it.type==='B'){if(!it.done)add(it.x,it.y-4,70+it.p*70,.8,'255,100,40',.7);else add(it.x,it.y,34,.3,'255,80,30',.2);}
    else if('gGrs'.includes(it.type)){add(it.x,it.y,it.type==='r'?70:it.type==='G'?54:30,.7,it.type==='s'?'255,235,200':'255,170,60',.6);}
    else if('OPLH'.includes(it.type)){add(it.x,it.y,50,.55,'255,225,150',.45);}
  }
  for(const v of G.vents)if(v.on)add(v.x*T+16,v.y*T+16,86,.9,'255,110,30',.8);else if(v.warn)add(v.x*T+16,v.y*T+16,40,.5,'255,110,30',.4);
  for(const pd of G.peds)add(pd.x,pd.y,58,.7,G.state==='ruin'?'255,160,100':'160,190,255',.6);
  if(G.exitOpen)add(G.exit.x,G.exit.y,80+Math.sin(t*3)*6,.8,'110,255,160',.5);
  if(!G.flight)add(G.wren.x,G.wren.y,G.active==='wren'?96:70,.85,'210,200,255',.12);
  if(G.ash.on)add(G.ash.x,G.ash.y,G.active==='ash'?118:92,.95,'255,150,70',.4);
  if(G.host&&G.host.on)add(G.host.x,G.host.y,50,.55,'160,220,255',.2);
  if(G.fireOn){const a=G.ash;add(a.x+Math.cos(a.face)*40,a.y+Math.sin(a.face)*40,150,1,'255,150,50',.8);}
  for(const g of G.guards){
    if(g.spin)continue;
    if(g.stun>0||g.dead)continue;
    if(g.kind==='hound')continue;
    add(g.x,g.y,g.boss?90:50,g.boss?.9:.65,g.boss&&g.kind==='candle'?'255,170,70':'255,190,110',g.boss?.5:.25);
  }
  if(G.dash.t>0)add(G.ash.x,G.ash.y,90,.9,'255,140,50',.7);
  for(const r of G.rings){if(r.t>0&&r.r>60)add(r.x,r.y,r.r*(1-Math.min(1,r.t))*.7,.35*Math.min(1,r.t),r.c,.25);}
  for(const p of PT)if(p.add&&p.s>3&&p.l>0.1&&(p.k==='dot'))add(p.x,p.y,24,.18,'255,170,60',.2);
  return L;
}
function drawDarkness(){
  const th=G.d.th;
  let amb=(G.state==='ruin'&&th.ruin&&th.ruin.amb)||th.amb;
  amb=amb.slice();
  if(G.d.finale)amb[3]=clamp(amb[3]+(5-Math.min(5,G.candlesLit||0))*.055,0,.8);
  amb[3]=clamp(amb[3]+(G.shiftT>0?.1*G.shiftT:0),0,.85);
  const W=G.gw*T,H=G.gh*T,k=LT.k;
  const lw=Math.ceil(W/k),lh=Math.ceil(H/k);
  if(LT.cv.width!==lw||LT.cv.height!==lh){LT.cv.width=lw;LT.cv.height=lh;}
  const lc=LT.cv.getContext('2d');
  const list=collectLights();
  drawLights(lc,list,amb);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(LT.cv,0,0,lw,lh,0,0,lw*k,lh*k);
  // colored glows
  ctx.globalCompositeOperation='lighter';
  for(const l of list){
    if(!l.gl)continue;
    ctx.globalAlpha=clamp(l.gl*.5*l.a,0,.7);
    const r=l.r*1.15;ctx.drawImage(glowSprite(l.col),l.x-r,l.y-r,r*2,r*2);
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}

/* ---------- characters ---------- */
function shadowAt(x,y,rx,ry,a){ctx.fillStyle='rgba(0,0,0,'+(a||.34)+')';ell(ctx,x,y,rx,ry);ctx.fill();}
function drawWren(w,active){
  const c=ctx,sw=Math.sin(w.ph),sneak=G.sneak&&active;
  const mv=w.sd!==undefined&&(G.time-(w.lastMove||0)<.2);
  shadowAt(w.x,w.y+4,10,5.5,.38);
  c.save();c.translate(w.x,w.y);c.rotate(w.face);
  if(sneak)c.scale(.94,.9);
  // boots
  c.fillStyle='#241a30';ell(c,sw*3,-4.6,3.4,2.3);c.fill();ell(c,-sw*3,4.6,3.4,2.3);c.fill();
  // cloak tail
  const sway=Math.sin(G.time*5+w.ph)*1.6;
  c.fillStyle='#4a3a82';c.beginPath();c.moveTo(1,-8);c.quadraticCurveTo(-13,-8+sway,-15,0+sway*.5);c.quadraticCurveTo(-13,8-sway,1,8);c.closePath();c.fill();
  c.fillStyle='#8f7bd0';c.beginPath();c.moveTo(-1,-3);c.quadraticCurveTo(-9,-2,-12,sway*.4);c.quadraticCurveTo(-9,2,-1,3);c.closePath();c.fill();
  // torso
  const g=c.createRadialGradient(-1,-2,1,0,0,10);g.addColorStop(0,'#8a73cf');g.addColorStop(1,'#5a4698');
  c.fillStyle=g;ell(c,0,0,7.2,9);c.fill();
  c.strokeStyle='rgba(20,10,40,.5)';c.lineWidth=1;c.stroke();
  // belt and satchel
  c.fillStyle='#3a2a1a';c.fillRect(-2,-8.2,3,2.4);
  // arms + hands
  c.fillStyle='#4a3a82';ell(c,2.5,-8,4,2.6,.3);c.fill();ell(c,2.5,8,4,2.6,-.3);c.fill();
  c.fillStyle='#e8c8a8';circ(c,6.4,-8.6,1.8);c.fill();circ(c,6.4,8.6,1.8);c.fill();
  // dagger at hip
  c.strokeStyle='#d8dce8';c.lineWidth=1.4;c.beginPath();c.moveTo(4,9.8);c.lineTo(9,11.5);c.stroke();
  // hood + head
  c.fillStyle='#2f2352';circ(c,2,0,5.8);c.fill();
  c.fillStyle='#e8c8a8';circ(c,5.2,0,3.2);c.fill();
  c.fillStyle='#3a2a1a';c.fillRect(6.3,-2,1.2,1.3);c.fillRect(6.3,.8,1.2,1.3);
  // scarf
  c.fillStyle='#d9534f';c.beginPath();c.moveTo(-1,-5.5);c.quadraticCurveTo(1,-7,3,-5);c.lineTo(3,5);c.quadraticCurveTo(1,7,-1,5.5);c.closePath();c.fill();
  c.fillStyle='#d9534f';c.beginPath();c.moveTo(-1,4);c.quadraticCurveTo(-8,6+sway,-12,3+sway);c.lineTo(-11,5+sway);c.quadraticCurveTo(-7,9,-1,6);c.closePath();c.fill();
  c.restore();
}
function drawAsh(a,active){
  const c=ctx,t=G.time,fl=G.flight,moving=a.sd!==undefined&&a.ph!==a._lph;
  a._lph=a.ph;
  const sc=fl?1.4:1,hover=fl?Math.sin(t*3)*2:0;
  shadowAt(a.x+(fl?7:0),a.y+(fl?14:5),fl?13:11,fl?6:5.5,fl?.25:.38);
  c.save();c.translate(a.x,a.y+hover);c.rotate(a.face);c.scale(sc,sc);
  const flap=Math.sin(t*(fl||G.dash.t>0?15:(moving?11:4)))*(fl?5:3);
  // tail
  c.strokeStyle='#c24a18';c.lineWidth=5;c.lineCap='round';
  c.beginPath();c.moveTo(-6,0);c.bezierCurveTo(-12,Math.sin(t*4)*4,-16,-Math.sin(t*4)*5,-22,Math.sin(t*4+1)*4);c.stroke();
  c.strokeStyle='#e8651f';c.lineWidth=2.6;c.stroke();
  c.fillStyle='#ffd27a';c.beginPath();c.moveTo(-22,Math.sin(t*4+1)*4);c.lineTo(-27,Math.sin(t*4+1)*4-3);c.lineTo(-27,Math.sin(t*4+1)*4+3);c.fill();
  c.lineCap='butt';
  // wings
  for(const s of[-1,1]){
    c.fillStyle='#a8401a';c.beginPath();c.moveTo(0,s*4);c.lineTo(-4,s*(11+flap));c.lineTo(-11,s*(9+flap*.7));c.lineTo(-8,s*4);c.closePath();c.fill();
    c.strokeStyle='#ff9a4a';c.lineWidth=1;c.beginPath();c.moveTo(0,s*4);c.lineTo(-4,s*(11+flap));c.moveTo(-1,s*5);c.lineTo(-11,s*(9+flap*.7));c.stroke();
  }
  // back spikes
  c.fillStyle='#ffd27a';for(let i=0;i<4;i++){const x=-2-i*3;c.beginPath();c.moveTo(x,-1.2);c.lineTo(x-2,0);c.lineTo(x,1.2);c.fill();}
  // body
  const g=c.createRadialGradient(-1,-3,1,0,0,10);g.addColorStop(0,'#ff9a50');g.addColorStop(1,'#d9531e');
  c.fillStyle=g;ell(c,1,0,9,7);c.fill();
  c.fillStyle='rgba(255,220,150,.75)';ell(c,2,0,5.2,3.6);c.fill();
  // legs
  const sw=Math.sin(a.ph);c.fillStyle='#b8401a';ell(c,3+sw*2,-6.5,2.6,1.8);c.fill();ell(c,3-sw*2,6.5,2.6,1.8);c.fill();
  // head
  c.fillStyle='#ff7a2f';ell(c,9,0,5.6,4.8);c.fill();
  c.fillStyle='#ffa050';ell(c,13.2,0,3.4,2.8);c.fill();
  c.fillStyle='#6a2a10';circ(c,15.4,-1,.7);c.fill();circ(c,15.4,1,.7);c.fill();
  c.fillStyle='#ffe0a0';c.beginPath();c.moveTo(6,-3);c.lineTo(1.5,-6.5);c.lineTo(8,-4.2);c.fill();c.beginPath();c.moveTo(6,3);c.lineTo(1.5,6.5);c.lineTo(8,4.2);c.fill();
  c.fillStyle='#fff4a0';circ(c,10.4,-2.5,1.5);c.fill();circ(c,10.4,2.5,1.5);c.fill();
  c.fillStyle='#2a1008';circ(c,10.7,-2.5,.75);c.fill();circ(c,10.7,2.5,.75);c.fill();
  if(G.fireOn&&active){c.fillStyle='rgba(255,220,120,.9)';circ(c,15.5,0,3);c.fill();}
  c.restore();
}
function drawGuard(g){
  const c=ctx,t=G.time,th=G.d.th,stun=g.stun>0,col=stun?'#7a7a84':th.guard,trim=stun?'#a0a0a8':th.trim;
  if(G.flight&&!g.spin){ // patrol boat
    shadowAt(g.x+3,g.y+8,19,8,.3);
    c.save();c.translate(g.x,g.y);c.rotate(g.face);
    c.fillStyle='#3a2a20';c.beginPath();c.moveTo(-20,-8);c.quadraticCurveTo(0,-11,22,0);c.quadraticCurveTo(0,11,-20,8);c.closePath();c.fill();
    c.fillStyle='#6a4a30';c.beginPath();c.moveTo(-17,-6);c.quadraticCurveTo(0,-8,17,0);c.quadraticCurveTo(0,8,-17,6);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.2)';c.fillRect(-14,-0.5,26,1);
    c.fillStyle=col;circ(c,-2,0,5);c.fill();c.fillStyle=trim;circ(c,-2,0,2);c.fill();
    c.fillStyle='#ffd27a';circ(c,12,0,2.6);c.fill();
    c.restore();
    c.strokeStyle='rgba(220,245,255,.35)';c.lineWidth=1.4;c.beginPath();c.arc(g.x,g.y,22+Math.sin(t*3+g.ph)*2,0,6.28);c.stroke();
    return;
  }
  if(g.spin){ // searchlight tower
    shadowAt(g.x+2,g.y+4,15,9,.35);
    c.fillStyle='#2a3a42';circ(c,g.x,g.y,13);c.fill();
    c.fillStyle='#4a6068';circ(c,g.x,g.y,11);c.fill();
    c.strokeStyle='#8fb0b8';c.lineWidth=1.4;circ(c,g.x,g.y,11);c.stroke();
    c.save();c.translate(g.x,g.y);c.rotate(g.face);
    c.fillStyle='#1a2428';c.fillRect(-4,-5,13,10);c.fillStyle='#fff6c0';c.fillRect(8,-4,3,8);c.fillStyle='#ffe69a';circ(c,0,0,3);c.fill();
    c.restore();
    return;
  }
  const big=g.boss?1.7:g.kind==='brute'?1.3:1;
  const rad=10*big;
  if(g.kind==='hound'){
    shadowAt(g.x,g.y+4,12,5,.35);
    c.save();c.translate(g.x,g.y);c.rotate(g.face);
    const sw=Math.sin(g.ph*1.4);
    c.strokeStyle=stun?'#555':'#2e2822';c.lineWidth=2.6;c.lineCap='round';
    c.beginPath();c.moveTo(5,-3.5);c.lineTo(8+sw*3,-5.5);c.moveTo(5,3.5);c.lineTo(8-sw*3,5.5);c.moveTo(-6,-3.5);c.lineTo(-8-sw*3,-5.5);c.moveTo(-6,3.5);c.lineTo(-8+sw*3,5.5);c.stroke();
    c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(-15,Math.sin(t*10)*3,-17,Math.sin(t*10)*5);c.stroke();c.lineCap='butt';
    c.fillStyle=stun?'#6a6a70':'#5a4a3c';ell(c,0,0,10.5,5.2);c.fill();
    c.fillStyle=stun?'#80808a':'#7a6652';ell(c,-1,-1,6,2.6);c.fill();
    c.fillStyle=stun?'#6a6a70':'#5a4a3c';ell(c,10,0,4.6,3.8);c.fill();
    c.fillStyle='#3a2e24';ell(c,14,0,2.8,2);c.fill();
    c.fillStyle='#1a1410';circ(c,16,0,1);c.fill();
    c.fillStyle='#2e2822';ell(c,8,-3.6,2,1.4,-.4);c.fill();ell(c,8,3.6,2,1.4,.4);c.fill();
    c.fillStyle=stun?'#999':'#ff6a4a';circ(c,11,-1.8,.9);c.fill();circ(c,11,1.8,.9);c.fill();
    c.fillStyle=trim;c.fillRect(5,-4.2,2,8.4);
    c.restore();
  } else {
    shadowAt(g.x,g.y+4,rad*1.05,rad*.55,.38);
    c.save();c.translate(g.x,g.y);c.rotate(g.face);if(big!==1)c.scale(big,big);
    const sw=Math.sin(g.ph*1.3);
    c.fillStyle=stun?'#3a3a44':'#201a1c';ell(c,sw*3.4,-4.4,3.4,2.3);c.fill();ell(c,-sw*3.4,4.4,3.4,2.3);c.fill();
    if(g.kind==='archer'||(g.boss&&g.kind==='candle')){ // cloak
      c.fillStyle=stun?'#555':sh(col,.7);c.beginPath();c.moveTo(1,-8);c.quadraticCurveTo(-12,-8,-13,0);c.quadraticCurveTo(-12,8,1,8);c.closePath();c.fill();}
    // spear (not archers/bosses)
    if(!g.boss&&g.kind!=='archer'){
      c.strokeStyle='#9a8a70';c.lineWidth=1.6;c.beginPath();c.moveTo(-8,9.5);c.lineTo(g.kind==='brute'?15:22,9.5);c.stroke();
      c.fillStyle='#dde2ee';c.beginPath();c.moveTo(g.kind==='brute'?15:22,7.8);c.lineTo((g.kind==='brute'?15:22)+6,9.5);c.lineTo(g.kind==='brute'?15:22,11.2);c.fill();
    }
    if(g.kind==='archer'){ // bow
      c.strokeStyle='#8a5a30';c.lineWidth=1.8;c.beginPath();c.arc(6,-9,9,-1.1,1.1);c.stroke();
      c.strokeStyle='rgba(240,240,230,.7)';c.lineWidth=.7;c.beginPath();c.moveTo(6+9*Math.cos(-1.1),-9+9*Math.sin(-1.1));c.lineTo(6+9*Math.cos(1.1),-9+9*Math.sin(1.1));c.stroke();
    }
    // torso armor
    const gr=c.createRadialGradient(-1,-2,1,0,0,11);gr.addColorStop(0,stun?'#9a9aa4':sh(col,1.25));gr.addColorStop(1,stun?'#55555e':sh(col,.7));
    c.fillStyle=gr;ell(c,0,0,7.6,9.4);c.fill();
    c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;c.stroke();
    c.fillStyle=trim;c.fillRect(-1,-8,2,16);
    // pauldrons
    c.fillStyle=stun?'#80808a':sh(col,1.15);circ(c,0,-9,4.2);c.fill();circ(c,0,9,4.2);c.fill();
    c.strokeStyle='rgba(0,0,0,.4)';circ(c,0,-9,4.2);c.stroke();circ(c,0,9,4.2);c.stroke();
    // hands
    c.fillStyle='#3a2a20';circ(c,7,9.5,1.8);c.fill();
    // helmet
    c.fillStyle=stun?'#8a8a94':'#9aa0b0';circ(c,1,0,5.6);c.fill();
    c.strokeStyle='rgba(0,0,0,.5)';circ(c,1,0,5.6);c.stroke();
    c.fillStyle=trim;c.fillRect(-4,-1,10,2);
    c.fillStyle='#14101a';c.fillRect(4,-2.6,2,5.2);
    if(g.kind==='brute'||g.boss&&g.kind!=='candle'){ // shield / bell guard
      if(g.kind==='brute'){
        c.fillStyle=g.hurt>0?'#fff':'#a8afc0';c.beginPath();c.arc(4,0,15,-1.0,1.0);c.arc(4,0,10,1.0,-1.0,true);c.closePath();c.fill();
        c.strokeStyle=trim;c.lineWidth=1.6;c.beginPath();c.arc(4,0,15,-1.0,1.0);c.stroke();
        c.fillStyle='#585e70';circ(c,18.6,0,2);c.fill();
      }
    }
    c.restore();
  }
  if(g.kind==='hound')c.globalAlpha=1;
}
function drawBoss(g){
  const c=ctx,t=G.time;
  if(g.kind==='candle'){
    const dead=g.dead;
    shadowAt(g.x,g.y+6,20,10,.4);
    c.save();c.translate(g.x,g.y);c.rotate(g.face);
    const hurt=g.hurt>0;
    c.fillStyle=hurt?'#ffd0d0':'#1c1424';c.beginPath();c.moveTo(2,-14);c.quadraticCurveTo(-22,-14,-26,0);c.quadraticCurveTo(-22,14,2,14);c.closePath();c.fill();
    c.fillStyle=hurt?'#fff':'#2e2040';ell(c,0,0,11,14);c.fill();
    c.strokeStyle='#d9a441';c.lineWidth=1.6;ell(c,0,0,11,14);c.stroke();
    c.fillStyle='#d9a441';c.fillRect(-1,-14,2,28);
    c.fillStyle='#2e2040';ell(c,3,-14,5,3);c.fill();ell(c,3,14,5,3);c.fill();
    // mask + candle crown
    c.fillStyle='#ece4d0';circ(c,3,0,7.4);c.fill();
    c.fillStyle='#14101a';c.fillRect(6,-4,2.2,2.4);c.fillRect(6,1.6,2.2,2.4);c.fillRect(8.5,-.6,1.6,1.4);
    if(!dead)for(let i=0;i<6;i++){
      const a=i/6*6.283+t*.6,cx=3+Math.cos(a)*10,cy=Math.sin(a)*10;
      c.fillStyle='#e8e0c0';c.fillRect(cx-1,cy-1,2,3);
      c.fillStyle='#ffb040';c.beginPath();c.moveTo(cx,cy-5-Math.sin(t*12+i)*1);c.lineTo(cx+1.7,cy-1);c.lineTo(cx-1.7,cy-1);c.fill();
    }
    c.restore();
    if(!dead&&g.hp>0)return;
    return;
  }
  // Bell-Warden
  const toll=g.toll>0?Math.sin((1-g.toll/.9)*Math.PI)*3:0;
  shadowAt(g.x,g.y+9,26,12,.42);
  c.save();c.translate(g.x,g.y);c.rotate(g.face);
  const hurt=g.hurt>0;
  c.fillStyle=g.dead?'#443a50':'#2a2038';c.beginPath();c.moveTo(-6,-20);c.quadraticCurveTo(-26,-14,-26,0);c.quadraticCurveTo(-26,14,-6,20);c.closePath();c.fill();
  const gr=c.createRadialGradient(-1,-3,2,0,0,22);gr.addColorStop(0,hurt?'#ffd0d0':'#8a5ab8');gr.addColorStop(1,hurt?'#e08080':'#3a2458');
  c.fillStyle=gr;ell(c,0,0,15,19);c.fill();
  c.strokeStyle='#e0b040';c.lineWidth=2.6;ell(c,0,0,15,19);c.stroke();
  // bell on the back
  const bx=-10,r1=11+toll;
  c.fillStyle='#8a6a20';circ(c,bx,0,r1+1.5);c.fill();
  const bg=c.createRadialGradient(bx-3,-3,1,bx,0,r1);bg.addColorStop(0,'#fff0a0');bg.addColorStop(1,'#b88a28');
  c.fillStyle=bg;circ(c,bx,0,r1);c.fill();
  c.strokeStyle='#6a4a10';c.lineWidth=1;circ(c,bx,0,r1*.62);c.stroke();circ(c,bx,0,r1*.3);c.stroke();
  c.fillStyle='#3a2a10';circ(c,bx,0,2);c.fill();
  // arms and hammer
  c.fillStyle='#3a2a50';ell(c,6,-17,6,3);c.fill();ell(c,6,17,6,3);c.fill();
  c.strokeStyle='#9a8a70';c.lineWidth=2.4;c.beginPath();c.moveTo(4,17);c.lineTo(26,17);c.stroke();
  c.fillStyle='#6a6a78';c.fillRect(24,12,8,10);
  // helm
  c.fillStyle='#4a4058';circ(c,6,0,8);c.fill();c.strokeStyle='#e0b040';c.lineWidth=1.8;circ(c,6,0,8);c.stroke();
  c.fillStyle='#e8e0c8';c.fillRect(11,-2.4,3,5);c.fillStyle='#14101a';c.fillRect(11,-.6,3,1.2);
  c.restore();
}
function drawHost(h){
  const c=ctx;
  shadowAt(h.x,h.y+4,9,5,.35);
  c.save();c.translate(h.x,h.y);c.rotate(h.face);
  const sw=Math.sin(h.ph||0);
  c.fillStyle='#202840';ell(c,sw*3,-4.2,3,2.1);c.fill();ell(c,-sw*3,4.2,3,2.1);c.fill();
  c.fillStyle='#2a8ab8';c.beginPath();c.moveTo(1,-7.5);c.quadraticCurveTo(-11,-7,-12,0);c.quadraticCurveTo(-11,7,1,7.5);c.closePath();c.fill();
  const gr=c.createRadialGradient(-1,-2,1,0,0,9);gr.addColorStop(0,'#9fe0ff');gr.addColorStop(1,'#4aa0d0');
  c.fillStyle=gr;ell(c,0,0,6.6,8);c.fill();
  c.fillStyle='#e8d090';c.fillRect(-1,-7.4,2,14.8);
  c.fillStyle='#f0d0b0';circ(c,2,0,4.6);c.fill();
  c.fillStyle='#6a4a2a';c.beginPath();c.arc(1,0,4.8,1.6,4.7);c.fill();
  c.fillStyle='#2a1a10';c.fillRect(4.5,-1.8,1.1,1.2);c.fillRect(4.5,.8,1.1,1.2);
  c.strokeStyle='#8a8a98';c.lineWidth=1.4;c.beginPath();c.moveTo(3,-7);c.lineTo(8,-6);c.moveTo(3,7);c.lineTo(8,6);c.stroke();
  c.restore();
}
function drawGuest(s){
  const c=ctx,t=G.time;
  shadowAt(s.x,s.y+4,9,5,.3);
  c.save();c.translate(s.x,s.y);
  c.rotate(Math.sin(t*.8+s.ph)*.4);
  c.fillStyle=s.c;ell(c,0,0,8,9.5);c.fill();
  c.fillStyle='rgba(255,255,255,.2)';ell(c,-2,-2,4,4);c.fill();
  c.strokeStyle='rgba(0,0,0,.35)';ell(c,0,0,8,9.5);c.stroke();
  c.fillStyle='#f0d8c0';circ(c,0,0,4.4);c.fill();
  c.fillStyle=sh(s.c,.5);c.fillRect(-4.4,-2.2,8.8,2.6);
  c.fillStyle='#fff';c.fillRect(-2.6,-1.6,1.2,1);c.fillRect(1.4,-1.6,1.2,1);
  for(let i=0;i<3;i++){c.fillStyle=['#fff','#ffd27a','#c8b4ff'][i];c.beginPath();c.moveTo(-2+i*2,-4.4);c.lineTo(-3+i*3,-9);c.lineTo(-1+i*2,-4.4);c.fill();}
  c.restore();
}
function drawMarkers(g){
  const c=ctx;
  if(g.stun>0&&!g.dead){
    const t=G.time;
    for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';c.beginPath();const sx=g.x+Math.cos(a)*9,sy=g.y-17+Math.sin(a)*3.5;
      c.moveTo(sx,sy-3);c.lineTo(sx+1.2,sy-1);c.lineTo(sx+3,sy);c.lineTo(sx+1.2,sy+1);c.lineTo(sx,sy+3);c.lineTo(sx-1.2,sy+1);c.lineTo(sx-3,sy);c.lineTo(sx-1.2,sy-1);c.fill();}
    return;
  }
  if(g.spin)return;
  if(g.bang>0||g.seeing){
    const k=g.bang>0?1-g.bang:1,by=-26-Math.sin(Math.min(1,k*3)*Math.PI)*5;
    c.save();c.translate(g.x,g.y+by);
    c.fillStyle='#e03030';c.strokeStyle='#fff';c.lineWidth=2;rr(c,-6,-9,12,18,4);c.fill();c.stroke();
    c.fillStyle='#fff';c.font='bold 13px '+BODY;c.textAlign='center';c.fillText('!',0,5);c.textAlign='left';c.restore();
  } else if(g.quest>0||g.lure){
    c.save();c.translate(g.x,g.y-26);
    c.fillStyle='#e6b840';c.strokeStyle='#fff';c.lineWidth=2;rr(c,-6,-9,12,18,4);c.fill();c.stroke();
    c.fillStyle='#3a2a10';c.font='bold 13px '+BODY;c.textAlign='center';c.fillText('?',0,5);c.textAlign='left';c.restore();
  }
}
function visPoly(g,range,half){
  const pts=[[g.x,g.y]];
  for(let i=0;i<=20;i++){
    const a=g.face-half+half*2*i/20;let r=0;
    for(;r<range;r+=6)if(solidTile(Math.floor((g.x+Math.cos(a)*r)/T),Math.floor((g.y+Math.sin(a)*r)/T)))break;
    pts.push([g.x+Math.cos(a)*r,g.y+Math.sin(a)*r]);
  }
  return pts;
}
function drawCones(){
  const c=ctx;
  for(const g of G.guards){
    if(g.stun>0||g.dead)continue;
    const range=5.2*T*G.rangeMul*(g.rm||1)*(g.kr||1);
    const pts=visPoly(g,range,g.half||.62);
    const seeing=g.seeing;
    const gr=c.createRadialGradient(g.x,g.y,4,g.x,g.y,range);
    if(seeing){gr.addColorStop(0,'rgba(255,60,50,.42)');gr.addColorStop(1,'rgba(255,60,50,.10)');}
    else if(g.lure||g.ret){gr.addColorStop(0,'rgba(255,200,80,.30)');gr.addColorStop(1,'rgba(255,200,80,.06)');}
    else{gr.addColorStop(0,'rgba(255,238,140,.27)');gr.addColorStop(1,'rgba(255,238,140,.05)');}
    c.fillStyle=gr;c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill();
    c.strokeStyle=seeing?'rgba(255,90,80,.5)':'rgba(255,240,170,.22)';c.lineWidth=1;c.stroke();
    if(g.kind==='hound'){ // scent radius
      c.strokeStyle='rgba(255,150,80,.2)';c.setLineDash([3,4]);circ(c,g.x,g.y,2.5*T*G.rangeMul);c.stroke();c.setLineDash([]);
    }
  }
  // searchlight beams
}
