// Pixel art: sprites load, the toggle swaps art on every mission, LPC tiles stay Ashfall-only, a house guard sheet is assembled.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{
    const o={};const wait=ms=>new Promise(r=>setTimeout(r,ms));
    o.ready=['shiloh','guard_marrow','ashfall_tiles'].every(n=>LPC.ready(n));
    settings.lpc=true;newGame();startBrief(0);startPlay();G.cine=null;G.grace=99;await wait(300);
    o.onAshfall=LPC.on();
    for(let i=0;i<120;i++)update(1/60);await wait(200);
    settings.lpc=false;G.dirty=true;await wait(300);o.offAshfall=LPC.on();
    o.tilesAshfall=(settings.lpc=true,LPC.tiles());
    settings.lpc=true;startBrief(1);startPlay();G.cine=null;await wait(300);o.onGallowmere=LPC.on();o.tilesGallowmere=LPC.tiles();
    o.houseGuard=!!LPCG.guard('guard',G.d.th.guard)&&!!LPCG.guard('archer',G.d.th.guard)&&!!LPCG.guard('brute',G.d.th.guard);
    for(let i=0;i<60;i++)update(1/60);await wait(200);
    return o;});
  const fail=[];
  if(!r.ready)fail.push('images not loaded');
  if(!r.onAshfall)fail.push('pixel art not active in Ashfall Keep');
  if(!r.tilesAshfall)fail.push('LPC tiles not active in Ashfall Keep');
  if(r.offAshfall)fail.push('toggle off did not disable');
  if(!r.onGallowmere)fail.push('pixel art not active in Gallowmere');
  if(r.tilesGallowmere)fail.push('Ashfall tiles leaked into Gallowmere');
  if(!r.houseGuard)fail.push('house guard sheets not assembled');
  console.log(JSON.stringify(r));
  console.log(fail.length?'FAIL '+fail.join('; '):'ok');
  console.log(errs.length?errs.join('\n'):'no errors');
  await b.close();
})();
