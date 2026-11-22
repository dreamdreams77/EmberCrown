"""Room identities for Ashfall Keep. Every kind of room gets its own floor and wall family, drawn for that material:
culvert cobble (wet, mossy), coal-cellar gravel, barracks planking, store planking, kitchen tile, ossuary marble, courtyard flags,
and the relic room's plum marble. All 32x32, all lit from the same corner."""
import random, math
import numpy as np
from pix import *
import tiles_ashfall as TA

T = 32
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
def tile_cv(): return Cv(T, T)
def wrap_ell(cx, cy, rx, ry):
    m = np.zeros((T, T), bool)
    for dx in (-T, 0, T):
        for dy in (-T, 0, T): m |= ell_mask(T, T, cx + dx, cy + dy, rx, ry)
    return m

def cobble(seed, rp, mort, moss=None, sheen=False, dirt=None, n=9):
    rnd = random.Random(seed); cv = tile_cv(); cv.a[:] = mort
    cells = [(i, j) for i in range(3) for j in range(3)]
    used = np.zeros((T, T), bool)
    for (i, j) in cells:
        cx = (i + .5) * T / 3 + rnd.uniform(-2.2, 2.2); cy = (j + .5) * T / 3 + rnd.uniform(-2.2, 2.2)
        m = wrap_ell(cx, cy, rnd.uniform(4.6, 5.6), rnd.uniform(3.8, 4.8))
        t = rnd.choice(rp[1:4]); tone = list(rp); 
        cv.shade(m, [mix(r, t, .25) for r in rp] if True else rp, rad=3.0, k=1.3, bias=rnd.uniform(-.06, .06), rim='br')
    if moss:
        for _ in range(7):
            x, y = rnd.randrange(T), rnd.randrange(T)
            for dx in range(rnd.randrange(2, 5)):
                if cv.a[(y) % T, (x + dx) % T, 3] and tuple(cv.a[y % T, (x + dx) % T, :3]) in [tuple(mort[:3])] + [tuple(c[:3]) for c in rp[:2]]: cv.a[y % T, (x + dx) % T] = moss[rnd.randrange(1, 3)]
        for _ in range(10): cv.a[rnd.randrange(T), rnd.randrange(T)] = moss[3]
    if sheen:
        for _ in range(5):
            x, y = rnd.randrange(T), rnd.randrange(T); cv.a[y, x] = hexc('#a8c8e0'); cv.a[y, (x + 1) % T] = hexc('#7a98b8')
    if dirt:
        for _ in range(4):
            cx, cy = rnd.uniform(0, T), rnd.uniform(0, T); r = rnd.uniform(3, 6)
            for y in range(T):
                for x in range(T):
                    if (x - cx) ** 2 + (y - cy) ** 2 < r * r and BAYER[y % 4, x % 4] < .22: cv.a[y, x] = dirt[rnd.randrange(1, 3)]
    return cv.img()

def planks(seed, tones, nails=True, wide=8, worn=.5):
    rnd = random.Random(seed); cv = tile_cv(); cv.a[:] = tones[0][0]
    xs = list(range(0, T, wide))
    for bi, x0 in enumerate(xs):
        rp = tones[rnd.randrange(len(tones))]; y0 = rnd.choice((0, 0, 11, 22)); 
        for seg in ((y0, y0 + rnd.randrange(12, 24)), ):
            pass
        # a board is full height with one butt joint
        joint = rnd.randrange(8, 26)
        for (ya, yb) in ((0, joint), (joint, T)):
            col = rnd.choice(rp[1:4]); m = rect_mask(T, T, x0 + 1, ya + (1 if ya else 0), x0 + wide, yb)
            cv.shade(m, [mix(r, col, .2) for r in rp], rad=2.0, k=.7, bias=rnd.uniform(-.05, .08))
            for yy in range(ya + 2, yb - 1, 3):
                if rnd.random() < worn: cv.put(x0 + rnd.randrange(2, wide), yy, rp[0])        # grain
            if nails:
                for ny in (ya + 3, yb - 3):
                    if ya < ny < yb: cv.put(x0 + 2, ny, hexc('#2a1c20')); cv.put(x0 + wide - 2, ny, hexc('#2a1c20')); cv.put(x0 + 2, ny - 1, rp[4])
        if rnd.random() < .5:
            kx, ky = x0 + rnd.randrange(3, wide - 2), rnd.randrange(5, 27); cv.flat(ell_mask(T, T, kx, ky, 1.6, 2.2), rp[0]); cv.put(kx, ky - 1, rp[3])
    return cv.img()

def kitchen(seed):
    rnd = random.Random(seed); cv = tile_cv(); cv.a[:] = hexc('#3a2430')
    A = ramp('#b8663c', '#3a1430', '#ffc890'); B = ramp('#8a4a34', '#2a1028', '#e89870')
    for i in range(2):
        for j in range(2):
            rp = A if (i + j) % 2 == 0 else B
            cv.shade(rect_mask(T, T, i * 16 + 1, j * 16 + 1, i * 16 + 16, j * 16 + 16), rp, rad=2.4, k=.8, bias=rnd.uniform(-.05, .05))
            for _ in range(2): cv.put(i * 16 + rnd.randrange(3, 14), j * 16 + rnd.randrange(3, 14), rp[0])
    for _ in range(3):                                                              # grease and ash stains, dithered
        cx, cy, r = rnd.uniform(4, 28), rnd.uniform(4, 28), rnd.uniform(3, 6)
        for y in range(T):
            for x in range(T):
                if (x - cx) ** 2 + (y - cy) ** 2 < r * r and BAYER[y % 4, x % 4] < .5: cv.a[y, x, :3] = (cv.a[y, x, :3] * .55 + np.array([26, 16, 22]) * .45).astype(np.uint8)
    return cv.img()

def marble(seed, base, vein, inlay, glossy=False):
    rnd = random.Random(seed); cv = tile_cv(); cv.a[:] = inlay
    rp = base
    for i in range(2):
        for j in range(2):
            cv.shade(rect_mask(T, T, i * 16 + 1, j * 16 + 1, i * 16 + 16, j * 16 + 16), rp, rad=2.6, k=.7, bias=rnd.uniform(-.06, .06))
            x, y = i * 16 + rnd.randrange(3, 14), j * 16 + rnd.randrange(3, 8)
            for _ in range(rnd.randrange(6, 11)):
                cv.put(x, y, vein); x = min(max(x + rnd.choice((-1, 0, 1)), i * 16 + 2), i * 16 + 14); y = min(y + 1, j * 16 + 14)
    if glossy:
        for _ in range(3): x, y = rnd.randrange(3, 28), rnd.randrange(3, 28); cv.put(x, y, hexc('#d8c0e8')); cv.put(x + 1, y, hexc('#b898d0'))
    return cv.img()

def bone_marble(seed):
    img = marble(seed, ramp('#a89cb0', '#2a1e3a', '#f0e8f4'), hexc('#6a5a7a'), hexc('#4a2a56'))
    rnd = random.Random(seed); cv = tile_cv(); cv.a = np.array(img)
    for _ in range(rnd.randrange(1, 3)):                              # a bone fragment inlaid in a slab
        x, y = rnd.randrange(4, 26), rnd.randrange(4, 26); cv.flat(capsule_mask(T, T, x, y, x + 5, y + 1.5, .9, .9), TA.BONE[3]); cv.put(x, y - 1, TA.BONE[4]); cv.put(x + 5, y + 2, TA.BONE[4])
    return cv.img()

def relic(seed):
    rnd = random.Random(seed); cv = tile_cv(); cv.a[:] = hexc('#1a0e22'); rp = ramp('#43264e', '#12081a', '#a870b8')
    cv.shade(rect_mask(T, T, 1, 1, 31, 31), rp, rad=3, k=.6)
    gold = TA.BRASS
    for (x, y) in [(16 + int(10 * math.cos(a)), 16 + int(10 * math.sin(a))) for a in np.linspace(0, math.tau, 48)]: cv.put(x, y, gold[2])
    for k in range(-9, 10):                                          # diamond inlay
        cv.put(16 + k, 16 + abs(k) - 9 if abs(k) <= 9 else 0, gold[1]); cv.put(16 + k, 16 - abs(k) + 9, gold[1])
    cv.put(16, 16, gold[4]); cv.put(15, 16, gold[3]); cv.put(17, 16, gold[3])
    for _ in range(3): x, y = rnd.randrange(3, 28), rnd.randrange(3, 28); cv.put(x, y, rp[4])
    return cv.img()

def coal(seed):
    rnd = random.Random(seed); cv = tile_cv(); cv.a[:] = hexc('#241c28')
    for _ in range(60):
        x, y = rnd.randrange(T), rnd.randrange(T); r = rnd.uniform(1.0, 2.4)
        m = wrap_ell(x, y, r, r * .8); cv.shade(m, ramp('#3a2e3a', '#0c0810', '#8a7088'), rad=1.5, k=1.2)
    for _ in range(14): cv.a[rnd.randrange(T), rnd.randrange(T)] = hexc('#5a4a58')
    for _ in range(2): cv.a[rnd.randrange(T), rnd.randrange(T)] = hexc('#ff7a30')                # one live ember
    return cv.img()

def yard(seed):
    mossr = [None, hexc('#2a4a30'), hexc('#4a7a48'), hexc('#8ab868')]
    return cobble(seed, ramp('#7a7488', '#242034', '#d0c8e0'), hexc('#2e2a3a'), moss=mossr, dirt=ramp('#6a5238', '#241810', '#b89860'))

# ----------------------------------------------------------------------------------------- walls
def face_timber(seed):
    rnd = random.Random(seed); cv = tile_cv(); w = ramp('#7a5236', '#22101a', '#e0a870'); w2 = ramp('#5e3e2e', '#1c0c16', '#c08860')
    cv.a[:] = hexc('#1c0e18')
    for x0 in range(0, T, 8):
        rp = w if (x0 // 8) % 2 == 0 else w2
        cv.shade(rect_mask(T, T, x0 + 1, 1, x0 + 8, 31), rp, rad=2, k=.7, bias=rnd.uniform(-.05, .05))
        for yy in range(3, 30, 4):
            if rnd.random() < .6: cv.put(x0 + rnd.randrange(2, 7), yy, rp[0])
    cv.flat(rect_mask(T, T, 0, 0, 32, 3), hexc('#2a1620')); cv.a[0, :] = w[4]
    for y in (6, 24): cv.flat(rect_mask(T, T, 0, y, 32, y + 2), TA.IRON[1]); [cv.put(x, y, TA.IRON[4]) for x in range(3, 32, 9)]
    for y in range(26, T):
        k = (y - 25) / 7.0
        for x in range(T):
            c = cv.a[y, x, :3].astype(float); cv.a[y, x, :3] = (c * (1 - .35 * k) + np.array([12, 8, 24]) * .35 * k).astype(np.uint8)
    return cv.img()

def face_culvert(seed):
    face = TA.brick_face(seed, 'plain'); cv = tile_cv(); cv.a = np.array(face).copy(); rnd = random.Random(seed)
    for y in range(T):
        for x in range(T):
            if BAYER[y % 4, x % 4] < (y / 32.0) * .55: cv.a[y, x, :3] = (cv.a[y, x, :3] * .7 + np.array([20, 40, 52]) * .3).astype(np.uint8)   # damp rises up the wall
    for _ in range(14):
        x, y = rnd.randrange(T), rnd.randrange(14, 31); cv.a[y, x] = hexc('#3a6a50') if rnd.random() < .6 else hexc('#5a8a58')
    for x in rnd.sample(range(3, 29), 3):                                              # drips
        for y in range(2, rnd.randrange(8, 18)): cv.put(x, y, hexc('#6a88b0') if y % 3 else hexc('#a8c8e8'))
    return cv.img()

def face_sooty(seed):
    face = TA.brick_face(seed, 'plain'); cv = tile_cv(); cv.a = np.array(face).copy(); rnd = random.Random(seed)
    for y in range(T):
        for x in range(T):
            if BAYER[y % 4, x % 4] < (1 - y / 32.0) * .6: cv.a[y, x, :3] = (cv.a[y, x, :3] * .55 + np.array([22, 14, 22]) * .45).astype(np.uint8)
    for x in (6, 14, 24):                                                                # a row of hung pans
        cv.flat(rect_mask(T, T, x, 7, x + 1, 10), TA.IRON[2]); cv.shade(ell_mask(T, T, x + .5, 13, 3.4, 3.4), TA.IRON, rad=2, rim='all'); cv.flat(ell_mask(T, T, x + .5, 13, 1.9, 1.9), hexc('#1a1420'))
    return cv.img()

def face_bone(seed):
    face = TA.brick_face(seed, 'plain'); cv = tile_cv(); cv.a = np.array(face).copy()
    for row, y in enumerate((3, 15)):                                                    # two courses of skulls set in the wall
        for x in range(2 + (row * 5), 31, 10):
            cv.flat(rect_mask(T, T, x - 1, y - 1, x + 8, y + 9), hexc('#120c20'))
            cv.shade(ell_mask(T, T, x + 3.5, y + 3.2, 3.6, 3.2), TA.BONE, rad=2, rim='all'); cv.flat(rect_mask(T, T, x + 1.6, y + 2.4, x + 3, y + 4), hexc('#1a1020')); cv.flat(rect_mask(T, T, x + 4, y + 2.4, x + 5.4, y + 4), hexc('#1a1020'))
            cv.flat(rect_mask(T, T, x + 2, y + 6, x + 5, y + 8), TA.BONE[2])
    return cv.img()

def face_relic(seed):
    cv = tile_cv(); rp = ramp('#4a2a58', '#12081c', '#b880c8'); cv.a[:] = hexc('#1a0e22')
    for x0 in (1, 17): cv.shade(rect_mask(T, T, x0, 2, x0 + 14, 29), rp, rad=3, k=.6, rim='all')
    gold = TA.BRASS; cv.flat(rect_mask(T, T, 0, 0, 32, 2), gold[2]); cv.flat(rect_mask(T, T, 0, 0, 32, 1), gold[4]); cv.flat(rect_mask(T, T, 0, 29, 32, 31), gold[1])
    for x0 in (8, 24):
        cres = ell_mask(T, T, x0, 15, 4.4, 4.4) & ~ell_mask(T, T, x0 + 2, 14, 3.8, 3.9); cv.shade(cres, TA.BONE, rad=1.6)
    return cv.img()

def build():
    s = {}
    for i in range(4): s['f_culvert%d' % i] = cobble(200 + i, ramp('#56627a', '#141c2c', '#b0c8e0'), hexc('#1c2432'), moss=[None, hexc('#1e3a2e'), hexc('#3a6a4e'), hexc('#6a9a68')], sheen=True)
    for i in range(3): s['f_coal%d' % i] = coal(210 + i)
    for i in range(4): s['f_barracks%d' % i] = planks(220 + i, [ramp('#8a5a38', '#2a1418', '#f0b878'), ramp('#7a4e34', '#24121a', '#e0a070')])
    for i in range(4): s['f_store%d' % i] = planks(230 + i, [ramp('#6a4630', '#1c0e16', '#c08a60'), ramp('#58382a', '#180a12', '#a87050')], worn=.8)
    for i in range(3): s['f_kitchen%d' % i] = kitchen(240 + i)
    for i in range(4): s['f_ossuary%d' % i] = bone_marble(250 + i)
    for i in range(4): s['f_yard%d' % i] = yard(260 + i)
    for i in range(3): s['f_relic%d' % i] = relic(270 + i)
    for i in range(3): s['w_timber%d' % i] = face_timber(300 + i)
    for i in range(2): s['w_culvert%d' % i] = face_culvert(310 + i)
    for i in range(2): s['w_sooty%d' % i] = face_sooty(320 + i)
    for i in range(2): s['w_bone%d' % i] = face_bone(330 + i)
    s['w_relic0'] = face_relic(340)
    return s

if __name__ == '__main__':
    s = build(); names = list(s); cols = 8
    sh = Image.new('RGBA', (cols * 34, ((len(names) + cols - 1) // cols) * 34), (30, 24, 40, 255))
    for i, n in enumerate(names): sh.alpha_composite(s[n], ((i % cols) * 34 + 1, (i // cols) * 34 + 1))
    preview(sh, '/tmp/rooms_prev.png', scale=4); print(len(names))
