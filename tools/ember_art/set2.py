"""Ashfall Keep, second set: doors and gates, chests, pots and urns, braziers, a Marrow rug kit, floor details, cool wall-shadow
overlays and the ruined state. Same painter, same light, same ink as the rest of the slice."""
import os, random, math
import numpy as np
from pix import *
from props_ashfall import WOOD, WOODD, IRON, BONE, PLUM, STONE, STONED, CLOTH, STRAW, BRASS, EMBER, INK
import tiles_ashfall as TA

T = 32
CLAY = ramp('#b8663c', '#3a1430', '#ffc890')
CLAYD = ramp('#8a4a34', '#2a1028', '#e89870')
GLAZE = ramp('#7a3a6a', '#26102c', '#f0a0c0')
CHAR = ramp('#3a2a2c', '#100810', '#8a6a6a')      # burnt wood
GOLD = ramp('#e2ac48', '#6a3a22', '#fff4b0')

def new(w=T, h=T): return Cv(w, h)

# ---------------------------------------------------------------- doors and gates (one wall gap, 32x32)
def door_closed():
    cv = new(); W_, H_ = T, T
    cv.shade(rect_mask(W_, H_, 0, 0, 6, 32), STONED, rad=2, rim='all'); cv.shade(rect_mask(W_, H_, 26, 0, 32, 32), STONED, rad=2, rim='all')   # jambs
    cv.shade(rect_mask(W_, H_, 0, 0, 32, 6), STONE, rad=2, rim='all')                                                          # lintel
    for x0 in (6, 13, 20):
        cv.shade(rect_mask(W_, H_, x0, 6, x0 + 7, 32), WOOD, rad=2.2, k=.7, rim='br')                                          # three planks
    for y in (11, 25):
        cv.shade(rect_mask(W_, H_, 6, y, 26, y + 3), IRON, rad=1.4, rim='all')                                                 # iron straps
        for x in (8, 14, 20, 24): cv.put(x, y + 1, IRON[4])
    cv.shade(ell_mask(W_, H_, 22.5, 19, 2.3, 2.3), BRASS, rad=1.4, rim='all'); cv.put(22, 18, BRASS[4])                          # ring pull
    cv.flat(rect_mask(W_, H_, 20, 14, 25, 16), BRASS[1]); cv.put(22, 15, BRASS[3])
    cv.outline(INK, strength=.5); return cv.img()

def door_open():
    cv = new()
    cv.shade(rect_mask(T, T, 0, 0, 6, 32), STONED, rad=2, rim='all'); cv.shade(rect_mask(T, T, 26, 0, 32, 32), STONED, rad=2, rim='all')
    cv.shade(rect_mask(T, T, 0, 0, 32, 6), STONE, rad=2, rim='all')
    cv.shade(poly_mask(T, T, [(6, 6), (11, 8), (11, 32), (6, 32)]), WOOD, rad=1.6, rim='all')                                    # the leaf, swung back
    for y in (11, 25): cv.shade(rect_mask(T, T, 6, y, 11, y + 3), IRON, rad=1.2, rim='all')
    cv.flat(rect_mask(T, T, 6, 6, 26, 9), hexc('#120c20')); cv.a[6:9, 6:26, 3] = 120                                          # a soft shadow under the lintel
    cv.outline(INK, strength=.5); return cv.img()

def gate(open_):
    cv = new()
    cv.shade(rect_mask(T, T, 0, 0, 5, 32), STONED, rad=2, rim='all'); cv.shade(rect_mask(T, T, 27, 0, 32, 32), STONED, rad=2, rim='all')
    cv.shade(rect_mask(T, T, 0, 0, 32, 6), STONE, rad=2, rim='all')
    bot = 12 if open_ else 31
    for x in range(8, 26, 4):
        cv.shade(rect_mask(T, T, x, 6, x + 2, bot), IRON, rad=1.0, rim='all')
        cv.shade(poly_mask(T, T, [(x - .6, bot), (x + 1, bot + 3.4), (x + 2.6, bot)]), IRON, rad=1.0, rim='all') if open_ else None
    for y in ((9,) if open_ else (10, 21)):
        cv.shade(rect_mask(T, T, 5, y, 27, y + 2), IRON, rad=1.0, rim='all')
    cv.outline(INK, strength=.5); return cv.img()

def sealed(f):
    cv = new()
    cv.shade(rect_mask(T, T, 2, 1, 30, 31), ramp('#46346a', '#140c2c', '#a890e8'), rad=3, rim='all')
    a = (0, 1)[f]; col = (190 + 40 * a, 160 + 50 * a, 255, 255)
    for (x, y) in ((16, 6), (17, 7), (18, 8), (19, 9), (20, 10), (21, 11), (22, 12), (23, 13), (24, 14), (24, 15), (24, 16), (23, 17), (22, 18), (21, 19), (20, 20), (19, 21), (18, 22), (17, 23), (16, 24)): cv.put(x, y, col)
    for (x, y) in ((15, 7), (14, 8), (13, 9), (12, 10), (11, 11), (10, 12), (9, 13), (8, 14), (8, 15), (8, 16), (9, 17), (10, 18), (11, 19), (12, 20), (13, 21), (14, 22), (15, 23)): cv.put(x, y, col)
    for i in range(11, 22): cv.put(16, i, col); cv.put(i - 1, 15, col)
    cv.outline(INK, strength=.5); return cv.img()

# ---------------------------------------------------------------- chests (34x30)
def chest(open_):
    cv = new(34, 32)
    cv.shade(rect_mask(34, 32, 3, 12, 31, 29), WOOD, rad=3, k=.8, rim='all')                              # body
    for x in (9, 17, 25): cv.a[13:28, x] = WOOD[0]
    for x0 in (3, 28): cv.shade(rect_mask(34, 32, x0, 12, x0 + 3, 29), IRON, rad=1.2, rim='all')
    cv.shade(rect_mask(34, 32, 3, 19, 31, 22), IRON, rad=1.2, rim='all')
    if not open_:
        cv.shade(ell_mask(34, 32, 17, 12, 14.5, 8) & rect_mask(34, 32, 0, 0, 34, 14), WOODD, rad=4, rim='all', bias=.1)    # domed lid
        cv.shade(rect_mask(34, 32, 15, 12, 19, 19), IRON, rad=1.2, rim='all')
        cv.shade(rect_mask(34, 32, 15, 16, 19, 21), BRASS, rad=1.4, rim='all'); cv.put(17, 18, BRASS[0])                # lock
        cv.stamp(10, 8, ['.XX', 'X..', 'X..', '.XX'], {'X': BONE[3]})                                         # bone crescent inlay
    else:
        cv.shade(rect_mask(34, 32, 5, 12, 29, 17), hexc('#140c20') and ramp('#2a1a30', '#0a0410', '#6a4a60'), rad=1)         # dark inside
        cv.shade(poly_mask(34, 32, [(3, 11), (31, 11), (29, 2), (5, 2)]), WOODD, rad=2.2, rim='all')              # lid swung up
        cv.shade(rect_mask(34, 32, 3, 8, 31, 11), IRON, rad=1.0, rim='all')
        for (x, y, c) in ((12, 15, GOLD[3]), (16, 14, GOLD[4]), (20, 15, GOLD[2]), (23, 14, GOLD[3])): cv.put(x, y, c); cv.put(x + 1, y, GOLD[1])
    cv.outline(INK); return cv.img()

# ---------------------------------------------------------------- pots and urns
def pot():
    cv = new(26, 30)
    body = ell_mask(26, 30, 13, 19, 9.5, 9.5) | rect_mask(26, 30, 9, 8, 17, 13)
    cv.shade(body, CLAY, rad=5, rim='br')
    cv.shade(ell_mask(26, 30, 13, 9, 5.8, 2.6), CLAYD, rad=1.6, rim='all')           # rim
    cv.flat(ell_mask(26, 30, 13, 9, 3.8, 1.5), hexc('#1c0e1c'))                      # dark mouth
    for x in range(6, 21): cv.put(x, 17 + (1 if x % 4 == 0 else 0), CLAYD[0])        # painted band
    for x in range(8, 19, 3): cv.put(x, 21, BONE[2])
    cv.outline(INK); return cv.img()

def urn():
    cv = new(26, 34)
    body = ell_mask(26, 34, 13, 21, 8.5, 11) | rect_mask(26, 34, 10, 6, 16, 14)
    cv.shade(body, ramp('#d8cfb8', '#5a3a58', '#fffbe8'), rad=5, rim='br')
    cv.shade(ell_mask(26, 34, 13, 7, 5.2, 2.2), BONE, rad=1.5, rim='all'); cv.flat(ell_mask(26, 34, 13, 7, 3.4, 1.2), hexc('#1c1020'))
    cv.shade(rect_mask(26, 34, 5, 17, 21, 20), GLAZE, rad=1.5, rim='all')           # plum glaze band
    cv.stamp(11, 22, ['.XX.', 'X...', 'X...', '.XX.'], {'X': GLAZE[2]})              # crescent
    cv.shade(ell_mask(26, 34, 5, 16, 2.2, 3.5), BONE, rad=1.2, rim='all'); cv.shade(ell_mask(26, 34, 21, 16, 2.2, 3.5), BONE, rad=1.2, rim='all')   # handles
    cv.outline(INK); return cv.img()

# ---------------------------------------------------------------- braziers (30x42): lit frames and unlit
def brazier(state):
    cv = new(30, 42)
    for x in (7, 15, 23): cv.shade(capsule_mask(30, 42, 15, 30, x, 40, 1.4, 1.1), IRON, rad=1.2, rim='all')        # tripod
    cv.shade(poly_mask(30, 42, [(4, 22), (26, 22), (22, 32), (8, 32)]), IRON, rad=3, rim='all')                  # bowl
    cv.shade(rect_mask(30, 42, 3, 20, 27, 24), ramp('#8a90a8', '#26284a', '#e8eeff'), rad=1.2, rim='all')           # rim
    if state == 'off':
        cv.flat(ell_mask(30, 42, 15, 21, 11, 2.2), hexc('#140c1c'))
        cv.put(12, 21, hexc('#5a4a5a')); cv.put(17, 20, hexc('#6a5a6a'))
    else:
        cv.flat(ell_mask(30, 42, 15, 21, 11, 2.2), hexc('#ff7a2a')); cv.flat(ell_mask(30, 42, 15, 21, 7, 1.4), hexc('#ffd070'))
        k = state - 1
        fl = poly_mask(30, 42, [(7, 21), (8, 12 - k), (11, 6 - k * 2), (13, 11), (15, 1 + k), (18, 10), (20, 5 - k), (23, 13), (24, 21)])
        cv.shade(fl, EMBER, rad=4, bias=.18)
        cv.flat(poly_mask(30, 42, [(11, 21), (13, 12), (15, 7 - k), (17, 12), (19, 21)]), EMBER[4])
    cv.outline((60, 16, 24) if state != 'off' else INK, strength=.6); return cv.img()

# ---------------------------------------------------------------- the Marrow rug kit: 16x16 pieces
RUG = ramp('#4a2250', '#180a24', '#b060a8'); RUG2 = ramp('#5a2e68', '#200c34', '#c888c8'); RUGB = ramp('#38183a', '#100614', '#904878')
def rug_kit(variant=0):
    rp, rb = (RUG, RUGB) if variant == 0 else (ramp('#5a2a3a', '#200a18', '#d07888'), ramp('#401c2a', '#14060c', '#a85868'))
    pieces = {}
    def base():
        cv = Cv(16, 16); cv.a[:] = rp[2]
        for y in range(16):
            for x in range(16):
                if (x + y) % 4 == 0: cv.a[y, x] = rb[2]                      # woven diagonal
                if (x * 3 + y * 5) % 17 == 0: cv.a[y, x] = rp[3]              # lighter threads
        return cv
    f = base(); pieces['field'] = f
    # edge (top border), runs along x
    e = base()
    e.a[0:2, :] = hexc('#1a0c20'); e.a[2:4, :] = BONE[2]; e.a[4, :] = GOLD[2]; e.a[5:7, :] = rb[1]
    for x in range(0, 16, 4): e.a[3, x] = BONE[4]
    pieces['edge'] = e
    c = base()
    c.a[0:2, :] = hexc('#1a0c20'); c.a[:, 0:2] = hexc('#1a0c20'); c.a[2:4, 2:] = BONE[2]; c.a[2:, 2:4] = BONE[2]; c.a[4, 4:] = GOLD[2]; c.a[4:, 4] = GOLD[2]
    c.a[5:7, 5:] = rb[1]; c.a[5:, 5:7] = rb[1]; c.a[2:5, 2:5] = BONE[3]; c.put(3, 3, GOLD[4])
    pieces['corner'] = c
    # fringe tuft along the short ends
    fr = Cv(16, 16)
    for x in range(16): fr.a[0:5, x] = (BONE[2] if x % 2 else CLOTH[2]); fr.a[5, x] = (0, 0, 0, 0) if x % 3 == 0 else CLOTH[1]
    pieces['fringe'] = fr
    # centre medallion 32x32: a bone crescent in a plum diamond
    m = Cv(32, 32); m.a[:] = (0, 0, 0, 0)
    dia = poly_mask(32, 32, [(16, 1), (31, 16), (16, 31), (1, 16)]); m.shade(dia, RUG2 if variant == 0 else rp, rad=3, bias=.12)
    for (x, y) in [(16 + int(11 * math.cos(a)), 16 + int(11 * math.sin(a))) for a in np.linspace(0, math.tau, 40)]: m.put(x, y, GOLD[2])
    cres = ell_mask(32, 32, 15, 16, 6.4, 6.4) & ~ell_mask(32, 32, 18, 15, 5.6, 5.8); m.shade(cres, BONE, rad=2)
    m.put(21, 14, BONE[4]); m.put(21, 18, BONE[4])
    pieces['medal'] = m
    return pieces

# ---------------------------------------------------------------- floor details (32x32, all tile seamlessly with plain floor at their edges)
def detail_floor(kind, seed):
    base = np.array(TA.floor_tile(seed, 3))   # the big single slab
    cv = Cv(T, T); cv.a = base.copy(); rnd = random.Random(seed * 7 + len(kind))
    if kind == 'drain':
        cv.flat(rect_mask(T, T, 8, 8, 24, 24), hexc('#1a1228'))
        for x in range(10, 23, 3): cv.shade(rect_mask(T, T, x, 9, x + 2, 23), IRON, rad=1.0, rim='all')
        cv.shade(rect_mask(T, T, 8, 8, 24, 10), STONE, rad=1.0); cv.shade(rect_mask(T, T, 8, 22, 24, 24), STONED, rad=1.0)
        for i in range(2): cv.put(12 + i * 6, 27, hexc('#5a7aa8')); cv.put(13 + i * 6, 28, hexc('#7a9ac8'))             # a trail of damp
    elif kind == 'puddle':
        m = ell_mask(T, T, 16, 17, 11, 6)
        cv.flat(m, hexc('#2a2a50')); cv.flat(ell_mask(T, T, 16, 16, 9.5, 4.6), hexc('#3a3e70'))
        cv.flat(ell_mask(T, T, 13, 15, 3.4, 1.4), hexc('#9ab0e8')); cv.put(21, 18, hexc('#8aa0d8')); cv.put(20, 18, hexc('#6a80c0'))
        cv.put(24, 12, hexc('#8aa0d8'))
    elif kind == 'scorch':
        m = ell_mask(T, T, 16, 16, 12, 9)
        for y in range(T):
            for x in range(T):
                if m[y, x] and ((x + y) % 2 == 0 or ell_mask(T, T, 16, 16, 8, 6)[y, x]): cv.a[y, x] = hexc('#241a2c') if ell_mask(T, T, 16, 16, 8, 6)[y, x] else hexc('#3a3050')
        for (x, y) in ((9, 22), (22, 10), (14, 11)): cv.put(x, y, EMBER[1])
    elif kind == 'bones':
        for (x0, y0, x1, y1) in ((8, 20, 20, 17), (12, 12, 23, 22), (6, 10, 14, 8)):
            cv.flat(capsule_mask(T, T, x0, y0, x1, y1, 1.1, 1.1), BONE[2])
            for (x, y) in ((x0, y0), (x1, y1)): cv.shade(ell_mask(T, T, x, y, 1.8, 1.8), BONE, rad=1.2)
        cv.shade(ell_mask(T, T, 22, 12, 4.4, 3.8), BONE, rad=2, rim='all'); cv.flat(rect_mask(T, T, 20, 11, 22, 13), hexc('#1a1020')); cv.flat(rect_mask(T, T, 23, 11, 25, 13), hexc('#1a1020'))
    elif kind == 'crack':
        x, y = 4, 6
        for _ in range(40):
            cv.put(x, y, hexc('#1c1430')); cv.put(x, y + 1, hexc('#4a4262'))
            x += rnd.choice((1, 1, 1, 0)); y += rnd.choice((0, 1, 1)); x = min(x, 31); y = min(y, 30)
        for (x, y) in ((12, 18), (13, 18), (13, 19), (22, 8), (23, 9)): cv.put(x, y, hexc('#5a5278'))
    elif kind == 'rune':
        for a in np.linspace(0, math.tau, 60): cv.put(16 + 10 * math.cos(a), 16 + 10 * math.sin(a), hexc('#7a4a98'))
        for a in np.linspace(0, math.tau, 5, endpoint=False): cv.put(16 + 10 * math.cos(a), 16 + 10 * math.sin(a), hexc('#c8a0f0'))
        for i in range(5):
            a0, a1 = math.radians(-90 + 72 * i), math.radians(-90 + 72 * ((i + 2) % 5))
            for t in np.linspace(0, 1, 14): cv.put(16 + 10 * ((1 - t) * math.cos(a0) + t * math.cos(a1)), 16 + 10 * ((1 - t) * math.sin(a0) + t * math.sin(a1)), hexc('#6a3a88'))
    elif kind == 'rubble':
        for (cx, cy, r) in ((11, 20, 3.4), (18, 22, 2.6), (22, 16, 2.0), (14, 14, 1.8)):
            cv.shade(poly_mask(T, T, [(cx - r, cy + r * .6), (cx - r * .4, cy - r), (cx + r, cy - r * .3), (cx + r * .8, cy + r * .7)]), STONE, rad=2, rim='all')
    return Image.fromarray(cv.a, 'RGBA')

# ---------------------------------------------------------------- cool wall-shadow overlays (dithered, never smooth black)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
def shade_tile(side):
    cv = Cv(T, T)
    for y in range(T):
        for x in range(T):
            if side == 'n': d = max(0, 1 - y / 14.0)
            elif side == 'w': d = max(0, 1 - x / 10.0)
            elif side == 'e': d = max(0, 1 - (31 - x) / 8.0)
            elif side == 'nw': d = max(max(0, 1 - y / 14.0), max(0, 1 - x / 10.0))
            else: d = max(max(0, 1 - y / 14.0), max(0, 1 - (31 - x) / 8.0))
            if d > BAYER[y % 4, x % 4] * .9 + .02: cv.a[y, x] = (14, 14, 44, 255 if d > .55 else 190)
    return cv.img()

def build(OUT):
    sprites = {}
    sprites['door_closed'] = door_closed(); sprites['door_open'] = door_open(); sprites['gate_closed'] = gate(False); sprites['gate_open'] = gate(True)
    sprites['sealed0'] = sealed(0); sprites['sealed1'] = sealed(1)
    sprites['chest_closed'] = chest(False); sprites['chest_open'] = chest(True)
    sprites['pot'] = pot(); sprites['urn'] = urn()
    sprites['brazier_off'] = brazier('off')
    for i in (1, 2, 3): sprites['brazier_on%d' % i] = brazier(i)
    for v in (0, 1):
        for n, cv in rug_kit(v).items(): sprites['rug%d_%s' % (v, n)] = cv.img()
    for i, k in enumerate(('drain', 'puddle', 'scorch', 'bones', 'crack', 'rune', 'rubble')): sprites['floor_' + k] = detail_floor(k, 40 + i)
    for s in ('n', 'w', 'e', 'nw', 'ne'): sprites['shade_' + s] = shade_tile(s)
    return sprites

def pack(sprites, OUT, name):
    x = y = rowh = 0; W = 320; pos = {}
    for n, im in sprites.items():
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = [x, y, im.width, im.height]; x += im.width + 1; rowh = max(rowh, im.height)
    sh = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
    for n, im in sprites.items(): sh.alpha_composite(im, tuple(pos[n][:2]))
    sh.save(os.path.join(OUT, name + '.png')); return pos

if __name__ == '__main__':
    import tempfile
    d = tempfile.mkdtemp(); sp = build(d); pos = pack(sp, d, 'set2'); preview(Image.open(os.path.join(d, 'set2.png')), '/tmp/set2_prev.png', scale=3)
