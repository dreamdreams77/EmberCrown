const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  // legacy save: perk string at court stage
  await p.evaluate(()=>{localStorage.setItem('embercrown_save',localStorage.getItem('embercrown_save'));});
  const r=await p.evaluate(()=>{
    const out={};
    // mission-by-mission: apply each option and load level
    for(let i=1;i<STAIRS.length;i++){
      for(let k=0;k<3;k++){
        newGame();perks={};perks[i]=k;
        startBrief(i);startPlay();
        const g=G;
        out[i+'.'+k]={guards:g.guards.length,range:+g.rangeMul.toFixed(2),decay:+g.decay.toFixed(2),smoke:g.gad.smoke,bell:g.gad.bell,spd:Math.round(g.guards[0]?g.guards[0].spd:0),fx:JSON.stringify(g.bsx)};
      }
    }
    return out;});
  for(const k in r)console.log(k,JSON.stringify(r[k]));
  // flow: finish mission 0, expect court for mission 1, pick, brief
  const f=await p.evaluate(()=>{
    newGame();startBrief(0);startPlay();finishLevel&&0;
    return typeof continueFromWin;});
  // legacy save
  const leg=await p.evaluate(()=>{
    newGame();
    const s={v:3,meta:{relics:[],lore:[],best:{},disc:[]},run:{stage:'court',next:1,diff:1,perk:'blackmail',houses:houses,stats:{gems:0,caught:0,time:0,byLvl:[]},relics:[],lore:[],ranks:{0:'A'},secrets:{},talents:[],cinders:0,disc:[]}};
    saved=s;continueGame();
    return {mode,lvl,perks:JSON.stringify(perks)};});
  console.log('legacy',JSON.stringify(leg));
  // pick via keyboard then UI screens
  await p.evaluate(()=>{setMode('court')});await p.waitForTimeout(200);
  await p.screenshot({path:'bs_court.png'});
  await p.keyboard.press('2');await p.waitForTimeout(300);
  console.log('after pick',await p.evaluate(()=>({mode,lvl,perks:JSON.stringify(perks)})));
  await p.evaluate(()=>{run.ranks[0]='A';run.ranks[1]='B';});
  const cf=await p.evaluate(()=>{const b=document.querySelector('[data-a="case"]');return !!b});
  console.log('case btn on brief',cf);
  await p.screenshot({path:'bs_brief.png'});
  console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
