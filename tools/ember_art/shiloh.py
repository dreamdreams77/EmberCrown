"""Shiloh, the courier: a runt of a spy in a teal waxed coat, a wax-red scarf and a satchel too big for them."""
import math, sys
from pix import *
from biped import *
import faces

SKIN = ramp('#f0bf96', '#a85a74', '#fff2d6')
HAIR = ramp('#c9552a', '#4e1a3c', '#ffb36a')
COAT = ramp('#2e6b72', '#122440', '#a8f0d0')
PANTS = ramp('#3d3350', '#161030', '#9a88c0')
BOOT = ramp('#6d412a', '#24101c', '#d09060')
SCARF = ramp('#cf3b2f', '#4a1030', '#ffa078')
LEATH = ramp('#92602f', '#341a1c', '#e8b070')
BRASS = ramp('#d9a441', '#5a2a22', '#fff0a0')
STEEL = ramp('#b8c4d8', '#3a3c6a', '#ffffff')
FACE = dict(eye='#2a1632', brow='#4a1f2a', blush='#e8707a', mouth='#7a2a40', lash=False)

def head(cv, view, hx, hy, hurt):
    rx, ry = 9.0, 8.3
    m = ell_mask(W, H, hx, hy, rx, ry)
    if view == 'left':
        m |= rect_mask(W, H, hx - 9.8, hy + 1, hx - 7.5, hy + 4)  # nose bump
    cv.shade(m, SKIN, rad=4.5, rim='all', bias=.16)
    if view == 'down':
        hair = ell_mask(W, H, hx, hy - 1.6, rx + .8, ry - .4)
        fr = poly_mask(W, H, [(hx - 12, hy + 4), (hx - 9, hy - 1.0), (hx - 7, hy + 1.6), (hx - 4, hy - 0.2), (hx - 1.5, hy + 1.4), (hx + 1.2, hy - 0.6), (hx + 4, hy + 1.3), (hx + 6.5, hy - 0.3), (hx + 9, hy + 3.5), (hx + 12, hy + 6)])
        top = hair & ~np.logical_and(~fr, np.arange(H)[:, None] > hy - 2.0)
        # keep everything above the ragged fringe line plus sideburns
        ys = np.arange(H)[:, None] * np.ones((1, W)); xs = np.ones((H, 1)) * np.arange(W)[None, :]
        hairm = hair & ((ys < hy + 1.2) | (np.abs(xs - hx) > 7.2) & (ys < hy + 4.5))
        hairm &= ~(fr & False)
        # carve the fringe: below the zig-zag stays skin
        zz = poly_mask(W, H, [(hx - 12, hy + 12), (hx - 12, hy + 3.2), (hx - 9, hy - 0.4), (hx - 7, hy + 1.8), (hx - 4, hy - 0.1), (hx - 1.5, hy + 1.6), (hx + 1.2, hy - 0.4), (hx + 4, hy + 1.5), (hx + 6.5, hy - 0.1), (hx + 9, hy + 3.0), (hx + 12, hy + 3.2), (hx + 12, hy + 12)])
        face_zone = zz & (np.abs(xs - hx) < 7.4)
        hairm &= ~face_zone
        cv.shade(hairm, HAIR, rad=3.2, rim='all')
        tuft = poly_mask(W, H, [(hx - 2, hy - 6.5), (hx, hy - 11), (hx + 3, hy - 12.5), (hx + 6.5, hy - 11.5), (hx + 4.8, hy - 9.2), (hx + 6.2, hy - 5.5)])
        cv.shade(tuft, HAIR, rad=2.2, rim='all')
    elif view == 'up':
        hair = ell_mask(W, H, hx, hy + .2, rx + .8, ry + .2)
        cv.shade(hair, HAIR, rad=4.5, rim='all')
        tuft = poly_mask(W, H, [(hx - 2, hy - 6.5), (hx, hy - 11), (hx + 3, hy - 12.5), (hx + 6.5, hy - 11.5), (hx + 4.8, hy - 9.2), (hx + 6.2, hy - 5.5)])
        cv.shade(tuft, HAIR, rad=2.2, rim='all')
        nape = rect_mask(W, H, hx - 3, hy + 6.5, hx + 3, hy + 9)
        cv.shade(nape, SKIN, rad=1.5)
    else:
        ys = np.arange(H)[:, None] * np.ones((1, W)); xs = np.ones((H, 1)) * np.arange(W)[None, :]
        hair = ell_mask(W, H, hx + 1.5, hy - .6, rx + .6, ry + .4) & ((xs > hx - 1.2) | (ys < hy - 2.6))
        # fringe sweeping forward over the brow
        hair |= poly_mask(W, H, [(hx - 8.8, hy - 1.5), (hx - 6, hy - 6.5), (hx, hy - 8.4), (hx + 1, hy - 3), (hx - 2, hy - 1.2), (hx - 4, hy + .4), (hx - 6.5, hy - 1.2)])
        hair &= ~(ell_mask(W, H, hx - 4.8, hy + 4, 4.5, 3.2))
        cv.shade(hair, HAIR, rad=3.4, rim='all')
        tuft = poly_mask(W, H, [(hx - 1, hy - 7), (hx + 0, hy - 11.5), (hx + 3.5, hy - 12.5), (hx + 7, hy - 10.5), (hx + 5.2, hy - 8.4), (hx + 6.5, hy - 5)])
        cv.shade(tuft, HAIR, rad=2.2, rim='all')

def back(cv, view, pose, hx, hy, sy, hm):
    s = pose.get('sway', 0)
    if view == 'down':  # scarf tail flicks out behind the right shoulder
        m = capsule_mask(W, H, CX + 5.5, sy - 1, CX + 10 + s * 1.5, sy + 7, 2.3, 1.7)
        cv.shade(m, SCARF, rad=1.8, rim='all')
    elif view == 'up':
        m = capsule_mask(W, H, CX, sy - 1, CX + s * 1.5, sy + 12, 2.8, 2.2)
        cv.shade(m, SCARF, rad=2.0, rim='all')
        cv.put(int(CX + s * 1.5), int(sy + 12), SCARF[0])
    else:
        pts = [(CX + 3, sy - .5), (CX + 8, sy + 1 + s), (CX + 13, sy + 3 - s), (CX + 17, sy + 5 + s)]
        for (a, b) in zip(pts, pts[1:]):
            m = capsule_mask(W, H, a[0], a[1], b[0], b[1], 2.3, 1.8)
            cv.shade(m, SCARF, rad=1.8, rim='all')

def body(cv, view, pose, tm, hx, hy, sy, hm):
    b = hm - 4
    if view == 'down':
        # belt, strap and satchel
        cv.shade(rect_mask(W, H, CX - 8, b, CX + 8, b + 2), LEATH, rad=1.2)
        cv.flat(rect_mask(W, H, CX - 1, b - .2, CX + 2, b + 2.2), BRASS[3])
        strap = capsule_mask(W, H, CX - 5.2, sy - 1, CX + 5.5, hm - 3, 1.5)
        cv.shade(strap & tm, LEATH, rad=1.4, rim='br')
        sat = rect_mask(W, H, CX + 5, hm - 8, CX + 13, hm - 1)
        cv.shade(sat, LEATH, rad=2.2, rim='all')
        cv.flat(rect_mask(W, H, CX + 5, hm - 8, CX + 13, hm - 5.5), LEATH[3])
        cv.put(CX + 9, hm - 4, BRASS[4]); cv.put(CX + 9, hm - 3, BRASS[2])
    elif view == 'up':
        cv.shade(rect_mask(W, H, CX - 8, b, CX + 8, b + 2), LEATH, rad=1.2)
        strap = capsule_mask(W, H, CX + 5.2, sy - 1, CX - 5.5, hm - 3, 1.5)
        cv.shade(strap & tm, LEATH, rad=1.4, rim='br')
        sat = rect_mask(W, H, CX - 11, hm - 9, CX - 3, hm - 1)
        cv.shade(sat, LEATH, rad=2.2, rim='all')
        cv.flat(rect_mask(W, H, CX - 11, hm - 9, CX - 3, hm - 6.5), LEATH[3])
    else:
        cv.shade(rect_mask(W, H, CX - 5, b, CX + 5, b + 2), LEATH, rad=1.2)
        sat = rect_mask(W, H, CX + 2, hm - 9, CX + 10, hm - 1)
        cv.shade(sat, LEATH, rad=2.2, rim='all')
        cv.flat(rect_mask(W, H, CX + 2, hm - 9, CX + 10, hm - 6.5), LEATH[3])
        cv.put(CX + 6, hm - 5, BRASS[4])

def front(cv, view, pose, tm, hx, hy, sy, hm):
    # scarf collar over the shoulders
    if view == 'down':
        c = ell_mask(W, H, CX, sy - .5, 8.0, 3.4)
        cv.shade(c, SCARF, rad=2.4, rim='all')
        d = capsule_mask(W, H, CX - 3.5, sy + 1, CX - 4.2, sy + 8, 1.9, 1.5)
        cv.shade(d, SCARF, rad=1.6, rim='all')
    elif view == 'left':
        c = ell_mask(W, H, CX - 1, sy - .5, 6.2, 3.4)
        cv.shade(c, SCARF, rad=2.4, rim='all')
    else:
        c = ell_mask(W, H, CX, sy - .5, 8.0, 3.4)
        cv.shade(c, SCARF, rad=2.4, rim='all')

def weapon(cv, view, hand, ang):
    a = math.radians(ang); x, y = hand
    sign = {'down': 1, 'up': 1, 'left': -1}[view]
    # the swing leaves a pale ember crescent behind the blade
    for k, (back, col) in enumerate(((46, (255, 214, 150, 90)), (30, (255, 236, 190, 150)), (14, (255, 250, 226, 215)))):
        for t in range(0, back, 3):
            aa = math.radians(ang - sign * t)
            for r in (13.5, 14.5) if k == 2 else (14.0,):
                px_, py_ = int(round(x + math.cos(aa) * r)), int(round(y + math.sin(aa) * r))
                if 0 <= px_ < W and 0 <= py_ < H and cv.a[py_, px_, 3] < 250: cv.a[py_, px_] = col
    ex, ey = x + math.cos(a) * 15, y + math.sin(a) * 15
    cv.shade(capsule_mask(W, H, x, y, ex, ey, 1.5, .8), STEEL, rad=1.4, rim='all')
    gx, gy = x + math.cos(a) * 2.4, y + math.sin(a) * 2.4
    nx, ny = -math.sin(a), math.cos(a)
    cv.flat(capsule_mask(W, H, gx - nx * 2.6, gy - ny * 2.6, gx + nx * 2.6, gy + ny * 2.6, .9), BRASS[3])
    cv.flat(ell_mask(W, H, x, y, 1.8, 1.8), SKIN[2])

CFG = base_cfg(skin=SKIN, coat=COAT, sleeve=COAT, pants=PANTS, boots=BOOT, head_fn=head, back_fn=back, body_fn=body, front_fn=front, weapon_fn=weapon, strike_arm=True, ink=(30, 14, 36))

def sheetfor():
    """Returns (PIL sheet, meta). Rows: walk,slash,hurt for views down/up/left; ko separate."""
    return None

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shiloh_prev.png'
    frames = []
    for view in ('down', 'up', 'left'):
        row = []
        cv, hp = draw_person(CFG, view, IDLE); row.append((cv, hp))
        for f in range(6):
            row.append(draw_person(CFG, view, walk_pose(f)))
        angs = {'down': [-40, 10, 70, 130, 160], 'up': [200, 250, 300, 340, 20], 'left': [240, 200, 170, 150, 130]}[view]
        for ang in angs:
            row.append(draw_person(CFG, view, IDLE, weapon=ang))
        frames.append(row)
    tiles = []
    for vi, row in enumerate(frames):
        for j, (cv, hp) in enumerate(row):
            view = ('down', 'up', 'left')[vi]
            if view != 'up':
                fc = faces.face('down' if view == 'down' else 'left', 'calm', FACE)
                im = cv.img(); im.alpha_composite(fc.img(), (hp[0] - 12, hp[1] - 8)); cv2 = im
            else: cv2 = cv.img()
            tiles.append(cv2)
    sh = sheet(tiles, 12, W, H)
    preview(sh, out, scale=4)
    print(sh.size)
