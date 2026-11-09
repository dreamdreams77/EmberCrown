const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const ev=(f,a)=>p.evaluate(f,a);
  await ev(()=>{__ec.newGame();__ec.startBrief(1);__ec.startPlay();const G=__ec.G;G.cine=null;G.foes.length=0;G.guards.forEach((q,i)=>{q.stun=i?1e9:0;});
    G.wren.x=12*32+16;G.wren.y=10*32+16;G.ash.on=false;G.sneak=true;});
  await ev(()=>{__ec.touch.sneak=true;const G=__ec.G,g=G.guards[0];g.x=G.wren.x+38;g.y=G.wren.y;g.face=0;g.wp=[[g.x,g.y],[g.x+1,g.y]];g.seeing=false;G.wren.face=0;});
  await p.waitForTimeout(60);
  console.log('seeing before',await ev(()=>__ec.G.guards[0].seeing));
  await p.keyboard.press(' ');await p.waitForTimeout(250);
  console.log('takedown ->',await ev(()=>{const g=__ec.G.guards[0];return {ko:g.ko,stun:+g.stun.toFixed(1),alert:+__ec.G.alert.toFixed(2),td:__ec.G.st.takedowns};}));
  console.log(errs.join('\n')||'no errors');await b.close();
})();
