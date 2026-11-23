// Mission mechanisms (plates, levers, hatches, caches, grates, gates) are drawn in every art mode: pixel art (the default), the original drawn art, and Ember art (Ashfall only), once per frame.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(600);
  const r=await p.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
    let n=0;
    const runs=[];for(const lpc of [true,false])for(const L of [0,1,2,3])runs.push([lpc?'pixel':'drawn',lpc,false,L]);runs.push(['ember',true,true,0]);
    for(const [tag,lpc,ember,L] of runs){
      settings.lpc=lpc;settings.ember=ember;newGame();startBrief(L);startPlay();G.cine=null;G.grace=1e9;G.god=true;G.dirty=true;
      await wait(120);
      // freeze the rules (hit-stop) so only rendering runs, then count reads of the mission's pit table: only the floor drawer reads it each frame
      G.hitstop=1e9;const M=G.mis,pt=M.pitT;Object.defineProperty(M,'pitT',{configurable:true,get(){n++;return pt;}});
      n=0;let fr=0,live=true;const tick=()=>{if(live){fr++;requestAnimationFrame(tick);}};requestAnimationFrame(tick);
      await wait(400);live=false;G.hitstop=0;
      if(!G.mis)throw new Error("no mission mechanics in level "+L);
      out[tag+L]=[n,fr];
    }
    settings.lpc=true;settings.ember=false;return out;});
  const fail=[];
  for(const [k,[n,fr]] of Object.entries(r)){if(!(n>0))fail.push(k+': mission floor not drawn');else if(n>fr+2)fail.push(k+': mission floor drawn more than once a frame ('+n+' draws in '+fr+' frames)');}
  console.log(JSON.stringify(r));
  if(errs.length)console.log(errs.join('\n'));
  console.log(fail.length?'FAIL '+fail.join('; '):'mechdraw ok');
  await b.close();process.exit(fail.length||errs.length?1:0);
})();
