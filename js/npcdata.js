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
  {id:'sera',name:'Sera',role:'Masked maid',x:16,y:4,look:{k:'servant',skin:'#e8c8a8',cloth:'#6a3a5a',trim:'#e8d8c0',hat:'cap',apron:1,mask:1},
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

/* ================= THE ROOKERY (home base) =================
   Extra condition tokens (hub and missions): aff:npc>=N aff:npc<=N  ch:chain=N|none|active|done|failed  ch:chain>=N
   lv>=N lv<=N lv=N (the mission you set out for next)
   Extra fx: aff:[npc,n] chstart chadv chdone chfail ch:[chain,step] doc stash:{smoke,bell} hub:<action> abil xp wager */
const HUBMAP=[
"###########################",
"#.........#.......#.......#",
"#.........#.......#.......#",
"#.........#.......#.......#",
"#.........#.......#.......#",
"#.........#.......#.......#",
"####..#####...#...###..####",
"#.........................#",
"#.........................#",
"#.........................#",
"####..#####.......###..####",
"#.........#.......#.......#",
"#.........#.......#.......#",
"#.........#...S...#.......#",
"#.........#.......#.......#",
"#.........#...X...#.......#",
"###########################"];
const HUBPEOPLE={maud:'Maud Tallow',brann:'Serjeant Brann',needle:'Needle',odalys:'Odalys Fenn',hesper:'Old Hesper',corvin:'Corvin Vane'};
const HUBROLE={maud:'Quartermaster',brann:'Trainer',needle:'Informant',odalys:'Archivist',hesper:'Dragon-keeper',corvin:'Rival'};
const AFFNAME=a=>a>=4?'Sworn friend':a>=2?'Trusted':a>=1?'Warm':a<=-2?'Lost':a<=-1?'Cold':'Wary';
/* documents for the library wall */
const HUBDOCS={
 wick_satchel:["Wick's Satchel","Seven receipts, one hand. Wick carried for Grell, for Ostrander and for someone who signs only with a ring of plain wax. The last receipt reads: 'Deliver to the abbey cells. Do not wait for a reply.'"],
 hostage:["A Letter Under the Door","'To the woman at the Rookery forge. We hold Tobin Tallow in the Ironvale cells. He hammers for Kest now. Send the spy away from the houses and he keeps his hands.' No seal. A ring of plain wax."],
 tobin:["Tobin's Reply","'Maud. They write what I owe in a ledger at Dunmoor: bread, chains, the air I breathe. While that book exists I am theirs wherever I run. Burn it. T.'"],
 seal_notes:["On the Blank Ring","Odalys Fenn's notes: the plain wax ring is not the absence of a seal. It is a seal. Pressed with a die cut from bell-bronze, cooled in ash. Whoever owns the die can speak for any house."],
 hesper_song:["Keeper's Rhyme","'Moss for the cold, bronze for the heat, a runt grows slow but a runt grows sweet.' Hesper sings it badly, to a dragon who pretends not to listen."],
 wager_book:["Corvin's Wager Book","Two columns. 'Shiloh: caught' and 'Shiloh: clean'. The clean column is longer than he lets on."]};
/* multi-mission chains. steps[n] is the objective while the chain is at step n. by[n]=mission index: if that mission ends with the chain still at step n it fails. */
const CHAINS={
 courier:{title:'The Missing Courier',house:'grell',giver:'needle',desc:"Needle's courier Wick walked into Gallowmere and never walked out.",
  steps:["Look for Wick's satchel in Gallowmere Hall","Bring the satchel back to Needle at the Rookery","Spring Wick's cell in Thornwick Abbey","Tell Needle that Wick is free"],
  by:{0:1,2:3},fail:{0:"The trail in Gallowmere went cold. Wick is gone.",2:"Thornwick emptied its cells. Wick was not seen again."},failFx:{0:{aff:['needle',-1]},2:{aff:['needle',-2]}},
  reward:"Courier's Red Band, cinders, and Needle marks every hidden passage."},
 seal:{title:'The Forged Seal',house:'sable',giver:'odalys',desc:"Odalys wants to copy the blank ring that starts wars.",
  steps:["Press wax onto a sealed writ in Thornwick Abbey","Bring the impression to Odalys","Temper a die blank at Ironvale with Ashling's fire","Return the die to Odalys"],
  by:{0:3,2:4},fail:{0:"No impression, no copy. The writs were burned at dawn.",2:"The blank cracked cold. Odalys cannot cut a die from it."},failFx:{0:{aff:['odalys',-1]},2:{aff:['odalys',-1]}},
  reward:"A forged order sends one guard away in every house, or a fat purse if you sell it."},
 hostage:{title:'The Hostage Letter',house:'kest',giver:'maud',desc:"Kest holds Maud's brother Tobin to make you stop.",
  steps:["Slip a file into Tobin's cell at Ironvale","Bring Tobin's reply home to Maud","Burn the ransom ledger at Dunmoor with Ashling's fire","Tell Maud it is done"],
  by:{0:4,2:5},fail:{0:"Tobin was moved before you reached him. Maud has stopped singing at the forge.",2:"The ledger survives. Tobin is out of the cell but never out of debt."},failFx:{0:{aff:['maud',-2],flag:'maud_grief'},2:{aff:['maud',-1]}},
  reward:"Maud's Own blade and kin prices at the forge."},
 rookery:{title:'A Proper Roost',house:'hallow',giver:'hesper',desc:"Old Hesper says a dragon who sleeps on sacking stays a runt.",
  steps:["Gather ember-moss in Gallowmere or Thornwick","Bring the moss to Hesper","Pry a shard of bell-bronze at Ironvale or Dunmoor","Bring the bronze to Hesper"],
  by:{},fail:{},failFx:{},
  reward:"Ashling gains a second dash charge, then a heart, and the Brood Band."}};
/* objects the chains add to missions; placed on a reachable floor tile, `far` = how deep into the map (0..1) */
const CHAINOBJ={
 1:[{id:'c_satchel',kind:'item',icon:'satchel',label:"Take Wick's satchel",need:.8,show:'ch:courier=0',fx:{chadv:'courier',doc:'wick_satchel'},far:.62},
    {id:'c_moss',kind:'item',icon:'moss',label:'Gather ember-moss',need:.8,show:'ch:rookery=0',fx:{chadv:'rookery'},far:.38}],
 3:[{id:'c_wick',kind:'item',icon:'celldoor',label:"Spring Wick's cell",need:1.4,show:'ch:courier=2',fx:{chadv:'courier',flag:'wick_free'},far:.7},
    {id:'c_wax',kind:'item',icon:'wax',label:'Press wax on the writ',need:1,show:'ch:seal=0',fx:{chadv:'seal'},far:.45},
    {id:'c_moss',kind:'item',icon:'moss',label:'Gather ember-moss',need:.8,show:'ch:rookery=0',fx:{chadv:'rookery'},far:.25}],
 4:[{id:'c_file',kind:'item',icon:'celldoor',label:"Slip a file to Tobin",need:1.2,show:'ch:hostage=0',fx:{chadv:'hostage',doc:'tobin'},far:.66},
    {id:'c_die',kind:'burn',icon:'die',label:'Die blank (burn)',show:'ch:seal=2',fx:{chadv:'seal'},far:.5},
    {id:'c_bronze',kind:'item',icon:'bronze',label:'Pry the bronze shard',need:1,show:'ch:rookery=2',fx:{chadv:'rookery'},far:.3}],
 5:[{id:'c_ledger',kind:'burn',icon:'book',label:'Ransom ledger (burn)',show:'ch:hostage=2',fx:{chadv:'hostage'},far:.6},
    {id:'c_bronze',kind:'item',icon:'bronze',label:'Pry the bronze shard',need:1,show:'ch:rookery=2',fx:{chadv:'rookery'},far:.35}]};
/* notice board contracts: judged when the next mission is won */
const BOUNTIES=[
 {id:'ghost',title:'Ghost Work',desc:'Win the next mission without being spotted once.',pay:90,test:g=>g.st.detect===0},
 {id:'magpie',title:'Magpie Work',desc:'Find at least two secrets in the next mission.',pay:70,test:g=>g.secretsFound>=2},
 {id:'clean',title:'Clean Hands',desc:'Win the next mission with rank A or better.',pay:80,test:g=>g.rank==='S'||g.rank==='A'},
 {id:'swift',title:'Swift Work',desc:'Win the next mission in under four minutes.',pay:70,test:g=>g.time<240}];
const HUBDATA={house:null,
 npcs:[
 {id:'maud',name:'Maud Tallow',role:'Quartermaster',x:3,y:12,look:{k:'merchant',skin:'#d8a880',cloth:'#7a4a2a',trim:'#e0b060',hat:'cap',apron:true},
  entry:[{if:'aff:maud<=-2',n:'cold'},{if:'ch:hostage=3',n:'done'},{if:'ch:hostage=1',n:'reply'},{if:'flag:hostage_seen&ch:hostage=none&!flag:maud_told',n:'letter'},{n:'s'}],
  tree:{
   s:{t:{d:"Bench is hot, stock is honest. What do you need, Shiloh?",favor:"The houses speak well of you, so the carters give me credit. Prices are down. Enjoy it.",fear:"Carters cross the street when they hear your name. Stock costs me more now, so it costs you more.",ruin:"Half the city is selling its silver for bread. I buy cheap. I am not proud of it."},c:[
    {l:"Show me the gear.",fx:{hub:'shop'}},
    {l:"Smoke powder for the next job.",cost:35,shop:1,to:'sold',fx:{stash:{smoke:1}}},
    {l:"A whisper bell for the next job.",cost:30,shop:1,to:'sold',fx:{stash:{bell:1}}},
    {l:"Anything put aside for me?",if:'aff:maud>=2&!flag:maud_gift',to:'gift',fx:{flag:'maud_gift',item:'clasp',alt:{cin:60}}},
    {l:"How is the forge?",to:'chat',once:'maudchat',fx:{aff:['maud',1]}},
    {l:"Leave",end:1}]},
   sold:{t:"Packed by the door. It goes out with you.",c:[{l:"More.",to:'s'},{l:"Leave",end:1}]},
   gift:{t:"I kept this back from the last crate. Do not tell Corvin, he will say I have favourites. I do."},
   chat:{t:{d:"Drawing well. Ashling keeps trying to help. I let her light it once a day, it makes her feel tall.",ruin:"Busy. Ruined houses sell good iron cheap. I would rather they did not have to."}},
   letter:{t:"You found a letter under my door? Give it here. ... Tobin. They have my brother at Ironvale. Because of us. Because of this place.",c:[
    {l:"I will get word to him. I promise.",to:'vow',fx:{chstart:'hostage',flag:'maud_told',aff:['maud',1]}},
    {l:"I cannot promise. But I will look.",to:'vow2',fx:{chstart:'hostage',flag:'maud_told'}}]},
   vow:{t:"Then take this file. Flat enough to pass under a cell door. He will know my mark on it."},
   vow2:{t:"Honest, at least. Take this file. Pass it under his door if you see it."},
   reply:{t:"He wrote back? Read it to me. ... A ledger at Dunmoor. Paper. They hold a man with paper. Burn it, Shiloh. Let the little one do it.",fx:{chadv:'hostage'}},
   done:{t:"It is ash? Then Tobin owes nobody. Here. I forged this for myself, years ago, for the day I would go and fetch him. You went instead.",fx:{chdone:'hostage',item:'maudsown',alt:{cin:150},flag:'maud_kin',aff:['maud',2]}},
   cold:{t:"Coin on the bench, goods off it. That is all we are now.",c:[{l:"Show me the gear.",fx:{hub:'shop'}},{l:"Pay toward a marker for Tobin. (Make amends)",cost:60,to:'mend',fx:{aff:['maud',1]}},{l:"Leave",end:1}]},
   mend:{t:"Sorry is cheap. Sixty cinders toward a marker for him is not. ... It is a start."}}},
 {id:'brann',name:'Serjeant Brann',role:'Trainer',x:8,y:4,look:{k:'guard',skin:'#b88868',cloth:'#4a5568',trim:'#c0c8d8',hat:'none'},
  entry:[{if:'aff:brann<=-2',n:'cold'},{if:'aff:brann>=4&!flag:brann_gift',n:'gift'},{if:'aff:brann>=2&!flag:brann_riposte',n:'teach'},{n:'s'}],
  tree:{
   s:{t:{d:"Dummies do not hit back. Everything else will. Three clean combos and I will call it a drill.",fear:"They fear you out there. Fear makes a guard swing early. Use it. Three clean combos.",favor:"Friends in the houses will not parry for you. Three clean combos."},c:[
    {l:"What do I get for drilling?",to:'what'},
    {l:"Leave",end:1}]},
   what:{t:"Mastery. Every blow on the straw is worth a little, up to a point each visit. Ashling can scorch them too. Finish a full drill and I will remember it."},
   teach:{t:"You have drilled enough to stop thinking about your feet. Good. Now learn the turn of the wrist that makes a parry into a kill.",fx:{flag:'brann_riposte',abil:'riposte',xp:60}},
   gift:{t:"Twenty years I carried this. It kept my hide whole at Dunmoor Bridge. You will need it more than my wall does.",fx:{flag:'brann_gift',item:'hearthstone',alt:{cin:120}}},
   cold:{t:"You have been getting caught. I do not train corpses. Win a mission with rank B or better and we will talk.",c:[{l:"Leave",end:1}]}}},
 {id:'odalys',name:'Odalys Fenn',role:'Archivist',x:16,y:2,look:{k:'scribe',skin:'#c8a080',cloth:'#3a4a6a',trim:'#d8d0b8',hat:'hood'},
  entry:[{if:'ch:seal=3',n:'die'},{if:'ch:seal=1',n:'wax'},{if:'aff:odalys<=-2',n:'cold'},{if:'lv>=2&lv<=3&ch:seal=none',n:'offer'},{n:'s'}],
  tree:{
   s:{t:{d:"Everything you bring back goes on the wall. Letters, scrolls, lies. Especially lies. They are the best record of what people wanted.",fear:"The houses are frightened, and frightened people burn their papers. Bring me what you can before it is all smoke."},c:[
    {l:"What should I be reading?",to:'hint'},
    {l:"Tell me about the plain wax ring.",to:'ring',once:'ring',fx:{doc:'seal_notes',aff:['odalys',1]}},
    {l:"Leave",end:1}]},
   hint:{t:"The wall behind me. Every scroll you find in the houses is copied there, and every clue from your case file. Read them together. Patterns hide in the gaps."},
   ring:{t:"It is not an absence. It is a seal, cut by someone who wants no name on the war. I have written what I know. It is on the wall."},
   offer:{t:"I can copy the blank ring. I need two things. First an impression: press this wax to any sealed writ in Thornwick Abbey. Will you?",c:[
    {l:"Give me the wax.",to:'yes',fx:{chstart:'seal'}},{l:"Forgery is how this war started.",to:'no',fx:{tmp:'seal_no'}}]},
   yes:{t:"Soft wax, hard seal, count to five. Do not let the monks hear you breathe."},
   no:{t:"Yes. That is rather the point. Come back if you change your mind before Thornwick."},
   wax:{t:"A clean impression. Now the die. I need a blank of bell-bronze tempered in dragonfire, not forge fire. There are blanks on the racks at Ironvale. Have Ashling breathe on one.",fx:{chadv:'seal',aff:['odalys',1]}},
   die:{t:"It is done. One die, and with it any house's order can be written. What do we do with a thing like this?",c:[
    {l:"Keep it here. Use it sparingly.",to:'keep',fx:{chdone:'seal',flag:'forged_seal',aff:['odalys',2],abil:'forged_order'}},
    {l:"Corvin can sell copies. We need the coin.",to:'sell',fx:{chdone:'seal',flag:'seal_sold',cin:220,aff:['odalys',-3],h:['dunmoor','fear',1]}}]},
   keep:{t:"Then before each job I will write one small order. A guard reassigned. Nothing anyone will question until it is too late."},
   sell:{t:"Then we are couriers of the same war we are trying to stop. Take your coin. I will be at the wall. Do not talk to me for a while."},
   cold:{t:"The wall is there. Read it yourself.",c:[{l:"Buy three copies back. (Make amends)",cost:80,to:'mend',fx:{aff:['odalys',1]}},{l:"Leave",end:1}]},
   mend:{t:"Eighty cinders buys three of the copies back. It is not forgiveness. It is arithmetic."}}},
 {id:'hesper',name:'Old Hesper',role:'Dragon-keeper',x:20,y:4,look:{k:'servant',skin:'#c89878',cloth:'#5a6a3a',trim:'#e0c060',hat:'hood'},
  entry:[{if:'aff:hesper<=-2',n:'cold'},{if:'ch:rookery=3',n:'bronze'},{if:'ch:rookery=1',n:'moss'},{if:'ch:rookery=none',n:'offer'},{n:'s'}],
  tree:{
   s:{t:{d:"She ate, she slept, she set fire to one small thing. A good day, for a dragon.",ruin:"She smells the smoke on you when you come home from a ruined house. She will not say so. Neither will I."},c:[
    {l:"How is she growing?",to:'grow'},
    {l:"Sing her the rhyme.",to:'rhyme',once:'rhyme',fx:{doc:'hesper_song',aff:['hesper',1]}},
    {l:"Leave",end:1}]},
   grow:{t:"Gems feed the fire. The roost feeds the bones. Use the perch: she chooses what to become there. I only sweep up after."},
   rhyme:{t:"Moss for the cold, bronze for the heat. There. She pretended not to listen. Her tail kept time."},
   offer:{t:"Sacking. You have a dragon sleeping on sacking. I kept the royal brood, girl, before there was no royal anything. Bring me ember-moss from a great house's cellar and I will show you a roost.",c:[
    {l:"I will look for it.",to:'ok',fx:{chstart:'rookery',aff:['hesper',1]}},{l:"She is fine as she is.",fx:{tmp:'roost_no'}}]},
   ok:{t:"Grey-green, warm to the hand, grows where a chimney leaks. Gallowmere has it. So does the abbey."},
   moss:{t:"That is the stuff. Feel that? Holds heat like a held breath. Now.",c:[
    {l:"Line the roost with it.",to:'lined',fx:{chadv:'rookery',flag:'roost1',abil:'ember_roost',aff:['hesper',1]}},
    {l:"Corvin offered forty cinders for it.",to:'sold',fx:{cin:40,aff:['hesper',-2],ch:['rookery',0]}}]},
   lined:{t:"There. Look at her. A warm roost and she will wake with a second wind in her. Next: bell-bronze, to hold the heat through winter. The forges have it. So do the Dunmoor chandeliers."},
   sold:{t:"You sold a dragon's bed for forty cinders. Go and find more. And think about what you are, while you look."},
   bronze:{t:"Bell-bronze. I have not held any since the old mews burned. Help me set it under the moss. ... Done. She will grow a stouter heart on that. And this was the brood-master's. It is hers now.",fx:{chdone:'rookery',flag:'roost2',item:'broodband',alt:{cin:120},aff:['hesper',2]}},
   cold:{t:"I will see to the dragon. You see to yourself.",c:[{l:"Muck out the roost with her. (Make amends)",to:'mend',once:'hmend',fx:{aff:['hesper',1]}},{l:"Leave",end:1}]},
   mend:{t:"Hm. You hold a shovel better than I expected."}}},
 {id:'needle',name:'Needle',role:'Informant',x:24,y:12,look:{k:'servant',skin:'#e0c0a0',cloth:'#3a2a3a',trim:'#b04a6a',hat:'hood'},
  entry:[{if:'aff:needle<=-2',n:'cold'},{if:'ch:courier=3',n:'free'},{if:'ch:courier=1',n:'satchel'},{if:'ch:courier=none&lv<=1',n:'offer'},{n:'s'}],
  tree:{
   s:{t:{d:"I sell what people whisper. You look like someone who wants to buy.",favor:"Your friends in the houses gossip to me for nothing now. I pass the saving on. Mostly.",fear:"Nobody talks about you. They are too frightened. That makes my work dear."},c:[
    {l:"Mark the hidden way in the next house.",if:'!flag:needle_maps',cost:25,shop:1,to:'tip',once:'tip',fx:{stash:{tip:1}}},
    {l:"What do they say about me?",to:'say'},
    {l:"Who is Corvin, really?",if:'aff:needle>=2',to:'corvin',once:'ncorv'},
    {l:"Leave",end:1}]},
   tip:{t:"Paid. I have marked the hidden way on your map for the next job. Look for the seam in the wall."},
   say:{t:{d:"That you are careful. From a spy, that is the only compliment.",favor:"That you keep your word. Dangerous reputation. People will start expecting it.",fear:"That doors open when you look at them. I would be careful what you become.",ruin:"That houses fall down behind you. Some of them deserved it."}},
   corvin:{t:"Quill trained him the year before she trained you. He was the one she kept. Ask yourself why she let you go."},
   offer:{t:"My courier Wick went into Gallowmere Hall with a full satchel and did not come out. Find the satchel and I will know who took him.",c:[
    {l:"I will look for it.",to:'ok',fx:{chstart:'courier',aff:['needle',1]}},{l:"I am not a finder of lost boys.",fx:{tmp:'courier_no'}}]},
   ok:{t:"Red strap, brass buckle. He would have hidden it somewhere deep in the hall when he knew he was followed."},
   satchel:{t:"That is his. Give it here and I will read where he was sent.",c:[
    {l:"It is yours.",to:'cells',fx:{chadv:'courier',aff:['needle',1]}},
    {l:"Corvin offered eighty cinders for it.",to:'sold',fx:{chfail:'courier',cin:80,aff:['needle',-3],flag:'satchel_sold'}}]},
   cells:{t:"The abbey cells. Thornwick. They are keeping him quiet until the war starts. Spring his door if you pass it."},
   sold:{t:"Then Wick is worth eighty cinders to you. I will remember the price. So will every runner in this city."},
   free:{t:"He is by the fire, eating my bread. You brought back one of mine. Nobody does that. Take his band, he wants you to have it. And from now on I mark every hidden way for you, free.",fx:{chdone:'courier',item:'courierband',alt:{cin:120},cin:120,flag:'needle_maps',aff:['needle',2]}},
   cold:{t:"I have nothing to sell you.",c:[{l:"Pay Wick's blood-price. (Make amends)",cost:100,to:'mend',fx:{aff:['needle',2]}},{l:"Leave",end:1}]},
   mend:{t:"A hundred cinders to his mother. It does not bring him back. It means I will take your coin again."}}},
 {id:'corvin',name:'Corvin Vane',role:'Rival',x:20,y:14,show:'!flag:corvin_gone',look:{k:'servant',skin:'#d0b090',cloth:'#2a3a4a',trim:'#70c0d0',hat:'none'},
  entry:[{if:'aff:corvin>=3&!flag:corvin_ally',n:'ally'},{if:'flag:corvin_ally',n:'friend'},{n:'s'}],
  tree:{
   s:{t:{d:"Shiloh. Still alive. I had money on that, as it happens. Care to make it interesting?",fear:"They are afraid of you now. I remember when that was my job.",favor:"Friends in every house. How sweet. Friends are just marks who have not been asked yet."},c:[
    {l:"A wager: rank A or better next time.",if:'!flag:wager_on',cost:40,to:'bet',fx:{wager:1}},
    {l:"Why do you stay here?",to:'why',once:'cwhy',fx:{aff:['corvin',1],doc:'wager_book'}},
    {l:"Stay out of my way.",to:'rude',once:'crude',fx:{aff:['corvin',-1]}},
    {l:"Leave",end:1}]},
   bet:{t:"Forty says you trip an alarm. Double back if you come home clean. Do try. I hate winning easy."},
   why:{t:"Because Quill is out there, and this is the only roof she has not bought. Do not read into it."},
   rude:{t:"There she is. I was worried you had gone soft."},
   ally:{t:"I have lost enough wagers to you that I find I do not mind. Here. A key to the couriers' caches. There is one near every house. Use them.",fx:{flag:'corvin_ally',aff:['corvin',1],abil:'courier_cache'}},
   friend:{t:"The cache will be stocked. Smoke and a bell. Try not to need them.",c:[
    {l:"A wager: rank A or better.",if:'!flag:wager_on',cost:40,to:'bet',fx:{wager:1}},{l:"Leave",end:1}]}}},
 {id:'wick',name:'Wick',role:'Courier',x:23,y:14,show:'ch:courier>=3',look:{k:'servant',skin:'#e8c8a0',cloth:'#6a3030',trim:'#d04040',hat:'cap',small:true,pack:true},
  entry:[{if:'tmp:wick_bell',n:'again'},{n:'s'}],
  tree:{s:{t:"I run for you now, if you will have me. I left a bell in your kit. I know which doors squeak in every house in the city.",fx:{stash:{bell:1},tmp:'wick_bell'},c:[{l:"Welcome home, Wick.",end:1}]},
        again:{t:"Kit is packed. Go quiet."}}},
 {id:'hale',name:'Hale',role:'Freed sailor',x:3,y:8,show:'flag:hale_free',look:{k:'servant',skin:'#d8b890',cloth:'#4a6a88',trim:'#2a3a50',hat:'none'},
  tree:{s:{t:"You cut my chain, I sweep your floor. Fair trade. The Spire's sailors drink to you, quietly."}}},
 {id:'tam',name:'Tam',role:'Pot-boy',x:6,y:8,show:'flag:tam_safe',look:{k:'servant',skin:'#e8c8a0',cloth:'#7a6a40',trim:'#d8c8a0',hat:'cap',small:true},
  tree:{s:{t:"Maud lets me work the bellows! Ashling lets me scratch behind the horn. Nobody here sells anybody."}}},
 {id:'refugee',name:'Dispossessed Clerk',role:'Refugee',x:20,y:8,show:'st:ruin',look:{k:'servant',skin:'#c8b098',cloth:'#5a5a5a',trim:'#8a8a8a',hat:'none'},
  tree:{s:{t:"My house fell. They say you were seen there the night before. I am not accusing. I have nowhere else to sleep.",c:[{l:"Give him a little.",cost:20,to:'ty',once:'alms',fx:{aff:['hesper',1]}},{l:"Leave",end:1}]},ty:{t:"Hesper said you were not what they say. Thank you."}}},
 {id:'envoy',name:'Nervous Envoy',role:'Sent with tribute',x:17,y:8,show:'st:fear',look:{k:'merchant',skin:'#e0c8b0',cloth:'#5a2a4a',trim:'#e0c060',hat:'cap'},
  tree:{s:{t:"My lord sends this purse and asks, respectfully, that his house not be next.",c:[{l:"Take the purse.",once:'trib',to:'took',fx:{cin:45}},{l:"Keep it. Tell him to behave.",once:'trib',to:'left',fx:{aff:['hesper',1]}},{l:"Leave",end:1}]},took:{t:"Of course. Of course. I will tell him you were gracious."},left:{t:"I... yes. I will tell him exactly that."}}},
 {id:'steward',name:'Grateful Steward',role:'Sent with thanks',x:10,y:8,show:'st:favor',look:{k:'servant',skin:'#d8b890',cloth:'#3a5a3a',trim:'#e0c060',hat:'cap'},
  tree:{s:{t:"My mistress sends bread, lamp oil and her regards. The houses that owe you will not see your people go hungry.",c:[{l:"Thank her for me.",once:'thx',to:'ty',fx:{stash:{smoke:1}}},{l:"Leave",end:1}]},ty:{t:"And a pinch of smoke powder from her own cellar. For the road."}}}
 ],
 objs:[
  {id:'h_door',kind:'hub',use:'door',icon:'door',label:'Set out',x:14,y:15,need:.5},
  {id:'h_board',kind:'hub',use:'board',icon:'board',label:'Read the notice board',x:24,y:7,need:.3},
  {id:'h_lib',kind:'hub',use:'library',icon:'shelf',label:'Read the library wall',x:12,y:1,need:.3},
  {id:'h_case',kind:'hub',use:'case',icon:'casetable',label:'Study the case file',x:14,y:3,need:.3},
  {id:'h_bench',kind:'hub',use:'bench',icon:'bench',label:'Equipment bench',x:7,y:12,need:.3},
  {id:'h_perch',kind:'hub',use:'perch',icon:'perch',label:"Ashling's perch",x:23,y:2,need:.3},
  {id:'h_letter',kind:'hub',use:'letter',icon:'letter',label:'A letter under the door',x:2,y:14,need:.4,show:'lv>=3&lv<=4&!flag:hostage_seen'},
  {id:'h_d1',kind:'dummy',icon:'dummy',label:'',x:3,y:2},{id:'h_d2',kind:'dummy',icon:'dummy',label:'',x:6,y:2},{id:'h_d3',kind:'dummy',icon:'dummy',label:'',x:4,y:4}
 ]};
