/* Missions 5-7 rework (js/mis_b.js): Ironvale escort, presses, slag, lift, steam, breakout and lockdown; Dunmoor's
   rafter, clock, dance, anchor and KO consequences; the Candlemaker's approach, sabotage, censers and bell;
   each mission loads and completes through the __ec hooks. Screenshots: misb_*.png in EC_OUT. */
const {chromium}=require('playwright');
const OUT=process.env.EC_OUT||'.';console.log('out '+OUT);
const fails=[];const ok=(c,m)=>{if(!c){fails.push(m);console.log('FAIL '+m);}else console.log('ok   '+m);};
(async()=>{
  const b=await chromium.launch();const errs=[];
  for(const [tag,w,h,touch] of [['d',900,560,false],['p',740,360,true]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch});const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console '+m.text());});
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
    const start=async L=>p.evaluate(L=>{newGame();startBrief(L);startPlay();G.cine=null;G.grace=99;G.iris=null;return !!G.mb;},L);
    const tick=(n,dt)=>p.evaluate(([n,dt])=>{for(let i=0;i<n;i++)update(dt||1/60);},[n,dt]);
    if(tag==='d'){
    /* ---------------- Ironvale ---------------- */
    ok(await start(4),'Ironvale loads with mission state');
    let r=await p.evaluate(()=>{
      const o={};const IV=MisB.IV,s=G.mb;
      // slag: the yard trough is live, Perrin will not path through it
      o.hotA=MisB.hotTile(1,7)&&!MisB.hotTile(7,13);
      // trip a press with a guard under it
      const pr=s.press[0],g=G.guards[0];g.x=pr.x*T+16;g.y=pr.y*T+16;g.stun=0;g.pause=9;G.wren.x=pr.lx*T+16;G.wren.y=pr.ly*T+16;
      MisB.tripPress(pr);for(let i=0;i<40;i++)update(1/60);o.crushed=g.stun>5;
      // divert the slag south onto a guard
      const g2=G.guards[7];g2.x=9*T+16;g2.y=13*T+16;g2.stun=0;MisB.divert();o.scald=g2.stun>5;
      for(let i=0;i<180;i++)update(1/60);o.coolA=!MisB.hotTile(1,7)&&MisB.hotTile(9,13);
      // ore lift crushes a guard on the far pad and carries Shiloh
      const g3=G.guards[1];const b_=IV.liftB;g3.x=b_[0]*T+16;g3.y=b_[1]*T+16;g3.stun=0;
      G.wren.x=IV.liftA[0]*T+16;G.wren.y=IV.liftA[1]*T+16;MisB.ride('a');
      o.lift=Math.abs(G.wren.x-(b_[0]*T+16))<2&&g3.stun>5;
      // Ashling overheats a vent into steam
      const v=G.vents[0];v.on=false;G.ash.on=true;G.active='ash';G.ash.x=v.x*T+16-40;G.ash.y=v.y*T+16;G.ash.face=0;
      G.ventOff=99;const n0=G.smoke.length;keys[' ']=true;for(let i=0;i<60;i++)update(1/60);keys[' ']=false;o.steam=G.smoke.length>n0;G.ventOff=0;G.active='wren';
      return o;});
    ok(r.hotA,'Ironvale: yard slag trough is live at start');
    ok(r.crushed,'Ironvale: tripped press crushes a guard');
    ok(r.scald,'Ironvale: diverted slag scalds a guard on the south trough');
    ok(r.coolA,'Ironvale: yard trough cools after diverting');
    ok(r.lift,'Ironvale: ore lift carries Shiloh and crushes a guard on the far pad');
    ok(r.steam,'Ironvale: Ashling overheats a vent into a steam cloud');
    r=await p.evaluate(()=>{
      const o={};const s=G.mb;G.grace=99;
      for(const g of G.guards)g.stun=999;
      for(const k in G.doors)G.doors[k].open=true;const H=G.items.find(i=>i.type==='H');G.wren.x=H.x;G.wren.y=H.y+20;completeTarget({kind:'item',ref:H});
      update(1/60);o.freed=MisB.freed()&&s.per.st==='follow'&&!!s.bo;
      // follows along a path
      G.wren.x=20*T+16;G.wren.y=6*T+16;for(let i=0;i<240;i++)update(1/60);
      o.follow=Math.hypot(G.host.x-G.wren.x,G.host.y-G.wren.y)<2.5*T;
      // panics near fire
      MisB.panic({x:G.host.x+10,y:G.host.y});o.panic=s.per.st==='panic';
      for(let i=0;i<90;i++)update(1/60);o.cower=s.per.st==='cower';
      MisB.calmPerrin();o.calm=s.per.st==='follow';
      // wait and hide in a crate
      const hc=MisB.IV.hides[1];G.host.x=hc[0]*T+16;G.host.y=hc[1]*T+16;G.wren.x=G.host.x+20;G.wren.y=G.host.y;MisB.setWait(true);
      for(let i=0;i<60;i++)update(1/60);o.hidden=s.per.st==='hidden'&&!G.host.on;
      MisB.setWait(false);update(1/60);o.out=G.host.on&&s.per.st==='follow';
      o.rein=G.guards.filter(g=>g.rein).length;
      // breakout timer runs down into lockdown; the winch raises the gate
      s.bo.t=.01;update(1/60);o.lock=s.bo.lock&&G.doors['1,1']&&!G.doors['1,1'].open;
      MisB.raiseGate();o.raised=G.doors['1,1'].open;
      return o;});
    ok(r.freed,'Ironvale: freeing Perrin starts the breakout');
    ok(r.follow,'Ironvale: Perrin paths after Shiloh');
    ok(r.panic&&r.cower&&r.calm,'Ironvale: Perrin panics near fire, cowers, and can be calmed');
    ok(r.hidden&&r.out,'Ironvale: Perrin hides in a crate and comes out on call');
    ok(r.rein>=2,'Ironvale: reinforcements arrive ('+r.rein+')');
    ok(r.lock&&r.raised,'Ironvale: lockdown drops the portcullis, the winch raises it');
    r=await p.evaluate(()=>{ // complete: beacon, walk him to the gate, choose
      for(const it of G.items)if('OPBLHC'.includes(it.type))it.done=true;
      G.wren.x=G.exit.x;G.wren.y=G.exit.y;G.host.x=G.exit.x+20;G.host.y=G.exit.y+10;G.mb.per.st='wait';G.active='wren';
      update(1/60);const m1=__ec.mode;makeChoice(1);for(let i=0;i<600&&__ec.mode==='play';i++)update(1/60);
      if(__ec.mode==='play'&&G.vic)finishLevel();
      return{m1,m2:__ec.mode};});
    ok(r.m1==='choice','Ironvale: reaching the gate with Perrin opens the choice ('+r.m1+')');
    /* ---------------- Dunmoor ---------------- */
    ok(await start(5),'Dunmoor loads');
    r=await p.evaluate(()=>{
      const o={};const s=G.mb,D=MisB.DM;
      // without the rafter or the treaty the throne room stays sealed in the ruins
      shiftTime();o.sealed=G.grid[6][21]==='#'&&G.grid[2][18]==='#';
      o.pocket=G.grid[7][11]==='.'&&G.grid[8][11]==='#';
      // Ashling hops the rubble into the clock pocket and melts the clock
      G.active='ash';G.ash.x=11*T+16;G.ash.y=9*T+16;G.ash.face=-Math.PI/2;
      G.dash.ch=1;G.dash.cd=0;update(1/60);dashPress();for(let i=0;i<40;i++)update(1/60);
      o.hop=Math.floor(G.ash.y/T)===7;
      keys[' ']=true;G.ash.face=0;for(let i=0;i<80;i++)update(1/60);keys[' ']=false;o.clock=s.clock.burnt;
      G.ash.x=G.wren.x;G.ash.y=G.wren.y;G.active='wren';
      shiftTime();o.strike=s.clock.strikeT>0;
      // a frozen guard faces the clock
      for(let i=0;i<10;i++)update(1/60);const g=G.guards.find(x=>!x.seeing&&x.stun<=0);o.faces=!!g&&g.pause>0;
      // burn the rafter in the ball, then the ruins open the east corridor
      G.active='ash';G.ash.x=19*T+16;G.ash.y=8*T+16;G.ash.face=Math.atan2(-T,T);keys[' ']=true;for(let i=0;i<80;i++)update(1/60);keys[' ']=false;
      o.rafter=s.rafter.burnt;G.active='wren';
      // knock out a ball guard: one ruin guard never shows up
      for(const x of G.guards)x.stun=0;const n0=G.otherGuards.length;G.guards[0].stun=30;shiftTime();o.ko=G.guards.length===n0-1;o.east=G.grid[6][21]==='.';
      shiftTime();
      return o;});
    ok(r.sealed,'Dunmoor: ruins sealed without rafter or treaty');
    ok(r.pocket,'Dunmoor: rubble pocket around the fallen clock');
    ok(r.hop,'Dunmoor: Ashling hops the rubble with a dash');
    ok(r.clock&&r.strike&&r.faces,'Dunmoor: clock melted in the ruins strikes in the ball and freezes guards');
    ok(r.rafter&&r.east,'Dunmoor: rafter burnt in the ball opens the east corridor in the ruins');
    ok(r.ko,'Dunmoor: a guard laid out at the ball is missing in the ruins');
    r=await p.evaluate(()=>{
      const o={};const s=G.mb;G.grace=99;
      // dance with a guest: disguised, and follows the guest
      const q=G.guests[0];G.wren.x=q.x+10;G.wren.y=q.y;MisB.startDance(q);const rm=G.rangeMul;
      for(let i=0;i<30;i++)update(1/60);o.dance=!!s.dance&&Math.hypot(G.wren.x-q.x,G.wren.y-q.y)<16&&G.rangeMul===rm;
      keys.d=true;update(1/60);update(1/60);keys.d=false;o.broke=!s.dance;
      // send Ashling across time: Shiloh is out of sight, Ashling returns at a pedestal
      const ped=G.peds[0];G.wren.x=ped.x;G.wren.y=ped.y;const st0=G.state;MisB.startAnchor(ped);
      o.anch=G.state!==st0&&G.active==='ash'&&G.wren.hidden;
      for(let i=0;i<10;i++)update(1/60);o.safe=G.wren.x===ped.x&&G.alert<.05;
      swapChar();o.noswap=G.active==='ash';
      G.ash.x=G.peds[1].x;G.ash.y=G.peds[1].y;for(let i=0;i<120;i++)update(1/60);
      o.back=!s.anchor&&G.state===st0&&G.active==='wren'&&!G.wren.hidden;
      // complete
      for(const it of G.items)if('OPBLHC'.includes(it.type))it.done=true;
      G.wren.x=G.exit.x;G.wren.y=G.exit.y;for(let i=0;i<400&&__ec.mode==='play';i++)update(1/60);o.win=__ec.mode;
      return o;});
    ok(r.dance&&r.broke,'Dunmoor: dancing disguises and moving breaks it');
    ok(r.anch&&r.safe&&r.noswap,'Dunmoor: Ashling goes across time alone, Shiloh is out of reach');
    ok(r.back,'Dunmoor: Ashling returns at a pedestal');
    ok(r.win!=='play','Dunmoor: completes ('+r.win+')');
    /* ---------------- Finale ---------------- */
    ok(await start(6),'Finale loads');
    r=await p.evaluate(()=>{
      const o={};const s=G.mb,C=MisB.CR;
      o.startY=Math.floor(G.wren.y/T);o.towers=G.guards.filter(g=>g.spin).length;o.gate=!G.doors['12,14'].open;
      MisB.openGate();o.chained=!G.doors['12,14'].open;
      MisB.sabotage('burn');o.burn=G.items.filter(i=>i.type==='C'&&i.done).length===2;
      MisB.sabotage('poison');o.once=s.sab==='burn';
      MisB.openGate();o.open=G.doors['12,14'].open;
      // censer drops on the boss
      const B=G.boss;B.x=8*T+16;B.y=6*T+16;bossEngage(B);B.st='walk';G.cine=null;G.bars=0;
      MisB.censerImpact({x:B.x,y:B.y});o.stag=B.st==='stagger'&&B.stg>0;
      B.st='walk';B.stg=0;G.wren.x=11*T+16;G.wren.y=4*T+16;MisB.ringBell();o.bell=B.st==='stagger';
      return o;});
    ok(r.startY>=20,'Finale: starts on the approach (row '+r.startY+')');
    ok(r.towers===2,'Finale: two lamp towers sweep the Wax Road');
    ok(r.gate&&r.chained,'Finale: hall gate is closed and chained until the sabotage');
    ok(r.burn&&r.once&&r.open,'Finale: one sabotage choice (burn starves two candles), then the gate opens');
    ok(r.stag,'Finale: a falling censer staggers the Candlemaker');
    ok(r.bell,'Finale: the Hallow bell turns him');
    r=await p.evaluate(()=>{ // wick choice lengthens the stagger; poison silences candle sparks
      const o={};newGame();startBrief(6);startPlay();G.cine=null;G.grace=99;
      MisB.sabotage('wick');const B=G.boss;bossEngage(B);G.cine=null;B.st='walk';candleSnuffed(B);o.wick=B.t>2;
      newGame();startBrief(6);startPlay();G.cine=null;G.grace=99;MisB.sabotage('poison');G.boss.flareCd=0;update(1/60);o.poison=G.boss.flareCd>=5;
      // complete
      for(const it of G.items)if('OPBLHC'.includes(it.type))it.done=true;G.boss.dead=true;MisB.openGate();
      G.wren.x=G.exit.x;G.wren.y=G.exit.y;for(let i=0;i<5;i++)update(1/60);o.end=__ec.mode;
      return o;});
    ok(r.wick,'Finale: master wick lengthens his stagger');
    ok(r.poison,'Finale: poisoned wax stops candle sparks');
    ok(r.end==='choice','Finale: the throne opens the ending choice ('+r.end+')');
    }
    /* ---------------- screenshots ---------------- */
    for(const [L,setup,name] of [[4,'iv','ironvale'],[5,'dm','dunmoor'],[6,'cr','crown']]){
      await start(L);
      await p.evaluate(s=>{
        if(s==='iv'){const H=G.items.find(i=>i.type==='H');H.done=true;G.host.on=true;G.wren.x=7*T+16;G.wren.y=9*T+16;G.host.x=8*T+16;G.host.y=10*T+16;}
        if(s==='dm'){G.wren.x=11*T+16;G.wren.y=9*T+16;shiftTime();}
        if(s==='cr'){G.wren.x=19*T+16;G.wren.y=17*T+16;}
        G.ash.x=G.wren.x+20;G.ash.y=G.wren.y;for(let i=0;i<30;i++)update(1/60);V.dbgZoom=0;},setup);
      await p.waitForTimeout(350);await p.screenshot({path:OUT+'/misb_'+name+'_'+tag+'.png'});
    }
    await ctx.close();
  }
  console.log(errs.length?'ERRORS:\n'+[...new Set(errs)].slice(0,12).join('\n'):'no errors');
  await b.close();
  if(fails.length||errs.length){console.log('FAIL '+fails.length+' checks');process.exit(1);}
})();
