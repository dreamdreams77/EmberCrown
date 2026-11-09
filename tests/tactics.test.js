const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+e.stack));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const ev=(f,a)=>p.evaluate(f,a);
  const setup=()=>ev(()=>{__ec.newGame();__ec.startBrief(1);__ec.startPlay();const G=__ec.G;G.cine=null;G.grace=0;G.guards.forEach(g=>g.stun=1e9);G.foes.length=0;G.pick.length=0;G.wren.x=12*32+16;G.wren.y=10*32+16;G.ash.on=true;G.ash.x=G.wren.x-20;G.ash.y=G.wren.y;G.hp=G.maxHp;G.inv=0;});
  // mite explodes and hurts
  await setup();await ev(()=>{const f=spawnFoe('mite',__ec.G.wren.x+30,__ec.G.wren.y);f.state='chase';f.t=0;f.cd=0;});
  await p.waitForTimeout(1800);console.log('mite hp',await ev(()=>__ec.G.hp+'/'+__ec.G.maxHp),'foes',await ev(()=>__ec.G.foes.filter(f=>f.state!=='dead').length));
  // warder wards a cinder, strike blocked, killing warder drops ward
  await setup();await ev(()=>{const G=__ec.G;const w=spawnFoe('warder',G.wren.x+110,G.wren.y);const c=spawnFoe('cinder',G.wren.x+120,G.wren.y+20);w.state='hover';w.t=0;w.cd=0;c.state='recover';c.t=9;c.vuln=0;c.ward=4;c.wardBy=w;G.cinderT=c;});
  const r=await ev(()=>{const G=__ec.G,c=G.foes[1],hp=c.hp;damageFoe(c,1,{sx:0,sy:0});const blocked=c.hp===hp;killFoe(G.foes[0]);damageFoe(c,1,{sx:0,sy:0});return {blocked,after:c.hp,ward:c.ward};});
  console.log('ward',JSON.stringify(r));
  // parry
  await setup();await ev(()=>{const G=__ec.G;G.active='wren';G.wren.face=0;strikePress();});
  console.log('parry',await ev(()=>{const G=__ec.G;const r=hurtTeam(1,G.wren.x+20,G.wren.y);return {r,hp:G.hp,max:G.maxHp,ctr:G.counterT>0};}));
  // heavy via hold
  await setup();await ev(()=>{const G=__ec.G;const f=spawnFoe('husk',G.wren.x+30,G.wren.y);f.state='chase';f.t=0;f.cd=9;G.wren.face=0;});
  await p.keyboard.down('Space');await p.waitForTimeout(900);await p.keyboard.up('Space');await p.waitForTimeout(500);
  console.log('heavy husk hp',await ev(()=>__ec.G.foes[0].hp));
  // ember flare
  await setup();await ev(()=>{const G=__ec.G,f=spawnFoe('husk',G.wren.x+40,G.wren.y);f.state='chase';f.t=0;f.cd=9;damageFoe(f,0.5,{fire:true,sx:0,sy:0});G.active='ash';G.ash.x=G.wren.x;G.ash.y=G.wren.y;G.ash.face=0;dashPress();});
  await p.waitForTimeout(700);console.log('flare husk hp',await ev(()=>__ec.G.foes[0].hp));
  // guards: call allies + search
  await setup();const g=await ev(()=>{const G=__ec.G;const a=G.guards[0],b2=G.guards[1];a.stun=0;b2.stun=0;b2.x=a.x+40;b2.y=a.y;b2.kind='guard';a.seen={x:G.wren.x,y:G.wren.y};callAllies(a);return {lure:!!b2.lure,role:b2.role};});
  console.log('call',JSON.stringify(g));
  await ev(()=>{const a=__ec.G.guards[0];a.seen={x:a.x+30,y:a.y};a.hunt=1;a.lure=null;a.stun=0;const ok=startSearch(a);window.__ss=ok;});
  await p.waitForTimeout(300);console.log('search',await ev(()=>({ok:window.__ss,s:__ec.G.guards[0].search&&__ec.G.guards[0].search.mode})));
  // cantor intro + fight
  await setup();await ev(()=>{const G=__ec.G;G.god=true;const f=spawnFoe('cantor',G.wren.x+110,G.wren.y);});
  await p.waitForTimeout(500);console.log('cine',await ev(()=>__ec.G.cine&&__ec.G.cine.kind));await p.screenshot({path:'/tmp/claude-0/-home-user-EmberCrown/74bad96c-385c-57cf-8015-6816324e22b5/scratchpad/cb_intro.png'});
  await ev(()=>{__ec.G.cine.t=99;});await p.waitForTimeout(300);
  const seen=new Set();
  for(let i=0;i<120;i++){await p.waitForTimeout(100);const s=await ev(()=>{const f=__ec.G.foes.find(x=>x.kind==='cantor');if(f&&__ec.G.time%1<.1)f.hp=Math.max(f.hp,f.hp);return f?f.state:'gone';});seen.add(s);if(i==25)await p.screenshot({path:'/tmp/claude-0/-home-user-EmberCrown/74bad96c-385c-57cf-8015-6816324e22b5/scratchpad/cb_fight.png'});}
  console.log('cantor states',[...seen].join(','));
  await ev(()=>{const f=__ec.G.foes.find(x=>x.kind==='cantor');if(f){f.ward=0;f.choir=false;killFoe(f);}});await p.waitForTimeout(300);
  // warden p2 rain + p3, candle flares
  await ev(()=>{__ec.newGame();__ec.run.talents=['nova'];__ec.startBrief(3);__ec.startPlay();const G=__ec.G;G.cine=null;G.god=true;G.guards.forEach(g=>{if(!g.boss)g.stun=1e9;});const B=G.boss;B.x=18*32+16;B.y=5*32+16;G.wren.x=14*32+16;G.wren.y=5*32+16;bossEngage(B,true);B.st='idle';B.t=0;B.hp=40;B.p2=true;B.rainCd=0;});
  const st=new Set();for(let i=0;i<150;i++){await p.waitForTimeout(100);st.add(await ev(()=>{const B=__ec.G.boss;if(B.hp>20&&B.hp<25)B.hp=24;return B.st;}));}
  console.log('warden',[...st].join(','),await ev(()=>({hp:__ec.G.boss.hp,p3:__ec.G.boss.p3})));
  await ev(()=>bossHit(__ec.G.boss,{type:'heavy',sx:0,sy:0}));
  console.log(errs.join('\n')||'no errors');await b.close();
})();
