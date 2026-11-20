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
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
