#!/usr/bin/env python3
"""Round-2 review sheets from docs/ember-art-slice/review (made by rooms.js, objects.js, gameplay.js). usage: build_round2_sheets.py <docs/ember-art-slice>
Then converts the raw PNG screenshots to JPG to keep the folder small."""
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]; R = os.path.join(D, 'review'); O = os.path.join(D, 'contact-sheets', 'round2'); os.makedirs(O, exist_ok=True)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
def lab(im, t):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, d.textlength(t, font=F) + 12, 24], fill=(0, 0, 0)); d.text((6, 3), t, fill=(255, 255, 255), font=F); return im
def pair(a, b, ta, tb, w, h):
    s = Image.new('RGB', (w * 2, h)); s.paste(lab(Image.open(a).convert('RGB').resize((w, h)), ta), (0, 0)); s.paste(lab(Image.open(b).convert('RGB').resize((w, h)), tb), (w, 0)); return s
def stack(rows, w, h, out):
    sh = Image.new('RGB', (w * 2, h * len(rows)))
    for i, r in enumerate(rows): sh.paste(r, (0, i * h))
    sh.save(os.path.join(O, out), quality=86)
for prof, w, h in (('desktop', 720, 405), ('mobile', 720, 338)):
    rooms = sorted(os.listdir(f'{R}/{prof}/ember'))
    stack([pair(f'{R}/{prof}/original/{n}', f'{R}/{prof}/ember/{n}', 'ORIGINAL (LPC art)', 'EMBER ART (round 2)', w, h) for n in rooms[1:5]], w, h, f'{prof}-rooms-original-vs-ember.jpg')
    rr = sorted(os.listdir(f'{R}/{prof}/ember-ruin'))[1:4]
    stack([pair(f'{R}/{prof}/ember/{n}', f'{R}/{prof}/ember-ruin/{n}', 'EMBER normal', 'EMBER ruined state', w, h) for n in rr], w, h, f'{prof}-normal-vs-ruin.jpg')
pair(f'{R}/desktop/original/00-overview.png', f'{R}/desktop/ember/00-overview.png', 'ORIGINAL whole keep', 'EMBER whole keep', 720, 405).save(os.path.join(O, 'desktop-overview.jpg'), quality=88)
names = ['door', 'gate', 'pots', 'brazier', 'pip', 'hale', 'rug']; sh = Image.new('RGB', (1280, 360 * len(names)))
for i, n in enumerate(names):
    for j, d in enumerate(('objects', 'objects-ruin')):
        im = Image.open(f'{R}/desktop/{d}/{n}.png').convert('RGB').crop((240, 130, 1040, 580)).resize((640, 360)); lab(im, n + (' (ruined state)' if j else '')); sh.paste(im, (j * 640, i * 360))
sh.save(os.path.join(O, 'desktop-objects-normal-vs-ruin.jpg'), quality=86)
c = Image.new('RGB', (1440, 800))
for i, k in enumerate(['closed', 'open', 'closed-ruin', 'brazier-lit']): c.paste(Image.open(f'{R}/desktop/chests/{k}.png').convert('RGB'), ((i % 2) * 720, (i // 2) * 400))
c.save(os.path.join(O, 'desktop-chest-brazier.jpg'), quality=86)
gp = ['desktop-05-talk', 'desktop-07-pause', 'desktop-08-lose', 'phone-05-talk', 'phone-06-fire', 'phone-07-pause']; g = Image.new('RGB', (1280, 1080))
for i, n in enumerate(gp): g.paste(Image.open(f'{R}/gameplay/{n}.png').convert('RGB').resize((640, 360)), ((i % 2) * 640, (i // 2) * 360))
g.save(os.path.join(O, 'gameplay-real-input.jpg'), quality=84)
for p in glob.glob(R + '/**/*.png', recursive=True): Image.open(p).convert('RGB').save(p[:-4] + '.jpg', quality=86); os.remove(p)
print(sorted(os.listdir(O)))
