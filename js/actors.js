'use strict';
/* EMBERCROWN - actors: Wren, Ashling, foes, bosses, and combat effects. */

function bodyFlash(o){return o.hitT>0||o.hurt>0;}
function drawKO(g,col,trim){
  const c=ctx,t=G.time;
  shadowAt(g.x,g.y+3,15,6,.4);
  c.save();c.translate(g.x,g.y+2);c.rotate((g.ph%1)*.4+1.2);c.scale(1,.78);
  c.fillStyle='#2a2226';ell(c,-9,-3,3.6,2.2);c.fill();ell(c,-10,4,3.6,2.2);c.fill();
  c.fillStyle=sh(col,.72);ell(c,0,0,7.4,9.2);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.stroke();
  c.fillStyle=trim;c.fillRect(-1,-8,2,16);
  c.fillStyle='#8a8f9e';circ(c,6,0,5.4);c.fill();c.fillStyle='#14101a';c.fillRect(8.4,-2.4,1.6,4.8);
  c.restore();
  c.strokeStyle='#8a7a60';c.lineWidth=1.6;c.beginPath();c.moveTo(g.x-14,g.y+12);c.lineTo(g.x+14,g.y+8);c.stroke();
  for(let i=0;i<3;i++){const k=((t*.7+i*.33)%1);c.fillStyle='rgba(200,220,255,'+(1-k)*.9+')';c.font='bold '+(8+k*5)+'px '+HEAD;c.fillText('z',g.x+6+k*8,g.y-12-k*16);}
}

/* ---------- Wren ---------- */
function ribbon(c,pts,wid0,col,wob,t){
  if(pts.length<3)return;
  c.strokeStyle=col;c.lineCap='round';
  for(let i=1;i<pts.length;i++){
    c.lineWidth=Math.max(.6,wid0*(1-i/pts.length));
    const a=pts[i-1],b=pts[i],w=Math.sin(t*9+i*.9)*wob*i*.35;
    c.beginPath();c.moveTo(a.x+(a.ox||0),a.y+(a.oy||0));c.lineTo(b.x+w*.3,b.y+w);c.stroke();
    b.ox=w*.3;b.oy=w;
  }
}
function drawWren(w,active){
  const c=ctx,t=G.time,sp=Math.hypot(w.vx||0,w.vy||0),mv=sp>14,sneak=G.sneak&&active,f=vfa(w);
  const roll=w.rollAnim>0?1-w.rollAnim/.3:-1,atk=w.atk;
  const blink=G.inv>0&&Math.floor(G.time*16)%2===0;
  c.globalAlpha=blink?.35:1;
  shadowAt(w.x,w.y+4,roll>=0?8:10,5.5,.38);
  const tr=w.trail||[];
  // flowing cloak tail along the path just walked
  if(roll<0&&mv&&tr.length>5){
    c.fillStyle='#4a3a82';c.beginPath();
    const L=[],R=[];
    for(let i=1;i<9&&i<tr.length;i++){
      const a=tr[i-1],b=tr[i],dx=b.x-a.x,dy=b.y-a.y,m=Math.hypot(dx,dy)||1,nx=-dy/m,ny=dx/m,wd=7.5*(1-i/10)+Math.sin(t*10+i)*.8;
      L.push([a.x+nx*wd,a.y+ny*wd]);R.push([a.x-nx*wd,a.y-ny*wd]);
    }
    if(L.length>2){c.moveTo(w.x,w.y);L.forEach(p=>c.lineTo(p[0],p[1]));for(let i=R.length-1;i>=0;i--)c.lineTo(R[i][0],R[i][1]);c.closePath();c.fill();
      c.strokeStyle='rgba(20,10,40,.4)';c.lineWidth=1;c.stroke();}
  }
  // scarf ribbons
  if(roll<0&&tr.length>4){
    const base=tr.slice(1,9).map(p=>({x:p.x,y:p.y}));
    base.unshift({x:w.x-Math.cos(f)*3,y:w.y-Math.sin(f)*3});
    ribbon(c,base,3.2,'#d9534f',1.4,t);
    ribbon(c,base.map((p,i)=>({x:p.x+Math.sin(f)*2,y:p.y-Math.cos(f)*2})),2.2,'#b8403e',1.1,t+1.3);
  }
  c.save();c.translate(w.x,w.y);
  if(roll>=0){ // tumbling roll
    c.rotate(f+roll*12.5);c.scale(.9,.8);
    c.fillStyle='#4a3a82';ell(c,0,0,9,8);c.fill();c.fillStyle='#8f7bd0';ell(c,-2,-2,5,4);c.fill();
    c.fillStyle='#2f2352';circ(c,5,0,4.6);c.fill();c.fillStyle='#d9534f';c.fillRect(-1,-8,3,16);
    c.restore();c.globalAlpha=1;return;
  }
  c.rotate(f);
  const lean=atk?.22:(sneak?-.05:0),br=1+Math.sin(t*2.4)*.018*(mv?0:1);
  c.scale(sneak?.94:br,sneak?.9:br);c.translate(lean*6,0);
  const sw=Math.sin(w.ph);
  c.fillStyle='#241a30';ell(c,sw*3.4,-4.6,3.4,2.3);c.fill();ell(c,-sw*3.4,4.6,3.4,2.3);c.fill();
  if(!(mv&&tr.length>5)){ // static tail when standing
    const sway=Math.sin(t*3)*1.2;
    c.fillStyle='#4a3a82';c.beginPath();c.moveTo(1,-8);c.quadraticCurveTo(-11,-7+sway,-13,0);c.quadraticCurveTo(-11,7-sway,1,8);c.closePath();c.fill();
    c.fillStyle='#8f7bd0';c.beginPath();c.moveTo(-1,-3);c.quadraticCurveTo(-8,-2,-10,sway*.4);c.quadraticCurveTo(-8,2,-1,3);c.closePath();c.fill();
    c.fillStyle='#d9534f';c.beginPath();c.moveTo(-1,4);c.quadraticCurveTo(-7,6+sway,-11,3+sway);c.lineTo(-10,5+sway);c.quadraticCurveTo(-6,9,-1,6);c.closePath();c.fill();
  }
  const g=c.createRadialGradient(-1,-2,1,0,0,10);g.addColorStop(0,bodyFlash(w)?'#fff':'#8a73cf');g.addColorStop(1,'#5a4698');
  c.fillStyle=g;ell(c,0,0,7.2,9);c.fill();c.strokeStyle='rgba(20,10,40,.5)';c.lineWidth=1;c.stroke();
  c.fillStyle='#3a2a1a';c.fillRect(-2,-8.2,3,2.4);
  // arms: swing when walking, thrust when striking
  const as=mv?Math.sin(w.ph+1.5)*3:0;
  c.fillStyle='#4a3a82';ell(c,2.5+as,-8,4,2.6,.3);c.fill();
  let hx=6.4,hy=8.6;
  if(atk&&atk.a!==undefined){
    const u=1-atk.t/atk.t0,sgn=(atk.combo%2)?-1:1,ang=(-1.2+2.4*ease(u))*sgn;
    const bx=3+Math.cos(ang)*8,by=7*sgn*-1+Math.sin(ang)*8+ (sgn>0?8:-8)*0;
    c.fillStyle='#4a3a82';ell(c,bx*.6+2,by*.6,4,2.6,ang);c.fill();
    c.strokeStyle='#e8eef8';c.lineWidth=2;c.beginPath();c.moveTo(bx,by);c.lineTo(bx+Math.cos(ang)*(atk.combo===2?20:15),by+Math.sin(ang)*(atk.combo===2?20:15));c.stroke();
    c.fillStyle='#e8c8a8';circ(c,bx,by,1.9);c.fill();
  } else {
    c.fillStyle='#4a3a82';ell(c,2.5-as,8,4,2.6,-.3);c.fill();
    c.fillStyle='#e8c8a8';circ(c,6.4+as,-8.6,1.8);c.fill();circ(c,hx-as,hy,1.8);c.fill();
    c.strokeStyle='#d8dce8';c.lineWidth=1.4;c.beginPath();c.moveTo(4,9.8);c.lineTo(9,11.5);c.stroke();
  }
  // head looks around when idle
  const look=mv?0:Math.sin(t*.8+1)*.35;
  c.save();c.translate(2,0);c.rotate(look);
  c.fillStyle='#2f2352';circ(c,0,0,5.8);c.fill();c.fillStyle='#e8c8a8';circ(c,3.2,0,3.2);c.fill();
  c.fillStyle='#3a2a1a';c.fillRect(4.3,-2,1.2,1.3);c.fillRect(4.3,.8,1.2,1.3);
  c.restore();
  c.fillStyle='#d9534f';c.beginPath();c.moveTo(-1,-5.5);c.quadraticCurveTo(1,-7,3,-5);c.lineTo(3,5);c.quadraticCurveTo(1,7,-1,5.5);c.closePath();c.fill();
  if(bodyFlash(w)){c.fillStyle='rgba(255,255,255,.55)';ell(c,0,0,8,9.5);c.fill();}
  c.restore();c.globalAlpha=1;
}

/* ---------- Ashling ---------- */
function drawAsh(a,active){
  const c=ctx,t=G.time,fl=G.flight,sp=Math.hypot(a.vx||0,a.vy||0),mv=sp>14,f=vfa(a);
  const dashing=G.dash.t>0,nova=a.novaAnim>0,cel=a.celebrate>0;
  if(cel)a.celebrate-=.016;
  const blink=G.inv>0&&Math.floor(G.time*16)%2===0;
  c.globalAlpha=blink?.35:1;
  const sc=(fl?1.4:1)*(nova?1+Math.sin((1-a.novaAnim/.55)*3.14)*.35:1),hover=fl?Math.sin(t*3)*2:(cel?-Math.abs(Math.sin(t*9))*9:0);
  shadowAt(a.x+(fl?7:0),a.y+(fl?14:5),(fl?13:11)*(cel?.8:1),fl?6:5.5,fl?.25:.38);
  const tr=a.trail||[];
  // tail follows the path travelled
  const tip=[];
  if(tr.length>6&&(mv||dashing)){for(let k=0;k<6;k++){const p=tr[Math.min(tr.length-1,k*2+1)];tip.push({x:p.x,y:p.y});}}
  if(tip.length>3){
    tip.unshift({x:a.x-Math.cos(f)*6,y:a.y-Math.sin(f)*6});
    c.lineCap='round';
    for(let i=1;i<tip.length;i++){
      const wv=Math.sin(t*8+i)*1.4;
      c.strokeStyle='#c24a18';c.lineWidth=5.6*(1-i/tip.length)+1;c.beginPath();c.moveTo(tip[i-1].x,tip[i-1].y);c.lineTo(tip[i].x+wv*.4,tip[i].y+wv);c.stroke();
      c.strokeStyle='#ee6a22';c.lineWidth=3*(1-i/tip.length)+.6;c.stroke();
      c.fillStyle='#ffd27a';circ(c,tip[i].x,tip[i].y,.9);c.fill();
    }
    const e=tip[tip.length-1];c.fillStyle='#ffd27a';circ(c,e.x,e.y,2.2);c.fill();
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,70,.5)';circ(c,e.x,e.y,5);c.fill();c.globalCompositeOperation='source-over';
  }
  c.save();c.translate(a.x,a.y+hover);c.rotate(f);
  if(dashing)c.scale(1.28,.8);else c.scale(sc,sc);
  const flap=Math.sin(t*(fl||dashing||cel||nova?16:(mv?11:4)))*((fl||nova||cel)?5:3);
  if(tip.length<=3){
    const sw=Math.sin(t*3.2)*4;
    c.strokeStyle='#c24a18';c.lineWidth=5;c.lineCap='round';
    c.beginPath();c.moveTo(-6,0);c.bezierCurveTo(-12,sw,-16,-sw*1.2,-22,Math.sin(t*3.2+1)*4);c.stroke();
    c.strokeStyle='#ee6a22';c.lineWidth=2.6;c.stroke();
    c.fillStyle='#ffd27a';const ty=Math.sin(t*3.2+1)*4;c.beginPath();c.moveTo(-22,ty);c.lineTo(-27,ty-3);c.lineTo(-27,ty+3);c.fill();
    c.lineCap='butt';
  }
  for(const s of[-1,1]){
    const ws=nova||cel?1.5:1;
    c.fillStyle='#a8401a';c.beginPath();c.moveTo(0,s*4);c.lineTo(-4,s*(11+flap)*ws);c.lineTo(-11,s*(9+flap*.7)*ws);c.lineTo(-8,s*4);c.closePath();c.fill();
    c.strokeStyle='#ff9a4a';c.lineWidth=1;c.beginPath();c.moveTo(0,s*4);c.lineTo(-4,s*(11+flap)*ws);c.moveTo(-1,s*5);c.lineTo(-11,s*(9+flap*.7)*ws);c.stroke();
  }
  c.fillStyle='#ffd27a';for(let i=0;i<4;i++){const x=-2-i*3;c.beginPath();c.moveTo(x,-1.2);c.lineTo(x-2,0);c.lineTo(x,1.2);c.fill();}
  const g=c.createRadialGradient(-1,-3,1,0,0,10);g.addColorStop(0,bodyFlash(a)?'#fff':'#ff9a50');g.addColorStop(1,'#d9531e');
  c.fillStyle=g;ell(c,1,0,9,7);c.fill();
  c.fillStyle='rgba(255,220,150,.75)';ell(c,2,0,5.2,3.6);c.fill();
  const sw=Math.sin(a.ph);c.fillStyle='#b8401a';ell(c,3+sw*2,-6.5,2.6,1.8);c.fill();ell(c,3-sw*2,6.5,2.6,1.8);c.fill();
  // head: tilts up while breathing fire, bobs when idle
  const firing=G.fireOn&&active,hb=firing?-.1:Math.sin(t*2.2)*.05;
  c.save();c.translate(9,0);c.rotate(hb);
  c.fillStyle='#ff7a2f';ell(c,0,0,5.6,4.8);c.fill();
  c.fillStyle='#ffa050';ell(c,4.2,0,3.4,2.8);c.fill();
  if(firing){c.fillStyle='#3a1008';ell(c,5.4,0,2.4,1.8);c.fill();}
  c.fillStyle='#6a2a10';circ(c,6.4,-1,.7);c.fill();circ(c,6.4,1,.7);c.fill();
  c.fillStyle='#ffe0a0';c.beginPath();c.moveTo(-3,-3);c.lineTo(-7.5,-6.5);c.lineTo(-1,-4.2);c.fill();c.beginPath();c.moveTo(-3,3);c.lineTo(-7.5,6.5);c.lineTo(-1,4.2);c.fill();
  const sq=firing||dashing?.5:1;
  c.fillStyle='#fff4a0';ell(c,1.4,-2.5,1.5,1.5*sq);c.fill();ell(c,1.4,2.5,1.5,1.5*sq);c.fill();
  c.fillStyle='#2a1008';circ(c,1.7,-2.5,.75*sq);c.fill();circ(c,1.7,2.5,.75*sq);c.fill();
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
    c.fillStyle=gr;ell(c,0,0,8,7.4);c.fill();
    const glow=wind?.9+Math.sin(t*30)*.1:.55+Math.sin(t*5+f.ph)*.2;
    c.strokeStyle='rgba(255,'+(110+glow*70|0)+',40,'+glow+')';c.lineWidth=1.5;
    c.beginPath();c.moveTo(-5,-3);c.lineTo(-1,0);c.lineTo(-4,3);c.moveTo(1,-5);c.lineTo(3,-1);c.lineTo(1,4);c.stroke();
    c.fillStyle='#2a1a14';ell(c,6,0,4.4,4);c.fill();
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
    c.fillStyle=gr;circ(c,0,0,7+chg*3);c.fill();
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
    c.fillStyle='#4a3a34';ell(c,8,0,8,7);c.fill();c.fillStyle='rgba(255,170,60,'+(glow)+')';c.fillRect(11,-3.4,3,2);c.fillRect(11,1.4,3,2);
    c.restore();
  }
  if(f.state==='recover'||f.state==='stagger'){
    for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,f.x+Math.cos(a)*8,f.y-16+Math.sin(a)*3,1.6);c.fill();}
  }
  if(f.hp<f.max&&f.state!=='dead'&&f.state!=='spawn'){
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(f.x-11,f.y-(f.kind==='wisp'?26:f.kind==='husk'?28:20),22,3.4);
    c.fillStyle='#e05050';c.fillRect(f.x-10.5,f.y-(f.kind==='wisp'?26:f.kind==='husk'?28:20)+.5,21*Math.max(0,f.hp)/f.max,2.4);
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
    c.fillStyle='#14101a';c.fillRect(6,-4,2.2,2.4);c.fillRect(6,1.6,2.2,2.4);c.fillRect(8.5,-.6,1.6,1.4);
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
  shadowAt(g.x,g.y+10,26,12,.42);
  c.save();c.translate(g.x,g.y);c.rotate(f);
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
  c.fillStyle='#e8e0c8';c.fillRect(11,-2.4,3,5);c.fillStyle=roar>0?'#ffb040':'#14101a';c.fillRect(11,-.6,3,1.2);
  c.restore();
  if(st==='charge'&&Math.random()<.9)pt(g.x-Math.cos(g.dir)*16,g.y-Math.sin(g.dir)*16,rrand(-20,20),rrand(-20,20),.5,5,'#8a7a6a',{k:'smoke',gr:6});
  if(stag&&!dead)for(let i=0;i<3;i++){const a=t*4+i*2.09;c.fillStyle='#ffe27a';circ(c,g.x+Math.cos(a)*12,g.y-26+Math.sin(a)*3.4,2.2);c.fill();}
  c.globalAlpha=1;
}
