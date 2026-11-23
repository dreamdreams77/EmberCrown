#!/usr/bin/env python3
"""Packs the game into ONE self-contained HTML file (scripts, styles and every image inlined) so it can be opened from a
file or hosted anywhere, on a phone or a computer. usage: bundle.py <repo> <out.html>
Image paths are remapped at run time (Image.src), nothing in the game code is changed. The first-visit trailer is marked seen."""
import sys, os, re, base64, json
repo, out = sys.argv[1], sys.argv[2]
html = open(os.path.join(repo, 'index.html'), encoding='utf8').read()
assets = {}
for root, _, files in os.walk(os.path.join(repo, 'assets')):
    for f in files:
        if f.endswith('.png'):
            p = os.path.join(root, f); rel = os.path.relpath(p, repo).replace(os.sep, '/')
            assets[rel] = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
shim = ("try{localStorage.getItem('ec_intro_seen')||localStorage.setItem('ec_intro_seen','1')}catch(e){}\n"
        "window.__ASSETS=" + json.dumps(assets, separators=(',', ':')) + ";\n"
        "(function(){const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',"
        "{configurable:true,get(){return d.get.call(this)},set(v){d.set.call(this,window.__ASSETS[v]||v)}});})();")
def css(m):
    p = os.path.join(repo, m.group(1)); return '<style>' + open(p, encoding='utf8').read() + '</style>'
html = re.sub(r'<link rel="stylesheet" href="((?!http)[^"]+)">', css, html)
def js(m):
    p = os.path.join(repo, m.group(1)); return '<script>' + open(p, encoding='utf8').read().replace('</script', '<\\/script') + '</script>'
html = re.sub(r'<script src="((?!http)[^"]+)"></script>', js, html)
html = html.replace('<body', '<script>' + shim + '</script>\n<body', 1) if False else html.replace('<div id="app">', '<script>' + shim + '</script>\n<div id="app">', 1)
open(out, 'w', encoding='utf8').write(html)
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB', len(assets), 'images')
