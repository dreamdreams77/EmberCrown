/* EMBERCROWN - Ember art for the rest of the bestiary and the two bosses.
   Ashwisp, Hollow Husk, Pyre Mite, Hollow Chanter, the Ashen Cantor, the Bell-Warden and the Candlemaker are drawn from
   assets/ember/foe_<kind>.png and boss_<kind>.png (tools/ember_art/build_foes.py), animated from their live AI state.
   Telegraphs, orbs, shockwaves, health bars, the Candlemaker's shield and candles stay with the combat code / overlays.
   Active wherever Ember art is (EM.on()); falls back to the previous art per figure until its sheet has loaded. */
'use strict';
const EMF=(function(){
  const M=EM.M,IMG={},ok={};
  const NAMES=['foe_wisp','foe_husk','foe_mite','foe_warder','foe_cantor','boss_warden','boss_candle'];
  for(const n of NAMES){const i=new Image();i.onload=()=>{ok[n]=true;if(typeof G!=='undefined'&&G)G.dirty=true;};i.onerror=()=>{};i.src='assets/ember/'+n+'.png';IMG[n]=i;}
  function ready(n){return !!ok[n]&&!!M[n];}
  const SIL=new Map();
  function sil(name,sx,sy,w,h){
    const k=name+sx+','+sy;let s=SIL.get(k);
    if(!s){if(SIL.size>200)SIL.clear();s=document.createElement('canvas');s.width=w;s.height=h;const g=s.getContext('2d');
      g.drawImage(IMG[name],sx,sy,w,h,0,0,w,h);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,w,h);SIL.set(k,s);}
    return s;
  }
  // facing -> view row: 0 down, 1 up, 2 left (right = left mirrored)
  function view(f){const x=Math.cos(f),y=Math.sin(f);if(Math.abs(x)>Math.abs(y))return{v:2,flip:x>0};return{v:y>0?0:1,flip:false};}
  function blit(name,anim,f,fr,x,y,o){
    o=o||{};const m=M[name],c=ctx;if(!m||!ok[name])return false;
    const ai=m.anims.indexOf(anim);if(ai<0)return false;fr=Math.max(0,Math.min(m.counts[anim]-1,fr|0));
    const V_=o.v||view(f),fw=m.fw,fh=m.fh,sx=fr*fw,sy=(ai*3+V_.v)*fh,sc=o.sc||1;
    const X=Math.round(x-fw/2*sc),Y=Math.round(y+(o.drop==null?6:o.drop)-m.foot*sc);
    const sm=c.imageSmoothingEnabled,ga=c.globalAlpha;c.imageSmoothingEnabled=false;if(o.alpha!=null)c.globalAlpha=o.alpha;
    c.save();c.translate(X,Y);if(V_.flip){c.translate(fw*sc,0);c.scale(-1,1);}c.scale(sc,sc);
    c.drawImage(IMG[name],sx,sy,fw,fh,0,0,fw,fh);
    if(o.flash){c.globalAlpha=(o.alpha==null?1:o.alpha)*.85;c.drawImage(sil(name,sx,sy,fw,fh),0,0);}
    c.restore();c.globalAlpha=ga;c.imageSmoothingEnabled=sm;return true;
  }
  const walk=(t,rate,n)=>Math.floor(t*rate)%(n||4);
  function stars(x,y){const c=ctx;for(let i=0;i<3;i++){const a=G.time*4+i*2.09;c.fillStyle='#ffe27a';c.fillRect(Math.round(x+Math.cos(a)*9)-1,Math.round(y+Math.sin(a)*3)-1,3,3);}}
  /* ---- foes ---- */
  const KIND={wisp:'foe_wisp',husk:'foe_husk',mite:'foe_mite',warder:'foe_warder',cantor:'foe_cantor'};
  function foe(f){
    const name=KIND[f.kind];if(!name||!ready(name))return false;
    const t=G.time,age=f.age||0,flash=f.hitT>0,st=f.state;let al=1,sc=1;
    if(st==='spawn'){const u=1-f.t/.7;al=Math.max(0,Math.min(1,u));sc=.5+.5*al;}
    let anim,fr=0,dead=st==='dead';
    if(dead){anim='dead';fr=Math.min(2,(1-(f.t||0)/.5)*3);al=Math.max(0,Math.min(1,(f.t||0)/.5));}
    const hurt=flash||st==='recover'||st==='stagger';
    switch(f.kind){
      case'wisp':
        if(!dead){anim=st==='charge'?'charge':hurt?'hurt':'hover';fr=anim==='hover'?walk(age+(f.ph||0),6):0;}
        if(!blit(name,anim,vfa(f),fr,f.x,f.y-8+(f.flyH||0),{alpha:al,sc,flash,drop:12}))return false;
        break;
      case'husk':
        if(!dead){anim=st==='wind'?'wind':st==='recover'?'recover':flash?'hurt':'walk';fr=anim==='walk'?walk(age,st==='chase'?7:4):0;}
        shadowAt(f.x,f.y+8,15,5,.4);
        if(!blit(name,anim,vfa(f),fr,f.x,f.y,{alpha:al,sc,flash,drop:10}))return false;
        break;
      case'mite':
        if(!dead){anim=st==='fuse'?'fuse':flash?'hurt':'walk';fr=anim==='fuse'?Math.floor(t*(14+(1-(f.t||0)/.8)*24))%2:walk(age,14);}
        shadowAt(f.x,f.y+4,7,3,.35);
        if(!blit(name,anim,vfa(f),fr,f.x,f.y,{alpha:al,sc,flash,drop:6}))return false;
        break;
      case'warder':
        if(!dead){anim=st==='cast'?'cast':hurt?'hurt':'walk';fr=anim==='walk'?walk(age,5):0;}
        shadowAt(f.x,f.y+6,10,4,.35);
        if(!blit(name,anim,vfa(f),fr,f.x,f.y,{alpha:al,sc,flash,drop:8}))return false;
        break;
      case'cantor':{
        const sing=st==='swWind'||st==='choir'||st==='hymn'||st==='sweep';
        if(!dead){anim=sing?'sing':st==='recover'?'recover':flash?'hurt':'walk';fr=anim==='walk'?walk(age,4):0;}
        shadowAt(f.x,f.y+8,16,6,.4);
        if(!blit(name,anim,vfa(f),fr,f.x,f.y,{alpha:al,sc,flash,drop:10}))return false;
        if(sing&&!dead){const c=ctx;c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,220,140,'+(.18+.12*Math.sin(t*12))+')';circ(c,f.x,f.y-36,12);c.fill();c.globalCompositeOperation='source-over';}
        break;}
      default:return false;
    }
    if(!dead&&(st==='recover'||st==='stagger'))stars(f.x,f.y-(f.kind==='husk'?44:f.kind==='cantor'?56:26));
    return true;
  }
  /* ---- bosses ---- */
  // the fight's timing cues, as the drawn bosses paint them (actors.js drawWarden / drawCandlemaker)
  function wardenCues(g,lift){
    const c=ctx,t=G.time,st=g.st,f=vfa(g);
    c.save();c.translate(g.x,g.y-lift);c.rotate(f);
    if(st==='windCharge'){const k=(t*5)%1;c.fillStyle='rgba(255,90,60,'+(.55-k*.3)+')';for(let i=0;i<3;i++){const x=26+i*13+k*6;poly(c,[x,-9,x+7,0,x,9,x+3,0]);c.fill();}}
    if(st==='windLeap'){const k=Math.min(1,1-g.t/(g.p2?.75:.95));c.strokeStyle='rgba(255,220,150,'+(.3+k*.5)+')';c.lineWidth=2;circ(c,0,0,44-k*22);c.stroke();}
    if(st==='windSlam'){const slam=1-g.t/(g.p2?.7:.9);c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,200,110,'+(.25+slam*.5)+')';c.lineWidth=4;c.beginPath();c.arc(4,17,30,-slam*2.1,0);c.stroke();c.globalCompositeOperation='source-over';}
    c.restore();
  }
  function wardenToll(g,lift){ // the bell rings out from his back while it tolls
    const st=g.st,tollP=st==='toll'?Math.sin((1-g.t/.95)*Math.PI):(g.toll>0?Math.sin((1-g.toll/.9)*Math.PI):0);if(!(tollP>0))return;
    const c=ctx,x=g.x,y=g.y-lift-34;
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(190,140,255,'+(.16+tollP*.3)+')';circ(c,x,y,13+tollP*5);c.fill();
    c.strokeStyle='rgba(255,236,170,'+(1-tollP*.5)+')';c.lineWidth=2.4;circ(c,x,y,14+tollP*16);c.stroke();c.lineWidth=1.2;circ(c,x,y,14+tollP*28);c.stroke();
    c.globalCompositeOperation='source-over';
  }
  function candleFloor(g){
    const c=ctx,t=G.time,st=g.st;
    if(st==='ringWind'){const k=(t*2.2)%1;c.strokeStyle='rgba(255,170,70,'+(.75-k*.5)+')';c.lineWidth=2.4;c.beginPath();c.ellipse(g.x,g.y+10,46-k*30,(46-k*30)*.62,0,0,6.3);c.stroke();}
    if(st==='summon'||st==='rain'){c.save();c.translate(g.x,g.y+10);c.scale(1,.62);c.rotate(t*1.4);c.strokeStyle='rgba(255,190,90,.7)';c.lineWidth=1.8;circ(c,0,0,26);c.stroke();poly(c,[26,0,-13,22.5,-13,-22.5]);c.stroke();poly(c,[-26,0,13,22.5,13,-22.5]);c.stroke();c.restore();}
    if(st==='slashWind'){const k=1-g.t/.42;c.save();c.translate(g.x,g.y-20);c.rotate(vfa(g));c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,170,70,'+(.16+k*.3)+')';c.beginPath();c.moveTo(4,0);c.arc(4,0,40,-.9,.9);c.closePath();c.fill();c.restore();}
  }
  function candleOrbit(g,hov,front){ // the orbiting candles: faster and wider with each phase
    const c=ctx,t=G.time,p=g.p3?2:g.p2?1:0,wind=g.st==='volleyWind'||g.st==='ringWind',n=6,R=24+p*3+(wind?4:0),spd=.6+p*.5;
    for(let i=0;i<n;i++){const a=i/n*6.283+t*spd,s=Math.sin(a);if((s>0)!==front)continue;
      const x=Math.round(g.x+Math.cos(a)*R),y=Math.round(g.y-22+hov+s*R*.45);
      c.fillStyle='#2a1a10';c.fillRect(x-2,y-3,4,7);c.fillStyle='#e8dcc0';c.fillRect(x-1,y-2,2,5);
      c.fillStyle='#ffb040';c.fillRect(x-1,y-5-(Math.sin(t*12+i)>0?1:0),2,2);c.fillStyle='#fff0c0';c.fillRect(x,y-5,1,1);}
  }
  function boss(g){
    const cm=g.kind==='candle',name=cm?'boss_candle':'boss_warden';if(!ready(name))return false;
    const t=G.time,st=g.st,dead=g.dead,dT=g.deathT||0,flash=g.hurt>0&&Math.floor(t*20)%2===0;
    const lift=st==='leap'?Math.sin((g.leapU||0)*Math.PI)*40:0,hov=cm&&!dead?Math.sin(t*2.4)*3-3:0;
    const moving=g._ex!=null&&Math.hypot(g.x-g._ex,g.y-g._ey)>.05;g._ex=g.x;g._ey=g.y;
    let anim,fr=0,al=1;
    // in death the remains stay where they fall (the broken bell and hammer, the wax pool), dimmed but not gone
    if(dead){anim='dead';fr=Math.min(2,dT*2.5);al=Math.max(.75,1-Math.max(0,dT-1)/1.6);}
    else if(g.stg>0||st==='stagger')anim='stagger';
    else if(cm){
      if(st==='volleyWind'||st==='ringWind'||st==='summon'||st==='rain'){anim='cast';fr=Math.floor(t*6)%2;}
      else if(st==='slashWind')anim='slash';
      else if(st==='blinkWind'){anim='float';al=.35+.3*Math.sin(t*30);}
      else{anim='float';fr=walk(t,5);}
    } else {
      if(st==='windSlam'||st==='windLeap'||st==='windCharge')anim='wind';
      else if(st==='toll'||st==='roar')anim='toll';
      else if(st==='charge'||st==='leap'){anim='charge';fr=walk(t,14);}
      else{anim='walk';fr=moving||g.eng?walk(t,6):0;}
    }
    shadowAt(g.x,g.y+10,22*(1-lift/140),8*(1-lift/140),.42-lift/200);
    if(!dead){if(cm){candleFloor(g);candleOrbit(g,hov,false);}else wardenCues(g,lift);}
    if(!blit(name,anim,vfa(g),fr,g.x,g.y-lift+hov,{alpha:al,flash,drop:cm?10:12}))return false;
    const c=ctx;
    if(!dead){
      if(cm){candleOrbit(g,hov,true);
        if(G.candlesLit>0&&g.eng){c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,190,90,'+(.3+.2*Math.sin(t*6))+')';c.lineWidth=2;
          c.beginPath();c.ellipse(g.x,g.y-24+hov,30+Math.sin(t*4)*1.5,38,0,0,6.283);c.stroke();c.globalCompositeOperation='source-over';}}
      else wardenToll(g,lift);
    }
    if(g.stg>0&&!dead)stars(g.x,g.y-(cm?64:68));
    return true;
  }
  return{foe,boss,ready,ok,NAMES};
})();
{
  const _drawFoe=drawFoe;
  drawFoe=function(f){
    if(EM.on()&&f.kind!=='cinder'&&EMF.foe(f)){
      if(typeof drawFoeOver==='function')drawFoeOver(f);   // ward ring and tether, burning, the Cantor's boss bar
      const c=ctx;if(f.hp<f.max&&f.kind!=='cantor'&&f.state!=='dead'&&f.state!=='spawn'&&typeof foeBarY==='function'){
        const y=f.y-foeBarY(f)-(f.kind==='husk'?16:f.kind==='cantor'?22:f.kind==='warder'?10:0);
        c.fillStyle='rgba(0,0,0,.55)';c.fillRect(f.x-11,y,22,3.4);c.fillStyle='#e05050';c.fillRect(f.x-10.5,y+.5,21*Math.max(0,f.hp/f.max),2.4);}
      return;
    }
    return _drawFoe(f);
  };
  const _drawBoss=drawBoss;
  drawBoss=function(g){if(EM.on()&&EMF.boss(g))return;return _drawBoss(g);};
}
