const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const r=await p.evaluate(async()=>{
    const out={};
    newGame();startBrief(0);startPlay();G.cine=null;G.grace=9;
    out.intro=LEVELS[0].intro.length;
    const g=G.guards[0];G.wren.x=g.x+40;G.wren.y=g.y;
    lureNear(g.x+40,g.y,200);out.bark=g.say&&g.say.x;
    // egg completion + queue
    const egg=G.items.find(i=>i.type==='O');completeTarget({kind:'item',ref:egg});
    out.m1=G.msg.text;
    for(let i=0;i<260;i++)update(1/60);
    out.m2=G.msg.text;
    return out;});
  console.log(JSON.stringify(r,null,1));
  await p.evaluate(()=>{const g=G.guards[1];g.say={t:1.6,x:'Report.'};g.quest=1;G.wren.x=g.x;G.wren.y=g.y+60;});
  await p.waitForTimeout(150);await p.screenshot({path:'st_bark.png'});
  // endings + candlemaker lines
  const e=await p.evaluate(()=>{const o={};for(const c of ['puppet','burn','break']){lvl=6;newGame();G={ending:null};o[c]=finaleEnding(c).lines.length;}return o;});
  console.log(JSON.stringify(e));
  console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
