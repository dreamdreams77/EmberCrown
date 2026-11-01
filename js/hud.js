'use strict';
/* EMBERCROWN - HUD (canvas, CSS-pixel space), minimap, animated title scene. */
const HIT=[]; // clickable HUD regions: {x,y,w,h,fn}
let HUDN=0;

function wrapText(c,text,maxW){
  const words=String(text).split(' '),lines=[];let cur='';
  for(const w of words){
    const t=cur?cur+' '+w:w;
    if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;
  }
  if(cur)lines.push(cur);return lines;
}
function panelBox(c,x,y,w,h,r,glow){
  c.save();
  c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=10;c.shadowOffsetY=2;
  const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(32,22,38,.90)');g.addColorStop(1,'rgba(14,9,20,.90)');
  c.fillStyle=g;rr(c,x,y,w,h,r);c.fill();c.restore();
  c.strokeStyle=glow||'rgba(226,170,70,.55)';c.lineWidth=1;rr(c,x+.5,y+.5,w-1,h-1,r);c.stroke();
  c.strokeStyle='rgba(255,255,255,.06)';rr(c,x+2.5,y+2.5,w-5,h-5,Math.max(2,r-2));c.stroke();
}
function icon(c,name,x,y,s,col,dim){
  c.save();c.translate(x,y);c.globalAlpha=dim?.35:1;c.fillStyle=col;c.strokeStyle=col;c.lineWidth=Math.max(1.5,s*.09);c.lineCap='round';c.lineJoin='round';
  const h=s/2;
  switch(name){
    case'smoke':for(const [dx,dy,r] of[[-.28,.1,.27],[.1,-.08,.33],[.3,.14,.24],[-.02,.2,.26]]){circ(c,dx*s,dy*s,r*s);c.fill();}break;
    case'bell':c.beginPath();c.moveTo(-.36*s,.28*s);c.quadraticCurveTo(-.34*s,-.4*s,0,-.4*s);c.quadraticCurveTo(.34*s,-.4*s,.36*s,.28*s);c.closePath();c.fill();
      circ(c,0,.38*s,.07*s);c.fill();c.fillRect(-.03*s,-.5*s,.06*s,.1*s);break;
    case'flute':c.save();c.rotate(-.6);c.fillRect(-.42*s,-.07*s,.84*s,.14*s);c.fillStyle='rgba(0,0,0,.5)';for(let i=0;i<4;i++)c.fillRect((-.25+i*.15)*s,-.03*s,.05*s,.06*s);c.restore();break;
    case'dash':c.beginPath();c.moveTo(-.42*s,-.2*s);c.lineTo(.1*s,-.2*s);c.lineTo(.1*s,-.4*s);c.lineTo(.45*s,0);c.lineTo(.1*s,.4*s);c.lineTo(.1*s,.2*s);c.lineTo(-.42*s,.2*s);c.closePath();c.fill();break;
    case'fire':c.beginPath();c.moveTo(0,-.46*s);c.quadraticCurveTo(.4*s,-.1*s,.3*s,.22*s);c.quadraticCurveTo(.22*s,.46*s,0,.46*s);c.quadraticCurveTo(-.3*s,.44*s,-.3*s,.14*s);c.quadraticCurveTo(-.3*s,-.1*s,-.08*s,-.2*s);c.quadraticCurveTo(-.08*s,-.04*s,.04*s,0);c.quadraticCurveTo(.1*s,-.2*s,0,-.46*s);c.fill();break;
    case'hand':c.beginPath();c.arc(0,.1*s,.3*s,0,6.3);c.stroke();c.beginPath();c.moveTo(0,-.2*s);c.lineTo(0,-.45*s);c.stroke();break;
    case'eye':c.beginPath();c.moveTo(-.46*s,0);c.quadraticCurveTo(0,-.46*s,.46*s,0);c.quadraticCurveTo(0,.46*s,-.46*s,0);c.stroke();circ(c,0,0,.14*s);c.fill();break;
    case'swap':c.beginPath();c.arc(0,0,.3*s,.3,3.2);c.stroke();c.beginPath();c.arc(0,0,.3*s,3.45,6.35);c.stroke();
      c.beginPath();c.moveTo(-.3*s,-.1*s);c.lineTo(-.4*s,.08*s);c.lineTo(-.18*s,.08*s);c.fill();c.beginPath();c.moveTo(.3*s,.1*s);c.lineTo(.4*s,-.08*s);c.lineTo(.18*s,-.08*s);c.fill();break;
    case'pause':c.fillRect(-.22*s,-.3*s,.14*s,.6*s);c.fillRect(.08*s,-.3*s,.14*s,.6*s);break;
    case'gem':c.beginPath();c.moveTo(0,-.42*s);c.lineTo(.3*s,-.08*s);c.lineTo(0,.42*s);c.lineTo(-.3*s,-.08*s);c.closePath();c.fill();break;
    case'secret':c.beginPath();c.arc(0,-.08*s,.3*s,3.4,6.0);c.stroke();c.fillRect(-.03*s,.12*s,.06*s,.12*s);circ(c,0,.36*s,.05*s);c.fill();break;
  }
  c.restore();
}
function objectiveLines(){
  const L=[];
  for(const t of['L','H','C','O','P','B','W']){
    const l=G.d.labels[t];if(!l)continue;
    let its,n,done;
    if(t==='W'){done=!!G.boss.dead;its=[0];n=done?1:0;}
    else{its=G.items.filter(i=>i.type===t);n=its.filter(i=>i.done).length;done=n===its.length;}
    L.push({text:l+(its.length>1?'  '+n+'/'+its.length:''),done});
  }
  return L;
}
function discover(){
  const gw=G.gw,gh=G.gh;
  if(!G.fog){G.fog=[];for(let y=0;y<gh;y++)G.fog[y]=new Array(gw).fill(false);}
  const A=G.active==='wren'?G.wren:G.ash,tx=Math.floor(A.x/T),ty=Math.floor(A.y/T);
  for(let y=ty-5;y<=ty+5;y++)for(let x=tx-6;x<=tx+6;x++)
    if(x>=0&&y>=0&&x<gw&&y<gh&&Math.hypot(x-tx,(y-ty)*1.15)<6)G.fog[y][x]=true;
}
function drawMinimap(x,y,w,h){
  const c=ctx,sx=w/G.gw,sy=h/G.gh,p=themePal();
  panelBox(c,x-4,y-4,w+8,h+8,6);
  c.save();rr(c,x,y,w,h,3);c.clip();
  c.fillStyle='#07050b';c.fillRect(x,y,w,h);
  for(let j=0;j<G.gh;j++)for(let i=0;i<G.gw;i++){
    const ch=G.grid[j][i];if(ch===' ')continue;
    const known=G.fog&&G.fog[j][i]||G.flight;
    if(ch==='#')c.fillStyle=known?p.wt:'rgba(80,70,90,.18)';
    else c.fillStyle=known?sh(p.f2,2.2):'rgba(60,50,70,.14)';
    c.fillRect(x+i*sx,y+j*sy,sx+.5,sy+.5);
  }
  for(const k in G.doors){const d=G.doors[k];if(!d.open&&G.fog&&G.fog[d.y][d.x]){c.fillStyle='#d8a24a';c.fillRect(x+d.x*sx,y+d.y*sy,sx+.5,sy+.5);}}
  const pulse=.6+.4*Math.sin(G.time*5);
  const dot=(px,py,r,col)=>{c.fillStyle=col;circ(c,x+px/T*sx,y+py/T*sy,r);c.fill();};
  for(const it of G.items){
    if(it.done||!'OPBLHC'.includes(it.type))continue;
    if(G.d.timeshift&&((it.type==='P'&&G.state!=='ball')||(it.type==='O'&&G.state!=='ruin')))continue;
    c.globalAlpha=pulse;dot(it.x,it.y,Math.max(2,sx*.55),'#f0b44c');c.globalAlpha=1;
  }
  if(G.exitOpen){c.globalAlpha=pulse;dot(G.exit.x,G.exit.y,Math.max(2.4,sx*.65),'#6af09a');c.globalAlpha=1;}
  else dot(G.exit.x,G.exit.y,Math.max(1.6,sx*.4),'#4a6a56');
  for(const g of G.guards){
    if(g.dead)continue;
    const dd=Math.hypot(g.x-(G.active==='wren'?G.wren.x:G.ash.x),g.y-(G.active==='wren'?G.wren.y:G.ash.y));
    if(dd<8*T||g.seeing)dot(g.x,g.y,Math.max(1.6,sx*.4),g.seeing?'#ff4a4a':g.stun>0?'#888':'#d85050');
  }
  if(!G.wren.hidden)dot(G.wren.x,G.wren.y,Math.max(2,sx*.5),G.active==='wren'?'#fff':'#a89ad8');
  if(G.ash.on)dot(G.ash.x,G.ash.y,Math.max(2,sx*.5),G.active==='ash'?'#fff':'#ff9a4a');
  // camera window
  const vr=viewRect();c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1;
  c.strokeRect(x+vr.x/T*sx,y+vr.y/T*sy,Math.min(vr.w,G.gw*T)/T*sx,Math.min(vr.h,G.gh*T)/T*sy);
  c.restore();
}

function drawHud(){
  const c=ctx,U=V.U,W=V.w,H=V.h,pad=Math.round(10*U);
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  HIT.length=0;
  discover();
  const fs=Math.max(11,Math.round(12.5*U));
  const touchLand=V.coarse&&W>H;
  // --- screen effects ---
  if(G.alert>.45){
    const a=(G.alert-.45)*.9*(.75+.25*Math.sin(G.time*8));
    const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);
    g.addColorStop(0,'rgba(190,20,20,0)');g.addColorStop(1,'rgba(190,20,20,'+a+')');c.fillStyle=g;c.fillRect(0,0,W,H);
  }
  { // soft vignette
    const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.8);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.42)');c.fillStyle=g;c.fillRect(0,0,W,H);
  }
  if(G.flash){const a=Math.min(.55,G.flash.t*1.2);c.fillStyle='rgba('+G.flash.c+','+a+')';c.fillRect(0,0,W,H);}
  // --- layout: narrow (phone portrait) stacks meter, objectives, minimap; wide spreads them across the top ---
  const narrow=W<520,pbS=44;
  if(touchLand&&(HUDN++%30===0)){
    const cr=cv.getBoundingClientRect(),bt=document.getElementById('btns').getBoundingClientRect(),jb=document.getElementById('joybase').getBoundingClientRect();
    if(bt.width)V.safeR=Math.max(0,cr.right-bt.left+8);
    if(jb.width)V.safeL=Math.max(0,jb.right-cr.left+8);
  }
  const aL=touchLand?(V.safeL||150):0,aR=touchLand?(V.safeR||240):0,aw=Math.max(220,W-aL-aR),acx=touchLand?aL+(W-aL-aR)/2:W/2;
  const objs=objectiveLines();
  const title=G.d.name;
  c.font='bold '+Math.round(fs*1.05)+'px '+HEAD;let ow=c.measureText(title).width;
  c.font=fs+'px '+BODY;
  for(const o of objs)ow=Math.max(ow,c.measureText(o.text).width+20);
  const foot='Embers '+stats.gems+(G.secretsTotal?'   Secrets '+G.secretsFound+'/'+G.secretsTotal:'');
  ow=Math.max(ow,c.measureText(foot).width+4);
  ow=Math.min(ow,narrow?W-pad*4:W*.58);
  const lh=Math.round(fs*1.5),oh=Math.round(lh*(objs.length+2)+10);
  const ox=pad,oy=narrow?pad+pbS+8:pad;
  panelBox(c,ox,oy,ow+pad*2,oh,8);
  c.fillStyle='#f0b44c';c.font='bold '+Math.round(fs*1.05)+'px '+HEAD;c.fillText(title,ox+pad,oy+lh*.95);
  c.font=fs+'px '+BODY;
  objs.forEach((o,i)=>{
    const yy=oy+lh*(i+2)-lh*.18;
    c.strokeStyle=o.done?'#7be08a':'#9a8aa0';c.lineWidth=1.4;
    c.beginPath();c.arc(ox+pad+5,yy-fs*.32,fs*.36,0,6.28);c.stroke();
    if(o.done){c.strokeStyle='#7be08a';c.lineWidth=2;c.beginPath();c.moveTo(ox+pad+2.5,yy-fs*.3);c.lineTo(ox+pad+4.6,yy-fs*.1);c.lineTo(ox+pad+8.4,yy-fs*.6);c.stroke();}
    c.fillStyle=o.done?'#7be08a':'#eadfd0';c.fillText(o.text,ox+pad+fs*1.05,yy);
  });
  c.fillStyle='#b8a0c8';c.font=Math.round(fs*.92)+'px '+BODY;
  c.fillText(foot,ox+pad,oy+oh-pad*.75);
  const topBottom=oy+oh;
  // --- suspicion meter ---
  const icoW=Math.round(26*U),mh=Math.round(26*U),my=pad+Math.round((pbS-mh)/2);
  const mw=narrow?W-pad*2-pbS-8-icoW-6:Math.min(Math.round(150*U),Math.max(96,W*.30));
  const mx=narrow?pad+icoW:W-pad-pbS-8-mw;
  const a=Math.min(1,G.alert);
  panelBox(c,mx-icoW,my-3,mw+icoW+6,mh+6,8,a>.7?'rgba(255,90,80,.8)':undefined);
  icon(c,'eye',mx-Math.round(13*U),my+mh/2,Math.round(17*U),a<.5?'#7be08a':a<.8?'#f0b44c':'#ff5a4a');
  c.fillStyle='rgba(0,0,0,.45)';rr(c,mx,my+mh*.22,mw,mh*.56,4);c.fill();
  const gcol=c.createLinearGradient(mx,0,mx+mw,0);gcol.addColorStop(0,'#5bd078');gcol.addColorStop(.55,'#f0b44c');gcol.addColorStop(1,'#ff4a3a');
  c.save();rr(c,mx,my+mh*.22,mw,mh*.56,4);c.clip();c.fillStyle=gcol;c.fillRect(mx,my+mh*.22,mw*a,mh*.56);
  c.fillStyle='rgba(255,255,255,.2)';c.fillRect(mx,my+mh*.22,mw*a,mh*.18);c.restore();
  c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=1;for(let i=1;i<4;i++){c.beginPath();c.moveTo(mx+mw*i/4,my+mh*.22);c.lineTo(mx+mw*i/4,my+mh*.78);c.stroke();}
  // --- minimap ---
  let rightBottom=my+mh+10;
  if(settings.minimap){
    const maxW=Math.round(narrow?clamp(W*.26,72,110):clamp(W*.17,84,150)),asp=G.gw/G.gh;
    let mmw=maxW,mmh=mmw/asp;if(mmh>H*.2){mmh=H*.2;mmw=mmh*asp;}
    const mmx=W-pad-mmw-4,mmy=narrow?topBottom+10:pad+pbS+14;
    drawMinimap(mmx,mmy,mmw,mmh);rightBottom=mmy+mmh+8;
    HIT.push({x:mmx-4,y:mmy-4,w:mmw+8,h:mmh+8,fn:()=>{settings.minimap=false;saveSettings();}});
  }
  // --- boss bar ---
  let cy=Math.max(topBottom,pad+pbS)+8;
  if(narrow)cy=Math.max(topBottom,rightBottom)+2;
  const B=G.boss;
  if(B&&!B.dead){
    const wide=W>=720,bwi=wide?Math.min(340*U,W*.34):Math.min(W-pad*2,300),bxi=W/2-bwi/2;
    const byi=wide?pad:Math.max(topBottom,rightBottom)+2,bh=Math.round(30*U);
    panelBox(c,bxi,byi,bwi,bh,8,'rgba(224,80,80,.6)');
    c.fillStyle='#eadfd0';c.font='bold '+Math.round(fs*.9)+'px '+HEAD;c.textAlign='center';
    c.fillText(B.kind==='candle'?'THE CANDLEMAKER':'THE BELL-WARDEN',W/2,byi+Math.round(12*U));
    const hbw=bwi-18;c.fillStyle='rgba(0,0,0,.5)';rr(c,bxi+9,byi+Math.round(17*U),hbw,Math.round(7*U),3);c.fill();
    const shielded=B.kind==='candle'&&G.candlesLit>0;
    c.fillStyle=shielded?'#e0b040':'#d03a3a';rr(c,bxi+9,byi+Math.round(17*U),Math.max(0,hbw*B.hp/B.maxhp),Math.round(7*U),3);c.fill();
    c.textAlign='left';
    if(!wide)cy=byi+bh+6;
    else cy=Math.max(cy,byi+bh+6);
  } else if(W<720)cy=Math.max(topBottom,rightBottom)+2;
  // --- toasts ---
  c.save();c.translate(acx-W/2,0);
  c.textAlign='center';
  let ty=cy;
  const maxT=G.loreCard?0:(narrow||(touchLand&&H<460))?1:2;
  for(const t of maxT?G.toasts.slice(-maxT):[]){
    const k=Math.min(1,(t.t0-t.t)/.3,t.t/.4),w=Math.min(aw-pad*2,Math.max(220*U,360*U));
    c.globalAlpha=k;
    c.font='bold '+Math.round(fs*1.1)+'px '+HEAD;
    const subLines=t.sub?(c.font=fs+'px '+BODY,wrapText(c,t.sub,w-24)):[];
    const hh=Math.round(fs*1.6+subLines.length*fs*1.3+12);
    panelBox(c,W/2-w/2,ty+(1-k)*-8,w,hh,8,t.col);
    c.fillStyle=t.col;c.font='bold '+Math.round(fs*1.1)+'px '+HEAD;c.fillText(t.title,W/2,ty+(1-k)*-8+fs*1.5);
    c.fillStyle='#eadfd0';c.font=fs+'px '+BODY;
    subLines.forEach((l,i)=>c.fillText(l,W/2,ty+(1-k)*-8+fs*1.5+(i+1)*fs*1.3));
    ty+=hh+6;c.globalAlpha=1;
  }
  c.textAlign='left';
  // --- desktop ability bar ---
  let barTop=H-pad;
  if(!V.coarse){
    const s=Math.round(46*U),gap=Math.round(6*U),by=H-pad-s;
    barTop=by-6;
    const wr=G.active==='wren';
    let bx=pad;
    const slot=(label,key,iconName,col,count,enabled,onClick,wide,cd)=>{
      const w=wide?s*1.0:s;
      panelBox(c,bx,by,w,s,7,enabled?col:'rgba(120,110,130,.4)');
      icon(c,iconName,bx+w/2,by+s*.42,s*.46,enabled?col:'#8a8095',!enabled);
      c.fillStyle=enabled?'#eadfd0':'#8a8095';c.font='bold '+Math.round(fs*.78)+'px '+HEAD;c.textAlign='center';
      c.fillText(key,bx+w/2,by+s-5);
      if(count!=null){c.fillStyle=enabled?'#f0b44c':'#8a8095';c.font='bold '+Math.round(fs*.92)+'px '+HEAD;c.textAlign='right';c.fillText(String(count),bx+w-5,by+fs);}
      if(cd>0){c.fillStyle='rgba(8,5,12,.72)';rr(c,bx,by,w,s*cd,7);c.fill();}
      c.textAlign='left';
      if(onClick)HIT.push({x:bx,y:by,w,h:s,fn:onClick});
      bx+=w+gap;
    };
    // character chips
    const chip=(name,col,active,avail,fn)=>{
      panelBox(c,bx,by,s*1.85,s,7,active?col:'rgba(120,110,130,.35)');
      c.fillStyle=avail?col:'#5a5060';circ(c,bx+s*.42,by+s*.5,s*.26);c.fill();
      c.fillStyle='rgba(0,0,0,.35)';circ(c,bx+s*.42+3,by+s*.5+2,s*.1);c.fill();
      c.fillStyle=avail?(active?'#fff':'#bdb0c8'):'#6a6070';c.font='bold '+Math.round(fs*.85)+'px '+HEAD;
      c.fillText(name,bx+s*.78,by+s*.46);
      c.font=Math.round(fs*.78)+'px '+BODY;c.fillStyle='#9a8aa0';c.fillText(active?'active':avail?'TAB':'—',bx+s*.78,by+s*.78);
      if(fn&&avail)HIT.push({x:bx,y:by,w:s*1.85,h:s,fn});
      bx+=s*1.85+gap;
    };
    chip('Wren','#c8b4ff',wr,true,()=>{if(!wr)swapChar();});
    chip('Ashling','#ff9a4a',!wr,G.ash.on&&!G.flight||G.flight,()=>{if(wr&&G.ash.on)swapChar();});
    bx+=gap;
    if(!G.flight){
      slot('Smoke','Q','smoke','#cfd6e6',G.gad.smoke,wr&&G.gad.smoke>0,useSmoke);
      slot('Bell','R','bell','#f0b44c',G.gad.bell,wr&&G.gad.bell>0,useBell);
      slot('Flute','F','flute','#9fd8ff',G.gad.flute>50?'Song':G.gad.flute,wr&&G.gad.flute>0,useFlute);
      bx+=gap;
    }
    if(G.ash.on||G.flight){
      slot('Dash','SHIFT','dash','#ff9a4a',null,!wr&&G.dash.cd<=0,dashPress,true,G.dash.cd>0?G.dash.cd/(hasRelic('forgeheart')?1.7:2.6):0);
      slot('Fire','SPACE','fire','#ffb040',null,!wr,null,true);
    } else slot('Sneak','SHIFT','eye','#c8b4ff',null,wr,null,true);
    if(wr||G.flight)slot('Act','E','hand','#f0d080',null,true,null,true);
  }
  // --- dialogue ---
  if(G.msgT>0&&G.msg){
    const k=Math.min(1,G.msgT/.5,(4-G.msgT)/.2+.01);
    const maxw=Math.min(560*U,aw-pad*2);
    c.font=fs+'px '+BODY;
    const who=G.msg.who+':';const wwid=c.measureText(who+' ').width;
    const lines=wrapText(c,G.msg.text,maxw-pad*2-wwid*0);
    const hh=Math.round(lines.length*fs*1.35+pad*1.6);
    const wd=Math.min(maxw,Math.max(...lines.map(l=>c.measureText(l).width),c.measureText(who).width)+pad*3);
    const dx=W/2-wd/2,dy=barTop-hh-(V.coarse&&!touchLand?pad:6)-(1-k)*-10;
    c.globalAlpha=Math.min(1,k*1.4);
    panelBox(c,dx,dy,wd,hh,8,'rgba(226,170,70,.5)');
    const wc=G.msg.who==='Ashling'?'#ff9a4a':G.msg.who==='Perrin'?'#7fd0ff':G.msg.who==='Candlemaker'?'#f0d080':'#c8b4ff';
    c.fillStyle=wc;c.font='bold '+Math.round(fs*.92)+'px '+HEAD;c.fillText(G.msg.who,dx+pad,dy+fs*1.15);
    c.fillStyle='#eadfd0';c.font=fs+'px '+BODY;
    lines.forEach((l,i)=>c.fillText(l,dx+pad,dy+fs*1.15+(i+1)*fs*1.3));
    c.globalAlpha=1;
  }
  // --- lore card (sits in the toast stack so it never covers the action) ---
  if(G.loreCard){
    const lc=G.loreCard,k=Math.min(1,(lc.t0-lc.t)/.4,lc.t/.5);
    const w=Math.min(aw-pad*2,Math.round(400*U));c.font='italic '+fs+'px '+BODY;
    const lines=wrapText(c,lc.text,w-pad*2.4),hh=Math.round(fs*2.3+lines.length*fs*1.35+pad*.9);
    const x=W/2-w/2,y=ty+(1-k)*-10;
    c.globalAlpha=k;
    const g=c.createLinearGradient(0,y,0,y+hh);g.addColorStop(0,'rgba(66,50,32,.96)');g.addColorStop(1,'rgba(38,28,20,.96)');
    c.save();c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=14;c.fillStyle=g;rr(c,x,y,w,hh,6);c.fill();c.restore();
    c.strokeStyle='rgba(224,190,120,.7)';c.lineWidth=1;rr(c,x+.5,y+.5,w-1,hh-1,6);c.stroke();
    c.textAlign='center';c.fillStyle='#e8c878';c.font='bold '+Math.round(fs*1.05)+'px '+HEAD;c.fillText(lc.title,W/2,y+fs*1.5);
    c.fillStyle='#e8dcc0';c.font='italic '+fs+'px '+BODY;
    lines.forEach((l,i)=>c.fillText(l,W/2,y+fs*1.5+(i+1)*fs*1.35));
    c.fillStyle='#8a7a60';c.font=Math.round(fs*.74)+'px '+BODY;c.fillText('Codex updated  -  tap to dismiss',W/2,y+hh-pad*.45);
    c.textAlign='left';c.globalAlpha=1;
    HIT.push({x,y,w,h:hh,fn:()=>{G.loreCard=null;}});
  }
  c.restore();
  // --- mission intro card ---
  if(G.intro>0){
    const t=3.2-G.intro,k=Math.min(1,t/.6,G.intro/.8);
    c.globalAlpha=k;
    const bh=Math.round(96*U),by=H*.34-bh/2;
    const g=c.createLinearGradient(0,by,W,by);g.addColorStop(0,'rgba(8,5,12,0)');g.addColorStop(.2,'rgba(8,5,12,.82)');g.addColorStop(.8,'rgba(8,5,12,.82)');g.addColorStop(1,'rgba(8,5,12,0)');
    c.fillStyle=g;c.fillRect(0,by,W,bh);
    c.textAlign='center';
    c.fillStyle='#b8a0c8';c.font=Math.round(fs*.95)+'px '+HEAD;c.fillText('MISSION '+(lvl+1)+'  -  '+G.d.house.toUpperCase(),W/2,by+bh*.30);
    c.fillStyle='#f0c060';c.font='bold '+Math.round(Math.min(40*U,W/12))+'px '+HEAD;c.fillText(G.d.name,W/2,by+bh*.68);
    c.strokeStyle='rgba(240,180,76,.7)';c.lineWidth=1;const lw=Math.min(W*.4,220);c.beginPath();c.moveTo(W/2-lw,by+bh*.82);c.lineTo(W/2+lw,by+bh*.82);c.stroke();
    c.textAlign='left';c.globalAlpha=1;
  }
}

/* ---------- animated title scene (screen space) ---------- */
const SCN={stars:null,peaks:null,dragon:{t:-6},ember:0};
function sceneInit(){
  const r=mulberry(77);
  SCN.stars=Array.from({length:130},()=>({x:r(),y:r()*.62,s:r()*1.4+.3,ph:r()*6}));
  const mk=(n,amp,rough)=>{const a=[];let v=.5;for(let i=0;i<=n;i++){v+= (r()-.5)*rough;v=clamp(v,.1,.95);a.push(v*amp);}return a;};
  SCN.peaks=[mk(26,1,.5),mk(30,1,.42),mk(36,1,.34)];
}
function drawScene(dt,variant){
  if(!SCN.stars)sceneInit();
  const c=ctx,W=V.w,H=V.h,t=performance.now()/1000;
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  const hz=H*.80;
  const sky=c.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#05030c');sky.addColorStop(.45,'#1a0f2e');sky.addColorStop(.72,'#5a2038');sky.addColorStop(.88,'#c4552a');sky.addColorStop(1,'#f09040');
  c.fillStyle=sky;c.fillRect(0,0,W,H);
  for(const s of SCN.stars){c.globalAlpha=.4+.6*Math.abs(Math.sin(t*(.6+s.s*.3)+s.ph));c.fillStyle='#fff';c.fillRect(s.x*W,s.y*H,s.s,s.s);}
  c.globalAlpha=1;
  // moon
  const mx=W*(W>H?.9:.8),my=H*(W>H?.15:.22),mr=Math.min(W,H)*.06;
  let g=c.createRadialGradient(mx,my,mr*.8,mx,my,mr*5);g.addColorStop(0,'rgba(255,230,190,.35)');g.addColorStop(1,'rgba(255,230,190,0)');c.fillStyle=g;c.fillRect(mx-mr*5,my-mr*5,mr*10,mr*10);
  g=c.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);g.addColorStop(0,'#fff6e0');g.addColorStop(1,'#e8c890');c.fillStyle=g;circ(c,mx,my,mr);c.fill();
  c.fillStyle='rgba(150,110,70,.25)';circ(c,mx-mr*.3,my+mr*.1,mr*.22);c.fill();circ(c,mx+mr*.35,my-mr*.25,mr*.15);c.fill();circ(c,mx+mr*.1,my+mr*.45,mr*.12);c.fill();
  // far mountains (parallax)
  const layers=[['#2a1530',.16,.9],['#1a0e24',.12,1.4],['#0d0616',.09,2.2]];
  layers.forEach((ly,li)=>{
    const pk=SCN.peaks[li];c.fillStyle=ly[0];c.beginPath();c.moveTo(-10,hz+8);
    const off=(t*ly[2]*.5)%1;
    pk.forEach((v,i)=>{const x=(i/(pk.length-1))*(W+80)-40;c.lineTo(x,hz-v*H*ly[1]*1.2-li*4);});
    c.lineTo(W+40,hz+8);c.closePath();c.fill();
  });
  // castle silhouette
  const cs=Math.min(H/560,W/640),cx=W*(W>H?.3:.5),cb=hz+6;
  c.fillStyle='#07040c';
  const tower=(x,w,h,roof)=>{c.fillRect(cx+x*cs,cb-h*cs,w*cs,h*cs);
    if(roof){c.beginPath();c.moveTo(cx+(x-4)*cs,cb-h*cs);c.lineTo(cx+(x+w/2)*cs,cb-(h+roof)*cs);c.lineTo(cx+(x+w+4)*cs,cb-h*cs);c.fill();}
    else for(let i=0;i<w/8;i++)c.fillRect(cx+(x+i*8)*cs,cb-(h+6)*cs,5*cs,6*cs);};
  tower(-150,300,70,0);tower(-60,120,150,0);tower(-175,42,150,34);tower(133,42,168,40);tower(-12,34,230,52);
  tower(-100,22,115,26);tower(78,22,128,30);
  // lit windows
  const win=(x,y)=>{c.fillStyle='rgba(255,'+(170+Math.sin(t*5+x)*30|0)+',80,'+(.7+.3*Math.sin(t*3+y))+')';c.fillRect(cx+x*cs,cb-y*cs,4*cs,7*cs);};
  win(-5,170);win(3,130);win(-46,110);win(-166,100);win(144,120);win(146,80);win(-18,50);win(20,45);win(-92,70);win(88,80);
  // beacon fire on top tower
  const bx=cx+5*cs,by_=cb-(230+52+8)*cs;
  g=c.createRadialGradient(bx,by_,0,bx,by_,90*cs);g.addColorStop(0,'rgba(255,170,70,.9)');g.addColorStop(1,'rgba(255,100,30,0)');
  c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(bx-90*cs,by_-90*cs,180*cs,180*cs);c.globalCompositeOperation='source-over';
  c.fillStyle='#ffb040';c.beginPath();c.moveTo(bx,by_-12*cs-Math.sin(t*12)*2);c.quadraticCurveTo(bx+6*cs,by_,bx,by_+4*cs);c.quadraticCurveTo(bx-6*cs,by_,bx,by_-12*cs-Math.sin(t*12)*2);c.fill();
  // foreground hills
  c.fillStyle='#050209';c.beginPath();c.moveTo(0,H);c.lineTo(0,hz+22);
  for(let i=0;i<=20;i++){const x=i/20*W;c.lineTo(x,hz+18+Math.sin(i*.9)*10+Math.sin(i*2.1)*5);}
  c.lineTo(W,H);c.closePath();c.fill();
  // dragon silhouette crossing
  const D=SCN.dragon;D.t+=dt;if(D.t>16)D.t=-4;
  if(D.t>0&&D.t<10){
    const k=D.t/10,dx=-60+k*(W+120),dy=H*.34+Math.sin(k*5)*H*.06-k*H*.1,fl=Math.sin(t*9)*10;
    const ds=Math.min(W,H)/520;
    c.save();c.translate(dx,dy);c.scale(ds,ds);c.rotate(-.14+Math.sin(k*5)*.1);
    c.fillStyle='#050209';
    c.beginPath();c.moveTo(14,0);c.lineTo(8,-4);c.lineTo(-6,-3);c.lineTo(-30,2);c.lineTo(-44,0);c.lineTo(-30,4);c.lineTo(-6,4);c.lineTo(8,3);c.closePath();c.fill();
    for(const s of[-1,1]){c.beginPath();c.moveTo(0,s*3);c.lineTo(-10,s*(26+fl*s*-.2));c.lineTo(-30,s*(18+fl*.4));c.lineTo(-18,s*(10));c.lineTo(-8,s*4);c.closePath();c.fill();}
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,140,50,.55)';circ(c,16,0,3);c.fill();c.fillStyle='rgba(255,170,70,.25)';circ(c,-40,0,6);c.fill();c.globalCompositeOperation='source-over';
    c.restore();
  }
  // embers rising
  SCN.ember+=dt;
  while(SCN.ember>.04&&PT.length<Q.maxP*.8){SCN.ember-=.04;
    pt(Math.random()*W,H+8,(Math.random()-.4)*24,-30-Math.random()*60,4+Math.random()*4,.8+Math.random()*2,Math.random()<.5?'#ff9a3a':'#ffd27a',{add:true});}
  if(SCN.ember>1)SCN.ember=0;
  c.globalCompositeOperation='lighter';
  for(const p of PT){const a=Math.max(0,p.l/p.m);c.globalAlpha=a*.9;c.fillStyle=p.c;circ(c,p.x,p.y,p.s*(.4+a*.6));c.fill();}
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
  // fog bands
  for(let i=0;i<3;i++){
    const fy=hz-10+i*H*.05,fx=((t*(8+i*5)+i*300)%(W+400))-200;
    const gg=c.createRadialGradient(fx,fy,10,fx,fy,W*.5);gg.addColorStop(0,'rgba(120,90,130,.14)');gg.addColorStop(1,'rgba(120,90,130,0)');
    c.fillStyle=gg;c.fillRect(0,fy-H*.2,W,H*.4);
  }
  // vignette
  g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.4,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');
  c.fillStyle=g;c.fillRect(0,0,W,H);
}
