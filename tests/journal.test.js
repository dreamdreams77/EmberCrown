const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const out={};
  for(const [tag,w,h,touch] of [['d',900,560,false],['p',740,360,true]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch});const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(tag+' '+e.message));
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(500);
    await p.evaluate(()=>{newGame();run.cinders=500;run.ranks[0]='A';startBrief(1);});
    await p.waitForTimeout(300);await p.screenshot({path:`shot_${tag}_brief.png`});
    await p.evaluate(()=>{startPlay();G.cine=null;G.grace=60;});await p.waitForTimeout(300);
    await p.keyboard.press('j');await p.waitForTimeout(400);
    out[tag+'_open']=await p.evaluate(()=>mode);
    const tabs=await p.evaluate(()=>[...document.querySelectorAll('[data-a^="jtab"],[data-tab],.jtab,.tabs button')].map(e=>e.textContent.trim()).slice(0,10));
    out[tag+'_tabs']=tabs;await p.screenshot({path:`shot_${tag}_journal.png`});
    for(let i=0;i<6;i++){await p.keyboard.press('ArrowRight');await p.waitForTimeout(120);}
    await p.screenshot({path:`shot_${tag}_journal2.png`});
    await p.keyboard.press('Escape');await p.waitForTimeout(300);
    out[tag+'_closed']=await p.evaluate(()=>mode);
    // talk to an NPC if possible
    const npc=await p.evaluate(()=>{const m=window.NPC&&NPC.markers?NPC.markers():[];return m[0]||null;});
    out[tag+'_npc']=!!npc;
    if(npc){await p.evaluate(n=>{G.wren.x=n.x+20;G.wren.y=n.y+8;},npc);await p.waitForTimeout(300);
      await p.keyboard.down('e');await p.waitForTimeout(1500);await p.keyboard.up('e');await p.waitForTimeout(400);
      await p.screenshot({path:`shot_${tag}_npc.png`});}
    await ctx.close();
  }
  console.log(JSON.stringify(out));console.log(errs.length?'ERR '+[...new Set(errs)].join('|'):'no errors');await b.close();
})();
