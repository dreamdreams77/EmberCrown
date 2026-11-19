// Close crops of the clay lineage's characters, using the game's own state to find them. usage: node crops_clay.js <gameDir> <outDir>
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const [gameDir,outDir]=process.argv.slice(2);const ROOT=path.resolve(gameDir),PORT=9100+Math.floor(Math.random()*300);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
(async()=>{await new Promise(r=>srv.listen(PORT,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:768},deviceScaleFactor:3});
await ctx.addInitScript(()=>{let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length};window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now)};let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};try{localStorage.clear()}catch(e){}});
const p=await ctx.newPage();await p.goto(`http://localhost:${PORT}/index.html`);for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.3));
fs.mkdirSync(outDir,{recursive:true});
const jobs=[['hero-and-dragon',0,"G.ash.on=true;G.ash.x=G.shiloh.x+30;G.ash.y=G.shiloh.y;G.ash.face=0;G.shiloh.face=0;return [G.shiloh,G.ash]"],
['guard',0,"const g=G.guards.find(q=>!q.boss);return [g]"],['warden',3,"return [G.boss]"],['candlemaker',6,"return [G.boss]"]];
for(const [id,L,pick] of jobs){const pos=await p.evaluate(([L,pick])=>{newGame();startBrief(L);startPlay();G.msg=null;G.sayQ=[];G.grace=1e9;const arr=new Function(pick)();for(const g of G.guards){g.stun=0}return arr.map(a=>[a.x,a.y])},[L,pick]);
for(let i=0;i<20;i++)await p.evaluate(()=>{G.alert=0;G.msgT=0;__step(33.3)});
const pos2=await p.evaluate(([pick])=>new Function(pick.replace(/G\.ash\.on=true;G\.ash\.x=[^;]*;G\.ash\.y=[^;]*;G\.ash\.face=0;G\.shiloh\.face=0;/,''))().map(a=>[a.x,a.y]),[pick]);
const box=await p.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return [r.left,r.top,r.width,r.height]});
const sc=box[2]/800;const xs=pos2.map(a=>box[0]+a[0]*sc),ys=pos2.map(a=>box[1]+a[1]*sc);
const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
await p.screenshot({path:path.join(outDir,'crop-'+id+'.png'),clip:{x:Math.max(0,cx-110),y:Math.max(0,cy-80),width:220,height:160}});process.stdout.write('.');}
await b.close();srv.close();})();
