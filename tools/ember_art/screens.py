"""Phase 3: illustrated title, briefing, victory and defeat art. Painted at sprite scale (1 art pixel = 1 sprite pixel) with the same ramps/ink as
the in-game sprites, composited from the real Ember character sheets, then shown pixelated by ember.css. Output: assets/ember/art_*.png"""
import os, random, math
import numpy as np
from PIL import Image, ImageDraw
from pix import hexc, ramp
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'ember')
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
def rgb(h): return np.array(hexc(h)[:3], float)

def sheetframe(name, fw, fh, col, row, flip=False):
    im = Image.open(os.path.join(OUT, name + '.png')).convert('RGBA').crop((col * fw, row * fh, col * fw + fw, row * fh + fh))
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im

def gradient(w, h, stops, bands=7, seed=1):
    """vertical sky ramp, quantised to `bands` tones with ordered dithering between them (hand-pixelled look, no smooth gradient)."""
    ys = np.linspace(0, 1, h)[:, None] * np.ones((1, w))
    pos = [s[0] for s in stops]; cols = np.array([rgb(s[1]) for s in stops])
    out = np.zeros((h, w, 3))
    for c in range(3): out[..., c] = np.interp(ys, pos, cols[:, c])
    bay = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    lo = np.floor(ys * bands - bay * .999) / bands  # dithered band index
    lo = np.clip(lo, 0, 1)
    for c in range(3): out[..., c] = np.interp(lo, pos, cols[:, c])
    return out

def to_img(a): return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')

def glow(im, cx, cy, r, col, strength=1.0, flat=.0):
    """stepped (4-level, dithered) additive light pool"""
    a = np.array(im).astype(float); h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt((xx - cx) ** 2 + ((yy - cy) * (1 + flat)) ** 2) / r
    f = np.clip(1 - d, 0, 1) ** 1.6 * strength
    bay = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    lv = np.floor(f * 4 + bay) / 4; lv = np.clip(lv, 0, strength)
    c = rgb(col)
    for k in range(3): a[..., k] = np.clip(a[..., k] * (1 - lv * .35) + c[k] * lv * .75, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def paste(im, spr, x, y):
    im.alpha_composite(spr, (int(x), int(y)))

def outline_sil(im, mask, ink='#0c0616'):
    pass

def ridge(w, base, amp, seed, rough=3):
    rnd = random.Random(seed); y = base; pts = []
    v = 0
    for x in range(w):
        if x % rough == 0: v += rnd.uniform(-1, 1)
        v *= .9; y = base + math.sin(x / 31.0 + seed) * amp * .6 + v * amp * .5
        pts.append(int(y))
    return pts

def fill_ridge(im, pts, col, rim=None, h=None):
    d = ImageDraw.Draw(im); H = im.height
    for x, y in enumerate(pts):
        d.line([(x, y), (x, H)], fill=col)
        if rim: d.point((x, y), fill=rim)

def bricks(im, x0, y0, x1, y1, base, light, dark, seed, bw=16, bh=8, lit_x=None):
    d = ImageDraw.Draw(im); rnd = random.Random(seed)
    for r, y in enumerate(range(y0, y1, bh)):
        off = (bw // 2) if r % 2 else 0
        for x in range(x0 - off, x1, bw):
            t = rnd.random(); c = base if t < .55 else (light if t < .8 else dark)
            xa, xb = max(x, x0), min(x + bw - 1, x1 - 1)
            if xb < xa: continue
            d.rectangle([xa, y, xb, min(y + bh - 2, y1 - 1)], fill=c)
            d.line([(xa, y), (xb, y)], fill=light)                    # lit top edge
            if rnd.random() < .5: d.point((xa + rnd.randrange(max(1, xb - xa + 1)), y + 2 + rnd.randrange(3)), fill=dark)
        d.line([(x0, y + bh - 1), (x1 - 1, y + bh - 1)], fill=dark)

def flame(im, x, y, s=1.0, f=0):
    d = ImageDraw.Draw(im)
    cols = ['#7a1a22', '#d8462a', '#ff9a3a', '#ffd878', '#fff4c8']
    for i, (rx, ry) in enumerate(((4, 9), (3, 7), (2, 5), (1, 3))):
        rx, ry = rx * s, ry * s
        d.polygon([(x - rx, y), (x - rx * .6 + (f % 2), y - ry * .6), (x + (f - 1) * .8, y - ry), (x + rx * .6, y - ry * .5), (x + rx, y)], fill=cols[i])

def embers(im, rnd, n, box, cols=('#ffb040', '#ff7a2a', '#ffe08a', '#ff5a2a')):
    d = ImageDraw.Draw(im)
    for _ in range(n):
        x = rnd.randrange(box[0], box[2]); y = rnd.randrange(box[1], box[3]); c = rnd.choice(cols)
        d.point((x, y), fill=c)
        if rnd.random() < .25: d.point((x, y - 1), fill=c)

def ink_outline(im, ink=(14, 8, 24), only_alpha=True):
    a = np.array(im); op = a[..., 3] > 0; H, W = op.shape
    pad = np.pad(op, 1); ring = np.zeros_like(op)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): ring |= pad[1 + dy:1 + dy + H, 1 + dx:1 + dx + W]
    ring &= ~op; a[ring] = (*ink, 255); return Image.fromarray(a, 'RGBA')

def sprite_lit(spr, tint, amt):
    a = np.array(spr).astype(float); m = a[..., 3] > 0
    for k in range(3): a[..., k] = np.where(m, a[..., k] * (1 - amt) + tint[k] * amt, a[..., k])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

def crenel(im, y, step, hgt, col, light, dark):
    d = ImageDraw.Draw(im); W = im.width
    for x in range(0, W, step * 2):
        d.rectangle([x, y - hgt, x + step - 1, y], fill=col)
        d.line([(x, y - hgt), (x + step - 1, y - hgt)], fill=light); d.line([(x, y - hgt), (x, y)], fill=light)
        d.line([(x + step - 1, y - hgt + 1), (x + step - 1, y)], fill=dark)
    d.rectangle([0, y, W, im.height], fill=col)

def hexa(h): return tuple(hexc(h)[:3])

# ======================================================================= TITLE  (360 x 200)
def title():
    W, H = 360, 200; rnd = random.Random(7)
    im = to_img(gradient(W, H, [(0, '#0e0820'), (.35, '#2a1448'), (.6, '#6a2a52'), (.78, '#c8553a'), (1, '#f0a050')], 9))
    d = ImageDraw.Draw(im)
    for _ in range(70):   # stars (denser high up)
        x = rnd.randrange(W); y = int(rnd.random() ** 1.8 * 90); d.point((x, y), fill=rnd.choice(['#f0e4c8', '#b8a8d8', '#ffd890']))
    # the Embercrown: a broken ring of seven spikes burning in the sky
    cx, cy = 300, 46
    for i in range(7):
        bx = cx - 48 + i * 16; hh = (30, 18, 26, 36, 26, 18, 30)[i]; by = cy + 22
        d.polygon([(bx - 7, by), (bx + (i - 3) * 1, by - hh), (bx + 7, by)], fill=hexa('#ff9a40'))
        d.polygon([(bx - 4, by), (bx + (i - 3) * 1, by - hh + 5), (bx + 4, by)], fill=hexa('#ffd478'))
        d.line([(bx - 7, by), (bx + (i - 3), by - hh)], fill=hexa('#fff0b8'))
        d.rectangle([bx + (i - 3) - 1, by - hh - 3, bx + (i - 3) + 1, by - hh - 1], fill=hexa('#ff5a2a'))   # ember bead on each tip
    d.rectangle([cx - 52, cy + 22, cx + 52, cy + 30], fill=hexa('#d8782a')); d.line([(cx - 52, cy + 22), (cx + 52, cy + 22)], fill=hexa('#ffe090'))
    for x in range(cx - 50, cx + 52, 9): d.rectangle([x, cy + 25, x + 3, cy + 27], fill=hexa('#ffd070' if (x // 9) % 2 else '#c0402a'))
    im = glow(im, cx, cy + 22, 90, '#ff9a40', 1.0, .2)
    d = ImageDraw.Draw(im)
    # far mountains and the keep on its crag
    fill_ridge(im, ridge(W, 128, 14, 2), hexa('#3a2048'), '#7a4a66')
    fill_ridge(im, ridge(W, 142, 10, 5), hexa('#26142e'), '#5a3050')
    kx = 62
    d.polygon([(kx - 40, 150), (kx - 30, 112), (kx + 50, 108), (kx + 60, 150)], fill=hexa('#1c1028'))                   # crag
    d.rectangle([kx - 20, 82, kx + 6, 128], fill=hexa('#2a1a3a')); d.rectangle([kx + 14, 92, kx + 40, 128], fill=hexa('#241632'))   # towers
    d.rectangle([kx - 20, 82, kx - 17, 128], fill=hexa('#5a3a62')); d.rectangle([kx + 14, 92, kx + 16, 128], fill=hexa('#4a3054'))
    for tx0, tx1, ty in ((kx - 22, kx + 8, 82), (kx + 12, kx + 42, 92)):
        d.polygon([(tx0, ty), (tx0 + (tx1 - tx0) // 2, ty - 18), (tx1, ty)], fill=hexa('#3a1c30'))
    for tx in range(kx - 20, kx + 6, 6): d.rectangle([tx, 78, tx + 2, 82], fill=hexa('#2a1a3a'))
    d.rectangle([kx - 38, 112, kx + 58, 128], fill=hexa('#221430'))
    for (wx, wy) in ((kx - 10, 96), (kx - 10, 108), (kx + 24, 104), (kx + 2, 118), (kx - 28, 120), (kx + 46, 120)):
        d.rectangle([wx, wy, wx + 2, wy + 4], fill=hexa('#ffc060')); d.point((wx + 1, wy + 1), fill=hexa('#fff0b0'))
    im = glow(im, kx + 4, 110, 44, '#ff8a3a', .55)
    d = ImageDraw.Draw(im)
    # rampart foreground
    ry = 150
    base = hexa('#3a2a48'); light = hexa('#74587a'); dark = hexa('#1c1228')
    crenel(im, ry, 22, 12, base, light, dark)
    bricks(im, 0, ry + 1, W, H, base, light, dark, 11, 14, 8)
    d = ImageDraw.Draw(im)
    d.line([(0, ry + 1), (W, ry + 1)], fill=light)
    # brazier on the wall (right) lighting the hero
    bx = 20
    d.rectangle([bx - 2, ry - 26, bx + 2, ry - 12], fill=hexa('#2a1e34')); d.polygon([(bx - 9, ry - 28), (bx + 9, ry - 28), (bx + 6, ry - 20), (bx - 6, ry - 20)], fill=hexa('#6a5a72'))
    d.line([(bx - 9, ry - 28), (bx + 9, ry - 28)], fill=hexa('#b0a0b8'))
    flame(im, bx, ry - 28, 1.7, 1)
    im = glow(im, bx, ry - 30, 70, '#ff9a3a', 1.0)
    # characters (real Ember sheets): Shiloh looking at the crown, Cinder on the wall beside her
    sh = sheetframe('shiloh', 48, 56, 0, 2, True)
    sh = sprite_lit(sh, (255, 150, 70), .12); sh = ink_outline(sh) if False else sh
    paste(im, sh, 86, ry - 56 + 4)
    ci = sheetframe('cinder', 32, 34, 0, 0, False)
    paste(im, ci, 124, ry - 34 + 3)
    im = glow(im, 116, ry - 26, 24, '#ffb060', .35)
    d = ImageDraw.Draw(im)
    embers(im, rnd, 70, (60, 20, 330, 150))
    im = ink_outline(im, (14, 8, 24)) if False else im
    return im

# ======================================================================= BRIEF  (200 x 250): Ashfall Keep gate by night
def brief_ashfall():
    W, H = 200, 250; rnd = random.Random(3)
    im = to_img(gradient(W, H, [(0, '#0e0820'), (.4, '#241440'), (1, '#4a2850')], 7)); d = ImageDraw.Draw(im)
    for _ in range(40): d.point((rnd.randrange(W), int(rnd.random() ** 1.6 * 80)), fill=rnd.choice(['#e8dcc0', '#a898c8']))
    d.ellipse([150, 14, 174, 38], fill=hexa('#f0e4c8')); d.ellipse([156, 12, 178, 34], fill=hexa('#1a1030'))    # a crescent
    base, light, dark = hexa('#3c2c4a'), hexa('#7a6086'), hexa('#1c1228')
    # keep wall with crenellations
    crenel(im, 74, 20, 14, base, light, dark)
    bricks(im, 0, 75, W, 218, base, light, dark, 4, 20, 10)
    d = ImageDraw.Draw(im)
    # towers either side
    for tx in (0, 164): 
        d.rectangle([tx, 40, tx + 35, 220], fill=hexa('#2e2040')); bricks(im, tx, 40, tx + 36, 220, hexa('#2e2040'), hexa('#604878'), hexa('#160e22'), tx, 12, 8)
    d = ImageDraw.Draw(im)
    for tx in (0, 164): d.polygon([(tx - 2, 40), (tx + 18, 12), (tx + 38, 40)], fill=hexa('#4a2438')); d.line([(tx - 2, 40), (tx + 18, 12)], fill=hexa('#a05060'))
    # arched gate and portcullis
    gx0, gx1, gy = 60, 140, 218
    d.rectangle([gx0, 110, gx1, gy], fill=hexa('#0e0816')); d.pieslice([gx0, 80, gx1, 140], 180, 360, fill=hexa('#0e0816'))
    d.arc([gx0 - 3, 77, gx1 + 3, 143], 180, 360, fill=hexa('#8a6e92'), width=3)
    for x in range(gx0 + 6, gx1, 10): d.line([(x, 90 + abs(x - 100) // 4), (x, 190)], fill=hexa('#4a4258'), width=2)
    for y in range(116, 190, 14): d.line([(gx0 + 2, y), (gx1 - 2, y)], fill=hexa('#4a4258'), width=1)
    for x in range(gx0 + 6, gx1, 10): d.polygon([(x - 2, 190), (x + 2, 190), (x, 198)], fill=hexa('#7a7088'))
    # window with a candle, tower windows
    for (wx, wy) in ((12, 100), (176, 100), (12, 150), (176, 150)):
        d.rectangle([wx, wy, wx + 8, wy + 16], fill=hexa('#ffb050')); d.rectangle([wx + 3, wy, wx + 4, wy + 16], fill=hexa('#3a2030')); d.line([(wx, wy + 8), (wx + 8, wy + 8)], fill=hexa('#3a2030'))
    # braziers flanking the gate
    for bx in (44, 156):
        d.rectangle([bx - 1, 186, bx + 1, 214], fill=hexa('#2a1e34')); d.polygon([(bx - 8, 180), (bx + 8, 180), (bx + 5, 188), (bx - 5, 188)], fill=hexa('#7a6a82')); d.line([(bx - 8, 180), (bx + 8, 180)], fill=hexa('#c0b0c8'))
        flame(im, bx, 180, 1.6, bx % 3)
    for bx in (44, 156): im = glow(im, bx, 176, 60, '#ff9a3a', .9)
    # cobble apron
    d = ImageDraw.Draw(im); d.rectangle([0, 218, W, H], fill=hexa('#241830'))
    for yy in range(220, H, 8):
        for xx in range((yy // 8 % 2) * 6, W, 12): d.rectangle([xx, yy, xx + 9, yy + 5], fill=hexa('#40305a' if rnd.random() < .6 else '#2c2040')); d.point((xx + 1, yy), fill=hexa('#6a5a82'))
    # a guard silhouette in the arch, lantern in hand
    g = sheetframe('gaunt', 48, 56, 0, 0); g = sprite_lit(g, (30, 14, 40), .45)
    paste(im, g, 76, 160 + 6)
    d = ImageDraw.Draw(im); d.rectangle([108, 190, 111, 195], fill=hexa('#ffc860')); d.point((109, 191), fill=hexa('#fff4c8')); im = glow(im, 109, 192, 26, '#ffa040', .8)
    # a hanging banner
    d = ImageDraw.Draw(im)
    d.polygon([(86, 84), (114, 84), (114, 104), (100, 98), (86, 104)], fill=hexa('#8a2a32')); d.line([(86, 84), (114, 84)], fill=hexa('#e8b050'), width=2)
    d.rectangle([97, 88, 102, 93], fill=hexa('#e8b050'))
    embers(im, rnd, 40, (20, 100, 190, 230)); return im

# ======================================================================= VICTORY (360 x 120): dawn over the walls
def victory():
    W, H = 360, 120; rnd = random.Random(5)
    im = to_img(gradient(W, H, [(0, '#2a2a5a'), (.4, '#8a4a7a'), (.7, '#f08a5a'), (1, '#ffd090')], 9)); d = ImageDraw.Draw(im)
    for i in range(14):          # sunrise rays
        a0 = -math.pi * (.06 + i * .066); d.polygon([(180, 92), (180 + math.cos(a0) * 330, 92 + math.sin(a0) * 330), (180 + math.cos(a0 - .03) * 330, 92 + math.sin(a0 - .03) * 330)], fill=hexa('#ffb878' if i % 2 else '#f88c5e'))
    d.ellipse([160, 72, 200, 112], fill=hexa('#fff0b8')); d.ellipse([166, 78, 194, 106], fill=hexa('#ffffe0'))
    fill_ridge(im, ridge(W, 82, 8, 9), hexa('#6a3a5a'), '#d88a6a'); fill_ridge(im, ridge(W, 96, 6, 12), hexa('#3a2046'), '#8a5a72')
    for tx in (30, 300):    # distant towers
        d.rectangle([tx, 60, tx + 14, 100], fill=hexa('#2e1a3a')); d.polygon([(tx - 2, 60), (tx + 7, 46), (tx + 16, 60)], fill=hexa('#4a2438'))
    base, light, dark = hexa('#4a3258'), hexa('#a07aa0'), hexa('#241430')
    crenel(im, 98, 18, 9, base, light, dark); bricks(im, 0, 99, W, H, base, light, dark, 6, 16, 8)
    sh = sheetframe('shiloh', 48, 56, 0, 0); sh = sprite_lit(sh, (255, 190, 110), .16)
    paste(im, sh, 140, 98 - 56 + 3); ci = sheetframe('cinder', 32, 34, 1, 0); paste(im, ci, 192, 98 - 34 + 3)
    im = glow(im, 180, 84, 60, '#ffc070', .6)
    embers(im, rnd, 90, (100, 10, 270, 90), ('#ffe08a', '#ffb040', '#ffffff', '#ff8a3a')); return im

# ======================================================================= DEFEAT (360 x 120): the lantern finds you
def defeat():
    W, H = 360, 120; rnd = random.Random(11)
    im = to_img(gradient(W, H, [(0, '#08040e'), (.6, '#180c24'), (1, '#2a1230')], 6)); d = ImageDraw.Draw(im)
    base, light, dark = hexa('#2a2034'), hexa('#5a4868'), hexa('#100a18')
    bricks(im, 0, 0, W, 96, base, light, dark, 8, 22, 10)
    d = ImageDraw.Draw(im); d.rectangle([0, 96, W, H], fill=hexa('#1c1424'))
    for xx in range(0, W, 16): d.line([(xx, 96), (xx - 6, H)], fill=hexa('#2e2238'))
    d.line([(0, 96), (W, 96)], fill=hexa('#6a5878'))
    for bx in (22, 52, 82):    # iron bars on the left window
        d.rectangle([bx, 8, bx + 3, 96], fill=hexa('#46405a')); d.line([(bx, 8), (bx, 96)], fill=hexa('#8a8098'))
    d.rectangle([14, 8, 92, 12], fill=hexa('#46405a')); d.rectangle([14, 60, 92, 63], fill=hexa('#46405a'))
    # the guard (right) with lantern, sprite lit hard from his own lamp; Shiloh down, left of him
    g = sheetframe('gaunt', 48, 56, 0, 2, True); paste(im, g, 232, 96 - 56 + 3)
    lx, ly = 224, 66
    d = ImageDraw.Draw(im); d.line([(lx + 8, ly - 12), (lx + 8, ly - 4)], fill=hexa('#2a1e34')); d.rectangle([lx + 3, ly - 4, lx + 12, ly + 6], fill=hexa('#ffc860')); d.rectangle([lx + 3, ly - 4, lx + 12, ly - 3], fill=hexa('#3a2a40')); d.rectangle([lx + 3, ly + 5, lx + 12, ly + 6], fill=hexa('#3a2a40'))
    im = glow(im, lx + 8, ly + 2, 96, '#ff6a3a', 1.0, .15)
    ko = sheetframe('shiloh', 48, 56, 1, 14, False)          # the ko row
    ko = sprite_lit(ko, (255, 110, 70), .12); paste(im, ko, 150, 96 - 56 + 8)
    d = ImageDraw.Draw(im)     # red alert mark
    d.rectangle([268, 12, 276, 30], fill=hexa('#e0382c')); d.rectangle([269, 13, 275, 29], fill=hexa('#ff6a50')); d.rectangle([271, 15, 273, 23], fill=hexa('#ffffff')); d.rectangle([271, 26, 273, 28], fill=hexa('#ffffff'))
    embers(im, rnd, 20, (200, 20, 330, 100), ('#ff5a3a', '#ffb040')); return im

if __name__ == '__main__':
    for n, f in (('title', title), ('brief_ashfall', brief_ashfall), ('victory', victory), ('defeat', defeat)):
        im = f(); im.save(os.path.join(OUT, 'art_%s.png' % n)); print(n, im.size)
