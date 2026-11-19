// Render SVG files to transparent PNGs at their own size.
// usage: node tools/render_svg.js <scale> file1.svg [file2.svg ...]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const scale = parseFloat(process.argv[2]);
  const files = process.argv.slice(3);
  const browser = await chromium.launch();
  for (const f of files) {
    const svg = fs.readFileSync(f, 'utf8');
    const w = parseInt(svg.match(/width="(\d+)"/)[1]), h = parseInt(svg.match(/height="(\d+)"/)[1]);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: f.replace(/\.svg$/, '.png'), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
  }
  await browser.close();
})();
