#!/usr/bin/env node
/* Close-ups of every object type that was redrawn, found through the game's own state, at the game's debug zoom 2.4.
   usage: node objects.js <gameDir> <outDir> <ember|lpc> <desktop|mobile> [ruin] */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [gameDir,outDir,art='ember',profile='desktop',ruin]=process.argv.slice(2);
const ROOT=path.resolve(gameDir),OUT=path.resolve(outDir),PORT=9500+Math.floor(Math.random()*300);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
const P={desktop:{viewport:{width:1280,height:720},deviceScaleFactor:1},mobile:{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true}};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const ctx=await b.newContext(P[profile]);
 await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};
  let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear()}catch(e){}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.333));
 fs.mkdirSync(OUT,{recursive:true});
 await p.evaluate(([art,ruin])=>{settings.lpc=true;settings.ember=art==='ember';settings.hd2d=false;settings.sfx=false;settings.music=false;settings.hints=false;
  newGame();startBrief(0);startPlay();G.cine=null;G.iris=null;G.grace=1e9;G.god=true;G.alert=0;G.msg=null;if(ruin==='ruin'){G.state='ruin';G.dirty=true;}},[art,ruin]);
 for(let i=0;i<6;i++)await p.evaluate(()=>__step(33.333));
 const targets=await p.evaluate(()=>{const o={};const d=Object.values(G.doors||{}).find(d=>!d.gate&&!d.sealed);if(d)o.door=[d.x*T+16,d.y*T+16];
  const g=Object.values(G.doors||{}).find(d=>d.gate);if(g)o.gate=[g.x*T+16,g.y*T+16];
  if(G.chests&&G.chests[0])o.chest=[G.chests[0].x,G.chests[0].y];if(G.pots&&G.pots[0])o.pots=[G.pots[0].x*T+16,G.pots[0].y*T+16];
  if(G.braz&&G.braz[0])o.brazier=[G.braz[0].x,G.braz[0].y];
  const nq=G.nq;if(nq)for(const n of nq.npcs)o[n.id]=[n.px,n.py];
  const rm=(G.rooms||[]).find(r=>r.n>=16&&r.rug<=.5);if(rm)o.rug=[((rm.x0+rm.x1)/2+.5)*T,((rm.y0+rm.y1)/2+.5)*T];
  const pr=(G.props||[]).find(p=>p.type==='statue'||p.type==='sarcophagus');if(pr)o.statue=[(pr.x+pr.w/2)*T,(pr.y+pr.h/2)*T];
  const cot=(G.props||[]).find(p=>p.type==='cot');if(cot)o.cot=[(cot.x+cot.w/2)*T,(cot.y+cot.h/2)*T];
  return o;});
 for(const [k,[x,y]] of Object.entries(targets)){
  await p.evaluate(([x,y])=>{V.dbgZoom=2.4;G.wren.x=x+52;G.wren.y=y+10;for(const g of G.guards)g.stun=0;},[x,y]);
  for(let i=0;i<30;i++)await p.evaluate(()=>{G.grace=1e9;G.alert=0;G.msgT=0;G.msg=null;G.toasts=[];G.foes=[];__step(33.333)});
  await p.screenshot({path:path.join(OUT,k+'.png')});process.stdout.write('.');}
 console.log('\n'+Object.keys(targets).join(',')+(errs.length?' ERRORS '+[...new Set(errs)].slice(0,3).join('|'):' no page errors'));
 await b.close();srv.close();})();
