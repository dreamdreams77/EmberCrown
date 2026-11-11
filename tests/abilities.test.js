/* Ashling's abilities (js/abilities.js): gates and unlocks (talent, quest fx, perch), the cycle key, each ability's
   exploration hook (scorch a web and a rotten door, roar down a hanging cage, lantern a rune in a dark room, glide
   Shiloh over the Abbey chasm), combat effects, Shiloh's mastery techniques, the touch ACT label and saves. */
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
      const r=await p.evaluate(()=>{
        const o={},C=v=>v*T+16;
        const go=i=>{newGame();startBrief(i);startPlay();G.cine=null;G.grace=99;G.ash.on=true;for(const g of G.guards)g.stun=1e9;update(1/60);};
        const tick=n=>{for(let i=0;i<n;i++)update(1/60);};
        go(0);
        // gates
        o.none=Abilities.list().length===0&&!Abilities.has('scorch')&&Abilities.use('scorch')===false;
        o.unknown=Abilities.unlock('riposte')===false;
        run.talents.push('scorch');o.talent=Abilities.has('scorch')&&Abilities.list().join()==='scorch';
        o.canBuyBlocked=!canBuy(TALENTS.find(t=>t.id==='scorch'));
        Abilities.unlock('roar');Abilities.unlock('lantern');Hub.fx({abil:'ember_roost'},[]);
        o.quest=Abilities.has('glide')&&run.npc.abil.includes('ember_roost');
        o.list=Abilities.list().join();
        // cycle key (G) and E
        run.npc.absel='scorch';G.active='ash';
        playPress('g');o.cycled=Abilities.selected()==='roar';
        // scorch the web in the cellar and the rotten door
        const S=G.ab;const web=S.spots.find(s=>s.k==='web'),door=S.spots.find(s=>s.k==='door');
        o.spots=S.spots.map(s=>s.k+(s.x!=null?'@'+s.x+','+s.y:'')).join(' ');
        run.npc.absel='scorch';
        G.ash.x=C(web.x)-40;G.ash.y=C(web.y);G.ash.face=0;const cin=G.cinders;novaPress();tick(2);
        o.web=web.done&&G.cinders>cin;o.cd=G.ab.cd.scorch>0&&Abilities.use('scorch')===false;
        tick(200);G.ash.x=C(door.x)-40;G.ash.y=C(door.y);G.ash.face=0;novaPress();o.door=door.door.open&&door.door.burnt;
        // scorch in combat: a guard in the cone is stunned
        tick(200);const g0=G.guards[0];g0.stun=0;G.ash.x=g0.x-50;G.ash.y=g0.y;G.ash.face=0;Abilities.use('scorch');o.scorchStun=g0.stun>2;
        // roar the cage down onto a guard
        const hang=S.spots.find(s=>s.k==='hang');const g1=G.guards[1];g1.stun=0;g1.x=C(hang.x);g1.y=C(hang.y);
        G.ash.x=C(hang.x)-60;G.ash.y=C(hang.y);const c2=G.cinders;Abilities.use('roar');tick(40);
        o.hang=hang.st==='down'&&G.cinders>c2&&g1.stun>2;
        // lantern: a rune in the dark cellar shows only in its light, touching it pays out
        const rune=S.spots.find(s=>s.k==='rune');o.runeHidden=!rune.seen;
        G.ash.x=C(rune.x);G.ash.y=C(rune.y)-64;Abilities.use('lantern');tick(2);o.lit=G.ab.lant>0&&lightAt(G.ash.x,G.ash.y+30)>.3;
        o.runeSeen=rune.seen;G.ash.x=C(rune.x);G.ash.y=C(rune.y);const c3=G.cinders;tick(2);o.rune=rune.done&&G.cinders>c3;
        Abilities.use('lantern');o.lanternOff=G.ab.lant===0;
        // HUD slot label
        o.slot=Abilities.slot(()=>{},false);
        // save and load keep what she learned
        writeSave('brief',1);const sv=lsGet(SAVE_KEY),keep=run.npc.abil.slice().sort().join();newGame();o.cleared=!Abilities.has('roar');lsSet(SAVE_KEY,sv);saved=sv;continueGame();
        o.saved=run.npc.abil.slice().sort().join()===keep&&Abilities.has('roar');
        // glide Shiloh over the Abbey chasm (pits at x 23-24, y 16-20)
        go(3);Abilities.unlock('glide');G.active='ash';run.npc.absel='glide';
        G.wren.x=C(22);G.wren.y=C(17);G.ash.x=C(22);G.ash.y=C(17)+10;G.ash.face=0;
        o.pitBlocks=blocked(C(23),C(17),8);
        Abilities.use('glide');tick(50);o.glide=G.wren.x>C(24)&&!G.ab.glide;o.glideAt=[Math.round(G.wren.x/T),Math.round(G.wren.y/T)].join();
        // into a wall: no footing, no cooldown
        G.ash.x=C(1);G.ash.y=C(13);G.ash.face=Math.PI;G.wren.x=C(1);G.wren.y=C(13);G.ab.cd.glide=0;o.noFoot=Abilities.use('glide')===false&&!(G.ab.cd.glide>0);
        // nova stays usable when selected
        run.talents.push('nova');run.npc.absel='nova';G.nova.cd=0;novaPress();o.nova=G.nova.cd>0;
        // Shiloh's techniques by mastery rank
        run.mastery.xp=0;o.t0=Abilities.techs().filter(t=>t.on).length===0&&equipBonus('pick')===0;
        run.mastery.xp=masteryXpFor(6);o.t6=Abilities.tech('shadow')&&Abilities.tech('pick2')&&!Abilities.tech('disguise')&&Math.abs(equipBonus('pick')-.2)<1e-6;
        // shadow-step: roll while sneaking in the dark
        G.active='wren';G.sneak=true;G.roll.cd=0;G.roll.t=0;const W=G.wren;W.x=C(3);W.y=C(12);W.face=0;
        const lx=W.x;const LA=lightAt;lightAt=()=>0;rollPress();lightAt=LA;o.shadow=W.x>lx+30&&G.ab.stepCd>0;
        // silent dash: roll while sneaking hides you a moment
        G.ab.stepCd=9;G.roll.cd=0;G.roll.t=0;rollPress();o.silent=G.ab.shadeT>0&&equipBonus('shade')>=.45;
        // perch growth
        run.npc.abil=[];run.talents=[];run.npc.abperch=0;stats.gems=11;o.pts=Abilities.perchPts()===2;o.teach=Abilities.teach('lantern')&&Abilities.teach('glide')&&!Abilities.teach('roar');
        return o;
      });
      console.log(JSON.stringify(r));
      for(const k of ['none','unknown','talent','canBuyBlocked','quest','cycled','web','cd','door','scorchStun','hang','runeHidden','lit','runeSeen','rune','lanternOff','slot','cleared','saved','pitBlocks','glide','noFoot','nova','t0','t6','shadow','silent','pts','teach'])ok(r[k],'desktop: '+k);
      // Shiloh's techniques: disguise skill adds a livery use, a rank-up names the new technique, the Hero sheet lists them
      const t2=await p.evaluate(()=>{const o={};
        newGame();startBrief(1);const base=(()=>{startPlay();G.cine=null;return G.mis&&G.mis.dis?G.mis.dis.uses:-1;})();
        newGame();run.mastery.xp=masteryXpFor(8);startBrief(1);startPlay();G.cine=null;o.livery=base>0&&G.mis.dis.uses===base+1;
        G.maskT=0;update(1/60);G.maskT=30;update(1/60);o.mask=G.maskT>40;
        const g={rank:'A',st:{kills:0,takedowns:0},secretsFound:0,gems:0};run.mastery.xp=masteryXpFor(5)-10;awardMastery(g);
        o.drop=(g.itemDrops||[]).some(d=>d.tech&&/Shadow-step/.test(d.name));
        const rows=sheetRows();o.sheet=rows.wren.some(r=>r[0]==='Techniques'&&/Shadow-step/.test(r[1]))&&rows.wren.some(r=>r[0]==='Lockpick tier'&&r[1]==='I');
        return o;});
      console.log(JSON.stringify(t2));for(const k of ['livery','mask','drop','sheet'])ok(t2[k],'techniques: '+k);
      // every placed hook lands on a usable tile in its mission
      const sp=await p.evaluate(()=>{const out=[];for(const i of Object.keys(Abilities.SPOTS)){newGame();startBrief(+i);startPlay();G.cine=null;
        const want=Abilities.SPOTS[i].filter(s=>s.k!=='dark').length,got=G.ab.spots.filter(s=>s.k!=='dark').length;out.push([i,want,got]);}return out;});
      console.log('spots',JSON.stringify(sp));ok(sp.every(([i,a,b])=>a===b),'every ability hook placed');
      const kinds=await p.evaluate(()=>{const k=new Set();for(const i in Abilities.SPOTS)for(const s of Abilities.SPOTS[i])k.add(s.k);return[...k].join();});
      ok(['web','door','wax','rune','dark','hang'].every(x=>kinds.includes(x)),'hooks for scorch, lantern and roar');
      // screenshot: lantern in the dark cellar, a webbed cache and the cage
      await p.evaluate(()=>{newGame();startBrief(0);startPlay();G.cine=null;G.grace=99;G.ash.on=true;Abilities.unlock('lantern');G.active='ash';
        G.ash.x=3*T+16;G.ash.y=18*T+16;G.wren.x=2*T+16;G.wren.y=18*T;Abilities.use('lantern');for(let i=0;i<3;i++)update(1/60);V.dbgZoom=2;});
      await p.waitForTimeout(300);await p.screenshot({path:OUT+'/abil_lantern_d.png'});
      await p.evaluate(()=>{G.ash.x=20*T+16;G.ash.y=17*T+16;G.wren.x=19*T;G.wren.y=17*T;Abilities.unlock('roar');run.talents.push('scorch');for(let i=0;i<3;i++)update(1/60);});
      await p.waitForTimeout(300);await p.screenshot({path:OUT+'/abil_web_d.png'});
      await p.evaluate(()=>{G.ash.x=17*T+16;G.ash.y=7*T+16;G.wren.x=16*T;G.wren.y=7*T;for(let i=0;i<3;i++)update(1/60);});
      await p.waitForTimeout(300);await p.screenshot({path:OUT+'/abil_cage_d.png'});
    } else {
      const r=await p.evaluate(()=>{newGame();startBrief(0);startPlay();G.cine=null;G.grace=99;G.ash.on=true;Abilities.unlock('lantern');Abilities.unlock('roar');
        run.npc.absel='lantern';G.active='ash';for(let i=0;i<3;i++)update(1/60);Abilities.touchUi();
        const act=document.querySelector('#btns [data-act="act"] span').textContent,ring=document.querySelector('.abring');
        return{act,ring:!!ring&&ring.style.display!=='none'};});
      console.log(JSON.stringify(r));ok(r.act==='LANTERN','touch: ACT shows the selected ability');ok(r.ring,'touch: one ring button to cycle');
      await p.tap('.abring');const sel=await p.evaluate(()=>Abilities.selected());ok(sel==='roar','touch: ring cycles');
      await p.evaluate(()=>{V.dbgZoom=1.5;Abilities.use('roar');for(let i=0;i<4;i++)update(1/60);});await p.waitForTimeout(250);
      await p.screenshot({path:OUT+'/abil_touch_p.png'});
    }
    await ctx.close();
  }
  await b.close();
  for(const e of errs)console.log(e);
  ok(!errs.length,'no page errors');
  console.log(fails.length?'FAILURES '+fails.length:'ALL OK');process.exit(fails.length?1:0);
})();
