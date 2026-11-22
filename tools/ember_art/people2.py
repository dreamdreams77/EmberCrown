"""Ashfall's two people who are not soldiers: Pip the scullion (small, grubby, goggles on his cap, a slop pail) and Hale the chained sailor
(striped jersey, red bandana, salt-and-pepper beard, manacles). Same skeleton as everyone else, drawn at a smaller scale for Pip."""
import math
from pix import *
from biped import *

SKIN_P = ramp('#e8c0a0', '#a85a6a', '#fff0d8'); SKIN_H = ramp('#d8aa80', '#8a4a58', '#ffe6c0')
HAIR_P = ramp('#6a4a34', '#241418', '#b08860'); CAP = ramp('#6a6a40', '#1c1c20', '#d0d090')
VEST = ramp('#3e7a68', '#10282c', '#a8e8c8'); SHIRT = ramp('#e8dcc0', '#7a5a68', '#ffffff'); APRON = ramp('#d8d0b8', '#6a5a68', '#ffffff')
PANT_P = ramp('#5a4838', '#1c1018', '#b89870'); BOOT_P = ramp('#4a3428', '#180c14', '#a87850')
NAVY = ramp('#34507a', '#101830', '#a8c8f8'); BAND = ramp('#c8382c', '#4a1030', '#ffa078'); IRONR = ramp('#9aa0b4', '#2a2c50', '#ffffff')
BRASSR = ramp('#d9a441', '#5a2a22', '#fff0a0'); WOODR = ramp('#8a5a38', '#2a1418', '#f0b878')

def head_pip(cv, view, hx, hy, hurt):
    m = ell_mask(W, H, hx, hy, 9.0, 8.4)
    if view == 'left': m |= rect_mask(W, H, hx - 9.6, hy + 1.5, hx - 7.5, hy + 4)
    cv.shade(m, SKIN_P, rad=4.5, rim='all', bias=.16)
    ys = np.arange(H)[:, None] * np.ones((1, W)); xs = np.ones((H, 1)) * np.arange(W)[None, :]
    if view == 'up':
        cv.shade(ell_mask(W, H, hx, hy + .4, 9.2, 8.6), HAIR_P, rad=4.5, rim='all')
    else:
        for sx in (-1, 1) if view == 'down' else (1,):   # scruffy tufts at the ears
            cv.shade(ell_mask(W, H, hx + sx * 8.4, hy + 2, 1.9, 3.4), HAIR_P, rad=1.5, rim='all')
    cap = ell_mask(W, H, hx + (.6 if view == 'left' else 0), hy - 2.2, 9.8, 6.6) & (ys < hy - .6)
    cv.shade(cap, CAP, rad=3.6, rim='all')
    peak = rect_mask(W, H, hx - 9.4, hy - 1.6, hx + 9.4, hy - .2) if view == 'down' else (rect_mask(W, H, hx - 11, hy - 1.8, hx - 3, hy) if view == 'left' else None)
    if peak is not None: cv.shade(peak, ramp('#4a4a30', '#14141a', '#a0a070'), rad=1.0, rim='all')
    if view != 'up':   # goggles pushed up on the cap: two brass rings, strap across
        gx = [hx - 4.2, hx + 4.2] if view == 'down' else [hx - 3, hx + 2]
        for g in gx:
            cv.shade(ell_mask(W, H, g, hy - 4.6, 3.0, 2.8) & ~ell_mask(W, H, g, hy - 4.6, 1.5, 1.4), BRASSR, rad=1.2, rim='all')
            cv.flat(ell_mask(W, H, g, hy - 4.6, 1.5, 1.4), hexc('#9ad8e8'))
    else:
        cv.flat(rect_mask(W, H, hx - 9, hy - 3, hx + 9, hy - 1.6), CAP[1])

def body_pip(cv, view, pose, tm, hx, hy, sy, hm):
    b = hm - 5
    cv.shade(rect_mask(W, H, CX - 7, b, CX + 7, b + 2), ramp('#a88858', '#3a2418', '#f0d098'), rad=1.0)   # rope belt
    if view != 'left':
        shirt = poly_mask(W, H, [(CX - 5, sy), (CX + 5, sy), (CX + 4, b), (CX - 4, b)])
        cv.shade(shirt, VEST if view == 'down' else VEST, rad=2.4, rim='all')
        if view == 'down':
            cv.shade(poly_mask(W, H, [(CX - 4, b - 1), (CX + 4, b - 1), (CX + 5, hm + 3), (CX - 5, hm + 3)]), APRON, rad=2.0, rim='all')   # grubby apron
            for (x, y) in ((CX - 2, b + 4), (CX + 1, b + 6), (CX + 2, b + 3)): cv.put(x, y, ramp('#8a6a50', '#3a2418', '#c8a880')[2])
            cv.stamp(CX + 4, sy + 3, ['.X.', 'XXX', '.X.'], {'X': ramp('#c8a85a', '#5a3a28', '#fff0a8')[2]})   # a patch
    else:
        cv.shade(poly_mask(W, H, [(CX - 4, sy + 1), (CX + 3, sy + 1), (CX + 4, hm + 3), (CX - 5, hm + 3)]), APRON, rad=2.0, rim='all')

def pail(cv, view, hand, ang):
    x, y = hand
    cv.shade(poly_mask(W, H, [(x - 4, y + 2), (x + 4, y + 2), (x + 3, y + 9), (x - 3, y + 9)]), WOODR, rad=1.8, rim='all')
    cv.flat(rect_mask(W, H, x - 4, y + 4, x + 4, y + 5), IRONR[2]); cv.flat(rect_mask(W, H, x - 3, y + 7, x + 3, y + 8), IRONR[2])
    cv.flat(rect_mask(W, H, x - 3, y + 2, x + 3, y + 3.4), hexc('#6a7a8a'))
    for dx in (-3, 3): cv.put(x + dx, y, IRONR[3])
    cv.flat(rect_mask(W, H, x - 3, y, x + 3, y + 1), IRONR[3])

CFG_PIP = base_cfg(skin=SKIN_P, coat=SHIRT, sleeve=SHIRT, pants=PANT_P, boots=BOOT_P, head_fn=head_pip, body_fn=body_pip, weapon_fn=pail, torso_w=12, hem_w=14, ink=(26, 14, 28))
FACE_PIP = dict(eye='#2a1a20', brow='#4a3424', blush='#e8707a', mouth='#7a2a3a', freckles='#c8805a')

# ------------------------------------------------------------------ Hale
HAIR_H = ramp('#7a7068', '#2a2428', '#d8d0c8')
def head_hale(cv, view, hx, hy, hurt):
    m = ell_mask(W, H, hx, hy + .4, 9.2, 8.4)
    if view == 'left': m |= rect_mask(W, H, hx - 10, hy + 1.5, hx - 7.6, hy + 4.5)
    cv.shade(m, SKIN_H, rad=4.5, rim='all', bias=.16)
    ys = np.arange(H)[:, None] * np.ones((1, W)); xs = np.ones((H, 1)) * np.arange(W)[None, :]
    if view == 'up': cv.shade(ell_mask(W, H, hx, hy + .4, 9.4, 8.6), HAIR_H, rad=4.5, rim='all')
    if view == 'left': cv.shade(ell_mask(W, H, hx + 4.5, hy + 1.5, 4.8, 6.2) & (xs > hx + 1), HAIR_H, rad=2.4, rim='all')
    band = ell_mask(W, H, hx + (.6 if view == 'left' else 0), hy - 2.8, 9.8, 5.8) & (ys < hy - 1.0)       # red bandana
    cv.shade(band, BAND, rad=3.0, rim='all')
    if view != 'up': cv.shade(poly_mask(W, H, [(hx + 7, hy - 3), (hx + 12, hy - 1), (hx + 10, hy + 2), (hx + 7, hy)]), BAND, rad=1.4, rim='all') if view == 'down' else None
    if view == 'down':
        cv.flat(rect_mask(W, H, hx - 9, hy - 2.2, hx + 9, hy - 1.0), BAND[0])
        for sx in (-1, 1): cv.shade(ell_mask(W, H, hx + sx * 8.6, hy + 2, 1.7, 3.2), HAIR_H, rad=1.4, rim='all')

def body_hale(cv, view, pose, tm, hx, hy, sy, hm):
    b = hm - 5
    cv.shade(rect_mask(W, H, CX - 8, b, CX + 8, b + 2), ramp('#6a4a34', '#241418', '#c89a6a'), rad=1.0)
    for y in range(int(sy + 1), int(b), 3):   # the striped jersey
        row = (tm[y, :]) & (np.abs(np.arange(W) - CX) < (7 if view != 'left' else 4.5))
        cv.a[y, row] = (232, 224, 208, 255); 
        if y + 1 < b: cv.a[y + 1, row] = (200, 192, 184, 255)

def manacles(cv, view, hand, ang):
    x, y = hand
    cv.shade(ell_mask(W, H, x, y, 3.2, 3.2) & ~ell_mask(W, H, x, y, 1.7, 1.7), IRONR, rad=1.2, rim='all')
    for i in range(3): cv.put(x + (1 if view == 'left' else 0), y + 4 + i * 2, IRONR[3]); cv.put(x + (1 if view == 'left' else -1) + (i % 2), y + 5 + i * 2, IRONR[1])

def free(cv, view, hand, ang): pass

CFG_HALE = base_cfg(skin=SKIN_H, coat=NAVY, sleeve=NAVY, pants=ramp('#3a3a4a', '#101018', '#8a8aa8'), boots=BOOT_P, head_fn=head_hale, body_fn=body_hale, weapon_fn=manacles, torso_w=15, hem_w=17, ink=(20, 14, 32))
CFG_HALE_FREE = dict(CFG_HALE, weapon_fn=free)
FACE_HALE = dict(eye='#201a28', brow='#5a504c', blush=None, mouth='#6a2a38', beard='#8a8078')
