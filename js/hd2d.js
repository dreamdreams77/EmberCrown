/* EMBERCROWN - HD-2D lighting for the pixel-art mode.
   The pixel pass (js/pixel.js) draws the world on a hard-edged pixel grid. This layer adds smooth, modern
   light on top of it at full resolution, the way HD-2D games light pixel sprites:
   - bloom: soft additive halos and hot cores around flames, braziers, beacons, candles and Ashling's fire;
   - light shafts: faint warm beams falling from wall torches;
   - dust motes drifting slowly through the light pools;
   - tilt-shift depth of field: the top and bottom of the screen go softly out of focus;
   - grade and vignette: warm light, cool shadow, darker corners.
   Only while pixel art is on, and settings.hd2d is not false ("HD-2D light" in the pause menu).
   Cost is a few full-screen draws; the quality tiers drop depth of field and dust first. */
'use strict';
const HD2D=(function(){
  const blur={cv:document.createElement('canvas')},mask={cv:document.createElement('canvas')};
  const motes=[];let gradKey='',gradC=null,vigKey='',vigC=null;
  function on(){return typeof PX!=='undefined'&&PX.on()&&settings.hd2d!==false&&mode!=='title';}
  function rnd(a,b){return a+Math.random()*(b-a);}

  // Depth of field: a low-resolution, smoothed copy of the pixel buffer drawn over the top and bottom bands,
  // faded in with a vertical mask so the middle stays sharp.
  function dof(main,W,H){
    if(Q.tier>=2)return;
    const src=PX.cv;if(!src.width)return;
    const k=V.coarse?.14:.16,bw=Math.max(8,Math.round(W*k)),bh=Math.max(8,Math.round(H*k));
    if(blur.cv.width!==bw||blur.cv.height!==bh){blur.cv.width=bw;blur.cv.height=bh;}
    const b=blur.cv.getContext('2d');
    b.globalCompositeOperation='source-over';b.imageSmoothingEnabled=true;b.clearRect(0,0,bw,bh);
    b.drawImage(main.canvas,0,0,W,H,0,0,bw,bh);                       // downsample the finished world frame
    const key=bw+'x'+bh;
    if(mask.key!==key){                                              // vertical focus mask: sharp band in the middle
      mask.cv.width=1;mask.cv.height=bh;mask.key=key;const m=mask.cv.getContext('2d');
      const g=m.createLinearGradient(0,0,0,bh);
      g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.26,'rgba(0,0,0,0)');g.addColorStop(.74,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');
      m.fillStyle=g;m.fillRect(0,0,1,bh);
    }
    b.globalCompositeOperation='destination-in';b.drawImage(mask.cv,0,0,bw,bh);
    main.save();main.setTransform(1,0,0,1,0,0);main.imageSmoothingEnabled=true;main.imageSmoothingQuality='high';
    main.drawImage(blur.cv,0,0,W,H);main.restore();
  }

  // Bloom and light shafts, in world space over the upscaled pixels.
  function bloom(main){
    if(typeof collectLights!=='function')return;
    const L=collectLights(),t=G.time;
    // dark levels get full bloom, bright halls much less (otherwise warm rooms blow out to white)
    const amb=(G.d.th&&G.d.th.amb)?G.d.th.amb[3]:.3,K=Math.max(.22,Math.min(.75,(amb-.12)*2.2));
    main.save();setWorldTransform();main.globalCompositeOperation='lighter';main.imageSmoothingEnabled=true;
    for(const l of L){
      if(!l.gl||l.gl<.35||l.a<.5)continue;
      const fl=1+Math.sin(t*7+l.x*.13)*.05,r=Math.min(220,l.r*.95)*fl;
      main.globalAlpha=Math.min(.42,l.gl*.38)*K;main.drawImage(glowSprite(l.col),l.x-r*1.5,l.y-r*1.5,r*3,r*3); // wide soft halo
      main.globalAlpha=Math.min(.6,l.gl*.55)*K;main.drawImage(glowSprite(l.col),l.x-r*.55,l.y-r*.55,r*1.1,r*1.1); // bright pool
      const rc=Math.min(30,r*.16);main.globalAlpha=Math.min(.9,l.gl*.9)*(.5+.5*K);main.drawImage(glowSprite('255,244,214'),l.x-rc,l.y-rc,rc*2,rc*2);
    }
    // light shafts below lit wall torches
    if(Q.tier<2)for(const tr of G.torches||[]){
      if(tr.out||tr.pipe||tr.small)continue;
      const vr=viewRect();if(tr.x<vr.x-60||tr.x>vr.x+vr.w+60||tr.y<vr.y-60||tr.y>vr.y+vr.h+120)continue;
      const g=main.createLinearGradient(tr.x,tr.y,tr.x+18,tr.y+92);
      g.addColorStop(0,'rgba('+(tr.col||'255,170,90')+',.22)');g.addColorStop(1,'rgba('+(tr.col||'255,170,90')+',0)');
      main.globalAlpha=K;main.fillStyle=g;main.beginPath();
      main.moveTo(tr.x-5,tr.y+4);main.lineTo(tr.x+5,tr.y+4);main.lineTo(tr.x+36,tr.y+96);main.lineTo(tr.x-14,tr.y+96);main.closePath();main.fill();
    }
    main.restore();
  }

  // Dust motes that only show where light falls.
  function dust(main,dt){
    if(Q.tier>=2||typeof lightAt!=='function')return;
    const vr=viewRect(),want=V.coarse?26:44;
    while(motes.length<want)motes.push({x:rnd(vr.x,vr.x+vr.w),y:rnd(vr.y,vr.y+vr.h),vx:rnd(-4,4),vy:rnd(-7,-2),p:rnd(0,6),s:rnd(.6,1.4)});
    main.save();setWorldTransform();main.globalCompositeOperation='lighter';
    for(const m of motes){
      m.x+=(m.vx+Math.sin(G.time*.7+m.p)*3)*dt;m.y+=m.vy*dt;
      if(m.x<vr.x-10||m.x>vr.x+vr.w+10||m.y<vr.y-10||m.y>vr.y+vr.h+10){m.x=rnd(vr.x,vr.x+vr.w);m.y=vr.y+vr.h+rnd(0,8);}
      if(((m._k=(m._k||0)+1)&7)===1)m.l=lightAt(m.x,m.y);
      if(!(m.l>.18))continue;
      main.globalAlpha=Math.min(.75,m.l*.8)*(.6+.4*Math.sin(G.time*2+m.p));
      main.fillStyle='rgba(255,226,170,1)';main.fillRect(m.x,m.y,m.s,m.s);
    }
    main.restore();
  }

  // Colour grade (warm light, cool shadow) and a soft vignette, cached per screen size.
  function grade(main,W,H){
    // each house has its own light: [shadow tint (top), light tint (bottom)]
    const MOOD={marrow:['70,70,170,.30','255,140,70,.18'],grell:['90,40,40,.24','255,190,90,.26'],ostrander:['30,110,150,.30','255,220,150,.16'],
      sable:['50,70,170,.34','190,200,255,.14'],kest:['80,30,20,.26','255,120,40,.30'],dunmoor:['50,60,150,.30','255,170,200,.18'],
      hallow:['70,40,30,.26','255,190,110,.28'],hub:['60,50,90,.20','255,180,110,.26']};
    const hk=typeof TILES!=='undefined'&&TILES.key?TILES.key():'marrow',md=MOOD[hk]||MOOD.marrow,key=W+'x'+H+hk;
    if(gradKey!==key){gradKey=key;gradC=document.createElement('canvas');gradC.width=W;gradC.height=H;const g=gradC.getContext('2d');
      const lg=g.createLinearGradient(0,0,0,H);lg.addColorStop(0,'rgba('+md[0]+')');lg.addColorStop(.55,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba('+md[1]+')');
      g.fillStyle=lg;g.fillRect(0,0,W,H);}
    if(vigKey!==W+'x'+H){vigKey=W+'x'+H;vigC=document.createElement('canvas');vigC.width=W;vigC.height=H;const g=vigC.getContext('2d');
      const rg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.hypot(W,H)*.62);rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(6,4,14,.66)');
      g.fillStyle=rg;g.fillRect(0,0,W,H);}
    main.save();main.setTransform(1,0,0,1,0,0);
    main.globalCompositeOperation='soft-light';main.drawImage(gradC,0,0);
    main.globalCompositeOperation='source-over';main.drawImage(vigC,0,0);
    main.restore();
  }

  let lastT=null;
  function post(){
    if(!on())return;
    const main=ctx,W=main.canvas.width,H=main.canvas.height;
    const dt=lastT==null?0:Math.min(.05,Math.max(0,G.time-lastT));lastT=G.time;
    dof(main,W,H);bloom(main);dust(main,dt);grade(main,W,H);
    main.globalAlpha=1;main.globalCompositeOperation='source-over';
  }
  return{on,post};
})();
{
  // After the pixel pass has scaled the world up, light it; world text drawn by the pixel pass stays on top.
  const _drawWorld=drawWorld;
  drawWorld=function(){
    if(!HD2D.on())return _drawWorld();
    // The pixel pass calls setWorldTransform() right after scaling the world up, and before it draws the crisp
    // world text; that first call outside the buffer pass is where the light goes.
    const _swt=setWorldTransform;let done=false;
    setWorldTransform=function(){_swt();if(!done&&!PX.active){done=true;HD2D.post();_swt();}};
    try{_drawWorld();}finally{setWorldTransform=_swt;}
    if(!done)HD2D.post();
  };
}
