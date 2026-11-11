// World art: every mission, vault and the hub bake with house tiles; arenas react; the tile cache stays small; screenshots per mission.
const {chromium}=require('playwright');
const out=process.env.EC_OUT||'.';
(async()=>{
  const b=await chromium.launch();const errs=[];
  for(const dev of ['d','p']){
    const o=dev==='d'?{viewport:{width:900,height:560}}:{viewport:{width:740,height:360},hasTouch:true,isMobile:true};
    const p=await (await b.newContext(o)).newPage();
    p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(500);
    for(let L=0;L<7;L++){
      const r=await p.evaluate(L=>{const E=__ec;E.newGame();E.startBrief(L);E.startPlay();const G=E.G;G.cine=null;G.grace=99;
        bakeStatic();const s=TILES.stats();const z={};for(const row of G.zone||[])for(const k of row)if(k)z[k]=1;
        return{cached:s.cached,zones:Object.keys(z).join(','),arena:!!TILES.arenaInfo(),key:TILES.key()};},L);
      if(r.cached>220)console.log('FAIL cache too large L'+L,r.cached);
      if(r.key!==['marrow','grell','ostrander','sable','kest','dunmoor','hallow'][L])console.log('FAIL style key L'+L,r.key);
      if((L===3||L===6)&&!r.arena)console.log('FAIL no arena L'+L);
      console.log(dev,'L'+L,JSON.stringify(r));
      await p.waitForTimeout(250);await p.screenshot({path:out+'/worldart_L'+L+'_'+dev+'.png'});
    }
    // arena reacts to the fight without errors
    await p.evaluate(()=>{const E=__ec;E.newGame();E.startBrief(3);E.startPlay();const G=E.G;G.cine=null;const B=G.boss||G.guards.find(g=>g.boss);B.eng=true;B.p2=true;G.wren.x=18*32;G.wren.y=8*32;});
    await p.waitForTimeout(400);
    const hub=await p.evaluate(()=>{if(!window.Hub)return'nohub';Hub.enter(2);return TILES.key()+'|'+(window.THEMES&&THEMES.hub?'theme':'')});
    if(hub!=='nohub'&&hub!=='hub|theme')console.log('FAIL hub style',hub);
    await p.waitForTimeout(300);
  }
  if(errs.length)console.log(errs.join('\n'));
  console.log('done');await b.close();
})();
