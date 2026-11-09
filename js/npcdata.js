'use strict';
/* EMBERCROWN - NPC, quest and exploration data, one entry per mission (index = mission).
   Conditions (strings joined by &): st:favor|fear|ruin|none  flag:x  tmp:x  q:id=none|active|done|failed|N  q:id>=N  cin:N  (prefix ! to negate)
   Dialogue node: {t:text|{d,favor,fear,ruin}, c:[{l,to,fx,if,cost,shop,once}]}  no c = a single Leave button.
   fx: h:[house,type,n] cin item(+alt) gad heal q qfail qdone flag tmp ev free follow reveal drop alert clue lure
   Objects: kind item|lever|gong|light|valve|mask|plaque|chand|clapper|burn  show:<cond>  */
const HOUSEFX={
 favor:["Servants speak freely","Merchants cut prices 30%","The hidden passage is marked","Quest rewards +50%"],
 fear:["Servants obey: threats work","Merchants add 25%","Informants only talk if pressed","One quiet door stays shut"],
 ruin:["One fewer guard on the floor","A wall has already given way","Merchants sell cheap, desperate","Servants are cornered and bitter"]};
const FLAGLINES={
 hale_free:"Sailors of the Spire remember the man you freed.",
 tam_safe:"A pot-boy has told every kitchen your name.",
 tam_sold:"Servants have stopped trusting you. A boy was sold.",
 ink_black:"Brother Ink's vow-book sits in your bag, and he knows it.",
 sera_ok:"A maid in Dunmoor owes you a kindness."
};
const NPCDATA=[
/* ---------------- 0: Ashfall Keep (Marrow) ---------------- */
{house:'marrow',
 npcs:[
  {id:'pip',name:'Pip',role:'Scullion',x:3,y:3,look:{k:'servant',skin:'#e8c8a0',cloth:'#6a5040',trim:'#d8c8a0',hat:'cap'},
   entry:[{if:'tmp:pip_done',n:'again'},{n:'s'}],
   tree:{
    s:{t:"Psst. You are not Marrow. Marrow smells of smoke and gravy. You smell of trouble.",c:[
      {l:"Where do the guards sleep?",to:'a'},
      {l:"A coin for the tally book?",to:'b',cost:10,fx:{q:'tally',tmp:'pip_done'}},
      {l:"Talk, or I find your sergeant.",to:'c',fx:{h:['marrow','fear',1],clue:["Pip's Whisper","Crates in the east store carry plain wax rings, not Marrow's bone. Someone else's goods, in Marrow's keep."],tmp:'pip_done'}}]},
    a:{t:"East wing, mostly. The sergeant keeps the jailer's key in a bucket, south-east room. Do not tell him I said bucket."},
    b:{t:"The tally book lies on a bunk in the west barracks. Burn it and the sergeant cannot prove who is missing. Your little dragon will know what to do."},
    c:{t:"Fine! Fine. Look at the crates in the store. Wax rings, not bones. Nobody knows why."},
    again:{t:{d:"Still scrubbing. Still here. Good luck.",fear:"Still scrubbing. Please do not tell the sergeant."}}}},
  {id:'hale',name:'Hale',role:'Chained sailor',x:10,y:13,look:{k:'prisoner',skin:'#d8b890',cloth:'#4a6a88',trim:'#2a3a50',hat:'none'},
   entry:[{if:'q:hale=1',n:'ready'},{if:'q:hale=0',n:'wait'},{n:'s'}],
   tree:{
    s:{t:"Water. No, wait. Information first. I am Hale, a sailor of the Drowned Spire. I counted Marrow's boats once. Now I count their chains.",c:[
      {l:"I will find the key.",to:'ok',fx:{q:'hale'}},
      {l:"Who are you, really?",to:'who'},
      {l:"Sorry. I cannot help."}]},
    who:{t:"A man with a house that would pay for him. Ostrander does not forget its own.",c:[{l:"I will find the key.",to:'ok',fx:{q:'hale'}},{l:"Maybe later."}]},
    ok:{t:"The jailer's key. Bucket, south-east room. Bring it quietly."},
    wait:{t:"Key. Bucket. South-east room. Quietly, friend."},
    ready:{t:"That is it! Oh, the weight off. Go. I will find my own way out.",c:[{l:"Unlock the shackles.",fx:{ev:'talk:hale',free:'hale'}}]}}}],
 objs:[
  {id:'jkey',x:23,y:13,kind:'item',icon:'key',label:'Take the key',show:'q:hale=0',need:.6},
  {id:'tally',x:3,y:9,kind:'burn',icon:'book',label:'Tally book (burn it)',show:'q:tally=0',need:1}],
 quests:[
  {id:'hale',title:'A Key for Hale',desc:"A chained Ostrander sailor wants out of Ashfall Keep.",steps:["Find the jailer's key in the south-east barracks","Return to Hale and free him"],on:['obj:jkey','talk:hale'],
   rew:{cin:40,item:'hale_knot',alt:{gad:{smoke:1}},h:['ostrander','favor',1],flag:'hale_free'}},
  {id:'tally',title:'The Burned Ledger',desc:"Pip says the sergeant's tally book is the only proof of who is missing.",steps:["Burn the tally book in the west barracks (needs Ashling)"],on:['obj:tally'],
   rew:{cin:25,h:['marrow','ruin',1]}}]},

/* ---------------- 1: Gallowmere (Grell) ---------------- */
{house:'grell',
 route:{x:6,y:5,lever:'winch'},
 npcs:[
  {id:'cook',name:'Old Cook',role:'Servant',x:2,y:8,look:{k:'servant',skin:'#e0b890',cloth:'#7a5a40',trim:'#eee8d8',hat:'cap',apron:1},
   entry:[{n:'s'}],
   tree:{
    s:{t:{d:"A guest lost between larder and hall? No. A thief. Good. Ask, then, quickly.",favor:"The steward's friend! Sit. No, do not sit, there is a guard. Ask.",fear:"Please. I only stir the pot. Ask what you like.",ruin:"The wine is vinegar and the pay is promises. Ask. I have nothing left to guard."},c:[
      {l:"How do I thin out the guards?",to:'gong'},
      {l:"Is there a back way?",to:'route',if:'!st:fear'},
      {l:"Back way. Now.",to:'routefear',if:'st:fear',fx:{reveal:1}},
      {l:"What does Grell owe?",to:'owe',fx:{clue:["Grell's Debts","Nine lenders, one castle. Whichever lender wins will not enjoy it, because Grell has promised the cellar to a tenth."]}}]},
    gong:{t:"The dinner gong, south corridor. Ring it and every guard within earshot marches to the kitchen for supper. I would not hold the ladle for them."},
    route:{t:{d:"Servants' winch, kitchen corner behind the sacks. It swings the pantry wall open. We use it to carry out dead soup.",favor:"The steward left the winch oiled for you. Kitchen corner. The pantry wall will swing."},fx:{reveal:1}},
    routefear:{t:"Winch. Kitchen corner. Do not hurt me."},
    owe:{t:"Everyone. Nine lenders, one castle. He is a brave man, in the way a falling man is brave."}}},
  {id:'tam',name:'Tam',role:'Pot-boy',x:23,y:11,look:{k:'servant',skin:'#e8c0a0',cloth:'#5a6a4a',trim:'#c8b890',hat:'none',small:1},
   entry:[{if:'tmp:tam_sold',n:'x'},{if:'q:tam=0',n:'wait'},{n:'s'}],
   tree:{
    s:{t:"Shh! Grell sells servants' debts at the end of the feast. I am the debt. Please, the back door, the one you came in by.",c:[
      {l:"Stay close. I will get you out.",to:'go',fx:{q:'tam',follow:'tam'}},
      {l:"Guards pay for runaways. (40 cinders)",to:'sold',fx:{cin:40,h:['grell','favor',1],flag:'tam_sold',tmp:'tam_sold',gone:'tam'}},
      {l:"Sorry. Too risky."}]},
    go:{t:"Thank you. I will be as quiet as a candle."},
    sold:{t:"What? No. No! Please!"},
    wait:{t:"Keep moving. Back door. Please."},
    x:{t:"..."}}},
  {id:'brisk',name:'Factor Brisk',role:'Merchant',x:14,y:13,shop:1,look:{k:'merchant',skin:'#d8a880',cloth:'#8a3a2a',trim:'#e0b040',hat:'cap',pack:1},
   entry:[{n:'s'}],
   tree:{
    s:{t:{d:"Factor Brisk, purveyor of things Grell will not miss. Wagons fall a lot here.",favor:"A friend of the house! Friend prices, friend.",fear:"Prices are fair. Please do not make them unfair.",ruin:"Everything must go. The house is going and so am I."},c:[
      {l:"Smoke powder",to:'s',cost:14,shop:1,fx:{gad:{smoke:1}}},
      {l:"Whisper bell",to:'s',cost:12,shop:1,fx:{gad:{bell:1}}},
      {l:"Mend a heart",to:'s',cost:22,shop:1,fx:{heal:1}}]}}}],
 objs:[
  {id:'gong',x:9,y:10,kind:'gong',icon:'gong',label:'Ring the dinner gong',need:.7,to:[3,7]},
  {id:'winch',x:7,y:6,kind:'lever',icon:'lever',label:'Pull the winch',need:.7}],
 quests:[
  {id:'tam',title:'The Pot-boy',desc:"Tam is about to be sold with the leftovers. Lead him to the back door.",steps:["Lead Tam to the exit without being seen"],on:['escort:tam'],fail:['bolt:tam'],
   rew:{cin:55,item:'tam_whistle',alt:{gad:{bell:1}},flag:'tam_safe',h:['grell','ruin',1]}}]},

/* ---------------- 2: The Drowned Spire (Ostrander) ---------------- */
{house:'ostrander',
 npcs:[
  {id:'pilot',name:'Pilot Maren',role:'Harbor pilot',x:1,y:5,look:{k:'servant',skin:'#d8b088',cloth:'#2a5a78',trim:'#e8f4ff',hat:'cap'},
   entry:[{if:'q:relay=0',n:'letter'},{n:'s'}],
   tree:{
    s:{t:{d:"A dragon, on my rocks. Of course. The tide has been rude all week.",favor:"Your coin keeps my lamp low. Speak, dragon.",fear:"Do not breathe on me. Ask.",ruin:"The lamp oil is seawater and the bell is cracked. Ask fast. The Spire is sinking."},c:[
      {l:"How do I dim the searchlights?",to:'crank',fx:{reveal:1}},
      {l:"Hale sends his regards.",to:'hale',if:'flag:hale_free&!tmp:hale_paid',fx:{cin:35,tmp:'hale_paid',h:['ostrander','favor',1]}},
      {l:"What is the Spire hiding?",to:'hide',fx:{clue:["Harbor Tide Tables","The beacons were lit nine times last winter. Nobody saw a ship. Someone was talking to the north."]}}]},
    crank:{t:"Lamp crank on the south quay, east end. Turn it and the searchlights stand blind for a breath. Do not be on the rock when it ends."},
    hale:{t:"Hale? He lives? Ha! Then the Spire owes you. Take this, dragon."},
    hide:{t:"The tide tables lie. Ask the lighthouse why."},
    letter:{t:"A letter? From Kess? Let me see. Oh, the sweet fool. The tables have been lying for a year. He knew.",c:[{l:"Hand it over.",fx:{ev:'talk:pilot'}}]}}},
  {id:'kess',name:'Kess',role:'Stranded sailor',x:26,y:5,look:{k:'servant',skin:'#e0b890',cloth:'#6a4a38',trim:'#cfc4a0',hat:'cap'},
   entry:[{if:'q:relay=0',n:'again'},{if:'q:relay=done',n:'thanks'},{n:'s'}],
   tree:{
    s:{t:"Stranded since the bell rang for supper. Dragon! Take this note to Pilot Maren, west rocks. She will know my hand.",c:[
      {l:"Gladly.",to:'ok',fx:{q:'relay'}},
      {l:"What is in it?",to:'in'},
      {l:"Not now."}]},
    in:{t:"A true tide table. Ostrander would hang me for it.",c:[{l:"Gladly.",to:'ok',fx:{q:'relay'}},{l:"Not now."}]},
    ok:{t:"West rocks. Maren. Thank you. Mind the lamps."},
    again:{t:"West rocks. Maren. Fly low."},
    thanks:{t:"She read it? Then I am not a liar. Thank you."}}},
  {id:'hale2',name:'Hale',role:'Rescued sailor',x:3,y:12,show:'flag:hale_free',look:{k:'servant',skin:'#d8b890',cloth:'#4a6a88',trim:'#2a3a50',hat:'none'},
   entry:[{if:'tmp:h2',n:'again'},{n:'s'}],
   tree:{
    s:{t:"Dragon! A boat found me. I told them about you. Every sailor on the Spire is on your side. Almost every.",c:[
      {l:"Where are the lamps controlled?",to:'crank',fx:{reveal:1,tmp:'h2'}},
      {l:"Anything for the road?",to:'gift',fx:{cin:30,tmp:'h2'}}]},
    crank:{t:"South quay, east end. A crank. It dims the whole harbor."},
    gift:{t:"A little coin. A little thanks. Fly well."},
    again:{t:"Fly well, Ashling."}}}],
 objs:[
  {id:'crank',x:23,y:13,kind:'light',icon:'crank',label:'Turn the lamp crank',need:.9}],
 quests:[
  {id:'relay',title:"Kess's Letter",desc:"A stranded sailor wants a true tide table in the pilot's hands.",steps:["Carry Kess's note to Pilot Maren (far west rocks)"],on:['talk:pilot'],
   rew:{cin:45,h:['ostrander','favor',1],clue:["The True Tide Table","The Spire lies about the tides to hide what comes in at night. Someone from the north brings it."]}}]},

/* ---------------- 3: Thornwick Abbey (Sable) ---------------- */
{house:'sable',
 route:{x:6,y:6,lever:'sconce'},
 npcs:[
  {id:'wick',name:'Novice Wick',role:'Silent novice',x:3,y:8,look:{k:'monk',skin:'#e8c8a8',cloth:'#4a4660',trim:'#9a90c0',hat:'hood'},
   entry:[{if:'q:clapper=0',n:'again'},{n:'s'}],
   tree:{
    s:{t:"*A novice mimes a bell, a rope, a snipped strap, then lifts a slate: THE WARDEN TOLLS TO FIND THIEVES. SILENCE HIS CLAPPER.*",c:[
      {l:"I will muffle the bell.",to:'ok',fx:{q:'clapper'}},
      {l:"Is there a hidden way?",to:'route',fx:{reveal:1}},
      {l:"Tell me of the Warden.",to:'warden'}]},
    ok:{t:"*Wick presses a hand to his heart, then to his lips. Slate: THE ROPE STRAP, BY THE BELL. QUICK AND QUIET.*"},
    route:{t:{d:"*Slate: A SCONCE IN THE CELL WALL MOVES. TURN IT. QUIETLY.*",favor:"*Wick grins, taps the wall by the cells, and mimes a lever with exaggerated care.*",fear:"*Wick flinches, then points at a sconce in the cell wall. Fast.*",ruin:"*Slate: THE WALL ALREADY CRACKED. GO THROUGH.*"}},
    warden:{t:"*Slate: HE WAS ONE OF US. NOW HE ONLY HEARS BELLS. HE CANNOT HEAR YOU. HE CAN FEEL YOU.*"},
    again:{t:"*Wick points at the bell, then at the strap.*"}}},
  {id:'scribe',name:'Brother Ink',role:'Scribe',x:11,y:3,look:{k:'monk',skin:'#e0c098',cloth:'#5a3a50',trim:'#d8c8a0',hat:'hood'},
   entry:[{if:'q:vow=1',n:'ready'},{if:'q:vow=0',n:'wait'},{n:'s'}],
   tree:{
    s:{t:"*Ink-stained fingers hover over a blank page. Slate: MY VOW-BOOK. STOLEN BY MY CELLMATE. IT NAMES WHO PAYS THE ABBEY.*",c:[
      {l:"I will fetch it.",to:'ok',fx:{q:'vow'}},
      {l:"What does it name?",to:'book',fx:{clue:["The Vow-Book","Seven tithes, one hand: the abbey's silence was bought in installments, all from the same purse."]}},
      {l:"Not my business."}]},
    ok:{t:"*Ink bows low. Slate: FIRST CELL, WEST WING.*"},
    book:{t:"*Slate: ALL ONE HAND. ALL ONE PURSE.*"},
    wait:{t:"*Slate: WEST WING. FIRST CELL.*"},
    ready:{t:"*Ink reaches for it, eyes wet.*",c:[
      {l:"Hand it back.",fx:{ev:'talk:scribe'}},
      {l:"Keep it. Make him pay.",fx:{cin:60,h:['sable','fear',1],qfail:'vow',flag:'ink_black'}}]}}}],
 objs:[
  {id:'vowbook',x:1,y:8,kind:'item',icon:'book',label:'Take the vow-book',show:'q:vow=0',need:.6},
  {id:'clapper',x:19,y:6,kind:'clapper',icon:'rope',label:'Muffle the bell strap',show:'q:clapper=0',need:1.1},
  {id:'sconce',x:3,y:6,kind:'lever',icon:'sconce',label:'Turn the sconce',need:.7}],
 quests:[
  {id:'clapper',title:'A Muffled Bell',desc:"Wick wants the Bell-Warden's toll dampened.",steps:["Muffle the bell's strap beside the Warden's frame"],on:['obj:clapper'],rew:{cin:35,h:['sable','ruin',1]}},
  {id:'vow',title:"Ink's Vow-Book",desc:"Brother Ink's vow-book names who has been paying for Sable's silence.",steps:["Find the vow-book in the first west cell","Return it to Brother Ink"],on:['obj:vowbook','talk:scribe'],
   rew:{cin:45,h:['sable','favor',1],item:'vow_ink',alt:{gad:{bell:1}}}}]},

/* ---------------- 4: Ironvale (Kest) ---------------- */
{house:'kest',
 route:{x:17,y:3,lever:'damper'},
 npcs:[
  {id:'dagna',name:'Quartermaster Dagna',role:'Merchant',x:21,y:12,shop:1,look:{k:'merchant',skin:'#c89870',cloth:'#5a3a34',trim:'#e0a040',hat:'cap',pack:1},
   entry:[{n:'s'}],
   tree:{
    s:{t:{d:"Everything is counted. Anything not counted is for sale.",favor:"A friend of the foreman gets foreman's prices.",fear:"Prices are fair. Do not make them unfair.",ruin:"Stores are low. I will take whatever you offer."},c:[
      {l:"Smoke powder",to:'s',cost:16,shop:1,fx:{gad:{smoke:1}}},
      {l:"Whisper bell",to:'s',cost:14,shop:1,fx:{gad:{bell:1}}},
      {l:"Cinder tonic (heals)",to:'s',cost:24,shop:1,fx:{heal:1}}]}}},
  {id:'orrin',name:'Orrin',role:'Apprentice smith',x:3,y:11,look:{k:'servant',skin:'#d8a880',cloth:'#4a3a38',trim:'#d09040',hat:'none',apron:1},
   entry:[{if:'q:hammer=1',n:'ready'},{if:'q:hammer=0',n:'wait'},{n:'s'}],
   tree:{
    s:{t:{d:"The foreman's hammer. He hid it in the east hall so no apprentice could ring the bell for a cold furnace. I need it for the cell locks.",favor:"You are the foreman's friend. So you know the hammer. The east hall. Please.",fear:"I will not report you, sir. The hammer is in the east hall. Please.",ruin:"The foreman is gone. The hammer is not. East hall."},c:[
      {l:"I will fetch it.",to:'ok',fx:{q:'hammer'}},
      {l:"Why do you hate the foreman?",to:'why',fx:{clue:["Foreman's Rules","A hearth cooled early is a hearth cooled by order. Orrin has been writing the days on his arm."]}},
      {l:"Not today."}]},
    ok:{t:"East hall, past the furnace. Quick, before the vents resume."},
    why:{t:"He counts the men like iron. When one is cold, he writes 'cold iron' on the sheet."},
    wait:{t:"East hall. The furnace. Quick."},
    ready:{t:"The hammer! Oh, thank the anvil. Now I can break the cell hinges.",c:[{l:"Here you go.",fx:{ev:'talk:orrin'}},{l:"Not yet."}]}}}],
 objs:[
  {id:'hammer',x:14,y:3,kind:'item',icon:'hammer',label:'Take the hammer',show:'q:hammer=0',need:.6},
  {id:'valve',x:7,y:8,kind:'valve',icon:'valve',label:'Turn the steam valve',need:.8},
  {id:'damper',x:7,y:2,kind:'lever',icon:'lever',label:'Throw the damper',need:.7}],
 quests:[
  {id:'hammer',title:"The Foreman's Hammer",desc:"Orrin needs a hammer to break the cell hinges.",steps:["Take the hammer from the east hall","Bring it to Orrin"],on:['obj:hammer','talk:orrin'],
   rew:{cin:40,h:['kest','ruin',1],item:'orrin_hammer',alt:{gad:{bell:1}}}}]},

/* ---------------- 5: Dunmoor Marsh (Dunmoor) ---------------- */
{house:'dunmoor',
 route:{x:18,y:8,lever:'latch'},
 npcs:[
  {id:'violin',name:'Sandro',role:'First violin',x:5,y:9,look:{k:'servant',skin:'#e0b898',cloth:'#2a2a48',trim:'#e0c070',hat:'none',mask:1},
   entry:[{n:'s'}],
   tree:{
    s:{t:{d:"The quartet plays louder when the Hostess is angry. She is rarely not angry.",favor:"A friend! The doorman said you lost your invitation. Politely.",fear:"I play what I am told, sir. What would you like played?",ruin:"The punch was spiked, so we all play flat. Ask."},c:[
      {l:"Any way to be less visible?",to:'mask'},
      {l:"What does the Hostess hide?",to:'hide',fx:{clue:["Veyra's Hand","Lady Veyra counts her guests twice. The second count is the list of who will not be leaving."]}},
      {l:"Never mind."}]},
    mask:{t:"The cloakroom, south-west. Silver masks on the rack. Guards see a mask, not a face. For a while."},
    hide:{t:"Veyra never counts the staff. We are furniture. Furniture hears everything."}}},
  {id:'sera',name:'Sera',role:'Masked maid',x:22,y:4,look:{k:'servant',skin:'#e8c8a8',cloth:'#6a3a5a',trim:'#e8d8c0',hat:'cap',apron:1,mask:1},
   entry:[{if:'q:locket=1',n:'ready'},{if:'q:locket=0',n:'wait'},{n:'s'}],
   tree:{
    s:{t:"I lost Lady Veyra's locket while the dancers spun. If she finds it gone, I am finished. Could you...?",c:[
      {l:"I will find it.",to:'ok',fx:{q:'locket'}},
      {l:"Where is the chandelier rope?",to:'rope',fx:{q:'chand'}},
      {l:"Sorry."}]},
    ok:{t:"Somewhere on the floor, south of the dance. Thank you."},
    rope:{t:"West of the pillar, behind the cloth. If it falls, the whole floor will scatter. Nobody will blame the staff. We are furniture."},
    wait:{t:"On the floor, south of the dance."},
    ready:{t:"My lady's locket! Oh, heaven. Take this. The house will never know.",c:[{l:"Here.",fx:{ev:'talk:sera',flag:'sera_ok'}}]}}}],
 objs:[
  {id:'mask',x:4,y:11,kind:'mask',icon:'mask',label:'Take a silver mask',need:.6},
  {id:'chandrope',x:9,y:6,kind:'chand',icon:'rope',label:'Cut the chandelier rope',show:'q:chand=0',need:1},
  {id:'locket',x:14,y:10,kind:'item',icon:'locket',label:'Take the locket',show:'q:locket=0',need:.6},
  {id:'latch',x:23,y:7,kind:'lever',icon:'sconce',label:'Pull the servants latch',need:.7}],
 quests:[
  {id:'locket',title:"Veyra's Locket",desc:"A maid is one lost trinket from ruin.",steps:["Find the locket on the ballroom floor","Return it to Sera"],on:['obj:locket','talk:sera'],
   rew:{cin:40,h:['dunmoor','favor',1],flag:'sera_ok'}},
  {id:'chand',title:'The Falling Light',desc:"Cut the chandelier rope and the dance floor will scatter.",steps:["Cut the chandelier rope west of the pillar"],on:['obj:chandrope'],rew:{cin:30,h:['dunmoor','ruin',1]}}]},

/* ---------------- 6: The Candlemaker's Crown (Hallow) ---------------- */
{house:'hallow',
 route:{x:10,y:9,lever:'wicklever'},
 npcs:[
  {id:'nan',name:'Old Nan',role:'Wick-keeper',x:4,y:12,look:{k:'servant',skin:'#d8b898',cloth:'#6a5a3a',trim:'#e8d8a0',hat:'hood'},
   entry:[{if:'q:memorial=0',n:'again'},{n:'s'}],
   tree:{
    s:{t:"Forty years I have trimmed his candles. He does not thank me. He does not, to be fair, remember me.",c:[
      {l:"The plaques. How do I wake them?",to:'plaque',fx:{q:'memorial'}},
      {l:"Was he truly Quill's student?",to:'quill',fx:{clue:["Old Nan's Story","He and the courier girl learned the same knots from the same hands. She went north. He stayed to keep the candles."]}},
      {l:"Never mind."}]},
    plaque:{t:"Three plaques: the Wick, the Crown, the Ash. Touch them in the order of the verse: west, east, north. A wrong touch and they forget. Be kind."},
    quill:{t:"The same hands taught them the same knots. One of them kept the candles lit. The other lit a war."},
    again:{t:"West. East. North. Be kind."}}},
  {id:'corvin',name:'Corvin',role:'Weary guard',x:21,y:9,look:{k:'servant',skin:'#d0a880',cloth:'#4a4030',trim:'#c0a050',hat:'helm'},
   entry:[{if:'tmp:cv',n:'done'},{n:'s'}],
   tree:{
    s:{t:{d:"I guard a dead house for a living man. Walk on, spy. I did not see you.",favor:"Quill's friends get a blind eye. Walk on.",fear:"You scare me. I scare the candles. Go.",ruin:"The wax is running low. So is my loyalty."},c:[
      {l:"Pay him to desert (30)",to:'pay',cost:30,if:'!st:fear&!st:favor',fx:{drop:1,tmp:'cv'}},
      {l:"Leave your post. Now.",to:'threat',if:'st:fear',fx:{drop:1,tmp:'cv'}},
      {l:"Quill sent me.",to:'quill',if:'st:favor',fx:{drop:1,tmp:'cv'}},
      {l:"How do I fight him?",to:'fight',fx:{clue:["Candlemaker's Habit","He lights one candle for every crown she empties. Snuff them first. He hates the dark more than the thief."]}}]},
    pay:{t:"Thirty cinders and a cart. I will be at the harbor by midnight. Do not tell Nan."},
    threat:{t:"Yes. Yes, sir. I am gone."},
    quill:{t:"Then I'm done. Go. I never saw you."},
    fight:{t:"Snuff the candles. He burns brighter with each. He hates the dark more than the thief."},
    done:{t:"I am already gone."}}}],
 objs:[
  {id:'pl1',x:2,y:13,kind:'plaque',seq:0,icon:'plaque',label:'Touch the plaque',show:'q:memorial=0',need:.5},
  {id:'pl2',x:22,y:13,kind:'plaque',seq:1,icon:'plaque',label:'Touch the plaque',show:'q:memorial=0',need:.5},
  {id:'pl3',x:12,y:3,kind:'plaque',seq:2,icon:'plaque',label:'Touch the plaque',show:'q:memorial=0',need:.5},
  {id:'wicklever',x:22,y:5,kind:'lever',icon:'sconce',label:'Pull the wick chain',need:.7}],
 quests:[
  {id:'memorial',title:"The Hallow Memorial",desc:"Old Nan says three plaques remember the last Hallow, if touched in order.",steps:["Touch the plaques in order: west, east, north"],on:['obj:plaques'],
   rew:{cin:60,heal:9,gad:{smoke:2,bell:2},item:'hallow_wick'}}]}
];
