"""Ashfall Keep furniture and set dressing, drawn for the same light and the same ink as the people.
Each prop is a 3/4 view object standing on its footprint; the game stamps it by the middle of its bottom edge."""
import os, random, math
from pix import *

WOOD = ramp('#8a5a38', '#2a1418', '#f0b878')
WOODD = ramp('#6a4630', '#22101a', '#d09060')
IRON = ramp('#6a6e88', '#16183a', '#d8def0')
BONE = ramp('#d8cfb8', '#5a3a58', '#fffbe8')
PLUM = ramp('#7a3a6a', '#26102c', '#f0a0c0')
STONE = ramp('#8a84a0', '#201838', '#e8e0f8')
STONED = ramp('#6a6484', '#1a1230', '#c8c0e0')
CLOTH = ramp('#a08a68', '#3a2430', '#f0e0b8')
STRAW = ramp('#c8a860', '#5a3a30', '#fff0a0')
BRASS = ramp('#d9a441', '#5a2a22', '#fff0a0')
EMBER = ramp('#ff9a3a', '#a02a18', '#fff4c0')
INK = (26, 14, 34)

def planks(cv, x0, y0, x1, y1, rp, vertical=False, step=5, rnd=None):
    rnd = rnd or random.Random(3)
    m = rect_mask(cv.w, cv.h, x0, y0, x1, y1); cv.shade(m, rp, rad=2.2, k=.6, rim=None)
    if vertical:
        for x in range(int(x0) + step, int(x1), step): cv.a[int(y0):int(y1), x] = rp[0]
    else:
        for y in range(int(y0) + step, int(y1), step): cv.a[y, int(x0):int(x1)] = rp[0]
    for _ in range(int((x1 - x0) * (y1 - y0) / 60)):
        gx, gy = rnd.randrange(int(x0) + 1, int(x1) - 1), rnd.randrange(int(y0) + 1, int(y1) - 1)
        cv.put(gx, gy, rp[1] if rnd.random() < .6 else rp[3])

def crate(seed=1):
    cv = Cv(34, 40); rnd = random.Random(seed)
    planks(cv, 2, 14, 32, 36, WOOD, rnd=rnd)                              # front
    cv.shade(rect_mask(34, 40, 2, 4, 32, 15), WOOD, rad=2.0, k=.4, bias=.18)   # lid, seen from above
    for x in range(8, 32, 7): cv.a[4:15, x] = WOOD[0]
    for (x0, x1) in ((2, 6), (28, 32)):
        cv.shade(rect_mask(34, 40, x0, 14, x1, 36), IRON, rad=1.6, rim='all')   # corner irons
        cv.shade(rect_mask(34, 40, x0, 4, x1, 15), IRON, rad=1.6, rim='all', bias=.1)
    for (x, y) in ((4, 17), (4, 33), (30, 17), (30, 33)): cv.put(x, y, IRON[4])
    cv.stamp(13, 21, ['..X..', '.XXX.', 'X.X.X', '.XXX.', '..X..'], {'X': BONE[2]})     # Marrow's stamp
    cv.outline(INK); return cv.img()

def crates(seed=2):
    cv = Cv(68, 52); rnd = random.Random(seed)
    # big crate left, small crate right and a sack on top
    planks(cv, 2, 26, 34, 48, WOOD, rnd=rnd); cv.shade(rect_mask(68, 52, 2, 16, 34, 27), WOOD, rad=2, k=.4, bias=.18)
    for (x0, x1) in ((2, 6), (30, 34)):
        cv.shade(rect_mask(68, 52, x0, 16, x1, 48), IRON, rad=1.6, rim='all')
    planks(cv, 36, 32, 62, 48, WOODD, rnd=rnd); cv.shade(rect_mask(68, 52, 36, 23, 62, 33), WOODD, rad=2, k=.4, bias=.18)
    for (x0, x1) in ((36, 39), (59, 62)): cv.shade(rect_mask(68, 52, x0, 23, x1, 48), IRON, rad=1.4, rim='all')
    sack = ell_mask(68, 52, 16, 12, 9, 7); cv.shade(sack, CLOTH, rad=3.5, rim='all')
    cv.flat(rect_mask(68, 52, 14, 5, 19, 8), CLOTH[1]); cv.put(16, 6, CLOTH[3])
    cv.stamp(14, 33, ['..X..', '.XXX.', 'X.X.X', '.XXX.', '..X..'], {'X': BONE[2]})
    cv.outline(INK); return cv.img()

def barrel(seed=3):
    cv = Cv(30, 40); rnd = random.Random(seed)
    body = ell_mask(30, 40, 15, 24, 12.5, 14) & ~rect_mask(30, 40, 0, 0, 30, 14)
    body |= rect_mask(30, 40, 3, 14, 27, 34) & ell_mask(30, 40, 15, 24, 12.6, 14.5)
    cv.shade(body, WOOD, rad=7, k=1.0, rim='br')
    for x in range(6, 26, 4): cv.a[14:36, x] = np.where((cv.a[14:36, x, 3] > 0)[:, None], np.array(WOOD[0], np.uint8), cv.a[14:36, x])
    for y in (18, 31):
        row = (cv.a[y, :, 3] > 0); cv.a[y, row] = IRON[2]; cv.a[y + 1, (cv.a[y + 1, :, 3] > 0)] = IRON[0]
        cv.a[y, 5:9] = np.where((cv.a[y, 5:9, 3] > 0)[:, None], np.array(IRON[4], np.uint8), cv.a[y, 5:9])
    top = ell_mask(30, 40, 15, 12, 11.2, 5.2); cv.shade(top, WOOD, rad=3, k=.4, bias=.25, rim='all')
    cv.shade(ell_mask(30, 40, 15, 12, 8, 3.2), WOODD, rad=2, bias=-.2)
    cv.outline(INK); return cv.img()

def table(seed=4):
    cv = Cv(72, 52); rnd = random.Random(seed)
    for x in (6, 60):    # legs
        cv.shade(rect_mask(72, 52, x, 28, x + 6, 50), WOODD, rad=2, rim='all')
    cv.shade(rect_mask(72, 52, 3, 24, 69, 36), WOODD, rad=2, k=.6, rim='all')       # apron / front
    planks(cv, 3, 10, 69, 25, WOOD, vertical=True, step=11, rnd=rnd)                # top surface, lit
    cv.a[24, 3:69] = WOOD[4]
    cv.a[10, 3:69] = WOOD[4]
    # a tallow candle, a bowl, a bone-handled knife
    cv.flat(rect_mask(72, 52, 17, 7, 20, 15), BONE[2]); cv.flat(rect_mask(72, 52, 17, 7, 18, 15), BONE[3])
    cv.put(18, 5, EMBER[1]); cv.put(18, 4, EMBER[2]); cv.put(19, 5, EMBER[0])
    cv.shade(ell_mask(72, 52, 42, 15, 7, 3.6), STONED, rad=2, rim='all'); cv.shade(ell_mask(72, 52, 42, 14, 5.2, 2.2), ramp('#3a2030', '#12081c', '#8a5a58'), rad=1)
    cv.flat(rect_mask(72, 52, 54, 17, 62, 19), IRON[3]); cv.flat(rect_mask(72, 52, 50, 17, 54, 19), BONE[2])
    cv.outline(INK); return cv.img()

def bench(seed=5):
    cv = Cv(70, 34); rnd = random.Random(seed)
    for x in (8, 58): cv.shade(rect_mask(70, 34, x, 14, x + 6, 31), WOODD, rad=2, rim='all')
    planks(cv, 3, 6, 67, 18, WOOD, vertical=True, step=13, rnd=rnd); cv.a[17, 3:67] = WOOD[4]
    cv.shade(rect_mask(70, 34, 3, 17, 67, 21), WOODD, rad=1.5, rim='all')
    cv.outline(INK); return cv.img()

def cot(seed=6):
    cv = Cv(70, 44); rnd = random.Random(seed)
    cv.shade(rect_mask(70, 44, 4, 16, 66, 38), WOODD, rad=2.5, rim='all')           # frame
    cv.shade(rect_mask(70, 44, 3, 8, 67, 31), STRAW, rad=2.5, k=.5, bias=.1, rim='all')  # mattress, from above
    blanket = poly_mask(70, 44, [(20, 8), (67, 8), (67, 31), (20, 31), (23, 20)])
    cv.shade(blanket, PLUM, rad=3.5, rim='all', bias=.05)
    cv.stamp(40, 14, ['..XXX..', '.XX....', 'XX.....', 'XX.....', '.XX....', '..XXX..'], {'X': BONE[3]})
    cv.shade(ell_mask(70, 44, 11, 17, 7, 6), CLOTH, rad=3, rim='all')            # pillow
    cv.shade(rect_mask(70, 44, 2, 6, 6, 40), WOODD, rad=1.6, rim='all'); cv.shade(rect_mask(70, 44, 64, 8, 68, 40), WOODD, rad=1.6, rim='all')
    cv.outline(INK); return cv.img()

def weaponrack(seed=7):
    cv = Cv(36, 56); rnd = random.Random(seed)
    for k, x in enumerate((9, 17, 25)):    # three pikes leaning in the rack
        cv.flat(capsule_mask(36, 56, x, 51, x - 1 + k * .6, 7, .9, .9), WOOD[2]); cv.flat(capsule_mask(36, 56, x - .3, 51, x - 1.3 + k * .6, 7, .3, .3), WOOD[3])
        cv.shade(poly_mask(36, 56, [(x - 3.2 + k * .6, 8), (x - 1 + k * .6, 0), (x + 1.4 + k * .6, 8)]), IRON, rad=1.5, rim='all')
    cv.shade(rect_mask(36, 56, 3, 28, 33, 33), WOODD, rad=1.6, rim='all')
    cv.shade(rect_mask(36, 56, 3, 44, 33, 49), WOODD, rad=1.6, rim='all')
    for x in (4, 31): cv.shade(rect_mask(36, 56, x, 26, x + 3, 53), WOOD, rad=1.4, rim='all')
    cv.outline(INK); return cv.img()

def sacks(seed=8):
    cv = Cv(40, 36)
    for (cx, cy, rx, ry) in ((13, 26, 11, 9), (28, 28, 9, 7), (20, 16, 9, 8)):
        cv.shade(ell_mask(40, 36, cx, cy, rx, ry), CLOTH, rad=4.5, rim='all')
        cv.flat(rect_mask(40, 36, cx - 2.5, cy - ry + 1, cx + 2.5, cy - ry + 3.5), CLOTH[1]); cv.put(cx, cy - ry + 1, CLOTH[3])
    cv.outline(INK); return cv.img()

def statue(seed=9):
    """The hooded mourner: Marrow carves its dead at the gate, a skull-lantern cupped in both hands."""
    cv = Cv(40, 68)
    cv.shade(rect_mask(40, 68, 6, 54, 34, 66), STONED, rad=2.4, rim='all')                # plinth
    cv.shade(rect_mask(40, 68, 9, 50, 31, 55), STONE, rad=1.6, rim='all')
    robe = poly_mask(40, 68, [(14, 24), (26, 24), (31, 51), (9, 51)]); cv.shade(robe, STONE, rad=5, rim='all')
    for x in (13, 18, 23, 27): cv.a[34:50, x] = np.where((cv.a[34:50, x, 3] > 0)[:, None], np.array(STONED[1], np.uint8), cv.a[34:50, x])
    cv.shade(ell_mask(40, 68, 20, 17, 8.2, 9.2), STONE, rad=4.5, rim='all')              # hood
    cv.shade(ell_mask(40, 68, 20, 19, 5.2, 6.0), ramp('#2a2038', '#0e0818', '#6a5a88'), rad=2.2)  # shadowed face
    cv.put(18, 19, BONE[3]); cv.put(22, 19, BONE[3])                                       # two pale eyes
    for sx in (-1, 1): cv.shade(capsule_mask(40, 68, 20 + sx * 7, 28, 20 + sx * 3, 40, 2.4, 2.0), STONE, rad=2, rim='all')
    cv.shade(ell_mask(40, 68, 20, 41, 5, 4.4), BONE, rad=2.4, rim='all')                  # the skull
    cv.flat(rect_mask(40, 68, 17.4, 40, 19.2, 42), hexc('#1a1020')); cv.flat(rect_mask(40, 68, 20.8, 40, 22.6, 42), hexc('#1a1020'))
    cv.put(20, 43, hexc('#1a1020')); cv.put(20, 38, EMBER[2]); cv.put(20, 37, EMBER[1])   # a small flame in the skull
    cv.outline(INK); return cv.img()

def sarcophagus(seed=10):
    cv = Cv(72, 52)
    cv.shade(rect_mask(72, 52, 4, 24, 68, 46), STONED, rad=3, rim='all')                   # chest
    cv.shade(rect_mask(72, 52, 2, 10, 70, 28), STONE, rad=2.5, k=.5, bias=.15, rim='all')   # lid
    cv.shade(rect_mask(72, 52, 5, 12, 67, 17), STONE, rad=1, bias=.25)
    cv.stamp(10, 14, ['.XXX.', 'XXXXX', 'X.X.X', '.XXX.', '..X..'], {'X': BONE[3]})      # skull relief
    cv.flat(rect_mask(72, 52, 22, 17, 62, 19), BONE[2]); cv.flat(rect_mask(72, 52, 22, 21, 62, 23), BONE[1])
    for x in range(26, 62, 8): cv.flat(rect_mask(72, 52, x, 16, x + 2, 24), BONE[2])      # ribs
    cv.outline(INK); return cv.img()

def skull():
    cv = Cv(14, 12)
    cv.shade(ell_mask(14, 12, 7, 5.5, 5.4, 4.6), BONE, rad=2.6, rim='all'); cv.flat(rect_mask(14, 12, 4.6, 8, 9.4, 11), BONE[2])
    cv.flat(rect_mask(14, 12, 3.6, 4.6, 6.2, 7), hexc('#1a1020')); cv.flat(rect_mask(14, 12, 7.8, 4.6, 10.4, 7), hexc('#1a1020'))
    cv.put(6, 9, hexc('#1a1020')); cv.put(8, 9, hexc('#1a1020')); cv.outline(INK); return cv.img()

def bone(k):
    cv = Cv(18, 8)
    a, b = ((2, 5), (15, 2)) if k == 0 else ((2, 2), (15, 5))
    cv.flat(capsule_mask(18, 8, a[0] + 1, a[1], b[0] - 1, b[1], 1.0, 1.0), BONE[2])
    for (x, y) in (a, b):
        cv.shade(ell_mask(18, 8, x, y - .6, 1.8, 1.8), BONE, rad=1.4); cv.shade(ell_mask(18, 8, x, y + 1, 1.8, 1.4), BONE, rad=1.2)
    cv.outline(INK, strength=.7); return cv.img()

def web():
    cv = Cv(32, 32); C = hexc('#d8d0e8')
    for k in range(5):
        x = int(k * 7.2); 
        for t in range(0, 30):
            px_, py_ = t * (x / 30.0), t * ((30 - x) / 30.0) * 0 + t * (1 - x / 36.0)
            if 0 <= int(px_) < 32 and 0 <= int(py_) < 32: cv.a[int(py_), int(px_)] = (*C[:3], 150)
    for r in (7, 13, 20):
        for t in range(0, 91, 3):
            a = math.radians(t); x, y = int(r * math.cos(a)), int(r * math.sin(a))
            if 0 <= x < 32 and 0 <= y < 32: cv.a[y, x] = (*C[:3], 130)
    return cv.img()

def chain():
    cv = Cv(14, 30)
    for k, x in enumerate((4, 10)):
        for i in range(0, 26, 5):
            wide = (i // 5) % 2 == 0
            ring = ell_mask(14, 30, x, 4 + i + k * 2, 2.6 if wide else 1.5, 3.2) & ~ell_mask(14, 30, x, 4 + i + k * 2, 1.2 if wide else .4, 1.8)
            cv.shade(ring, ramp('#b4b8c8', '#524c6c', '#ffffff'), rad=1.2)
    cv.outline(INK, strength=.6); return cv.img()

def banner_only():
    cv = Cv(32, 32)
    cv.flat(rect_mask(32, 32, 5, 2, 27, 4), BRASS[2]); cv.flat(rect_mask(32, 32, 5, 2, 27, 3), BRASS[4])
    cv.flat(rect_mask(32, 32, 4, 1, 6, 5), BRASS[3]); cv.flat(rect_mask(32, 32, 26, 1, 28, 5), BRASS[3])
    cloth = poly_mask(32, 32, [(8, 4), (24, 4), (24, 25), (16, 29), (8, 25)])
    cv.shade(cloth, PLUM, rad=3.0, rim='all', bias=.1)
    crescent = ell_mask(32, 32, 16, 13, 5.2, 5.2) & ~ell_mask(32, 32, 18, 12, 4.4, 4.6)
    cv.shade(crescent, BONE, rad=1.8)
    cv.put(16, 20, BONE[3]); cv.put(17, 20, BONE[3]); cv.put(16, 21, BONE[2]); cv.put(17, 21, BONE[2])
    cv.outline(INK, strength=.7); return cv.img()

def sconce(cv, lit_head):
    cv.shade(rect_mask(24, 40, 9, 30, 15, 39), IRON, rad=1.6, rim='all')                       # wall plate
    cv.shade(rect_mask(24, 40, 11, 24, 13, 31), IRON, rad=1.2, rim='all')                      # arm
    cv.shade(poly_mask(24, 40, [(5, 19), (19, 19), (16, 26), (8, 26)]), IRON, rad=1.6, rim='all')   # cup
    cv.shade(rect_mask(24, 40, 9, 11, 15, 20), lit_head, rad=1.4, rim='all')                   # wrapped head
    cv.put(12, 36, IRON[4])

def torch_frames():
    out = []
    for f in range(3):
        cv = Cv(24, 40); sconce(cv, WOOD)
        sway = (-1, 0, 1)[f]
        fl = poly_mask(24, 40, [(8 + sway, 13), (9, 6), (11 + sway, 2 + (f % 2)), (13 - sway * .5, 6), (16, 13)])
        cv.shade(fl, EMBER, rad=3, bias=.15)
        cv.flat(poly_mask(24, 40, [(10, 13), (11 + sway * .5, 6), (13, 13)]), EMBER[4])
        cv.outline((60, 16, 24), strength=.6)
        out.append(cv.img())
    off = Cv(24, 40); sconce(off, WOODD); off.outline(INK); out.append(off.img())
    return out

def build(OUT):
    sprites = [('crate', crate(1)), ('crate_b', crate(2)), ('crates', crates()), ('barrel', barrel()), ('table', table()), ('bench', bench()), ('cot', cot()),
               ('weaponrack', weaponrack()), ('sacks', sacks()), ('statue', statue()), ('sarcophagus', sarcophagus())]
    sprites += [('skull', skull()), ('bone0', bone(0)), ('bone1', bone(1)), ('web', web()), ('chain', chain()), ('banner', banner_only())]
    for i, f in enumerate(torch_frames()): sprites.append(('torch%d' % i if i < 3 else 'torchOff', f))
    # shelf pack
    x = y = rowh = 0; W = 256; pos = {}
    for n, im in sprites:
        if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
        pos[n] = [x, y, im.width, im.height]; x += im.width + 1; rowh = max(rowh, im.height)
    sh = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
    for n, im in sprites: sh.alpha_composite(im, tuple(pos[n][:2]))
    sh.save(os.path.join(OUT, 'props.png'))
    return {'props': pos}

if __name__ == '__main__':
    import tempfile
    d = tempfile.mkdtemp(); build(d); im = Image.open(os.path.join(d, 'props.png')); preview(im, '/tmp/props_prev.png', scale=4)
