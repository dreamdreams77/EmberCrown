#!/usr/bin/env python3
"""Build assets/lpc/parts/*.png: one small sheet per character layer, used by js/lpcgen.js.

usage: python3 tools/build_lpc_parts.py /path/to/Universal-LPC-Spritesheet-Character-Generator
Source: https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator (needs Pillow).

Each output sheet is 576x320: the layer's walk animation (4 rows of 9 frames: up, left, down, right)
with its hurt animation (6 frames) underneath. Layers marked GREY are converted to brightness-normalised
grey so the game can multiply-tint them (house colours on armour, cloth colours on NPC clothes, hair).
"""
import os, sys
from PIL import Image

SRC = sys.argv[1] + "/spritesheets/"
OUT = "assets/lpc/parts/"
# name: (path with {a} for the animation, GREY?)
LAYERS = {
    "body_m": ("body/bodies/male/{a}.png", 0), "body_f": ("body/bodies/female/{a}.png", 0),
    "head_m": ("head/heads/human/male/{a}.png", 0), "head_f": ("head/heads/human/female/{a}.png", 0),
    "pants_m": ("legs/pants/male/{a}.png", 1), "pants_f": ("legs/pants/thin/{a}.png", 1),
    "boots_m": ("feet/boots/basic/male/{a}.png", 1), "boots_f": ("feet/boots/basic/thin/{a}.png", 1),
    "shirt_m": ("torso/clothes/longsleeve/longsleeve/male/{a}.png", 1),
    "shirt_f": ("torso/clothes/longsleeve/longsleeve/female/{a}.png", 1),
    "apron_m": ("torso/aprons/apron/male/{a}/white.png", 1), "apron_f": ("torso/aprons/apron/female/{a}/white.png", 1),
    "skirt_m": ("legs/skirts/plain/male/{a}.png", 1), "skirt_f": ("legs/skirts/plain/thin/{a}.png", 1),
    "hood": ("hat/cloth/hood/adult/{a}.png", 1), "bandana": ("hat/cloth/bandana/adult/{a}.png", 1),
    "kettle": ("hat/helmet/kettle/adult/{a}.png", 1), "horned": ("hat/helmet/horned/adult/{a}.png", 1),
    "plate_t": ("torso/armour/plate/male/{a}.png", 1), "plate_l": ("legs/armour/plate/male/{a}.png", 1),
    "leather": ("torso/armour/leather/male/{a}.png", 1),
    "hair_m": ("hair/plain/adult/{a}.png", 1), "hair_f": ("hair/long/adult/{a}.png", 1),
    "spear_bg": ("weapon/polearm/spear/background/{a}/steel.png", 0),
    "spear_fg": ("weapon/polearm/spear/foreground/{a}/steel.png", 0),
    "bow_bg": ("weapon/ranged/bow/normal/{a}/background.png", 0), "bow_fg": ("weapon/ranged/bow/normal/{a}/foreground.png", 0),
    "axe": ("weapon/blunt/waraxe/{a}/waraxe.png", 0), "axe_bg": ("weapon/blunt/waraxe/behind/{a}/waraxe.png", 0),
    "mask": ("facial/masks/plain/adult/{a}.png", 1),
}


def frames64(im, cols, rows):
    """Return a cols*64 x rows*64 image; oversize weapon sheets (128px frames) are centre-cropped per frame."""
    size = im.height // rows
    if size == 64:
        return im.crop((0, 0, cols * 64, rows * 64))
    out = Image.new("RGBA", (cols * 64, rows * 64), (0, 0, 0, 0))
    o = (size - 64) // 2
    for r in range(rows):
        for c in range(cols):
            out.paste(im.crop((c * size + o, r * size + o, c * size + o + 64, r * size + o + 64)), (c * 64, r * 64))
    return out


def grey(im):
    px = im.load()
    lum = [0.3 * r + 0.59 * g + 0.11 * b for r, g, b, a in im.getdata() if a > 40]
    if not lum:
        return im
    lum.sort()
    top = max(1.0, lum[int(len(lum) * 0.97)])
    k = 240.0 / top
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                v = min(255, int((0.3 * r + 0.59 * g + 0.11 * b) * k))
                px[x, y] = (v, v, v, a)
    return im


os.makedirs(OUT, exist_ok=True)
total = 0
for name, (path, g) in LAYERS.items():
    sheet = Image.new("RGBA", (576, 320), (0, 0, 0, 0))
    w = SRC + path.format(a="walk")
    sheet.paste(frames64(Image.open(w).convert("RGBA"), 9, 4), (0, 0))
    h = SRC + path.format(a="hurt")
    if os.path.exists(h):
        sheet.paste(frames64(Image.open(h).convert("RGBA"), 6, 1), (0, 256))
    if g:
        grey(sheet)
    sheet.save(OUT + name + ".png", optimize=True)
    total += os.path.getsize(OUT + name + ".png")
print(len(LAYERS), "layers,", total // 1024, "KB")
