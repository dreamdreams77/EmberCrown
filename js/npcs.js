'use strict';
/* EMBERCROWN - NPCs, dialogue overlay, optional quests, house standing consequences and exploration beats.
   Data lives in npcdata.js. Hooks into game.js: NPC.init (loadLevel), NPC.update, NPC.target/activate (interact),
   NPC.key (press), NPC.outcome (applyOutcome), world.js draw calls, ui.js briefing (NPC.briefHtml). */
const NPC=(function(){
const QDEF={};
NPCDATA.forEach((L,i)=>(L.quests||[]).forEach(q=>{q.lvl=i;q.house=L.house;QDEF[q.id]=q;}));
const HOUSE_LABEL={marrow:'Marrow',grell:'Grell',ostrander:'Ostrander',sable:'Sable',kest:'Kest',dunmoor:'Dunmoor',hallow:'Hallow'};
let el=null;

function ensureRun(){ if(!run.quests)run.quests={}; if(!run.npc)run.npc={flags:{}}; if(!run.npc.flags)run.npc.flags={}; if(!run.npc.aff)run.npc.aff={}; if(!run.npc.chains)run.npc.chains={}; if(!run.npc.docs)run.npc.docs=[]; if(!run.npc.hub)run.npc.hub={}; }
/* ---------- standing ---------- */
function stand(house){
  const h=houses[house];let f,e,r;
  if(h){f=h.favor;e=h.fear;r=h.ruin;}
  else{const c=houseCounts();f=c.f>=2?c.f:0;e=c.e>=2?c.e:0;r=c.r>=2?c.r:0;}
  const m=Math.max(f,e,r);if(m<=0)return 'none';
  return e===m?'fear':f===m?'favor':'ruin';
}
function priceMul(nq){let m=nq.st==='favor'?.7:nq.st==='fear'?1.25:nq.st==='ruin'?.7:1;if(nq.hub&&window.Hub&&G.talk)m*=Hub.priceMul(G.talk.npc.id);return m;}
function avail(){return (G.cinders||0)+(run.cinders||0)-(G.nq?G.nq.debt:0);}
/* ---------- conditions ---------- */
function cond(s,nq){
  if(!s)return true;nq=nq||G.nq;
  return s.split('&').every(tok=>{
    tok=tok.trim();let neg=false;if(tok[0]==='!'){neg=true;tok=tok.slice(1);}
    const i=tok.indexOf(':'),k=i<0?'':tok.slice(0,i),v=tok.slice(i+1);let r=false;
    if(k==='st')r=nq.st===v;
    else if(k==='flag')r=!!(run.npc.flags[v]||nq.nf[v]);
    else if(k==='tmp')r=!!nq.tmp[v];
    else if(k==='cin')r=avail()>=+v;
    else if(k==='aff'){const m=v.match(/^(\w+)(>=|<=)(-?\d+)$/);if(m){const a=(run.npc.aff||{})[m[1]]||0;r=m[2]==='>='?a>=+m[3]:a<=+m[3];}}
    else if(k==='ch'){const m=v.match(/^(\w+)(>=|=)(\w+)$/);if(m){const c=(run.npc.chains||{})[m[1]],sv=m[3];
      if(m[2]==='>=')r=!!c&&(c.st==='done'||c.st==='active'&&c.s>=+sv);
      else if(sv==='none')r=!c;else if(sv==='active'||sv==='done'||sv==='failed')r=!!c&&c.st===sv;else r=!!c&&c.st==='active'&&c.s===+sv;}}
    else if(/^lv[<>=]/.test(tok)){const m=tok.match(/^lv(>=|<=|=)(\d+)$/),L=nq.hub?nq.next:nq.i;if(m)r=m[1]==='>='?L>=+m[2]:m[1]==='<='?L<=+m[2]:L===+m[2];}
    else if(k==='q'){
      const m=v.match(/^(\w+)(>=|=)(\w+)$/);if(m){const qs=nq.q[m[1]],sv=m[3];
        if(m[2]==='='){ if(sv==='none')r=!qs; else if(sv==='active')r=!!qs&&qs.state==='active'; else if(sv==='done'||sv==='failed')r=!!qs&&qs.state===sv; else r=!!qs&&qs.state==='active'&&qs.step===+sv; }
        else r=!!qs&&qs.state==='active'&&qs.step>=+sv;}
    }
    return neg?!r:r;
  });
}
/* ---------- level setup ---------- */
function init(g,i){
  ensureRun();
  const hub=!!(g.d&&g.d.hub),D=hub?HUBDATA:NPCDATA[i];if(!D){g.nq=null;return;}
  const OBJS=(D.objs||[]).concat(!hub&&window.Hub?Hub.missionObjs(g,i):[]);
  const nq={i,D,hub,next:hub?g.d.next:i,st:stand(D.house),q:{},tmp:{},nf:{},pend:[],debt:0,npcs:[],objs:[],route:null,seq:0,clue:null};
  g.nq=nq;
  for(const n of D.npcs||[]){
    if(n.show&&!cond(n.show,nq))continue;
    nq.npcs.push(Object.assign({},n,{px:n.x*T+16,py:n.y*T+16,face:Math.PI*.5,ph:Math.random()*6,fade:1,gone:false,fading:false,follow:false,free:false,dest:null,met:false}));
  }
  { // clear decor props from contact tiles (and their neighbours) so nobody stands inside a crate
    const spots=[...nq.npcs.map(n=>[n.x,n.y]),...OBJS.map(o=>[o.x,o.y])];
    g.props=g.props.filter(p=>{
      const hit=spots.some(([sx,sy])=>sx>=p.x-1&&sx<=p.x+p.w&&sy>=p.y-1&&sy<=p.y+p.h);
      if(hit)for(let a=0;a<p.w;a++)for(let b=0;b<p.h;b++)g.pblock.delete(pkey(p.x+a,p.y+b));
      return !hit;
    });
    for(const [sx,sy] of spots)g.pblock.delete(pkey(sx,sy));
  }
  for(const o of OBJS)nq.objs.push(Object.assign({},o,{px:o.x*T+16,py:o.y*T+16,done:false,cd:0,p:0,hint:false,ph:Math.random()*6}));
  if(D.route){
    nq.route={x:D.route.x,y:D.route.y,lever:D.route.lever,open:false,hint:nq.st==='favor'};
    g.secretsTotal++;
    const lv=nq.objs.find(o=>o.id===D.route.lever);if(lv)lv.hint=nq.route.hint;
    if(nq.st==='ruin'){ // the house is already coming apart: the wall has given way
      g.grid[D.route.y][D.route.x]='.';if(g.baseGrid)g.baseGrid[D.route.y][D.route.x]='.';
      nq.route.open=true;g.dirty=true;
      if(lv)lv.done=true;
    }
  }
  if(nq.st==='ruin'){ // one fewer patrol in the mission's house
    const norm=g.guards.filter(x=>!x.boss&&!x.spin&&x.kind!=='tower');
    if(norm.length>3)g.guards.splice(g.guards.lastIndexOf(norm[norm.length-1]),1);
  }
  const lights=nq.objs.find(o=>o.kind==='light');if(lights&&nq.st==='favor')lights.hint=true;
  if(!hub&&window.Hub)Hub.missionInit(g,nq,i);
}
/* ---------- quests ---------- */
function qstart(id){
  const nq=G.nq;if(!QDEF[id]||nq.q[id])return;
  nq.q[id]={state:'active',step:0};
  toast('New task',QDEF[id].title,'#7fd0ff');
  if(G.talk)G.talk.notes.push('Task started: '+QDEF[id].title);
}
function qev(name){
  const nq=G.nq;if(!nq)return;
  for(const id in nq.q){
    const s=nq.q[id],d=QDEF[id];if(s.state!=='active')continue;
    if(d.fail&&d.fail.includes(name)){qfail(id);continue;}
    if(d.on[s.step]===name){
      s.step++;
      if(s.step>=d.steps.length)qdone(id);
      else{toast('Task updated',d.steps[s.step],'#7fd0ff');if(G.talk)G.talk.notes.push('Next: '+d.steps[s.step]);}
    }
  }
}
function qdone(id){
  const s=G.nq.q[id],d=QDEF[id];if(!s||s.state!=='active')return false;
  s.state='done';s.step=d.steps.length;
  toast('Task complete',d.title,'#7be08a');Aud.S.win&&Aud.S.win();
  const r=Object.assign({},d.rew||{});
  if(r.cin&&G.nq.st==='favor')r.cin=Math.round(r.cin*1.5);
  applyFx(r,null,d.title);
  return true;
}
function qfail(id){
  const s=G.nq.q[id];if(!s||s.state!=='active')return;
  s.state='failed';toast('Task failed',QDEF[id].title,'#e05050');
}
/* ---------- effects ---------- */
function actor(){return G.active==='wren'?G.wren:G.ash;}
function giveItem(id,alt){
  let ok=false;
  if(typeof window.giveItem==='function'){try{ok=window.giveItem(id)!==false;}catch(e){ok=false;}}
  if(!ok&&alt)applyFx(alt);
  else if(G.talk)G.talk.notes.push('Received: '+id.replace(/_/g,' '));
}
function applyFx(fx,npc,why){
  if(!fx)return;const nq=G.nq,notes=G.talk?G.talk.notes:[];
  const A=actor();
  if(fx.h&&nq.hub){houses[fx.h[0]][fx.h[1]]+=fx.h[2];notes.push('House '+HOUSE_LABEL[fx.h[0]]+': +'+fx.h[2]+' '+fx.h[1][0].toUpperCase()+fx.h[1].slice(1));}
  else if(fx.h){nq.pend.push({h:fx.h[0],t:fx.h[1],n:fx.h[2],why:why||(npc?npc.name:'')});notes.push('House '+HOUSE_LABEL[fx.h[0]]+': +'+fx.h[2]+' '+fx.h[1][0].toUpperCase()+fx.h[1].slice(1)+' (when the mission ends)');}
  if(fx.cin){addCinders(fx.cin,A.x,A.y);notes.push('+'+cinderValue(fx.cin)+' cinders');}
  if(fx.gad&&!G.flight)for(const k in fx.gad){G.gad[k]=(G.gad[k]||0)+fx.gad[k];notes.push('+'+fx.gad[k]+' '+({smoke:'smoke powder',bell:'whisper bell',flute:'flute charge'}[k]||k));}
  if(fx.heal){G.hp=fx.heal>=9?G.maxHp:Math.min(G.maxHp,G.hp+fx.heal);floatText(A.x,A.y-20,'+HEART','#ff7a8a',10);notes.push('Health restored');}
  if(fx.item)giveItem(fx.item,fx.alt);
  if(fx.q)qstart(fx.q);
  if(fx.qdone)qdone(fx.qdone);
  if(fx.qfail)qfail(fx.qfail);
  if(fx.flag){nq.nf[fx.flag]=1;if(nq.hub)run.npc.flags[fx.flag]=1;}
  if(window.Hub)Hub.fx(fx,notes,npc);
  if(fx.tmp)nq.tmp[fx.tmp]=1;
  if(fx.reveal){
    const o=nq.objs.find(o=>nq.route&&o.id===nq.route.lever)||nq.objs.find(o=>o.kind==='light');
    if(o&&!o.done){o.hint=true;if(nq.route)nq.route.hint=true;notes.push('Marked on the map: '+(o.label.replace(/^(Pull|Turn|Throw) the /,'')));}
  }
  if(fx.drop){
    const norm=G.guards.filter(x=>!x.boss&&!x.spin&&x.kind!=='tower');
    if(norm.length>1){const gd=norm[norm.length-1];G.guards.splice(G.guards.indexOf(gd),1);burst(gd.x,gd.y,10,'#cfc4a0',50,.6,2,{k:'smoke'});notes.push('A guard slips away from his post');}
  }
  if(fx.alert)G.alert=Math.min(.95,G.alert+fx.alert);
  if(fx.clue){nq.clue=fx.clue;notes.push('Clue: '+fx.clue[0]);}
  if(npc){
    if(fx.free){npc.free=true;npc.dest={x:G.exit.x,y:G.exit.y};}
    if(fx.follow){npc.follow=true;}
    if(fx.gone){npc.fading=true;}
  }
  if(fx.free&&!npc){const n=nq.npcs.find(n=>n.id===fx.free);if(n){n.free=true;n.dest={x:G.exit.x,y:G.exit.y};}}
  if(fx.ev)qev(fx.ev);
}
/* ---------- interaction ---------- */
function npcVisible(n){return !n.gone&&!n.fading&&(!n.show||cond(n.show));}
function objVisible(o){return !o.done&&(!o.show||cond(o.show));}
function target(A,bd){
  const nq=G.nq;if(!nq||G.talk||G.needRel||G.cine)return null;
  let best=null,b=bd;
  for(const n of nq.npcs){
    if(!npcVisible(n)||n.dest)continue;
    const dd=Math.hypot(n.px-A.x,n.py-A.y);
    if(dd<44&&dd<b){b=dd;best={kind:'npc',ref:n,need:.18,x:n.px,y:n.py,label:'Talk: '+n.name};}
  }
  for(const o of nq.objs){
    if(!objVisible(o)||o.kind==='burn'||o.kind==='dummy'||o.cd>0)continue;
    const dd=Math.hypot(o.px-A.x,o.py-A.y);
    if(dd<36&&dd<b){b=dd;best={kind:'qobj',ref:o,need:o.need||.7,x:o.px,y:o.py,label:o.label};}
  }
  return best;
}
function activate(t){if(t.kind==='npc')openTalk(t.ref);else if(t.kind==='qobj')useObj(t.ref);}
function useObj(o){
  const nq=G.nq,x=o.px,y=o.py;
  Aud.S.confirm();burst(x,y,12,'#ffe0a0',60,.6,2,{add:true});
  switch(o.kind){
    case 'lever':{ // opens the hidden passage
      const r=nq.route;o.done=true;
      if(r&&!r.open){
        r.open=true;G.grid[r.y][r.x]='.';if(G.baseGrid)G.baseGrid[r.y][r.x]='.';G.dirty=true;
        const wx=r.x*T+16,wy=r.y*T+16;
        burst(wx,wy,26,'#9a8f84',110,1,4,{k:'smoke',gr:8,dr:1.4});G.rings.push({x:wx,y:wy,t:.7,r:90,c:'255,200,140'});
        Aud.S.crack&&Aud.S.crack();shake(6);G.secretsFound++;
        toast('Hidden passage!','Stone grinds somewhere nearby.','#ffd27a');
      }
      break;}
    case 'gong':{
      o.cd=40;const to=o.to?{x:o.to[0]*T+16,y:o.to[1]*T+16}:{x,y};
      for(const g of G.guards){
        if(g.boss||g.spin||g.kind==='tower'||g.eng||g.stun>0)continue;
        if(!g.lure&&!g.ret)g.back={x:g.x,y:g.y};
        g.lure={x:to.x,y:to.y,t:7};g.ret=false;g.quest=1.4;
      }
      G.rings.push({x,y,t:1,r:9*T,c:'240,180,76'});G.rings.push({x:to.x,y:to.y,t:.9,r:60,c:'240,180,76'});
      Aud.S.toll&&Aud.S.toll();shake(4);
      toast('Supper is served','Every guard marches to the kitchen.','#ffd27a');
      break;}
    case 'light':{
      o.cd=30;let n=0;
      for(const g of G.guards)if(g.kind==='tower'||g.spin){g.stun=Math.max(g.stun,10);n++;}
      G.rings.push({x,y,t:1,r:200,c:'160,220,255'});Aud.S.swap&&Aud.S.swap();
      toast('Searchlights dim','The harbor lamps go blind for ten breaths.','#9fd8ff');
      break;}
    case 'valve':{
      o.cd=24;G.ventOff=8;Aud.S.gate&&Aud.S.gate();shake(3);
      burst(x,y,20,'#cfd6e6',80,.9,3,{k:'smoke',gr:4});
      toast('Steam valve shut','The vents fall quiet for a few breaths.','#cfd6e6');
      break;}
    case 'mask':{
      o.done=true;G.maskT=30;toast('Silver mask','Guards see a mask, not a face. For a while.','#e8f4ff');
      break;}
    case 'chand':{
      o.done=true;const cx=12*T+16,cy=7*T+16;
      G.chand=[];burst(cx,cy,40,'#ffd27a',160,1,3,{add:true,g:120});burst(cx,cy,20,'#9a8f84',100,1,4,{k:'smoke',gr:6});
      G.rings.push({x:cx,y:cy,t:.9,r:130,c:'255,210,120'});shake(10);Aud.S.crack&&Aud.S.crack();
      for(const g of G.guards){if(g.boss||g.spin||g.eng||g.stun>0)continue;if(Math.hypot(g.x-cx,g.y-cy)<12*T){if(!g.lure&&!g.ret)g.back={x:g.x,y:g.y};g.lure={x:cx,y:cy,t:6};g.ret=false;g.quest=1.4;}}
      toast('The chandelier falls','The dance floor scatters.','#ffd27a');
      break;}
    case 'clapper':{
      o.done=true;const B=G.boss;
      if(B&&!B.dead){B.tollT=9999;B.tollCd=9999;}
      toast('Bell muffled','The Warden tolls only to himself now.','#9fd8ff');
      break;}
    case 'plaque':{
      if(o.seq===nq.seq){
        o.touched=true;nq.seq++;floatText(x,y-16,(nq.seq)+'/3','#ffd27a',12);Aud.S.brazier&&Aud.S.brazier();
        G.rings.push({x,y,t:.6,r:60,c:'255,210,120'});
        if(nq.seq>=3){for(const p of nq.objs)if(p.kind==='plaque')p.done=true;qev('obj:plaques');}
      } else {
        nq.seq=0;for(const p of nq.objs)if(p.kind==='plaque')p.touched=false;
        floatText(x,y-16,'The plaques forget','#e05050',10);Aud.S.deflect&&Aud.S.deflect();
      }
      return;}
    case 'hub':if(window.Hub)Hub.use(o);return;
    case 'dummy':return;
    default: o.done=true; // item pickup
  }
  if(o.fx)applyFx(o.fx);
  qev('obj:'+o.id);
}
/* ---------- dialogue ---------- */
function resolve(t,nq){return typeof t==='string'?t:(t[nq.st]||t.d||'');}
function pickNode(n){
  const nq=G.nq;
  for(const e of n.entry||[{n:'s'}])if(cond(e.if,nq))return e.n;
  return 's';
}
function visChoices(node){
  const nq=G.nq,out=[];
  for(const c of node.c||[]){
    if(c.if&&!cond(c.if,nq))continue;
    if(c.once&&nq.tmp['once_'+c.once])continue;
    out.push(c);
  }
  return out.length?out:[{l:'Leave',end:1}];
}
function price(c){return Math.max(1,Math.round(c.cost*(c.shop?priceMul(G.nq):1)));}
function openTalk(n){
  if(G.talk||!G.nq)return;
  G.talk={npc:n,node:pickNode(n),notes:[],sel:0};
  n.met=true;G.needRel=true;
  touch.act=false;touch.fire=false;mouse.down=false;touch.jx=touch.jy=0;
  for(const k of ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' ','e'])keys[k]=false;
  Aud.S.scroll&&Aud.S.scroll();
  const nd=n.tree[G.talk.node];
  buildUI();
  if(nd&&nd.fx){applyFx(nd.fx,n);}
  render();
}
function closeTalk(){
  if(!G||!G.talk)return;
  const nq=G.nq;G.talk=null;
  if(el){el.remove();el=null;}
  if(nq&&nq.clue){G.loreCard={title:nq.clue[0],text:nq.clue[1],t:7,t0:7};nq.clue=null;}
}
function choose(i){
  const T0=G.talk;if(!T0)return;
  const list=visChoices(T0.npc.tree[T0.node]),c=list[i];if(!c)return;
  if(c.end){Aud.S.click&&Aud.S.click();closeTalk();return;}
  if(c.cost){const p=price(c);if(avail()<p){T0.notes=['Not enough cinders (need '+p+')'];render();Aud.S.deflect&&Aud.S.deflect();return;}
    const a=Math.min(G.cinders||0,p);G.cinders-=a;G.nq.debt+=p-a;T0.notes=['-'+p+' cinders'];}
  else T0.notes=[];
  if(c.once)G.nq.tmp['once_'+c.once]=1;
  Aud.S.click&&Aud.S.click();
  applyFx(c.fx,T0.npc);
  if(!G.talk)return;
  if(c.to&&T0.npc.tree[c.to]){
    T0.node=c.to;T0.sel=0;
    const nd=T0.npc.tree[c.to];if(nd.fx)applyFx(nd.fx,T0.npc);
    render();
  } else closeTalk();
}
/* DOM overlay (works with mouse, touch and keyboard) */
let cssDone=false;
function css(){
  if(cssDone)return;cssDone=true;
  const s=document.createElement('style');
  s.textContent='#npcdlg{position:absolute;left:max(8px,var(--sal,0px));right:max(8px,var(--sar,0px));bottom:max(8px,var(--sab,0px));z-index:9;display:flex;justify-content:center;pointer-events:none;font-family:var(--body,Georgia,serif)}'+
  '#npcdlg .nd{pointer-events:auto;width:min(720px,100%);max-height:64%;overflow:auto;display:grid;grid-template-columns:auto 1fr;gap:10px 14px;padding:10px 12px;border-radius:14px;background:rgba(22,15,29,.96);border:1px solid rgba(240,180,76,.65);box-shadow:0 8px 28px rgba(0,0,0,.6);color:var(--parch,#eadfd0)}'+
  '#npcdlg canvas{width:64px;height:64px;border-radius:12px;background:radial-gradient(circle at 50% 40%,#3a2a48,#150f1b);border:1px solid rgba(240,180,76,.4)}'+
  '#npcdlg .nm{font:700 13px/1.1 var(--head,serif);color:var(--gold,#f0b44c);letter-spacing:.06em;margin-bottom:4px}#npcdlg .nm i{font-style:normal;color:var(--muted,#9a8aa0);font-weight:400;letter-spacing:0;margin-left:6px;font-size:11px}'+
  '#npcdlg .tx{font-size:clamp(12px,2.6vmin,15px);line-height:1.35}#npcdlg .nt{margin-top:5px;font-size:11px;color:#9fd8ff;line-height:1.3}'+
  '#npcdlg .ch{grid-column:1/-1;display:flex;flex-direction:column;gap:5px}'+
  '#npcdlg button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:8px;align-items:center;min-height:38px;padding:6px 10px;border-radius:9px;background:rgba(60,44,76,.85);border:1px solid rgba(240,180,76,.35);font-size:clamp(12px,2.5vmin,14px);line-height:1.25;touch-action:manipulation}'+
  '#npcdlg button b{flex:none;width:20px;height:20px;border-radius:5px;background:var(--gold,#f0b44c);color:#1a1018;font:700 12px/20px var(--head,serif);text-align:center}'+
  '#npcdlg button.sel,#npcdlg button:hover{background:rgba(110,76,128,.95);border-color:#ffd27a}#npcdlg button[disabled]{opacity:.45;cursor:default}#npcdlg button em{margin-left:auto;font-style:normal;color:#ffd27a;font-size:11px;white-space:nowrap}'+
  '@media (max-height:420px){#npcdlg canvas{width:48px;height:48px}#npcdlg .nd{padding:7px 9px;gap:6px 10px;max-height:72%}#npcdlg button{min-height:34px;padding:4px 8px}}';
  document.head.appendChild(s);
}
function buildUI(){
  css();
  if(el)el.remove();
  el=document.createElement('div');el.id='npcdlg';el.setAttribute('role','dialog');
  const st=document.getElementById('stage')||document.body;st.appendChild(el);
  el.addEventListener('pointerdown',e=>e.stopPropagation());
}
function render(){
  const T0=G.talk;if(!T0||!el)return;
  const n=T0.npc,nd=n.tree[T0.node]||{t:'...'},list=visChoices(nd);
  if(T0.sel>=list.length)T0.sel=0;
  el.innerHTML='<div class="nd"><canvas width="128" height="128"></canvas><div><div class="nm">'+n.name+'<i>'+n.role+(window.Hub?Hub.affTag(n.id):'')+'</i></div><div class="tx"></div><div class="nt"></div></div><div class="ch"></div></div>';
  el.querySelector('.tx').textContent=resolve(nd.t,G.nq);
  el.querySelector('.nt').innerHTML=T0.notes.map(s=>'&bull; '+s.replace(/</g,'&lt;')).join('<br>');
  const ch=el.querySelector('.ch');
  list.forEach((c,i)=>{
    const b=document.createElement('button');b.type='button';b.tabIndex=-1;
    const p=c.cost?price(c):0,dis=c.cost&&avail()<p;
    b.innerHTML='<b>'+(i+1)+'</b><span></span>'+(c.cost?'<em>'+p+' cinders</em>':'');
    b.querySelector('span').textContent=c.l;
    if(dis)b.disabled=true;if(i===T0.sel)b.className='sel';
    b.addEventListener('click',e=>{e.stopPropagation();choose(i);});
    ch.appendChild(b);
  });
  portrait(el.querySelector('canvas'),n);
}
function portrait(cv,n){
  const c=cv.getContext('2d'),L=n.look,s=cv.width;
  c.clearRect(0,0,s,s);
  if(n.icon&&window.Hub){c.save();c.translate(s/2,s/2);c.scale(s/40,s/40);Hub.glyph(c,{icon:n.icon,px:0,py:2,ph:0,big:1},0);c.restore();return;}
  if(window.Portraits){const nd=G.talk&&n.tree&&n.tree[G.talk.node];window.Portraits.draw(c,'npc:'+n.id,0,0,s,(nd&&nd.mood)||n.mood||'calm',{npc:n});return;}
  const k=s/64;c.save();c.scale(k,k);
  c.fillStyle=L.cloth;rr(c,10,44,44,24,10);c.fill();
  c.fillStyle=L.trim;c.fillRect(30,46,4,18);
  if(L.apron){c.fillStyle='rgba(238,232,216,.9)';rr(c,22,48,20,16,3);c.fill();}
  c.fillStyle=L.skin;circ(c,32,28,13);c.fill();
  if(L.hat==='hood'){c.fillStyle=L.cloth;c.beginPath();c.arc(32,28,16,Math.PI,0);c.lineTo(48,36);c.lineTo(46,22);c.fill();c.fillStyle=L.skin;circ(c,32,30,11);c.fill();}
  else if(L.hat==='cap'){c.fillStyle=L.trim;c.beginPath();c.arc(32,25,14,Math.PI,0);c.fill();c.fillStyle=L.cloth;c.fillRect(17,24,30,4);}
  else if(L.hat==='helm'){c.fillStyle='#8a8898';c.beginPath();c.arc(32,25,14,Math.PI,0);c.fill();c.fillRect(17,24,30,4);}
  else if(L.k!=='merchant'){c.fillStyle='#4a3020';c.beginPath();c.arc(32,24,13,Math.PI,0);c.fill();}
  c.fillStyle='#241810';circ(c,27,30,1.6);c.fill();circ(c,37,30,1.6);c.fill();
  c.strokeStyle='#5a3020';c.lineWidth=1.2;c.beginPath();c.moveTo(28,36);c.quadraticCurveTo(32,38,36,36);c.stroke();
  if(L.mask){c.fillStyle='rgba(220,230,240,.92)';c.beginPath();c.ellipse(32,29,13,6,0,0,6.3);c.fill();c.fillStyle='#241810';circ(c,27,29,1.5);c.fill();circ(c,37,29,1.5);c.fill();}
  if(L.k==='prisoner'){c.strokeStyle='#8a8a98';c.lineWidth=2;c.beginPath();c.moveTo(14,56);c.lineTo(22,60);c.moveTo(50,56);c.lineTo(42,60);c.stroke();}
  c.restore();
  try{const P=window.Portraits;if(P&&P.draw&&P.has&&P.has(n.id)){c.clearRect(0,0,s,s);P.draw(c,n.id,0,0,s,'neutral');}}catch(e){}
}
function key(k){
  if(!G||!G.talk)return false;
  if(k==='m')return false;
  const list=visChoices(G.talk.npc.tree[G.talk.node]);
  if(k>='1'&&k<='9'){const i=+k-1;if(i<list.length)choose(i);}
  else if(k==='arrowdown'||k==='s'){G.talk.sel=(G.talk.sel+1)%list.length;render();}
  else if(k==='arrowup'||k==='w'){G.talk.sel=(G.talk.sel+list.length-1)%list.length;render();}
  else if(k==='enter'||k==='e'||k===' '){choose(G.talk.sel);}
  else if(k==='escape'){closeTalk();}
  return true;
}
/* ---------- per-frame ---------- */
function update(dt){
  const nq=G.nq;if(!nq)return;
  const actHeld=!!(keys['e']||touch.act||mouse.down);
  if(G.needRel&&!actHeld)G.needRel=false;
  if(G.maskT>0)G.maskT-=dt;
  if(G.ventOff>0)G.ventOff-=dt;
  for(const o of nq.objs)if(o.cd>0)o.cd-=dt;
  const A=actor(),W=G.wren;
  // burn objects: Ashling's fire
  if(G.fireOn&&G.ash.on&&G.fireRange){
    const a=G.ash;
    for(const o of nq.objs){
      if(o.kind!=='burn'||!objVisible(o))continue;
      const dx=o.px-a.x,dy=o.py-a.y;
      if(Math.hypot(dx,dy)<G.fireRange&&angDiff(Math.atan2(dy,dx),a.face)<.6&&los(a.x,a.y,o.px,o.py)){
        o.p+=dt;if(Math.random()<dt*14)pt(o.px+(Math.random()-.5)*10,o.py,0,-30,.5,2.4,'#ffb060',{add:true});
        if(o.p>=1){o.done=true;burst(o.px,o.py,24,'#ffb040',110,.8,3,{add:true});G.rings.push({x:o.px,y:o.py,t:.6,r:70,c:'255,160,60'});Aud.S.confirm();floatText(o.px,o.py-16,'Burned','#ffd27a',10);if(o.fx)applyFx(o.fx);qev('obj:'+o.id);}
      } else o.p=Math.max(0,o.p-dt*.5);
    }
  } else for(const o of nq.objs)if(o.p>0)o.p=Math.max(0,o.p-dt*.5);
  // NPC movement: followers, freed prisoners, fades
  for(const n of nq.npcs){
    if(n.gone)continue;
    if(n.fading){n.fade-=dt*1.6;if(n.fade<=0){n.gone=true;}continue;}
    if(n.follow){
      const d=Math.hypot(A.x-n.px,A.y-n.py);
      if(G.alert>.78){n.follow=false;n.fading=true;floatText(n.px,n.py-16,'!','#ff6a5a',14);say(n.name,'They saw us! I am gone!');qev('bolt:'+n.id);continue;}
      if(d>9*T){n.px=A.x-Math.cos(A.face||0)*T;n.py=A.y-Math.sin(A.face||0)*T;if(blocked(n.px,n.py,6)){n.px=A.x;n.py=A.y;}}
      else if(d>38){moveNpc(n,A.x,A.y,dt,(d>110?96:64));}
      const ex=Math.hypot(G.exit.x-n.px,G.exit.y-n.py),pe=Math.hypot(G.exit.x-A.x,G.exit.y-A.y);
      if(ex<2.2*T||(pe<2.4*T&&ex<5*T)){n.follow=false;n.dest={x:G.exit.x,y:G.exit.y};qev('escort:'+n.id);say(n.name,'Free air. Thank you!');}
    } else if(n.dest){
      if(moveNpc(n,n.dest.x,n.dest.y,dt,64)||Math.hypot(n.dest.x-n.px,n.dest.y-n.py)<10)n.fading=true;
    } else if(!n.met||Math.hypot(A.x-n.px,A.y-n.py)<3*T){
      const want=Math.atan2(A.y-n.py,A.x-n.px);if(Math.hypot(A.x-n.px,A.y-n.py)<3*T){let d=want-n.face;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;n.face+=d*Math.min(1,dt*4);}
    }
  }
}
function moveNpc(n,tx,ty,dt,spd){
  const dx=tx-n.px,dy=ty-n.py,d=Math.hypot(dx,dy);if(d<4)return true;
  const sx=dx/d*spd*dt,sy=dy/d*spd*dt;
  let moved=false;
  if(!blocked(n.px+sx,n.py+sy,6)){n.px+=sx;n.py+=sy;moved=true;}
  else if(!blocked(n.px+sx,n.py,6)){n.px+=sx;moved=true;}
  else if(!blocked(n.px,n.py+sy,6)){n.py+=sy;moved=true;}
  n.stuck=moved?0:(n.stuck||0)+dt;
  if(n.stuck>1.2){n.px=n.dest?n.dest.x:tx;n.py=n.dest?n.dest.y:ty;n.stuck=0;}
  if(moved)n.face=Math.atan2(dy,dx);
  return false;
}
/* ---------- drawing ---------- */
function drawNpcBody(c,n,scale){
  const L=n.look,sw=n.dest||n.follow?Math.sin(G.time*9+n.ph):0;
  if(window.drawNpcFigure){window.drawNpcFigure(c,window.npcKindOf?window.npcKindOf(n):L.k,0,0,G.time,n.face,{look:L,scale,walk:sw,free:n.free,id:n.id,role:n.role});return;}
  c.save();c.rotate(n.face);c.scale(scale,scale);
  if(L.pack){c.fillStyle='#5a3a24';rr(c,-13,-6,7,12,2);c.fill();c.fillStyle='#8a5a30';c.fillRect(-12,-5,2,10);}
  c.fillStyle='#2a2430';ell(c,sw*2.4,-4,3,2);c.fill();ell(c,-sw*2.4,4,3,2);c.fill();
  c.fillStyle=L.cloth;ell(c,0,0,6.4,8.4);c.fill();
  c.fillStyle='rgba(255,255,255,.14)';ell(c,-1.5,-2,3.4,4);c.fill();
  c.fillStyle=L.trim;c.fillRect(-.6,-8,1.6,16);
  if(L.apron){c.fillStyle='rgba(238,232,216,.85)';c.fillRect(1,-4.5,3.6,9);}
  if(L.k==='prisoner'&&!n.free){c.strokeStyle='#8a8a98';c.lineWidth=1.4;c.beginPath();c.moveTo(2,-7);c.lineTo(7,-6);c.moveTo(2,7);c.lineTo(7,6);c.stroke();c.fillStyle='#5a5a68';circ(c,8,0,2.2);c.fill();}
  c.fillStyle=L.skin;circ(c,2,0,4.4);c.fill();
  if(L.hat==='hood'){c.fillStyle=L.cloth;c.beginPath();c.arc(1,0,5,1.2,5.1);c.fill();}
  else if(L.hat==='cap'){c.fillStyle=L.trim;c.beginPath();c.arc(1,0,4.8,1.4,4.9);c.fill();}
  else if(L.hat==='helm'){c.fillStyle='#8a8898';c.beginPath();c.arc(1.2,0,5,1.1,5.2);c.fill();}
  else{c.fillStyle='#4a3020';c.beginPath();c.arc(.8,0,4.7,1.6,4.7);c.fill();}
  if(L.mask){c.fillStyle='rgba(225,235,245,.95)';ell(c,3.4,0,2.4,3.6);c.fill();}
  c.fillStyle='#2a1a10';c.fillRect(4.6,-1.8,1,1.2);c.fillRect(4.6,.8,1,1.2);
  c.restore();
}
function ents(list,big){
  const nq=G.nq;if(!nq)return;
  for(const n of nq.npcs){
    if(n.gone)continue;
    if(n.show&&!cond(n.show,nq))continue;
    list.push([n.py,()=>{
      const c=ctx,s=n.look.small?1.0:1.2;
      shadowAt(n.px,n.py+4,9*s,5,.32*n.fade);
      c.save();c.globalAlpha=n.fade;c.translate(n.px,n.py+Math.sin(G.time*1.7+n.ph)*.5);drawNpcBody(c,n,s);c.restore();
    }]);
  }
}
function glyph(c,o,t){
  const x=o.px,y=o.py;
  if(window.Hub&&Hub.glyph(c,o,t))return;
  switch(o.icon){
    case 'key':c.strokeStyle='#e0b040';c.lineWidth=2.4;circ(c,x-3,y,4);c.stroke();c.fillStyle='#e0b040';c.fillRect(x,y-1,9,2.4);c.fillRect(x+6,y,2,5);break;
    case 'book':c.fillStyle='#4a2a1c';rr(c,x-9,y-7,18,14,2);c.fill();c.fillStyle='#eadfd0';c.fillRect(x-6,y-5,12,10);c.fillStyle='rgba(60,40,20,.5)';for(let i=0;i<3;i++)c.fillRect(x-4,y-3+i*3,8,1);break;
    case 'gong':c.fillStyle='#4a3a2a';c.fillRect(x-12,y-14,3,24);c.fillRect(x+9,y-14,3,24);c.fillRect(x-12,y-14,24,3);
      {const g=c.createRadialGradient(x-3,y-3,1,x,y,10);g.addColorStop(0,'#f0d070');g.addColorStop(1,'#8a6a20');c.fillStyle=g;circ(c,x,y,9);c.fill();c.strokeStyle='#5a3a10';c.lineWidth=1.2;circ(c,x,y,5);c.stroke();}break;
    case 'lever':c.fillStyle='#4a4650';rr(c,x-8,y-8,16,16,3);c.fill();c.fillStyle='#2a2630';c.fillRect(x-1.5,y-7,3,12);c.fillStyle='#d8a24a';circ(c,x,y-7,3);c.fill();break;
    case 'sconce':c.fillStyle='#3a3238';c.fillRect(x-2,y-2,4,10);c.fillRect(x-6,y+6,12,3);c.fillStyle='#d8a24a';circ(c,x,y-4,3);c.fill();c.fillStyle='#14101a';c.fillRect(x-1,y-10,2,5);break;
    case 'crank':c.strokeStyle='#9aa0b0';c.lineWidth=3;circ(c,x,y,8);c.stroke();c.beginPath();c.moveTo(x,y);c.lineTo(x+7,y-7);c.stroke();c.fillStyle='#d8a24a';circ(c,x+7,y-7,2.4);c.fill();break;
    case 'valve':c.strokeStyle='#8a8f9a';c.lineWidth=3;circ(c,x,y,8);c.stroke();c.lineWidth=2;c.beginPath();c.moveTo(x-8,y);c.lineTo(x+8,y);c.moveTo(x,y-8);c.lineTo(x,y+8);c.stroke();c.fillStyle='#b3262c';circ(c,x,y,2.4);c.fill();break;
    case 'rope':c.strokeStyle='#c8b080';c.lineWidth=2.4;c.beginPath();c.moveTo(x,y-12);c.quadraticCurveTo(x+6,y-2,x-1,y+4);c.quadraticCurveTo(x-6,y+8,x+2,y+11);c.stroke();c.fillStyle='#8a6a40';circ(c,x+2,y+11,2.6);c.fill();break;
    case 'hammer':c.fillStyle='#6a4a30';c.fillRect(x-1.5,y-8,3,18);c.fillStyle='#8a8f9a';rr(c,x-8,y-10,16,7,2);c.fill();break;
    case 'mask':c.fillStyle='#e0e8f0';c.beginPath();c.ellipse(x,y,9,6,0,0,6.3);c.fill();c.fillStyle='#14101a';ell(c,x-3.5,y-.5,1.8,1.2);c.fill();ell(c,x+3.5,y-.5,1.8,1.2);c.fill();c.strokeStyle='#c4a050';c.lineWidth=1;c.beginPath();c.moveTo(x-9,y);c.lineTo(x-13,y+3);c.stroke();break;
    case 'locket':c.strokeStyle='#d8a24a';c.lineWidth=1;c.beginPath();c.moveTo(x-8,y-8);c.quadraticCurveTo(x,y+2,x+8,y-8);c.stroke();c.fillStyle='#e8c060';circ(c,x,y+3,4.5);c.fill();c.fillStyle='#b3262c';circ(c,x,y+3,1.8);c.fill();break;
    case 'plaque':{const lit=o.touched;c.fillStyle='#4a4650';rr(c,x-8,y-10,16,20,3);c.fill();c.strokeStyle=lit?'#ffd27a':'#7a7488';c.lineWidth=1.6;
      for(let i=0;i<=o.seq;i++){c.beginPath();c.moveTo(x-5+i*5,y-5);c.lineTo(x-5+i*5,y+5);c.stroke();}if(lit){c.fillStyle='rgba(255,210,120,.3)';rr(c,x-8,y-10,16,20,3);c.fill();}break;}
    default:c.fillStyle='#d8a24a';circ(c,x,y,5);c.fill();
  }
}
function drawBack(){
  const nq=G.nq;if(!nq)return;
  const c=ctx,t=G.time;
  if(nq.hub&&window.Hub)Hub.drawBack(c,t);
  const r=nq.route;
  if(r&&!r.open&&r.hint){ // faint seam in the wall
    const x=r.x*T,y=r.y*T,p=.5+.5*Math.sin(t*2.4);
    c.strokeStyle='rgba(255,210,120,'+(.25+p*.35)+')';c.lineWidth=1.4;c.beginPath();c.moveTo(x+4,y+3);c.lineTo(x+4,y+T-3);c.moveTo(x+T-4,y+3);c.lineTo(x+T-4,y+T-3);c.moveTo(x+4,y+3);c.lineTo(x+T-4,y+3);c.stroke();
  }
  for(const o of nq.objs){
    if(!objVisible(o))continue;
    const p=.5+.5*Math.sin(t*3+o.ph);
    if(o.kind==='burn'&&!G.ash.on)c.globalAlpha=.55;
    if(!nq.hub)shadowAt(o.px,o.py+9,9,3,.28);
    glyph(c,o,t);c.globalAlpha=1;
    if(!nq.hub&&(o.hint||o.show||o.cd>0)){ // quest / hinted objects get a soft ring
      c.strokeStyle=o.cd>0?'rgba(150,150,160,.5)':'rgba(255,210,120,'+(.3+p*.45)+')';c.lineWidth=1.4;circ(c,o.px,o.py,13+p*2);c.stroke();
    }
    if(o.p>0){c.strokeStyle='#ffd27a';c.lineWidth=3;c.beginPath();c.arc(o.px,o.py,16,-1.57,-1.57+6.28*Math.min(1,o.p));c.stroke();}
  }
}
function drawFront(){
  const nq=G.nq;if(!nq)return;
  if(G.talk&&mode!=='play')closeTalk();
  const c=ctx,t=G.time,A=actor();
  c.textAlign='center';
  for(const n of nq.npcs){
    if(n.gone||n.fading||(n.show&&!cond(n.show,nq))||G.talk&&G.talk.npc===n)continue;
    const d=Math.hypot(A.x-n.px,A.y-n.py);
    const e=pickNode(n);
    const ready=e==='ready'||(e==='s'&&!n.met);
    const mark=e==='ready'?'?':(e==='s'&&!n.met?'!':'');
    if(mark){c.font='bold 14px '+HEAD;c.fillStyle=mark==='?'?'#7be08a':'#ffd27a';c.strokeStyle='rgba(14,10,20,.85)';c.lineWidth=3;
      const y=n.py-20+Math.sin(t*4+n.ph)*2;c.strokeText(mark,n.px,y);c.fillText(mark,n.px,y);}
    if(d<2.4*T){c.font='bold 9px '+HEAD;const w=c.measureText(n.name).width+10;
      c.fillStyle='rgba(14,10,20,.8)';rr(c,n.px-w/2,n.py-38,w,12,4);c.fill();c.fillStyle='#eadfd0';c.fillText(n.name,n.px,n.py-29);}
  }
  if(G.maskT>0&&!G.wren.hidden){
    const f=Math.min(1,G.maskT/6);c.strokeStyle='rgba(225,235,250,'+(.4+.4*f)+')';c.lineWidth=2;c.beginPath();c.arc(G.wren.x,G.wren.y,21,-1.57,-1.57+6.28*Math.min(1,G.maskT/30));c.stroke();
  }
  if(G.ventOff>0){c.font='bold 9px '+HEAD;c.fillStyle='#cfd6e6';c.fillText('STEAM OFF '+Math.ceil(G.ventOff),A.x,A.y-28);}
  c.textAlign='left';
}
/* ---------- finish, journal, briefing ---------- */
function outcome(L){
  ensureRun();const nq=G.nq;if(!nq)return;
  for(const p of nq.pend){houses[p.h][p.t]+=p.n;L.push('House '+HOUSE_LABEL[p.h]+': +'+p.n+' '+p.t[0].toUpperCase()+p.t.slice(1)+'. '+(p.why||'Word travels.'));}
  nq.pend=[];
  for(const id in nq.q){
    const s=nq.q[id];if(s.state==='active')s.state='failed';
    run.quests[id]=s.state;
    L.push((s.state==='done'?'Task done: ':'Task missed: ')+QDEF[id].title+'.');
  }
  for(const f in nq.nf)run.npc.flags[f]=1;
  if(nq.debt>0){run.cinders=Math.max(0,run.cinders-nq.debt);nq.debt=0;}
  if(window.Hub)Hub.missionEnd(L);
}
function entry(id,state,cur){
  const d=QDEF[id],s=cur?cur.q[id]:null;
  const obj=state==='active'?d.steps[s?s.step:0]:'';
  return{id,title:d.title,desc:d.desc+(obj?' Objective: '+obj+'.':''),state,house:d.house,obj,lvl:d.lvl};
}
const Quests={
  journal(){
    ensureRun();const out=[],seen={},cur=(typeof G!=='undefined'&&G&&G.nq)?G.nq:null;
    for(const id in run.quests)if(QDEF[id]&&!(cur&&cur.q[id])){out.push(entry(id,run.quests[id]));seen[id]=1;}
    if(cur)for(const id in cur.q)out.push(entry(id,cur.q[id].state,cur));
    if(window.Hub)for(const e of Hub.journal())out.push(e);
    return out;
  },
  active(){return Quests.journal().filter(q=>q.state==='active');},
  complete(id){if(!G||!G.nq||!G.nq.q[id])return false;return qdone(id);}
};
function briefHtml(i){
  ensureRun();const D=NPCDATA[i];if(!D)return '';
  const st=stand(D.house),name=D.house==='hallow'?'The old servants of Hallow':'House '+HOUSE_LABEL[D.house];
  const head=st==='none'?name+': no history with you yet':name+': '+{favor:'Favor',fear:'Fear',ruin:'Ruin'}[st];
  const eff=st==='none'?'Neutral prices and ordinary servants. What you do here will be remembered.':HOUSEFX[st].join(' &middot; ');
  const fl=Object.keys(run.npc.flags).filter(f=>FLAGLINES[f]&&run.npc.flags[f]).map(f=>FLAGLINES[f]);
  const n=(D.npcs||[]).filter(x=>!x.show||x.show.indexOf('flag:')!==0||run.npc.flags[x.show.slice(5)]).length,q=(D.quests||[]).length;
  const hubH=window.Hub?Hub.briefHtml(i):'';
  return hubH+'<div class="stand"><b>'+head+'</b><br><span>'+eff+'</span>'+(fl.length?'<br><span>'+fl.join(' ')+'</span>':'')+
    '<br><span>'+n+' contacts &middot; '+q+' optional task'+(q===1?'':'s')+' &middot; '+({1:'a dinner gong waits to be rung',2:'one lamp crank controls the harbor',3:'a hidden passage lies in the cells',4:'a steam valve can silence the vents',5:'a cloakroom holds silver masks',6:'three memorial plaques wait in order'}[i]||'a hidden chamber lies behind cracked stone')+'</span></div>';
}
function markers(){
  const nq=G&&G.nq;if(!nq)return [];
  const out=[];
  for(const n of nq.npcs)if(!n.gone&&!n.fading)out.push({x:n.px,y:n.py,kind:'npc',name:n.name});
  for(const o of nq.objs)if(objVisible(o)&&(o.show||o.hint))out.push({x:o.px,y:o.py,kind:'obj',name:o.label});
  return out;
}
window.Quests=Quests;
return{applyFx,render,ensureRun,init,update,target,activate,key,outcome,briefHtml,markers,ents,drawBack,drawFront,stand,cond,qev,qstart,openTalk,choose,closeTalk,QDEF,HOUSEFX};
})();
window.NPC=NPC;
