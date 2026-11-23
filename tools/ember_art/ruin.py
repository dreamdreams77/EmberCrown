"""The ruined state of Ashfall Keep: scorched and broken versions of every prop, collapsed floors and walls. Each prop is burnt by
re-mapping its own designed ramps to charred ones, then chipped along its silhouette, cracked, sooted and given its own rubble."""
import random, math
import numpy as np
from pix import *
import props_ashfall as PA
import tiles_ashfall as TA
import set2 as S2

CHAR = ramp('#4a3436', '#120a10', '#9a7a74'); ASH = ramp('#8a8494', '#26202e', '#d8d0e0'); SCORCH = ramp('#3e2a44', '#0e0814', '#8a6a90')
SOOT = np.array([26, 18, 30])
BAY = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

def _map(rp_from, rp_to):
    return {tuple(a[:3]): tuple(b[:3]) for a, b in zip(rp_from, rp_to)}

def burn(im, seed, stone=False, strength=.55):
    rnd = random.Random(seed); a = np.array(im).copy(); h, w = a.shape[:2]
    m = {}
    for src, dst in ((PA.WOOD, CHAR), (PA.WOODD, CHAR), (PA.CLOTH, ASH), (PA.STRAW, ASH), (PA.PLUM, SCORCH), (S2.CLAY, CHAR), (S2.CLAYD, CHAR), (S2.GLAZE, SCORCH)):
        for i in range(5): m[tuple(src[i][:3])] = tuple(dst[i][:3])
    if stone:
        for src in (PA.STONE, PA.STONED, PA.BONE):
            for i in range(5): m[tuple(src[i][:3])] = tuple(ASH[min(4, max(0, i - 1))][:3])
    for y in range(h):
        for x in range(w):
            if a[y, x, 3] and tuple(a[y, x, :3]) in m: a[y, x, :3] = m[tuple(a[y, x, :3])]
    op = a[..., 3] > 0
    # chips: bite small notches out of the silhouette
    edge = [(y, x) for y in range(1, h - 1) for x in range(1, w - 1) if op[y, x] and not (op[y - 1, x] and op[y + 1, x] and op[y, x - 1] and op[y, x + 1])]
    rnd.shuffle(edge)
    for (y, x) in edge[:max(3, len(edge) // 22)]:
        for dy in range(rnd.choice((0, 1, 1)) + 1):
            for dx in range(rnd.choice((0, 1)) + 1):
                if 0 <= y + dy < h and 0 <= x + dx < w: a[y + dy, x + dx, 3] = 0
    op = a[..., 3] > 0
    # soot: a dithered dark wash, heavier toward the top where flame licked
    for y in range(h):
        for x in range(w):
            if op[y, x]:
                t = (1 - y / h) * strength + .08
                if t > BAY[y % 4, x % 4]: a[y, x, :3] = (a[y, x, :3] * .45 + SOOT * .55).astype(np.uint8)
    # cracks / glints
    ys, xs = np.where(op)
    if len(ys):
        for _ in range(2 + (w * h) // 900):
            i = rnd.randrange(len(ys)); y, x = ys[i], xs[i]
            for _ in range(rnd.randrange(4, 9)):
                if 0 <= y < h and 0 <= x < w and a[y, x, 3]: a[y, x, :3] = (22, 14, 26)
                y += rnd.choice((0, 1, 1)); x += rnd.choice((-1, 0, 1))
        for _ in range(2 + (w * h) // 1200):
            i = rnd.randrange(len(ys)); a[ys[i], xs[i], :3] = (255, 150, 58) if rnd.random() < .5 else (200, 80, 40)
    return Image.fromarray(a, 'RGBA')

def rubble(seed, w=40, h=18):
    rnd = random.Random(seed); cv = Cv(w, h)
    for _ in range(rnd.randrange(5, 8)):
        cx, cy, r = rnd.uniform(5, w - 5), rnd.uniform(6, h - 3), rnd.uniform(2.2, 4.4)
        pts = [(cx - r, cy + r * .5), (cx - r * .5, cy - r * .9), (cx + r * .6, cy - r * .8), (cx + r, cy + r * .4), (cx, cy + r * .7)]
        cv.shade(poly_mask(w, h, pts), ASH if rnd.random() < .7 else CHAR, rad=2, rim='all')
    cv.outline((20, 12, 26), strength=.6); return cv.img()

def ruin_floor(seed, kind):
    base = TA.floor_tile(seed, 3 if kind != 'plain' else 0); cv = Cv(32, 32); cv.a = np.array(base).copy(); rnd = random.Random(seed)
    for y in range(32):
        for x in range(32):
            if BAY[y % 4, x % 4] < .10: cv.a[y, x, :3] = (cv.a[y, x, :3] * .65 + SOOT * .35).astype(np.uint8)       # ash-stained
    if kind == 'pit':
        pit = ell_mask(32, 32, 16, 16, 9, 7); cv.flat(pit, hexc('#0e0814')); cv.flat(ell_mask(32, 32, 16, 17, 7, 5), hexc('#06020a'))
        for a in np.linspace(0, math.tau, 26): cv.put(16 + 9.8 * math.cos(a), 16 + 7.8 * math.sin(a), ASH[3] if math.sin(a) < 0 else ASH[1])
        for (x, y) in ((8, 8), (24, 24), (25, 9)): cv.shade(poly_mask(32, 32, [(x - 2, y + 1), (x - 1, y - 2), (x + 2, y - 1), (x + 2, y + 2)]), ASH, rad=1.5, rim='all')
    elif kind == 'cracked':
        for sx, sy in ((3, 5), (28, 9), (10, 27)):
            x, y = sx, sy
            for _ in range(24):
                cv.put(x, y, hexc('#120a1c')); cv.put(x + 1, y + 1, hexc('#3a3050'))
                x += rnd.choice((-1, 0, 1, 1)); y += rnd.choice((0, 1, 1))
        for (cx, cy, r) in ((22, 22, 2.6), (9, 16, 2.0)): cv.shade(poly_mask(32, 32, [(cx - r, cy + r * .6), (cx - r * .4, cy - r), (cx + r, cy - r * .3), (cx + r * .8, cy + r * .7)]), ASH, rad=2, rim='all')
    elif kind == 'ash':
        for _ in range(80):
            x, y = rnd.randrange(32), rnd.randrange(32)
            if ell_mask(32, 32, 16, 16, 14, 10)[y, x]: cv.put(x, y, hexc('#463e52') if rnd.random() < .7 else hexc('#8a8098'))
        for (x, y) in ((10, 12), (20, 20), (14, 22)): cv.put(x, y, EMBER_px(rnd))
    elif kind == 'char':
        cv.flat(ell_mask(32, 32, 16, 17, 11, 8), hexc('#1c1420'))
        for _ in range(26): cv.put(rnd.randrange(6, 26), rnd.randrange(10, 24), hexc('#3a2c34'))
        for (x, y) in ((9, 16), (22, 14), (15, 21)): cv.put(x, y, hexc('#ff9a3a')); cv.put(x + 1, y, hexc('#c84a1c'))
    return Image.fromarray(cv.a, 'RGBA')

def EMBER_px(rnd): return hexc('#ff9a3a') if rnd.random() < .6 else hexc('#c84a1c')

def ruin_face(seed, broken):
    face = TA.brick_face(seed, 'plain'); cv = Cv(32, 32); cv.a = np.array(face).copy(); rnd = random.Random(seed)
    for (x0, y0, w, h) in rnd.sample([(0, 0, 15, 7), (16, 0, 15, 7), (8, 8, 15, 7), (0, 16, 15, 7), (16, 16, 15, 7), (8, 24, 15, 7)], broken):
        cv.flat(rect_mask(32, 32, x0, y0 + 1, x0 + w, y0 + h), hexc('#0c0614')); cv.a[y0 + h, x0:x0 + w] = ASH[3]            # a gap, lit rim below
        cv.a[y0 + 1, x0:x0 + w] = (14, 8, 20, 255)
    for x in range(32):                                                                                                   # soot streaks running up from the floor
        if (x * 7 + seed) % 5 == 0:
            for y in range(32):
                if BAY[y % 4, x % 4] < (y / 32.0) * .8: cv.a[y, x, :3] = (cv.a[y, x, :3] * .4 + SOOT * .6).astype(np.uint8)
    for (x, y) in ((6, 29), (11, 30), (24, 29)): cv.shade(ell_mask(32, 32, x, y, 2.4, 1.6), ASH, rad=1)
    return Image.fromarray(cv.a, 'RGBA')

def ruin_top(seed):
    top = TA.top_tile(seed); cv = Cv(32, 32); cv.a = np.array(top).copy()
    for y in range(32):
        for x in range(32):
            if BAY[y % 4, x % 4] < .3: cv.a[y, x, :3] = (cv.a[y, x, :3] * .5 + SOOT * .5).astype(np.uint8)
    return cv.img()

def build():
    s = {}
    for i, k in enumerate(('pit', 'cracked', 'ash', 'char')): s['rfloor_' + k] = ruin_floor(60 + i, k)
    s['rfloor_plain'] = ruin_floor(70, 'plain')
    s['rface_0'] = ruin_face(80, 2); s['rface_1'] = ruin_face(81, 3); s['rface_2'] = ruin_face(82, 1)
    s['rtop_0'] = ruin_top(1); s['rtop_1'] = ruin_top(2)
    props = {'crate': PA.crate(1), 'crate_b': PA.crate(2), 'crates': PA.crates(), 'barrel': PA.barrel(), 'table': PA.table(), 'bench': PA.bench(), 'cot': PA.cot(),
             'weaponrack': PA.weaponrack(), 'sacks': PA.sacks(), 'sarcophagus': PA.sarcophagus(), 'statue': PA.statue(),
             'chest_closed': S2.chest(False), 'chest_open': S2.chest(True), 'pot': S2.pot(), 'urn': S2.urn(), 'door_closed': S2.door_closed(), 'door_open': S2.door_open()}
    for n, im in props.items(): s['ruin_' + n] = burn(im, hash(n) % 997, stone=n in ('sarcophagus', 'statue', 'door_closed', 'door_open'))
    s['rubble0'] = rubble(5); s['rubble1'] = rubble(6, 28, 16); s['rubble2'] = rubble(7, 20, 12)
    return s
