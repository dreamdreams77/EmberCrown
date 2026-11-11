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

  // ---------------- The Drowned Spire ----------------
  const sp=await p.evaluate(()=>{
    const G=T_(2),M=G.mis,S=M.air,A=G.ash;ok('S.mech',S.drakes.length===3&&S.ball.length===2&&G.flight);
    for(const g of G.guards)g.stun=999;
    // the gale carries Ashling east
    at(A,4,7);const x0=A.x;adv(60);ok('S.wind',A.x-x0>60);
    // gulls scream: suspicion and a drake comes to look
    G.grace=0;G.graceRamp=0;G.alert=0;const f=S.gulls[0];at(A,9,4);A.y-=14;adv(3);ok('S.gulls',f.st==='fly'&&G.alert>0.05);
    // fog banks hide Ashling from anything further than a tile and a half
    const fb=S.fog[0];ok('S.fog',!los(fb.x-5*32,fb.y,fb.x,fb.y)&&los(fb.x-1*32,fb.y,fb.x,fb.y));
    // a drake spots Ashling, chases and spits fire; Ashling burns it out of the sky
    G.grace=99;G.alert=0;const d=S.drakes[0];d.x=12*32+16;d.y=5*32+16;d.face=0;d.st='patrol';at(A,14,5);G.hp=G.maxHp;G.inv=0;
    let hurt=false;for(let i=0;i<200&&!hurt;i++){adv(1);if(G.hp<G.maxHp)hurt=true;}
    ok('S.drakeChase',d.st==='chase');ok('S.drakeSpit',hurt);
    G.hp=G.maxHp;G.alert=0;at(A,10,5);d.x=A.x+40;d.y=A.y;keys[' ']=true;for(let i=0;i<120;i++){A.face=Math.atan2(d.y-A.y,d.x-A.x);adv(1);}keys[' ']=false;ok('S.drakeDown',d.st==='dead');
    // a ballista crew tracks Ashling and looses a bolt; fire scatters the crew
    G.alert=0;G.hp=G.maxHp;G.inv=0;const b=S.ball[0];for(const q of S.drakes)q.st='dead';at(A,8,5);b.a=Math.atan2(A.y-b.y,A.x-b.x);b.cd=0;
    let teled=false,shot=false;for(let i=0;i<150&&!shot;i++){adv(1);teled=teled||b.tele>0;shot=G.hp<G.maxHp;}
    ok('S.ballista',teled&&shot);G.hp=G.maxHp;
    at(A,4,3);A.face=Math.atan2(b.y-A.y,b.x-A.x);keys[' ']=true;adv(60);keys[' ']=false;ok('S.crew',b.stun>0);
    // the Gale Run: six rings in order
    G.alert=0;for(const r of M.ch.rings){A.x=r[0]*32+16;A.y=r[1]*32+16;adv(3);}
    ok('S.galeRun',M.ch.st==='done'&&__ec.run.items.includes('wavecloak'));
    // the drowned longboat
    const w=M.caches[0],s0=G.secretsFound;at(A,26,13);adv(3);ok('S.wreckSeen',w.seen);at(A,28,13);adv(2);hold(A,1.3);
    ok('S.wreck',w.open&&G.secretsFound===s0+1&&__ec.run.items.includes('collar'));
    return res;});
  console.log('spire',JSON.stringify(Object.fromEntries(Object.entries(sp).filter(([k])=>k[0]==='S'))));
  await p.evaluate(()=>{const G=T_(2);V.dbgZoom=1.4;const S=G.mis.air;at(G.ash,7,6);S.drakes[0].x=10*32;S.drakes[0].y=6*32;S.drakes[0].st='chase';S.drakes[0].tele=.3;S.ball[0].tele=.5;S.ball[0].a=1.2;G.time=4;camUpdate(0,true);});
  await p.waitForTimeout(300);await p.screenshot({path:OUT+'/misa_spire.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.ash,22,10);G.mis.ch.st='run';G.mis.ch.t=8;G.mis.ch.ri=3;camUpdate(0,true);});
  await p.waitForTimeout(300);await p.screenshot({path:OUT+'/misa_spire2.png'});

  // ---------------- Thornwick Abbey ----------------
  const th=await p.evaluate(()=>{
    const G=T_(3),M=G.mis;ok('T.mech',!!M.bells&&M.pitSet.size===10);
    for(const g of G.guards)g.stun=999;
    // the worn slab: invisible from afar, found up close, then a stair into the crypt
    const sl=M.stairs[0],s0=G.secretsFound;at(G.wren,10,12);adv(2);const far=findTarget(G.wren);ok('T.slabHidden',!far||far.ref!==sl);
    at(G.wren,13,12);hold(G.wren,1.6);ok('T.slabFound',sl.found&&G.secretsFound===s0+1);
    hold(G.wren,.8);ok('T.crypt',tile(G.wren)[1]>=16);
    // the inscription and the bells: a wrong bell resets, the right order raises the gate
    at(G.wren,13,16);G.wren.y+=6;hold(G.wren,.7);ok('T.note',M.notes[0].read&&!!G.loreCard);
    const bell=n=>{const b=M.bells.list.find(q=>q.n===n);at(G.wren,b.x,b.y+(b.y<18?1:-1));hold(G.wren,.5);};
    ok('T.gateShut',solidTile(20,18));bell(1);ok('T.discord',M.bells.p===0&&!M.bells.solved);
    for(const n of [3,1,4,2])bell(n);ok('T.bells',M.bells.solved&&!solidTile(20,18));
    // the undercroft: Shiloh cannot cross the chasm
    ok('T.chasm',blocked(23*32+16,18*32+16,8));
    // Shiloh hauls the chain; Ashling flies the gap and kicks the winch
    at(G.wren,21,17);hold(G.wren,1);ok('T.brace',!solidTile(26,18));
    G.active='ash';at(G.ash,22,18);keys.d=true;adv(55);keys.d=false;ok('T.fly',tile(G.ash)[0]>=26);
    at(G.ash,27,17);keys.e=true;adv(50);keys.e=false;adv(2);ok('T.bridge',!M.pitSet.has(23+18*256)&&!blocked(23*32+16,18*32+16,8));
    G.active='wren';at(G.wren,22,18);keys.d=true;adv(80);keys.d=false;adv(30);ok('T.pinned',!solidTile(26,18)&&tile(G.wren)[0]>=25);
    // up behind the Warden
    at(G.wren,27,16);hold(G.wren,.8);ok('T.warden',tile(G.wren)[0]===23&&tile(G.wren)[1]<=4);
    // the court drain is Ashling's alone
    at(G.wren,12,8);ok('T.drainW',blocked(13*32+16,8*32+16,8));G.active='ash';at(G.ash,12,8);keys.d=true;adv(40);keys.d=false;ok('T.drainA',tile(G.ash)[0]>=14);G.active='wren';
    // the Silent Ossuary: running on a rotten board fails it; sneaking through wins it
    at(G.wren,13,22);adv(2);at(G.wren,18,22);adv(2);ok('T.chStart',M.ch.st==='run');G.inv=0;
    keys.d=true;adv(30);keys.d=false;ok('T.chFall',M.ch.st==='fail');G.hp=G.maxHp;
    at(G.wren,13,22);adv(3);ok('T.chReset',M.ch.st==='idle'&&!M.pitSet.has(19+22*256));
    keys.shift=true;for(let x=14;x<=26;x++){at(G.wren,x,23);adv(2);}keys.shift=false;at(G.wren,27,22);adv(2);hold(G.wren,1.3);
    ok('T.chWin',M.ch.st==='done'&&__ec.run.items.includes('thread'));
    // the bell-ringer's hoard
    const st=M.caches.find(q=>q.id==='ink'),s1=G.secretsFound;at(G.wren,14,20);adv(3);ok('T.stoneSeen',st.seen);hold(G.wren,1.4);
    ok('T.secret',st.open&&G.secretsFound===s1+1&&__ec.run.items.includes('wardenbreaker'));
    return res;});
  console.log('thornwick',JSON.stringify(Object.fromEntries(Object.entries(th).filter(([k])=>k[0]==='T'))));
  await p.evaluate(()=>{const G=T_(3);V.dbgZoom=1.5;at(G.wren,21,17);at(G.ash,24,18);G.active='ash';G.mis.levers[0].on=true;G.mis.gates.cage.open=true;G.time=3;camUpdate(0,true);});
  await p.waitForTimeout(300);await p.screenshot({path:OUT+'/misa_thorn_chasm.png'});
  await p.evaluate(()=>{const G=__ec.G;G.active='wren';at(G.wren,18,18);G.mis.bells.list[2].ring=1;camUpdate(0,true);});
  await p.waitForTimeout(250);await p.screenshot({path:OUT+'/misa_thorn_bells.png'});
  await p.evaluate(()=>{const G=__ec.G;at(G.wren,18,23);camUpdate(0,true);});
  await p.waitForTimeout(250);await p.screenshot({path:OUT+'/misa_thorn_ossuary.png'});

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
