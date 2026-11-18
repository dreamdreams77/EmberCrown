#!/usr/bin/env python3
"""Build assets/lpc/tiles.png: two floor cells and one wall-face cell per house for pixel-art mode.
Sources are LPC tilesets from the LPC Starter Kit (https://github.com/LiberatedPixelCup/RPG_Maker_MZ_LPC_Starter_Kit,
LFS files, fetch them from media.githubusercontent.com): Interior.png (Sharm and others, see its Final Attribution),
castlefloors.png and castlewalls.png (Daniel Armstrong / HughSpectrum), dungeon.png (Sharm), castle2.png (the idiotmachine).
All CC-BY-SA 3.0 / GPL 3.0. Credits in CREDITS-LPC.md.
Usage: python3 -I tools/build_lpc_tiles.py <dir with the source PNGs> <out.png>"""
import sys
from PIL import Image
SRC,OUT=sys.argv[1],sys.argv[2]
def img(n):return Image.open(f'{SRC}/{n}').convert('RGBA')
I=img('Interior.png');CF=img('castlefloors.png');CW=img('castlewalls.png');DG=img('dungeon.png');C2=img('castle2_by_the_idiotmachine.png')
def ic(c,r):return I.crop((c*32,832+r*32,c*32+32,864+r*32))      # Interior.png floor block, 32px cells from y=832
def tint(cell,ramp):                                               # luminance -> colour ramp (dark..light)
    out=cell.copy();px=out.load()
    for y in range(32):
        for x in range(32):
            r,g,b,a=px[x,y];L=(r*299+g*587+b*114)/255000;i=min(len(ramp)-1,int(L*len(ramp)));px[x,y]=ramp[i]+(a,)
    return out
def mul(cell,f):
    out=cell.copy();px=out.load()
    for y in range(32):
        for x in range(32):
            r,g,b,a=px[x,y];px[x,y]=(int(r*f[0]),int(g*f[1]),int(b*f[2]),a)
    return out
violet=[(36,30,46),(58,50,72),(84,76,102),(112,104,132),(140,132,160),(170,162,188)]
cobble=CF.crop((160,224,192,256))
rust=[(30,16,12),(52,28,20),(78,44,30),(104,62,42),(132,84,58),(160,110,80)]
ROWS={
 'marrow':[cobble,cobble.transpose(Image.FLIP_LEFT_RIGHT),tint(CW.crop((56,224,88,256)),violet)],
 'grell':[ic(2,3),ic(3,2),ic(9,1)],                                    # planks, parquet, dark wood panelling
 'sable':[ic(3,1),mul(ic(0,5),(.82,.84,.95)),mul(ic(0,1),(.72,.74,.86))],# grey diamond flags, pale cold stone
 'kest':[tint(ic(0,1),rust),tint(cobble,rust),DG.crop((16,16,48,48))],  # forge flagstones, sooty cobble, red brick
 'dunmoor':[ic(2,4),ic(1,5),ic(9,0)],                                   # marble checker, diamond, blue wallpaper
 'hallow':[ic(1,4),ic(0,4),mul(C2.crop((32,192,64,224)),(.92,.82,.7))], # brown diamond, brown tile, candle-lit stone
 'hub':[ic(3,2),ic(2,3),ic(0,1)],                                       # parquet, planks, pale stone
}
ORDER=list(ROWS)
out=Image.new('RGBA',(96,32*len(ORDER)))
for i,k in enumerate(ORDER):
    for j,cell in enumerate(ROWS[k]):out.paste(cell,(j*32,i*32))
out.save(OUT,optimize=True)
print('rows',ORDER)
