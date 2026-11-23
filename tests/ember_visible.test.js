// Ember art must actually APPEAR in the playable Ashfall mission (traced by drawImage atlas rect), not just exist in the pipeline.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1000);
  const log=await p.evaluate(async()=>{
    const w=ms=>new Promise(r=>setTimeout(r,ms));const log={};const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(img,...a){try{const s=(img&&img.src)||'';
      if(s.includes('assets/ember/')){const at=s.split('assets/ember/')[1].replace('.png','');let n=at;
        if((at==='set2'||at==='props'||at==='tiles')&&a.length>=4){const M=EMBER_META[at];for(const k in M){const q=M[k];if(q[0]===a[0]&&q[1]===a[1]){n=at+':'+k;break;}}}
        log[n]=(log[n]||0)+1;}}catch(e){}return draw.apply(this,[img,...a]);};
    settings.lpc=true;settings.ember=true;settings.hd2d=false;newGame();startBrief(0);startPlay();G.cine=null;G.grace=1e9;G.god=true;G.ash.on=true;await w(600);
    const m=G.mis||{},spots=[];
    for(const r of G.rooms)spots.push([((r.x0+r.x1)/2+.5)*T,((r.y0+r.y1)/2+.5)*T]);
    for(const s of m.stairs||[]){spots.push([s.a[0]*T+16,s.a[1]*T+16]);}
    for(const q of m.plates||[])spots.push([q.x*T+16,q.y*T+16]);for(const q of m.levers||[])spots.push([q.x*T+16,q.y*T+16]);
    for(const q of m.caches||[])spots.push([q.x*T+16,q.y*T+16]);for(const q of m.notes||[])spots.push([q.x*T+16,q.y*T+16]);
    for(const i of G.items)spots.push([i.x,i.y]);
    for(const [x,y] of spots){G.wren.x=x;G.wren.y=y+20;for(const q of m.caches||[])q.seen=true;await w(240);}
    return log;});
  const names=Object.keys(log);const has=re=>names.some(n=>re.test(n));
  const need={furniture:/^props:/,floor:/^tiles:/,plates:/^set2:plate/,lever:/^set2:lever/,stairs:/^set2:(hatch|steps|well)/,cache:/^set2:cache/,pickups:/^set2:(gem|cluster|relic|scroll|keg|egg)/,hero:/shiloh/i,guards:/^(gaunt|pell)$/};
  const miss=Object.keys(need).filter(k=>!has(need[k]));
  console.log('distinct ember draws:',names.length,'missing:',miss.join(',')||'none');
  if(miss.length||errs.length){console.log('FAIL',miss,errs.slice(0,3));process.exit(1);}
  await b.close();console.log('ok');
})();
