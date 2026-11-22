"""Ember art toolkit: a tiny pixel-art painter used to author EmberCrown's original sprites and tiles.
Everything here is drawn from shapes, ramps and hand-placed pixel stamps; no source images are used.
Shapes are rasterised to boolean masks, then shaded from one fixed light (top-left) into a colour ramp, so every
asset shares the same lighting model and reads as one hand."""
import numpy as np
from PIL import Image

def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3)) + (255,)

def ramp(base, shadow=None, light=None, n=5):
    """5 tones dark->light from one base colour: cool/dark shadows, warm light."""
    b = hexc(base) if isinstance(base, str) else base
    sh = hexc(shadow) if isinstance(shadow, str) else (shadow or (40, 26, 70, 255))
    li = hexc(light) if isinstance(light, str) else (light or (255, 236, 190, 255))
    return [mix(b, sh, .78), mix(b, sh, .42), b, mix(b, li, .30), mix(b, li, .62)]

def ell_mask(w, h, cx, cy, rx, ry):
    y, x = np.mgrid[0:h, 0:w]
    return ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1.0

def rect_mask(w, h, x0, y0, x1, y1):
    m = np.zeros((h, w), bool); m[max(0, int(y0)):max(0, int(y1)), max(0, int(x0)):max(0, int(x1))] = True; return m

def capsule_mask(w, h, x0, y0, x1, y1, r0, r1=None):
    r1 = r0 if r1 is None else r1
    y, x = np.mgrid[0:h, 0:w]; px, py = x + .5, y + .5
    dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy or 1e-9
    t = np.clip(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1)
    r = r0 + (r1 - r0) * t
    return (px - (x0 + dx * t)) ** 2 + (py - (y0 + dy * t)) ** 2 <= r * r

def poly_mask(w, h, pts):
    im = Image.new('L', (w, h), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(im).polygon([(float(x), float(y)) for x, y in pts], fill=255)
    return np.array(im) > 0

def _erode(m):
    e = m.copy()
    e[1:, :] &= m[:-1, :]; e[:-1, :] &= m[1:, :]; e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]
    e[0, :] = False; e[-1, :] = False; e[:, 0] = False; e[:, -1] = False
    return e

def depth(m):
    d = np.zeros(m.shape, float); cur = m.copy(); k = 0
    while cur.any():
        k += 1; d[cur] = k; cur = _erode(cur)
    return d

LIGHT = np.array([-.55, -.72, .55]); LIGHT = LIGHT / np.linalg.norm(LIGHT)

class Cv:
    def __init__(s, w, h):
        s.w, s.h = w, h; s.a = np.zeros((h, w, 4), np.uint8); s.id = np.zeros((h, w), np.int16)

    # ---- painting -------------------------------------------------------------------------------------------
    def flat(s, m, col, tag=0):
        c = hexc(col) if isinstance(col, str) else col
        s.a[m] = c; s.id[m] = tag

    def shade(s, m, rp, rad=3.2, k=1.5, bias=0.0, tag=0, bands=None, rim=None):
        """Fill mask m from ramp rp (5 tones) as a lit dome: gentle plateau, rounded edges, light from top-left."""
        if not m.any(): return
        d = depth(m); R = max(1.0, min(rad, d.max()))
        z = np.sqrt(np.clip(1 - (1 - np.minimum(d, R) / R) ** 2, 0, 1)) * R * .62
        zy, zx = np.gradient(z)
        n = np.stack([-zx * k, -zy * k, np.ones_like(z)], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        v = (n * LIGHT).sum(-1) + bias
        idx = np.digitize(v, bands or [.30, .50, .68, .86])
        for i in range(5):
            mm = m & (idx == i)
            if mm.any(): s.a[mm] = rp[i]
        s.id[m] = tag
        if rim:
            edge = m & ~_erode(m)
            if rim == 'br':
                sh = np.zeros_like(m); sh[:-1, :] |= ~m[1:, :]; sh[:, :-1] |= ~m[:, 1:]
                edge &= sh
            s.a[edge] = rp[0]

    def put(s, x, y, col):
        if 0 <= x < s.w and 0 <= y < s.h:
            s.a[int(y), int(x)] = hexc(col) if isinstance(col, str) else col

    def stamp(s, x, y, rows, pal, tag=0):
        """Hand-placed pixels: rows of characters, '.' = leave alone, others looked up in pal."""
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch != '.' and ch in pal:
                    c = pal[ch]; c = hexc(c) if isinstance(c, str) else c
                    X, Y = x + i, y + j
                    if 0 <= X < s.w and 0 <= Y < s.h: s.a[Y, X] = c; s.id[Y, X] = tag

    # ---- finishing ------------------------------------------------------------------------------------------
    def outline(s, ink=(26, 16, 34), strength=.80, inner=False):
        """Selective outline: a 1px ring around the silhouette, tinted from the neighbouring colour (never pure black)."""
        a = s.a; op = a[..., 3] > 0; out = np.zeros_like(a)
        pad = np.pad(op, 1); pa = np.pad(a, ((1, 1), (1, 1), (0, 0)))
        best = np.zeros((s.h, s.w, 3), float); cnt = np.zeros((s.h, s.w))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb = pad[1 + dy:1 + dy + s.h, 1 + dx:1 + dx + s.w]
            col = pa[1 + dy:1 + dy + s.h, 1 + dx:1 + dx + s.w, :3].astype(float)
            best += col * nb[..., None]; cnt += nb
        ring = (~op) & (cnt > 0)
        avg = best / np.maximum(cnt, 1)[..., None]
        ink = np.array(ink, float)
        col = avg * (1 - strength) + ink * strength
        col = np.minimum(col, avg * .45 + ink * .55)
        a[ring, :3] = col[ring].astype(np.uint8); a[ring, 3] = 255
        return s

    def img(s):
        return Image.fromarray(s.a, 'RGBA')

def sheet(frames, cols, cw, ch, bg=None):
    rows = (len(frames) + cols - 1) // cols
    im = Image.new('RGBA', (cols * cw, rows * ch), bg or (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.paste(f.img() if hasattr(f, 'img') else f, ((i % cols) * cw, (i // cols) * ch))
    return im

def preview(im, path, scale=6, bg=(58, 52, 72, 255)):
    b = Image.new('RGBA', im.size, bg); b.alpha_composite(im)
    b = b.resize((im.width * scale, im.height * scale), Image.NEAREST); b.convert('RGB').save(path)
