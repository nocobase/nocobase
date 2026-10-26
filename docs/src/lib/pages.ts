import {
  getLanguage,
  LANGUAGES,
  localizePath,
} from '../../shared/languages.ts';
import {
  routeKey,
  routeToMarkdownPath,
  sourceToRoute,
} from '../../shared/routes.ts';
import overviewPages from '../components/CapabilityOverview/pages.en.json';
import { getDocEntries, type DocEntry } from './collection.js';
import { extractPageMeta } from './page-meta.ts';

/**
 * How a Markdown entry is presented. Most pages are `doc`: the Markdown body inside the documentation layout. The
 * others keep their Markdown source — it is what `llms.txt` and the page's `.md` copy publish — but render a
 * hand-built page instead of the body.
 */
export type PageKind =
  'doc' | 'home' | 'comparison' | 'capability-overview' | 'deployment';

export interface DocPage {
  entry: DocEntry;
  /** Source language key from `shared/languages.ts`: `en`, `cn`, `vi`. */
  language: string;
  /** Language-neutral route with its exact trailing-slash shape: `/capabilities/auth/`, `/capabilities/file`. */
  route: string;
  /** Public path including the language base: `/zh-CN/capabilities/file`. */
  path: string;
  /** Public path of the page's Markdown copy: `/zh-CN/capabilities/file.md`. */
  markdownPath: string;
  /** Source path relative to the language directory: `capabilities/auth/index.mdx`. */
  source: string;
  kind: PageKind;
  /** Capability module id for `capability-overview` pages. */
  module?: string;
  /** Page title without the site suffix: frontmatter `title`, else the `# Heading`. */
  title: string;
  /** The `# Heading` as written, which the document layout renders. */
  h1?: string;
  /** Frontmatter `description`, else the text before the first section. */
  description?: string;
  keywords?: string;
}

const OVERVIEW_MODULES = new Set(Object.keys(overviewPages));

function pageKind(
  route: string,
  pageName: string | undefined,
): { kind: PageKind; module?: string } {
  if (pageName === 'deployment') return { kind: 'deployment' };
  if (pageName === 'home') return { kind: 'home' };
  if (pageName === 'version-comparison') return { kind: 'comparison' };
  const module = /^\/capabilities\/([^/]+)\/?$/.exec(route)?.[1];
  if (module && OVERVIEW_MODULES.has(module))
    return { kind: 'capability-overview', module };
  return { kind: 'doc' };
}

let cache: Promise<DocPage[]> | undefined;

/** Every page of every language, in source order. */
export function getPages(): Promise<DocPage[]> {
  cache ??= load();
  return cache;
}

async function load(): Promise<DocPage[]> {
  const entries = await getDocEntries();
  return entries
    .map((entry) => {
      const [language, ...rest] = entry.id.split('/');
      const extension = entry.filePath?.endsWith('.mdx') ? '.mdx' : '.md';
      const source = `${rest.join('/')}${extension}`;
      const route = sourceToRoute(source);
      const meta = extractPageMeta(entry.body ?? '');
      const { title, description, keywords, pageName } = entry.data;
      return {
        entry,
        language,
        route,
        path: localizePath(language, route),
        markdownPath: localizePath(language, routeToMarkdownPath(route)),
        source,
        ...pageKind(route, pageName),
        title: title ?? meta.h1 ?? getLanguage(language).siteTitle,
        h1: meta.h1,
        description: description ?? meta.lead,
        keywords,
      } satisfies DocPage;
    })
    .sort((a, b) => a.entry.id.localeCompare(b.entry.id));
}

/** Find a page by language and route, accepting the route with or without its trailing slash. */
export function findPage(
  pages: readonly DocPage[],
  language: string,
  route: string,
): DocPage | undefined {
  const key = routeKey(route);
  return pages.find(
    (page) => page.language === language && routeKey(page.route) === key,
  );
}

/** The languages a route exists in, in the order `LANGUAGES` lists them. */
export function translationsOf(
  pages: readonly DocPage[],
  route: string,
): string[] {
  return LANGUAGES.filter(({ key }) => findPage(pages, key, route)).map(
    ({ key }) => key,
  );
}

/**
 * Static paths for one kind of page. Each kind has its own route file under `src/pages/`, because Astro bundles the
 * styles of every component a route file imports into every page that route builds: one route rendering all kinds
 * would ship the home page's styles on every Markdown page.
 *
 * - `doc`: `src/pages/[...slug].astro`, `slug` is the public path;
 * - `home`, `comparison`, `deployment`: `src/pages/[...base]/…`, `base` is the language base (`zh-CN`, or nothing for English);
 * - `capability-overview`: `src/pages/[...base]/capabilities/[module].astro`.
 */
export async function staticPathsOf(kind: PageKind) {
  const pages = await getPages();
  return pages
    .filter((page) => page.kind === kind)
    .map((page) => ({ params: paramsOf(page), props: { page } }));
}

function paramsOf(page: DocPage): Record<string, string | undefined> {
  const trim = (value: string) => value.replace(/^\/|\/$/g, '') || undefined;
  if (page.kind === 'doc') return { slug: trim(page.path) };
  const base = trim(getLanguage(page.language).base);
  return page.kind === 'capability-overview'
    ? { base, module: page.module }
    : { base };
}
