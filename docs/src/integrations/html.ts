import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { SITE_ORIGIN } from '../../shared/site.ts';

/** What the site-wide build steps need to know about one emitted HTML page. */
export interface HtmlPage {
  /** Path of the file relative to the output directory, with forward slashes: `capabilities/file/index.html`. */
  file: string;
  /** Public path the CDN serves the file at, without its trailing slash shape: `/capabilities/file/`. */
  directory: string;
  canonical?: string;
  robots?: string;
  alternates: { hreflang: string; href: string }[];
  /** `data-layout` of `<body>`; fragments are only checked on pages whose headings are in the HTML. */
  layout?: string;
  ids: Set<string>;
  links: string[];
}

const SKIPPED_DIRECTORIES = new Set(['_astro', 'pagefind']);

export async function readHtmlPages(outDir: string): Promise<HtmlPage[]> {
  const files = (await fs.readdir(outDir, { recursive: true }))
    .map((file) => file.split(path.sep).join('/'))
    .filter(
      (file) =>
        file.endsWith('.html') && !SKIPPED_DIRECTORIES.has(file.split('/')[0]),
    );
  return Promise.all(
    files
      .sort()
      .map(async (file) =>
        parseHtmlPage(file, await fs.readFile(path.join(outDir, file), 'utf8')),
      ),
  );
}

export function parseHtmlPage(file: string, html: string): HtmlPage {
  const head = html.slice(0, html.indexOf('</head>') + 1 || undefined);
  const tags = [...head.matchAll(/<(?:link|meta)\b[^>]*>/g)].map(([tag]) =>
    attributes(tag),
  );
  return {
    file,
    directory: `/${file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')}`,
    canonical: tags.find((tag) => tag.rel === 'canonical')?.href,
    robots: tags.find((tag) => tag.name === 'robots')?.content,
    alternates: tags
      .filter((tag) => tag.rel === 'alternate' && tag.hreflang && tag.href)
      .map((tag) => ({ hreflang: tag.hreflang, href: tag.href })),
    layout: /<body\b[^>]*\bdata-layout="([^"]*)"/.exec(html)?.[1],
    ids: new Set(
      [...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => decodeEntities(id)),
    ),
    links: [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map(([, href]) =>
      decodeEntities(href),
    ),
  };
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [, name, value] of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g))
    result[name] = decodeEntities(value);
  return result;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** The file the CDN serves for a public path: `/x` and `/x/` are `x/index.html`, a path with an extension is itself. */
export function fileForPath(pathname: string): string {
  const relative = pathname.replace(/^\//, '');
  if (relative === '' || relative.endsWith('/')) return `${relative}index.html`;
  const last = relative.split('/').pop() ?? '';
  return last.includes('.') ? relative : `${relative}/index.html`;
}

export interface LinkProblem {
  page: string;
  href: string;
  reason: string;
}

/**
 * Every `<a href>` that points into the site must reach a file the build emitted, and a fragment must name an
 * element of the target page. Fragments on hand-built pages that create their content in the browser are not
 * checked, since their ids do not exist in the HTML. Canonical and alternate links must stay on the site origin and
 * reach a page too.
 */
export function checkLinks(
  outDir: string,
  pages: readonly HtmlPage[],
): LinkProblem[] {
  const byFile = new Map(pages.map((page) => [page.file, page]));
  const problems: LinkProblem[] = [];
  const exists = (file: string) =>
    byFile.has(file) || existsSync(path.join(outDir, file));

  for (const page of pages) {
    const base = new URL(page.directory, SITE_ORIGIN);
    for (const href of page.links) {
      if (!href || /^(mailto|tel|javascript|data):/i.test(href)) continue;
      let url: URL;
      try {
        url = new URL(href, base);
      } catch {
        problems.push({ page: page.file, href, reason: 'malformed URL' });
        continue;
      }
      if (url.origin !== SITE_ORIGIN) continue;
      const target = fileForPath(decodeURIComponent(url.pathname));
      if (!exists(target)) {
        problems.push({ page: page.file, href, reason: `no file ${target}` });
        continue;
      }
      const fragment = decodeURIComponent(url.hash.slice(1));
      const targetPage = byFile.get(target);
      if (
        fragment &&
        targetPage?.layout === 'doc' &&
        !targetPage.ids.has(fragment)
      ) {
        problems.push({
          page: page.file,
          href,
          reason: `no element with id "${fragment}" in ${target}`,
        });
      }
    }
    for (const href of [
      page.canonical,
      ...page.alternates.map(({ href }) => href),
    ]) {
      if (!href) continue;
      if (!href.startsWith(`${SITE_ORIGIN}/`)) {
        problems.push({
          page: page.file,
          href,
          reason: `not on the site origin ${SITE_ORIGIN}`,
        });
      } else if (!exists(fileForPath(new URL(href).pathname))) {
        problems.push({
          page: page.file,
          href,
          reason: 'canonical or alternate page does not exist',
        });
      }
    }
  }
  return problems;
}
