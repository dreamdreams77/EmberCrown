/* Dungeons (js/dungeons.js): secret entries in missions 5-7, entering and leaving to the exact spot, the plate/cart,
   mirror/moonbeam and bell/brazier puzzles, strongbox loot banked apart from the mission, challenge rooms (win, fail,
   unique reward), warren travel between dungeons, defeat below, and the optional run.dng save field. */
const {chromium}=require('playwright');
const OUT=process.env.EC_OUT||'.';console.log('out '+OUT);
const fails=[];const ok=(c,m)=>{if(!c){fails.push(m);console.log('FAIL '+m);}else console.log('ok   '+m);};
(async()=>{
  const b=await chromium.launch();const errs=[];
  for(const [tag,w,h,touch] of [['d',900,560,false],['p',740,360,true]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch});const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console '+m.text());});
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
    if(tag==='d'){
    let r=await p.evaluate(()=>{
      const o={};newGame();startBrief(4);startPlay();G.cine=null;G.grace=99;
      const E=Dungeons.ENTRIES[4],c={x:E.x*T+16,y:E.y*T+16};
      update(1/60);
      // hidden until Ashling burns the crust
      G.wren.x=c.x+20;G.wren.y=c.y;o.hidden=!(findTarget(G.wren)&&findTarget(G.wren).ref==='entry');
      G.active='ash';G.ash.x=c.x-50;G.ash.y=c.y;G.ash.face=0;keys[' ']=true;for(let i=0;i<70;i++)update(1/60);keys[' ']=false;G.active='wren';
      o.revealed=G.dgE.revealed;
      G.wren.x=c.x+14;G.wren.y=c.y;const t=findTarget(G.wren);o.target=!!t&&t.ref==='entry';
      // mission state to compare on return
      const mG=G,cin=run.cinders;
      completeTarget(t);update(1/60);const wx=mG.wren.x,wy=mG.wren.y,gx=mG.guards[2].x,tm=mG.time;
      o.inside=Dungeons.inDungeon()&&G.dng.id==='undercroft'&&G!==mG&&G.ash.on;
      o.found=!!run.dng.found.undercroft;
      // plates and carts: Shiloh on one, Ashling on another, push a cart onto the third
      const dg=G.dng;
      const push=(cart,dx,dy)=>{G.active='wren';G.wren.x=(cart.x-dx)*T+16;G.wren.y=(cart.y-dy)*T+16;const k=dx?(dx>0?'d':'a'):(dy>0?'s':'w');keys[k]=true;for(let i=0;i<40;i++)update(1/60);keys[k]=false;for(let i=0;i<10;i++)update(1/60);};
      const cart=dg.carts[0];push(cart,0,1);push(cart,0,1);o.cart=cart.x===13&&cart.y===6;
      G.ash.x=16*T+16;G.ash.y=2*T+16;G.wren.x=10*T+16;G.wren.y=2*T+16;update(1/60);update(1/60);
      o.plates=dg.plates.every(q=>q.on)&&!!run.dng.solved.undercroft&&G.doors['3,6'].open&&G.doors['13,8'].open;
      // strongbox: cinders banked straight to the run
      Dungeons.openBox();o.box=run.cinders>cin&&!!run.dng.cleared.undercroft&&run.lore.includes('The Undercroft Ledger');
      // challenge: waves, a timer, a unique reward
      Dungeons.startChal();o.chalOn=!!dg.ch&&!G.doors['13,8'].open&&G.foes.filter(f=>f.state!=='dead').length>0;
      for(let n=0;n<6;n++){for(const f of G.foes)if(f.state!=='dead'){f.hp=0;f.state='dead';}for(let i=0;i<70;i++)update(1/60);}
      o.chalWin=!!run.dng.chal.undercroft&&run.items.includes('undertongs')&&G.doors['13,8'].open;
      Dungeons.startChal();dg.ch.t=.01;update(1/60);o.chalFail=!dg.ch&&G.doors['13,8'].open;
      // warren to the Mirror Cellars (open because this dungeon is solved), then back up to Ironvale
      Dungeons.enter('mirrors','undercroft');o.warren=G.dng.id==='mirrors'&&Dungeons.stack.length===1;
      Dungeons.leave();o.back=G===mG&&G.wren.x===wx&&G.wren.y===wy&&G.guards[2].x===gx&&G.time===tm&&!Dungeons.inDungeon();
      o.mode=__ec.mode;
      return o;});
    ok(r.hidden&&r.revealed&&r.target,'Ironvale: slag grate is hidden until Ashling burns it, then offers the way down');
    ok(r.inside&&r.found,'Undercroft entered (separate level, Ashling along)');
    ok(r.cart,'Undercroft: carts slide when pushed');
    ok(r.plates,'Undercroft: three plates (two heroes and a cart) open the vault and challenge doors');
    ok(r.box,'Undercroft: strongbox banks cinders and lore at once');
    ok(r.chalOn&&r.chalWin,'Undercroft: anvil challenge seals the room, waves, unique Tongs');
    ok(r.chalFail,'Undercroft: challenge fails on the timer and resets');
    ok(r.warren,'Warren travel to the Mirror Cellars');
    ok(r.back&&r.mode==='play','Leaving returns to the exact spot with the mission untouched');
    r=await p.evaluate(()=>{
      const o={};newGame();startBrief(5);startPlay();G.cine=null;G.grace=99;
      const E=Dungeons.ENTRIES[5];G.wren.x=E.x*T+16+12;G.wren.y=E.y*T+16;update(1/60);
      o.ballHidden=!(findTarget(G.wren)&&findTarget(G.wren).ref==='entry');
      shiftTime();update(1/60);const t=findTarget(G.wren);o.ruin=!!t&&t.ref==='entry';
      completeTarget(t);update(1/60);o.inside=G.dng&&G.dng.id==='mirrors';
      const dg=G.dng;update(1/60);o.beamStart=dg.beam&&dg.beam.hit!=='lock';
      const turn=(k,n)=>{for(let i=0;i<n;i++){const m=dg.mirrors[k];m.s=m.s==='|'?'/':m.s==='/'?'\\':'|';}};
      turn(0,2);turn(1,2);turn(2,1);turn(3,1);update(1/60);update(1/60);
      o.beam=dg.beam.hit==='lock'&&!!run.dng.solved.mirrors&&G.doors['3,6'].open;
      // the brazier beam needs Ashling's fire and the fifth mirror
      const bz=dg.braz[0];G.active='ash';G.ash.x=(bz.x-1)*T+6;G.ash.y=bz.y*T+16;G.ash.face=0;keys[' ']=true;for(let i=0;i<50;i++)update(1/60);keys[' ']=false;G.active='wren';
      turn(4,2);update(1/60);update(1/60);o.echo=bz.lit&&!!run.dng.solved2.mirrors&&G.doors['13,8'].open;
      Dungeons.startChal();const ch=G.dng.ch;o.candles=ch.candles.length===5&&ch.candles.every(k=>k.lit);
      for(const k of ch.candles)k.lit=false;update(1/60);o.mwin=!!run.dng.chal.mirrors&&run.items.includes('veyraglass');
      // defeat below: back up the stair with one heart, not a lost mission
      G.inv=0;G.dash.t=0;G.roll.t=0;G.hp=1;hurtTeam(1,G.wren.x+10,G.wren.y,'test');update(1/60);
      o.eject=!Dungeons.inDungeon()&&__ec.mode==='play'&&G.hp===1&&G.d.name==='Dunmoor Marsh';
      return o;});
    ok(r.ballHidden&&r.ruin,'Dunmoor: the cellar stair exists only in the ruins');
    ok(r.inside&&r.beamStart,'Mirror Cellars entered, beam starts misaligned');
    ok(r.beam,'Mirror Cellars: turning mirrors leads the moonbeam to the sun-lock');
    ok(r.echo,'Mirror Cellars: Ashling lights the brazier, its beam opens the echo room');
    ok(r.candles&&r.mwin,'Mirror Cellars: candle challenge and unique Hand-Mirror');
    ok(r.eject,'Defeat below returns you to the mission with one heart');
    r=await p.evaluate(()=>{
      const o={};newGame();startBrief(6);startPlay();G.cine=null;G.grace=99;
      Dungeons.state().found.ossuary=1; // found before: the bell-shaft stays open
      const E=Dungeons.ENTRIES[6];G.wren.x=E.x*T+16+12;G.wren.y=E.y*T+16;update(1/60);const t=findTarget(G.wren);o.entry=!!t&&t.ref==='entry';
      Dungeons.enter('ossuary');const dg=G.dng;
      const ring=n=>{const b=dg.bells.find(x=>x.n===n);b.ring=0;G.wren.x=b.x*T+16;G.wren.y=b.y*T+30;const tt=findTarget(G.wren);if(tt&&tt.ref===b)completeTarget(tt);for(let i=0;i<60;i++)update(1/60);};
      ring(0);o.discord=dg.seq.length===0;
      for(const n of Dungeons.DUNGEONS.ossuary.order)ring(n);
      o.bells=!!run.dng.solved.ossuary&&G.doors['3,6'].open;
      for(const bz of dg.braz)bz.lit=true;update(1/60);o.braz=!!run.dng.solved2.ossuary&&G.doors['13,8'].open;
      // persistence: save, wipe, continue
      writeSave('brief',6);const s=JSON.parse(localStorage.getItem('embercrown.save.v2'));o.saved=!!(s.run.dng&&s.run.dng.solved.ossuary);
      run.dng={};saved=s;continueGame();o.loaded=!!(run.dng.solved&&run.dng.solved.ossuary&&run.dng.found.ossuary);
      // uniques never show up in the shop stock or random rolls
      run.items=[];let leak=false;for(let k=0;k<60;k++){const it=rollItem(k*13,'epic');if(it&&it.unique)leak=true;}
      o.noleak=!leak&&ITEMS.filter(i=>i.unique).length===3;
      // an old save without the field still loads
      const v3={v:3,meta:{relics:[],lore:[],best:{},disc:[]},run:{stage:'brief',next:3,diff:1,stairs:{},houses:s.run.houses,stats:{gems:0,caught:0,time:1,byLvl:[]},relics:[],lore:[],ranks:{},secrets:{}}};
      saved=v3;o.old=continueGame()&&typeof run.dng==='object';
      return o;});
    ok(r.entry,'Finale: a found bell-shaft stays open');
    ok(r.discord,'Ossuary: a wrong bell resets the sequence');
    ok(r.bells,'Ossuary: ringing the mural order opens the vault');
    ok(r.braz,'Ossuary: two braziers open the challenge room');
    ok(r.saved&&r.loaded,'run.dng persists through writeSave and continueGame');
    ok(r.noleak,'Unique rewards stay out of shops and random rolls');
    ok(r.old,'Saves without run.dng still load');
    }
    // screenshots of each dungeon
    for(const id of ['undercroft','mirrors','ossuary']){
      await p.evaluate(id=>{newGame();startBrief(4);startPlay();G.cine=null;G.grace=99;Dungeons.enter(id);G.wren.x=11*T+16;G.wren.y=4*T+16;G.ash.x=G.wren.x+24;G.ash.y=G.wren.y+10;
        if(id==='mirrors'){const dg=G.dng;dg.mirrors[0].s='\\';dg.mirrors[1].s='/';}
        for(let i=0;i<30;i++)update(1/60);},id);
      await p.waitForTimeout(350);await p.screenshot({path:OUT+'/dng_'+id+'_'+tag+'.png'});
    }
    await ctx.close();
  }
  console.log(errs.length?'ERRORS:\n'+[...new Set(errs)].slice(0,12).join('\n'):'no errors');
  await b.close();
  if(fails.length||errs.length){console.log('FAIL '+fails.length+' checks');process.exit(1);}
})();
