import { routeKey } from '../../shared/routes.ts';
import { SITE_ORIGIN } from '../../shared/site.ts';
import type { HtmlPage } from './html.ts';

/**
 * `sitemap.xml` lists every emitted page that is indexable and is its own canonical URL, with the language
 * alternates its `<head>` declares. It is derived from the HTML rather than from the content collection, so a
 * hand-written page is listed as soon as it exists and a page marked `noindex` never is.
 */
export function buildSitemap(pages: readonly HtmlPage[]): {
  xml: string;
  count: number;
} {
  const entries = pages
    .filter((page) => page.canonical && !/noindex/i.test(page.robots ?? ''))
    .filter((page) => {
      const canonical = new URL(page.canonical!);
      return (
        canonical.origin === SITE_ORIGIN &&
        routeKey(canonical.pathname) === routeKey(page.directory)
      );
    })
    .map((page) => ({ loc: page.canonical!, alternates: page.alternates }))
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const body = entries.map(({ loc, alternates }) =>
    [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      ...alternates.map(
        ({ hreflang, href }) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
      ),
      '  </url>',
    ].join('\n'),
  );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...body,
    '</urlset>',
    '',
  ].join('\n');
  return { xml, count: entries.length };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
