const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
    const r=await p.evaluate(async(W)=>{
    const out={};
    for(let L=0;L<7;L++){newGame();startBrief(L);startPlay();G.cine=null;G.grace=99;await new Promise(r=>setTimeout(r,250));
      const tr=(G.torches||[]).filter(t=>!t.pipe&&!t.small&&!t.out);
      out['L'+L]={torches:G.torches.length,wall:tr.length,small:G.torches.filter(t=>t.small).length,pipe:G.torches.filter(t=>t.pipe).length};}
    newGame();startBrief(1);startPlay();G.cine=null;G.grace=99;await new Promise(r=>setTimeout(r,250));
    const tr=G.torches.find(t=>!t.pipe&&!t.small);
    // find floor spot just below torch
    G.wren.x=tr.x;G.wren.y=tr.y+26;
    out.litNear=+lightAt(G.wren.x,G.wren.y).toFixed(2);
    out.far=+lightAt(G.wren.x+300,G.wren.y).toFixed(2);
    const tgt=findTarget(G.wren);out.tgt=tgt&&tgt.label;
    completeTarget(tgt);out.out=tr.out;out.litAfter=+lightAt(G.wren.x,G.wren.y).toFixed(2);
    // guard relight
    const gd=G.guards[0];gd.x=tr.x;gd.y=tr.y+20;gd.stun=0;gd.pause=99;
    for(let i=0;i<120;i++)update(1/60);
    out.relit=!tr.out;
    // smoke
    const t2=G.torches.find(t=>!t.pipe&&!t.out&&t!==tr);G.smoke.push({x:t2.x,y:t2.y+10,r:58,t:6,t0:6});
    update(1/60);out.smokeSnuffed=t2.out;
    return out;},0);
  console.log(JSON.stringify(r,null,1));
  console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
