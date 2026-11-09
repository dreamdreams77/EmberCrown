const {chromium}=require('playwright');
const OUT='/tmp/claude-0/-home-user-EmberCrown/74bad96c-385c-57cf-8015-6816324e22b5/scratchpad/shots/';
(async()=>{
  const b=await chromium.launch();const errs=[];const bad=[];
  const sizes=[[320,568],[360,640],[390,844],[667,375],[844,390],[1024,600],[820,1180],[1280,720],[1920,1080]];
  for(const [w,h] of sizes){
    const touch=w<1000;
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
    const p=await ctx.newPage();
    p.on('console',m=>{if(m.type()==='error')errs.push(w+'x'+h+' '+m.text());});
    p.on('pageerror',e=>errs.push(w+'x'+h+' PAGEERR '+e.message));
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(300);
    const check=async(tag)=>{
      await p.waitForTimeout(650);
      const r=await p.evaluate(()=>{const s=document.querySelector('#ui .screen');if(!s)return null;
        const c=s.querySelector('.card'); // modal not used here
        // any child clipped outside viewport?
        const out=[...s.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)}).length;
        return{sh:s.scrollHeight,ch:s.clientHeight,out,sw:s.scrollWidth,cw:s.clientWidth};});
      if(!r){bad.push(w+'x'+h+' '+tag+' no screen');return;}
      const flag=(r.sh>r.ch+2||r.out||r.sw>r.cw+1);
      if(flag)bad.push(w+'x'+h+' '+tag+' '+JSON.stringify(r));
    };
    await check('title');
    await p.evaluate(()=>__ec.newGame());await check('brief0');
    for(const l of [2,5,6]){await p.evaluate(l=>{__ec.run.relics=['boots','purse','stormglass'];__ec.startBrief(l);},l);await check('brief'+l);}
    await p.evaluate(()=>{__ec.G=null;});
    // court
    await p.evaluate(()=>{__ec.newGame();__ec.startBrief(1);__ec.startPlay();__ec.G.cine=null;});
    await p.evaluate(()=>{UI.show('court');});await check('court');
    await p.evaluate(()=>{__ec.startBrief(4);__ec.startPlay();__ec.G.cine=null;const G=__ec.G;G.d.choice=true;});
    await p.evaluate(()=>{__ec.G.d.finale=false;UI.show('choice');});await check('choice2');
    await p.evaluate(()=>{__ec.startBrief(6);__ec.startPlay();__ec.G.cine=null;UI.show('choice');});await check('choice3');
    await p.evaluate(()=>{UI.show('lose');});await check('lose');
    await p.evaluate(()=>{__ec.G.guards.forEach(g=>g.stun=1e9);__ec.pauseGame(true);});await check('pause');
    await p.evaluate(()=>{__ec.startBrief(0);__ec.startPlay();__ec.G.cine=null;const G=__ec.G;G.gotRelics=['boots'];G.gotLore=['x'];G.choice='return';__ec.finishLevel();});await p.waitForTimeout(700);await check('win');
    if(w===390||w===844)await p.screenshot({path:OUT+'win_'+w+'.png'});
    await p.evaluate(()=>{__ec.startBrief(6);__ec.startPlay();__ec.G.cine=null;__ec.G.choice='burn';__ec.G.items.forEach(i=>i.done=true);__ec.G.boss.dead=true;__ec.finishLevel();});await p.waitForTimeout(700);
    await p.evaluate(()=>{__ec.continueFromWin();});await check('end');
    if(w===390||w===844)await p.screenshot({path:OUT+'end_'+w+'.png'});
    await ctx.close();
  }
  console.log('LAYOUT PROBLEMS:\n'+(bad.join('\n')||'none'));
  console.log('ERRORS:',errs.join('\n')||'none');
  await b.close();
})();
