#!/usr/bin/env node
/* Close-ups (game debug zoom 2.6) of every Phase 2 piece, found through the game's own state, in the real mission.
   usage: node closeups2.js <gameDir> <outDir> <ember|lpc> <desktop|mobile> */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [gameDir,outDir,art='ember',profile='desktop']=process.argv.slice(2);
const ROOT=path.resolve(gameDir),OUT=path.resolve(outDir),PORT=9600+Math.floor(Math.random()*300);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});
const P={desktop:{viewport:{width:1280,height:720},deviceScaleFactor:1},mobile:{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true}};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const ctx=await b.newContext(P[profile]);
 await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear()}catch(e){}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.333));fs.mkdirSync(OUT,{recursive:true});
 await p.evaluate(art=>{settings.lpc=true;settings.ember=art==='ember';settings.hd2d=false;settings.sfx=false;settings.music=false;settings.hints=false;newGame();startBrief(0);startPlay();G.cine=null;G.iris=null;G.grace=1e9;G.god=true;G.alert=0;G.msg=null;G.ash.on=true;},art);
 for(let i=0;i<8;i++)await p.evaluate(()=>__step(33.333));
 const T_=await p.evaluate(()=>{const o={},m=G.mis||{},c=v=>v*T+16;const f=(n,a)=>{if(a)o[n]=a;};
  f('plate_rattle',(m.plates||[]).filter(q=>q.kind==='rattle').map(q=>[c(q.x),c(q.y)])[1]);f('plate_dart',(m.plates||[]).filter(q=>q.kind==='dart').map(q=>[c(q.x),c(q.y)])[2]);
  const rt=(m.rot||[])[0];if(rt)f('rot_boards',[c(rt.x),c(rt.y)]);
  const st=(m.stairs||[]);for(const s of st){const k=s.kind||'hatch';if(!o['stairs_'+k])o['stairs_'+k]=[c(s.a[0]),c(s.a[1])];}
  const lv=(m.levers||[])[0];if(lv)f('lever',[c(lv.x),c(lv.y)]);for(const q of m.caches||[]){q.seen=true;f('cache_'+q.kind,[c(q.x),c(q.y)]);}
  const nt=(m.notes||[])[0];if(nt)f('note',[c(nt.x),c(nt.y)]);for(const k in(m.gates||{}))f('portcullis',[c(m.gates[k].x),c(m.gates[k].y)]);
  for(const i of G.items){const nm={g:'gem',G:'ember_cluster',r:'relic',s:'scroll',o:'powder_keg',O:'dragon_egg',B:'beacon'}[i.type];if(nm&&!o[nm])f(nm,[i.x,i.y]);}
  for(const n of G.insp||[])f('story_'+n.kind,[n.x,n.y]);for(const k in(G.cracks||{}))f('hidden_crack',[G.cracks[k].x*T+16,G.cracks[k].y*T+16]);
  return o;});
 for(const [k,[x,y]] of Object.entries(T_)){
  await p.evaluate(([x,y])=>{V.dbgZoom=2.6;G.wren.x=x+52;G.wren.y=y+8;G.toasts=[];G.foes=[];for(const g of G.guards)g.stun=0;},[x,y]);
  for(let i=0;i<34;i++)await p.evaluate(()=>{G.grace=1e9;G.alert=0;G.msgT=0;G.msg=null;G.toasts=[];G.foes=[];__step(33.333)});
  await p.screenshot({path:path.join(OUT,k+'.png')});process.stdout.write('.');}
 console.log('\n'+Object.keys(T_).join(',')+(errs.length?' ERRORS '+[...new Set(errs)].slice(0,3).join('|'):' no page errors'));
 await b.close();srv.close();})();
