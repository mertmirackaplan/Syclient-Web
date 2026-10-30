# GoBits landing page

A static marketing site for GoBits: plain HTML, CSS and JavaScript. It has no build step, no
framework and no external fonts or CDNs. The only third-party requests are the Product Hunt badge
images on the home page (`api.producthunt.com`, `ph-files.imgix.net`). Upload the folder to any static host (Netlify, Vercel,
Cloudflare Pages, GitHub Pages, S3, nginx…), with this folder as the site root.

## Before you go live

1. **Set your domain and email.** Edit `assets/js/config.js` (`SITE_URL`, `CONTACT_EMAIL`, `CLOUD_URL`), then run:

   ```bash
   node scripts/set-domain.js            # add --dry-run to preview
   # or in one go:
   node scripts/set-domain.js --site https://your-domain.com --email hello@syclientlabs.com --cloud https://cloud.your-domain.com
   ```

   This rewrites the canonical URLs, Open Graph/Twitter tags, JSON-LD, `sitemap.xml`, `robots.txt`
   and the contact links in every page.
2. **No signup form.** The site has no early-access form or waitlist UI. Contact links use `CONTACT_EMAIL`; the GoBits Cloud waitlist endpoint is not wired to the static site.

3. **Analytics** (optional, off by default). In `config.js`, set
   `ANALYTICS: { provider: 'plausible', domain: 'your-domain.com', src: 'https://plausible.io/js/script.js' }`.
   It loads only after a visitor clicks **Accept** in the cookie banner. `provider: 'script'`
   loads any HTTPS script URL you trust.
4. **Legal pages.** Replace `[Your legal entity]` in `privacy.html` and `terms.html`, and
   `[jurisdiction]` in `terms.html`. Have both reviewed by a lawyer before launch.
5. **404 page.** Most hosts serve `404.html` automatically (Netlify, Vercel, Cloudflare Pages,
   GitHub Pages). On nginx, use `error_page 404 /404.html;`.

## Download page

`download.html` links directly to the public Windows GitHub release. There is no activation-code gate, account, cookie or server-side check. macOS and Linux are shown as coming-soon cards until their builds exist, so the page never points at missing files.

- Windows: `https://github.com/mertmirackaplan/Syclient-Web/releases/download/SyclientLabs/GoBits-Setup-1.1.1.exe`
- Public SHA-256 is shown on the page and in `download.html`.
- The release asset is public; do not treat the public URL as a security boundary.
- Offline demo: after installation, choose Demo mode in setup. No key, account or network is needed.

## Clean URLs

`vercel.json` turns on Vercel's clean URLs: `/download` serves `download.html`, and `/download.html` 308-redirects
to `/download` (same for `/privacy` and `/terms`). Upload `vercel.json` with the site, or enable **Clean URLs** in
the Vercel project settings; without it the clean paths 404. Internal links keep the `.html` so the folder also
works with a plain static preview; on Vercel they redirect to the clean URL. On another host, add the equivalent
rewrite.

## Product Hunt embeds

The home page shows the Product Hunt "Featured" badge in the hero and the footer, plus a launch card in the
"We're on Product Hunt" section (`#product-hunt`). The links, UTM parameters and
image URLs are exactly as Product Hunt issued them. The card is restyled with the site's own classes
(`.ph-card`, `.btn-ph`, `.ph-badge` in `site.css`), so it has no inline styles. The images are plain `<img>`
tags, not scripts or trackers, so the cookie banner doesn't gate them; `privacy.html` mentions them. Clicks
are counted (`ph_badge_hero`, `ph_card`, `ph_badge_footer`) only if the visitor accepted analytics.
Product Hunt's CDN sets Cloudflare's short-lived `__cf_bm` bot-protection cookie on the badge image response,
so Lighthouse lists it under "third-party cookies" (Best Practices drops to about 78–79). It can't be removed
without self-hosting the badge, which would freeze its live upvote count. `api.producthunt.com` sends no CORS
headers, so `crossorigin="anonymous"` would break the image.

If you add a Content-Security-Policy on your host, allow the badge images, for example:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: https://api.producthunt.com https://ph-files.imgix.net; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://<your-cloud>; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

(`'unsafe-inline'` covers the small inline `class="js"` script and the sprite `style` attributes. Add your analytics
host to `script-src` and `connect-src` if you turn analytics on.)

## Files

| Path | What |
|---|---|
| `index.html` | The landing page |
| `download.html` | Download page: direct Windows build, macOS/Linux coming soon |
| `vercel.json` | Clean URLs on Vercel (`/download` instead of `/download.html`) |
| `thank-you.html` | Shown after a successful sign-up (noindex) |
| `404.html` | "Lost Bit" not-found page (absolute asset paths, so it works at any URL) |
| `privacy.html`, `terms.html` | Legal pages |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | SEO and app metadata |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png` | Icons and the 1200×630 social card |
| `assets/js/config.js` | **The one config file** |
| `assets/js/site.js` | Menu, cookie consent + analytics loader, form, gallery lightbox, sticky mobile CTA, hash-free section scrolling |
| `assets/js/office.js` | The live pixel office in "How it works" (static under reduced motion) |
| `assets/css/site.css` | All styles |
| `assets/img/` | Pixel art exported from the app, plus `shots/` (real screenshots as WebP 400–2400 w with PNG fallback) |
| `assets/fonts/` | Inter (variable, SIL OFL 1.1, `LICENSE-Inter.txt`) for text and Silkscreen (SIL OFL 1.1, `LICENSE-Silkscreen.txt`, converted to WOFF2 unmodified) for small pixel labels. Press Start 2P (`OFL.txt`) is kept but no longer used by the light theme |
| `scripts/set-domain.js` | The domain and email rewriter (Node, no dependencies) |

## Preview locally

Any static server works, for example `npx serve .` or `python3 -m http.server 8080` in this folder.
Opening `index.html` directly from disk also works, except for `404.html`, which uses root paths.
