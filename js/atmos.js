'use strict';
/* EMBERCROWN - atmosphere: baked floor and wall character per house, plus a light animated haze overlay.
   Baked work runs once per level (called from bakeStatic); the overlay is a few dozen cheap draws per frame. */
const ATM={
  marrow:{mist:'120,105,178',mm:.075,sp:5,lite:'190,190,230',moon:'150,170,255',moonA:.05},
  grell:{mist:'255,190,120',mm:.05,sp:3,lite:'255,220,170',dust:'255,225,160'},
  ostrander:{mist:'150,225,235',mm:.06,sp:6,lite:'200,240,250',sea:true},
  sable:{mist:'110,125,210',mm:.07,sp:2.5,lite:'180,190,240',moon:'140,160,255',moonA:.04,dust:'200,210,255'},
  kest:{mist:'255,110,50',mm:.045,sp:4,lite:'255,180,120',heat:true,add:true},
  dunmoor:{mist:'150,185,225',mm:.08,sp:4,lite:'200,220,250',dust:'200,230,255'},
  hallow:{mist:'255,190,100',mm:.05,sp:2,lite:'255,225,160',rays:'255,205,120',dust:'255,215,140',add:true}
};
function vnoise(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const h=(a,b)=>{let n=Math.imul(a*374761393+b*668265263+s*1274126177|0,1274126177);n=Math.imul(n^(n>>>13),1103515245);return((n^(n>>>16))>>>0)/4294967296;};
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return(h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v;
}
function atmCrack(c,x,y,len,col,r,glow){
  let a=r()*6.283,px=x,py=y;
  c.beginPath();c.moveTo(px,py);
  const pts=[[px,py]];
  for(let i=0;i<5;i++){a+=(r()-.5)*1.3;px+=Math.cos(a)*len/5;py+=Math.sin(a)*len/5;c.lineTo(px,py);pts.push([px,py]);}
  c.strokeStyle=col;c.lineWidth=1;c.stroke();
  if(glow){c.strokeStyle=glow;c.lineWidth=2.6;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const p of pts)c.lineTo(p[0],p[1]);c.stroke();}
}
function bakeDetail(c,th,ruin){
  const gw=G.gw,gh=G.gh,sig=G.d.sigil,A=ATM[sig];if(!A||G.flight)return;
  const r=mulberry(9100+lvl*57+(ruin?3:0)),seed=lvl*7+(ruin?1:0)+3;
  c.save();
  // broad tonal drift so large rooms never read as one repeated carpet of tiles
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    if(isW(x,y))continue;
    const n=vnoise(x/4.2,y/4.2,seed),m=vnoise(x/1.5,y/1.5,seed+9),a=(n-.5)*.34+(m-.5)*.07;
    c.fillStyle=a>0?'rgba('+A.lite+','+(a*.5).toFixed(3)+')':'rgba(0,0,0,'+(-a*1.1).toFixed(3)+')';
    c.fillRect(x*T,y*T,T,T);
  }
  // scattered marks by house
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    if(isW(x,y)||r()>.11)continue;
    const px=x*T+4+r()*(T-8),py=y*T+4+r()*(T-8),k=r();
    if(sig==='marrow'){
      if(k<.3){c.fillStyle='rgba(0,0,0,.22)';ell(c,px,py,7+r()*5,2.2+r()*2,r()*3);c.fill();}
      else if(k<.55)atmCrack(c,px,py,12+r()*10,'rgba(0,0,0,.5)',r);
      else if(k<.8){c.fillStyle='rgba(20,28,60,.45)';ell(c,px,py,6+r()*3,4+r()*2,r());c.fill();c.strokeStyle='rgba(150,170,230,.22)';c.lineWidth=.9;c.beginPath();c.arc(px,py,4,3.6,5.2);c.stroke();}
      else{c.fillStyle='rgba(255,140,60,.55)';for(let i=0;i<3;i++){c.fillRect(px+r()*8,py+r()*8,1.3,1.3);}}
    } else if(sig==='grell'){
      if(k<.3){c.fillStyle='rgba(90,16,24,.38)';ell(c,px,py,4+r()*4,3+r()*3,r());c.fill();for(let i=0;i<3;i++){circ(c,px+(r()-.5)*14,py+(r()-.5)*14,.9);c.fill();}}
      else if(k<.6){c.fillStyle='rgba(255,220,170,.10)';c.fillRect(px-9,py,18+r()*10,1.8);}
      else if(k<.85){c.fillStyle='rgba(250,235,200,.55)';circ(c,px,py,1.4);c.fill();circ(c,px+3,py+1,.9);c.fill();}
      else{c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.8;c.beginPath();c.moveTo(px-5,py);c.lineTo(px+6,py+(r()-.5)*3);c.stroke();}
    } else if(sig==='sable'){
      if(k<.35){c.fillStyle='rgba(200,205,255,.08)';ell(c,px,py,9+r()*6,5+r()*3,r()*3);c.fill();}
      else if(k<.6)atmCrack(c,px,py,10+r()*10,'rgba(0,0,0,.45)',r);
      else if(k<.8){c.fillStyle='rgba(30,70,50,.30)';ell(c,px,py,4+r()*4,3+r()*2,r());c.fill();}
      else{c.save();c.translate(px,py);c.rotate(r()*3);c.fillStyle='rgba(235,225,190,.5)';c.fillRect(-3,-2,6,4);c.fillStyle='rgba(70,50,30,.5)';c.fillRect(-2,-1,3,.8);c.fillRect(-2,.6,4,.8);c.restore();}
    } else if(sig==='kest'){
      if(k<.35)atmCrack(c,px,py,14+r()*14,'rgba(20,6,2,.8)',r,'rgba(255,110,30,.5)');
      else if(k<.6){c.fillStyle='rgba(0,0,0,.34)';ell(c,px,py,6+r()*5,4+r()*3,r()*3);c.fill();}
      else if(k<.82){c.fillStyle='rgba(15,8,6,.6)';for(let i=0;i<5;i++)c.fillRect(px+r()*10-5,py+r()*8-4,1.6,1.4);}
      else{c.fillStyle='rgba(255,170,120,.10)';c.fillRect(px-8,py-3,16,6);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.8;c.strokeRect(px-8,py-3,16,6);}
    } else if(sig==='dunmoor'){
      if(k<.4){c.strokeStyle='rgba(255,255,255,.13)';c.lineWidth=.9;c.beginPath();c.moveTo(px-8,py+(r()-.5)*6);c.quadraticCurveTo(px,py+(r()-.5)*14,px+9,py+(r()-.5)*6);c.stroke();}
      else if(k<.62){c.fillStyle='rgba(30,50,90,.4)';ell(c,px,py,6+r()*4,3.6+r()*2,r());c.fill();c.strokeStyle='rgba(190,215,255,.25)';c.lineWidth=.9;c.beginPath();c.arc(px,py,3.4,3.7,5.3);c.stroke();}
      else if(k<.85){const pc=['rgba(255,170,190,.7)','rgba(190,200,255,.7)','rgba(255,230,160,.7)'];for(let i=0;i<4;i++){c.fillStyle=pc[(i+x)%3];ell(c,px+r()*10-5,py+r()*8-4,1.5,.9,r()*3);c.fill();}}
      else atmCrack(c,px,py,9+r()*8,'rgba(0,0,0,.38)',r);
    } else if(sig==='hallow'){
      if(k<.35){c.fillStyle='rgba(245,225,180,.5)';ell(c,px,py,4+r()*4,3+r()*3,r());c.fill();c.fillStyle='rgba(255,255,255,.35)';ell(c,px-1,py-1,1.6,1,0);c.fill();}
      else if(k<.6)atmCrack(c,px,py,14+r()*12,'rgba(0,0,0,.5)',r,ruin?'rgba(255,100,40,.25)':null);
      else if(k<.85){c.fillStyle='rgba(255,215,120,.7)';for(let i=0;i<4;i++)c.fillRect(px+r()*10-5,py+r()*8-4,1.2,1.2);}
      else{c.fillStyle='rgba(0,0,0,.2)';ell(c,px,py,8,3,r()*3);c.fill();}
    }
  }
  c.restore();
}
/* wall faces: damp at the base, streaks from above, per house */
function bakeWallDetail(c,th){
  const gw=G.gw,gh=G.gh,sig=G.d.sigil;if(G.flight||!ATM[sig])return;
  const r=mulberry(6600+lvl*41),cap=9;
  const st={marrow:'rgba(0,0,0,.2)',grell:'rgba(0,0,0,.13)',sable:'rgba(30,70,50,.22)',kest:'rgba(150,60,20,.22)',dunmoor:'rgba(40,90,60,.24)',hallow:'rgba(0,0,0,.2)'}[sig]||'rgba(0,0,0,.15)';
  for(let y=0;y<gh-1;y++)for(let x=0;x<gw;x++){
    if(G.grid[y][x]!=='#'||isW(x,y+1)||y+1>=gh)continue;
    const px=x*T,py=y*T;
    const g=c.createLinearGradient(0,py+T-9,0,py+T);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,sig==='dunmoor'||sig==='sable'?'rgba(20,50,40,.38)':'rgba(0,0,0,.3)');
    c.fillStyle=g;c.fillRect(px,py+T-9,T,9);
    if(r()<.3){const sx=px+3+r()*(T-6),sl=8+r()*13;c.fillStyle=st;c.fillRect(sx,py+cap,1.6+r()*2,sl);c.fillRect(sx-1,py+cap,4,1.6);}
    if(r()<.07)atmCrack(c,px+6+r()*20,py+cap+2,8+r()*8,'rgba(0,0,0,.4)',r);
    if(sig==='kest'&&r()<.12){c.fillStyle='rgba(255,120,40,.2)';c.fillRect(px+3,py+T-2.5,T-6,1.6);}
  }
}

/* ---------- animated haze ---------- */
function drawAtmos(){
  const c=ctx,t=G.time,A=ATM[G.d.sigil];
  if(!A||Q.tier>=3)return;
  const vr=viewRect(),n=Q.tier>=2?2:(V.coarse?3:5),ruin=G.state==='ruin';
  const mcol=ruin?'190,80,50':A.mist;
  // drifting mist banks
  const spr=softSprite('rgb('+mcol+')'),rad=Math.max(130,vr.w*.3);
  c.globalCompositeOperation=A.add&&!ruin?'lighter':'source-over';
  for(let i=0;i<n;i++){
    const ph=(i*.2371+t*A.sp*.0035)%1.25-.12;
    const x=vr.x+ph*vr.w,y=vr.y+vr.h*(.14+.72*((i*.381+.17)%1))+Math.sin(t*.23+i*2)*vr.h*.05;
    c.globalAlpha=A.mm*(ruin?1.3:1)*(.65+.35*Math.sin(t*.37+i*1.7))*(A.add?.8:1);
    c.drawImage(spr,x-rad,y-rad*.55,rad*2,rad*1.1);
  }
  c.globalAlpha=1;c.globalCompositeOperation='lighter';
  // slanted shafts of moon or sun
  const sh_=A.moon||A.rays;
  if(sh_&&Q.tier<2){
    const cnt=A.rays?3:2;
    for(let i=0;i<cnt;i++){
      const bx=vr.x+vr.w*((i+.5)/cnt+Math.sin(t*.07+i*2)*.05),w0=vr.w*.07,len=vr.h*1.15;
      const g=c.createLinearGradient(bx,vr.y,bx+len*.35,vr.y+len);
      g.addColorStop(0,'rgba('+sh_+','+((A.moonA||.05)*(.7+.3*Math.sin(t*.5+i*3)))+')');g.addColorStop(1,'rgba('+sh_+',0)');
      c.fillStyle=g;c.beginPath();c.moveTo(bx-w0,vr.y);c.lineTo(bx+w0,vr.y);c.lineTo(bx+w0*2+len*.35,vr.y+len);c.lineTo(bx+len*.35-w0,vr.y+len);c.closePath();c.fill();
    }
  }
  // motes hanging in window light
  if(G.beams&&Q.tier<2){
    let used=0;
    for(const b of G.beams){
      if(b.x<vr.x-80||b.x>vr.x+vr.w+80||b.y<vr.y-130||b.y>vr.y+vr.h)continue;
      if(++used>3)break;
      for(let k=0;k<4;k++){
        const v=(t*.04+k*.25+b.x*.011)%1,xl=b.x-9+v*75,xr=b.x+9+v*57,px=xl+(xr-xl)*((k*.37+b.x*.017+Math.sin(t*.6+k))%1+1)%1,py=b.y+v*122;
        c.fillStyle='rgba(215,225,255,'+(.55*Math.sin(v*3.14))+')';c.fillRect(px,py,1.6,1.6);
      }
    }
  }
  // heat shimmer rising from forge pipes
  if(A.heat&&Q.tier<2){
    const hs=softSprite('rgb(255,150,70)');let used=0;
    for(const tr of G.torches||[]){
      if(!tr.pipe||tr.x<vr.x-40||tr.x>vr.x+vr.w+40||tr.y<vr.y-40||tr.y>vr.y+vr.h+40)continue;
      if(++used>6)break;
      const u=(t*.35+tr.ph*.3)%1;c.globalAlpha=.16*Math.sin(u*3.14);
      const s=26+u*22;c.drawImage(hs,tr.x+Math.sin(t*2+tr.ph)*4-s,tr.y-6-u*40-s,s*2,s*2);
    }
    c.globalAlpha=1;
  }
  // sea glints
  if(A.sea){
    const m=Q.tier>=2?5:(V.coarse?9:15);
    for(let i=0;i<m;i++){
      const cyc=t*.5+i*.713,k=Math.floor(cyc),f=cyc-k;
      const hx_=Math.sin((k*12.9898+i*78.233))*43758.5453,hy_=Math.sin((k*39.346+i*11.135))*24634.6345;
      const x=vr.x+(hx_-Math.floor(hx_))*vr.w,y=vr.y+(hy_-Math.floor(hy_))*vr.h,tx=Math.floor(x/T),ty=Math.floor(y/T);
      if(tx<0||ty<0||tx>=G.gw||ty>=G.gh||G.grid[ty][tx]==='#')continue;
      const a=Math.sin(f*3.14);if(a<.1)continue;
      c.fillStyle='rgba(235,250,255,'+(a*.7)+')';c.fillRect(x-2.6,y-.4,5.2,.8);c.fillRect(x-.4,y-2.6,.8,5.2);
    }
  }
  // vaults breathe
  const V_=G.d.vault;
  if(V_&&Q.tier<2){const vs=vstyle();const sp2=softSprite('rgb('+vs.rune+')'),R=70+Math.sin(t*1.4)*6;c.globalAlpha=.12;c.drawImage(sp2,V_.center[0]*T+16-R,V_.center[1]*T+16-R,R*2,R*2);c.globalAlpha=1;}
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
}
(function(){
  const dp=drawPrompt;let warned=false;
  drawPrompt=function(){
    try{drawAtmos();}catch(e){if(!warned){warned=true;console.error('atmos',e);}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
    dp();
  };
})();
