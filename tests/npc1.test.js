const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const res=await p.evaluate(()=>{
    const out=[],fail=[];
    for(let l=0;l<7;l++){
      __ec.newGame();__ec.startBrief(l);__ec.startPlay();const G=__ec.G;G.cine=null;
      const nq=G.nq;if(!nq){fail.push('FAIL nq '+l);continue;}
      const gw=G.gw,gh=G.gh,seen=new Set(),sx=Math.round((G.wren.x-16)/32),sy=Math.round((G.wren.y-16)/32),q=[[sx,sy]];seen.add(sx+sy*256);
      const pass=(x,y)=>{if(x<0||y<0||x>=gw||y>=gh)return false;const c=G.grid[y][x];if(G.flight)return true;if(c==='#'&&!G.cracks[x+','+y])return false;if(c===' ')return false;return !G.pblock.has(x+y*256);};
      while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+ny*256;if(!seen.has(k)&&pass(nx,ny)){seen.add(k);q.push([nx,ny]);}}}
      for(const n of nq.npcs){if(!seen.has(n.x+n.y*256))fail.push('FAIL npc unreachable '+l+' '+n.id);}
      for(const o of nq.objs){if(!seen.has(o.x+o.y*256))fail.push('FAIL obj unreachable '+l+' '+o.id);}
      if(nq.D.route&&!nq.route.open&&G.grid[nq.route.y][nq.route.x]!=='#')fail.push('FAIL route not wall '+l);
      for(const n of nq.npcs){
        for(const nd of Object.keys(n.tree)){
          NPC.openTalk(n);G.talk.node=nd;G.cinders=99;
          for(let i=0;i<4;i++){if(!G.talk)break;NPC.choose(0);}
          NPC.closeTalk();
        }
        for(const v of Object.values(n.tree))for(const c of v.c||[])if(c.to&&!n.tree[c.to])fail.push('FAIL dangling '+n.id+'>'+c.to);
      }
      out.push(l+':'+nq.npcs.length+'npc/'+nq.objs.length+'obj/'+(nq.D.quests||[]).length+'q st='+nq.st);
    }
    return {out,fail};});
  console.log(res.out.join(' | '));res.fail.forEach(f=>console.log(f));
  const r2=await p.evaluate(()=>{
    __ec.newGame();__ec.startBrief(0);__ec.startPlay();const G=__ec.G;G.cine=null;const nq=G.nq,f=[];
    const hale=nq.npcs.find(n=>n.id==='hale');
    NPC.openTalk(hale);NPC.key('1');if(!(nq.q.hale&&nq.q.hale.state==='active'))f.push('FAIL hale not started');
    if(G.talk)NPC.closeTalk();
    const A=G.wren;const jk=nq.objs.find(o=>o.id==='jkey');A.x=jk.px;A.y=jk.py;G.needRel=false;
    const t=NPC.target(A,1e9);if(!t||t.kind!=='qobj')f.push('FAIL no qobj target');else NPC.activate(t);
    if(nq.q.hale.step!==1)f.push('FAIL step '+nq.q.hale.step);
    NPC.openTalk(hale);NPC.key('1');
    if(nq.q.hale.state!=='done')f.push('FAIL hale not done');
    if(!Quests.journal().some(q=>q.id==='hale'&&q.state==='done'))f.push('FAIL journal');
    __ec.finishLevel();
    if(!__ec.run.quests.hale)f.push('FAIL run.quests');
    if(!__ec.run.npc.flags.hale_free)f.push('FAIL flag');
    if(__ec.houses.ostrander.favor!==1)f.push('FAIL house');
    __ec.startBrief(2);const bh=NPC.briefHtml(2);if(!/Sailors/.test(bh))f.push('FAIL brief '+bh.slice(0,80));
    __ec.startPlay();if(!__ec.G.nq.npcs.some(n=>n.id==='hale2'))f.push('FAIL hale2 variant');
    return {f,save:JSON.stringify(JSON.parse(localStorage.getItem('embercrown.save.v2')).run.quests)};
  });
  console.log(JSON.stringify(r2));
  const r3=await p.evaluate(()=>{
    const f=[];
    __ec.newGame();__ec.startBrief(1);__ec.startPlay();let G=__ec.G;G.cine=null;
    let nq=G.nq;NPC.activate({kind:'qobj',ref:nq.objs.find(o=>o.id==='winch')});
    if(G.grid[5][6]!=='.')f.push('FAIL route open');
    NPC.activate({kind:'qobj',ref:nq.objs.find(o=>o.id==='gong')});if(!G.guards.some(g=>g.lure))f.push('FAIL gong');
    __ec.startBrief(4);__ec.startPlay();G=__ec.G;G.cine=null;NPC.activate({kind:'qobj',ref:G.nq.objs.find(o=>o.id==='valve')});if(!(G.ventOff>0))f.push('FAIL valve');
    __ec.startBrief(5);__ec.startPlay();G=__ec.G;G.cine=null;NPC.activate({kind:'qobj',ref:G.nq.objs.find(o=>o.id==='mask')});if(!(G.maskT>0))f.push('FAIL mask');
    __ec.update(.05);
    __ec.startBrief(6);__ec.startPlay();G=__ec.G;G.cine=null;nq=G.nq;NPC.qstart('memorial');
    for(const id of ['pl1','pl2','pl3'])NPC.activate({kind:'qobj',ref:nq.objs.find(o=>o.id===id)});
    if(nq.q.memorial.state!=='done')f.push('FAIL plaques');
    __ec.startBrief(2);__ec.startPlay();G=__ec.G;G.cine=null;NPC.activate({kind:'qobj',ref:G.nq.objs.find(o=>o.id==='crank')});if(!G.guards.some(g=>g.kind==='tower'&&g.stun>0))f.push('FAIL light');
    __ec.houses.sable.ruin=3;__ec.startBrief(3);__ec.startPlay();G=__ec.G;if(!G.nq.route.open||G.grid[6][6]!=='.')f.push('FAIL ruin breach');
    for(let i=0;i<60;i++)__ec.update(.05);
    return f;});
  console.log(JSON.stringify(r3));
  console.log(errs.join('\n')||'no errors');await b.close();
})();
