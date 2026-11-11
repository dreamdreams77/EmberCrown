/* The Rookery: reach it through the normal flow, walk it with the keyboard and with touch (drag the stick,
   tap to walk, hold ACT), talk, drill, and leave for the briefing. Desktop 900x560 and phone landscape 740x360. */
const {chromium}=require('playwright');
const OUT=process.env.EC_OUT||'.';
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
async function toHub(p,stage){
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  await p.evaluate(st=>{newGame();for(let i=0;i<st;i++){startBrief(i);startPlay();G.cine=null;finishLevel();continueFromWin();if(i<st-1)perks[i+1]=0;}},stage);
  await p.waitForTimeout(200);
}
const pos=p=>p.evaluate(()=>({x:G.wren.x,y:G.wren.y,talk:!!G.talk,who:G.talk&&G.talk.npc.id,mode,hub:!!(G&&G.d.hub)}));
async function walkKeys(p,tx,ty){ // follow the hub's own tile path, steering with real key presses
  const path=await p.evaluate(([x,y])=>{const W=G.wren,sx=Math.floor(W.x/T),sy=Math.floor(W.y/T);
    const open=(a,b)=>!blocked(a*T+16,b*T+16,10),prev=new Map(),q=[[sx,sy]];prev.set(sx+sy*256,-1);
    const gx=Math.floor(x/T),gy=Math.floor(y/T);let best=[sx,sy],bd=1e9;
    while(q.length){const [a,b]=q.shift(),d=Math.hypot(a-gx,b-gy);if(d<bd){bd=d;best=[a,b];}if(!d)break;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=a+dx+(b+dy)*256;if(prev.has(k)||!open(a+dx,b+dy))continue;prev.set(k,a+b*256);q.push([a+dx,b+dy]);}}
    const out=[];let k=best[0]+best[1]*256;while(k!==-1){out.unshift([(k%256)*T+16,Math.floor(k/256)*T+16]);k=prev.get(k);}return out;},[tx,ty]);
  for(const [wx,wy] of path){
    for(let n=0;n<40;n++){
      const s=await pos(p);const dx=wx-s.x,dy=wy-s.y;if(Math.hypot(dx,dy)<9)break;
      const ks=[];if(dx>5)ks.push('d');if(dx<-5)ks.push('a');if(dy>5)ks.push('s');if(dy<-5)ks.push('w');
      for(const k of ks)await p.keyboard.down(k);await p.waitForTimeout(70);for(const k of ks)await p.keyboard.up(k);
    }
  }
  const e=await pos(p);if(process.env.EC_DBG)console.log('walk end',Math.round(e.x),Math.round(e.y),'goal',tx,ty,'talk',e.talk,e.mode);
}
async function holdE(p,ms){await p.keyboard.down('e');await p.waitForTimeout(ms);await p.keyboard.up('e');await p.waitForTimeout(80);}
(async()=>{
  const b=await chromium.launch();
  /* ---------------- desktop, keyboard ---------------- */
  {
    const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
    const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
    // the real flow: win, then the Back Stairs by keyboard, then the Rookery
    await p.evaluate(()=>{newGame();startBrief(0);startPlay();G.cine=null;finishLevel();continueFromWin();});
    await p.waitForTimeout(300);await p.keyboard.press('1');await p.waitForTimeout(900);
    let s=await pos(p);ok(s.mode==='play'&&s.hub,'Back Stairs choice leads into the Rookery');
    ok(await p.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).run.stage==='hub'),'save records the Rookery stage');
    await p.screenshot({path:OUT+'/hub_desktop.png'});
    // walk to Maud and hold E
    const m=await p.evaluate(()=>{const n=G.nq.npcs.find(n=>n.id==='maud');return[n.px,n.py+20];});
    await walkKeys(p,m[0],m[1]);await holdE(p,500);
    s=await pos(p);ok(s.talk&&s.who==='maud','keyboard walk + hold E opens Maud');
    await p.screenshot({path:OUT+'/hub_talk.png'});
    const a0=await p.evaluate(()=>Hub.aff('maud'));
    const idx=await p.evaluate(()=>[...document.querySelectorAll('#npcdlg .ch button, .npcdlg .ch button, .ch button')].findIndex(b=>/forge/i.test(b.textContent)));
    for(let i=0;i<idx;i++)await p.keyboard.press('ArrowDown');
    await p.keyboard.press('Enter');await p.waitForTimeout(150);
    ok(await p.evaluate(()=>Hub.aff('maud'))===a0+1,'a kind word raises Maud\'s affinity');
    await p.keyboard.press('Escape');await p.waitForTimeout(100);
    // drill on a dummy with Space
    const d=await p.evaluate(()=>{const o=G.nq.objs.find(o=>o.kind==='dummy');return[o.px+30,o.py];});
    await walkKeys(p,d[0],d[1]);
    const xp0=await p.evaluate(()=>run.mastery.xp);
    for(let i=0;i<6;i++){await p.evaluate(()=>{const o=G.nq.objs.find(o=>o.kind==='dummy');G.wren.face=Math.atan2(o.py-G.wren.y,o.px-G.wren.x);mouse.world={x:o.px,y:o.py};});await p.keyboard.press(' ');await p.waitForTimeout(260);}
    ok(await p.evaluate(()=>run.mastery.xp)>xp0,'striking a training dummy grants mastery XP');
    // library wall
    const L=await p.evaluate(()=>{const o=G.nq.objs.find(o=>o.use==='library');return[o.px,o.py+30];});
    await walkKeys(p,L[0],L[1]);await holdE(p,500);
    ok(await p.evaluate(()=>G.talk&&G.talk.npc.name==='The Library Wall'),'library wall opens as a readable list');
    await p.screenshot({path:OUT+'/hub_library.png'});
    await p.keyboard.press('Escape');
    // the door to the next mission
    const D=await p.evaluate(()=>{const o=G.nq.objs.find(o=>o.use==='door');return[o.px,o.py-26];});
    await walkKeys(p,D[0],D[1]);await holdE(p,900);
    ok(await p.evaluate(()=>mode==='brief'&&lvl===1),'the door leads to the next briefing');
    ok(await p.evaluate(()=>/From the Rookery|Rookery/.test(document.body.innerText)),'briefing offers the Rookery');
    console.log(errs.join('\n')||'desktop: no page errors');
    await p.close();
  }
  /* ---------------- phone, touch ---------------- */
  {
    const ctx=await b.newContext({viewport:{width:740,height:360},hasTouch:true,isMobile:true});
    const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
    const cdp=await ctx.newCDPSession(p);
    const touchEv=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y])=>({x,y}))});
    await toHub(p,1);
    await p.evaluate(()=>pickPerk(1));await p.waitForTimeout(900);
    ok(await p.evaluate(()=>!!(G&&G.d.hub)),'phone: in the Rookery');
    await touchEv('touchStart',[[60,300]]);await touchEv('touchEnd',[]);
    // drag the stick to walk
    const s0=await pos(p);
    const z=await p.evaluate(()=>{const r=document.getElementById('joyzone').getBoundingClientRect();return[r.left+r.width*.4,r.top+r.height*.6];});
    await touchEv('touchStart',[z]);for(let i=1;i<=5;i++){await touchEv('touchMove',[[z[0]+i*10,z[1]]]);await p.waitForTimeout(40);}
    await p.waitForTimeout(500);await touchEv('touchEnd',[]);
    const s1=await pos(p);ok(s1.x>s0.x+20,'phone: dragging the stick walks Shiloh ('+Math.round(s1.x-s0.x)+'px)');
    // tap on Corvin: walk there and talk
    const sc=await p.evaluate(()=>{const n=G.nq.npcs.find(n=>n.id==='corvin');const s=worldToScreen(n.px,n.py);const r=cv.getBoundingClientRect();return[s.x+r.left,s.y+r.top];});
    await touchEv('touchStart',[sc]);await touchEv('touchEnd',[]);
    let talk=false;for(let i=0;i<40&&!talk;i++){await p.waitForTimeout(150);talk=(await pos(p)).talk;}
    ok(talk,'phone: tap a person to walk over and talk');
    await p.screenshot({path:OUT+'/hub_phone_talk.png'});
    await p.waitForTimeout(400);
    // tap a choice
    const bt=await p.evaluate(()=>{const b=[...document.querySelectorAll('.ch button')].pop();const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});
    await touchEv('touchStart',[bt]);await touchEv('touchEnd',[]);await p.waitForTimeout(200);
    ok(!(await pos(p)).talk,'phone: tapping Leave closes the conversation');
    // hold ACT next to the perch
    await p.evaluate(()=>{const o=G.nq.objs.find(o=>o.use==='perch');G.wren.x=o.px;G.wren.y=o.py+28;});
    await p.waitForTimeout(100);
    const ab=await p.evaluate(()=>{const r=document.querySelector('#btns [data-act="act"]').getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});
    await touchEv('touchStart',[ab]);await p.waitForTimeout(350);if(process.env.EC_DBG)console.log(await p.evaluate(()=>JSON.stringify({act:touch.act,hold:G.hold,need:G.needRel,pr:G.prompt&&G.prompt.label,talk:G.talk&&G.talk.npc.name,wx:G.wren.x|0,wy:G.wren.y|0,active:G.active})));await p.waitForTimeout(350);await touchEv('touchEnd',[]);await p.waitForTimeout(100);if(process.env.EC_DBG)console.log(await p.evaluate(()=>mode+' '+(G.talk&&G.talk.npc.name)+' '+document.activeElement.tagName));
    ok(await p.evaluate(()=>G.talk&&/Perch/.test(G.talk.npc.name)),'phone: hold ACT uses Ashling\'s perch');
    await p.screenshot({path:OUT+'/hub_phone_perch.png'});
    await p.evaluate(()=>NPC.closeTalk());
    await p.evaluate(()=>{G.wren.x=14*T+16;G.wren.y=12*T+16;});await p.waitForTimeout(300);
    await p.screenshot({path:OUT+'/hub_phone.png'});
    console.log(errs.join('\n')||'phone: no page errors');
  }
  await b.close();
  console.log(fails?fails+' checks FAILED':'all hub checks passed');
  process.exit(fails?1:0);
})();
