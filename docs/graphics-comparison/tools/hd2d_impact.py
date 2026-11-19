#!/usr/bin/env python3
"""Measures what the HD-2D layer changes, using matched B (off) and C (on) frames from the same scene and seed.
Only the world area is measured (HUD panels and bars are masked out).
usage: hd2d_impact.py <rawDir> <outJson>"""
import sys, os, glob, json
import numpy as np
from PIL import Image
RAW, OUT = sys.argv[1], sys.argv[2]
def lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
def grad(L): return np.abs(np.diff(L,axis=1))[:-1]+np.abs(np.diff(L,axis=0))[:,:-1]
res = {}
for zoom in ('default','close'):
    for f in sorted(glob.glob(f'{RAW}/B/desktop/{zoom}/*.png')):
        sc = os.path.basename(f)[:-4]; g = f'{RAW}/C/desktop/{zoom}/{sc}.png'
        if not os.path.exists(g): continue
        B = np.asarray(Image.open(f).convert('RGB'),float); C = np.asarray(Image.open(g).convert('RGB'),float)
        Lb, Lc = lum(B), lum(C); d = Lc-Lb
        H, W = Lb.shape
        m = np.zeros((H,W),bool); m[62:636, 232:1090] = True            # world area only (clear of HUD panels)
        n = m.sum()
        r = {'bloom_cover_gt20_pct': round(float(((d>20)&m).sum()/n*100),2), 'bloom_cover_gt60_pct': round(float(((d>60)&m).sum()/n*100),2),
             'blown_out_ge245_off_pct': round(float(((Lb>=245)&m).sum()/n*100),3), 'blown_out_ge245_on_pct': round(float(((Lc>=245)&m).sum()/n*100),3),
             'blown_out_ge235_off_pct': round(float(((Lb>=235)&m).sum()/n*100),3), 'blown_out_ge235_on_pct': round(float(((Lc>=235)&m).sum()/n*100),3)}
        gb, gc = grad(Lb), grad(Lc); mm = m[:-1,:-1]
        glow = (d[:-1,:-1]>25)&mm
        r['detail_under_glow_on_vs_off'] = round(float(gc[glow].mean()/max(1e-6,gb[glow].mean())),3) if glow.sum()>400 else None
        bands = {'top(0-20%)':(0,.2),'middle(30-70%)':(.3,.7),'bottom(80-90%)':(.82,.9)}
        for name,(a,b) in bands.items():
            sl = slice(int(H*a), int(H*b)); cols = slice(300,1000)
            r['sharpness_on_vs_off_'+name] = round(float(gc[sl,cols].mean()/max(1e-6,gb[sl,cols].mean())),3)
        quiet = (np.abs(d)<6)&m                                           # unlit, unbloomed pixels: shows the grade alone
        r['grade_shift_rgb_in_unlit_areas'] = [round(float((C[...,i]-B[...,i])[quiet].mean()),1) for i in range(3)] if quiet.sum()>2000 else None
        r['mean_luma_world_off_on'] = [round(float(Lb[m].mean()),1), round(float(Lc[m].mean()),1)]
        res[f'{zoom}/{sc}'] = r
json.dump(res, open(OUT,'w'), indent=1)
# a readable digest
print(f"{'scene':26s} {'bloom>20%':>9s} {'bloom>60%':>9s} {'blown>=235 off->on':>20s} {'detail kept under glow':>23s} {'sharp top/mid/bot (on/off)':>28s}")
for k,v in res.items():
    if not k.startswith('default'): continue
    print(f"{k[8:]:26s} {v['bloom_cover_gt20_pct']:9.1f} {v['bloom_cover_gt60_pct']:9.2f} {v['blown_out_ge235_off_pct']:8.2f} -> {v['blown_out_ge235_on_pct']:6.2f} {str(v['detail_under_glow_on_vs_off']):>23s}   {v['sharpness_on_vs_off_top(0-20%)']:.2f} / {v['sharpness_on_vs_off_middle(30-70%)']:.2f} / {v['sharpness_on_vs_off_bottom(80-90%)']:.2f}")
