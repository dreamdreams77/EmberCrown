/* EMBERCROWN - Ember art (vertical slice: Ashfall Keep).
   Original, purpose-drawn pixel art in place of the LPC figures: Shiloh, two kinds of Marrow guard (Pell the pikeman,
   Sergeant Gaunt), and the Cinderling. Bodies are sprite sheets (assets/ember, built by tools/ember_art); faces are a
   separate atlas drawn on top at run time, so every character can blink, squint, gape and faint.
   Wraps the draw functions the same way js/lpc.js does and leaves them untouched. Toggle: settings.ember ("Ember art").
   Active on every mission except the flight, in the Rookery and in the dungeons, while pixel art is on. Ashfall Keep
   keeps its hand-built room materials; the other houses get their own floors, walls and guard colours
   (tools/ember_art/houses.py: tiles_<house>, pell_<house>, gaunt_<house>). */
'use strict';
const EM=(function(){
  const IMG={},ok={};
  const HOUSES=['grell','sable','kest','dunmoor','hallow','hub'];
  const NAMES=['shiloh','pell','gaunt','cinder','faces_shiloh','faces_pell','faces_gaunt','tiles','props','ashling','set2','pip','hale','halefree','faces_pip','faces_hale','faces_halefree']
    .concat(HOUSES.map(h=>'tiles_'+h),HOUSES.filter(h=>h!=='hub').flatMap(h=>['pell_'+h,'gaunt_'+h]));
  for(const n of NAMES){const i=new Image();i.onload=()=>{ok[n]=true;if(typeof G!=='undefined'&&G)G.dirty=true;};i.onerror=()=>{};i.src='assets/ember/'+n+'.png';IMG[n]=i;}
  const M=typeof EMBER_META!=='undefined'?EMBER_META:{};
  function slice(){return typeof G!=='undefined'&&!!G&&!!G.d&&!G.flight;}
  function ashfall(){return typeof G!=='undefined'&&!!G&&!!G.d&&G.d===LEVELS[0]&&!G.d.hub&&!G.dng;}
  // which house's palette: Marrow (Ashfall) uses the base sheets
  function house(){const k=typeof TILES!=='undefined'&&TILES.key?TILES.key():'marrow';return HOUSES.includes(k)?k:'marrow';}
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
    const face=who(g),hk=house(),hs=face+'_'+hk,name=hk!=='marrow'&&ok[hs]&&M[hs]?hs:face,hit=G.time-(g.hitT===undefined?-9:g.hitT)<.09;
    if(g.ko&&g.stun>0){shadowAt(g.x,g.y+6,15,5,.4);blit(name,'ko',0,0,g.x,g.y+3,{who:face,flash:hit});return;}
    const moving=g._lx!=null&&Math.hypot(g.x-g._lx,g.y-g._ly)>.05;g._lx=g.x;g._ly=g.y;
    const V_=view(vfa(g));
    shadowAt(g.x,g.y+7,13,5,.4);
    let mood=guardMood(g);if((mood==='calm'||mood==='wary')&&blinking(g.ph))mood='blink';
    const line=g.seeing?'#ff5440':(g.lure||g.ret)?'#ffc060':null;
    if(g.stun>0){blit(name,'hurt',V_.v,0,g.x,g.y,{flip:V_.flip,who:face,mood:'hurt',flash:hit});return;}
    const hu=g.hopT===undefined?1:(G.time-g.hopT)/.26,hop=hu>=0&&hu<1?Math.sin(hu*Math.PI)*6:0;
    const o={flip:V_.flip,who:face,mood,line};
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
  return{on,ready,blit,drawShiloh,drawWatch,drawCinder,drawAshling,view,IMG,M,ok,applyUI,house,ashfall};
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

/* ---- Ashfall Keep: floors, walls, furniture, torches, doors, chests, pots, braziers, rugs, light ---- */
EM.env=(function(){
  const IMG=EM.IMG,M=EM.M;
  const tk=()=>{const h=EM.house(),k='tiles_'+h;return h!=='marrow'&&EM.ok[k]&&M[k]?k:'tiles';};
  const T_=()=>M[tk()];
  function hash(x,y,s){let h=(x*374761393+y*668265263+(s||0)*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
  function ready(){return EM.on()&&!!EM.ok[tk()]&&!!T_()&&!!EM.ok.set2&&!!M.set2;}
  const ruin=()=>G.state==='ruin';
  function tile(c,name,x,y){
    const t=T_()[name],sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG[tk()],t[0],t[1],32,32,x*T,y*T,T,T);c.imageSmoothingEnabled=sm;
  }
  // set2: a second atlas (doors, chests, pots, braziers, rug kit, floor details, shadows, the ruined versions)
  function s2(c,n,x,y,flip){
    const a=M.set2[n];if(!a)return false;const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;x=Math.round(x);y=Math.round(y);
    if(flip){c.save();c.translate(x+a[2],y);c.scale(-1,1);c.drawImage(IMG.set2,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);c.restore();}
    else c.drawImage(IMG.set2,a[0],a[1],a[2],a[3],x,y,a[2],a[3]);
    c.imageSmoothingEnabled=sm;return true;
  }
  function s2base(c,n,cx,by,shadow){
    const a=M.set2[n];if(!a)return false;
    if(shadow!==false){c.fillStyle='rgba(8,6,24,.34)';c.beginPath();c.ellipse(Math.round(cx),Math.round(by-1),a[2]*.42,3.4,0,0,6.283);c.fill();}
    return s2(c,n,cx-a[2]/2,by-a[3]);
  }
  function isWall(x,y){const r=G.grid[y];return!r||r[x]==='#'||r[x]===' '||r[x]===undefined;}
  function shade(c,x,y){
    const rm=G.rooms&&G.roomOf&&G.roomOf[y]&&G.roomOf[y][x]>=0?G.rooms[G.roomOf[y][x]]:null;
    if(rm&&rm.tint&&rm.tint<1){c.fillStyle='rgba(0,0,0,'+((1-rm.tint)*1.2).toFixed(3)+')';c.fillRect(x*T,y*T,T,T);}
  }
  /* Room identities: each room of Ashfall Keep has its own floor and wall family (rects are tile coordinates, inclusive) */
  const ROOMS=[
    ['scullery',1,1,4,3,'kitchen','sooty'],['store',6,1,14,3,'kitchen','sooty'],['egg',16,1,23,3,'relic','relic'],
    ['barracks',1,5,11,7,'barracks','timber'],['mess',13,5,23,7,null,null],['guardroom',13,9,23,13,'store','timber'],
    ['courtyard',1,9,11,13,'yard',null],['vault',24,9,32,14,'relic','relic'],
    ['coalcellar',1,17,4,20,'coal','sooty'],['storecellar',6,17,14,20,'store','culvert'],['ossuary',16,17,23,20,'ossuary','bone'],
    ['culvert',1,23,23,27,'culvert','culvert']];
  const FAM={kitchen:3,store:4,relic:3,barracks:4,yard:4,coal:3,ossuary:4,culvert:4};
  const WFAM={sooty:2,timber:3,relic:1,culvert:2,bone:2};
  function roomAt(x,y){if(!EM.ashfall())return null;for(const r of ROOMS)if(x>=r[1]&&x<=r[3]&&y>=r[2]&&y<=r[4])return r;return null;}
  const DETAIL=['drain','puddle','scorch','bones','crack','rune','rubble'];
  const RFLOOR=['pit','cracked','ash','char'];
  function floor(c,x,y){
    const z=typeof TILES!=='undefined'&&TILES.zone?TILES.zone(x,y):'';if(z==='water'||z==='court')return false;
    const h=hash(x,y,1);
    if(ruin()){
      const r=hash(x,y,5);
      const k=r<.62?'plain':r<.80?'cracked':r<.92?'ash':r<.97?'char':'pit';s2(c,'rfloor_'+k,x*T,y*T);
    }else{
      const d=hash(x,y,9),rm=roomAt(x,y),fam=rm&&rm[5]&&M.set2['f_'+rm[5]+'0']?rm[5]:null;
      if(fam)s2(c,'f_'+fam+Math.floor(hash(x,y,4)*FAM[fam]),x*T,y*T);                    // the room's own material
      else if(d<.085&&!G.doors[x+','+y]&&M.set2['floor_'+DETAIL[Math.floor(d/.085*7)%7]])s2(c,'floor_'+DETAIL[Math.floor(d/.085*7)%7],x*T,y*T);
      else tile(c,'floor'+(h<.45?3:Math.floor((h-.45)/.55*3)),x,y);
    }
    shade(c,x,y);
    // cool, dithered shadow where a wall stands over the floor (replaces the smooth black gradient)
    const n=isWall(x,y-1),w=isWall(x-1,y),e=isWall(x+1,y);
    if(n&&w)s2(c,'shade_nw',x*T,y*T);else if(n&&e)s2(c,'shade_ne',x*T,y*T);else{if(n)s2(c,'shade_n',x*T,y*T);if(w)s2(c,'shade_w',x*T,y*T);if(e)s2(c,'shade_e',x*T,y*T);}
    return true;
  }
  function wall(c,x,y){
    if(isWall(x,y+1)||y+1>=G.gh){if(ruin())s2(c,'rtop_'+((x+y)&1),x*T,y*T);else tile(c,'top'+((x+y)&1),x,y);return;}
    if(ruin()){const r=hash(x,y,6);s2(c,'rface_'+(r<.5?0:r<.8?1:2),x*T,y*T);c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x*T,y*T+T-3,T,3);return;}
    const h=hash(x,y,2),rm=roomAt(x,y+1),wf=rm&&rm[6]&&M.set2['w_'+rm[6]+'0']?rm[6]:null;let k;
    if(wf){s2(c,'w_'+wf+Math.floor(hash(x,y,3)*WFAM[wf]),x*T,y*T);c.fillStyle='rgba(8,6,24,.34)';c.fillRect(x*T,y*T+T-3,T,3);return;}
    if(h<.10)k='face_niche';else if(h<.19)k='face_slit';
    else k=['face_plain','face_plain2','face_plain3'][Math.floor(hash(x,y,3)*3)];
    tile(c,k,x,y);
    c.fillStyle='rgba(8,6,24,.34)';c.fillRect(x*T,y*T+T-3,T,3);
  }
  // props: stamped by the middle of the bottom edge of their footprint
  function sprite(c,n,cx,by,seed){
    const key=ruin()&&M.set2['ruin_'+n]?'ruin_'+n:null;
    if(key){s2base(c,key,cx,by);
      if(seed%3===0&&M.set2.rubble0)s2(c,'rubble'+(seed%3===0?(seed%2):0),cx-20+(seed%11),by-14,seed%2===0);
      return true;}
    const a=M.props[n];if(!a)return false;const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.fillStyle='rgba(8,6,24,.34)';c.beginPath();c.ellipse(Math.round(cx),Math.round(by-1),a[2]*.42,3.4,0,0,6.283);c.fill();
    c.drawImage(IMG.props,a[0],a[1],a[2],a[3],Math.round(cx-a[2]/2),Math.round(by-a[3]),a[2],a[3]);c.imageSmoothingEnabled=sm;return true;
  }
  function prop(c,p){
    if(!EM.on()||!EM.ok.props||!M.props)return false;
    const px=p.x*T,py=p.y*T,cx=px+p.w*T/2,by=py+p.h*T-2,v=Math.floor(mulberry(p.seed+11)()*100);
    switch(p.type){
      case'crate':return sprite(c,v%3===0?'barrel':v%2?'crate':'crate_b',cx,by,v);
      case'crates':return sprite(c,'crates',cx,by,v);
      case'table':return sprite(c,'table',cx,by+2,v);
      case'bench':return sprite(c,'bench',cx,by,v);
      case'cot':return sprite(c,'cot',cx,by,v);
      case'weaponrack':return sprite(c,'weaponrack',cx,by,v);
      case'sacks':return sprite(c,'sacks',cx,by,v);
      case'statue':return sprite(c,'statue',cx,by,v);
      case'sarcophagus':return sprite(c,'sarcophagus',cx,by,v);
      case'barrels':return sprite(c,'barrel',cx,by,v);
      case'treasure':return s2base(c,'chest_closed',cx,by,true);
      case'vase':return s2base(c,'urn',cx,by,true);
      case'longtable':return s2base(c,'longtable',cx,by+2,true);
      case'cauldron':return s2base(c,'cauldron',cx,by,true);
      case'bookcase':return s2base(c,'bookcase',cx,by,true);
      case'altar':return s2base(c,'altar',cx,by,true);
      case'coal':return s2base(c,'coal',cx,by,true);
      case'lectern':return s2base(c,'lectern',cx,by,true);
      case'toolrack':return s2base(c,'toolrack',cx,by,true);
      case'pillarstub':return s2base(c,'pillarstub',cx,by,true);
      case'furnace':return s2base(c,'furnace_body',cx,by+2,true);
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
  /* the hearth: its flames are drawn live over the baked furnace, and furnaces, altars and cauldrons light the room */
  function hearths(){
    const c=ctx,t=G.time;
    for(const p of G.props||[]){
      if(p.type!=='furnace')continue;
      const a=M.set2['furnace_flame'+(Math.floor(t*8+(p.seed%7))%3)];if(!a)continue;
      const cx=(p.x+p.w/2)*T,by=(p.y+p.h)*T-2+2;
      const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(IMG.set2,a[0],a[1],a[2],a[3],Math.round(cx-a[2]/2),Math.round(by-a[3]),a[2],a[3]);c.imageSmoothingEnabled=sm;
    }
  }
  function lights(L){
    for(const p of G.props||[]){
      const cx=(p.x+p.w/2)*T,cy=(p.y+.5)*T;
      if(p.type==='furnace')L.push({x:cx,y:cy+6,r:124,a:.95,col:'255,150,56',gl:.7});
      else if(p.type==='altar')L.push({x:cx,y:cy-6,r:74,a:.8,col:'255,190,110',gl:.55});
      else if(p.type==='cauldron')L.push({x:cx,y:cy+8,r:58,a:.7,col:'255,140,60',gl:.5});
    }
    return L;
  }
  /* doors and gates */
  function door(d){
    const c=ctx,x=d.x*T,y=d.y*T,R=ruin()?'ruin_':'';
    if(d.open&&!d.gate){const n=R&&M.set2.ruin_door_open?'ruin_door_open':'door_open';return s2(c,n,x,y);}
    if(d.gate){
      s2(c,d.open?'gate_open':'gate_closed',x,y);
      if(!d.open){const p=.5+.5*Math.sin(G.time*3);
        if(d.puzzle){c.strokeStyle='rgba(170,120,255,'+(.45+p*.4)+')';c.lineWidth=1.6;c.beginPath();c.arc(x+16,y+16,6,0,6.28);c.stroke();c.fillStyle='rgba(170,120,255,'+(.5+p*.4)+')';circ(c,x+16,y+16,2);c.fill();}
        else{c.fillStyle='rgba(255,120,60,'+(.3+p*.3)+')';c.fillRect(x+5,y+T/2-1,T-10,2);}}
      return true;
    }
    if(d.sealed)return s2(c,'sealed'+(Math.floor(G.time*2)&1),x,y);
    return s2(c,R&&M.set2.ruin_door_closed?'ruin_door_closed':'door_closed',x,y);
  }
  function chests(){
    const c=ctx,t=G.time;
    for(const ch of G.chests||[]){
      s2base(c,ruin()&&M.set2.ruin_chest_closed?(ch.open?'ruin_chest_open':'ruin_chest_closed'):(ch.open?'chest_open':'chest_closed'),ch.x,ch.y+13);
      if(!ch.open){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,200,110,'+(.10+.07*Math.sin(t*4))+')';circ(c,ch.x,ch.y,20);c.fill();c.globalCompositeOperation='source-over';}
      if(!ch.open&&G.holdT&&G.holdT.ref===ch&&G.hold>0){c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=5;c.beginPath();c.arc(ch.x,ch.y,20,0,6.283);c.stroke();c.strokeStyle='#f0b44c';c.lineWidth=3;c.beginPath();c.arc(ch.x,ch.y,20,-1.57,-1.57+6.283*Math.min(1,G.hold/G.holdT.need));c.stroke();}
    }
  }
  function pots(){
    const c=ctx;
    for(const p of G.pots||[]){
      if(p.hp<=0)continue;
      const sq=p.hit>0?Math.sin(p.hit*40)*1.5:0,n=(p.kind==='pot'?'pot':'urn');
      s2base(c,ruin()&&M.set2['ruin_'+n]?'ruin_'+n:n,p.x*T+16+sq,p.y*T+T-1);
      if(p.hit>0)p.hit-=.016;
    }
  }
  function braziers(){
    const c=ctx,t=G.time;
    for(const b of G.braz||[]){
      if(b.lit)s2base(c,'brazier_on'+(1+(Math.floor(t*7+b.ph)%3)),b.x,b.y+14);
      else{
        s2base(c,'brazier_off',b.x,b.y+14);
        const p=.5+.5*Math.sin(t*2+b.ph);
        c.strokeStyle='rgba(170,120,255,'+(.35+p*.4)+')';c.lineWidth=1.4;c.beginPath();c.ellipse(b.x,b.y-4,8,2.4,0,0,6.283);c.stroke();
        c.fillStyle='rgba(170,120,255,'+(.3+p*.3)+')';circ(c,b.x,b.y-8-p*3,1.6);c.fill();
        if(b.p>0){c.strokeStyle='#ffd27a';c.lineWidth=3;c.beginPath();c.arc(b.x,b.y-4,14,-1.57,-1.57+6.28*Math.min(1,b.p/.6));c.stroke();}
      }
    }
  }
  /* rugs: a 9-slice woven from drawn pieces (corner, edge, field, medallion), in Marrow plum and bone */
  function rug(c,rx,ry,rw,rh,v){
    const P=M.set2;if(!P['rug'+v+'_field'])return;
    const X=rx*T+2,Y=ry*T+2,W=rw*T-4,H=rh*T-4,nx=Math.round(W/16),ny=Math.round(H/16),sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.fillStyle='rgba(6,4,20,.40)';c.fillRect(X+2,Y+3,nx*16,ny*16);
    const piece=(n,i,j,rot)=>{const a=P['rug'+v+'_'+n];c.save();c.translate(X+i*16+8,Y+j*16+8);c.rotate(rot*Math.PI/2);c.drawImage(IMG.set2,a[0],a[1],16,16,-8,-8,16,16);c.restore();};
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const l=i===0,r=i===nx-1,t=j===0,b=j===ny-1;
      if(t&&l)piece('corner',i,j,0);else if(t&&r)piece('corner',i,j,1);else if(b&&r)piece('corner',i,j,2);else if(b&&l)piece('corner',i,j,3);
      else if(t)piece('edge',i,j,0);else if(r)piece('edge',i,j,1);else if(b)piece('edge',i,j,2);else if(l)piece('edge',i,j,3);
      else piece('field',i,j,0);
    }
    if(nx>=4&&ny>=3){const a=P['rug'+v+'_medal'];c.drawImage(IMG.set2,a[0],a[1],32,32,Math.round(X+nx*8-16),Math.round(Y+ny*8-16),32,32);}
    if(ruin()){c.fillStyle='rgba(20,12,26,.5)';for(let j=0;j<ny*16;j+=2)for(let i=(j>>1)%2*2;i<nx*16;i+=4)if(((i*7+j*13)%9)<4)c.fillRect(X+i,Y+j,2,2);}
    c.imageSmoothingEnabled=sm;
  }
  function autoRugs(c,th,rnd){
    for(const R of G.rooms){
      const w=R.x1-R.x0+1,h=R.y1-R.y0+1;
      if(R.n<16||w<4||h<3||R.rug>.5)continue;
      if(window.TILES&&/court|yard|battle|water|cellar|dungeon|arena/.test(TILES.zone(Math.round((R.x0+R.x1)/2),Math.round((R.y0+R.y1)/2))))continue;
      const rw=Math.min(w-2,7),rh=Math.min(h-2,3);if(rw<2||rh<1)continue;
      const rx=R.x0+Math.floor((w-rw)/2),ry=R.y0+Math.floor((h-rh)/2);
      let ok=true;
      for(let y=ry;y<ry+rh&&ok;y++)for(let x=rx;x<rx+rw;x++)if(G.roomOf[y][x]!==R.id){ok=false;break;}
      for(const [ex,ey,ew,eh] of th.rugs||[])if(rx<ex+ew&&rx+rw>ex&&ry<ey+eh&&ry+rh>ey)ok=false;
      if(!ok)continue;
      const idr=roomAt(Math.round((R.x0+R.x1)/2),Math.round((R.y0+R.y1)/2));if(idr&&/^(culvert|coal|yard|ossuary|kitchen)$/.test(idr[5]||''))continue;   // no rugs on wet cobble, coal, bone marble or the kitchen tiles
      rug(c,rx,ry,rw,rh,R.rug<.25?0:1);
    }
  }
  /* pixel-stepped light: bands with an ordered dither between them, sized to the pixel the light layer is drawn at */
  const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const LC=new Map();
  function stepped(kind,r,k,col){
    const size=Math.max(8,Math.round(r*2/k/4)*4),key=kind+size+(col||'');let cv=LC.get(key);if(cv)return cv;
    if(LC.size>120)LC.clear();
    cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d'),im=g.createImageData(size,size),d=im.data;
    const cr=col?col.split(',').map(Number):[255,255,255];
    const steps=kind==='l'?[[.30,1],[.52,.74],[.74,.44],[.92,.18]]:[[.30,.50],[.52,.36],[.74,.22],[.92,.09]];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const dx=(x+.5)/size*2-1,dy=(y+.5)/size*2-1,u=Math.sqrt(dx*dx+dy*dy);
      const dith=(BAY[(y&3)*4+(x&3)]/16-.5)*.045;let a=0;
      for(const [lim,val] of steps){if(u+dith<lim){a=val;break;}}
      const i=(y*size+x)*4;d[i]=cr[0];d[i+1]=cr[1];d[i+2]=cr[2];d[i+3]=Math.round(a*255);
    }
    g.putImageData(im,0,0);LC.set(key,cv);return cv;
  }
  const AMB=[8,10,34];
  function ambient(a){return ruin()?[34,12,18,Math.min(.8,Math.max(a[3],.68))]:[AMB[0],AMB[1],AMB[2],Math.min(.8,Math.max(a[3],.70))];} // the ruin is lit by embers: a warmer dark
  return{ready,floor,wall,prop,torch,door,chests,pots,braziers,autoRugs,stepped,ambient,s2,ruin,hash,hearths,lights,roomAt};
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
    if(EM.env.ready())EM.env.hearths();
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
      if(EM.on()&&EM.house()==='marrow'&&EM.ok.props&&M.props&&M.props.banner){ // Marrow's crescent; other houses keep their own heraldry
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
  const who=w.indexOf('shiloh')>=0?'shiloh':w.indexOf('ashling')>=0||w==='ash'?'ashling':w==='pip'?'pip':w==='hale'?(G.nq&&G.nq.npcs&&G.nq.npcs.some(n=>n.id==='hale'&&n.free)?'halefree':'hale'):null;
  if(!who||!EM.ok[who]||!M[who])return false;
  const m=M[who],sm=c.imageSmoothingEnabled,faced=!!M[who].meta;let sx,sy,hx,hy;
  if(faced){hx=m.meta.idle.head[0][0][0];hy=m.meta.idle.head[0][0][1];sx=0;sy=(m.anims.indexOf('idle')*3)*m.fh;}
  else{hx=22;hy=17;sx=0;sy=(m.anims.indexOf(mood==='worried'?'hurt':'idle')*3)*m.fh;}
  const cw=30,k=s/cw,L=hx-15,T0=hy-14;
  c.save();
  const g=c.createRadialGradient(x+s*.5,y+s*.45,s*.1,x+s*.5,y+s*.5,s*.8);g.addColorStop(0,'#4a3068');g.addColorStop(1,'#1a1030');
  c.fillStyle=g;c.fillRect(x,y,s,s);c.beginPath();c.rect(x,y,s,s);c.clip();c.imageSmoothingEnabled=false;
  c.drawImage(IMG[who],sx+Math.max(0,L),sy+Math.max(0,T0),cw,cw,x+(Math.max(0,L)-L)*k,y+(Math.max(0,T0)-T0)*k,cw*k,cw*k);
  const fa=EM.ok['faces_'+who];
  if(faced&&fa){
    const F=M.faces,ex={calm:'calm',happy:'joy',worried:'alarm',angry:'rage'}[mood]||'calm',ei=Math.max(0,F.expr.indexOf(ex));
    c.drawImage(IMG['faces_'+who],ei*F.fw,0,F.fw,F.fh,x+(hx-F.fw/2-L)*k,y+(hy-F.fh/2-T0)*k,F.fw*k,F.fh*k);
  }
  c.imageSmoothingEnabled=sm;c.restore();
  c.strokeStyle='#0e0818';c.lineWidth=2;c.strokeRect(x+1,y+1,s-2,s-2);c.strokeStyle='rgba(226,172,72,.85)';c.lineWidth=1;c.strokeRect(x+3.5,y+3.5,s-7,s-7);
  return true;
};
if(window.Portraits){const _pd=Portraits.draw;Portraits.draw=function(c,id,x,y,s,mood,o){if(settings.ember!==false&&EM.on()&&EM.portrait(c,id,x,y,s,mood))return;return _pd.apply(this,arguments);};}

/* ---- Ashfall's doors, chests, pots, braziers, rugs, people and light ---- */
{
  const _drawDoor=drawDoor;drawDoor=function(d){if(EM.env.ready()&&EM.env.door(d))return;return _drawDoor(d);};
  const _chests=drawChestsInsp;
  drawChestsInsp=function(){
    if(!EM.env.ready())return _chests();
    // story points keep their own drawn art; chests are ours
    const hold=G.chests;G.chests=[];try{_chests();}finally{G.chests=hold;}
    EM.env.chests();
  };
  const _pots=drawPots;drawPots=function(){if(!EM.env.ready())return _pots();const hold=G.pots;G.pots=[];try{_pots();}finally{G.pots=hold;}EM.env.pots();};
  const _braz=drawBraziers;drawBraziers=function(){if(!EM.env.ready())return _braz();const hold=G.braz;G.braz=[];try{_braz();}finally{G.braz=hold;}EM.env.braziers();};
  const _cl=collectLights;collectLights=function(){const L=_cl.apply(this,arguments);return EM.env.ready()&&!EM.env.ruin()?EM.env.lights(L):L;};
  const _rugs=autoRugs;autoRugs=function(c,th,rnd){if(EM.env.ready()&&EM.house()==='marrow')return EM.env.autoRugs(c,th,rnd);return _rugs(c,th,rnd);}; // the rug medallion is Marrow's crescent
  if(window.drawNpcFigure){
    const _fig=window.drawNpcFigure,E=EM;
    window.drawNpcFigure=function(c,kind,x,y,t,face,o){
      const id=o&&o.id;
      if(E.on()&&(id==='pip'||id==='hale')){
        const nm=id==='hale'?(o.free?'halefree':'hale'):'pip';
        if(E.ready(nm)&&E.ok['faces_'+nm]){
          const V_=E.view(face||0),mv=Math.abs(o.walk||0)>.05;
          const mood=(((G.time*.7+(id==='pip'?.3:.9))%3.7)<.12)?'blink':(G.alert>.6?'alarm':'calm');
          const op={flip:V_.flip,who:nm,mood:mood,sc:id==='pip'?.86:1,drop:0};
          if(mv)E.blit(nm,'walk',V_.v,Math.floor(G.time*9)%6,x,y+8,op);else E.blit(nm,'idle',V_.v,0,x,y+8,op);
          return;
        }
      }
      return _fig.apply(this,arguments);
    };
  }
}

/* ======================= Phase 2: the last of the original art in Ashfall Keep =======================
   Pickups, every state of the mission mechanisms, story scenes, the hidden crack, doorway arches, hanging cages, timber beams,
   alert markers, interaction prompts, vision cones, particles, hearts, HUD icons and the minimap. The world art follows EM.env.ready()
   (Ashfall Keep with Ember art on); the interface pieces follow the Ember art toggle everywhere, like the HUD panels. */
EM.fx=(function(){
  const IMG=EM.IMG,M=EM.M,env=EM.env;
  const uiOn=()=>settings.ember!==false&&!!EM.ok.set2&&!!M.set2;
  const ok=()=>env.ready();
  const A=n=>M.set2[n];
  function blit(c,n,x,y,w,h){const a=A(n);if(!a)return false;const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
    c.drawImage(IMG.set2,a[0],a[1],a[2],a[3],Math.round(x),Math.round(y),w||a[2],h||a[3]);c.imageSmoothingEnabled=sm;return true;}
  const spr=(c,n,cx,cy)=>{const a=A(n);return a?blit(c,n,cx-a[2]/2,cy-a[3]/2):false;};
  function shadow(c,x,y,rx){c.fillStyle='rgba(8,6,24,.34)';c.beginPath();c.ellipse(Math.round(x),Math.round(y),rx,3,0,0,6.283);c.fill();}
  function ring(c,x,y,r,frac,col){ // a ring of square beads, lit clockwise from the top
    const n=26,k=Math.round(n*Math.min(1,Math.max(0,frac)));
    for(let i=0;i<n;i++){const a=-Math.PI/2+i/n*Math.PI*2,px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r);
      c.fillStyle='#0e0818';c.fillRect(px-2,py-2,4,4);c.fillStyle=i<k?(col||'#f0b44c'):'#3a2a50';c.fillRect(px-1,py-1,2,2);}
  }
  /* ---- pickups ---- */
  function item(it){
    const c=ctx,t=G.time,hold=()=>{if(G.holdT&&G.holdT.ref===it&&G.hold>0)ring(c,it.x,it.y,17,G.hold/G.holdT.need);};
    switch(it.type){
      case'g':{if(it.done)return true;const b=Math.sin(t*3+it.ph)*2.4;shadow(c,it.x,it.y+9,6);spr(c,'gem'+(Math.floor((t*2+it.ph)%3)),it.x,it.y+b-2);hold();return true;}
      case'G':{if(it.done)return true;shadow(c,it.x,it.y+10,11);spr(c,'cluster',it.x,it.y-2+Math.sin(t*2.6)*1.2);hold();return true;}
      case'r':{if(it.done)return true;const b=Math.sin(t*2+it.ph)*3;shadow(c,it.x,it.y+12,9);
        c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,210,120,.10)';c.fillRect(Math.round(it.x-14),Math.round(it.y-16+b),28,28);c.globalCompositeOperation='source-over';
        spr(c,'relic'+(Math.floor(t*2)&1),it.x,it.y-2+b);hold();return true;}
      case's':{if(it.done)return true;shadow(c,it.x,it.y+7,9);spr(c,'scroll',it.x,it.y+Math.sin(t*2+it.ph)*1.2);hold();return true;}
      case'o':{if(it.done)return true;const fz=it.fuse>0,j=fz?Math.round((Math.random()-.5)*2):0;shadow(c,it.x+1,it.y+11,10);spr(c,'keg',it.x+j,it.y);
        if(fz){c.fillStyle=Math.random()<.5?'#fff4d0':'#ffb040';c.fillRect(Math.round(it.x+3+j),Math.round(it.y-16),2,2);}hold();return true;}
      case'O':{if(!(typeof lvl!=='undefined'&&lvl===0&&!G.d.song&&!G.d.timeshift))return false;
        c.globalAlpha=it.done?.3:1;const p=.5+.5*Math.sin(t*3);spr(c,'egg'+Math.floor(p*2.99),it.x,it.y-4);c.globalAlpha=1;hold();return true;}
      case'B':{
        if(!it.done){const sc=1+it.p*.25,a=A('beacon_lit'+(Math.floor(t*8+it.ph)%3));if(!a)return false;const dw=a[2]*sc,dh=a[3]*sc;shadow(c,it.x,it.y+11,11);
          blit(c,'beacon_lit'+(Math.floor(t*8+it.ph)%3),it.x-dw/2,it.y+12-dh,dw,dh);if(it.p>0)ring(c,it.x,it.y-4,19,it.p,'#ffd27a');}
        else{shadow(c,it.x,it.y+11,10);spr(c,'beacon_out',it.x,it.y-14);
          for(let i=0;i<3;i++){const k=((t*.5+i*.33)%1);c.globalAlpha=.4*(1-k);c.fillStyle='#b8b4c8';const s=2+Math.round(k*3);c.fillRect(Math.round(it.x+Math.sin(k*5+i)*4-s/2),Math.round(it.y-8-k*22),s,s);}c.globalAlpha=1;}
        return true;}
    }
    return false;
  }
  /* ---- story points and the hidden crack ---- */
  function inspArt(c,n){
    const m={bones:['i_bones',-17,-12],tablet:['i_tablet',-13,-15],banner:['i_banner',-18,-13]}[n.kind];if(!m)return false;
    return blit(c,m[0],n.x+m[1],n.y+m[2]);
  }
  function insp(){
    const c=ctx,t=G.time;
    for(const n of G.insp||[]){
      if(n.done)continue;
      shadow(c,n.x,n.y+8,10);
      if(!inspArt(c,n))drawInspectArt(c,n);
      const p=.5+.5*Math.sin(t*3+n.x);c.globalAlpha=.4+p*.5;c.fillStyle='#ffe6a0';c.fillRect(Math.round(n.x+Math.cos(t*2+n.x)*11),Math.round(n.y-14-p*4),2,2);c.globalAlpha=1;
      if(G.holdT&&G.holdT.ref===n&&G.hold>0)ring(c,n.x,n.y,16,G.hold/G.holdT.need);
    }
  }
  function crack(ck){
    const c=ctx,x=ck.x*T,y=ck.y*T,p=.5+.5*Math.sin(G.time*2.2+ck.x);
    const near=Math.hypot(ck.x*T+16-G.ash.x,ck.y*T+16-G.ash.y)<4*T&&G.ash.on;
    blit(c,'crack'+((p>.5||near)?1:0),x,y);
    if(near&&Math.random()<.08)pt(x+10+Math.random()*12,y+6+Math.random()*20,0,-8,.9,1.4,'#ffd27a',{add:true});
    if(ck.p>0)ring(c,x+16,y+16,18,ck.p/1.1);
  }
  /* ---- mechanisms (called from js/mis_a.js) ---- */
  const C_=v=>v*T+16;
  function mech(kind,c,a,b,d,e,f){
    if(!ok())return false;
    switch(kind){
      case'plate':{const p=a,t=b,x=p.x*T,y=p.y*T,dn=p.on?1.5:0;
        if(p.hidden&&!p.rev){blit(c,'plate_plain',x,y);return true;}
        if(p.kind==='rattle')blit(c,'plate_rattle'+(Math.floor(t*2.2)%3),x,y+dn);
        else blit(c,'plate_dart'+((p.kind==='alarm'||p.on)?1:0),x,y+dn);
        return true;}
      case'rot':{blit(c,'rot'+a.st,a.x*T,a.y*T);return true;}
      case'grate':{if(e)return false;blit(c,d?'grate_open':'grate_closed',a,b);return true;}
      case'stairs':{const st=a,end=b,k=d,t=e,x=end[0]*T,y=end[1]*T;
        if(!st.found){blit(c,'unfound',x,y);const nr=Math.hypot(G.wren.x-C_(end[0]),G.wren.y-C_(end[1]))<2.6*T;
          if(nr){c.fillStyle='rgba(190,170,255,'+(.25+.2*Math.sin(t*3))+')';c.fillRect(x+13,y+12,6,2);c.fillRect(x+11,y+14,10,5);}return true;}
        const kind=(k?st.kindB:st.kind)||'hatch';blit(c,kind==='stairs'?'steps':kind==='well'?'well':'hatch',x,y);return true;}
      case'lever':{const l=a,t=b,x=C_(l.x),y=C_(l.y),on=l.on||(l.used&&l.once&&!l.hold);shadow(c,x+1,y+10,11);
        blit(c,on?'lever_on':'lever_off',x-18,y+10-38);
        if(l.by==='ash'){c.fillStyle='rgba(255,150,70,'+(.55+.3*Math.sin(t*4))+')';c.fillRect(Math.round(x-14),Math.round(y+4),4,4);}
        if(l.hold&&l.on)ring(c,x,y,15,.5+.5*Math.sin(t*8),'#ffdc8c');return true;}
      case'cache':{const q=a,t=b,Mx=d,x=C_(q.x),y=C_(q.y),o=q.open;
        if(q.kind==='wreck')return false;
        const nm=q.kind==='stone'?'cache_stone':q.kind==='box'?'cache_box':'cache_reliquary';shadow(c,x+1,y+10,13);
        blit(c,nm+(o?'_open':'_closed'),x-18,y-17);
        if(!o){c.fillStyle='rgba(255,230,160,'+(.3+.25*Math.sin(t*3))+')';c.fillRect(Math.round(x-1),Math.round(y-2),2,2);}
        if(q.chal&&Mx&&Mx.ch&&Mx.ch.st!=='done')ring(c,x,y,19+Math.sin(t*3)*1.5,1,Mx.ch.st==='run'?'#78f096':'#ffc878');
        return true;}
      case'note':{const n=a,t=b,x=C_(n.x),y=C_(n.y);shadow(c,x,y+14,10);blit(c,'note',x-13,y-19);
        if(!n.read){c.fillStyle='rgba(190,220,255,'+(.4+.3*Math.sin(t*2.5))+')';c.fillRect(Math.round(x-12+Math.sin(t*2)*3),Math.round(y-22),2,2);c.fillRect(Math.round(x+10),Math.round(y-16+Math.cos(t*2)*3),2,2);}
        return true;}
      case'portcullis':{const q=a,x=q.x*T,y=q.y*T,up=q.anim*(T-7);
        c.fillStyle='#14101a';c.fillRect(x,y+1,3,T-2);c.fillRect(x+T-3,y+1,3,T-2);
        c.save();c.beginPath();c.rect(x,y,T,T);c.clip();blit(c,'portcullis',x,y-up);c.restore();return true;}
    }
    return false;
  }
  /* ---- story scenes and overhead (called from tiles.js / props.js) ---- */
  const isW=(x,y)=>{const r=G.grid[y];return!r||r[x]==='#'||r[x]===' '||r[x]===undefined;};
  function story(c,list,r){
    if(!ok())return false;
    for(const [x,y,k] of list){
      if(!G.grid[y]||isW(x,y))continue;
      if(k[0]==='f'){if(A('s_'+k))blit(c,'s_'+k,x*T,y*T);continue;}
      if(isW(x,y-1)&&A('s_'+k))blit(c,'s_'+k,x*T,(y-1)*T+9);
    }
    return true;
  }
  const OUT=/court|yard|battle|arena/;
  function fg(c){
    const gw=G.gw,gh=G.gh;
    for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){
      if(G.grid[y][x]!=='.')continue;
      if(isW(x-1,y)&&isW(x+1,y)&&!isW(x,y-1)&&!isW(x,y+1))blit(c,'arch_ns',x*T-4,y*T-2);
    }
    for(const R of G.rooms||[]){
      const w=R.x1-R.x0+1,z=TILES.zone(R.x0,R.y0);
      if(w<4||z==='vault'||TILES.zone(R.x1,R.y1)==='vault'||OUT.test(z)||R.n<=40)continue;
      const xx=(R.x0+2)*T+16,yy=(R.y0+1)*T;
      c.fillStyle='#1a1620';c.fillRect(xx-1,yy-T,2,T-6);blit(c,'cage',xx-13,yy-5);
    }
  }
  function beams(c,gw,gh){
    if(!ok())return false;
    for(let y=0;y<gh;y++){
      if((y%5)!==2)continue;
      let x0=-1;
      for(let x=0;x<=gw;x++){
        const inV=G.d.vault&&(()=>{const a=G.d.vault.rect;return x>=Math.min(a[0],a[2])-1&&x<=Math.max(a[0],a[2])+1&&y>=Math.min(a[1],a[3])-1&&y<=Math.max(a[1],a[3])+1;})();
        const good=x<gw&&G.grid[y][x]==='.'&&!OUT.test(TILES.zone(x,y))&&!G.doors[x+','+y]&&!inV&&G.grid[y-1]&&G.grid[y+1];
        if(good&&x0<0)x0=x;
        if(!good&&x0>=0){
          if(x-x0>=5&&x-x0<=13){const a=x0*T,b=x*T,yy=y*T+6;c.save();c.beginPath();c.rect(a,yy-4,b-a,28);c.clip();c.globalAlpha=.62;for(let xx=a;xx<b;xx+=48)blit(c,'beam',xx,yy-4);c.globalAlpha=1;c.restore();}
          x0=-1;
        }
      }
    }
    return true;
  }
  /* ---- interface: hearts, icons, markers, prompts ---- */
  function heart(c,full){if(!uiOn())return false;const a=A(full?'heart_full':'heart_empty');if(!a)return false;const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(IMG.set2,a[0],a[1],a[2],a[3],-9,-8,18,16);c.imageSmoothingEnabled=sm;return true;}
  const TINT=new Map();
  function tinted(name,col){
    const k=name+'|'+col;let cv=TINT.get(k);if(cv)return cv;const a=A('ic_'+name);if(!a)return null;
    cv=document.createElement('canvas');cv.width=a[2];cv.height=a[3];const g=cv.getContext('2d');
    g.drawImage(IMG.set2,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);g.globalCompositeOperation='multiply';g.fillStyle=col;g.fillRect(0,0,a[2],a[3]);
    g.globalCompositeOperation='destination-in';g.drawImage(IMG.set2,a[0],a[1],a[2],a[3],0,0,a[2],a[3]);TINT.set(k,cv);return cv;
  }
  function icon(c,name,x,y,s,col,dim){
    if(!uiOn())return false;const cv=tinted(name,col||'#ffffff');if(!cv)return false;
    const sz=Math.round(s*1.15),sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;const ga=c.globalAlpha;c.globalAlpha=dim?.35:1;
    c.drawImage(cv,Math.round(x-sz/2),Math.round(y-sz/2),sz,sz);c.globalAlpha=ga;c.imageSmoothingEnabled=sm;return true;
  }
  function markers(g,orig){
    if(!uiOn())return orig(g);
    const c=ctx,t=G.time;
    if(g.stun>0&&!g.dead){for(let i=0;i<3;i++){const a=t*4+i*2.09;blit(c,'m_star',g.x+Math.cos(a)*9-3.5,g.y-17+Math.sin(a)*3.5-3.5,7,7);}drawKoRing(c,g);return;}
    if(g.spin||g.eng)return;
    if(g.run){drawRunnerPath(c,g);ring(c,g.x,g.y,16+Math.sin(t*10)*2,1,'#ff8a3c');}
    if(g.say){
      const k=Math.min(1,g.say.t/.3,(1.7-g.say.t)/.12+.01);
      c.save();c.globalAlpha=Math.max(0,k);c.font='italic 11px '+BODY;c.textAlign='center';
      const tw=c.measureText(g.say.x).width+14,yy=g.y-(g.bang>0||g.seeing||g.quest>0||g.lure?50:36)-(1-k)*4;
      panelBox(c,g.x-tw/2,yy-11,tw,17,4,'rgba(226,172,72,.55)');c.fillStyle='#f3e6c8';c.fillText(g.say.x,g.x,yy+2);c.restore();
    }
    const kind=(g.bang>0||g.seeing)?'m_alert':(g.quest>0||g.lure)?'m_quest':null;
    if(kind){const k=g.bang>0?1-g.bang:1,by=-26-Math.sin(Math.min(1,k*3)*Math.PI)*5;blit(c,kind,g.x-7,g.y+by-10,14,20);}
  }
  function prompt(orig){
    if(!uiOn())return orig();
    if(!G.prompt||G.hold>0||mode!=='play')return;
    const p=G.prompt,c=ctx,key=V.coarse?'ACT':'E';
    c.font='bold 9px '+HEAD;
    const label=p.label,tw=c.measureText(label).width,kw=V.coarse?26:14,w=tw+kw+14,h=16;
    const x=p.x-w/2,y=p.y-31+Math.sin(G.time*4)*1.5;
    panelBox(c,x,y,w,h,5,'rgba(226,172,72,.85)');
    c.fillStyle='#0e0818';c.fillRect(Math.round(x+4),Math.round(y+3),kw+2,10);c.fillStyle='#e2ac48';c.fillRect(Math.round(x+5),Math.round(y+4),kw,8);c.fillStyle='#fff0b8';c.fillRect(Math.round(x+5),Math.round(y+4),kw,1);
    c.fillStyle='#1a1018';c.textAlign='center';c.fillText(key,x+5+kw/2,y+11);
    c.fillStyle='#f0e4c8';c.textAlign='left';c.fillText(label,x+kw+10,y+11.2);
    c.fillStyle='#0e0818';for(let i=0;i<4;i++)c.fillRect(Math.round(p.x-4+i),Math.round(y+h+i),8-i*2,1);
    c.fillStyle='#2a1c40';for(let i=0;i<3;i++)c.fillRect(Math.round(p.x-3+i),Math.round(y+h+i),6-i*2,1);
  }
  /* ---- vision cones: a stepped, dithered beam instead of a smooth gradient ---- */
  function cones(orig){
    if(!uiOn())return orig();
    const c=ctx;
    drawCoverRing(c);
    for(const g of G.guards){
      if(g.stun>0||g.dead||g.eng)continue;
      const range=5.2*T*G.rangeMul*(G.maskT>0?.65:1)*(g.rm||1)*(g.kr||1);
      const pts=visPoly(g,range,g.half||.62);
      const seeing=g.seeing,alert=g.lure||g.ret,col=seeing?'255,84,62':alert?'255,196,96':'255,238,176';
      const s=env.stepped('g',range,1,col);
      c.save();c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.clip();
      c.globalAlpha=seeing?.95:alert?.75:.55;c.drawImage(s,Math.round(g.x-s.width/2),Math.round(g.y-s.height/2));c.restore();
      c.globalAlpha=1;c.strokeStyle='rgba('+col+','+(seeing?.7:alert?.45:.28)+')';c.lineWidth=1;c.beginPath();pts.forEach((q,i)=>i?c.lineTo(Math.round(q[0])+.5,Math.round(q[1])+.5):c.moveTo(Math.round(q[0])+.5,Math.round(q[1])+.5));c.closePath();c.stroke();
      drawScentRing(c,g);
    }
  }
  /* ---- particles: square pixels, not soft discs ---- */
  function particles(orig){
    if(!uiOn())return orig();
    const c=ctx;
    for(let pass=0;pass<2;pass++){
      if(pass)c.globalCompositeOperation='lighter';
      for(const p of PT){
        if(!!p.add!==!!pass&&p.k!=='text')continue;
        if(p.k==='text'){if(pass===0)continue;}
        const a=Math.max(0,p.l/p.m);
        if(p.k==='text'){if(!(typeof PX!=='undefined'&&PX.active))drawFloatText(c,p);c.globalCompositeOperation=pass?'lighter':'source-over';continue;}
        if(p.k==='smoke'){const r=Math.max(2,Math.round(p.s*(1.7-a*.6)*.8));c.globalAlpha=a*.4;c.fillStyle=p.c;
          c.fillRect(Math.round(p.x-r),Math.round(p.y-r/2),r*2,r);c.fillRect(Math.round(p.x-r/2),Math.round(p.y-r),r,r*2);continue;}
        const sz=Math.max(1,Math.round(Math.max(.3,p.s*(.35+a*.65))*1.5));
        c.globalAlpha=pass?a:a*.9;c.fillStyle=p.c;c.fillRect(Math.round(p.x-sz/2),Math.round(p.y-sz/2),sz,sz);
      }
      c.globalAlpha=1;
    }
    c.globalCompositeOperation='source-over';c.globalAlpha=1;
  }
  /* ---- minimap: crisp pixels, coloured by what each room is made of ---- */
  const FLOORC={kitchen:'#b8663c',store:'#7a4e34',relic:'#5a3a6a',barracks:'#8a5a38',yard:'#6a7a58',coal:'#3a2e3c',ossuary:'#a89cb0',culvert:'#56627a'};
  let MM={cv:null,key:'',G:null};
  function minimap(x,y,w,h,orig){
    if(!uiOn())return orig(x,y,w,h);
    const c=ctx,gw=G.gw,gh=G.gh,sx=w/gw,sy=h/gh;
    panelBox(c,x-4,y-4,w+8,h+8,6);
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    const key=(G.fogRev||0)+'|'+G.state+'|'+gw+'|'+Object.values(G.doors).filter(d=>d.open).length;
    if(!MM.cv||MM.key!==key||MM.G!==G){
      MM.key=key;MM.G=G;const cv=MM.cv||(MM.cv=document.createElement('canvas'));cv.width=gw;cv.height=gh;const m=cv.getContext('2d');
      m.fillStyle='#07050b';m.fillRect(0,0,gw,gh);const slice=G.d===LEVELS[0]&&!G.d.hub;
      for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){
        const ch=G.grid[j][i];if(ch===' ')continue;const known=G.fog&&G.fog[j][i]||G.flight;
        if(ch==='#'){m.fillStyle=known?'#4a3c6a':'#1a1428';}
        else{const r=slice?env.roomAt(i,j):null,fc=r&&FLOORC[r[5]];m.fillStyle=known?(fc||'#7a7490'):'#221a32';}
        m.fillRect(i,j,1,1);
      }
      for(const kk in G.doors){const d=G.doors[kk];if(!d.open&&G.fog&&G.fog[d.y][d.x]){m.fillStyle='#e2ac48';m.fillRect(d.x,d.y,1,1);}}
    }
    const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(MM.cv,x,y,w,h);c.imageSmoothingEnabled=sm;
    const pulse=.6+.4*Math.sin(G.time*5),px=(wx)=>Math.round(x+wx/T*sx),py=(wy)=>Math.round(y+wy/T*sy);
    const dot=(wx,wy,r,col)=>{c.fillStyle='#0e0818';c.fillRect(px(wx)-r-1,py(wy)-r-1,r*2+2,r*2+2);c.fillStyle=col;c.fillRect(px(wx)-r,py(wy)-r,r*2,r*2);};
    for(const it of G.items){if(it.done||!'OPBLHC'.includes(it.type))continue;if(G.d.timeshift&&((it.type==='P'&&G.state!=='ball')||(it.type==='O'&&G.state!=='ruin')))continue;c.globalAlpha=pulse;dot(it.x,it.y,1,'#f0b44c');c.globalAlpha=1;}
    if(G.exitOpen){c.globalAlpha=pulse;dot(G.exit.x,G.exit.y,1,'#6af09a');c.globalAlpha=1;}else dot(G.exit.x,G.exit.y,1,'#4a6a56');
    for(const g of G.guards){if(g.dead)continue;const A_=G.active==='wren'?G.wren:G.ash,dd=Math.hypot(g.x-A_.x,g.y-A_.y);if(dd<8*T||g.seeing)dot(g.x,g.y,1,g.seeing?'#ff4a4a':g.stun>0?'#888':'#d85050');}
    if(!G.wren.hidden)dot(G.wren.x,G.wren.y,1,G.active==='wren'?'#ffffff':'#a89ad8');
    if(G.ash.on)dot(G.ash.x,G.ash.y,1,G.active==='ash'?'#ffffff':'#ff9a4a');
    const vr=viewRect();c.strokeStyle='rgba(226,172,72,.8)';c.lineWidth=1;
    c.strokeRect(Math.round(x+vr.x/T*sx)+.5,Math.round(y+vr.y/T*sy)+.5,Math.round(Math.min(vr.w,gw*T)/T*sx),Math.round(Math.min(vr.h,gh*T)/T*sy));
    c.restore();
  }
  return{item,insp,inspArt,crack,mech,story,fg,beams,heart,icon,markers,prompt,cones,particles,minimap,ring,uiOn};
})();
window.EMX={mech:(...a)=>EM.fx.mech(...a),story:(c,l,r)=>EM.fx.story(c,l,r),beams:(c,w,h)=>EM.fx.beams(c,w,h),heart:(c,f)=>EM.fx.heart(c,f),markers:(g,o)=>EM.fx.markers(g,o),prompt:o=>EM.fx.prompt(o)};
{
  const _drawItem=drawItem;drawItem=function(it){if(EM.env.ready()&&EM.fx.item(it))return;return _drawItem(it);};
  const _drawCrack=drawCrack;drawCrack=function(ck){if(EM.env.ready()){EM.fx.crack(ck);return;}return _drawCrack(ck);};
  const _chests2=drawChestsInsp;
  drawChestsInsp=function(){
    if(!EM.env.ready())return _chests2();
    const hi=G.insp;G.insp=[];try{_chests2();}finally{G.insp=hi;}   // chests were already ours; now the story points
    EM.fx.insp();
  };
  const _fg=TILES.fg;TILES.fg=function(c){if(EM.env.ready()&&!G.flight){EM.fx.fg(c);return;}return _fg.apply(this,arguments);};
  const _icon=icon;icon=function(c,name,x,y,s,col,dim){if(EM.fx.icon(c,name,x,y,s,col,dim))return;return _icon.apply(this,arguments);};
  const _cones=drawCones;drawCones=function(){return EM.fx.cones(_cones);};
  const _parts=drawParticles;drawParticles=function(){return EM.fx.particles(_parts);};
  const _mm=drawMinimap;drawMinimap=function(x,y,w,h){return EM.fx.minimap(x,y,w,h,_mm);};
}
