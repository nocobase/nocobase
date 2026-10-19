/**
 * Public origin of this documentation site, used for canonical links, hreflang alternates, the sitemap, robots.txt,
 * structured data and the docs assistant. Override it with `DOCS_SITE_ORIGIN` at build time; the default is the v2
 * documentation host, so builds that do not set the variable (such as CI) produce correct output.
 *
 * Node-side only: browser code reads the same value from `import.meta.env.DOCS_SITE_ORIGIN`, which
 * `rspress.config.ts` injects at build time.
 */
export const siteOrigin = (
  process.env.DOCS_SITE_ORIGIN || 'https://nocode.docs.nocobase.com'
).replace(/\/+$/, '');

export const siteHost = new URL(siteOrigin).host;

/**
 * The host the v2 documentation used to be served from. It will later serve the NocoBase 3 documentation, so absolute
 * links to it in v2 content are rewritten to `siteOrigin` at build time.
 */
export const LEGACY_DOCS_HOST = 'docs.nocobase.com';

const LEGACY_DOCS_ORIGIN_REGEX = /^https?:\/\/docs\.nocobase\.com(?=[/?#]|$)/i;

/**
 * Rewrites an absolute `http(s)://docs.nocobase.com` URL to the same path, query and hash on `siteOrigin`. Any other
 * URL, including other `*.docs.nocobase.com` hosts, is returned unchanged.
 */
export function rewriteLegacyDocsUrl(url: string): string {
  return url.replace(LEGACY_DOCS_ORIGIN_REGEX, siteOrigin);
}
