'use strict';
/* EMBERCROWN - procedural audio (WebAudio). No asset files. */
const Aud=(()=>{
  let ac=null,master=null,sfxG=null,musG=null,noiseBuf=null,fireNode=null,fireGain=null,fireFilt=null;
  let drone=null,theme=null,noteT=0,beatT=0,tension=0;
  const set={sfx:true,music:true};
  const MODES={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],lydian:[0,2,4,6,7,9,11]};
  const hz=(root,semi)=>root*Math.pow(2,semi/12);

  function init(){
    if(ac){if(ac.state==='suspended')ac.resume();return;}
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    try{
      ac=new C();
      master=ac.createGain();master.gain.value=.8;master.connect(ac.destination);
      sfxG=ac.createGain();sfxG.gain.value=set.sfx?1:0;sfxG.connect(master);
      musG=ac.createGain();musG.gain.value=set.music?.55:0;musG.connect(master);
      noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);
      const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      if(theme)startDrone();
    }catch(e){ac=null;}
  }
  function ok(){return ac&&ac.state!=='closed';}
  function tone(f,dur,type,vol,o){
    if(!ok()||!set.sfx)return;o=o||{};
    const t=ac.currentTime+(o.delay||0),osc=ac.createOscillator(),g=ac.createGain();
    osc.type=type||'sine';osc.frequency.setValueAtTime(f,t);
    if(o.to)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.to),t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||.2,t+(o.atk||.01));
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    osc.connect(g);g.connect(o.dest||sfxG);osc.start(t);osc.stop(t+dur+.05);
  }
  function noise(dur,freq,vol,o){
    if(!ok()||!set.sfx)return;o=o||{};
    const t=ac.currentTime+(o.delay||0),src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
    src.buffer=noiseBuf;src.loop=true;f.type=o.type||'lowpass';f.frequency.setValueAtTime(freq,t);
    if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||.2,t+(o.atk||.005));
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(f);f.connect(g);g.connect(sfxG);src.start(t,Math.random());src.stop(t+dur+.05);
  }
  /* ---------- continuous fire ---------- */
  function fire(on){
    if(!ok())return;
    if(on&&!fireNode){
      fireNode=ac.createBufferSource();fireNode.buffer=noiseBuf;fireNode.loop=true;
      fireFilt=ac.createBiquadFilter();fireFilt.type='bandpass';fireFilt.frequency.value=700;fireFilt.Q.value=.7;
      fireGain=ac.createGain();fireGain.gain.value=0;
      fireNode.connect(fireFilt);fireFilt.connect(fireGain);fireGain.connect(sfxG);fireNode.start();
      fireGain.gain.linearRampToValueAtTime(.32,ac.currentTime+.08);
    } else if(!on&&fireNode){
      const n=fireNode,g=fireGain;fireNode=null;
      g.gain.cancelScheduledValues(ac.currentTime);g.gain.setValueAtTime(g.gain.value,ac.currentTime);
      g.gain.linearRampToValueAtTime(0,ac.currentTime+.15);setTimeout(()=>{try{n.stop();}catch(e){}},250);
    }
    if(on&&fireFilt)fireFilt.frequency.value=600+Math.random()*500;
  }
  /* ---------- music ---------- */
  function startDrone(){
    if(!ok()||!theme)return;stopDrone();
    const root=theme.root,t=ac.currentTime;
    const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;lp.Q.value=.4;
    const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+3);
    lp.connect(g);g.connect(musG);
    const oscs=[];
    [[1,'sawtooth',-6],[1.5,'sine',5],[2,'triangle',3],[.5,'sine',0]].forEach(([m,ty,det])=>{
      const o=ac.createOscillator();o.type=ty;o.frequency.value=root*m;o.detune.value=det;
      const og=ac.createGain();og.gain.value=ty==='sawtooth'?.35:.5;o.connect(og);og.connect(lp);o.start();oscs.push(o);});
    const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=.12;lg.gain.value=120;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();oscs.push(lfo);
    drone={oscs,g,lp};
  }
  function stopDrone(){
    if(!drone||!ac)return;const d=drone;drone=null;
    d.g.gain.cancelScheduledValues(ac.currentTime);d.g.gain.setValueAtTime(d.g.gain.value,ac.currentTime);
    d.g.gain.linearRampToValueAtTime(0,ac.currentTime+1.2);
    setTimeout(()=>d.oscs.forEach(o=>{try{o.stop();}catch(e){}}),1400);
  }
  function setTheme(m){
    theme=m||null;
    if(!theme){stopDrone();return;}
    if(ok())startDrone();
  }
  function pluck(f,vol){
    if(!ok()||!set.music)return;
    const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter();
    o.type='triangle';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=1600;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+2.2);
    o.connect(lp);lp.connect(g);g.connect(musG);o.start(t);o.stop(t+2.4);
  }
  function thump(vol){
    if(!ok()||!set.music)return;
    const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+.18);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);
    o.connect(g);g.connect(musG);o.start(t);o.stop(t+.3);
  }
  /* called every frame while playing; alert 0..1 raises tension */
  function tick(dt,alert,playing){
    if(!ok()||!theme)return;
    tension+=((playing?alert:0)-tension)*Math.min(1,dt*2);
    if(drone)drone.lp.frequency.value=380+tension*900;
    if(!playing)return;
    combatTick(dt);
    noteT-=dt;
    if(noteT<=0){
      noteT=(2.4+Math.random()*3.2)/theme.tempo;
      const sc=MODES[theme.mode]||MODES.minor,deg=sc[Math.floor(Math.random()*sc.length)]+(Math.random()<.3?12:0);
      pluck(hz(theme.root*2,deg),.05+Math.random()*.03);
      if(Math.random()<.35)setTimeout(()=>pluck(hz(theme.root*2,sc[(Math.random()*sc.length)|0]+12),.035),380);
    }
    if(tension>.35){beatT-=dt;if(beatT<=0){beatT=.95-tension*.45;thump(.14+tension*.25);}}
  }
  function setOpt(k,v){
    set[k]=v;
    if(!ok())return;
    if(k==='sfx')sfxG.gain.value=v?1:0;
    if(k==='music')musG.gain.value=v?.55:0;
  }
  /* ---------- one-shot effects ---------- */
  const S={
    click(){tone(520,.07,'square',.06);},
    confirm(){tone(392,.09,'triangle',.12);tone(587,.14,'triangle',.12,{delay:.07});},
    back(){tone(330,.08,'triangle',.1);},
    step(sneak){noise(.05,sneak?500:900,sneak?.025:.07,{type:'lowpass'});},
    gem(){tone(880,.1,'sine',.14);tone(1320,.22,'sine',.12,{delay:.07});},
    cache(){[660,880,1100,1320].forEach((f,i)=>tone(f,.2,'triangle',.13,{delay:i*.07}));},
    relic(){[392,494,587,784,988].forEach((f,i)=>tone(f,.5,'sine',.14,{delay:i*.11,atk:.03}));noise(.9,3000,.04,{type:'highpass',delay:.2});},
    scroll(){noise(.16,2500,.06,{type:'highpass'});tone(660,.18,'sine',.08,{delay:.05});},
    alert(){tone(740,.14,'sawtooth',.1,{to:520});tone(500,.2,'sawtooth',.08,{delay:.12,to:380});},
    lost(){tone(300,.5,'sawtooth',.14,{to:90});noise(.6,500,.1,{to:80});},
    win(){[523,659,784,1047].forEach((f,i)=>tone(f,.45,'triangle',.15,{delay:i*.14,atk:.02}));},
    swap(){tone(440,.07,'triangle',.1);tone(660,.1,'triangle',.1,{delay:.05});},
    smoke(){noise(.8,1800,.14,{to:300});},
    bell(){tone(880,1.2,'sine',.16,{atk:.005});tone(1320,.9,'sine',.07,{atk:.005});tone(1760,.6,'sine',.04);},
    toll(){tone(196,1.6,'sine',.28,{atk:.005});tone(294,1.3,'sine',.14);noise(.3,300,.12);},
    flute(){[523,659,784,988].forEach((f,i)=>tone(f,.35,'sine',.1,{delay:i*.09,atk:.04}));},
    snuff(){noise(.25,1500,.1,{type:'highpass'});tone(300,.2,'sine',.05,{to:100});},
    dash(){noise(.2,1200,.18,{type:'bandpass',to:300});tone(260,.18,'sawtooth',.07,{to:520});},
    hit(){noise(.1,2400,.14,{type:'bandpass'});tone(160,.12,'square',.08,{to:80});},
    stun(){tone(520,.08,'square',.07);tone(390,.12,'square',.07,{delay:.06});},
    deflect(){tone(1500,.07,'square',.06,{to:900});noise(.05,4000,.08,{type:'highpass'});},
    explode(){noise(.9,900,.5,{to:60});tone(90,.5,'sine',.4,{to:30});},
    crack(){noise(.5,500,.4,{to:80});tone(70,.5,'sawtooth',.18,{to:35});},
    unlock(){tone(300,.05,'square',.07);tone(450,.06,'square',.07,{delay:.07});},
    open(){tone(200,.25,'sawtooth',.1,{to:120});noise(.25,400,.08);},
    shift(){[440,330,220,165].forEach((f,i)=>tone(f,.5,'sine',.12,{delay:i*.1}));noise(1,2000,.07,{type:'highpass',to:300});},
    blink(){tone(900,.25,'sine',.1,{to:200});},
    boom(){noise(.7,500,.35,{to:50});tone(110,.5,'sine',.3,{to:35});},
    ember(){tone(1100+Math.random()*400,.05,'sine',.02);},
    pot(){noise(.25,1800,.16,{type:'bandpass'});tone(300,.12,'triangle',.08,{to:150});},
    heart(){[523,659,784].forEach((f,i)=>tone(f,.25,'sine',.12,{delay:i*.06}));},
    cinder(){tone(1500+Math.random()*300,.06,'sine',.05);},
    hurt(){tone(180,.3,'sawtooth',.2,{to:60});noise(.2,900,.18,{to:150});},
    swing(){noise(.12,2600,.1,{type:'highpass',to:900});},
    slash(){noise(.16,3200,.14,{type:'bandpass',to:1200});tone(700,.09,'triangle',.06,{to:300});},
    foeDie(){noise(.4,1500,.15,{to:200});tone(400,.3,'triangle',.08,{to:120});},
    slam(){noise(.5,400,.4,{to:60});tone(70,.5,'sine',.4,{to:35});},
    wind(){tone(180,.5,'sawtooth',.06,{to:420});},
    orb(){tone(500,.25,'sine',.1,{to:900});noise(.1,2000,.05,{type:'highpass'});},
    nova(){tone(150,.8,'sine',.3,{to:600});noise(.7,1200,.25,{to:100});[440,660,880].forEach((f,i)=>tone(f,.6,'triangle',.07,{delay:i*.05}));},
    chest(){[330,415,523,659,880].forEach((f,i)=>tone(f,.4,'triangle',.1,{delay:i*.07}));},
    brazier(){noise(.4,1500,.18,{type:'highpass',to:600});tone(220,.4,'sine',.1,{to:440});},
    gate(){tone(110,.7,'sawtooth',.14,{to:70});noise(.7,300,.14);},
    roar(){tone(90,1.2,'sawtooth',.28,{to:55});tone(135,1.1,'sawtooth',.18,{to:80});noise(1,600,.2,{to:100});},
    sting(){[220,277,330].forEach((f,i)=>tone(f,1.2,'sawtooth',.06,{delay:i*.02,atk:.1}));}
  };
  /* ---------- ambient beds: wind, sea, forge rumble, marsh hush ---------- */
  let amb=null;
  const AMBS={night:[420,.5,.07,.04],dusk:[600,.6,.09,.035],moon:[300,.5,.06,.05],sea:[500,.4,.16,.07],forge:[110,.9,.2,.09],marsh:[900,.7,.1,.025],crown:[200,.8,.05,.04]};
  function ambient(kind){
    if(amb){const o=amb;amb=null;try{o.g.gain.cancelScheduledValues(ac.currentTime);o.g.gain.linearRampToValueAtTime(0,ac.currentTime+1);setTimeout(()=>{try{o.src.stop();o.lfo.stop();}catch(e){}},1200);}catch(e){}}
    if(!ok()||!kind||!AMBS[kind])return;
    const [f,q,lf,vol]=AMBS[kind];
    const src=ac.createBufferSource();src.buffer=noiseBuf;src.loop=true;
    const flt=ac.createBiquadFilter();flt.type=kind==='forge'?'lowpass':'bandpass';flt.frequency.value=f;flt.Q.value=q;
    const g=ac.createGain();g.gain.value=0;
    const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=lf;lg.gain.value=vol*.6;lfo.connect(lg);lg.connect(g.gain);
    src.connect(flt);flt.connect(g);g.connect(musG);src.start();lfo.start();
    g.gain.linearRampToValueAtTime(vol,ac.currentTime+2);
    amb={src,lfo,g};
  }
  let combat=0,cT=0;
  function setCombat(v){combat=v;}
  function combatTick(dt){
    if(!ok()||!set.music||combat<=.05)return;
    cT-=dt;if(cT<=0){cT=.5-combat*.18;thump(.12+combat*.2);if(combat>.6&&Math.random()<.5)setTimeout(()=>thump(.1),cT*500);}
  }
  return {init,setTheme,tick,fire,setOpt,set,S,setCombat,combatTick,ambient,resume(){if(ac&&ac.state==='suspended')ac.resume();}};
})();
