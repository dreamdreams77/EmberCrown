/* Mission mechanics A (js/mis_a.js): Ashfall Keep, Gallowmere, the Drowned Spire, Thornwick Abbey.
   Drives each mechanic through the __ec hooks and the global engine functions, then completes every mission. */
const {chromium}=require('playwright');
const OUT=process.env.EC_OUT||'.';
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  await p.evaluate(()=>{
    window.T_=(L)=>{newGame();startBrief(L);startPlay();G.cine=null;G.grace=99;G.iris=null;for(const k in keys)keys[k]=false;return G;};
    window.at=(c,x,y)=>{c.x=x*32+16;c.y=y*32+16;c.kx=c.ky=0;};
    window.adv=(n,dt)=>{for(let i=0;i<n;i++)update(dt||1/60);};
    window.hold=(c,secs)=>{keys.e=true;adv(Math.ceil(secs*60));keys.e=false;adv(2);};
    window.tile=c=>[Math.floor(c.x/32),Math.floor(c.y/32)];
    window.res={};window.ok=(n,v)=>{const G=__ec.G;res[n]=v?'ok':'FAIL '+__ec.mode+' hp'+G.hp+' a'+G.alert.toFixed(2);};
  });
  // ---------------- Ashfall Keep ----------------
  const a=await p.evaluate(()=>{
    const G=T_(0),M=G.mis;ok('A.mech',!!M&&M.stairs.length===3&&G.guards.some(g=>g.mname==='Jailer'));
    // coal chute takes Shiloh into the cellar
    at(G.wren,4,1);hold(G.wren,.8);ok('A.chute',tile(G.wren)[1]===17);
    // a rattle plate trips when walked over, not when sneaked over
    const p0=M.plates.find(q=>q.kind==='rattle');at(G.wren,p0.x-1,p0.y);G.alert=0;keys.d=true;adv(25);keys.d=false;ok('A.rattle',p0.cd>0);
    G.alert=0;at(G.wren,p0.x-1,p0.y);p0.cd=0;p0.on=false;adv(200);keys.shift=true;keys.d=true;adv(45);keys.d=keys.shift=false;ok('A.rattleSneak',p0.cd===0);
    // rotten boards: running drops Shiloh into the cellar, sneaking does not
    at(G.wren,12,3);keys.shift=true;keys.d=true;adv(40);keys.d=keys.shift=false;ok('A.rotSneak',tile(G.wren)[1]<5);
    at(G.wren,12,2);keys.d=true;adv(40);keys.d=false;ok('A.rotFall',tile(G.wren)[1]>=16);
    // the Ossuary trial: fail on a dart, retry, win
    const hp0=G.hp;at(G.wren,15,19);adv(2);at(G.wren,16,19);adv(3);ok('A.chStart',M.ch.st==='run');
    at(G.wren,17,17);adv(2);at(G.wren,17,18);adv(3);ok('A.chDart',M.ch.st==='fail'&&G.hp<hp0);
    at(G.wren,14,19);adv(3);ok('A.chReset',M.ch.st==='idle');G.hp=G.maxHp;G.inv=0;
    at(G.wren,16,19);adv(3);at(G.wren,23,18);adv(2);hold(G.wren,1.3);ok('A.chWin',M.ch.st==='done'&&__ec.run.items.includes('ashcape'));
    // the sapper's cache is hidden until you are close
    const sc=M.caches.find(q=>q.id==='sapper');const s0=G.secretsFound;ok('A.hidden',!sc.seen);
    at(G.wren,2,20);adv(3);ok('A.found',sc.seen);at(G.wren,1,19);const sm=G.gad.smoke;hold(G.wren,1.4);ok('A.secret',sc.open&&G.secretsFound===s0+1&&G.gad.smoke===sm+2);
    // take the egg: the yard portcullis drops
    at(G.wren,22,1);const egg=G.items.find(i=>i.type==='O');completeTarget({kind:'item',ref:egg});adv(2);
    ok('A.yardShut',solidTile(5,8)&&G.ash.on);
    // Shiloh cannot use the drain, Ashling can, and he raises the gate from the yard side
    at(G.wren,8,7);ok('A.drainShiloh',blocked(8*32+16,8*32+16,8));
    G.active='ash';at(G.ash,8,7);at(G.wren,7,7);keys.s=true;adv(40);keys.s=false;ok('A.drainAsh',tile(G.ash)[1]>=9);
    at(G.ash,9,10);adv(2);const tg=MisA.target(G.ash,'ash');keys.e=true;adv(60);keys.e=false;adv(2);ok('A.ashWinch',!!tg&&!solidTile(5,8));
    return res;});
  console.log('ashfall',JSON.stringify(a));
  await p.evaluate(()=>{V.dbgZoom=1.6;const G=T_(0);at(G.wren,13,18);G.ash.on=true;at(G.ash,12,19);G.time=3;});await p.waitForTimeout(250);
  await p.screenshot({path:OUT+'/misa_ashfall_cellar.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,16,19);G.mis.plates.forEach(q=>q.rev=true);at(G.ash,15,18);});await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'/misa_ashfall_ossuary.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,12,2);at(G.ash,6,9);G.mis.gates.yard.open=false;G.mis.gates.yard.anim=0;});await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'/misa_ashfall_rot.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,6,10);at(G.ash,8,8);});await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'/misa_ashfall_yard.png'});

  // ---------------- Gallowmere ----------------
  const g=await p.evaluate(()=>{
    const G=T_(1),M=G.mis;const stw=M.dis.steward;ok('G.mech',!!M.dis&&!!stw&&M.drops.length===1);
    // servants' doors stay shut without livery
    at(G.wren,13,4);ok('G.doorShut',solidTile(13,5)&&!(findTarget(G.wren)||{}).mk);
    // put on the livery in the kitchen
    at(G.wren,5,8);const lt=findTarget(G.wren);hold(G.wren,1.3);ok('G.livery',lt&&lt.mk==='livery'&&M.dis.on);
    // walking (sneak) in plain view of the study guard: no suspicion
    G.grace=0;G.graceRamp=0;G.alert=0;const sg=G.guards[1];sg.stun=0;
    for(const q of G.guards)if(q!==sg)q.stun=99;
    at(sg,19,2);sg.wp=[[sg.x,sg.y]];sg.i=0;sg.face=0;at(G.wren,21,2);keys.shift=true;adv(60);keys.shift=false;ok('G.walkUnseen',G.alert<0.02&&M.dis.on);
    // servants' door opens for livery
    at(G.wren,13,4);const sd=findTarget(G.wren);hold(G.wren,.6);ok('G.servDoor',sd&&sd.mk==='sdoor'&&!solidTile(13,5));
    // running in view blows it
    at(G.wren,21,3);keys.s=true;adv(8);keys.s=false;keys.w=true;adv(8);keys.w=false;keys.s=true;adv(8);keys.w=true;keys.s=false;adv(8);keys.w=false;
    for(let i=0;i<4&&M.dis.on;i++){keys.d=true;adv(10);keys.d=false;keys.a=true;adv(10);keys.a=false;}
    ok('G.runBlown',!M.dis.on);
    // second livery, then the steward sees through it
    G.alert=0;at(G.wren,5,8);hold(G.wren,1.3);ok('G.livery2',M.dis.on&&M.dis.uses===0);
    stw.stun=0;at(stw,9,2);stw.wp=[[stw.x,stw.y]];stw.i=0;at(G.wren,10,2);adv(3);ok('G.steward',!M.dis.on);
    for(const q of G.guards)q.stun=0;G.grace=99;G.alert=0;
    // the chandelier: cut the rope, guards under it are flattened
    const vic=G.guards[0];at(vic,11,3);vic.wp=[[vic.x,vic.y]];vic.i=0;vic.stun=0;at(G.wren,6,2);hold(G.wren,1);adv(45);
    ok('G.chandelier',M.drops[0].st==='down'&&vic.stun>3&&G.chand.length===0);
    // lamp oil in the cellar: Ashling lights it, a guard walking through is scorched
    G.ash.on=true;G.active='ash';at(G.ash,12,11);G.ash.face=0;const og=G.guards.find(q=>q.wp[0][1]===12*32+16)||G.guards[4];
    og.stun=0;at(og,19,10);og.wp=[[og.x,og.y],[13*32+16,og.y]];og.i=1;og.lure=null;og.ret=false;keys[' ']=true;adv(30);keys[' ']=false;
    ok('G.oilLit',M.oil[0].st==='burn');og.stun=0;og.lure=null;og.ret=false;og.search=null;at(og,15,10);at(G.ash,2,13);G.active='wren';adv(10);ok('G.oilStun',M.oil[0].hit.size>0);
    // the dumbwaiter: Shiloh braces, Ashling drops down the shaft; letting go shuts it
    G.active='wren';at(G.wren,21,8);at(G.ash,23,8);hold(G.wren,1);ok('G.brace',M.ashPass.has(23+9*256));
    G.active='ash';keys.s=true;adv(40);keys.s=false;ok('G.shaft',tile(G.ash)[1]>=10);
    G.active='wren';keys.w=true;adv(30);keys.w=false;adv(30);ok('G.release',!M.ashPass.has(23+9*256));
    // the counting room: fire shows the wire, a trapped plate fails the trial
    for(const q of G.guards)q.stun=99;G.alert=0;
    at(G.wren,25,2);adv(3);ok('G.chStart',M.ch.st==='run');
    G.active='ash';at(G.ash,25,1);G.ash.face=0.25;keys[' ']=true;adv(60);keys[' ']=false;ok('G.reveal',M.plates.some(q=>q.rev));
    G.active='wren';at(G.wren,27,2);adv(3);ok('G.chFail',M.ch.st==='fail');
    at(G.wren,23,2);adv(3);at(G.wren,25,2);adv(3);
    for(const [x,y] of [[26,2],[26,1],[27,1],[28,1],[28,2],[29,2],[29,3],[30,3],[31,3]]){at(G.wren,x,y);adv(2);}
    hold(G.wren,1.3);ok('G.chWin',M.ch.st==='done'&&__ec.run.items.includes('clasp'));
    // the strongbox behind the portrait
    const pc=M.caches.find(q=>q.id==='portrait'),s0=G.secretsFound;at(G.wren,12,7);adv(3);ok('G.portraitSeen',pc.seen);at(G.wren,12,6);hold(G.wren,1.4);
    ok('G.secret',pc.open&&G.secretsFound===s0+1);
    // kitchen steam blocks sight
    let puffed=false;for(let i=0;i<400&&!puffed;i++){adv(1);puffed=G.smoke.some(s=>s.steam);}ok('G.steam',puffed);
    return res;});
  console.log('gallowmere',JSON.stringify(g));
  await p.evaluate(()=>{const G=T_(1);V.dbgZoom=1.6;at(G.wren,6,8);G.mis.dis.on=true;G.ash.on=true;at(G.ash,4,7);G.time=2;camUpdate(0,true);});await p.waitForTimeout(250);
  await p.screenshot({path:OUT+'/misa_gallow_kitchen.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,10,2);G.mis.drops[0].st='down';G.chand=[];camUpdate(0,true);});await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'/misa_gallow_feast.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,25,2);G.mis.plates.forEach((q,k)=>q.rev=k<3);G.mis.oil[0].st='burn';G.mis.oil[0].t=99;camUpdate(0,true);});await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'/misa_gallow_counting.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,15,12);camUpdate(0,true);});await p.waitForTimeout(200);
  await p.screenshot({path:OUT+'/misa_gallow_oil.png'});

  // ---------------- every mission: loads with its mechanics and can be completed ----------------
  const comp=await p.evaluate(async()=>{
    const out={};
    for(let L=0;L<7;L++){
      const G=T_(L);adv(30);
      for(const it of G.items)if('OPBLHC'.includes(it.type))it.done=true;if(G.boss)G.boss.dead=true;if(G.host){G.host.on=true;}
      const A=G.flight?G.ash:G.wren;G.active=G.flight?'ash':'wren';A.x=G.exit.x;A.y=G.exit.y;if(G.host){G.host.x=A.x;G.host.y=A.y;}
      adv(20);
      out[L]=(LEVELS[L].mech?'mech ':'')+__ec.mode+(G.cine?':cine':'');
      ok('done'+L,__ec.mode==='choice'||(G.cine&&G.cine.kind==='exit')||__ec.mode==='win'||!!G.cine);
    }
    return out;});
  console.log('complete',JSON.stringify(comp));
  const r=await p.evaluate(()=>res);
  const bad=Object.entries(r).filter(([k,v])=>v!=='ok').map(([k])=>k);
  console.log(bad.length?'FAIL checks: '+bad.join(' '):'all mechanic checks passed');
  console.log(errs.length?[...new Set(errs)].slice(0,10).join('\n'):'no errors');
  await b.close();
})();
