#!/usr/bin/env node
/* Proves what is really drawn in the playable mission. Wraps drawImage, walks the hero to every room and every mechanism, pickup and story point of
   Ashfall Keep, and prints each Ember sprite (by name) with how often it was drawn, plus any LPC atlas still being drawn. usage: node appear.js <gameDir> [json] */
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(process.argv[2]);const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});
(async()=>{await new Promise(r=>srv.listen(9947,r));const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:9947/index.html');await p.waitForTimeout(1200);
const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
 const log={};const draw=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(img,...a){try{const src=(img&&img.src)||'';
   if(/assets\/(ember|lpc)\//.test(src)){const atlas=src.includes('assets/ember/')?src.split('assets/ember/')[1].replace('.png',''):'LPC:'+src.split('assets/lpc/')[1].replace('.png','');let name=atlas;
     if((atlas==='set2'||atlas==='props'||atlas==='tiles')&&a.length>=4){const M=EMBER_META[atlas];for(const k in M){const q=M[k];if(q[0]===a[0]&&q[1]===a[1]){name=atlas+':'+k;break;}}}
     log[name]=(log[name]||0)+1;}}catch(e){}return draw.apply(this,[img,...a]);};
 settings.lpc=true;settings.ember=true;settings.hd2d=false;newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.god=true;G.ash.on=true;await w(700);
 const spots=[];const m=G.mis||{};
 for(const r of G.rooms)spots.push([((r.x0+r.x1)/2+.5)*T,((r.y0+r.y1)/2+.5)*T]);
 for(const s of m.stairs||[]){spots.push([s.a[0]*T+16,s.a[1]*T+16]);spots.push([s.b[0]*T+16,s.b[1]*T+16]);}
 for(const q of m.plates||[])spots.push([q.x*T+16,q.y*T+16]);for(const q of m.levers||[])spots.push([q.x*T+16,q.y*T+16]);
 for(const q of m.caches||[]){q.seen=true;spots.push([q.x*T+16,q.y*T+16]);}for(const q of m.notes||[])spots.push([q.x*T+16,q.y*T+16]);
 for(const k in (m.gates||{}))spots.push([m.gates[k].x*T+16,m.gates[k].y*T+16]);for(const q of m.rot||[])spots.push([q.x*T+16,q.y*T+16]);
 for(const i of G.items)spots.push([i.x,i.y]);for(const n of G.insp||[])spots.push([n.x,n.y]);for(const k in (G.cracks||{}))spots.push([G.cracks[k].x*T+16,G.cracks[k].y*T+16]);
 for(const [x,y] of spots){G.wren.x=x;G.wren.y=y+20;for(const q of m.caches||[])q.seen=true;await w(260);}
 // a guard that sees you, a stunned guard, a lured guard, a runner, particles, a prompt
 G.guards[0].seeing=true;G.guards[1].stun=2;G.guards[2].lure={x:0,y:0};G.guards[3].quest=1;G.guards[3].say={x:'Report.',t:1.2};
 await w(400);pt(G.wren.x,G.wren.y,10,-10,1,3,'#ffb040',{add:true});await w(200);
 return{log,spots:spots.length,placed:G.props.length};});
const L=r.log;const names=Object.keys(L).sort();
console.log('visited',r.spots,'spots; furniture placed:',r.placed);
if(process.argv[3]==='json'){console.log(JSON.stringify(L));}else{
 console.log('\nEmber sprites drawn ('+names.filter(k=>/^(set2|props|tiles)/.test(k)).length+' distinct set/props/tiles + characters):');
 for(const k of names)console.log('  '+k.padEnd(30)+L[k]);}
console.log(errs.length?'ERRORS '+errs.slice(0,3).join('|'):'no page errors');await b.close();srv.close();})();
