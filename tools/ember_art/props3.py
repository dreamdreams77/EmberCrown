"""Ashfall's second furniture set: the long mess table, the kitchen cauldron and hearth, a bookcase of ledgers, the bone altar,
a coal heap, a lectern, a tool rack and a broken column. Same painter, same ink, same light."""
import random, math
import numpy as np
from pix import *
from props_ashfall import WOOD, WOODD, IRON, BONE, PLUM, STONE, STONED, CLOTH, STRAW, BRASS, EMBER, INK, planks
import set2 as S2

def longtable(n=5, seed=11):
    W_, H_ = n * 32 + 8, 52; cv = Cv(W_, H_); rnd = random.Random(seed)
    for x in (6, W_ - 12, W_ // 3, 2 * W_ // 3 - 4): cv.shade(rect_mask(W_, H_, x, 28, x + 6, 50), WOODD, rad=2, rim='all')
    cv.shade(rect_mask(W_, H_, 3, 24, W_ - 3, 36), WOODD, rad=2, k=.6, rim='all')
    planks(cv, 3, 10, W_ - 3, 25, WOOD, vertical=True, step=13, rnd=rnd); cv.a[24, 3:W_ - 3] = WOOD[4]; cv.a[10, 3:W_ - 3] = WOOD[4]
    for i in range(n):                                                      # a place laid at every seat
        x = 12 + i * 32
        cv.shade(ell_mask(W_, H_, x + 6, 17, 6, 3.2), STONED, rad=2, rim='all'); cv.flat(ell_mask(W_, H_, x + 6, 16, 4.4, 2), hexc('#5a3a30'))
        cv.flat(rect_mask(W_, H_, x + 16, 12, x + 19, 17), TA_CLOTH(1)); cv.shade(ell_mask(W_, H_, x + 17.5, 12, 2.2, 1.6), BRASS, rad=1, rim='all')   # tankard
    for x in (W_ // 2 - 14, W_ // 2 + 24):
        cv.flat(rect_mask(W_, H_, x, 8, x + 3, 15), BONE[2]); cv.put(x + 1, 6, EMBER[1]); cv.put(x + 1, 5, EMBER[2])
    cv.outline(INK); return cv.img()
def TA_CLOTH(i): return CLOTH[i]

def cauldron():
    cv = Cv(40, 46)
    for x in (6, 17, 28): cv.shade(ell_mask(40, 46, x + 3, 40, 4.4, 3.4), STONED, rad=2, rim='all')            # the stones it sits on
    cv.flat(ell_mask(40, 46, 20, 41, 11, 2.6), hexc('#ff8a30')); cv.flat(ell_mask(40, 46, 20, 41, 7, 1.4), hexc('#ffd070'))   # embers under it
    cv.shade(ell_mask(40, 46, 20, 27, 14, 13), IRON, rad=6, rim='br')
    cv.shade(ell_mask(40, 46, 20, 17, 12, 3.6), ramp('#8a90a8', '#26284a', '#e8eeff'), rad=2, rim='all')
    cv.flat(ell_mask(40, 46, 20, 17, 10, 2.4), hexc('#4a7a48')); cv.flat(ell_mask(40, 46, 17, 16.6, 4, 1.2), hexc('#7aa868')); cv.put(24, 17, hexc('#a8c888'))     # the stew
    cv.flat(capsule_mask(40, 46, 26, 16, 36, 4, .9, .9), WOOD[2]); cv.shade(ell_mask(40, 46, 37, 3.5, 3, 2.4), BRASS, rad=1.2, rim='all')    # ladle
    cv.outline(INK); return cv.img()

def furnace_body():
    cv = Cv(68, 60)
    cv.shade(rect_mask(68, 60, 2, 8, 66, 56), STONED, rad=3, rim='all')
    cv.shade(rect_mask(68, 60, 6, 4, 62, 12), STONE, rad=2, rim='all')
    cv.flat(poly_mask(68, 60, [(14, 54), (14, 26), (20, 18), (48, 18), (54, 26), (54, 54)]), hexc('#1a0c18'))        # the firebox
    cv.flat(rect_mask(68, 60, 16, 50, 52, 54), hexc('#ff7a28')); cv.flat(rect_mask(68, 60, 20, 51, 48, 53), hexc('#ffc060'))   # a bed of embers
    for x in range(16, 52, 4): cv.shade(rect_mask(68, 60, x, 46, x + 2, 54), IRON, rad=1, rim='all')               # grate
    cv.flat(rect_mask(68, 60, 30, 8, 38, 18), IRON[1]); cv.flat(capsule_mask(68, 60, 34, 12, 34, 30, .8, .8), IRON[3])        # the pot hook
    cv.outline((60, 16, 24), strength=.6); return cv.img()

def furnace_flame(frame):
    cv = Cv(68, 60); k = frame
    fl = poly_mask(68, 60, [(18, 48), (20, 36 - k), (25, 28 - k * 2), (28, 38), (33, 22 + k), (38, 36), (43, 26 - k), (47, 38), (50, 48)])
    cv.shade(fl, EMBER, rad=5, bias=.2); cv.flat(poly_mask(68, 60, [(24, 48), (30, 34), (34, 28 - k), (39, 34), (44, 48)]), EMBER[4])
    return cv.img()

def bookcase():
    cv = Cv(68, 66); cv.shade(rect_mask(68, 66, 2, 4, 66, 62), WOODD, rad=3, rim='all')
    rnd = random.Random(5)
    for row, y0 in enumerate((8, 27, 46)):
        cv.shade(rect_mask(68, 66, 5, y0, 63, y0 + 16), ramp('#2a1620', '#0c0610', '#6a4a50'), rad=1)
        x = 6
        while x < 60:
            w = rnd.choice((3, 4, 4, 5)); h = rnd.randrange(10, 15); col = rnd.choice(((PLUM), ramp('#2e6b72', '#122440', '#a8f0d0'), ramp('#8a4a34', '#2a1028', '#e89870'), ramp('#6a6a40', '#1c1c20', '#d0d090'), CLOTH))
            cv.shade(rect_mask(68, 66, x, y0 + 16 - h, x + w, y0 + 16), col, rad=1.2, rim='all'); cv.put(x + 1, y0 + 16 - h + 2, BRASS[3])
            x += w + 1
        cv.shade(rect_mask(68, 66, 3, y0 + 16, 65, y0 + 19), WOOD, rad=1.2, rim='all')
    cv.shade(ell_mask(68, 66, 52, 22, 4, 3.6), BONE, rad=2, rim='all'); cv.flat(rect_mask(68, 66, 50, 21, 52, 23), hexc('#1a1020')); cv.flat(rect_mask(68, 66, 53, 21, 55, 23), hexc('#1a1020'))   # a skull among the ledgers
    cv.outline(INK); return cv.img()

def altar():
    cv = Cv(38, 50)
    cv.shade(rect_mask(38, 50, 4, 30, 34, 48), STONED, rad=3, rim='all'); cv.shade(rect_mask(38, 50, 2, 24, 36, 32), STONE, rad=2, rim='all')
    cv.shade(rect_mask(38, 50, 3, 24, 35, 28), PLUM, rad=1.6, rim='all'); cv.flat(rect_mask(38, 50, 3, 28, 35, 30), PLUM[1])
    cv.stamp(15, 33, ['.XX.', 'X...', 'X...', '.XX.'], {'X': BONE[3]})
    for x in (7, 27):
        cv.flat(rect_mask(38, 50, x, 14, x + 4, 25), BONE[2]); cv.flat(rect_mask(38, 50, x, 14, x + 1, 25), BONE[3])
        cv.shade(poly_mask(38, 50, [(x - .5, 14), (x + 1.5, 5), (x + 3, 9), (x + 4.5, 14)]), EMBER, rad=2, bias=.2)
    cv.outline((60, 16, 24), strength=.5); return cv.img()

def coalheap():
    cv = Cv(40, 32); rnd = random.Random(9)
    cv.shade(poly_mask(40, 32, [(2, 29), (9, 12), (20, 4), (31, 12), (38, 29)]), ramp('#3a2e3a', '#0c0810', '#8a7088'), rad=7, rim='br')
    for _ in range(26):
        x, y, r = rnd.uniform(6, 34), rnd.uniform(10, 28), rnd.uniform(1.4, 2.6)
        cv.shade(ell_mask(40, 32, x, y, r, r * .8), ramp('#4a3e4a', '#100a14', '#a08ca0'), rad=1.4, k=1.2)
    for (x, y) in ((14, 20), (26, 24)): cv.put(x, y, hexc('#ff7a30'))
    cv.flat(capsule_mask(40, 32, 30, 26, 38, 8, .9, .9), WOOD[2]); cv.shade(poly_mask(40, 32, [(27, 27), (33, 27), (31, 31), (28, 31)]), IRON, rad=1, rim='all')   # a shovel
    cv.outline(INK); return cv.img()

def lectern():
    cv = Cv(32, 48)
    cv.shade(rect_mask(32, 48, 13, 22, 19, 44), WOODD, rad=2, rim='all'); cv.shade(ell_mask(32, 48, 16, 44, 9, 3), WOODD, rad=2, rim='all')
    cv.shade(poly_mask(32, 48, [(3, 18), (29, 18), (27, 28), (5, 28)]), WOOD, rad=2.4, rim='all')
    cv.shade(poly_mask(32, 48, [(6, 14), (16, 12), (16, 24), (6, 25)]), CLOTH, rad=1.6, rim='all'); cv.shade(poly_mask(32, 48, [(16, 12), (26, 14), (26, 25), (16, 24)]), CLOTH, rad=1.6, rim='all')
    for y in (17, 19, 21): cv.a[y, 8:15] = CLOTH[0]; cv.a[y, 18:25] = CLOTH[0]
    cv.outline(INK); return cv.img()

def toolrack():
    cv = Cv(68, 46); cv.shade(rect_mask(68, 46, 3, 6, 65, 12), WOODD, rad=1.6, rim='all'); cv.shade(rect_mask(68, 46, 3, 26, 65, 32), WOODD, rad=1.6, rim='all')
    for x in (8, 18, 28, 38, 48, 58): cv.flat(rect_mask(68, 46, x, 8, x + 1, 12), IRON[1])
    cv.shade(ell_mask(68, 46, 11, 24, 5, 5), IRON, rad=2, rim='all'); cv.flat(ell_mask(68, 46, 11, 24, 3, 3), hexc('#1a1420'))                # a pan
    cv.flat(capsule_mask(68, 46, 22, 12, 22, 40, .9, .9), WOOD[2]); cv.shade(ell_mask(68, 46, 22, 40, 3, 3.6), IRON, rad=1.6, rim='all')       # a ladle
    cv.flat(capsule_mask(68, 46, 33, 12, 33, 38, .9, .9), WOOD[2]); cv.shade(poly_mask(68, 46, [(28, 36), (38, 36), (36, 44), (30, 44)]), IRON, rad=1.4, rim='all')   # a cleaver
    cv.flat(capsule_mask(68, 46, 47, 12, 47, 40, .8, .8), IRON[3]); cv.shade(rect_mask(68, 46, 43, 38, 52, 41), BRASS, rad=1, rim='all')
    cv.shade(ell_mask(68, 46, 59, 26, 4, 5.4), WOOD, rad=2, rim='all'); cv.flat(ell_mask(68, 46, 59, 26, 2.4, 3.4), hexc('#1a1420'))
    cv.outline(INK); return cv.img()

def pillarstub():
    cv = Cv(34, 50)
    cv.shade(rect_mask(34, 50, 3, 42, 31, 48), STONED, rad=2, rim='all'); cv.shade(rect_mask(34, 50, 5, 38, 29, 43), STONE, rad=2, rim='all')       # plinth
    cv.shade(poly_mask(34, 50, [(9, 39), (25, 39), (24, 14), (21, 9), (17, 13), (13, 7), (10, 15)]), STONE, rad=4, k=1.2, rim='all')                 # a shaft snapped off unevenly
    for x in (12, 17, 22): cv.a[18:38, x] = STONED[1]                                                                                              # fluting
    cv.shade(poly_mask(34, 50, [(26, 46), (32, 44), (31, 48), (27, 48)]), STONE, rad=1.2, rim='all')                                              # a fallen chip
    cv.outline(INK); return cv.img()

def hay():
    cv = Cv(40, 30); rnd = random.Random(3)
    cv.shade(ell_mask(40, 30, 20, 20, 17, 9), STRAW, rad=5, rim='br')
    for _ in range(40):
        x, y = rnd.randrange(5, 35), rnd.randrange(10, 28); cv.put(x, y, STRAW[1]); cv.put(x + 1, y - 1, STRAW[4])
    cv.flat(rect_mask(40, 30, 6, 18, 34, 20), BRASS[1]); cv.outline(INK); return cv.img()

def build():
    s = {'longtable': longtable(), 'cauldron': cauldron(), 'bookcase': bookcase(), 'altar': altar(), 'coal': coalheap(), 'lectern': lectern(), 'toolrack': toolrack(), 'pillarstub': pillarstub(), 'furnace_body': furnace_body()}
    for i in range(3): s['furnace_flame%d' % i] = furnace_flame(i)
    return s

if __name__ == '__main__':
    s = build(); x = y = rowh = 0; W_ = 400; pos = {}
    for n, im in s.items():
        if x + im.width > W_: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    sh = Image.new('RGBA', (W_, y + rowh), (58, 52, 72, 255))
    for n, im in s.items(): sh.alpha_composite(im, pos[n])
    preview(sh, '/tmp/props3_prev.png', scale=3)
