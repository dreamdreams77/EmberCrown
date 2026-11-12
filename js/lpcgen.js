/* EMBERCROWN - pixel characters assembled from layers.
   assets/lpc/parts/*.png (built by tools/build_lpc_parts.py) holds one small sheet per body part, garment,
   helmet and weapon. Garments, armour and hair are grey so they can be multiply-tinted: guards wear their
   house colour (theme.guard) and each NPC wears the cloth, trim and skin colours from its `look`.
   A finished sheet is cached and handed to LPC.add(), then drawn like any other LPC figure. */
'use strict';
const LPCG=(function(){
  const NAMES=['body_m','body_f','head_m','head_f','pants_m','pants_f','boots_m','boots_f','shirt_m','shirt_f','apron_m','apron_f','skirt_m','skirt_f','hood','bandana','kettle','horned','plate_t','plate_l','leather','hair_m','hair_f','spear_bg','spear_fg','bow_bg','bow_fg','axe','axe_bg','mask'];
  const P={},ok={},made={};
  for(const n of NAMES){const i=new Image();i.onload=()=>{ok[n]=true;};i.src='assets/lpc/parts/'+n+'.png';P[n]=i;}
  const W=576,H=320;
  function rgb(h){const v=parseInt(h.slice(1),16);return[v>>16&255,v>>8&255,v&255];}
  function hex(r,g,b){return'#'+((1<<24)|(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b)).toString(16).slice(1);}
  function mix(a,b,t){const x=rgb(a),y=rgb(b);return hex(x[0]+(y[0]-x[0])*t,x[1]+(y[1]-x[1])*t,x[2]+(y[2]-x[2])*t);}
  // the multiply colour that turns the sheets' pale base skin into the wanted skin tone
  function skinTint(s){const x=rgb(s),b=[240,203,168];return hex(Math.min(255,x[0]/b[0]*255),Math.min(255,x[1]/b[1]*255),Math.min(255,x[2]/b[2]*255));}
  const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const tg=tmp.getContext('2d');
  function build(key,spec){
    if(made[key])return key;
    for(const s of spec)if(!ok[s[0]])return null; // still loading: caller falls back to the drawn figure
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
    for(const[layer,col]of spec){
      if(!col){g.drawImage(P[layer],0,0);continue;}
      tg.globalCompositeOperation='source-over';tg.clearRect(0,0,W,H);tg.drawImage(P[layer],0,0);
      tg.globalCompositeOperation='multiply';tg.fillStyle=col;tg.fillRect(0,0,W,H);
      tg.globalCompositeOperation='destination-in';tg.drawImage(P[layer],0,0);
      g.drawImage(tmp,0,0);
    }
    LPC.add(key,cv);made[key]=true;return key;
  }
  // house soldiers: spear guard, hooded archer, horned brute, all in the house colour
  function guard(kind,col){
    const key='g:'+kind+col;if(made[key])return key;
    const a=mix(col,'#ffffff',.32),hi=mix(col,'#ffffff',.55),dk=mix(col,'#000000',.4);
    if(kind==='archer')return build(key,[['bow_bg'],['body_m'],['head_m'],['pants_m','#4c4a3e'],['boots_m','#7a5c40'],['shirt_m',dk],['leather','#b89264'],['hood',a],['bow_fg']]);
    if(kind==='brute')return build(key,[['axe_bg'],['body_m'],['head_m'],['pants_m','#3a3440'],['boots_m','#6a523c'],['plate_l',a],['plate_t',a],['horned',hi],['axe']]);
    return build(key,[['spear_bg'],['body_m'],['head_m'],['pants_m','#3a3440'],['boots_m','#6a523c'],['plate_l',a],['plate_t',a],['kettle',hi],['spear_fg']]);
  }
  const FEM={sera:1,nan:1,dagna:1,maud:1,odalys:1,pilot:1,hesper:1,needle:1};
  const HAIR=['#5a3a26','#33282c','#8a5630','#b98a48'];
  function npc(n){
    const L=n.look;if(!L)return null;
    const key='n:'+n.id+':'+L.cloth+L.hat;if(made[key])return key;
    const f=FEM[n.id]?'f':'m',sk=skinTint(L.skin||'#e0b890');
    let h=0;for(let i=0;i<n.id.length;i++)h=(h*31+n.id.charCodeAt(i))>>>0;
    const hair=/^Old /.test(n.name||'')?'#cfcac0':HAIR[h%HAIR.length],cloth=mix(L.cloth||'#6a5040','#ffffff',.18);
    const spec=[['body_'+f,sk],['head_'+f,sk]];
    if(L.hat!=='hood'&&L.hat!=='helm')spec.push(['hair_'+f,hair]);
    spec.push(['boots_'+f,'#6a523c']);
    if(L.k==='monk'||L.k==='scribe'||f==='f')spec.push(['skirt_'+f,mix(cloth,'#000000',.18)]);else spec.push(['pants_'+f,mix(cloth,'#000000',.42)]);
    spec.push(['shirt_'+f,cloth]);
    if(L.k==='guard')spec.push(['plate_t',mix(L.trim||'#c0c8d8','#ffffff',.2)]);
    if(L.apron)spec.push(['apron_'+f,'#ece4d0']);
    if(L.mask)spec.push(['mask','#f4f4fa']);
    if(L.hat==='hood')spec.push(['hood',cloth]);else if(L.hat==='cap')spec.push(['bandana',L.trim||'#d8c8a0']);else if(L.hat==='helm')spec.push(['kettle','#c8c8d4']);
    return build(key,spec);
  }
  return{guard,npc};
})();
// NPCs in the world (portraits and menus draw to their own canvases and keep the drawn figure)
if(window.drawNpcFigure){
  const _fig=window.drawNpcFigure;
  window.drawNpcFigure=function(c,kind,x,y,t,face,o){
    if(c===ctx&&LPC.on()&&o&&o.look&&o.id){
      const k=LPCG.npc({id:o.id,look:o.look,name:/^Old/.test(o.role||'')||o.id==='nan'||o.id==='cook'||o.id==='hesper'?'Old ':''});
      if(k){
        const mv=!!o.walk;
        c.fillStyle='rgba(0,0,0,.3)';ell(c,x,y+7,10,4);c.fill();
        LPC.blit(k,'walk',mv?LPC.walkFrame(t*8):0,mv?LPC.dir(face):2,x,y,null);
        return;
      }
    }
    return _fig.apply(this,arguments);
  };
}
