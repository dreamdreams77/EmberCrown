// Phase 3: the illustrated title / briefing / victory / defeat screens show the Ember art, load their images, and vanish with the Ember art toggle.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const bad=[];
  const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{
    const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};
    const bg=(sel,pseudo)=>{const e=document.querySelector(sel);return e?getComputedStyle(e,pseudo||null).backgroundImage:''};
    settings.ember=true;EM.applyUI();
    toTitle();await w(200);o.title=bg('.screen.title');
    newGame();startBrief(0);await w(200);o.brief=bg('.screen.brief .bleft','::before');
    newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.gems=1;finishLevel();await w(900);o.win=bg('.screen.win','::after');
    newGame();startBrief(0);startPlay();G.cine=null;G.god=false;G.hp=0;G.defeat='down';setMode('lose');await w(1300);o.lose=bg('.screen.lose','::after');
    settings.ember=false;EM.applyUI();toTitle();await w(200);o.titleOff=bg('.screen.title');
    return o;});
  const ok=/art_title/.test(r.title)&&/art_brief_ashfall/.test(r.brief)&&/art_victory/.test(r.win)&&/art_defeat/.test(r.lose)&&!/art_title/.test(r.titleOff);
  console.log(JSON.stringify(r),'bad responses:',bad.length);
  if(!ok||errs.length||bad.length){console.log('FAIL',errs.slice(0,3),bad.slice(0,3));process.exit(1);}
  await b.close();console.log('ok');
})();
