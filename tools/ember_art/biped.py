"""Shared chibi biped skeleton for EmberCrown's people (hero, guards, NPCs): same proportions, different costume.
Canvas is 48x56, feet on y=51, centre x=24. Views: 'down' (facing camera), 'up' (back), 'left' (right = mirrored at runtime).
Faces are NOT drawn here: the game overlays them at run time (blinks, moods) at the head anchor this module reports."""
import math, numpy as np
from pix import *

W, H, FOOT, CX = 48, 56, 51, 24

def base_cfg(**kw):
    c = dict(torso_w=14, hem_w=16, shoulder_y=27, hem_y=40, head_rx=9.0, head_ry=8.3, head_y=17, leg_gap=3.2, leg_r=2.5,
             arm_r=2.1, arm_len=10, head_fn=None, body_fn=None, front_fn=None, back_fn=None, weapon_fn=None, ink=(26, 16, 34))
    c.update(kw); return c

def walk_pose(frame, n=6):
    p = frame / n * math.tau
    return dict(bob=1 if frame % 3 == 0 else 0, lift=(max(0, math.sin(p)) * 3.0, max(0, -math.sin(p)) * 3.0),
                swing=math.sin(p), sway=math.sin(p + 1.0))

IDLE = dict(bob=0, lift=(0, 0), swing=0.0, sway=0.0)

def draw_person(cfg, view='down', pose=None, hurt=False, flip_arms=False, weapon=None):
    """Returns (Cv, head_anchor). weapon=(angle_deg, 'near'|'far') draws cfg['weapon_fn'] in the near hand at that angle."""
    pose = pose or IDLE; cv = Cv(W, H)
    bob = pose['bob']; sw = pose['swing']; hurt_dy = 1 if hurt else 0
    hx = CX; hy = cfg['head_y'] + bob + hurt_dy
    tw, hw, sy, hm = cfg['torso_w'], cfg['hem_w'], cfg['shoulder_y'] + bob + hurt_dy, cfg['hem_y'] + bob * 0 + hurt_dy
    side = view == 'left'
    legs = []
    if view == 'down' or view == 'up':
        for k, sx in enumerate((-1, 1)):
            x = CX + sx * cfg['leg_gap']; lift = pose['lift'][k]
            legs.append((x, hm - 3, x + (0.0), FOOT - 3 - lift, k))
    else:
        for k in range(2):
            lift = pose['lift'][k]; dirk = 1 if k == 0 else -1
            x1 = CX - 1 + dirk * 4.2 * sw * (1 if True else -1)
            legs.append((CX - 1, hm - 3, x1, FOOT - 3 - lift, k))
    R = cfg
    # back layer (cape / scarf tail / satchel behind)
    if cfg['back_fn']: cfg['back_fn'](cv, view, pose, hx, hy, sy, hm)
    # far leg first for side view
    order = legs if view != 'left' else legs[::-1]
    for (x0, y0, x1, y1, k) in order:
        m = capsule_mask(W, H, x0, y0, x1, y1, R['leg_r'], R['leg_r'] - .2)
        cv.shade(m, R['pants'] if k else R['pants_far'] if 'pants_far' in R else R['pants'], rad=2.2, rim='all')
        bx, by = x1 + (-1.6 if side else 0), y1 + 1.2
        bm = ell_mask(W, H, bx + (-.8 if side else 0), by, 3.5 if not side else 4.2, 2.5)
        cv.shade(bm, R['boots'], rad=2.2, rim='all')
    # torso
    top, bot = sy - 2, hm
    if side:
        pts = [(CX - tw / 2 + 1.5, top + 1), (CX + tw / 2 - 1.5, top + 1), (CX + hw / 2 - 2, bot), (CX - hw / 2 + 2, bot)]
    else:
        pts = [(CX - tw / 2, top + 1), (CX + tw / 2, top + 1), (CX + hw / 2, bot), (CX - hw / 2, bot)]
    tm = poly_mask(W, H, pts) | ell_mask(W, H, CX, top + 3, tw / 2 - (1.5 if side else 0), 4)
    cv.shade(tm, R['coat'], rad=3.6, rim='all')
    if cfg['body_fn']: cfg['body_fn'](cv, view, pose, tm, hx, hy, sy, hm)
    # arms
    ar = cfg['arm_r']; al = cfg['arm_len']
    def arm(k, near):
        sx = -1 if k == 0 else 1
        if side:
            sx0 = CX - 0.5 + (1.5 if near else -1.0); swing = (-sw if near else sw) * 4.5
            if flip_arms: swing = -swing
            p0 = (sx0, sy + 1); p1 = (sx0 + swing, sy + al - 1 - hurt_dy * 2)
        else:
            sx0 = CX + sx * (tw / 2 + .3); swing = (sw * 3.0 * (-sx)) if view == 'down' else (sw * 3.0 * sx)
            p0 = (sx0, sy + 1); p1 = (sx0 + sx * 1.2 + (0 if hurt else 0), sy + al - 1 + swing - (4 if hurt else 0))
        if weapon is not None and cfg.get('strike_arm') and near and (side or k == 1):
            a_ = math.radians(weapon); p1 = (p0[0] + math.cos(a_) * 7.5, p0[1] + 2 + math.sin(a_) * 6.5)
        m = capsule_mask(W, H, p0[0], p0[1], p1[0], p1[1], ar, ar - .1)
        cv.shade(m, R['sleeve'] if 'sleeve' in R else R['coat'], rad=2.0, rim='all')
        hm_ = ell_mask(W, H, p1[0], p1[1] + .8, 2.4, 2.4)
        cv.shade(hm_, R['skin'], rad=2.0, rim='all')
        return p1
    hands = {}
    if side:
        hands['far'] = arm(1, False)
    else:
        hands['l'] = arm(0, True)
    # (front layer drawn after torso but before near arm in side view)
    if cfg['front_fn'] and side: cfg['front_fn'](cv, view, pose, tm, hx, hy, sy, hm)
    if side: hands['near'] = arm(0, True)
    else:
        hands['r'] = arm(1, True)
        if cfg['front_fn']: cfg['front_fn'](cv, view, pose, tm, hx, hy, sy, hm)
    if weapon is not None and cfg['weapon_fn']:
        hpos = hands.get('near') or hands.get('r')
        cfg['weapon_fn'](cv, view, hpos, weapon)
    # head
    if cfg['head_fn']: cfg['head_fn'](cv, view, hx + (-1.5 if side else 0), hy, hurt)
    cv.outline(cfg['ink'])
    return cv, (int(round(hx + (-1.5 if side else 0))), int(round(hy)))
