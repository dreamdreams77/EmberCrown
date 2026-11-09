'use strict';
/* EMBERCROWN - furniture and set dressing: placement, art, foreground layer (arches, beams, chandeliers). */
const PROP_DEF={table:[2,1],longtable:[5,1],crate:[1,1],crates:[2,1],barrels:[1,1],bench:[2,1],statue:[1,1],anvil:[1,1],furnace:[2,1],
  bookcase:[2,1],altar:[1,1],sarcophagus:[2,1],cauldron:[1,1],coal:[1,1],throne:[1,1],
  cot:[2,1],weaponrack:[1,1],sacks:[1,1],treasure:[1,1],lectern:[1,1],vase:[1,1],pillarstub:[1,1],mirror:[1,1],toolrack:[2,1]};
const PROP_SETS={
  marrow:{crates:2,crate:2,barrels:2,table:2,bench:1,statue:1,cot:3,weaponrack:2,sacks:2,sarcophagus:1},
  grell:{table:3,bench:2,barrels:2,statue:2,treasure:3,vase:2,crates:1,sacks:1},
  sable:{bench:4,bookcase:3,lectern:3,statue:2,altar:1,vase:1},
  kest:{anvil:3,crates:2,coal:3,cauldron:1,furnace:1,toolrack:3,sacks:1},
  dunmoor:{table:3,statue:2,bench:2,vase:3,mirror:2,crate:1},
  hallow:{statue:2,pillarstub:4,sarcophagus:1,altar:1,crates:1,treasure:1}
};
const pkey=(x,y)=>x+y*256;
function propTile(tx,ty){return !!(G.pblock&&G.pblock.has(pkey(tx,ty)));}

/* ---------- placement ---------- */
function buildProps(g){
  g.props=[];g.pblock=new Set();g.pots=[];g.inspects=[];g.chand=[];
  const d=g.d;if(d.flight)return;
  const rnd=mulberry(9001+LEVELS.indexOf(d)*37);
  const gw=g.gw,gh=g.gh,keep=new Set();
  const mark=(x,y,r)=>{x=Math.round(x);y=Math.round(y);for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)keep.add(pkey(x+i,y+j));};
  const seg=(a,b,r)=>{const n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))*2+1;for(let i=0;i<=n;i++)mark(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n,r);};
  const path=wp=>{if(wp.length===1)mark(wp[0][0],wp[0][1],1);for(let i=0;i<wp.length;i++)seg(wp[i],wp[(i+1)%wp.length],0);};
  d.guards.forEach(path);if(d.boss)path(d.boss.wp);
  if(d.timeshift){const r=d.timeshift.ruin;r.guards.forEach(path);d.timeshift.guests.forEach(s=>seg(s[0],s[1],1));
    for(const [x,y] of r.block.concat(r.open,r.openIfPlanted||[],r.vents||[]))mark(x,y,1);}
  for(const it of g.items)mark((it.x-16)/T,(it.y-16)/T,1);
  mark((g.exit.x-16)/T,(g.exit.y-16)/T,2);mark((g.wren.x-16)/T,(g.wren.y-16)/T,2);
  for(const k in g.doors)mark(g.doors[k].x,g.doors[k].y,1);
  for(const v of g.vents)mark(v.x,v.y,1);for(const p of g.peds)mark((p.x-16)/T,(p.y-16)/T,1);
  for(const k in g.cracks)mark(g.cracks[k].x,g.cracks[k].y,1);
  if(d.bellAt)mark(d.bellAt[0]-.5,d.bellAt[1]-.5,2);
  if(d.vault)for(const k of d.vault.keep||[])mark(k[0],k[1],k[2]||1);
  for(const n of d.inspect||[])mark(n[0],n[1],1);
  const isFree=(x,y)=>x>=0&&y>=0&&x<gw&&y<gh&&g.grid[y][x]==='.';
  const solid=(x,y)=>!isFree(x,y)||g.pblock.has(pkey(x,y));
  const reach=()=>{ // flood from the start, return reachable count
    const sx=Math.round((g.wren.x-16)/T),sy=Math.round((g.wren.y-16)/T),seen=new Set([pkey(sx,sy)]),q=[[sx,sy]];
    while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=pkey(nx,ny);
      if(!solid(nx,ny)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
    return seen.size;};
  let floorN=0;for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(g.grid[y][x]==='.')floorN++;
  const open8=(x,y)=>{let n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if((i||j)&&!solid(x+i,y+j))n++;return n;};
  const wallAdj=(x,y)=>{let n=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=gw||ny>=gh||g.grid[ny][nx]==='#'||g.grid[ny][nx]===' ')n++;}return n;};
  const place=(type,x,y,w,h,opt,force)=>{
    const tiles=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)tiles.push([x+i,y+j]);
    for(const [tx,ty] of tiles){if(solid(tx,ty))return false;if(!force&&(keep.has(pkey(tx,ty))||open8(tx,ty)<5))return false;}
    if(!force){let hug=false;for(const [tx,ty] of tiles)if(wallAdj(tx,ty))hug=true;if(!hug&&type!=='statue'&&type!=='altar')return false;
      for(const [tx,ty] of tiles)for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(g.pblock.has(pkey(tx+i,ty+j))&&type!=='crate'&&type!=='crates')return false;}
    const before=reach();
    tiles.forEach(([tx,ty])=>g.pblock.add(pkey(tx,ty)));
    if(reach()!==before-tiles.length){tiles.forEach(([tx,ty])=>g.pblock.delete(pkey(tx,ty)));return false;}
    g.props.push(Object.assign({type,x,y,w,h,seed:Math.floor(rnd()*1e6)},opt||{}));return true;
  };
  g.placeProp=place;
  for(const s of d.set||[]){const def=PROP_DEF[s[2]]||[1,1];place(s[2],s[0],s[1],s[3]||def[0],s[4]||def[1],s[5],true);}
  const weights=PROP_SETS[d.sigil]||{};const types=[];for(const k in weights)for(let i=0;i<weights[k];i++)types.push(k);
  if(types.length){
    const want=Math.round(floorN/13);let placed=0;
    for(let tries=0;tries<700&&placed<want;tries++){
      const type=types[Math.floor(rnd()*types.length)],def=PROP_DEF[type];
      let w=def[0],h=def[1];if(w!==h&&rnd()<.3){const t=w;w=h;h=t;}
      if(place(type,1+Math.floor(rnd()*(gw-2)),1+Math.floor(rnd()*(gh-2)),w,h))placed++;
    }
    // breakable pots hugging the walls
    const wantPots=Math.round(floorN/60)+2;let np=0;
    for(let tries=0;tries<500&&np<wantPots;tries++){
      const x=1+Math.floor(rnd()*(gw-2)),y=1+Math.floor(rnd()*(gh-2));
      if(!isFree(x,y)||solid(x,y)||keep.has(pkey(x,y))||!wallAdj(x,y)||open8(x,y)<4)continue;
      const before=reach();g.pblock.add(pkey(x,y));
      if(reach()!==before-1){g.pblock.delete(pkey(x,y));continue;}
      g.pots.push({x,y,hp:1,kind:rnd()<.5?'pot':'urn',seed:rnd(),hit:0});np++;
    }
  }
  g.propKeep=keep;
}

/* ---------- art ---------- */
function shadowRect(c,x,y,w,h,a){c.fillStyle='rgba(0,0,0,'+(a||.32)+')';rr(c,x+3,y+5,w,h,5);c.fill();}
function woodGrad(c,x,y,w,h,base){const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,sh(base,1.2));g.addColorStop(1,sh(base,.75));return g;}
function addLight(g,x,y,col,s){if(g.torches)g.torches.push({x,y,ph:Math.random()*6,col,s:s||.6,small:true});}

function drawPropBase(c,p,th,ruin){
  const px=p.x*T,py=p.y*T,W=p.w*T,H=p.h*T,rnd=mulberry(p.seed),g=G;
  const wood=th.wood||'#6a4a30',cloth=th.cloth||'#7a2a30';
  const tilt=ruin?(rnd()-.5)*.12:0;
  c.save();
  switch(p.type){
    case'table':case'longtable':{
      shadowRect(c,px+2,py+3,W-4,H-4,.34);
      c.save();c.translate(px+W/2,py+H/2);c.rotate(tilt);c.translate(-W/2,-H/2);
      c.fillStyle='#2a1a10';rr(c,3,5,W-6,H-9,4);c.fill();
      c.fillStyle=woodGrad(c,0,4,W,H-8,ruin?'#4a3a2a':wood);rr(c,3,4,W-6,H-10,4);c.fill();
      if(!ruin&&th.tablecloth){c.fillStyle=cloth;rr(c,6,7,W-12,H-16,3);c.fill();c.fillStyle='rgba(255,255,255,.14)';c.fillRect(8,8,W-16,1.5);
        c.fillStyle='#e0b040';c.fillRect(6,H-11,W-12,1.4);}
      c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;rr(c,3,4,W-6,H-10,4);c.stroke();
      for(let i=0;i<p.w*2-1;i++){const x=10+i*(W-20)/Math.max(1,p.w*2-2)+(rnd()-.5)*4;
        if(rnd()<.55&&!ruin){c.fillStyle=['#d9d0b8','#b3262c','#d9a441','#8aa8c8'][i%4];circ(c,x,H/2-2+(rnd()-.5)*4,2.6);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x-1,H/2-4,1.4,1.4);}
        else if(rnd()<.5){c.fillStyle='#d9a441';circ(c,x,H/2-2,2.1);c.fill();}}
      c.restore();
      if(!ruin&&p.w>=2){addLight(g,px+W*.25,py+9,'255,185,90',.5);c.fillStyle='#e8e0c0';c.fillRect(px+W*.25-1.4,py+9,2.8,6);}
      // front legs
      c.fillStyle='#1c120a';c.fillRect(px+5,py+H-7,4,6);c.fillRect(px+W-9,py+H-7,4,6);
      break;}
    case'crate':case'crates':{
      const n=p.type==='crate'?1:2;
      for(let i=0;i<n;i++){
        const s=n===1?24:(i?18:23),x=px+4+i*(n===1?0:T-4)+(n===1?0:(i?5:0)),y=py+(n===1?5:(i?9:4));
        c.fillStyle='rgba(0,0,0,.34)';rr(c,x+3,y+4,s,s,3);c.fill();
        c.save();c.translate(x+s/2,y+s/2);c.rotate((rnd()-.5)*.18+tilt);
        c.fillStyle=woodGrad(c,-s/2,-s/2,s,s,'#8a6038');rr(c,-s/2,-s/2,s,s,2.5);c.fill();
        c.strokeStyle='rgba(30,16,8,.8)';c.lineWidth=1.4;rr(c,-s/2,-s/2,s,s,2.5);c.stroke();
        c.beginPath();c.moveTo(-s/2,-s/2);c.lineTo(s/2,s/2);c.moveTo(s/2,-s/2);c.lineTo(-s/2,s/2);c.stroke();
        c.strokeStyle='rgba(255,220,170,.18)';c.beginPath();c.moveTo(-s/2+2,-s/2+1.5);c.lineTo(s/2-2,-s/2+1.5);c.stroke();
        c.fillStyle='#2e2a30';for(const [ox,oy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){circ(c,ox*(s/2-3),oy*(s/2-3),1.3);c.fill();}
        c.restore();
      }
      if(n===2){c.fillStyle='#b89a6a';ell(c,px+T+20,py+H-9,6,4);c.fill();c.fillStyle='rgba(0,0,0,.25)';ell(c,px+T+22,py+H-8,3,2);c.fill();}
      break;}
    case'barrels':{
      for(const [ox,oy,r] of[[12,12,10],[22,21,9]]){
        c.fillStyle='rgba(0,0,0,.34)';ell(c,px+ox+3,py+oy+5,r+1,r-1);c.fill();
        const gr=c.createRadialGradient(px+ox-3,py+oy-3,1,px+ox,py+oy,r);gr.addColorStop(0,'#a8783e');gr.addColorStop(1,'#5a3a1e');
        c.fillStyle=gr;circ(c,px+ox,py+oy,r);c.fill();
        c.strokeStyle='#2e2a30';c.lineWidth=2;circ(c,px+ox,py+oy,r-1.5);c.stroke();c.lineWidth=1;circ(c,px+ox,py+oy,r*.55);c.stroke();
        c.fillStyle=th.wine?'rgba(160,20,40,.6)':'rgba(0,0,0,.25)';circ(c,px+ox,py+oy,r*.35);c.fill();
      }
      break;}
    case'bench':{
      shadowRect(c,px+2,py+11,W-4,H-18,.3);
      c.fillStyle=woodGrad(c,px,py+9,W,12,ruin?'#4a3a2a':'#6a4428');rr(c,px+3,py+9,W-6,13,3);c.fill();
      c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;rr(c,px+3,py+9,W-6,13,3);c.stroke();
      c.fillStyle='rgba(255,220,170,.16)';c.fillRect(px+5,py+11,W-10,1.5);
      c.fillStyle='#1c120a';c.fillRect(px+6,py+21,3,5);c.fillRect(px+W-9,py+21,3,5);
      break;}
    case'statue':{
      const stone=th.stone||'#7a7684';
      c.fillStyle='rgba(0,0,0,.4)';ell(c,px+19,py+27,14,6);c.fill();
      c.fillStyle=woodGrad(c,px+5,py+14,22,15,stone);rr(c,px+5,py+13,22,16,3);c.fill();
      c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;rr(c,px+5,py+13,22,16,3);c.stroke();
      c.fillStyle=sh(stone,1.2);rr(c,px+8,py+4,16,12,5);c.fill();
      c.fillStyle=sh(stone,1.4);circ(c,px+16,py+4,5);c.fill();
      c.fillStyle='rgba(0,0,0,.3)';c.fillRect(px+13,py+3,2,2);c.fillRect(px+17,py+3,2,2);
      c.strokeStyle=sh(stone,.6);c.lineWidth=2;c.beginPath();c.moveTo(px+9,py+14);c.lineTo(px+9,py+24);c.stroke();
      if(th.statueGold){c.fillStyle='rgba(224,176,64,.35)';rr(c,px+8,py+4,16,12,5);c.fill();}
      if(ruin){c.strokeStyle='rgba(0,0,0,.6)';c.beginPath();c.moveTo(px+14,py+2);c.lineTo(px+17,py+10);c.lineTo(px+13,py+18);c.stroke();}
      break;}
    case'anvil':{
      c.fillStyle='rgba(0,0,0,.4)';ell(c,px+18,py+27,13,5);c.fill();
      c.fillStyle='#4a3020';rr(c,px+10,py+17,12,11,2);c.fill();
      c.fillStyle='#3a3a44';c.beginPath();c.moveTo(px+4,py+10);c.lineTo(px+28,py+10);c.lineTo(px+25,py+17);c.lineTo(px+7,py+17);c.closePath();c.fill();
      c.fillStyle='#5a5a68';c.fillRect(px+5,py+10,22,3);c.fillStyle='#2a2a32';c.fillRect(px+11,py+17,10,3);
      c.fillStyle='rgba(255,120,40,.85)';ell(c,px+16,py+11,5,1.8);c.fill();
      addLight(g,px+16,py+11,'255,120,40',.45);
      break;}
    case'furnace':{
      shadowRect(c,px+2,py+3,W-4,H-4,.4);
      c.fillStyle=woodGrad(c,px,py+2,W,H-4,'#4a3a38');rr(c,px+2,py+3,W-4,H-8,4);c.fill();
      c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1.4;rr(c,px+2,py+3,W-4,H-8,4);c.stroke();
      c.fillStyle='#120806';rr(c,px+W/2-14,py+10,28,14,5);c.fill();
      const gl=c.createLinearGradient(0,py+10,0,py+24);gl.addColorStop(0,'#ffe8a0');gl.addColorStop(.5,'#ff7a2a');gl.addColorStop(1,'#9a2a10');
      c.fillStyle=gl;rr(c,px+W/2-12,py+12,24,10,4);c.fill();
      c.fillStyle='#2a2028';c.fillRect(px+6,py+5,5,3);c.fillRect(px+W-11,py+5,5,3);
      addLight(g,px+W/2,py+17,'255,110,40',1);
      break;}
    case'bookcase':{
      shadowRect(c,px+2,py+4,W-4,H-6,.34);
      c.fillStyle=woodGrad(c,px,py+3,W,H-6,'#3a2418');rr(c,px+2,py+3,W-4,H-8,3);c.fill();
      c.fillStyle='#1a100a';c.fillRect(px+4,py+7,W-8,H-16);
      for(let i=0;i<p.w*7;i++){const x=px+5+i*((W-10)/(p.w*7));c.fillStyle=['#6a3a4a','#3a4a6a','#4a6a3a','#8a6a2a','#5a3a6a'][Math.floor(rnd()*5)];
        const hh=6+rnd()*5;c.fillRect(x,py+7+(H-16-hh),(W-10)/(p.w*7)-.8,hh);}
      c.strokeStyle='rgba(255,220,170,.2)';c.beginPath();c.moveTo(px+4,py+H-9);c.lineTo(px+W-4,py+H-9);c.stroke();
      break;}
    case'altar':{
      c.fillStyle='rgba(0,0,0,.4)';rr(c,px+6,py+10,24,18,3);c.fill();
      c.fillStyle=woodGrad(c,px+4,py+8,24,18,th.stone||'#6a6678');rr(c,px+4,py+7,24,19,3);c.fill();
      c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;rr(c,px+4,py+7,24,19,3);c.stroke();
      c.fillStyle=th.cloth||'#4a3a70';c.fillRect(px+7,py+12,18,10);c.fillStyle='#e0b040';c.fillRect(px+7,py+12,18,1.2);
      for(const ox of[9,23]){c.fillStyle='#e8e0c0';c.fillRect(px+ox-1.5,py+6,3,8);addLight(g,px+ox,py+5,'255,190,90',.5);}
      break;}
    case'sarcophagus':{
      shadowRect(c,px+2,py+5,W-4,H-9,.4);
      c.fillStyle=woodGrad(c,px,py+4,W,H-8,th.stone||'#6a6678');rr(c,px+3,py+4,W-6,H-9,6);c.fill();
      c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1.4;rr(c,px+3,py+4,W-6,H-9,6);c.stroke();
      c.strokeStyle='rgba(0,0,0,.28)';rr(c,px+8,py+8,W-16,H-17,4);c.stroke();
      c.fillStyle='rgba(0,0,0,.25)';ell(c,px+W*.3,py+H/2-1,5,5);c.fill();c.fillRect(px+W*.3+6,py+H/2-4,W*.4,6);
      if(ruin||rnd()<.5){c.strokeStyle='rgba(0,0,0,.65)';c.beginPath();c.moveTo(px+W*.6,py+4);c.lineTo(px+W*.65,py+12);c.lineTo(px+W*.58,py+H-6);c.stroke();}
      break;}
    case'cauldron':{
      c.fillStyle='rgba(0,0,0,.38)';ell(c,px+19,py+26,12,5);c.fill();
      c.fillStyle='#2a2a30';circ(c,px+16,py+16,12);c.fill();c.strokeStyle='#4a4a54';c.lineWidth=2;circ(c,px+16,py+16,11);c.stroke();
      const gr=c.createRadialGradient(px+16,py+16,1,px+16,py+16,9);gr.addColorStop(0,'#c8ff7a');gr.addColorStop(1,'#3a8a3a');
      c.fillStyle=gr;circ(c,px+16,py+16,8.5);c.fill();addLight(g,px+16,py+16,'140,255,110',.6);
      break;}
    case'coal':{
      c.fillStyle='rgba(0,0,0,.4)';ell(c,px+18,py+25,12,5);c.fill();
      for(let i=0;i<9;i++){c.fillStyle=sh('#2a2428',.7+rnd()*.7);const x=px+7+rnd()*18,y=px*0+py+8+rnd()*16;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+4+rnd()*3,y+1);c.lineTo(x+2,y+4+rnd()*3);c.closePath();c.fill();}
      c.fillStyle='rgba(255,100,30,.8)';for(let i=0;i<4;i++)c.fillRect(px+8+rnd()*16,py+10+rnd()*14,1.6,1.6);
      break;}
    case'throne':{
      c.fillStyle='rgba(0,0,0,.4)';ell(c,px+18,py+28,15,6);c.fill();
      c.fillStyle='#3a2a1a';rr(c,px+5,py+2,22,14,4);c.fill();c.fillStyle='#e0b040';rr(c,px+8,py+4,16,8,3);c.fill();
      c.fillStyle='#6a2a30';rr(c,px+7,py+14,18,12,3);c.fill();c.fillStyle='#e0b040';c.fillRect(px+7,py+14,18,1.5);
      break;}
  }
  c.restore();
}

function jitHex(h,m){const c=hx(h);const f=v=>Math.max(0,Math.min(255,Math.round(v*m)));return'#'+[f(c[0]),f(c[1]),f(c[2])].map(v=>v.toString(16).padStart(2,'0')).join('');}
function drawProp(c,p,th,ruin){
  const rnd=mulberry(p.seed+11),v=Math.floor(rnd()*100);
  const px=p.x*T,py=p.y*T,W=p.w*T,H=p.h*T,g=G;
  const th2=Object.assign({},th,{wood:jitHex(th.wood||'#6a4a30',.88+rnd()*.26),stone:jitHex(th.stone||'#7a7684',.9+rnd()*.2)});
  const tilt=ruin?(rnd()-.5)*.12:0;
  switch(p.type){
    case'crate':{
      const k=v%5;if(k===0)break;
      c.save();c.translate(px+16,py+17);c.rotate((rnd()-.5)*.25+tilt);
      c.fillStyle='rgba(0,0,0,.34)';rr(c,-11,-9,26,26,3);c.fill();
      const box=(x,y,s,rot)=>{c.save();c.translate(x,y);c.rotate(rot||0);c.fillStyle=woodGrad(c,-s/2,-s/2,s,s,'#8a6038');rr(c,-s/2,-s/2,s,s,2.5);c.fill();c.strokeStyle='rgba(30,16,8,.8)';c.lineWidth=1.4;rr(c,-s/2,-s/2,s,s,2.5);c.stroke();c.restore();};
      if(k===1){box(0,0,25);c.fillStyle='#2a1a0e';rr(c,-9,-9,18,18,2);c.fill();c.strokeStyle='#d8b84a';c.lineWidth=1.3;for(let i=0;i<9;i++){c.beginPath();c.moveTo(-8+rnd()*16,-8+rnd()*16);c.lineTo(-8+rnd()*16,-8+rnd()*16);c.stroke();}}
      else if(k===2){box(0,3,25);box(2,-8,16,.3);c.strokeStyle='rgba(30,16,8,.5)';c.beginPath();c.moveTo(-12,3);c.lineTo(12,3);c.stroke();}
      else if(k===3){box(0,0,24);c.fillStyle='#7a7e8a';c.beginPath();c.moveTo(-13,-6);c.lineTo(10,-13);c.lineTo(14,4);c.lineTo(2,13);c.lineTo(-12,9);c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.3)';c.beginPath();c.moveTo(-4,-8);c.lineTo(0,10);c.moveTo(5,-10);c.lineTo(7,8);c.stroke();}
      else{box(0,0,24);c.strokeStyle='#c8a868';c.lineWidth=2.2;c.beginPath();c.moveTo(-12,-4);c.lineTo(12,-4);c.moveTo(-12,5);c.lineTo(12,5);c.moveTo(-4,-12);c.lineTo(-4,12);c.stroke();c.fillStyle='#c8a868';circ(c,-4,-4,2);c.fill();}
      c.restore();return;}
    case'barrels':{
      const k=v%3;if(k===0)break;
      if(k===1){
        c.fillStyle='rgba(0,0,0,.36)';ell(c,px+19,py+21,15,12);c.fill();
        const gr=c.createRadialGradient(px+13,py+13,2,px+16,py+16,14);gr.addColorStop(0,'#b88848');gr.addColorStop(1,'#5a3a1e');c.fillStyle=gr;circ(c,px+16,py+16,13);c.fill();
        c.strokeStyle='#2e2a30';c.lineWidth=2.2;circ(c,px+16,py+16,12);c.stroke();circ(c,px+16,py+16,7);c.stroke();
        c.fillStyle='rgba(0,0,0,.28)';circ(c,px+16,py+16,4);c.fill();c.fillStyle='#9a9aa8';c.fillRect(px+15,py+27,3,4);
      } else {
        c.fillStyle='rgba(0,0,0,.34)';ell(c,px+17,py+25,14,5);c.fill();
        c.fillStyle=th.wine?'rgba(150,20,40,.5)':'rgba(40,60,80,.45)';ell(c,px+8,py+24,10,4);c.fill();
        c.save();c.translate(px+18,py+16);c.rotate(.2);
        const g2=c.createLinearGradient(0,-9,0,9);g2.addColorStop(0,'#a07040');g2.addColorStop(1,'#5a3a1e');c.fillStyle=g2;rr(c,-12,-9,24,18,6);c.fill();
        c.strokeStyle='#2e2a30';c.lineWidth=2;c.beginPath();c.moveTo(-5,-9);c.lineTo(-5,9);c.moveTo(5,-9);c.lineTo(5,9);c.stroke();
        c.fillStyle='#2a1a10';ell(c,-12,0,2.4,8);c.fill();c.restore();
      }
      return;}
    case'statue':{
      const k=v%3;if(k===0)break;
      const stone=th2.stone;
      c.fillStyle='rgba(0,0,0,.4)';ell(c,px+19,py+27,14,6);c.fill();
      c.fillStyle=woodGrad(c,px+5,py+16,22,13,stone);rr(c,px+5,py+15,22,14,3);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;rr(c,px+5,py+15,22,14,3);c.stroke();
      if(k===1){ // knight with raised sword and shield
        c.fillStyle=sh(stone,1.15);ell(c,px+16,py+9,10,6);c.fill();c.fillStyle=sh(stone,1.35);circ(c,px+16,py+7,4.4);c.fill();
        c.strokeStyle=sh(stone,1.5);c.lineWidth=2.4;c.beginPath();c.moveTo(px+24,py+12);c.lineTo(px+25,py-3);c.stroke();c.fillStyle=sh(stone,1.5);c.fillRect(px+22,py+10,6,2);
        c.fillStyle=sh(stone,.8);circ(c,px+8,py+11,4.6);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.stroke();
      } else { // winged gargoyle
        c.fillStyle=sh(stone,.9);c.beginPath();c.moveTo(px+16,py+8);c.lineTo(px+2,py+2);c.lineTo(px+7,py+13);c.closePath();c.fill();c.beginPath();c.moveTo(px+16,py+8);c.lineTo(px+30,py+2);c.lineTo(px+25,py+13);c.closePath();c.fill();
        c.fillStyle=sh(stone,1.25);ell(c,px+16,py+10,6,7);c.fill();c.fillStyle=sh(stone,1.4);circ(c,px+16,py+4,4);c.fill();
        c.fillStyle=sh(stone,1.1);c.beginPath();c.moveTo(px+13,py+1);c.lineTo(px+11,py-3);c.lineTo(px+15,py);c.fill();c.beginPath();c.moveTo(px+19,py+1);c.lineTo(px+21,py-3);c.lineTo(px+17,py);c.fill();
        c.fillStyle='rgba(255,170,60,.7)';c.fillRect(px+13.5,py+3,1.4,1.4);c.fillRect(px+17,py+3,1.4,1.4);
      }
      if(th.statueGold){c.fillStyle='rgba(224,176,64,.3)';rr(c,px+6,py+2,20,26,6);c.fill();}
      if(ruin){c.strokeStyle='rgba(0,0,0,.6)';c.beginPath();c.moveTo(px+14,py+2);c.lineTo(px+17,py+12);c.lineTo(px+13,py+24);c.stroke();}
      return;}
    case'table':case'longtable':{drawPropBase(c,Object.assign({},p),th2,ruin);
      if(!ruin&&p.type==='table'){ // a different object on each table
        const o=v%4;c.save();c.translate(px+W/2,py+13);
        if(o===1){c.fillStyle='#e8dcc0';c.rotate(-.15);rr(c,-9,-4,18,8,1.5);c.fill();c.strokeStyle='rgba(60,40,20,.5)';c.beginPath();c.moveTo(-6,-1);c.lineTo(5,-1);c.moveTo(-6,1.5);c.lineTo(3,1.5);c.stroke();}
        else if(o===2){c.fillStyle='#2a1a18';circ(c,-6,0,2.6);c.fill();c.fillStyle='#d9d0b8';circ(c,6,0,3.4);c.fill();c.fillStyle='rgba(0,0,0,.2)';circ(c,6,0,1.6);c.fill();}
        else if(o===3){c.fillStyle='#8a2a2a';rr(c,-7,-4,14,8,2);c.fill();c.fillStyle='#e0b040';c.fillRect(-1,-4,2,8);}
        c.restore();}
      return;}
    case'cot':{
      c.fillStyle='rgba(0,0,0,.3)';rr(c,px+5,py+10,W-8,17,4);c.fill();
      c.fillStyle='#3a2a1c';rr(c,px+3,py+7,W-6,18,3);c.fill();
      c.fillStyle='#7a8090';rr(c,px+8,py+9,W-14,14,3);c.fill();c.fillStyle='rgba(0,0,0,.18)';c.fillRect(px+W*.5,py+9,2,14);
      c.fillStyle='#d8d0c0';rr(c,px+5,py+10,10,12,3);c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;rr(c,px+3,py+7,W-6,18,3);c.stroke();
      return;}
    case'weaponrack':{
      c.fillStyle='rgba(0,0,0,.34)';ell(c,px+18,py+27,13,4);c.fill();
      c.fillStyle='#3a2616';c.fillRect(px+4,py+8,24,3);c.fillRect(px+4,py+22,24,3);c.fillRect(px+4,py+8,3,17);c.fillRect(px+25,py+8,3,17);
      c.strokeStyle='#cdd2de';c.lineWidth=1.8;for(let i=0;i<4;i++){c.beginPath();c.moveTo(px+9+i*5,py+4);c.lineTo(px+9+i*5,py+27);c.stroke();}
      c.fillStyle='#8a6a30';for(let i=0;i<4;i++)c.fillRect(px+8+i*5,py+20,2.4,3);
      return;}
    case'sacks':{
      for(const [ox,oy,r] of [[11,19,9],[22,17,8],[17,9,7]]){
        c.fillStyle='rgba(0,0,0,.3)';ell(c,px+ox+2,py+oy+5,r,r*.6);c.fill();
        const gr=c.createRadialGradient(px+ox-2,py+oy-3,1,px+ox,py+oy,r);gr.addColorStop(0,'#cdb68a');gr.addColorStop(1,'#8a7048');c.fillStyle=gr;circ(c,px+ox,py+oy,r);c.fill();
        c.strokeStyle='#6a5030';c.lineWidth=1.4;c.beginPath();c.moveTo(px+ox-3,py+oy-r*.5);c.lineTo(px+ox+3,py+oy-r*.5);c.stroke();
      }
      return;}
    case'treasure':{
      c.fillStyle='rgba(0,0,0,.3)';ell(c,px+17,py+25,13,5);c.fill();
      const gr=c.createRadialGradient(px+14,py+14,2,px+16,py+18,15);gr.addColorStop(0,'#ffe27a');gr.addColorStop(.6,'#d9a020');gr.addColorStop(1,'#7a5410');
      c.fillStyle=gr;ell(c,px+16,py+19,13,9);c.fill();
      for(let i=0;i<14;i++){c.fillStyle=['#ffe27a','#f0c040','#fff0a0'][i%3];circ(c,px+6+rnd()*20,py+12+rnd()*14,1.6);c.fill();}
      c.fillStyle='#5a3a1e';rr(c,px+18,py+7,10,8,2);c.fill();c.strokeStyle='#e0b040';c.lineWidth=1.2;rr(c,px+18,py+7,10,8,2);c.stroke();
      addLight(g,px+16,py+16,'255,210,90',.4);
      return;}
    case'lectern':{
      c.fillStyle='rgba(0,0,0,.34)';ell(c,px+18,py+27,11,4);c.fill();
      c.fillStyle='#3a2616';rr(c,px+10,py+17,12,10,2);c.fill();
      c.save();c.translate(px+16,py+13);c.rotate(-.1);c.fillStyle='#5a3a22';rr(c,-12,-7,24,13,2);c.fill();c.fillStyle='#e8dcc0';rr(c,-10,-5,9,9,1);c.fill();rr(c,1,-5,9,9,1);c.fill();
      c.strokeStyle='rgba(60,40,20,.5)';c.lineWidth=.8;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-9,-3+i*2.6);c.lineTo(-2,-3+i*2.6);c.moveTo(2,-3+i*2.6);c.lineTo(9,-3+i*2.6);c.stroke();}c.restore();
      c.fillStyle='#e8e0c0';c.fillRect(px+24,py+9,3,7);addLight(g,px+25.5,py+8,'255,200,110',.4);
      return;}
    case'vase':{
      c.fillStyle='rgba(0,0,0,.34)';ell(c,px+18,py+27,10,4);c.fill();
      const col=th.cloth||'#4a6aa6',gr=c.createRadialGradient(px+13,py+14,2,px+16,py+17,13);gr.addColorStop(0,sh(col,1.5));gr.addColorStop(1,sh(col,.6));
      c.fillStyle=gr;c.beginPath();c.moveTo(px+11,py+8);c.quadraticCurveTo(px+3,py+17,px+11,py+27);c.lineTo(px+21,py+27);c.quadraticCurveTo(px+29,py+17,px+21,py+8);c.closePath();c.fill();
      c.strokeStyle='#e0b040';c.lineWidth=1.4;c.beginPath();c.moveTo(px+8,py+16);c.quadraticCurveTo(px+16,py+20,px+24,py+16);c.stroke();
      c.fillStyle='#14101a';ell(c,px+16,py+8,6,2.4);c.fill();
      c.strokeStyle='#4a8a50';c.lineWidth=1.6;for(let i=0;i<4;i++){c.beginPath();c.moveTo(px+16,py+8);c.quadraticCurveTo(px+16+(i-1.5)*5,py-3,px+16+(i-1.5)*8,py-5+i%2*3);c.stroke();}
      return;}
    case'pillarstub':{
      c.fillStyle='rgba(0,0,0,.38)';ell(c,px+18,py+26,14,6);c.fill();
      for(let i=0;i<6;i++){c.fillStyle=sh(th2.stone,.5+rnd()*.5);const x=px+4+rnd()*24,y=py+16+rnd()*10;c.beginPath();c.moveTo(x,y);c.lineTo(x+4+rnd()*4,y+1);c.lineTo(x+2,y+4+rnd()*3);c.fill();}
      const gr=c.createLinearGradient(px+6,0,px+26,0);gr.addColorStop(0,sh(th2.stone,.7));gr.addColorStop(.5,sh(th2.stone,1.3));gr.addColorStop(1,sh(th2.stone,.65));
      c.fillStyle=gr;circ(c,px+16,py+14,10);c.fill();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1.2;circ(c,px+16,py+14,10);c.stroke();circ(c,px+16,py+14,6);c.stroke();
      c.strokeStyle='rgba(0,0,0,.6)';c.beginPath();c.moveTo(px+10,py+10);c.lineTo(px+16,py+15);c.lineTo(px+13,py+22);c.stroke();
      return;}
    case'mirror':{
      c.fillStyle='rgba(0,0,0,.3)';ell(c,px+18,py+27,9,3.4);c.fill();
      c.fillStyle='#8a6a28';ell(c,px+16,py+15,9,13);c.fill();
      const gr=c.createLinearGradient(px+8,py+4,px+24,py+26);gr.addColorStop(0,'#cfe8f4');gr.addColorStop(.5,'#6a98b4');gr.addColorStop(1,'#2a4a64');
      c.fillStyle=gr;ell(c,px+16,py+15,7,11);c.fill();
      c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.moveTo(px+12,py+8);c.lineTo(px+20,py+22);c.stroke();
      if(ruin){c.strokeStyle='rgba(0,0,0,.6)';c.beginPath();c.moveTo(px+16,py+4);c.lineTo(px+14,py+15);c.lineTo(px+19,py+24);c.stroke();}
      return;}
    case'toolrack':{
      c.fillStyle='rgba(0,0,0,.32)';rr(c,px+4,py+9,W-4,16,3);c.fill();
      c.fillStyle='#2e2430';rr(c,px+3,py+7,W-6,6,2);c.fill();c.fillRect(px+4,py+7,3,18);c.fillRect(px+W-7,py+7,3,18);
      for(let i=0;i<5;i++){const x=px+10+i*((W-20)/4);c.strokeStyle='#8a8a98';c.lineWidth=2;c.beginPath();c.moveTo(x,py+11);c.lineTo(x,py+22);c.stroke();
        c.fillStyle=i%2?'#6a6a78':'#8a5a30';c.fillRect(x-3,py+20,6,4);}
      return;}
  }
  drawPropBase(c,p,th2,ruin);
}

/* ---------- foreground layer: lintels over doorways, rafters, drapery ---------- */
const FG={cv:document.createElement('canvas'),sc:1};
function bakeForeground(){
  const gw=G.gw,gh=G.gh,W=gw*T,H=gh*T,s=ST.sc,th=G.d.th;
  const fs_=Math.max(1,s*.75);FG.sc=fs_;FG.cv.width=Math.ceil(W*fs_);FG.cv.height=Math.ceil(H*fs_);
  const c=FG.cv.getContext('2d');c.setTransform(fs_,0,0,fs_,0,0);c.clearRect(0,0,W,H);
  if(G.flight)return;
  const p=themePal(),rnd=mulberry(777+LEVELS.indexOf(G.d)*19+(G.state==='ruin'?5:0));
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){
    if(G.grid[y][x]!=='.')continue;
    const px=x*T,py=y*T;
    const gapNS=isW(x-1,y)&&isW(x+1,y)&&!isW(x,y-1)&&!isW(x,y+1);
    if(gapNS){ // stone lintel across a north-south doorway
      const g=c.createLinearGradient(0,py,0,py+14);g.addColorStop(0,sh(p.wt,1.05));g.addColorStop(1,sh(p.w,.7));
      c.fillStyle=g;c.fillRect(px-2,py,T+4,9);
      c.fillStyle='rgba(0,0,0,.45)';c.fillRect(px-2,py+9,T+4,2);
      const sg=c.createLinearGradient(0,py+11,0,py+22);sg.addColorStop(0,'rgba(0,0,0,.42)');sg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=sg;c.fillRect(px,py+11,T,11);
      c.fillStyle='rgba(255,255,255,.12)';c.fillRect(px-2,py,T+4,1.5);
      c.fillStyle=sh(p.wt,.9);c.beginPath();c.moveTo(px+9,py+9);c.lineTo(px+T-9,py+9);c.lineTo(px+T/2,py+15);c.closePath();c.fill(); // keystone
    }
    const gapEW=isW(x,y-1)&&isW(x,y+1)&&!isW(x-1,y)&&!isW(x+1,y);
    if(gapEW){ // doorframe jambs for east-west passages
      c.fillStyle='rgba(0,0,0,.35)';c.fillRect(px,py,T,3);
    }
  }
  // rafters in timbered halls
  if(th.rafters&&G.state!=='ruin'){
    for(let y=0;y<gh;y++){
      if((y%5)!==2)continue;
      let x0=-1;
      for(let x=0;x<=gw;x++){
        const inV=G.d.vault&&(()=>{const a=G.d.vault.rect;return x>=Math.min(a[0],a[2])-1&&x<=Math.max(a[0],a[2])+1&&y>=Math.min(a[1],a[3])-1&&y<=Math.max(a[1],a[3])+1;})();
        const ok=x<gw&&G.grid[y][x]==='.'&&!G.doors[x+','+y]&&!inV&&G.grid[y-1]&&G.grid[y+1];
        if(ok&&x0<0)x0=x;
        if(!ok&&x0>=0){
          if(x-x0>=5&&x-x0<=13){
            const a=x0*T,b=x*T,yy=y*T+6;
            const g=c.createLinearGradient(0,yy-2,0,yy+16);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.35,'rgba(0,0,0,.26)');g.addColorStop(1,'rgba(0,0,0,0)');
            c.fillStyle=g;c.fillRect(a,yy-2,b-a,18);
            c.fillStyle='rgba(0,0,0,.18)';for(let k=a+14;k<b;k+=40)c.fillRect(k,yy-2,5,18);
          }
          x0=-1;
        }
      }
    }
  }
  // hanging drapery / chains at random wall fronts
  for(let y=0;y<gh-1;y++)for(let x=0;x<gw;x++){
    if(G.grid[y][x]!=='#'||isW(x,y+1)||y+1>=gh)continue;
    if(rnd()<(th.chains||0)){
      const px=x*T+6+rnd()*18,py=y*T+T-2;
      c.strokeStyle='#2a2a30';c.lineWidth=1.6;
      for(let k=0;k<4;k++){c.beginPath();ell(c,px,py+k*5,1.6,2.4);c.stroke();}
      c.fillStyle='#5a5a66';circ(c,px,py+20,2);c.fill();
    }
    if(rnd()<(th.web||0)){
      const px=x*T+(rnd()<.5?0:T),py=y*T+T-1,d=rnd()<.5?1:-1;
      c.strokeStyle='rgba(230,230,240,.35)';c.lineWidth=.8;
      for(let k=0;k<4;k++){c.beginPath();c.moveTo(px,py);c.lineTo(px-d*(12+k*2),py+4+k*5);c.stroke();}
      c.beginPath();c.arc(px,py,10,.2,1.4);c.stroke();c.beginPath();c.arc(px,py,18,.3,1.3);c.stroke();
    }
    if(rnd()<(th.vines||0)){
      const px=x*T+rnd()*T,py=y*T+T-4;c.strokeStyle='rgba(60,110,70,.8)';c.lineWidth=2;
      c.beginPath();c.moveTo(px,py-8);let yy=py-8;for(let k=0;k<5;k++){yy+=5;c.lineTo(px+Math.sin(k*1.7+rnd())*3,yy);}c.stroke();
      c.fillStyle='rgba(90,150,80,.9)';for(let k=0;k<5;k++){ell(c,px+(k%2?3:-3),py-4+k*4,2.6,1.5,.5);c.fill();}
    }
  }
}
/* chandeliers swing over the room (drawn each frame after entities) */
function drawChandeliers(){
  const c=ctx,t=G.time;
  for(const ch of G.chand||[]){
    const sx=Math.sin(t*.9+ch.ph)*2.5,x=ch.x+sx,y=ch.y;
    c.fillStyle='rgba(0,0,0,.2)';ell(c,ch.x+10,ch.y+34,24,10);c.fill(); // floor shadow
    c.strokeStyle='#2a2018';c.lineWidth=1.6;c.beginPath();c.moveTo(ch.x,ch.y-40);c.lineTo(x,y-6);c.stroke();
    c.strokeStyle='#8a6a28';c.lineWidth=3;ell(c,x,y,19,8);c.stroke();
    c.strokeStyle='rgba(255,226,150,.5)';c.lineWidth=1;ell(c,x,y-1,19,8);c.stroke();
    for(let i=0;i<8;i++){const a=i/8*6.283,cx=x+Math.cos(a)*19,cy=y+Math.sin(a)*8;
      c.fillStyle='#e8e0c0';c.fillRect(cx-1.2,cy-4,2.4,5);
      c.fillStyle='rgba(255,190,80,.95)';c.beginPath();c.moveTo(cx,cy-9-Math.sin(t*11+i)*1);c.quadraticCurveTo(cx+2.6,cy-5,cx,cy-3.4);c.quadraticCurveTo(cx-2.6,cy-5,cx,cy-9);c.fill();}
    c.globalCompositeOperation='lighter';
    const g=c.createRadialGradient(x,y,2,x,y,70);g.addColorStop(0,'rgba(255,200,110,.28)');g.addColorStop(1,'rgba(255,200,110,0)');
    c.fillStyle=g;c.fillRect(x-70,y-70,140,140);c.globalCompositeOperation='source-over';
  }
}

/* ---------- breakable pots ---------- */
function drawPots(){
  const c=ctx;
  for(const p of G.pots||[]){
    if(p.hp<=0)continue;
    const x=p.x*T+16,y=p.y*T+17,sq=p.hit>0?Math.sin(p.hit*40)*1.2:0;
    c.fillStyle='rgba(0,0,0,.36)';ell(c,x+3,y+9,9,4);c.fill();
    c.save();c.translate(x+sq,y);
    const gr=c.createRadialGradient(-3,-4,1,0,0,12);
    if(p.kind==='pot'){gr.addColorStop(0,'#d98a5a');gr.addColorStop(1,'#7a3a22');}else{gr.addColorStop(0,'#7aa8b8');gr.addColorStop(1,'#34505e');}
    c.fillStyle=gr;c.beginPath();c.moveTo(-5,-9);c.quadraticCurveTo(-12,-1,-7,8);c.lineTo(7,8);c.quadraticCurveTo(12,-1,5,-9);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.3)';ell(c,0,-9,5.5,2.2);c.fill();
    c.strokeStyle=p.kind==='pot'?'#e8b070':'#a8d8e8';c.lineWidth=1.2;c.beginPath();c.moveTo(-8,0);c.quadraticCurveTo(0,3,8,0);c.stroke();
    c.fillStyle='rgba(255,255,255,.22)';ell(c,-4,-2,1.6,4,.3);c.fill();
    c.restore();
    if(p.hit>0)p.hit-=.016;
  }
}
function breakPot(p,fx,fy){
  if(p.hp<=0)return;
  p.hp=0;G.pblock.delete(pkey(p.x,p.y));
  const x=p.x*T+16,y=p.y*T+16;
  burst(x,y,14,p.kind==='pot'?'#b86a3a':'#6a98a8',110,.7,3,{g:260,dr:1});
  burst(x,y,6,'#e8d8b0',50,.5,2,{k:'smoke',gr:6});
  Aud.S.pot();
  dropLoot(x,y,p.seed);
}

/* ======================================================================
   INTERACTABLES: braziers, vault gate and trial, chests, inspect points
   ====================================================================== */
function adjustWaves(w){
  const out=w.map(a=>a.slice());
  if(diff===0)out.forEach(a=>{if(a.length>1)a.pop();});
  if(diff===2)out[0].push('cinder');
  return out;
}
const INSPECT_KIND={'Scorched Barracks Wall':'tablet','Marrow Banner, Torn':'banner','Marrow Reliquary':'bones',"Servants' Corridor":'mop','Wine Cellar Door':'casks',"Grell's Real Treasury":'ledger',
  'Cell of the Silent':'tablet','Mural of Two Students':'mural','The Unsung Song':'tablet',"Foreman's Rules":'ledger','Ostrander Colors, Scorched':'pennant','Forge-Heart Chamber':'armor',
  'Guest List':'ledger','Mask of the Hostess':'mask',"Veyra's Mirror":'mirrorshard','Hallow Crown Fragment':'shard','The Last Entry':'ledger',"Candle-Wright's Vault":'wax'};
const VSTYLE_OF={'Marrow Reliquary':'bone',"Grell's Real Treasury":'gold','The Unsung Song':'books','Forge-Heart Chamber':'forge',"Veyra's Mirror":'mirror',"Candle-Wright's Vault":'candle'};
const VSTYLE={bone:{tint:'rgba(70,120,100,.22)',flame:'130,255,210',rune:'150,230,200'},gold:{tint:'rgba(170,120,20,.2)',flame:'255,214,100',rune:'255,220,130'},
  books:{tint:'rgba(80,45,130,.26)',flame:'200,150,255',rune:'190,150,255'},forge:{tint:'rgba(170,55,20,.24)',flame:'255,110,40',rune:'255,140,80'},
  mirror:{tint:'rgba(40,110,160,.24)',flame:'130,225,255',rune:'150,220,255'},candle:{tint:'rgba(170,110,30,.2)',flame:'255,184,84',rune:'255,200,120'}};
function vstyle(){const v=G.d.vault;return v?VSTYLE[VSTYLE_OF[v.inspect[2]]||'candle']:VSTYLE.candle;}
function initInteractables(g){
  const d=g.d,v=d.vault;
  g.braz=[];g.chests=[];g.insp=[];g.trial=null;g.vaultGate=null;g.brazLit=0;
  if(v){
    for(const [x,y] of v.braz)g.braz.push({x:x*T+16,y:y*T+16,lit:false,p:0,ph:Math.random()*6});
    for(const [x,y] of v.pots){g.pots.push({x,y,hp:1,kind:'urn',seed:Math.random(),hit:0});g.pblock.add(pkey(x,y));}
    g.insp.push({x:v.inspect[0]*T+16,y:v.inspect[1]*T+16,title:v.inspect[2],text:v.inspect[3],done:false,vault:true,kind:INSPECT_KIND[v.inspect[2]]});
    g.vaultGate=g.doors[v.gate[0]+','+v.gate[1]]||null;
    g.trial={state:'idle',wave:0,waves:adjustWaves(v.waves),calm:0,spawnT:0};
    g.secretsTotal++;
  }
  for(const n of d.inspect||[])g.insp.push({x:n[0]*T+16,y:n[1]*T+16,title:n[2],text:n[3],done:false,kind:INSPECT_KIND[n[2]]});
}
function lightBrazier(b){
  if(b.lit)return;
  b.lit=true;Aud.S.brazier();const fc=vstyle().flame;burst(b.x,b.y-4,24,'rgb('+fc+')',120,.7,2.8,{add:true,g:-40});G.rings.push({x:b.x,y:b.y,t:.6,r:60,c:fc});
  G.brazLit++;
  if(G.brazLit>=G.braz.length&&G.vaultGate&&!G.vaultGate.open){
    G.vaultGate.open=true;Aud.S.gate();shake(8);
    G.rings.push({x:G.vaultGate.x*T+16,y:G.vaultGate.y*T+16,t:.9,r:120,c:'255,210,120'});
    burst(G.vaultGate.x*T+16,G.vaultGate.y*T+16,24,'#ffd27a',130,.8,2.6,{add:true});
    toast('The gate grinds open','The relic chamber lies beyond.','#ffd27a');
  } else floatText(b.x,b.y-24,G.brazLit+'/'+G.braz.length,'#ffd27a',12);
}
function igniteNear(x,y,R){for(const b of G.braz||[])if(!b.lit&&Math.hypot(b.x-x,b.y-y)<R)lightBrazier(b);}
function startTrial(){
  const tr=G.trial,v=G.d.vault;
  if(!tr||tr.state!=='idle')return;
  tr.state='active';
  const k=v.outer[0]+','+v.outer[1];G.doors[k]={x:v.outer[0],y:v.outer[1],open:false,gate:true};
  Aud.S.gate();Aud.S.roar();shake(12);G.flash={t:.5,c:'255,160,80'};
  toast('THE GUARDIANS AWAKEN','The vault seals. Fight your way out.','#ff9a4a');
  say('Ashling','Of course. Of course there is a trap.');
  tr.spawnT=1.4;tr.pending=true;
}
function spawnWave(){
  const tr=G.trial,v=G.d.vault,kinds=tr.waves[tr.wave++];
  kinds.forEach((k,i)=>{const sp=v.spawns[i%v.spawns.length];spawnFoe(k,sp[0]*T+16+rrand(-4,4),sp[1]*T+16+rrand(-4,4));});
  toast('Wave '+tr.wave+' / '+tr.waves.length,'','#ff9a4a');
}
function finishTrial(){
  const tr=G.trial,v=G.d.vault;tr.state='done';
  const k=v.outer[0]+','+v.outer[1];if(G.doors[k])G.doors[k].open=true;
  G.chests.push({x:v.chest[0]*T+16,y:v.chest[1]*T+16,open:false,p:0});
  Aud.S.gate();Aud.S.win();G.secretsFound++;
  toast('Trial complete','A chest rises from the dust.','#7be08a');
  burst(v.chest[0]*T+16,v.chest[1]*T+16,30,'#ffd27a',140,.9,2.8,{add:true,g:-30});
}
function stepTrial(dt){
  const tr=G.trial;if(!tr||tr.state!=='active')return;
  if(tr.spawnT>0){tr.spawnT-=dt;if(tr.spawnT<=0&&tr.pending){tr.pending=false;spawnWave();}return;}
  if(foesAlive()===0){
    tr.calm+=dt;
    if(tr.calm>1){tr.calm=0;if(tr.wave<tr.waves.length){const c=G.d.vault.center;spawnPick('heart',c[0]*T+16,c[1]*T+16,1);spawnWave();}else finishTrial();}
  } else tr.calm=0;
}
function readInspect(n){
  n.done=true;Aud.S.scroll();
  G.loreCard={title:n.title,text:n.text,t:6.5,t0:6.5};
  G.disc=(G.disc||0)+1;if(!meta.disc.includes(n.title))meta.disc.push(n.title);
  if(!run.disc.includes(n.title)){run.disc.push(n.title);}
  addCinders(12,n.x,n.y);burst(n.x,n.y,14,'#e8dcc0',60,.6,2,{add:true});
}
function openChest(ch){
  ch.open=true;Aud.S.chest();shake(5);
  burst(ch.x,ch.y,40,'#ffd27a',170,1,3,{add:true,g:80});G.rings.push({x:ch.x,y:ch.y,t:.8,r:90,c:'255,210,120'});
  for(let i=0;i<9;i++)spawnPick('cinder',ch.x,ch.y,9);
  spawnPick('heart',ch.x,ch.y,1);
  const it=itemReward('chest');
  if(it)toast('Guardian\'s hoard',it.name,RARITY[it.rar].c);else toast('Guardian\'s hoard','Cinders and a heart.','#ffd27a');
}
function drawBraziers(){
  const c=ctx,t=G.time;
  for(const b of G.braz||[]){
    shadowAt(b.x,b.y+10,10,3.4,.3);
    c.fillStyle='#2e2a30';c.fillRect(b.x-2,b.y+2,4,9);c.fillRect(b.x-8,b.y+9,16,2.4);
    c.fillStyle='#4a4650';c.beginPath();c.moveTo(b.x-10,b.y-2);c.lineTo(b.x+10,b.y-2);c.lineTo(b.x+6,b.y+5);c.lineTo(b.x-6,b.y+5);c.fill();
    c.fillStyle='rgba(255,255,255,.12)';c.fillRect(b.x-10,b.y-2,20,1.5);
    if(b.lit){
      const fl=Math.sin(t*14+b.ph)*1.5;
      const fcol=vstyle().flame;c.fillStyle='rgba('+fcol+',.95)';c.beginPath();c.moveTo(b.x-7,b.y-2);c.quadraticCurveTo(b.x-8,b.y-13-fl,b.x+fl,b.y-19-fl);c.quadraticCurveTo(b.x+8,b.y-11,b.x+7,b.y-2);c.fill();
      c.fillStyle='rgba(255,248,225,.85)';c.beginPath();c.moveTo(b.x-4,b.y-2);c.quadraticCurveTo(b.x-4,b.y-9,b.x,b.y-13-fl);c.quadraticCurveTo(b.x+4,b.y-8,b.x+4,b.y-2);c.fill();
    } else {
      const p=.5+.5*Math.sin(t*2+b.ph);
      c.fillStyle='#14101a';ell(c,b.x,b.y-2,8,2.4);c.fill();
      c.strokeStyle='rgba(170,120,255,'+(.35+p*.4)+')';c.lineWidth=1.4;ell(c,b.x,b.y-2,8,2.4);c.stroke();
      c.fillStyle='rgba(170,120,255,'+(.3+p*.3)+')';circ(c,b.x,b.y-6-p*3,1.6);c.fill();
      if(b.p>0){c.strokeStyle='#ffd27a';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y-4,14,-1.57,-1.57+6.28*Math.min(1,b.p/.6));c.stroke();}
    }
  }
}
function drawChestsInsp(){
  const c=ctx,t=G.time;
  for(const n of G.insp||[]){
    if(n.done)continue;
    shadowAt(n.x,n.y+4,10,4,.28);drawInspectArt(c,n);
    const p=.5+.5*Math.sin(t*3+n.x);
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,230,160,'+(.12+p*.18)+')';circ(c,n.x,n.y,14);c.fill();c.globalCompositeOperation='source-over';
    if(G.holdT&&G.holdT.ref===n&&G.hold>0){c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=5;c.beginPath();c.arc(n.x,n.y,16,0,6.283);c.stroke();c.strokeStyle='#f0b44c';c.lineWidth=3;c.beginPath();c.arc(n.x,n.y,16,-1.57,-1.57+6.28*Math.min(1,G.hold/G.holdT.need));c.stroke();}
  }
  for(const ch of G.chests||[]){
    shadowAt(ch.x+2,ch.y+11,16,5,.35);
    c.save();c.translate(ch.x,ch.y);
    c.fillStyle='#5a3a1e';rr(c,-14,-6,28,18,3);c.fill();c.fillStyle='#7a5028';rr(c,-14,-6,28,9,3);c.fill();
    c.strokeStyle='#e0b040';c.lineWidth=2;rr(c,-14,-6,28,18,3);c.stroke();c.fillRect(-1.5,-6,3,18);
    if(!ch.open){c.fillStyle='#e0b040';rr(c,-14,-12,28,8,3);c.fill();c.fillStyle='#7a5028';c.fillRect(-12,-11,24,5);c.fillStyle='#ffe27a';circ(c,0,-2,2.4);c.fill();
      c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,210,120,'+(.2+.15*Math.sin(t*4))+')';circ(c,0,0,22);c.fill();c.globalCompositeOperation='source-over';}
    else{c.fillStyle='#2a1a0c';c.fillRect(-12,-5,24,8);c.save();c.translate(0,-14);c.rotate(-.5);c.fillStyle='#e0b040';rr(c,-14,-4,28,6,3);c.fill();c.restore();}
    c.restore();
    if(!ch.open&&G.holdT&&G.holdT.ref===ch&&G.hold>0){c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=5;c.beginPath();c.arc(ch.x,ch.y,20,0,6.283);c.stroke();c.strokeStyle='#f0b44c';c.lineWidth=3;c.beginPath();c.arc(ch.x,ch.y,20,-1.57,-1.57+6.28*Math.min(1,G.hold/G.holdT.need));c.stroke();}
  }
}

/* ---------- rooms: give each its own floor pattern, tint and (sometimes) a rug ---------- */
const RUGPAL={marrow:['#4a4658','#3a3a48','#5a4a3a'],grell:['#6a1f2a','#2a3a5a','#5a2a1a'],sable:['#2a2040','#3a2a50','#22223a'],kest:['#4a2a22','#3a2a2a','#5a3a20'],dunmoor:['#2a3a5a','#1a4a5a','#3a3a60'],hallow:['#5a4220','#4a3018','#3a2a18']};
function computeRooms(){
  const gw=G.gw,gh=G.gh;
  G.roomOf=Array.from({length:gh},()=>new Array(gw).fill(-1));G.rooms=[];
  if(G.flight)return;
  const sep=(x,y)=>!!G.doors[x+','+y]||(isW(x-1,y)&&isW(x+1,y))||(isW(x,y-1)&&isW(x,y+1));
  const rnd=mulberry(31337+LEVELS.indexOf(G.d)*7);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    if(G.grid[y][x]!=='.'||G.roomOf[y][x]>=0||sep(x,y))continue;
    const id=G.rooms.length,R={id,n:0,x0:x,x1:x,y0:y,y1:y,v:Math.floor(rnd()*4),tint:.93+rnd()*.14,rug:rnd()};
    const q=[[x,y]];G.roomOf[y][x]=id;
    while(q.length){const [cx,cy]=q.pop();R.n++;R.x0=Math.min(R.x0,cx);R.x1=Math.max(R.x1,cx);R.y0=Math.min(R.y0,cy);R.y1=Math.max(R.y1,cy);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;
        if(nx>=0&&ny>=0&&nx<gw&&ny<gh&&G.grid[ny][nx]==='.'&&G.roomOf[ny][nx]<0&&!sep(nx,ny)){G.roomOf[ny][nx]=id;q.push([nx,ny]);}}}
    G.rooms.push(R);
  }
  // the vault keeps its own flooring
  if(G.d.vault){const a=G.d.vault.rect,x0=Math.min(a[0],a[2]),x1=Math.max(a[0],a[2]),y0=Math.min(a[1],a[3]),y1=Math.max(a[1],a[3]);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(G.roomOf[y]&&G.roomOf[y][x]>=0)G.roomOf[y][x]=-1;}
}
function autoRugs(c,th,rnd){
  const pal=RUGPAL[G.d.sigil];if(!pal)return;
  const explicit=(th.rugs||[]);
  for(const R of G.rooms){
    const w=R.x1-R.x0+1,h=R.y1-R.y0+1;
    if(R.n<16||w<4||h<3||R.rug>.5)continue;
    const rw=Math.min(w-2,7),rh=Math.min(h-2,3);if(rw<2||rh<1)continue;
    const rx=R.x0+Math.floor((w-rw)/2),ry=R.y0+Math.floor((h-rh)/2);
    let ok=true;
    for(let y=ry;y<ry+rh&&ok;y++)for(let x=rx;x<rx+rw;x++)if(G.roomOf[y][x]!==R.id){ok=false;break;}
    for(const [ex,ey,ew,eh] of explicit)if(rx<ex+ew&&rx+rw>ex&&ry<ey+eh&&ry+rh>ey)ok=false;
    if(!ok)continue;
    const col=pal[Math.floor(R.rug*pal.length*2)%pal.length];
    c.fillStyle='rgba(0,0,0,.26)';c.fillRect(rx*T+2,ry*T+3,rw*T,rh*T);
    c.fillStyle=col;c.fillRect(rx*T+2,ry*T+2,rw*T-4,rh*T-4);
    c.strokeStyle='rgba(224,176,64,.5)';c.lineWidth=2;c.strokeRect(rx*T+6,ry*T+6,rw*T-12,rh*T-12);
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1;c.strokeRect(rx*T+10,ry*T+10,rw*T-20,rh*T-20);
    c.fillStyle='rgba(0,0,0,.18)';for(let k=0;k<rw*T/6;k++)c.fillRect(rx*T+4+k*6,ry*T+4,1,rh*T-8);
    c.fillStyle='rgba(224,176,64,.35)';c.beginPath();const cx=(rx+rw/2)*T,cy=(ry+rh/2)*T;c.moveTo(cx,cy-9);c.lineTo(cx+9,cy);c.lineTo(cx,cy+9);c.lineTo(cx-9,cy);c.fill();
  }
}

/* ---------- story points: every one a different small scene ---------- */
function drawInspectArt(c,n){
  const x=n.x,y=n.y,t=G.time;
  switch(n.kind){
    case'tablet':{c.save();c.translate(x,y);c.rotate(-.12);c.fillStyle='#6a6878';rr(c,-9,-11,18,22,3);c.fill();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;rr(c,-9,-11,18,22,3);c.stroke();
      c.strokeStyle='rgba(20,16,24,.7)';c.lineWidth=1.2;for(let r=0;r<4;r++)for(let k=0;k<4;k++){const px=-6+k*3,py=-8+r*4.4;c.beginPath();c.moveTo(px,py);c.lineTo(px,py+3);c.stroke();}c.beginPath();c.moveTo(-7,-6);c.lineTo(5,-1);c.stroke();c.restore();break;}
    case'banner':{c.save();c.translate(x,y);c.rotate(.5);c.fillStyle='#cfc9bd';c.beginPath();c.moveTo(-12,-6);c.lineTo(12,-8);c.lineTo(9,0);c.lineTo(12,8);c.lineTo(-12,6);c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;c.stroke();
      c.fillStyle='rgba(60,50,60,.7)';circ(c,-3,0,3.4);c.fill();c.fillRect(-4.6,1,3,3);c.fillStyle='#e8b050';c.fillRect(7,-3,2,5);c.restore();break;}
    case'bones':{c.strokeStyle='rgba(225,220,200,.85)';c.lineWidth=2;c.lineCap='round';for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-10+i*3,y-5+(i%2)*2);c.lineTo(x-8+i*3,y+7);c.stroke();}c.lineCap='butt';c.fillStyle='rgba(225,220,200,.9)';ell(c,x+11,y-1,4,3.4);c.fill();c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x+9.4,y-2.4,1.5,1.5);c.fillRect(x+12,y-2.4,1.5,1.5);break;}
    case'mop':{c.fillStyle='#7a7e88';ell(c,x+6,y+2,6,3.6);c.fill();c.fillStyle='#4a6a8a';ell(c,x+6,y+1,4.6,2.4);c.fill();c.strokeStyle='#8a6a3a';c.lineWidth=2;c.beginPath();c.moveTo(x-12,y-6);c.lineTo(x+1,y+5);c.stroke();
      c.strokeStyle='#d8d0b8';c.lineWidth=1.2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+1,y+5);c.lineTo(x+3+i*1.6,y+9+i%2*2);c.stroke();}break;}
    case'casks':{for(let i=0;i<3;i++){const bx=x-8+i*8,by=y+(i%2)*2-2;c.fillStyle='#1c4a2c';c.beginPath();c.moveTo(bx-2.4,by+5);c.lineTo(bx-2.4,by-2);c.lineTo(bx-1,by-6);c.lineTo(bx+1,by-6);c.lineTo(bx+2.4,by-2);c.lineTo(bx+2.4,by+5);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(bx-1.6,by-2,1,6);}
      c.fillStyle='#e8dcc0';c.save();c.translate(x,y+8);c.rotate(.08);c.fillRect(-9,-2,18,4);c.fillStyle='rgba(60,40,20,.5)';c.fillRect(-7,-.8,10,.8);c.restore();break;}
    case'ledger':{c.fillStyle='#3a2a1c';rr(c,x-11,y-8,22,17,2);c.fill();c.fillStyle='#e8dcc0';c.fillRect(x-9,y-6,8.4,13);c.fillRect(x+.6,y-6,8.4,13);c.strokeStyle='rgba(60,40,20,.5)';c.lineWidth=.8;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x-8,y-4+i*3);c.lineTo(x-2,y-4+i*3);c.moveTo(x+2,y-4+i*3);c.lineTo(x+8,y-4+i*3);c.stroke();}c.fillStyle='#b3262c';c.fillRect(x-.5,y-8,1.6,16);break;}
    case'mural':{c.save();c.translate(x,y);c.rotate(.1);c.fillStyle='#5a3a1e';rr(c,-12,-10,24,20,2);c.fill();c.fillStyle='#8aa0b8';c.fillRect(-10,-8,20,16);c.fillStyle='#e8d8a0';c.fillRect(-10,2,20,6);
      c.fillStyle='#3a2a50';circ(c,-4,-1,2.4);c.fill();c.fillRect(-5.4,1,2.8,5);circ(c,4,-1,2.4);c.fill();c.fillRect(2.6,1,2.8,5);c.strokeStyle='rgba(230,60,40,.8)';c.lineWidth=1.4;c.beginPath();c.moveTo(1,-6);c.lineTo(7,6);c.moveTo(7,-6);c.lineTo(1,6);c.stroke();c.restore();break;}
    case'pennant':{c.save();c.translate(x,y);c.rotate(-.3);c.strokeStyle='#8a6a3a';c.lineWidth=1.8;c.beginPath();c.moveTo(-12,6);c.lineTo(12,-6);c.stroke();c.fillStyle='#3a78b8';c.beginPath();c.moveTo(-6,3);c.lineTo(8,-5);c.lineTo(3,4);c.closePath();c.fill();c.fillStyle='rgba(20,10,5,.6)';ell(c,3,-1,3.2,2,.4);c.fill();ell(c,-3,3,2,1.4,0);c.fill();c.restore();break;}
    case'armor':{c.fillStyle='#4a4650';ell(c,x-4,y+1,9,6,.3);c.fill();c.fillStyle='#6a6672';ell(c,x+5,y-2,6,4.4,-.4);c.fill();c.fillStyle='#8a8692';circ(c,x+8,y+5,4.4);c.fill();c.fillStyle='#1a1418';c.fillRect(x+6.6,y+4.4,4,1.6);
      c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.moveTo(x-10,y-3);c.lineTo(x-2,y+3);c.lineTo(x-8,y+5);c.fill();c.fillStyle='rgba(255,110,40,.7)';circ(c,x-4,y+1,1.4);c.fill();break;}
    case'mask':{c.fillStyle='#7a2a38';rr(c,x-11,y-7,22,15,5);c.fill();c.fillStyle='#e8e4f0';c.beginPath();c.moveTo(x-8,y-1);c.quadraticCurveTo(x,y-7,x+8,y-1);c.quadraticCurveTo(x+6,y+6,x,y+6);c.quadraticCurveTo(x-6,y+6,x-8,y-1);c.fill();c.fillStyle='#2a2438';ell(c,x-3.4,y-.4,2.2,1.3,0);c.fill();ell(c,x+3.4,y-.4,2.2,1.3,0);c.fill();c.strokeStyle='rgba(180,200,255,.8)';c.lineWidth=.8;c.beginPath();c.moveTo(x-7,y-3);c.quadraticCurveTo(x,y-7,x+7,y-3);c.stroke();break;}
    case'mirrorshard':{for(const [dx,dy,s,r] of[[-8,2,7,.2],[2,-4,9,-.5],[8,5,6,.9],[-2,6,5,2]]){c.save();c.translate(x+dx,y+dy);c.rotate(r);const g=c.createLinearGradient(-s,-s,s,s);g.addColorStop(0,'#dff4ff');g.addColorStop(1,'#4a7a98');c.fillStyle=g;c.beginPath();c.moveTo(-s*.6,-s*.5);c.lineTo(s*.7,-s*.3);c.lineTo(s*.2,s*.6);c.closePath();c.fill();c.restore();}
      c.globalCompositeOperation='lighter';c.fillStyle='rgba(160,220,255,'+(.15+.1*Math.sin(t*3))+')';circ(c,x,y,13);c.fill();c.globalCompositeOperation='source-over';break;}
    case'shard':{c.strokeStyle='#e0b040';c.lineWidth=3;c.beginPath();c.arc(x,y,7,.4,5);c.stroke();c.strokeStyle='#fff0a0';c.lineWidth=1;c.beginPath();c.arc(x,y,7,.6,4.6);c.stroke();c.fillStyle='#d8d0b8';c.fillRect(x-1.6,y-2,3.2,6);c.fillStyle='#14101a';c.fillRect(x-.4,y-4,.8,2.4);break;}
    case'wax':{c.fillStyle='rgba(232,224,192,.9)';ell(c,x,y+2,11,6,.2);c.fill();ell(c,x+8,y-3,5,3,.6);c.fill();c.fillStyle='rgba(255,255,255,.35)';ell(c,x-3,y,4,2,0);c.fill();c.strokeStyle='#2a2018';c.lineWidth=1.2;c.beginPath();c.moveTo(x-1,y+2);c.quadraticCurveTo(x+2,y-3,x+5,y-2);c.stroke();break;}
    default:{c.strokeStyle='rgba(225,220,200,.75)';c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(x-9,y+1);c.lineTo(x+4,y-4);c.moveTo(x-6,y+6);c.lineTo(x+8,y+2);c.stroke();c.lineCap='butt';c.fillStyle='rgba(225,220,200,.85)';ell(c,x-11,y-3,3.6,3);c.fill();
      c.fillStyle='#e8dcc0';c.save();c.translate(x+6,y+3);c.rotate(.4);c.fillRect(-4,-3,8,6);c.restore();}
  }
}
/* vault floor dressing, baked */
function drawVaultDeco(c,style,x,y,rnd){
  const px=x*T+16,py=y*T+16;c.save();c.translate(px+(rnd()-.5)*8,py+(rnd()-.5)*8);
  switch(style){
    case'bone':for(let i=0;i<4;i++){c.strokeStyle='rgba(225,220,200,.8)';c.lineWidth=1.8;c.lineCap='round';const a=rnd()*3;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*9,Math.sin(a)*9);c.stroke();}c.fillStyle='rgba(225,220,200,.9)';ell(c,2,-3,3.4,3);c.fill();c.fillStyle='rgba(0,0,0,.6)';c.fillRect(.4,-4,1.2,1.2);c.fillRect(2.6,-4,1.2,1.2);break;
    case'gold':for(let i=0;i<10;i++){c.fillStyle=['#ffe27a','#f0c040'][i%2];circ(c,(rnd()-.5)*16,(rnd()-.5)*10,1.7);c.fill();}c.fillStyle='#d9a020';ell(c,5,4,3,2);c.fill();break;
    case'books':c.fillStyle='#6a3a4a';rr(c,-7,-4,9,7,1);c.fill();c.fillStyle='#e8dcc0';c.save();c.rotate(.5);c.fillRect(2,-6,8,6);c.restore();c.fillStyle='#3a4a6a';rr(c,-3,3,8,5,1);c.fill();break;
    case'forge':c.strokeStyle='rgba(255,90,20,.35)';c.lineWidth=5;c.beginPath();c.moveTo(-12,-2);c.lineTo(-3,3);c.lineTo(5,-3);c.lineTo(12,2);c.stroke();c.strokeStyle='rgba(255,180,70,.85)';c.lineWidth=1.4;c.stroke();break;
    case'mirror':c.fillStyle='rgba(120,190,230,.4)';ell(c,0,0,9,5,rnd());c.fill();c.fillStyle='rgba(220,245,255,.7)';c.beginPath();c.moveTo(-5,-2);c.lineTo(3,-4);c.lineTo(0,3);c.fill();break;
    case'candle':for(let i=0;i<3;i++){const cx=(i-1)*6,cy=(i%2)*3;c.fillStyle='rgba(232,224,192,.85)';c.fillRect(cx-1.6,cy-1,3.2,5+i);c.fillStyle='rgba(240,230,200,.5)';ell(c,cx,cy+5,4,2,0);c.fill();}break;
  }
  c.restore();
}
