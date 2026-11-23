"""House Marrow's watch: two guards who do not share a silhouette. Pell, the pikeman (tall kettle helm, long spear),
and Sergeant Gaunt (broad, bald, bristling moustache, hooded lantern). Plum and bone: Marrow keeps its dead close."""
import math, sys
from pix import *
from biped import *
import faces

PLUM = ramp('#5c3a78', '#1c1034', '#d8b0f0')
PLUM2 = ramp('#6a3a58', '#241030', '#f0a8b8')
BONE = ramp('#d8cfb8', '#5a3a58', '#fffbe8')
STEELH = ramp('#8e92aa', '#2a2a50', '#f4f4ff')
SKINP = ramp('#dfae88', '#9a5870', '#fff0d0')
SKINS = ramp('#d79c78', '#8f4a60', '#ffe8c4')
PANT = ramp('#3a3248', '#141028', '#8878b0')
BOOT = ramp('#4a3028', '#1a0c18', '#b07850')
WOOD = ramp('#8a5a34', '#2a1418', '#e8b070')
IRON = ramp('#9aa0b4', '#2a2c50', '#ffffff')
BRASS = ramp('#d9a441', '#5a2a22', '#fff0a0')
FACE_A = dict(eye='#241830', brow='#3a2430', blush=None, mouth='#6a2a40')
FACE_B = dict(eye='#2a1620', brow='#2a1a1a', blush='#d86a6a', mouth='#6a2a38', stache='#7a6048', thick=True)

def sigil(cv, x, y):  # Marrow's mark: a small bone-white crescent over a dot
    for (dx, dy) in ((0, 0), (1, 0), (-1, 1), (2, 1), (-1, 2), (2, 2), (0, 3), (1, 3)): cv.put(x + dx, y + dy, BONE[3])
    cv.put(x, y + 1, BONE[2]) if False else None

# ------------------------------------------------------------------ Pell: pikeman
def head_a(cv, view, hx, hy, hurt):
    rx, ry = 8.6, 8.0
    m = ell_mask(W, H, hx, hy + .6, rx, ry)
    if view == 'left': m |= rect_mask(W, H, hx - 9.6, hy + 2, hx - 7.5, hy + 4.5)
    cv.shade(m, SKINP, rad=4.5, rim='all', bias=.16)
    ys = np.arange(H)[:, None] * np.ones((1, W)); xs = np.ones((H, 1)) * np.arange(W)[None, :]
    dome = ell_mask(W, H, hx, hy - 1.6, rx + 1.2, ry - .3) & (ys < hy - 1.0)
    if view == 'left': dome = ell_mask(W, H, hx + .6, hy - 1.6, rx + 1.2, ry - .3) & (ys < hy - 1.0)
    cv.shade(dome, STEELH, rad=4.0, rim='all')
    brim = rect_mask(W, H, hx - rx - 2, hy - 2.4, hx + rx + 2, hy - .6) if view != 'left' else rect_mask(W, H, hx - rx - 2.5, hy - 2.4, hx + rx + 1, hy - .6)
    cv.shade(brim & (np.abs(xs - hx) < rx + 2.6), STEELH, rad=1.2, rim='all')
    if view == 'down':
        cv.shade(rect_mask(W, H, hx - .6, hy - .6, hx + .8, hy + 5.2), STEELH, rad=1.0, rim='all')  # nose guard
        for sx in (-1, 1): cv.put(hx + sx * 7, hy - 4, STEELH[4])
        cv.flat(rect_mask(W, H, hx - 1, hy - 8.5, hx + 1.2, hy - 6), BONE[3])  # a bone-white crest stub
    elif view == 'left':
        cv.shade(rect_mask(W, H, hx - 9.3, hy - .6, hx - 7.8, hy + 2.8), STEELH, rad=1.0, rim='all')
        cv.shade(ell_mask(W, H, hx + 5.5, hy + 4, 3.2, 3.8) & (xs > hx + 2.5), PLUM, rad=2.0, rim='all')  # padded neck
    else:
        cv.shade(rect_mask(W, H, hx - 6, hy + 2, hx + 6, hy + 8.5) & ell_mask(W, H, hx, hy + 1, 9, 8.8), PLUM, rad=2.2, rim='all')

def body_a(cv, view, pose, tm, hx, hy, sy, hm):
    b = hm - 5
    cv.shade(rect_mask(W, H, CX - 8, b, CX + 8, b + 2), WOOD, rad=1.2)
    cv.flat(rect_mask(W, H, CX - 1, b - .2, CX + 2, b + 2.2), BRASS[3])
    if view in ('down', 'up'):
        tab = poly_mask(W, H, [(CX - 4.5, sy + 1.5), (CX + 4.5, sy + 1.5), (CX + 5.5, hm + 3), (CX - 5.5, hm + 3)])
        cv.shade(tab, PLUM2, rad=2.2, rim='all')
        if view == 'down': sigil(cv, CX - 1, sy + 5)
        # bone pauldrons
        for sx in (-1, 1): cv.shade(ell_mask(W, H, CX + sx * 7.8, sy + .5, 3.4, 2.6), BONE, rad=2.0, rim='all')
    else:
        tab = poly_mask(W, H, [(CX - 4, sy + 1.5), (CX + 3, sy + 1.5), (CX + 4, hm + 3), (CX - 5, hm + 3)])
        cv.shade(tab, PLUM2, rad=2.2, rim='all')
        cv.shade(ell_mask(W, H, CX, sy + .5, 3.6, 2.8), BONE, rad=2.0, rim='all')

def spear(cv, view, hand, ang):
    x, y = hand
    if view == 'left':
        tx, ty = x - 6, 2
        bx, by = x + 3, 50
    else:
        tx, ty = x + 1, 1
        bx, by = x + 1, 52
    cv.flat(capsule_mask(W, H, bx, by, tx, ty + 6, .85, .85), WOOD[2])
    cv.flat(capsule_mask(W, H, bx - .2, by, tx - .2, ty + 6, .35, .35), WOOD[3])
    tip = poly_mask(W, H, [(tx - 1.8, ty + 7), (tx, ty - 1.5), (tx + 1.8, ty + 7)])
    cv.shade(tip, IRON, rad=1.5, rim='all')
    cv.flat(rect_mask(W, H, tx - 1.2, ty + 7, tx + 1.4, ty + 8.4), BONE[2])

CFG_A = base_cfg(skin=SKINP, coat=PLUM, sleeve=PLUM, pants=PANT, boots=BOOT, head_fn=head_a, body_fn=body_a, weapon_fn=spear,
                 torso_w=13, hem_w=15, ink=(24, 12, 34))

# ------------------------------------------------------------------ Sergeant Gaunt: broad, bald, lantern
def head_b(cv, view, hx, hy, hurt):
    rx, ry = 9.6, 8.2
    m = ell_mask(W, H, hx, hy + .4, rx, ry)
    if view == 'left': m |= rect_mask(W, H, hx - 10.4, hy + 1.5, hx - 8, hy + 5)
    cv.shade(m, SKINS, rad=5, rim='all', bias=.16)
    ys = np.arange(H)[:, None] * np.ones((1, W)); xs = np.ones((H, 1)) * np.arange(W)[None, :]
    if view == 'up':
        cv.shade(rect_mask(W, H, hx - 9, hy + 3.5, hx + 9, hy + 9) & m, SKINS, rad=2, rim='all', bias=.1)
        for sx in (-1, 1): cv.shade(ell_mask(W, H, hx + sx * 7.6, hy + 2.2, 1.8, 3.2), ramp('#7a6a60', '#2a1a20', '#d8c8b8'), rad=1.5, rim='all')
    elif view == 'down':
        for sx in (-1, 1):  # a ring of grey stubble at the temples
            cv.shade(ell_mask(W, H, hx + sx * 8.2, hy + 1.8, 1.8, 3.2), ramp('#7a6a60', '#2a1a20', '#d8c8b8'), rad=1.5, rim='all')
    else:
        cv.shade(ell_mask(W, H, hx + 6.2, hy + 1.8, 2.6, 3.8), ramp('#7a6a60', '#2a1a20', '#d8c8b8'), rad=1.5, rim='all')
    # scar over the eyebrow is part of the face overlay for this guard

def body_b(cv, view, pose, tm, hx, hy, sy, hm):
    b = hm - 5
    cv.shade(rect_mask(W, H, CX - 10, b, CX + 10, b + 3), WOOD, rad=1.2)
    cv.flat(rect_mask(W, H, CX - 2, b - .2, CX + 2.4, b + 3.2), BRASS[3])
    # bone breastplate straps and big pauldrons: Marrow's rank
    if view != 'left':
        plate = poly_mask(W, H, [(CX - 6, sy), (CX + 6, sy), (CX + 5, b - .5), (CX - 5, b - .5)])
        cv.shade(plate, BONE, rad=3, rim='all')
        for i in range(3): cv.flat(rect_mask(W, H, CX - 4, sy + 3 + i * 3, CX + 4, sy + 3.8 + i * 3), BONE[1])
        for sx in (-1, 1): cv.shade(ell_mask(W, H, CX + sx * 9.2, sy + .5, 4.4, 3.2), BONE, rad=2.4, rim='all')
    else:
        plate = poly_mask(W, H, [(CX - 5, sy), (CX + 4, sy), (CX + 5, b - .5), (CX - 6, b - .5)])
        cv.shade(plate, BONE, rad=3, rim='all')
        cv.shade(ell_mask(W, H, CX, sy + .5, 4.6, 3.4), BONE, rad=2.4, rim='all')

def lantern(cv, view, hand, ang):
    x, y = hand
    cv.flat(capsule_mask(W, H, x, y, x, y + 3, .4, .4), IRON[1])
    cv.shade(rect_mask(W, H, x - 2.6, y + 3, x + 2.6, y + 8.6), BRASS, rad=1.6, rim='all')
    cv.flat(rect_mask(W, H, x - 1.5, y + 4, x + 1.5, y + 7.5), hexc('#ffc060'))
    cv.flat(rect_mask(W, H, x - .6, y + 4.6, x + .6, y + 6.8), hexc('#fff4c0'))
    cv.shade(rect_mask(W, H, x - 3.2, y + 2.4, x + 3.2, y + 3.4), BRASS, rad=1, rim='all')

CFG_B = base_cfg(skin=SKINS, coat=PLUM2, sleeve=PLUM2, pants=PANT, boots=BOOT, head_fn=head_b, body_fn=body_b, weapon_fn=lantern,
                 torso_w=18, hem_w=20, head_rx=9.6, head_y=18, leg_gap=4.0, leg_r=3.0, arm_r=2.6, ink=(24, 12, 30))

if __name__ == '__main__':
    tiles = []
    for cfg, st in ((CFG_A, FACE_A), (CFG_B, FACE_B)):
        for view in ('down', 'up', 'left'):
            for pose in (IDLE, walk_pose(1), walk_pose(2), walk_pose(4)):
                cv, hp = draw_person(cfg, view, pose, weapon=0)
                im = cv.img()
                if view != 'up':
                    fc = faces.face('down' if view == 'down' else 'left', 'calm', st); im.alpha_composite(fc.img(), (hp[0] - 12, hp[1] - 8))
                tiles.append(im)
    sh = sheet(tiles, 12, W, H); preview(sh, sys.argv[1] if len(sys.argv) > 1 else '/tmp/guards_prev.png', scale=4); print(sh.size)
