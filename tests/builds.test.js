/* Equipment builds (js/items.js): five sets with 2/3-piece bonuses and trade-offs, ten new items with an effect each,
   unique pieces kept out of shops, `look` fields drawn on Shiloh and Ashling, the Journal gear tab's Builds panel,
   and saves that keep a worn set. */
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
        const o={},near=(a,b)=>Math.abs(a-b)<1e-6;
        newGame();
        const NEW=['phantomneedle','phantomlocket','duelsabre','duelcoat','wardenmail','drakelance','drakebarding','alchsatchel','alchapron','retortcaps'];
        o.newItems=NEW.every(id=>itemById(id)&&Object.keys(itemById(id).b).length>0);
        o.allEffect=ITEMS.every(i=>Object.keys(i.b).length>0&&Object.keys(i.b).every(k=>BONUS_FMT[k]));
        o.sets=Object.keys(SETS).join()==='phantom,duellist,warden,dragon,alchemist'&&Object.values(SETS).every(S=>S.pieces.every(id=>itemById(id)));
        o.trades=Object.values(SETS).every(S=>S.tiers.some(t=>Object.values(t[1]).some(v=>v<0)));
        // phantom: none, two, three pieces
        const base=equipBonus('shade'),bdmg=equipBonus('dmg');
        for(const id of ['kesthood','phantomneedle'])grantItem(id,true);
        run.equipped.cloak='kesthood';run.equipped.blade='phantomneedle';
        o.p2=setCount('phantom')===2&&near(equipBonus('shade'),base+.16+.1)&&near(equipBonus('dmg'),bdmg);
        grantItem('phantomlocket',true);run.equipped.charm='phantomlocket';
        o.p3=setCount('phantom')===3&&near(equipBonus('dmg'),bdmg-.5)&&near(equipBonus('mend'),.2);
        // duellist: parry window and the price in sight
        run.equipped={};grantItem('duelsabre',true);grantItem('duelcoat',true);run.equipped.blade='duelsabre';run.equipped.cloak='duelcoat';
        o.duel=near(equipBonus('parry'),.13)&&equipBonus('sneak')<0;
        // dragon-knight across both heroes: ability cooldowns shorter
        run.equipped={};grantItem('drakelance',true);grantItem('drakebarding',true);run.equipped.blade='drakelance';run.equipped.gear='drakebarding';
        o.dragon=setCount('dragon')===2&&near(equipBonus('abcd'),.3)&&equipBonus('shade')<0&&near(equipBonus('glide'),40);
        // warden: slower roll is a real cost
        run.equipped={};for(const id of ['wardenbreaker','wardenmail','hearthstone'])grantItem(id,true);Object.assign(run.equipped,{blade:'wardenbreaker',cloak:'wardenmail',charm:'hearthstone'});
        o.warden=near(equipBonus('hp'),3)&&equipBonus('rollCd')<0&&equipBonus('sneak')<0;
        // the sheet text for a trade-off reads as a cost
        o.fmt=BONUS_FMT.sneak[1](-.1)==='+10%'&&BONUS_FMT.dmg[1](-.5)==='-0.5'&&BONUS_FMT.rollCd[1](-.15)==='+0.15s';
        // uniques never in the shop
        newGame();let seen=new Set();for(let n=0;n<7;n++){runStage={stage:'brief',next:n};for(const it of shopStock())seen.add(it.id);}
        o.shop=![...seen].some(id=>itemById(id).unique||itemById(id).found)&&[...seen].length>0;
        // a mission start applies set bonuses (alchemist: +smoke, +bell)
        for(const id of ['alchsatchel','alchapron','retortcaps'])grantItem(id,true);Object.assign(run.equipped,{charm:'alchsatchel',cloak:'alchapron',gear:'retortcaps'});
        startBrief(0);startPlay();G.cine=null;o.alch=G.gad.smoke>=1+1+2&&G.gad.bell>=1+1;
        // saves keep it
        writeSave('brief',1);const sv=lsGet(SAVE_KEY);newGame();lsSet(SAVE_KEY,sv);saved=sv;continueGame();o.saved=setCount('alchemist')===3;
        return o;});
      console.log(JSON.stringify(r));for(const k in r)ok(r[k],'builds: '+k);
      // the Journal gear tab shows the sets
      await p.evaluate(()=>{for(const id of ['duelsabre','duelcoat'])grantItem(id,true);Object.assign(run.equipped,{blade:'duelsabre',cloak:'duelcoat'});startBrief(1);startPlay();G.cine=null;UI.openJournal('gear');});
      await p.waitForTimeout(300);
      const txt=await p.evaluate(()=>document.querySelector('.modal')?document.querySelector('.modal').innerText:'');
      ok(/Builds/.test(txt)&&/Duellist/.test(txt)&&/Dragon-Knight/.test(txt)&&/techniques/i.test(txt),'journal gear tab lists sets, techniques and abilities');
      await p.evaluate(()=>{const b=document.querySelector('.modal .jbody');if(b)b.scrollTop=b.scrollHeight;});await p.waitForTimeout(150);
      await p.screenshot({path:OUT+'/builds_journal_d.png'});
      // Shiloh and Ashling wear the new looks
      await p.evaluate(()=>{const m=document.querySelector('.modal');if(m)m.click();});
      await p.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>m.remove());if(mode==='pause')pauseGame(false);grantItem('drakebarding',true);run.equipped.gear='drakebarding';G.ash.on=true;
        G.ash.x=G.wren.x+40;G.ash.y=G.wren.y;for(let i=0;i<4;i++)update(1/60);G.toasts=[];G.msgT=0;V.dbgZoom=3;});
      await p.waitForTimeout(300);await p.screenshot({path:OUT+'/builds_look_d.png'});
    } else {
      await p.evaluate(()=>{newGame();for(const id of ['wardenmail','phantomneedle','alchsatchel'])grantItem(id,true);Object.assign(run.equipped,{cloak:'wardenmail',blade:'phantomneedle',charm:'alchsatchel'});
        startBrief(0);startPlay();G.cine=null;UI.openJournal('gear');});
      await p.waitForTimeout(300);await p.screenshot({path:OUT+'/builds_journal_p.png'});
    }
    await ctx.close();
  }
  await b.close();
  for(const e of errs)console.log(e);
  ok(!errs.length,'no page errors');
  console.log(fails.length?'FAILURES '+fails.length:'ALL OK');process.exit(fails.length?1:0);
})();
