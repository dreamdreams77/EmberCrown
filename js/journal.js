'use strict';
/* EMBERCROWN - the Journal: one tabbed modal (Hero, Gear, Forge, Quests, Case, Houses, Codex).
   Pure HTML builders plus a tiny state machine; ui.js owns the modal element. */
const ICON_TAB={
  sheet:'<circle cx="32" cy="20" r="11"/><path d="M10 56c0-14 10-22 22-22s22 8 22 22z"/>',
  gear:'<path d="M52 6l6 6-30 30-6-6z"/><path d="M14 38l12 12-4 4-12-12z"/><path d="M18 46l-8 8 4 4 8-8z"/>',
  forge:RICON.ember,
  quests:'<path d="M14 8h30a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z"/><path class="cut" d="M22 20h22M22 30h22M22 40h14" stroke-width="4" stroke="#120c18" fill="none"/>',
  case:RICON.lens,
  houses:SIGIL.hallow,
  codex:'<path d="M12 8h34a6 6 0 0 1 6 6v40H18a6 6 0 0 1-6-6z"/><path class="cut" d="M20 8v40" stroke="#120c18" stroke-width="3"/>'
};
const ICON_SLOT={
  blade:'<path d="M52 6l6 6-30 30-6-6z"/><path d="M14 38l12 12-4 4-12-12z"/><path d="M18 46l-8 8 4 4 8-8z"/>',
  cloak:'<path d="M20 8h24l8 44c-6 4-14 4-20 0-6 4-14 4-20 0z"/><path class="cut" d="M32 14v34" stroke="#120c18" stroke-width="3"/>',
  charm:'<circle cx="32" cy="40" r="15" fill="none" stroke="currentColor" stroke-width="6"/><path d="M32 4l9 11-9 11-9-11z"/>',
  gear:'<path d="M8 30c0-12 10-20 24-20s24 8 24 20v8H46v-8c0-6-6-10-14-10s-14 4-14 10v8H8z"/><circle cx="32" cy="48" r="7"/>'
};
function svgIcon(path,cls){return'<svg class="'+(cls||'jic')+'" viewBox="0 0 64 64" fill="currentColor">'+path+'</svg>';}
const JTABS=[['sheet','Hero'],['gear','Gear'],['forge','Forge'],['quests','Quests'],['case','Case'],['houses','Houses'],['codex','Codex']];
const J={tab:'sheet',slot:'blade',cur:-1,kbd:false};
const jEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const Journal=(()=>{
  const jbtn=(a,label,cls,extra)=>'<button type="button" tabindex="-1" class="btn small '+(cls||'')+'" data-a="'+a+'" '+(extra||'')+'>'+label+'</button>';
  function itemTile(it,cls){
    return'<span class="itile r-'+it.rar+' '+(cls||'')+'" style="--rc:'+RARITY[it.rar].c+'">'+svgIcon(ICON_SLOT[it.slot])+'</span>';
  }
  function emptyTile(slot){return'<span class="itile empty">'+svgIcon(ICON_SLOT[slot])+'</span>';}
  function deltaLines(it,cur){
    const keys=new Set(Object.keys(it.b).concat(cur?Object.keys(cur.b):[])),out=[];
    keys.forEach(k=>{const d=(it.b[k]||0)-(cur&&cur.b[k]||0);if(Math.abs(d)<1e-6)return;
      out.push('<li class="'+(d>0?'up':'dn')+'">'+(d>0?'&#9650; ':'&#9660; ')+BONUS_FMT[k][0]+' '+BONUS_FMT[k][1](Math.abs(d)).replace(/^[+-]/,d>0?'+':'-')+'</li>');});
    return out.join('');
  }
  /* ----- Hero ----- */
  function sheetHTML(){
    const m=masteryInfo(),S=sheetRows();
    const row=r=>{const chg=String(r[1])!==String(r[2]);return'<div class="srow'+(chg?' up':'')+'"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>';};
    const eq=SLOTS.map(s=>{const it=run.equipped[s.id]&&itemById(run.equipped[s.id]);return'<button type="button" tabindex="-1" class="eqmini" data-a="jt:gear" data-slot="'+s.id+'" title="'+s.name+'">'+(it?itemTile(it):emptyTile(s.id))+'<span>'+(it?jEsc(it.name):'Empty')+'</span></button>';}).join('');
    const perk=m.L<MASTERY_MAX?'Next rank: '+MASTERY_PERKS[m.L%MASTERY_PERKS.length][1]+' and more.':'Mastery complete.';
    const st=typeof stats!=='undefined'?stats:{gems:0,caught:0,time:0};
    return'<div class="mast"><div class="mlvl"><small>Mastery</small><b>'+m.L+'</b></div><div class="mtxt"><h3>'+m.title+'</h3>'+
      '<div class="bar"><i style="width:'+Math.round(m.frac*100)+'%"></i></div><span>'+m.xp+(m.L<MASTERY_MAX?' / '+m.hi+' XP':' XP')+' &middot; '+perk+'</span></div></div>'+
      '<div class="eqrow">'+eq+'</div>'+
      '<div class="sheet"><div><h3>Shiloh</h3>'+S.wren.map(row).join('')+'</div><div><h3>Ashling</h3>'+S.ash.map(row).join('')+'<h3 class="sp">Shared</h3>'+S.both.map(row).join('')+'</div></div>'+
      '<p class="small cen">Ember gems '+st.gems+' &middot; Times caught '+st.caught+' &middot; Time '+Math.floor(st.time/60)+'m &middot; Gold values are above your base. Hearts, dash charges and starting gadgets update at the next mission.</p>';
  }
  /* ----- Gear ----- */
  function gearHTML(){
    const slots=SLOTS.map(s=>{const it=run.equipped[s.id]&&itemById(run.equipped[s.id]);
      return'<button type="button" tabindex="-1" class="slot'+(J.slot===s.id?' on':'')+'" data-a="slot:'+s.id+'">'+(it?itemTile(it):emptyTile(s.id))+'<b>'+s.name+'</b><span>'+(it?jEsc(it.name):'Empty')+'</span></button>';}).join('');
    const cur=run.equipped[J.slot]&&itemById(run.equipped[J.slot]);
    const owned=ITEMS.filter(i=>i.slot===J.slot&&ownsItem(i.id)).sort((a,b)=>RAR_ORDER.indexOf(b.rar)-RAR_ORDER.indexOf(a.rar));
    const list=owned.length?owned.map(it=>{
      const on=run.equipped[it.slot]===it.id;
      return'<button type="button" tabindex="-1" class="irow'+(on?' on':'')+'" data-a="eq:'+it.id+'">'+itemTile(it)+'<div><b style="color:'+RARITY[it.rar].c+'">'+jEsc(it.name)+'</b><em>'+RARITY[it.rar].n+'</em>'+
        '<ul>'+itemLines(it).map(l=>'<li>'+l+'</li>').join('')+'</ul>'+(on?'':'<ul class="cmp">'+deltaLines(it,cur)+'</ul>')+'<small>'+jEsc(it.flavor)+'</small></div><i>'+(on?'Equipped':'Equip')+'</i></button>';}).join('')
      :'<p class="small cen">Nothing here yet. Gear drops from vault chests and bosses, and the Quartermaster sells more at the Forge.</p>';
    const have=ITEMS.filter(i=>ownsItem(i.id)).length;
    return'<div class="slots">'+slots+'</div><h3>'+SLOTS.find(s=>s.id===J.slot).name+' <small>('+SLOTS.find(s=>s.id===J.slot).who+') &middot; '+have+' / '+ITEMS.length+' found</small></h3><div class="ilist">'+list+'</div>'+(typeof setsHTML==='function'?setsHTML():'');
  }
  /* ----- Forge: talents + quartermaster ----- */
  function forgeHTML(){
    const col=(br,title,sub)=>'<div class="fcol"><h3>'+title+'<small>'+sub+'</small></h3>'+TALENTS.filter(t=>t.branch===br).map(t=>{
      const own=hasT(t.id),rq=talentReq(t),locked=!own&&rq&&!hasT(rq),aff=canBuy(t),fx=talentFx(t.id);
      const st=own?'own':locked?'locked':aff?'buy':'poor';
      return'<button type="button" tabindex="-1" class="tal '+st+'" data-a="buy:'+t.id+'"><b>'+t.name+'</b><span>'+t.desc+'</span>'+
        (fx?'<u>'+fx[0]+': <s>'+fx[1]+'</s> &rarr; <em>'+fx[2]+'</em></u>':'')+
        '<i>'+(own?'Learned':locked?'Needs '+TALENTS.find(x=>x.id===rq).name:t.cost+' cinders')+'</i></button>';}).join('')+'</div>';
    const stock=shopStock();
    const shop=stock.length?stock.map(it=>{const p=itemPrice(it),ok=run.cinders>=p;
      return'<button type="button" tabindex="-1" class="irow shop'+(ok?'':' poor')+'" data-a="shop:'+it.id+'">'+itemTile(it)+'<div><b style="color:'+RARITY[it.rar].c+'">'+jEsc(it.name)+'</b><em>'+RARITY[it.rar].n+' '+SLOTS.find(s=>s.id===it.slot).name.toLowerCase()+'</em>'+
        '<ul>'+itemLines(it).map(l=>'<li>'+l+'</li>').join('')+'</ul></div><i>'+p+' cinders</i></button>';}).join('')
      :'<p class="small cen">The Quartermaster has nothing left that you do not already own.</p>';
    return'<p class="forgec">'+run.cinders+' cinders</p><div class="forge">'+col('wren','Shiloh','Spy')+col('ash','Ashling','Dragon')+col('both','Shared','Both')+'</div>'+
      '<h3 class="sp">Quartermaster <small>new stock each mission</small></h3><div class="ilist">'+shop+'</div>';
  }
  /* ----- Quests ----- */
  function questsHTML(){
    let L=[];try{const q=window.Quests&&window.Quests.journal&&window.Quests.journal();if(Array.isArray(q))L=q;}catch(e){L=[];}
    if(!L.length)return'<p class="small cen pad">Nobody has asked you for anything yet. People in the houses talk to those who listen.</p>';
    const done=s=>/^(done|complete|completed|failed|closed)/i.test(s||'');
    const card=q=>'<div class="quest'+(done(q.state)?' done':'')+'">'+(q.house&&SIGIL[q.house]?sigil(q.house):'<span class="qdot"></span>')+'<div><b>'+jEsc(q.title)+'</b><span>'+jEsc(q.desc)+'</span></div><i>'+jEsc(q.state||'')+'</i></div>';
    const act=L.filter(q=>!done(q.state)),dn=L.filter(q=>done(q.state));
    return'<h3>Active ('+act.length+')</h3>'+(act.map(card).join('')||'<p class="small">Nothing pending.</p>')+(dn.length?'<h3 class="sp">Finished ('+dn.length+')</h3>'+dn.map(card).join(''):'');
  }
  /* ----- Case / Houses / Codex ----- */
  function caseHTML(){
    const done=CLUES.map((c,i)=>run.ranks[i]!=null?c:null);
    const clues=done.map((c,i)=>'<div class="cx lore '+(c?'':'locked')+'"><div><b>'+(i+1)+'. '+(c?LEVELS[i].name:'???')+(run.ranks[i]?' <em class="rk r'+run.ranks[i]+'">'+run.ranks[i]+'</em>':'')+'</b><span>'+(c||'Not found yet.')+'</span></div></div>').join('');
    const verdict=done.every(Boolean)?'<p class="lead cen"><i>Quill wrote the war. I carried it.</i></p>':'';
    return'<div class="codex"><h3>Clues <small>'+done.filter(Boolean).length+' / '+CLUES.length+'</small></h3>'+clues+verdict+'</div>';
  }
  function housesHTML(){
    const mood=k=>{const h=houses[k];return h.ruin>0?'in ruins':h.fear>0?'afraid of you':h.favor>0?'owes you':'does not know your name';};
    const hs=Object.keys(HOUSE_NAMES).map(k=>{const h=houses[k];
      const st=window.NPC&&NPC.stand?NPC.stand(k):'none',fx=st!=='none'&&typeof HOUSEFX!=='undefined'?'<br><small style="opacity:.75">'+HOUSEFX[st].join(' &middot; ')+'</small>':'';
      return'<div class="hcard">'+sigil(k)+'<div><b>House '+HOUSE_NAMES[k]+'</b><span>'+mood(k)+fx+'</span></div><div class="pips"><i class="f" title="Favor">'+h.favor+'</i><i class="e" title="Fear">'+h.fear+'</i><i class="r" title="Ruin">'+h.ruin+'</i></div></div>';}).join('');
    const st=[];for(let i=1;i<STAIRS.length;i++){const a=stairsAction(i);if(a)st.push('<div class="cx lore"><div><b>'+LEVELS[i].name+'</b><span>You '+a.short+'.</span></div></div>');}
    let rk='';try{rk=window.Hub&&Hub.peopleHtml?Hub.peopleHtml():'';}catch(e){rk='';}
    return'<div class="codex"><h3>Where the houses stand <small>Favor &middot; Fear &middot; Ruin</small></h3>'+hs+(st.length?'<h3 class="sp">On the back stairs</h3>'+st.join(''):'')+(rk?'<div class="sp"></div>'+rk:'')+'</div>';
  }
  function codexHTML(){
    const rl=RELIC_KEYS.map(k=>{const have=meta.relics.includes(k)||run.relics.includes(k),r=RELICS[k];
      return'<div class="cx '+(have?'':'locked')+'">'+ricon(have?r.icon:'')+'<div><b>'+(have?r.name:'Unknown relic')+'</b><span>'+(have?r.desc:'Hidden behind a cracked wall somewhere.')+'</span></div></div>';}).join('');
    const lore=LORE.map((l,i)=>l.map(s=>{const have=meta.lore.includes(s.t);
      return'<div class="cx lore '+(have?'':'locked')+'"><div><b>'+(have?s.t:'???')+'</b><span>'+(have?s.x:'Found in '+LEVELS[i].name+'.')+'</span></div></div>';}).join('')).join('');
    const disc=meta.disc.length?meta.disc.map(t=>'<div class="cx lore"><div><b>'+t+'</b></div></div>').join(''):'<div class="cx lore locked"><div><b>???</b><span>Examine the glinting bones and notes you find in each level.</span></div></div>';
    return'<div class="codex"><h3>Relics</h3>'+rl+'<h3 class="sp">Lore</h3>'+lore+'<h3 class="sp">Discoveries ('+meta.disc.length+')</h3>'+disc+'</div>';
  }
  const BODY={sheet:sheetHTML,gear:gearHTML,forge:forgeHTML,quests:questsHTML,case:caseHTML,houses:housesHTML,codex:codexHTML};
  function badge(t){return t==='forge'&&typeof anyAffordable==='function'&&anyAffordable()?' <em class="dot"></em>':'';}
  function html(){
    const tabs=JTABS.map(([id,l],i)=>'<button type="button" tabindex="-1" role="tab" aria-selected="'+(J.tab===id)+'" class="jtab'+(J.tab===id?' on':'')+'" data-a="jt:'+id+'">'+svgIcon(ICON_TAB[id])+'<span>'+l+badge(id)+'</span></button>').join('');
    return'<div class="jr"><div class="jhead"><div class="jtabs" role="tablist">'+tabs+'</div><button type="button" tabindex="-1" class="jx" data-a="close" aria-label="Close">&times;</button></div>'+
      '<div class="jbody" data-tab="'+J.tab+'">'+BODY[J.tab]()+'</div></div>';
  }
  function focusables(root){return[...root.querySelectorAll('.jbody [data-a]:not([disabled])')];}
  function markCursor(root){
    root.querySelectorAll('.kb').forEach(e=>e.classList.remove('kb'));
    if(!J.kbd||J.cur<0)return;
    const f=focusables(root);if(J.cur>=f.length)J.cur=f.length-1;
    const e=f[J.cur];if(e){e.classList.add('kb');e.scrollIntoView({block:'nearest'});}
  }
  return{html,focusables,markCursor,
    // apply a journal action; returns true when handled
    act(a){
      if(a.startsWith('jt:')){const t=a.slice(3);if(BODY[t]){J.tab=t;J.cur=-1;}return true;}
      if(a.startsWith('slot:')){J.slot=a.slice(5);J.cur=-1;return true;}
      if(a.startsWith('eq:')){const ok=equip(a.slice(3));if(ok)Aud.S.confirm();return true;}
      if(a.startsWith('shop:')){if(!buyItem(a.slice(5)))Aud.S.back();return true;}
      return false;
    }
  };
})();
