#!/usr/bin/env node
/* Real-time frames per second in Ashfall Keep (the game's own loop, adaptive quality left on), original vs Ember art.
   Headless Chromium on software rendering: read the gap between the two, not the absolute numbers. usage: node fps.js <gameDir> */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(process.argv[2]),PORT=9660;const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});
const PROF={desktop:[{viewport:{width:1280,height:720},deviceScaleFactor:1},1],phone:[{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true},4]};
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const out={};
 for(const [pn,[opts,thr]] of Object.entries(PROF))for(const art of ['lpc','ember']){
  const ctx=await b.newContext(opts);await ctx.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('ec_intro_seen','1')}catch(e){}});
  const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);if(thr>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:thr});
  await p.goto(`http://localhost:${PORT}/index.html`);await p.waitForTimeout(800);
  await p.evaluate(a=>{settings.lpc=true;settings.ember=a==='ember';settings.hd2d=false;settings.sfx=false;settings.music=false;newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.god=true;window.__n=0;(function c(){window.__n++;requestAnimationFrame(c);})();},art);
  await p.waitForTimeout(4000);const a0=await p.evaluate(()=>window.__n);await p.waitForTimeout(6000);const a1=await p.evaluate(()=>window.__n);
  out[pn+'/'+art]={fps:+((a1-a0)/6).toFixed(1),tier:await p.evaluate(()=>Q.tier)};await ctx.close();}
 console.log(JSON.stringify(out));await b.close();srv.close();})();
