// Ember art slice: assets load, the slice is Ashfall-only, the toggle restores the LPC art, every state of every character draws without error.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(900);
  const r=await p.evaluate(async()=>{
    const o={};const wait=ms=>new Promise(r=>setTimeout(r,ms));
    o.ready=['shiloh','pell','gaunt','cinder','ashling','faces_shiloh','faces_pell','faces_gaunt'].every(n=>EM.ready(n))&&EM.ok.tiles&&EM.ok.props;
    o.defaults=settings.ember!==false&&settings.hd2d===false;
    newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.god=true;await wait(300);
    o.onAshfall=EM.on();o.ui=document.body.classList.contains('ember-ui');
    // every state draws: walk, idle, strike, hurt, ko guard, seeing guard, cinderlings in every state, Ashling firing
    spawnFoe('cinder',G.wren.x+60,G.wren.y);for(const f of G.foes)f.state='wind';
    G.guards[0].ko=true;G.guards[0].stun=5;G.guards[1].seeing=true;
    for(let i=0;i<90;i++){G.wren.atk=i%30<8?{a:0,t:.1,t0:.22,combo:1}:null;G.fireOn=i>60;update(1/60);}
    for(const s of['chase','lunge','recover','dead'])for(const f of G.foes){f.state=s;f.t=.2;}
    await wait(300);
    // the same frame with ember off must come from the LPC art
    settings.ember=false;EM.applyUI();G.dirty=true;await wait(200);o.offAshfall=EM.on();o.uiOff=document.body.classList.contains('ember-ui');
    settings.ember=true;EM.applyUI();
    startBrief(1);startPlay();G.cine=null;G.grace=1e9;await wait(250);o.onGallowmere=EM.on();
    for(let i=0;i<40;i++)update(1/60);await wait(200);
    return o;});
  const fail=[];
  if(!r.ready)fail.push('ember assets not loaded');
  if(!r.defaults)fail.push('defaults: ember on, hd2d off');
  if(!r.onAshfall)fail.push('ember art not active in Ashfall Keep');
  if(!r.ui)fail.push('ember UI skin not applied');
  if(r.offAshfall)fail.push('toggle off did not disable');
  if(r.uiOff)fail.push('toggle off left the UI skin on');
  if(r.onGallowmere)fail.push('ember art leaked outside Ashfall Keep');
  // a saved ember:false profile must reload with the original UI, and a removed guard must not change anyone's face
  const ctx2=await b.newContext({viewport:{width:900,height:560}});
  await ctx2.addInitScript(()=>{try{localStorage.setItem('embercrown.settings.v1',JSON.stringify({ember:false,lpc:true}));}catch(e){}});
  const p2=await ctx2.newPage();p2.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p2.goto('http://localhost:8123/index.html');await p2.waitForTimeout(900);
  r.reloadOff=await p2.evaluate(()=>!document.body.classList.contains('ember-ui')&&settings.ember===false);
  await p.evaluate(()=>{settings.ember=true;EM.applyUI();newGame();startBrief(0);startPlay();G.cine=null;});
  // the pause-menu toggle itself (not a direct call) must flip the skin
  r.menuToggle=await p.evaluate(()=>{settings.ember=true;EM.applyUI();const on=document.body.classList.contains('ember-ui');
    const btn=document.createElement('button');btn.dataset.a='ember';const h=UI;try{newGame();startBrief(0);startPlay();G.cine=null;pauseGame(true);}catch(e){}
    const b=document.querySelector('[data-a="ember"]');if(b)b.click();return on&&!document.body.classList.contains('ember-ui');});
  if(!r.menuToggle)fail.push('pause-menu Ember art toggle did not restore the original UI skin');
  r.stableWho=await p.evaluate(()=>{const a=G.guards.filter(g=>!g.boss&&!g.spin&&(g.kind||'guard')==='guard');const before=a.map(g=>{drawGuard(g);return g._who;});G.guards.splice(G.guards.indexOf(a[0]),1);const after=a.slice(1).map(g=>{drawGuard(g);return g._who;});return JSON.stringify(before.slice(1))===JSON.stringify(after);});
  if(!r.reloadOff)fail.push('saved ember:false came back with the Ember UI skin');
  if(!r.stableWho)fail.push('guard faces changed after another guard was removed');
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
