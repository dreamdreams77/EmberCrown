// The trailer before the game: opens on ?intro=1, captures keys and taps, skips, and the title has a Trailer button.
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];const fail=[];
  for(const [tag,w,h,touch] of [['desktop',900,560,false],['phone',740,360,true]]){
    const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:touch})).newPage();
    p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
    await p.goto('http://localhost:8123/index.html?intro=1');await p.waitForTimeout(800);
    const r1=await p.evaluate(()=>({open:Intro.isOpen(),v:!!document.querySelector('#intro video'),mode}));
    if(!r1.open||!r1.v)fail.push(tag+': intro did not open');
    await p.keyboard.press('Enter');await p.waitForTimeout(600);
    const r2=await p.evaluate(()=>({open:Intro.isOpen(),mode,seen:localStorage.getItem('ec_intro_seen')}));
    if(r2.open)fail.push(tag+': key did not skip');
    if(r2.mode!=='title')fail.push(tag+': key reached the game ('+r2.mode+')');
    if(r2.seen!=='1')fail.push(tag+': not remembered');
    const has=await p.evaluate(()=>!!document.querySelector('[data-a="trailer"]'));
    if(!has)fail.push(tag+': no Trailer button on the title');
    await p.evaluate(()=>document.querySelector('[data-a="trailer"]').click());await p.waitForTimeout(400);
    if(!(await p.evaluate(()=>Intro.isOpen())))fail.push(tag+': Trailer button did not open it');
    await p.screenshot({path:(process.env.EC_OUT||'.')+'/intro_'+tag+'.png'});
    await p.evaluate(()=>document.querySelector('#intro .ib.r button').click());await p.waitForTimeout(600);
    if(await p.evaluate(()=>Intro.isOpen()))fail.push(tag+': Skip did not close');
    // a normal automated visit never shows it
    await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(500);
    if(await p.evaluate(()=>Intro.isOpen()))fail.push(tag+': opened for an automated browser');
  }
  console.log(fail.length?'FAIL '+fail.join('; '):'ok');console.log(errs.length?errs.join('\n'):'no errors');await b.close();
})();
