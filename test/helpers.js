// Shared setup for the browser tests: opens index.html in headless Chromium and
// collects anything the page reports as an error or warning.
const { chromium } = require('playwright');
const path = require('node:path');

const PAGE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

// Network noise that is not a game problem (the web font is optional).
const IGNORED = /fonts\.googleapis|fonts\.gstatic|Failed to load resource|ERR_/;

async function open({ touch = false, width = 800, height = 480, audio = false } = {}) {
  const browser = await chromium.launch({
    args: audio ? ['--autoplay-policy=no-user-gesture-required'] : []
  });
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch
  });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('page error: ' + e.message));
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type()) && !IGNORED.test(m.text())) {
      problems.push(m.type() + ': ' + m.text());
    }
  });
  await page.goto(PAGE_URL);
  await page.waitForFunction(() => typeof frame === 'function' && typeof startPlay === 'function');
  await page.waitForTimeout(150);
  return { browser, page, problems, close: () => browser.close() };
}

// Pointer events as a finger would send them, in game coordinates (800x480).
const POINTER_HELPER = () => {
  window.P = (type, id, x, y) => {
    const r = cv.getBoundingClientRect();
    cv.dispatchEvent(
      new PointerEvent('pointer' + type, {
        pointerId: id,
        pointerType: 'touch',
        clientX: r.left + (x / 800) * r.width,
        clientY: r.top + (y / 480) * r.height,
        bubbles: true,
        cancelable: true
      })
    );
  };
};

module.exports = { open, POINTER_HELPER, PAGE_URL };
