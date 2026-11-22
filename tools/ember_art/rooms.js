#!/usr/bin/env node
/* Walks the hero to the middle of every room of Ashfall Keep and photographs the real game at the default camera.
   usage: node rooms.js <gameDir> <outDir> <ember|lpc> <desktop|mobile> [ruin] [limit]  (+ one whole-keep overview with the game's debug zoom) */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [gameDir,outDir,art='ember',profile='desktop',ruin,limit='14']=process.argv.slice(2);
const ROOT=path.resolve(gameDir),OUT=path.resolve(outDir),PORT=9300+Math.floor(Math.random()*300);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
const P={desktop:{viewport:{width:1280,height:720},deviceScaleFactor:1},mobile:{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true}};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const ctx=await b.newContext(P[profile]);
 await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};
  let s=1;window.__seed=n=>{s=n>>>0};Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear()}catch(e){}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.333));
 fs.mkdirSync(OUT,{recursive:true});
 await p.evaluate(([art,ruin])=>{settings.lpc=true;settings.ember=art==='ember';settings.hd2d=false;settings.sfx=false;settings.music=false;settings.hints=false;
  newGame();startBrief(0);startPlay();G.cine=null;G.iris=null;G.grace=1e9;G.god=true;G.alert=0;G.msg=null;G.sayQ=[];
  if(ruin==='ruin'){G.state='ruin';G.dirty=true;}
  return 1;},[art,ruin]);
 for(let i=0;i<6;i++)await p.evaluate(()=>__step(33.333));
 const rooms=await p.evaluate(()=>{return (G.rooms||[]).map(r=>({id:r.id,n:r.n,cx:((r.x0+r.x1)/2+.5)*T,cy:((r.y0+r.y1)/2+.5)*T})).sort((a,b)=>b.n-a.n);});
 const take=async(name,fn)=>{await p.evaluate(fn);for(let i=0;i<36;i++)await p.evaluate(()=>{G.grace=1e9;G.alert=0;G.msgT=0;G.msg=null;__step(33.333)});await p.screenshot({path:path.join(OUT,name+'.png')});process.stdout.write('.');};
 await take('00-overview',()=>{V.dbgZoom=.42;G.wren.x=G.gw*T/2;G.wren.y=G.gh*T/2;});
 let k=0;for(const r of rooms.slice(0,+limit)){k++;
  await take(('r'+String(k).padStart(2,'0'))+'-room'+r.id+'-n'+r.n,new Function('return ()=>{delete V.dbgZoom;G.wren.x='+r.cx+';G.wren.y='+r.cy+';G.guards.forEach(g=>{g.stun=0});}')());}
 console.log('\n'+art+' '+profile+(errs.length?' ERRORS '+[...new Set(errs)].slice(0,3).join('|'):' no page errors')+' rooms:'+rooms.length);
 await b.close();srv.close();})();
