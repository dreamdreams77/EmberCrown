// Mission mechanisms (plates, levers, hatches, caches, grates, gates) are drawn in both art modes: pixel art (the default) and the original drawn art.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(600);
  const r=await p.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
    let n=0;
    for(const lpc of [true,false])for(const L of [0,1,2,3]){
      settings.lpc=lpc;newGame();startBrief(L);startPlay();G.cine=null;G.grace=1e9;G.god=true;G.dirty=true;
      await wait(120);
      // freeze the rules (hit-stop) so only rendering runs, then count reads of the mission's pit table: only the floor drawer reads it each frame
      G.hitstop=1e9;const M=G.mis,pt=M.pitT;Object.defineProperty(M,'pitT',{configurable:true,get(){n++;return pt;}});
      n=0;await wait(400);G.hitstop=0;
      if(!G.mis)throw new Error("no mission mechanics in level "+L);
      out[(lpc?'pixel':'drawn')+L]=n;
    }
    settings.lpc=true;return out;});
  const fail=Object.entries(r).filter(([k,v])=>!(v>0)).map(([k])=>k+': mission floor not drawn');
  for(const [k,v] of Object.entries(r))if(v>60)fail.push(k+': mission floor drawn more than once a frame ('+v+')');
  console.log(JSON.stringify(r));
  if(errs.length)console.log(errs.join('\n'));
  console.log(fail.length?'FAIL '+fail.join('; '):'mechdraw ok');
  await b.close();process.exit(fail.length||errs.length?1:0);
})();
