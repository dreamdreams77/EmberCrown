// Ashfall Keep's opening and the fixes from the real-input playthrough:
// the lure lesson can be done as taught (and is needed), a caught try gives gadgets back, one held E does one thing,
// Retry after the culvert starts at the top of the ladder, the lose screen has no Ashling before she hatches,
// and a guard coming round from a takedown is groggy for a moment instead of seeing at once.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(700);
  const r=await p.evaluate(async()=>{
    const o={},K=__ec.keys,step=n=>{for(let i=0;i<n;i++)update(1/60);},C=v=>v*32+16;
    const fresh=()=>{beginMission&&0;newGame();startBrief(0);beginMission();G.cine=null;G.grace=0;for(const k in K)K[k]=false;return G;};
    const walk=(route,max)=>{const W=G.wren;let seen=0,maxA=0;for(const [tx,ty] of route){for(let i=0;i<(max||240);i++){const dx=C(tx)-W.x,dy=C(ty)-W.y;if(Math.hypot(dx,dy)<6)break;
      K.d=dx>4;K.a=dx<-4;K.s=dy>4;K.w=dy<-4;step(1);if(G.guards.some(g=>g.seeing))seen++;maxA=Math.max(maxA,G.alert);}}K.d=K.a=K.s=K.w=false;return{seen,maxA};};
    const climb=()=>{K.e=true;for(let i=0;i<90&&Math.floor(G.wren.y/32)>10;i++)step(1);K.e=false;step(2);return Math.floor(G.wren.y/32)<10;};
    // 1. the lure lesson as taught: drain-keeper down, bell through the door, slip to the ladder unseen
    fresh();let dk=G.guards.find(g=>g.mname==='Drain-keeper');dk.stun=60;dk.ko=true;
    G.wren.x=C(13);G.wren.y=C(25);G.wren.face=0;step(20);K.shift=true;useBell();
    let w=walk([[14,25],[15,24],[15,23]]);o.lureSeen=w.seen;o.lureClimbed=climb();K.shift=false;
    // ...and without the bell the ladder watch sees you on the way
    fresh();dk=G.guards.find(g=>g.mname==='Drain-keeper');dk.stun=60;dk.ko=true;G.wren.x=C(13);G.wren.y=C(25);step(20);K.shift=true;
    w=walk([[14,25],[15,24],[15,23]]);o.noBellAlert=+w.maxA.toFixed(2);K.shift=false;
    // 2. caught in the culvert: gadgets spent on the try come back
    fresh();const b0=G.gad.bell;G.wren.x=C(13);G.wren.y=C(25);G.wren.face=0;useBell();useBell();o.bellsSpent=b0-G.gad.bell;softCatch();o.bellsBack=G.gad.bell===b0;
    // 3. holding E up the ladder does not bring you straight back down
    fresh();G.wren.x=C(15);G.wren.y=C(23);G.guards.forEach(g=>{g.stun=60;g.ko=true;});K.e=true;step(150);K.e=false;step(2);o.stayedUp=Math.floor(G.wren.y/32)<10;
    // 4. Retry after the ladder starts at its top; Begin starts at the culvert
    retryMission();G.cine=null;o.retryTop=Math.floor(G.wren.y/32)<10;
    beginMission();G.cine=null;o.beginCulvert=Math.floor(G.wren.y/32)>20;
    // 5. the lose screen before Ashling hatches has no Ashling in it
    fresh();let txt='';for(let i=0;i<12;i++){setMode('lose');txt+=document.getElementById('ui').innerText;}o.loseNoAshling=!/Ashling/.test(txt);setMode('play');
    // 6. a takedown wears off into a groggy moment: he cannot see you for about a second
    fresh();const g=G.guards.find(q=>q.mname==='Drain-keeper');g.stun=.05;g.ko=true;g.koMax=9;G.wren.x=g.x+40;G.wren.y=g.y;G.grace=0;g.face=0;
    step(6);o.groggy=g.groggy>0;let seenEarly=false;for(let i=0;i<50;i++){step(1);if(g.seeing)seenEarly=true;}o.groggyBlind=!seenEarly;
    let seenLater=false;for(let i=0;i<120;i++){step(1);if(g.seeing)seenLater=true;}o.seesAfter=seenLater;
    return o;});
  const fail=[];
  if(r.lureSeen>0||!r.lureClimbed)fail.push('lure lesson not doable as taught');
  if(!(r.noBellAlert>=.2))fail.push('lure lesson skippable: no bell and the ladder watch did not notice');
  if(r.bellsSpent!==2||!r.bellsBack)fail.push('soft catch did not give the bells back');
  if(!r.stayedUp)fail.push('held E carried Shiloh back down the ladder');
  if(!r.retryTop)fail.push('Retry did not start at the top of the ladder');
  if(!r.beginCulvert)fail.push('Begin did not start in the culvert');
  if(!r.loseNoAshling)fail.push('lose screen mentions Ashling before she hatches');
  if(!r.groggy||!r.groggyBlind||!r.seesAfter)fail.push('takedown wake-up is not a groggy moment');
  console.log(JSON.stringify(r));if(errs.length)console.log(errs.join('\n'));
  console.log(fail.length?'FAIL '+fail.join('; '):'culvert ok');
  await b.close();process.exit(fail.length||errs.length?1:0);
})();
