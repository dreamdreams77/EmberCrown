// Scenes of the Ashfall slice, identical for the LPC version and the Ember art. All run inside the page with the game's own globals.
// `frame` runs each 1/30 s step. V.dbgZoom (stripped for the default camera) is the game's own debug zoom.
const STAND = "g.wp=[[g.x,g.y],[g.x+1,g.y]];";
module.exports=[
 {id:'01-hero-idle',frames:30,setup:"go(0);V.dbgZoom=2.6;",frame:''},
 {id:'02-start',frames:36,setup:"go(0);V.dbgZoom=1.35;",frame:''},
 {id:'03-patrol',frames:36,setup:"go(0);const g=G.guards.find(q=>!q.boss)||G.guards[0];G.wren.x=g.x-150;G.wren.y=g.y;"+STAND+"g.face=0;g.vf=0;V.dbgZoom=1.5;",frame:''},
 {id:'04-two-guards',frames:36,setup:"go(0);const a=G.guards[0],b=G.guards[1];G.wren.x=a.x-110;G.wren.y=a.y+40;a.wp=[[a.x,a.y],[a.x+1,a.y]];b.wp=[[b.x,b.y],[b.x+1,b.y]];b.x=a.x+70;b.y=a.y;a.face=Math.PI;a.vf=Math.PI;b.face=Math.PI;b.vf=Math.PI;V.dbgZoom=2.2;",frame:''},
 {id:'05-walking',frames:30,setup:"go(0);V.dbgZoom=2.6;",frame:"keys['d']=true;"},
 {id:'06-strike',frames:12,setup:"go(0);G.wren.face=0;G.wren.vf=0;V.dbgZoom=2.6;",frame:"if(i===8){playPress(' ');}"},
 {id:'07-cinderling',frames:40,setup:"go(0);spawnFoe('cinder',G.wren.x+80,G.wren.y+4);spawnFoe('cinder',G.wren.x+110,G.wren.y-20);V.dbgZoom=2.4;",frame:''},
 {id:'08-ashling-fire',frames:50,setup:"go(0);G.ash.on=true;G.active='ash';G.ash.x=G.wren.x+8;G.ash.y=G.wren.y+14;G.wren.y-=4;V.dbgZoom=2.4;",frame:"keys[' ']=s>.4;"},
 {id:'09-guard-alert',frames:44,setup:"go(0);const a=G.guards[0];G.wren.x=a.x-60;G.wren.y=a.y;a.wp=[[a.x,a.y],[a.x+1,a.y]];a.face=Math.PI;a.vf=Math.PI;V.dbgZoom=2.8;",frame:"if(i===6){const a=G.guards[0];a.seeing=true;a.hopT=G.time;}"},
 {id:'10-takedown',frames:50,setup:"go(0);const g=G.guards.find(q=>!q.boss)||G.guards[0];"+STAND+"g.face=0;g.vf=0;G.wren.x=g.x-18;G.wren.y=g.y;G.wren.face=0;V.dbgZoom=2.8;",frame:"if(i===5){const g=G.guards.find(q=>!q.boss)||G.guards[0];g.ko=true;g.stun=9;}"}
];
