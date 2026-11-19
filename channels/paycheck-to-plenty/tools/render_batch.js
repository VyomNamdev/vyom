// Batch-render many SVGs to transparent PNGs, reusing pages. usage: node render_batch.js <scale> <listfile>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const scale = parseFloat(process.argv[2]);
  const files = fs.readFileSync(process.argv[3], 'utf8').split('\n').filter(Boolean);
  const browser = await chromium.launch();
  const N = 4;
  const chunks = Array.from({ length: N }, (_, i) => files.filter((_, j) => j % N === i));
  await Promise.all(chunks.map(async (list) => {
    let page = null, size = '';
    for (const f of list) {
      const svg = fs.readFileSync(f, 'utf8');
      const w = parseInt(svg.match(/width="(\d+)"/)[1]), h = parseInt(svg.match(/height="(\d+)"/)[1]);
      if (`${w}x${h}` !== size) {
        if (page) await page.close();
        page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
        size = `${w}x${h}`;
      }
      await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
      await page.screenshot({ path: f.replace(/\.svg$/, '.png'), omitBackground: true });
    }
    if (page) await page.close();
  }));
  await browser.close();
})();
