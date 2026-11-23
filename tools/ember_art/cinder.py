"""The Cinderling: a spiteful little coal-sprite that lives in House Marrow's walls. All face, no manners."""
import math, sys
from pix import *

CW, CH, CFOOT, CCX = 32, 34, 30, 16
BODY = ramp('#e2582a', '#3c0e2c', '#ffd070')
BELLY = ramp('#ffa040', '#8a2a2c', '#fff4b0')
COAL = ramp('#3a2830', '#120a16', '#8a7088')
FLAME = ramp('#ffb830', '#c02818', '#fffbd0')
EYE_W, EYE_D = hexc('#fff6dc'), hexc('#2a0c18')

def draw(view='down', anim='walk', f=0, glow=True):
    cv = Cv(CW, CH)
    t = f
    sq = 1.0; sy = 1.0; dy = 0; lean = 0
    if anim == 'walk': dy = -1 if f % 2 == 0 else 0; lean = (-1, 0, 1, 0)[f % 4]
    if anim == 'wind': sq = 1.18; sy = .78; dy = 2
    if anim == 'lunge': sq = .86; sy = 1.2; dy = -4
    if anim == 'hurt': sq = 1.1; sy = .9; dy = 1
    if anim == 'dead': sq = 1.3 - f * .12; sy = .6 - f * .12; dy = 6 + f
    cx = CCX; cy = CFOOT - 9 * sy + dy
    # legs
    if anim not in ('dead',):
        for sx in (-1, 1):
            ph = (f + (0 if sx < 0 else 2)) % 4
            lift = 2.0 if (anim == 'walk' and ph in (0, 1)) else 0
            x = cx + sx * 4.5 * sq
            if view == 'left': x = cx + sx * 3 + (-1 if sx < 0 else 1)
            cv.shade(capsule_mask(CW, CH, x, CFOOT - 5 + dy * .3, x + sx * .5, CFOOT - lift + .5, 1.9, 1.6), COAL, rad=1.6, rim='all')
    # tuft (behind)
    fl = 1 if (f % 2 == 0) else 0
    tx = cx + (0 if view == 'down' else (-2 if view == 'left' else 0))
    top = cy - 9 * sy
    tf = poly_mask(CW, CH, [(tx - 4, top + 3), (tx - 3.2, top - 4 - fl), (tx - 1, top - 1), (tx, top - 7 - fl * 2), (tx + 1.6, top - 1), (tx + 3.6, top - 5 + fl), (tx + 4.4, top + 3)])
    cv.shade(tf, FLAME, rad=2.2, rim='all')
    # body
    bm = ell_mask(CW, CH, cx + lean * .5, cy, 10.2 * sq, 9.0 * sy)
    cv.shade(bm, BODY, rad=4.5, rim='all', bias=.12)
    # belly glow
    if view != 'up':
        bl = ell_mask(CW, CH, cx + lean * .5 + (-1.5 if view == 'left' else 0), cy + 3.4 * sy, 6.0 * sq, 4.2 * sy)
        cv.shade(bl, BELLY, rad=2.5, bias=.1)
    # coal cracks
    for (dx, dy2) in ((-7, -3), (-6, -2), (-5, -1), (6, -4), (5, -3), (7, 2), (6, 3), (-3, 6), (4, 6), (-8, 3)):
        cv.put(cx + dx * sq + lean * .5, cy + dy2 * sy, COAL[1]) if True else None
    # arms
    for sx in (-1, 1):
        ax = cx + sx * 9.6 * sq; ay = cy + 1
        up = -2 if anim in ('wind', 'lunge') else 1
        if view == 'left' and sx > 0: continue
        cv.shade(capsule_mask(CW, CH, ax - sx * 1.5, ay, ax + sx * 2.6, ay + 3.5 * up * .5 + 2, 1.6, 1.3), COAL, rad=1.5, rim='all')
    # ears / horn nubs
    for sx in (-1, 1):
        cv.shade(poly_mask(CW, CH, [(cx + sx * 7 * sq, cy - 6 * sy), (cx + sx * 11 * sq, cy - 11 * sy), (cx + sx * 9.8 * sq, cy - 4.4 * sy)]), COAL, rad=1.6, rim='all')
    # face
    if view != 'up':
        ey = cy - 2.2 * sy; ex = 3.6 * sq
        eo = -2.2 if view == 'left' else 0
        def eye(x, y, w=3, h=4):
            cv.flat(rect_mask(CW, CH, x - w / 2, y - h / 2, x + w / 2, y + h / 2), EYE_W)
        if anim == 'dead':
            for sx in (-1, 1):
                x = cx + sx * ex + eo
                for (a, b) in ((-1, -1), (0, 0), (1, 1), (1, -1), (-1, 1)): cv.put(x + a, ey + b + 1, EYE_D)
            cv.put(cx, ey + 6, EYE_D); cv.put(cx + 1, ey + 6, EYE_D)
        else:
            squint = anim in ('wind', 'lunge')
            for k, sx in enumerate((-1, 1)):
                if view == 'left' and k == 1: x = cx + 1.0 + eo; hh = 3
                else: x = cx + sx * ex + eo; hh = 4
                if squint: hh = 3
                eye(x, ey, 3, hh)
                px = x + (-.6 if view == 'left' else 0)
                cv.flat(rect_mask(CW, CH, px - .2 + (0 if view != 'left' else -.5), ey - hh / 2 + 1, px + 1.5 + (0 if view != 'left' else -.5), ey - hh / 2 + hh), EYE_D)
                # angry brow
                bx0 = x - 2.2; 
                for i in range(4):
                    by = ey - hh / 2 - 1.2 + (i * .6 if sx < 0 else (3 - i) * .6) * (1.0 if (squint or anim == 'walk') else .35)
                    cv.put(bx0 + i, by, COAL[0])
            # grin
            my = cy + 3.2 * sy
            mx = cx + eo
            if anim in ('wind', 'lunge'):
                cv.flat(rect_mask(CW, CH, mx - 4, my - 1, mx + 4, my + 3), EYE_D)
                for i in range(-3, 3, 2): cv.put(mx + i, my - 1, EYE_W); cv.put(mx + i + 1, my + 2, EYE_W)
            elif anim == 'hurt':
                for i in range(-3, 3): cv.put(mx + i, my + (i % 2), EYE_D)
            else:
                for i in range(-3, 4): cv.put(mx + i, my + (0 if abs(i) < 3 else -1), EYE_D)
                for i in (-2, 0, 2): cv.put(mx + i, my + 1, EYE_W)
    cv.outline((40, 8, 26))
    # hot rim: warm light on the upper-left edge of the outline
    return cv

if __name__ == '__main__':
    tiles = []
    for view in ('down', 'up', 'left'):
        for an, n in (('walk', 4), ('wind', 1), ('lunge', 1), ('hurt', 1), ('dead', 3)):
            for f in range(n): tiles.append(draw(view, an, f).img())
    sh = sheet(tiles, 10, CW, CH); preview(sh, sys.argv[1] if len(sys.argv) > 1 else '/tmp/cinder_prev.png', scale=5)
