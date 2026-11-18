#!/usr/bin/env node
/* EmberCrown trailer recorder.
   Serves the game, takes over requestAnimationFrame so the game advances in exact 1/30 s steps, plays scripted
   scenes from the real missions (pixel art + HD-2D light on, HUD hidden, invulnerable), overlays captions and
   title cards, and writes one JPEG per frame. tools/trailer/make.sh turns the frames and music into an MP4.
   Usage: node tools/trailer/record.js <out_dir> [width] [height] */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.argv[2]||'trailer_frames');
const W=+process.argv[3]||1280,H=+process.argv[4]||720,FPS=30,PORT=+process.env.EC_PORT||8199;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});

// Scenes: [seconds, setup (runs once in the page), per-frame script (frame index i, seconds s), caption]
// Each runs inside the page, so they only use the game's own globals.
const SCENES=[
 {t:3.4,title:['EMBERCROWN','A spy. A runt dragon. Seven feuding houses.'],
  setup:`go(0);G.wren.x+=40;V.dbgZoom=1.35;`,frame:``},
 {t:5.2,cap:'Slip through Ashfall Keep unseen',
  setup:`go(0);const g=G.guards.find(q=>!q.boss)||G.guards[0];G.wren.x=g.x-150;G.wren.y=g.y;g.wp=[[g.x,g.y],[g.x+1,g.y]];g.face=0;g.vf=0;V.dbgZoom=1.5;`,
  frame:`keys['shift']=true;keys['d']=s<3.3;if(s>3.6&&s<3.7)strikePress();`},
 {t:4.6,cap:'Feast night at Gallowmere',
  setup:`go(1);V.dbgZoom=1.3;`,frame:`keys['d']=s<2.4;keys['s']=s>2.2&&s<4;`},
 {t:4.8,cap:'Ashling burns what Shiloh cannot reach',
  setup:`go(1);G.ash.on=true;G.active='ash';const b=G.items.find(i=>i.type==='B');if(b){G.ash.x=b.x-70;G.ash.y=b.y;G.ash.face=0;G.ash.vf=0;}V.dbgZoom=1.5;`,
  frame:`keys[' ']=s>.6;keys['d']=s<.5;`},
 {t:4.6,cap:'Take to the sky over the Drowned Spire',
  setup:`go(2);V.dbgZoom=1.1;`,frame:`keys['d']=true;keys['w']=s>1.5&&s<3;`},
 {t:5.6,cap:'Face the Bell-Warden',
  setup:`go(3);const B=G.boss;G.ash.on=true;G.active='ash';G.wren.x=B.x-160;G.wren.y=B.y;G.ash.x=B.x-140;G.ash.y=B.y+10;bossEngage(B,true);G.cine=null;B.st='idle';B.t=.8;V.dbgZoom=1.25;`,
  frame:`const B=G.boss;G.ash.face=Math.atan2(B.y-G.ash.y,B.x-G.ash.x);keys[' ']=s>.5&&s<4.6;keys['a']=s>2.4&&s<3.1;`},
 {t:4.4,cap:'A masked ball at Dunmoor Marsh',
  setup:`go(5);V.dbgZoom=1.3;`,frame:`keys['d']=s<2.6;keys['w']=s>2&&s<4;`},
 {t:4.4,cap:'Break Perrin out of Ironvale',
  setup:`go(4);V.dbgZoom=1.3;`,frame:`keys['d']=s<3.5;`},
 {t:5.6,cap:"Snuff the Candlemaker's flames",
  setup:`go(6);const B=G.boss;G.ash.on=true;G.active='ash';G.wren.x=B.x-170;G.wren.y=B.y;G.ash.x=B.x-150;G.ash.y=B.y+8;bossEngage(B,true);G.cine=null;B.st='float';B.t=.5;V.dbgZoom=1.2;`,
  frame:`const B=G.boss;G.ash.face=Math.atan2(B.y-G.ash.y,B.x-G.ash.x);keys[' ']=s>.4;keys['s']=s>2&&s<2.8;`},
 {t:3.8,cap:'Return to the Rookery. Choose who you become.',
  setup:`newGame();run.ranks[0]='A';Hub.enter(1);G.grace=1e9;G.god=true;G.cine=null;V.dbgZoom=1.4;`,frame:`keys['d']=s<1.6;keys['w']=s>1.6&&s<3;`},
 {t:4.6,title:['EMBERCROWN','Play free in your browser','dreamdreams77.github.io/EmberCrown'],
  setup:`go(0);V.dbgZoom=1.2;`,frame:``},
];

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});for(const f of fs.readdirSync(OUT))if(f.endsWith('.jpg'))fs.unlinkSync(path.join(OUT,f));
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ // manual clock: the game only advances when the recorder steps it
    let q=[],now=0;window.requestAnimationFrame=cb=>{q.push(cb);return q.length;};
    window.__step=ms=>{now+=ms;const c=q;q=[];for(const f of c)f(now);};
  });
  await p.goto(`http://localhost:${PORT}/index.html`);
  for(let i=0;i<30;i++)await p.evaluate(()=>__step(33.333));
  await p.evaluate(()=>{
    settings.lpc=true;settings.hd2d=true;settings.sfx=false;settings.music=false;settings.shake=true;
    try{localStorage.clear();}catch(e){}
    drawHud=function(){};                                                    // cinematic: no HUD
    const st=document.createElement('style');st.textContent='#btns,#touch,.tb,#hud,.toast,#pausebtn{display:none!important}'+
      '#tcap{position:fixed;left:0;right:0;bottom:7%;text-align:center;font:600 30px "Cinzel","Palatino Linotype",Georgia,serif;color:#f6e7c8;letter-spacing:.06em;text-shadow:0 2px 12px #000,0 0 3px #000;opacity:0;transition:none;pointer-events:none;z-index:99}'+
      '#ttl{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,5,14,.82);color:#f0c870;opacity:0;pointer-events:none;z-index:98;font-family:"Cinzel","Palatino Linotype",Georgia,serif}'+
      '#ttl h1{font-size:84px;letter-spacing:.12em;margin:0;text-shadow:0 0 30px rgba(255,150,60,.55)}#ttl p{font-size:24px;color:#e9dcc4;margin:14px 0 0;letter-spacing:.05em}#ttl p.u{font-size:20px;color:#c8b48a}';
    document.head.appendChild(st);
    const c=document.createElement('div');c.id='tcap';document.body.appendChild(c);
    const t=document.createElement('div');t.id='ttl';document.body.appendChild(t);
    window.go=L=>{newGame();startBrief(L);startPlay();G.cine=null;G.iris=null;G.grace=1e9;G.graceRamp=0;G.god=true;G.alert=0;G.msg=null;G.msgT=0;
      for(const k in keys)keys[k]=false;};
  });
  let n=0;
  for(const sc of SCENES){
    await p.evaluate(sc=>{
      for(const k in keys)keys[k]=false;
      new Function(sc.setup)();
      const t=document.getElementById('ttl'),c=document.getElementById('tcap');
      t.innerHTML=sc.title?'<h1>'+sc.title[0]+'</h1>'+sc.title.slice(1).map((l,i)=>'<p'+(i===1?' class="u"':'')+'>'+l+'</p>').join(''):'';
      c.textContent=sc.cap||'';window.__sc=sc;window.__fr=new Function('i','s',sc.frame);
    },sc);
    const N=Math.round(sc.t*FPS);
    for(let i=0;i<N;i++){
      const s=i/FPS;
      await p.evaluate(([i,s,N])=>{
        try{__fr(i,s);}catch(e){}
        if(G){G.grace=1e9;G.alert=0;if(G.msgT>0)G.msgT=0;if(window.__ec&&__ec.mode!=='play'&&__ec.mode!=='pause'&&!(G.d&&G.d.hub)){} }
        const fade=Math.min(1,s/.45,(N-1-i)/30/.45);
        const t=document.getElementById('ttl'),c=document.getElementById('tcap');
        if(__sc.title){t.style.opacity=Math.max(0,fade).toFixed(3);c.style.opacity=0;}
        else{t.style.opacity=0;c.style.opacity=Math.max(0,Math.min(1,(s-.35)/.5,(N-1-i)/30/.4)).toFixed(3);}
        __step(33.333);
      },[i,s,N]);
      await p.screenshot({path:path.join(OUT,String(n++).padStart(5,'0')+'.jpg'),type:'jpeg',quality:90});
    }
    process.stdout.write('.');
  }
  console.log('\nframes',n,errs.length?'errors: '+[...new Set(errs)].slice(0,5).join(' | '):'no errors');
  await b.close();srv.close();
})();
