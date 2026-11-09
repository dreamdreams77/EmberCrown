// A reaction-delayed combat bot. Exposed as window.__bot via page.addInitScript-like injection.
window.__bot=(function(){
  const dirKeys=['d','a','s','w'];
  function setMove(ax,ay){const k=__ec.keys;k['d']=ax>.35;k['a']=ax<-.35;k['s']=ay>.35;k['w']=ay<-.35;}
  function clearKeys(){const k=__ec.keys;for(const n of ['d','a','s','w',' ','e','shift'])k[n]=false;}
  function me(){const G=__ec.G;return G.active==='wren'?G.wren:G.ash;}
  function dangerAt(G,x,y,margin){ // seconds until the nearest telegraph resolves at this point, or null
    let best=null;
    for(const z of G.tele){
      if(z.t<0)continue;
      let inside=false;
      if(z.type==='circle')inside=Math.hypot(x-z.x,y-z.y)<z.r+margin;
      else if(z.type==='line'){const dx=Math.cos(z.a),dy=Math.sin(z.a),rx=x-z.x,ry=y-z.y,al=rx*dx+ry*dy,pe=Math.abs(-rx*dy+ry*dx);inside=al>-10&&al<z.len+margin&&pe<z.w/2+margin;}
      else if(z.type==='cone'){const d=Math.hypot(x-z.x,y-z.y);let da=Math.atan2(y-z.y,x-z.x)-z.a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;inside=d<z.r+margin&&Math.abs(da)<z.half+.2;}
      if(inside){const el=z.t0-z.t;best=best==null?{t:z.t,el,z}:(z.t<best.t?{t:z.t,el,z}:best);}
    }
    return best;
  }
  function bestEscape(G,A,z){ // pick the open direction that gets us out of the zone fastest
    let best=null,bs=-1e9;
    for(let k=0;k<16;k++){
      const a=k/16*6.2832,dx=Math.cos(a),dy=Math.sin(a);let x=A.x,y=A.y,ok=true;
      for(let i=1;i<=10;i++){const nx=A.x+dx*i*8,ny=A.y+dy*i*8;if(blocked(nx,ny,9)){ok=false;break;}x=nx;y=ny;}
      let score=ok?0:-60;
      if(z.type==='circle')score+=Math.hypot(x-z.x,y-z.y);
      else if(z.type==='line'){const ux=Math.cos(z.a),uy=Math.sin(z.a);score+=Math.abs(-(x-z.x)*uy+(y-z.y)*ux);}
      else score+=Math.hypot(x-z.x,y-z.y);
      score+=Math.hypot(x-A.x,y-A.y)*.2;
      if(score>bs){bs=score;best=[dx,dy];}
    }
    return best;
  }
  function escapeDir(G,x,y,z){
    if(z.type==='circle'){const a=Math.atan2(y-z.y,x-z.x);return [Math.cos(a),Math.sin(a)];}
    if(z.type==='line'){const dx=Math.cos(z.a),dy=Math.sin(z.a),rx=x-z.x,ry=y-z.y,pe=-rx*dy+ry*dx,s=pe>=0?1:-1;return [-dy*s,dx*s];}
    const a=Math.atan2(y-z.y,x-z.x);return [Math.cos(a),Math.sin(a)];
  }
  function step(o){ // o: {rd, role:'wren'|'ash'|'both', goal fn}
    const G=__ec.G,A=me();
    clearKeys();
    const rd=o.rd;
    // 1. dodge telegraphs and orbs after a human reaction delay
    const d=dangerAt(G,A.x,A.y,12);
    let evade=null;
    if(d&&d.el>=rd)evade=bestEscape(G,A,d.z);
    for(const p of G.proj){const dist=Math.hypot(p.x-A.x,p.y-A.y);
      if(dist<(o.projDist||70)){const ttl=dist/Math.max(1,Math.hypot(p.vx,p.vy));p.seenAt=p.seenAt==null?G.time:p.seenAt;
        if(G.time-p.seenAt>=rd*.7&&Math.hypot(p.vx,p.vy)>0&&((p.vx*(A.x-p.x)+p.vy*(A.y-p.y))>0)){const pe=(-(A.x-p.x)*p.vy+(A.y-p.y)*p.vx)/Math.hypot(p.vx,p.vy);if(Math.abs(pe)<16){const s=pe>=0?1:-1;evade=[-p.vy/Math.hypot(p.vx,p.vy)*s,p.vx/Math.hypot(p.vx,p.vy)*s];if(dist<34)o.wantDodge=true;}}}}
    for(const sh of G.shock){if(sh.delay>0)continue;const dd=Math.hypot(A.x-sh.x,A.y-sh.y);if(Math.abs(dd-sh.r)<26&&dd<sh.max){const a=Math.atan2(A.y-sh.y,A.x-sh.x);evade=[Math.cos(a),Math.sin(a)];if(dd-sh.r<18)o.wantDodge=true;}}
    if(evade){
      setMove(evade[0],evade[1]);A.face=Math.atan2(evade[1],evade[0]);
      if((d&&d.t<.16)||o.wantDodge){ if(G.active==='wren')rollPress();else dashPress(); }
      o.wantDodge=false;if(o.opp)o.opp(G,A);return;
    }
    // 2. fight
    return o.act(G,A);
  }
  function toward(A,x,y,stop){
    const dx=x-A.x,dy=y-A.y,d=Math.hypot(dx,dy);
    if(d<=stop){setMove(0,0);return d;}
    let tx=x,ty=y;
    if(!los(A.x,A.y,x,y)||blocked(A.x+dx/d*14,A.y+dy/d*14,9)){const path=foePath({x:A.x,y:A.y,kind:'cinder'},x,y);while(path.length&&Math.hypot(path[0][0]-A.x,path[0][1]-A.y)<10)path.shift();if(path.length){tx=path[0][0];ty=path[0][1];}}
    const ex=tx-A.x,ey=ty-A.y,ed=Math.hypot(ex,ey)||1;setMove(ex/ed,ey/ed);return d;
  }
  return {step,toward,setMove,clearKeys,me};
})();
