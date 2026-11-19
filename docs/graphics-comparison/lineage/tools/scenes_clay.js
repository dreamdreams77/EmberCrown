// Clay-and-ink lineage scenes (branch ccr-8f845b2c-1nm43x). Same missions as the pixel-art game; this one has a fixed
// 800x480 view, so there is one camera. The player character is called shiloh here (wren in the pixel-art lineage).
const AIM = 'const B=G.boss;G.ash.face=Math.atan2(B.y-G.ash.y,B.x-G.ash.x);';
const go = (n) => `go(${n});`;
module.exports = [
  { id: '01-ashfall-start', frames: 36, setup: go(0), frame: '' },
  { id: '02-ashfall-patrol', frames: 36, setup: "go(0);const g=G.guards.find(q=>!q.boss)||G.guards[0];G.shiloh.x=g.x-150;G.shiloh.y=g.y;g.wp=[[g.x,g.y],[g.x+1,g.y]];g.face=0;g.vf=0;", frame: '' },
  { id: '03-gallowmere-hall', frames: 36, setup: go(1), frame: '' },
  { id: '04-gallowmere-fire', frames: 66, setup: "go(1);G.ash.on=true;G.active='ash';const b=G.items.find(i=>i.type==='B');if(b){G.ash.x=b.x-70;G.ash.y=b.y;G.ash.face=0;}", frame: "keys[' ']=s>.6;keys['d']=s<.5;" },
  { id: '05-drowned-spire', frames: 36, setup: go(2), frame: '' },
  { id: '06-thornwick-hall', frames: 36, setup: go(3), frame: '' },
  { id: '07-warden-boss', frames: 54, setup: "go(3);const B=G.boss;G.ash.on=true;G.active='ash';G.shiloh.x=B.x-160;G.shiloh.y=B.y;G.ash.x=B.x-140;G.ash.y=B.y+10;", frame: AIM + "keys[' ']=s>.5;" },
  { id: '08-ironvale', frames: 36, setup: go(4), frame: '' },
  { id: '09-dunmoor-ball', frames: 36, setup: go(5), frame: '' },
  { id: '10-dunmoor-ruins', frames: 36, setup: 'go(5);shiftTime();', frame: '' },
  { id: '11-candlemaker-hall', frames: 36, setup: go(6), frame: '' },
  { id: '12-candlemaker-boss', frames: 60, setup: "go(6);const B=G.boss;G.ash.on=true;G.active='ash';G.shiloh.x=B.x-170;G.shiloh.y=B.y;G.ash.x=B.x-150;G.ash.y=B.y+8;", frame: AIM + "keys[' ']=s>.4;" },
  { id: '13-back-stairs', frames: 6, setup: "newGame();lvl=1;mode='court';", frame: '' }
];
