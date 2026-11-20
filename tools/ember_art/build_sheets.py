#!/usr/bin/env python3
"""Contact sheets for the Ember art slice: matched original-vs-Ember gameplay pairs, UI pairs, and a model sheet drawn from the shipped
sprite sheets. usage: build_sheets.py <docs/ember-art-slice> ; then converts screenshots to JPG to keep the folder small."""
import sys, os, json, re, glob
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]; SH = os.path.join(D, 'screenshots'); CS = os.path.join(D, 'contact-sheets'); os.makedirs(CS, exist_ok=True)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
TA, TB = 'ORIGINAL (LPC art, HD-2D off)', 'EMBER ART SLICE'
def pair(rows, cw, ch, out):
    sh = Image.new('RGB', (cw * 2, ch * len(rows)), (14, 10, 20))
    for i, (pa, pb, name) in enumerate(rows):
        for j, (p, t) in enumerate(((pa, TA), (pb, TB))):
            im = Image.open(p).convert('RGB').resize((cw, ch), Image.LANCZOS); d = ImageDraw.Draw(im); s = t + '  ' + name
            d.rectangle([0, 0, d.textlength(s, font=F) + 14, 26], fill=(0, 0, 0)); d.text((7, 3), s, fill=(255, 255, 255), font=F); sh.paste(im, (j * cw, i * ch))
    sh.save(os.path.join(CS, out), quality=86)
for prof, cw, ch in (('desktop', 720, 405), ('mobile', 720, 338)):
    for cam, names in (('default', ['02-start', '03-patrol', '07-cinderling', '10-takedown']), ('close', ['01-hero-idle', '04-two-guards', '06-strike', '07-cinderling']), ('close', ['08-ashling-fire', '09-guard-alert', '05-walking', '10-takedown'])):
        pass
    sets = [('gameplay-default', 'default', ['02-start', '03-patrol', '07-cinderling', '10-takedown']),
            ('closeup-1', 'close', ['01-hero-idle', '04-two-guards', '06-strike', '07-cinderling']),
            ('closeup-2', 'close', ['08-ashling-fire', '09-guard-alert', '05-walking', '10-takedown'])]
    for nm, cam, names in sets:
        pair([(f'{SH}/{prof}/lpc/{cam}/{n}.png', f'{SH}/{prof}/ember/{cam}/{n}.png', n) for n in names], cw, ch, f'{prof}-{nm}.jpg')
    m = [('m01-title', 'title'), ('m02-brief', 'mission brief'), ('m03-pause', 'pause menu'), ('m05-court', 'back stairs')]
    pair([(f'{SH}/{prof}/menus-lpc/{a}.png', f'{SH}/{prof}/menus-ember/{a}.png', n) for a, n in m], cw, ch, f'{prof}-menus.jpg')
# model sheet from the shipped sprites
A = os.path.join(D, '..', '..', 'assets', 'ember'); meta = json.loads(re.search(r'EMBER_META=(.*);', open(os.path.join(A, 'meta.js')).read()).group(1))
BG = (58, 52, 72, 255); out = Image.new('RGBA', (1500, 760), BG); d = ImageDraw.Draw(out); x0 = 10; y = 6
def frame(name, anim, v, f):
    m = meta[name]; im = Image.open(os.path.join(A, name + '.png')); ai = m['anims'].index(anim)
    return im.crop((f * m['fw'], (ai * 3 + v) * m['fh'], (f + 1) * m['fw'], (ai * 3 + v + 1) * m['fh']))
FACE = {'shiloh': 'faces_shiloh', 'pell': 'faces_pell', 'gaunt': 'faces_gaunt'}
rows = [('Shiloh', 'shiloh', ['idle', 'walk', 'walk', 'slash', 'hurt', 'ko'], 1), ('Pell, the pikeman', 'pell', ['idle', 'walk', 'walk', 'hurt', 'ko'], 1), ('Sergeant Gaunt', 'gaunt', ['idle', 'walk', 'walk', 'hurt', 'ko'], 1)]
for title, name, anims, sc in rows:
    d.text((x0, y), title, fill=(255, 255, 255, 255), font=F); y += 24; x = x0
    for v in (0, 1, 2):
        im = frame(name, 'idle', v, 0).copy()
        if v != 1:
            at = Image.open(os.path.join(A, FACE[name] + '.png')); fw, fh = meta['faces']['fw'], meta['faces']['fh']; hd = meta[name]['meta']['idle']['head'][v][0]
            im.alpha_composite(at.crop((0, (0 if v == 0 else 1) * fh, fw, (0 if v == 0 else 1) * fh + fh)), (hd[0] - fw // 2, hd[1] - fh // 2))
        out.alpha_composite(im.resize((im.width * 2, im.height * 2), Image.NEAREST), (x, y)); x += 100
    x += 20
    for f in range(6):
        im = frame(name, 'walk', 2, f).copy(); hd = meta[name]['meta']['walk']['head'][2][f]
        at = Image.open(os.path.join(A, FACE[name] + '.png')); fw, fh = meta['faces']['fw'], meta['faces']['fh']
        im.alpha_composite(at.crop((0, fh, fw, fh * 2)), (hd[0] - fw // 2, hd[1] - fh // 2))
        out.alpha_composite(im.resize((im.width * 2, im.height * 2), Image.NEAREST), (x, y)); x += 100
    y += 128
# expressions row
d.text((x0, y), 'Faces, drawn over the body at run time: calm, blink, wary, alarm, hurt, ko, focus, joy, rage, shout (three characters)', fill=(255, 255, 255, 255), font=F); y += 24
for k, name in enumerate(('shiloh', 'pell', 'gaunt')):
    at = Image.open(os.path.join(A, FACE[name] + '.png')).crop((0, 0, 24 * 10, 16))
    out.alpha_composite(at.resize((at.width * 2, at.height * 2), Image.NEAREST), (x0 + k * 500, y))
y += 40
d.text((x0, y), 'Cinderling (walk, wind-up, lunge, hurt, dead) and Ashling (idle, walk, fire, hurt) in three views', fill=(255, 255, 255, 255), font=F); y += 24
x = x0
for v in (0, 1, 2):
    for an, n in (('walk', 2), ('wind', 1), ('lunge', 1), ('hurt', 1)):
        for f in range(n):
            m = meta['cinder']; im = Image.open(os.path.join(A, 'cinder.png')); ai = m['anims'].index(an)
            c = im.crop((f * m['fw'], (ai * 3 + v) * m['fh'], (f + 1) * m['fw'], (ai * 3 + v + 1) * m['fh'])); out.alpha_composite(c.resize((c.width * 2, c.height * 2), Image.NEAREST), (x, y)); x += 66
    x += 6
y += 72; x = x0
for v in (0, 1, 2):
    for an, n in (('idle', 1), ('walk', 2), ('fire', 1), ('hurt', 1)):
        for f in range(n):
            m = meta['ashling']; im = Image.open(os.path.join(A, 'ashling.png')); ai = m['anims'].index(an)
            c = im.crop((f * m['fw'], (ai * 3 + v) * m['fh'], (f + 1) * m['fw'], (ai * 3 + v + 1) * m['fh'])); out.alpha_composite(c.resize((c.width * 2, c.height * 2), Image.NEAREST), (x, y)); x += 90
    x += 6
out.crop((0, 0, 1500, y + 96)).convert('RGB').save(os.path.join(CS, 'model-sheet.jpg'), quality=90)
# shrink the raw screenshots
for p in glob.glob(SH + '/**/*.png', recursive=True):
    Image.open(p).convert('RGB').save(p[:-4] + '.jpg', quality=88); os.remove(p)
print('ok', sorted(os.listdir(CS)))
