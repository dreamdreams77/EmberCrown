'use strict';
/* EMBERCROWN - sprite cache and house guard art.
   Static figure parts are painted once into offscreen canvases (4x world scale) and stamped with one drawImage,
   so richer art costs fewer canvas calls per frame than the old immediate-mode figures. */
const SPR={S:(typeof window!=='undefined'&&('ontouchstart' in window))?3:4,m:new Map(),bakes:0,
  get(key,w,h,fn){
    let s=this.m.get(key);
    if(!s){
      if(this.m.size>220)this.m.clear();
      const cv=document.createElement('canvas');cv.width=Math.ceil(w*this.S);cv.height=Math.ceil(h*this.S);
      const c=cv.getContext('2d');c.scale(this.S,this.S);c.translate(w/2,h/2);c.lineJoin='round';c.lineCap='round';
      fn(c);s=cv;this.m.set(key,s);this.bakes++;
    }
    return s;
  },
  draw(c,key,w,h,fn,x,y){c.drawImage(this.get(key,w,h,fn),(x||0)-w/2,(y||0)-h/2,w,h);}
};
const INK='#140a1e';
/* closed smooth outline through control points (quadratic mid-point spline) */
function blob(c,p){
  const n=p.length>>1;c.beginPath();c.moveTo((p[0]+p[n*2-2])/2,(p[1]+p[n*2-1])/2);
  for(let i=0;i<n;i++){const j=(i+1)%n;c.quadraticCurveTo(p[i*2],p[i*2+1],(p[i*2]+p[j*2])/2,(p[i*2+1]+p[j*2+1])/2);}
  c.closePath();
}
function poly(c,p){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();}
function inked(c,fill,lw,ol){c.fillStyle=fill;c.fill();c.strokeStyle=ol||INK;c.lineWidth=lw||1;c.stroke();}
/* cel shading: the path is filled with a shadow tone, a lit core, an optional highlight, then inked.
   lit / hi are ellipses [x,y,rx,ry,rot]. Colours must be #rrggbb. */
function cel(c,path,base,lit,hi,lw,ol){
  path();c.save();c.clip();
  c.fillStyle=sh(base,.58);c.fillRect(-80,-80,160,160);
  c.fillStyle=base;ell(c,lit[0],lit[1],lit[2],lit[3],lit[4]||0);c.fill();
  if(hi){c.fillStyle=sh(base,1.34);ell(c,hi[0],hi[1],hi[2],hi[3],hi[4]||0);c.fill();}
  c.restore();path();c.strokeStyle=ol||INK;c.lineWidth=lw||1;c.stroke();
}
function line(c,p,col,lw){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.strokeStyle=col;c.lineWidth=lw;c.stroke();}
/* weapon shaft with ink edge */
function shaft(c,x0,y0,x1,y1,col,lw){line(c,[x0,y0,x1,y1],INK,lw+1.2);line(c,[x0,y0,x1,y1],col,lw);}
function stillFace(c,x,y,sc,mood,eye){ // drawFace without a baked-in blink
  const ph=1-((G.time*.7)%3.7)+3.7;drawFace(c,x,y,sc,mood,ph,eye);
}

/* ---------- house palettes ---------- */
const HOUSE_ART={
  marrow:   {body:'#3a3542',plate:'#e9e2cf',trim:'#b9ae93',cloth:'#5a5262',glow:'#cfe6ff',hound:'#d8d0bc'},
  grell:    {body:'#a3262e',plate:'#e2b040',trim:'#ffd97a',cloth:'#6a141c',glow:'#ffd27a',hound:'#8a4a2a'},
  ostrander:{body:'#2c7d99',plate:'#bfe6f0',trim:'#eefaff',cloth:'#1c4f6a',glow:'#8fe8ff',hound:'#4a6a78'},
  sable:    {body:'#1e1b28',plate:'#34304a',trim:'#c9c4e0',cloth:'#12101a',glow:'#b79aff',hound:'#2a2634'},
  kest:     {body:'#5d626c',plate:'#868c98',trim:'#d9803a',cloth:'#3a3c44',glow:'#ff9a3a',hound:'#55504c'},
  dunmoor:  {body:'#34508c',plate:'#f1f1f6',trim:'#c8d4f0',cloth:'#1c2a52',glow:'#a8c8ff',hound:'#6a7aa0'},
  hallow:   {body:'#e6d9a8',plate:'#f6eecb',trim:'#e0a038',cloth:'#b89a58',glow:'#ffc860',hound:'#d8c890'}
};
function houseKey(){const d=G&&G.d;return d&&HOUSE_ART[d.sigil]?d.sigil:'marrow';}
const SKINS=['#e8c8a8','#d8b090','#c89a78','#a87a58'];
const TORSO=[6.5,0,5,-5.5,2,-9.6,-4,-8.6,-6.2,0,-4,8.6,2,9.6,5,5.5];

/* ---------- weapons (drawn under the body, held on the right: +y) ---------- */
function houseWeapon(c,h,kind,H){
  const y=9.6,L=kind==='brute'?15:22;
  if(kind==='archer'){ // bow on the left with a nocked arrow, quiver across the back
    c.save();c.translate(-6,3);c.rotate(.5);rr(c,-4,-2,9,4,1.5);inked(c,'#5a3a22',.8);
    for(let i=0;i<3;i++){c.fillStyle=i===1?H.trim:H.plate;c.fillRect(-6.4,-1.6+i*1.2,2.6,.9);}c.restore();
    c.beginPath();c.arc(5,-9,9.5,-1.15,1.15);c.strokeStyle=INK;c.lineWidth=3;c.stroke();c.strokeStyle=h==='marrow'?'#e9e2cf':h==='hallow'?'#e0a038':'#8a5a30';c.lineWidth=1.7;c.stroke();
    line(c,[5+9.5*Math.cos(-1.15),-9+9.5*Math.sin(-1.15),7,-9,5+9.5*Math.cos(1.15),-9+9.5*Math.sin(1.15)],'rgba(240,240,230,.8)',.6);
    shaft(c,7,-9,19,-9,'#c8b890',.8);poly(c,[19,-10.3,22.5,-9,19,-7.7]);inked(c,'#dfe4ee',.6);
    return;
  }
  if(h==='marrow'){ // bone glaive
    shaft(c,-9,y,L,y,'#6a5a48',1.5);
    c.beginPath();c.moveTo(L-1,y-1);c.quadraticCurveTo(L+5,y-4.4,L+9,y+.4);c.quadraticCurveTo(L+4,y+1.6,L-1,y+1.2);c.closePath();inked(c,'#efe8d6',.8);
    circ(c,L-2,y,1.5);inked(c,'#d8d0bc',.6);
  } else if(h==='grell'){ // gilded halberd
    shaft(c,-9,y,L+5,y,'#7a3a22',1.5);
    poly(c,[L-3,y,L-1,y-5.4,L+3.5,y-3.4,L+2,y]);inked(c,'#e2b040',.8);
    poly(c,[L+3,y-1.2,L+8,y,L+3,y+1.2]);inked(c,'#f4f4f8',.6);
    poly(c,[L-2,y,L-.5,y+3,L+1.5,y]);inked(c,'#c8982e',.6);
  } else if(h==='ostrander'){ // trident
    shaft(c,-9,y,L+1,y,'#3a6878',1.5);
    for(const s of[-1,0,1]){line(c,[L+1,y+s*2.6,L+7-Math.abs(s)*1.4,y+s*2.6],INK,2.2);line(c,[L+1,y+s*2.6,L+7-Math.abs(s)*1.4,y+s*2.6],'#dff6ff',1.1);}
    line(c,[L+1,y-2.6,L+1,y+2.6],INK,2.2);line(c,[L+1,y-2.6,L+1,y+2.6],'#bfe6f0',1.1);
  } else if(h==='sable'){ // staff and hanging censer
    shaft(c,-10,y,L+2,y,'#2e2838',1.6);
    line(c,[L+2,y,L+4.5,y-2.6],'#c9c4e0',.6);
    circ(c,L+5,y-3.6,2.3);inked(c,'#3a3450',.8);circ(c,L+5,y-3.6,1);c.fillStyle='#b79aff';c.fill();
  } else if(h==='kest'){ // war hammer
    shaft(c,-8,y,L,y,'#4a4038',1.9);
    rr(c,L-2,y-4.4,5.6,8.8,1);inked(c,'#868c98',.9);c.fillStyle='#b4bac6';c.fillRect(L-1.4,y-3.8,1.4,7.6);
    poly(c,[L+3.6,y-1.6,L+6.6,y,L+3.6,y+1.6]);inked(c,'#d9803a',.6);
  } else if(h==='dunmoor'){ // rapier with a basket hilt
    shaft(c,6,y,L+7,y,'#eef2fa',.7);
    c.beginPath();c.arc(7,y,2.6,-1.7,1.7);c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();c.strokeStyle='#c8d4f0';c.lineWidth=.9;c.stroke();
  } else { // hallow: a long candle-snuffer pole
    shaft(c,-9,y,L+1,y,'#8a6a3a',1.4);
    poly(c,[L+1,y-.9,L+6.5,y-3.2,L+6.5,y+3.2,L+1,y+.9]);inked(c,'#e0a038',.8);
    c.fillStyle='#3a2a10';ell(c,L+6.2,y,.9,2.4);c.fill();
  }
}
/* ---------- torso, shoulders and house dress ---------- */
function houseBody(c,h,kind,H){
  const T=()=>blob(c,TORSO);
  if(kind==='archer'){ // travelling cloak
    blob(c,[1,-8.6,-9,-9.6,-14.5,-4,-12.5,0,-14.5,4,-9,9.6,1,8.6]);inked(c,H.cloth,1);
    line(c,[-3,-6,-11,-5],sh(H.cloth,1.5),.6);line(c,[-3,6,-11,5],sh(H.cloth,1.5),.6);
  }
  if(h==='sable'){ // habit: one wide draped shape, bell sleeves instead of armour
    cel(c,()=>blob(c,[6,0,4,-6,3,-11.5,-3,-12,-7,-7,-9.5,0,-7,7,-3,12,3,11.5,4,6]),H.body,[1,0,6,9],[2,-3,2.6,1.6,.3],1.1);
    line(c,[-6,-5,-2,-9.5],sh(H.body,1.9),.6);line(c,[-6,5,-2,9.5],sh(H.body,1.9),.6);line(c,[-8,0,-3,0],sh(H.body,1.9),.6);
    c.beginPath();c.arc(1.5,0,6.6,-1.9,1.9);c.strokeStyle='#c9c4e0';c.lineWidth=.7;c.setLineDash([.8,.9]);c.stroke();c.setLineDash([]);
    circ(c,7.6,2.6,1.3);inked(c,'#c9c4e0',.5);
    return;
  }
  if(h==='kest'){ // riveted plate: angular silhouette
    const K=()=>poly(c,[6.6,-4,4,-9.4,-4.6,-9.4,-6.6,-5,-6.6,5,-4.6,9.4,4,9.4,6.6,4]);
    cel(c,K,H.body,[1,0,5.4,8],[2.4,-3,2.6,1.4],1.2);
    line(c,[-1,-9,-1,9],'rgba(20,10,30,.55)',.7);
    c.fillStyle='#ff9a3a';c.fillRect(-5.6,-2,1.6,4);c.fillStyle='#ffe0a0';c.fillRect(-5.2,-1.2,.8,2.4);
    c.fillStyle='#2a2a32';for(const y of[-7,-3.5,3.5,7])for(const x of[1,4]){circ(c,x,y,.5);c.fill();}
    if(kind!=='archer')for(const s of[-1,1]){rr(c,-4.4,s*9.6-3.4,8.4,6.8,1);inked(c,H.plate,1);c.fillStyle='#2a2a32';circ(c,-2.6,s*9.6,.6);c.fill();circ(c,2.2,s*9.6,.6);c.fill();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-3.4,s*9.6-2.6,6.4,1);}
    line(c,[-6.4,-7.6,-9,-5,-9,5,-6.4,7.6],'#b8682a',1.1);
    return;
  }
  if(h==='hallow'){ // wax: a dripping, melted outline
    const W=()=>blob(c,[6.6,0,5,-5.5,3,-10.4,-1,-9,-4,-11,-5.6,-6,-8.4,-4,-6.4,0,-8.8,3.6,-5.6,6,-4.4,10.8,-1,9,3,10.4,5,5.5]);
    cel(c,W,H.body,[1.4,0,5,7.4],[2.6,-3,2.6,1.5,.2],1.1,'#4a3414');
    c.fillStyle='rgba(224,160,56,.5)';for(const p of[[-5,-7],[-6.6,2.4],[-3,8.4],[-2,-3]]){ell(c,p[0],p[1],1.5,1);c.fill();}
    if(kind!=='archer')for(const s of[-1,1]){ // candle-stub shoulders
      blob(c,[3.6,s*9.6,0,s*13.2,-3.8,s*9.8,0,s*6.4]);inked(c,H.plate,.9,'#4a3414');
      circ(c,0,s*9.8,1.5);inked(c,'#fff6da',.5,'#4a3414');
      c.beginPath();c.moveTo(-2.6,s*9.8);c.quadraticCurveTo(0,s*9.8-1.3,1.4,s*9.8);c.quadraticCurveTo(0,s*9.8+1.3,-2.6,s*9.8);c.fillStyle='#ffb040';c.fill();
    }
    return;
  }
  cel(c,T,H.body,[1,0,5.2,8],[2.4,-3,2.6,1.5,.2],1.1);
  if(h==='marrow'){ // rib cage and spine over charcoal
    c.strokeStyle=H.plate;c.lineWidth=.9;c.beginPath();for(const x of[-2.6,0,2.6])for(const s of[-1,1]){c.moveTo(x-1,s*1.6);c.quadraticCurveTo(x+.6,s*5,x-1.4,s*7.4);}c.stroke();
    c.fillStyle=H.plate;for(let x=-5;x<4.6;x+=2.1){ell(c,x,0,.9,1.2);c.fill();}
    if(kind!=='archer')for(const s of[-1,1]){blob(c,[3.6,s*8,1.4,s*13.4,-5.6,s*11.6,-3,s*6.4]);inked(c,H.plate,1);line(c,[2,s*9,-3.4,s*10.6],'#a89e84',.6);circ(c,2.2,s*10.6,.7);c.fillStyle='#8a8068';c.fill();}
  } else if(h==='grell'){ // quartered surcoat, coin pauldrons
    c.save();blob(c,TORSO);c.clip();c.fillStyle=H.plate;c.fillRect(0,-12,8,12);c.fillRect(-8,0,8,12);c.fillStyle='rgba(20,10,30,.25)';c.fillRect(-8,0,3,12);c.restore();
    blob(c,TORSO);c.strokeStyle=INK;c.lineWidth=1.1;c.stroke();
    line(c,[-6,0,6,0],'#6a141c',.7);
    if(kind!=='archer')for(const s of[-1,1]){circ(c,0,s*9.6,4.5);inked(c,H.plate,1);circ(c,0,s*9.6,2.7);c.strokeStyle='#8a5a14';c.lineWidth=.6;c.stroke();circ(c,-.8,s*9.6-.8,1);c.fillStyle='#fff0b0';c.fill();}
  } else if(h==='ostrander'){ // scale mail, shell pauldrons, foam collar
    c.save();blob(c,TORSO);c.clip();c.strokeStyle='rgba(200,240,250,.55)';c.lineWidth=.55;
    for(let x=-6;x<6;x+=2.6)for(let y=-9;y<10;y+=2.9){c.beginPath();c.arc(x+((y/2.9|0)&1?1.3:0),y,1.5,-1.3,1.3);c.stroke();}
    c.restore();
    if(kind!=='archer')for(const s of[-1,1]){
      c.beginPath();c.moveTo(3.4,s*7.4);c.quadraticCurveTo(4.4,s*14,-1,s*14);c.quadraticCurveTo(-5.4,s*13,-4,s*7.4);c.closePath();inked(c,H.plate,1);
      for(const a of[-.9,-.3,.3,.9])line(c,[0,s*7.8,Math.sin(a)*4.4,s*(7.8+Math.cos(a)*5.4)],'#7fb8c8',.55);
    }
    c.beginPath();c.arc(1.4,0,6.3,-1.8,1.8);c.strokeStyle='#eefaff';c.lineWidth=1.2;c.stroke();
  } else if(h==='dunmoor'){ // frock coat: lapels, buttons, fringed epaulettes
    poly(c,[5.6,-1,1,-4.6,-2,-1]);c.fillStyle=H.cloth;c.fill();poly(c,[5.6,1,1,4.6,-2,1]);c.fill();
    c.fillStyle='#e8ecf8';for(const x of[-3.6,-1.2,1.2])for(const s of[-1,1]){circ(c,x,s*1.6,.55);c.fill();}
    if(kind!=='archer')for(const s of[-1,1]){rr(c,-2.8,s*9.4-2.6,5.6,5.2,2.2);inked(c,'#c8d4f0',.9);c.strokeStyle='#eef2fa';c.lineWidth=.5;c.beginPath();for(let x=-2;x<=2.2;x+=1.05){c.moveTo(x,s*11.6);c.lineTo(x,s*13.6);}c.stroke();}
    blob(c,[-5,-6,-9.6,-4.4,-8.4,-1.2,-5.8,-1.4]);inked(c,H.body,.9);blob(c,[-5,6,-9.6,4.4,-8.4,1.2,-5.8,1.4]);inked(c,H.body,.9);
  }
}
/* ---------- heads ---------- */
function houseHead(c,h,kind,H,mood,skin){
  const hot=mood==='alarm'?1:mood==='wary'?.5:0;
  if(h==='kest'){ // flat-topped bucket helm, the visor slit glows with his temper
    rr(c,-5,-5.6,12,11.2,3);cel(c,()=>rr(c,-5,-5.6,12,11.2,3),H.plate,[.6,0,4.6,4.4],[1,-2.6,3,1],1.1);
    line(c,[-5,0,3,0],'rgba(20,10,30,.5)',.7);
    c.fillStyle='#1a1418';rr(c,3.6,-3.6,2.2,7.2,.8);c.fill();
    c.fillStyle=mood==='ko'?'#3a3038':hot>.8?'#fff2c0':hot?'#ffb050':'#c8602a';
    if(mood==='hurt'||mood==='ko'){c.fillRect(4.2,-2.6,1,1.4);c.fillRect(4.2,1.2,1,1.4);}else c.fillRect(4.2,-2.8-hot*.4,1+hot*.3,5.6+hot*.8);
    c.fillStyle='#2a2a32';for(const y of[-4.2,4.2]){circ(c,-2.6,y,.55);c.fill();circ(c,1.2,y,.55);c.fill();}
    if(kind==='brute'){poly(c,[-4.6,-5,-8.6,-7.6,-5,-2.4]);inked(c,'#d9803a',.7);poly(c,[-4.6,5,-8.6,7.6,-5,2.4]);inked(c,'#d9803a',.7);}
    return;
  }
  if(h==='dunmoor'){ // tricorne over a porcelain mask
    c.fillStyle=skin;circ(c,2.4,0,4);c.fill();
    ell(c,4.4,0,2.9,3.7);inked(c,H.plate,.8);
    c.strokeStyle='#22305a';c.lineWidth=.55;c.beginPath();
    for(const s of[-1,1]){const ey=s*1.5;
      if(mood==='ko'){c.moveTo(4,ey-.5);c.lineTo(5,ey+.5);c.moveTo(4,ey+.5);c.lineTo(5,ey-.5);}
      else if(mood==='alarm'){c.moveTo(5.2,ey);c.arc(4.6,ey,.62,0,6.3);}
      else if(mood==='hurt'){c.moveTo(4,ey-s*.5);c.lineTo(5,ey);c.lineTo(4,ey+s*.5);}
      else{c.moveTo(4.1,ey-(mood==='wary'?s*.5:0));c.lineTo(5.1,ey);}}
    c.stroke();c.fillStyle='#4a6ab8';poly(c,[5.6,2.2,6.4,2.9,5.6,3.3]);c.fill();c.fillStyle='#b83a4a';ell(c,6.6,0,.4,.9);c.fill();
    c.beginPath();c.moveTo(4,0);c.quadraticCurveTo(1.4,-3.6,-1.4,-7.6);c.quadraticCurveTo(-4.6,-2.6,-8.4,0);c.quadraticCurveTo(-4.6,2.6,-1.4,7.6);c.quadraticCurveTo(1.4,3.6,4,0);c.closePath();inked(c,'#161a2c',1.1);
    circ(c,-1.4,0,2.8);c.fillStyle='#262c48';c.fill();line(c,[2.6,-1.4,-1,-6.2],'#c8d4f0',.6);line(c,[2.6,1.4,-1,6.2],'#c8d4f0',.6);
    c.beginPath();c.moveTo(-1,-3);c.quadraticCurveTo(-7,-7.6,-11,-4.6);c.quadraticCurveTo(-7,-4.4,-3.4,-1.6);c.closePath();inked(c,kind==='brute'?'#b83a4a':'#f1f1f6',.6);
    return;
  }
  if(h==='hallow'){ // a wax head with a candle growing out of the crown
    cel(c,()=>blob(c,[6.8,0,5,-4.8,0,-6,-4.6,-4,-6.4,-1,-4.2,.6,-6,3.6,-1,6,5,4.8]),H.plate,[1.2,0,4.4,4.2],[1.4,-2.4,2.4,1.1],1,'#4a3414');
    c.fillStyle='#3a240c';
    for(const s of[-1,1]){if(mood==='ko'||mood==='hurt'){c.fillRect(3.6,s*1.9-.3,1.6,.6);}else{ell(c,4.2,s*1.9,1,mood==='wary'?.7:1.15);c.fill();}}
    if(mood!=='ko'&&mood!=='hurt'){c.fillStyle=hot>.8?'#fff2c0':'#ffa838';for(const s of[-1,1]){circ(c,4.4,s*1.9,.42+hot*.25);c.fill();}}
    c.fillStyle='#3a240c';ell(c,6,0,.5,mood==='alarm'?1.2:.7);c.fill();
    circ(c,-.6,0,2.2);inked(c,'#fff6da',.7,'#4a3414');
    c.beginPath();c.moveTo(-5.2,0);c.quadraticCurveTo(-1.6,-2,.8,0);c.quadraticCurveTo(-1.6,2,-5.2,0);c.fillStyle='#ffb040';c.fill();c.strokeStyle='#8a4a10';c.lineWidth=.5;c.stroke();
    ell(c,-1.6,0,1.3,.6);c.fillStyle='#fff2c0';c.fill();
    return;
  }
  // heads with a visible face
  c.fillStyle=skin;ell(c,4.1,0,2.9,3.4);c.fill();
  if(h==='sable'){ // deep cowl with a back point; the face sits in its shadow
    c.fillStyle='rgba(20,14,34,.42)';ell(c,3.6,0,2.6,3.4);c.fill();
    c.beginPath();c.moveTo(4.4,-3.6);c.quadraticCurveTo(2,-7,-3,-5.4);c.lineTo(-10.6,0);c.lineTo(-3,5.4);c.quadraticCurveTo(2,7,4.4,3.6);c.quadraticCurveTo(1.8,0,4.4,-3.6);c.closePath();
    inked(c,H.plate,1.1);line(c,[-8.4,0,-1,0],sh(H.plate,1.8),.6);
    c.beginPath();c.moveTo(4.2,-3.4);c.quadraticCurveTo(1.6,0,4.2,3.4);c.strokeStyle=kind==='brute'?'#b79aff':'#c9c4e0';c.lineWidth=.7;c.stroke();
  } else if(h==='marrow'){ // skull-cap helm with cheek guards and a vertebra crest
    cel(c,()=>{c.beginPath();c.arc(.6,0,5.8,.75,5.53);c.closePath();},H.plate,[.6,0,4,4.2],[1,-2.4,2.4,1],1.1);
    for(let x=-4.4;x<3;x+=1.9){ell(c,x,0,.8,1.3);inked(c,'#cfc6ae',.4);}
    for(const s of[-1,1]){poly(c,[2.4,s*5.2,6.8,s*4,5.6,s*2.8,3,s*3.6]);inked(c,H.plate,.7);}
    if(kind==='brute'){for(const s of[-1,1]){c.beginPath();c.moveTo(-1,s*5);c.quadraticCurveTo(-1,s*9.4,4,s*9);c.quadraticCurveTo(1.2,s*7.6,1.6,s*5);c.closePath();inked(c,H.plate,.7);}}
  } else if(h==='grell'){ // morion with a crest ridge and a long red plume
    blob(c,[-3,-1.6,-9,-3.4,-14.6,-.6,-15.4,1.6,-9,3,-3,1.6]);inked(c,kind==='brute'?'#f4f4f8':'#c8242e',.9);line(c,[-4,0,-13,.6],'rgba(255,200,200,.5)',.6);
    cel(c,()=>{c.beginPath();c.arc(.8,0,5.7,.8,5.48);c.closePath();},'#b9bfcc',[.6,0,4,4.2],[1,-2.4,2.4,1],1.1);
    c.beginPath();c.arc(.8,0,5.7,.8,5.48);c.strokeStyle=H.plate;c.lineWidth=1.1;c.stroke();
    rr(c,-5,-.9,9.6,1.8,.9);inked(c,H.plate,.6);
  } else { // ostrander: fin-crested sallet
    cel(c,()=>{c.beginPath();c.arc(.8,0,5.7,.8,5.48);c.closePath();},'#8fc4d2',[.6,0,4,4.2],[1,-2.4,2.4,1],1.1);
    poly(c,[4.4,0,1,-1.5,-2,-1.1,-5.4,-3.6,-6,-1,-9.4,-1.6,-8.6,0,-9.4,1.6,-6,1,-5.4,3.6,-2,1.1,1,1.5]);inked(c,kind==='brute'?'#eefaff':'#2c7d99',.8);
    line(c,[3,0,-8,0],'#bfe6f0',.5);
  }
  stillFace(c,4.3,0,1,mood);
}
/* brute shields, one per house, held in front */
function houseShield(c,h,H){
  const arc=()=>{c.beginPath();c.arc(4,0,15.4,-1.0,1.0);c.arc(4,0,10.6,1.0,-1.0,true);c.closePath();};
  if(h==='kest'){poly(c,[11,-11.6,17.6,-9,19.4,0,17.6,9,11,11.6,13.4,0]);inked(c,H.plate,1.1);c.fillStyle='#2a2a32';for(const y of[-8,-4,4,8]){circ(c,15.6,y*.95,.7);c.fill();}c.fillStyle='#ff9a3a';c.fillRect(15.4,-1.6,2.4,3.2);return;}
  arc();
  if(h==='sable'){inked(c,'#2a2638',1.1);c.beginPath();c.arc(4,0,13,-.86,.86);c.strokeStyle='#b79aff';c.lineWidth=.8;c.stroke();circ(c,17,0,1.6);inked(c,'#c9c4e0',.6);return;}
  if(h==='hallow'){inked(c,'#f1e6b8',1.1,'#4a3414');c.fillStyle='rgba(224,160,56,.6)';for(const a of[-.7,-.2,.4,.8]){ell(c,4+Math.cos(a)*14,Math.sin(a)*14,1.2,1.8,a);c.fill();}return;}
  inked(c,h==='marrow'?H.plate:h==='grell'?'#a3262e':h==='dunmoor'?'#34508c':'#2c7d99',1.1);
  c.beginPath();c.arc(4,0,15.4,-1.0,1.0);c.strokeStyle=h==='marrow'?'#b9ae93':H.trim;c.lineWidth=1.3;c.stroke();
  c.beginPath();c.arc(4,0,10.6,-1.0,1.0);c.strokeStyle=INK;c.lineWidth=.9;c.stroke();
  if(h==='marrow'){for(const a of[-.6,0,.6])line(c,[4+Math.cos(a)*11,Math.sin(a)*11,4+Math.cos(a)*15,Math.sin(a)*15],'#8a8068',.7);}
  circ(c,17,0,1.9);inked(c,h==='marrow'?'#3a3542':H.plate,.7);
}
function paintGuard(c,h,kind,mood,stun,skin){
  const H=HOUSE_ART[h];
  houseWeapon(c,h,kind,H);
  houseBody(c,h,kind,H);
  // gloved hands
  circ(c,7,9.6,1.9);inked(c,h==='hallow'?'#f6eecb':'#3a2a20',.7);
  if(kind==='archer'){circ(c,6.4,-8.6,1.8);inked(c,'#3a2a20',.7);}
  c.save();c.translate(.4,0);houseHead(c,h,kind,H,mood,skin);c.restore();
  if(kind==='brute')houseShield(c,h,H);
  if(stun){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(122,122,138,.62)';c.fillRect(-60,-60,120,120);c.globalCompositeOperation='source-over';}
}
/* hounds: lean sighthound shape, coat and collar by house */
function paintHound(c,h,stun){
  const H=HOUSE_ART[h],coat=H.hound;
  cel(c,()=>blob(c,[10,0,8,-3.6,2,-5.4,-4,-3.4,-10,-4.6,-11.6,0,-10,4.6,-4,3.4,2,5.4,8,3.6]),coat,[0,0,9,3.2],[2,-1.4,5,1.2],1);
  if(h==='marrow'){c.fillStyle='#8a8068';for(let x=-8;x<6;x+=2.4){ell(c,x,0,.7,1);c.fill();}}
  if(h==='kest'){rr(c,-3,-4,6,8,1);inked(c,'#868c98',.8);}
  if(h==='hallow'){c.fillStyle='rgba(224,160,56,.6)';for(const p of[[-6,2],[1,-3],[4,3]]){ell(c,p[0],p[1],1.3,.9);c.fill();}}
  // head: long muzzle, swept ears
  cel(c,()=>blob(c,[18.6,0,15,-2.4,10.6,-4.4,6.6,-2.6,6.6,2.6,10.6,4.4,15,2.4]),coat,[11,0,5,2.4],null,1);
  for(const s of[-1,1]){poly(c,[9.4,s*3.2,5,s*6.2,7,s*2.4]);inked(c,sh(coat,.6),.7);}
  circ(c,17.6,0,1.1);c.fillStyle='#1a1014';c.fill();
  c.fillStyle=stun?'#999':h==='hallow'?'#ffa838':h==='sable'?'#b79aff':'#ff6a4a';circ(c,11.6,-1.9,.9);c.fill();circ(c,11.6,1.9,.9);c.fill();
  rr(c,5,-4.2,2.2,8.4,1);inked(c,H.trim,.6);circ(c,6.1,0,.9);c.fillStyle=H.glow;c.fill();
  if(stun){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(122,122,138,.62)';c.fillRect(-60,-60,120,120);c.globalCompositeOperation='source-over';}
}
/* called from drawGuard (render.js) for foot guards and hounds */
function drawGuardArt(g){
  const c=ctx,t=G.time,h=houseKey(),stun=g.stun>0,fa=vfa(g);
  if(g.kind==='hound'){
    shadowAt(g.x,g.y+4,12,5,.35);
    c.save();c.translate(g.x,g.y);c.rotate(fa);
    const sw=Math.sin(g.ph*1.4),wag=Math.sin(t*10);
    c.strokeStyle=INK;c.lineWidth=3;c.lineCap='round';
    c.beginPath();c.moveTo(5,-3.5);c.lineTo(8+sw*3.4,-6);c.moveTo(5,3.5);c.lineTo(8-sw*3.4,6);c.moveTo(-7,-3.5);c.lineTo(-9-sw*3.4,-6);c.moveTo(-7,3.5);c.lineTo(-9+sw*3.4,6);
    c.moveTo(-11,0);c.quadraticCurveTo(-15,wag*3,-18,wag*5);c.stroke();
    c.strokeStyle=sh(HOUSE_ART[h].hound,stun?.5:.72);c.lineWidth=1.6;c.stroke();c.lineCap='butt';
    SPR.draw(c,'hd|'+h+(stun?'s':''),44,24,cc=>paintHound(cc,h,stun));
    c.restore();return;
  }
  const kind=g.kind==='archer'||g.kind==='brute'?g.kind:'guard',big=kind==='brute'?1.3:1;
  const mood=guardMood(g),sk=Math.floor(g.ph*7)%4;
  shadowAt(g.x,g.y+4,10.5*big,5.6*big,.38);
  c.save();c.translate(g.x,g.y);c.rotate(fa);
  const walk=g.seeing||g.eng?1.25:1,sw=Math.sin(g.ph*1.3);
  c.scale(big*(1+Math.abs(sw)*.015),big);
  if(mood==='alarm')c.translate(1.2,0);
  c.fillStyle=h==='hallow'?'#b89a58':'#1c1620';ell(c,sw*3.6*walk,-4.5,3.6,2.4);c.fill();ell(c,-sw*3.6*walk,4.5,3.6,2.4);c.fill();
  SPR.draw(c,'gd|'+h+'|'+kind+'|'+mood+'|'+sk,72,48,cc=>paintGuard(cc,h,kind,mood,stun,SKINS[sk]),4,0);
  if(g.hurt>0){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,255,255,.45)';ell(c,1,0,9,10);c.fill();c.globalCompositeOperation='source-over';}
  c.restore();
}
