#!/usr/bin/env python3
"""Builds the comparison folder from the raw captures.
usage: build_sheets.py <rawDir> <outDir>
raw layout: <rawDir>/{A,E,B,C}/{desktop,mobile}/{default,close}/<scene>.png (+ timings.json), <rawDir>/D/...
Writes: screenshots/ (q95 JPEG), contact-sheets/, crops/ (lossless PNG), metrics.json"""
import sys, os, json, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

RAW, OUT = sys.argv[1], sys.argv[2]
CFG = [  # key, folder label, caption
    ('A', 'A_earlier-a26562d', 'A  Earlier (a26562d), no HD-2D'),
    ('E', 'X_890363b-hd2d-first-pass', 'X  890363b, first HD-2D pass'),
    ('B', 'B_current-hd2d-off', 'B  Current art, HD-2D OFF'),
    ('C', 'C_current-hd2d-on', 'C  Current art, HD-2D ON'),
]
LABEL = {k: l for k, l, _ in CFG}
CAP = {k: c for k, _, c in CFG}
try:
    FONT = ImageFont.load_default(size=18); FONT_S = ImageFont.load_default(size=14)
except TypeError:
    FONT = FONT_S = ImageFont.load_default()

def load(k, prof, zoom, scene):
    f = os.path.join(RAW, k, prof, zoom, scene + '.png')
    return Image.open(f).convert('RGB') if os.path.exists(f) else None

def scenes(prof, zoom):
    s = set()
    for k, _, _ in CFG:
        s |= {os.path.basename(f)[:-4] for f in glob.glob(os.path.join(RAW, k, prof, zoom, '*.png'))}
    return sorted(s)

def lum(a):  # Rec.709 luma 0..255
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

def tile(img, w, caption):
    h = round(img.height * w / img.width)
    t = img.resize((w, h), Image.LANCZOS)
    c = Image.new('RGB', (w, h + 26), (14, 10, 20))
    c.paste(t, (0, 26)); ImageDraw.Draw(c).text((8, 3), caption, fill=(240, 220, 170), font=FONT_S)
    return c

def row(imgs, gap=6):
    W = sum(i.width for i in imgs) + gap * (len(imgs) - 1); H = max(i.height for i in imgs)
    s = Image.new('RGB', (W, H), (6, 4, 10)); x = 0
    for i in imgs: s.paste(i, (x, 0)); x += i.width + gap
    return s

def stack(imgs, gap=6, title=None):
    W = max(i.width for i in imgs); H = sum(i.height for i in imgs) + gap * (len(imgs) - 1) + (34 if title else 0)
    s = Image.new('RGB', (W, H), (6, 4, 10)); y = 0
    if title: ImageDraw.Draw(s).text((10, 6), title, fill=(255, 235, 190), font=FONT); y = 34
    for i in imgs: s.paste(i, (0, y)); y += i.height + gap
    return s

def save_jpg(img, path, q=92):
    os.makedirs(os.path.dirname(path), exist_ok=True); img.save(path, quality=q, subsampling=0, optimize=True)

metrics = {'scenes': {}, 'bands': {}, 'house_colour': {}}
for prof in ('desktop', 'mobile'):
    for zoom in ('default', 'close'):
        for sc in scenes(prof, zoom):
            imgs = {k: load(k, prof, zoom, sc) for k, _, _ in CFG}
            # 1) committed screenshots
            for k, im in imgs.items():
                if im: save_jpg(im, f'{OUT}/screenshots/{prof}/{zoom}-camera/{sc}/{LABEL[k]}.jpg')
            # 2) per-scene contact sheet: all four versions in a 2x2 grid
            have = [(k, im) for k, im in imgs.items() if im]
            if have:
                tw = 800 if prof == 'desktop' else 640
                tiles = [tile(im, tw, CAP[k]) for k, im in have]
                rows = [row(tiles[i:i + 2]) for i in range(0, len(tiles), 2)]
                save_jpg(stack(rows, title=f'{sc}   [{prof}, {zoom} camera]'), f'{OUT}/contact-sheets/by-scene/{prof}-{zoom}/{sc}.jpg', 84)
            # 3) numbers
            for k, im in have:
                a = np.asarray(im, float); L = lum(a)
                metrics['scenes'].setdefault(f'{prof}/{zoom}/{sc}', {})[k] = {
                    'mean_luma': round(float(L.mean()), 2), 'p99_luma': round(float(np.percentile(L, 99)), 1),
                    'clipped_pct': round(float((L >= 245).mean() * 100), 3), 'crushed_pct': round(float((L <= 10).mean() * 100), 2),
                    'mean_rgb': [round(float(a[..., i].mean()), 1) for i in range(3)]}
            # 4) blur by horizontal band (mean absolute horizontal+vertical gradient on luma), B vs C isolates depth of field
            if imgs['B'] is not None and imgs['C'] is not None and prof == 'desktop':
                r = {}
                for k in ('A', 'E', 'B', 'C'):
                    if imgs[k] is None: continue
                    L = lum(np.asarray(imgs[k], float)); H = L.shape[0]
                    g = np.abs(np.diff(L, axis=1))[:-1] + np.abs(np.diff(L, axis=0))[:, :-1]
                    g = g[:, 300:1000]  # keep clear of the HUD columns
                    bands = {'top': g[:int(H * .2)], 'middle': g[int(H * .3):int(H * .7)], 'bottom': g[int(H * .82):int(H * .9)]}
                    r[k] = {n: round(float(v.mean()), 3) for n, v in bands.items()}
                metrics['bands'][f'{zoom}/{sc}'] = r

            # 5) matched crops (lossless), centre / top band / brightest light, for A|B|C
            if all(imgs[k] is not None for k in ('A', 'B', 'C')) and prof == 'desktop':
                C = np.asarray(imgs['C'], float); L = lum(C)
                def crops(box, name, scale):
                    ims = [tile(imgs[k].crop(box).resize(((box[2] - box[0]) * scale, (box[3] - box[1]) * scale), Image.NEAREST), (box[2] - box[0]) * scale, CAP[k]) for k in ('A', 'B', 'C')]
                    save_jpg(row(ims), f'{OUT}/crops/{name}/{prof}-{zoom}/{sc}.jpg') if False else None
                    d = f'{OUT}/crops/{name}/{zoom}'; os.makedirs(d, exist_ok=True); row(ims).save(f'{d}/{sc}.png', optimize=True)
                crops((520, 250, 760, 430), '1-centre-sprite-and-floor-4x', 3)
                crops((420, 0, 860, 150), '2-top-band-depth-of-field-2x', 2)
                m = L.copy(); m[:, :260] = 0; m[:, 1000:] = 0; m[:110] = 0; m[560:] = 0
                y, x = np.unravel_index(np.argmax(m), m.shape); x0 = int(min(max(x - 110, 0), 1280 - 220)); y0 = int(min(max(y - 80, 0), 720 - 160))
                crops((x0, y0, x0 + 220, y0 + 160), '3-brightest-light-bloom-3x', 3)

# colour identity: separation of the seven missions' mean colour (Lab-ish via simple opponent space), per configuration
def opp(rgb):
    r, g, b = [c / 255 for c in rgb]; return np.array([0.299 * r + 0.587 * g + 0.114 * b, r - g, (r + g) / 2 - b])
for zoom in ('default',):
    for k in ('A', 'E', 'B', 'C'):
        cols = {}
        for key, v in metrics['scenes'].items():
            p, z, sc = key.split('/')
            if p == 'desktop' and z == zoom and sc[:2] in ('01', '03', '05', '06', '08', '09', '11') and k in v: cols[sc] = v[k]['mean_rgb']
        if len(cols) < 4: continue
        names = sorted(cols); d = []
        for i in range(len(names)):
            for j in range(i + 1, len(names)): d.append((float(np.linalg.norm(opp(cols[names[i]])[1:] - opp(cols[names[j]])[1:])), names[i], names[j]))
        d.sort()
        metrics['house_colour'][k] = {'mean_chroma_separation': round(float(np.mean([x[0] for x in d])), 4), 'closest_pair': [d[0][1], d[0][2], round(d[0][0], 4)],
                                       'mean_rgb': {n: cols[n] for n in names}}

# master sheets: every scene, A | B | C, at a size that still reads
for prof in ('desktop', 'mobile'):
    for zoom in ('default', 'close'):
        sl = scenes(prof, zoom)
        if not sl: continue
        w = 420 if prof == 'desktop' else 420
        rows = []
        for sc in sl:
            ims = [load(k, prof, zoom, sc) for k in ('A', 'B', 'C')]
            if any(i is None for i in ims): continue
            rows.append(row([tile(i, w, f'{sc[:2]} {n}') for i, n in zip(ims, ('A earlier', 'B current, HD-2D off', 'C current, HD-2D on'))]))
        if rows:
            half = (len(rows) + 1) // 2
            for n, chunk in enumerate((rows[:half], rows[half:]), 1):
                if chunk: save_jpg(stack(chunk, title=f'Master sheet {n}: A | B | C   [{prof}, {zoom} camera]'), f'{OUT}/contact-sheets/master-{prof}-{zoom}-camera-part{n}.jpg', 84)

# the new-player (D) sequence
dfiles = sorted(glob.glob(os.path.join(RAW, 'D', '*', '*.png')))
for f in dfiles:
    prof = f.split(os.sep)[-2]
    save_jpg(Image.open(f).convert('RGB'), f'{OUT}/screenshots/D_new-player/{prof}/{os.path.basename(f)[:-4]}.jpg')
for prof in ('desktop', 'mobile'):
    fs = sorted(glob.glob(os.path.join(RAW, 'D', prof, '0*.png')))
    if fs:
        tiles = [tile(Image.open(f).convert('RGB'), 420, os.path.basename(f)[:-4]) for f in fs]
        rows = [row(tiles[i:i + 3]) for i in range(0, len(tiles), 3)]
        save_jpg(stack(rows, title=f'D: what a new player sees, in order [{prof}]'), f'{OUT}/contact-sheets/D-new-player-{prof}.jpg', 84)

# timings
tim = {}
for k, _, _ in CFG:
    for prof in ('desktop', 'mobile'):
        f = os.path.join(RAW, k, prof, 'timings.json')
        if os.path.exists(f): tim[f'{k}/{prof}'] = json.load(open(f))
json.dump({'timings_raw': {k: {'info': v['info'], 'errors': v['errors'], 'median_ms_per_scene': {s: t['medianMs'] for s, t in v['timings'].items()}} for k, v in tim.items()}}, open(f'{OUT}/metrics-timings-raw.json', 'w'), indent=1)
json.dump(metrics, open(f'{OUT}/metrics.json', 'w'), indent=1)
print('scenes measured:', len(metrics['scenes']), '| band sets:', len(metrics['bands']), '| colour sets:', list(metrics['house_colour']))
