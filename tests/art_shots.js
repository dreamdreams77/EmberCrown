// usage: node shoot.js tag [levels] [extra]  -> shots/tag_L{n}_{d|p}.png + call counts
const {chromium}=require('playwright');
const tag=process.argv[2]||'a',lv=(process.argv[3]||'0,1,2,3,4,5,6').split(',').map(Number);
const dir=__dirname+'/shots';require('fs').mkdirSync(dir,{recursive:true});
(async()=>{
  const b=await chromium.launch();const errs=[];
  for(const dev of ['d','p']){
    const ctxo=dev==='d'?{viewport:{width:900,height:560}}:{viewport:{width:740,height:360},hasTouch:true,isMobile:true,deviceScaleFactor:1};
    const p=await (await b.newContext(ctxo)).newPage();
    p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(500);
    await p.evaluate(()=>{window.__cnt=0;const pr=CanvasRenderingContext2D.prototype;
      for(const k of Object.getOwnPropertyNames(pr)){const d=Object.getOwnPropertyDescriptor(pr,k);if(typeof d.value==='function'&&!['getImageData','measureText','save','restore'].includes(k)){const f=d.value;pr[k]=function(){window.__cnt++;return f.apply(this,arguments);};}}});
    for(const L of lv){
      await p.evaluate(L=>{__ec.newGame();__ec.startBrief(L);__ec.startPlay();__ec.G.cine=null;__ec.G.grace=99;__ec.G.bars=0;},L);
      await p.waitForTimeout(900);
      const n=await p.evaluate(()=>new Promise(r=>{const c0=window.__cnt;let f=0;const s=()=>{if(++f<30)requestAnimationFrame(s);else r((window.__cnt-c0)/30)};requestAnimationFrame(s);}));
      console.log(dev,'L'+L,'calls/frame',Math.round(n));
      await p.screenshot({path:`${dir}/${tag}_L${L}_${dev}.png`});
    }
  }
  console.log(errs.join('\n')||'no errors');await b.close();
})();
