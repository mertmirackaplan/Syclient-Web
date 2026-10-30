/*
 * GoBits landing page — the ONE file to edit before you deploy.
 *
 * After changing SITE_URL, CONTACT_EMAIL or CLOUD_URL, run:   node scripts/set-domain.js
 * That rewrites canonical URLs, Open Graph tags, sitemap.xml, robots.txt,
 * JSON-LD, the contact links and the GoBits Cloud links (Download, Pricing,
 * Account) in every page so they match these values.
 */
window.GOBITS_CONFIG = {
  // Public URL of this site, no trailing slash.
  SITE_URL: 'https://www.syclientlabs.com',

  // Where people can reach you. Shown in the footer, legal pages and the mailto fallback.
  CONTACT_EMAIL: 'hello@syclientlabs.com',

  // Public site URL used for early-access links (the main site is live; cloud subdomains are not deployed yet).
  CLOUD_URL: 'https://www.syclientlabs.com',

  // Privacy-friendly analytics. Disabled by default. Loaded ONLY after the
  // visitor clicks "Accept" in the cookie banner.
  //   provider: ''          -> no analytics at all
  //   provider: 'plausible' -> loads `src` with data-domain = `domain`
  //   provider: 'script'    -> loads any script URL you trust in `src`
  ANALYTICS: {
    provider: '',
    domain: 'www.syclientlabs.com',
    src: 'https://plausible.io/js/script.js'
  }
};
