'use strict';
// Browser smoke test for the static site: no network assets required.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(ROOT, p === '/' ? 'index.html' : p.replace(/^\/+/, ''));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser = null, fail = 0;
  const check = (name, ok, detail = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' :: ' + detail)); if (!ok) fail++; };
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + '/download.html', { waitUntil: 'networkidle' });
    check('download page renders', (await page.title()).includes('Windows and macOS'), await page.title());
    check('three platform cards render', (await page.locator('.dl-card').count()) === 3, String(await page.locator('.dl-card').count()));
    check('Windows download is direct', await page.locator('a[download][data-track="download_windows"]').count() === 1 && (await page.locator('a[download][data-track="download_windows"]').getAttribute('href')).includes('GoBits-Portable-1.1.2.exe'));
    check('macOS arm64 and x64 downloads are direct', (await page.locator('a[download][data-track^="download_macos_"]').count()) === 2);
    check('offline demo section is visible', await page.locator('#offline-demo').isVisible());
    check('no activation form remains', await page.locator('#unlock-form').count() === 0);
    check('no browser page errors', errors.length === 0, errors.join(' | '));
    const reject = page.locator('[data-consent="reject"]'); if (await reject.count()) await reject.click().catch(() => {}); await page.locator('#downloads').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(ROOT, '..', 'qa-screens', 'download-after-1366.png'), animations: 'disabled' });

    const home = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await home.goto(base + '/index.html', { waitUntil: 'networkidle' });
    const homeReject = home.locator('[data-consent="reject"]'); if (await homeReject.count()) await homeReject.click().catch(() => {});
    check('proof strip is visible', await home.locator('#proof').isVisible());
    check('Product Hunt proof link exists', await home.locator('#proof a[href*="producthunt"]').count() === 1);
    check('public release proof link exists', await home.locator('#proof a[href*="releases"]').count() === 1);
    check('real contact mailto exists', (await home.locator('a[href="mailto:hello@syclientlabs.com"]').count()) > 0);
    check('no old placeholder email', (await home.locator('a[href="mailto:hello@syclient.labs"]').count()) === 0);
    check('pricing CTA points at live anchor', (await home.locator('a[href="https://www.syclientlabs.com/#pricing"]').count()) > 0);
    check('early-access form is gone', (await home.locator('#early-access, #waitlist-form').count()) === 0);
    await home.locator('#proof').scrollIntoViewIfNeeded(); await home.screenshot({ path: path.join(ROOT, '..', 'qa-screens', 'landing-proof-1366.png'), animations: 'disabled' });
  } catch (e) { check('browser smoke', false, e.stack || e.message); }
  finally { if (browser) await browser.close(); server.close(); }
  process.exitCode = fail ? 1 : 0;
})();
