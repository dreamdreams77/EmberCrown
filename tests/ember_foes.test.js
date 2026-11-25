// Ember art for the bestiary and the bosses: every sheet loads, every foe kind and every boss state draws with its
// Ember sheet without error, the old art returns with Ember off, and missing sheets fall back.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const fail=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1200);
  const r=await p.evaluate(async()=>{
    const o={},wait=ms=>new Promise(r=>setTimeout(r,ms));settings.lpc=true;settings.ember=true;
    o.ready=EMF.NAMES.filter(n=>!EMF.ready(n));
    newGame();startBrief(4);startPlay();G.cine=null;G.grace=1e9;G.god=true;await wait(200);
    const A=G.wren,states={wisp:['hover','charge','stagger','dead'],husk:['chase','wind','recover','dead'],mite:['chase','fuse','dead'],warder:['chase','cast','stagger','dead'],cantor:['chase','choir','sweep','recover','dead']};
    o.foeFail=[];
    for(const k in states){const f=spawnFoe(k,A.x+60,A.y);f.age=1;G.cine=null;
      for(const s of states[k]){f.state=s;f.t=.3;if(!EMF.foe(f))o.foeFail.push(k+':'+s);}}
    o.bossFail=[];
    for(const [L,sts] of [[3,['idle','windSlam','charge','leap','toll','stagger','roar']],[6,['float','volleyWind','slashWind','blinkWind','ringWind','summon','stagger']]]){
      newGame();startBrief(L);startPlay();G.cine=null;G.grace=1e9;await wait(150);const B=G.boss;bossEngage(B,true);G.cine=null;
      for(const s of sts){B.st=s;B.t=.4;if(!EMF.boss(B))o.bossFail.push(L+':'+s);}
      B.dead=true;B.deathT=.5;if(!EMF.boss(B))o.bossFail.push(L+':dead');}
    // Ember off: the previous art draws instead
    settings.ember=false;newGame();startBrief(3);startPlay();G.cine=null;await wait(150);
    let used=0;const ob=EMF.boss;EMF.boss=function(){used++;return ob.apply(this,arguments);};drawBoss(G.boss);EMF.boss=ob;o.offUsesEmber=used>0;
    // a sheet still loading: fall back for that figure only
    settings.ember=true;const keep=EMF.ok.foe_husk;EMF.ok.foe_husk=false;const h=spawnFoe('husk',G.wren.x+40,G.wren.y);o.huskFallback=EMF.foe(h)===false;EMF.ok.foe_husk=keep;
    return o;});
  if(r.ready.length)fail.push('sheets not loaded: '+r.ready.join(','));
  if(r.foeFail.length)fail.push('foe states not drawn: '+r.foeFail.join(','));
  if(r.bossFail.length)fail.push('boss states not drawn: '+r.bossFail.join(','));
  if(r.offUsesEmber)fail.push('Ember boss drawn with Ember art off');
  if(!r.huskFallback)fail.push('no fallback while a sheet loads');
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
