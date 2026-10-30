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
      ['Windows portable asset is published', /GoBits-Portable-1\.1\.2\.exe/.test(page.body)],
      ['Windows portable is a direct download', /href="https:\/\/github\.com\/mertmirackaplan\/Syclient-Web\/releases\/download\/SyclientLabs\/GoBits-Portable-1\.1\.2\.exe" download/.test(page.body)],
      ['macOS arm64 asset is published', /GoBits-1\.1\.2-arm64\.dmg/.test(page.body)],
      ['macOS x64 asset is published', /GoBits-1\.1\.2-x64\.dmg/.test(page.body)],
      ['all three downloads are direct', (page.body.match(/data-track="download_(?:windows|macos_arm64|macos_x64)"/g) || []).length === 3],
      ['activation form is gone', !/unlock-form|Enter your activation code|data-dl="windows"/.test(page.body)],
      ['no Linux card remains', !/Linux|AppImage/.test(page.body)],
      ['offline demo section exists', /id="offline-demo"/.test(page.body) && /Demo mode/.test(page.body)],
      ['Windows checksum matches the release', /b40f8284342542c142c398656bcde6e76b1743906f109d8b5fbb019592ec2b4e/.test(page.body)],
      ['macOS arm64 checksum matches the release', /397e04179a187ab74953c72f9e1e293375e638c57dba7e9162a9d81e4bc2ce03/.test(page.body)],
      ['macOS x64 checksum matches the release', /b2e99cc326105413f9f2f49a81dc116a6dbead181129fcb8767c241fc7f0a905/.test(page.body)],
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
