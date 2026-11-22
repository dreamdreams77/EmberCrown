// Ashfall Keep's furniture: every planned piece exists, nothing sits on a route, door, plate, stair, item, NPC or mechanism, everything stays
// reachable (ladders and hatches followed), the Ossuary Walk keeps a plate-free path, and every guard still patrols without getting stuck.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));const o={};
    newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.god=true;await wait(500);
    const k=(x,y)=>x+','+y,tile=v=>Math.round((v-16)/T);
    const set=G.d.set||[];o.planned=set.length;
    o.placed=set.filter(s=>G.props.some(q=>q.type===s[2]&&q.x===s[0]&&q.y===s[1])).length;
    const blocked=new Set();for(const q of G.props)for(let j=0;j<q.h;j++)for(let i=0;i<q.w;i++)blocked.add(k(q.x+i,q.y+j));
    const must=[];
    for(const i of G.items)must.push(['item '+i.type,tile(i.x),tile(i.y)]);
    for(const d of Object.values(G.doors))must.push(['door',d.x,d.y]);
    for(const n of G.nq.npcs)must.push(['npc '+n.id,Math.round(n.px/T-.5),Math.round(n.py/T-.5)]);
    const m=G.d.mech||{};
    for(const s of m.stairs||[]){must.push(['stairs '+s.id+' a',s.a[0],s.a[1]]);must.push(['stairs '+s.id+' b',s.b[0],s.b[1]]);}
    for(const l of m.levers||[])must.push(['lever',l.x,l.y]);for(const c of m.caches||[])must.push(['cache '+c.id,c.x,c.y]);
    for(const q of m.plates||[])must.push(['plate',q.x,q.y]);
    o.onFurniture=must.filter(([n,x,y])=>blocked.has(k(x,y))).map(a=>a.join(' '));
    // guard routes: every cell on every segment must be free
    const route=[];for(const g of G.guards){const wp=(g.wp||[]).map(q=>[tile(q[0]),tile(q[1])]);for(let i=0;i<wp.length;i++){const a=wp[i],c=wp[(i+1)%wp.length],n=Math.max(Math.abs(c[0]-a[0]),Math.abs(c[1]-a[1]));for(let t=0;t<=n;t++)route.push([Math.round(a[0]+(c[0]-a[0])*t/(n||1)),Math.round(a[1]+(c[1]-a[1])*t/(n||1))]);}}
    o.routeBlocked=route.filter(([x,y])=>blocked.has(k(x,y))).length;
    // reachability with ladders followed
    const free=(x,y)=>G.grid[y]&&G.grid[y][x]==='.';const links={};for(const s of m.stairs||[]){links[k(s.a[0],s.a[1])]=s.b;links[k(s.b[0],s.b[1])]=s.a;}
    const flood=(useProps)=>{const st=[tile(G.wren.x),tile(G.wren.y)],seen=new Set([k(...st)]),q=[st];while(q.length){const [x,y]=q.pop();const nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];const L=links[k(x,y)];if(L)nb.push(L);for(const [nx,ny] of nb){const kk=k(nx,ny);if(free(nx,ny)&&!(useProps&&blocked.has(kk))&&!seen.has(kk)){seen.add(kk);q.push([nx,ny]);}}}return seen;};
    const base=flood(false),now=flood(true);
    o.unreachable=must.filter(([n,x,y])=>base.has(k(x,y))&&!now.has(k(x,y))).map(a=>a.join(' '));
    let lost=0;for(const kk of base)if(!blocked.has(kk)&&!now.has(kk))lost++;o.floorTilesCutOff=lost;
    // Ossuary Walk: a plate-free path from the entrance to the reliquary
    const plates=new Set((m.plates||[]).map(q=>k(q.x,q.y)));
    const seen=new Set([k(16,19)]),q=[[16,19]];let found=false;while(q.length){const [x,y]=q.pop();if(x===23&&y===17){found=true;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,kk=k(nx,ny);if(nx>=16&&nx<=23&&ny>=17&&ny<=20&&free(nx,ny)&&!blocked.has(kk)&&!plates.has(kk)&&!seen.has(kk)){seen.add(kk);q.push([nx,ny]);}}}
    o.ossuarySafePath=found;
    // 40 seconds of patrol: every guard that has a route must travel along it
    const start=G.guards.map(g=>[g.x,g.y]),travelled=G.guards.map(()=>0),last=start.map(a=>a.slice());G.wren.x=-9999;G.wren.y=-9999;G.hidden=true;
    for(let i=0;i<2400;i++){G.grace=1e9;G.alert=0;update(1/60);G.guards.forEach((g,j)=>{travelled[j]+=Math.hypot(g.x-last[j][0],g.y-last[j][1]);last[j]=[g.x,g.y];});}
    o.stuckGuards=G.guards.map((g,j)=>({j,wps:(g.wp||[]).length,t:Math.round(travelled[j])})).filter(a=>a.wps>1&&a.t<60);
    // the original art toggle must not change the furniture
    const n1=G.props.length;settings.ember=false;G.dirty=true;await wait(250);o.sameWithToggleOff=G.props.length===n1;settings.ember=true;
    return o;});
  const fail=[];
  if(r.placed!==r.planned)fail.push('only '+r.placed+' of '+r.planned+' planned pieces exist (the game clears props near mechanisms and NPCs)');
  if(r.onFurniture.length)fail.push('furniture on: '+r.onFurniture.join(', '));
  if(r.routeBlocked)fail.push(r.routeBlocked+' guard-route cells blocked');
  if(r.unreachable.length)fail.push('cut off: '+r.unreachable.join(', '));
  if(r.floorTilesCutOff)fail.push(r.floorTilesCutOff+' floor tiles cut off');
  if(!r.ossuarySafePath)fail.push('Ossuary Walk has no plate-free path');
  if(r.stuckGuards.length)fail.push('guards stuck: '+JSON.stringify(r.stuckGuards));
  if(!r.sameWithToggleOff)fail.push('toggle changes the layout');
  console.log(JSON.stringify(r));console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
