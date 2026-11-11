'use strict';
/* EMBERCROWN - equipment, mastery and the quartermaster.
   Everything the rest of the game needs is ONE hook: equipBonus(key) -> number (0 when nothing applies).
   Keys: dmg finisher reach roll rollCd sneak shade dash fire stun nova hp inv cinder smoke bell vamp mend pick */
const SLOTS=[
 {id:'blade',name:'Blade',who:'Shiloh'},
 {id:'cloak',name:'Cloak',who:'Shiloh'},
 {id:'charm',name:'Charm',who:'Shared'},
 {id:'gear',name:'Dragon gear',who:'Ashling'}
];
const RARITY={
 common:{n:'Common',c:'#b9b0c4',w:50,price:70},
 uncommon:{n:'Uncommon',c:'#7be08a',w:28,price:130},
 rare:{n:'Rare',c:'#6ab4ff',w:14,price:250},
 epic:{n:'Epic',c:'#c08cff',w:6,price:430},
 legendary:{n:'Legendary',c:'#ffb44c',w:2,price:720}
};
const RAR_ORDER=['common','uncommon','rare','epic','legendary'];
const ITEMS=[
 {id:'shiv',slot:'blade',rar:'common',name:"Gaoler's Shiv",flavor:'Short, nasty, and already used on someone.',b:{dmg:.5,reach:3}},
 {id:'whisperpoint',slot:'blade',rar:'uncommon',name:'Whisperpoint',flavor:'Reaches a little further than it should.',b:{dmg:.5,reach:6}},
 {id:'wardenbreaker',slot:'blade',rar:'rare',name:'Wardenbreaker',flavor:'Forged from a bell-rope chain.',b:{dmg:1}},
 {id:'quillcutter',slot:'blade',rar:'rare',name:"Quill's Cutter",flavor:'It finishes sentences.',b:{finisher:1.5,reach:3}},
 {id:'snuffedge',slot:'blade',rar:'epic',name:'Snuffedge',flavor:'Candles go out when it passes.',b:{finisher:2,mend:.3}},
 {id:'hallowfang',slot:'blade',rar:'legendary',name:'Hallow Fang',flavor:'A king\'s tooth, reground.',b:{dmg:1.5,finisher:2,vamp:.12}},

 {id:'shawl',slot:'cloak',rar:'common',name:"Mourner's Shawl",flavor:'Nobody looks at the grieving.',b:{sneak:.04,shade:.05}},
 {id:'ashcape',slot:'cloak',rar:'uncommon',name:'Ashfall Cape',flavor:'Loose enough to roll in.',b:{roll:.04,rollCd:.1}},
 {id:'wavecloak',slot:'cloak',rar:'rare',name:'Drowned Wavecloak',flavor:'Cold, wet, and wonderfully quiet.',b:{sneak:.07,roll:.05}},
 {id:'kesthood',slot:'cloak',rar:'rare',name:'Kest Hood',flavor:'Cut to swallow lamplight.',b:{shade:.16}},
 {id:'mantle',slot:'cloak',rar:'epic',name:'Hollow Mantle',flavor:'Worn by something that was not there.',b:{sneak:.1,shade:.12,roll:.05}},
 {id:'moonless',slot:'cloak',rar:'legendary',name:'The Moonless Shroud',flavor:'Even your shadow forgets you.',b:{sneak:.16,shade:.2,inv:.3}},

 {id:'tinbell',slot:'charm',rar:'common',name:'Tin Bell Charm',flavor:'Rings only when you ask it to.',b:{bell:1}},
 {id:'clasp',slot:'charm',rar:'uncommon',name:'Cinder Clasp',flavor:'Sparks cling to it.',b:{cinder:.15}},
 {id:'hearthstone',slot:'charm',rar:'rare',name:'Hearthstone',flavor:'Warm. Always warm.',b:{hp:1}},
 {id:'thread',slot:'charm',rar:'rare',name:"Mender's Thread",flavor:'Stitches you up out of spite.',b:{vamp:.12,mend:.2}},
 {id:'feather',slot:'charm',rar:'epic',name:'Phoenix Pinfeather',flavor:'Hurts less the second time.',b:{hp:1,inv:.3}},
 {id:'magpie',slot:'charm',rar:'legendary',name:"Magpie's Crown",flavor:'Everything shiny finds its way home.',b:{cinder:.35,smoke:1,bell:1}},

 {id:'talons',slot:'gear',rar:'common',name:'Brass Talon Caps',flavor:'Ashling hates them. Ashling wears them.',b:{fire:8}},
 {id:'collar',slot:'gear',rar:'uncommon',name:'Bellows Collar',flavor:'Every breath gets a boost.',b:{fire:14,stun:.5}},
 {id:'bridle',slot:'gear',rar:'rare',name:'Spark Bridle',flavor:'Two dashes before the first one lands.',b:{dash:1}},
 {id:'scale',slot:'gear',rar:'epic',name:'Forgeheart Scale',flavor:'A plate from the first furnace.',b:{dash:1,nova:1.5}},
 {id:'kiln',slot:'gear',rar:'legendary',name:'Kiln Crown',flavor:'Small head. Large furnace.',b:{fire:20,stun:1.5,nova:2,dash:1}}
];
const BONUS_FMT={
 dmg:['Strike damage',v=>'+'+fnum(v)],
 finisher:['Combo finisher',v=>'+'+fnum(v)+' damage'],
 reach:['Blade reach',v=>'+'+fnum(v)],
 roll:['Roll i-frames',v=>'+'+fnum(v)+'s'],
 rollCd:['Roll cooldown',v=>'-'+fnum(v)+'s'],
 sneak:['Sight while sneaking',v=>'-'+Math.round(v*100)+'%'],
 shade:['Exposure in light',v=>'-'+Math.round(v*100)+'%'],
 dash:['Ember Dash charges',v=>'+'+fnum(v)],
 fire:['Fire range',v=>'+'+fnum(v)],
 stun:['Fire stun',v=>'+'+fnum(v)+'s'],
 nova:['Nova cooldown',v=>'-'+fnum(v)+'s'],
 hp:['Hearts',v=>'+'+fnum(v)],
 inv:['Invulnerable after a hit',v=>'+'+fnum(v)+'s'],
 cinder:['Cinders found',v=>'+'+Math.round(v*100)+'%'],
 smoke:['Start with smoke powder',v=>'+'+fnum(v)],
 bell:['Start with whisper bells',v=>'+'+fnum(v)],
 vamp:['Heart chance on a kill',v=>Math.round(v*100)+'%'],
 mend:['Heart chance on a takedown',v=>Math.round(v*100)+'%'],
 pick:['Picking and stealing speed',v=>'+'+Math.round(v*100)+'%']
};
function fnum(v){return String(Math.round(v*100)/100);}
function itemById(id){return ITEMS.find(i=>i.id===id);}
function itemLines(it){return Object.keys(it.b).map(k=>BONUS_FMT[k][0]+' '+BONUS_FMT[k][1](it.b[k]));}

/* ---------- mastery ---------- */
const MASTERY_TITLES=['Cutpurse','Courier','Lamplighter','Shade','Whisperer','Knife in the Dark','Spymaster','Ghost of Hallow'];
const MASTERY_MAX=12;
function masteryXpFor(L){return 60*(L-1)*L/2;}   // cumulative xp to reach level L
function masteryLevel(xp){let L=1;while(L<MASTERY_MAX&&xp>=masteryXpFor(L+1))L++;return L;}
function masteryInfo(){
  const xp=(run.mastery&&run.mastery.xp)||0,L=masteryLevel(xp),lo=masteryXpFor(L),hi=L>=MASTERY_MAX?lo:masteryXpFor(L+1);
  return{xp,L,lo,hi,frac:L>=MASTERY_MAX?1:(xp-lo)/(hi-lo),title:MASTERY_TITLES[Math.min(MASTERY_TITLES.length-1,Math.floor((L-1)*MASTERY_TITLES.length/MASTERY_MAX))]};
}
// what each mastery level grants (passive, always on)
function masteryBonus(key,L){
  switch(key){
    case'cinder':return .015*(L-1);
    case'sneak':return .008*(L-1);
    case'dmg':return .1*Math.floor((L-1)/3);
    case'fire':return 1.5*(L-1);
    case'roll':return .006*(L-1);
    case'pick':return L>=10?.3:L>=6?.2:L>=2?.1:0; // Shiloh's lockpick tiers
  }
  return 0;
}
const MASTERY_PERKS=[['cinder','+1.5% cinders'],['sneak','-0.8% enemy sight when sneaking'],['dmg','+0.1 strike damage'],['fire','+1.5 fire range'],['roll','+0.006s roll i-frames']];

function equipBonus(key){
  let v=0;
  const eq=(typeof run!=='undefined'&&run.equipped)||{};
  for(const s in eq){const it=eq[s]&&itemById(eq[s]);if(it&&it.b[key])v+=it.b[key];}
  if(typeof run!=='undefined'&&run.mastery)v+=masteryBonus(key,masteryLevel(run.mastery.xp||0));
  return v;
}
function quickMul(){return(hasT('quick')?.7:1)*(1-Math.min(.5,equipBonus('pick')));}

/* ---------- inventory ---------- */
function ownsItem(id){return run.items.includes(id);}
function equip(id){const it=itemById(id);if(!it||!ownsItem(id))return false;run.equipped[it.slot]=run.equipped[it.slot]===id?null:id;return true;}
function grantItem(id,quiet){
  const it=itemById(id);if(!it||ownsItem(id))return null;
  run.items.push(id);
  if(!quiet&&typeof G!=='undefined'&&G)(G.itemDrops=G.itemDrops||[]).push(it);
  if(!run.equipped[it.slot])run.equipped[it.slot]=id;
  if(!quiet&&typeof G!=='undefined'&&G){toast(it.name,RARITY[it.rar].n+' '+SLOTS.find(s=>s.id===it.slot).name.toLowerCase()+(run.equipped[it.slot]===id?' (equipped)':''),RARITY[it.rar].c);Aud.S.relic();}
  return it;
}
function rollItem(key,minRar){
  const r=mulberry(Math.floor((key+7)*7919)%99991+1),mn=RAR_ORDER.indexOf(minRar||'common');
  const cap=Math.min(4,1+Math.floor((typeof lvl==='number'?lvl:0)*.7)+(mn>0?1:0));
  let pool=ITEMS.filter(i=>!ownsItem(i.id)&&RAR_ORDER.indexOf(i.rar)>=mn&&RAR_ORDER.indexOf(i.rar)<=cap);
  if(!pool.length)pool=ITEMS.filter(i=>!ownsItem(i.id)&&RAR_ORDER.indexOf(i.rar)>=mn);
  if(!pool.length)pool=ITEMS.filter(i=>!ownsItem(i.id));
  if(!pool.length)return null;
  const tot=pool.reduce((s,i)=>s+RARITY[i.rar].w,0);let x=r()*tot;
  for(const i of pool){x-=RARITY[i.rar].w;if(x<=0)return i;}
  return pool[0];
}
// vault chest / boss reward: returns the item (already granted) or null
function itemReward(src){
  const key=(typeof lvl==='number'?lvl:0)*31+(src==='boss'?17:3);
  const it=rollItem(key,src==='boss'?'rare':'common');
  return it?grantItem(it.id):null;
}

/* ---------- quartermaster (Forge shop) ---------- */
function shopStock(){
  const n=runStage?runStage.next:0,out=[];
  const r=mulberry(1234+n*57);
  const pool=ITEMS.filter(i=>!ownsItem(i.id)&&RAR_ORDER.indexOf(i.rar)<=Math.min(3,1+Math.floor(n/2)));
  // shuffle deterministically, take a different slot per offer
  const a=pool.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  const used={};
  for(const it of a){if(used[it.slot])continue;used[it.slot]=1;out.push(it);if(out.length>=3)break;}
  return out;
}
function itemPrice(it){return RARITY[it.rar].price;}
function buyItem(id){
  const it=itemById(id);if(!it||ownsItem(id)||run.cinders<itemPrice(it))return false;
  run.cinders-=itemPrice(it);grantItem(id,true);Aud.S.chest();return true;
}

/* ---------- mission XP ---------- */
function missionXp(g){
  const parts=[['Mission',80],['Rank '+g.rank,{S:120,A:80,B:50,C:25}[g.rank]||0],['Foes defeated',6*(g.st.kills||0)],['Takedowns',10*(g.st.takedowns||0)],['Secrets',20*g.secretsFound],['Ember gems',3*g.gems]];
  return parts.filter(p=>p[1]>0);
}
function awardMastery(g){
  const before=masteryInfo(),parts=missionXp(g),gain=parts.reduce((s,p)=>s+p[1],0);
  run.mastery.xp=(run.mastery.xp||0)+gain;
  const after=masteryInfo();
  g.xp={gain,parts,before,after,up:after.L>before.L};
  // Shiloh's techniques that this rank opens (js/abilities.js) show beside the gear drops on the win screen
  if(after.L>before.L&&window.Abilities&&Abilities.TECHS)for(const t of Abilities.TECHS)if(t.L>before.L&&t.L<=after.L)(g.itemDrops=g.itemDrops||[]).push({name:'Technique: '+t.name,rar:'epic',tech:true});
}

/* ---------- character sheet: current value vs. base ---------- */
function sheetRows(){
  const hp=4+(hasT('heart1')?1:0)+(hasT('heart2')?1:0)+equipBonus('hp');
  const sil=hasT('silent');
  const gems=typeof stats!=='undefined'?stats.gems:0;
  const fire=62+Math.min(gems,12)*8+(hasRelic('stormglass')?14:0)+(hasT('lung')?18:0)+equipBonus('fire');
  return{
    wren:[
      ['Hearts',hp,4],['Strike damage',fnum(1+(sil?1:0)+equipBonus('dmg')),1],['Finisher damage',fnum(2+(sil?1:0)+equipBonus('dmg')+equipBonus('finisher')),2],
      ['Blade reach',36+equipBonus('reach'),36],['Roll i-frames',fnum(.3+equipBonus('roll'))+'s','0.3s'],['Roll cooldown',fnum(Math.max(.4,.85-equipBonus('rollCd')))+'s','0.85s'],
      ['Lockpick tier',['none','I','II','III'][[2,6,10].filter(l=>masteryLevel((run.mastery&&run.mastery.xp)||0)>=l).length],'none'],
      ['Techniques',(window.Abilities?Abilities.techs().filter(t=>t.on&&!/^pick/.test(t.id)).map(t=>t.name).join(', '):'')||'none','none'],
      ['Sight while sneaking',Math.round(Math.max(.2,(hasT('cloak')?.45:.6)-equipBonus('sneak'))*100)+'%','60%'],['Exposure in light',Math.round((1-Math.min(.6,equipBonus('shade')))*100)+'%','100%']
    ],
    ash:[
      ['Fire range',Math.round(fire),62],['Fire stun',fnum(5+(hasT('searing')?2:0)+equipBonus('stun'))+'s','5s'],
      ['Abilities',(window.Abilities?Abilities.list().map(Abilities.nameOf).join(', '):'')||'none','none'],
      ['Dash charges',1+(hasT('twin')?1:0)+Math.floor(equipBonus('dash')),1],['Nova cooldown',hasT('nova')?fnum(Math.max(2,6-equipBonus('nova')))+'s':'locked','6s']
    ],
    both:[
      ['Cinders found','+'+Math.round(((hasT('scav')?.3:0)+equipBonus('cinder'))*100)+'%','+0%'],
      ['Heart on kill / takedown',Math.round(equipBonus('vamp')*100)+'% / '+Math.round(equipBonus('mend')*100)+'%','0%']
    ]
  };
}
