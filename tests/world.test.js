const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();const errs=[];
  const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
  p.on('pageerror',e=>errs.push(e.message+'\n'+e.stack));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(400);
  const res=await p.evaluate(()=>{
    const out=[];
    for(let l=0;l<7;l++){
      __ec.newGame();__ec.startBrief(l);__ec.startPlay();const G=__ec.G;G.cine=null;
      // flood with props blocking; gates & cracks & doors passable
      const gw=G.gw,gh=G.gh,seen=new Set(),sx=Math.round((G.wren.x-16)/32),sy=Math.round((G.wren.y-16)/32),q=[[sx,sy]];seen.add(sx+sy*256);
      const pass=(x,y)=>{if(x<0||y<0||x>=gw||y>=gh)return false;const c=G.grid[y][x];if(G.flight)return true;
        if(c==='#'&&!G.cracks[x+','+y])return false;if(c===' ')return false;return !G.pblock.has(x+y*256);};
      while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+ny*256;if(!seen.has(k)&&pass(nx,ny)){seen.add(k);q.push([nx,ny]);}}}
      const bad=[];
      for(const it of G.items){const x=Math.round((it.x-16)/32),y=Math.round((it.y-16)/32);if(!seen.has(x+y*256)&&!(it.type==='O'&&G.d.timeshift))bad.push(it.type+'@'+x+','+y);}
      const ex=Math.round((G.exit.x-16)/32),ey=Math.round((G.exit.y-16)/32);if(!seen.has(ex+ey*256))bad.push('EXIT');
      for(const n of G.insp){const x=Math.round((n.x-16)/32),y=Math.round((n.y-16)/32);if(!seen.has(x+y*256))bad.push('insp '+n.title);}
      for(const br of G.braz){const x=Math.round((br.x-16)/32),y=Math.round((br.y-16)/32);if(!seen.has(x+y*256))bad.push('brazier');}
      // props overlapping items/guards paths
      const onItem=G.props.filter(pr=>G.items.some(it=>{const x=Math.round((it.x-16)/32),y=Math.round((it.y-16)/32);return x>=pr.x&&x<pr.x+pr.w&&y>=pr.y&&y<pr.y+pr.h;})).length;
      out.push({l,props:G.props.length,pots:G.pots.length,insp:G.insp.length,braz:G.braz.length,bad:bad.join(' ')||'ok',onItem,size:gw+'x'+gh});
    }
    return out;});
  res.forEach(r=>console.log(JSON.stringify(r)));
  console.log(errs.join('\n')||'no errors');await b.close();
})();
