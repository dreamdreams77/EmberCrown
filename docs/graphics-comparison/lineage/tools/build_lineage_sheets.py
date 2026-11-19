#!/usr/bin/env python3
"""Builds the clay-vs-pixel contact sheets. usage: build_lineage_sheets.py <scratch> <docs/graphics-comparison>
scratch holds clay_desktop, clay_mobile (capture_clay.js), main_menus_{desktop,mobile}, clay_crops, main_crops.
Pixel-art shots are configuration B from the earlier comparison (default camera)."""
import sys, os, glob, shutil
from PIL import Image, ImageDraw, ImageFont
S, D = sys.argv[1], sys.argv[2]
L = os.path.join(D, 'lineage'); SH = os.path.join(L, 'screenshots'); CS = os.path.join(L, 'contact-sheets')
for p in (SH, CS): os.makedirs(p, exist_ok=True)
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: F = ImageFont.load_default()
SC = ['01-ashfall-start','02-ashfall-patrol','03-gallowmere-hall','04-gallowmere-fire','05-drowned-spire','06-thornwick-hall','07-warden-boss','08-ironvale','09-dunmoor-ball','10-dunmoor-ruins','11-candlemaker-hall','12-candlemaker-boss']
def j(src, dst, size=None):
    im = Image.open(src).convert('RGB')
    if size: im = im.resize(size, Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True); im.save(dst, quality=88); return im
def label(im, t):
    im = im.copy(); d = ImageDraw.Draw(im); w = d.textlength(t, font=F) + 16
    d.rectangle([0, 0, w, 30], fill=(0, 0, 0)); d.text((8, 4), t, fill=(255, 255, 255), font=F); return im
def pair_sheet(rows, cw, ch, name, titles):
    sh = Image.new('RGB', (cw * 2, ch * len(rows)), (16, 16, 16))
    for i, (a, b) in enumerate(rows):
        sh.paste(label(a.resize((cw, ch), Image.LANCZOS), titles[0] + '  ' + rows_ids[i]), (0, i * ch))
        sh.paste(label(b.resize((cw, ch), Image.LANCZOS), titles[1] + '  ' + rows_ids[i]), (cw, i * ch))
    sh.save(os.path.join(CS, name), quality=85)
for prof, vw in (('desktop', (1280, 720)), ('mobile', (844, 390))):
    pairs = []
    for s in SC:
        c = j(os.path.join(S, 'clay_' + prof, s + '.png'), os.path.join(SH, prof, 'clay-ink', s + '.jpg'))
        m = j(glob.glob(os.path.join(D, 'screenshots', prof, 'default-camera', s, 'B_*.jpg'))[0], os.path.join(SH, prof, 'pixel-B', s + '.jpg'))
        pairs.append((c, m))
    cw = 800 if prof == 'desktop' else 844; ch = int(cw * vw[1] / vw[0])
    for part, rng in ((1, range(0, 6)), (2, range(6, 12))):
        rows_ids = [SC[i] for i in rng]
        pair_sheet([pairs[i] for i in rng], cw, ch, f'{prof}-clay-vs-pixelB-part{part}.jpg', ('CLAY-AND-INK', 'PIXEL-ART (B)'))
    # menus
    mn = ['m01-title','m02-brief','m03-pause','m04-case-file','m05-choice' if False else 'm05-court']
    rows_ids = ['title', 'mission brief', 'pause', 'case file / journal', 'back stairs']
    cm = ['m01-title', 'm02-brief', 'm03-pause', 'm04-case-file', '13-back-stairs']
    mp = []
    for a, b in zip(cm, mn):
        c = j(os.path.join(S, 'clay_' + prof, a + '.png'), os.path.join(SH, prof, 'clay-ink', 'menu-' + a + '.jpg'))
        m = j(os.path.join(S, 'main_menus_' + prof, b + '.png'), os.path.join(SH, prof, 'pixel-B', 'menu-' + b + '.jpg'))
        mp.append((c, m))
    pair_sheet(mp, cw, ch, f'{prof}-menus-clay-vs-pixelB.jpg', ('CLAY-AND-INK', 'PIXEL-ART (B)'))
# crops
rows_ids = ['hero + dragon', 'guard', 'Bell-Warden', 'Candlemaker']
cr = []
for n in ['hero-and-dragon', 'guard', 'warden', 'candlemaker']:
    cr.append((j(os.path.join(S, 'clay_crops', f'crop-{n}.png'), os.path.join(SH, 'crops', f'clay-{n}.jpg')),
               j(os.path.join(S, 'main_crops', f'crop-{n}.png'), os.path.join(SH, 'crops', f'pixelB-{n}.jpg'))))
pair_sheet(cr, 600, 400, 'characters-close-clay-vs-pixelB.jpg', ('CLAY-AND-INK', 'PIXEL-ART (B)'))
shutil.copy(os.path.join(S, 'main_menus_desktop', 'm06-hub.png'), '/dev/null') if False else None
j(os.path.join(S, 'main_menus_desktop', 'm06-hub.png'), os.path.join(SH, 'desktop', 'pixel-B', 'menu-m06-rookery-hub.jpg'))
print('ok')
