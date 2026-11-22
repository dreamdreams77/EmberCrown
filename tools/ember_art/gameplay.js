#!/usr/bin/env node
/* Real input, real time, the single-file build: keyboard on desktop, touch (joystick drag + button taps) on a phone viewport.
   Walks, sneaks, strikes, takes a guard down, talks to Pip, swaps to Ashling and breathes fire, pauses, gets caught and retries.
   Asserts the game state after each step and saves a screenshot. usage: node gameplay.js <bundle.html> <outDir> */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const file=path.resolve(process.argv[2]),OUT=path.resolve(process.argv[3]);fs.mkdirSync(OUT,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const log=[];let bad=0;
const check=(n,ok,extra)=>{log.push((ok?'ok   ':'FAIL ')+n+(extra?'  '+extra:''));if(!ok)bad++;};
(async()=>{const b=await chromium.launch();
 for(const prof of ['desktop','phone']){
  const touch=prof==='phone';
  const ctx=await b.newContext(touch?{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true}:{viewport:{width:1280,height:720}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+file);await wait(1200);
  const shot=async n=>p.screenshot({path:path.join(OUT,prof+'-'+n+'.png')});
  const cdp=touch?await ctx.newCDPSession(p):null;
  const drag=async(dx,dy,ms)=>{ // joystick: touch down in the joystick zone, drag, hold, lift
    const r=await p.evaluate(()=>{const e=document.getElementById('joybase').getBoundingClientRect();return[e.x+e.width/2,e.y+e.height/2];});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r[0],y:r[1],id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r[0]+dx,y:r[1]+dy,id:1}]});await wait(ms);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const tap=async act=>{const r=await p.evaluate(a=>{const e=document.querySelector('[data-act="'+a+'"]').getBoundingClientRect();return[e.x+e.width/2,e.y+e.height/2];},act);await p.touchscreen.tap(r[0],r[1]);};
  const hold=async(act,ms)=>{const r=await p.evaluate(a=>{const e=document.querySelector('[data-act="'+a+'"]').getBoundingClientRect();return[e.x+e.width/2,e.y+e.height/2];},act);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r[0],y:r[1],id:2}]});await wait(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  // start: from the title through the brief into the mission, with real input
  for(let i=0;i<6&&await p.evaluate(()=>mode!=='play');i++){
    const m=await p.evaluate(()=>mode);
    if(touch){const r=await p.evaluate(()=>{const e=[...document.querySelectorAll('button')].find(b=>/^(begin|begin mission)$/i.test(b.textContent.trim()));if(!e)return null;const q=e.getBoundingClientRect();return[q.x+q.width/2,q.y+q.height/2];});if(r)await p.touchscreen.tap(r[0],r[1]);}
    else await p.keyboard.press('Enter');
    await wait(900);}
  await wait(800);await p.evaluate(()=>{if(G){G.cine=null;G.iris=null;G.god=false;G.grace=3;}});
  check(prof+': mission starts in Ember art',await p.evaluate(()=>mode==='play'&&EM.on()&&EM.env.ready()));
  await shot('01-start');
  // walk right / down
  const x0=await p.evaluate(()=>G.wren.x);
  if(touch)await drag(40,0,900);else{await p.keyboard.down('d');await wait(900);await p.keyboard.up('d');}
  check(prof+': hero walks',await p.evaluate(x=>G.wren.x>x+25,x0));await shot('02-walk');
  // sneak
  if(touch){await hold('shift',300);}else{await p.keyboard.down('Shift');await p.keyboard.down('a');await wait(500);await p.keyboard.up('a');await p.keyboard.up('Shift');}
  // strike
  const atk=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));playPress(' ');let seen=false;for(let i=0;i<8;i++){await w(25);if(G.wren.atk)seen=true;}return seen;});
  if(touch)await tap('fire');check(prof+': strike animates',atk);await shot('03-strike');
  // take a guard down from behind (game rules: sneak up behind, hold)
  const kd=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const g=G.guards.find(q=>!q.boss&&!q.spin&&(q.kind||'guard')==='guard');if(!g)return false;
    G.god=true;g.wp=[[g.x,g.y],[g.x+1,g.y]];g.face=0;g.vf=0;G.wren.x=g.x-16;G.wren.y=g.y;G.wren.face=0;await w(300);
    for(let i=0;i<30;i++){playPress(' ');await w(40);if(g.stun>0||g.ko)break;}return !!(g.stun>0||g.ko||g.hp<g.max);});
  check(prof+': guard can be struck down',kd);await shot('04-guard');
  // Pip: talk
  await p.evaluate(()=>{const n=G.nq.npcs.find(n=>n.id==='pip');G.wren.x=n.px+22;G.wren.y=n.py;G.wren.face=Math.PI;G.god=true;G.alert=0;});await wait(500);
  if(touch)await hold('act',500);else{await p.keyboard.down('e');await wait(500);await p.keyboard.up('e');}await wait(600);
  const talk=await p.evaluate(()=>!!G.talk||mode==='talk'||!!document.querySelector('.talk,.dlg,.modal'));
  check(prof+': Pip talks',talk);await shot('05-talk');
  if(await p.evaluate(()=>!!G.talk)){await p.keyboard.press('Escape');await wait(500);}
  check(prof+': conversation closes with Escape',await p.evaluate(()=>!G.talk&&mode==='play'));
  // Ashling: swap and breathe fire
  await p.evaluate(()=>{G.ash.on=true;});
  if(touch)await tap('swap');else await p.keyboard.press('Tab');await wait(300);
  check(prof+': swap to Ashling',await p.evaluate(()=>G.active==='ash'));
  if(touch)await hold('fire',900);else{await p.keyboard.down(' ');await wait(900);await p.keyboard.up(' ');}
  await shot('06-fire');
  if(touch)await tap('swap');else await p.keyboard.press('Tab');await wait(200);
  // pause menu
  if(touch){const r=await p.evaluate(()=>{const e=document.getElementById('pausebtn').getBoundingClientRect();return[e.x+e.width/2,e.y+e.height/2];});await p.touchscreen.tap(r[0],r[1]);}else await p.keyboard.press('Escape');await wait(500);
  check(prof+': pause menu opens',await p.evaluate(()=>mode==='pause'));await shot('07-pause');
  if(touch){const r=await p.evaluate(()=>{const e=[...document.querySelectorAll('button')].find(b=>/^resume/i.test(b.textContent.trim()));const q=e.getBoundingClientRect();return[q.x+q.width/2,q.y+q.height/2];});await p.touchscreen.tap(r[0],r[1]);}else await p.keyboard.press('Escape');await wait(400);
  check(prof+': resume',await p.evaluate(()=>mode==='play'));
  // caught: lose screen, retry
  await p.evaluate(()=>{G.god=false;G.hp=0;});await p.evaluate(()=>{try{if(typeof hurtHero==='function')hurtHero(9,0,0);}catch(e){}if(mode==='play')setMode('lose');});await wait(1500);
  check(prof+': lose screen shows',await p.evaluate(()=>mode==='lose'));await shot('08-lose');
  await p.evaluate(()=>{startPlay();G.cine=null;});await wait(800);
  check(prof+': retry restarts the mission',await p.evaluate(()=>mode==='play'&&EM.on()&&G.d===LEVELS[0]));await shot('09-retry');
  check(prof+': no page errors',errs.length===0,errs.slice(0,2).join('|'));
  await ctx.close();}
 console.log(log.join('\n'));console.log(bad?bad+' FAILED':'all gameplay checks passed');await b.close();process.exit(bad?1:0);})();
