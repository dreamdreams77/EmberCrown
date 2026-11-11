'use strict';
/* EMBERCROWN - world art: per-house architecture and a baked tile/sprite cache.
   Every house has its own wall construction, coping, pilasters, floor patterns, heraldry, doorway arches and story props.
   Hand-placed zones per mission give courtyards, battlements, cellars, flooded halls and boss arenas their own dressing.
   Tiles are drawn once per (level, state, bake scale) into small offscreen canvases and stamped into the static layer,
   so the richer art costs nothing per frame; the per-frame extras (arena sigils, water glints, skyline) are a few dozen calls. */

/* themes other modules can switch to (the Rookery hub reads THEMES.hub) */
window.THEMES=window.THEMES||{};
THEMES.hub={floor:'wood',wall:'brick',style:'hub',amb:[24,15,10,.24],part:'dust',tapestry:.05,rack:0,shelf:.06,tablecloth:false,wine:false,statueGold:false,
  wood:'#6a4a30',stone:'#8a7a68',cloth:'#6a3a28',chains:0,web:.04,bones:0,banner:.10,bannerCol:'#5a3020',torch:.14,rafters:true,
  grade:'rgba(255,170,90,.08)',bg:'dusk',guard:'#6a4a38',trim:'#e8c070',music:{root:82,mode:'lydian',tempo:.55}};

const TILES=(function(){
const S=32;
/* ---------- house styles ---------- */
const HS={
  marrow:{wall:'keep',top:'rubble',floor:'flag',pil:'buttress',pilN:5,arch:'round',em:'bone',ac:'#d9d4c4',ban:'#cfc9bd',ban2:'#2a2433',mortar:'rgba(205,200,186,.20)',fl:'#2a2530',warm:'255,176,90'},
  grell:{wall:'panel',top:'cornice',floor:'parquet',pil:'gilt',pilN:4,arch:'gilt',em:'scales',ac:'#e0b040',ban:'#9a1f28',ban2:'#e0b040',mortar:'rgba(0,0,0,.3)',fl:'#3a2418',warm:'255,170,80'},
  ostrander:{wall:'roof',top:'slate',floor:'sea',pil:null,pilN:0,arch:'round',em:'wave',ac:'#e8f4ff',ban:'#3f8fa0',ban2:'#e8f4ff',mortar:'rgba(0,0,0,.3)',fl:'#10303a',warm:'200,230,255'},
  sable:{wall:'ashlar',top:'slate',floor:'pavers',pil:'lancet',pilN:3,arch:'lancet',em:'bell',ac:'#b99cff',ban:'#2a2240',ban2:'#c8b4ff',mortar:'rgba(210,205,235,.16)',fl:'#22202a',warm:'190,190,255'},
  kest:{wall:'iron',top:'plate',floor:'tread',pil:'ibeam',pilN:4,arch:'girder',em:'anvil',ac:'#ff9a4a',ban:'#8a3a20',ban2:'#ffb070',mortar:'rgba(0,0,0,.5)',fl:'#2a1c1a',warm:'255,120,50'},
  dunmoor:{wall:'plaster',top:'marble',floor:'checker',pil:'marble',pilN:3,arch:'marble',em:'mask',ac:'#d7e2ff',ban:'#3a5a96',ban2:'#e8eeff',mortar:'rgba(255,255,255,.1)',fl:'#1d2a3a',warm:'255,215,150'},
  hallow:{wall:'sand',top:'sand',floor:'sun',pil:'broken',pilN:4,arch:'round',em:'crown',ac:'#ffd27a',ban:'#b8862a',ban2:'#3a2410',mortar:'rgba(255,220,150,.14)',fl:'#2a2216',warm:'255,190,90'},
  hub:{wall:'timber',top:'beam',floor:'planks',pil:'post',pilN:3,arch:'timber',em:'raven',ac:'#f0b44c',ban:'#5a2a1e',ban2:'#e8c070',mortar:'rgba(0,0,0,.3)',fl:'#3a2a20',warm:'255,180,100'}
};
/* hand-placed zones: [kind,x0,y0,x1,y1] (tiles, inclusive) */
const ZONES={
  0:[['battle',16,1,23,3],['yard',1,9,11,13]],
  1:[['cellar',1,10,23,13],['kitchen',1,6,7,8],['hall',6,1,16,4]],
  3:[['court',1,5,12,9],['arena',14,1,23,9],['cellar',1,11,5,13]],
  4:[['dungeon',1,1,5,13],['yard',18,1,23,4]],
  5:[['water',1,13,23,13],['court',19,1,23,5],['ball',7,1,17,11]],
  6:[['arena',1,1,23,13]]
};
/* story props: [x,y,kind] on the wall above floor tile (x,y), or on the floor ('f' prefix) */
const STORY={
  0:[[22,1,'fshell'],[21,2,'fshell'],[23,2,'fstraw'],[8,1,'tally'],[2,13,'fclaw'],[19,5,'chime'],[6,9,'tally']],
  1:[[20,1,'scales'],[3,10,'fwine'],[5,11,'fwine'],[8,12,'fwine'],[21,1,'ledger2'],[12,6,'portrait']],
  3:[[2,1,'gagbell'],[9,1,'gagbell'],[20,1,'rope'],[16,1,'rope'],[4,5,'fwax'],[19,11,'mural']],
  4:[[2,1,'chalk'],[4,1,'chalk'],[3,6,'fchain'],[2,9,'fchalk'],[11,6,'cracked']],
  5:[[2,1,'shroud'],[4,1,'shroud'],[9,1,'shroud'],[14,1,'mirrorTally'],[11,8,'fmask'],[15,4,'fmask'],[20,1,'fhedge']],
  6:[[3,1,'six'],[21,1,'six'],[6,1,'knots'],[18,1,'knots'],[12,12,'fwax'],[8,5,'fwax'],[16,9,'fwax']]
};
function key(){return G&&G.d&&(G.d.hub||G.d.th&&G.d.th.style==='hub')?'hub':(G&&G.d&&G.d.sigil)||'marrow';}
function st(){return HS[key()]||HS.marrow;}

/* ---------- colour helpers ---------- */
function mix(a,b,t){const x=hx(a),y=hx(b);return'#'+[0,1,2].map(i=>Math.round(x[i]+(y[i]-x[i])*t).toString(16).padStart(2,'0')).join('');}
function mul(h,m){const c=hx(h);return'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v*m))).toString(16).padStart(2,'0')).join('');}

/* ---------- the cache ---------- */
const cache=new Map();let ckey='',made=0;
function reset(){const k=lvl+'|'+(G.state||'')+'|'+ST.sc+'|'+key()+'|'+(G.d.name||'');if(k!==ckey){cache.clear();ckey=k;}}
function spr(id,w,h,fn){
  let cv=cache.get(id);if(cv)return cv;
  const s=ST.sc||1;cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(w*s));cv.height=Math.max(1,Math.ceil(h*s));
  const g=cv.getContext('2d');g.setTransform(s,0,0,s,0,0);fn(g);cache.set(id,cv);made++;return cv;
}
const hash=(x,y,s)=>{let n=Math.imul(x*374761393+y*668265263+(s|0)*1442695041,1274126177);n^=n>>>13;n=Math.imul(n,1103515245);return((n^(n>>>16))>>>0)/4294967296;};

/* ---------- zones ---------- */
function buildZones(){
  const gw=G.gw,gh=G.gh,Z=Array.from({length:gh},()=>new Array(gw).fill(''));
  const list=G.d.hub?[]:(ZONES[LEVELS.indexOf(G.d)]||[]);
  for(const [k,x0,y0,x1,y1] of list)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(Z[y]&&x<gw)Z[y][x]=k;
  if(G.d.vault){const a=G.d.vault.rect;for(let y=Math.min(a[1],a[3]);y<=Math.max(a[1],a[3]);y++)for(let x=Math.min(a[0],a[2]);x<=Math.max(a[0],a[2]);x++)if(Z[y])Z[y][x]='vault';}
  G.zone=Z;
}
function zone(x,y){const r=G.zone&&G.zone[y];return r?r[x]||'':'';}
const OUT={court:1,battle:1,yard:1};

/* ---------- emblems (heraldry) ---------- */
function emblem(g,k,x,y,s,col,dark){
  g.save();g.translate(x,y);g.scale(s/10,s/10);g.fillStyle=col;g.strokeStyle=col;g.lineWidth=1.4;g.lineCap='round';g.lineJoin='round';
  if(k==='bone'){ // skull under a crown of bone
    ell(g,0,1,5,4.6);g.fill();g.fillRect(-3,4,6,3);
    g.fillStyle=dark;ell(g,-2,1,1.4,1.6);g.fill();ell(g,2,1,1.4,1.6);g.fill();g.fillRect(-.5,3,1,1.5);
    g.fillStyle=col;for(const i of[-4,0,4]){g.beginPath();g.moveTo(i-1.4,-3);g.lineTo(i,-8+(i?1.5:0));g.lineTo(i+1.4,-3);g.fill();}
    g.beginPath();g.moveTo(-7,8);g.lineTo(7,-8);g.moveTo(7,8);g.lineTo(-7,-8);g.globalAlpha=.55;g.stroke();
  } else if(k==='scales'){
    g.beginPath();g.moveTo(0,-8);g.lineTo(0,7);g.moveTo(-7,-5);g.lineTo(7,-5);g.moveTo(-4,8);g.lineTo(4,8);g.stroke();
    g.beginPath();g.moveTo(-7,-5);g.lineTo(-9.5,1);g.lineTo(-4.5,1);g.closePath();g.moveTo(7,-5);g.lineTo(9.5,1);g.lineTo(4.5,1);g.closePath();g.stroke();
    g.beginPath();g.arc(-7,1,2.6,0,3.14);g.arc(7,1,2.6,0,3.14);g.fill();circ(g,0,-8,1.6);g.fill();
  } else if(k==='bell'){ // the silenced bell: bell with a bar across its mouth
    g.beginPath();g.moveTo(-6,5);g.quadraticCurveTo(-5,-7,0,-7);g.quadraticCurveTo(5,-7,6,5);g.closePath();g.fill();
    g.fillRect(-7.5,4.5,15,2.2);circ(g,0,8.4,1.6);g.fill();
    g.strokeStyle=dark;g.lineWidth=1.6;g.beginPath();g.moveTo(-8,-2);g.lineTo(8,2);g.stroke();
  } else if(k==='anvil'){
    g.beginPath();g.moveTo(-8,-1);g.lineTo(6,-1);g.quadraticCurveTo(9,-1,10,-3);g.lineTo(6,2);g.lineTo(3,2);g.lineTo(4,6);g.lineTo(6,8);g.lineTo(-6,8);g.lineTo(-4,6);g.lineTo(-3,2);g.lineTo(-6,2);g.closePath();g.fill();
    g.save();g.translate(-1,-6);g.rotate(-.5);g.fillRect(-1,-2,8,2);g.fillRect(-3,-4,4,6);g.restore();
  } else if(k==='mask'){
    g.beginPath();g.moveTo(-9,-2);g.quadraticCurveTo(-8,-6,-3,-4);g.quadraticCurveTo(0,-2,3,-4);g.quadraticCurveTo(8,-6,9,-2);g.quadraticCurveTo(8,4,3,3);g.quadraticCurveTo(0,1,-3,3);g.quadraticCurveTo(-8,4,-9,-2);g.fill();
    g.fillStyle=dark;ell(g,-4,-1,2.2,1.3,.2);g.fill();ell(g,4,-1,2.2,1.3,-.2);g.fill();
    g.strokeStyle=col;g.beginPath();g.moveTo(-9,-2);g.quadraticCurveTo(-11,-8,-6,-9);g.stroke();
  } else if(k==='crown'){ // crown of five flames and one empty socket
    g.beginPath();g.moveTo(-8,6);g.lineTo(-8,-1);g.lineTo(-5,2);g.lineTo(-2.5,-2);g.lineTo(0,2);g.lineTo(2.5,-2);g.lineTo(5,2);g.lineTo(8,-1);g.lineTo(8,6);g.closePath();g.fill();
    for(let i=0;i<6;i++){const xx=-7.5+i*3;if(i===5){g.strokeStyle=col;g.lineWidth=.8;g.strokeRect(xx-.6,-6,1.2,3);continue;}g.fillRect(xx-.6,-5,1.2,3);ell(g,xx,-7,.9,1.6);g.fill();}
    g.fillStyle=dark;g.fillRect(-8,3.5,16,1.2);
  } else if(k==='wave'){
    g.fillRect(-2,-8,4,10);g.beginPath();g.moveTo(-4,-8);g.lineTo(0,-11);g.lineTo(4,-8);g.fill();
    g.beginPath();g.moveTo(-9,5);for(let i=0;i<4;i++)g.quadraticCurveTo(-7+i*4.5,1,-4.5+i*4.5,5);g.stroke();
  } else if(k==='raven'){
    g.beginPath();g.moveTo(-9,2);g.quadraticCurveTo(-3,-6,3,-3);g.lineTo(7,-6);g.lineTo(6,-2);g.lineTo(9,-1);g.lineTo(5,1);g.quadraticCurveTo(0,6,-6,5);g.lineTo(-9,8);g.closePath();g.fill();
    g.fillStyle=dark;circ(g,4.5,-2.6,.8);g.fill();
  }
  g.restore();
}

/* ---------- floor patterns (32x32, local coords) ---------- */
function bevel(g,x,y,w,h,a){g.fillStyle='rgba(255,255,255,'+(a*.6)+')';g.fillRect(x,y,w,1);g.fillRect(x,y,1,h);g.fillStyle='rgba(0,0,0,'+a+')';g.fillRect(x,y+h-1,w,1);g.fillRect(x+w-1,y,1,h);}
function grit(g,r,n,a){for(let i=0;i<n;i++){g.fillStyle=r()<.5?'rgba(255,255,255,'+a*.5+')':'rgba(0,0,0,'+a+')';g.fillRect(r()*S,r()*S,1+r()*1.6,1+r()*1.2);}}
function crack(g,r,a){g.strokeStyle='rgba(0,0,0,'+a+')';g.lineWidth=.9;g.beginPath();let x=r()*S,y=r()*S;g.moveTo(x,y);for(let i=0;i<4;i++){x+=(r()-.5)*12;y+=(r()-.5)*12;g.lineTo(x,y);}g.stroke();}
const FLOOR={
  flag(g,b,r,v){ // Marrow: rough-cut flagstones, cobbles, packed earth
    if(v===3)return FLOOR.earth(g,b,r);
    g.fillStyle=mul(b,.55);g.fillRect(0,0,S,S);
    if(v===2){for(let i=0;i<12;i++){const x=3+(i%4)*8.4+r()*2,y=3+Math.floor(i/4)*10.5+r()*2+(i%4%2)*2;g.fillStyle=mul(b,.95+r()*.4);ell(g,x,y,4.4,4,r());g.fill();g.fillStyle='rgba(255,255,255,.07)';ell(g,x-1,y-1.4,2.2,1.2,0);g.fill();}return;}
    const rows=v===1?[[0,S]]:[[0,10+r()*12|0]];if(v!==1)rows.push([rows[0][1],S]);
    for(const [y0,y1] of rows){let x=0;const cut=v===1?[S]:[8+r()*16|0,S];for(const x1 of cut){g.fillStyle=mul(b,.86+r()*.32);g.fillRect(x+1,y0+1,x1-x-2,y1-y0-2);bevel(g,x+1,y0+1,x1-x-2,y1-y0-2,.28);
      g.fillStyle=mul(b,.5);g.beginPath();g.moveTo(x+1,y0+1);g.lineTo(x+1+r()*4,y0+1);g.lineTo(x+1,y0+1+r()*4);g.fill();x=x1;}}
    grit(g,r,7,.18);if(r()<.35)crack(g,r,.4);
  },
  earth(g,b,r){ // packed earth with straw
    g.fillStyle=mix(b,'#4a3a28',.45);g.fillRect(0,0,S,S);
    for(let i=0;i<10;i++){g.fillStyle='rgba(0,0,0,.18)';ell(g,r()*S,r()*S,2+r()*4,1+r()*2,r()*3);g.fill();}
    g.strokeStyle='rgba(200,170,90,.35)';g.lineWidth=.8;for(let i=0;i<7;i++){const x=r()*S,y=r()*S,a=r()*3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*6,y+Math.sin(a)*6);g.stroke();}
    grit(g,r,8,.2);
  },
  parquet(g,b,r,v){ // Grell: basket-weave parquet, long boards, terracotta
    if(v===2)return FLOOR.terra(g,b,r);
    const w=mix(b,'#6a4024',.45);
    if(v===1){for(let j=0;j<4;j++){g.fillStyle=mul(w,.85+r()*.3);g.fillRect(0,j*8,S,8);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,j*8+7,S,1);g.fillRect((r()*S)|0,j*8,1,7);g.fillStyle='rgba(255,220,170,.10)';g.fillRect(0,j*8,S,1);}return;}
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){const ox=i*16,oy=j*16,hz=(i+j)%2===0;
      for(let k=0;k<2;k++){g.fillStyle=mul(w,.8+r()*.34);if(hz){g.fillRect(ox,oy+k*8,16,8);g.fillStyle='rgba(0,0,0,.38)';g.fillRect(ox,oy+k*8+7,16,1);g.fillStyle='rgba(255,220,170,.09)';g.fillRect(ox,oy+k*8,16,1);}
        else{g.fillRect(ox+k*8,oy,8,16);g.fillStyle='rgba(0,0,0,.38)';g.fillRect(ox+k*8+7,oy,1,16);g.fillStyle='rgba(255,220,170,.09)';g.fillRect(ox+k*8,oy,1,16);}}}
    g.strokeStyle='rgba(0,0,0,.12)';g.lineWidth=.6;for(let i=0;i<5;i++){const y=r()*S;g.beginPath();g.moveTo(0,y);g.lineTo(S,y+(r()-.5)*2);g.stroke();}
    if(v===3){g.fillStyle='rgba(224,176,64,.22)';g.fillRect(0,0,S,1.4);g.fillRect(0,0,1.4,S);}
  },
  terra(g,b,r){
    const t=mix(b,'#7a3a22',.5);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,0,S,S);
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){g.fillStyle=mul(t,.86+r()*.3);rr(g,i*16+1,j*16+1,14,14,2);g.fill();g.fillStyle='rgba(255,210,160,.10)';g.fillRect(i*16+2,j*16+2,11,1.4);}
    g.fillStyle='rgba(30,10,4,.4)';g.fillRect(14,14,4,4);grit(g,r,4,.15);
  },
  pavers(g,b,r,v){ // Sable: limestone pavers with quatrefoil insets, encaustic tile, worn flags
    const lb=mix(b,'#6a6680',.32);
    if(v===2)return FLOOR.flag(g,lb,r,1);
    if(v===1){ // encaustic: four tiles with a muted violet-and-ochre quatrefoil
      for(let j=0;j<2;j++)for(let i=0;i<2;i++){const ox=i*16,oy=j*16;g.fillStyle=mul(lb,.9+r()*.12);g.fillRect(ox,oy,16,16);
        g.fillStyle='rgba(120,90,170,.35)';for(const [a,c] of[[8,3],[13,8],[8,13],[3,8]]){circ(g,ox+a,oy+c,3);g.fill();}
        g.fillStyle='rgba(200,170,110,.35)';circ(g,ox+8,oy+8,2.4);g.fill();g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1;g.strokeRect(ox+.5,oy+.5,15,15);}
      grit(g,r,6,.16);return;}
    g.fillStyle=mul(lb,.5);g.fillRect(0,0,S,S);
    g.fillStyle=mul(lb,.9+r()*.2);g.fillRect(1,1,S-2,S-2);bevel(g,1,1,S-2,S-2,.3);
    g.fillStyle=mul(lb,.6);for(const [x,y] of[[0,0],[S,0],[0,S],[S,S]]){g.beginPath();g.moveTo(x,y-5);g.lineTo(x+5,y);g.lineTo(x,y+5);g.lineTo(x-5,y);g.fill();}
    g.fillStyle='rgba(185,156,255,.10)';for(const [x,y] of[[0,0],[S,0],[0,S],[S,S]]){circ(g,x,y,2);g.fill();}
    if(v===3){g.fillStyle='rgba(255,255,255,.05)';ell(g,16,18,9,5,.2);g.fill();} // worn hollow where monks walked
    grit(g,r,6,.16);if(r()<.3)crack(g,r,.35);
  },
  tread(g,b,r,v){ // Kest: diamond tread plate, grating over embers, firebrick
    const m=mix(b,'#3a3436',.4);
    if(v===2){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,S,S);for(let j=0;j<4;j++){const off=(j%2)*8;for(let i=-1;i<3;i++){g.fillStyle=mix(mul(b,.9+r()*.3),'#5a2418',.4);g.fillRect(off+i*16+1,j*8+1,14,6);}}grit(g,r,6,.2);return;}
    if(v===1){g.fillStyle='#0c0605';g.fillRect(0,0,S,S);const gr=g.createRadialGradient(16,16,2,16,16,20);gr.addColorStop(0,'rgba(255,110,30,.45)');gr.addColorStop(1,'rgba(120,30,8,.1)');g.fillStyle=gr;g.fillRect(2,2,S-4,S-4);
      g.fillStyle=mul(m,.9);for(let k=1;k<S;k+=5){g.fillRect(k,1,1.8,S-2);}g.fillRect(0,0,S,2);g.fillRect(0,S-2,S,2);g.fillRect(0,0,2,S);g.fillRect(S-2,0,2,S);return;}
    g.fillStyle=mul(m,.95+r()*.15);g.fillRect(0,0,S,S);
    g.fillStyle='rgba(255,255,255,.07)';for(let j=0;j<5;j++)for(let i=0;i<5;i++){g.save();g.translate(4+i*6+(j%2)*3,4+j*6);g.rotate(.6);g.fillRect(-2,-.6,4,1.2);g.restore();}
    g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1.4;g.strokeRect(.7,.7,S-1.4,S-1.4);
    g.fillStyle='#120a08';for(const [x,y] of[[3,3],[S-3,3],[3,S-3],[S-3,S-3]]){circ(g,x,y,1.3);g.fill();}
    if(v===3||r()<.25){g.fillStyle='rgba(20,8,4,.4)';ell(g,r()*S,r()*S,5+r()*5,3+r()*3,r()*3);g.fill();}
  },
  checker(g,b,r,v){ // Dunmoor: blue-white marble checker, star parquet, veined slab
    if(v===1)return FLOOR.star(g,b,r);
    const w=mix(b,'#9aa8c0',.35),k=mix(b,'#0c1220',.4);
    if(v===2){g.fillStyle=mul(w,.9);g.fillRect(0,0,S,S);g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=.8;for(let i=0;i<3;i++){g.beginPath();g.moveTo(r()*S,0);g.bezierCurveTo(r()*S,10,r()*S,22,r()*S,S);g.stroke();}bevel(g,0,0,S,S,.3);return;}
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){g.fillStyle=(i+j)%2?k:w;g.fillRect(i*16,j*16,16,16);}
    const gr=g.createLinearGradient(0,0,S,S);gr.addColorStop(0,'rgba(255,255,255,.10)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.14)');g.fillStyle=gr;g.fillRect(0,0,S,S);
    g.strokeStyle='rgba(255,255,255,.08)';g.lineWidth=.7;g.beginPath();g.moveTo(r()*16,0);g.quadraticCurveTo(r()*S,16,16+r()*16,S);g.stroke();
    g.fillStyle='rgba(215,226,255,.18)';g.fillRect(0,0,S,.8);g.fillRect(0,16,S,.6);g.fillRect(16,0,.6,S);
  },
  star(g,b,r){
    const w=mix(b,'#5a6a88',.3);g.fillStyle=mul(w,.9);g.fillRect(0,0,S,S);
    for(let i=0;i<4;i++){g.save();g.translate(16,16);g.rotate(i*1.5708);g.fillStyle=mul(w,1.15+(i%2)*.15);g.beginPath();g.moveTo(0,0);g.lineTo(16,-6);g.lineTo(16,6);g.closePath();g.fill();g.restore();}
    g.strokeStyle='rgba(215,226,255,.18)';g.lineWidth=.8;g.strokeRect(.5,.5,S-1,S-1);
  },
  sun(g,b,r,v){ // Hallow: gold-veined sandstone, sunburst inlays
    const s=mix(b,'#5a4828',.35);
    g.fillStyle=mul(s,.55);g.fillRect(0,0,S,S);
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){g.fillStyle=mul(s,.85+r()*.3);g.fillRect(i*16+1,j*16+1,14,14);bevel(g,i*16+1,j*16+1,14,14,.25);}
    if(v===1){g.strokeStyle='rgba(255,210,120,.28)';g.lineWidth=.9;for(let i=0;i<8;i++){const a=i*.785;g.beginPath();g.moveTo(16+Math.cos(a)*3,16+Math.sin(a)*3);g.lineTo(16+Math.cos(a)*14,16+Math.sin(a)*14);g.stroke();}circ(g,16,16,3);g.stroke();}
    if(v===2||r()<.4){g.strokeStyle='rgba(255,205,110,.30)';g.lineWidth=.7;g.beginPath();let x=r()*S,y=0;g.moveTo(x,y);for(let i=0;i<4;i++){x+=(r()-.5)*10;y+=8;g.lineTo(x,y);}g.stroke();}
    if(r()<.5)crack(g,r,.45);grit(g,r,6,.18);
    if(v===3){g.fillStyle='rgba(240,225,190,.35)';ell(g,8+r()*16,8+r()*16,4+r()*3,3,r());g.fill();}
  },
  planks(g,b,r,v){ // Rookery: worn wide planks, rush mat
    const w=mix(b,'#5a3e28',.35);
    for(let j=0;j<3;j++){const h=j===2?10:11;g.fillStyle=mul(w,.82+r()*.3);g.fillRect(0,j*11,S,h);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,j*11+h-1,S,1);g.fillStyle='rgba(255,220,170,.08)';g.fillRect(0,j*11,S,1);
      const sx=(r()*S)|0;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(sx,j*11,1,h);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(sx+3,j*11+4,1.4,1.4);}
    if(v===1){g.fillStyle='rgba(170,140,70,.22)';g.fillRect(2,2,S-4,S-4);g.strokeStyle='rgba(90,60,20,.3)';g.lineWidth=.8;for(let k=4;k<S-2;k+=3){g.beginPath();g.moveTo(2,k);g.lineTo(S-2,k);g.stroke();}}
  },
  sea(g,b,r){g.fillStyle=b;g.fillRect(0,0,S,S);}
};
/* zone floors */
const ZFLOOR={
  court(g,b,r,v,sig){ // garth / garden: grass and stepping stones under the open sky
    const gc=sig==='dunmoor'?'#1c3a3a':sig==='sable'?'#1e2e26':'#24301e';
    g.fillStyle=mix(b,gc,.7);g.fillRect(0,0,S,S);
    for(let i=0;i<26;i++){const x=r()*S,y=r()*S;g.strokeStyle=r()<.5?'rgba(120,170,110,.35)':'rgba(10,30,14,.45)';g.lineWidth=.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*2,y-2-r()*3);g.stroke();}
    if(v===1){g.fillStyle=mix(b,'#7a7480',.5);ell(g,16,16,9,7,r());g.fill();g.fillStyle='rgba(255,255,255,.08)';ell(g,14,14,5,3,0);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1;ell(g,16,16,9,7,0);g.stroke();}
    if(v===2){g.fillStyle='rgba(200,190,230,.5)';for(let i=0;i<4;i++){circ(g,4+r()*24,4+r()*24,1);g.fill();}}
  },
  yard(g,b,r,v){FLOOR.earth(g,mix(b,'#5a4a36',.3),r);if(v===1){g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=1.2;for(let i=0;i<3;i++){const x=6+i*9+r()*3,y=6+r()*20;ell(g,x,y,1.8,3,0);g.stroke();}}},
  battle(g,b,r,v){FLOOR.flag(g,mix(b,'#4a4a58',.3),r,v===2?2:0);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(14,0,4,S);g.fillStyle='rgba(120,140,170,.10)';g.fillRect(15,0,1,S);},
  cellar(g,b,r,v,sig){ // old brick, damp and straw
    const k=sig==='grell'?'#3a2620':'#2a2626';g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,S,S);
    for(let j=0;j<4;j++){const off=(j%2)*8;for(let i=-1;i<3;i++){g.fillStyle=mix(mul(b,.75+r()*.3),k,.4);g.fillRect(off+i*16+1,j*8+1,14,6);}}
    if(v===1){g.fillStyle='rgba(30,50,40,.35)';ell(g,16,18,12,8,r());g.fill();g.fillStyle='rgba(160,200,200,.1)';ell(g,13,15,5,2,0);g.fill();}
    if(v===2){g.strokeStyle='rgba(190,160,80,.35)';g.lineWidth=.8;for(let i=0;i<8;i++){const x=r()*S,y=r()*S,a=r()*3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7);g.stroke();}}
    grit(g,r,6,.22);
  },
  dungeon(g,b,r,v,sig){ZFLOOR.cellar(g,mix(b,'#3a2a26',.2),r,v===0?1:v,sig);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,0,S,S);},
  vault(g,b,r,v,sig){ // the house's old dungeon: heavy worn flags, runnels
    g.fillStyle=mul(b,.45);g.fillRect(0,0,S,S);
    g.fillStyle=mul(b,.8+r()*.2);g.fillRect(1,1,S-2,S-2);bevel(g,1,1,S-2,S-2,.35);
    g.fillStyle='rgba(0,0,0,.25)';ell(g,8+r()*16,8+r()*16,5+r()*5,3+r()*3,r()*3);g.fill();crack(g,r,.45);grit(g,r,8,.2);
  },
  kitchen(g,b,r){FLOOR.terra(g,b,r);},
  water(g,b,r,v,sig){ // flooded undercroft: dark water over sunken tiles, a plank walk
    g.fillStyle=mix(b,'#0e2a34',.6);g.fillRect(0,0,S,S);
    g.fillStyle='rgba(0,0,0,.25)';for(let j=0;j<2;j++)for(let i=0;i<2;i++)if((i+j)%2)g.fillRect(i*16+1,j*16+1,14,14);
    g.strokeStyle='rgba(170,220,240,.16)';g.lineWidth=.8;for(let i=0;i<3;i++){const y=4+r()*24,x=r()*20;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+5,y-2,x+10,y);g.stroke();}
    if(v!==3){g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,11,S,11);g.fillStyle=mix(b,'#5a4632',.5);g.fillRect(0,12,S,4);g.fillRect(0,17,S,4);g.fillStyle='rgba(255,230,190,.1)';g.fillRect(0,12,S,1);g.fillRect(0,17,S,1);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(r()*28,12,1.2,9);}
  },
  ball(g,b,r,v){return FLOOR.checker(g,b,r,v===2?1:0);},
  hall(g,b,r,v){return FLOOR.parquet(g,b,r,v===2?3:v);},
  arena(g,b,r,v,sig){if(sig==='sable')return FLOOR.pavers(g,b,r,v===1?1:2);return FLOOR.sun(g,b,r,v);}
};
/* which patterns a whole room may use, and the odd feature tile scattered through it */
const ROOMV={flag:[0,1,2,0],parquet:[0,1,2,3],pavers:[0,1,3,0],tread:[0,3,2,0],checker:[0,1,2,0],sun:[0,2,3,0],planks:[0,0,1,0]};
const FEAT={tread:1,sun:1,pavers:1};
function floor(c,x,y,p,fs,th){
  if(G.flight)return false;
  reset();
  const s=st(),z=zone(x,y),sig=key(),alt=(x+y)%2,rm=G.rooms&&G.roomOf&&G.roomOf[y][x]>=0?G.rooms[G.roomOf[y][x]]:null;
  const rv=rm?rm.v:(z==='vault'?0:1),h=hash(x,y,lvl),v=Math.floor(h*4);
  const ruin=G.state==='ruin';
  let base=alt?p.f1:p.f2;
  const fn=ZFLOOR[z]||null;
  // pattern choice: room variant picks the room's floor, tile hash adds a few odd tiles
  const RV=ROOMV[s.floor]||[0],ft=FEAT[s.floor];
  const pv=z?(z==='water'?(x%5===2?3:0):z==='court'?(h<.12?1:h<.2?2:0):z==='vault'?0:v%3):(ft!=null&&h<.06?ft:RV[rv%RV.length]);
  const id='f|'+(z||'-')+'|'+s.floor+'|'+pv+'|'+alt+'|'+(h*6|0)+(ruin?'r':'');
  const tile=spr(id,S,S,g=>{const r=mulberry((pv*131+alt*17+(h*6|0)*7+lvl*977)|0);(fn||FLOOR[s.floor]||FLOOR.flag)(g,base,r,pv,sig);
    if(ruin){g.fillStyle='rgba(20,10,6,.25)';g.fillRect(0,0,S,S);crack(g,r,.5);}});
  c.drawImage(tile,x*T,y*T,T,T);
  if(rm&&rm.tint&&rm.tint!==1){c.fillStyle=rm.tint<1?'rgba(0,0,0,'+((1-rm.tint)*1.4).toFixed(3)+')':'rgba(255,240,220,'+((rm.tint-1)*.35).toFixed(3)+')';c.fillRect(x*T,y*T,T,T);}
  return true;
}

/* ---------- wall faces (front) and wall tops ---------- */
const CAP=9;
function face(g,s,p,v,r,z){
  const w=p.w,wt=p.wt,F=S-CAP;
  const gr=g.createLinearGradient(0,CAP,0,S);gr.addColorStop(0,mul(w,.98));gr.addColorStop(1,mul(w,.56));g.fillStyle=gr;g.fillRect(0,CAP,S,F);
  const old=z==='vault'||z==='cellar'||z==='dungeon';
  const wall=old?'rubble':s.wall;
  if(wall==='keep'||wall==='rubble'){ // big rough-hewn blocks, pale mortar
    const rows=wall==='rubble'?[[CAP,CAP+7],[CAP+7,CAP+15],[CAP+15,S]]:[[CAP,CAP+11],[CAP+11,S]];
    rows.forEach(([y0,y1],j)=>{let x=-(j%2?6+r()*6:r()*4);while(x<S){const bw=wall==='rubble'?7+r()*9:12+r()*10;
      g.fillStyle=mul(w,(.78+r()*.3)*(1-(y0-CAP)/F*.25));g.fillRect(x+1,y0+1,bw-2,y1-y0-2);
      g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x+1,y0+1,bw-2,1.2);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x+1,y1-2,bw-2,1.2);
      x+=bw;}});
    g.fillStyle=s.mortar;for(const [y0] of rows)g.fillRect(0,y0,S,1);
    if(old){g.fillStyle='rgba(40,70,50,.25)';g.fillRect(0,S-6,S,6);for(let i=0;i<3;i++){g.fillRect(r()*S,CAP+r()*10,1.4,6+r()*8);}}
    if(v===3&&!old){g.fillStyle='#1a1418';rr(g,13,CAP+6,6,6,1);g.fill();g.strokeStyle='#5a5664';g.lineWidth=1.3;g.beginPath();g.arc(16,CAP+15,3.5,0,6.28);g.stroke();}
  } else if(wall==='panel'){ // Grell: damask above a gilt rail, panelled wainscot below
    const dm=mix(w,'#5a1a22',.45);g.fillStyle=dm;g.fillRect(0,CAP,S,11);
    g.fillStyle='rgba(224,176,64,.20)';for(let i=0;i<4;i++)for(let j=0;j<2;j++){const x=4+i*8+(j%2)*4,y=CAP+3+j*5;g.beginPath();g.moveTo(x,y-2);g.lineTo(x+1.6,y);g.lineTo(x,y+2);g.lineTo(x-1.6,y);g.fill();}
    g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,CAP,S,1.5);
    g.fillStyle='#e0b040';g.fillRect(0,CAP+11,S,1.6);g.fillStyle='rgba(255,240,180,.5)';g.fillRect(0,CAP+11,S,.6);
    const wd=mix(w,'#3a2414',.6);g.fillStyle=wd;g.fillRect(0,CAP+12.6,S,F-12.6);
    for(let i=0;i<2;i++){g.fillStyle=mul(wd,1.18);g.fillRect(i*16+2.5,CAP+15,11,S-CAP-18);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(i*16+2.5,S-3.6,11,1);g.fillRect(i*16+12.5,CAP+15,1,S-CAP-18);g.fillStyle='rgba(255,220,170,.12)';g.fillRect(i*16+2.5,CAP+15,11,.8);}
    g.fillStyle='#1a0e08';g.fillRect(0,S-2,S,2);
  } else if(wall==='ashlar'){ // Sable: pale dressed limestone, fine joints
    const a=mix(w,'#8a86a0',.25);
    for(let j=0;j<3;j++){const y0=CAP+j*7.7,off=(j%2)*11;for(let i=-1;i<3;i++){g.fillStyle=mul(a,(.86+r()*.18)*(1-j*.12));g.fillRect(off+i*22+.6,y0+.6,21,6.6);}}
    g.fillStyle=s.mortar;for(let j=0;j<3;j++)g.fillRect(0,CAP+j*7.7,S,.7);
    g.fillStyle='rgba(30,60,40,.30)';for(let i=0;i<4;i++)g.fillRect(r()*S,S-2-r()*5,2+r()*3,6);
  } else if(wall==='iron'){ // Kest: riveted plate over a firebrick plinth
    const m=mix(w,'#40383a',.3);g.fillStyle=m;g.fillRect(0,CAP,S,F-7);
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(15.4,CAP,1.2,F-7);g.fillStyle='rgba(255,255,255,.07)';g.fillRect(0,CAP+1,S,1);
    g.fillStyle='#120a08';for(const x of[3,13,19,29])for(const y of[CAP+3,S-10]){circ(g,x,y,1.2);g.fill();}
    g.fillStyle='rgba(255,170,120,.12)';for(const x of[3,13,19,29]){circ(g,x-.4,CAP+2.6,.5);g.fill();}
    for(let i=0;i<4;i++){g.fillStyle=mix(mul(w,.8+r()*.3),'#6a2a18',.5);g.fillRect(i*8+.5,S-7,7,6.4);}
    g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,S-7.5,S,1);
    if(r()<.5){g.fillStyle='rgba(255,110,30,.25)';g.fillRect(0,S-1.6,S,1.2);}
    g.fillStyle='rgba(20,10,8,.35)';g.fillRect(r()*20,CAP+1,4+r()*6,F-9); // soot
  } else if(wall==='plaster'){ // Dunmoor: pale plaster, silver-moulded panels, marble dado
    const pl=mix(w,'#8a9cc0',.25);g.fillStyle=pl;g.fillRect(0,CAP,S,F);
    g.strokeStyle='rgba(215,226,255,.38)';g.lineWidth=1;g.strokeRect(4.5,CAP+3.5,23,9);g.strokeStyle='rgba(0,0,0,.25)';g.strokeRect(5.5,CAP+4.5,23,9);
    g.fillStyle=mix(w,'#dfe6f4',.4);g.fillRect(0,CAP+15,S,2);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,CAP+17,S,1);
    g.fillStyle=mul(pl,.7);g.fillRect(0,CAP+18,S,F-18);g.fillStyle='rgba(215,226,255,.15)';g.fillRect(3,CAP+19.5,26,.8);
  } else if(wall==='sand'){ // Hallow: sandstone with veins of gold, wax drips
    for(let j=0;j<2;j++){const y0=CAP+j*11.5,off=(j%2)*9;for(let i=-1;i<3;i++){g.fillStyle=mul(mix(w,'#7a6440',.2),(.8+r()*.32)*(1-j*.15));g.fillRect(off+i*18+.8,y0+.8,16.4,10);}}
    g.fillStyle=s.mortar;g.fillRect(0,CAP+11.5,S,.8);
    g.strokeStyle='rgba(255,205,110,.35)';g.lineWidth=.6;g.beginPath();let x=r()*S,y=CAP;g.moveTo(x,y);for(let i=0;i<4;i++){x+=(r()-.5)*10;y+=5;g.lineTo(x,y);}g.stroke();
    if(r()<.6){const dx=4+r()*24;g.fillStyle='rgba(240,228,200,.55)';g.fillRect(dx,CAP,2,4+r()*7);circ(g,dx+1,CAP+6+r()*5,1.3);g.fill();}
  } else if(wall==='timber'){ // Rookery: oak frame and daub
    g.fillStyle=mix(w,'#8a7458',.35);g.fillRect(0,CAP,S,F);
    for(let i=0;i<10;i++){g.fillStyle='rgba(0,0,0,.08)';g.fillRect(r()*S,CAP+r()*F,3,2);}
    const ok='#2a1a10';g.fillStyle=ok;g.fillRect(0,CAP,3,F);g.fillRect(S-3,CAP,3,F);g.fillRect(0,S-4,S,4);g.fillRect(0,CAP,S,2.5);
    if(v%2){g.strokeStyle=ok;g.lineWidth=3;g.beginPath();g.moveTo(3,S-4);g.lineTo(S-3,CAP+2.5);g.stroke();}
    g.fillStyle='rgba(255,220,170,.12)';g.fillRect(0,CAP,S,.8);
  } else {g.fillStyle='rgba(0,0,0,.3)';for(let j=0;j<3;j++)g.fillRect(0,CAP+j*7.6+6.4,S,1.2);}
  // coping / cap
  const cg=g.createLinearGradient(0,0,0,CAP);cg.addColorStop(0,mul(wt,1.12));cg.addColorStop(1,mul(wt,.76));g.fillStyle=cg;g.fillRect(0,0,S,CAP);
  const top=old?'rubble':s.top;
  if(top==='cornice'){g.fillStyle=mix(wt,'#2a1a10',.6);g.fillRect(0,0,S,CAP);g.fillStyle='#e0b040';g.fillRect(0,CAP-2.5,S,1);g.fillStyle='rgba(0,0,0,.4)';for(let i=0;i<8;i++)g.fillRect(i*4+1,CAP-1.5,2,1.5);}
  else if(top==='marble'){g.fillStyle=mix(wt,'#e8eef8',.35);g.fillRect(0,0,S,CAP);g.fillStyle='rgba(0,0,0,.2)';for(let i=0;i<8;i++)g.fillRect(i*4+1,CAP-3,2,2);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,1.5,S,.8);}
  else if(top==='plate'){g.fillStyle='#120a08';for(const x of[4,12,20,28]){circ(g,x,4.5,1.1);g.fill();}g.fillStyle='rgba(255,140,60,.10)';g.fillRect(0,CAP-1.5,S,1);}
  else if(top==='slate'){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,CAP*.55,S,.8);g.fillStyle='rgba(60,100,70,.35)';g.fillRect(r()*24,CAP-2,4+r()*6,2);}
  else if(top==='rubble'||top==='sand'){g.fillStyle='rgba(0,0,0,.2)';let x=0;while(x<S){const bw=5+r()*8;g.fillRect(x,0,1,CAP);x+=bw;}if(r()<.4){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(r()*28,0,4,2);}}
  else if(top==='beam'){g.fillStyle='#2a1a10';g.fillRect(0,0,S,CAP);g.fillStyle='rgba(255,220,170,.12)';g.fillRect(0,1,S,.8);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(r()*28,2,4,.8);}
  g.fillStyle='rgba(255,255,255,.16)';g.fillRect(0,0,S,1.4);g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,CAP-1,S,1.5);
}
/* a pilaster, buttress or column standing proud of the face */
function pilaster(g,s,p,r){
  const w=p.w,k=s.pil;
  if(k==='buttress'){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(9,CAP,16,S-CAP);g.fillStyle=mul(w,1.12);g.fillRect(8,CAP-3,14,S-CAP+3);g.fillStyle=mul(w,.8);g.fillRect(8,CAP+10,14,1);g.fillStyle=mul(p.wt,1.1);g.fillRect(7,CAP-4,16,4);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(8,CAP-3,1.4,S-CAP);}
  else if(k==='gilt'){g.fillStyle='#2a160c';g.fillRect(11,CAP,10,S-CAP);g.fillStyle='rgba(255,220,160,.10)';g.fillRect(12,CAP,1,S-CAP);g.fillStyle='#e0b040';g.fillRect(10,CAP,12,2.4);g.fillRect(10,S-4,12,2);circ(g,16,CAP+9,2);g.fill();}
  else if(k==='lancet'){ // blind lancet arch with a slit of moonlit glass
    g.fillStyle='rgba(0,0,0,.55)';g.beginPath();g.moveTo(9,S-2);g.lineTo(9,CAP+9);g.quadraticCurveTo(9,CAP+1,16,CAP-1);g.quadraticCurveTo(23,CAP+1,23,CAP+9);g.lineTo(23,S-2);g.closePath();g.fill();
    const gl=g.createLinearGradient(0,CAP+2,0,S-4);gl.addColorStop(0,'rgba(170,185,255,.75)');gl.addColorStop(1,'rgba(90,80,170,.4)');g.fillStyle=gl;g.beginPath();g.moveTo(14.5,S-5);g.lineTo(14.5,CAP+6);g.quadraticCurveTo(16,CAP+2,17.5,CAP+6);g.lineTo(17.5,S-5);g.closePath();g.fill();
    g.strokeStyle=mul(p.wt,1.15);g.lineWidth=1.3;g.beginPath();g.moveTo(8.5,S-2);g.lineTo(8.5,CAP+9);g.quadraticCurveTo(8.5,CAP,16,CAP-2);g.quadraticCurveTo(23.5,CAP,23.5,CAP+9);g.lineTo(23.5,S-2);g.stroke();
  }
  else if(k==='ibeam'){g.fillStyle='#14100f';g.fillRect(11,CAP-2,10,S-CAP+2);g.fillStyle='#3a3234';g.fillRect(13,CAP-2,6,S-CAP+2);g.fillStyle='rgba(255,170,120,.14)';g.fillRect(13,CAP-2,1,S-CAP);g.fillStyle='#0a0606';for(let y=CAP+2;y<S;y+=6){circ(g,12,y,.9);g.fill();circ(g,20,y,.9);g.fill();}}
  else if(k==='marble'){const m=mix(p.wt,'#eef2fa',.45);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(12,CAP,10,S-CAP);g.fillStyle=m;g.fillRect(11,CAP,9,S-CAP);g.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<3;i++)g.fillRect(12.5+i*2.6,CAP+3,1,S-CAP-6);g.fillStyle=mul(m,1.08);g.fillRect(9,CAP-1,13,3);g.fillRect(9,S-3,13,3);}
  else if(k==='broken'){const m=mix(p.wt,'#a8905a',.3);g.fillStyle=m;g.fillRect(11,CAP+6,10,S-CAP-6);g.fillStyle=mul(m,.7);g.fillRect(11,CAP+6,2,S-CAP-6);g.fillStyle='#d9a441';g.fillRect(11,CAP+12,10,1.4);g.fillStyle=mul(m,1.1);g.beginPath();g.moveTo(11,CAP+6);g.lineTo(14,CAP+2);g.lineTo(17,CAP+5);g.lineTo(21,CAP+3);g.lineTo(21,CAP+6);g.fill();}
  else if(k==='post'){g.fillStyle='#24160c';g.fillRect(13,CAP-1,6,S-CAP+1);g.strokeStyle='#24160c';g.lineWidth=2.4;g.beginPath();g.moveTo(5,CAP+1);g.lineTo(13,CAP+7);g.moveTo(27,CAP+1);g.lineTo(19,CAP+7);g.stroke();}
}
/* battlement parapet: merlons with the night sky between them */
function crenel(g,p){
  for(let i=0;i<2;i++){const x=i*16+8;const sk=g.createLinearGradient(0,0,0,CAP+8);sk.addColorStop(0,'#0c0a1c');sk.addColorStop(1,'#2a2a48');g.fillStyle=sk;g.fillRect(x,0,8,CAP+7);
    g.fillStyle='rgba(255,255,255,.6)';g.fillRect(x+2+i*3,3,.8,.8);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x,CAP+6,8,1.2);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x-1,0,1,CAP+7);}
}
function wallTop(g,s,p,r,v){
  const wt=p.wt;g.fillStyle=mul(wt,.74);g.fillRect(0,0,S,S);
  const t=s.top;
  if(t==='rubble'||t==='sand'){for(let i=0;i<7;i++){g.fillStyle=mul(wt,.62+r()*.22);rr(g,r()*26,r()*26,5+r()*7,4+r()*6,2);g.fill();}}
  else if(t==='cornice'||t==='beam'){g.fillStyle=mix(wt,'#2a1a10',.55);g.fillRect(0,0,S,S);g.fillStyle='rgba(0,0,0,.25)';for(let j=0;j<4;j++)g.fillRect(0,j*8+7,S,1);}
  else if(t==='slate'){for(let j=0;j<4;j++)for(let i=0;i<3;i++){g.fillStyle=mul(wt,.6+r()*.16);g.fillRect(i*11+(j%2)*5-2,j*8,10,7);}}
  else if(t==='plate'){g.fillStyle=mul(wt,.6);g.fillRect(1,1,S-2,S-2);g.fillStyle='#120a08';for(const [x,y] of[[4,4],[28,4],[4,28],[28,28]]){circ(g,x,y,1.2);g.fill();}}
  else if(t==='marble'){g.fillStyle=mix(mul(wt,.8),'#c8d2e8',.2);g.fillRect(0,0,S,S);g.strokeStyle='rgba(255,255,255,.07)';g.beginPath();g.moveTo(r()*S,0);g.quadraticCurveTo(r()*S,16,r()*S,S);g.stroke();}
  g.fillStyle='rgba(0,0,0,.16)';g.fillRect(0,15,S,1);g.fillRect(15,0,1,S);
}
function wall(c,x,y,p,flight){
  if(flight)return false;
  reset();
  const s=st(),px=x*T,py=y*T,front=!isW(x,y+1)&&y+1<G.gh;
  if(front){
    const z=zone(x,y+1),h=hash(x,y,lvl+3),v=h*4|0,old=z==='vault'||z==='cellar'||z==='dungeon';
    const pil=s.pil&&!old&&x%s.pilN===0&&isW(x-1,y)&&isW(x+1,y)&&!isW(x-1,y+1)&&!isW(x+1,y+1)&&!G.doors[x+','+(y+1)];
    const bat=z==='battle'&&y===0;
    const id='w|'+s.wall+'|'+(old?'o':'')+'|'+v+'|'+(pil?1:0)+'|'+(bat?1:0)+'|'+(G.state==='ruin'?'r':'');
    c.drawImage(spr(id,S,S,g=>{const r=mulberry(v*97+(pil?5:0)+lvl*31);face(g,s,p,v,r,z);if(pil)pilaster(g,s,p,r);if(bat)crenel(g,p);
      if(G.state==='ruin'){g.fillStyle='rgba(20,10,6,.22)';g.fillRect(0,0,S,S);crack(g,r,.55);}}),px,py,T,T);
  } else {
    const v=hash(x,y,lvl+5)*3|0;
    c.drawImage(spr('t|'+s.top+'|'+v,S,S,g=>wallTop(g,s,p,mulberry(v*13+lvl),v)),px,py,T,T);
    if(!isW(x,y-1)&&y>0){c.fillStyle='rgba(255,255,255,.10)';c.fillRect(px,py,T,1.5);}
    if(!isW(x-1,y)){c.fillStyle='rgba(255,255,255,.07)';c.fillRect(px,py,1.5,T);}
    if(!isW(x+1,y)){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(px+T-1.5,py,1.5,T);}
  }
  return true;
}

/* ---------- banners and wall decor ---------- */
function bannerSprite(kind){
  const s=st(),k=key();
  return spr('ban|'+kind+'|'+k,S,S,g=>{
    const em=s.em,c1=s.ban,c2=s.ban2;
    if(kind==='tap'){ // tapestry: woven field, border, centred arms
      g.fillStyle='#24160e';g.fillRect(2,10,S-4,2);g.fillStyle=c1;g.fillRect(4,11,S-8,S-12);
      g.strokeStyle=c2;g.globalAlpha=.6;g.lineWidth=1;g.strokeRect(5.5,12.5,S-11,S-15);g.globalAlpha=1;
      g.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<6;i++)g.fillRect(4+i*4,11,1,S-12);
      emblem(g,em,16,20,7,c2,c1);g.fillStyle=c2;for(let i=0;i<6;i++)g.fillRect(5+i*4,S-2,1.6,2.4);return;}
    g.fillStyle='#24160e';g.fillRect(7,10,18,2);circ(g,7,11,1.6);g.fill();circ(g,25,11,1.6);g.fill();
    const tat=k==='marrow'||k==='hallow';
    g.fillStyle=c1;g.beginPath();g.moveTo(9,11);g.lineTo(23,11);
    if(k==='sable'){g.lineTo(23,S);g.lineTo(16,S-4);g.lineTo(9,S);}
    else if(tat){g.lineTo(23,S-5);g.lineTo(21,S-2);g.lineTo(19,S-6);g.lineTo(16,S-3);g.lineTo(13,S-7);g.lineTo(11,S-2);g.lineTo(9,S-6);}
    else{g.lineTo(23,S-6);g.lineTo(16,S-10+(k==='grell'?2:0));g.lineTo(9,S-6);}
    g.closePath();g.fill();
    const sg=g.createLinearGradient(9,0,23,0);sg.addColorStop(0,'rgba(255,255,255,.10)');sg.addColorStop(.5,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=sg;g.fill();
    if(k==='grell'){g.fillStyle='#e0b040';g.fillRect(9,11,14,1.4);for(let i=0;i<7;i++)g.fillRect(9.5+i*2,S-6+(i<4?i:6-i)*-1.3,1,2.4);}
    if(k==='dunmoor'){g.fillStyle='rgba(232,238,255,.6)';g.fillRect(9,13,14,.8);}
    emblem(g,em,16,19,6.2,c2,c1);
    if(G.state==='ruin'){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(9,22,5,8);}
  });
}
/* story props on walls: drawn straight into the static layer */
function storyWall(c,kind,px,py){
  const k=key();
  switch(kind){
    case'tally':{c.strokeStyle='rgba(225,215,195,.55)';c.lineWidth=.8;for(let g=0;g<3;g++){const x0=px+5+g*8,y0=py+CAP+4;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x0+i*1.6,y0);c.lineTo(x0+i*1.6,y0+8);c.stroke();}c.beginPath();c.moveTo(x0-1,y0+6);c.lineTo(x0+6,y0+2);c.stroke();}break;}
    case'chime':{c.strokeStyle='#2a2430';c.lineWidth=1;c.beginPath();c.moveTo(px+8,py+CAP+1);c.lineTo(px+24,py+CAP+1);c.stroke();for(let i=0;i<4;i++){const x=px+9+i*4.5,l=5+(i%2)*3;c.beginPath();c.moveTo(x,py+CAP+1);c.lineTo(x,py+CAP+4);c.stroke();c.strokeStyle='rgba(225,220,200,.85)';c.lineWidth=1.6;c.beginPath();c.moveTo(x,py+CAP+4);c.lineTo(x,py+CAP+4+l);c.stroke();c.strokeStyle='#2a2430';c.lineWidth=1;}break;}
    case'scales':{c.fillStyle='#1a0e08';c.fillRect(px+6,py+CAP+2,20,15);c.strokeStyle='#e0b040';c.lineWidth=.8;c.strokeRect(px+6.5,py+CAP+2.5,19,14);emblem(c,'scales',px+16,py+CAP+10,6,'#e0b040','#1a0e08');break;}
    case'ledger2':{for(let i=0;i<2;i++){c.fillStyle=i?'#5a1a1a':'#2a3a5a';c.fillRect(px+7+i*10,py+CAP+5,8,11);c.fillStyle='#e0b040';c.fillRect(px+7+i*10,py+CAP+7,8,1);}c.fillStyle='#24160e';c.fillRect(px+5,py+CAP+16,22,2);break;}
    case'portrait':{c.fillStyle='#e0b040';c.fillRect(px+7,py+CAP+1,18,16);c.fillStyle='#2a1a1a';c.fillRect(px+9,py+CAP+3,14,12);c.fillStyle='#8a5a48';ell(c,px+16,py+CAP+8,3,3.6);c.fill();c.fillStyle='#5a1a22';c.fillRect(px+11,py+CAP+11,10,4);c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=1.2;c.beginPath();c.moveTo(px+11,py+CAP+5);c.lineTo(px+21,py+CAP+12);c.stroke();break;}
    case'gagbell':{c.strokeStyle='#2a2430';c.lineWidth=1;c.beginPath();c.moveTo(px+16,py+CAP);c.lineTo(px+16,py+CAP+3);c.stroke();c.fillStyle='#b8902a';c.beginPath();c.moveTo(px+10,py+CAP+13);c.quadraticCurveTo(px+11,py+CAP+3,px+16,py+CAP+3);c.quadraticCurveTo(px+21,py+CAP+3,px+22,py+CAP+13);c.closePath();c.fill();
      c.fillStyle='#d8d0c0';c.fillRect(px+9,py+CAP+8,14,3.4);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(px+9,py+CAP+10.4,14,1);c.fillRect(px+21,py+CAP+10,1.6,5);break;}
    case'rope':{c.strokeStyle='#8a6a40';c.lineWidth=1.6;c.beginPath();c.moveTo(px+16,py);c.quadraticCurveTo(px+18,py+16,px+16,py+T-3);c.stroke();c.fillStyle='#5a3a20';ell(c,px+16,py+T-3,2.4,3.4);c.fill();break;}
    case'mural':{c.fillStyle='rgba(200,180,140,.25)';c.fillRect(px+3,py+CAP+2,26,16);c.fillStyle='rgba(60,40,70,.7)';ell(c,px+12,py+CAP+8,2,2.4);c.fill();c.fillRect(px+10.5,py+CAP+10,3,6);c.fillStyle='rgba(255,210,120,.8)';c.fillRect(px+15.4,py+CAP+6,1.2,4);
      c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=.9;for(let i=0;i<5;i++){c.beginPath();c.moveTo(px+18+i,py+CAP+5);c.lineTo(px+21+i,py+CAP+17);c.stroke();}break;}
    case'chalk':{c.strokeStyle='rgba(235,235,225,.55)';c.lineWidth=.8;c.beginPath();c.moveTo(px+6,py+CAP+12);c.quadraticCurveTo(px+12,py+CAP+4,px+18,py+CAP+10);c.lineTo(px+24,py+CAP+7);c.moveTo(px+12,py+CAP+8);c.lineTo(px+9,py+CAP+3);c.lineTo(px+15,py+CAP+7);c.stroke();
      for(let i=0;i<4;i++){c.beginPath();c.moveTo(px+7+i*2,py+CAP+15);c.lineTo(px+7+i*2,py+CAP+19);c.stroke();}break;}
    case'cracked':{c.fillStyle='#1a1412';c.fillRect(px+6,py+CAP+6,20,3);c.strokeStyle='#ff9a4a';c.lineWidth=.7;c.beginPath();c.moveTo(px+16,py+CAP+6);c.lineTo(px+15,py+CAP+9);c.stroke();break;}
    case'shroud':{c.fillStyle='#c8b070';c.fillRect(px+8,py+CAP-1,16,3);c.fillStyle='rgba(225,230,240,.85)';c.beginPath();c.moveTo(px+7,py+CAP+1);c.lineTo(px+25,py+CAP+1);c.quadraticCurveTo(px+27,py+CAP+12,px+25,py+T-2);c.lineTo(px+20,py+T-4);c.lineTo(px+15,py+T-1);c.lineTo(px+10,py+T-4);c.lineTo(px+7,py+T-2);c.quadraticCurveTo(px+5,py+CAP+12,px+7,py+CAP+1);c.fill();
      c.strokeStyle='rgba(100,110,140,.35)';c.lineWidth=.8;for(let i=0;i<3;i++){c.beginPath();c.moveTo(px+11+i*5,py+CAP+3);c.lineTo(px+10+i*5,py+T-4);c.stroke();}break;}
    case'mirrorTally':{c.fillStyle='#c8b070';c.fillRect(px+8,py+CAP,16,18);c.fillStyle='#3a2a1a';c.fillRect(px+10,py+CAP+2,12,14);c.strokeStyle='rgba(235,225,200,.6)';c.lineWidth=.6;for(let i=0;i<10;i++){c.beginPath();c.moveTo(px+11+i,py+CAP+4+(i%2)*6);c.lineTo(px+11+i,py+CAP+8+(i%2)*6);c.stroke();}break;}
    case'six':{c.fillStyle='#2a1e10';c.fillRect(px+3,py+CAP+10,26,2);for(let i=0;i<6;i++){const x=px+5+i*4.4;c.fillStyle='#8a6a30';c.fillRect(x-1.2,py+CAP+8,2.4,2);if(i===5)continue;c.fillStyle='#efe2c8';c.fillRect(x-1,py+CAP+3,2,5);c.fillStyle='#ffcf70';ell(c,x,py+CAP+1.6,1,1.8);c.fill();}
      c.fillStyle='rgba(240,228,200,.5)';c.fillRect(px+8,py+CAP+12,1.4,4);c.fillRect(px+17,py+CAP+12,1.4,6);break;}
    case'knots':{c.strokeStyle='#a08040';c.lineWidth=1.2;c.beginPath();c.moveTo(px+6,py+CAP);c.lineTo(px+26,py+CAP);c.stroke();for(let i=0;i<4;i++){const x=px+8+i*5;c.beginPath();c.moveTo(x,py+CAP);c.lineTo(x,py+CAP+10+(i%2)*4);c.stroke();for(let j=0;j<3;j++){circ(c,x,py+CAP+3+j*3.4,1.1);c.fillStyle='#c09a50';c.fill();}}break;}
  }
}
function storyFloor(c,kind,px,py,r){
  switch(kind){
    case'fshell':for(let i=0;i<4;i++){c.fillStyle='rgba(230,220,190,.75)';c.beginPath();const x=px+6+r()*20,y=py+6+r()*20,a=r()*6;c.moveTo(x,y);c.lineTo(x+Math.cos(a)*5,y+Math.sin(a)*5);c.lineTo(x+Math.cos(a+1)*4,y+Math.sin(a+1)*4);c.fill();c.fillStyle='rgba(120,60,30,.4)';c.fillRect(x,y,1.2,1.2);}break;
    case'fstraw':c.strokeStyle='rgba(200,170,90,.55)';c.lineWidth=.9;for(let i=0;i<16;i++){const x=px+2+r()*28,y=py+2+r()*28,a=r()*3;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7);c.stroke();}break;
    case'fclaw':c.strokeStyle='rgba(10,6,4,.6)';c.lineWidth=1.8;for(let i=0;i<3;i++){c.beginPath();c.moveTo(px+6+i*6,py+4);c.quadraticCurveTo(px+9+i*6,py+16,px+8+i*6,py+28);c.stroke();}c.strokeStyle='rgba(255,120,40,.25)';c.lineWidth=.8;c.stroke();break;
    case'fwine':c.fillStyle='rgba(90,10,24,.55)';ell(c,px+16+r()*6-3,py+16+r()*6-3,3+r()*3,2+r()*2,r()*3);c.fill();ell(c,px+6+r()*20,py+6+r()*20,1.4,1.1,0);c.fill();break;
    case'fwax':c.fillStyle='rgba(240,228,200,.42)';for(let i=0;i<5;i++){ell(c,px+6+r()*20,py+6+r()*20,1.5+r()*2.5,1+r()*1.6,r()*3);c.fill();}break;
    case'fchain':c.strokeStyle='#3a3436';c.lineWidth=1.3;for(let i=0;i<6;i++){ell(c,px+4+i*4.4,py+18+Math.sin(i)*2,2.2,1.4,i%2?0:1.2);c.stroke();}c.fillStyle='#2a2426';rr(c,px+26,py+14,5,8,2);c.fill();break;
    case'fchalk':c.strokeStyle='rgba(235,235,225,.4)';c.lineWidth=.8;circ(c,px+16,py+16,9);c.stroke();c.beginPath();c.moveTo(px+10,py+18);c.quadraticCurveTo(px+16,py+10,px+22,py+16);c.lineTo(px+25,py+12);c.stroke();break;
    case'fmask':c.save();c.translate(px+16,py+16);c.rotate(r()*3);emblem(c,'mask',0,0,7,'rgba(230,236,255,.85)','#1d2a3a');c.restore();break;
    case'fhedge':break;
  }
}
function story(c){
  const list=G.d.hub?[]:(STORY[LEVELS.indexOf(G.d)]||[]),r=mulberry(4401+lvl);
  for(const [x,y,k] of list){
    if(!G.grid[y]||isW(x,y))continue;
    if(k[0]==='f'&&k!=='fhedge'){storyFloor(c,k,x*T,y*T,r);continue;}
    if(isW(x,y-1))storyWall(c,k,x*T,(y-1)*T);
  }
}

/* ---------- zone dressing, arenas, AO and light pools (baked) ---------- */
function bakeZones(c){
  if(G.flight)return;
  const gw=G.gw,gh=G.gh,r=mulberry(812+lvl);
  // outdoor: the building's eaves cast a long soft shadow on the ground
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
    const z=zone(x,y);if(!OUT[z]||isW(x,y))continue;
    if(isW(x,y-1)){const g=c.createLinearGradient(0,y*T,0,y*T+T*1.2);g.addColorStop(0,'rgba(0,0,10,.45)');g.addColorStop(1,'rgba(0,0,10,0)');c.fillStyle=g;c.fillRect(x*T,y*T,T,T*1.2);}
    if(isW(x-1,y)){const g=c.createLinearGradient(x*T,0,x*T+T*.8,0);g.addColorStop(0,'rgba(0,0,10,.35)');g.addColorStop(1,'rgba(0,0,10,0)');c.fillStyle=g;c.fillRect(x*T,y*T,T*.8,T);}
  }
  // courts: a well or a tree base, hedges along garden walls
  for(const R of G.rooms||[]){
    const cx=Math.round((R.x0+R.x1)/2),cy=Math.round((R.y0+R.y1)/2),z=zone(cx,cy);
    if(z==='court'&&!propTile(cx,cy)){ // moss-ringed paving in the middle of the garth
      c.strokeStyle='rgba(150,150,170,.35)';c.lineWidth=3;circ(c,cx*T+16,cy*T+16,26);c.stroke();c.strokeStyle='rgba(30,60,40,.4)';c.lineWidth=1.5;circ(c,cx*T+16,cy*T+16,30);c.stroke();
    }
  }
  // grand-room medallions: the house arms inlaid in the floor
  const s=st();
  for(const R of G.rooms||[]){
    const w=R.x1-R.x0+1,h=R.y1-R.y0+1,cx=(R.x0+R.x1+1)/2*T,cy=(R.y0+R.y1+1)/2*T,z=zone(Math.floor(cx/T),Math.floor(cy/T));
    if(R.n<36||w<6||h<4||R.rug<=.5||z==='arena'||OUT[z]||z==='water'||z==='cellar'||z==='dungeon'||G.d.finale)continue;
    const rad=Math.min(w,h)*T*.32;
    c.fillStyle='rgba(0,0,0,.22)';circ(c,cx,cy,rad);c.fill();
    c.strokeStyle=s.ac;c.globalAlpha=.32;c.lineWidth=2;circ(c,cx,cy,rad-2);c.stroke();c.lineWidth=1;circ(c,cx,cy,rad-6);c.stroke();
    for(let i=0;i<16;i++){const a=i/16*6.283;c.beginPath();c.moveTo(cx+Math.cos(a)*(rad-6),cy+Math.sin(a)*(rad-6));c.lineTo(cx+Math.cos(a)*(rad-2),cy+Math.sin(a)*(rad-2));c.stroke();}
    emblem(c,s.em,cx,cy,rad*.55,s.ac,'#000');c.globalAlpha=1;
  }
  arenaBake(c);
  // ambient occlusion: inner corners and around pillars
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){
    if(isW(x,y))continue;
    const n=isW(x,y-1),w=isW(x-1,y),e=isW(x+1,y);
    for(const [a,b,ox,oy] of[[n,w,0,0],[n,e,T,0]]){if(!a||!b)continue;const g=c.createRadialGradient(x*T+ox,y*T+oy,0,x*T+ox,y*T+oy,T*.8);g.addColorStop(0,'rgba(0,0,0,.4)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x*T,y*T,T,T);}
    if(isW(x,y+1)&&!isW(x,y+2)&&y+2<gh){ // freestanding pillar or wall stub south of us: contact shadow
      const g=c.createLinearGradient(0,y*T+T,0,y*T+T-8);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x*T,y*T+T-8,T,8);}
  }
  story(c);
}
/* ---------- boss arenas ---------- */
function arenaInfo(){
  const L=LEVELS.indexOf(G.d);
  if(G.d.bellAt&&L===3)return{kind:'bell',x:G.d.bellAt[0]*T+16,y:G.d.bellAt[1]*T+16,R:3.4*T,braz:[[14.6,1.7],[23.4,1.7],[14.6,9.4],[23.4,9.4]]};
  if(G.d.finale)return{kind:'candle',x:12.5*T,y:7.5*T,R:2.6*T,braz:[[10.5,4.4],[14.5,4.4]]};
  return null;
}
function arenaBake(c){
  const A=arenaInfo();if(!A)return;
  if(A.kind==='bell'){ // the Warden's hall: flagstones laid in rings around the great bell, a bell-glyph in the floor
    for(let i=4;i>=1;i--){c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1.6;circ(c,A.x,A.y,i*T*.95);c.stroke();c.strokeStyle='rgba(200,190,255,.07)';c.lineWidth=1;circ(c,A.x,A.y,i*T*.95-1.5);c.stroke();}
    for(let i=0;i<12;i++){const a=i/12*6.283;c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1.2;c.beginPath();c.moveTo(A.x+Math.cos(a)*T*.95,A.y+Math.sin(a)*T*.95);c.lineTo(A.x+Math.cos(a)*T*3.8,A.y+Math.sin(a)*T*3.8);c.stroke();}
    c.strokeStyle='rgba(185,156,255,.28)';c.lineWidth=2;circ(c,A.x,A.y,A.R);c.stroke();c.lineWidth=1;circ(c,A.x,A.y,A.R-7);c.stroke();
    for(let i=0;i<8;i++){const a=i/8*6.283+.2;c.save();c.translate(A.x+Math.cos(a)*(A.R-3.5),A.y+Math.sin(a)*(A.R-3.5));c.rotate(a+1.57);emblem(c,'bell',0,0,3.2,'rgba(185,156,255,.4)','#000');c.restore();}
    // the bell-pit under the frame
    c.fillStyle='rgba(0,0,0,.35)';ell(c,A.x,A.y+4,30,14);c.fill();
    for(const [bx,by] of A.braz)brazierBase(c,bx*T,by*T);
  } else { // the Candlemaker's throne room: wax-flooded floor, a runner to the dais, spokes to the five candles
    const r=mulberry(66);
    for(let i=0;i<60;i++){c.fillStyle='rgba(240,228,200,'+(.08+r()*.12)+')';ell(c,T+r()*22*T,T+r()*12*T,2+r()*7,1.5+r()*4,r()*3);c.fill();}
    // runner from the throne alcove to the circle
    const rx=11*T+4,rw=3*T-8;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(rx+2,T*1+2,rw,5*T);
    c.fillStyle='#4a1a14';c.fillRect(rx,T*1,rw,5*T);c.strokeStyle='rgba(255,210,122,.5)';c.lineWidth=1.4;c.strokeRect(rx+3,T+3,rw-6,5*T-6);
    c.fillStyle='rgba(0,0,0,.4)';for(let i=0;i<4;i++)c.fillRect(rx,T*1.3+i*T*.6,rw,1.2);
    // dais steps inside the alcove
    for(let i=0;i<3;i++){c.fillStyle=i%2?'rgba(255,210,122,.08)':'rgba(0,0,0,.2)';c.fillRect(11*T,T+i*6,3*T,6);}
    // spokes towards the candles
    for(const it of G.items){if(it.type!=='C')continue;c.strokeStyle='rgba(255,200,110,.16)';c.lineWidth=3;c.beginPath();c.moveTo(A.x,A.y);c.lineTo(it.x,it.y);c.stroke();c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=1;c.stroke();}
    for(const [bx,by] of A.braz)brazierBase(c,bx*T,by*T);
  }
}
function brazierBase(c,x,y){
  c.fillStyle='rgba(0,0,0,.35)';ell(c,x+2,y+6,9,4);c.fill();
  c.fillStyle='#1c1410';c.beginPath();c.moveTo(x-4,y+6);c.lineTo(x-2,y-2);c.lineTo(x+2,y-2);c.lineTo(x+4,y+6);c.fill();
  c.fillStyle='#3a2a1c';ell(c,x,y-3,7,3);c.fill();c.fillStyle='#120a06';ell(c,x,y-3.6,5.4,2);c.fill();
}
/* per-frame: arena glow reacting to the fight, braziers, water glints */
function boss(){return G.boss||(G.guards||[]).find(g=>g.boss);}
function drawDyn(){
  if(!G||G.flight)return;
  const c=ctx,t=G.time,A=arenaInfo();
  if(A){
    const B=boss(),vr=viewRect();
    if(A.x>vr.x-A.R*2&&A.x<vr.x+vr.w+A.R*2&&A.y>vr.y-A.R*2&&A.y<vr.y+vr.h+A.R*2){
      const eng=B&&B.eng&&!B.dead,dead=!B||B.dead,p2=B&&B.p2,p3=B&&B.p3;
      c.globalCompositeOperation='lighter';
      if(A.kind==='bell'){
        const toll=B&&B.st==='toll'?1:0,pulse=eng?(.35+.25*Math.sin(t*(p2?7:3.5))+toll*.4):dead?.08:.15;
        const col=p2?'255,110,70':'185,156,255';
        c.strokeStyle='rgba('+col+','+(pulse*.6).toFixed(3)+')';c.lineWidth=2.4;circ(c,A.x,A.y,A.R);c.stroke();
        if(eng){const k=(t*.6)%1;c.strokeStyle='rgba('+col+','+((1-k)*.3).toFixed(3)+')';c.lineWidth=1.5;circ(c,A.x,A.y,A.R*(.3+k*.8));c.stroke();}
        if(p2){c.strokeStyle='rgba(255,120,60,'+(.35+.2*Math.sin(t*9)).toFixed(3)+')';c.lineWidth=1.4;c.beginPath();
          for(let i=0;i<5;i++){const a=i*1.256+.4;c.moveTo(A.x+Math.cos(a)*12,A.y+Math.sin(a)*12);c.lineTo(A.x+Math.cos(a+.15)*A.R*.6,A.y+Math.sin(a+.15)*A.R*.6);c.lineTo(A.x+Math.cos(a-.05)*A.R*.95,A.y+Math.sin(a-.05)*A.R*.95);}c.stroke();}
      } else {
        const lit=G.candlesLit||0,col=p3?'255,80,50':p2?'255,140,60':'255,200,110',a=dead?.05:(.12+lit*.06+(eng?.08*Math.sin(t*4):0));
        c.strokeStyle='rgba('+col+','+a.toFixed(3)+')';c.lineWidth=3;circ(c,A.x,A.y,78);c.stroke();circ(c,A.x,A.y,66);c.stroke();
        for(const it of G.items){if(it.type!=='C'||it.done)continue;c.strokeStyle='rgba('+col+','+(.18+.08*Math.sin(t*3+it.x)).toFixed(3)+')';c.lineWidth=2;c.beginPath();c.moveTo(A.x,A.y);c.lineTo(it.x,it.y);c.stroke();}
      }
      c.globalCompositeOperation='source-over';
      for(const [bx,by] of A.braz)flame(c,bx*T,by*T-5,dead?.25:eng?(p2?1.5:1.15):.8,A.kind==='bell'?(p2?'255,120,60':'180,160,255'):(p2||p3?'255,90,40':'255,190,90'),t);
    }
  }
  // water glints in flooded halls
  if(Q.tier<2){
    const vr=viewRect(),x0=Math.max(0,Math.floor(vr.x/T)),x1=Math.min(G.gw-1,Math.ceil((vr.x+vr.w)/T)),y0=Math.max(0,Math.floor(vr.y/T)),y1=Math.min(G.gh-1,Math.ceil((vr.y+vr.h)/T));
    let n=0;
    for(let y=y0;y<=y1&&n<14;y++)for(let x=x0;x<=x1&&n<14;x++){if(zone(x,y)!=='water')continue;const h=hash(x,y,9),f=(t*.5+h*7)%1;if(f>.5)continue;n++;
      c.fillStyle='rgba(200,235,255,'+(Math.sin(f*6.28)*.45).toFixed(3)+')';const gx=x*T+4+h*24,gy=y*T+((h*7)%1<.5?6:26);c.fillRect(gx-2.5,gy,5,.8);}
  }
}
function flame(c,x,y,k,col,t){
  const f=1+Math.sin(t*11+x)*.12+Math.sin(t*23+y)*.08;
  c.globalCompositeOperation='lighter';
  c.drawImage(glowSprite(col),x-14*k,y-16*k,28*k,28*k);
  c.fillStyle='rgba('+col+',.85)';c.beginPath();c.moveTo(x-3.5*k,y);c.quadraticCurveTo(x-3*k,y-6*k*f,x,y-10*k*f);c.quadraticCurveTo(x+3*k,y-6*k*f,x+3.5*k,y);c.closePath();c.fill();
  c.fillStyle='rgba(255,250,220,.8)';ell(c,x,y-2*k,1.4*k,2.6*k*f);c.fill();
  c.globalCompositeOperation='source-over';
}
/* lights: courts get moonlight, arenas their braziers */
function lights(add){
  if(!G||G.flight)return;
  const A=arenaInfo();
  if(A){const B=boss(),dead=!B||B.dead,p2=B&&B.p2;for(const [bx,by] of A.braz)add(bx*T,by*T,dead?40:p2?110:90,.85,A.kind==='bell'?(p2?'255,120,60':'170,150,255'):'255,170,80',.6);}
  if(!G.zl){G.zl=[];for(const [z,x0,y0,x1,y1] of (G.d.hub?[]:(ZONES[LEVELS.indexOf(G.d)]||[])))if(OUT[z]){ // one broad pool of sky-light per open-air zone
    const w=(x1-x0+1)*T,h=(y1-y0+1)*T;G.zl.push([(x0*T+x1*T+T)/2,(y0*T+y1*T+T)/2,Math.max(w,h)*.62,z]);}}
  for(const [x,y,r,z] of G.zl)add(x,y,r,z==='yard'?.5:.6,z==='court'?'170,190,255':'160,170,220',.2);
}

/* ---------- foreground occluders: arches over doorways, overhead work per house ---------- */
function fg(c){
  if(G.flight)return;
  const s=st(),k=key(),gw=G.gw,gh=G.gh,p=themePal(),r=mulberry(919+lvl);
  for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){
    if(G.grid[y][x]!=='.')continue;
    const px=x*T,py=y*T;
    if(isW(x-1,y)&&isW(x+1,y)&&!isW(x,y-1)&&!isW(x,y+1))arch(c,s.arch,px,py,p,s);
  }
  // overhead: Kest pipes, Dunmoor garlands, Sable bell-ropes, Marrow cages, Hallow candle wheels, courts' boughs
  for(const R of G.rooms||[]){
    const w=R.x1-R.x0+1,h=R.y1-R.y0+1,z=zone(R.x0,R.y0);if(w<4)continue;
    if(OUT[z]&&z==='court'){for(let i=0;i<3;i++){const ex=(r()<.5?R.x0:R.x1+1)*T,ey=(R.y0+r()*h)*T;bough(c,ex,ey,r);}continue;}
    if(OUT[z])continue;
    if(k==='kest'&&h>=3){const yy=(R.y0+1)*T+8;c.fillStyle='rgba(0,0,0,.25)';c.fillRect(R.x0*T,yy+10,w*T,6);
      const pg=c.createLinearGradient(0,yy,0,yy+7);pg.addColorStop(0,'#5a4a46');pg.addColorStop(.5,'#2a201e');pg.addColorStop(1,'#140c0a');c.fillStyle=pg;c.fillRect(R.x0*T,yy,w*T,7);
      c.fillStyle='#0e0807';for(let xx=R.x0*T+20;xx<(R.x1+1)*T;xx+=48){c.fillRect(xx,yy-1.5,4,10);}}
    else if(k==='dunmoor'&&z==='ball'){for(let j=0;j<2;j++){const yy=(R.y0+2+j*5)*T;c.strokeStyle='rgba(215,226,255,.4)';c.lineWidth=1;c.beginPath();c.moveTo(R.x0*T,yy);for(let i=0;i<w;i+=2)c.quadraticCurveTo((R.x0+i+1)*T,yy+16,(R.x0+i+2)*T,yy);c.stroke();
      for(let i=0;i<w*2;i++){c.fillStyle=['#e8b8c8','#b8c8ff','#ffe2a0'][i%3];const xx=(R.x0+i*.5+.25)*T;ell(c,xx,yy+8-Math.abs(((i%4)-1.5))*3,1.8,2.6);c.fill();}}}
    else if(k==='marrow'&&R.n>40){const xx=(R.x0+2)*T+16,yy=(R.y0+1)*T;c.strokeStyle='#1a161c';c.lineWidth=1.4;c.beginPath();c.moveTo(xx,yy-T);c.lineTo(xx,yy+6);c.stroke();
      c.strokeStyle='rgba(30,26,34,.9)';c.lineWidth=1.6;rr(c,xx-7,yy+6,14,18,6);c.stroke();for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(xx+i*4,yy+6);c.lineTo(xx+i*4,yy+24);c.stroke();}
      c.fillStyle='rgba(220,215,200,.7)';ell(c,xx,yy+20,2.6,2);c.fill();}
    else if(k==='hallow'&&R.n>100){for(const [wx,wy] of[[6,4],[18,4],[6,11],[18,11]])wheel(c,wx*T+16,wy*T,r);}
  }
}
function arch(c,kind,px,py,p,s){
  const wt=p.wt,w=p.w;
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(px,py+10,T,10);
  if(kind==='lancet'||kind==='round'||kind==='marble'){
    const pt=kind==='lancet',col=kind==='marble'?mix(wt,'#eef2fa',.45):mul(wt,1.05);
    c.fillStyle=col;c.beginPath();c.moveTo(px-3,py-2);c.lineTo(px+T+3,py-2);c.lineTo(px+T+3,py+14);c.lineTo(px+T-1,py+14);
    if(pt){c.quadraticCurveTo(px+T-2,py+4,px+T/2,py+2);c.quadraticCurveTo(px+2,py+4,px+1,py+14);}else c.arc(px+T/2,py+14,T/2-1,0,Math.PI,true);
    c.lineTo(px-3,py+14);c.closePath();c.fill();
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;for(let i=1;i<6;i++){const a=Math.PI+i/6*Math.PI;c.beginPath();c.moveTo(px+T/2+Math.cos(a)*(T/2-1),py+14+Math.sin(a)*(T/2-1));c.lineTo(px+T/2+Math.cos(a)*(T/2+3),py+14+Math.sin(a)*(T/2+3));c.stroke();}
    c.fillStyle='rgba(255,255,255,.14)';c.fillRect(px-3,py-2,T+6,1.5);
    c.fillStyle=mul(col,1.15);c.beginPath();c.moveTo(px+T/2-4,py-2);c.lineTo(px+T/2+4,py-2);c.lineTo(px+T/2+3,py+5);c.lineTo(px+T/2-3,py+5);c.fill();
    if(kind==='marble')emblem(c,'mask',px+T/2,py+1,3.4,'rgba(60,80,120,.8)','#fff');
  } else if(kind==='gilt'){
    c.fillStyle='#2a160c';c.fillRect(px-3,py-1,T+6,9);c.fillStyle='#e0b040';c.fillRect(px-3,py+6,T+6,1.4);c.fillRect(px-3,py-1,T+6,1);emblem(c,'scales',px+T/2,py+3,3.2,'#e0b040','#2a160c');
  } else if(kind==='girder'){
    c.fillStyle='#120c0b';c.fillRect(px-4,py-1,T+8,9);c.fillStyle='#3a3032';c.fillRect(px-4,py+1,T+8,4);c.fillStyle='#0a0606';for(let i=0;i<5;i++){circ(c,px-1+i*8.5,py+3,1);c.fill();}
    c.strokeStyle='#1a1414';c.lineWidth=1.4;for(let k=0;k<3;k++){c.beginPath();ell(c,px+T-6,py+10+k*4.4,1.4,2.2);c.stroke();}c.fillStyle='#3a3032';c.fillRect(px+T-8,py+22,4,3);
  } else if(kind==='timber'){
    c.fillStyle='#24160c';c.fillRect(px-4,py-1,T+8,8);c.fillStyle='rgba(255,220,170,.12)';c.fillRect(px-4,py-1,T+8,1);c.strokeStyle='#24160c';c.lineWidth=2.4;c.beginPath();c.moveTo(px,py+7);c.lineTo(px+6,py+1);c.moveTo(px+T,py+7);c.lineTo(px+T-6,py+1);c.stroke();
  }
  const sg=c.createLinearGradient(0,py+14,0,py+24);sg.addColorStop(0,'rgba(0,0,0,.3)');sg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sg;c.fillRect(px,py+14,T,10);
}
function bough(c,x,y,r){ // leafy overhang from beyond a garden wall
  c.fillStyle='rgba(0,0,0,.28)';for(let i=0;i<6;i++){ell(c,x+(r()-.5)*40+6,y+(r()-.5)*30+10,9+r()*8,7+r()*6,r()*3);c.fill();}
  for(let i=0;i<7;i++){c.fillStyle=['#0e1c14','#14281a','#1c3422'][i%3];ell(c,x+(r()-.5)*36,y+(r()-.5)*28,8+r()*8,6+r()*6,r()*3);c.fill();}
  c.fillStyle='rgba(170,200,255,.12)';for(let i=0;i<4;i++){ell(c,x+(r()-.5)*30-3,y+(r()-.5)*22-3,4,2.4,r());c.fill();}
}
function wheel(c,x,y,r){
  c.strokeStyle='rgba(30,22,14,.9)';c.lineWidth=1;c.beginPath();c.moveTo(x,y-T);c.lineTo(x,y);c.stroke();
  c.strokeStyle='#2a1e10';c.lineWidth=2;circ(c,x,y+4,10);c.stroke();
  for(let i=0;i<6;i++){const a=i/6*6.283,cx=x+Math.cos(a)*10,cy=y+4+Math.sin(a)*10*.5;c.fillStyle='#efe2c8';c.fillRect(cx-1,cy-5,2,5);if(i<5){c.fillStyle='rgba(255,200,110,.9)';ell(c,cx,cy-6.5,1,1.8);c.fill();}}
}

/* ---------- parallax skyline behind the level, one strip per house ---------- */
const SKY={};
function skyline(W,H){
  const k=key(),id=k+'|'+Math.round(W)+'|'+Math.round(H);if(SKY.id===id)return SKY.cv;
  const cv=document.createElement('canvas'),w=Math.ceil(W*1.5),h=Math.ceil(H*.42);cv.width=w;cv.height=h;const g=cv.getContext('2d'),r=mulberry(k.length*71+3);
  const s=HS[k]||HS.marrow,dark='#07050c',win='rgba('+s.warm+',';
  g.fillStyle=dark;
  const base=h;let x=0;
  while(x<w){
    let bw=30+r()*70,bh=h*(.25+r()*.45);
    if(k==='marrow'){ // keep towers with merlons
      g.fillRect(x,base-bh,bw,bh);for(let m=0;m<bw;m+=10)g.fillRect(x+m,base-bh-6,6,6);
      if(r()<.4){g.fillRect(x+bw*.3,base-bh-h*.15,bw*.4,h*.15);}
    } else if(k==='grell'){ // gabled townhouses and chimneys
      bw=24+r()*30;g.beginPath();g.moveTo(x,base);g.lineTo(x,base-bh*.7);g.lineTo(x+bw/2,base-bh*.7-bw*.5);g.lineTo(x+bw,base-bh*.7);g.lineTo(x+bw,base);g.fill();g.fillRect(x+bw*.7,base-bh*.7-bw*.5,4,bw*.4);
    } else if(k==='sable'){ // abbey roofs and a bell tower with a spire
      if(r()<.25){g.fillRect(x,base-bh*1.4,bw*.4,bh*1.4);g.beginPath();g.moveTo(x-3,base-bh*1.4);g.lineTo(x+bw*.2,base-bh*1.4-h*.25);g.lineTo(x+bw*.4+3,base-bh*1.4);g.fill();
        g.fillStyle=win+'.35)';g.beginPath();g.arc(x+bw*.2,base-bh*1.2,3,Math.PI,0);g.fill();g.fillRect(x+bw*.2-3,base-bh*1.2,6,5);g.fillStyle=dark;}
      else{g.beginPath();g.moveTo(x,base);g.lineTo(x,base-bh*.6);g.lineTo(x+bw/2,base-bh*.9);g.lineTo(x+bw,base-bh*.6);g.lineTo(x+bw,base);g.fill();}
    } else if(k==='kest'){ // foundry sheds and smokestacks
      g.fillRect(x,base-bh*.5,bw,bh*.5);if(r()<.6){g.fillRect(x+bw*.6,base-bh*1.3,7,bh*.8);g.fillStyle='rgba(255,120,40,.35)';g.fillRect(x+bw*.6,base-bh*1.3,7,2);g.fillStyle=dark;}
      for(let i=0;i<bw-10;i+=12){g.beginPath();g.moveTo(x+i,base-bh*.5);g.lineTo(x+i+12,base-bh*.5-8);g.lineTo(x+i+12,base-bh*.5);g.fill();}
    } else if(k==='dunmoor'){ // manor domes and weeping willows over the marsh
      if(r()<.4){g.fillRect(x,base-bh*.6,bw,bh*.6);g.beginPath();g.arc(x+bw/2,base-bh*.6,bw*.3,Math.PI,0);g.fill();g.fillRect(x+bw/2-1,base-bh*.6-bw*.3-8,2,8);}
      else{g.beginPath();g.ellipse(x+bw/2,base-bh*.5,bw*.45,bh*.35,0,0,6.283);g.fill();g.strokeStyle=dark;g.lineWidth=1;for(let i=0;i<8;i++){g.beginPath();g.moveTo(x+bw*.1+i*bw*.1,base-bh*.5);g.lineTo(x+bw*.1+i*bw*.1+2,base-bh*.1);g.stroke();}}
    } else if(k==='hallow'){ // a broken cathedral crown
      g.fillRect(x,base-bh,bw*.25,bh);g.beginPath();g.moveTo(x+bw*.25,base-bh*.4);g.lineTo(x+bw*.5,base-bh*.7);g.lineTo(x+bw*.7,base-bh*.45);g.lineTo(x+bw,base-bh*.8);g.lineTo(x+bw,base);g.lineTo(x+bw*.25,base);g.fill();
    } else { // the Rookery: roofs and a crooked tower full of nesting birds
      g.beginPath();g.moveTo(x,base);g.lineTo(x,base-bh*.5);g.lineTo(x+bw*.5,base-bh*.8);g.lineTo(x+bw,base-bh*.5);g.lineTo(x+bw,base);g.fill();
    }
    // lit windows
    if(k!=='hallow'){g.fillStyle=win+(k==='kest'?'.55)':'.45)');for(let i=0;i<3;i++)if(r()<.5)g.fillRect(x+5+r()*(bw-12),base-bh*(.2+r()*.3),2.4,3.4);g.fillStyle=dark;}
    else{g.fillStyle='rgba(255,200,110,.5)';for(let i=0;i<2;i++)if(r()<.5)g.fillRect(x+3+r()*bw*.18,base-bh*(.3+r()*.5),2,4);g.fillStyle=dark;}
    x+=bw+r()*14;
  }
  SKY.id=id;SKY.cv=cv;return cv;
}
function backdrop(){
  if(!G||G.flight||Q.tier>=3)return;
  const c=ctx,W=V.w,H=V.h,cv=skyline(W,H),px=-(V.cx-V.ww/2)*V.sc*.25,hz=H*((G.d.th.bg==='sea')?.5:.7);
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  const w=cv.width,ox=((px%w)+w)%w-w;
  c.globalAlpha=.92;c.drawImage(cv,ox,hz+H*.16-cv.height);c.drawImage(cv,ox+w,hz+H*.16-cv.height);c.globalAlpha=1;
  c.fillStyle='#07050c';c.fillRect(0,hz+H*.16-1,W,H);
}

/* ---------- hooks into world.js (wrapped, never replaced) ---------- */
(function(){
  if(typeof drawBackdrop==='function'){const ob=drawBackdrop;drawBackdrop=function(){ob();try{backdrop();}catch(e){}};}
  if(typeof drawBeams==='function'){const odb=drawBeams;let warned=false;drawBeams=function(){odb();try{drawDyn();}catch(e){if(!warned){warned=true;console.error('tiles',e);}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}};}
})();

return{floor,wall,bakeZones,buildZones,zone,fg,lights,emblem,bannerSprite,arenaInfo,style:st,key,HS,ZONES,stats:()=>({cached:cache.size,made})};
})();
window.TILES=TILES;
