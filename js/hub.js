'use strict';
/* EMBERCROWN - the Rookery: a walkable home base between missions, quest chains that span missions,
   relationships with the people who live there, and the consequences they carry into the houses.
   The hub is an ordinary level (no guards) run by the level engine; data lives in npcdata.js (HUBDATA, CHAINS, CHAINOBJ).
   State is kept inside run.npc (aff, chains, docs, hub) so old saves load unchanged. */
const Hub=(function(){
const INK='#1a1018';
function theme(){
  const ext=window.HUB_THEME||(window.THEMES&&window.THEMES.hub);
  if(ext)return ext;
  return Object.assign({},LEVELS[1].th,{amb:[26,16,12,.20],grade:'rgba(255,170,90,.08)',part:'dust',tapestry:0,rack:0,shelf:0,tablecloth:false,wine:false,statueGold:false,
    chains:0,web:0,bones:0,banner:0,torch:.10,wood:'#6a4a30',stone:'#8a7a68',bg:'dusk',music:{root:82,mode:'lydian',tempo:.55}});
}
const LEVEL={hub:true,name:'The Rookery',house:'The Rookery',sigil:'hallow',map:HUBMAP,guards:[],gadgets:{smoke:0,bell:0,flute:0},opening:'',intro:[],next:1,th:null};
const S=()=>{NPC.ensureRun();return run.npc;};
const hs=()=>S().hub;
const aff=id=>S().aff[id]||0;
const flag=f=>!!S().flags[f];
const chain=id=>S().chains[id];
const chAt=(id,s)=>{const c=chain(id);return !!c&&c.st==='active'&&c.s===s;};
function canVisit(next){return next>=1&&next<LEVELS.length;}
function inHub(){return !!(G&&G.d&&G.d.hub);}

/* ---------- arriving and leaving ---------- */
function news(t){const h=hs();(h.news=h.news||[]).unshift(t);h.news.length=Math.min(h.news.length,6);}
function addAff(id,n,notes){
  const a=S().aff,b=a[id]||0;a[id]=Math.max(-3,Math.min(5,b+n));
  if(a[id]!==b&&HUBPEOPLE[id]){const m=HUBPEOPLE[id]+(n>0?' warms to you':' cools toward you')+' ('+AFFNAME(a[id])+')';if(notes)notes.push(m);return m;}
  return '';
}
function arrive(next){
  const h=hs();h.seen=h.seen||{};
  if(h.seen[next])return;h.seen[next]=1;h.news=h.news||[];
  // the Back Stairs deal you just made is talked about at home
  const st=STAIRS[next],k=perks[next],o=st&&k!=null?st.options[k]:null;
  if(o&&o.led){
    const t=o.led[1];
    if(t==='favor'){addAff('hesper',1);news('Hesper approves: you '+o.short+' and nobody was hurt.');}
    else if(t==='fear'){addAff('corvin',1);addAff('odalys',-1);news('Corvin laughed when he heard you '+o.short+'. Odalys did not.');}
    else{addAff('hesper',-1);addAff('needle',1);news('You '+o.short+'. Needle calls it tidy. Hesper will not look at you.');}
  }
  // the last mission's rank decides how the Serjeant greets you
  const rk=run.ranks[next-1];
  if(rk==='S'||rk==='A'){addAff('brann',1);news('Brann heard you came out of '+LEVELS[next-1].name+' with rank '+rk+'. He nodded. Once.');}
  else if(rk==='C'){addAff('brann',-1);news('Brann heard how '+LEVELS[next-1].name+' went. He is sharpening something.');}
  else if(rk==='B'&&aff('brann')<=-2)addAff('brann',1);
  if(aff('corvin')<=-3&&!flag('corvin_gone')){S().flags.corvin_gone=1;S().flags.corvin_enemy=1;news('Corvin left in the night. His wager book is gone and so is your description, sold to the houses.');}
  if(flag('wick_free')&&chAt('courier',3))news('Wick walked in at dawn, thin and grinning. Needle wants a word.');
}
function enter(next){
  if(!canVisit(next)||typeof loadLevel!=='function')return false;
  NPC.ensureRun();
  lvl=next;LEVEL.next=next;LEVEL.th=theme();
  arrive(next);
  PT.length=0;
  G=loadLevel(LEVEL);
  G.gad={smoke:0,bell:0,flute:0};G.grace=1e9;
  // the hub has its own furniture: drop the random set dressing (and its breakable pots)
  G.props=[];G.pblock=new Set();G.pots=[];G.inspects=[];G.insp=[];G.chests=[];G.torches=(G.torches||[]).slice(0,10);
  for(const o of G.nq.objs)if(BLOCK[o.icon])G.pblock.add(pkey(o.x,o.y));
  for(const b of SOLID)G.pblock.add(pkey(b[0],b[1]));
  G.ash.on=true;G.ash.x=23*T+16;G.ash.y=2*T+20;G.ash.face=2.2;
  G.wren.face=-Math.PI/2;
  decor=null;auto=null;lastAtk=null;
  const h=hs();if(!h.drill||h.drill.lv!==next)h.drill={lv:next,xp:0,fin:0,done:0};
  setMode('play');
  writeSave('hub',next);
  try{Aud.setTheme(LEVEL.th.music);Aud.ambient(LEVEL.th.bg);}catch(e){}
  V.ww=G.gw*T;V.wh=G.gh*T;layout();camUpdate(0,true);
  if(typeof initCritters==='function')initCritters();
  G.fog=null;touch.sneak=false;G.iris={st:performance.now(),dur:900,dir:1};
  UI.tick(true);
  toast('The Rookery','Before '+LEVELS[next].name+'. Walk, talk, then take the door.','#ffd27a');
  const n0=(h.news||[])[0];if(n0)say('Shiloh',n0);
  bindTap();
  return true;
}
function leave(){
  if(!inHub())return;
  settle();auto=null;touch.jx=touch.jy=0;
  const next=G.d.next;
  startBrief(next);
}
function settle(){
  if(!inHub())return;
  if(G.cinders){run.cinders+=G.cinders;G.cinders=0;}
  const nq=G.nq;if(nq&&nq.debt>0){run.cinders=Math.max(0,run.cinders-nq.debt);nq.debt=0;}
}

/* ---------- effects from dialogue and mission objects ---------- */
function chNote(notes,title,sub){if(G&&G.toasts)toast(title,sub,'#7fd0ff');if(notes&&G&&G.talk)notes.push(title+': '+sub);}
function fx(f,notes,npc){
  const R=S();
  if(f.aff)addAff(f.aff[0],f.aff[1],notes);
  if(f.chstart&&CHAINS[f.chstart]&&!R.chains[f.chstart]){R.chains[f.chstart]={s:0,st:'active'};chNote(notes,'New chain: '+CHAINS[f.chstart].title,CHAINS[f.chstart].steps[0]);}
  if(f.chadv){const c=R.chains[f.chadv],d=CHAINS[f.chadv];if(c&&c.st==='active'){c.s++;if(c.s<d.steps.length)chNote(notes,d.title,d.steps[c.s]);}}
  if(f.ch){const c=R.chains[f.ch[0]];if(c&&c.st==='active'){c.s=f.ch[1];chNote(notes,CHAINS[f.ch[0]].title,CHAINS[f.ch[0]].steps[c.s]);}}
  if(f.chdone){const c=R.chains[f.chdone];if(c&&c.st==='active'){c.st='done';chNote(notes,'Chain complete',CHAINS[f.chdone].title);try{Aud.S.win&&Aud.S.win();}catch(e){}}}
  if(f.chfail){const c=R.chains[f.chfail];if(c&&c.st==='active'){c.st='failed';c.why='You sold it.';if(G&&G.toasts)toast('Chain failed',CHAINS[f.chfail].title,'#e05050');if(notes)notes.push('Chain failed: '+CHAINS[f.chfail].title);}}
  if(f.doc&&HUBDOCS[f.doc]&&!R.docs.includes(f.doc)){R.docs.push(f.doc);if(notes)notes.push('Added to the library wall: '+HUBDOCS[f.doc][0]);}
  if(f.stash){const h=R.hub,next=inHub()?G.d.next:lvl;if(!h.stash||h.stash.lv!==next)h.stash={lv:next};for(const k in f.stash)h.stash[k]=(h.stash[k]||0)+f.stash[k];
    if(notes)notes.push('Packed for '+LEVELS[next].name+': '+Object.keys(f.stash).map(k=>({smoke:'smoke powder',bell:'whisper bell',tip:'a marked map'}[k])).join(', '));}
  if(f.abil){R.abil=R.abil||[];if(!R.abil.includes(f.abil))R.abil.push(f.abil);try{window.Abilities&&Abilities.unlock&&Abilities.unlock(f.abil);}catch(e){}
    if(notes)notes.push('Learned: '+(ABIL[f.abil]||f.abil));}
  if(f.xp){run.mastery.xp=(run.mastery.xp||0)+f.xp;if(notes)notes.push('+'+f.xp+' mastery');}
  if(f.wager){R.flags.wager_on=1;if(notes)notes.push('Wager placed: 40 cinders on rank A or better');}
  if(f.fn)f.fn(notes);
  if(f.hub==='shop'){NPC.closeTalk();openTab('forge');}
  if(inHub()&&!f.hub){settle();persistRun();decor=null;}
}
const ABIL={riposte:"Brann's riposte",ember_roost:'Warm roost: a second dash charge',forged_order:'Forged orders: one guard reassigned per mission',courier_cache:"Courier caches: smoke and a bell each mission"};
function priceMul(id){
  let m=1;const a=aff(id);
  if(a>=3)m*=.8;else if(a<=-1)m*=1.2;
  if(id==='maud'){if(flag('maud_kin'))m*=.75;if(flag('maud_grief'))m*=1.25;}
  return m;
}
function affTag(id){
  if(!HUBPEOPLE[id]||!run.npc||!run.npc.aff)return '';
  const a=aff(id);return ' &middot; <span style="color:'+(a>=2?'#7be08a':a<0?'#e07060':'#c8b8d8')+'">'+AFFNAME(a)+'</span>';
}

/* ---------- missions: chain objects and carried consequences ---------- */
function missionObjs(g,i){
  const defs=CHAINOBJ[i];if(!defs||g.flight)return [];
  const sx=Math.floor(g.wren.x/T),sy=Math.floor(g.wren.y/T),W=g.gw,H=g.gh;
  const dist=new Map(),q=[[sx,sy]];dist.set(sx+sy*256,0);
  while(q.length){
    const [x,y]=q.shift(),d=dist.get(x+y*256);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=nx+ny*256;
      if(nx<0||ny<0||nx>=W||ny>=H||dist.has(k)||g.grid[ny][nx]!=='.')continue;
      const dr=g.doors[nx+','+ny];if(dr&&(dr.sealed||dr.gate))continue;
      dist.set(k,d+1);q.push([nx,ny]);
    }
  }
  const D=NPCDATA[i]||{},taken=[[sx,sy],[Math.floor(g.exit.x/T),Math.floor(g.exit.y/T)],...(D.npcs||[]).map(n=>[n.x,n.y]),...(D.objs||[]).map(o=>[o.x,o.y]),
    ...g.items.map(it=>[Math.floor(it.x/T),Math.floor(it.y/T)]),...g.vents.map(v=>[v.x,v.y]),...g.peds.map(p=>[Math.floor(p.x/T),Math.floor(p.y/T)]),...Object.values(g.doors).map(d=>[d.x,d.y])];
  if(D.route)taken.push([D.route.x,D.route.y]);
  const wall=(x,y)=>g.grid[y]&&g.grid[y][x]==='#';
  const free=(x,y)=>!taken.some(t=>Math.abs(t[0]-x)<=1&&Math.abs(t[1]-y)<=1);
  const cand=[...dist.entries()].map(([k,d])=>({x:k%256,y:Math.floor(k/256),d})).filter(c=>c.d>=4).sort((a,b)=>a.d-b.d||a.x-b.x||a.y-b.y);
  const out=[];
  for(const def of defs){
    if(!cand.length)break;
    const at=Math.round(def.far*(cand.length-1));let pick=null;
    for(let o=0;o<cand.length&&!pick;o++){
      for(const j of [at+o,at-o]){const c=cand[j];if(!c||!free(c.x,c.y))continue;
        if(wall(c.x-1,c.y)||wall(c.x+1,c.y)||wall(c.x,c.y-1)||wall(c.x,c.y+1)){pick=c;break;}}
    }
    if(!pick)continue;
    taken.push([pick.x,pick.y]);
    out.push(Object.assign({},def,{x:pick.x,y:pick.y,chain:true}));
  }
  return out;
}
function carried(i){ // what the Rookery sends with you into mission i: [{t:text,k:kind}]
  const R=S(),out=[],st=R.hub.stash&&R.hub.stash.lv===i?R.hub.stash:null,fl=LEVELS[i]&&LEVELS[i].flight;
  if(st&&!fl&&(st.smoke||st.bell))out.push({k:'stash',smoke:st.smoke||0,bell:st.bell||0,t:'Packed at the Rookery: '+[st.smoke?'+'+st.smoke+' smoke':'',st.bell?'+'+st.bell+' bell':''].filter(Boolean).join(', ')});
  if(R.flags.needle_maps||st&&st.tip)out.push({k:'maps',t:R.flags.needle_maps?'Needle has marked the hidden passage':'Needle sold you the hidden passage'});
  if(R.flags.forged_seal)out.push({k:'seal',t:"Odalys's forged order reassigns one guard"});
  if(R.flags.seal_sold)out.push({k:'sold',t:'Forged seals are loose in the city: guards trust no order (alert rises 8% faster)'});
  if(R.flags.corvin_ally&&!fl)out.push({k:'cache',t:"Corvin's courier cache: +1 smoke, +1 bell"});
  if(R.flags.corvin_enemy)out.push({k:'enemy',t:'Corvin sold your description: alert rises 12% faster'});
  if(R.flags.roost1)out.push({k:'roost1',t:'Warm roost: Ashling has an extra dash charge'});
  if(R.flags.roost2)out.push({k:'roost2',t:'Bronze roost: +1 heart'});
  if(aff('maud')>=3&&!fl)out.push({k:'maud',t:'Maud slips an extra smoke powder into your kit'});
  if(aff('brann')>=3)out.push({k:'brann',t:"Brann's drills: +1 heart"});
  return out;
}
function missionInit(g,nq,i){
  const C=carried(i);g.hubFx=C;
  for(const c of C){
    if(c.k==='stash'){g.gad.smoke+=c.smoke;g.gad.bell+=c.bell;}
    else if(c.k==='maps'){if(nq.route){nq.route.hint=true;const lv=nq.objs.find(o=>o.id===nq.route.lever);if(lv)lv.hint=true;}const li=nq.objs.find(o=>o.kind==='light');if(li)li.hint=true;}
    else if(c.k==='seal'){const norm=g.guards.filter(x=>!x.boss&&!x.spin&&x.kind!=='tower');if(norm.length>2)g.guards.splice(g.guards.indexOf(norm[norm.length-1]),1);}
    else if(c.k==='sold')g.gain*=1.08;
    else if(c.k==='cache'){g.gad.smoke++;g.gad.bell++;}
    else if(c.k==='enemy')g.gain*=1.12;
    else if(c.k==='roost1'){g.dash.max++;g.dash.ch=g.dash.max;}
    else if(c.k==='roost2'||c.k==='brann'){g.maxHp++;g.hp=g.maxHp;}
    else if(c.k==='maud')g.gad.smoke++;
  }
}
function missionEnd(L){
  const R=S(),h=R.hub,g=G;if(!g||g.d.hub)return;
  const rank=rankFor(g);g.rank=rank;
  for(const id in R.chains){
    const c=R.chains[id],d=CHAINS[id];if(!d||c.st!=='active')continue;
    if(d.by[c.s]===lvl){
      c.st='failed';c.why=d.fail[c.s];L.push('Chain failed: '+d.title+'. '+d.fail[c.s]);
      const f=d.failFx[c.s];if(f){if(f.aff)addAff(f.aff[0],f.aff[1]);if(f.flag)R.flags[f.flag]=1;}
      news(d.fail[c.s]);
    } else if(g.nq&&g.nq.objs.some(o=>o.chain&&o.done&&o.fx&&o.fx.chadv===id))L.push('Chain: '+d.title+'. '+(d.steps[c.s]||'Done')+'.');
  }
  if(h.bounty&&h.bounty.lv===lvl){
    const b=BOUNTIES.find(x=>x.id===h.bounty.id);
    if(b){let ok=false;try{ok=!!b.test(g);}catch(e){}
      if(ok){run.cinders+=b.pay;L.push('Contract paid: '+b.title+', +'+b.pay+' cinders.');news('The '+b.title+' contract paid out.');}
      else L.push('Contract missed: '+b.title+'.');}
    h.bounty=null;
  }
  if(R.flags.wager_on){
    delete R.flags.wager_on;
    if(rank==='S'||rank==='A'){run.cinders+=80;addAff('corvin',1);L.push("Corvin's wager: you won 80 cinders. He pays, almost gracefully.");news('Corvin paid his wager without a word. He is keeping count.');}
    else L.push("Corvin's wager: lost. He keeps your 40 cinders.");
  }
  if(h.stash&&h.stash.lv===lvl)h.stash=null;
}
function briefHtml(i){
  if(!run.npc||!canVisit(i)&&i!==0)return '';
  const R=S(),lines=[];
  for(const o of CHAINOBJ[i]||[]){const m=o.show.match(/^ch:(\w+)=(\d+)$/);if(m&&chAt(m[1],+m[2])&&!lines.some(l=>l.includes(CHAINS[m[1]].title)))lines.push('<b style="color:#7fd0ff">'+CHAINS[m[1]].title+':</b> '+CHAINS[m[1]].steps[+m[2]]);}
  for(const id in R.chains){const c=R.chains[id],d=CHAINS[id];if(d&&c.st==='active'&&d.by[c.s]===i)lines.push('<i>Last chance for '+d.title+' on this mission.</i>');}
  const C=carried(i).map(c=>c.t);
  if(R.hub.bounty&&R.hub.bounty.lv===i){const b=BOUNTIES.find(x=>x.id===R.hub.bounty.id);if(b)lines.push('<b style="color:#ffd27a">Contract:</b> '+b.desc+' ('+b.pay+' cinders)');}
  if(R.flags.wager_on)lines.push("<b style=\"color:#70c0d0\">Corvin's wager:</b> rank A or better wins 80 cinders");
  if(!lines.length&&!C.length)return '';
  return '<div class="stand hubstand"><b>From the Rookery</b>'+(lines.length?'<br><span>'+lines.join('<br>')+'</span>':'')+(C.length?'<br><span>'+C.join(' &middot; ')+'</span>':'')+'</div>';
}
function journal(){
  if(!run.npc||!run.npc.chains)return [];
  const out=[];
  for(const id in run.npc.chains){
    const c=run.npc.chains[id],d=CHAINS[id];if(!d)continue;
    const obj=c.st==='active'?d.steps[c.s]:'';
    out.push({id:'chain_'+id,title:d.title+' (chain '+Math.min(c.s+(c.st==='done'?0:1),d.steps.length)+'/'+d.steps.length+')',
      desc:d.desc+(obj?' Objective: '+obj+'.':'')+(c.st==='failed'?' '+(c.why||''):'')+(c.st!=='failed'?' Reward: '+d.reward:''),state:c.st,house:d.house,obj,chain:true});
  }
  return out;
}
function peopleHtml(){
  if(!run.npc||!run.npc.hub||!run.npc.hub.seen)return '';
  const row=id=>{const a=aff(id),gone=id==='corvin'&&flag('corvin_gone');
    let pips='';for(let k=-3;k<=5;k++)pips+='<i style="display:inline-block;width:9px;height:9px;margin-right:2px;border-radius:50%;border:1px solid '+(k<0?'#a05048':'#b89a50')+';background:'+((k<0&&a<=k)?'#e07060':(k>0&&a>=k)?'#f0b44c':k===0?'#6a5a78':'transparent')+'"></i>';
    const perk=gone?'Gone. Your description is in every guardroom.':PERK[id](a);
    return'<div class="quest"><span class="qdot"></span><div><b>'+HUBPEOPLE[id]+' <small style="font-weight:400;opacity:.7">'+HUBROLE[id]+'</small></b><span>'+pips+' '+AFFNAME(a)+'. '+perk+'</span></div><i>'+(a>0?'+':'')+a+'</i></div>';};
  return'<h3>The Rookery <small>who stands with you</small></h3>'+Object.keys(HUBPEOPLE).map(row).join('');
}
const PERK={
 maud:a=>flag('maud_kin')?'Kin prices at the forge (-25%).':a>=3?'Prices -20% and extra smoke powder each mission.':a<=-2?'Sells at +20%. No favours.':flag('maud_grief')?'Grieving: prices +25%.':'Sells gear and supplies.',
 brann:a=>a>=3?'His drills give +1 heart in every mission.':a>=2?'Will teach the riposte.':a<=-2?'Refuses to train you until you win clean.':'Drill at the dummies for mastery.',
 needle:a=>flag('needle_maps')?'Marks every hidden passage, free.':a<=-2?'Will not sell to you.':'Sells the hidden way into the next house.',
 odalys:a=>flag('forged_seal')?'Writes a forged order before each mission.':flag('seal_sold')?'Has not forgiven the sale of the seal.':a<=-2?'Will not speak to you.':'Keeps the library wall.',
 hesper:a=>flag('roost2')?'The bronze roost: Ashling has +1 dash and +1 heart.':flag('roost1')?'The moss roost: Ashling has +1 dash charge.':a<=-2?'Tends the dragon, not you.':'Keeps Ashling.',
 corvin:a=>flag('corvin_ally')?'Ally: courier caches stocked for every mission.':a<=-2?'One more insult and he walks.':'Takes wagers on your rank.'};

/* ---------- stations ---------- */
function openTab(tab){
  if(mode==='play')pauseGame(true);
  resume=true;UI.openJournal(tab);
}
let resume=false;
function pseudo(o,name,role,tree){return{id:'_'+o.use,name,role,icon:o.icon,look:{},tree,px:o.px,py:o.py,face:0,ph:0,fade:1};}
function page(tree,key,title,items,back){ // items: [label,text]; builds paged list nodes
  const per=5,pages=Math.max(1,Math.ceil(items.length/per));
  for(let p=0;p<pages;p++){
    const c=items.slice(p*per,p*per+per).map((it,k)=>({l:it[0],to:key+'_'+(p*per+k)}));
    if(p+1<pages)c.push({l:'More...',to:key+'_p'+(p+1)});
    c.push({l:'Back',to:back});
    tree[p?key+'_p'+p:key]={t:items.length?title+(pages>1?' ('+(p+1)+'/'+pages+')':''):'Nothing here yet.',c};
  }
  items.forEach((it,k)=>{tree[key+'_'+k]={t:it[1],c:[{l:'Back',to:Math.floor(k/per)?key+'_p'+Math.floor(k/per):key}]};});
}
function libraryTree(){
  const R=S(),tree={};
  const docs=R.docs.filter(d=>HUBDOCS[d]).map(d=>HUBDOCS[d]);
  const lore=[];for(const L of LORE)for(const e of L||[])if(run.lore.includes(e.t))lore.push([e.t,e.x]);
  const clues=CLUES.map((c,i)=>run.ranks[i]!=null?[LEVELS[i].name,c]:null).filter(Boolean);
  tree.s={t:'Odalys keeps everything you bring home pinned in rows: '+docs.length+' letters, '+lore.length+' scrolls, '+clues.length+' clues. Red thread runs between the ones that agree.',c:[
    {l:'Letters and notes ('+docs.length+')',to:'d'},{l:'Scrolls from the houses ('+lore.length+')',to:'l'},{l:'Case clues ('+clues.length+')',to:'c'},{l:'Leave',end:1}]};
  page(tree,'d','Letters and notes.',docs,'s');page(tree,'l','Scrolls copied from the houses.',lore,'s');page(tree,'c','Clues from the case file.',clues,'s');
  return tree;
}
function boardTree(){
  const h=hs(),next=G.d.next,tree={};
  const offers=[BOUNTIES[next%BOUNTIES.length],BOUNTIES[(next+2)%BOUNTIES.length]];
  const cur=h.bounty&&h.bounty.lv===next?BOUNTIES.find(b=>b.id===h.bounty.id):null;
  const nw=(h.news||[]).slice(0,3);
  const c=[];
  if(!cur)offers.forEach(b=>c.push({l:'Take the contract: '+b.title+' ('+b.pay+' cinders)',to:'t_'+b.id,fx:{fn:()=>{h.bounty={id:b.id,lv:next};}}}));
  else c.push({l:'Tear down my contract ('+cur.title+')',to:'torn',fx:{fn:()=>{h.bounty=null;}}});
  c.push({l:'Who needs something?',to:'who'});c.push({l:'Leave',end:1});
  tree.s={t:(nw.length?nw.join(' '):'Nothing new pinned today.')+(cur?' Your contract: '+cur.title+'. '+cur.desc:' Two contracts are pinned for '+LEVELS[next].name+'.'),c};
  offers.forEach(b=>{tree['t_'+b.id]={t:b.title+'. '+b.desc+' Paid on your return, '+b.pay+' cinders. One contract at a time.'};});
  tree.torn={t:'You fold the contract into your sleeve. Someone else can have it.'};
  const who=[];
  for(const id in CHAINS){const d=CHAINS[id],c2=chain(id);
    if(!c2)who.push(HUBPEOPLE[d.giver]+' may have work: '+d.title+'.');
    else if(c2.st==='active')who.push(d.title+': '+d.steps[c2.s]+'.');}
  tree.who={t:who.join(' ')||'Nobody is asking for anything.',c:[{l:'Back',to:'s'}]};
  return tree;
}
function perchTree(){
  const r=flag('roost2')?2:flag('roost1')?1:0,tree={};
  const c=[{l:"Choose Ashling's growth",fx:{fn:()=>{NPC.closeTalk();const A=window.Abilities,f=A&&(A.open||A.openMenu||A.show);if(typeof f==='function'){try{f.call(A);return;}catch(e){}}openTab('forge');}}},
    {l:'Scratch behind her horn',to:'scratch',once:'scratch'},{l:'Leave',end:1}];
  tree.s={t:["A heap of sacking on a stone ring. Ashling has scorched a neat circle in the middle of it and sleeps there, nose under her tail.",
    "Ember-moss lines the stone now, grey-green and warm to the hand. Ashling has stopped shivering in her sleep. She wakes with a second wind.",
    "Bell-bronze under the moss holds the day's heat all night. Ashling sprawls across it like something much larger. Give her time."][r]+' ('+stats.gems+' ember gems fed)',c};
  tree.scratch={t:"She leans into your hand hard enough to push you back a step, and rumbles. A spark drifts up and goes out. For a moment nobody in the city is plotting anything."};
  return tree;
}
function use(o){
  const R=S();
  switch(o.use){
    case 'door':leave();break;
    case 'case':openTab('case');break;
    case 'bench':openTab('gear');break;
    case 'board':NPC.openTalk(pseudo(o,'Notice Board','Contracts and news',boardTree()));break;
    case 'library':NPC.openTalk(pseudo(o,'The Library Wall','Everything you brought home',libraryTree()));break;
    case 'perch':NPC.openTalk(pseudo(o,"Ashling's Perch",'The roost',perchTree()));break;
    case 'letter':o.done=true;R.flags.hostage_seen=1;if(!R.docs.includes('hostage'))R.docs.push('hostage');
      G.loreCard={title:HUBDOCS.hostage[0],text:HUBDOCS.hostage[1],t:9,t0:9};say('Shiloh','Maud needs to see this.');persistRun();break;
  }
}

/* ---------- per-frame: drills, tap-to-walk ---------- */
let auto=null,lastAtk=null,tapBound=false,lastJ=[0,0];
function drillXp(n,x,y){
  const d=hs().drill;if(d.xp>=45)return false;
  n=Math.min(n,45-d.xp);d.xp+=n;run.mastery.xp=(run.mastery.xp||0)+n;floatText(x,y-22,'+'+n+' XP','#9fd8ff',9);
  if(d.xp>=45)toast('Enough for today','Brann: "Straw teaches only so much."','#9fd8ff');
  return true;
}
function tick(dt){
  settle();
  const nq=G.nq,W=G.wren,h=hs();
  for(const o of nq.objs){if(o.wob>0)o.wob=Math.max(0,o.wob-dt*2.2);}
  // Shiloh's blade on the dummies
  if(W.atk&&W.atk!==lastAtk){
    lastAtk=W.atk;
    for(const o of nq.objs){
      if(o.kind!=='dummy')continue;
      const dx=o.px-W.x,dy=o.py-W.y,d=Math.hypot(dx,dy);
      if(d<58&&angDiff(Math.atan2(dy,dx),W.atk.a)<1.15){
        const fin=W.atk.combo===2;o.wob=1;o.wa=Math.atan2(dy,dx);
        burst(o.px,o.py-6,fin?12:6,'#d8c080',fin?90:60,.5,2);shake(fin?3:1);
        try{(fin?Aud.S.crack:Aud.S.click)();}catch(e){}
        drillXp(fin?8:3,o.px,o.py);
        if(fin){h.drill.fin++;floatText(o.px,o.py-34,'COMBO '+Math.min(3,h.drill.fin)+'/3','#ffd27a',10);
          if(h.drill.fin===3&&!h.drill.done){h.drill.done=1;const m=addAff('brann',1);toast('Drill complete',m||'Brann grunts approval.','#7be08a');persistRun();}}
        break;
      }
    }
  }
  if(!W.atk)lastAtk=null;
  // Ashling's fire scorches them
  if(G.fireOn&&G.fireRange){
    const a=G.ash;
    for(const o of nq.objs){
      if(o.kind!=='dummy')continue;
      const dx=o.px-a.x,dy=o.py-a.y;
      if(Math.hypot(dx,dy)<G.fireRange&&angDiff(Math.atan2(dy,dx),a.face)<.6){
        o.burn=(o.burn||0)+dt;o.wob=Math.max(o.wob||0,.3);o.wa=Math.atan2(dy,dx);o.char=Math.min(1,(o.char||0)+dt*.25);
        if(o.burn>=.6){o.burn=0;drillXp(2,o.px,o.py);}
      }
    }
  }
  for(const o of nq.objs)if(o.char>0&&!G.fireOn)o.char=Math.max(0,o.char-dt*.05);
  // tap-to-walk
  if(auto){
    const kb=keys['w']||keys['a']||keys['s']||keys['d']||keys['arrowup']||keys['arrowdown']||keys['arrowleft']||keys['arrowright'];
    if(kb||touch.jx!==lastJ[0]||touch.jy!==lastJ[1]||G.active!=='wren'){stopAuto(!kb&&(touch.jx!==lastJ[0]||touch.jy!==lastJ[1]));return;}
    const t=auto.tgt,tx=t?t.x:auto.x,ty=t?t.y:auto.y,dd=Math.hypot(tx-W.x,ty-W.y);
    if(t&&dd<(t.kind==='npc'?40:32)){stopAuto();NPC.activate(t);return;}
    while(auto.path.length>1&&Math.hypot(auto.path[0][0]-W.x,auto.path[0][1]-W.y)<12)auto.path.shift();
    const wp=auto.path[0];
    if(!wp||(!t&&dd<8)||(auto.t+=dt)>12){stopAuto();return;}
    if(auto.path.length===1&&Math.hypot(wp[0]-W.x,wp[1]-W.y)<6){ if(t&&dd<52){stopAuto();NPC.activate(t);}else stopAuto();return; }
    const a=Math.atan2(wp[1]-W.y,wp[0]-W.x);
    touch.jx=Math.cos(a)*.95;touch.jy=Math.sin(a)*.95;lastJ=[touch.jx,touch.jy];
  }
}
function stopAuto(keep){auto=null;if(!keep){touch.jx=touch.jy=0;}lastJ=[touch.jx,touch.jy];}
function pathTo(tx,ty){ // tile BFS from Shiloh to the walkable tile nearest the goal
  const W=G.wren,sx=Math.floor(W.x/T),sy=Math.floor(W.y/T),gx=Math.floor(tx/T),gy=Math.floor(ty/T);
  const open=(x,y)=>!blocked(x*T+16,y*T+16,10);
  const prev=new Map(),q=[[sx,sy]];prev.set(sx+sy*256,-1);let best=[sx,sy],bd=1e9;
  while(q.length){
    const [x,y]=q.shift(),d=Math.hypot(x-gx,y-gy);
    if(d<bd){bd=d;best=[x,y];}
    if(d===0)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+ny*256;if(prev.has(k)||!open(nx,ny))continue;prev.set(k,x+y*256);q.push([nx,ny]);}
  }
  const path=[];let k=best[0]+best[1]*256;
  while(k!==-1&&k!==undefined){path.unshift([(k%256)*T+16,Math.floor(k/256)*T+16]);k=prev.get(k);}
  path.shift();
  if(bd===0)path.push([tx,ty]);
  return path;
}
function walkTo(wx,wy){
  if(!inHub()||G.talk||G.cine||mode!=='play')return false;
  if(G.active!=='wren'&&typeof swapChar==='function')swapChar();
  const nq=G.nq;let tgt=null,bd=46;
  for(const n of nq.npcs){if(n.gone||n.fading||n.show&&!NPC.cond(n.show))continue;const d=Math.hypot(n.px-wx,n.py-wy);if(d<bd){bd=d;tgt={kind:'npc',ref:n,x:n.px,y:n.py};}}
  for(const o of nq.objs){if(o.done||o.kind==='dummy'||o.show&&!NPC.cond(o.show))continue;const d=Math.hypot(o.px-wx,o.py-wy);if(d<bd){bd=d;tgt={kind:'qobj',ref:o,x:o.px,y:o.py};}}
  const gx=tgt?tgt.x:wx,gy=tgt?tgt.y:wy;
  const path=pathTo(gx,gy);
  auto={x:gx,y:gy,tgt,path,t:0};lastJ=[touch.jx,touch.jy];
  G.rings.push({x:gx,y:gy,t:.5,r:tgt?26:16,c:tgt?'255,210,120':'200,220,255'});
  return true;
}
function bindTap(){
  if(tapBound)return;tapBound=true;
  cv.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||!inHub()||mode!=='play'||G.talk||G.cine)return;
    const r=cv.getBoundingClientRect(),w=screenToWorld(e.clientX-r.left,e.clientY-r.top);
    walkTo(w.x,w.y);
  });
}

/* ---------- art: furniture, stations, standards ---------- */
const BLOCK={dummy:1,casetable:1,bench:1,board:1,shelf:1};
const SOLID=[[11,1],[13,1],[15,1],[16,1],[17,1],[1,11],[2,11],[4,13],[22,12],[25,13],[1,3],[25,4],[8,14],[9,14]];
let decor=null;
function ol(c,w){c.strokeStyle=INK;c.lineWidth=w||1.2;c.stroke();}
function rug(c,x,y,w,h,a,b){
  c.fillStyle='rgba(0,0,0,.22)';rr(c,x+2,y+3,w,h,5);c.fill();
  c.fillStyle=a;rr(c,x,y,w,h,5);c.fill();ol(c,1);
  c.strokeStyle=b;c.lineWidth=2;rr(c,x+5,y+5,w-10,h-10,3);c.stroke();
  c.lineWidth=1;c.globalAlpha=.5;for(let i=x+14;i<x+w-10;i+=12){c.beginPath();c.moveTo(i,y+9);c.lineTo(i+5,y+h/2);c.lineTo(i,y+h-9);c.stroke();}c.globalAlpha=1;
  c.strokeStyle=b;c.lineWidth=1;for(let i=y+4;i<y+h-2;i+=4){c.beginPath();c.moveTo(x-3,i);c.lineTo(x,i);c.moveTo(x+w,i);c.lineTo(x+w+3,i);c.stroke();}
}
function plank(c,x,y,w,h,col){
  const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);
  c.fillStyle='rgba(0,0,0,.28)';rr(c,x+2,y+4,w,h,3);c.fill();
  c.fillStyle=g;rr(c,x,y,w,h,3);c.fill();ol(c);
  c.strokeStyle='rgba(255,230,180,.25)';c.lineWidth=1;c.beginPath();c.moveTo(x+3,y+2.5);c.lineTo(x+w-3,y+2.5);c.stroke();
}
function shelfUnit(c,x,y,seed){ // one tile of bookshelf seen from above/front
  const r=mulberry(seed);plank(c,x+1,y+2,30,27,['#5a3c26','#3a2618']);
  for(let row=0;row<2;row++){
    const by=y+5+row*12;c.fillStyle='#22160f';c.fillRect(x+3,by,26,10);
    let bx=x+4;while(bx<x+27){const w=2+Math.floor(r()*3),hh=6+Math.floor(r()*4);
      c.fillStyle=['#8a2a30','#3a5a7a','#c8a050','#4a6a3a','#6a4a7a','#d8d0b8'][Math.floor(r()*6)];c.fillRect(bx,by+10-hh,w,hh);
      c.fillStyle='rgba(255,255,255,.25)';c.fillRect(bx,by+10-hh,1,hh);bx+=w+1;}
  }
}
function standard(c,x,y,house,st){ // a house standard on a pole: its state tells the story
  const col={marrow:'#cfc9bd',grell:'#c0902a',ostrander:'#3f8fa0',sable:'#4a3a70',kest:'#a64a2a',dunmoor:'#4a6aa6'}[house]||'#888';
  c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+13,7,2.5);c.fill();
  c.fillStyle='#4a3626';c.fillRect(x-1.2,y-14,2.4,27);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(x-1.2,y-14,2.4,27);
  c.fillStyle='#d8a24a';circ(c,x,y-15,2.4);c.fill();ol(c,1);
  if(st==='none'){c.strokeStyle='#6a5a48';c.lineWidth=1;c.beginPath();c.moveTo(x-7,y-11);c.lineTo(x+7,y-11);c.stroke();return;}
  c.fillStyle='#4a3626';c.fillRect(x-8,y-12,16,2);
  c.beginPath();
  if(st==='ruin'){c.moveTo(x-7,y-10);c.lineTo(x+7,y-10);c.lineTo(x+7,y-2);c.lineTo(x+3,y+1);c.lineTo(x+1,y-3);c.lineTo(x-2,y+3);c.lineTo(x-4,y-1);c.lineTo(x-7,y+2);}
  else{c.moveTo(x-7,y-10);c.lineTo(x+7,y-10);c.lineTo(x+7,y+6);c.lineTo(x,y+2);c.lineTo(x-7,y+6);}
  c.closePath();c.fillStyle=st==='ruin'?'#3a3034':col;c.fill();ol(c,1.1);
  c.fillStyle='rgba(255,255,255,.22)';c.fillRect(x-6,y-9,3,st==='ruin'?6:12);
  if(st==='favor'){c.strokeStyle='#ffd27a';c.lineWidth=1.4;c.beginPath();c.moveTo(x-7,y+6);c.lineTo(x,y+2);c.lineTo(x+7,y+6);c.stroke();c.fillStyle='#ffd27a';circ(c,x,y-4,2);c.fill();}
  else if(st==='fear'){c.strokeStyle='#14101a';c.lineWidth=2.2;c.beginPath();c.moveTo(x-7,y-6);c.lineTo(x+7,y);c.stroke();}
  else{c.fillStyle='#ff8a3a';c.globalAlpha=.7;circ(c,x+2,y,1.2);c.fill();circ(c,x-5,y+1,1);c.fill();c.globalAlpha=1;}
}
function bake(){
  const cvs=document.createElement('canvas');cvs.width=G.gw*T;cvs.height=G.gh*T;const c=cvs.getContext('2d');
  const R=S(),P=(x,y)=>[x*T,y*T];
  // training yard: packed sand ring
  { const [x,y]=P(5,3);c.fillStyle='rgba(214,190,140,.20)';ell(c,x,y+16,128,70);c.fill();
    c.strokeStyle='rgba(240,230,200,.35)';c.lineWidth=2;c.setLineDash([6,5]);ell(c,x-8,y+14,96,52);c.stroke();c.setLineDash([]);
    const [rx,ry]=P(1,3);plank(c,rx+3,ry-10,12,52,['#5a4030','#3a281c']); // weapon rack
    for(let i=0;i<4;i++){c.fillStyle='#b8bcc8';c.fillRect(rx+16,ry-6+i*12,12,2);c.fillStyle='#6a4a30';c.fillRect(rx+8,ry-7+i*12,8,4);c.strokeStyle=INK;c.lineWidth=.8;c.strokeRect(rx+8,ry-7+i*12,20,4);} }
  // library
  { rug(c,12*T+4,2*T+10,5*T-8,3*T-4,'#4a2a38','#c8a050');
    [11,13,15,16,17].forEach((x,i)=>shelfUnit(c,x*T,1*T,71+i*13+R.docs.length)); }
  // roost
  { const [x,y]=P(21,1);c.fillStyle='rgba(200,170,90,.16)';rr(c,x,y+4,4*T+20,3*T,12);c.fill();
    const r=mulberry(77);c.strokeStyle='rgba(220,190,110,.5)';c.lineWidth=1;for(let i=0;i<46;i++){const sx=x+r()*(4*T+10),sy=y+8+r()*(3*T-10),a=r()*3.14;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+Math.cos(a)*7,sy+Math.sin(a)*7);c.stroke();}
    const [tx,ty]=P(25,4);plank(c,tx+4,ty+2,24,26,['#6a5a48','#3a3028']);c.fillStyle='#3f8fa0';rr(c,tx+7,ty+5,18,20,2);c.fill();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(tx+9,ty+7,6,2); }
  // forge: hearth, anvil, crates
  { const [x,y]=P(1,11);
    c.fillStyle='#2a2428';rr(c,x+1,y+1,62,30,4);c.fill();ol(c,1.4);c.fillStyle='#4a4048';for(let i=0;i<6;i++){c.fillRect(x+3+i*10,y+3,8,5);c.fillRect(x+3+i*10,y+24,8,5);}
    c.fillStyle='#14090a';rr(c,x+8,y+9,46,14,3);c.fill();
    const [ax,ay]=P(4,13);c.fillStyle='rgba(0,0,0,.3)';ell(c,ax+16,ay+26,13,4);c.fill();
    c.fillStyle='#5a4030';rr(c,ax+9,ay+16,14,11,2);c.fill();ol(c);
    c.fillStyle='#6a6e7a';c.beginPath();c.moveTo(ax+3,ay+8);c.lineTo(ax+27,ay+8);c.lineTo(ax+31,ay+11);c.lineTo(ax+25,ay+16);c.lineTo(ax+8,ay+16);c.closePath();c.fill();ol(c);
    c.fillStyle='#a8acb8';c.fillRect(ax+5,ay+9,20,2);
    for(const [cx,cy,s] of [[8,14,0],[9,14,1]]){const [bx,by]=P(cx,cy);plank(c,bx+3,by+4,26,24,s?['#7a5a3a','#4a3422']:['#6a4a30','#40281a']);c.strokeStyle='rgba(20,12,8,.6)';c.lineWidth=1;c.beginPath();c.moveTo(bx+3,by+12);c.lineTo(bx+29,by+12);c.moveTo(bx+3,by+20);c.lineTo(bx+29,by+20);c.stroke();}
    if(R.flags.maud_kin){const [mx,my]=P(5,11);c.fillStyle='#d8c8a0';rr(c,mx+8,my+2,16,12,2);c.fill();ol(c,1);c.fillStyle='#7a4a2a';c.fillRect(mx+11,my+5,10,1.5);c.fillRect(mx+11,my+9,7,1.5);} }
  // hall: runner to the door, chalk tally of finished missions
  { rug(c,13*T+2,11*T+8,T*2-4,4*T-6,'#5a2a2a','#d8a24a');
    const [x,y]=P(16,15);plank(c,x+2,y+2,28,24,['#2e2a30','#1c181e']);
    c.lineWidth=1.6;let n=0;for(let i=0;i<LEVELS.length;i++){const rk=run.ranks[i];if(rk==null)continue;c.strokeStyle={S:'#ffd27a',A:'#eadfd0',B:'#b0a8b8',C:'#8a6a60'}[rk]||'#eadfd0';c.beginPath();c.moveTo(x+6+n*4,y+6);c.lineTo(x+6+n*4,y+20);c.stroke();n++;} }
  // snug: table, hearth, bedrolls
  { const [x,y]=P(22,12);c.fillStyle='rgba(0,0,0,.28)';ell(c,x+17,y+19,15,13);c.fill();
    c.fillStyle='#6a4a30';ell(c,x+16,y+16,14,12);c.fill();ol(c);c.fillStyle='#d8c8a0';c.save();c.translate(x+15,y+16);c.rotate(.3);c.fillRect(-8,-6,15,11);c.strokeStyle='#8a2a30';c.lineWidth=1;c.beginPath();c.moveTo(-5,-2);c.lineTo(1,2);c.lineTo(5,-3);c.stroke();c.restore();
    const [hx,hy]=P(25,13);c.fillStyle='#2a2428';rr(c,hx+6,hy-2,24,36,4);c.fill();ol(c,1.4);c.fillStyle='#14090a';rr(c,hx+10,hy+4,16,24,3);c.fill();
    const [bx,by]=P(19,15);
    if(R.flags.corvin_gone){c.save();c.translate(bx+30,by+14);c.rotate(-.5);c.fillStyle='#3a3a44';rr(c,-22,-7,44,14,4);c.fill();ol(c);c.restore();c.fillStyle='#b8bcc8';c.fillRect(bx+48,by-2,2,12);c.fillStyle='#3a2a20';c.fillRect(bx+45,by-4,8,3);}
    else{c.fillStyle='#2a3a4a';rr(c,bx+4,by+6,46,16,5);c.fill();ol(c);c.fillStyle='#70c0d0';c.fillRect(bx+8,by+8,3,12);c.fillStyle='#d8d0c0';rr(c,bx+38,by+8,10,12,3);c.fill();ol(c,1);}
    if(NPC.cond('ch:courier>=3')){const [wx,wy]=P(24,15);c.fillStyle='#6a3030';rr(c,wx+2,wy+8,26,13,4);c.fill();ol(c);c.fillStyle='#d04040';c.fillRect(wx+5,wy+10,2,9);} }
  // house standards along the corridor: what the city thinks of you, hung where you eat
  { const hk=Object.keys(HOUSE_NAMES),xs=[7,8,9,18,19,20];
    hk.forEach((k,i)=>{const hh=houses[k]||{favor:0,fear:0,ruin:0},m=Math.max(hh.favor,hh.fear,hh.ruin);
      const st=m<=0?'none':hh.ruin===m?'ruin':hh.fear===m?'fear':'favor';
      standard(c,xs[i]*T+16,7*T+12,k,st);}); }
  // relics on the hall shelf
  { const n=run.relics.length;for(let i=0;i<n&&i<7;i++){const x=11*T+8+i*9,y=11*T+8;c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+5,4,1.6);c.fill();c.fillStyle=['#e8c060','#9fd8ff','#e07060','#c08cff','#ff9a4a','#e0e8f0','#ffd27a'][i];c.beginPath();c.moveTo(x,y-5);c.lineTo(x+3.5,y);c.lineTo(x,y+5);c.lineTo(x-3.5,y);c.closePath();c.fill();ol(c,1);} }
  return cvs;
}
function drawBack(c,t){
  if(resume&&mode==='pause'&&!UI.modalOpen){resume=false;pauseGame(false);}
  if(!decor)decor=bake();
  c.drawImage(decor,0,0);
  // forge fire
  { const x=1*T+32,y=11*T+16,f=.75+.25*Math.sin(t*9)+.1*Math.sin(t*23);
    const g=c.createRadialGradient(x,y,2,x,y,20);g.addColorStop(0,'rgba(255,220,140,'+(.95*f)+')');g.addColorStop(.5,'rgba(255,120,40,'+(.7*f)+')');g.addColorStop(1,'rgba(255,80,20,0)');
    c.fillStyle=g;rr(c,x-23,y-7,46,14,3);c.fill(); }
  { const x=25*T+18,y=13*T+16,f=.7+.3*Math.sin(t*7+1);
    const g=c.createRadialGradient(x,y,1,x,y,12);g.addColorStop(0,'rgba(255,210,130,'+f+')');g.addColorStop(1,'rgba(255,90,20,0)');c.fillStyle=g;rr(c,x-8,y-12,16,24,3);c.fill(); }
}
function nest(c,x,y,t){
  const r=flag('roost2')?2:flag('roost1')?1:0;
  c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+6,22,12);c.fill();
  c.fillStyle='#5a5560';ell(c,x,y+2,21,13);c.fill();ol(c,1.4);
  for(let i=0;i<9;i++){const a=i/9*6.283;c.fillStyle=i%2?'#7a7480':'#6a6470';ell(c,x+Math.cos(a)*18,y+2+Math.sin(a)*10.5,4.4,3.2,a);c.fill();ol(c,.8);}
  if(r===2){c.strokeStyle='#d8a24a';c.lineWidth=2.4;ell(c,x,y+2,14.5,8.6);c.stroke();c.strokeStyle='rgba(255,240,190,.6)';c.lineWidth=1;c.beginPath();c.ellipse(x,y+2,14.5,8.6,0,3.6,4.8);c.stroke();}
  c.fillStyle=r?'#5a7a4a':'#8a7a5a';ell(c,x,y+2,12.5,7.2);c.fill();ol(c,1);
  c.fillStyle=r?'#7a9a5a':'#a89a70';ell(c,x-3,y,7,3.6);c.fill();
  if(r){const p=.5+.5*Math.sin(t*2.2);c.fillStyle='rgba(255,170,70,'+(.18+.14*p)+')';ell(c,x,y+2,10,5.6);c.fill();}
  else{c.strokeStyle='#6a5a40';c.lineWidth=1;c.beginPath();c.moveTo(x-9,y+3);c.lineTo(x+8,y);c.moveTo(x-6,y+6);c.lineTo(x+9,y+4);c.stroke();}
}
function glyph(c,o,t){
  const x=o.px,y=o.py;
  switch(o.icon){
    case 'dummy':{
      const w=(o.wob||0),a=w*Math.sin(w*14)*.22,ch=o.char||0;
      c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+11,11,4);c.fill();
      c.fillStyle='#4a3626';rr(c,x-7,y+6,14,6,2);c.fill();ol(c,1);
      c.save();c.translate(x,y+8);c.rotate(a*(Math.cos(o.wa||0)>=0?1:-1));
      c.fillStyle='#5a4030';c.fillRect(-1.6,-22,3.2,22);c.fillRect(-11,-15,22,3);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(-11,-15,22,3);
      c.fillStyle='#c8a860';rr(c,-7,-18,14,15,5);c.fill();ol(c);
      c.fillStyle='rgba(255,240,190,.35)';rr(c,-5,-17,4,11,2);c.fill();
      c.strokeStyle='#8a6a34';c.lineWidth=1;c.beginPath();c.moveTo(-7,-12);c.lineTo(7,-12);c.moveTo(-7,-8);c.lineTo(7,-8);c.stroke();
      c.fillStyle='#d8b870';circ(c,0,-23,5);c.fill();ol(c);
      c.strokeStyle='#b3262c';c.lineWidth=1.4;circ(c,0,-10,3);c.stroke();c.fillStyle='#b3262c';circ(c,0,-10,1);c.fill();
      if(ch>0){c.fillStyle='rgba(20,10,8,'+(ch*.7)+')';rr(c,-7,-18,14,15,5);c.fill();circ(c,0,-23,5);c.fill();}
      c.restore();return true;}
    case 'door':{
      const p=.5+.5*Math.sin(t*2.4);
      c.fillStyle='#3a2a20';rr(c,x-15,y-14,30,28,3);c.fill();ol(c,1.4);
      const g=c.createLinearGradient(0,y-12,0,y+12);g.addColorStop(0,'#1a2438');g.addColorStop(1,'#3a4a6a');c.fillStyle=g;c.beginPath();c.moveTo(x-10,y+12);c.lineTo(x-10,y-4);c.arc(x,y-4,10,Math.PI,0);c.lineTo(x+10,y+12);c.closePath();c.fill();ol(c,1);
      c.fillStyle='rgba(255,240,200,'+(.5+.4*p)+')';circ(c,x+4,y-7,1.1);c.fill();circ(c,x-4,y-2,.9);c.fill();circ(c,x+1,y+3,.8);c.fill();
      c.strokeStyle='rgba(255,210,120,'+(.35+.4*p)+')';c.lineWidth=1.6;rr(c,x-15,y-14,30,28,3);c.stroke();return true;}
    case 'board':{
      c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+13,13,3);c.fill();
      c.fillStyle='#4a3626';c.fillRect(x-12,y-2,2.6,15);c.fillRect(x+9.4,y-2,2.6,15);
      plank(c,x-14,y-14,28,19,['#8a6a44','#5a4028']);
      const n=3+Math.min(3,((run.npc&&run.npc.hub&&run.npc.hub.news)||[]).length);const r=mulberry(31);
      for(let i=0;i<n;i++){const px=x-11+(i%3)*8+r()*2,py=y-12+Math.floor(i/3)*8+r()*2;c.fillStyle=i===1?'#f0d8a0':'#e8e0d0';c.fillRect(px,py,6,6);c.strokeStyle=INK;c.lineWidth=.6;c.strokeRect(px,py,6,6);c.fillStyle='#b3262c';circ(c,px+3,py+1,.9);c.fill();}
      return true;}
    case 'shelf':{shelfUnit(c,x-16,y-16,64);const p=.5+.5*Math.sin(t*3);c.strokeStyle='rgba(255,210,120,'+(.3+.4*p)+')';c.lineWidth=1.4;rr(c,x-15,y-14,30,27,3);c.stroke();return true;}
    case 'casetable':{
      plank(c,x-15,y-11,30,22,['#6a4a30','#3e2a1c']);
      c.fillStyle='#e8e0d0';c.save();c.translate(x-5,y-2);c.rotate(-.2);c.fillRect(-6,-5,11,8);c.restore();c.save();c.translate(x+6,y+2);c.rotate(.25);c.fillStyle='#d8cdb0';c.fillRect(-5,-4,10,8);c.restore();
      c.strokeStyle='#b3262c';c.lineWidth=1;c.beginPath();c.moveTo(x-8,y-4);c.lineTo(x+1,y+4);c.lineTo(x+9,y-3);c.stroke();
      c.fillStyle='#f0b44c';circ(c,x-8,y-4,1.3);c.fill();circ(c,x+9,y-3,1.3);c.fill();return true;}
    case 'bench':{
      plank(c,x-15,y-10,30,20,['#7a5a3a','#4a3422']);
      c.fillStyle='#b8bcc8';c.save();c.translate(x-4,y-1);c.rotate(.5);c.fillRect(-9,-1,14,2.2);c.fillStyle='#3a2a20';c.fillRect(5,-1.6,5,3.4);c.restore();
      c.fillStyle='#3a5a7a';rr(c,x+3,y-7,9,6,2);c.fill();ol(c,.8);c.fillStyle='#d8a24a';circ(c,x+8,y+4,2.6);c.fill();ol(c,.8);return true;}
    case 'perch':nest(c,x,y,t);return true;
    case 'letter':{const b=Math.sin(t*3)*1.5;c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+8,8,2.5);c.fill();c.fillStyle='#eadfd0';c.save();c.translate(x,y+b);c.rotate(-.15);rr(c,-9,-6,18,12,1.5);c.fill();ol(c,1);c.strokeStyle='#8a7a68';c.lineWidth=1;c.beginPath();c.moveTo(-9,-6);c.lineTo(0,1);c.lineTo(9,-6);c.stroke();c.fillStyle='#d8cdb0';circ(c,0,1,2.6);c.fill();ol(c,.8);c.restore();return true;}
    case 'satchel':c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+9,10,3);c.fill();c.strokeStyle='#b3262c';c.lineWidth=2.2;c.beginPath();c.arc(x,y-3,8,3.5,5.9);c.stroke();c.fillStyle='#6a4428';rr(c,x-9,y-4,18,13,3);c.fill();ol(c);c.fillStyle='#8a5a34';rr(c,x-9,y-4,18,6,3);c.fill();ol(c,1);c.fillStyle='#e0b040';c.fillRect(x-2,y,4,3);return true;
    case 'moss':c.fillStyle='rgba(0,0,0,.25)';ell(c,x,y+7,11,3);c.fill();for(const [dx,dy,r2] of [[-5,2,5],[3,3,6],[0,-2,5.5]]){c.fillStyle='#5a7a4a';circ(c,x+dx,y+dy,r2);c.fill();ol(c,1);c.fillStyle='#8aaa62';circ(c,x+dx-1.5,y+dy-1.5,r2*.45);c.fill();}c.fillStyle='rgba(255,170,70,'+(.3+.25*Math.sin(t*3))+')';circ(c,x,y+1,3);c.fill();return true;
    case 'celldoor':c.fillStyle='#3a3640';rr(c,x-10,y-12,20,24,2);c.fill();ol(c,1.4);c.strokeStyle='#8a8f9a';c.lineWidth=1.6;for(let i=-6;i<=6;i+=4){c.beginPath();c.moveTo(x+i,y-10);c.lineTo(x+i,y+2);c.stroke();}c.fillStyle='#d8a24a';rr(c,x-3,y+4,6,5,1);c.fill();ol(c,.8);return true;
    case 'wax':c.fillStyle='rgba(0,0,0,.25)';ell(c,x,y+8,10,3);c.fill();c.fillStyle='#eadfd0';c.save();c.translate(x,y);c.rotate(.12);rr(c,-10,-8,20,15,1.5);c.fill();ol(c,1);c.fillStyle='rgba(60,40,20,.5)';c.fillRect(-7,-5,12,1);c.fillRect(-7,-2,9,1);c.restore();c.fillStyle='#b3262c';circ(c,x+5,y+3,4);c.fill();ol(c,1);c.fillStyle='#e05a5a';circ(c,x+4,y+2,1.4);c.fill();return true;
    case 'die':c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+8,9,3);c.fill();c.fillStyle='#8a7038';rr(c,x-7,y-7,14,14,2);c.fill();ol(c);c.fillStyle='#c8a050';rr(c,x-7,y-7,14,5,2);c.fill();c.strokeStyle='#5a4420';c.lineWidth=1.2;circ(c,x,y+1,3);c.stroke();return true;
    case 'bronze':c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+8,9,3);c.fill();c.fillStyle='#b88a3a';c.beginPath();c.moveTo(x-8,y+5);c.lineTo(x-3,y-8);c.lineTo(x+6,y-5);c.lineTo(x+9,y+4);c.lineTo(x,y+7);c.closePath();c.fill();ol(c);c.fillStyle='#f0d080';c.beginPath();c.moveTo(x-3,y-8);c.lineTo(x+6,y-5);c.lineTo(x+1,y-1);c.closePath();c.fill();return true;
  }
  return false;
}
/* unique rewards live outside the random loot pools */
(function(){
  if(typeof ITEMS==='undefined'||ITEMS.some(i=>i.id==='courierband'))return;
  if(typeof RARITY!=='undefined'&&!RARITY.unique){RARITY.unique={n:'Unique',c:'#ff9ad8',w:0,price:900};if(typeof RAR_ORDER!=='undefined'&&!RAR_ORDER.includes('unique'))RAR_ORDER.push('unique');}
  ITEMS.push(
   {id:'courierband',slot:'charm',rar:'unique',name:"Courier's Red Band",flavor:'Wick ran every back alley in the city wearing this. Now you do.',b:{pick:.25,bell:1}},
   {id:'maudsown',slot:'blade',rar:'unique',name:"Maud's Own",flavor:'Forged for a rescue she never had to make.',b:{dmg:1,reach:5,finisher:1}},
   {id:'broodband',slot:'gear',rar:'unique',name:'Brood Band',flavor:"The brood-master's ring, sized down for a runt. She will grow into it.",b:{dash:1,hp:1}});
  if(typeof window.giveItem!=='function')window.giveItem=id=>!!grantItem(id);
})();
return{enter,leave,canVisit,tick,use,fx,glyph,drawBack,missionObjs,missionInit,missionEnd,briefHtml,journal,peopleHtml,priceMul,affTag,walkTo,carried,
  get active(){return inHub();},aff,LEVEL};
})();
window.Hub=Hub;
