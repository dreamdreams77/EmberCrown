const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const r=await p.evaluate(async()=>{
    const o={};
    for(const mode of ['raise','stun']){
      newGame();startBrief(0);startPlay();G.cine=null;G.grace=0;G.graceRamp=0;G.alert=0;await new Promise(r=>setTimeout(r,200));
      const B=G.items.find(i=>i.type==='B');
      const g=G.guards[0];
      // put guard in front of Wren, facing her, so it sees her
      G.wren.x=g.x+60;G.wren.y=g.y;g.face=0;g.vf=0;g.pause=0;
      G.guards.slice(1).forEach(x=>{x.x=-999;});
      let t=0;while(!G.runner&&t<200){update(1/60);t++;}
      o[mode+'_started']=!!G.runner;
      const d0=Math.hypot(B.x-g.x,B.y-g.y);
      if(mode==='stun'){for(let i=0;i<40;i++)update(1/60);g.stun=3;for(let i=0;i<5;i++)update(1/60);o.averted=!G.runner&&G.alarmSt!=='raised';o.cd=Math.round(G.runCd);}
      else{G.wren.x=-500;let n=0;while(G.alarmSt!=='raised'&&n<60*40){update(1/60);n++;}
        o.raised=G.alarmSt;o.secs=+(n/60).toFixed(1);o.d0=Math.round(d0/32);}
    }
    return o;});
  console.log(JSON.stringify(r));console.log(errs.length?errs.join('\n'):'no errors');await b.close();
})();
