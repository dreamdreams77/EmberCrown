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
  function blit(name,anim,frame,d,x,y,alpha){
    const c=ctx,row=ROW[anim]+(anim==='hurt'?0:d),fr=Math.max(0,Math.min(NF[anim]-1,frame|0));
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    if(alpha!=null)c.globalAlpha=alpha;
    c.drawImage(IMG[name],fr*64,row*64,64,64,Math.round(x-32*SC),Math.round(y+8-FOOT*SC),64*SC,64*SC);
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
      if(atk.combo===2)blit('shiloh','thrust',1+u*6.99,d,w.x,w.y,blink?.4:1);
      else blit('shiloh','slash',u*5.99,d,w.x,w.y,blink?.4:1);return;}
    if(w.rollAnim>0){const u=1-w.rollAnim/.3;blit('shiloh','walk',1+u*7.99,d,w.x,w.y+Math.sin(u*Math.PI)*-4,.75);return;}
    if(st.hurt>.5){blit('shiloh','hurt',1,d,w.x,w.y,blink?.4:1);return;}
    const fr=mv?walkFrame(w.ph||0):0;
    blit('shiloh','walk',fr,d,w.x,w.y,blink?.35:(G.sneak&&active?.82:1));
  }
  function drawMarrow(g){
    if(g.ko&&g.stun>0){shadowAt(g.x,g.y+6,14,5,.4);blit('guard_marrow','hurt',5,0,g.x,g.y+4);return;}
    const moving=g._lx!=null&&Math.hypot(g.x-g._lx,g.y-g._ly)>.05;g._lx=g.x;g._ly=g.y;
    const d=dir(vfa(g));
    shadowAt(g.x,g.y+7,12,5,.38);
    if(g.stun>0){blit('guard_marrow','hurt',1,d,g.x,g.y);return;}
    blit('guard_marrow','walk',moving?walkFrame(g.ph||0):0,d,g.x,g.y);
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
