'use strict';
/* EMBERCROWN - DOM UI: menus, overlays, touch controls, mouse input. */
const SIGIL={
  marrow:'<path d="M32 10c-11 0-18 8-18 17 0 6 3 10 7 12v7h8v-4h6v4h8v-7c4-2 7-6 7-12 0-9-7-17-18-17z"/><circle cx="25" cy="28" r="4" class="cut"/><circle cx="39" cy="28" r="4" class="cut"/><path class="cut" d="M32 33l-3 6h6z"/>',
  grell:'<path d="M10 44l4-24 12 12 6-16 6 16 12-12 4 24z"/><rect x="10" y="47" width="44" height="6" rx="2"/><circle cx="32" cy="36" r="4" class="cut"/>',
  ostrander:'<path d="M32 8c-9 0-14 8-14 18 0 6-2 10-5 14h38c-3-4-5-8-5-14 0-10-5-18-14-18z"/><circle cx="32" cy="46" r="4"/><path class="cut" d="M6 54q6-5 13 0t13 0 13 0 13 0" fill="none" stroke-width="3"/>',
  sable:'<path d="M42 10a22 22 0 1 0 0 44 18 18 0 1 1 0-44z"/><circle cx="46" cy="22" r="3"/><circle cx="52" cy="34" r="2"/>',
  kest:'<path d="M8 22h38c0 8 6 10 10 10v6H14v-6c4 0 8-2 8-6H8z"/><rect x="20" y="40" width="26" height="6"/><rect x="14" y="46" width="38" height="8" rx="2"/>',
  dunmoor:'<path d="M6 26c6-8 16-8 22 0 4-3 8-3 12 0 6-8 16-8 22 0-2 12-10 18-18 14-4-2-6-6-10-6s-6 4-10 6c-8 4-16-2-18-14z"/><ellipse cx="20" cy="30" rx="5" ry="3" class="cut"/><ellipse cx="44" cy="30" rx="5" ry="3" class="cut"/>',
  hallow:'<rect x="26" y="26" width="12" height="28" rx="2"/><path d="M32 6c6 8 8 12 6 16-1 3-3 4-6 4s-5-1-6-4c-2-4 0-8 6-16z"/><rect x="20" y="52" width="24" height="5" rx="2"/>'
};
function sigil(name,col){return'<svg class="sigil" viewBox="0 0 64 64" fill="'+(col||'currentColor')+'">'+(SIGIL[name]||'')+'</svg>';}
const RICON={
  boots:'<path d="M18 12h14v22l16 6c4 2 4 8 0 8H16c-3 0-4-2-4-5z"/>',
  purse:'<path d="M24 14h16l-4 8c10 4 14 12 12 20-1 5-6 8-16 8s-15-3-16-8c-2-8 2-16 12-20z"/><rect x="22" y="12" width="20" height="4" rx="2"/>',
  lens:'<circle cx="28" cy="28" r="14" fill="none" stroke="currentColor" stroke-width="5"/><path d="M38 38l14 14" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
  cowl:'<path d="M32 8c-12 0-18 10-18 22v22h36V30C50 18 44 8 32 8z"/><ellipse cx="32" cy="30" rx="8" ry="10" class="cut"/>',
  ember:'<path d="M32 6c4 10 14 16 14 30 0 10-6 18-14 18s-14-8-14-18c0-8 4-10 6-16 2 4 4 5 6 6-2-8-1-14 2-20z"/>',
  mask:'<path d="M8 22c8-6 16-6 24 0 8-6 16-6 24 0-2 16-10 28-24 28S10 38 8 22z"/><ellipse cx="22" cy="28" rx="6" ry="3.5" class="cut"/><ellipse cx="42" cy="28" rx="6" ry="3.5" class="cut"/>',
  candle:'<rect x="26" y="28" width="12" height="26" rx="2"/><path d="M32 6c5 7 7 11 5 14-1 3-3 4-5 4s-4-1-5-4c-2-3 0-7 5-14z"/>'
};
function ricon(name){return'<svg class="ricon" viewBox="0 0 64 64" fill="currentColor">'+(RICON[name]||'')+'</svg>';}
const RELIC_KEYS=['boots','purse','stormglass','cowl','forgeheart','mask','stub'];
const TIPS=[
 'Sneak (Shift) shrinks how far guards can see you. Hold still in the dark.',
 'Whisper bells pull guards away from a route. Smoke blocks their sight entirely.',
 'Hounds smell you at close range even from behind. Keep a wall between you.',
 'Shielded brutes shrug off fire from the front. Circle behind them, or use a barrel.',
 'Oil barrels explode when Ashling breathes fire on them. Stun a whole patrol at once, but it is loud.',
 'Cracked walls hide secrets. Burn them, or point Ashling at them and Dash.',
 'Archers see far, but through a narrow cone. Approach from the side.',
 'When a guard loses you they go to look. Break line of sight and move away quietly.',
 'The idle partner counts as curled up: much harder to spot. Swap before you scout.'
];
const DOWNQ=[['Wren: Ow.','Ashling: That is your plan? Getting hit?'],['Wren: I had it under control.','Ashling: You were on the floor.'],['Ashling: Dodge. The word is dodge.','Wren: I know the word.']];
const CTIPS=[
 'Telegraphs glow red before every big attack. Dash (Ashling) or roll (Wren, double-tap Shift or press C) through them: you are invulnerable while rolling.',
 'Enemies stagger after a heavy attack. That is your opening: hit them hard while they are dazed.',
 'Hold fire on a Cinderling and it never gets to lunge. Wisps die to a single dash.',
 'Smoke breaks line of sight, so foes lose track of you. A thrown bell pulls them away.',
 'Hollow Husks block most damage from the front. Slip behind them, or wait for the slam recovery.',
 'Spend cinders at the Ember Forge: extra hearts and Ember Nova make fights far easier.'];
const QUIPS=[['Wren: ...that went poorly.','Ashling: I said nothing. Loudly.'],['Wren: They saw the dragon.','Ashling: They saw a very small, very menacing dragon.'],['Wren: Again?','Ashling: I had a plan. It involved less running.']];

const UI=(()=>{
  const root=document.getElementById('ui');
  let modal=null,confirmNew=false,confirmQuit=false,loseTimer=null;
  const $=(s,r)=>(r||document).querySelector(s);
  const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  const btn=(label,act,cls,extra)=>'<button type="button" tabindex="-1" class="btn '+(cls||'')+'" data-a="'+act+'" '+(extra||'')+'>'+label+'</button>';
  function clear(){root.innerHTML='';modal=null;}
  function screen(cls,html){
    if(loseTimer&&cls.indexOf('lose')<0){clearTimeout(loseTimer);loseTimer=null;}
    root.innerHTML='<div class="screen '+cls+'">'+html+'</div>';
    const s=root.firstChild;s.addEventListener('click',onClick);
    return s;
  }
  function onClick(e){
    const b=e.target.closest('[data-a]');if(!b||b.disabled)return;
    Aud.init();b.blur();
    if(b.dataset.a.startsWith('buy:')){if(buyTalent(b.dataset.a.slice(4))){const m=modal;if(m)m.firstChild.innerHTML=forgeHTML();}else Aud.S.back();return;}
    act(b.dataset.a,b);
  }
  function diffChips(){return DIFFS.map((d,i)=>'<button type="button" tabindex="-1" class="chip'+(i===diff?' on':'')+'" data-a="diff'+i+'"><b>'+(i+1)+'</b> '+d.name+'</button>').join('');}
  function act(a,b){
    Aud.S.click();
    if(a.startsWith('diff')){diff=+a.slice(4);writeDiffOnly();show('title');return;}
    switch(a){
      case'new':if(saved&&!confirmNew){confirmNew=true;show('title');return;}confirmNew=false;newGame();break;
      case'continue':continueGame();break;
      case'begin':startPlay();break;
      case'retry':startPlay();break;
      case'next':continueFromWin();break;
      case'title':if(mode==='pause'&&!confirmQuit){confirmQuit=true;show('pause');return;}confirmQuit=false;toTitle();break;
      case'resume':pauseGame(false);break;
      case'restart':pauseGame(false);startPlay();break;
      case'how':openModal(howHTML());break;
      case'codex':openModal(codexHTML());break;
      case'close':closeModal();persistRun();if(mode==='brief'||mode==='win')show(mode);break;
      case'forge':openModal(forgeHTML());break;
      case'sfx':settings.sfx=!settings.sfx;Aud.setOpt('sfx',settings.sfx);saveSettings();refresh();break;
      case'music':settings.music=!settings.music;Aud.setOpt('music',settings.music);saveSettings();refresh();break;
      case'minimap':settings.minimap=!settings.minimap;saveSettings();refresh();break;
      case'shake':settings.shake=!settings.shake;saveSettings();refresh();break;
      case'perk1':case'perk2':case'perk3':pickPerk(+a.slice(4));break;
      case'ch1':case'ch2':case'ch3':makeChoice(+a.slice(2));break;
    }
  }
  function writeDiffOnly(){/* difficulty is stored with the run on the next save */}
  function refresh(){ // re-render the current screen to reflect toggles
    if(modal){return;}
    const m=mode;if(m==='title'||m==='pause')show(m);
  }
  function toggles(){
    const t=(k,l)=>'<button type="button" tabindex="-1" class="tog'+(settings[k]?' on':'')+'" data-a="'+k+'"><span>'+l+'</span><i>'+(settings[k]?'On':'Off')+'</i></button>';
    return'<div class="togs">'+t('sfx','Sound effects')+t('music','Music')+t('minimap','Minimap')+t('shake','Screen shake')+'</div>';
  }
  function howHTML(){
    return'<h2>How to play</h2><div class="howgrid">'+
    '<div><h3>Keyboard &amp; mouse</h3><ul>'+
    '<li><kbd>WASD</kbd> / arrows &mdash; move</li><li><kbd>Space</kbd> &mdash; Wren strikes (hit from behind to take a guard down silently); Ashling breathes fire</li>'+
    '<li><kbd>Shift</kbd> &mdash; Wren sneaks (tap twice to roll, or <kbd>C</kbd>); Ashling dashes</li>'+
    '<li><kbd>E</kbd> &mdash; hold to pick, steal, open, examine; Ashling: Ember Nova once learned</li>'+
    '<li>Mouse: left-click strikes / fires toward the cursor; right-click swaps. <kbd>Tab</kbd> swaps too</li>'+
    '<li><kbd>Q</kbd> smoke &nbsp;<kbd>R</kbd> whisper bell &nbsp;<kbd>F</kbd> bone flute &nbsp;<kbd>Z</kbd> hold for a wide view</li>'+
    '<li><kbd>Esc</kbd> pause &nbsp;<kbd>M</kbd> mute &nbsp;<kbd>N</kbd> minimap</li></ul></div>'+
    '<div><h3>Touch</h3><ul><li>Drag the left side to move. Tap the minimap for a wide scouting view.</li><li><b>STRIKE</b> (Wren) / <b>FIRE</b> (Ashling, hold). <b>ACT</b> holds to interact; for Ashling it becomes <b>NOVA</b>.</li>'+
    '<li><b>SNEAK</b> toggles; double-tap it to roll. For Ashling it becomes <b>DASH</b>.</li><li><b>SWAP</b> changes character. Gadget buttons show remaining uses.</li></ul></div>'+
    '<div class="wide"><h3>The goal</h3><p>Stay out of the yellow cones. Do not let Suspicion fill. Burn beacons with Ashling, steal with Wren. Learn enemy attack tells (red telegraphs), dodge with roll or dash, and spend cinders at the Ember Forge between missions. Hunt cracked walls, vault trials, relics and lore.</p></div></div>'+
    btn('Close','close','primary');
  }
  function codexHTML(){
    const rl=RELIC_KEYS.map(k=>{const have=meta.relics.includes(k)||run.relics.includes(k),r=RELICS[k];
      return'<div class="cx '+(have?'':'locked')+'">'+ricon(have?r.icon:'')+'<div><b>'+(have?r.name:'Unknown relic')+'</b><span>'+(have?r.desc:'Hidden behind a cracked wall somewhere.')+'</span></div></div>';}).join('');
    const lore=LORE.map((l,i)=>l.map(s=>{const have=meta.lore.includes(s.t);
      return'<div class="cx lore '+(have?'':'locked')+'"><div><b>'+(have?s.t:'???')+'</b><span>'+(have?s.x:'Found in '+LEVELS[i].name+'.')+'</span></div></div>';}).join('')).join('');
    const disc=meta.disc.length?meta.disc.map(t=>'<div class="cx lore"><div><b>'+t+'</b></div></div>').join(''):'<div class="cx lore locked"><div><b>???</b><span>Examine the glinting bones and notes you find in each level.</span></div></div>';
    return'<h2>Codex</h2><div class="codex"><h3>Relics</h3>'+rl+'<h3>Lore</h3>'+lore+'<h3>Discoveries ('+meta.disc.length+')</h3>'+disc+'</div>'+btn('Close','close','primary');
  }
  function forgeHTML(){
    const col=(br,title)=>'<div class="fcol"><h3>'+title+'</h3>'+TALENTS.filter(t=>t.branch===br).map(t=>{
      const own=hasT(t.id),rq=talentReq(t),locked=!own&&rq&&!hasT(rq),aff=canBuy(t);
      const st=own?'own':locked?'locked':aff?'buy':'poor';
      return'<button type="button" tabindex="-1" class="tal '+st+'" data-a="buy:'+t.id+'"><b>'+t.name+'</b><span>'+t.desc+'</span><i>'+(own?'Learned':locked?'Needs '+TALENTS.find(x=>x.id===rq).name:t.cost+' cinders')+'</i></button>';}).join('')+'</div>';
    return'<h2>The Ember Forge</h2><p class="forgec">'+run.cinders+' cinders</p><div class="forge">'+col('wren','Wren')+col('ash','Ashling')+col('both','Shared')+'</div>'+btn('Close','close','primary');
  }
  function forgeBadge(){return anyAffordable()?' <em class="dot"></em>':'';}
  function openModal(html){
    closeModal();
    const m=document.createElement('div');m.className='modal';m.innerHTML='<div class="card">'+html+'</div>';
    m.addEventListener('click',e=>{if(e.target===m){Aud.S.back();closeModal();}else onClick(e);});
    root.appendChild(m);modal=m;
  }
  function closeModal(){if(modal){modal.remove();modal=null;}}
  function handleKey(k){
    if(modal&&(k==='escape'||k==='enter')){Aud.S.back();closeModal();return true;}
    return !!modal;
  }
  /* ---------- screens ---------- */
  function show(m){
    const S={
      title(){
        const next=saved&&saved.run?saved.run.next:0;
        const cont=saved&&saved.run;
        const label=cont?(saved.run.stage==='court'?'Whisper Court':'Mission '+(next+1)+': '+LEVELS[next].name):'';
        screen('title','<div class="logo"><div class="crown">'+sigil('hallow')+'</div><h1>EMBERCROWN</h1><p class="tag">A spy. A runt dragon. Seven feuding houses. One engineered war.</p></div>'+
        '<div class="menu">'+(cont?btn('Continue<small>'+label+'</small>','continue','primary big')+btn(confirmNew?'Tap again: erase save':'New Game','new','ghost'):btn('Begin','new','primary big'))+
        '<div class="diffrow"><span>Difficulty</span>'+diffChips()+'</div><p class="blurb">'+DIFFS[diff].blurb+'</p>'+
        '<div class="row">'+btn('How to play','how','ghost small')+btn('Codex','codex','ghost small')+'</div></div>'+
        '<p class="foot">Chapter I &middot; The Hollow Crown &nbsp;&middot;&nbsp; press <kbd>Enter</kbd></p>');
      },
      brief(){
        const d=LEVELS[lvl],R=rep();
        const stand=(R.f+R.e+R.r>0)?'<div class="stand"><b>Standing</b> Favor '+R.f+' &middot; Fear '+R.e+' &middot; Ruin '+R.r+'<br><span>Suspicion fades '+Math.round((R.decay-1)*100)+'% faster &middot; guard sight -'+Math.round((1-R.sight)*100)+'% &middot; alert gain +'+Math.round((R.gain-1)*100)+'% &middot; guards fled '+R.fled+'</span></div>':'';
        let fin='';if(d.finale){const hc=houseCounts();fin='<div class="stand"><span>Favor sends +'+Math.min(3,hc.f)+' whisper bells &middot; Fear stands down '+Math.min(3,hc.e)+' guards &middot; Ruin: he starts at '+(100-8*hc.r)+' HP</span></div>';}
        const rel=run.relics.length?'<div class="relrow">'+run.relics.map(k=>'<span title="'+RELICS[k].name+'">'+ricon(RELICS[k].icon)+'</span>').join('')+'</div>':'';
        screen('brief','<div class="bleft">'+sigil(d.sigil)+'<div class="mnum">Mission '+(lvl+1)+' of '+LEVELS.length+'</div><h2>'+d.name+'</h2><div class="house">'+d.house+'</div>'+rel+'</div>'+
        '<div class="bright"><div class="intro">'+d.intro.map(l=>l?'<p>'+l+'</p>':'<div class="gap"></div>').join('')+'</div>'+stand+fin+btn('Begin mission','begin','primary big')+(run.cinders>0||run.talents.length?btn('Ember Forge'+forgeBadge(),'forge','ghost small'):'')+'<p class="foot">press <kbd>Enter</kbd></p></div>');
      },
      court(){
        screen('court','<h2>The Whisper Court</h2><p class="lead">Before Gallowmere you may turn one servant of House Grell.</p><div class="cards">'+
        '<button type="button" tabindex="-1" class="card3" data-a="perk1"><b>1</b><h3>Bribe the steward</h3><p>One guard sleeps through the feast.</p></button>'+
        '<button type="button" tabindex="-1" class="card3" data-a="perk2"><b>2</b><h3>Blackmail the chamberlain</h3><p>Suspicion fades much faster.</p></button>'+
        '<button type="button" tabindex="-1" class="card3" data-a="perk3"><b>3</b><h3>Taint the wine</h3><p>Guards are drowsy: shorter sight, slower steps.</p></button></div>'+
        '<p class="foot">Every favor has a price. The houses will remember.</p>');
      },
      choice(){
        if(G.d.finale){
          const can=stats.gems>=BREAK_GEMS;
          screen('choice over','<h2 style="color:#f0d080">The Throne of Hallow</h2><p class="lead">The Candlemaker is dead. The throne is yours to decide.</p><div class="cards">'+
          '<button type="button" tabindex="-1" class="card3" data-a="ch1"><b>1</b><h3>Crown a puppet</h3><p>Peace, held by strings.</p></button>'+
          '<button type="button" tabindex="-1" class="card3" data-a="ch2"><b>2</b><h3>Burn it all down</h3><p>Ashling finishes what the war began.</p></button>'+
          '<button type="button" tabindex="-1" class="card3'+(can?'':' locked')+'" data-a="ch3" '+(can?'':'disabled')+'><b>3</b><h3>Break the throne</h3><p>'+(can?'No crown, no more wars.':'Locked: needs '+BREAK_GEMS+' ember gems (you have '+stats.gems+').')+'</p></button></div><p class="foot">There is no taking this back.</p>');
        } else {
          screen('choice over','<h2 style="color:#7fd0ff">Perrin Ostrander</h2><p class="lead">The heir of the Drowned Spire stands at the gate, breathing hard.</p><div class="cards two">'+
          '<button type="button" tabindex="-1" class="card3" data-a="ch1"><b>1</b><h3>Return him to House Ostrander</h3><p>An ally, if a little humbled.</p></button>'+
          '<button type="button" tabindex="-1" class="card3" data-a="ch2"><b>2</b><h3>Hold him as leverage</h3><p>A bribe, and a house that fears you.</p></button></div><p class="foot">Whatever you choose, House Kest will not forget who emptied their cell.</p>');
        }
      },
      win(){
        const tot=G.items.filter(i=>i.type==='g'||i.type==='G').reduce((s,i)=>s+(i.type==='G'?3:1),0);
        const relic=G.gotRelics.length?G.gotRelics.map(k=>'<div class="relcard">'+ricon(RELICS[k].icon)+'<div><b>Relic: '+RELICS[k].name+'</b><span>'+RELICS[k].desc+'</span></div></div>').join(''):'';
        screen('win over','<h2 style="color:#7be08a">Mission Complete</h2><p class="lead">'+G.d.name+' is behind you.</p>'+
        '<div class="rankrow"><div class="rank r'+G.rank+'">'+G.rank+'</div><div class="stats">'+
        '<div><b>'+G.gems+' / '+tot+'</b><span>Ember gems</span></div><div><b>'+fmt(G.time)+'</b><span>Time</span></div>'+
        '<div><b>'+G.secretsFound+' / '+G.secretsTotal+'</b><span>Secrets</span></div><div><b>'+G.st.stuns+'</b><span>Guards stunned</span></div></div></div>'+
        relic+'<div class="outl">'+G.outLines.map(l=>'<p>'+l+'</p>').join('')+'</div>'+
        '<div class="cinrow"><b>+'+(G.reward.loot+G.reward.rank+G.reward.secrets)+' cinders</b><span>loot '+G.reward.loot+' &middot; rank '+G.reward.rank+' &middot; secrets '+G.reward.secrets+'</span></div>'+
        '<p class="small">Total gems: '+stats.gems+' (more gems, longer dragon fire) &middot; Foes defeated: '+(G.st.kills||0)+' &middot; Takedowns: '+(G.st.takedowns||0)+'</p>'+
        '<div class="row">'+btn('Ember Forge'+forgeBadge(),'forge','ghost')+btn('Continue','next','primary big')+'</div><p class="foot">press <kbd>Enter</kbd></p>');
      },
      lose(){
        const down=G&&G.defeat==='down';
        const q=down?DOWNQ[Math.floor(Math.random()*DOWNQ.length)]:QUIPS[Math.floor(Math.random()*QUIPS.length)],tip=(down?CTIPS:TIPS)[Math.floor(Math.random()*(down?CTIPS:TIPS).length)];
        screen('lose over','<h2 style="color:#ff6a5a">'+(down?'OVERWHELMED':'CAUGHT')+'</h2><p class="lead">'+q[0]+'<br>'+q[1]+'</p><p class="tip"><b>Tip.</b> '+tip+'</p>'+
        '<div class="row">'+btn('Retry mission','retry','primary big')+btn('Quit to title','title','ghost')+'</div><p class="foot">press <kbd>Enter</kbd></p>');
      },
      pause(){
        screen('pause over','<h2>Paused</h2><div class="menu">'+btn('Resume','resume','primary big')+btn('Restart mission','restart','ghost')+
        '<div class="row">'+btn('How to play','how','ghost small')+btn('Codex','codex','ghost small')+'</div>'+toggles()+
        btn(confirmQuit?'Tap again: quit to title':'Quit to title','title','ghost small')+'</div>');
      },
      end(){
        const E=G&&G.ending||{title:'Chapter I Complete',lines:[],col:'#f0b44c'};
        const rank=stats.caught===0?'Ghost':stats.caught<3?'Courier':'Loud';
        const hs=Object.keys(houses).map(k=>'<div class="hrow"><b>'+HOUSE_NAMES[k]+'</b><span class="f">'+houses[k].favor+'</span><span class="e">'+houses[k].fear+'</span><span class="r">'+houses[k].ruin+'</span></div>').join('');
        const rels=run.relics.map(k=>'<span class="relchip" title="'+RELICS[k].desc+'">'+ricon(RELICS[k].icon)+RELICS[k].name+'</span>').join('');
        screen('end','<h2 style="color:'+E.col+'">'+E.title+'</h2><div class="endl">'+E.lines.map(l=>'<p>'+l+'</p>').join('')+'</div>'+
        '<div class="stats big"><div><b>'+stats.gems+' / '+TOTAL_GEMS+'</b><span>Ember gems</span></div><div><b>'+stats.caught+'</b><span>Times caught</span></div><div><b>'+fmt(stats.time)+'</b><span>Time</span></div><div><b>'+rank+'</b><span>Rank ('+DIFFS[diff].name+')</span></div></div>'+
        '<div class="houses"><div class="hrow head"><b>House</b><span class="f">Favor</span><span class="e">Fear</span><span class="r">Ruin</span></div>'+hs+'</div>'+
        (rels?'<div class="relchips">'+rels+'</div>':'')+btn('Return to title','title','primary big')+'<p class="foot">press <kbd>Enter</kbd></p>');
      }
    };
    if(S[m])S[m]();
  }
  function onMode(m){
    document.body.dataset.mode=m;
    confirmNew=false;if(m!=='pause')confirmQuit=false;
    if(m==='play'){clear();return;}
    if(m==='lose'){clear();loseTimer=setTimeout(()=>{loseTimer=null;if(mode==='lose')show('lose');},850);return;}
    if(m==='win'){clear();setTimeout(()=>{if(mode==='win')show('win');},500);return;}
    show(m);
  }
  /* ---------- touch controls ---------- */
  const T_={zone:$('#joyzone'),base:$('#joybase'),knob:$('#joyknob'),id:null,ox:0,oy:0,R:54,last:''};
  function bindTouch(){
    const z=T_.zone;
    z.addEventListener('pointerdown',e=>{
      if(T_.id!==null)return;e.preventDefault();Aud.init();
      T_.id=e.pointerId;z.setPointerCapture(e.pointerId);
      const r=z.getBoundingClientRect();
      T_.ox=clamp(e.clientX,r.left+T_.R,r.right-T_.R);T_.oy=clamp(e.clientY,r.top+T_.R,r.bottom-T_.R);
      T_.base.style.left=(T_.ox-r.left)+'px';T_.base.style.top=(T_.oy-r.top)+'px';
      z.classList.add('on');joyMove(e);
    });
    z.addEventListener('pointermove',e=>{if(e.pointerId===T_.id)joyMove(e);});
    const end=e=>{if(e.pointerId!==T_.id)return;T_.id=null;touch.jx=touch.jy=0;T_.knob.style.transform='translate(0,0)';z.classList.remove('on');
      T_.base.style.left='';T_.base.style.top='';};
    z.addEventListener('pointerup',end);z.addEventListener('pointercancel',end);
    document.querySelectorAll('#btns .tb').forEach(b=>{
      const a=b.dataset.act;
      const down=e=>{
        e.preventDefault();Aud.init();
        if(mode!=='play')return;
        if(G&&G.cine){skipCine();return;}
        try{b.setPointerCapture(e.pointerId);}catch(_){}
        b.classList.add('down');
        if(navigator.vibrate)try{navigator.vibrate(8);}catch(_){}
        switch(a){
          case'act':if(G.active==='ash'&&!G.flight)novaPress();else touch.act=true;break;
          case'fire':if(G.active==='wren'&&!G.flight)strikePress();else touch.fire=true;break;
          case'shift':if(G.active==='wren'){touch.sneak=!touch.sneak;if(G.time-(G.lastShift||-9)<.32)rollPress();G.lastShift=G.time;}else dashPress();break;
          case'swap':swapChar();break;case'smoke':useSmoke();break;case'bell':useBell();break;case'flute':useFlute();break;
        }
        tick(true);
      };
      const up=e=>{b.classList.remove('down');if(a==='act')touch.act=false;if(a==='fire')touch.fire=false;};
      b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
      b.addEventListener('contextmenu',e=>e.preventDefault());
    });
    $('#pausebtn').addEventListener('click',()=>{Aud.init();if(mode==='play')pauseGame(true);});
  }
  function joyMove(e){
    let dx=e.clientX-T_.ox,dy=e.clientY-T_.oy;const l=Math.hypot(dx,dy);
    if(l>T_.R){dx*=T_.R/l;dy*=T_.R/l;}
    T_.knob.style.transform='translate('+dx+'px,'+dy+'px)';
    const m=Math.hypot(dx,dy)/T_.R;
    if(m<.2){touch.jx=touch.jy=0;}else{touch.jx=dx/T_.R;touch.jy=dy/T_.R;}
  }
  function tick(force){
    if(mode!=='play'||!G)return;
    const wr=G.active==='wren';
    const st=[wr,G.ash.on,G.flight,G.gad.smoke,G.gad.bell,G.gad.flute,G.dash.ch,G.nova.cd>0,touch.sneak,G.exitOpen,hasT('nova')].join();
    if(!force&&st===T_.last)return;T_.last=st;
    const set=(a,dis,badge,label)=>{
      const b=document.querySelector('#btns [data-act="'+a+'"]');if(!b)return;
      b.classList.toggle('dis',!!dis);
      if(badge!==undefined){const i=b.querySelector('i');if(i)i.textContent=badge;}
      if(label){const s=b.querySelector('span');if(s&&s.textContent!==label)s.textContent=label;}
    };
    const gA=G.ash.on&&!G.flight;
    set('act',G.flight?false:(wr?false:!hasT('nova')||G.nova.cd>0),undefined,wr||G.flight?'ACT':'NOVA');
    set('fire',G.flight?false:(!wr&&!G.ash.on),undefined,wr&&!G.flight?'STRIKE':'FIRE');
    set('swap',!G.ash.on||G.flight);
    set('smoke',!wr||G.gad.smoke<=0||G.flight,G.gad.smoke);
    set('bell',!wr||G.gad.bell<=0||G.flight,G.gad.bell);
    set('flute',!wr||G.gad.flute<=0||G.flight,G.gad.flute>50?'♪':G.gad.flute);
    const sh=document.querySelector('#btns [data-act="shift"]');
    if(sh){sh.querySelector('span').textContent=wr?'SNEAK':'DASH';sh.classList.toggle('dis',!wr&&G.dash.ch<=0);sh.classList.toggle('latched',wr&&touch.sneak);}
    document.querySelectorAll('#btns .gad').forEach(g=>g.style.display=G.flight?'none':'');
  }
  /* ---------- mouse on canvas ---------- */
  function bindMouse(){
    cv.addEventListener('contextmenu',e=>e.preventDefault());
    cv.addEventListener('pointermove',e=>{
      if(e.pointerType!=='mouse')return;
      const r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;mouse.used=true;
      if(G)mouse.world=screenToWorld(mouse.x,mouse.y);
      cv.style.cursor=(mode==='play'&&HIT.some(h=>mouse.x>=h.x&&mouse.x<=h.x+h.w&&mouse.y>=h.y&&mouse.y<=h.y+h.h))?'pointer':(mode==='play'?'crosshair':'default');
    });
    cv.addEventListener('pointerdown',e=>{
      Aud.init();
      if(mode!=='play')return;
      if(G&&G.cine){skipCine();return;}
      const r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;
      if(G)mouse.world=screenToWorld(mouse.x,mouse.y);
      if(e.pointerType!=='mouse')return;
      for(const h of HIT)if(mouse.x>=h.x&&mouse.x<=h.x+h.w&&mouse.y>=h.y&&mouse.y<=h.y+h.h){Aud.S.click();h.fn();return;}
      if(e.button===2){swapChar();return;}
      if(e.button===0){
        if(G.active==='wren'&&!G.prompt){mouse.world=screenToWorld(mouse.x,mouse.y);strikePress();return;}
        mouse.down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}
      }
    });
    const up=()=>{mouse.down=false;};
    cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    addEventListener('pointerup',up);
  }
  function init(){
    bindTouch();bindMouse();
    // show touch controls on first touch even on hybrid devices
    addEventListener('touchstart',()=>{if(!touch.on){touch.on=true;document.body.classList.add('touch');layout();}},{passive:true,once:true});
    if(matchMedia('(pointer:coarse)').matches){touch.on=true;document.body.classList.add('touch');}
  }
  return{init,onMode,refresh,tick,handleKey,show};
})();
