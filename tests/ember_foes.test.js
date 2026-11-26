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
    // overlays: the ward ring and the Cantor's boss bar come from drawFoeOver; no small bar on the Cantor
    settings.ember=true;newGame();startBrief(4);startPlay();G.cine=null;G.grace=1e9;await wait(150);
    let over=0;const odo=drawFoeOver;drawFoeOver=function(){over++;return odo.apply(this,arguments);};
    for(const k of ['wisp','husk','cantor','cinder']){const f=spawnFoe(k,G.wren.x+50,G.wren.y);f.state='chase';f.hp=f.max/2;drawFoe(f);}
    drawFoeOver=odo;o.overlayCalls=over;
    // boss cues: each wind-up paints its tell
    const cues={};const P=window.poly;
    newGame();startBrief(3);startPlay();G.cine=null;G.grace=1e9;await wait(150);{const B=G.boss;bossEngage(B,true);G.cine=null;
      let n=0;window.poly=function(){n++;return P.apply(this,arguments);};B.st='windCharge';B.t=.4;EMF.boss(B);cues.charge=n>0;window.poly=P;
      B.st='toll';B.t=.5;B.toll=0;let arcs=0;const oc=window.circ;window.circ=function(){arcs++;return oc.apply(this,arguments);};EMF.boss(B);cues.toll=arcs>0;window.circ=oc;
      B.dead=true;B.deathT=9;let al=1;const ob=ctx.drawImage;ctx.drawImage=function(){al=Math.min(al,ctx.globalAlpha);return ob.apply(this,arguments);};EMF.boss(B);ctx.drawImage=ob;cues.remains=al>=.7;}
    newGame();startBrief(6);startPlay();G.cine=null;G.grace=1e9;await wait(150);{const B=G.boss;bossEngage(B,true);G.cine=null;
      let n=0;window.poly=function(){n++;return P.apply(this,arguments);};B.st='summon';B.t=.5;EMF.boss(B);cues.sigil=n>0;window.poly=P;}
    o.cues=cues;
    return o;});
  if(r.ready.length)fail.push('sheets not loaded: '+r.ready.join(','));
  if(r.foeFail.length)fail.push('foe states not drawn: '+r.foeFail.join(','));
  if(r.bossFail.length)fail.push('boss states not drawn: '+r.bossFail.join(','));
  if(r.offUsesEmber)fail.push('Ember boss drawn with Ember art off');
  if(!r.huskFallback)fail.push('no fallback while a sheet loads');
  if(r.overlayCalls<4)fail.push('foe overlays (ward ring, burning, Cantor bar) skipped: '+r.overlayCalls+'/4');
  for(const k of ['charge','toll','remains','sigil'])if(!r.cues[k])fail.push('boss cue missing: '+k);
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
