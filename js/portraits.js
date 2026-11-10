'use strict';
/* EMBERCROWN - dialogue portraits. window.Portraits.draw(ctx,id,x,y,size,mood,opts)
   id: Shiloh|wren, Ashling|ash, Perrin, Quill, Candlemaker|candle, Warden, an NPC kind (see NPC_KINDS), an NPC id, or 'npc:<id>'.
   mood: calm|happy|worried|angry (aliases: joy, wary, alarm, hurt, rage, stern...). opts: {look,npc,frame:false}.
   Busts are painted once per id/mood/size into a cached canvas; drawing one is a single drawImage. */
const Portraits=(function(){
  const cache=new Map(),PINK='#2a1620';
  const MOOD={calm:'calm',focus:'calm',happy:'happy',joy:'happy',glad:'happy',smile:'happy',worried:'worried',wary:'worried',alarm:'worried',hurt:'worried',sad:'worried',afraid:'worried',angry:'angry',rage:'angry',stern:'angry',shout:'angry',cold:'angry'};
  const ALIAS={shiloh:'shiloh',wren:'shiloh',ashling:'ash',ash:'ash',perrin:'perrin','perrin ostrander':'perrin',quill:'quill','mother quill':'quill',candlemaker:'candle','the candlemaker':'candle',candle:'candle',warden:'warden','bell-warden':'warden','the warden':'warden','the bell-warden':'warden'};
  const BG={shiloh:'#4a3a7a',ash:'#7a3a1c',perrin:'#245a78',quill:'#3a3440',candle:'#6a4a14',warden:'#3a2a5c'};
  function skinHead(c,S){
    const sk=S.skin;
    c.fillStyle=sh(sk,.72);rr(c,42,58,16,18,4);c.fill();c.strokeStyle=PINK;c.lineWidth=1.4;c.stroke();
    for(const s of[-1,1]){ell(c,50+s*21.6,48,3.2,5);inked(c,sh(sk,.9),1.3,PINK);}
    const H=()=>blob(c,[50,20,66,22,72,38,70,54,61,68,50,72,39,68,30,54,28,38,34,22]);
    H();c.fillStyle=sk;c.fill();
    c.save();H();c.clip();
    c.fillStyle=sh(sk,.8);ell(c,74,50,10,30);c.fill();ell(c,50,76,22,7);c.fill();
    c.fillStyle=sh(sk,1.12);ell(c,41,36,8,5,-.3);c.fill();
    c.restore();H();c.strokeStyle=PINK;c.lineWidth=1.6;c.stroke();
  }
  function face(c,S,m){
    const ink='#2a1a1a',sk=S.skin;
    for(const s of[-1,1]){
      const ex=50+s*9.6,ey=47;
      let bi=0,bo=0;if(m==='happy'){bi=-2.2;bo=-1.8;}else if(m==='worried'){bi=-3.4;bo=1;}else if(m==='angry'){bi=2.6;bo=-1.8;}
      const ry=m==='happy'?2.9:m==='worried'?4.1:m==='angry'?3:3.4;
      ell(c,ex,ey,4.8,ry);c.fillStyle='#fbf6ee';c.fill();
      c.save();ell(c,ex,ey,4.8,ry);c.clip();
      const gx=ex+(S.gaze||0),gy=ey+(m==='worried'?-.3:0);
      circ(c,gx,gy,2.9);c.fillStyle=S.eye||'#4a3424';c.fill();circ(c,gx,gy,1.3);c.fillStyle='#120a0a';c.fill();circ(c,gx-1.1,gy-1.2,.75);c.fillStyle='#fff';c.fill();
      c.restore();
      c.beginPath();c.ellipse(ex,ey,4.8,ry,0,Math.PI,0);c.strokeStyle=ink;c.lineWidth=1.6;c.stroke();
      if(m==='angry'){poly(c,[ex-s*5.4,ey-ry-2,ex+s*5.6,ey-ry-2,ex-s*5.4,ey-.2]);c.fillStyle=sk;c.fill();line(c,[ex-s*5.4,ey-.2,ex+s*5.4,ey-ry-.8],ink,1.6);}
      if(m==='happy'){ell(c,ex,ey+3.9,5.6,2.4);c.fillStyle=sk;c.fill();c.beginPath();c.ellipse(ex,ey+3.9,5.6,2.4,0,Math.PI*1.12,Math.PI*1.88);c.strokeStyle=sh(sk,.6);c.lineWidth=1;c.stroke();}
      if(S.old){line(c,[ex+s*5.4,ey+1,ex+s*8,ey+2.6],sh(sk,.62),.8);line(c,[ex-s*3,ey+5.6,ex+s*3,ey+6.4],sh(sk,.68),.8);}
      c.beginPath();c.moveTo(ex-s*5,ey-8+bi);c.quadraticCurveTo(ex,ey-9.6+(bi+bo)/2,ex+s*5.4,ey-7.4+bo);c.strokeStyle=S.brow||S.hair||ink;c.lineWidth=S.browW||2.2;c.stroke();
    }
    c.beginPath();c.moveTo(50.8,49);c.quadraticCurveTo(48,55,49.4,57.2);c.quadraticCurveTo(51,58.2,52.8,57);c.strokeStyle=sh(sk,.6);c.lineWidth=1.3;c.stroke();
    const my=63.6;c.strokeStyle=ink;
    if(m==='happy'){c.beginPath();c.moveTo(43.4,my-1.6);c.quadraticCurveTo(50,my+1,56.6,my-1.6);c.quadraticCurveTo(50,my+7.6,43.4,my-1.6);c.closePath();c.fillStyle='#6a1c1c';c.fill();c.lineWidth=1.2;c.stroke();
      c.beginPath();c.moveTo(45.6,my-.7);c.quadraticCurveTo(50,my+1.1,54.4,my-.7);c.lineTo(53.4,my+.9);c.quadraticCurveTo(50,my+2.3,46.6,my+.9);c.closePath();c.fillStyle='#fff';c.fill();
      c.fillStyle='rgba(230,100,80,.26)';ell(c,36.4,56.4,4.2,2.5);c.fill();ell(c,63.6,56.4,4.2,2.5);c.fill();}
    else{c.beginPath();
      if(m==='worried'){c.moveTo(45,my+1.4);c.quadraticCurveTo(47.5,my-1.4,50,my+.4);c.quadraticCurveTo(52.5,my+2,55,my-.2);}
      else if(m==='angry'){c.moveTo(44.2,my+1.8);c.quadraticCurveTo(50,my-2.2,55.8,my+1.8);}
      else{c.moveTo(45,my-.2);c.quadraticCurveTo(50,my+2,55,my-.2);}
      c.lineWidth=1.6;c.stroke();line(c,[47.6,my+3.6,52.4,my+3.6],sh(sk,.7),.9);}
    if(S.freckles){c.fillStyle='rgba(150,80,50,.55)';for(const p of[[38,53],[41,55],[36,56.4],[59,53],[62,55],[64,56.4],[50,53.4]]){circ(c,p[0],p[1],.7);c.fill();}}
    if(S.beard){c.fillStyle=S.beard;c.globalAlpha=.85;blob(c,[32,56,36,70,50,77,64,70,68,56,60,64,50,60,40,64]);c.fill();c.globalAlpha=1;}
    if(S.stubble){c.fillStyle='rgba(60,44,40,.3)';blob(c,[33,57,37,69,50,74,63,69,67,57,58,62,50,59,42,62]);c.fill();}
    if(S.scar)line(c,[62,38,66,52],'#b86a5a',1.1);
    if(S.mask){blob(c,[28,44,34,36,50,39,66,36,72,44,66,54,56,52,50,55,44,52,34,54]);inked(c,S.mask,1.3,PINK);for(const s of[-1,1]){ell(c,50+s*9.6,46.4,4.4,2.8,s*-.12);c.fillStyle='#1a1424';c.fill();circ(c,50+s*9.6,46.4,1.3);c.fillStyle=S.eye||'#c8d4f0';c.fill();}
      c.fillStyle='#4a6ab8';poly(c,[62,52,64.4,56.4,60,55]);c.fill();}
    if(S.glasses){c.strokeStyle='#c8a040';c.lineWidth=1.3;for(const s of[-1,1]){circ(c,50+s*9.6,47,6.4);c.stroke();}line(c,[46.8,46.4,53.2,46.4],'#c8a040',1.3);c.fillStyle='rgba(255,255,255,.14)';for(const s of[-1,1]){ell(c,50+s*9.6-1.6,45,2.6,1.6,-.5);c.fill();}}
  }
  function shoulders(c,S){
    cel(c,()=>blob(c,[50,63,72,67,91,78,97,106,3,106,9,78,28,67]),S.cloth,[44,96,40,24],null,1.7,PINK);
    if(S.collar==='scarf'){blob(c,[30,66,50,60,70,66,66,78,50,83,34,78]);inked(c,'#d9534f',1.4,'#4a0e16');line(c,[38,70,50,75,62,70],'#f08a80',1);blob(c,[60,76,70,80,68,96,60,92]);inked(c,'#b8403e',1.2,'#4a0e16');}
    else if(S.collar==='ruff'){for(let i=0;i<7;i++){ell(c,29+i*7,69+Math.abs(i-3)*-.8,4.4,3.4);inked(c,'#f2f4fa',1,PINK);}}
    else if(S.collar==='high'){poly(c,[36,60,34,78,50,84,66,78,64,60,57,72,50,74,43,72]);inked(c,sh(S.cloth,.7),1.3,PINK);circ(c,50,79,2.6);inked(c,S.trim,1);}
    else if(S.collar==='apron'){rr(c,34,80,32,30,4);inked(c,S.apron||'#f2eee0',1.3,PINK);line(c,[36,80,42,68],S.apron||'#f2eee0',2.4);line(c,[64,80,58,68],S.apron||'#f2eee0',2.4);}
    else if(S.collar==='stripes'){c.save();blob(c,[50,63,72,67,91,78,97,106,3,106,9,78,28,67]);c.clip();c.fillStyle=S.trim;for(let y=70;y<104;y+=7)c.fillRect(0,y,100,3);c.restore();poly(c,[42,66,50,76,58,66]);c.fillStyle=sh(S.skin,.76);c.fill();}
    else if(S.collar==='coat'){poly(c,[40,66,50,90,36,84,30,70]);inked(c,sh(S.cloth,.7),1.2,PINK);poly(c,[60,66,50,90,64,84,70,70]);inked(c,sh(S.cloth,.7),1.2,PINK);poly(c,[43,66,50,82,57,66]);c.fillStyle='#f2f0ea';c.fill();c.fillStyle=S.trim;for(const y of[92,99]){circ(c,50,y,1.6);c.fill();}}
    else if(S.collar==='robe'){poly(c,[40,65,50,84,60,65,56,64,50,74,44,64]);inked(c,sh(S.cloth,.66),1.2,PINK);line(c,[50,84,50,104],sh(S.cloth,.66),1.4);}
    else{poly(c,[42,66,50,77,58,66]);c.fillStyle=sh(S.skin,.76);c.fill();line(c,[42,66,50,77,58,66],S.trim,2);}
    if(S.chain){c.setLineDash([2.4,1.8]);c.beginPath();c.moveTo(36,70);c.quadraticCurveTo(50,92,64,70);c.strokeStyle=S.chain;c.lineWidth=1.8;c.stroke();c.setLineDash([]);circ(c,50,82,3);inked(c,S.chain,1);}
  }
  function hat(c,S,front){
    const h=S.hat,hair=S.hair||'#4a3020',trim=S.trim,cl=S.hatCol||S.cloth;
    if(!front){
      if(h==='hood'){blob(c,[50,8,76,14,85,40,80,64,66,76,34,76,20,64,15,40,24,14]);inked(c,cl,1.7,PINK);blob(c,[50,16,70,20,76,40,72,60,62,70,38,70,28,60,24,40,30,20]);c.fillStyle=sh(cl,.5);c.fill();}
      else if(h==='long'||h==='fringe'){blob(c,[50,14,72,18,78,40,76,66,66,72,34,72,24,66,22,40,28,18]);inked(c,sh(hair,.8),1.5,PINK);}
      else if(h==='bun'){circ(c,50,13,9);inked(c,hair,1.5,PINK);if(S.pen){line(c,[36,6,66,18],PINK,2.6);line(c,[36,6,66,18],'#f2eee0',1.3);}}
      else if(h==='feather'){ell(c,50,30,37,9);inked(c,sh(cl,.66),1.6,PINK);}
      else if(h==='mob'){c.beginPath();for(let i=0;i<=10;i++){const a=Math.PI+i*Math.PI/10;c.lineTo(50+Math.cos(a)*29,34+Math.sin(a)*27);c.lineTo(50+Math.cos(a+.16)*25,34+Math.sin(a+.16)*23);}c.lineTo(76,40);c.lineTo(24,40);c.closePath();inked(c,'#f6f4ee',1.4,PINK);}
      return;
    }
    const top=(p,col)=>{blob(c,p);inked(c,col,1.6,PINK);};
    if(h==='hood'){c.beginPath();c.moveTo(22,52);c.quadraticCurveTo(18,14,50,11);c.quadraticCurveTo(82,14,78,52);c.quadraticCurveTo(74,28,50,24);c.quadraticCurveTo(26,28,22,52);c.closePath();inked(c,cl,1.6,PINK);
      c.beginPath();c.moveTo(25,48);c.quadraticCurveTo(27,27,50,23.4);c.quadraticCurveTo(73,27,75,48);c.strokeStyle=trim;c.lineWidth=1.2;c.stroke();c.fillStyle=sh(cl,1.3);ell(c,36,17,8,2.6,-.4);c.fill();}
    else if(h==='cap'){top([26,37,30,17,50,11,70,17,74,37,50,31],trim);line(c,[27,35,50,30,73,35],sh(trim,.6),2);}
    else if(h==='toque'){top([31,30,22,15,34,2,50,7,66,2,78,15,69,30,50,26],'#f6f4ee');rr(c,29,27,42,8,3);inked(c,'#e8e4da',1.4,PINK);line(c,[40,10,42,24],'#c8c4bc',1);line(c,[58,9,57,24],'#c8c4bc',1);}
    else if(h==='knit'){top([26,38,29,17,50,10,71,17,74,38,50,33],'#b83a3a');rr(c,25,31,50,8,3.4);inked(c,'#9a2c2c',1.4,PINK);c.strokeStyle='#e8d8d0';c.lineWidth=.9;c.beginPath();for(let x=30;x<72;x+=5){c.moveTo(x,32.4);c.lineTo(x,37.6);}c.stroke();circ(c,50,8,5.4);inked(c,'#f2eee0',1.3,PINK);}
    else if(h==='peaked'){top([27,33,30,14,50,8,70,14,73,33,50,29],'#1e2c4c');blob(c,[24,35,50,29,76,35,66,41,50,38,34,41]);inked(c,'#12182c',1.4,PINK);line(c,[28,31.6,50,27.4,72,31.6],'#f2c64a',1.6);circ(c,50,19,4);inked(c,'#f2c64a',1.1);}
    else if(h==='feather'){top([30,31,31,10,50,5,69,10,70,31,50,27],cl);line(c,[31,28.4,50,24.4,69,28.4],trim,2.4);
      c.beginPath();c.moveTo(64,24);c.quadraticCurveTo(84,2,96,14);c.quadraticCurveTo(82,12,68,28);c.closePath();inked(c,'#f2eee0',1.2,PINK);line(c,[66,26,90,11],'#c8c4bc',.8);}
    else if(h==='mob'){blob(c,[26,38,30,22,50,16,70,22,74,38,62,30,50,28,38,30]);inked(c,'#f6f4ee',1.4,PINK);line(c,[30,33,50,27,70,33],trim,1.6);}
    else if(h==='helm'){top([25,40,27,16,50,8,73,16,75,40,60,33,50,32,40,33],'#9aa0b0');c.fillStyle='rgba(255,255,255,.4)';ell(c,38,18,7,2.6,-.5);c.fill();rr(c,47.6,30,4.8,22,2);inked(c,'#868c98',1.3,PINK);line(c,[26,37,74,37],'#6a7080',1.6);}
    else if(h==='circlet'){top([27,40,29,19,50,12,71,19,73,40,64,27,50,24,36,27],hair);line(c,[28,31,50,25,72,31],PINK,3.6);line(c,[28,31,50,25,72,31],'#f2c64a',2);poly(c,[50,20,53,25,50,30,47,25]);inked(c,'#7ad8ff',.9);}
    else if(h==='mop'){top([26,42,25,24,34,12,50,9,66,12,76,22,74,42,68,32,60,36,52,30,44,37,36,31,31,36],hair);}
    else if(h==='wild'){c.beginPath();for(let i=0;i<=9;i++){const a=Math.PI*.96+i*Math.PI*1.08/9;c.lineTo(50+Math.cos(a)*30,36+Math.sin(a)*29);c.lineTo(50+Math.cos(a+.17)*22,36+Math.sin(a+.17)*21);}c.lineTo(70,34);c.lineTo(50,28);c.lineTo(30,34);c.closePath();inked(c,hair,1.4,PINK);}
    else if(h==='tonsure'){for(const s of[-1,1]){blob(c,[50+s*17,26,50+s*25,32,50+s*24,48,50+s*20,40]);inked(c,hair,1.3,PINK);}c.fillStyle='rgba(255,255,255,.3)';ell(c,44,24,7,2.4,-.2);c.fill();}
    else if(h==='bandana'){top([27,39,29,19,50,12,71,19,73,39,50,33],'#b83a3a');blob(c,[72,31,84,28,82,38,74,37]);inked(c,'#9a2c2c',1.2,PINK);c.fillStyle='#f2eee0';for(const p of[[38,22],[52,18],[62,26],[44,29]]){circ(c,p[0],p[1],1.1);c.fill();}}
    else if(h==='slick'){top([27,40,29,18,50,11,71,18,73,40,66,26,46,23,36,28],hair);line(c,[44,14,40,26],'rgba(255,255,255,.4)',1.4);}
    else if(h==='bun'){top([27,40,29,20,50,13,71,20,73,40,66,28,50,22,34,28],hair);line(c,[50,14,50,23],sh(hair,.7),1);}
    else if(h==='fringe'){top([26,44,27,22,40,11,56,10,70,16,75,34,72,44,68,30,58,25,48,34,40,27,31,33],hair);c.fillStyle=sh(hair,1.35);ell(c,44,17,8,2.4,-.3);c.fill();}
    else if(h==='long'){top([26,48,27,22,40,11,56,10,71,17,75,48,68,30,56,24,44,28,34,26,30,34],hair);c.fillStyle=sh(hair,1.3);ell(c,44,17,8,2.4,-.3);c.fill();}
    else top([27,40,29,19,50,12,71,19,73,40,64,27,50,24,36,27],hair);
  }
  function human(c,S,m){hat(c,S,false);shoulders(c,S);if(S.back)S.back(c);skinHead(c,S);face(c,S,m);hat(c,S,true);if(S.over)S.over(c,m);}
  /* ---------- the named cast ---------- */
  function specFor(id,opts){
    const eq=(typeof heroGear==='function')?heroGear():{},CL=(typeof CLOAK_ART!=='undefined'&&CLOAK_ART[eq.cloak])||{c:'#43357a',trim:'#b9a6f0'};
    if(id==='shiloh')return{skin:'#eacdae',hair:'#b8502a',eye:'#4f7a46',hat:'hood',hatCol:CL.c,cloth:CL.c,trim:CL.trim,collar:'scarf',freckles:1,browW:2,
      over(c){blob(c,[31,40,33,26,46,23,60,25,54,30,46,29,40,36,36,33]);inked(c,'#b8502a',1.3,'#3a1408');c.fillStyle='#d8703e';ell(c,44,26.4,6,1.5,-.2);c.fill();line(c,[67,30,70,42],'#b8502a',2);}};
    if(id==='perrin')return{skin:'#f0d2b4',hair:'#d8b464',eye:'#3f88b8',hat:'long',cloth:'#2c7d99',trim:'#eefaff',collar:'coat',browW:1.9,scar:0,
      over(c){c.fillStyle='rgba(60,40,60,.18)';ell(c,40,53,3.4,1.6);c.fill();poly(c,[46,96,50,91,54,96,50,101]);inked(c,'#bfe6f0',1);}};
    if(id==='quill')return{skin:'#d8bca4',hair:'#b9b4c0',eye:'#5a5670',hat:'bun',pen:1,cloth:'#1c1826',trim:'#c8a040',collar:'high',old:1,glasses:1,browW:1.6,
      over(c){line(c,[60.4,52,63,62],'rgba(90,60,60,.5)',.9);line(c,[39.6,52,37,62],'rgba(90,60,60,.5)',.9);}};
    // npc kinds
    const k=id,L=(opts&&opts.look)||{},K=(typeof NPC_KINDS!=='undefined'&&NPC_KINDS[k])||{};
    const S={skin:L.skin||'#e0b890',hair:L.hair||'#4a3020',cloth:L.cloth||'#6a5040',trim:L.trim||'#d8c8a0',eye:'#4a3424',hat:K.hat||K.hair||(L.hat==='hood'?'hood':L.hat==='cap'?'cap':L.hat==='helm'?'helm':'short')};
    if(L.mask)S.mask='#eef0f6';
    switch(k){
      case'scullion':S.freckles=1;S.eye='#5a6a3a';S.over=c=>{c.fillStyle='rgba(40,30,30,.35)';ell(c,61,57,3,1.6,.4);c.fill();};break;
      case'potboy':S.hair='#2a2018';S.eye='#3a2a1a';S.collar='apron';S.apron='#b8ae98';break;
      case'cook':S.collar='apron';S.beard=null;S.old=1;S.over=c=>{c.fillStyle='rgba(230,100,80,.3)';ell(c,36,56,4.6,3);c.fill();ell(c,64,56,4.6,3);c.fill();line(c,[42,60,46,58.6,50,60,54,58.6,58,60],'#5a4030',2.2);};break;
      case'prisoner':S.hair='#3a2a20';S.stubble=1;S.collar='stripes';S.cloth='#8a8478';S.trim='#4a4650';S.over=c=>{rr(c,36,72,28,7,3);inked(c,'#6a6a78',1.3,PINK);circ(c,50,75.5,2);c.fillStyle='#2a2a34';c.fill();};break;
      case'sailor':S.collar='stripes';S.cloth='#f0f2f6';S.trim='#2a5a8a';S.stubble=1;S.eye='#3a6a8a';break;
      case'pilot':S.collar='coat';S.old=1;S.beard='#c8c4cc';S.eye='#3a6a8a';S.brow='#c8c4cc';break;
      case'merchant':S.collar='coat';S.chain='#f2c64a';S.over=c=>{c.beginPath();c.moveTo(41,59);c.quadraticCurveTo(46,56.4,50,59.4);c.quadraticCurveTo(54,56.4,59,59);c.quadraticCurveTo(63,61,65,57.6);c.strokeStyle='#3a2416';c.lineWidth=2.2;c.stroke();c.beginPath();c.moveTo(41,59);c.quadraticCurveTo(37,61,35,57.6);c.stroke();};break;
      case'monk':S.collar='robe';S.hat='hood';S.eye='#5a5a7a';S.chain='#c9c4e0';break;
      case'scribe':S.collar='robe';S.glasses=1;S.over=c=>{c.fillStyle='#1c1830';ell(c,60,62,2,1.2,.3);c.fill();};break;
      case'smith':S.collar='apron';S.apron='#6a4a2c';S.stubble=1;S.scar=1;S.over=c=>{c.fillStyle='rgba(20,14,14,.4)';ell(c,38,58,3.6,2,-.4);c.fill();ell(c,57,33,3,1.4);c.fill();};break;
      case'musician':S.collar='coat';S.mask=S.mask||'#eef0f6';S.hair='#16141c';S.trim='#e0c070';break;
      case'maid':S.collar='apron';S.eye='#6a4a6a';break;
      case'elder':S.old=1;S.hair='#c8c4cc';S.brow='#a8a4ac';S.collar='';S.over=c=>{blob(c,[20,74,34,66,50,76,66,66,80,74,84,100,16,100]);inked(c,sh(S.cloth,1.3),1.5,PINK);c.strokeStyle=S.trim;c.lineWidth=1;c.beginPath();for(let x=22;x<80;x+=6){c.moveTo(x,90);c.lineTo(x-1,99);}c.stroke();line(c,[40,66,43,62.6],'rgba(90,60,60,.5)',.9);line(c,[60,66,57,62.6],'rgba(90,60,60,.5)',.9);};break;
      case'guard':S.stubble=1;S.collar='high';S.over=c=>{c.fillStyle='rgba(60,40,70,.25)';ell(c,40.4,52.6,4.4,1.6);c.fill();ell(c,59.6,52.6,4.4,1.6);c.fill();};break;
      case'noble':S.collar='ruff';S.chain='#f2c64a';S.eye='#3f88b8';break;
      default:S.collar=L.apron?'apron':'';
    }
    return S;
  }
  function ash(c,m){
    const OL='#3c1006';
    // wings and neck behind
    for(const s of[-1,1]){c.beginPath();c.moveTo(50+s*14,84);c.lineTo(50+s*46,40);c.quadraticCurveTo(50+s*40,62,50+s*50,76);c.quadraticCurveTo(50+s*40,80,50+s*44,96);c.lineTo(50+s*14,104);c.closePath();inked(c,'#a53a16',1.6,OL);line(c,[50+s*16,86,50+s*46,40],'#ff9a4a',1.6);line(c,[50+s*18,88,50+s*48,75],'#d8642a',1.1);}
    cel(c,()=>blob(c,[50,60,70,66,78,90,74,108,26,108,22,90,30,66]),'#e8641f',[46,92,22,22],null,1.7,OL);
    c.fillStyle='#ffd9a0';blob(c,[50,74,60,80,62,106,38,106,40,80]);c.fill();c.strokeStyle='rgba(180,90,30,.5)';c.lineWidth=1;c.beginPath();for(const y of[84,91,98]){c.moveTo(41,y);c.quadraticCurveTo(50,y+2.4,59,y);}c.stroke();
    // horns and frills
    for(const s of[-1,1]){
      c.beginPath();c.moveTo(50+s*12,26);c.quadraticCurveTo(50+s*20,6,50+s*34,3);c.quadraticCurveTo(50+s*28,16,50+s*24,30);c.closePath();inked(c,'#ffe6b0',1.5,OL);line(c,[50+s*19,18,50+s*24,20],'#d8b070',1);line(c,[50+s*24,10,50+s*28,13],'#d8b070',1);
      poly(c,[50+s*24,40,50+s*38,32,50+s*31,44,50+s*40,48,50+s*30,54,50+s*36,62,50+s*24,60]);inked(c,'#c8481a',1.4,OL);
    }
    cel(c,()=>blob(c,[50,20,66,22,76,38,72,54,64,70,50,78,36,70,28,54,24,38,34,22]),'#f0742a',[46,44,22,26],[40,30,9,4,-.3],1.7,OL);
    poly(c,[50,22,54,30,50,37,46,30]);inked(c,'#ffd27a',1,OL);
    blob(c,[50,52,62,56,65,66,58,75,50,77,42,75,35,66,38,56]);c.fillStyle='#ffa458';c.fill();
    for(const s of[-1,1]){
      const ex=50+s*12.6,ey=43,ry=m==='happy'?5:m==='worried'?6.6:m==='angry'?4.4:5.8;
      ell(c,ex,ey,6.6,ry,s*-.14);c.fillStyle='#fff4a0';c.fill();c.strokeStyle=OL;c.lineWidth=1.5;c.stroke();
      ell(c,ex-s*.6,ey+(m==='worried'?.6:0),m==='worried'?2.6:1.9,ry*.8);c.fillStyle='#2a1008';c.fill();circ(c,ex-s*.6-1.6,ey-2,1.3);c.fillStyle='#fff';c.fill();
      if(m==='happy'){ell(c,ex,ey+5.6,7.6,3.2);c.fillStyle='#f0742a';c.fill();c.beginPath();c.ellipse(ex,ey+5.6,7.6,3.2,0,Math.PI*1.1,Math.PI*1.9);c.strokeStyle=OL;c.lineWidth=1.3;c.stroke();}
      let bi=0,bo=0;if(m==='angry'){bi=4.4;bo=-2;}else if(m==='worried'){bi=-3.4;bo=1.6;}else if(m==='happy'){bi=-1.6;bo=-1.6;}
      line(c,[ex-s*7.4,ey-7+bi,ex+s*7.6,ey-8+bo],OL,4.2);line(c,[ex-s*7.4,ey-7+bi,ex+s*7.6,ey-8+bo],'#c8481a',2.2);
      c.fillStyle='#6a2a10';ell(c,50+s*4.6,60,1.3,1.9,s*.4);c.fill();
    }
    c.strokeStyle=OL;c.lineWidth=1.6;
    if(m==='happy'){c.beginPath();c.moveTo(39,66);c.quadraticCurveTo(50,70,61,66);c.quadraticCurveTo(50,80,39,66);c.closePath();c.fillStyle='#7a1c14';c.fill();c.stroke();ell(c,50,73,4,2.2);c.fillStyle='#f08a80';c.fill();
      c.fillStyle='#fff';for(const x of[42.6,57.4]){poly(c,[x-1.4,67.4,x+1.4,67.8,x,71]);c.fill();}}
    else if(m==='angry'){c.beginPath();c.moveTo(39,69);c.quadraticCurveTo(50,65,61,69);c.lineTo(59,72);c.quadraticCurveTo(50,69,41,72);c.closePath();c.fillStyle='#fff';c.fill();c.stroke();c.lineWidth=.8;c.beginPath();for(const x of[44,47,50,53,56]){c.moveTo(x,67.6);c.lineTo(x,70.4);}c.stroke();
      c.fillStyle='rgba(255,190,90,.8)';blob(c,[57,58,63,50,61,44,66,48,67,56,62,61]);c.fill();c.fillStyle='rgba(120,110,110,.5)';circ(c,40,52,3);c.fill();circ(c,37,46,2.2);c.fill();}
    else if(m==='worried'){c.beginPath();c.moveTo(43,69.4);c.quadraticCurveTo(46.5,66.6,50,68.8);c.quadraticCurveTo(53.5,71,57,68.4);c.stroke();}
    else{c.beginPath();c.moveTo(42,67.6);c.quadraticCurveTo(50,71.4,58,67.6);c.stroke();}
  }
  function candle(c,m){
    const D='#4a3414',hot=m==='angry';
    blob(c,[50,6,78,14,88,42,84,70,96,106,4,106,16,70,12,42,22,14]);inked(c,'#1a1222',1.8,PINK);
    blob(c,[50,16,70,22,77,44,72,66,62,76,38,76,28,66,23,44,30,22]);c.fillStyle='#0e0a14';c.fill();
    line(c,[20,74,30,104],'#d9a441',1.6);line(c,[80,74,70,104],'#d9a441',1.6);
    // crown of candles
    for(let i=0;i<5;i++){const x=28+i*11,h=[12,17,22,16,13][i],y=22-Math.abs(i-2)*-3.4;
      rr(c,x-3.4,y-h,6.8,h+5,2);inked(c,'#fff6da',1.2,D);c.fillStyle='rgba(224,160,56,.6)';c.fillRect(x-3.4,y-h+4,2,h-4);
      c.beginPath();c.moveTo(x,y-h-11-(hot?4:0));c.quadraticCurveTo(x+4.6,y-h-4,x,y-h-.6);c.quadraticCurveTo(x-4.6,y-h-4,x,y-h-11-(hot?4:0));inked(c,'#ffb040',1,'#8a3a08');ell(c,x,y-h-3.6,1.3,2.2);c.fillStyle='#fff2c0';c.fill();}
    line(c,[24,26,50,20,76,26],PINK,5);line(c,[24,26,50,20,76,26],'#d9a441',2.8);
    // wax mask
    const M=()=>blob(c,[50,24,66,27,71,42,68,60,59,74,50,78,41,74,32,60,29,42,34,27]);
    M();c.fillStyle='#efe4bd';c.fill();c.save();M();c.clip();c.fillStyle='#d8c48a';ell(c,73,54,10,30);c.fill();c.fillStyle='#fff8e0';ell(c,42,36,8,4,-.3);c.fill();c.restore();M();c.strokeStyle=D;c.lineWidth=1.7;c.stroke();
    line(c,[56,26,58,34,55,39],'rgba(74,52,20,.6)',.9);
    for(const s of[-1,1]){const ex=50+s*9.6,ey=46;
      c.fillStyle='#1c1008';
      if(m==='happy'){c.beginPath();c.moveTo(ex-5.4,ey+1.6);c.quadraticCurveTo(ex,ey-6.4,ex+5.4,ey+1.6);c.quadraticCurveTo(ex,ey-1.4,ex-5.4,ey+1.6);c.fill();}
      else poly(c,[ex-s*5.4,ey-(hot?-.6:3)-(m==='worried'?1.6:0),ex+s*5.4,ey-(hot?4.6:3)+(m==='worried'?1.6:0),ex+s*4.6,ey+3.6,ex-s*4.6,ey+3.2]),c.fill();
      if(m!=='happy'){c.beginPath();c.moveTo(ex,ey-2.4-(hot?1.6:0));c.quadraticCurveTo(ex+2.2,ey+1,ex,ey+2.6);c.quadraticCurveTo(ex-2.2,ey+1,ex,ey-2.4-(hot?1.6:0));c.fillStyle=hot?'#fff2c0':'#ffa838';c.fill();}
      // wax tears
      blob(c,[ex+s*2,ey+4,ex+s*3.6,ey+10+(m==='worried'?6:0),ex+s*2,ey+14+(m==='worried'?6:0),ex+s*.6,ey+10]);c.fillStyle='rgba(224,160,56,.75)';c.fill();
    }
    c.strokeStyle=D;c.lineWidth=1.5;c.beginPath();
    if(m==='happy'){c.moveTo(41,62);c.quadraticCurveTo(50,71,59,62);}else if(hot){c.moveTo(42,67);c.quadraticCurveTo(50,61,58,67);}else if(m==='worried'){c.moveTo(44,66);c.quadraticCurveTo(50,63,56,66);}else{c.moveTo(42,64.6);c.lineTo(58,64.6);}
    c.stroke();c.lineWidth=.9;c.beginPath();for(const x of[44.6,48.2,51.8,55.4]){const y=m==='happy'?65.4-Math.abs(x-50)*.34:hot?64.6+Math.abs(x-50)*.3:64.6;c.moveTo(x,y-2);c.lineTo(x,y+2);}c.stroke();
    blob(c,[44,77,50,79,56,77,54,86,50,90,47,84]);inked(c,'#efe4bd',1.1,D);
  }
  function warden(c,m){
    const hot=m==='angry';
    // the great bell rises behind him like a halo
    circ(c,50,42,44);inked(c,'#7a5a18',2);circ(c,50,42,40);c.fillStyle='#c8982e';c.fill();c.strokeStyle='#6a4a10';c.lineWidth=1.4;circ(c,50,42,32);c.stroke();
    c.strokeStyle='#8a6414';c.lineWidth=1.3;c.beginPath();for(let i=0;i<16;i++){const a=i*.3927;c.moveTo(50+Math.cos(a)*34,42+Math.sin(a)*34);c.lineTo(50+Math.cos(a+.1)*38.6,42+Math.sin(a+.1)*38.6);}c.stroke();
    if(hot)line(c,[14,30,24,36,20,46,30,50],'#2a1608',2.2);
    cel(c,()=>blob(c,[50,62,72,66,92,78,98,106,2,106,8,78,28,66]),'#40306a',[44,96,40,24],null,1.8,PINK);
    for(const s of[-1,1]){cel(c,()=>circ(c,50+s*36,84,15),'#c89a30',[50+s*36-3,81,10,10],[50+s*36-5,76,5,2.6,-.4],1.7,PINK);circ(c,50+s*36,84,9);c.strokeStyle='#6a4a10';c.lineWidth=1.2;c.stroke();}
    c.setLineDash([3,2.2]);line(c,[30,72,50,92,70,72],'#c8a040',2.4);c.setLineDash([]);
    cel(c,()=>blob(c,[50,14,70,18,78,40,74,62,62,76,38,76,26,62,22,40,30,18]),'#2f2646',[46,42,22,28],[40,24,9,3.6,-.3],1.8,PINK);
    blob(c,[50,32,64,35,68,48,64,62,56,70,44,70,36,62,32,48,36,35]);c.fillStyle='#0c0814';c.fill();c.strokeStyle='#e0b040';c.lineWidth=1.8;c.stroke();
    line(c,[50,14,50,32],'#8f96a8',3);line(c,[23,40,34,43],'#8f96a8',3);line(c,[77,40,66,43],'#8f96a8',3);
    c.fillStyle='#565c6c';for(const p of[[50,19],[50,27],[27,41],[73,41]]){circ(c,p[0],p[1],1.6);c.fill();}
    for(const s of[-1,1]){const ex=50+s*8.6,ey=48;
      c.fillStyle=hot?'#ff7a3a':m==='worried'?'#cfe6ff':'#ffe08a';
      if(m==='happy'){c.beginPath();c.moveTo(ex-4.6,ey+1.4);c.quadraticCurveTo(ex,ey-5,ex+4.6,ey+1.4);c.quadraticCurveTo(ex,ey-1.6,ex-4.6,ey+1.4);c.fill();}
      else if(m==='worried'){ell(c,ex,ey,3.6,3.9);c.fill();c.fillStyle='#0c0814';circ(c,ex,ey,1.5);c.fill();}
      else{poly(c,[ex-s*4.8,ey+(hot?1.6:-.6),ex+s*5,ey-(hot?3.6:2.2),ex+s*4,ey+2.6,ex-s*4,ey+2.6]);c.fill();}
      c.globalCompositeOperation='lighter';c.fillStyle=hot?'rgba(255,110,50,.3)':'rgba(255,220,130,.2)';circ(c,ex,ey,7);c.fill();c.globalCompositeOperation='source-over';}
    c.strokeStyle='#8f96a8';c.lineWidth=1.7;c.beginPath();for(const x of[42,50,58]){c.moveTo(x,34);c.lineTo(x+(x-50)*.16,69);}c.stroke();
    line(c,[34,57,66,57],'#8f96a8',1.5);
    if(hot){c.fillStyle='rgba(255,122,58,.7)';ell(c,50,63,5,1.6);c.fill();}
  }
  function resolve(id,opts){
    let k=String(id==null?'':id).trim(),npc=opts&&opts.npc;
    if(k.indexOf('npc:')===0){k=k.slice(4);}
    const low=k.toLowerCase();
    if(ALIAS[low])return{k:ALIAS[low]};
    const kindOf=typeof npcKindOf==='function'?npcKindOf:null;
    if(npc&&kindOf)return{k:kindOf(npc),look:npc.look};
    if(typeof NPC_KINDS!=='undefined'){
      if(NPC_KINDS[low])return{k:low,look:opts&&opts.look};
      if(typeof NPC_BY_ID!=='undefined'&&NPC_BY_ID[low])return{k:NPC_BY_ID[low],look:opts&&opts.look};
      if(kindOf){const kk=kindOf({role:k,look:opts&&opts.look});return{k:kk,look:opts&&opts.look};}
    }
    return{k:'servant',look:opts&&opts.look};
  }
  function bake(R,mood,px,frame){
    const cv=document.createElement('canvas');cv.width=cv.height=px;const c=cv.getContext('2d'),s=px/100;
    c.scale(s,s);c.lineJoin='round';c.lineCap='round';
    const r=frame?13:0;
    c.save();rr(c,2,2,96,96,r);c.clip();
    const tint=BG[R.k]||(R.look&&R.look.cloth)||'#3a2a48';
    const g=c.createRadialGradient(50,40,6,50,50,72);g.addColorStop(0,sh(tint,1.15));g.addColorStop(1,'#120c18');c.fillStyle=g;c.fillRect(0,0,100,100);
    c.strokeStyle='rgba(255,255,255,.05)';c.lineWidth=5;c.beginPath();for(let i=-100;i<100;i+=18){c.moveTo(i,100);c.lineTo(i+100,0);}c.stroke();
    if(R.k==='ash')ash(c,mood);else if(R.k==='candle')candle(c,mood);else if(R.k==='warden')warden(c,mood);
    else human(c,specFor(R.k,{look:R.look}),mood);
    c.restore();
    if(frame){rr(c,2,2,96,96,r);c.strokeStyle='#1a1018';c.lineWidth=4;c.stroke();c.strokeStyle='#e2aa46';c.lineWidth=2;c.stroke();rr(c,5.4,5.4,89.2,89.2,r-3);c.strokeStyle='rgba(255,226,150,.35)';c.lineWidth=.8;c.stroke();}
    return cv;
  }
  function canvas(id,size,mood,opts){
    const R=resolve(id,opts),m=MOOD[mood]||'calm',px=Math.max(32,Math.min(384,Math.ceil(size*2/16)*16)),frame=!(opts&&opts.frame===false);
    const L=R.look||{},eq=(R.k==='shiloh'&&typeof heroGear==='function')?(heroGear().cloak||''):'';
    const key=R.k+'|'+m+'|'+px+'|'+frame+'|'+(L.cloth||'')+(L.skin||'')+(L.trim||'')+(L.mask?'m':'')+eq;
    let cv=cache.get(key);
    if(!cv){if(cache.size>90)cache.clear();try{cv=bake(R,m,px,frame);}catch(e){cv=document.createElement('canvas');cv.width=cv.height=4;}cache.set(key,cv);}
    return cv;
  }
  function draw(ctx,id,x,y,size,mood,opts){ctx.drawImage(canvas(id,size,mood,opts),x,y,size,size);}
  /* a sensible mood for a line of HUD dialogue */
  function moodFor(who,text){
    const t=String(text||''),w=String(who||'').toLowerCase();
    if(w.indexOf('candle')>=0)return/\?$/.test(t)?'calm':'angry';
    if(typeof G!=='undefined'&&G&&(G.alert>.7||G.hurtFlash>0))return'worried';
    if(/!$/.test(t))return w.indexOf('ash')>=0?'happy':'worried';
    if(/\b(sorry|careful|quiet|afraid|hurt|run)\b/i.test(t))return'worried';
    return w.indexOf('ash')>=0?'happy':'calm';
  }
  return{draw,canvas,moodFor,resolve,MOODS:['calm','happy','worried','angry']};
})();
if(typeof window!=='undefined')window.Portraits=Portraits;
