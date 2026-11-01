'use strict';
/* EMBERCROWN - boot, main loop, adaptive quality. */
function onLevelStart(){
  V.ww=G.gw*T;V.wh=G.gh*T;
  layout();camUpdate(0,true);initCritters();G.fog=null;touch.sneak=false;
  G.iris={st:performance.now(),dur:1100,dir:1};
  introCine(attempts[lvl]>1);
  UI.tick(true);
}
function render(dt){
  const worldModes=mode==='play'||mode==='pause'||mode==='lose'||mode==='win'||mode==='choice';
  if(G&&worldModes){
    camUpdate(dt);
    if(mode==='play'){spawnAmbient(dt);updateCritters(dt);}
    drawWorld();
    drawFx();
    if((mode==='play'||mode==='pause'||mode==='choice')&&!(G.cine&&G.bars>.35))drawHud();
    if(G.cine||G.bars>.02)drawCine();
  } else drawScene(dt);
}
function degrade(){
  Q.tier++;
  if(Q.tier===1){Q.maxP=260;Q.amb=.55;}
  else if(Q.tier===2){Q.maxP=150;Q.amb=.3;Q.dprCap=1.25;layout();}
  else if(Q.tier===3){Q.maxP=90;Q.amb=.15;Q.dprCap=1;layout();}
}
let last=0,slow=0,frameN=0;
const PERF={u:0,r:0,n:0};
let errN=0;
function frame(t){
  try{
    const raw=(t-last)/1000||.016;last=t;
    const dt=Math.min(.05,raw);
    if(mode==='play'){
      if(raw>.036)slow+=raw;else slow=Math.max(0,slow-raw*.6);
      if(slow>1.6&&Q.tier<3){degrade();slow=0;}
      if(G&&mouse.used)mouse.world=screenToWorld(mouse.x,mouse.y);
      V.wide=!!(keys['z']||V.wideT>0);if(V.wideT>0)V.wideT-=dt;
      let sdt=dt;
      if(G){
        if(G.hitstop>0){G.hitstop-=dt;sdt=0;}
        else sdt=dt*G.ts;
        G.ts+=(G.tsT-G.ts)*Math.min(1,dt*7);
      }
      const t0=performance.now();if(sdt>0)update(sdt);PERF.u+=performance.now()-t0;
    }
    if(mode!=='pause'){updateFX(dt);if(G)G.bars+=((G.cine?1:0)-G.bars)*Math.min(1,dt*6);}
    Aud.tick(dt,G?G.alert:0,mode==='play');
    const t1=performance.now();render(dt);PERF.r+=performance.now()-t1;PERF.n++;
    if(++frameN%6===0){UI.tick(false);const cn=!!(G&&G.cine&&mode==='play');if(cn!==document.body.classList.contains('cine'))document.body.classList.toggle('cine',cn);}
  }catch(e){
    // never let one bad frame freeze the game: log it and keep the loop alive
    console.error(e);errN++;
    if(errN>=5&&mode==='play'){errN=0;try{pauseGame(true);}catch(_){}}
  }
  requestAnimationFrame(frame);
}
function boot(){
  loadSettings();loadSave();
  UI.init();
  layout();
  if(window.ResizeObserver)new ResizeObserver(()=>layout()).observe(document.getElementById('stage'));
  addEventListener('resize',layout);
  addEventListener('orientationchange',()=>setTimeout(layout,250));
  Aud.setTheme({root:73,mode:'minor',tempo:.6});
  setMode('title');
  requestAnimationFrame(frame);
  /* test hook */
  window.__ec={PERF,get G(){return G;},get mode(){return mode;},stats,keys,touch,houses,run,meta,Q,V,get lvl(){return lvl;},startBrief,startPlay,loadLevel,newGame,continueFromWin,makeChoice,pauseGame,swapChar,explode,openCrack,finishLevel,update:dt=>update(dt)};
}
boot();
