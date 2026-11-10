'use strict';
/* EMBERCROWN - NPC figures (top-down, cached sprites). window.drawNpcFigure(ctx,kind,x,y,t,face,opts)
   kind: one of NPC_KINDS (or a look.k from npcdata; unknown kinds fall back to 'servant').
   opts: {look,id,role,scale,walk(-1..1),free,alpha}. Each kind has its own headwear, dress and hand prop. */
const NPC_KINDS={
  servant:{prop:'tray'},
  scullion:{small:.86,hair:'mop',prop:'bucket'},
  potboy:{small:.86,hair:'mop',prop:'pot'},
  cook:{hat:'toque',apron:'#f2eee0',prop:'ladle',wide:1.18},
  prisoner:{hair:'wild',stripes:1,prop:'shackles'},
  sailor:{hat:'knit',stripes:2,prop:'rope'},
  pilot:{hat:'peaked',coat:1,prop:'spyglass'},
  merchant:{hat:'feather',pack:1,wide:1.22,prop:'purse'},
  monk:{hat:'hood',robe:1,prop:'candle'},
  scribe:{hair:'tonsure',robe:1,prop:'quill'},
  smith:{hair:'bandana',apron:'#6a4a2c',wide:1.2,prop:'hammer'},
  musician:{hair:'slick',coat:2,prop:'violin'},
  maid:{hat:'mob',apron:'#f2eee0',prop:'duster'},
  elder:{hair:'bun',shawl:1,prop:'cane',small:.93},
  guard:{hat:'helm',cloak:1,prop:'spear'},
  noble:{hat:'circlet',coat:1,prop:'fan'}
};
const NPC_BY_ID={pip:'scullion',hale:'prisoner',cook:'cook',tam:'potboy',brisk:'merchant',pilot:'pilot',kess:'sailor',hale2:'sailor',wick:'monk',scribe:'scribe',dagna:'merchant',orrin:'smith',violin:'musician',sera:'maid',nan:'elder',corvin:'guard'};
const NPC_ROLE=[[/scull|pot-?boy|child|urchin/i,'scullion'],[/cook|baker/i,'cook'],[/prison|chain|captive/i,'prisoner'],[/sailor|deck|fisher/i,'sailor'],[/pilot|captain|harbor/i,'pilot'],[/merchant|factor|quarterm|trader|pedl/i,'merchant'],
  [/scribe|clerk|archiv|scholar/i,'scribe'],[/novice|monk|brother|sister|abb/i,'monk'],[/smith|forge|stoker/i,'smith'],[/violin|music|bard|singer|piper/i,'musician'],[/maid|nurse|seamstress/i,'maid'],[/old|keeper|elder|gran/i,'elder'],[/guard|soldier|watch/i,'guard'],[/lord|lady|noble|heir|baron/i,'noble']];
/* which figure a contact gets: by id, then role keywords, then look.k */
function npcKindOf(n){
  if(!n)return'servant';
  if(typeof n==='string')return NPC_KINDS[n]?n:(NPC_BY_ID[n]||'servant');
  if(n.art&&NPC_KINDS[n.art])return n.art;
  if(NPC_BY_ID[n.id])return NPC_BY_ID[n.id];
  for(const r of NPC_ROLE)if(r[0].test(n.role||''))return r[1];
  const k=n.look&&n.look.k;return NPC_KINDS[k]?k:'servant';
}
function npcProp(c,p,L,free){
  const hx=6.2,hy=7.6;
  switch(p){
    case'tray':ell(c,8.6,0,3,4.6);inked(c,'#b4bac6',.8);circ(c,8.4,-1.6,1.1);inked(c,'#d8c8a0',.5);circ(c,9,1.6,1.2);inked(c,'#a84a3a',.5);break;
    case'bucket':circ(c,8,6.4,3.3);inked(c,'#8a5a30',.9);circ(c,8,6.4,2.2);c.fillStyle='#6ab0d8';c.fill();c.beginPath();c.arc(8,6.4,3.3,3.6,5.8);c.strokeStyle='#c8c8d0';c.lineWidth=.7;c.stroke();break;
    case'pot':circ(c,8.8,0,3.6);inked(c,'#3a3a44',.9);circ(c,8.8,0,2.4);c.fillStyle='#b8783a';c.fill();for(const s of[-1,1]){rr(c,8,s*4.4-.7,1.6,1.4,.5);inked(c,'#3a3a44',.5);}break;
    case'ladle':shaft(c,hx,hy,13.6,5,'#8a6a40',.9);circ(c,14.4,4.6,1.9);inked(c,'#b4bac6',.7);break;
    case'shackles':if(free){for(const s of[-1,1]){circ(c,6,s*7.4,1.6);c.strokeStyle='#8a8a98';c.lineWidth=.9;c.stroke();}break;}
      c.setLineDash([1.2,.9]);line(c,[6,-7.4,9.6,0,6,7.4],'#9a9aa8',1.1);line(c,[9.6,0,-9,5],'#9a9aa8',1.1);c.setLineDash([]);circ(c,-10,5.4,3);inked(c,'#4a4a56',.9);c.fillStyle='rgba(255,255,255,.3)';circ(c,-10.8,4.6,1);c.fill();break;
    case'rope':c.beginPath();c.ellipse(-1,-6.6,3.6,2.6,.3,0,6.3);c.strokeStyle=INK;c.lineWidth=2.6;c.stroke();c.strokeStyle='#c8a868';c.lineWidth=1.5;c.stroke();break;
    case'spyglass':shaft(c,hx-1,hy-1,14,3.4,'#c89a3a',1.5);line(c,[13,3.7,14.6,3.2],'#e8f4ff',1.7);break;
    case'purse':blob(c,[9,7,7.4,10,4.4,9.4,4.6,6]);inked(c,'#8a5a30',.8);circ(c,9.6,3.4,1.2);inked(c,'#f2c64a',.5);break;
    case'candle':c.fillStyle='rgba(255,190,90,.3)';circ(c,9.4,0,4.4);c.fill();circ(c,9,0,1.4);inked(c,'#f6eecb',.6);c.fillStyle='#ffb040';poly(c,[9.6,-.9,12,0,9.6,.9]);c.fill();break;
    case'quill':c.save();c.translate(7.4,-4.4);c.rotate(-.3);rr(c,-2.2,-3,4.4,6,.6);inked(c,'#f2eee0',.7);line(c,[-1.2,-1.6,1.2,-1.6],'#8a8478',.4);line(c,[-1.2,0,1.2,0],'#8a8478',.4);line(c,[-1.2,1.6,.6,1.6],'#8a8478',.4);c.restore();
      c.beginPath();c.moveTo(6.4,7.4);c.quadraticCurveTo(11,4.6,13.6,8);c.quadraticCurveTo(10,8.4,6.4,7.4);inked(c,'#f6f4ee',.6);break;
    case'hammer':shaft(c,hx,hy,13,8.4,'#6a5038',1.3);rr(c,12,5.6,3.4,5.6,.7);inked(c,'#868c98',.8);break;
    case'violin':c.save();c.translate(4.6,-7.4);c.rotate(-.5);blob(c,[5.4,0,4,-2.3,1.4,-1.5,-1.4,-2.6,-4,0,-1.4,2.6,1.4,1.5,4,2.3]);inked(c,'#a85a2a',.8);line(c,[-3,0,9.4,0],'#3a2010',.9);c.restore();line(c,[3,9,14,-5.6],'#e8e0c8',.7);break;
    case'duster':shaft(c,hx,hy,11.6,6,'#6a4a30',.9);blob(c,[15.4,4.4,13,2.4,10.8,5.4,12.4,8.4,15,7.4]);inked(c,'#e8c070',.7);break;
    case'cane':shaft(c,hx,hy,14.6,10.4,'#5a4030',1.2);circ(c,hx+.4,hy+.2,1.2);inked(c,'#c8a868',.5);break;
    case'spear':shaft(c,-9,10.4,17,8,'#9a8a70',1.3);poly(c,[17,6.8,21.6,7.6,17.2,9.2]);inked(c,'#dfe4ee',.6);break;
    case'fan':c.beginPath();c.moveTo(6.4,7);c.arc(6.4,7,6,-.9,.5);c.closePath();inked(c,L.trim,.7);for(const a of[-.55,-.2,.15])line(c,[6.4,7,6.4+Math.cos(a)*6,7+Math.sin(a)*6],'rgba(20,10,30,.4)',.4);break;
  }
}
function npcHead(c,K,L){
  const hair=L.hair||'#4a3020',sk=L.skin;
  if(K.hair==='bun'){circ(c,-3.6,0,2.6);inked(c,'#c8c4cc',.8);}
  if(K.hat==='hood'){blob(c,[-2,-3,-6,-2,-8.6,0,-6,2,-2,3]);inked(c,sh(L.cloth,.8),.9);}
  c.fillStyle=sk;circ(c,2,0,4.5);c.fill();c.strokeStyle=INK;c.lineWidth=.9;c.stroke();
  const cap=(col,a0,a1,r)=>{c.beginPath();c.arc(1.6,0,r||4.9,a0,a1);c.closePath();inked(c,col,.9);};
  if(K.hat==='toque'){blob(c,[4.6,0,3.4,-4.6,-.6,-6.2,-4.4,-4,-5.6,0,-4.4,4,-.6,6.2,3.4,4.6]);inked(c,'#f6f4ee',.9);c.strokeStyle='#c8c4bc';c.lineWidth=.5;circ(c,-.6,0,2.8);c.stroke();}
  else if(K.hat==='knit'){cap('#b83a3a',1.15,5.13);line(c,[-1.6,-3.6,-1.6,3.6],'#e8d8d0',.6);circ(c,-3.6,0,1.5);inked(c,'#f2eee0',.6);}
  else if(K.hat==='peaked'){cap('#1e2c4c',1.25,5.03,5);c.beginPath();c.arc(1.6,0,6.6,-.75,.75);c.arc(1.6,0,4.6,.75,-.75,true);c.closePath();inked(c,'#12182c',.7);circ(c,2,0,1);inked(c,'#f2c64a',.4);}
  else if(K.hat==='feather'){ell(c,1.2,0,6.6,6.9);inked(c,sh(L.cloth,.72),1);circ(c,.6,0,3.7);inked(c,L.cloth,.8);c.beginPath();c.arc(.6,0,3.7,0,6.3);c.strokeStyle=L.trim;c.lineWidth=.8;c.stroke();
    c.beginPath();c.moveTo(1,-3);c.quadraticCurveTo(-5,-9,-10.6,-6);c.quadraticCurveTo(-5.6,-5.6,-1.6,-2);c.closePath();inked(c,'#f2eee0',.6);return'hat';}
  else if(K.hat==='hood'){c.beginPath();c.moveTo(4.6,-3.4);c.quadraticCurveTo(2.4,-6,-1.6,-4.6);c.quadraticCurveTo(-4.4,0,-1.6,4.6);c.quadraticCurveTo(2.4,6,4.6,3.4);c.quadraticCurveTo(2.2,0,4.6,-3.4);c.closePath();inked(c,L.cloth,.9);}
  else if(K.hat==='mob'){c.beginPath();for(let i=0;i<=8;i++){const a=1.2+i*.485,r=5.4;c.lineTo(1.4+Math.cos(a)*r,Math.sin(a)*r);c.lineTo(1.4+Math.cos(a+.24)*(r-1.1),Math.sin(a+.24)*(r-1.1));}c.closePath();inked(c,'#f6f4ee',.8);poly(c,[-3.6,0,-6,-1.8,-6,1.8]);inked(c,L.trim,.6);}
  else if(K.hat==='helm'){c.save();c.rotate(.25);cap('#9aa0b0',1.0,5.28,5.1);c.fillStyle='rgba(255,255,255,.35)';ell(c,0,-2,2.4,1);c.fill();rr(c,2,-.7,4.6,1.4,.5);inked(c,'#868c98',.6);c.restore();}
  else if(K.hat==='circlet'){cap(hair,1.4,4.88);c.beginPath();c.arc(1.6,0,4.2,1.1,5.18);c.strokeStyle='#f2c64a';c.lineWidth=1;c.stroke();circ(c,-2.6,0,.8);c.fillStyle='#7ad8ff';c.fill();}
  else if(K.hair==='mop'){blob(c,[3.4,-3.6,1,-6,-2.4,-4.6,-4.4,-1.6,-3.6,2,-4.4,4,-1,5.6,2.6,4.4,1,0]);inked(c,hair,.8);}
  else if(K.hair==='wild'){c.beginPath();for(let i=0;i<=7;i++){const a=1.3+i*.52;c.lineTo(1.6+Math.cos(a)*6.6,Math.sin(a)*6.6);c.lineTo(1.6+Math.cos(a+.26)*4,Math.sin(a+.26)*4);}c.closePath();inked(c,'#3a2a20',.7);c.fillStyle='#3a2a20';ell(c,5.6,0,1.1,2.8);c.fill();}
  else if(K.hair==='tonsure'){c.beginPath();c.arc(1.6,0,4.9,1.3,4.98);c.arc(1.6,0,2.6,4.98,1.3,true);c.closePath();inked(c,hair,.7);}
  else if(K.hair==='bandana'){cap('#b83a3a',1.3,4.98);poly(c,[-3,-.6,-7,-2.6,-5.6,0]);inked(c,'#b83a3a',.6);poly(c,[-3,.6,-6.6,2.8,-5,.6]);inked(c,'#9a2c2c',.6);}
  else if(K.hair==='slick'){cap('#16141c',1.35,4.93);line(c,[-2.6,-1.4,1.4,-2.4],'rgba(255,255,255,.4)',.6);}
  else if(K.hair==='bun'){cap('#c8c4cc',1.3,4.98);}
  else cap(hair,1.5,4.78);
  return'';
}
function paintNpc(c,kind,L,free){
  const K=NPC_KINDS[kind]||NPC_KINDS.servant,w=K.wide||1;
  if(K.pack||L.pack){rr(c,-13.4,-6.4,7.6,12.8,2.2);inked(c,'#6a4428',1);line(c,[-12,-3,-7,-3],'#a87a48',.8);line(c,[-12,3,-7,3],'#a87a48',.8);rr(c,-14.4,-3,2,6,.8);inked(c,'#c8b890',.6);}
  if(K.cloak){blob(c,[1,-7.6,-8,-8.6,-12.4,0,-8,8.6,1,7.6]);inked(c,sh(L.cloth,.7),1);}
  if(K.coat===2){for(const s of[-1,1]){poly(c,[-4,s*1,-12.6,s*2.2,-10,s*5.6,-4,s*5]);inked(c,L.cloth,.9);}}
  npcProp(c,K.prop,L,free);
  const B=K.robe?[6,0,4,-5.4,2,-9.6,-3.4,-10,-7,-6,-8.6,0,-7,6,-3.4,10,2,9.6,4,5.4]:[6,0,4.4,-5*w,1.6,-8.6*w,-3.6,-7.8*w,-5.8,0,-3.6,7.8*w,1.6,8.6*w,4.4,5*w];
  cel(c,()=>blob(c,B),L.cloth,[1,0,4.6,7*w],[2,-2.8,2.2,1.3,.2],1);
  if(K.stripes){c.save();blob(c,B);c.clip();c.fillStyle=K.stripes===2?'rgba(240,244,250,.85)':'rgba(20,14,30,.45)';for(let x=-6;x<7;x+=K.stripes===2?2.6:3){c.fillRect(x,-12,K.stripes===2?1.1:1.3,24);}c.restore();blob(c,B);c.strokeStyle=INK;c.lineWidth=1;c.stroke();}
  else line(c,[-4.6,0,5,0],L.trim,1.2);
  if(K.shawl){blob(c,[3.6,-8.4,-2,-9.6,-7.6,-5,-9.6,0,-7.6,5,-2,9.6,3.6,8.4,0,0]);inked(c,sh(L.cloth,1.3),.9);c.strokeStyle=L.trim;c.lineWidth=.5;c.beginPath();for(let y=-6;y<=6;y+=2){c.moveTo(-8.4+Math.abs(y)*.25,y);c.lineTo(-10.6+Math.abs(y)*.25,y*1.1);}c.stroke();}
  if(K.coat){poly(c,[5.4,-.8,1,-4.4,-1.6,-.8]);c.fillStyle=sh(L.cloth,.62);c.fill();poly(c,[5.4,.8,1,4.4,-1.6,.8]);c.fill();c.fillStyle=L.trim;for(const x of[-3.4,-1.2]){circ(c,x,0,.55);c.fill();}}
  if(K.apron||L.apron){rr(c,1.4,-4.6*w,4.4,9.2*w,1.4);inked(c,K.apron||'#f2eee0',.7);if(kind==='smith'){c.fillStyle='rgba(20,10,10,.4)';circ(c,3.6,2,1.2);c.fill();}}
  if(kind==='maid'){poly(c,[-5,0,-8,-2.6,-7.4,0,-8,2.6]);inked(c,'#f6f4ee',.6);}
  // sleeves and hands
  const hc=L.skin;
  for(const s of[-1,1]){
    const hx=K.robe?5.4:6.2,hy=s*(K.robe?3.4:7.6);
    line(c,[1,s*7*w,hx-1,hy],INK,4);line(c,[1,s*7*w,hx-1,hy],kind==='smith'||kind==='prisoner'?hc:sh(L.cloth,.9),2.5);
    circ(c,hx,hy,1.6);inked(c,hc,.6);
  }
  const hat=npcHead(c,K,L);
  if(hat!=='hat'){stillFace(c,4.3,0,.9,'calm');}
  if(kind==='prisoner'||kind==='elder'){c.fillStyle=kind==='elder'?'rgba(120,90,70,.5)':'#3a2a20';ell(c,5.9,0,.8,2.2);c.fill();}
  if(L.mask||kind==='musician'){ell(c,4.6,0,2.2,3.4);inked(c,'#eef0f6',.6);c.fillStyle='#1c1830';circ(c,4.8,-1.4,.5);c.fill();circ(c,4.8,1.4,.5);c.fill();}
}
function drawNpcFigure(c,kind,x,y,t,face,opts){
  opts=opts||{};
  const k=NPC_KINDS[kind]?kind:npcKindOf(kind),K=NPC_KINDS[k],L=opts.look||{skin:'#e0b890',cloth:'#6a5040',trim:'#d8c8a0'};
  const sc=(opts.scale||1)*(K.small||1),sw=opts.walk||0;
  c.save();c.translate(x,y);c.rotate(face||0);c.scale(sc*(1+Math.sin((t||0)*2+x)*.012),sc);
  if(opts.alpha!=null)c.globalAlpha*=opts.alpha;
  c.fillStyle='#231c2a';ell(c,sw*2.6,-4.2,3.1,2.1);c.fill();ell(c,-sw*2.6,4.2,3.1,2.1);c.fill();
  const key='np|'+k+'|'+L.cloth+L.trim+L.skin+(L.mask?'m':'')+(L.apron?'a':'')+(L.pack?'p':'')+(opts.free?'f':'');
  if(typeof SPR!=='undefined')SPR.draw(c,key,56,40,cc=>paintNpc(cc,k,L,opts.free),1,0);else paintNpc(c,k,L,opts.free);
  c.restore();
}
if(typeof window!=='undefined'){window.drawNpcFigure=drawNpcFigure;window.npcKindOf=npcKindOf;window.NPC_KINDS=NPC_KINDS;}
