/**
 * The public origin every absolute URL the site emits is built on: canonical and alternate links, Open Graph URLs,
 * `sitemap.xml`, `robots.txt`. Set `DOCS_SITE_ORIGIN` to build the same output for another host, such as a staging
 * domain; it must not carry a path.
 */
export const SITE_ORIGIN = normalizeOrigin(
  process.env.DOCS_SITE_ORIGIN || 'https://docs.nocobase.com',
);

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      `DOCS_SITE_ORIGIN must be an origin without a path, got ${value}`,
    );
  }
  return url.origin;
}

/** Absolute URL of a public path on the site origin. */
export function absoluteUrl(pathname: string): string {
  return SITE_ORIGIN + pathname;
}
