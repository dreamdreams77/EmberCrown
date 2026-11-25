"""Ember art: the rest of the bestiary, painted with the same toolkit and light as the Cinderling.
Ashwisp (a sulking ember of smoke), Hollow Husk (an empty suit of furnace iron), Pyre Mite (a beetle with a coal for a belly),
Hollow Chanter (a floating hood that rings a small bell) and the Ashen Cantor (the choir's master, bell held high).
Each draw(view, anim, f) returns a Cv; views are down / up / left (right is the left view mirrored at run time)."""
import math, sys
from pix import *

INK = (30, 14, 30)
WHITE, DARK = hexc('#fff6dc'), hexc('#20101c')

# ------------------------------------------------------------------ Ashwisp
WW, WH, WFOOT = 28, 34, 32
SMOKE = ramp('#7a7090', '#241c3a', '#d8d0e8')
CORE = ramp('#ff9a3a', '#a02a18', '#fff4c0')

def wisp(view='down', anim='hover', f=0):
    cv = Cv(WW, WH); cx = 14
    bob = (0, -1, -2, -1)[f % 4] if anim == 'hover' else 0
    s = 1.0; cy = 17 + bob
    if anim == 'charge': s = 1.12
    if anim == 'hurt': s = .9; cy += 1
    if anim == 'dead': s = 1.0 - f * .25; cy += f * 2
    if s <= .2: return cv
    fl = (0, 1, 0, -1)[f % 4]
    tip = poly_mask(WW, WH, [(cx - 7 * s, cy), (cx - 2 * s + fl, cy - 13 * s), (cx + 1 * s, cy - 8 * s), (cx + 4 * s - fl, cy - 15 * s), (cx + 7 * s, cy)])
    body = ell_mask(WW, WH, cx, cy + 2 * s, 8.5 * s, 8 * s) | tip
    cv.shade(body, SMOKE, rad=3.5, rim='all', bias=.05)
    core = ell_mask(WW, WH, cx, cy + 3 * s, 4.6 * s * (1.25 if anim == 'charge' else 1), 4.2 * s)
    cv.shade(core, CORE, rad=2.2, bias=.2 if anim == 'charge' else .1)
    if view != 'up' and anim != 'dead':
        eo = -2 if view == 'left' else 0; ey = cy - 1
        for k, sx in enumerate((-1, 1)):
            if view == 'left' and k == 1: continue
            x = cx + sx * 3 + eo
            h = 1 if anim in ('charge', 'hurt') else 2
            cv.flat(rect_mask(WW, WH, x - 1, ey, x + 1, ey + h), WHITE)
        if anim == 'charge':
            cv.flat(rect_mask(WW, WH, cx - 2 + eo, cy + 4, cx + 2 + eo, cy + 6), DARK)
    cv.outline(INK)
    return cv

# ------------------------------------------------------------------ Hollow Husk
HW, HH, HFOOT = 46, 50, 48
SHELL = ramp('#6a5a5e', '#1c1220', '#c8b0a8')
RUST = ramp('#8a4a30', '#2a0e10', '#e09060')
EMBERS = ramp('#ff8a30', '#a02010', '#fff2b0')

def husk(view='down', anim='walk', f=0):
    cv = Cv(HW, HH); cx = 23
    if anim == 'dead':
        # the shell comes apart: plates on the floor, the ember going out
        for i, (dx, dy, rx, ry) in enumerate(((-9, 0, 8, 4), (6, 1, 9, 4), (-1, -4, 7, 5))):
            if i <= 2 - f // 2 or f == 0:
                cv.shade(ell_mask(HW, HH, cx + dx * (1 + f * .2), HFOOT - 5 + dy, rx, ry), SHELL, rad=2, rim='all')
        if f < 2: cv.shade(ell_mask(HW, HH, cx, HFOOT - 8, 3 - f, 2), EMBERS, rad=1.4)
        cv.outline(INK); return cv
    hunch = 4 if anim == 'recover' else 0
    lift = 0
    # legs
    for sx in (-1, 1):
        ph = (f + (0 if sx < 0 else 2)) % 4
        up = 2 if anim == 'walk' and ph in (0, 1) else 0
        x = cx + sx * 6 + (sx * -2 if view == 'left' else 0)
        cv.shade(capsule_mask(HW, HH, x, HFOOT - 12, x, HFOOT - 2 - up, 4, 4.2), SHELL, rad=2.2, rim='all')
    # torso: a barrel of plates
    ty = HFOOT - 24 + hunch
    torso = ell_mask(HW, HH, cx, ty, 13, 11)
    cv.shade(torso, SHELL, rad=4.5, rim='all', bias=.05)
    for yy in (ty - 4, ty + 2):  # plate seams
        for x in range(cx - 11, cx + 12):
            if torso[int(yy), x]: cv.put(x, yy, SHELL[0])
    for (dx, dy) in ((-6, -2), (5, 3), (-2, 5), (8, -5)):  # rust blooms
        cv.shade(ell_mask(HW, HH, cx + dx, ty + dy, 2.2, 1.6), RUST, rad=1.2)
    # arms
    arm_up = anim == 'wind'
    for sx in (-1, 1):
        if view == 'left' and sx > 0: continue
        sxp = cx + sx * 13
        if arm_up: hx, hy = cx + sx * 7, ty - 20
        elif anim == 'recover': hx, hy = cx + sx * 15, HFOOT - 3
        else: hx, hy = sxp + sx * 2, ty + 12 + (1 if (f % 2) else 0) * sx
        cv.shade(capsule_mask(HW, HH, sxp, ty - 5, hx, hy, 4.2, 5.2), SHELL, rad=2.4, rim='all')
        cv.shade(ell_mask(HW, HH, hx, hy, 5, 4.6), RUST, rad=2.2, rim='all')  # the heavy fist
    # head: a small helm sunk into the shoulders, one ember slit
    hy = ty - 12 + (2 if anim == 'recover' else 0)
    hxo = -3 if view == 'left' else 0
    cv.shade(ell_mask(HW, HH, cx + hxo, hy, 6.5, 5.5), SHELL, rad=2.5, rim='all', bias=.1)
    if view != 'up':
        glow = EMBERS[4] if anim == 'wind' else EMBERS[3]
        cv.flat(rect_mask(HW, HH, cx - 4 + hxo * 1.4, hy - 1, cx + 4 + hxo * .6, hy + 1), glow)
    # the furnace behind the ribs
    if view != 'up':
        cv.shade(ell_mask(HW, HH, cx + hxo * .5, ty + 1, 3.5, 3), EMBERS, rad=1.8, bias=.15 if anim == 'wind' else 0)
    cv.outline(INK)
    return cv

# ------------------------------------------------------------------ Pyre Mite
MW, MH, MFOOT = 24, 20, 18
CARA = ramp('#4a3442', '#120814', '#a08098')
BELLYM = ramp('#ff7a2a', '#8a1a10', '#fff0a0')

def mite(view='down', anim='walk', f=0):
    cv = Cv(MW, MH); cx = 12; cy = 11
    if anim == 'dead':
        for i in range(6 - f * 2):
            a = i * 1.05 + f; r = 3 + f * 2.5
            cv.shade(ell_mask(MW, MH, cx + math.cos(a) * r, cy + math.sin(a) * r * .6, 1.6, 1.2), CARA if i % 2 else BELLYM, rad=1)
        cv.outline(INK); return cv
    swell = 1.0 + (.25 if anim == 'fuse' else 0) + (.08 if anim == 'fuse' and f % 2 else 0)
    # legs
    for i, sx in ((0, -1), (1, -1), (2, -1), (0, 1), (1, 1), (2, 1)):
        if view == 'left' and sx > 0: continue
        ph = (f + i + (0 if sx < 0 else 1)) % 2 if anim == 'walk' else 0
        lx = cx - 4 + i * 4; ly = cy + 2
        cv.put(lx + sx * (4 + ph), ly + 3, CARA[0]); cv.put(lx + sx * (3 + ph), ly + 2, CARA[1])
    abdomen = ell_mask(MW, MH, cx + (2 if view == 'left' else 0), cy + 1, 6 * swell, 4.6 * swell)
    cv.shade(abdomen, BELLYM, rad=2.6, bias=.25 if anim == 'fuse' and f % 2 else .05)
    shell = ell_mask(MW, MH, cx - (2 if view == 'left' else 0), cy - 1, 6.5, 4.4) & ~ell_mask(MW, MH, cx, cy + 4, 4, 2.5)
    cv.shade(shell, CARA, rad=2.4, rim='all')
    if view != 'up':
        x = cx - (5 if view == 'left' else 0)
        cv.put(x - 2, cy - 2, WHITE); cv.put(x + 2, cy - 2, WHITE) if view != 'left' else None
    cv.outline(INK)
    return cv

# ------------------------------------------------------------------ Hollow Chanter (warder)
CWD, CHT, CFT = 32, 42, 40
ROBE = ramp('#3a3a5a', '#0e0c1e', '#9a9ac8')
HOOD = ramp('#2c2a44', '#08060e', '#7a78a8')
BELL = ramp('#c89a40', '#4a2a10', '#fff0a0')
GHOST = hexc('#b8e0ff')

def chanter(view='down', anim='walk', f=0, big=False, robe=ROBE, hood=HOOD, W=CWD, H=CHT, FOOT=CFT):
    cv = Cv(W, H); cx = W // 2
    k = H / CHT
    bob = (0, -1, -2, -1)[f % 4] if anim == 'walk' else 0
    if anim == 'dead':
        # the robe settles on the floor, empty
        cv.shade(ell_mask(W, H, cx, FOOT - 4 + f, 11 * k, (6 - f) * k), robe, rad=2.5, rim='all')
        if f == 0: cv.shade(ell_mask(W, H, cx, FOOT - 11 * k, 5 * k, 5 * k), hood, rad=2, rim='all')
        cv.outline(INK); return cv
    top = FOOT - 34 * k + bob + (3 * k if anim == 'recover' else 0)
    sway = (0, 1, 0, -1)[f % 4] if anim == 'walk' else 0
    hem = FOOT - 4 * k + bob
    robe_m = poly_mask(W, H, [(cx - 5 * k, top + 9 * k), (cx + 5 * k, top + 9 * k), (cx + 12 * k + sway, hem), (cx + 6 * k, hem - 2 * k), (cx + 1 * k, hem + 1), (cx - 5 * k, hem - 2 * k), (cx - 12 * k + sway, hem)])
    cv.shade(robe_m, robe, rad=3.5 * k, rim='all', bias=.05)
    # hood
    hx = cx - (2 * k if view == 'left' else 0)
    hood_m = ell_mask(W, H, hx, top + 6 * k, 7 * k, 7.5 * k) | poly_mask(W, H, [(hx - 2 * k, top - 2 * k), (hx + 2 * k, top + 1 * k), (hx - 6 * k, top + 3 * k)])
    cv.shade(hood_m, hood, rad=3 * k, rim='all')
    if view != 'up':
        cv.flat(ell_mask(W, H, hx + (-1 if view == 'left' else 0), top + 7.5 * k, 4.6 * k, 4.4 * k), DARK)
        bright = anim in ('cast', 'sing')
        for k2, sx in enumerate((-1, 1)):
            if view == 'left' and k2 == 1: continue
            x = hx + sx * 2 * k + (-2 if view == 'left' else 0)
            cv.flat(rect_mask(W, H, x - .5, top + 6.5 * k, x + 1.5 if not bright else x + 1.5, top + 8 * k + (1 if bright else 0)), GHOST if not bright else WHITE)
    # hands and the bell
    up = anim in ('cast', 'sing')
    for sx in (-1, 1):
        if view == 'left' and sx > 0: continue
        ax, ay = cx + sx * 8 * k, top + 15 * k
        bx, by = (cx + sx * 6 * k, top + 2 * k) if up else (cx + sx * 9 * k, top + 20 * k)
        cv.shade(capsule_mask(W, H, ax, ay, bx, by, 2.2 * k, 2.6 * k), robe, rad=1.6 * k, rim='all')
    bx, by = (cx + 7 * k, top + (0 if up else 22 * k)) if view != 'left' else (cx - 8 * k, top + (0 if up else 22 * k))
    bell = poly_mask(W, H, [(bx - 2.6 * k, by + 3 * k), (bx - 2 * k, by - 1 * k), (bx, by - 2.6 * k), (bx + 2 * k, by - 1 * k), (bx + 2.6 * k, by + 3 * k)])
    cv.shade(bell, BELL, rad=1.8 * k, rim='all', bias=.1)
    cv.outline(INK)
    return cv

# ------------------------------------------------------------------ the Ashen Cantor (mini-boss): the choir's master
KW, KH, KFOOT = 50, 62, 60
ASHROBE = ramp('#b8aca0', '#3a2a30', '#fff6e8')
ASHHOOD = ramp('#8a7c70', '#241820', '#e8dccc')

def cantor(view='down', anim='walk', f=0):
    a = {'sing': 'sing', 'recover': 'recover'}.get(anim, anim)
    return chanter(view, a, f, robe=ASHROBE, hood=ASHHOOD, W=KW, H=KH, FOOT=KFOOT)

if __name__ == '__main__':
    tiles = []
    for fn, n, w, h in ((wisp, 'hover', WW, WH), (husk, 'walk', HW, HH), (mite, 'walk', MW, MH), (chanter, 'walk', CWD, CHT), (cantor, 'walk', KW, KH)):
        row = [fn(v, n, 0).img() for v in ('down', 'up', 'left')]
        for im in row: tiles.append(im.resize((64, 64)))
    sh = sheet(tiles, 6, 64, 64); preview(sh, sys.argv[1] if len(sys.argv) > 1 else '/tmp/foes2_prev.png', scale=3)

# ------------------------------------------------------------------ the Bell-Warden (boss)
BWW, BWH, BWFOOT = 64, 72, 70
VIOL = ramp('#5a3a7a', '#160a24', '#c8a0f0')
GOLD = ramp('#d8a840', '#4a2a10', '#fff2a8')
SKINW = ramp('#d8a080', '#7a3a48', '#ffe8c8')

def warden(view='down', anim='walk', f=0):
    cv = Cv(BWW, BWH); cx = 32; F = BWFOOT
    if anim == 'dead':
        cv.shade(ell_mask(BWW, BWH, cx - 4, F - 8, 20, 7 - f), VIOL, rad=3, rim='all')
        cv.shade(ell_mask(BWW, BWH, cx + 14, F - 10 + f, 9, 8), GOLD, rad=3, rim='all')
        cv.outline(INK); return cv
    crouch = {'wind': 5, 'toll': 2, 'stagger': 6}.get(anim, 0)
    for sx in (-1, 1):
        ph = (f + (0 if sx < 0 else 2)) % 4
        up = 3 if anim in ('walk', 'charge') and ph in (0, 1) else 0
        x = cx + sx * 8
        cv.shade(capsule_mask(BWW, BWH, x, F - 18 + crouch, x + sx * (2 if crouch else 0), F - 3 - up, 5, 5.5), VIOL, rad=2.4, rim='all')
    ty = F - 34 + crouch
    # a tabard over plate: violet cloth body, steel plates on the chest, a gold belt and pauldrons
    cv.shade(ell_mask(BWW, BWH, cx, ty, 17, 15), VIOL, rad=5.5, rim='all', bias=.05)
    plate = ramp('#7a7e98', '#1c1c34', '#e8ecff')
    if view != 'up':
        cv.shade(poly_mask(BWW, BWH, [(cx - 9, ty - 11), (cx + 9, ty - 11), (cx + 7, ty + 6), (cx, ty + 9), (cx - 7, ty + 6)]), plate, rad=3, rim='all', bias=.08)
        for y in (ty - 5, ty + 1):
            for x in range(cx - 8, cx + 9):
                if abs(x - cx) < 9 - (y - ty + 11) * .1: cv.put(x, y, plate[0])
        # the house bell blazoned on the plate
        cv.shade(poly_mask(BWW, BWH, [(cx - 3, ty - 2), (cx - 2, ty - 7), (cx, ty - 8), (cx + 2, ty - 7), (cx + 3, ty - 2)]), GOLD, rad=1.2)
    cv.shade(rect_mask(BWW, BWH, cx - 16, ty + 7, cx + 17, ty + 11), GOLD, rad=1.5, rim='all')        # belt
    cv.flat(rect_mask(BWW, BWH, cx - 2, ty + 7, cx + 3, ty + 11), hexc('#5a2a10'))                     # buckle
    for sx in (-1, 1):                                                                               # pauldrons
        if view == 'left' and sx > 0: continue
        cv.shade(ell_mask(BWW, BWH, cx + sx * 15, ty - 10, 7, 5.5), plate, rad=2.4, rim='all', bias=.1)
    # the bell on his back (seen over the shoulder), the hammer in his fist
    if view == 'up':
        cv.shade(ell_mask(BWW, BWH, cx, ty - 2, 12, 11), GOLD, rad=4, rim='all', bias=.1)
    armup = anim in ('wind', 'toll')
    for sx in (-1, 1):
        if view == 'left' and sx > 0: continue
        ax = cx + sx * 16
        hx, hy = (cx + sx * 10, ty - 26) if armup else (ax + sx * 3, ty + 14)
        cv.shade(capsule_mask(BWW, BWH, ax, ty - 7, hx, hy, 5, 5.5), VIOL, rad=2.4, rim='all')
        cv.shade(ell_mask(BWW, BWH, hx, hy, 4.6, 4.2), SKINW, rad=2, rim='all')
        if sx > 0 or view == 'left':  # war hammer
            hx2, hy2 = (hx, hy - 10) if armup else (hx + 9 * (1 if view != 'left' else -1), hy - 2)
            cv.shade(capsule_mask(BWW, BWH, hx, hy, hx2, hy2, 1.6), GOLD, rad=1, rim='all')
            cv.shade(rect_mask(BWW, BWH, hx2 - 5, hy2 - 4, hx2 + 5, hy2 + 4), ramp('#8a8ea8', '#22223a', '#f0f0ff'), rad=2, rim='all')
    # great helm, gold, with a cross slit
    hy = ty - 20 + (2 if anim == 'stagger' else 0)
    hxo = -3 if view == 'left' else 0
    cv.shade(rect_mask(BWW, BWH, cx - 9 + hxo, hy - 10, cx + 9 + hxo, hy + 6), GOLD, rad=3.5, rim='all', bias=.08)
    cv.shade(ell_mask(BWW, BWH, cx + hxo, hy - 10, 9, 4.5), GOLD, rad=2.5, rim='all')
    for x in range(int(cx - 8 + hxo), int(cx + 9 + hxo)): cv.put(x, hy + 4, GOLD[0])                  # rim of the helm
    cv.shade(ell_mask(BWW, BWH, cx + hxo, hy - 15, 2.4, 2.2), GOLD, rad=1.2, rim='all')              # finial
    if view != 'up':
        slit = hexc('#ffb040') if anim in ('wind', 'charge', 'toll') else DARK
        cv.flat(rect_mask(BWW, BWH, cx - 6 + hxo, hy - 3, cx + 6 + hxo, hy - 1), slit)
        cv.flat(rect_mask(BWW, BWH, cx - 1 + hxo, hy - 7, cx + 1 + hxo, hy + 3), slit)
    cv.outline(INK)
    return cv

# ------------------------------------------------------------------ the Candlemaker (boss)
CMW, CMH, CMFOOT = 56, 70, 68
WAXR = ramp('#e8dcc0', '#5a4a38', '#fffaf0')
BLACKR = ramp('#2a2232', '#06040a', '#7a6a8a')

def candlemaker(view='down', anim='float', f=0):
    a = {'float': 'walk', 'cast': 'cast', 'slash': 'cast', 'stagger': 'recover', 'dead': 'dead'}.get(anim, 'walk')
    cv = chanter(view, a, f, robe=BLACKR, hood=WAXR, W=CMW, H=CMH, FOOT=CMFOOT)
    if anim != 'dead':  # a crown of five candles on the hood
        k = CMH / CHT; top = CMFOOT - 34 * k + ((0, -1, -2, -1)[f % 4] if a == 'walk' else 0)
        hx = CMW // 2 - (2 * k if view == 'left' else 0)
        for i in range(5):
            x = hx + (i - 2) * 3; y = top - 3 + abs(i - 2)
            cv.flat(rect_mask(CMW, CMH, x - 1, y - 3, x + 1, y + 1), WAXR[3])
            cv.put(x, y - 4 - (f + i) % 2, hexc('#ffb040')); cv.put(x, y - 5 - (f + i) % 2, hexc('#fff0c0'))
    return cv
