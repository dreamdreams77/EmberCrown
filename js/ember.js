/* EMBERCROWN - Ember art (vertical slice: Ashfall Keep).
   Original, purpose-drawn pixel art in place of the LPC figures: Shiloh, two kinds of Marrow guard (Pell the pikeman,
   Sergeant Gaunt), and the Cinderling. Bodies are sprite sheets (assets/ember, built by tools/ember_art); faces are a
   separate atlas drawn on top at run time, so every character can blink, squint, gape and faint.
   Wraps the draw functions the same way js/lpc.js does and leaves them untouched. Toggle: settings.ember ("Ember art").
   Active only on Ashfall Keep while pixel art is on; everything else keeps the LPC art. */
'use strict';
const EM=(function(){
  const IMG={},ok={};
  const NAMES=['shiloh','pell','gaunt','cinder','faces_shiloh','faces_pell','faces_gaunt','tiles','props','ashling'];
  for(const n of NAMES){const i=new Image();i.onload=()=>{ok[n]=true;if(typeof G!=='undefined'&&G)G.dirty=true;};i.onerror=()=>{};i.src='assets/ember/'+n+'.png';IMG[n]=i;}
  const M=typeof EMBER_META!=='undefined'?EMBER_META:{};
  function slice(){return typeof G!=='undefined'&&!!G&&!!G.d&&G.d===LEVELS[0]&&!G.d.hub&&!G.dng&&!G.flight;}
  function on(){return settings.ember!==false&&LPC.on()&&slice();}
  function ready(n){return !!ok[n]&&!!M[n.replace(/^faces_/,'')];}
  // facing angle -> view row (down,up,left) and whether to mirror
  function view(f){const x=Math.cos(f),y=Math.sin(f);if(Math.abs(x)>Math.abs(y))return x>0?{v:2,flip:true}:{v:2,flip:false};return y>0?{v:0,flip:false}:{v:1,flip:false};}
  function vname(v){return v===0?'down':v===1?'up':'left';}
  const SIL=new Map();
  function sil(name,sx,sy,w,h,col){
    const k=name+sx+','+sy+col;let s=SIL.get(k);
    if(!s){if(SIL.size>300)SIL.clear();s=document.createElement('canvas');s.width=w;s.height=h;const g=s.getContext('2d');
      g.drawImage(IMG[name],sx,sy,w,h,0,0,w,h);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,w,h);SIL.set(k,s);}
    return s;
  }
  /* draw one body frame; (x,y) is the character's world position. o: flip, alpha, line (1px outline colour), flash, mood, who (face atlas), sc */
  function blit(name,anim,vi,fr,x,y,o){
    o=o||{};const m=M[name],c=ctx;if(!m||!ok[name])return;
    const ai=m.anims.indexOf(anim);if(ai<0)return;
    const n=m.counts?m.counts[anim]:m.meta[anim].n;fr=Math.max(0,Math.min(n-1,fr|0));
    const fw=m.fw,fh=m.fh,sx=fr*fw,sy=(ai*3+vi)*fh,sc=o.sc||1;
    const X=Math.round(x-fw/2*sc),Y=Math.round(y+(o.drop===undefined?8:o.drop)-m.foot*sc);
    const sm=c.imageSmoothingEnabled,ga0=c.globalAlpha;c.imageSmoothingEnabled=false;
    if(o.alpha!=null)c.globalAlpha=o.alpha;
    c.save();c.translate(X,Y);if(o.flip){c.translate(fw*sc,0);c.scale(-1,1);}c.scale(sc,sc);
    if(o.line){const s=sil(name,sx,sy,fw,fh,o.line);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])c.drawImage(s,dx,dy);}
    c.drawImage(IMG[name],sx,sy,fw,fh,0,0,fw,fh);
    if(o.flash){c.globalAlpha=(o.alpha==null?1:o.alpha)*.85;c.drawImage(sil(name,sx,sy,fw,fh,'#ffffff'),0,0);c.globalAlpha=o.alpha==null?1:o.alpha;}
    // face, at the head anchor for this frame
    if(o.mood&&o.who&&anim!=='ko'&&vi!==1&&ok['faces_'+o.who]){
      const hd=m.meta[anim]&&m.meta[anim].head&&m.meta[anim].head[vi]&&m.meta[anim].head[vi][Math.min(fr,m.meta[anim].n-1)];
      const F=M.faces,ei=Math.max(0,F.expr.indexOf(o.mood));
      if(hd)c.drawImage(IMG['faces_'+o.who],ei*F.fw,(vi===2?1:0)*F.fh,F.fw,F.fh,hd[0]-F.fw/2,hd[1]-F.fh/2,F.fw,F.fh);
    }
    c.restore();c.globalAlpha=ga0;c.imageSmoothingEnabled=sm;
  }
  function blitBaked(name,anim,vi,fr,x,y,o){ // cinderling: faces are baked into the sheet
    o=o||{};const m=M[name],c=ctx;if(!m||!ok[name])return;
    const ai=m.anims.indexOf(anim);if(ai<0)return;fr=Math.max(0,Math.min(m.counts[anim]-1,fr|0));
    const fw=m.fw,fh=m.fh,sx=fr*fw,sy=(ai*3+vi)*fh,sc=o.sc||1;
    const X=Math.round(x-fw/2*sc),Y=Math.round(y+(o.drop===undefined?7:o.drop)-m.foot*sc);
    const sm=c.imageSmoothingEnabled,ga0=c.globalAlpha;c.imageSmoothingEnabled=false;
    if(o.alpha!=null)c.globalAlpha=o.alpha;
    c.save();c.translate(X,Y);if(o.flip){c.translate(fw*sc,0);c.scale(-1,1);}c.scale(sc,sc);
    c.drawImage(IMG[name],sx,sy,fw,fh,0,0,fw,fh);
    if(o.flash){c.globalAlpha=.8;c.drawImage(sil(name,sx,sy,fw,fh,'#ffffff'),0,0);}
    c.restore();c.globalAlpha=ga0;c.imageSmoothingEnabled=sm;
  }
  const walkFrame=ph=>Math.floor((((ph/(Math.PI*2))%1)+1)%1*6);
  function blinking(ph){return (G.time*.7+(ph||0))%3.7<.12;}
  function ring(x,y,col,a){const c=ctx;c.strokeStyle=col;c.globalAlpha=a;c.lineWidth=1;c.beginPath();c.ellipse(Math.round(x)+.5,Math.round(y+7)+.5,12,5,0,0,6.283);c.stroke();c.globalAlpha=1;}
  /* ---- Shiloh ---- */
  function heroMood(w,active,st,atk){
    if(st.death>0)return'ko';if(st.hurt>.5)return'hurt';
    if(mode==='win')return'joy';
    if(atk)return'rage';
    if(active&&G.guards&&G.guards.some(g=>g.seeing&&!g.stun))return'alarm';
    if(active&&(G.sneak||G.alert>.35))return'wary';
    if(w.rollAnim>0)return'focus';
    return blinking(.5)?'blink':'calm';
  }
  function drawShiloh(w,active){
    const sp=Math.hypot(w.vx||0,w.vy||0),mv=sp>14,f=vfa(w),V_=view(f);
    const st=typeof charState==='function'?charState(w,active):{death:0,hurt:0};
    const atk=w.atk&&w.atk.a!==undefined?w.atk:null;
    const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!st.death;
    const al=blink?.4:1;
    shadowAt(w.x,w.y+7,11,4.5,.4);
    if(active&&!st.death)ring(w.x,w.y,G.sneak?'#9a86e8':'#f3e6c4',G.sneak?.5:.35);
    const o={flip:V_.flip,alpha:al,who:'shiloh',mood:heroMood(w,active,st,atk)};
    if(st.death>0){blit('shiloh','ko',V_.v,st.death>.5?1:0,w.x,w.y+(st.death>.5?3:0),o);return;}
    if(atk){const u=1-atk.t/atk.t0;blit('shiloh','slash',V_.v,u*4.99,w.x,w.y,o);return;}
    if(w.rollAnim>0){const u=1-w.rollAnim/.3;o.alpha=.78;blit('shiloh','walk',V_.v,u*5.99,w.x,w.y+Math.sin(u*Math.PI)*-4,o);return;}
    if(st.hurt>.5){blit('shiloh','hurt',V_.v,0,w.x,w.y,o);return;}
    if(mv)blit('shiloh','walk',V_.v,walkFrame(w.ph||0),w.x,w.y,o);
    else blit('shiloh','idle',V_.v,0,w.x,w.y+(Math.sin(G.time*2.2)>.6?-.5:0),o);
  }
  /* ---- the watch ---- */
  function who(g){if(!g._who)g._who=(G.guards.indexOf(g)%2===0)?'pell':'gaunt';return g._who;} // fixed once, so removing a guard never changes anyone's face
  function drawWatch(g){
    const name=who(g),hit=G.time-(g.hitT===undefined?-9:g.hitT)<.09;
    if(g.ko&&g.stun>0){shadowAt(g.x,g.y+6,15,5,.4);blit(name,'ko',0,0,g.x,g.y+3,{who:name,flash:hit});return;}
    const moving=g._lx!=null&&Math.hypot(g.x-g._lx,g.y-g._ly)>.05;g._lx=g.x;g._ly=g.y;
    const V_=view(vfa(g));
    shadowAt(g.x,g.y+7,13,5,.4);
    let mood=guardMood(g);if((mood==='calm'||mood==='wary')&&blinking(g.ph))mood='blink';
    const line=g.seeing?'#ff5440':(g.lure||g.ret)?'#ffc060':null;
    if(g.stun>0){blit(name,'hurt',V_.v,0,g.x,g.y,{flip:V_.flip,who:name,mood:'hurt',flash:hit});return;}
    const hu=g.hopT===undefined?1:(G.time-g.hopT)/.26,hop=hu>=0&&hu<1?Math.sin(hu*Math.PI)*6:0;
    const o={flip:V_.flip,who:name,mood,line};
    if(moving)blit(name,'walk',V_.v,walkFrame(g.ph||0),g.x,g.y-hop,o);
    else blit(name,'idle',V_.v,0,g.x,g.y-hop+(Math.sin(G.time*1.8+(g.ph||0))>.7?-.5:0),o);
  }
  /* ---- the Cinderling ---- */
  function drawCinder(f){
    const t=G.time,fa=vfa(f);let al=1,sc=1;
    if(f.state==='spawn'){const u=1-f.t/.7;al=ease(u);sc=.4+.6*easeOut(u);}
    if(f.state==='dead'){const u=1-f.t/.5;al=1-u*.8;}
    const V_=view(fa),flash=f.hitT>0;
    shadowAt(f.x,f.y+5,10*sc,4,.35);
    let anim='walk',fr=Math.floor((f.age||0)*(f.state==='chase'?12:6))%4;
    if(f.state==='wind'||f.state==='charge'){anim='wind';fr=0;}
    else if(f.state==='lunge'){anim='lunge';fr=0;}
    else if(f.state==='recover'||f.state==='stagger'||flash){anim='hurt';fr=0;}
    else if(f.state==='dead'){anim='dead';fr=Math.min(2,(1-f.t/.5)*3);}
    blitBaked('cinder',anim,V_.v,fr,f.x,f.y,{flip:V_.flip,alpha:al,sc:sc,flash:flash});
    const wind=f.state==='wind'||f.state==='charge';
    const glow=wind?.9+Math.sin(t*30)*.1:.5+Math.sin(t*5+f.ph)*.2,c=ctx;
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,120,40,'+(glow*.22+(flash?.4:0))+')';circ(c,f.x,f.y-4,flash?11:13);c.fill();c.globalCompositeOperation='source-over';
  }
  /* ---- Ashling ---- */
  function drawAshling(a,active){
    const sp=Math.hypot(a.vx||0,a.vy||0),mv=sp>14,f=vfa(a),V_=view(f);
    const st=typeof charState==='function'?charState(a,active):{death:0,hurt:0};
    const blink=G.inv>0&&Math.floor(G.time*16)%2===0&&!st.death;
    const fire=G.fireOn&&active&&!st.death,dashing=G.dash&&G.dash.t>0;
    const cel=a.celebrate>0||mode==='win';
    shadowAt(a.x,a.y+7,12,5,.4);
    if(active&&!st.death)ring(a.x,a.y,fire?'#ffb060':'#ff9a50',.4);
    const hop=cel?-Math.abs(Math.sin(G.time*9))*7:0;
    let anim='idle',fr=0;
    if(st.death>0){anim='ko';}else if(st.hurt>.5||bodyFlash(a)){anim='hurt';}
    else if(fire||dashing){anim='fire';}
    else if(mv){anim='walk';fr=Math.floor(G.time*(dashing?16:9)+(a.ph||0)*.4)%4;}
    blitBaked('ashling',anim,V_.v,fr,a.x,a.y+hop,{flip:V_.flip,alpha:blink?.4:1,drop:8,flash:bodyFlash(a)});
    if(fire||dashing){const c=ctx;c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,190,90,.28)';circ(c,a.x+Math.cos(f)*8,a.y-6+Math.sin(f)*8,10);c.fill();c.globalCompositeOperation='source-over';}
  }
  function applyUI(){try{document.body.classList.toggle('ember-ui',settings.ember!==false);}catch(e){}}
  return{on,ready,blit,drawShiloh,drawWatch,drawCinder,drawAshling,view,IMG,M,ok,applyUI};
})();
{
  const _drawWren=drawWren;
  drawWren=function(w,active){if(EM.on()&&EM.ready('shiloh')&&EM.ready('faces_shiloh'))return EM.drawShiloh(w,active);return _drawWren(w,active);};
  const _drawAsh=drawAsh;
  drawAsh=function(a,active){if(EM.on()&&EM.ready('ashling'))return EM.drawAshling(a,active);return _drawAsh(a,active);};
  const _drawGuard=drawGuard;
  drawGuard=function(g){
    if(EM.on()&&EM.ready('pell')&&EM.ready('gaunt')&&!g.boss&&!g.spin&&(g.kind||'guard')==='guard')return EM.drawWatch(g);
    return _drawGuard(g);
  };
  const _drawFoe=drawFoe;
  drawFoe=function(f){
    if(EM.on()&&f.kind==='cinder'&&EM.ready('cinder')){
      const c=ctx;
      EM.drawCinder(f);
      if(f.state==='recover'||f.state==='stagger'){for(let i=0;i<3;i++){const a=G.time*4+i*2.09;c.fillStyle='#ffe27a';circ(c,f.x+Math.cos(a)*8,f.y-18+Math.sin(a)*3,1.6);c.fill();}}
      if(f.hp<f.max&&f.state!=='dead'&&f.state!=='spawn'){c.fillStyle='rgba(0,0,0,.55)';c.fillRect(f.x-11,f.y-foeBarY(f),22,3.4);c.fillStyle='#e05050';c.fillRect(f.x-10.5,f.y-foeBarY(f)+.5,21*Math.max(0,f.hp)/f.max,2.4);}
      return;
    }
    return _drawFoe(f);
  };
}

/* ---- Ashfall Keep: floors, walls, furniture, torches ---- */
EM.env=(function(){
  const IMG=EM.IMG,M=EM.M;
  const T_=()=>M.tiles;
  function hash(x,y,s){let h=(x*374761393+y*668265263+(s||0)*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
  function ready(){return EM.on()&&!!EM.ok.tiles&&!!T_();}
  function tile(c,name,x,y){
    const t=T_()[name],sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.tiles,t[0],t[1],32,32,x*T,y*T,T,T);c.imageSmoothingEnabled=sm;
  }
  function isWall(x,y){const r=G.grid[y];return!r||r[x]==='#'||r[x]===' '||r[x]===undefined;}
  function shade(c,x,y){
    const rm=G.rooms&&G.roomOf&&G.roomOf[y]&&G.roomOf[y][x]>=0?G.rooms[G.roomOf[y][x]]:null;
    if(rm&&rm.tint&&rm.tint<1){c.fillStyle='rgba(0,0,0,'+((1-rm.tint)*1.2).toFixed(3)+')';c.fillRect(x*T,y*T,T,T);}
    if(G.state==='ruin'){c.fillStyle='rgba(26,18,12,.38)';c.fillRect(x*T,y*T,T,T);}
  }
  function floor(c,x,y){
    const z=typeof TILES!=='undefined'&&TILES.zone?TILES.zone(x,y):'';if(z==='water'||z==='court')return false;
    const h=hash(x,y,1),v=h<.45?3:Math.floor((h-.45)/.55*3);
    tile(c,'floor'+v,x,y);shade(c,x,y);return true;
  }
  function wall(c,x,y){
    if(isWall(x,y+1)||y+1>=G.gh){tile(c,'top'+((x+y)&1),x,y);return;}
    const h=hash(x,y,2);let k='face_plain';
    if(h<.10)k='face_niche';else if(h<.19)k='face_slit';else k=['face_plain','face_plain2','face_plain3'][Math.floor(hash(x,y,3)*3)];
    tile(c,k,x,y);
    c.fillStyle='rgba(0,0,0,.30)';c.fillRect(x*T,y*T+T-3,T,3);
    if(G.state==='ruin'){c.fillStyle='rgba(26,18,12,.35)';c.fillRect(x*T,y*T,T,T);}
  }
  // props: stamped by the middle of the bottom edge of their footprint
  function sprite(c,n,cx,by){
    const a=M.props[n];if(!a)return false;const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.fillStyle='rgba(0,0,0,.26)';c.beginPath();c.ellipse(Math.round(cx),Math.round(by-1),a[2]*.42,3.4,0,0,6.283);c.fill();
    c.drawImage(IMG.props,a[0],a[1],a[2],a[3],Math.round(cx-a[2]/2),Math.round(by-a[3]),a[2],a[3]);c.imageSmoothingEnabled=sm;return true;
  }
  function prop(c,p){
    if(!EM.on()||!EM.ok.props||!M.props)return false;
    const px=p.x*T,py=p.y*T,cx=px+p.w*T/2,by=py+p.h*T-2,v=Math.floor(mulberry(p.seed+11)()*100);
    switch(p.type){
      case'crate':return sprite(c,v%3===0?'barrel':v%2?'crate':'crate_b',cx,by);
      case'crates':return sprite(c,'crates',cx,by);
      case'table':return sprite(c,'table',cx,by+2);
      case'bench':return sprite(c,'bench',cx,by);
      case'cot':return sprite(c,'cot',cx,by);
      case'weaponrack':return sprite(c,'weaponrack',cx,by);
      case'sacks':return sprite(c,'sacks',cx,by);
      case'statue':return sprite(c,'statue',cx,by);
      case'sarcophagus':return sprite(c,'sarcophagus',cx,by);
      case'barrels':return sprite(c,'barrel',cx,by);
    }
    return false;
  }
  function torch(tr){
    if(!EM.on()||!EM.ok.props||!M.props||tr.pipe||tr.small)return false;
    const c=ctx,t=G.time,n=tr.out?'torchOff':'torch'+(Math.floor(t*8+tr.ph)%3),a=M.props[n];if(!a)return false;
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.props,a[0],a[1],a[2],a[3],Math.round(tr.x-a[2]/2),Math.round(tr.y-18),a[2],a[3]);c.imageSmoothingEnabled=sm;
    if(!tr.out&&Math.random()<.02*Q.amb)pt(tr.x,tr.y-10,(Math.random()-.5)*8,-18-Math.random()*10,.9,.9,'#ffb040',{add:true});
    return true;
  }
  return{ready,floor,wall,prop,torch};
})();
if(typeof TILES!=='undefined'){
  const _floor=TILES.floor,_wall=TILES.wall;
  TILES.floor=function(c,x,y,p,fs,th){if(EM.env.ready()&&!G.flight&&EM.env.floor(c,x,y))return true;return _floor.apply(this,arguments);};
  TILES.wall=function(c,x,y,p,flight){const r=_wall.apply(this,arguments);if(EM.env.ready()&&!flight)EM.env.wall(c,x,y);return r;};
}
{
  const _drawProp=drawProp;
  drawProp=function(c,p,th,ruin){if(EM.env.ready()&&EM.env.prop(c,p))return;return _drawProp(c,p,th,ruin);};
  const _drawFlames=drawFlames;
  drawFlames=function(){
    if(!EM.on()||!EM.ok.props)return _drawFlames();
    const hold=G.torches;
    // our torches first; anything we do not draw (pipes, small fires) goes through the original
    const rest=[];for(const tr of hold||[])if(!EM.env.torch(tr))rest.push(tr);
    G.torches=rest;try{_drawFlames();}finally{G.torches=hold;}
  };
}

/* decor: skulls, bones, webs, chains and banners come from the Ember set in this room */
{
  const IMG=EM.IMG,M=EM.M;
  if(typeof LPCP!=='undefined'){
    const _at=LPCP.at;
    LPCP.at=function(c,n,x,y,flip){
      if(EM.on()&&EM.ok.props&&M.props){
        const k=n==='bone'?(flip?'bone1':'bone0'):n,a=M.props[k];
        if(a&&(n==='skull'||n==='bone'||n==='web'||n==='chain')){
          const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;x=Math.round(x+(n==='chain'?9:0));y=Math.round(y);
          if(n==='web'&&flip){c.save();c.translate(x+a[2],y);c.scale(-1,1);c.drawImage(IMG.props,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);c.restore();}
          else c.drawImage(IMG.props,a[0],a[1],a[2],a[3],x,y,a[2],a[3]);
          c.imageSmoothingEnabled=sm;return;
        }
      }
      return _at.apply(this,arguments);
    };
  }
  if(typeof TILES!=='undefined'&&TILES.bannerSprite){
    const _bs=TILES.bannerSprite;let cv=null;
    TILES.bannerSprite=function(k){
      if(EM.on()&&EM.ok.props&&M.props&&M.props.banner){
        if(!cv){const a=M.props.banner;cv=document.createElement('canvas');cv.width=a[2];cv.height=a[3];const g=cv.getContext('2d');g.drawImage(IMG.props,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);}
        return cv;
      }
      return _bs.apply(this,arguments);
    };
  }
}

/* ---- HUD panels: the canvas HUD, bubbles and prompts draw through panelBox, so one wrapper restyles them all ---- */
{
  EM.applyUI();
  const _panelBox=panelBox;
  const grain=(()=>{const g=document.createElement('canvas');g.width=g.height=48;const x=g.getContext('2d');
    for(let i=0;i<260;i++){x.fillStyle='rgba('+(i%3?'255,235,200':'0,0,0')+','+(.05+((i*7)%5)*.012)+')';x.fillRect((i*37)%48,(i*53)%48,1,1);}return g;})();
  let pat=null;
  panelBox=function(c,x,y,w,h,r,glow){
    if(settings.ember===false)return _panelBox(c,x,y,w,h,r,glow);
    x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);const k=Math.min(4,Math.max(2,Math.round(Math.min(w,h)/10)));
    const path=(ix,iy,iw,ih,ik)=>{c.beginPath();c.moveTo(ix+ik,iy);c.lineTo(ix+iw-ik,iy);c.lineTo(ix+iw,iy+ik);c.lineTo(ix+iw,iy+ih-ik);c.lineTo(ix+iw-ik,iy+ih);c.lineTo(ix+ik,iy+ih);c.lineTo(ix,iy+ih-ik);c.lineTo(ix,iy+ik);c.closePath();};
    c.save();
    c.fillStyle='rgba(8,4,16,.55)';path(x,y+3,w,h,k);c.fill();                       // hard pixel shadow
    const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(46,32,70,.94)');g.addColorStop(1,'rgba(24,14,40,.94)');
    c.fillStyle=g;path(x,y,w,h,k);c.fill();
    c.save();path(x,y,w,h,k);c.clip();c.globalAlpha=.5;c.fillStyle=pat||(pat=c.createPattern(grain,'repeat'));c.fillRect(x,y,w,h);c.restore();
    c.strokeStyle='#0e0818';c.lineWidth=2;path(x,y,w,h,k);c.stroke();                 // dark outer edge
    c.strokeStyle=glow||'rgba(226,172,72,.75)';c.lineWidth=1;path(x+2.5,y+2.5,w-5,h-5,Math.max(1,k-1));c.stroke();   // gold inner rule
    c.fillStyle=glow||'#f4d890';for(const [px,py] of[[x+1,y+1],[x+w-3,y+1],[x+1,y+h-3],[x+w-3,y+h-3]])c.fillRect(px,py,2,2);  // corner studs
    c.restore();
  };
}

/* ---- dialogue portraits: Shiloh and Ashling speak with the same faces they wear in play ---- */
EM.portrait=function(c,id,x,y,s,mood){
  const w=String(id||'').toLowerCase(),M=EM.M,IMG=EM.IMG;
  const who=w.indexOf('shiloh')>=0?'shiloh':w.indexOf('ashling')>=0||w==='ash'?'ashling':null;
  if(!who||!EM.ok[who]||!M[who])return false;
  const m=M[who],sm=c.imageSmoothingEnabled;let sx,sy,hx,hy;
  if(who==='shiloh'){hx=m.meta.idle.head[0][0][0];hy=m.meta.idle.head[0][0][1];sx=0;sy=(m.anims.indexOf('idle')*3)*m.fh;}
  else{hx=22;hy=17;sx=0;sy=(m.anims.indexOf(mood==='worried'?'hurt':'idle')*3)*m.fh;}
  const cw=30,k=s/cw,L=hx-15,T0=hy-14;
  c.save();
  const g=c.createRadialGradient(x+s*.5,y+s*.45,s*.1,x+s*.5,y+s*.5,s*.8);g.addColorStop(0,'#4a3068');g.addColorStop(1,'#1a1030');
  c.fillStyle=g;c.fillRect(x,y,s,s);c.beginPath();c.rect(x,y,s,s);c.clip();c.imageSmoothingEnabled=false;
  c.drawImage(IMG[who],sx+Math.max(0,L),sy+Math.max(0,T0),cw,cw,x+(Math.max(0,L)-L)*k,y+(Math.max(0,T0)-T0)*k,cw*k,cw*k);
  if(who==='shiloh'&&EM.ok.faces_shiloh){
    const F=M.faces,ex={calm:'calm',happy:'joy',worried:'alarm',angry:'rage'}[mood]||'calm',ei=Math.max(0,F.expr.indexOf(ex));
    c.drawImage(IMG.faces_shiloh,ei*F.fw,0,F.fw,F.fh,x+(hx-F.fw/2-L)*k,y+(hy-F.fh/2-T0)*k,F.fw*k,F.fh*k);
  }
  c.imageSmoothingEnabled=sm;c.restore();
  c.strokeStyle='#0e0818';c.lineWidth=2;c.strokeRect(x+1,y+1,s-2,s-2);c.strokeStyle='rgba(226,172,72,.85)';c.lineWidth=1;c.strokeRect(x+3.5,y+3.5,s-7,s-7);
  return true;
};
if(window.Portraits){const _pd=Portraits.draw;Portraits.draw=function(c,id,x,y,s,mood,o){if(settings.ember!==false&&EM.on()&&EM.portrait(c,id,x,y,s,mood))return;return _pd.apply(this,arguments);};}
