#!/usr/bin/env node
'use strict';
/*
 * Rewrites the site URL and contact email across the landing page in one step.
 *
 *   1) Edit SITE_URL and CONTACT_EMAIL in assets/js/config.js, then run:
 *        node scripts/set-domain.js
 *   2) Or pass them directly (this also updates config.js):
 *        node scripts/set-domain.js --site https://gobits.app --email hello@syclientlabs.com --cloud https://www.syclientlabs.com
 *   Add --dry-run to only print what would change.
 *
 * It replaces the previously applied values (remembered in scripts/domain.lock.json) in every
 * .html file, sitemap.xml, robots.txt and config.js: canonical URLs, Open Graph/Twitter tags,
 * JSON-LD, the sitemap, the robots Sitemap line, mailto links and the GoBits Cloud links (Download,
 * Pricing, Account). No dependencies.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const LOCK = path.join(__dirname, 'domain.lock.json');
const CONFIG = path.join(ROOT, 'assets', 'js', 'config.js');

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dry = args.includes('--dry-run');

function readConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(CONFIG, 'utf8'), sandbox, { timeout: 1000 });
  return sandbox.window.GOBITS_CONFIG || {};
}
function fail(msg) { console.error('✖ ' + msg); process.exit(1); }

const cfg = readConfig();
const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
const site = String(flag('--site') || cfg.SITE_URL || '').trim().replace(/\/+$/, '');
const email = String(flag('--email') || cfg.CONTACT_EMAIL || '').trim();
const cloud = String(flag('--cloud') || cfg.CLOUD_URL || lock.cloudUrl || '').trim().replace(/\/+$/, '');

let u;
try { u = new URL(site); } catch (e) { fail(`SITE_URL is not a valid URL: "${site}"`); }
if (!/^https?:$/.test(u.protocol) || (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) fail('SITE_URL must look like https://example.com (no path, query or hash).');
let cu; try { cu = new URL(cloud); } catch (e) { fail(`CLOUD_URL is not a valid URL: "${cloud}"`); }
if (!/^https?:$/.test(cu.protocol) || (cu.pathname !== '/' && cu.pathname !== '') || cu.search || cu.hash) fail('CLOUD_URL must look like https://cloud.example.com (no path, query or hash).');
if (!/^[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}$/.test(email)) fail(`CONTACT_EMAIL is not a valid email: "${email}"`);

const oldHost = new URL(lock.siteUrl).host;
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name.startsWith('.')) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(html|xml|txt|webmanifest)$/.test(f.name) || p === CONFIG) files.push(p);
  }
})(ROOT);

const rep = (s, a, b) => (a === b ? s : s.split(a).join(b));
let changed = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  let s = before;
  s = rep(s, lock.email, email);          // email first, so a shared domain isn't half-replaced
  if (lock.cloudUrl) s = rep(s, lock.cloudUrl, cloud); // before the site URL (it may contain the site host)
  s = rep(s, lock.siteUrl, site);
  if (f === CONFIG) {
    s = s.replace(/(SITE_URL:\s*)'[^']*'/, `$1'${site}'`).replace(/(CONTACT_EMAIL:\s*)'[^']*'/, `$1'${email}'`).replace(/(CLOUD_URL:\s*)'[^']*'/, `$1'${cloud}'`);
    s = s.replace(new RegExp(`(domain:\\s*)'${oldHost.replace(/\./g, '\\.')}'`), `$1'${u.host}'`);
  }
  if (s !== before) {
    changed++;
    console.log((dry ? 'would update ' : 'updated ') + path.relative(ROOT, f));
    if (!dry) fs.writeFileSync(f, s);
  }
}
if (!dry) fs.writeFileSync(LOCK, JSON.stringify({ siteUrl: site, email, cloudUrl: cloud }, null, 2) + '\n');
console.log(`${dry ? 'Dry run: ' : ''}${changed} file(s) ${dry ? 'would change' : 'changed'}. Site: ${site}  Email: ${email}  Cloud: ${cloud}`);
