'use strict';
// Local smoke test for the static download page. No external network required.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(ROOT, p === '/' ? 'index.html' : p.replace(/^\/+/, ''));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const get = port => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: '/download.html', timeout: 5000 }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    const page = await get(port);
    const checks = [
      ['download.html returns 200', page.status === 200],
      ['download page contains Windows build', /GoBits-Setup-1\.1\.1\.exe/.test(page.body)],
      ['Windows build is a direct download', /href="https:\/\/github\.com\/mertmirackaplan\/Syclient-Web\/releases\/download\/SyclientLabs\/GoBits-Setup-1\.1\.1\.exe" download/.test(page.body)],
      ['activation form is gone', !/unlock-form|Enter your activation code|data-dl="windows"/.test(page.body)],
      ['download page has no missing macOS asset link', !/GoBits-1\.0\.2\.5\.dmg/.test(page.body)],
      ['download page has no missing Linux asset link', !/GoBits-1\.0\.2\.AppImage/.test(page.body)],
      ['macOS/Linux say coming soon', (page.body.match(/Coming soon/g) || []).length >= 2],
      ['offline demo section exists', /id="offline-demo"/.test(page.body) && /Demo mode/.test(page.body)],
      ['window checksum matches published asset', /fc5ec61815c0dff0fbaba0e1fee4d0596dc9e3a46dc9d33bdeb9fbcef7ad7a4a/.test(page.body)],
      ['contact email is real', /hello@syclientlabs\.com/.test(page.body) && !/hello@syclient\.labs/.test(page.body)],
      ['old cloud placeholder is gone', !/cloud\.gobits\.example/.test(page.body)],
      ['price links resolve to the live landing anchor', /https:\/\/www\.syclientlabs\.com\/#pricing/.test(page.body)]
    ];
    let fail = 0;
    for (const [name, ok] of checks) { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) fail++; }
    const index = await new Promise((resolve, reject) => { http.get({ host: '127.0.0.1', port, path: '/index.html' }, res => { let b = ''; res.on('data', d => b += d); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject); });
    const indexChecks = [
      ['landing page 200', index.status === 200],
      ['early-access form is gone', !/id="early-access"|id="waitlist-form"|Request an invite/.test(index.body)],
      ['product proof strip exists', /id="proof"/.test(index.body) && /Live on Product Hunt/.test(index.body)],
      ['price anchor exists', /id="pricing"/.test(index.body)],
      ['real email in landing page', /hello@syclientlabs\.com/.test(index.body) && !/hello@syclient\.labs/.test(index.body)],
      ['no cloud placeholder in landing page', !/cloud\.gobits\.example/.test(index.body)]
    ];
    for (const [name, ok] of indexChecks) { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) fail++; }
    process.exitCode = fail ? 1 : 0;
  } finally { server.close(); }
})();
