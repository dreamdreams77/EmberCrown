// Regressions from the November bug check: the starting cover lapses, Ashfall's one-tile passages stay open,
// Ember art still draws the cover ring, knockout timer and runner path, and stairs give a moment of cover.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const fail=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{
    const o={},wait=ms=>new Promise(r=>setTimeout(r,ms));
    newGame();startBrief(0);startPlay();G.cine=null;await wait(300);
    o.coverAtStart=!!G.spawn;
    G.wren.x+=4*T;for(let i=0;i<120;i++)update(1/60);o.coverLapsed=!G.spawn;
    const ok=(x,y)=>x>=0&&y>=0&&x<G.gw&&y<G.gh&&!solidTile(x,y)&&!propTile(x,y);
    const reach=(sx,sy,tx,ty,ban)=>{const seen=new Set([sx+','+sy]),q=[[sx,sy]];for(let i=0;i<q.length;i++){const[x,y]=q[i];if(x===tx&&y===ty)return true;
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&ok(nx,ny)&&k!==ban){seen.add(k);q.push([nx,ny]);}}}return false;};
    o.eggGapOpen=reach(20,3,20,6,'15,3');
    o.barracksGapOpen=reach(12,3,10,6,'15,3');
    // Ember art keeps the gameplay markers
    const calls={cover:0,ko:0,run:0};
    const wrap=(n,k)=>{const f=window[n];window[n]=function(){calls[k]++;return f.apply(this,arguments);};};
    wrap('drawCoverRing','cover');wrap('drawKoRing','ko');wrap('drawRunnerPath','run');
    settings.ember=true;settings.lpc=true;newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;await wait(200);
    const g=G.guards[0];g.stun=5;g.ko=true;g.koMax=9;const g2=G.guards[1];if(typeof startRunner==='function')startRunner(g2);
    await wait(400);o.emberCover=calls.cover>0;o.emberKo=calls.ko>0;o.emberRun=calls.run>0;
    settings.ember=false;
    return o;});
  for(const k of ['coverAtStart','coverLapsed','eggGapOpen','barracksGapOpen','emberCover','emberKo','emberRun'])if(!r[k])fail.push(k);
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join(', '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
