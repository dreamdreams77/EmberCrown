#!/usr/bin/env python3
"""Build assets/lpc/props.png and print the atlas map used by js/lpcprops.js.

usage: python3 tools/build_lpc_props.py /path/to/ElizaWy-LPC-checkout
Source: https://github.com/ElizaWy/LPC (LPC Revised, OGA-BY 3.0). Needs Pillow.
Each entry crops one sprite out of a source sheet; nothing is recoloured or redrawn.
"""
import sys, json
from PIL import Image

SRC = sys.argv[1]
F, S, W = "Objects/Furniture/", "Objects/Small Items/", "Objects/Wall Items/"
# name: (file, x, y, w, h)
CROPS = {
    "barrel":   (F + "Barrel.png", 0, 8, 32, 40),
    "crate":    (F + "Crate.png", 0, 0, 32, 32),
    "crateS":   (F + "Crate.png", 64, 0, 32, 32),
    "crates":   (F + "Crate.png", 0, 32, 64, 32),
    "table":    (F + "Table, Rough Wood.png", 8, 22, 80, 42),
    "pot":      (F + "Vase-Studies.png", 0, 138, 32, 40),
    "urn":      (F + "Vase-Studies.png", 0, 0, 32, 48),
    "cand0":    (F + "Lighting, Floor.png", 64, 0, 32, 58),
    "cand1":    (F + "Lighting, Floor.png", 96, 0, 32, 58),
    "candOff":  (F + "Lighting, Floor.png", 128, 0, 32, 58),
    "torch0":   (W + "Lighting, Wall.png", 64, 32, 32, 32),
    "torch1":   (W + "Lighting, Wall.png", 96, 32, 32, 32),
    "torch2":   (W + "Lighting, Wall.png", 128, 32, 32, 32),
    "torchOff": (W + "Lighting, Wall.png", 160, 32, 32, 32),
    "skull":    (S + "Skeletons A.png", 0, 0, 32, 32),
    "bone":     (S + "Skeletons A.png", 0, 32, 32, 32),
    "web":      (S + "Dungeon Elements.png", 32, 0, 32, 32),
    "chain":    (S + "Dungeon Elements.png", 32, 96, 32, 32),
}
AW = 256
x = y = rowh = 0
place = {}
for name, (f, sx, sy, w, h) in CROPS.items():
    if x + w > AW:
        x, y, rowh = 0, y + rowh, 0
    place[name] = (x, y, w, h)
    x += w
    rowh = max(rowh, h)
atlas = Image.new("RGBA", (AW, y + rowh), (0, 0, 0, 0))
cache = {}
for name, (f, sx, sy, w, h) in CROPS.items():
    im = cache.get(f) or cache.setdefault(f, Image.open(SRC + "/" + f).convert("RGBA"))
    atlas.paste(im.crop((sx, sy, sx + w, sy + h)), place[name][:2])
atlas.save("assets/lpc/props.png", optimize=True)
print(json.dumps({k: list(v) for k, v in place.items()}, separators=(",", ":")))
