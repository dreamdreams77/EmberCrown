/* EMBERCROWN - LPC art trial.
   Ashfall Keep only: Shiloh and House Marrow's guards are drawn from Liberated Pixel Cup sprite sheets
   (assets/lpc/*.png, credits in CREDITS-LPC.md) instead of the code-drawn figures.
   Toggle: settings.lpc ("LPC art" in the pause menu). Everything falls back to the original art when off,
   when an image has not loaded, or outside the trial mission. */
'use strict';
const LPC=(function(){
  const IMG={},ok={};
  for(const n of['shiloh','guard_marrow','ashfall_tiles']){const i=new Image();i.onload=()=>{ok[n]=true;if(typeof G!=='undefined'&&G)G.dirty=true;};i.src='assets/lpc/'+n+'.png';IMG[n]=i;}
  // sheet layout written by the asset build: walk 4 rows x9, slash 4x6, thrust 4x8, hurt 1x6; 64px frames
  const ROW={walk:0,slash:4,thrust:8,hurt:12},NF={walk:9,slash:6,thrust:8,hurt:6};
  const SC=.8,FOOT=58; // draw scale, and the y of the feet inside a 64px frame
  function trialLevel(){return typeof G!=='undefined'&&G&&G.d&&!G.d.hub&&!G.dng&&G.d===LEVELS[0];}
  function on(){return settings.lpc!==false&&trialLevel();}
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
  function blit(name,anim,frame,d,x,y,alpha,line,flash){
    const c=ctx,row=ROW[anim]+(anim==='hurt'?0:d),fr=Math.max(0,Math.min(NF[anim]-1,frame|0));
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    if(alpha!=null)c.globalAlpha=alpha;
    const X=x-32*SC,Y=y+8-FOOT*SC,m=c.getTransform();
    if(!m.b&&!m.c){ // land on whole canvas pixels so no sprite column is dropped or doubled
      c.save();c.setTransform(1,0,0,1,0,0);
      const dx=Math.round(m.a*X+m.e),dy=Math.round(m.d*Y+m.f),dw=Math.round(64*SC*m.a),dh=Math.round(64*SC*m.d);
      if(line){const o=Math.max(1,Math.round(dw/64)),sl=sil(name,fr*64,row*64,line);
        c.drawImage(sl,dx-o,dy,dw,dh);c.drawImage(sl,dx+o,dy,dw,dh);c.drawImage(sl,dx,dy-o,dw,dh);c.drawImage(sl,dx,dy+o,dw,dh);}
      c.drawImage(IMG[name],fr*64,row*64,64,64,dx,dy,dw,dh);
      if(flash){c.globalAlpha=.85;c.drawImage(sil(name,fr*64,row*64,'#ffffff'),dx,dy,dw,dh);} // white hit flash
      c.restore();
    }else c.drawImage(IMG[name],fr*64,row*64,64,64,Math.round(X),Math.round(Y),64*SC,64*SC);
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
  function drawMarrow(g){
    const hit=G.time-(g.hitT===undefined?-9:g.hitT)<.09;
    if(g.ko&&g.stun>0){shadowAt(g.x,g.y+6,14,5,.4);blit('guard_marrow','hurt',hit?2:5,0,g.x,g.y+4,1,null,hit);return;}
    const moving=g._lx!=null&&Math.hypot(g.x-g._lx,g.y-g._ly)>.05;g._lx=g.x;g._ly=g.y;
    const d=dir(vfa(g));
    shadowAt(g.x,g.y+7,12,5,.38);
    if(g.stun>0){blit('guard_marrow','hurt',1,d,g.x,g.y,1,null,hit);return;}
    const hu=g.hopT===undefined?1:(G.time-g.hopT)/.26,hop=hu>=0&&hu<1?Math.sin(hu*Math.PI)*6:0; // startle hop when he first sees you
    blit('guard_marrow','walk',moving?walkFrame(g.ph||0):0,d,g.x,g.y-hop,1,g.seeing?'#ff5440':(g.lure||g.ret)?'#ffc060':null);
  }
  // Ashfall Keep floor and wall faces from LPC castle tiles (atlas: floor, floor mirrored, brick wall face)
  function isWall(x,y){const r=G.grid[y];return!r||r[x]==='#'||r[x]===' '||r[x]===undefined;}
  function floor(c,x,y){
    if(!ok.ashfall_tiles)return false;
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.ashfall_tiles,((x*7+y*3)%2)*32,0,32,32,x*T,y*T,T,T);
    c.imageSmoothingEnabled=sm;
    const rm=G.rooms&&G.roomOf&&G.roomOf[y][x]>=0?G.rooms[G.roomOf[y][x]]:null;
    if(rm&&rm.tint&&rm.tint<1){c.fillStyle='rgba(0,0,0,'+((1-rm.tint)*1.2).toFixed(3)+')';c.fillRect(x*T,y*T,T,T);}
    return true;
  }
  function wallFace(c,x,y){
    if(!ok.ashfall_tiles||isWall(x,y+1)||y+1>=G.gh)return;
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.ashfall_tiles,64,0,32,32,x*T,y*T,T,T);c.imageSmoothingEnabled=sm;
    c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x*T,y*T+T-3,T,3); // contact shadow at the base
  }
  return{on,ready:n=>!!ok[n],drawShiloh,drawMarrow,dir,floor,wallFace};
})();
// Swap in the LPC figures without touching the original draw functions.
{
  const _drawWren=drawWren;
  drawWren=function(w,active){if(LPC.on()&&LPC.ready('shiloh'))return LPC.drawShiloh(w,active);return _drawWren(w,active);};
  const _drawGuard=drawGuard;
  drawGuard=function(g){if(LPC.on()&&LPC.ready('guard_marrow')&&!g.boss&&!g.spin&&(g.kind==='guard'||!g.kind))return LPC.drawMarrow(g);return _drawGuard(g);};
}
// Tiles: only while baking Ashfall Keep with the trial on; otherwise the house art is untouched.
if(typeof TILES!=='undefined'){
  const _floor=TILES.floor,_wall=TILES.wall;
  TILES.floor=function(c,x,y,p,fs,th){if(LPC.on()&&!G.flight&&LPC.floor(c,x,y))return true;return _floor.apply(this,arguments);};
  TILES.wall=function(c,x,y,p,flight){const r=_wall.apply(this,arguments);if(LPC.on()&&!flight)LPC.wallFace(c,x,y);return r;};
}
