// Every word the story says, in one place: briefings, spoken lines, guard barks, ledger
// entries, endings and menu text. The game code looks lines up here, so rewriting the story
// means editing this file and nothing else.
//
// A line can be a plain string, or { keys, touch } when the wording depends on whether the
// player is on a keyboard or a touch screen. {braces} are filled in by the code.
// House of each mission, in order: Marrow, Grell, Ostrander, Sable, Kest, Dunmoor, Hallow.
'use strict';

const TEXT = {
  title: 'PLAIN WAX',
  tagline: 'A spy. A runt dragon. Seven feuding houses. One engineered war.',

  levels: [
    {
      // Ashfall Keep (House Marrow: cold, clipped, bureaucratic)
      intro: [
        'Six months ago you carried a letter across a border. A war started.',
        'Everyone remembers the courier. Nobody remembers who wrote it.',
        'Mother Quill of the Hollow Crown has offered you a way back in.',
        'House Marrow took an egg that belongs to her. Bring it home.',
        '',
        'Take the egg from the north-east tower, burn the beacon, leave by the gate.',
        {
          keys: 'Stay in shadow and walk softly. Sneak up behind a guard and hold E.',
          touch: 'Stay in shadow and walk softly. Hold still behind a guard to put him down.'
        }
      ],
      opening: 'Marrow stamps a bone on everything. Look for the bone.',
      labels: { O: 'Steal the egg', B: 'Burn the beacon' },
      barks: {
        lure: ['Report.', 'East wall.', 'Check it.'],
        lost: ['Gone.', 'Fan out.', 'Again.'],
        body: ['One down!', 'Find them.'],
        hear: ['Boots.', 'Hm.', 'Who.'],
        wake: 'Tch. My head.'
      }
    },
    {
      // Gallowmere (House Grell: loud, greedy, drunk on its own supply)
      intro: [
        'Lord Grell throws a feast every time he borrows money. Tonight the hall is full.',
        'The treaty on the head table is the one his lender wants signed.',
        'Swap its seal, spoil the wine cup before the toast, and burn the beacon.',
        {
          keys: 'Ashling has opinions about the food. Swap with TAB.',
          touch: 'Ashling has opinions about the food. Swap with the TAB button.'
        }
      ],
      opening: 'Sixty guests, one Grell. The cup with the gold rim is his.',
      labels: { O: 'Swap the seal', P: 'Poison his cup', B: 'Burn the beacon' },
      barks: {
        lure: ['Is that the toast?', 'Was that gold?'],
        lost: ['Gone! Search the pantry.', 'Where did they go?'],
        body: ['Somebody is asleep!', 'Sleeping on duty!'],
        hear: ['Hic. Who?', 'Is that the band?'],
        wake: 'Ow. Who moved the floor?'
      }
    },
    {
      // The Drowned Spire (House Ostrander: nautical and formal)
      intro: [
        'Ostrander rings a bell for the tide, for supper, and for the dead.',
        'Shiloh waits on the rocks with the forged letters. Ashling carries them.',
        'Burn four beacons. Drop the letters in two war rooms. Land on the green pad.',
        'Walls and water do not stop you. Searchlights and the patrol boat do.'
      ],
      opening: 'She hides on the rocks. I fly. Please note that.',
      labels: { P: 'Drop the letters', B: 'Burn four beacons' },
      barks: {
        lure: ['Off the port side.', 'Hail that.'],
        lost: ['Lost her.', 'Fog took her.'],
        body: ['Man down on deck!'],
        hear: ['Who is aloft?'],
        wake: 'My head is ringing.'
      }
    },
    {
      // Thornwick Abbey (House Sable: hushed; the monks mime instead of speaking)
      intro: [
        'Sable keeps a vow of silence. The monks keep it because they are paid to.',
        "The abbot's ledger shows who pays. It is behind a sealed door.",
        'Learn the Song of Opening at the lectern, then take the ledger.',
        'The Bell-Warden hears nothing but bells. Use one. Fire only hurts him from behind.',
        'When his bell tolls, stand still.'
      ],
      opening: "Sable's silence is paid for. Walk softly.",
      labels: { L: 'Learn the Song', O: 'Take the ledger', W: 'Silence the Warden' },
      barks: {
        lure: ['*points*', '*raps the wall*'],
        lost: ['*stares*', '*shakes head*'],
        body: ['*hisses*'],
        hear: ['*tilts head*'],
        wake: '*rubs head*'
      }
    },
    {
      // Ironvale (House Kest: blunt, hammer-hard, proud)
      intro: [
        'House Kest hammers iron and grudges. It holds Perrin Ostrander in a cell.',
        'Pick the cell lock, free him, burn the muster beacon, and walk him out.',
        'The vents belch fire on a beat. Ashling does not mind. Shiloh will.',
        '',
        'At the gate you decide what he is worth.'
      ],
      opening: 'The floor is breathing. Watch the vents.',
      labels: { H: 'Free Perrin', B: 'Burn the muster beacon' },
      barks: {
        lure: ['Hey.', 'Who is that?'],
        lost: ['Slipped us.', 'Hammer take it.'],
        body: ['Down! Man down!'],
        hear: ['Hm.', 'Who goes?'],
        wake: 'Ugh. Head.'
      }
    },
    {
      // Dunmoor Marsh (House Dunmoor: elegant, ironic, polite to a fault)
      intro: [
        'Lady Ottoline Dunmoor hosts a masked ball. In a back room, she hosts a war.',
        'While the ball lasts, plant the forged treaty at the head table.',
        {
          keys: 'Then find a pedestal and press F to play the Song of Time and see the hall after the war.',
          touch:
            'Then find a pedestal and tap F to play the Song of Time and see the hall after the war.'
        },
        'Take her signet from the ruined throne room, and burn the beacon, in either year.',
        '',
        'What you plant tonight decides which walls are still standing.'
      ],
      opening: 'Masks on. The crowd is cover. Find a pedestal when you are ready.',
      labels: { P: 'Plant the treaty (ball)', O: 'Take the signet (ruins)', B: 'Burn the beacon' },
      barks: {
        lure: ['How curious.', 'Not on the list.'],
        lost: ['How rude.', 'They have slipped away.'],
        body: ['Someone has fainted, dear!'],
        hear: ['Pardon?', 'Is someone there?'],
        wake: 'Oh. How undignified.'
      }
    },
    {
      // The Candlemaker's Crown (House Hallow, extinct: candle-lit and quiet)
      intro: [
        'House Hallow burned out thirty years ago. Someone keeps its hall lit.',
        'The Candlemaker was trained by the same hands as you. He knows your habits.',
        'Snuff all five candles. While one burns, he cannot be hurt.',
        'Then burn him from behind. When he blinks, the orange ring is where he lands.',
        '',
        'The throne waits at the far end. What you do there ends the war.'
      ],
      opening: 'Five candles. I know this trick. Quill taught it to both of us.',
      labels: { C: 'Snuff the candles', W: 'Defeat the Candlemaker' },
      barks: {
        lure: ['The candles lean.'],
        lost: ['The flame moved.'],
        body: ['A light went out.'],
        hear: ['Quiet. Listen.'],
        wake: 'The light is wrong.'
      }
    }
  ],

  // Spoken lines (and tip cards), by event.
  lines: {
    sneakHint: {
      keys: 'You walk like a dropped tray. Hold Shift to sneak.',
      touch: 'You walk like a dropped tray. Drag a short way to sneak.'
    },
    knockedOut: 'Sleep tight. Someone will find him, so keep moving.',
    bodyFound: 'They found him. Next time, pick a quieter corner.',
    nothingToOpen: 'Nothing close enough to open.',
    noSong: 'No song yet. The lectern first.',
    fluteLoud: 'Subtle. Real subtle.',

    eggCrate: 'No bone on the crate. Only a ring of plain wax, with nothing pressed in it.',
    hatch: 'Oh. I hatched. Nobody asked me first.',
    hatchTip: {
      keys: 'Swap with TAB. Hold SPACE to burn.',
      touch: 'Swap with the TAB button. Hold a second finger to burn.'
    },
    firstFire: 'Stand back. Properly back.',
    // chosen by mission: the first, the second, then these two in turn
    beacon: [
      'Beacon out. Please note who did that.',
      'Another one dark. I am keeping count.',
      'That one counts. Write it down.',
      'Beacon out. You are welcome.'
    ],

    sealSwapped: 'Seal swapped. Under the old one, a ring of plain wax. The same as the crate.',
    cupPoisoned: 'One cup. He will not finish the toast.',

    letterFirst:
      'Dropped. A receipt book lies open beside it. "S. Sallow, courier." That is her name.',
    letterSecond:
      'Seven receipts in one hand, all hers. Seven houses, one day. She will not like this.',
    flightDone: 'That is everything. Land on the pad.',
    groundDone: 'Objectives done. Get Shiloh to the gate.',

    songLearned: 'The Song of Opening. One note, any sealed door. It is not quiet.',
    ledger: 'Counting House gold, paid for silence about seven letters. One courier. Me.',
    tollWarning: 'Stand still when it tolls! I mean it!',
    tollHeard: 'It heard me move.',
    wardenDown: 'The bell is quiet. So is he. Mostly.',

    perrinFreed: 'You are the spy? You are shorter than I was told. Is that a lizard?',
    perrinReply: 'Dragon. Ashling. Write it down.',
    perrinClue: 'The courier who brought Kest its orders tied her satchel like that. Like yours.',
    vent: 'Hot. Very hot. For you, anyway.',

    toRuins: 'Three years on. A blank ring of wax hangs where the Dunmoor banner was.',
    toBall: 'Back at the ball. Everyone is still smiling.',
    treatyPlanted: 'Treaty planted. By morning every house will have a copy.',
    signet: 'Her signet. A note inside the case: "Do nothing until the treaty is found. Q."',
    signetAfter: 'I planted that treaty.',

    candleFirst: 'I light one for every crown she empties. Leave them.',
    candleLeft: 'Snuffed. {n} to go.',
    candleLast: 'The last candle. Now he has nowhere to hide.',
    shield: 'My fire just slides off him. It is the candles!',
    blinkTaunt: 'You look at the door first. She taught us both.',
    // the Candlemaker's last words, one after another
    dying: [
      'Burn it and she rebuilds.',
      'Crown it and she holds the strings.',
      'Break it, and she has nothing to hold.'
    ]
  },

  // What each house remembers after a mission: [house, kind, line]
  ledger: {
    marrow: ['marrow', 'fear', 'Marrow found an empty crate and no sign of how you got in.'],
    grellBribe: ['grell', 'favor', 'The steward remembers your coin.'],
    grellBlackmail: ['grell', 'fear', 'The chamberlain keeps your secret, for now.'],
    grellPoison: ['grell', 'ruin', 'Grell wakes to a signature he does not remember.'],
    ostranderFear: ['ostrander', 'fear', 'Every beacon on the sea road went dark in one night.'],
    ostranderRuin: [
      'ostrander',
      'ruin',
      'Forged letters set the admiralty against its own captains.'
    ],
    sableFear: ['sable', 'fear', 'The ledger is gone, and with it the reason for the silence.'],
    sableRuin: ['sable', 'ruin', 'The Bell-Warden is down. The abbey has no bell tonight.'],
    kest: ['kest', 'fear', 'Kest lost its best hostage and could not say how.'],
    ostranderHome: ['ostrander', 'favor', 'Their heir comes home, unharmed.'],
    ostranderKept: ['ostrander', 'fear', 'You hold their heir over their heads.'],
    dunmoorRuin: ['dunmoor', 'ruin', 'The treaty you planted is now the first page of their war.'],
    dunmoorFear: ['dunmoor', 'fear', 'Her signet is in your pocket.']
  },

  // The three endings. Each lists the lines the end screen shows, in order.
  endings: {
    puppet: {
      title: 'Ending: The Strings',
      first:
        'House {house} wears the crown. The strings run back to the Hollow Crown, as they always did.',
      afraid: 'The houses obey because they are afraid, not because they agree.',
      calm: 'The houses go along with it. Peace holds, for now.',
      thanked: 'A few of them even thank you. Shiloh does not sleep well anyway.',
      alone: 'Shiloh holds the strings and does not sleep well.',
      quill:
        "Quill's note is waiting at the palace. It says: Well done. It is exactly what she planned.",
      summary: 'House {house}: crowned, +1 Fear.'
    },
    burn: {
      title: 'Ending: The Bonfire Year',
      first:
        'Ashling burns the throne. Then the hall. Then, because nobody stops him, the portraits.',
      ruined: [
        'The houses you ruined along the way have nothing left to rebuild with.',
        'The marsh smolders for a generation.'
      ],
      bruised: 'The houses are bruised, not broken, and they rebuild fast.',
      joke: 'Ashling: In my defense, it was very flammable.',
      quill: 'Quill builds a new throne by spring. It looks very like the old one.',
      summary: 'Every house: +1 Ruin.'
    },
    break: {
      title: 'Ending: The Charter',
      first: 'Ashling, full grown, shatters the throne. No crown is left to fight over.',
      helped: [
        'The houses you helped meet in the rubble and draft a charter. It holds.',
        'It has seven signatures and one claw print. Ashling insists it be noted.'
      ],
      scramble: [
        'The houses scramble for order. It is a hard winter, but nobody has a crown to steal.',
        'Nobody drafts a charter. Ashling insists that be noted too.'
      ],
      last: 'Shiloh sends one last letter. This time she has read it.',
      summary: 'Every house: +1 Favor.'
    }
  },

  // Menu screens that carry story.
  menus: {
    court: {
      title: 'The Back Stairs',
      lines: [
        "Every house runs on its servants. Before Gallowmere, you may turn one of Grell's.",
        '',
        '1   Bribe the steward: one guard sleeps through the feast',
        '2   Blackmail the chamberlain: suspicion fades much faster',
        '3   Taint the wine: drowsy guards, shorter sight and slower steps',
        '',
        'Servants talk. Every favor you buy will be repeated.'
      ]
    },
    perrin: {
      title: 'Perrin Ostrander',
      lines: [
        'Perrin stands at the gate with the cell still on his wrists.',
        '',
        '1   Send him home to Ostrander: they will owe you.',
        '2   Keep him: they will pay, and they will not forget.',
        '',
        'Whatever you choose, Kest will not forget who emptied their cell.'
      ]
    },
    throne: {
      title: 'The Throne of Hallow',
      lines: [
        'The Candlemaker is dead. The throne is yours to decide.',
        '',
        '1   Crown a puppet: peace, held by strings',
        '2   Burn it all down: Ashling finishes what the war began',
        '3   Break the throne: no crown, no more wars',
        '',
        'There is no taking this back.'
      ],
      locked: '3   Break the throne (locked, needs {gems} ember gems, you have {have})'
    },
    standing: 'Standing: Favor {f}   Fear {e}   Ruin {r}',
    effects:
      'Suspicion fades {decay}% faster, guard sight -{sight}%, alert +{gain}%, guards fled {fled}',
    finale: 'Favor adds bells: {bells}. Fear removes guards: {guards}. Ruin: he starts at {hp} HP.'
  },

  // Shown when you are caught: [Shiloh, Ashling], one pair chosen at random.
  caught: [
    ['...that went poorly.', 'I said nothing. Loudly.'],
    ['I counted twelve guards.', 'There were thirteen.'],
    ['One step. I was one step away.', 'You were four steps away.'],
    ['I should have read the letter.', 'You always say that.']
  ]
};

// A line may differ between keyboard and touch; this picks the right wording.
function lineText(v) {
  return typeof v === 'string' ? v : TOUCH.used ? v.touch : v.keys;
}
// Fill {name} placeholders in a line.
function fill(s, vars) {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
}

// The per-mission text lives here and is attached to the level data.
LEVELS.forEach((l, i) => Object.assign(l, TEXT.levels[i]));
