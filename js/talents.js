'use strict';
/* EMBERCROWN - the Ember Forge: spend cinders on permanent talents. */
const TALENTS=[
 {id:'quick',branch:'wren',name:'Quick Fingers',desc:'Picking locks, stealing and snuffing take 30% less time.',cost:90},
 {id:'pockets',branch:'wren',name:'Deep Pockets',desc:'Start every mission with +1 smoke powder and +1 whisper bell.',cost:120},
 {id:'silent',branch:'wren',name:'Silent Blade',desc:'Takedowns make no noise and last far longer. Strikes hit harder.',cost:160},
 {id:'cloak',branch:'wren',name:'Shadow Cloak',desc:'Sneaking makes Shiloh much harder to spot.',cost:220},
 {id:'lung',branch:'ash',name:"Dragon's Lung",desc:'Ashling\'s fire reaches 18 units further.',cost:100},
 {id:'searing',branch:'ash',name:'Searing Flame',desc:'Fire stuns guards 2s longer and burns foes 40% faster.',cost:150},
 {id:'twin',branch:'ash',name:'Twin Dash',desc:'Ember Dash stores two charges.',cost:190},
 {id:'nova',branch:'ash',name:'Ember Nova',desc:'Unlock a radial blast (E or NOVA): stuns, breaks pots and cracks, lights braziers, clears fire orbs.',cost:260},
 {id:'scorch',branch:'ash',name:'Scorch',desc:'Ashling learns Scorch (E, G to choose): burns webs, vines, rotten doors and wax seals; sets foes alight.',cost:140,req:'lung',abil:true},
 {id:'roar',branch:'ash',name:'Roar',desc:'Ashling learns Roar: stuns guards close by, scatters the rest, shakes hanging cages loose. Loud.',cost:210,req:'searing',abil:true},
 {id:'heart1',branch:'both',name:'Stout Heart I',desc:'+1 heart.',cost:120},
 {id:'heart2',branch:'both',name:'Stout Heart II',desc:'+1 more heart.',cost:200,req:'heart1'},
 {id:'scav',branch:'both',name:'Scavenger',desc:'+30% cinders from every source.',cost:110},
 {id:'phoenix',branch:'both',name:'Phoenix Spark',desc:'Once per mission, rise from a fatal blow with 2 hearts.',cost:320}
];
function talentReq(t){
  if(t.req)return t.req;
  if(t.branch==='both')return null;
  const L=TALENTS.filter(x=>x.branch===t.branch),i=L.indexOf(t);return i>0?L[i-1].id:null;
}
function canBuy(t){return !hasT(t.id)&&!(t.abil&&window.Abilities&&Abilities.has(t.id))&&run.cinders>=t.cost&&(!talentReq(t)||hasT(talentReq(t)));}
function buyTalent(id){
  const t=TALENTS.find(x=>x.id===id);if(!t||!canBuy(t))return false;
  run.cinders-=t.cost;run.talents.push(id);Aud.S.chest();
  return true;
}
function anyAffordable(){return TALENTS.some(canBuy);}

/* "now -> next" preview shown in the Forge before you commit cinders */
function talentFx(id){
  const hp=4+(hasT('heart1')?1:0)+(hasT('heart2')?1:0);
  const F={
    quick:['Lock, steal and snuff time','100%','70%'],pockets:['Starting gadgets','as found','+1 smoke, +1 bell'],
    silent:['Takedown sleep / strike damage','9s / 1','16s / 2, quiet'],cloak:['Enemy sight while sneaking','60%','45%'],
    lung:['Fire range','+0','+18'],searing:['Fire stun / burn speed','5s / 100%','7s / 140%'],twin:['Ember Dash charges','1','2'],
    nova:['Ember Nova','locked','6s cooldown blast'],scorch:['Scorch','locked','2.5s cone of white fire'],roar:['Roar','locked','9s cooldown: stun, scatter, shake loose'],heart1:['Hearts',String(hp),String(hp+1)],heart2:['Hearts',String(hp),String(hp+1)],
    scav:['Cinders from every source','+0%','+30%'],phoenix:['Revive from a fatal blow','none','once per mission, 2 hearts']
  };
  return F[id]||null;
}
