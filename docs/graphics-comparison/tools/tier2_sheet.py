#!/usr/bin/env python3
"""B (HD-2D off) | C (HD-2D on, full) | C2 (HD-2D on at the game's own lower tier 2), four scenes.
usage: tier2_sheet.py <rawDir> <out.jpg>   (rawDir has B/desktop/default, C/desktop/default, C/desktop-tier2)"""
import sys
from PIL import Image, ImageDraw, ImageFont
RAW, OUT = sys.argv[1], sys.argv[2]
F = ImageFont.load_default(size=16)
rows = []
for sc, label in [('01-ashfall-start', 'Ashfall start'), ('04-gallowmere-fire', 'Gallowmere fire'), ('07-warden-boss', 'Warden fight'), ('12-candlemaker-boss', 'Candlemaker fight')]:
    ims = [Image.open(f'{RAW}/B/desktop/default/{sc}.png').convert('RGB'), Image.open(f'{RAW}/C/desktop/default/{sc}.png').convert('RGB'), Image.open(f'{RAW}/C/desktop-tier2/{sc}.png').convert('RGB')]
    caps = ['B  HD-2D off', 'C  HD-2D on, full (tier 0)', 'C2  HD-2D on, lighter tier 2 (bloom + grade only)']
    w = 620; tiles = []
    for im, c in zip(ims, caps):
        t = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS); card = Image.new('RGB', (w, t.height + 24), (14, 10, 20))
        card.paste(t, (0, 24)); ImageDraw.Draw(card).text((6, 3), f'{label}: {c}', fill=(240, 220, 170), font=F); tiles.append(card)
    r = Image.new('RGB', (w * 3 + 12, tiles[0].height), (6, 4, 10)); x = 0
    for t in tiles: r.paste(t, (x, 0)); x += w + 6
    rows.append(r)
S = Image.new('RGB', (rows[0].width, sum(r.height for r in rows) + 6 * (len(rows) - 1) + 34), (6, 4, 10)); y = 34
ImageDraw.Draw(S).text((8, 6), "Does the game's own lighter HD-2D tier keep the glow without the blur and white-out?   B | C | C2", fill=(255, 235, 190), font=ImageFont.load_default(size=20))
for r in rows: S.paste(r, (0, y)); y += r.height + 6
S.save(OUT, quality=88, subsampling=0, optimize=True); print(OUT, S.size)
