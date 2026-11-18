/* EMBERCROWN - the trailer before the game.
   On a player's first visit the trailer (docs/trailer/) plays full screen over the title, muted (browsers only
   autoplay muted video). Sound on / Skip buttons; any key, or a second tap, skips; it closes itself at the end.
   After that it does not autoplay again: the title screen has a Trailer button to watch it again.
   Automated browsers (tests) never see it unless the page is opened with ?intro=1. */
'use strict';
const Intro=(function(){
  const KEY='ec_intro_seen',SRC='docs/trailer/embercrown-trailer.mp4',POSTER='docs/trailer/poster.jpg';
  let el=null,vid=null,snd=null;
  function seen(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
  function mark(){try{localStorage.setItem(KEY,'1');}catch(e){}}
  function style(){
    if(document.getElementById('introcss'))return;
    const s=document.createElement('style');s.id='introcss';s.textContent=
      '#intro{position:fixed;inset:0;z-index:200;background:#07050c;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .4s}'+
      '#intro.out{opacity:0;pointer-events:none}'+
      '#intro video{width:100%;height:100%;object-fit:contain;background:#07050c}'+
      '#intro .ib{position:absolute;bottom:max(16px,env(safe-area-inset-bottom));display:flex;gap:10px}'+
      '#intro .ib.l{left:16px}#intro .ib.r{right:16px}'+
      '#intro button{font:600 15px "Cinzel","Palatino Linotype",Georgia,serif;letter-spacing:.06em;color:#f6e7c8;background:rgba(20,14,28,.72);'+
        'border:1px solid rgba(240,180,76,.6);border-radius:10px;padding:10px 16px;cursor:pointer;min-height:44px}'+
      '#intro button:hover{background:rgba(60,40,24,.85)}'+
      '#intro .hint{position:absolute;top:max(14px,env(safe-area-inset-top));left:0;right:0;text-align:center;color:rgba(246,231,200,.55);font:13px Georgia,serif}';
    document.head.appendChild(s);
  }
  function setSound(on){vid.muted=!on;if(on)vid.volume=1;snd.textContent=on?'Sound off':'Sound on';}
  function close(){
    if(!el)return;mark();
    try{vid.pause();}catch(e){}
    removeEventListener('keydown',onKey,true);
    const e=el;el=null;e.classList.add('out');setTimeout(()=>e.remove(),420);
  }
  function onKey(e){
    if(!el)return;e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='m'||e.key==='M'){setSound(vid.muted);return;}
    close();
  }
  function open(){
    if(el)return;style();
    el=document.createElement('div');el.id='intro';el.setAttribute('role','dialog');el.setAttribute('aria-label','EmberCrown trailer');
    vid=document.createElement('video');
    vid.src=SRC;vid.poster=POSTER;vid.muted=true;vid.playsInline=true;vid.setAttribute('playsinline','');vid.autoplay=true;vid.preload='auto';
    vid.addEventListener('ended',close);vid.addEventListener('error',close);
    const L=document.createElement('div');L.className='ib l';snd=document.createElement('button');snd.type='button';L.appendChild(snd);
    const R=document.createElement('div');R.className='ib r';const sk=document.createElement('button');sk.type='button';sk.textContent='Skip ▶';R.appendChild(sk);
    const h=document.createElement('div');h.className='hint';h.textContent=matchMedia('(pointer:coarse)').matches?'Tap the film for sound, tap again to skip':'Press any key to skip, M for sound';
    el.append(vid,h,L,R);document.body.appendChild(el);
    setSound(false);
    // keep every tap away from the game underneath; a tap on the film itself turns the sound on, the next one skips
    const stop=e=>{e.stopPropagation();};
    for(const t of['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click'])el.addEventListener(t,stop);
    snd.addEventListener('click',()=>setSound(vid.muted));
    sk.addEventListener('click',close);
    vid.addEventListener('click',()=>{if(vid.muted)setSound(true);else close();});
    addEventListener('keydown',onKey,true);
    const p=vid.play();if(p&&p.catch)p.catch(()=>{});
  }
  const force=/[?&]intro=1\b/.test(location.search);
  if(force||(!seen()&&!navigator.webdriver))open();
  return{open,close,isOpen:()=>!!el};
})();
