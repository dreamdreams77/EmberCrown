'use strict';
/* EMBERCROWN - world props, particles, ambience, and the full world draw pass. */

function drawDoor(d){
  const c=ctx,x=d.x*T,y=d.y*T;
  if(d.open){ // ajar door against the frame
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x+2,y+4,6,T-6);
    c.fillStyle='#5a3c22';c.fillRect(x+1,y+3,5,T-6);c.fillStyle='#8a6038';c.fillRect(x+1,y+3,2,T-6);
    c.fillStyle='#3a2a1c';c.fillRect(x+T-6,y+3,5,T-6);
    return;
  }
  if(d.gate){
    const open=d.open,p=.5+.5*Math.sin(G.time*3);
    c.fillStyle='#14101a';c.fillRect(x,y+2,T,T-4);
    if(!open){
      c.strokeStyle='#4a4654';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+4+i*6,y+1);c.lineTo(x+4+i*6,y+T-1);c.stroke();}
      c.strokeStyle='#2a2630';c.lineWidth=3;c.beginPath();c.moveTo(x+1,y+10);c.lineTo(x+T-1,y+10);c.moveTo(x+1,y+T-10);c.lineTo(x+T-1,y+T-10);c.stroke();
      if(d.puzzle){c.strokeStyle='rgba(170,120,255,'+(.45+p*.4)+')';c.lineWidth=1.6;c.beginPath();c.arc(x+16,y+16,6,0,6.28);c.stroke();c.fillStyle='rgba(170,120,255,'+(.5+p*.4)+')';circ(c,x+16,y+16,2);c.fill();}
      else{c.fillStyle='rgba(255,120,60,'+(.35+p*.35)+')';c.fillRect(x,y+T/2-1,T,2);}
    } else {
      c.strokeStyle='#4a4654';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+4+i*6,y+1);c.lineTo(x+4+i*6,y+6);c.stroke();}
    }
    return;
  }
  if(d.sealed){
    const p=.5+.5*Math.sin(G.time*3);
    c.fillStyle='#241a3c';c.fillRect(x+2,y+1,T-4,T-2);
    c.fillStyle='#3b2a5a';c.fillRect(x+4,y+3,T-8,T-6);
    c.strokeStyle='rgba(185,156,255,'+(.5+p*.5)+')';c.lineWidth=2;
    c.beginPath();c.moveTo(x+16,y+6);c.lineTo(x+24,y+16);c.lineTo(x+16,y+26);c.lineTo(x+8,y+16);c.closePath();c.stroke();
    c.beginPath();c.moveTo(x+16,y+11);c.lineTo(x+16,y+21);c.moveTo(x+11,y+16);c.lineTo(x+21,y+16);c.stroke();
    return;
  }
  const g=c.createLinearGradient(x,y,x+T,y);g.addColorStop(0,'#5a3a20');g.addColorStop(.5,'#8a5c34');g.addColorStop(1,'#5a3a20');
  c.fillStyle='#2a1a10';c.fillRect(x+1,y+1,T-2,T-2);
  c.fillStyle=g;c.fillRect(x+3,y+3,T-6,T-6);
  c.fillStyle='rgba(0,0,0,.25)';for(let i=1;i<4;i++)c.fillRect(x+3,y+3+i*7,T-6,1);
  c.fillStyle='#2e2a30';c.fillRect(x+3,y+7,T-6,3);c.fillRect(x+3,y+T-11,T-6,3);
  c.fillStyle='#7a7480';circ(c,x+6,y+8.5,1);c.fill();circ(c,x+T-6,y+8.5,1);c.fill();
  c.fillStyle='#d8a24a';rr(c,x+T-12,y+13,6,7,1.5);c.fill();c.fillStyle='#3a2a10';circ(c,x+T-9,y+16,1);c.fill();
}
function drawCrack(ck){
  const c=ctx,x=ck.x*T,y=ck.y*T,p=.5+.5*Math.sin(G.time*2.2+ck.x);
  const near=Math.hypot(ck.x*T+16-G.ash.x,ck.y*T+16-G.ash.y)<4*T&&G.ash.on;
  c.fillStyle='rgba(180,170,150,'+(.10+p*.06)+')';c.fillRect(x,y,T,T);
  c.strokeStyle='#120c0a';c.lineWidth=2;c.beginPath();
  c.moveTo(x+14,y+1);c.lineTo(x+18,y+9);c.lineTo(x+12,y+15);c.lineTo(x+19,y+22);c.lineTo(x+15,y+T-1);
  c.moveTo(x+18,y+9);c.lineTo(x+26,y+12);c.moveTo(x+12,y+15);c.lineTo(x+5,y+19);c.stroke();
  c.strokeStyle='rgba(255,180,90,'+(.25+p*.35+(near?.3:0)+ck.p*.4)+')';c.lineWidth=1;c.stroke();
  if(near&&Math.random()<.08)pt(x+10+Math.random()*12,y+6+Math.random()*20,0,-8,.9,1.4,'#ffd27a',{add:true});
  if(ck.p>0){c.strokeStyle='#ffd27a';c.lineWidth=3;c.beginPath();c.arc(x+16,y+16,18,-1.57,-1.57+6.28*Math.min(1,ck.p/1.1));c.stroke();}
}
function drawItem(it){
  const c=ctx,t=G.time;
  const dim=G.d.timeshift&&((it.type==='P'&&G.state!=='ball')||(it.type==='O'&&G.state!=='ruin'));
  if(it.type==='g'){
    if(it.done)return;
    const b=Math.sin(t*3+it.ph)*2.4;
    shadowAt(it.x,it.y+9,6,2.4,.3);
    c.save();c.translate(it.x,it.y+b-2);
    const g=c.createLinearGradient(-7,-9,7,9);g.addColorStop(0,'#ffd27a');g.addColorStop(.5,'#ff9a3c');g.addColorStop(1,'#c4561a');
    c.fillStyle=g;c.beginPath();c.moveTo(0,-9);c.lineTo(7,-2);c.lineTo(0,9);c.lineTo(-7,-2);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(0,-9);c.lineTo(-7,-2);c.lineTo(-2,-2);c.closePath();c.fill();
    c.strokeStyle='rgba(120,40,10,.6)';c.lineWidth=1;c.stroke();
    const sp=(t*1.4+it.ph)%3;if(sp<.5){c.fillStyle='rgba(255,255,255,'+(1-sp*2)+')';c.fillRect(-1,-1+sp*4-3,2,2);}
    c.restore();return;
  }
  if(it.type==='G'){
    if(it.done)return;
    shadowAt(it.x,it.y+9,11,4,.32);
    for(let i=0;i<4;i++){const a=i*1.57+.5,r=i?6.5:0,gx=it.x+Math.cos(a)*r,gy=it.y+Math.sin(a)*r*.6+Math.sin(t*2.6+i)*1.6;
      c.fillStyle=['#ffb040','#ff8a3a','#ffd27a','#e8651f'][i];c.beginPath();c.moveTo(gx,gy-6);c.lineTo(gx+5,gy);c.lineTo(gx,gy+6);c.lineTo(gx-5,gy);c.fill();
      c.fillStyle='rgba(255,255,255,.5)';c.fillRect(gx-1,gy-3,1.6,3);}
    return;
  }
  if(it.type==='r'){
    if(it.done)return;
    const b=Math.sin(t*2+it.ph)*3;
    shadowAt(it.x,it.y+11,9,3.4,.3);
    c.save();c.translate(it.x,it.y-2+b);
    c.globalCompositeOperation='lighter';
    for(let i=0;i<8;i++){const a=i/8*6.283+t*.5;c.fillStyle='rgba(255,220,130,.10)';c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a-.08)*26,Math.sin(a-.08)*26);c.lineTo(Math.cos(a+.08)*26,Math.sin(a+.08)*26);c.fill();}
    c.globalCompositeOperation='source-over';
    c.strokeStyle='#ffe9a0';c.lineWidth=1.6;circ(c,0,0,12);c.stroke();
    c.rotate(t*.8);c.strokeStyle='rgba(255,233,160,.6)';c.lineWidth=1;c.strokeRect(-9,-9,18,18);c.rotate(-t*.8);
    const g=c.createRadialGradient(-2,-2,1,0,0,9);g.addColorStop(0,'#fff6c0');g.addColorStop(1,'#d9a020');
    c.fillStyle=g;c.beginPath();c.moveTo(0,-9);c.lineTo(8,0);c.lineTo(0,9);c.lineTo(-8,0);c.closePath();c.fill();
    c.strokeStyle='#7a5410';c.stroke();
    c.restore();return;
  }
  if(it.type==='s'){
    if(it.done)return;
    shadowAt(it.x,it.y+6,9,3,.3);
    c.save();c.translate(it.x,it.y+Math.sin(t*2+it.ph)*1.2);c.rotate(-.3);
    c.fillStyle='#e8dcc0';rr(c,-9,-4.5,18,9,2);c.fill();
    c.fillStyle='#c8b894';c.fillRect(-9,-4.5,3,9);c.fillRect(6,-4.5,3,9);
    c.fillStyle='rgba(60,40,20,.5)';c.fillRect(-4,-2,8,1);c.fillRect(-4,.5,6,1);
    c.fillStyle='#b3262c';c.fillRect(-1,-5,2.4,10);
    c.restore();return;
  }
  if(it.type==='o'){
    if(it.done)return;
    const fz=it.fuse>0;
    shadowAt(it.x+1,it.y+10,10,4,.35);
    c.save();c.translate(it.x,it.y);
    const j=fz?(Math.random()-.5)*1.5:0;c.translate(j,0);
    const g=c.createLinearGradient(-9,0,9,0);g.addColorStop(0,'#4a2c18');g.addColorStop(.5,'#8a5a30');g.addColorStop(1,'#4a2c18');
    c.fillStyle=g;rr(c,-8.5,-10,17,20,4);c.fill();
    c.fillStyle='#2e2a30';c.fillRect(-9,-6,18,2.4);c.fillRect(-9,3.6,18,2.4);
    c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;rr(c,-8.5,-10,17,20,4);c.stroke();
    c.fillStyle=fz?'#fff':'#e8651f';c.beginPath();c.moveTo(0,-3);c.quadraticCurveTo(3.4,.5,0,3.4);c.quadraticCurveTo(-3.4,.5,0,-3);c.fill();
    if(fz){c.fillStyle='rgba(255,230,150,.7)';circ(c,0,-12,3+Math.random()*2);c.fill();}
    c.restore();return;
  }
  c.globalAlpha=it.done?.3:dim?.22:1;
  if(it.type==='O'){
    if(G.d.song){ // ledger
      c.fillStyle='#4a2a1c';rr(c,it.x-9,it.y-8,18,16,2);c.fill();c.fillStyle='#8a5a30';c.fillRect(it.x-7,it.y-6,3,12);
      c.fillStyle='#eadfd0';c.fillRect(it.x-3,it.y-6,10,12);c.fillStyle='#d8a24a';c.fillRect(it.x+5,it.y-1,3,2);
      c.fillStyle='rgba(60,40,20,.4)';for(let i=0;i<3;i++)c.fillRect(it.x-1,it.y-4+i*3.4,6,1);
    } else if(lvl===0){ // dragon egg
      const p=.5+.5*Math.sin(t*3);
      c.fillStyle='#3a2a20';rr(c,it.x-11,it.y+6,22,6,3);c.fill();c.fillStyle='#d8a24a';c.fillRect(it.x-11,it.y+6,22,1.6);
      const g=c.createRadialGradient(it.x-3,it.y-4,1,it.x,it.y,13);g.addColorStop(0,'#fff0d0');g.addColorStop(.6,'#e8d0a0');g.addColorStop(1,'#b08850');
      c.fillStyle=g;ell(c,it.x,it.y-1,9,12);c.fill();
      c.strokeStyle='rgba(255,'+(130+p*70|0)+',50,'+(.5+p*.4)+')';c.lineWidth=1.6;c.beginPath();c.moveTo(it.x-5,it.y-8);c.lineTo(it.x-1,it.y-3);c.lineTo(it.x-5,it.y+1);c.lineTo(it.x,it.y+6);c.stroke();
      c.fillStyle='rgba(120,80,40,.5)';c.fillRect(it.x+3,it.y-5,2,2);c.fillRect(it.x-6,it.y+4,2,2);
    } else if(G.d.timeshift){ // signet
      c.strokeStyle='#e0b040';c.lineWidth=3.4;circ(c,it.x,it.y+2,6);c.stroke();
      c.fillStyle='#b3262c';c.beginPath();c.moveTo(it.x,it.y-9);c.lineTo(it.x+5,it.y-4);c.lineTo(it.x,it.y);c.lineTo(it.x-5,it.y-4);c.fill();
      c.fillStyle='rgba(255,255,255,.6)';c.fillRect(it.x-2,it.y-7,2,2);
    } else { // sealed treaty
      c.fillStyle='#eadfd0';rr(c,it.x-10,it.y-7,20,14,2);c.fill();
      c.fillStyle='rgba(60,40,20,.4)';for(let i=0;i<3;i++)c.fillRect(it.x-7,it.y-4+i*3.5,10,1);
      c.fillStyle='#b3262c';circ(c,it.x+5,it.y+3,4.4);c.fill();c.fillStyle='#e05a5a';circ(c,it.x+4,it.y+2,1.6);c.fill();
    }
  } else if(it.type==='C'){
    const fl=Math.sin(t*12+it.ph)*1.2;
    shadowAt(it.x+1,it.y+11,6,2.6,.3);
    c.fillStyle='#d8d0b8';rr(c,it.x-4,it.y-2,8,13,1.5);c.fill();c.fillStyle='rgba(0,0,0,.18)';c.fillRect(it.x+1,it.y-2,3,13);
    c.fillStyle='#f4efe0';c.fillRect(it.x-4,it.y+5,2,5);
    if(!it.done){
      c.fillStyle='#ffb040';c.beginPath();c.moveTo(it.x+fl*.3,it.y-14-fl);c.quadraticCurveTo(it.x+5.5,it.y-6,it.x,it.y-2);c.quadraticCurveTo(it.x-5.5,it.y-6,it.x+fl*.3,it.y-14-fl);c.fill();
      c.fillStyle='#fff6c0';c.beginPath();c.moveTo(it.x,it.y-10);c.quadraticCurveTo(it.x+2.4,it.y-6,it.x,it.y-3.4);c.quadraticCurveTo(it.x-2.4,it.y-6,it.x,it.y-10);c.fill();
    } else {
      c.fillStyle='#2a2a2a';c.fillRect(it.x-1,it.y-5,2,3);
      for(let i=0;i<3;i++){const k=((t*.6+i*.33)%1);c.fillStyle='rgba(180,180,190,'+(.4*(1-k))+')';circ(c,it.x+Math.sin(k*6+i)*3,it.y-6-k*18,2+k*3);c.fill();}
    }
  } else if(it.type==='H'){
    if(!it.done){
      shadowAt(it.x,it.y+6,10,4,.3);
      c.strokeStyle='#8a8a98';c.lineWidth=2;c.beginPath();c.moveTo(it.x-13,it.y+8);c.lineTo(it.x-6,it.y+3);c.moveTo(it.x+13,it.y+8);c.lineTo(it.x+6,it.y+3);c.stroke();
      c.fillStyle='#4aa0d0';ell(c,it.x,it.y+1,8,9);c.fill();c.fillStyle='#f0d0b0';circ(c,it.x,it.y-3,5);c.fill();c.fillStyle='#6a4a2a';c.beginPath();c.arc(it.x,it.y-3.4,5.2,3.3,6.1);c.fill();
    }
  } else if(it.type==='L'){
    shadowAt(it.x,it.y+10,10,3.4,.3);
    c.fillStyle='#4a2c18';rr(c,it.x-8,it.y-3,16,13,2);c.fill();
    c.save();c.translate(it.x,it.y-4);c.rotate(-.12);c.fillStyle='#eadfd0';rr(c,-8,-5,16,9,1.5);c.fill();
    c.fillStyle='rgba(60,40,20,.4)';c.fillRect(-6,-3,5,1);c.fillRect(-6,-1,5,1);c.fillRect(1,-3,5,1);
    c.fillStyle='rgba(159,216,255,'+(.6+.4*Math.sin(t*3))+')';c.fillRect(-1,-5,2,9);c.restore();
  } else if(it.type==='P'&&(G.flight||G.d.timeshift)){
    c.fillStyle='#eadfd0';rr(c,it.x-9,it.y-6,18,12,1.5);c.fill();
    c.strokeStyle='rgba(60,40,20,.5)';c.beginPath();c.moveTo(it.x-9,it.y-6);c.lineTo(it.x,it.y+1);c.lineTo(it.x+9,it.y-6);c.stroke();
    c.fillStyle='#c44a4a';circ(c,it.x,it.y+1,3);c.fill();
  } else if(it.type==='P'){
    shadowAt(it.x,it.y+10,8,3,.3);
    c.fillStyle='#8a4ad0';c.beginPath();c.moveTo(it.x-8,it.y-9);c.lineTo(it.x+8,it.y-9);c.lineTo(it.x+4.4,it.y+2);c.lineTo(it.x-4.4,it.y+2);c.fill();
    c.fillStyle='#b88aff';ell(c,it.x,it.y-9,8,2.2);c.fill();
    c.fillStyle='#d8a24a';c.fillRect(it.x-1,it.y+2,2,6);c.fillRect(it.x-6,it.y+8,12,2.4);
    c.fillStyle='rgba(255,255,255,.4)';c.fillRect(it.x-5,it.y-7,1.6,6);
  } else if(it.type==='B'){
    const fl=Math.sin(t*14+it.ph)*1.5;
    shadowAt(it.x,it.y+10,10,3.4,.3);
    c.fillStyle='#2e2a30';c.fillRect(it.x-2,it.y+2,4,9);c.fillRect(it.x-8,it.y+9,16,2.4);
    c.fillStyle='#4a4650';c.beginPath();c.moveTo(it.x-10,it.y-2);c.lineTo(it.x+10,it.y-2);c.lineTo(it.x+6,it.y+5);c.lineTo(it.x-6,it.y+5);c.fill();
    c.fillStyle='rgba(255,255,255,.12)';c.fillRect(it.x-10,it.y-2,20,1.5);
    if(!it.done){
      const s=1+it.p*.5;
      c.fillStyle='#ff6a2a';c.beginPath();c.moveTo(it.x-7*s,it.y-2);c.quadraticCurveTo(it.x-8*s,it.y-13*s-fl,it.x+fl,it.y-19*s-fl);c.quadraticCurveTo(it.x+8*s,it.y-11*s,it.x+7*s,it.y-2);c.fill();
      c.fillStyle='#ffb040';c.beginPath();c.moveTo(it.x-4*s,it.y-2);c.quadraticCurveTo(it.x-4*s,it.y-9*s,it.x,it.y-13*s-fl);c.quadraticCurveTo(it.x+4*s,it.y-8*s,it.x+4*s,it.y-2);c.fill();
      c.fillStyle='#fff2b0';c.beginPath();c.moveTo(it.x-2,it.y-2);c.quadraticCurveTo(it.x-2,it.y-6,it.x,it.y-8);c.quadraticCurveTo(it.x+2,it.y-6,it.x+2,it.y-2);c.fill();
      if(it.p>0){c.strokeStyle='#ffd27a';c.lineWidth=3;c.beginPath();c.arc(it.x,it.y-4,17,-1.57,-1.57+6.28*it.p);c.stroke();}
    } else {
      c.fillStyle='#1c1816';ell(c,it.x,it.y-2,7,2.4);c.fill();c.fillStyle='rgba(255,70,20,.5)';ell(c,it.x+2,it.y-2,2.6,1);c.fill();
      for(let i=0;i<3;i++){const k=((t*.5+i*.33)%1);c.fillStyle='rgba(170,170,180,'+(.38*(1-k))+')';circ(c,it.x+Math.sin(k*5+i)*4,it.y-4-k*22,2+k*4);c.fill();}
    }
  }
  c.globalAlpha=1;
  if(G.holdT&&G.holdT.ref===it&&G.hold>0){
    c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=5;c.beginPath();c.arc(it.x,it.y,17,0,6.283);c.stroke();
    c.strokeStyle='#f0b44c';c.lineWidth=3;c.beginPath();c.arc(it.x,it.y,17,-1.57,-1.57+6.28*Math.min(1,G.hold/G.holdT.need));c.stroke();}
}
function drawVent(v){
  const c=ctx,vx=v.x*T,vy=v.y*T;
  c.fillStyle='#0c0606';rr(c,vx+3,vy+3,T-6,T-6,4);c.fill();
  c.strokeStyle='#3a2a28';c.lineWidth=1.4;rr(c,vx+3,vy+3,T-6,T-6,4);c.stroke();
  c.strokeStyle='#2a1c1a';for(let i=0;i<4;i++){c.beginPath();c.moveTo(vx+6,vy+8+i*5);c.lineTo(vx+T-6,vy+8+i*5);c.stroke();}
  if(v.warn){c.fillStyle='rgba(255,'+(100+Math.sin(G.time*30)*40|0)+',40,.45)';rr(c,vx+4,vy+4,T-8,T-8,3);c.fill();}
  if(v.on){
    const g=c.createRadialGradient(vx+16,vy+16,1,vx+16,vy+16,18);g.addColorStop(0,'rgba(255,240,170,.95)');g.addColorStop(.5,'rgba(255,130,30,.8)');g.addColorStop(1,'rgba(255,60,10,0)');
    c.fillStyle=g;circ(c,vx+16,vy+16,18+Math.random()*2);c.fill();
  }
}
function drawPed(pd){
  const c=ctx,t=G.time,ru=G.state==='ruin',col=ru?'#e0a070':'#b9c8ff';
  c.fillStyle='#1c1530';circ(c,pd.x,pd.y,14);c.fill();
  c.strokeStyle=col;c.lineWidth=2;circ(c,pd.x,pd.y,13);c.stroke();circ(c,pd.x,pd.y,6.5);c.stroke();
  c.save();c.translate(pd.x,pd.y);c.rotate(t*.6);
  for(let i=0;i<4;i++){c.rotate(1.5708);c.beginPath();c.moveTo(0,-6.5);c.lineTo(0,-13);c.stroke();}
  c.restore();
  c.fillStyle=col;c.globalAlpha=.5+.4*Math.sin(t*3);circ(c,pd.x,pd.y,2.4);c.fill();c.globalAlpha=1;
}
function drawExit(){
  const c=ctx,e=G.exit,t=G.time,open=G.exitOpen;
  if(G.flight){
    c.fillStyle=open?'rgba(60,200,110,.9)':'rgba(40,70,60,.9)';circ(c,e.x,e.y,17);c.fill();
    c.strokeStyle=open?'#bff5cf':'#5a7a66';c.lineWidth=2;circ(c,e.x,e.y,17);c.stroke();circ(c,e.x,e.y,11);c.stroke();
    c.fillStyle=open?'#bff5cf':'#5a7a66';c.font='bold 13px '+HEAD;c.textAlign='center';c.fillText('H',e.x,e.y+5);c.textAlign='left';
    if(open){c.strokeStyle='rgba(190,255,210,'+(.6*(1-((t*1.2)%1)))+')';c.lineWidth=2;circ(c,e.x,e.y,17+((t*1.2)%1)*14);c.stroke();}
    return;
  }
  const w=G.d.exitLabel?26:15;
  c.fillStyle='#0c0c10';rr(c,e.x-w-3,e.y-17,w*2+6,34,6);c.fill();
  const g=c.createLinearGradient(0,e.y-14,0,e.y+14);
  if(open){g.addColorStop(0,'#58c07a');g.addColorStop(1,'#1f6a3a');}else{g.addColorStop(0,'#3a4a40');g.addColorStop(1,'#222c26');}
  c.fillStyle=g;rr(c,e.x-w,e.y-14,w*2,28,5);c.fill();
  c.strokeStyle=open?'#bff5cf':'#566a5c';c.lineWidth=1.6;rr(c,e.x-w,e.y-14,w*2,28,5);c.stroke();
  c.fillStyle=open?'#eafff0':'#66786c';c.font='bold 10px '+HEAD;c.textAlign='center';c.fillText(G.d.exitLabel||'EXIT',e.x,e.y+4);c.textAlign='left';
  if(open){c.strokeStyle='rgba(190,255,210,'+(.5*(1-((t*1.1)%1)))+')';c.lineWidth=2;rr(c,e.x-w-((t*1.1)%1)*8,e.y-14-((t*1.1)%1)*8,w*2+((t*1.1)%1)*16,28+((t*1.1)%1)*16,8);c.stroke();}
}
function drawSmokeClouds(){
  const c=ctx,spr=softSprite('#c9c9d8');
  for(const s of G.smoke){
    const k=Math.min(1,s.t/2.5),grow=Math.min(1,(s.t0-s.t)/.5)*.35+.65;
    for(let i=0;i<9;i++){
      const a=i/9*6.283+G.time*.25+i,rr_=s.r*.55*(i%3?1:.4)*grow;
      const x=s.x+Math.cos(a)*rr_,y=s.y+Math.sin(a)*rr_*.9,r=s.r*(.5+(i%3)*.1)*grow;
      c.globalAlpha=.5*k;c.drawImage(spr,x-r,y-r,r*2,r*2);
    }
    const r=s.r*.95*grow;c.globalAlpha=.55*k;c.drawImage(spr,s.x-r,s.y-r,r*2,r*2);
    c.globalAlpha=1;
  }
}
function drawRings(){
  const c=ctx;
  for(const r of G.rings){
    const k=Math.min(1,r.t),rad=r.r*(1-k);
    c.strokeStyle='rgba('+r.c+','+Math.min(1,r.t*2)*.85+')';c.lineWidth=2.4;circ(c,r.x,r.y,rad);c.stroke();
    c.strokeStyle='rgba('+r.c+','+Math.min(1,r.t*2)*.35+')';c.lineWidth=1;circ(c,r.x,r.y,rad*.82);c.stroke();
  }
}
function drawParticles(){
  const c=ctx;
  for(let pass=0;pass<2;pass++){
    if(pass)c.globalCompositeOperation='lighter';
    for(const p of PT){
      if(!!p.add!==!!pass&&p.k!=='text')continue;
      if(p.k==='text'){ if(pass===0)continue; }
      const a=Math.max(0,p.l/p.m);
      if(p.k==='text'){
        c.globalCompositeOperation='source-over';c.globalAlpha=Math.min(1,a*2);c.font='bold '+p.s+'px '+HEAD;c.textAlign='center';
        c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=3;c.strokeText(p.txt,p.x,p.y);c.fillStyle=p.c;c.fillText(p.txt,p.x,p.y);c.textAlign='left';
        c.globalAlpha=1;c.globalCompositeOperation=pass?'lighter':'source-over';continue;
      }
      if(p.k==='smoke'){const r=p.s*(1.7-a*.6);c.globalAlpha=a*.55;c.drawImage(softSprite(p.c),p.x-r,p.y-r,r*2,r*2);continue;}
      c.globalAlpha=pass?a:a*.9;c.fillStyle=p.c;
      circ(c,p.x,p.y,Math.max(.3,p.s*(.35+a*.65)));c.fill();
    }
    c.globalAlpha=1;
  }
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
}

/* ---------- ambience ---------- */
let ambT=0;
function spawnAmbient(dt){
  if(!G)return;
  if(PT.length>Q.maxP*.7)return;
  const th=G.d.th,vr=viewRect(),kind=(G.state==='ruin'&&th.ruin&&th.ruin.part)||th.part;
  ambT+=dt;
  const rate=({ash:7,dust:6,gold:7,sea:9,sparks:5,fog:1.6,embers:8,wax:5}[kind]||5)*Q.amb*clamp(vr.w*vr.h/160000,.5,1.6);
  while(ambT>1/rate){
    ambT-=1/rate;
    const x=vr.x+Math.random()*vr.w,y=vr.y+Math.random()*vr.h;
    if(x<0||y<0||x>G.gw*T||y>G.gh*T)continue;
    if(!G.flight&&solidTile(Math.floor(x/T),Math.floor(y/T)))continue;
    switch(kind){
      case'ash':pt(x,y,14+Math.random()*10,10+Math.random()*12,6+Math.random()*3,.9+Math.random()*1.2,'rgba(200,196,210,.7)',{});break;
      case'dust':pt(x,y,(Math.random()-.5)*6,-2-Math.random()*4,5+Math.random()*4,.7+Math.random()*1.2,'#e8d8b0',{add:true});break;
      case'gold':pt(x,y,(Math.random()-.5)*5,-4-Math.random()*5,5+Math.random()*4,.8+Math.random()*1.2,'#ffd27a',{add:true});break;
      case'sea':pt(x,y,20+Math.random()*14,-3+Math.random()*6,3+Math.random()*2,.8+Math.random()*1.3,'rgba(225,245,255,.75)',{});break;
      case'sparks':pt(x,y,(Math.random()-.5)*14,-14-Math.random()*22,2+Math.random()*2,.8+Math.random()*1.2,'#ff9a3a',{add:true});break;
      case'embers':pt(x,y,(Math.random()-.5)*12,-6-Math.random()*14,3+Math.random()*3,.8+Math.random()*1.3,'#ff8a3a',{add:true});break;
      case'wax':pt(x,y,(Math.random()-.5)*4,-4-Math.random()*5,5+Math.random()*4,.7+Math.random()*1.1,'#ffcf8a',{add:true});break;
      case'fog':pt(x,y,6+Math.random()*7,(Math.random()-.5)*3,9+Math.random()*4,26+Math.random()*22,G.state==='ruin'?'#7a6a62':'#8aa8c8',{k:'smoke',gr:3});break;
    }
  }
}
/* tiny wildlife: rats on the floor, bats and gulls overhead, fireflies in the marsh */
function initCritters(){
  G.crit=[];
  const th=G.d.th;
  if(G.flight)return;
  const n=Math.round(4*Q.amb);
  for(let i=0;i<n;i++){
    for(let k=0;k<40;k++){
      const x=1+Math.floor(Math.random()*(G.gw-2)),y=1+Math.floor(Math.random()*(G.gh-2));
      if(isW(x,y)||Math.hypot(x*T-G.wren.x,y*T-G.wren.y)<5*T)continue;
      G.crit.push({k:'rat',x:x*T+16,y:y*T+16,a:Math.random()*6.28,s:0,t:Math.random()*3,ph:Math.random()*6});break;
    }
  }
  G.flyT=3+Math.random()*6;
}
function updateCritters(dt){
  if(!G||!G.crit)return;
  const chars=[G.wren,G.ash.on?G.ash:null];
  for(const r of G.crit){
    if(r.k==='rat'){
      let fx=0,fy=0,flee=false;
      for(const c of chars){if(!c)continue;const d=Math.max(.01,Math.hypot(r.x-c.x,r.y-c.y));if(d<58){flee=true;fx+=(r.x-c.x)/d+(d<1?Math.random()-.5:0);fy+=(r.y-c.y)/d;}}
      if(flee){r.a=Math.atan2(fy,fx);r.s=125;r.t=1.5;}
      else{r.t-=dt;if(r.t<=0){r.t=.6+Math.random()*3.2;if(Math.random()<.45){r.s=0;}else{r.a+=(Math.random()-.5)*2.4;r.s=34+Math.random()*30;}}}
      if(r.s>0){
        const nx=r.x+Math.cos(r.a)*r.s*dt,ny=r.y+Math.sin(r.a)*r.s*dt;
        if(blocked(nx,ny,4)){r.a+=2+Math.random();r.s*=.5;}else{r.x=nx;r.y=ny;r.ph+=dt*r.s*.3;}
        if(!flee)r.s*=.985;
      }
    } else {
      r.x+=Math.cos(r.a)*r.s*dt;r.y+=Math.sin(r.a)*r.s*dt;r.ph+=dt*14;
      if(r.x<-80||r.x>G.gw*T+80||r.y<-80||r.y>G.gh*T+80)r.dead=true;
    }
  }
  G.crit=G.crit.filter(r=>!r.dead);
  // occasional flyers
  G.flyT-=dt;
  if(G.flyT<=0){
    G.flyT=9+Math.random()*14;
    const kind=G.flight?'gull':(G.d.th.part==='fog'?null:(['ash','dust'].includes(G.d.th.part)?'bat':null));
    if(kind){
      const W=G.gw*T,H=G.gh*T,left=Math.random()<.5,y=Math.random()*H;
      G.crit.push({k:kind,x:left?-30:W+30,y,a:left?(Math.random()-.5)*.6:Math.PI+(Math.random()-.5)*.6,s:kind==='gull'?55:80,ph:Math.random()*6});
    }
  }
}
function drawCritters(){
  const c=ctx;
  for(const r of G.crit||[]){
    if(r.k==='rat'){
      shadowAt(r.x,r.y+2,4,2,.25);
      c.save();c.translate(r.x,r.y);c.rotate(r.a);
      c.strokeStyle='#8a6a60';c.lineWidth=.9;c.beginPath();c.moveTo(-3,0);c.quadraticCurveTo(-7,Math.sin(r.ph)*2,-9,Math.sin(r.ph*1.3)*2.4);c.stroke();
      c.fillStyle='#4a3e3a';ell(c,0,0,4.2,2.6);c.fill();
      c.fillStyle='#5a4c46';ell(c,3.8,0,2.2,1.6);c.fill();
      c.fillStyle='#c88a8a';circ(c,2.6,-1.8,.9);c.fill();circ(c,2.6,1.8,.9);c.fill();
      c.fillStyle='#ff4a4a';c.fillRect(5,-.5,.8,.8);
      c.restore();
    }
  }
}
function drawFlyers(){
  const c=ctx;
  for(const r of G.crit||[]){
    if(r.k==='bat'||r.k==='gull'){
      const f=Math.sin(r.ph);
      c.save();c.translate(r.x,r.y);c.rotate(r.a);
      c.fillStyle='rgba(0,0,0,.25)';ell(c,6,10,5,2);c.fill();
      c.fillStyle=r.k==='bat'?'#14101c':'#e8f0f4';
      c.beginPath();c.moveTo(4,0);c.lineTo(-2,-8-f*5);c.lineTo(-4,-3);c.lineTo(-6,0);c.lineTo(-4,3);c.lineTo(-2,8+f*5);c.closePath();c.fill();
      c.restore();
    }
  }
}
function drawSea(){
  const c=ctx,vr=viewRect(),t=G.time;
  c.save();c.beginPath();
  c.strokeStyle='rgba(190,235,245,.10)';c.lineWidth=1.4;
  const y0=Math.floor(vr.y/16)*16,y1=vr.y+vr.h+16,x0=Math.max(0,vr.x-16),x1=Math.min(G.gw*T,vr.x+vr.w+16);
  for(let y=y0;y<y1;y+=16){
    c.beginPath();
    for(let x=x0;x<=x1;x+=12){
      const yy=y+Math.sin(x*.03+t*1.4+y*.07)*3;
      x===x0?c.moveTo(x,yy):c.lineTo(x,yy);
    }
    c.stroke();
  }
  c.strokeStyle='rgba(255,255,255,.05)';
  for(let y=y0+8;y<y1;y+=32){c.beginPath();for(let x=x0;x<=x1;x+=12){const yy=y+Math.sin(x*.045-t*1.1+y)*2.4;x===x0?c.moveTo(x,yy):c.lineTo(x,yy);}c.stroke();}
  c.restore();
  // roof tops over the water, masked by walls: redraw static would hide; the waves are drawn then roofs re-blit below
}
function drawFlames(){
  const t=G.time,c=ctx;
  for(const tr of G.torches||[]){
    if(tr.out){continue;}
    const f=Math.sin(t*10+tr.ph)*1.2,f2=Math.sin(t*17+tr.ph*2);
    if(tr.pipe){c.fillStyle='rgba(255,'+(110+f2*30|0)+',40,.6)';circ(c,tr.x,tr.y,2.4);c.fill();continue;}
    const q=tr.s?tr.s*.7:1;c.save();c.translate(tr.x,tr.y);c.scale(q,q);c.translate(-tr.x,-tr.y);
    c.fillStyle='rgba('+tr.col+',.95)';c.beginPath();c.moveTo(tr.x+f*.4,tr.y-8-f);c.quadraticCurveTo(tr.x+4,tr.y-2,tr.x,tr.y+1);c.quadraticCurveTo(tr.x-4,tr.y-2,tr.x+f*.4,tr.y-8-f);c.fill();
    c.fillStyle='rgba(255,246,190,.95)';c.beginPath();c.moveTo(tr.x,tr.y-5);c.quadraticCurveTo(tr.x+1.8,tr.y-2,tr.x,tr.y);c.quadraticCurveTo(tr.x-1.8,tr.y-2,tr.x,tr.y-5);c.fill();
    c.restore();
    if(Math.random()<.02*Q.amb)pt(tr.x,tr.y-8,(Math.random()-.5)*8,-18-Math.random()*10,.9,.9,'#ffb040',{add:true});
  }
}
function drawBeams(){
  const c=ctx,t=G.time;
  if(!G.beams||!G.beams.length)return;
  c.globalCompositeOperation='lighter';
  for(const b of G.beams){
    const g=c.createLinearGradient(b.x,b.y,b.x+30,b.y+120);
    g.addColorStop(0,'rgba(150,170,255,.16)');g.addColorStop(1,'rgba(150,170,255,0)');
    c.fillStyle=g;c.beginPath();c.moveTo(b.x-9,b.y);c.lineTo(b.x+9,b.y);c.lineTo(b.x+66,b.y+122);c.lineTo(b.x+22,b.y+122);c.closePath();c.fill();
  }
  c.globalCompositeOperation='source-over';
}

/* ---------- full world draw ---------- */
function drawWorld(){
  const c=ctx;
  if(G.dirty||!G.lightsBaked){bakeStatic();G.dirty=false;}
  c.setTransform(1,0,0,1,0,0);
  c.fillStyle='#050308';c.fillRect(0,0,cv.width,cv.height);
  drawBackdrop();
  setWorldTransform();
  const W=G.gw*T,H=G.gh*T;
  c.imageSmoothingEnabled=true;
  c.drawImage(ST.cv,0,0,ST.cv.width,ST.cv.height,0,0,W,H);
  if(G.flight){
    // waves under the roofs: clip out wall tiles
    c.save();c.beginPath();
    for(let y=0;y<G.gh;y++)for(let x=0;x<G.gw;x++)if(G.grid[y][x]!=='#')c.rect(x*T,y*T,T,T);
    c.clip();drawSea();c.restore();
  }
  drawBeams();
  // doors, cracks, props
  for(const k in G.doors)drawDoor(G.doors[k]);
  for(const k in G.cracks)drawCrack(G.cracks[k]);
  for(const v of G.vents)drawVent(v);
  for(const pd of G.peds)drawPed(pd);
  drawExit();
  if(G.d.bellAt){ // abbey bell on its frame
    const bx=G.d.bellAt[0]*T+16,by=G.d.bellAt[1]*T+16;
    shadowAt(bx+2,by+8,17,7,.3);
    c.fillStyle='#5a4a30';c.fillRect(bx-19,by-3,38,4);
    const gr=c.createRadialGradient(bx-3,by-4,2,bx,by,15);gr.addColorStop(0,'#f0d070');gr.addColorStop(1,'#8a6a20');
    c.fillStyle=gr;circ(c,bx,by,14);c.fill();c.strokeStyle='#5a3a10';c.lineWidth=1.4;circ(c,bx,by,9);c.stroke();circ(c,bx,by,4);c.stroke();
  }
  for(const it of G.items)drawItem(it);
  drawPots();
  drawBraziers();
  drawChestsInsp();
  drawPickups();
  drawCritters();
  drawFlames();
  // entities sorted by y with shadows
  const ents=[];
  const big=(o,fn,s)=>()=>{const c2=ctx;c2.save();c2.translate(o.x,o.y);c2.scale(s,s);c2.translate(-o.x,-o.y);fn();c2.restore();};
  for(const g of G.guards)if(!g.boss)ents.push([g.y,(g.spin||(G.flight&&!g.spin))?()=>drawGuard(g):big(g,()=>drawGuard(g),1.22)]);
  if(G.boss)ents.push([G.boss.y,()=>drawBoss(G.boss)]);
  for(const f of G.foes)ents.push([f.y,big(f,()=>drawFoe(f),1.15)]);
  if(G.guests&&G.state==='ball')for(const s of G.guests)ents.push([s.y,big(s,()=>drawGuest(s),1.2)]);
  if(G.host&&G.host.on)ents.push([G.host.y,big(G.host,()=>drawHost(G.host),1.22)]);
  if(!G.wren.hidden)ents.push([G.wren.y,big(G.wren,()=>drawWren(G.wren,G.active==='wren'),1.25)]);
  if(G.ash.on)ents.push([G.ash.y+(G.flight?30:0),big(G.ash,()=>drawAsh(G.ash,G.active==='ash'),G.flight?1:1.22)]);
  ents.sort((a,b)=>a[0]-b[0]);
  drawDarkness();
  drawSmokeClouds();
  drawTelegraphs();
  drawCones();
  for(const e of ents)e[1]();
  // active ring
  const act=G.active==='wren'?G.wren:G.ash;
  if(!(G.active==='wren'&&G.wren.hidden)){
    const pulse=.55+.25*Math.sin(G.time*5);
    c.strokeStyle='rgba(255,255,255,'+pulse+')';c.lineWidth=1.6;
    c.beginPath();c.arc(act.x,act.y+(G.flight&&G.active==='ash'?0:0),G.active==='wren'?14:(G.flight?20:16),0,6.283);c.stroke();
  }
  if(G.sneak){c.strokeStyle='rgba(200,180,255,.45)';c.lineWidth=1;c.setLineDash([2,3]);circ(c,G.wren.x,G.wren.y,18);c.stroke();c.setLineDash([]);}
  // dash cooldown ring on Ashling
  if(G.ash.on&&G.active==='ash'&&G.dash.ch<G.dash.max&&G.dash.cd>0){
    const cd=G.dash.cd/dashCD();
    c.strokeStyle='rgba(255,154,74,.5)';c.lineWidth=2;c.beginPath();c.arc(G.ash.x,G.ash.y,20,-1.57,-1.57+6.283*(1-cd));c.stroke();
  }
  // boss telegraph
  if(G.boss&&G.boss.blink){
    const q=G.boss.blink,k=1-q.t/1.3;
    c.strokeStyle='rgba(255,130,60,'+(.5+.5*Math.sin(G.time*14))+')';c.lineWidth=3;
    circ(c,q.x,q.y,18);c.stroke();circ(c,q.x,q.y,8);c.stroke();
    c.strokeStyle='rgba(255,130,60,.35)';circ(c,q.x,q.y,18+(1-k)*20);c.stroke();
  }
  for(const g of G.guards)drawMarkers(g);
  drawRings();
  c.imageSmoothingEnabled=true;c.drawImage(FG.cv,0,0,FG.cv.width,FG.cv.height,0,0,W,H);
  if(G.state!=='ruin')drawChandeliers();
  drawParticles();
  drawFlyers();
  // time-state tints
  if(G.state==='ruin'){c.fillStyle='rgba(70,20,10,.14)';c.fillRect(0,0,W,H);}
  else if(G.state==='ball'){c.fillStyle='rgba(40,60,130,.05)';c.fillRect(0,0,W,H);}
  if(G.state==='ball'&&G.d.th.part==='fog')drawFogLayer();
  drawPrompt();
}
function drawFogLayer(){
  const c=ctx,vr=viewRect(),t=G.time;
  c.globalAlpha=.10;
  for(let i=0;i<6;i++){
    const x=((i*173+t*(5+i*2))%(G.gw*T+240))-120,y=60+((i*97)%(G.gh*T-100));
    const g=c.createRadialGradient(x,y,4,x,y,130);g.addColorStop(0,'rgba(170,200,230,.9)');g.addColorStop(1,'rgba(170,200,230,0)');
    c.fillStyle=g;c.fillRect(x-130,y-130,260,260);
  }
  c.globalAlpha=1;
}
function drawPrompt(){
  if(!G.prompt||G.hold>0||mode!=='play')return;
  const p=G.prompt,c=ctx;
  const key=V.coarse?'ACT':'E';
  c.font='bold 9px '+HEAD;
  const label=p.label,tw=c.measureText(label).width,w=tw+(V.coarse?32:22)+8,h=15;
  const x=p.x-w/2,y=p.y-30+Math.sin(G.time*4)*1.5;
  c.fillStyle='rgba(14,10,20,.88)';rr(c,x,y,w,h,5);c.fill();
  c.strokeStyle='rgba(240,180,76,.8)';c.lineWidth=1;rr(c,x,y,w,h,5);c.stroke();
  c.fillStyle='#f0b44c';rr(c,x+3,y+2.5,V.coarse?24:14,10,3);c.fill();
  c.fillStyle='#1a1018';c.textAlign='center';c.fillText(key,x+3+(V.coarse?12:7),y+10);
  c.fillStyle='#eadfd0';c.textAlign='left';c.fillText(label,x+(V.coarse?32:22),y+10.2);
  c.fillStyle='rgba(14,10,20,.88)';c.beginPath();c.moveTo(p.x-4,y+h);c.lineTo(p.x+4,y+h);c.lineTo(p.x,y+h+4);c.fill();
}

/* ---------- parallax scenery behind and around the level ---------- */
const BGPAL={
  night:{sky:['#05030c','#150c28','#3a1a3a'],mt:['#22152e','#170e22','#0d0716'],hz:.66},
  dusk:{sky:['#140a14','#5a2030','#e8883a'],mt:['#3a1a24','#2a1018','#1a0a10'],hz:.7},
  moon:{sky:['#04060f','#0c1830','#27406a'],mt:['#16243c','#0e1a2e','#08101e'],hz:.68},
  forge:{sky:['#100403','#3a0c06','#d4501c'],mt:['#3a1410','#26100c','#160806'],hz:.72},
  marsh:{sky:['#040a18','#0e2238','#2a5a6e'],mt:['#10283a','#0c1c2c','#08121e'],hz:.7},
  marshR:{sky:['#100806','#3a1c10','#b0602c'],mt:['#3a2418','#26160e','#160c08'],hz:.7},
  crown:{sky:['#040208','#1a0c28','#5a3058'],mt:['#2a1830','#1a1022','#0e0816'],hz:.7},
  sea:{sky:['#06202c','#0a3646','#124e5e'],mt:['#0a3040','#082838','#061e2c'],hz:.5}
};
const BGC={pk:{},stars:null};
function bgPeaks(key,n,seed){
  if(BGC.pk[key])return BGC.pk[key];
  const r=mulberry(seed),a=[];let v=.5;
  for(let i=0;i<n;i++){v+=(r()-.5)*.55;v=clamp(v,.12,.95);a.push(v);}
  return BGC.pk[key]=a;
}
function mountLayer(c,key,col,f,base,amp,W,H){
  const pk=bgPeaks(key,46,key.length*131+f*1000|0),span=W*2,
    x0=-(V.cx-V.ww/2)*V.sc*f-span/2+W/2,yo=-(V.cy-V.wh/2)*V.sc*f*.4;
  c.fillStyle=col;c.beginPath();c.moveTo(x0,H+10);
  pk.forEach((v,i)=>c.lineTo(x0+i/(pk.length-1)*span,base+yo-v*amp));
  c.lineTo(x0+span,H+10);c.closePath();c.fill();
}
function drawBackdrop(){
  const c=ctx,W=V.w,H=V.h,t=G.time;
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  let kind=G.d.th.bg||'night';
  if(kind==='marsh'&&G.state==='ruin')kind='marshR';
  const P=BGPAL[kind]||BGPAL.night,hz=H*P.hz;
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,P.sky[0]);sky.addColorStop(.55,P.sky[1]);sky.addColorStop(1,P.sky[2]);
  c.fillStyle=sky;c.fillRect(0,0,W,H);
  if(kind==='sea')return;
  const px=-(V.cx-V.ww/2)*V.sc*.03;
  if(!BGC.stars){const r=mulberry(5);BGC.stars=Array.from({length:110},()=>({x:r(),y:r()*.6,s:r()*1.5+.4,ph:r()*6}));}
  if(kind!=='forge'&&kind!=='dusk'&&kind!=='marshR'){
    for(const s of BGC.stars){c.globalAlpha=.25+.6*Math.abs(Math.sin(t*.7+s.ph));c.fillStyle='#fff';c.fillRect(((s.x*W+px)%W+W)%W,s.y*H,s.s,s.s);}
    c.globalAlpha=1;
  }
  // celestial body
  const bx=W*.78+px*2,by=H*.2;
  if(kind==='night'||kind==='moon'||kind==='marsh'){
    const mr=Math.min(W,H)*(kind==='moon'?.1:.07);
    let g=c.createRadialGradient(bx,by,mr*.7,bx,by,mr*5);g.addColorStop(0,kind==='marsh'?'rgba(170,230,255,.3)':'rgba(255,230,190,.32)');g.addColorStop(1,'rgba(255,230,190,0)');c.fillStyle=g;c.fillRect(bx-mr*5,by-mr*5,mr*10,mr*10);
    g=c.createRadialGradient(bx-mr*.3,by-mr*.3,mr*.1,bx,by,mr);g.addColorStop(0,'#fff8e8');g.addColorStop(1,kind==='marsh'?'#a8d8ea':'#e8c890');c.fillStyle=g;circ(c,bx,by,mr);c.fill();
    c.fillStyle='rgba(120,100,80,.2)';circ(c,bx-mr*.3,by+mr*.1,mr*.2);c.fill();circ(c,bx+mr*.3,by-mr*.25,mr*.14);c.fill();
  } else if(kind==='dusk'){
    const g=c.createRadialGradient(W*.3,hz,10,W*.3,hz,H*.7);g.addColorStop(0,'rgba(255,200,110,.7)');g.addColorStop(1,'rgba(255,120,60,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
  } else if(kind==='crown'){
    const cx=W/2+px*3,cy=H*.38;
    c.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){const g=c.createRadialGradient(cx,cy,10,cx,cy,H*(.5+i*.2));g.addColorStop(0,'rgba(255,190,90,'+(.2-i*.05)+')');g.addColorStop(1,'rgba(255,190,90,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
    c.strokeStyle='rgba(255,210,120,.25)';c.lineWidth=2;circ(c,cx,cy,H*.2+Math.sin(t)*3);c.stroke();circ(c,cx,cy,H*.26);c.stroke();
    c.globalCompositeOperation='source-over';
  } else if(kind==='forge'){
    const g=c.createLinearGradient(0,hz-H*.3,0,H);g.addColorStop(0,'rgba(255,90,20,0)');g.addColorStop(1,'rgba(255,120,30,.45)');c.fillStyle=g;c.fillRect(0,hz-H*.3,W,H);
    for(let i=0;i<5;i++){const x=((i*W/4.2+px*(1+i*.2)+t*(3+i))%(W+200))-100,gg=c.createLinearGradient(0,hz,0,0);gg.addColorStop(0,'rgba(40,16,12,.55)');gg.addColorStop(1,'rgba(40,16,12,0)');
      c.fillStyle=gg;c.fillRect(x-24,0,48+i*6,hz);}
  }
  // drifting clouds / mist bands
  if(kind!=='forge'&&kind!=='crown'){
    for(let i=0;i<4;i++){
      const x=((i*W*.37+t*(4+i*2)+px*2)%(W+500))-250,y=H*(.18+i*.1);
      const g=c.createRadialGradient(x,y,5,x,y,190);g.addColorStop(0,kind==='dusk'?'rgba(255,170,110,.18)':'rgba(120,110,170,.12)');g.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=g;c.fillRect(x-190,y-70,380,140);
    }
  }
  mountLayer(c,kind+'a',P.mt[0],.05,hz-H*.02,H*.34,W,H);
  mountLayer(c,kind+'b',P.mt[1],.1,hz+H*.06,H*.3,W,H);
  // distant lights on the middle range
  if(kind==='night'||kind==='dusk'||kind==='forge'){
    c.globalCompositeOperation='lighter';
    for(let i=0;i<9;i++){const x=((i*113+60+px*4)%W+W)%W,y=hz+H*.1+((i*37)%30);c.fillStyle='rgba(255,'+(150+i*8)+',70,'+(.5+.4*Math.sin(t*3+i))+')';c.fillRect(x,y,2.2,2.2);}
    c.globalCompositeOperation='source-over';
  }
  mountLayer(c,kind+'c',P.mt[2],.2,hz+H*.16,H*.26,W,H);
  // pines / reeds on the nearest layer
  if(kind==='moon'||kind==='marsh'||kind==='marshR'){
    const r=mulberry(11),off=-(V.cx-V.ww/2)*V.sc*.3;
    c.fillStyle=kind==='moon'?'#050a14':'#040c14';
    for(let i=0;i<36;i++){
      const x=((r()*W*1.6+off)%(W*1.6)+W*1.6)%(W*1.6)-W*.3,y=hz+H*.2+r()*H*.1,h=H*(.08+r()*.1);
      if(kind==='moon'){c.beginPath();c.moveTo(x,y-h);c.lineTo(x+h*.22,y);c.lineTo(x-h*.22,y);c.closePath();c.fill();c.beginPath();c.moveTo(x,y-h*.7);c.lineTo(x+h*.3,y-h*.15);c.lineTo(x-h*.3,y-h*.15);c.closePath();c.fill();}
      else{c.strokeStyle=c.fillStyle;c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.sin(t*.8+i)*4,y-h*.6,x+h*.15+Math.sin(t*.8+i)*5,y-h);c.stroke();}
    }
  }
  // low mist
  const mg=c.createLinearGradient(0,hz,0,H);
  mg.addColorStop(0,kind==='forge'?'rgba(200,70,30,.0)':'rgba(120,130,170,0)');mg.addColorStop(1,kind==='forge'?'rgba(200,70,30,.25)':'rgba(100,110,150,.2)');
  c.fillStyle=mg;c.fillRect(0,hz,W,H-hz);
}
