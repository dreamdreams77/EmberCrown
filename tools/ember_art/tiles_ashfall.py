"""Ashfall Keep (House Marrow) tiles, 32x32: grey-violet flagstone with ash and bone chips, a stone wall face with
ossuary niches, arrow slits and plum banners, and a darker wall top. Marrow keeps its dead close, so bone is the ornament."""
import random, os
import numpy as np
from pix import *

T = 32
ST = ramp('#827c98', '#2a2040', '#e8dcf0')     # flagstone
STD = ramp('#6e6888', '#221a38', '#d0c4e4')    # darker slab
MORT = hexc('#3a3252'); MORT2 = hexc('#2e2642')
BONE = ramp('#d8cfb8', '#5a3a58', '#fffbe8')
PLUM = ramp('#7a3a6a', '#26102c', '#f0a0c0')
WALL = ramp('#5a4a74', '#140c26', '#c8a8d8')
WALLD = ramp('#46385e', '#100820', '#a888c0')
BRASS = ramp('#d9a441', '#5a2a22', '#fff0a0')
IRON = ramp('#6a6e88', '#16183a', '#d8def0')
WOOD = ramp('#8a5a38', '#2a1418', '#e8b070')
EMBER = ramp('#ff9a3a', '#a02a18', '#fff4c0')

def px(a, x, y, c):
    a[y % T, x % T] = c

def bevel_slab(a, x0, y0, w, h, rp, rnd, wrap=True):
    """a flagstone: calm face, one lit row on top, a shaded row below, a speck or two of grain"""
    t = rnd.choice((2, 2, 2, 2, 2, 3))
    for y in range(h):
        for x in range(w):
            c = rp[t]
            if y == 0: c = rp[min(4, t + 1)]
            if y == h - 1: c = rp[max(0, t - 1)]
            px(a, x0 + x, y0 + y, c)
    for _ in range(max(1, w * h // 90)):
        gx, gy = rnd.randrange(1, w - 1), rnd.randrange(2, h - 1)
        px(a, x0 + gx, y0 + gy, rp[max(0, t - 1)])

def floor_tile(seed, variant):
    rnd = random.Random(seed * 31 + variant)
    a = np.zeros((T, T, 4), np.uint8); a[:] = MORT
    # three layouts of slabs that all wrap seamlessly
    layouts = [
        [(0, 0, 16, 16), (16, 0, 16, 16), (0, 16, 16, 16), (16, 16, 16, 16)],
        [(0, 0, 32, 16), (0, 16, 16, 16), (16, 16, 16, 16)],
        [(0, 0, 16, 32), (16, 0, 16, 16), (16, 16, 16, 16)],
        [(0, 0, 32, 32)],
    ]
    for (x, y, w, h) in layouts[variant % 4]:
        bevel_slab(a, x, y, w - 1, h - 1, ST if rnd.random() < .7 else STD, rnd)
        # mortar stays on the right/bottom pixel row of each slab
    # hairline cracks: a short random walk of dark pixels
    for _ in range(rnd.choice((0, 1, 1, 2))):
        x, y = rnd.randrange(4, 28), rnd.randrange(4, 28)
        for _ in range(rnd.randrange(5, 11)):
            px(a, x, y, ST[0]); x += rnd.choice((-1, 0, 1, 1)); y += rnd.choice((0, 1))
    # ash smudges and bone chips
    for _ in range(rnd.randrange(1, 4)):
        x, y = rnd.randrange(2, 30), rnd.randrange(2, 30)
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0)):
            if rnd.random() < .8: px(a, x + dx, y + dy, ST[1])
    if rnd.random() < .35:
        x, y = rnd.randrange(3, 28), rnd.randrange(3, 29)
        px(a, x, y, BONE[2]); px(a, x + 1, y, BONE[3])
    return Image.fromarray(a, 'RGBA')

def brick_face(seed, kind):
    rnd = random.Random(seed)
    a = np.zeros((T, T, 4), np.uint8); a[:] = MORT
    rows = [(0, 8), (8, 8), (16, 8), (24, 8)]
    for ri, (y0, h) in enumerate(rows):
        off = 0 if ri % 2 == 0 else 8
        x = -off
        while x < T:
            w = 16 if rnd.random() < .85 else 12
            if x + w > T + off: w = T + off - x
            rp = WALL if rnd.random() < .75 else WALLD
            t = rnd.choice((2, 2, 3, 1))
            for yy in range(h - 1):
                for xx in range(w - 1):
                    X, Y = x + xx, y0 + yy
                    if 0 <= X < T:
                        c = rp[t]
                        if yy == 0: c = rp[min(4, t + 1)]
                        if yy == h - 2: c = rp[max(0, t - 1)]
                        a[Y, X] = c
            if rnd.random() < .3:
                gx, gy = x + rnd.randrange(2, max(3, w - 3)), y0 + rnd.randrange(2, h - 3)
                if 0 <= gx < T: a[gy, gx] = rp[max(0, t - 1)]
            x += w
    # top cap line (lit) and a soft shadow where the wall meets the floor
    a[0, :] = WALL[4]
    for y in range(26, T):
        k = (y - 25) / 7.0
        for x in range(T):
            c = a[y, x, :3].astype(float); a[y, x, :3] = (c * (1 - .38 * k) + np.array(MORT[:3]) * .38 * k).astype(np.uint8)
    im = Image.fromarray(a, 'RGBA'); cv = Cv(T, T); cv.a = np.array(im)
    if kind == 'niche':   # an ossuary niche: arched recess, a skull, a candle stub
        arch = ell_mask(T, T, 16, 10, 7, 7) | rect_mask(T, T, 9, 10, 23, 24)
        cv.flat(arch, hexc('#120c20'))
        inner = ell_mask(T, T, 16, 10.5, 5.6, 5.8) | rect_mask(T, T, 10.4, 10.5, 21.6, 23)
        cv.flat(inner, hexc('#1c1430'))
        # rim stones
        for y in range(3, 25): 
            pass
        cv.shade(ell_mask(T, T, 16, 20.6, 4.6, 3.4), BONE, rad=2.2, rim='all')               # skull dome
        cv.flat(rect_mask(T, T, 14, 22.6, 18, 25), BONE[2]); 
        cv.flat(rect_mask(T, T, 13.2, 19.6, 15.2, 21.8), hexc('#1a1020')); cv.flat(rect_mask(T, T, 16.8, 19.6, 18.8, 21.8), hexc('#1a1020'))
        cv.flat(rect_mask(T, T, 15.4, 22.2, 16.6, 23.2), hexc('#1a1020'))
        cv.flat(rect_mask(T, T, 20, 19, 22, 24), BONE[2]); cv.put(20, 18, EMBER[0]); cv.put(21, 18, EMBER[2]); cv.put(21, 17, EMBER[1])
        cv.flat(rect_mask(T, T, 9, 24, 23, 25), WALL[4])
        a = cv.a
    elif kind == 'slit':  # an arrow slit with a wash of cold light
        cv.flat(rect_mask(T, T, 14, 6, 18, 22), hexc('#0e0a1a'))
        cv.flat(rect_mask(T, T, 15, 7, 17, 21), hexc('#1c1a3c'))
        cv.flat(rect_mask(T, T, 15, 7, 17, 11), hexc('#5a62a0'))
        cv.flat(rect_mask(T, T, 13, 5, 19, 6), WALL[4]); cv.flat(rect_mask(T, T, 13, 22, 19, 23), WALLD[0])
        a = cv.a
    elif kind == 'banner':  # House Marrow's plum banner with a bone crescent, brass pole and tassels
        cv.flat(rect_mask(T, T, 5, 2, 27, 4), BRASS[2]); cv.flat(rect_mask(T, T, 5, 2, 27, 3), BRASS[4])
        cv.flat(rect_mask(T, T, 4, 1, 6, 5), BRASS[3]); cv.flat(rect_mask(T, T, 26, 1, 28, 5), BRASS[3])
        cloth = poly_mask(T, T, [(8, 4), (24, 4), (24, 25), (16, 29), (8, 25)])
        cv.shade(cloth, PLUM, rad=3.0, rim='all', bias=.1)
        crescent = ell_mask(T, T, 16, 13, 5.2, 5.2) & ~ell_mask(T, T, 18, 12, 4.4, 4.6)
        cv.shade(crescent, BONE, rad=1.8)
        cv.put(16, 20, BONE[3]); cv.put(17, 20, BONE[3]); cv.put(16, 21, BONE[2]); cv.put(17, 21, BONE[2])
        cv.flat(rect_mask(T, T, 9, 24, 23, 25), PLUM[1])
        a = cv.a
    return Image.fromarray(np.array(a), 'RGBA')

def top_tile(seed):
    rnd = random.Random(seed)
    cv = Cv(T, T); cv.a[:] = hexc('#1a1428')
    for (x, y, w, h) in [(0, 0, 16, 16), (16, 0, 16, 16), (0, 16, 16, 16), (16, 16, 16, 16)] if seed % 2 else [(0, 0, 32, 16), (0, 16, 16, 16), (16, 16, 16, 16)]:
        m = rect_mask(T, T, x + 1, y + 1, x + w - 1, y + h - 1)
        cv.shade(m, WALLD, rad=2.5, k=1.0, bias=-.12)
    return cv.img()

def build(OUT):
    meta = {}
    cols = 8
    tiles = []
    names = []
    for v in range(4): tiles.append(floor_tile(77, v)); names.append('floor%d' % v)
    for i, k in enumerate(('plain', 'niche', 'slit', 'banner')): tiles.append(brick_face(100 + i, k)); names.append('face_' + k)
    tiles.append(brick_face(120, 'plain')); names.append('face_plain2')
    tiles.append(brick_face(121, 'plain')); names.append('face_plain3')
    tiles.append(top_tile(1)); names.append('top0'); tiles.append(top_tile(2)); names.append('top1')
    rows = (len(tiles) + cols - 1) // cols
    sh = Image.new('RGBA', (cols * T, rows * T), (0, 0, 0, 0))
    for i, t in enumerate(tiles): sh.alpha_composite(t, ((i % cols) * T, (i // cols) * T))
    sh.save(os.path.join(OUT, 'tiles.png'))
    return {'tiles': {n: [(i % cols) * T, (i // cols) * T] for i, n in enumerate(names)}}

if __name__ == '__main__':
    import sys, tempfile
    d = tempfile.mkdtemp(); m = build(d)
    im = Image.open(os.path.join(d, 'tiles.png'))
    # preview as a little room: 6x5 floor with walls
    room = Image.new('RGBA', (T * 10, T * 6)); 
    rnd = random.Random(5); idx = m['tiles']
    def get(n): x, y = idx[n]; return im.crop((x, y, x + T, y + T))
    for gy in range(6):
        for gx in range(10):
            if gy == 0: room.paste(get('top%d' % (gx % 2)), (gx * T, gy * T))
            elif gy == 1: room.paste(get(['face_plain', 'face_niche', 'face_plain2', 'face_banner', 'face_plain3', 'face_slit', 'face_plain', 'face_niche', 'face_plain2', 'face_banner'][gx]), (gx * T, gy * T))
            else: room.paste(get('floor%d' % rnd.randrange(4)), (gx * T, gy * T))
    preview(room, '/tmp/tiles_prev.png', scale=4)
