const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const out={};
  for(const [tag,w,h,touch] of [['d',900,560,false],['p',740,360,true]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch});const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console '+m.text());});
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(500);
    for(let L=0;L<7;L++){
      const r=await p.evaluate(async(L)=>{
        newGame();startBrief(L);startPlay();G.cine=null;G.grace=5;G.iris=null;
        await new Promise(r=>setTimeout(r,250));
        let ok=true;const t0=performance.now();
        for(let i=0;i<900;i++){update(1/60);}
        const q=window.Quests?Quests.journal().length:-1;
        const npcs=window.NPC&&NPC.markers?NPC.markers().length:-1;
        return{L,mode:__ec.mode,q,npcs,hp:G.hp,guards:G.guards.length,ms:Math.round(performance.now()-t0)};},L);
      out[tag+L]=r;
      if(L===0||L===3||L===6){await p.evaluate(()=>{V.dbgZoom=0});await p.screenshot({path:`/tmp/ec_tests_8123/shot_${tag}${L}.png`});}
    }
    // journal opens
    await p.evaluate(()=>{newGame();startBrief(1);startPlay();G.cine=null;});
    const j=await p.evaluate(()=>{try{if(window.Journal&&Journal.open){Journal.open();}else{document.dispatchEvent(new KeyboardEvent('keydown',{key:'j'}));}return !!document.querySelector('.modal, .journal, #journal');}catch(e){return 'ERR '+e.message;}});
    out[tag+'_journal']=j;
    await p.waitForTimeout(300);await p.screenshot({path:`/tmp/ec_tests_8123/shot_${tag}_journal.png`});
    // legacy v2/v3 saves
    const sv=await p.evaluate(()=>{const o={};
      const mk=(v,extra)=>({v,meta:{relics:[],lore:[],best:{},disc:[]},run:Object.assign({stage:'brief',next:2,diff:1,perk:'bribe',houses:{marrow:{favor:0,fear:1,ruin:0},grell:{favor:1,fear:0,ruin:0},ostrander:{favor:0,fear:0,ruin:0},sable:{favor:0,fear:0,ruin:0},kest:{favor:0,fear:0,ruin:0},dunmoor:{favor:0,fear:0,ruin:0}},stats:{gems:3,caught:0,time:100,byLvl:[]},relics:[],lore:[],ranks:{0:'A',1:'B'},secrets:{}},extra)});
      for(const [n,s] of [['v2',mk(2,{})],['v3',mk(3,{talents:['pockets'],cinders:120,disc:[]})]]){
        try{saved=s;const ok=continueGame();update&&0;o[n]={ok,mode:__ec.mode,lvl:__ec.lvl};}catch(e){o[n]='ERR '+e.message;}}
      return o;});
    out[tag+'_saves']=sv;
    await ctx.close();
  }
  console.log(JSON.stringify(out,null,0).replace(/\},/g,'},\n'));
  console.log(errs.length?'ERRORS:\n'+[...new Set(errs)].slice(0,12).join('\n'):'no errors');
  await b.close();
})();
