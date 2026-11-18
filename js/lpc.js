/* EMBERCROWN - pixel art (LPC sprites).
   Shiloh, guards and NPCs are drawn from Liberated Pixel Cup sprite sheets (assets/lpc/, credits in
   CREDITS-LPC.md) instead of the code-drawn figures, on every mission and in the hub.
   Shiloh and House Marrow's guards use ready-made sheets; other houses' guards, archers, brutes and NPCs are
   assembled from tinted layers at run time (js/lpcgen.js). Ashfall Keep also uses LPC floor and wall tiles.
   Toggle: settings.lpc ("Pixel art" in the pause menu). Everything falls back to the original art when off
   or when an image has not loaded. */
'use strict';
const LPC=(function(){
  const IMG={},ok={};
  for(const n of['shiloh','guard_marrow','tiles','boss_warden','boss_candle']){const i=new Image();i.onload=()=>{ok[n]=true;if(typeof G!=='undefined'&&G)G.dirty=true;};i.src='assets/lpc/'+n+'.png';IMG[n]=i;}
  // sheet layout written by the asset build: walk 4 rows x9, slash 4x6, thrust 4x8, hurt 1x6; 64px frames
  const ROW={walk:0,slash:4,thrust:8,hurt:12},NF={walk:9,slash:6,thrust:8,hurt:6};
  const SC=.8,FOOT=58; // draw scale, and the y of the feet inside a 64px frame
  function trialLevel(){return typeof G!=='undefined'&&G&&G.d&&!G.d.hub&&!G.dng&&G.d===LEVELS[0];}
  function on(){return settings.lpc!==false&&typeof G!=='undefined'&&!!G&&!!G.d;}
  function tiles(){return on()&&!G.flight;}
  // sheets assembled at run time (js/lpcgen.js) are 5 rows: walk up/left/down/right, then hurt
  const GEN={};
  function add(name,cv){IMG[name]=cv;ok[name]=true;GEN[name]=true;}
  // facing angle to LPC row: 0 up, 1 left, 2 down, 3 right
  function dir(f){const x=Math.cos(f),y=Math.sin(f);return Math.abs(x)>Math.abs(y)?(x>0?3:1):(y>0?2:0);}
  function walkFrame(ph){return 1+((Math.floor(ph/(Math.PI*2)*8)%8)+8)%8;}
  // one-colour copy of a frame, used to draw a 1px outline around a figure
  const SIL=new Map();
  function sil(name,fx,fy,col){
    const k=name+fx+','+fy+col;let s=SIL.get(k);
    if(!s){if(SIL.size>400)SIL.clear();s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d');
      g.drawImage(IMG[name],fx,fy,64,64,0,0,64,64);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,64,64);SIL.set(k,s);}
    return s;
  }
  let SCX=1; // extra scale for big figures (bosses)
  function blit(name,anim,frame,d,x,y,alpha,line,flash){
    const c=ctx,row=GEN[name]?(anim==='hurt'?4:d):ROW[anim]+(anim==='hurt'?0:d),fr=Math.max(0,Math.min(NF[anim]-1,frame|0));
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    if(alpha!=null)c.globalAlpha=alpha;
    const K=SC*SCX,X=x-32*K,Y=y+8-FOOT*K,m=c.getTransform();
    if(!m.b&&!m.c){ // land on whole canvas pixels so no sprite column is dropped or doubled
      c.save();c.setTransform(1,0,0,1,0,0);
      const dx=Math.round(m.a*X+m.e),dy=Math.round(m.d*Y+m.f),dw=Math.round(64*K*m.a),dh=Math.round(64*K*m.d);
      if(line){const o=Math.max(1,Math.round(dw/64)),sl=sil(name,fr*64,row*64,line);
        c.drawImage(sl,dx-o,dy,dw,dh);c.drawImage(sl,dx+o,dy,dw,dh);c.drawImage(sl,dx,dy-o,dw,dh);c.drawImage(sl,dx,dy+o,dw,dh);}
      c.drawImage(IMG[name],fr*64,row*64,64,64,dx,dy,dw,dh);
      if(flash){c.globalAlpha=.85;c.drawImage(sil(name,fr*64,row*64,'#ffffff'),dx,dy,dw,dh);} // white hit flash
      c.restore();
    }else c.drawImage(IMG[name],fr*64,row*64,64,64,Math.round(X),Math.round(Y),64*K,64*K);
    c.globalAlpha=1;c.imageSmoothingEnabled=sm;
  }
  function drawShiloh(w,active){
    const sp=Math.hypot(w.vx||0,w.vy||0),mv=sp>14,f=vfa(w),d=dir(f);
    const st=typeof charState==='function'?charState(w,active):{death:0,hurt:0};
    const atk=w.atk&&w.atk.a!==undefined?w.atk:null;
    const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!st.death;
    shadowAt(w.x,w.y+7,11,4.5,.38);
    if(st.death>0){blit('shiloh','hurt',st.death*5.99,d,w.x,w.y);return;}
    if(atk){const u=1-atk.t/atk.t0;
      if(atk.combo===2)blit('shiloh','thrust',1+u*6.99,d,w.x,w.y,blink?.4:1,'#f3e6c4');
      else blit('shiloh','slash',u*5.99,d,w.x,w.y,blink?.4:1,'#f3e6c4');return;}
    if(w.rollAnim>0){const u=1-w.rollAnim/.3;blit('shiloh','walk',1+u*7.99,d,w.x,w.y+Math.sin(u*Math.PI)*-4,.75);return;}
    if(st.hurt>.5){blit('shiloh','hurt',1,d,w.x,w.y,blink?.4:1);return;}
    const fr=mv?walkFrame(w.ph||0):0;
    blit('shiloh','walk',fr,d,w.x,w.y,blink?.35:(G.sneak&&active?.82:1),active?(G.sneak?'#8f7fd0':'#f3e6c4'):null);
  }
  function drawMarrow(g,name){
    name=name||'guard_marrow';
    const hit=G.time-(g.hitT===undefined?-9:g.hitT)<.09;
    if(g.ko&&g.stun>0){shadowAt(g.x,g.y+6,14,5,.4);blit(name,'hurt',hit?2:5,0,g.x,g.y+4,1,null,hit);return;}
    const moving=g._lx!=null&&Math.hypot(g.x-g._lx,g.y-g._ly)>.05;g._lx=g.x;g._ly=g.y;
    const d=dir(vfa(g));
    shadowAt(g.x,g.y+7,12,5,.38);
    if(g.stun>0){blit(name,'hurt',1,d,g.x,g.y,1,null,hit);return;}
    const hu=g.hopT===undefined?1:(G.time-g.hopT)/.26,hop=hu>=0&&hu<1?Math.sin(hu*Math.PI)*6:0; // startle hop when he first sees you
    blit(name,'walk',moving?walkFrame(g.ph||0):0,d,g.x,g.y-hop,1,g.seeing?'#ff5440':(g.lure||g.ret)?'#ffc060':null);
  }
  // Floors and wall faces from LPC tiles, one row per house in assets/lpc/tiles.png (tools/build_lpc_tiles.py):
  // [floor A, floor B, wall face]. Outdoor zones (water, courtyards) keep the house art.
  const ROWS=['marrow','grell','sable','kest','dunmoor','hallow','hub'];
  function row(){const k=typeof TILES!=='undefined'&&TILES.key?TILES.key():'marrow';return ROWS.indexOf(k);}
  function isWall(x,y){const r=G.grid[y];return!r||r[x]==='#'||r[x]===' '||r[x]===undefined;}
  function shade(c,x,y){
    const rm=G.rooms&&G.roomOf&&G.roomOf[y]&&G.roomOf[y][x]>=0?G.rooms[G.roomOf[y][x]]:null;
    if(rm&&rm.tint&&rm.tint<1){c.fillStyle='rgba(0,0,0,'+((1-rm.tint)*1.2).toFixed(3)+')';c.fillRect(x*T,y*T,T,T);}
    if(G.state==='ruin'){c.fillStyle='rgba(26,18,12,.38)';c.fillRect(x*T,y*T,T,T);}
  }
  function floor(c,x,y){
    const r=row();if(!ok.tiles||r<0)return false;
    const z=typeof TILES!=='undefined'&&TILES.zone?TILES.zone(x,y):'';if(z==='water'||z==='court')return false;
    const ri=G.roomOf&&G.roomOf[y]?G.roomOf[y][x]:-1;
    const v=r===0?((x*7+y*3)%2):(ri>=0?ri%2:0); // one floor per room, so rooms read as places
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.tiles,v*32,r*32,32,32,x*T,y*T,T,T);c.imageSmoothingEnabled=sm;
    shade(c,x,y);return true;
  }
  function wallFace(c,x,y){
    const r=row();if(!ok.tiles||r<0||isWall(x,y+1)||y+1>=G.gh)return;
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.tiles,64,r*32,32,32,x*T,y*T,T,T);c.imageSmoothingEnabled=sm;
    c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x*T,y*T+T-3,T,3); // contact shadow at the base
    if(G.state==='ruin'){c.fillStyle='rgba(26,18,12,.35)';c.fillRect(x*T,y*T,T,T);}
  }
  // Bosses: the Bell-Warden and the Candlemaker from LPC layers, larger than everyone else; their telegraphs,
  // shockwaves and orbs are still drawn by the combat code, the candle shield and orbit are drawn here.
  function drawBossLPC(g){
    const cm=g.kind==='candle',name=cm?'boss_candle':'boss_warden';if(!ok[name])return false;
    const t=G.time,st=g.st,f=vfa(g),d=dir(f),dead=g.dead,dT=g.deathT||0,flash=g.hurt>0&&Math.floor(t*20)%2===0;
    const lift=st==='leap'?Math.sin((g.leapU||0)*Math.PI)*40:0,hov=cm&&!dead?-3+Math.sin(t*2.4)*3:0;
    let anim='walk',fr=0,al=1;
    const moving=g._lx!=null&&Math.hypot(g.x-g._lx,g.y-g._ly)>.05;g._lx=g.x;g._ly=g.y;
    if(dead){anim='hurt';fr=Math.min(5,dT*5);al=Math.max(0,1-Math.max(0,dT-1)/1.6);}
    else if(g.stg>0||st==='stagger'){anim='hurt';fr=1;}
    else if(cm){
      if(st==='volleyWind'||st==='ringWind'||st==='summon'){anim='slash';fr=1+Math.min(1,(t*3)%2);}
      else if(st==='slashWind'){anim='slash';fr=Math.min(5,(1-g.t/.42)*6);}
      else if(st==='blinkWind'){al=.35+.3*Math.sin(t*30);fr=0;}
      else fr=walkFrame(t*5);
    } else {
      if(st==='windSlam'){anim='slash';fr=Math.min(2,(1-g.t/(g.p2?.7:.9))*3);}
      else if(st==='slam'){anim='slash';fr=4;}
      else if(st==='windCharge'||st==='windLeap'){anim='walk';fr=0;}
      else if(st==='charge'||st==='leap'){fr=walkFrame(t*14);}
      else if(st==='toll'){anim='slash';fr=3;}
      else fr=moving||g.eng?walkFrame(g.ph||t*6):0;
    }
    shadowAt(g.x,g.y+10,24*(1-lift/140),9*(1-lift/140),.42-lift/200);
    if(cm&&!dead){ // candle orbit behind, shield aura
      for(let i=0;i<6;i++){const a=i/6*6.283+t*.6;if(Math.sin(a)>0)continue;const cx=g.x+Math.cos(a)*22,cy=g.y-18+Math.sin(a)*8+hov;
        ctx.fillStyle='#e8e0c0';ctx.fillRect(cx-1,cy-2,2,5);ctx.fillStyle='#ffb040';ctx.fillRect(cx-1,cy-5-(Math.sin(t*12+i)>0?1:0),2,3);}
    }
    SCX=1.45;try{blit(name,anim,fr,d,g.x,g.y-lift+hov,al,cm?'#f6e3b0':'#e8c050',flash);}finally{SCX=1;}
    if(cm&&!dead){
      for(let i=0;i<6;i++){const a=i/6*6.283+t*.6;if(Math.sin(a)<=0)continue;const cx=g.x+Math.cos(a)*22,cy=g.y-18+Math.sin(a)*8+hov;
        ctx.fillStyle='#e8e0c0';ctx.fillRect(cx-1,cy-2,2,5);ctx.fillStyle='#ffb040';ctx.fillRect(cx-1,cy-5-(Math.sin(t*12+i)>0?1:0),2,3);}
      if(G.candlesLit>0&&g.eng){ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,190,90,'+(.3+.2*Math.sin(t*6))+')';ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(g.x,g.y-14+hov,26+Math.sin(t*4)*1.5,32,0,0,6.283);ctx.stroke();ctx.globalCompositeOperation='source-over';}
    }
    if((g.stg>0)&&!dead)for(let i=0;i<3;i++){const a=t*4+i*2.09;ctx.fillStyle='#ffe27a';ctx.fillRect(g.x+Math.cos(a)*12-1,g.y-52+Math.sin(a)*3,3,3);}
    return true;
  }
  return{drawBossLPC,on,tiles,trialLevel,add,blit,walkFrame,ready:n=>!!ok[n],drawShiloh,drawMarrow,dir,floor,wallFace};
})();
// Swap in the LPC figures without touching the original draw functions.
{
  const _drawWren=drawWren;
  drawWren=function(w,active){if(LPC.on()&&LPC.ready('shiloh'))return LPC.drawShiloh(w,active);return _drawWren(w,active);};
  const _drawGuard=drawGuard;
  drawGuard=function(g){
    if(LPC.on()&&!g.boss&&!g.spin){
      const kind=g.kind||'guard';
      if(kind==='guard'&&LPC.trialLevel()){if(LPC.ready('guard_marrow'))return LPC.drawMarrow(g);}
      else if(typeof LPCG!=='undefined'&&(kind==='guard'||kind==='archer'||kind==='brute')){
        const k=LPCG.guard(kind,(G.d.th&&G.d.th.guard)||'#8d8a98');if(k)return LPC.drawMarrow(g,k);}
    }
    return _drawGuard(g);
  };
}
// Tiles: only while baking Ashfall Keep with pixel art on; other houses keep their own tile art.
if(typeof TILES!=='undefined'){
  const _floor=TILES.floor,_wall=TILES.wall;
  TILES.floor=function(c,x,y,p,fs,th){if(LPC.tiles()&&!G.flight&&LPC.floor(c,x,y))return true;return _floor.apply(this,arguments);};
  TILES.wall=function(c,x,y,p,flight){const r=_wall.apply(this,arguments);if(LPC.tiles()&&!flight)LPC.wallFace(c,x,y);return r;};
}
// Bosses: swap the drawn body for the LPC figure while pixel art is on.
{
  const _drawBoss=drawBoss;
  drawBoss=function(g){if(LPC.on()&&LPC.drawBossLPC(g))return;return _drawBoss(g);};
}
