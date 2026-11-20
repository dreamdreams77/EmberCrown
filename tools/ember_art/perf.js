#!/usr/bin/env node
/* Per-frame cost of Ashfall Keep, original LPC art vs Ember art, with the game's clock stepped (no adaptive quality) on a desktop
   viewport and a phone viewport with the CPU throttled 4x. usage: node perf.js <gameDir> */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(process.argv[2]),PORT=9650;const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});
const PROF={desktop:[{viewport:{width:1280,height:720},deviceScaleFactor:1},1],phone:[{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true},4]};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const out={};
 for(const [pn,[opts,thr]] of Object.entries(PROF))for(const art of ['lpc','ember']){
  const ctx=await b.newContext(opts);await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear();localStorage.setItem('ec_intro_seen','1')}catch(e){}});
  const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);if(thr>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:thr});
  await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<20;i++)await p.evaluate(()=>__step(33.3));
  await p.evaluate(a=>{settings.lpc=true;settings.ember=a==='ember';settings.hd2d=false;settings.sfx=false;settings.music=false;newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.god=true;Q.tier=1;},art);
  for(let i=0;i<30;i++)await p.evaluate(()=>{Q.tier=1;__step(33.3)});
  const ms=[];for(let i=0;i<90;i++){const t=await p.evaluate(()=>{Q.tier=1;keys['d']=true;const t0=performance.now();__step(33.3);return performance.now()-t0});ms.push(t);}
  ms.sort((a,b)=>a-b);out[pn+'/'+art]={median:+ms[45].toFixed(1),p90:+ms[80].toFixed(1)};await ctx.close();}
 console.log(JSON.stringify(out,null,1));await b.close();srv.close();})();
