/* Quest chains across missions, Rookery affinity, house reputation consequences and save compatibility. */
const {chromium}=require('playwright');
const OUT=process.env.EC_OUT||'.';
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  await p.evaluate(()=>{
    window.T_={
      // win the current mission and walk through the Back Stairs into the Rookery
      win(){G.cine=null;finishLevel();continueFromWin();pickPerk(1);return !!(G&&G.d.hub);},
      // from the Rookery: take the door and start the mission
      go(){Hub.leave();startPlay();G.cine=null;return lvl;},
      talk(id,...picks){const n=G.nq.npcs.find(n=>n.id===id);if(!n)return'absent';NPC.openTalk(n);const seen=[G.talk.node];
        for(const re of picks){const btn=[...document.querySelectorAll('#npcdlg .ch button')].find(b=>new RegExp(re,'i').test(b.textContent));if(!btn){NPC.closeTalk();return'nochoice:'+re+' at '+seen.join('>');}btn.click();if(G.talk)seen.push(G.talk.node);}
        NPC.closeTalk();return seen.join('>');},
      obj(id){const o=G.nq.objs.find(o=>o.id===id);if(!o)return false;if(o.kind==='burn'){o.done=true;NPC.applyFx(o.fx);}else NPC.activate({kind:'qobj',ref:o});return true;},
      ch(id){const c=run.npc.chains[id];return c?c.st+':'+c.s:'none';}
    };
  });
  /* ---------- the full good run: four chains, completed across six missions ---------- */
  const r=await p.evaluate(()=>{
    const L={};newGame();startBrief(0);startPlay();T_.win();
    L.hub1=G.d.next;
    L.needle1=T_.talk('needle','look for it');L.hesper1=T_.talk('hesper','look for it');
    L.c1=[T_.ch('courier'),T_.ch('rookery')].join();
    T_.go();L.m1objs=G.nq.objs.filter(o=>o.chain).map(o=>o.id).join();
    T_.obj('c_satchel');T_.obj('c_moss');L.m1=[T_.ch('courier'),T_.ch('rookery')].join();
    T_.win();
    L.needle2=T_.talk('needle','yours');L.hesper2=T_.talk('hesper','Line the roost');L.odalys2=T_.talk('odalys','wax');
    L.c2=[T_.ch('courier'),T_.ch('rookery'),T_.ch('seal')].join();L.roost1=!!run.npc.flags.roost1;
    T_.go();const dmax=G.dash.max;T_.win();L.dash=dmax;
    L.letter=!!G.nq.objs.find(o=>o.use==='letter'&&!o.done&&NPC.cond(o.show));
    Hub.use(G.nq.objs.find(o=>o.use==='letter'));L.maud3=T_.talk('maud','promise');L.c3=T_.ch('hostage');
    T_.go();T_.obj('c_wick');T_.obj('c_wax');T_.win();
    L.wick=G.nq.npcs.some(n=>n.id==='wick');
    L.needle4=T_.talk('needle');L.odalys4=T_.talk('odalys');
    L.c4=[T_.ch('courier'),T_.ch('seal')].join();L.band=ownsItem('courierband');L.maps=!!run.npc.flags.needle_maps;
    T_.go();L.m4objs=G.nq.objs.filter(o=>o.chain).map(o=>o.id).join();L.carried4=G.hubFx.map(c=>c.k).join();
    T_.obj('c_file');T_.obj('c_die');T_.obj('c_bronze');T_.win();
    L.maud5=T_.talk('maud');L.odalys5=T_.talk('odalys','Keep it');L.hesper5=T_.talk('hesper');
    L.c5=[T_.ch('hostage'),T_.ch('seal'),T_.ch('rookery')].join();L.brood=ownsItem('broodband');L.abil=(run.npc.abil||[]).join();
    const g0=Object.keys(LEVELS[5]).length;T_.go();L.carried5=G.hubFx.map(c=>c.k).join();
    T_.obj('c_ledger');T_.win();
    L.maud6=T_.talk('maud');L.c6=T_.ch('hostage');L.maudsown=ownsItem('maudsown');L.kin=Hub.priceMul('maud');
    L.journal=Quests.journal().filter(q=>q.chain).map(q=>q.state).join();
    return L;});
  console.log(JSON.stringify(r));
  ok(r.hub1===1,'first Rookery visit comes before mission 2');
  ok(r.c1==='active:0,active:0','Needle and Hesper start their chains');
  ok(/c_satchel/.test(r.m1objs)&&/c_moss/.test(r.m1objs),'chain objects appear in Gallowmere');
  ok(r.m1==='active:1,active:1','taking the satchel and the moss advances both chains');
  ok(r.c2==='active:2,active:2,active:0'&&r.roost1,'home again: satchel read, roost lined, Odalys starts the seal');
  ok(r.letter&&r.c3==='active:0','the hostage letter appears and Maud starts her chain');
  ok(r.wick,'Wick is home after his cell is sprung');
  ok(r.c4==='done:3,active:2'&&r.band&&r.maps,'courier chain pays out: Courier\'s Red Band and marked passages');
  ok(/maps/.test(r.carried4),'marked passages carry into the next mission');
  ok(r.c5==='active:2,done:3,done:3'&&r.brood,'seal kept, Brood Band from Hesper');
  ok(/seal/.test(r.carried5)&&/roost2/.test(r.carried5),'forged order and bronze roost carry into Dunmoor');
  ok(r.c6==='done:3'&&r.maudsown&&r.kin<1,'hostage chain: Maud\'s Own and kin prices');
  ok(r.journal.split(',').filter(s=>s==='done').length===4,'the Journal lists four finished chains');
  /* ---------- failure branches ---------- */
  const f=await p.evaluate(()=>{
    const L={};newGame();startBrief(0);startPlay();T_.win();
    T_.talk('needle','look for it');T_.talk('hesper','look for it');const a0=Hub.aff('needle');
    T_.go();T_.obj('c_moss');T_.win(); // the satchel is left behind
    L.courier=T_.ch('courier');L.needleDrop=Hub.aff('needle')-a0;
    L.news=(run.npc.hub.news||[]).join(' | ');
    const h0=Hub.aff('hesper');L.sell=T_.talk('hesper','Corvin offered');L.rook=T_.ch('rookery');L.hesper=Hub.aff('hesper')-h0;
    L.journal=Quests.journal().filter(q=>q.chain&&q.state==='failed').length;
    return L;});
  console.log(JSON.stringify(f));
  ok(f.courier==='failed:0'&&f.needleDrop<0,'leaving the satchel fails the courier chain and costs Needle\'s trust');
  ok(f.rook==='active:0'&&f.hesper<0,'selling the moss sends the roost chain back a step and cools Hesper');
  ok(f.journal===1,'the failed chain is shown in the Journal');
  /* ---------- affinity unlocks and loses services ---------- */
  const a=await p.evaluate(()=>{
    const L={};newGame();startBrief(0);startPlay();T_.win();
    run.npc.aff.brann=-2;L.cold=T_.talk('brann');
    run.npc.aff.brann=2;L.teach=T_.talk('brann');L.riposte=(run.npc.abil||[]).includes('riposte');
    run.npc.aff.maud=3;const p3=Hub.priceMul('maud');run.npc.aff.maud=-1;const pm=Hub.priceMul('maud');L.prices=[p3,pm];
    run.npc.aff.maud=2;L.gift=T_.talk('maud','put aside');
    run.npc.aff.corvin=-3;T_.go();T_.win();
    L.corvinGone=!G.nq.npcs.some(n=>n.id==='corvin');L.enemy=!!run.npc.flags.corvin_enemy;
    T_.go();L.carried=G.hubFx.map(c=>c.k).join();L.gain=G.gain;
    return L;});
  console.log(JSON.stringify(a));
  ok(a.cold==='cold','a cold trainer refuses to train');
  ok(/teach/.test(a.teach)&&a.riposte,'a trusted trainer teaches the riposte');
  ok(a.prices[0]<1&&a.prices[1]>1,'Maud\'s prices follow her affinity');
  ok(/gift/.test(a.gift),'Maud puts something aside once she trusts you');
  ok(a.corvinGone&&a.enemy&&/enemy/.test(a.carried)&&a.gain>1,'Corvin leaves and sells your description: alert rises faster');
  /* ---------- house reputation ---------- */
  const h=await p.evaluate(()=>{
    const L={};newGame();houses.grell.fear=2;houses.marrow.fear=1;
    startBrief(1);startPlay();L.barred=!!G.barred;L.price=NPC.stand('grell');
    startBrief(1);L.brief=/House Grell: Fear/.test(document.body.innerText);
    newGame();startBrief(0);startPlay();T_.win();houses.grell.fear=2;houses.kest.fear=2;Hub.enter(1);
    L.hubSt=G.nq.st;L.blade=G.nq.npcs.some(n=>n.id==='blade');L.envoy=G.nq.npcs.some(n=>n.id==='envoy');
    UI.openJournal('houses');L.journal=/Merchants add 25%/.test(document.body.innerText)&&/who stands with you/.test(document.body.innerText);
    return L;});
  console.log(JSON.stringify(h));
  ok(h.barred,'a frightened house bars a locked door');
  ok(h.brief,'the briefing names the house standing');
  ok(h.hubSt==='fear'&&h.blade&&h.envoy,'a feared Rookery gets an envoy with tribute and a hired blade');
  ok(h.journal,'the Journal shows house effects and the Rookery people');
  await p.screenshot({path:OUT+'/chains_journal.png'});
  /* ---------- saves ---------- */
  await p.evaluate(()=>{UI.closeModal&&UI.closeModal();newGame();startBrief(0);startPlay();T_.win();T_.talk('needle','look for it');run.npc.aff.maud=3;persistRun();});
  await p.reload();await p.waitForTimeout(400);
  const s=await p.evaluate(()=>{continueGame();return{hub:!!(G&&G.d.hub),next:G&&G.d.next,ch:run.npc.chains.courier&&run.npc.chains.courier.st,aff:run.npc.aff.maud};});
  ok(s.hub&&s.next===1&&s.ch==='active'&&s.aff===3,'continue resumes in the Rookery with chains and affinity');
  const old=await p.evaluate(()=>{
    const mk=(v,stage,npc)=>({v,meta:{relics:[],lore:[],best:{},disc:[]},run:{stage,next:2,diff:1,perk:'bribe',houses:{marrow:{favor:1,fear:0,ruin:0},grell:{favor:0,fear:0,ruin:0},ostrander:{favor:0,fear:0,ruin:0},sable:{favor:0,fear:0,ruin:0},kest:{favor:0,fear:0,ruin:0},dunmoor:{favor:0,fear:0,ruin:0}},stats:{gems:3,caught:0,time:100,byLvl:[]},relics:[],lore:[],ranks:{0:'A',1:'B'},secrets:{},talents:[],cinders:50,disc:[],...(npc?{npc}:{})}});
    const out=[];
    for(const s of [mk(2,'brief'),mk(3,'brief',{flags:{}}),mk(3,'hub',{flags:{}})]){
      localStorage.setItem(SAVE_KEY,JSON.stringify(s));loadSave();continueGame();
      out.push(mode+(mode==='play'&&G&&G.d.hub?':hub':'')+':'+lvl);
      if(mode==='brief'){UI.act&&0;Hub.enter(2);out.push('enter:'+(G&&G.d.hub));}
    }
    return out.join(' ');});
  console.log(old);
  ok(/^brief:2 enter:true brief:2 enter:true play:hub/.test(old),'v2 and v3 saves without Rookery fields still load and can visit the Rookery');
  console.log(errs.join('\n')||'no page errors');
  await b.close();
  console.log(fails?fails+' checks FAILED':'all chain checks passed');
  process.exit(fails?1:0);
})();
