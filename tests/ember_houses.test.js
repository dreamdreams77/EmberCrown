// Ember art outside Ashfall keeps each house's own look where it matters: lighting colour and the finale's candle
// brightening, Dunmoor's ruined era on its own tiles, special zone floors (ballroom, arenas, vaults), the house's
// overhead dressing, and no Marrow palette while a house's sheets are still loading.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const fail=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(900);
  const r=await p.evaluate(async()=>{
    const o={},wait=ms=>new Promise(r=>setTimeout(r,ms));settings.lpc=true;settings.ember=true;
    const go=async L=>{newGame();startBrief(L);startPlay();G.cine=null;G.grace=1e9;await wait(350);};
    await go(0);o.ashAmb=EM.env.ambient([20,10,30,.3]).join(',');o.ashRuin=(G.state='ruin',EM.env.ruin());G.state='';
    await go(6);o.hallowAmb=EM.env.ambient([18,12,6,.38]).join(',');
    await go(5);o.ready5=EM.env.ready();if(typeof shiftTime==='function')shiftTime();o.dunRuin=EM.env.ruin();
    // a ballroom tile: the Ember floor must decline so the house's marble is kept
    let bx=-1,by=-1;for(let y=0;y<G.gh&&bx<0;y++)for(let x=0;x<G.gw;x++)if(TILES.zone(x,y)==='ball'){bx=x;by=y;break;}
    const cv=document.createElement('canvas').getContext('2d');o.ballDeclined=bx<0?null:EM.env.floor(cv,bx,by)===false;
    // overhead dressing: Ember's cages only in Ashfall
    let fgCalls=0;const of=EM.fx.fg;EM.fx.fg=function(){fgCalls++;return of.apply(this,arguments);};
    TILES.fg(cv);o.fgOutside=fgCalls;await go(0);TILES.fg(cv);o.fgAshfall=fgCalls;EM.fx.fg=of;
    // loading: with the Kest sheets missing, Ironvale must not fall back to Marrow tiles or guards
    await go(4);const keep={t:EM.ok.tiles_kest,p:EM.ok.pell_kest};EM.ok.tiles_kest=false;EM.ok.pell_kest=false;
    o.kestTilesWhileLoading=EM.env.ready();o.kestGuardsWhileLoading=EM.guardsReady();EM.ok.tiles_kest=keep.t;EM.ok.pell_kest=keep.p;
    o.kestReady=EM.env.ready()&&EM.guardsReady();
    return o;});
  if(r.ashAmb==='20,10,30,0.3')fail.push('Ashfall lost its Ember ambient');
  if(r.hallowAmb!=='18,12,6,0.38')fail.push('the finale is relit with the Ashfall ambient ('+r.hallowAmb+')');
  if(!r.ashRuin)fail.push('Ashfall ruin art disabled');
  if(r.dunRuin)fail.push("Dunmoor's ruin drawn with Ashfall's ruin art");
  if(r.ballDeclined===false)fail.push('the ballroom marble is replaced by Ember flagstones');
  if(r.fgOutside!==0)fail.push('Marrow cages drawn over another house');
  if(!(r.fgAshfall>=1))fail.push('Ashfall overhead dressing missing');
  if(r.kestTilesWhileLoading||r.kestGuardsWhileLoading)fail.push('Marrow palette used while Kest sheets load');
  if(!r.kestReady)fail.push('Kest Ember art not ready once loaded');
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
