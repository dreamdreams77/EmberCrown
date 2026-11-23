#!/usr/bin/env node
/* Plans Ashfall Keep's furniture. Reads the real level from the running game (map, routes, items, doors, plates, stairs, NPCs),
   places furniture room by room with a seeded random pick, never on a protected tile, and verifies reachability, guard routes and the
   Ossuary Walk's safe path after every piece. Prints the `set` list that goes into the level data. usage: node plan.js <gameDir> */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(process.argv[2]);const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});
(async()=>{await new Promise(r=>srv.listen(9941,r));const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
await p.goto('http://localhost:9941/index.html');await p.waitForTimeout(900);
const out=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));settings.lpc=true;newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;await w(700);
 const gw=G.gw,gh=G.gh,free=(x,y)=>G.grid[y]&&G.grid[y][x]==='.';const B=new Set(),k=(x,y)=>x+','+y;
 const mark=(x,y,r)=>{x=Math.round(x);y=Math.round(y);for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)B.add(k(x+i,y+j));};
 for(const kk of G.propKeep||[])B.add(k(kk%256,Math.floor(kk/256)));   // the game's own keep set (routes, items, exit, start, doors, cracks)
 const m=G.d.mech||{};
 for(const g of G.guards){const wp=(g.wp||[]).map(q=>[(q[0]-16)/T,(q[1]-16)/T]);for(let i=0;i<wp.length;i++){const a=wp[i],c=wp[(i+1)%wp.length];const n=Math.max(Math.abs(c[0]-a[0]),Math.abs(c[1]-a[1]))*2+1;for(let t=0;t<=n;t++)mark(a[0]+(c[0]-a[0])*t/n,a[1]+(c[1]-a[1])*t/n,0);}}
 for(const i of G.items)mark((i.x-16)/T,(i.y-16)/T,1);
 for(const kd in G.doors)mark(G.doors[kd].x,G.doors[kd].y,1);
 mark((G.exit.x-16)/T,(G.exit.y-16)/T,2);mark((G.wren.x-16)/T,(G.wren.y-16)/T,2);
 const md=G.d.mech||{};
 // exactly what js/mis_a.js and js/npcs.js will strip from a level, so nothing planned here is silently dropped
 for(const [x0,y0,x1,y1] of md.keep||[])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)mark(x,y,0);
 for(const o of [...(md.gates||[]),...(md.levers||[]),...(md.caches||[]),...(md.notes||[])])mark(o.x,o.y,1);
 for(const o of [...(md.plates||[]),...(md.steam||[])])mark(o.x,o.y,0);
 for(const st of md.stairs||[]){mark(st.a[0],st.a[1],1);mark(st.b[0],st.b[1],1);}
 if(md.rot)for(const [x,y] of (m.rot.tiles||md.rot))mark(x,y,1);
 for(const pt of md.pits||[])for(const [x,y] of pt.tiles)mark(x,y,1);
 for(const o of md.oil||[])for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)mark(x,y,0);
 for(const d of md.ducts||[])for(const [x,y] of d.tiles||[])mark(x,y,1);
 for(const o of G.nq.objs||[])mark(o.x,o.y,1);
 for(const n of G.nq.npcs)mark(n.px/T-.5,n.py/T-.5,1);for(const q of G.pots)mark(q.x,q.y,1);for(const q of G.braz)mark(q.x/T-.5,q.y/T-.5,1);for(const q of G.insp||[])mark(q.x/T-.5,q.y/T-.5,1);
 for(const q of m.ducts||[])for(const t of q.tiles||[])mark(t[0],t[1],1);for(const q of Object.values(m.gates||{}))if(q&&q.x!=null)mark(q.x,q.y,1);
 // annex (vault) and the culvert lessons keep their own layout
 for(let y=9;y<=14;y++)for(let x=24;x<gw;x++)mark(x,y,0);
 // reachability helper
 const blocked=new Set();const start=[Math.round((G.wren.x-16)/T),Math.round((G.wren.y-16)/T)];
 const links={};for(const s of m.stairs||[]){links[k(s.a[0],s.a[1])]=s.b;links[k(s.b[0],s.b[1])]=s.a;}  // ladders, hatches and the well join the floors
 const reach=()=>{const seen=new Set([k(...start)]),q=[start];while(q.length){const [x,y]=q.pop();const nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];const L=links[k(x,y)];if(L)nb.push([L[0],L[1]]);for(const [nx,ny] of nb){const kk=k(nx,ny);if(free(nx,ny)&&!blocked.has(kk)&&!seen.has(kk)){seen.add(kk);q.push([nx,ny]);}}}return seen;};
 const base=reach();
 const mustReach=[];for(const i of G.items)mustReach.push([Math.round((i.x-16)/T),Math.round((i.y-16)/T)]);mustReach.push([Math.round((G.exit.x-16)/T),Math.round((G.exit.y-16)/T)]);
 for(const n of G.nq.npcs)mustReach.push([Math.round(n.px/T-.5),Math.round(n.py/T-.5)]);for(const q of m.stairs||[]){mustReach.push([q.a[0],q.a[1]]);mustReach.push([q.b[0],q.b[1]]);}for(const q of m.levers||[])mustReach.push([q.x,q.y]);for(const q of m.caches||[])mustReach.push([q.x,q.y]);for(const kd in G.doors)mustReach.push([G.doors[kd].x,G.doors[kd].y]);
 const plates=new Set((m.plates||[]).map(q=>k(q.x,q.y)));
 // the Ossuary Walk must keep a path to the reliquary that never touches a plate
 const safeOk=()=>{const t=[23,17],st=[16,19];const seen=new Set([k(...st)]),q=[st];while(q.length){const [x,y]=q.pop();if(x===t[0]&&y===t[1])return true;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,kk=k(nx,ny);if(nx>=16&&nx<=23&&ny>=17&&ny<=20&&free(nx,ny)&&!blocked.has(kk)&&!plates.has(kk)&&!seen.has(kk)){seen.add(kk);q.push([nx,ny]);}}}return false;};
 const ok0=safeOk();
 let seed=20261121;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const placed=[];
 const around=(x,y,w,h)=>{for(let j=-1;j<=h;j++)for(let i=-1;i<=w;i++){if(blocked.has(k(x+i,y+j)))return true;}return false;};
 const wallAdj=(x,y,w,h)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+i+dx,ny=y+j+dy;if(!free(nx,ny))return true;}return false;};
 const tryPlace=(type,x,y,w,h,room,allowNear)=>{
   for(let j=0;j<h;j++)for(let i=0;i<w;i++){const xx=x+i,yy=y+j;if(!free(xx,yy)||B.has(k(xx,yy))||blocked.has(k(xx,yy)))return false;}
   if(!allowNear&&around(x,y,w,h))return false;
   const added=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++){blocked.add(k(x+i,y+j));added.push(k(x+i,y+j));}
   const r=reach();let good=true;for(const kk of base)if(!blocked.has(kk)&&!r.has(kk)){good=false;break;}
   if(good)for(const [mx,my] of mustReach)if(base.has(k(mx,my))&&!r.has(k(mx,my))){good=false;break;}
   if(good&&!safeOk()&&ok0)good=false;
   if(!good){for(const a of added)blocked.delete(a);return false;}
   placed.push([x,y,type,w,h,room]);return true;};
 const SPEC=[
  ['scullery',1,1,4,3,true,[['furnace',2,1,1],['cauldron',1,1,1],['barrels',1,1,1],['sacks',1,1,1]]],
  ['store',6,1,14,3,true,[['furnace',2,1,1],['cauldron',1,1,1],['toolrack',2,1,1],['crates',2,1,1],['barrels',1,1,2],['sacks',1,1,1]]],
  ['relic',16,1,23,3,true,[['altar',1,1,1],['statue',1,1,2],['treasure',1,1,1]]],
  ['barracks',1,5,11,7,true,[['cot',2,1,3],['weaponrack',1,1,1],['sacks',1,1,1],['bench',2,1,1]]],
  ['mess',13,5,23,7,true,[['weaponrack',1,1,1],['statue',1,1,1],['bench',2,1,1],['barrels',1,1,1]]],
  ['guardroom',13,9,23,13,true,[['longtable',5,1,1],['bookcase',2,1,1],['bench',2,1,1],['weaponrack',1,1,2],['crates',2,1,1],['lectern',1,1,1]]],
  ['courtyard',1,9,11,13,true,[['barrels',1,1,2],['sacks',1,1,1],['crates',2,1,1],['coal',1,1,1]]]];
 const report=[];
 for(const [room,x0,y0,x1,y1,wallOnly,list] of SPEC){
   for(const [type,w,h,count] of list){let n=0;
     const cands=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1-w+1;x++)if(!wallOnly||wallAdj(x,y,w,h))cands.push([x,y]);
     for(let i=cands.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[cands[i],cands[j]]=[cands[j],cands[i]];}
     for(const [x,y] of cands){if(n>=count)break;if(tryPlace(type,x,y,w,h,room,false))n++;}
     report.push(room+':'+type+' '+n+'/'+count);}}
 return{set:placed.map(q=>'['+q[0]+','+q[1]+",'"+q[2]+"',"+q[3]+','+q[4]+']'),rooms:placed.map(q=>q[5]),report,ok0,okEnd:safeOk(),n:placed.length,reachStart:reach().size,reachBase:base.size};});
console.log(out.report.join('  '));console.log('placed',out.n,'| ossuary safe path before/after:',out.ok0,out.okEnd,'| reachable tiles',out.reachBase,'->',out.reachStart,'(minus furniture tiles)');
console.log('SET:['+out.set.join(',')+']');fs.writeFileSync('/tmp/plan_set.txt',out.set.join(',')+'\n'+JSON.stringify(out.rooms));
await b.close();srv.close();})();
