// Level data: palettes, intros, gadget counts, maps (# wall, S start, X exit, g gem, D door, ...), guard routes.
'use strict';

const LEVELS = [
  {
    name: 'Ashfall Keep',
    house: 'House Marrow',
    pal: {
      f1: '#24202c',
      f2: '#282431',
      w: '#4a4458',
      wt: '#615a73',
      amb: 0.55,
      torch: 6,
      tab: '#d8d0c0',
      weather: 'ash'
    },
    intro: [
      'House Marrow keeps a stolen dragon egg in its north-east tower.',
      'Steal it, then burn the signal beacon so no alarm travels.',
      'Then slip out through the gate. Torchlight gives you away; keep to the shadows.',
      'Run and they hear you. Sneak up behind a guard and hold E to put him to sleep.',
      '',
      'Something in that egg is going to be very annoyed.'
    ],
    opening: 'Egg is in the north-east tower. Quiet feet.',
    labels: { O: 'Steal the dragon egg', B: 'Burn the signal beacon' },
    gadgets: { smoke: 3, bell: 3, flute: 1 },
    map: [
      '#########################',
      '#S...#.........#.......O#',
      '#....#....g....#........#',
      '#.........#....D........#',
      '####.######....#####.####',
      '#...........#...........#',
      '#.....g.....#.....g.....#',
      '#...........D...........#',
      '#####.#######...#########',
      '#...........#...........#',
      '#...........#.....B.....#',
      '#.....g.....D...........#',
      '#...........#...........#',
      '#X..........#...........#',
      '#########################'
    ],
    guards: [
      [
        [7, 2],
        [13, 2]
      ],
      [
        [17, 2],
        [22, 2],
        [22, 3],
        [17, 3]
      ],
      [
        [2, 5],
        [10, 5]
      ],
      [
        [14, 6],
        [22, 6]
      ],
      [
        [2, 10],
        [10, 10],
        [10, 12],
        [2, 12]
      ],
      [
        [14, 12],
        [22, 12]
      ]
    ]
  },
  {
    name: 'Gallowmere',
    house: 'House Grell',
    pal: {
      f1: '#4a3226',
      f2: '#4a3226',
      w: '#6b4a4a',
      wt: '#8a6262',
      amb: 0.4,
      torch: 4,
      tab: '#b8323a',
      floor: 'wood',
      weather: 'dust'
    },
    intro: [
      'Feast night at Gallowmere. Lord Grell is drunk on flattery.',
      'Swap the seal on the treaty, poison the wine cup,',
      'and burn the signal beacon. Then leave before the toast.',
      '',
      'Ashling is awake now. Press TAB to swap between you.'
    ],
    opening: 'Feast night. Seal, wine, beacon. Any order.',
    labels: { O: 'Swap the seal', P: 'Poison the wine cup', B: 'Burn the signal beacon' },
    gadgets: { smoke: 3, bell: 3, flute: 1 },
    bribeIdx: 4,
    map: [
      '#########################',
      '#S...#.....P.....#.....O#',
      '#....#...........#......#',
      '#....D...........D......#',
      '#....#.....g.....#......#',
      '##.#######.####.#########',
      '#.......#.....g.........#',
      '#...g...D...............#',
      '#.......#...............#',
      '###.#####.#####.#########',
      '#.......................#',
      '#..#...#.........#...#..#',
      '#.......................#',
      '#X.....................B#',
      '#########################'
    ],
    guards: [
      [
        [7, 2],
        [15, 2],
        [15, 4],
        [7, 4]
      ],
      [
        [19, 2],
        [22, 2],
        [22, 4],
        [19, 4]
      ],
      [
        [10, 7],
        [22, 7]
      ],
      [
        [1, 6],
        [7, 6]
      ],
      [
        [2, 10],
        [22, 10]
      ],
      [
        [2, 12],
        [22, 12]
      ]
    ]
  },
  {
    name: 'The Drowned Spire',
    house: 'House Ostrander',
    flight: true,
    pal: {
      f1: '#10303a',
      f2: '#123540',
      w: '#3f6f6a',
      wt: '#6fa89a',
      amb: 0.5,
      tab: '#2f6f8a',
      weather: 'rain'
    },
    intro: [
      'A sea fortress of bells and searchlights. Shiloh hides on the rocks.',
      'This one is a flight. You are Ashling, carrying her forged letters.',
      'Burn all four signal beacons. Drop the letters in two war rooms (hold E).',
      'Fly over walls and water. Searchlights sweep; boats patrol.',
      '',
      'Land on the green pad when done.'
    ],
    opening: 'Shiloh is hiding. I do the flying. Try not to look smug.',
    labels: { P: 'Plant the forged letters', B: 'Burn the four beacons' },
    gadgets: { smoke: 0, bell: 0, flute: 0 },
    map: [
      '.........................',
      '.S.......g.......g....B..',
      '....####.......####......',
      '....####...P...####......',
      '....####.......####.....X',
      '.........................',
      '..g.......####.......g...',
      'B.........####...........',
      '.........................',
      '....####...........####..',
      '....####....g......####..',
      '.........................',
      '..g.........P.......B....',
      '.B.......g..........g....',
      '.........................'
    ],
    guards: [
      [
        [1, 14],
        [23, 14]
      ]
    ],
    towers: [
      [12, 2, 1.57, 1],
      [20, 6, 3.14, -1],
      [6, 8, 0, 1],
      [15, 11, 1.57, -1],
      [3, 4, 0.5, 1]
    ]
  },
  {
    name: 'Thornwick Abbey',
    house: 'House Sable',
    quiet: true,
    song: true,
    pal: {
      f1: '#1c1a22',
      f2: '#201e27',
      w: '#3a3547',
      wt: '#524b66',
      amb: 0.62,
      torch: 8,
      tab: '#2c2238',
      weather: 'dust'
    },
    intro: [
      'Black-robed monks. A vow of silence. Footsteps carry here.',
      'Find the lectern and learn the Song of Opening on the bone flute.',
      "Then open the sealed door (F) and take the abbot's ledger.",
      'The Bell-Warden guards it. His bell tolls: freeze when it does.',
      '',
      'Fire only hurts him from behind. Lure him with the bell (R).'
    ],
    opening: 'Silence is law here. Sneak (Shift), or the monks will come looking.',
    labels: { L: 'Learn the Song of Opening', O: 'Take the ledger', W: 'Silence the Bell-Warden' },
    gadgets: { smoke: 3, bell: 5, flute: 0 },
    bellAt: [18.5, 5],
    map: [
      '#########################',
      '#..L..#......#........O.#',
      '#.....#...g..#..........#',
      '#.....#......#...g......#',
      '###D#####.####..........#',
      '#............#..........#',
      '#.....#......Z..........#',
      '#...g........#..........#',
      '#........#...#...g......#',
      '#............#..........#',
      '####.#####.##############',
      '#...........g...........#',
      '#.....#.........#.......#',
      '#S.....................X#',
      '#########################'
    ],
    guards: [
      [
        [8, 2],
        [11, 2],
        [11, 3],
        [8, 3]
      ],
      [
        [2, 5],
        [12, 5]
      ],
      [
        [2, 9],
        [11, 9]
      ],
      [
        [12, 7],
        [8, 7],
        [8, 9],
        [12, 9]
      ],
      [
        [3, 11],
        [11, 11]
      ],
      [
        [8, 13],
        [20, 13]
      ],
      [
        [14, 11],
        [22, 11]
      ],
      [
        [15, 9],
        [22, 9]
      ]
    ],
    boss: {
      wp: [
        [16, 3],
        [21, 3],
        [21, 7],
        [16, 7]
      ]
    }
  },
  {
    name: 'Ironvale',
    house: 'House Kest',
    choice: true,
    pal: {
      f1: '#2e2420',
      f2: '#2e2420',
      w: '#5a3a34',
      wt: '#7a4e44',
      amb: 0.45,
      torch: 7,
      tab: '#8a4a2a',
      floor: 'iron',
      weather: 'embers'
    },
    intro: [
      'House Kest holds Perrin Ostrander, heir to the Drowned Spire, in its foundry cells.',
      'Pick the cell lock (hold E on his door, then on him), burn the muster beacon,',
      'and walk him to the gate. Forge vents belch fire on a cycle:',
      'Ashling is fireproof. Shiloh is not.',
      '',
      'At the gate you decide what to do with him. The houses are watching.'
    ],
    opening: 'Foundry heat. Watch the vents, and keep Perrin close.',
    labels: { H: 'Free Perrin Ostrander', B: 'Burn the muster beacon' },
    gadgets: { smoke: 3, bell: 3, flute: 1 },
    map: [
      '#########################',
      '#X....#..........#....H.#',
      '#.....#....g.....#......#',
      '#.....#..........#...g..#',
      '#.....#..........#......#',
      '#.....#####.########D####',
      '#.....#.................#',
      '#.....#..#.....#....#...#',
      '#.......g..........g....#',
      '#.....#...V.........V...#',
      '#.....#.#.......#....#..#',
      '#.......V.......V.......#',
      '#.....#.......B.........#',
      '#S......................#',
      '#########################'
    ],
    guards: [
      [
        [8, 2],
        [15, 2],
        [15, 4],
        [8, 4]
      ],
      [
        [19, 3],
        [22, 3]
      ],
      [
        [8, 6],
        [22, 6]
      ],
      [
        [8, 8],
        [19, 8]
      ],
      [
        [12, 9],
        [12, 12]
      ],
      [
        [16, 11],
        [22, 11]
      ],
      [
        [3, 3],
        [3, 12]
      ],
      [
        [8, 13],
        [22, 13]
      ]
    ]
  },
  {
    name: 'Dunmoor Marsh',
    house: 'House Dunmoor',
    pal: {
      f1: '#1d2a3a',
      f2: '#2c3d5c',
      w: '#4a5f86',
      wt: '#7d95c4',
      amb: 0.48,
      torch: 5,
      tab: '#3d5a8f',
      floor: 'marble',
      weather: 'fog'
    },
    palRuin: {
      f1: '#241a16',
      f2: '#291e19',
      w: '#4a3a32',
      wt: '#6e5648',
      amb: 0.58,
      torch: 9,
      tab: '#5a4a3a',
      weather: 'ash'
    },
    intro: [
      'A masked ball in the marsh hall of House Dunmoor. Lanterns, fog, a crowd.',
      'Plant the forged treaty at the head table while the ball lasts (hold E).',
      'Then find a pedestal and play the Song of Time (F) to see the hall after the war.',
      "Take Lady Veyra's signet from the ruined throne room, and burn the muster beacon.",
      '',
      'Planting the treaty changes what survives: the throne room wall falls open.'
    ],
    opening: 'Masks on. The crowd is cover. Find a pedestal when you are ready to see the end.',
    labels: { P: 'Plant the treaty (ball)', O: 'Take the signet (ruins)', B: 'Burn the beacon' },
    gadgets: { smoke: 3, bell: 3, flute: 99 },
    map: [
      '#########################',
      '#B....#...........#.....#',
      '#..g..#...........#...O.#',
      '#.....#.....P.....#.....#',
      '#.................#.....#',
      '#.....#...g.......#.....#',
      '#..T..#...........#######',
      '#.....#...........#.....#',
      '#.....#...........#..g..#',
      '#.......................#',
      '#.....#...........#..T..#',
      '#.g...#..........T#.....#',
      '###.#####.###########.###',
      '#S.....................X#',
      '#########################'
    ],
    guards: [
      [
        [8, 2],
        [16, 2]
      ],
      [
        [8, 5],
        [16, 5]
      ],
      [
        [8, 8],
        [16, 8]
      ],
      [
        [8, 10],
        [15, 10]
      ],
      [
        [2, 2],
        [2, 10]
      ],
      [
        [19, 7],
        [23, 7]
      ],
      [
        [2, 13],
        [22, 13]
      ],
      [
        [19, 11],
        [23, 11]
      ]
    ],
    timeshift: {
      guests: [
        [
          [8, 4],
          [16, 4]
        ],
        [
          [16, 6],
          [8, 6]
        ],
        [
          [9, 7],
          [15, 7]
        ],
        [
          [12, 9],
          [8, 9]
        ],
        [
          [12, 2],
          [12, 10]
        ],
        [
          [14, 9],
          [10, 3]
        ]
      ],
      ruin: {
        open: [[21, 6]],
        openIfPlanted: [[18, 2]],
        block: [
          [10, 6],
          [11, 6],
          [12, 6],
          [13, 6],
          [14, 6],
          [13, 7],
          [10, 8],
          [9, 5]
        ],
        vents: [
          [21, 8],
          [20, 10],
          [22, 7]
        ],
        guards: [
          [
            [8, 3],
            [16, 3]
          ],
          [
            [8, 9],
            [16, 9]
          ],
          [
            [19, 4],
            [23, 4]
          ],
          [
            [2, 13],
            [22, 13]
          ]
        ]
      }
    }
  },
  {
    name: "The Candlemaker's Crown",
    house: 'House Hallow (extinct)',
    finale: true,
    exitLabel: 'THRONE',
    pal: {
      f1: '#2a2216',
      f2: '#2f2619',
      w: '#4d4030',
      wt: '#7a6a48',
      amb: 0.3,
      tab: '#6a5a3a',
      weather: 'embers'
    },
    intro: [
      'A ruined hall lit by five candles that never gutter. He knows every trick you know.',
      'Snuff all five candles (hold E). While one burns, he cannot be hurt.',
      'Then burn him from behind with Ashling. He blinks: the orange mark is where he lands.',
      'Reach the throne to decide how the war ends.'
    ],
    opening: 'Five candles. Snuff them all, and he has nowhere to hide.',
    labels: { C: 'Snuff the candles', W: 'Defeat the Candlemaker' },
    gadgets: { smoke: 3, bell: 3, flute: 0 },
    map: [
      '#########################',
      '#.........#.X.#.........#',
      '#....g....#...#....g....#',
      '#..C......#...#......C..#',
      '#.......................#',
      '#.......g.......g.......#',
      '#..##...............##..#',
      '#..##.......C.......##..#',
      '#.......................#',
      '#.........#..g..#.......#',
      '#.......................#',
      '#..C.................C..#',
      '#.......................#',
      '#...........S...........#',
      '#########################'
    ],
    guards: [
      [
        [2, 2],
        [8, 2]
      ],
      [
        [16, 2],
        [22, 2]
      ],
      [
        [2, 9],
        [2, 12]
      ],
      [
        [22, 9],
        [22, 12]
      ],
      [
        [7, 12],
        [17, 12]
      ]
    ],
    boss: {
      kind: 'candle',
      wp: [
        [7, 6],
        [17, 6],
        [17, 10],
        [7, 10]
      ]
    }
  }
];
