const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    newGame();startBrief(1);startPlay();G.cine=null;G.grace=99;G.alert=0;
    const o={};const g=G.guards.find(x=>!x.boss&&x.stun<=0);
    G.time=69.9;for(let i=0;i<20;i++)update(1/60);
    o.toast=G.toast;o.held=G.guards.filter(x=>x.toastT>0).length;o.total=G.guards.length;
    const x0=g.x,y0=g.y;for(let i=0;i<120;i++)update(1/60);o.moved=Math.hypot(g.x-x0,g.y-y0)<2;
    o.face=+g.face.toFixed(2);
    for(let i=0;i<600;i++)update(1/60);o.after=G.toast;o.spd=Math.round(g.spd);
    return o;});
  console.log(JSON.stringify(r));console.log(errs.length?errs.join('\n'):'no errors');await b.close();
})();
