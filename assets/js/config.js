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
  CONTACT_EMAIL: 'hello@syclient.labs',

  // Public URL of GoBits Cloud (serves /download, /pricing and /account), no trailing slash.
  CLOUD_URL: 'https://cloud.gobits.example',

  // Early-access form target: the GoBits Cloud waitlist endpoint, e.g.
  //   'https://cloud.gobits.example/v1/waitlist'
  // Leave empty ('') and the form opens the visitor's email app with a
  // prefilled request to CONTACT_EMAIL instead (the page says so honestly).
  WAITLIST_ENDPOINT: '',

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
