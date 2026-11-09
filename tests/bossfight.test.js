const {chromium}=require('playwright');
const OUT='/tmp/claude-0/-home-user-EmberCrown/74bad96c-385c-57cf-8015-6816324e22b5/scratchpad/shots/';
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
  p.on('pageerror',e=>errs.push(e.message+'\n'+e.stack));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const ev=(f,a)=>p.evaluate(f,a);
  await ev(()=>{__ec.newGame();__ec.run.talents=['nova'];__ec.startBrief(3);__ec.startPlay();const G=__ec.G;G.cine=null;G.ash.on=true;G.god=true;
    G.guards.forEach(g=>{if(!g.boss)g.stun=1e9;});
    const B=G.boss;B.x=18*32+16;B.y=5*32+16;B.face=Math.PI;G.wren.x=14*32+16;G.wren.y=5*32+16;G.ash.x=G.wren.x-20;G.ash.y=G.wren.y;
    G.items.filter(i=>i.type==='L').forEach(i=>i.done=true);});
  await p.waitForTimeout(600);
  console.log('cine',await ev(()=>__ec.G.cine&&__ec.G.cine.kind),'eng',await ev(()=>__ec.G.boss.eng));
  await p.waitForTimeout(1300);await p.screenshot({path:OUT+'bs_a.png'});
  await p.waitForTimeout(2600);
  console.log('after entrance',await ev(()=>({cine:!!__ec.G.cine,st:__ec.G.boss.st})));
  // fight: ash active; random strategy: stay & fire & dash; sample states
  await ev(()=>{__ec.G.active='ash';});
  const seen=new Set();let shots=0;
  for(let i=0;i<70;i++){
    await ev(()=>{const G=__ec.G,B=G.boss,A=G.ash;const a=Math.atan2(B.y-A.y,B.x-A.x);A.face=a;});
    await p.keyboard.down('Space');await p.waitForTimeout(120);
    const st=await ev(()=>({st:__ec.G.boss.st,hp:__ec.G.boss.hp,p:__ec.G.hp}));seen.add(st.st);
    if((st.st==='windSlam'||st.st==='stagger'||st.st==='charge')&&shots<3&&Math.random()<.5){shots++;await p.screenshot({path:OUT+'bs_'+st.st+shots+'.png'});}
    if(st.hp<=0)break;
  }
  await p.keyboard.up('Space');
  console.log([...seen].join(','),await ev(()=>({hp:__ec.G.boss.hp,dead:__ec.G.boss.dead,foes:__ec.G.foes.length,cine:__ec.G.cine&&__ec.G.cine.kind})));
  await p.waitForTimeout(1500);await p.screenshot({path:OUT+'bs_death.png'});
  await p.waitForTimeout(3500);
  console.log('end',await ev(()=>({cine:!!__ec.G.cine,dead:__ec.G.boss.dead,exitOpen:__ec.G.exitOpen,ts:__ec.G.ts})));
  console.log(errs.join('\n')||'no errors');await b.close();
})();
