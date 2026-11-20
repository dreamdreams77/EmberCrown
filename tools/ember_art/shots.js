#!/usr/bin/env node
/* Deterministic gameplay screenshots of the Ashfall slice. usage: node shots.js <gameDir> <outDir> <ember|lpc> <desktop|mobile> [filter] [hd2d]
   Same harness as the earlier comparison: manual requestAnimationFrame clock, seeded Math.random, fresh profile. Only the game's
   own settings (settings.ember, settings.hd2d) and its own debug zoom are used. */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [gameDir,outDir,art='ember',profile='desktop',filter,hd2d='off']=process.argv.slice(2);
const SC=require('./slice_scenes.js').filter(s=>!filter||filter.split(',').some(f=>s.id.includes(f)));
const ROOT=path.resolve(gameDir),OUT=path.resolve(outDir),PORT=9700+Math.floor(Math.random()*200);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.jpg':'image/jpeg'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
const PROFILES={desktop:{viewport:{width:1280,height:720},deviceScaleFactor:1},mobile:{viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true}};
(async()=>{
  await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const ctx=await b.newContext(PROFILES[profile]);
  await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};
    let s=1;window.__seed=n=>{s=n>>>0};Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear()}catch(e){}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.333));
  fs.mkdirSync(OUT,{recursive:true});
  await p.evaluate(([art,hd2d])=>{settings.lpc=true;settings.ember=art==='ember';settings.hd2d=hd2d==='on';settings.sfx=false;settings.music=false;settings.hints=false;
    window.go=L=>{newGame();startBrief(L);startPlay();G.cine=null;G.iris=null;G.grace=1e9;G.god=true;G.alert=0;G.msg=null;G.msgT=0;for(const k in keys)keys[k]=false;};},[art,hd2d]);
  for(const zoom of (process.env.ZOOMS||'default').split(',')){
    for(const sc of SC){
      const setup=zoom==='default'?sc.setup.replace(/V\.dbgZoom=[\d.]+;?/g,''):sc.setup;
      const failed=await p.evaluate(([setup,frame])=>{try{__seed(4242);for(const k in keys)keys[k]=false;delete V.dbgZoom;new Function(setup)();window.__fr=new Function('i','s',frame);return null}catch(e){return String(e&&e.message||e)}},[setup,sc.frame]);
      if(failed){console.log('SKIP',sc.id,failed);continue;}
      for(let i=0;i<sc.frames;i++)await p.evaluate(([i])=>{try{__fr(i,i/30)}catch(e){}if(G){G.grace=1e9;if(G.msgT>0)G.msgT=0;}__step(33.333)},[i]);
      fs.mkdirSync(path.join(OUT,zoom),{recursive:true});
      await p.screenshot({path:path.join(OUT,zoom,sc.id+'.png')});process.stdout.write('.');
    }
  }
  console.log('\n'+art+' '+profile+(errs.length?' ERRORS: '+[...new Set(errs)].slice(0,4).join(' | '):' no page errors'));
  await b.close();srv.close();
})();
