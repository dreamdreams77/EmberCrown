#!/usr/bin/env python3
"""Builds assets/ember/*.png and assets/ember/meta.js for the Ember art slice. Run from anywhere:
   python3 tools/ember_art/build_ember.py [outdir]
Nothing here reads an image: every pixel comes from the painters in pix.py/biped.py and the character modules."""
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from pix import *
from biped import *
import faces, shiloh, guards, cinder, ashling, people2, set2, ruin

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'ember')
os.makedirs(OUT, exist_ok=True)
VIEWS = ('down', 'up', 'left')

def lying(cfg, face_style, ko=True):
    """A person on the ground: stand them up facing the camera, turn them over on their back (a 90 degree turn is lossless)."""
    cv, hp = draw_person(cfg, 'down', dict(bob=0, lift=(0, 0), swing=0, sway=0), hurt=True)
    im = cv.img(); fc = faces.face('down', 'ko' if ko else 'hurt', face_style); im.alpha_composite(fc.img(), (hp[0] - 12, hp[1] - 8))
    im = im.rotate(90, expand=True)           # head to the left, feet to the right
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bb = im.getbbox(); crop = im.crop(bb)
    out.alpha_composite(crop, (max(0, (W - crop.width) // 2), FOOT - crop.height + 1))
    return out

def build_person(name, cfg, fstyle, hero=False):
    frames, meta = [], {}
    def add(anim, n, fn):
        meta[anim] = dict(n=n, head=[])
        for v in VIEWS:
            for i in range(n):
                cv, hp = fn(v, i); frames.append((anim, v, i, cv.img() if hasattr(cv, 'img') else cv))
                if v == 'down' or True: meta[anim]['head'].append(list(hp))
    add('idle', 1, lambda v, i: draw_person(cfg, v, IDLE, weapon=None if hero else 0))
    add('walk', 6, lambda v, i: draw_person(cfg, v, walk_pose(i), weapon=None if hero else 0))
    if hero:
        sweeps = {'down': [-30, 20, 70, 115, 150], 'up': [215, 255, 295, 335, 15], 'left': [250, 215, 180, 150, 120]}
        add('slash', 5, lambda v, i: draw_person(cfg, v, IDLE, weapon=sweeps[v][i]))
    add('hurt', 1, lambda v, i: draw_person(cfg, v, IDLE, hurt=True, weapon=None if hero else 0))
    # lying (same for every view): head anchor is where the head is in the rotated image
    ly = lying(cfg, fstyle); ly2 = lying(cfg, fstyle, ko=False)
    nko = 2 if hero else 1
    meta['ko'] = dict(n=nko, head=[[0, 0]] * 3)
    cols = max(m['n'] for m in meta.values())
    anims = [a for a in meta]; rows = {}
    sh = Image.new('RGBA', (cols * W, len(anims) * 3 * H), (0, 0, 0, 0))
    for (anim, v, i, im) in frames:
        r = anims.index(anim) * 3 + VIEWS.index(v); sh.alpha_composite(im, (i * W, r * H))
    r0 = anims.index('ko') * 3
    for v in range(3):
        sh.alpha_composite(ly, (0, (r0 + v) * H))
        if nko > 1: sh.alpha_composite(ly, (W, (r0 + v) * H))
    sh.save(os.path.join(OUT, name + '.png'))
    at, _ = faces.atlas(fstyle); at.save(os.path.join(OUT, 'faces_' + name + '.png'))
    # head anchors were collected per view in order down,up,left for each frame index: regroup
    for a, m in meta.items():
        if a == 'ko': continue
        n = m['n']; hd = m['head']; m['head'] = [hd[v * n:(v + 1) * n] for v in range(3)]
    meta['ko']['head'] = [[[0, 0]] * 3] * 3
    return dict(fw=W, fh=H, foot=FOOT, cols=cols, anims=anims, meta=meta)

def build_cinder():
    anims = [('walk', 4), ('wind', 1), ('lunge', 1), ('hurt', 1), ('dead', 3)]
    cols = 4; sh = Image.new('RGBA', (cols * cinder.CW, len(anims) * 3 * cinder.CH), (0, 0, 0, 0))
    for ai, (an, n) in enumerate(anims):
        for vi, v in enumerate(VIEWS):
            for f in range(n): sh.alpha_composite(cinder.draw(v, an, f).img(), (f * cinder.CW, (ai * 3 + vi) * cinder.CH))
    sh.save(os.path.join(OUT, 'cinder.png'))
    return dict(fw=cinder.CW, fh=cinder.CH, foot=cinder.CFOOT, cols=cols, anims=[a for a, _ in anims], counts={a: n for a, n in anims})

def build_ashling():
    anims = [('idle', 1), ('walk', 4), ('fire', 1), ('hurt', 1), ('ko', 1)]
    cols = 4; sh = Image.new('RGBA', (cols * ashling.AW, len(anims) * 3 * ashling.AH), (0, 0, 0, 0))
    for ai, (an, n) in enumerate(anims):
        for vi, v in enumerate(VIEWS):
            for f in range(n):
                im = ashling.draw(v, an, f).img()
                if an == 'ko':   # on her side
                    im = im.rotate(90 if v != 'up' else 90, expand=True); out = Image.new('RGBA', (ashling.AW, ashling.AH)); bb = im.getbbox(); c = im.crop(bb)
                    out.alpha_composite(c, ((ashling.AW - c.width) // 2, ashling.AFOOT - c.height + 2)); im = out
                sh.alpha_composite(im, (f * ashling.AW, (ai * 3 + vi) * ashling.AH))
    sh.save(os.path.join(OUT, 'ashling.png'))
    return dict(fw=ashling.AW, fh=ashling.AH, foot=ashling.AFOOT, cols=cols, anims=[a for a, _ in anims], counts={a: n for a, n in anims})

meta = {
    'shiloh': build_person('shiloh', shiloh.CFG, shiloh.FACE, hero=True),
    'pell': build_person('pell', guards.CFG_A, guards.FACE_A),
    'gaunt': build_person('gaunt', guards.CFG_B, guards.FACE_B),
    'cinder': build_cinder(),
    'ashling': build_ashling(),
    'pip': build_person('pip', people2.CFG_PIP, people2.FACE_PIP),
    'hale': build_person('hale', people2.CFG_HALE, people2.FACE_HALE),
    'halefree': build_person('halefree', people2.CFG_HALE_FREE, people2.FACE_HALE),
    'faces': dict(fw=faces.FW, fh=faces.FH, expr=faces.EXPR),
}
_s2 = set2.build(OUT); _s2.update(ruin.build()); meta['set2'] = set2.pack(_s2, OUT, 'set2')
try:
    import props_ashfall, tiles_ashfall
    meta.update(props_ashfall.build(OUT)); meta.update(tiles_ashfall.build(OUT))
except ImportError:
    pass
open(os.path.join(OUT, 'meta.js'), 'w').write('/* generated by tools/ember_art/build_ember.py: do not edit */\nconst EMBER_META=' + json.dumps(meta, separators=(',', ':')) + ';\n')
print('built', sorted(os.listdir(OUT)))
