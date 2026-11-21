"""Phase 2: the last original-art pieces visible in Ashfall Keep. Pickups, every state of the mission mechanisms, story scenes, the hidden crack,
doorway arches, hanging cages, ceiling beams, alert markers and the HUD icon set. Same painter, same ramps, same ink."""
import random, math
import numpy as np
from pix import *
from pix import _erode
from props_ashfall import WOOD, WOODD, IRON, BONE, PLUM, STONE, STONED, CLOTH, STRAW, BRASS, EMBER, INK
import set2 as S2
import tiles_ashfall as TA

GOLD = S2.GOLD
CRYS = ramp('#e8602a', '#4a1034', '#ffd890')           # ember crystal
CRYS2 = ramp('#c8402a', '#38102c', '#ffb878')
PARCH = ramp('#e8dcc0', '#7a5a68', '#ffffff')
WAX = ramp('#b3262c', '#3a0c20', '#ff8a78')
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

# =============================================================== pickups
def gem(frame):
    cv = Cv(18, 26)
    body = poly_mask(18, 26, [(9, 2), (15, 11), (9, 23), (3, 11)])
    cv.shade(body, CRYS, rad=4, k=1.1, rim='all')
    cv.flat(poly_mask(18, 26, [(9, 2), (3, 11), (8, 11)]), CRYS[4]); cv.flat(poly_mask(18, 26, [(9, 11), (15, 11), (9, 23)]), CRYS[1])   # facets
    cv.put(9, 11, hexc('#fff4d0'))
    sp = [(5, 7), (13, 15), (8, 19)][frame]
    for (dx, dy) in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)): cv.put(sp[0] + dx, sp[1] + dy, hexc('#ffffff') if (dx, dy) == (0, 0) else hexc('#ffe8a8'))
    cv.outline((60, 12, 28)); return cv.img()

def cluster():
    cv = Cv(30, 28)
    for (cx, cy, s, rp) in ((15, 15, 1.2, CRYS), (7, 18, .85, CRYS2), (23, 19, .85, CRYS2), (15, 8, .7, CRYS)):
        cv.shade(poly_mask(30, 28, [(cx, cy - 11 * s), (cx + 6 * s, cy), (cx, cy + 11 * s), (cx - 6 * s, cy)]), rp, rad=3, k=1.1, rim='all')
        cv.flat(poly_mask(30, 28, [(cx, cy - 11 * s), (cx - 6 * s, cy), (cx - 1, cy)]), rp[4])
    cv.outline((60, 12, 28)); return cv.img()

def relic(frame):
    cv = Cv(28, 30)
    cv.shade(ell_mask(28, 30, 14, 16, 11, 11), GOLD, rad=5, rim='all')
    cv.flat(ell_mask(28, 30, 14, 16, 8, 8), hexc('#2a1430')); cv.shade(ell_mask(28, 30, 14, 16, 6.4, 6.4), PLUM, rad=3)
    cres = ell_mask(28, 30, 13, 16, 4.6, 4.6) & ~ell_mask(28, 30, 15.4, 15, 4, 4.2); cv.shade(cres, BONE, rad=1.6)
    for a in range(0, 360, 45): cv.put(14 + 12.5 * math.cos(math.radians(a)), 16 + 12.5 * math.sin(math.radians(a)), GOLD[4] if (a // 45 + frame) % 2 else GOLD[2])
    cv.shade(rect_mask(28, 30, 12, 2, 16, 6), GOLD, rad=1.2, rim='all'); cv.flat(ell_mask(28, 30, 14, 4, 1.4, 1.4), hexc('#2a1430'))   # the loop it hangs by
    cv.outline((60, 30, 20)); return cv.img()

def scroll():
    cv = Cv(28, 18)
    cv.shade(capsule_mask(28, 18, 4, 9, 24, 9, 5, 5), PARCH, rad=3, rim='all')
    cv.shade(ell_mask(28, 18, 4, 9, 2.8, 5), ramp('#c8b894', '#5a3a50', '#fff4d8'), rad=2, rim='all'); cv.shade(ell_mask(28, 18, 24, 9, 2.8, 5), ramp('#c8b894', '#5a3a50', '#fff4d8'), rad=2, rim='all')
    for y in (7, 9, 11): cv.a[y, 7:17] = hexc('#8a6a68')
    cv.shade(ell_mask(28, 18, 19, 10, 3.6, 3.6), WAX, rad=2, rim='all'); cv.put(18, 9, WAX[4]); cv.flat(rect_mask(28, 18, 14, 4, 19, 14), WAX[1])
    cv.outline(INK); return cv.img()

def keg():
    cv = Cv(24, 28)
    cv.shade(poly_mask(24, 28, [(4, 6), (20, 6), (22, 14), (20, 24), (4, 24), (2, 14)]), WOOD, rad=5, k=1, rim='br')
    for x in (8, 12, 16): cv.a[8:23, x] = WOOD[0]
    for y in (9, 21): cv.flat(rect_mask(24, 28, 2, y, 22, y + 2), IRON[2]); cv.put(4, y, IRON[4])
    cv.shade(rect_mask(24, 28, 5, 3, 19, 7), WOODD, rad=1.4, rim='all')
    cv.flat(rect_mask(24, 28, 8, 12, 16, 18), hexc('#1a1420')); cv.flat(ell_mask(24, 28, 12, 15, 2.6, 3.2), EMBER[1]); cv.put(12, 14, EMBER[4])                    # the rune on its face
    cv.flat(capsule_mask(24, 28, 12, 4, 15, 0, .6, .6), hexc('#c8a868'))
    cv.outline(INK); return cv.img()

def egg(frame):
    cv = Cv(34, 40)
    cv.shade(ell_mask(34, 40, 17, 35, 14, 4.2), ramp('#4a3036', '#12081a', '#9a7078'), rad=2.4, rim='all'); cv.shade(rect_mask(34, 40, 3, 31, 31, 36), BONE, rad=1.6, rim='all')   # a bone stand on a cushion
    cv.shade(rect_mask(34, 40, 6, 33, 28, 35), PLUM, rad=1)
    e = ell_mask(34, 40, 17, 18, 10.5, 14)
    cv.shade(e, ramp('#e8d0a0', '#7a4a50', '#fffbe8'), rad=7, k=1.1, rim='all', bias=.1)
    for (x, y) in ((12, 11), (21, 14), (14, 25), (22, 24), (17, 9)): cv.put(x, y, hexc('#b89870')); cv.put(x + 1, y, hexc('#c8a880'))                                         # speckles
    pts = [(13, 7), (16, 12), (12, 16), (17, 21), (14, 27)]
    g = (EMBER[1], EMBER[0], EMBER[2])[frame]
    for a, b in zip(pts, pts[1:]):
        for t in np.linspace(0, 1, 8): cv.put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, g); cv.put(a[0] + (b[0] - a[0]) * t + 1, a[1] + (b[1] - a[1]) * t, EMBER[3] if frame == 2 else EMBER[1])
    cv.put(16, 12, EMBER[4]); cv.put(17, 21, EMBER[4])
    cv.outline((70, 40, 24)); return cv.img()

def beacon(state, frame=0):
    cv = Cv(36, 54)
    for x in (7, 18, 29): cv.shade(capsule_mask(36, 54, 18, 38, x, 52, 1.8, 1.4), IRON, rad=1.6, rim='all')
    cv.shade(poly_mask(36, 54, [(3, 34), (33, 34), (28, 46), (8, 46)]), IRON, rad=4, rim='all')
    cv.shade(rect_mask(36, 54, 1, 31, 35, 36), ramp('#8a90a8', '#26284a', '#e8eeff'), rad=1.4, rim='all')
    if state == 'out':
        cv.flat(ell_mask(36, 54, 18, 33, 15, 2.6), hexc('#140c1c')); cv.flat(ell_mask(36, 54, 22, 33, 4, 1.2), hexc('#8a2a20')); cv.put(21, 33, hexc('#ff6a2a'))
    elif state == 'unlit':
        cv.flat(ell_mask(36, 54, 18, 33, 15, 2.6), hexc('#140c1c'))
        for (x, y) in ((10, 33), (15, 32), (23, 33), (27, 32)): cv.put(x, y, hexc('#5a4a5a'))
    else:
        cv.flat(ell_mask(36, 54, 18, 33, 15, 2.6), hexc('#ff7a2a')); cv.flat(ell_mask(36, 54, 18, 33, 10, 1.6), hexc('#ffd070'))
        k = frame
        cv.shade(poly_mask(36, 54, [(6, 33), (7, 22 - k), (11, 12 - k * 2), (14, 21), (18, 2 + k), (22, 20), (25, 11 - k), (29, 22), (30, 33)]), EMBER, rad=6, bias=.2)
        cv.flat(poly_mask(36, 54, [(12, 33), (15, 22), (18, 8 - k), (21, 22), (24, 33)]), EMBER[4])
    cv.outline((60, 16, 24), strength=.6); return cv.img()

# =============================================================== mechanisms (32x32 tiles unless noted)
def slab(cv, x0=3, y0=3, x1=29, y1=29, rp=None):
    cv.shade(rect_mask(32, 32, x0, y0, x1, y1), rp or STONED, rad=3, k=.8, rim='all')

def plate_plain():
    cv = Cv(32, 32); slab(cv); cv.flat(rect_mask(32, 32, 15, 6, 17, 27), STONED[0]); cv.outline(INK, strength=.5); return cv.img()

def plate_rattle(frame):
    cv = Cv(32, 32); slab(cv, rp=ramp('#6a6478', '#1c1430', '#c8c0e0'))
    cv.flat(rect_mask(32, 32, 5, 5, 27, 8), IRON[1]); [cv.put(x, 6, IRON[4]) for x in (8, 16, 24)]
    sw = (-1, 0, 1)[frame]
    for i, x in enumerate((9, 16, 23)):
        s = sw * (1 if i % 2 else -1)
        cv.flat(rect_mask(32, 32, x, 8, x + 1, 12), hexc('#a89880'))
        cv.shade(capsule_mask(32, 32, x + .5 + s, 12, x + .5 + s * 1.5, 22, 1.6, 1.3), BONE, rad=1.4, rim='all')
        cv.shade(ell_mask(32, 32, x + .5 + s * 1.5, 23, 2.4, 2.6), BONE, rad=1.4, rim='all')
    cv.outline(INK, strength=.5); return cv.img()

def plate_dart(lit):
    cv = Cv(32, 32); slab(cv, rp=ramp('#5a5470', '#16102a', '#b8b0d8'))
    for y in (10, 16, 22): cv.flat(ell_mask(32, 32, 4.5, y, 1.8, 1.8), hexc('#0a0610')); cv.put(5, y - 1, STONED[3])          # dart holes in the rim
    dia = poly_mask(32, 32, [(16, 8), (23, 16), (16, 24), (9, 16)])
    cv.flat(dia, hexc('#1a1020')); inner = poly_mask(32, 32, [(16, 10), (21, 16), (16, 22), (11, 16)])
    cv.shade(inner, ramp('#ff5a3a' if lit else '#7a2a3a', '#300818', '#ffb890' if lit else '#c07080'), rad=3, bias=.2 if lit else -.1)
    cv.put(16, 14, EMBER[4] if lit else hexc('#a04a5a'))
    cv.outline(INK, strength=.5); return cv.img()

def rot(st):
    cv = Cv(32, 32)
    if st == 2:
        cv.flat(rect_mask(32, 32, 1, 1, 31, 31), hexc('#0a0610')); cv.flat(ell_mask(32, 32, 16, 16, 13, 12), hexc('#020104'))
        for i in range(5):
            x = 2 + i * 6; cv.shade(poly_mask(32, 32, [(x, 1), (x + 5, 1), (x + 2, 8 + (i % 2) * 4)]), ramp('#5a3a28', '#1c0e12', '#c08860'), rad=1.6, rim='all')
            cv.shade(poly_mask(32, 32, [(x + 1, 31), (x + 6, 31), (x + 4, 24 - (i % 2) * 3)]), ramp('#5a3a28', '#1c0e12', '#c08860'), rad=1.6, rim='all')
        cv.outline(INK, strength=.5); return cv.img()
    for i in range(4):
        x = 1 + i * 8; rp = ramp('#6a4a2e', '#1c0e14', '#c89868') if i % 2 else ramp('#5e4128', '#18090f', '#b88858')
        cv.shade(rect_mask(32, 32, x, 1, x + 7, 31), rp, rad=2, k=.6, rim='all')
        for y in range(4, 30, 5): cv.put(x + 3 + (y % 3), y, rp[0])
    for (x, y) in ((4, 5), (27, 27), (5, 27), (27, 5)): cv.put(x, y, hexc('#2a1c20'))
    for (a, b) in (((6, 8), (12, 14)), ((12, 14), (10, 20)), ((20, 4), (24, 12)), ((18, 24), (26, 27))):
        for t in np.linspace(0, 1, 7): cv.put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, hexc('#140810'))
    if st == 1:
        for (a, b) in (((3, 16), (12, 13)), ((12, 13), (19, 19)), ((19, 19), (29, 15))):
            for t in np.linspace(0, 1, 9): cv.put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, hexc('#000000')); cv.put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 1, hexc('#3a2018'))
    cv.outline(INK, strength=.5); return cv.img()

def grate(open_):
    cv = Cv(32, 32); cv.flat(rect_mask(32, 32, 4, 6, 28, 28), hexc('#0a0610'))
    for x in range(8, 26, 4): cv.shade(rect_mask(32, 32, x, 6, x + 2, 28), IRON, rad=1, rim='all')
    cv.shade(rect_mask(32, 32, 3, 5, 29, 8), STONED, rad=1.4, rim='all'); cv.shade(rect_mask(32, 32, 3, 26, 29, 29), STONED, rad=1.4, rim='all')
    cv.put(16, 27, EMBER[2] if open_ else hexc('#8a8098')); cv.outline(INK, strength=.5); return cv.img()

def steps():
    cv = Cv(32, 32)
    for i in range(5):
        v = 60 - i * 11; cv.shade(rect_mask(32, 32, 3, 3 + i * 5.4, 29, 8 + i * 5.4), ramp('#%02x%02x%02x' % (v + 40, v + 34, v + 54), '#10081c', '#d8d0f0'), rad=1.4, k=.7, rim='br')
    cv.outline(INK, strength=.5); return cv.img()

def hatch():
    cv = Cv(32, 32); cv.flat(rect_mask(32, 32, 3, 3, 29, 29), hexc('#120c10'))
    for i in range(3): cv.shade(rect_mask(32, 32, 5 + i * 7.4, 5, 12 + i * 7.4, 27), WOOD if i % 2 else WOODD, rad=2, rim='all')
    for y in (9, 21): cv.shade(rect_mask(32, 32, 4, y, 28, y + 3), IRON, rad=1.2, rim='all')
    cv.shade(ell_mask(32, 32, 16, 17, 4, 4) & ~ell_mask(32, 32, 16, 17, 2.2, 2.2), IRON, rad=1.4, rim='all')
    cv.shade(rect_mask(32, 32, 2, 2, 30, 4), STONED, rad=1, rim='all'); cv.shade(rect_mask(32, 32, 2, 28, 30, 30), STONED, rad=1, rim='all')
    cv.outline(INK, strength=.5); return cv.img()

def well():
    cv = Cv(32, 32)
    cv.shade(ell_mask(32, 32, 16, 17, 14, 12.5), STONE, rad=5, k=1.1, rim='all')
    cv.flat(ell_mask(32, 32, 16, 17, 9.5, 8), hexc('#050308')); cv.flat(ell_mask(32, 32, 16, 18, 7, 5.6), hexc('#0c1a2a'))
    cv.put(13, 17, hexc('#5a88b0')); cv.put(14, 17, hexc('#8ab0d0'))
    for a in range(0, 360, 30): cv.put(16 + 12 * math.cos(math.radians(a)), 17 + 10.4 * math.sin(math.radians(a)), STONED[1] if a % 60 == 0 else STONE[3])
    cv.shade(rect_mask(32, 32, 4, 3, 28, 7), WOODD, rad=1.6, rim='all'); cv.flat(capsule_mask(32, 32, 16, 7, 16, 17, .6, .6), hexc('#c8b088'))
    cv.outline(INK, strength=.5); return cv.img()

def unfound():
    cv = Cv(32, 32); cv.shade(rect_mask(32, 32, 4, 4, 28, 28), STONED, rad=3, rim='all', bias=-.05); cv.flat(rect_mask(32, 32, 4, 4, 28, 5), hexc('#0a0610')); cv.flat(rect_mask(32, 32, 4, 4, 5, 28), hexc('#0a0610'))
    cv.outline(INK, strength=.5); return cv.img()

def lever(on):
    cv = Cv(36, 40)
    cv.shade(rect_mask(36, 40, 15, 14, 21, 34), WOODD, rad=2, rim='all')                    # post
    cv.shade(rect_mask(36, 40, 5, 8, 31, 20), ramp('#9a7a54', '#2a1818', '#f0d8a0'), rad=3, rim='all')      # drum, wound with rope
    for x in range(8, 29, 4): cv.a[9:19, x] = hexc('#5a4028')
    cv.shade(rect_mask(36, 40, 3, 33, 33, 37), STONED, rad=1.4, rim='all')
    a = math.radians(50 if on else -50); x0, y0 = 31, 14; x1, y1 = x0 + 9 * math.cos(a), y0 + 9 * math.sin(a)
    cv.flat(capsule_mask(36, 40, x0, y0, x1, y1, 1.3, 1.3), IRON[2]); cv.shade(ell_mask(36, 40, x1, y1, 2.8, 2.8), BRASS, rad=1.6, rim='all')
    cv.outline(INK); return cv.img()

def cache(kind, open_):
    cv = Cv(36, 32)
    if kind == 'stone':
        cv.shade(rect_mask(36, 32, 7, 8, 29, 24), ramp('#6a6478', '#1c1430', '#c8c0e0') if not open_ else STONED, rad=3, rim='all')
        if open_: cv.flat(rect_mask(36, 32, 9, 10, 27, 22), hexc('#0a0610')); cv.shade(rect_mask(36, 32, 24, 18, 35, 28), STONE, rad=2, rim='all')
        else:
            for (x, y) in ((10, 12), (14, 14), (20, 11), (25, 15), (12, 20), (22, 20)): cv.put(x, y, STONED[0])
            cv.flat(rect_mask(36, 32, 7, 8, 29, 10), STONE[4])
    else:
        rp = ramp('#b8b0cc', '#241838', '#f4f0ff') if kind == 'reliquary' else ramp('#6a6a78', '#1c1c2c', '#c8c8d8')
        cv.shade(rect_mask(36, 32, 3, 12, 33, 28), rp, rad=3, k=.9, rim='all')
        cv.flat(rect_mask(36, 32, 3, 19, 33, 22), BRASS[2] if kind == 'reliquary' else IRON[3]); cv.put(8, 20, BRASS[4])
        for x in (9, 18, 27) if kind == 'reliquary' else (): cv.put(x, 15, BONE[4])
        if not open_:
            cv.shade(ell_mask(36, 32, 18, 12, 15.5, 8) & rect_mask(36, 32, 0, 0, 36, 14), rp, rad=4, rim='all', bias=.1)
            cv.shade(rect_mask(36, 32, 15, 14, 21, 22), BRASS, rad=1.4, rim='all'); cv.put(18, 18, BRASS[0])
            if kind == 'reliquary': cv.stamp(14, 6, ['.XX.', 'X...', 'X...', '.XX.'], {'X': BONE[3]})
        else:
            cv.shade(poly_mask(36, 32, [(3, 11), (33, 11), (31, 2), (5, 2)]), rp, rad=2, rim='all'); cv.flat(rect_mask(36, 32, 5, 12, 31, 17), hexc('#120a1c'))
            for (x, y) in ((12, 15), (17, 14), (23, 15)): cv.put(x, y, GOLD[3]); cv.put(x + 1, y, GOLD[1])
    cv.outline(INK); return cv.img()

def note():
    cv = Cv(26, 34)
    cv.shade(rect_mask(26, 34, 3, 4, 23, 30), ramp('#6a6478', '#1c1430', '#c8c0e0'), rad=3, k=.9, rim='all')
    cv.shade(rect_mask(26, 34, 1, 28, 25, 32), STONED, rad=1.4, rim='all'); cv.shade(rect_mask(26, 34, 1, 2, 25, 6), STONE, rad=1.4, rim='all')
    for i in range(5):
        y = 9 + i * 4; w = 12 - (i % 2) * 4; cv.a[y, 7:7 + w] = hexc('#1a1230'); cv.a[y + 1, 7:7 + w] = STONE[1]
    cv.put(8, 7, EMBER[2]); cv.outline(INK); return cv.img()

def portcullis():
    cv = Cv(32, 40)
    for x in range(6, 28, 4): cv.shade(rect_mask(32, 40, x, 2, x + 2, 36), IRON, rad=1, rim='all'); cv.shade(poly_mask(32, 40, [(x - .6, 36), (x + 1, 39.4), (x + 2.6, 36)]), IRON, rad=1, rim='all')
    for y in (9, 22): cv.shade(rect_mask(32, 40, 4, y, 28, y + 3), IRON, rad=1.2, rim='all'); [cv.put(x, y + 1, IRON[4]) for x in (8, 16, 24)]
    cv.outline(INK, strength=.5); return cv.img()

# =============================================================== story scenes
def i_bones():
    cv = Cv(34, 24); rnd = random.Random(1)
    for i in range(7):
        x = 4 + i * 4 + rnd.randrange(-1, 2); a = (x - 17) * .03
        cv.flat(capsule_mask(34, 24, x, 6, x + 3 * a * 10, 19 + (i % 2), 1.2, 1.2), BONE[2]); cv.shade(ell_mask(34, 24, x, 6, 1.9, 1.9), BONE, rad=1.2)
    cv.shade(ell_mask(34, 24, 25, 16, 5, 4.4), BONE, rad=2.4, rim='all'); cv.flat(rect_mask(34, 24, 22.6, 15, 24.4, 17.2), hexc('#1a1020')); cv.flat(rect_mask(34, 24, 25.8, 15, 27.6, 17.2), hexc('#1a1020'))
    cv.outline(INK, strength=.6); return cv.img()

def i_tablet():
    cv = Cv(26, 30); cv.shade(rect_mask(26, 30, 3, 3, 23, 27), ramp('#7a7488', '#1c1430', '#d8d0f0'), rad=4, k=.9, rim='all')
    for r in range(4):
        for k in range(4): cv.a[7 + r * 5:10 + r * 5, 6 + k * 4] = hexc('#1a1230')
    cv.a[24, 5:21] = hexc('#1a1230'); cv.outline(INK); return cv.img()

def i_banner():
    cv = Cv(36, 26)
    cv.shade(poly_mask(36, 26, [(2, 8), (33, 4), (28, 13), (33, 22), (3, 20)]), ramp('#cfc9bd', '#5a4a68', '#fffaf0'), rad=3, rim='all')
    cv.flat(ell_mask(36, 26, 13, 13, 4, 4), hexc('#4a3a50')); cv.flat(rect_mask(36, 26, 11, 15, 15, 18), hexc('#4a3a50'))
    cv.flat(rect_mask(36, 26, 26, 9, 28, 15), GOLD[3]); cv.outline(INK, strength=.6); return cv.img()

def s_tally():
    cv = Cv(32, 20)
    for g in range(3):
        for i in range(4): cv.a[3:12, 6 + g * 9 + i * 2] = (232, 224, 208, 200)
        for i in range(8): cv.put(5 + g * 9 + i, 11 - i // 2, (232, 224, 208, 200))
    return cv.img()

def s_chime():
    cv = Cv(32, 24); cv.flat(rect_mask(32, 24, 8, 2, 24, 4), IRON[2])
    for i in range(4):
        x = 9 + i * 4.5; l = 8 + (i % 2) * 4; cv.flat(rect_mask(32, 24, x, 4, x + 1, 6), hexc('#a89880')); cv.shade(capsule_mask(32, 24, x + .5, 6, x + .5, 6 + l, 1.5, 1.2), BRASS if i % 2 else IRON, rad=1.4, rim='all')
    cv.outline(INK, strength=.5); return cv.img()

def s_fshell():
    cv = Cv(32, 32); rnd = random.Random(4)
    for i in range(4):
        x, y = 6 + rnd.random() * 20, 6 + rnd.random() * 20; a = rnd.random() * 6
        pts = [(x, y), (x + math.cos(a) * 6, y + math.sin(a) * 6), (x + math.cos(a + 1.6) * 5, y + math.sin(a + 1.6) * 5)]
        cv.shade(poly_mask(32, 32, pts), ramp('#e8d0a0', '#7a4a50', '#fffbe8'), rad=1.4, rim='all')
    cv.outline((70, 40, 24), strength=.5); return cv.img()

def s_fstraw():
    cv = Cv(32, 32); rnd = random.Random(5)
    for i in range(26):
        x, y = 2 + rnd.random() * 28, 2 + rnd.random() * 28; a = rnd.random() * 3
        for t in range(6): cv.put(x + math.cos(a) * t, y + math.sin(a) * t, STRAW[rnd.randrange(1, 4)])
    return cv.img()

def s_fclaw():
    cv = Cv(32, 32)
    for i in range(3):
        for t in np.linspace(0, 1, 22):
            x = 6 + i * 6 + 3 * math.sin(t * math.pi); y = 4 + 24 * t; cv.put(x, y, hexc('#0c0608')); cv.put(x + 1, y, hexc('#2a1418'))
    for i in range(3): cv.put(7 + i * 6, 26, EMBER[1])
    return cv.img()

def crack(frame):
    cv = Cv(32, 32); cv.flat(rect_mask(32, 32, 0, 0, 32, 32), (0, 0, 0, 0))
    pts = [(14, 1), (18, 9), (12, 15), (19, 22), (15, 31)]
    for a, b in zip(pts, pts[1:]):
        for t in np.linspace(0, 1, 12): x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t; cv.put(x, y, hexc('#0c0608')); cv.put(x + 1, y, hexc('#241418')); cv.put(x - 1, y, hexc('#ff9a4a') if frame else hexc('#c8602a'))
    for (a, b) in (((18, 9), (26, 12)), ((12, 15), (5, 19))):
        for t in np.linspace(0, 1, 8): cv.put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, hexc('#0c0608'))
    return cv.img()

# =============================================================== overhead: arches, cages, beams
def arch_ns():
    cv = Cv(40, 34)
    cv.shade(poly_mask(40, 34, [(0, 0), (40, 0), (40, 16), (35, 16), (30, 7), (20, 4), (10, 7), (5, 16), (0, 16)]), ramp('#6a5a80', '#14102a', '#d0c0e8'), rad=4, k=1.0, rim='all')
    for i in range(1, 7):
        a = math.pi + i / 7 * math.pi; cv.put(20 + 13 * math.cos(a), 16 + 11 * math.sin(a), hexc('#14102a'))
    cv.shade(poly_mask(40, 34, [(16, 0), (24, 0), (23, 8), (17, 8)]), STONE, rad=1.6, rim='all')           # keystone
    cv.stamp(18, 2, ['.XX.', 'X...', '.XX.'], {'X': BONE[3]})
    cv.outline(INK, strength=.6); return cv.img()

def cage():
    cv = Cv(26, 40)
    cv.flat(rect_mask(26, 40, 12, 0, 14, 9), hexc('#1a1620'))                                              # the chain it hangs from
    cv.shade(ell_mask(26, 40, 13, 10, 8, 3), IRON, rad=1.6, rim='all')
    for x in (6, 10, 14, 18): cv.shade(capsule_mask(26, 40, x + .5, 11, x + .5, 32, .9, .9), IRON, rad=1, rim='all')
    cv.shade(ell_mask(26, 40, 13, 32, 8, 3), IRON, rad=1.6, rim='all')
    cv.flat(rect_mask(26, 40, 11, 24, 15, 31), BONE[2]); cv.put(13, 22, EMBER[2]); cv.put(13, 21, EMBER[1]); cv.put(12, 22, EMBER[0]); cv.put(14, 22, EMBER[0])   # a tallow candle inside
    cv.outline((24, 16, 30), strength=.5); return cv.img()

def beam():
    cv = Cv(48, 26)
    cv.shade(rect_mask(48, 26, 0, 2, 48, 14), ramp('#5a3a2c', '#14080e', '#c08860'), rad=3, k=.7, rim='br')
    for x in range(6, 48, 14): cv.a[3:13, x] = hexc('#241018')
    cv.flat(rect_mask(48, 26, 0, 14, 48, 15), hexc('#14080e'))
    for y in range(15, 26):
        for x in range(48):
            if BAYER[y % 4, x % 4] < (1 - (y - 15) / 11.0) * .55: cv.a[y, x] = (12, 8, 24, 230)       # the beam's shadow on the floor, dithered
    for x in (10, 36): cv.flat(rect_mask(48, 26, x, 2, x + 2, 14), IRON[1]); cv.put(x, 3, IRON[4])
    return cv.img()

# =============================================================== markers and HUD icons
def marker(kind):
    cv = Cv(18, 26)
    body = poly_mask(18, 26, [(2, 2), (16, 2), (16, 18), (11, 18), (9, 23), (7, 18), (2, 18)])
    rp = ramp('#e03030', '#400818', '#ff9a88') if kind == 'alert' else ramp('#e6b840', '#5a3010', '#fff0a0')
    cv.shade(body, rp, rad=3, k=1, rim='all'); cv.flat(rect_mask(18, 26, 3, 3, 15, 4), hexc('#ffffff') if kind == 'alert' else hexc('#fff8d0'))
    ink = hexc('#ffffff') if kind == 'alert' else hexc('#3a2a10')
    if kind == 'alert':
        cv.flat(rect_mask(18, 26, 8, 5, 11, 13), ink); cv.flat(rect_mask(18, 26, 8, 15, 11, 17), ink)
    else:
        for (x, y) in ((6, 6), (7, 5), (8, 5), (9, 5), (10, 5), (11, 6), (11, 7), (10, 8), (9, 9), (8, 10), (8, 11)): cv.put(x, y, ink)
        cv.flat(rect_mask(18, 26, 8, 14, 10, 16), ink)
    cv.outline(INK, strength=.7); return cv.img()

def star():
    cv = Cv(9, 9)
    for (x, y) in ((4, 0), (4, 1), (4, 2), (0, 4), (1, 4), (2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (7, 4), (8, 4), (4, 6), (4, 7), (4, 8), (3, 3), (5, 3), (3, 5), (5, 5)): cv.put(x, y, hexc('#ffe27a'))
    cv.put(4, 4, hexc('#ffffff')); return cv.img()

ICON = ramp('#d8d4e0', '#505068', '#ffffff')
def icon(name):
    cv = Cv(18, 18); S = lambda m, r=ICON, **k: cv.shade(m, r, rad=2.2, rim='all', **k)
    if name == 'smoke':
        for (x, y, r) in ((5, 11, 3.6), (10, 8, 4.4), (14, 11.5, 3.2), (9, 13, 3.8)): S(ell_mask(18, 18, x, y, r, r))
    elif name == 'bell':
        S(poly_mask(18, 18, [(3, 14), (4.5, 7), (9, 3), (13.5, 7), (15, 14)])); S(rect_mask(18, 18, 2, 13, 16, 15)); S(ell_mask(18, 18, 9, 16, 2, 1.6)); cv.flat(rect_mask(18, 18, 8, 1, 10, 4), ICON[2])
    elif name == 'flute':
        S(capsule_mask(18, 18, 3, 14, 15, 4, 2, 2))
        for (x, y) in ((6, 11), (8, 9), (10, 7), (12, 5)): cv.put(x, y, hexc('#303040'))
    elif name == 'dash':
        S(poly_mask(18, 18, [(2, 6), (10, 6), (10, 2), (16, 9), (10, 16), (10, 12), (2, 12)]))
    elif name == 'fire':
        S(poly_mask(18, 18, [(9, 1), (14, 8), (13, 14), (9, 17), (5, 14), (4, 9), (7, 7), (8, 4)])); cv.flat(poly_mask(18, 18, [(9, 8), (11, 12), (9, 15), (7, 12)]), ICON[4])
    elif name == 'hand':
        S(ell_mask(18, 18, 9, 11, 5.5, 5.5)); S(rect_mask(18, 18, 8, 2, 10, 7)); cv.flat(ell_mask(18, 18, 9, 11, 2.4, 2.4), hexc('#303040'))
    elif name == 'eye':
        S(poly_mask(18, 18, [(1, 9), (5, 5), (9, 4), (13, 5), (17, 9), (13, 13), (9, 14), (5, 13)])); cv.flat(ell_mask(18, 18, 9, 9, 3.2, 3.2), hexc('#303040')); cv.put(8, 8, hexc('#ffffff'))
    elif name == 'swap':
        S(poly_mask(18, 18, [(2, 6), (10, 6), (10, 3), (16, 7.5), (10, 12), (10, 9), (2, 9)])); S(poly_mask(18, 18, [(16, 10), (8, 10), (8, 7), (2, 11.5), (8, 16), (8, 13), (16, 13)]))
    elif name == 'pause':
        S(rect_mask(18, 18, 4, 3, 8, 15)); S(rect_mask(18, 18, 10, 3, 14, 15))
    elif name == 'strike':
        S(poly_mask(18, 18, [(14, 1), (17, 4), (7, 14), (4, 11)])); S(rect_mask(18, 18, 2, 12, 8, 14)); cv.shade(capsule_mask(18, 18, 4, 14, 2, 17, 1.4, 1.4), WOOD, rad=1)
    elif name == 'roll':
        for a in np.linspace(.5, 5.4, 30): S(ell_mask(18, 18, 9 + 6 * math.cos(a), 9 + 6 * math.sin(a), 1.6, 1.6))
        S(poly_mask(18, 18, [(13, 2), (17, 8), (10, 7)]))
    elif name == 'nova':
        for a in range(0, 360, 45): S(capsule_mask(18, 18, 9 + 3 * math.cos(math.radians(a)), 9 + 3 * math.sin(math.radians(a)), 9 + 8 * math.cos(math.radians(a)), 9 + 8 * math.sin(math.radians(a)), 1.2, 1.2))
        S(ell_mask(18, 18, 9, 9, 3, 3))
    elif name == 'gem':
        S(poly_mask(18, 18, [(9, 1), (14, 7), (9, 17), (4, 7)]))
    elif name == 'secret':
        S(ell_mask(18, 18, 9, 8, 5, 5) & ~ell_mask(18, 18, 9, 8, 3, 3)); S(rect_mask(18, 18, 8, 12, 10, 14)); S(ell_mask(18, 18, 9, 16, 1.4, 1.4))
    cv.outline((24, 20, 36), strength=.8); return cv.img()

ICONS = ['smoke', 'bell', 'flute', 'dash', 'fire', 'hand', 'eye', 'swap', 'pause', 'strike', 'roll', 'nova', 'gem', 'secret']

def heart(full):
    cv = Cv(18, 16)
    m = ell_mask(18, 16, 5.2, 5.6, 4.6, 4.4) | ell_mask(18, 16, 12.8, 5.6, 4.6, 4.4) | poly_mask(18, 16, [(.6, 7), (17.4, 7), (9, 15.4)])
    if full: cv.shade(m, ramp('#e83048', '#4a0a20', '#ffa0a8'), rad=3.4, k=1.1, rim='all')
    else: cv.flat(m, hexc('#1a1020')); cv.shade(m & ~_erode(m), ramp('#3a2a44', '#140a1c', '#6a5a78'), rad=1)
    if full: cv.put(4, 3, hexc('#ffffff')); cv.put(5, 3, hexc('#ffd0d4')); cv.put(3, 4, hexc('#ffd0d4'))
    cv.outline((30, 8, 20), strength=.9); return cv.img()

def build():
    s = {}
    s['heart_full'] = heart(True); s['heart_empty'] = heart(False)
    for i in range(3): s['gem%d' % i] = gem(i)
    s['cluster'] = cluster(); s['relic0'] = relic(0); s['relic1'] = relic(1); s['scroll'] = scroll(); s['keg'] = keg()
    for i in range(3): s['egg%d' % i] = egg(i)
    s['beacon_out'] = beacon('out'); s['beacon_unlit'] = beacon('unlit')
    for i in range(3): s['beacon_lit%d' % i] = beacon('lit', i)
    s['plate_plain'] = plate_plain()
    for i in range(3): s['plate_rattle%d' % i] = plate_rattle(i)
    s['plate_dart0'] = plate_dart(False); s['plate_dart1'] = plate_dart(True)
    for i in range(3): s['rot%d' % i] = rot(i)
    s['grate_closed'] = grate(False); s['grate_open'] = grate(True)
    s['steps'] = steps(); s['hatch'] = hatch(); s['well'] = well(); s['unfound'] = unfound()
    s['lever_off'] = lever(False); s['lever_on'] = lever(True)
    for k in ('stone', 'reliquary', 'box'):
        s['cache_%s_closed' % k] = cache(k, False); s['cache_%s_open' % k] = cache(k, True)
    s['note'] = note(); s['portcullis'] = portcullis()
    s['i_bones'] = i_bones(); s['i_tablet'] = i_tablet(); s['i_banner'] = i_banner()
    s['s_tally'] = s_tally(); s['s_chime'] = s_chime(); s['s_fshell'] = s_fshell(); s['s_fstraw'] = s_fstraw(); s['s_fclaw'] = s_fclaw()
    s['crack0'] = crack(0); s['crack1'] = crack(1)
    s['arch_ns'] = arch_ns(); s['cage'] = cage(); s['beam'] = beam()
    s['m_alert'] = marker('alert'); s['m_quest'] = marker('quest'); s['m_star'] = star()
    for n in ICONS: s['ic_' + n] = icon(n)
    return s

if __name__ == '__main__':
    s = build(); x = y = rowh = 0; W_ = 520; pos = {}
    for n, im in s.items():
        if x + im.width > W_: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    sh = Image.new('RGBA', (W_, y + rowh), (58, 52, 72, 255))
    for n, im in s.items(): sh.alpha_composite(im, pos[n])
    preview(sh, '/tmp/phase2_prev.png', scale=3); print(len(s))
