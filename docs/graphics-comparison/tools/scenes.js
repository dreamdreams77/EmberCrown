// Scenes used for every configuration. Each runs inside the page, using only the game's own globals, from the
// same new game with the same seed, so a scene is the same place and moment in every version.
// `setup` runs once, `frame` runs each 1/30 s step (i = frame, s = seconds), `frames` is how long it plays
// before the screenshot. `V.dbgZoom` is the game's own debug zoom: stripped for the "default" camera set
// (what a player sees) and kept for the "close" set (the zoom the trailer recorder uses).
const BOSS_AIM = 'const B=G.boss;G.ash.face=Math.atan2(B.y-G.ash.y,B.x-G.ash.x);';
module.exports = [
  { id: '01-ashfall-start', tags: ['mission', 'interior'], frames: 36,
    setup: 'go(0);G.wren.x+=40;V.dbgZoom=1.35;', frame: '' },
  { id: '02-ashfall-patrol', tags: ['mission', 'interior'], frames: 36,
    setup: "go(0);const g=G.guards.find(q=>!q.boss)||G.guards[0];G.wren.x=g.x-150;G.wren.y=g.y;g.wp=[[g.x,g.y],[g.x+1,g.y]];g.face=0;g.vf=0;V.dbgZoom=1.5;", frame: '' },
  { id: '03-gallowmere-hall', tags: ['mission', 'interior'], frames: 36,
    setup: 'go(1);V.dbgZoom=1.3;', frame: '' },
  { id: '04-gallowmere-fire', tags: ['fire', 'interior'], frames: 66,
    setup: "go(1);G.ash.on=true;G.active='ash';const b=G.items.find(i=>i.type==='B');if(b){G.ash.x=b.x-70;G.ash.y=b.y;G.ash.face=0;G.ash.vf=0;}V.dbgZoom=1.5;",
    frame: "keys[' ']=s>.6;keys['d']=s<.5;" },
  { id: '05-drowned-spire', tags: ['mission', 'outdoor'], frames: 36,
    setup: 'go(2);V.dbgZoom=1.1;', frame: '' },
  { id: '06-thornwick-hall', tags: ['mission', 'interior'], frames: 36,
    setup: 'go(3);V.dbgZoom=1.3;', frame: '' },
  { id: '07-warden-boss', tags: ['boss', 'fire', 'interior'], frames: 54,
    setup: "go(3);const B=G.boss;G.ash.on=true;G.active='ash';G.wren.x=B.x-160;G.wren.y=B.y;G.ash.x=B.x-140;G.ash.y=B.y+10;bossEngage(B,true);G.cine=null;B.st='idle';B.t=.8;V.dbgZoom=1.25;",
    frame: BOSS_AIM + "keys[' ']=s>.5;" },
  { id: '08-ironvale', tags: ['mission', 'interior', 'fire'], frames: 36,
    setup: 'go(4);V.dbgZoom=1.3;', frame: '' },
  { id: '09-dunmoor-ball', tags: ['mission', 'interior'], frames: 36,
    setup: 'go(5);V.dbgZoom=1.3;', frame: '' },
  { id: '10-dunmoor-ruins', tags: ['mission', 'interior'], frames: 36,
    setup: 'go(5);shiftTime();V.dbgZoom=1.3;', frame: '' },
  { id: '11-candlemaker-hall', tags: ['mission', 'interior', 'candles'], frames: 36,
    setup: 'go(6);V.dbgZoom=1.2;', frame: '' },
  { id: '12-candlemaker-boss', tags: ['boss', 'candles', 'fire'], frames: 60,
    setup: "go(6);const B=G.boss;G.ash.on=true;G.active='ash';G.wren.x=B.x-170;G.wren.y=B.y;G.ash.x=B.x-150;G.ash.y=B.y+8;bossEngage(B,true);G.cine=null;B.st='float';B.t=.5;V.dbgZoom=1.2;",
    frame: BOSS_AIM + "keys[' ']=s>.4;" },
  { id: '13-rookery-hub', tags: ['outdoor', 'hub'], frames: 36,
    setup: "newGame();run.ranks[0]='A';Hub.enter(1);G.grace=1e9;G.god=true;G.cine=null;V.dbgZoom=1.4;", frame: '' }
];
