// node poses.js tag  -> shots/tag_poses.png (contact sheet via many clips)
const {chromium}=require('playwright');
const tag=process.argv[2]||'p';const dir=__dirname+'/shots';
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:900,height:560}})).newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8211/index.html');await p.waitForTimeout(500);
  await p.evaluate(()=>{__ec.newGame();__ec.startBrief(1);__ec.startPlay();const G=__ec.G;G.cine=null;G.grace=99;G.bars=0;__ec.V.dbgZoom=2.6;});
  await p.waitForTimeout(600);
  const poses=[
    ['idle',`G.sneak=false;G.ash.on=false`],
    ['walk',`G.sneak=false;keys['d']=true`],
    ['sneak',`keys['d']=false;G.sneak=true`],
    ['strike',`G.sneak=false;G.wren.atk={a:0,t:3.1,t0:6,combo:2}`],
    ['roll',`G.wren.atk=null;G.wren.rollAnim=.25`],
    ['hurt',`G.wren.rollAnim=0;G.hurtFlash=.36`],
    ['fireA',`G.hurtFlash=0;G.active='ash';G.ash.on=true;G.wren.hidden=true;G.ash.x=G.wren.x;G.ash.y=G.wren.y;G.fireOn=true`],
    ['dashA',`G.fireOn=false;G.dash.t=.2;G.dash.hit=new Set();G.dash.a=0;G.dash.sp=0`],
    ['idleA',`G.dash.t=0`],
    ['gems12',`stats.gems=12`],
    ['death',`G.active='wren';G.wren.hidden=false;G.ash.on=false;G.ash.x=G.wren.x+9999;window.__lose=1;setMode('lose')`],
  ];
  for(const [n,code] of poses){
    await p.evaluate(`(()=>{const G=__ec.G,keys=__ec.keys,stats=__ec.stats;${code}})()`);
    await p.waitForTimeout(n==='walk'?500:(['strike','roll','hurt','dashA'].includes(n)?40:350));
    const pos=await p.evaluate(()=>{const A=__ec.G.active==='wren'?__ec.G.wren:__ec.G.ash;const s=worldToScreen(A.x,A.y);return s;});
    await p.screenshot({path:`${dir}/${tag}_pose_${n}.png`,clip:{x:Math.max(0,pos.x-90),y:Math.max(0,pos.y-70),width:180,height:140}});
    if(n==='walk')await p.evaluate(()=>{__ec.keys['d']=false;});
  }
  console.log(errs.join('\n')||'no errors');await b.close();
})();
