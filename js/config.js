// Canvas, scale and global constants.
'use strict';

/* Plain Wax: a stealth prototype. Keyboard or touch. */
const T = 32,
  GW = 25,
  GH = 15;
const cv = document.getElementById('c');
const MAINCTX = cv.getContext('2d');
let ctx = MAINCTX;
// render at 2x on big or high-DPI screens so outlines stay crisp when the canvas is scaled up
let RES = Math.min(innerWidth, (innerHeight * 800) / 480) * (devicePixelRatio || 1) > 1000 ? 2 : 1;
cv.width = GW * T * RES;
cv.height = GH * T * RES;
