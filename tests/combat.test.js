const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const ctx=await b.newContext({viewport:{width:1280,height:720}});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message+'\n'+e.stack));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const ev=(f,a)=>p.evaluate(f,a);
  const setup=()=>ev(()=>{__ec.newGame();__ec.startBrief(1);__ec.startPlay();const G=__ec.G;G.cine=null;G.guards.forEach(g=>g.stun=1e9);G.foes.length=0;G.pick.length=0;
    G.wren.x=12*32+16;G.wren.y=10*32+16;G.ash.on=false;G.hp=G.maxHp;G.inv=0;
    const f=spawnFoe('cinder',G.wren.x+54,G.wren.y);f.state='chase';f.t=0;f.cd=0;f.hp=2;});
  // 1) no dodge: should take a hit
  await setup();await p.waitForTimeout(1600);
  console.log('no dodge -> hp',await ev(()=>__ec.G.hp),'of',await ev(()=>__ec.G.maxHp));
  // 2) roll when windup ends
  await setup();
  for(let i=0;i<60;i++){const st=await ev(()=>{const f=__ec.G.foes[0];return f?[f.state,f.t]:null;});
    if(st&&st[0]==='wind'&&st[1]<.14){await p.keyboard.press('c');break;}await p.waitForTimeout(20);}
  await p.waitForTimeout(900);
  console.log('rolled -> hp',await ev(()=>__ec.G.hp));
  // 3) strike kills a cinderling (2 dmg) with combo and drops loot
  await setup();await ev(()=>{const G=__ec.G,f=G.foes[0];f.state='recover';f.vuln=2;f.t=5;f.x=G.wren.x+26;f.y=G.wren.y;G.wren.face=0;});
  await p.keyboard.press(' ');await p.waitForTimeout(150);await p.keyboard.press(' ');await p.waitForTimeout(500);
  console.log('strike -> foe',await ev(()=>{const f=__ec.G.foes[0];return f?f.state+':'+f.hp.toFixed(1):'gone';}),'pickups',await ev(()=>__ec.G.pick.length));
  // 4) takedown from behind
  await ev(()=>{const G=__ec.G;G.foes.length=0;const g=G.guards[0];g.stun=0;g.seeing=false;g.x=G.wren.x+22;g.y=G.wren.y;g.face=0;g.lure=null;G.wren.face=0;G.guards.forEach((q,i)=>{if(i)q.stun=1e9;});});
  await p.keyboard.press(' ');await p.waitForTimeout(250);
  console.log('takedown ->',await ev(()=>{const g=__ec.G.guards[0];return {ko:g.ko,stun:+g.stun.toFixed(1),alert:+__ec.G.alert.toFixed(2)};}));
  // 5) old v2 save loads
  await ev(()=>{localStorage.setItem('embercrown.save.v2',JSON.stringify({v:2,meta:{relics:['boots'],lore:[],best:{}},run:{stage:'brief',next:2,diff:1,perk:'bribe',houses:{marrow:{favor:0,fear:1,ruin:0},grell:{favor:1,fear:0,ruin:0},ostrander:{favor:0,fear:0,ruin:0},sable:{favor:0,fear:0,ruin:0},kest:{favor:0,fear:0,ruin:0},dunmoor:{favor:0,fear:0,ruin:0}},stats:{gems:5,caught:1,time:300,byLvl:[3,2]},relics:['boots'],lore:[],ranks:{0:'A'},secrets:{}}}));});
  await p.reload();await p.waitForTimeout(600);
  await p.keyboard.press('Enter');await p.waitForTimeout(400);
  console.log('v2 save ->',await ev(()=>({mode:__ec.mode,lvl:__ec.lvl,talents:__ec.run.talents,cinders:__ec.run.cinders,relics:__ec.run.relics})));
  console.log(errs.join('\n')||'no errors');await b.close();
})();
