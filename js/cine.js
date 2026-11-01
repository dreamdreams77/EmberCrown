'use strict';
/* EMBERCROWN - cinematic director: level fly-overs, boss entrances, death and victory sequences. */
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const easeOut=u=>1-Math.pow(1-clamp(u,0,1),3);

function hitstop(d){if(G)G.hitstop=Math.max(G.hitstop||0,d);}
function punch(a){if(G)G.punch=Math.max(G.punch||0,a);}

function startCine(kind,o){
  const c=Object.assign({kind,t:0,dur:2,skippable:true,minSkip:.5,cam:null,tick:null,onEnd:null,banner:null,caps:null,skip:false},o||{});
  G.cine=c;
  Aud.fire(false);touch.act=touch.fire=false;mouse.down=false;
  return c;
}
function stepCine(dt){
  const c=G.cine;if(!c)return;
  c.t+=dt;
  if(c.tick)c.tick(c,dt);
  if(c.skip&&c.skippable&&c.t>c.minSkip&&c.t<c.dur){c.t=c.dur;}
  if(c.t>=c.dur){
    G.cine=null;G.ts=G.tsT=1;
    if(c.onEnd)c.onEnd(c);
  }
}
function skipCine(){if(G&&G.cine&&G.cine.skippable)G.cine.skip=true;}

/* ---------- level intro: a fly-over of what you have to do ---------- */
function introCine(short){
  const A=G.wren;
  if(short||settings.cinema==='short'){
    startCine('intro',{dur:1.5,minSkip:.2,short:true,title:true,
      cam:u=>({x:A.x,y:A.y,z:1.22-.22*ease(u*1.3)})});
    return;
  }
  const W=V.ww,H=V.wh,lab=G.d.labels,seen={},pts=[];
  for(const it of G.items){
    if(!'OPBLHC'.includes(it.type)||seen[it.type]||!lab[it.type])continue;
    seen[it.type]=1;pts.push({x:it.x,y:it.y,cap:lab[it.type]});
  }
  if(G.boss)pts.push({x:G.boss.x,y:G.boss.y,cap:lab.W||'Defeat the guardian',boss:true});
  pts.sort((a,b)=>Math.hypot(a.x-A.x,a.y-A.y)-Math.hypot(b.x-A.x,b.y-A.y));
  pts.length=Math.min(pts.length,3);
  const seq=[{x:W/2,y:H/2,z:null,cap:null},...pts.map(p=>({x:p.x,y:p.y,z:1.12,cap:p.cap})),{x:A.x,y:A.y,z:1,cap:null}];
  const n=seq.length,HOLD=.95,MOVE=.65,HOLD2=.45;
  const dur=HOLD+(n-1)*(MOVE+HOLD2);
  const zOf=s=>s.z==null?fitScale()/baseScale():s.z;
  startCine('intro',{dur,title:true,seq,
    cam:(u,t)=>{
      if(t<HOLD)return{x:seq[0].x,y:seq[0].y,z:zOf(seq[0])*(1+.03*t)};
      const k=Math.min(n-1,Math.floor((t-HOLD)/(MOVE+HOLD2))+1),st=HOLD+(k-1)*(MOVE+HOLD2);
      const e=ease((t-st)/MOVE),a=seq[k-1],b=seq[k];
      return{x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e,z:zOf(a)+(zOf(b)-zOf(a))*e};
    },
    capAt:t=>{
      if(t<HOLD)return null;
      const k=Math.min(n-1,Math.floor((t-HOLD)/(MOVE+HOLD2))+1),st=HOLD+(k-1)*(MOVE+HOLD2);
      return seq[k].cap&&t-st>MOVE*.55?{text:seq[k].cap,a:Math.min(1,(t-st-MOVE*.55)/.25)*Math.min(1,(st+MOVE+HOLD2-t)/.2+.2)}:null;
    },
    onEnd:()=>{say(G.flight?'Ashling':'Wren',G.d.opening);}
  });
}

/* ---------- mission complete ---------- */
function beginVictory(){
  const A=G.flight?G.ash:G.wren;
  Aud.S.win();
  startCine('exit',{dur:3.0,minSkip:1.4,
    cam:u=>({x:A.x,y:A.y-8,z:1+.45*easeOut(u)}),
    banner:{title:'MISSION COMPLETE',sub:G.d.name,t0:.5,t1:2.8},
    tick:(c,dt)=>{
      c.fw=(c.fw||0)-dt;
      if(c.fw<=0){c.fw=.28;
        const ang=Math.random()*6.283,r=40+Math.random()*60,x=A.x+Math.cos(ang)*r,y=A.y-30+Math.sin(ang)*r*.6;
        const col=['#ffd27a','#ff9a4a','#c8b4ff','#7be08a','#7fd0ff'][Math.random()*5|0];
        burst(x,y,26,col,110,1.2,2.4,{add:true,g:60,dr:1.2});Aud.S.ember();
      }
      if(c.t>c.dur-.8&&!c.fade){c.fade=1;G.flash={t:.8,c:'255,232,170'};}
    },
    onEnd:()=>{finishLevel();}
  });
  G.ash.celebrate=1.6;
}
