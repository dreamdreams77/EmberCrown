"""Ashling, the runt dragon: a small four-legged wyrmling about half Shiloh's height. Charcoal hide split by ember
cracks that glow, wings she has not grown into (folded, they rise above her head), horn buds, amber eyes, a throat
that lights up when she breathes fire, and a plain spade-tipped tail. Same frame size, views and animations as
before (44x44, foot at 38; idle 1, walk 4, fire 1, hurt 1, ko 1), so js/ember.js and the sheet layout are unchanged."""
import sys
from pix import *

AW, AH, AFOOT, ACX = 44, 44, 38, 22
HIDE = ramp('#544a5e', '#1c1622', '#8a7e96')          # charcoal, a little violet in the shadow
BELLY = ramp('#5a4a4e', '#221a20', '#8a7470')          # warmer underside plates
WING = ramp('#6a3a3c', '#24121a', '#a8604e')           # dusky membrane
BONE = ramp('#d8c8a8', '#6a5a50', '#fff4dc')           # horn buds, claws, spade
EMB = hexc('#ff8a2a'); HOT = hexc('#ffd27a'); DIM = hexc('#a8441e')
EYE = hexc('#ffb83a'); PUP = hexc('#1a0a10'); GLINT = hexc('#fff6d8')

def cracks(cv, pts, hot=False):
    """Ember cracks: short glowing seams in the hide (a hot pixel at each seam's heart)."""
    for i, (x, y) in enumerate(pts): cv.put(x, y, HOT if (hot and i % 2 == 0) or i == len(pts) // 2 else EMB)

def eyes_down(cv, cx, hy, expr):
    P = cv.put
    for sx in (-1, 1):
        x = int(cx + sx * 3.2 - (1 if sx > 0 else 0)); y = int(hy - 1)
        if expr == 'fire':
            for dx in range(3): P(x - 1 + dx + (1 if sx > 0 else 0), y + 1, PUP)          # squeezed shut with effort
        elif expr == 'hurt':
            for (a, b) in (((0, 0), (1, 1), (0, 2)) if sx < 0 else ((2, 0), (1, 1), (2, 2))): P(x - 1 + a + (1 if sx > 0 else 0), y + b, PUP)
        elif expr == 'ko':
            for (a, b) in ((0, 0), (2, 0), (1, 1), (0, 2), (2, 2)): P(x - 1 + a + (1 if sx > 0 else 0), y + b, PUP)
        else:
            cv.flat(rect_mask(AW, AH, x - .5, y - .5, x + 2.5, y + 2.5), EYE)              # amber, 3x3
            P(x + 1, y, PUP); P(x + 1, y + 1, PUP); P(x + 1, y + 2, PUP)                     # slit pupil
            P(x, y, GLINT)

def throat(cv, x, y, fire):
    cv.flat(ell_mask(AW, AH, x, y, 2.2 if fire else 1.4, 1.2 if fire else .8), HOT if fire else DIM)
    if fire: cv.put(x, y, hexc('#fff6d8'))

def tail(cv, pts, bob, spade_at, flip=1):
    for (a, b) in zip(pts, pts[1:]): cv.shade(capsule_mask(AW, AH, a[0], a[1] + bob, b[0], b[1] + bob, 1.8, 1.2), HIDE, rad=1.4, rim='all')
    x, y = spade_at
    cv.shade(poly_mask(AW, AH, [(x, y - 2.6 + bob), (x + 2.6 * flip, y + bob), (x, y + 2.6 + bob), (x - 1 * flip, y + bob)]), BONE, rad=1.2, rim='all')

def draw(view='down', anim='idle', f=0):
    cv = Cv(AW, AH)
    expr = {'idle': 'calm', 'walk': 'calm', 'fire': 'fire', 'hurt': 'hurt', 'ko': 'ko'}[anim]
    bob = 1 if (anim == 'walk' and f % 2 == 1) else 0
    step = (f % 4) if anim == 'walk' else -1
    lift = lambda k: 1.6 if step >= 0 and (step + k) % 4 < 2 else 0          # diagonal pairs of legs lift together
    cx = ACX; fire = anim == 'fire'; hurt = 1 if anim == 'hurt' else 0
    if view in ('down', 'up'):
        sx_t = 1 if view == 'down' else -1
        if view == 'down':   # tail behind the body, curling out to one side
            tail(cv, [(cx + 5, 31), (cx + 10, 33), (cx + 14, 31), (cx + 16, 27)], bob, (cx + 16, 25))
        # wings, folded: too big for her, tips above the head
        for sx in (-1, 1):
            cv.shade(poly_mask(AW, AH, [(cx + sx * 4, 27 + bob), (cx + sx * 8, 11 + bob), (cx + sx * 14, 17 + bob), (cx + sx * 12, 21 + bob), (cx + sx * 13, 25 + bob), (cx + sx * 9, 26 + bob), (cx + sx * 8, 30 + bob)]), WING, rad=1.8, rim='all')
            for k in range(6): cv.put(cx + sx * (8 + k), 11 + k + bob, BONE[1])                # lit leading edge (the wing arm)
            for k in range(3): cv.put(cx + sx * (8 + k * .5), 15 + k * 4 + bob, WING[0])       # finger bones
            cv.put(cx + sx * 9, 12 + bob, BONE[3])                                             # wing claw
        # haunches and body
        for sx in (-1, 1): cv.shade(ell_mask(AW, AH, cx + sx * 6.5, 32 + bob, 3.6, 3.2), HIDE, rad=2, rim='all')
        cv.shade(ell_mask(AW, AH, cx, 30 + bob, 8.0, 6.0), HIDE, rad=4, rim='all', bias=.08)
        if view == 'down':
            cv.shade(ell_mask(AW, AH, cx, 32 + bob, 4.4, 3.6), BELLY, rad=2, bias=.05)
            for k in range(3): cv.put(cx - 3 + k * 3, 32 + bob + (k % 2), BELLY[0])            # belly plates
        else:
            for k in range(4): cv.put(cx, 25 + k * 2.4 + bob, BONE[1]); cv.put(cx, 25.6 + k * 2.4 + bob, BONE[2])   # spine ridge
            cracks(cv, [(cx - 4, 28 + bob), (cx - 3, 29 + bob), (cx - 3, 30 + bob)], fire); cracks(cv, [(cx + 3, 27 + bob), (cx + 4, 28 + bob), (cx + 4, 29 + bob)], fire)
            tail(cv, [(cx - 1, 34), (cx - 4, 37), (cx - 8, 37), (cx - 11, 35)], bob, (cx - 12, 33), flip=-1)
        # front legs and claws
        for sx in (-1, 1):
            ly = AFOOT - 2 - lift(0 if sx < 0 else 2)
            cv.shade(capsule_mask(AW, AH, cx + sx * 4, 32 + bob, cx + sx * 4.4, ly, 2.0, 1.8), HIDE, rad=1.6, rim='all')
            for dx in (-1, 0, 1): cv.put(cx + sx * 4.4 + dx, ly + 1.6, BONE[2])
        # head
        hy = 23 + bob + hurt
        for sx in (-1, 1): cv.shade(poly_mask(AW, AH, [(cx + sx * 2.4, hy - 4), (cx + sx * 4.2, hy - 8), (cx + sx * 5, hy - 3.6)]), BONE, rad=1, rim='all')   # horn buds
        cv.shade(ell_mask(AW, AH, cx, hy, 6.2, 5.0), HIDE, rad=3, rim='all', bias=.1)
        if view == 'down':
            cv.shade(ell_mask(AW, AH, cx, hy + 3.2, 3.6, 2.4), HIDE, rad=1.6, bias=.2)          # short snout
            cv.put(cx - 1, hy + 3, PUP); cv.put(cx + 1, hy + 3, PUP)                            # nostrils
            if fire: cv.flat(rect_mask(AW, AH, cx - 2.5, hy + 4.5, cx + 2.5, hy + 6.5), hexc('#3a0a14')); cv.flat(rect_mask(AW, AH, cx - 1.5, hy + 5, cx + 1.5, hy + 6.5), HOT)
            eyes_down(cv, cx, hy, expr)
            cracks(cv, [(cx - 5, hy + 1), (cx - 5, hy + 2)], fire); cracks(cv, [(cx + 4, hy - 2), (cx + 5, hy - 1)], fire)
            cracks(cv, [(cx - 6, 29 + bob), (cx - 5, 30 + bob), (cx - 5, 31 + bob)], fire); cracks(cv, [(cx + 6, 28 + bob), (cx + 6, 29 + bob), (cx + 7, 30 + bob)], fire)
            throat(cv, cx, hy + 7.2 + (0 if fire else -.4), fire)
        else:
            cracks(cv, [(cx - 1, hy - 2), (cx, hy - 1), (cx + 1, hy - 2)], fire)
    else:
        # facing left (right is the mirror)
        tail(cv, [(cx + 8, 31), (cx + 13, 32), (cx + 17, 30), (cx + 19, 26)], bob, (cx + 19, 24))
        # far legs (darker), then body, then near legs
        for k, x in ((1, cx - 4), (3, cx + 6)):
            ly = AFOOT - 2 - lift(k)
            cv.shade(capsule_mask(AW, AH, x + 1, 31 + bob, x + 1.4, ly, 1.7, 1.5), ramp('#2a2430', '#0e0a12', '#4a4250'), rad=1.4, rim='all')
        cv.shade(ell_mask(AW, AH, cx + 1, 30 + bob, 9.5, 5.6), HIDE, rad=4, rim='all', bias=.08)
        cv.shade(ell_mask(AW, AH, cx, 32.6 + bob, 6.4, 2.6), BELLY, rad=1.6, bias=.05)
        for k, x in ((0, cx - 5), (2, cx + 5)):
            ly = AFOOT - 2 - lift(k)
            cv.shade(capsule_mask(AW, AH, x, 31 + bob, x - .4, ly, 2.0, 1.7), HIDE, rad=1.6, rim='all')
            for dx in (-2, -1, 0): cv.put(x - .4 + dx, ly + 1.6, BONE[2])
        # folded wing on the back, tip above the head
        cv.shade(poly_mask(AW, AH, [(cx - 2, 28 + bob), (cx + 2, 11 + bob), (cx + 8, 15 + bob), (cx + 9, 20 + bob), (cx + 12, 25 + bob), (cx + 7, 29 + bob)]), WING, rad=1.8, rim='all')
        for k in range(6): cv.put(cx + 2 + k, 11 + k * .8 + bob, BONE[1])
        for k in range(3): cv.put(cx + 2 + k * 3, 16 + k * 4 + bob, WING[0])
        cv.put(cx + 2, 12 + bob, BONE[3])
        cracks(cv, [(cx - 4, 27 + bob), (cx - 3, 28 + bob), (cx - 3, 29 + bob)], fire); cracks(cv, [(cx + 4, 31 + bob), (cx + 5, 31 + bob)], fire)
        # neck and head
        hx, hy = cx - 8, 24 + bob + hurt
        cv.shade(capsule_mask(AW, AH, cx - 4, 28 + bob, hx + 1, hy + 1, 3.2, 2.6), HIDE, rad=2, rim='all')
        cv.shade(poly_mask(AW, AH, [(hx + 1, hy - 4), (hx + 4, hy - 8), (hx + 4.6, hy - 3.4)]), BONE, rad=1, rim='all')
        cv.shade(ell_mask(AW, AH, hx, hy, 5.2, 4.4), HIDE, rad=2.6, rim='all', bias=.1)
        cv.shade(ell_mask(AW, AH, hx - 4.6, hy + 1.6, 3.2, 2.2), HIDE, rad=1.4, bias=.2)       # snout
        cv.put(hx - 7, hy + 1, PUP)                                                               # nostril
        ex, ey = hx - 2, hy - 1
        if expr == 'calm':
            cv.flat(rect_mask(AW, AH, ex - 1.5, ey - .5, ex + 1.5, ey + 2.5), EYE); cv.put(ex - 1, ey, PUP); cv.put(ex - 1, ey + 1, PUP); cv.put(ex - 1, ey + 2, PUP); cv.put(ex, ey, GLINT)
        elif expr == 'fire':
            for dx in range(3): cv.put(ex - 1 + dx, ey + 1, PUP)
            cv.flat(rect_mask(AW, AH, hx - 8.5, hy + 2.5, hx - 4, hy + 4.5), hexc('#3a0a14')); cv.flat(rect_mask(AW, AH, hx - 8.5, hy + 3, hx - 5.5, hy + 4.5), HOT)
        elif expr == 'hurt':
            for (a, b) in ((0, 0), (1, 1), (0, 2)): cv.put(ex - 1 + a, ey + b, PUP)
        else:
            for (a, b) in ((0, 0), (2, 0), (1, 1), (0, 2), (2, 2)): cv.put(ex - 1 + a, ey + b, PUP)
        throat(cv, hx + 1, hy + 4.4, fire)
        cracks(cv, [(hx + 2, hy - 2), (hx + 3, hy - 1)], fire)
    cv.outline((26, 12, 22))
    return cv

if __name__ == '__main__':
    tiles = []
    for view in ('down', 'up', 'left'):
        for an, n in (('idle', 1), ('walk', 4), ('fire', 1), ('hurt', 1), ('ko', 1)):
            for f in range(n): tiles.append(draw(view, an, f).img())
    sh = sheet(tiles, 8, AW, AH); preview(sh, sys.argv[1] if len(sys.argv) > 1 else '/tmp/ashling_prev.png', scale=5)
