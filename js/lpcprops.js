/* EMBERCROWN - pixel-art props for the LPC art mode (Ashfall Keep).
   Crates, barrels, tables, pots, urns, candle stands, wall torches, bones, webs and chains are stamped from
   assets/lpc/props.png (built by tools/build_lpc_props.py, credits in CREDITS-LPC.md) instead of the code-drawn art.
   Everything falls back to the original drawing when the mode is off or the image has not loaded. */
'use strict';
const LPCP=(function(){
  const img=new Image();let ok=false;
  img.onload=()=>{ok=true;if(typeof G!=='undefined'&&G)G.dirty=true;};img.src='assets/lpc/props.png';
  // atlas map printed by tools/build_lpc_props.py: name -> [x,y,w,h]
  const A={"barrel":[0,0,32,40],"crate":[32,0,32,32],"crateS":[64,0,32,32],"crates":[96,0,64,32],"table":[160,0,80,42],"pot":[0,42,32,40],"urn":[32,42,32,48],"cand0":[64,42,32,58],"cand1":[96,42,32,58],"candOff":[128,42,32,58],"torch0":[160,42,32,32],"torch1":[192,42,32,32],"torch2":[224,42,32,32],"torchOff":[0,100,32,32],"skull":[32,100,32,32],"bone":[64,100,32,32],"web":[96,100,32,32],"chain":[128,100,32,32]};
  function on(){return ok&&LPC.on();}
  // top-left placement on whole pixels; flip mirrors left-right
  function at(c,n,x,y,flip){
    const a=A[n],sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;x=Math.round(x);y=Math.round(y);
    if(flip){c.save();c.translate(x+a[2],y);c.scale(-1,1);c.drawImage(img,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);c.restore();}
    else c.drawImage(img,a[0],a[1],a[2],a[3],x,y,a[2],a[3]);
    c.imageSmoothingEnabled=sm;
  }
  // placement by the middle of the sprite's bottom edge (where it stands on the floor)
  function base(c,n,cx,by,flip){const a=A[n];at(c,n,cx-a[2]/2,by-a[3],flip);}
  return{on,at,base};
})();
{
  const _drawPots=drawPots;
  drawPots=function(){
    if(!LPCP.on())return _drawPots();
    for(const p of G.pots||[]){
      if(p.hp<=0)continue;
      const sq=p.hit>0?Math.sin(p.hit*40)*1.5:0;
      LPCP.base(ctx,p.kind==='pot'?'pot':'urn',p.x*T+16+sq,p.y*T+T-1);
      if(p.hit>0)p.hit-=.016;
    }
  };
  const _drawBraziers=drawBraziers;
  drawBraziers=function(){
    if(!LPCP.on())return _drawBraziers();
    const c=ctx,t=G.time;
    for(const b of G.braz||[]){
      if(b.lit)LPCP.base(c,(Math.floor(t*7+b.ph)&1)?'cand1':'cand0',b.x,b.y+12);
      else{
        LPCP.base(c,'candOff',b.x,b.y+12);
        const p=.5+.5*Math.sin(t*2+b.ph); // unlit: the same violet hint and hold ring as the drawn brazier
        c.strokeStyle='rgba(170,120,255,'+(.35+p*.4)+')';c.lineWidth=1;circ(c,b.x,b.y-28,5+p*2);c.stroke();
        if(b.p>0){c.strokeStyle='#ffd27a';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y-14,16,-1.57,-1.57+6.28*Math.min(1,b.p/.6));c.stroke();}
      }
    }
  };
  const _drawProp=drawProp;
  drawProp=function(c,p,th,ruin){
    if(LPCP.on()){
      const px=p.x*T,py=p.y*T,v=Math.floor(mulberry(p.seed+11)()*100);
      switch(p.type){
        case'crate':LPCP.base(c,v%3===0?'barrel':v%3===1?'crate':'crateS',px+16,py+T-1);return;
        case'crates':LPCP.at(c,'crates',px,py);return;
        case'table':c.fillStyle='rgba(0,0,0,.25)';c.fillRect(px-4,py+T-2,2*T+8,4);LPCP.base(c,'table',px+T,py+T+2);return;
      }
    }
    return _drawProp(c,p,th,ruin);
  };
  const _drawFlames=drawFlames;
  drawFlames=function(){
    if(!LPCP.on())return _drawFlames();
    const t=G.time,c=ctx;
    for(const tr of G.torches||[]){
      if(tr.pipe||tr.small){continue;}
      if(tr.out){LPCP.at(c,'torchOff',tr.x-16,tr.y-12);continue;}
      LPCP.at(c,'torch'+(Math.floor(t*8+tr.ph)%3),tr.x-16,tr.y-12);
      if(Math.random()<.02*Q.amb)pt(tr.x,tr.y-10,(Math.random()-.5)*8,-18-Math.random()*10,.9,.9,'#ffb040',{add:true});
    }
  };
}
