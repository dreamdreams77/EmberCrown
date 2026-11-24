// Every mission starts in cover: standing still at the start for 15s is never caught (missions 4-6 used to start in a
// patrol's sight), while a step out of cover into a guard's view is still noticed.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{
    const out={},step=n=>{for(let i=0;i<n;i++)update(1/60);};
    for(let L=0;L<LEVELS.length;L++){
      newGame();startBrief(L);beginMission();G.cine=null;for(const k in __ec.keys)__ec.keys[k]=false;
      if(G.flight){out[L+1]='flight';continue;}
      let maxA=0;for(let i=0;i<15*60;i++){step(1);maxA=Math.max(maxA,G.alert);if(__ec.mode!=='play')break;}
      out[L+1]={mode:__ec.mode,maxAlert:+maxA.toFixed(2)};
    }
    // out of cover, in front of a guard: noticed
    newGame();startBrief(4);beginMission();G.cine=null;G.grace=0;G.graceRamp=0;
    const g=G.guards.find(q=>!q.boss&&(q.kind||'guard')==='guard');g.wp=[[g.x,g.y]];g.face=0;
    G.wren.x=g.x+64;G.wren.y=g.y;let seen=false;for(let i=0;i<60;i++){step(1);if(g.seeing)seen=true;}
    out.outOfCover=seen;
    return out;});
  const fail=[];
  for(const [k,v] of Object.entries(r)){if(k==='outOfCover'||v==='flight')continue;if(v.mode!=='play'||v.maxAlert>.3)fail.push('mission '+k+' start not safe ('+JSON.stringify(v)+')');}
  if(!r.outOfCover)fail.push('a guard did not notice Shiloh outside the starting cover');
  console.log(JSON.stringify(r));if(errs.length)console.log(errs.join('\n'));
  console.log(fail.length?'FAIL '+fail.join('; '):'spawn ok');
  await b.close();process.exit(fail.length||errs.length?1:0);
})();
