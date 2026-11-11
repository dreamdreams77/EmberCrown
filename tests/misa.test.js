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
    window.res={};window.ok=(n,v)=>{res[n]=v?'ok':'FAIL';};
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
