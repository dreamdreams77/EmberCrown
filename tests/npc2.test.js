const {chromium}=require('playwright');
const OUT=process.env.SHOTS||'/tmp';
(async()=>{
  const b=await chromium.launch();const errs=[];const fails=[];
  for(const cfg of [{n:'desk',vp:{width:900,height:560},touch:false},{n:'phone',vp:{width:740,height:360},touch:true}]){
    const ctx=await b.newContext({viewport:cfg.vp,hasTouch:cfg.touch,isMobile:cfg.touch});
    const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
    await p.evaluate(()=>{__ec.newGame();__ec.startBrief(0);__ec.startPlay();const G=__ec.G;G.cine=null;G.bars=0;G.iris=null;
      const n=G.nq.npcs.find(n=>n.id==='pip');G.wren.x=n.px-24;G.wren.y=n.py;G.alert=0;V.dbgZoom=2.2;});
    await p.waitForTimeout(500);
    await p.screenshot({path:OUT+'/np_'+cfg.n+'_world.png'});
    // interact: hold act
    if(cfg.touch){
      await p.evaluate(()=>{__ec.touch.act=true;});
    } else await p.keyboard.down('e');
    await p.waitForTimeout(700);
    let talking=await p.evaluate(()=>!!__ec.G.talk);
    if(!talking)fails.push('FAIL '+cfg.n+' talk did not open via hold');
    if(cfg.touch)await p.evaluate(()=>{__ec.touch.act=false;}); else await p.keyboard.up('e');
    await p.waitForTimeout(200);
    await p.screenshot({path:OUT+'/np_'+cfg.n+'_dialog.png'});
    const tm=await p.evaluate(()=>__ec.G.time);await p.waitForTimeout(300);
    if(await p.evaluate(t=>__ec.G.time!==t,tm))fails.push('FAIL '+cfg.n+' world not frozen');
    // choose: touch taps the button, keyboard presses key
    if(cfg.touch){await p.tap('#npcdlg button:nth-of-type(1)');} else await p.keyboard.press('1');
    await p.waitForTimeout(200);
    await p.screenshot({path:OUT+'/np_'+cfg.n+'_reply.png'});
    if(cfg.touch){await p.tap('#npcdlg button:last-of-type');} else await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    if(await p.evaluate(()=>!!__ec.G.talk))fails.push('FAIL '+cfg.n+' did not close');
    if(await p.evaluate(()=>!!document.getElementById('npcdlg')))fails.push('FAIL '+cfg.n+' overlay remains');
    // no instant re-open while still holding
    await p.waitForTimeout(500);
    const r=await p.evaluate(()=>({mode:__ec.mode,q:Quests.journal().length}));
    if(r.mode!=='play')fails.push('FAIL mode '+r.mode);
    await ctx.close();
  }
  console.log(fails.join('\n')||'ui ok');console.log(errs.join('\n')||'no errors');await b.close();
})();
