/* EMBERCROWN - pixel pass.
   With pixel art on, the whole world is drawn into a small buffer at one buffer pixel per world unit
   (the native size of the LPC sprites: a 32px tile is 32 buffer pixels) and then scaled up with hard edges.
   Sprites, tiles, props, light and cones all land on the same pixel grid, so the scene reads as one style.
   Text that belongs to the world (the interact prompt) is drawn afterwards at full resolution. */
'use strict';
const PX={cv:document.createElement('canvas'),active:false,was:false,
  on(){return LPC.on();}};
{
  const _drawWorld=drawWorld,_drawPrompt=drawPrompt;
  drawPrompt=function(){if(!PX.active)_drawPrompt();};
  drawWorld=function(){
    const on=PX.on();
    if(on!==PX.was){PX.was=on;G.dirty=true;G.lightsBaked=false;}
    if(!on)return _drawWorld();
    const main=ctx,dpr0=V.dpr,cx0=V.cx,cy0=V.cy;
    const vd=1/V.sc;                               // buffer pixels per CSS pixel
    const bw=Math.ceil(V.w*vd)+2,bh=Math.ceil(V.h*vd)+2;
    if(PX.cv.width!==bw||PX.cv.height!==bh){PX.cv.width=bw;PX.cv.height=bh;}
    // Snap the camera to whole buffer pixels for the pass; the leftover fraction is put back when scaling up,
    // so the camera still glides while every sprite stays on the grid.
    const tx=(V.w/2-cx0*V.sc+V.sx)*vd,ty=(V.h/2-cy0*V.sc+V.sy)*vd,ix=Math.floor(tx),iy=Math.floor(ty);
    V.dpr=vd;V.cx=(V.w/2+V.sx-(ix+1)/vd)/V.sc;V.cy=(V.h/2+V.sy-(iy+1)/vd)/V.sc;
    ctx=PX.cv.getContext('2d');PX.active=true;
    try{_drawWorld();}
    finally{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
      ctx=main;PX.active=false;V.dpr=dpr0;V.cx=cx0;V.cy=cy0;}
    const S=dpr0/vd;                               // device pixels per buffer pixel
    main.setTransform(1,0,0,1,0,0);main.globalAlpha=1;main.globalCompositeOperation='source-over';
    main.imageSmoothingEnabled=false;
    main.drawImage(PX.cv,(tx-ix-1)*S,(ty-iy-1)*S,bw*S,bh*S);
    main.imageSmoothingEnabled=true;
    setWorldTransform();_drawPrompt();
  };
}
