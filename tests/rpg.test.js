const {chromium}=require('playwright');
const OUT='/tmp/claude-0/-home-user-EmberCrown/74bad96c-385c-57cf-8015-6816324e22b5/scratchpad/shots/';
const fail=[];const ok=(c,m)=>{if(!c){fail.push(m);console.log('FAIL',m);}else console.log('ok',m);};
(async()=>{
  const b=await chromium.launch();const errs=[];
  // ---------- desktop / keyboard ----------
  let ctx=await b.newContext({viewport:{width:900,height:560}});
  let p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const ev=(f,a)=>p.evaluate(f,a);
  await ev(()=>{__ec.newGame();});
  ok(await ev(()=>equipBonus('dmg')===0&&equipBonus('nothing')===0),'equipBonus defaults to 0');
  ok(await ev(()=>ITEMS.length>=20&&ITEMS.every(i=>i.slot&&i.rar&&RARITY[i.rar]&&Object.keys(i.b).every(k=>BONUS_FMT[k]))),'20+ well-formed items');
  // bonuses reach the game
  const hooks=await ev(()=>{
    ['hearthstone','bridle','tinbell'].forEach(i=>grantItem(i,true));
    __ec.run.equipped.charm='hearthstone';__ec.run.equipped.gear='bridle';
    __ec.startPlay();const G=__ec.G;
    return{hp:G.maxHp,dash:G.dash.max,bell:G.gad.bell};
  });
  ok(hooks.hp===5&&hooks.dash===2,'hearts and dash charges from gear '+JSON.stringify(hooks));
  const cv=await ev(()=>{__ec.run.equipped.charm='clasp';grantItem('clasp',true);__ec.run.equipped.charm='clasp';return cinderValue(100);});
  ok(cv===115,'cinder bonus applies '+cv);
  // chest + boss rewards
  const rw=await ev(()=>{const n=__ec.run.items.length;const G=__ec.G;G.cine=null;openChest({x:G.wren.x,y:G.wren.y,open:false,p:0});return __ec.run.items.length-n;});
  ok(rw===1,'vault chest grants an item');
  // journal via keyboard in play
  await ev(()=>{__ec.G.cine=null;});
  await p.keyboard.press('j');await p.waitForTimeout(300);
  ok(await ev(()=>__ec.mode==='pause'&&!!document.querySelector('.modal .jr')),'J pauses and opens journal');
  await p.keyboard.press('3');await p.waitForTimeout(100);
  ok(await ev(()=>J.tab==='forge'),'number key switches tab');
  await p.keyboard.press('ArrowLeft');await p.waitForTimeout(100);
  ok(await ev(()=>J.tab==='gear'),'arrow left switches tab');
  await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.waitForTimeout(100);
  ok(await ev(()=>!!document.querySelector('.jbody .kb')),'keyboard cursor visible');
  const before=await ev(()=>JSON.stringify(__ec.run.equipped));
  await p.keyboard.press('Enter');await p.waitForTimeout(150);
  ok(await ev(()=>!!document.querySelector('.modal .jr')),'Enter activates, journal stays');
  await p.screenshot({path:OUT+'rp_gear_kb.png'});
  await p.keyboard.press('Escape');await p.waitForTimeout(150);
  ok(await ev(()=>!document.querySelector('.modal')&&__ec.mode==='pause'),'Esc closes journal');
  await p.keyboard.press('Escape');await p.waitForTimeout(150);
  ok(await ev(()=>__ec.mode==='play'),'second Esc resumes');
  // quests stub
  await ev(()=>{window.Quests={journal:()=>[{id:'q1',title:'The Missing Ledger',desc:'Find it before dawn.',state:'active',house:'grell'},{id:'q2',title:'Old Debts',desc:'Paid.',state:'done',house:'kest'}]};UI.openJournal('quests');});
  ok(await ev(()=>document.querySelector('.jbody').textContent.includes('Missing Ledger')&&document.querySelector('.jbody').textContent.includes('Old Debts')),'quests journal entries render');
  await p.screenshot({path:OUT+'rp_quests.png'});
  await ev(()=>{window.Quests=undefined;UI.openJournal('quests');});
  ok(await ev(()=>!!document.querySelector('.jbody')),'journal safe without Quests');
  // save round trip
  await ev(()=>{__ec.run.mastery.xp=333;writeSave('court',1);});
  const sv=await ev(()=>JSON.parse(localStorage.getItem('embercrown.save.v2')).run);
  ok(sv.items.length>=4&&sv.equipped.charm==='clasp'&&sv.mastery.xp===333,'save holds items, equipped, mastery');
  await ev(()=>{const s=JSON.parse(localStorage.getItem('embercrown.save.v2'));delete s.run.items;delete s.run.equipped;delete s.run.mastery;localStorage.setItem('embercrown.save.v2',JSON.stringify(s));});
  await p.reload();await p.waitForTimeout(500);await p.keyboard.press('Enter');await p.waitForTimeout(400);
  ok(await ev(()=>__ec.run.items.length===0&&__ec.run.mastery.xp===0&&equipBonus('hp')===0),'legacy save loads without gear fields');
  // mission end -> xp
  await ev(()=>{__ec.newGame();__ec.startPlay();const G=__ec.G;G.cine=null;G.st.kills=4;G.st.takedowns=2;G.gotRelics=[];G.gotLore=[];G.choice='return';__ec.finishLevel();});
  await p.waitForTimeout(900);
  const x=await ev(()=>__ec.G.xp);
  ok(x&&x.gain>=100,'xp computed');
  ok(await ev(()=>__ec.run.mastery.xp>=100&&!!document.querySelector('.win .xprow')),'win screen shows mastery xp');
  await p.screenshot({path:OUT+'rp_win.png'});
  ok(await ev(()=>{const s=document.querySelector('#ui .screen');return s.scrollHeight<=s.clientHeight+2;}),'win screen fits at 900x560');
  await ctx.close();
  // ---------- touch phone landscape ----------
  ctx=await b.newContext({viewport:{width:740,height:360},hasTouch:true,isMobile:true});
  p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  await p.evaluate(()=>{__ec.newGame();['shiv','whisperpoint','talons'].forEach(i=>grantItem(i,true));__ec.run.cinders=500;__ec.startPlay();__ec.G.cine=null;});
  await p.waitForTimeout(300);
  await p.tap('#pausebtn');await p.waitForTimeout(400);
  await p.tap('[data-a=journal]');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!!document.querySelector('.modal .jr')),'touch: pause -> journal');
  await p.tap('.jtab[data-a="jt:gear"]');await p.waitForTimeout(200);
  await p.tap('.irow[data-a="eq:whisperpoint"]');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>__ec.run.equipped.blade==='whisperpoint'),'touch: tap equips');
  await p.tap('.jtab[data-a="jt:forge"]');await p.waitForTimeout(200);
  await p.tap('.tal[data-a="buy:quick"]');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>__ec.run.talents.includes('quick')),'touch: tap buys talent');
  await p.screenshot({path:OUT+'rp_touch_forge.png'});
  const tabsOk=await p.evaluate(()=>{const m=document.querySelector('.modal .card').getBoundingClientRect();return m.width<=innerWidth&&m.height<=innerHeight;});
  ok(tabsOk,'touch: journal fits viewport');
  await p.tap('.jx');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!document.querySelector('.modal')),'touch: close button');
  await ctx.close();
  console.log(errs.join('\n')||'no errors');
  console.log(fail.length?'FAIL '+fail.length+' checks':'ALL OK');
  await b.close();
})();
