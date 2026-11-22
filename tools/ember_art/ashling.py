"""Ashling, the runt dragon: too much head, not enough dragon, and every bit of her feelings on her face."""
import math, sys
from pix import *

AW, AH, AFOOT, ACX = 44, 44, 38, 22
BODY = ramp('#e2642c', '#3c0e34', '#ffc070')
BELLY = ramp('#f6c27a', '#8a3a3c', '#fff4c8')
WING = ramp('#c8482e', '#38102c', '#ff9a58')
HORN = ramp('#f0e4c4', '#6a3a50', '#ffffff')
EYE = hexc('#fff2c8'); PUP = hexc('#2a0c18'); AMB = hexc('#ffb83a')
FL = ramp('#ffb830', '#c02818', '#fffbd0')

def face_down(cv, cx, cy, expr):
    P = cv.put
    if expr in ('fire',):
        for sx in (-1, 1):
            x = cx + sx * 4.2
            cv.flat(rect_mask(AW, AH, x - 1.5, cy - 1.5, x + 1.5, cy + 1), PUP)          # squinting
            P(x - 1 + (0 if sx < 0 else 1), cy - 2, PUP)
        cv.flat(rect_mask(AW, AH, cx - 2.5, cy + 3.5, cx + 2.5, cy + 7), hexc('#3a0a14')); cv.flat(rect_mask(AW, AH, cx - 1.5, cy + 6, cx + 1.5, cy + 7), hexc('#e0506a'))
        for x in (cx - 2, cx + 1): P(x, cy + 3, HORN[3])
    elif expr == 'hurt':
        for sx in (-1, 1):
            x = int(cx + sx * 4.2)
            for (a, b) in ((0, 0), (1, 1), (0, 2)) if sx < 0 else ((1, 0), (0, 1), (1, 2)): P(x - 1 + a, cy - 1 + b, PUP)
        for dx in range(-2, 3): P(cx + dx, cy + 5 + (dx % 2), PUP)
    elif expr == 'ko':
        for sx in (-1, 1):
            x = int(cx + sx * 4.2)
            for (a, b) in ((0, 0), (1, 1), (2, 2), (2, 0), (0, 2)): P(x - 1 + a, cy - 1 + b, PUP)
        P(cx, cy + 5, PUP); P(cx + 1, cy + 5, PUP)
    else:
        for sx in (-1, 1):
            x = cx + sx * 4.2
            cv.flat(rect_mask(AW, AH, x - 1.8, cy - 2.6, x + 1.8, cy + 2.2), EYE)            # big glossy eye
            cv.flat(rect_mask(AW, AH, x - 1.0 + sx * .2, cy - 1.8, x + 1.0 + sx * .2, cy + 1.8), AMB)
            cv.flat(rect_mask(AW, AH, x - .6 + sx * .2, cy - 1.2, x + .6 + sx * .2, cy + 1.6), PUP)
            P(x - 1.4, cy - 2.0, hexc('#ffffff'))
            for dx in range(-2, 2): P(x + dx + (1 if sx < 0 else 0), cy - 3.4 + (0 if expr == 'calm' else (1 if sx > 0 else 0)), BODY[0])
        for (dx, dy) in ((-1, 3.6), (1, 3.6)): P(cx + dx - 0.5, cy + dy, PUP)               # nostrils
        for dx in (-3, -2, 2, 3): P(cx + dx, cy + 6 + (1 if abs(dx) == 3 else 0), PUP)       # little smile
        cv.put(cx - 5.5, cy + 3, hexc('#e8707a')); cv.put(cx + 5.5, cy + 3, hexc('#e8707a'))

def flame(cv, x, y, f):
    k = f % 2
    cv.shade(poly_mask(AW, AH, [(x - 2.8, y + 2.2), (x - 1.8, y - 3 - k), (x + .2, y - 6.5 - k * 1.5), (x + 1.8, y - 3), (x + 2.8, y + 2.2)]), FL, rad=2.4, bias=.2)
    cv.flat(poly_mask(AW, AH, [(x - 1, y + 1.6), (x, y - 2.4 - k), (x + 1.2, y + 1.6)]), FL[4])

def draw(view='down', anim='idle', f=0):
    cv = Cv(AW, AH)
    expr = {'idle': 'calm', 'walk': 'calm', 'fire': 'fire', 'hurt': 'hurt', 'ko': 'ko'}[anim]
    bob = 1 if (anim == 'walk' and f % 2 == 0) else 0
    sway = (-1, 0, 1, 0)[f % 4] if anim == 'walk' else 0
    cx = ACX
    if view in ('down', 'up'):
        # tail (behind): curls to one side with a flame tip
        tx = cx + 9 + sway * 1.5
        pts = [(cx + 4, 36), (cx + 10, 38), (tx + 3, 35), (tx + 5, 31)]
        if view == 'down':
            for (a, b) in zip(pts, pts[1:]): cv.shade(capsule_mask(AW, AH, a[0], a[1] + bob, b[0], b[1] + bob, 2.4, 1.8), BODY, rad=1.8, rim='all')
        # wings, folded
        for sx in (-1, 1):
            wing = poly_mask(AW, AH, [(cx + sx * 6, 22 + bob), (cx + sx * 16, 13 + bob), (cx + sx * 15, 24 + bob), (cx + sx * 11, 30 + bob)])
            cv.shade(wing, WING, rad=2.6, rim='all')
        # legs / feet
        for sx in (-1, 1):
            lift = 2 if (anim == 'walk' and ((f + (0 if sx < 0 else 2)) % 4) < 2) else 0
            cv.shade(ell_mask(AW, AH, cx + sx * 5.4, AFOOT - 2 - lift, 3.6, 2.8), BODY, rad=2, rim='all')
            for dx in (-1, 0, 1): cv.put(cx + sx * 5.4 + dx * 1.4, AFOOT - 1 - lift, HORN[2])
        # body
        cv.shade(ell_mask(AW, AH, cx, 28 + bob, 10.5, 9.0), BODY, rad=5, rim='all', bias=.1)
        if view == 'down': cv.shade(ell_mask(AW, AH, cx, 30 + bob, 6.2, 6.6), BELLY, rad=3, bias=.1)
        if view == 'up':
            for k in range(4): cv.shade(poly_mask(AW, AH, [(cx - 1.5, 20 + k * 3.4 + bob), (cx, 18 + k * 3.4 + bob), (cx + 1.5, 20 + k * 3.4 + bob)]), HORN, rad=1)
            pass
        # head
        hy = 16 + bob + (1 if anim == 'hurt' else 0)
        for sx in (-1, 1):  # horns
            cv.shade(poly_mask(AW, AH, [(cx + sx * 5, hy - 4), (cx + sx * 9.5, hy - 12), (cx + sx * 8, hy - 3)]), HORN, rad=1.4, rim='all')
        cv.shade(ell_mask(AW, AH, cx, hy, 10, 8.6), BODY, rad=5, rim='all', bias=.14)
        if view == 'down':
            cv.shade(ell_mask(AW, AH, cx, hy + 3.6, 5.6, 4.0), ramp('#f08a44', '#7a2038', '#ffe0a0'), rad=2.5, bias=.1)   # muzzle
            face_down(cv, cx, hy, expr)
        else:
            for k in range(3): cv.shade(poly_mask(AW, AH, [(cx - 1.6, hy - 6 + k * 3.6), (cx, hy - 8 + k * 3.6), (cx + 1.6, hy - 6 + k * 3.6)]), HORN, rad=1)
        flame(cv, tx + 5 + (0 if view == 'down' else -22), 28 + bob, f)
    else:
        # facing left
        pts = [(cx + 7, 31), (cx + 12, 33), (cx + 16, 31), (cx + 19, 27)]
        for (a, b) in zip(pts, pts[1:]): cv.shade(capsule_mask(AW, AH, a[0], a[1] + bob + sway * .3, b[0], b[1] + bob + sway * .3, 2.4, 1.6), BODY, rad=1.8, rim='all')
        flame(cv, cx + 20, 22 + bob + sway * .3, f)
        for sx in (-1, 1):
            lift = 2 if (anim == 'walk' and ((f + (0 if sx < 0 else 2)) % 4) < 2) else 0
            x = cx + sx * 5 - (0 if sx < 0 else 1)
            cv.shade(ell_mask(AW, AH, x, AFOOT - 2 - lift, 4.2, 2.8), BODY, rad=2, rim='all')
        cv.shade(ell_mask(AW, AH, cx + 1, 28 + bob, 11.5, 8.6), BODY, rad=5, rim='all', bias=.1)
        cv.shade(ell_mask(AW, AH, cx - 1, 31 + bob, 8, 5.4), BELLY, rad=2.5, bias=.1)
        wing = poly_mask(AW, AH, [(cx + 3, 23 + bob), (cx + 12, 13 + bob + sway * .3), (cx + 14, 24 + bob), (cx + 8, 30 + bob)])
        cv.shade(wing, WING, rad=2.6, rim='all')
        hy = 17 + bob + (1 if anim == 'hurt' else 0); hx = cx - 3
        cv.shade(poly_mask(AW, AH, [(hx + 3, hy - 4), (hx + 9, hy - 12), (hx + 8, hy - 3)]), HORN, rad=1.4, rim='all')
        cv.shade(ell_mask(AW, AH, hx, hy, 9.6, 8.4), BODY, rad=5, rim='all', bias=.14)
        cv.shade(ell_mask(AW, AH, hx - 7.2, hy + 3.2, 5.6, 3.8), ramp('#f08a44', '#7a2038', '#ffe0a0'), rad=2.4, bias=.1)
        # profile face
        ex, ey = hx - 4, hy - 1
        if expr in ('calm',):
            cv.flat(rect_mask(AW, AH, ex - 1.8, ey - 2.4, ex + 1.8, ey + 2.4), EYE); cv.flat(rect_mask(AW, AH, ex - 1.8, ey - 1.6, ex + .4, ey + 2), AMB); cv.flat(rect_mask(AW, AH, ex - 1.8, ey - 1.0, ex - .4, ey + 1.4), PUP); cv.put(ex - 1.2, ey - 2, hexc('#ffffff'))
            cv.flat(rect_mask(AW, AH, ex + 3.2, ey - 2.2, ex + 6, ey + 1.4), EYE) if False else None
        elif expr == 'fire':
            cv.flat(rect_mask(AW, AH, ex - 2, ey - .6, ex + 2, ey + 1), PUP)
            cv.flat(rect_mask(AW, AH, hx - 12, hy + 3, hx - 8, hy + 7), hexc('#3a0a14'))
        elif expr == 'hurt':
            for (a, b) in ((0, 0), (1, 1), (0, 2)): cv.put(ex - 1 + a, ey - 1 + b, PUP)
        else:
            for (a, b) in ((0, 0), (1, 1), (2, 2), (2, 0), (0, 2)): cv.put(ex - 1 + a, ey - 1 + b, PUP)
        cv.put(hx - 11, hy + 2, PUP)                              # nostril
        for dx in range(3): cv.put(hx - 10 + dx, hy + 6, PUP)
    cv.outline((40, 8, 28))
    return cv

if __name__ == '__main__':
    tiles = []
    for view in ('down', 'up', 'left'):
        for an, n in (('idle', 1), ('walk', 4), ('fire', 1), ('hurt', 1), ('ko', 1)):
            for f in range(n): tiles.append(draw(view, an, f).img())
    sh = sheet(tiles, 8, AW, AH); preview(sh, sys.argv[1] if len(sys.argv) > 1 else '/tmp/ashling_prev.png', scale=5)
