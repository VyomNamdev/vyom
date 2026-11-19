// Render SVG files to PNG with the pre-installed Chromium.
// usage: node tools/render.js in.svg [more.svg ...]   (writes in.png next to each)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  for (const f of process.argv.slice(2)) {
    const svg = fs.readFileSync(f, 'utf8');
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const out = f.replace(/\.svg$/, '.png');
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    console.log('rendered', path.basename(out));
  }
  await browser.close();
})();
