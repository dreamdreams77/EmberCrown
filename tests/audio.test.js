/* Procedural audio (js/audio.js): every effect plays without error, footsteps pick the floor, each house has its own
   motif voice, boss fights switch to the boss theme, and the node count stays light. */
const {chromium}=require('playwright');
const fails=[];const ok=(c,m)=>{if(!c){fails.push(m);console.log('FAIL '+m);}else console.log('ok   '+m);};
(async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
  const p=await b.newPage({viewport:{width:900,height:560}});
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const o={};Aud.init();
    // count audio nodes created per second of play to keep it light
    let n=0;const AC=AudioContext.prototype;for(const k of ['createOscillator','createBufferSource']){const f=AC[k];AC[k]=function(){n++;return f.apply(this,arguments);};}
    let bad=[];for(const k in Aud.S){try{Aud.S[k]();}catch(e){bad.push(k);}}o.allSfx=!bad.length;o.bad=bad.join();
    o.newSfx=['parry','glide','land','lantern','scorch','rune','shadow','learn','tick'].every(k=>typeof Aud.S[k]==='function');
    const houses={};
    for(const i of [0,1,3,4,5,6]){newGame();startBrief(i);startPlay();G.cine=null;G.grace=99;
      n=0;for(let f=0;f<60*20;f++)Aud.tick(1/60,0,true);houses[i]=[Aud.state.house,n];}
    o.houses=JSON.stringify(houses);
    o.motifs=[0,1,3,4,5,6].every(i=>Aud.HOUSE[houses[i][0]]);
    o.light=Object.values(houses).every(h=>h[1]<60); // < 3 nodes a second over 20s of exploration
    // floors
    newGame();startBrief(1);startPlay();G.cine=null;o.floor1=Aud.floorNow();newGame();startBrief(4);startPlay();G.cine=null;o.floor4=Aud.floorNow();
    o.floors=o.floor1==='wood'&&o.floor4==='forge';
    // the boss theme takes over while a boss is engaged
    newGame();startBrief(3);startPlay();G.cine=null;G.boss.eng=true;n=0;for(let f=0;f<60*4;f++)Aud.tick(1/60,.5,true);o.boss=Aud.state.bossOn&&n>8;o.bossN=n;
    G.boss.eng=false;Aud.tick(1/60,0,true);o.bossOff=!Aud.state.bossOn;
    return o;});
  console.log(JSON.stringify(r));
  for(const k of ['allSfx','newSfx','motifs','light','floors','boss','bossOff'])ok(r[k],'audio: '+k);
  await b.close();
  for(const e of errs)console.log(e);
  ok(!errs.length,'no page errors');
  console.log(fails.length?'FAILURES '+fails.length:'ALL OK');process.exit(fails.length?1:0);
})();
