// Close crops of the pixel-art lineage's characters (configuration B: hd2d off), game's own debug zoom. usage: node crops_main.js <gameDir> <outDir>
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [gameDir,outDir]=process.argv.slice(2);const ROOT=path.resolve(gameDir),PORT=9100+Math.floor(Math.random()*300);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear()}catch(e){}});
const p=await ctx.newPage();await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.3));
await p.evaluate(()=>{settings.lpc=true;settings.hd2d=false;settings.hints=false;window.go=L=>{newGame();startBrief(L);startPlay();G.cine=null;G.iris=null;G.grace=1e9;G.god=true;G.alert=0;G.msg=null;G.msgT=0};});
fs.mkdirSync(outDir,{recursive:true});
const jobs=[['hero-and-dragon',0,"G.ash.on=true;G.ash.x=G.wren.x+30;G.ash.y=G.wren.y;V.dbgZoom=3.2;"],
['guard',0,"const g=G.guards.find(q=>!q.boss)||G.guards[0];G.wren.x=g.x-60;G.wren.y=g.y;g.wp=[[g.x,g.y],[g.x+1,g.y]];g.face=Math.PI;V.dbgZoom=3.2;"],
['warden',3,"const B=G.boss;G.wren.x=B.x-70;G.wren.y=B.y;V.dbgZoom=3;"],['candlemaker',6,"const B=G.boss;G.wren.x=B.x-70;G.wren.y=B.y;V.dbgZoom=3;"]];
for(const [id,L,s] of jobs){await p.evaluate(([L,s])=>{go(L);new Function(s)()},[L,s]);for(let i=0;i<30;i++)await p.evaluate(()=>{G.grace=1e9;G.alert=0;G.msgT=0;__step(33.3)});
await p.screenshot({path:path.join(outDir,'crop-'+id+'.png'),clip:{x:340,y:200,width:600,height:320}});process.stdout.write('.');}
await b.close();srv.close();})();
