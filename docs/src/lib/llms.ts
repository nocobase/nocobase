import path from 'node:path';
import { getLanguage } from '../../shared/languages.ts';
import { routeKey } from '../../shared/routes.ts';
import type { DocPage } from './pages.ts';
import { buildSidebars, flattenLinks, sidebarFor } from './sidebar.ts';

/**
 * The machine-readable copies of the documentation, in the shapes the Rspress llms plugin published:
 *
 * - `<page>.md` next to every page (`/capabilities/file.md`, `/capabilities/auth/index.md`), its Markdown source
 *   without frontmatter and with links to other pages pointing at their `.md` copies;
 * - `llms.txt` per language, an index of those copies grouped by the top navigation;
 * - `llms-full.txt` per language, every copy concatenated.
 */

const LINK = /(!?)\[([^\]\n]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/** Resolve a relative link in a page's source to the page it names, using the page list rather than the disk. */
export function resolveRelativeSource(
  page: DocPage,
  url: string,
  pages: readonly DocPage[],
): { target: DocPage; suffix: string } | undefined {
  if (!url.startsWith('./') && !url.startsWith('../')) return undefined;
  const index = url.search(/[?#]/);
  const file = index >= 0 ? url.slice(0, index) : url;
  if (!/\.mdx?$/.test(file)) return undefined;
  const source = path.posix.normalize(
    path.posix.join(path.posix.dirname(page.source), decodeURI(file)),
  );
  // `./index.md` also names `index.mdx`, as it did on the Rspress site.
  const base = source.replace(/\.mdx?$/, '');
  const target =
    pages.find(
      (candidate) =>
        candidate.language === page.language && candidate.source === source,
    ) ??
    pages.find(
      (candidate) =>
        candidate.language === page.language &&
        candidate.source.replace(/\.mdx?$/, '') === base,
    );
  return target
    ? { target, suffix: index >= 0 ? url.slice(index) : '' }
    : undefined;
}

/** The page's Markdown copy. */
export function markdownCopy(page: DocPage, pages: readonly DocPage[]): string {
  const body = (page.entry.body ?? '').replace(/^\s*\n/, '');
  if (body.trim() === '') return '\n';
  let fence: string | undefined;
  const copy = body
    .split('\n')
    .map((line) => {
      const fenceMatch = FENCE.exec(line);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (!fence) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length)
          fence = undefined;
        return line;
      }
      if (fence) return line;
      return line.replace(
        LINK,
        (
          match,
          bang: string,
          label: string,
          url: string,
          title: string | undefined,
        ) => {
          if (bang) return match;
          const resolved = resolveRelativeSource(page, url, pages);
          if (!resolved) return match;
          return `[${label}](${resolved.target.markdownPath}${resolved.suffix}${title ?? ''})`;
        },
      );
    })
    .join('\n');
  return copy.endsWith('\n') ? copy : `${copy}\n`;
}

interface NavItem {
  text: string;
  link?: string;
}

const navFiles = import.meta.glob<NavItem[]>('/docs/*/_nav.json', {
  eager: true,
  import: 'default',
});

function navOf(language: string): NavItem[] {
  return navFiles[`/docs/${language}/_nav.json`] ?? [];
}

interface Section {
  title: string;
  pages: DocPage[];
}

/**
 * Pages grouped by the top navigation entry whose route they fall under, in sidebar order; pages under no entry go
 * to a final "Other" section.
 */
export function llmsSections(
  language: string,
  pages: readonly DocPage[],
): Section[] {
  const languagePages = pages.filter((page) => page.language === language);
  const nav = navOf(language).filter((item): item is Required<NavItem> =>
    Boolean(item.link?.startsWith('/')),
  );
  const sections: Section[] = nav.map(({ text }) => ({
    title: text,
    pages: [],
  }));
  const other: Section = { title: 'Other', pages: [] };
  for (const page of languagePages) {
    const key = routeKey(page.route);
    const index = nav.findIndex(({ link }) => {
      const prefix = routeKey(link);
      return key === prefix || key.startsWith(`${prefix}/`);
    });
    (index >= 0 ? sections[index] : other).pages.push(page);
  }

  const sidebars = buildSidebars(language, pages);
  for (const section of sections) {
    const first = section.pages[0];
    const sidebar =
      first && sidebarFor(sidebars, `/${first.route.split('/')[1] ?? ''}`);
    const order = sidebar ? orderOf(sidebar.items, sidebars) : [];
    const rank = (page: DocPage) => {
      const position = order.indexOf(page.path);
      return position < 0 ? Number.MAX_SAFE_INTEGER : position;
    };
    section.pages.sort(
      (a, b) => rank(a) - rank(b) || a.source.localeCompare(b.source),
    );
  }
  return [...sections, other].filter((section) => section.pages.length > 0);
}

/** Reading order of a section: its sidebar, with each module expanded by the module's own sidebar. */
function orderOf(
  items: Parameters<typeof flattenLinks>[0],
  sidebars: ReturnType<typeof buildSidebars>,
): string[] {
  const order: string[] = [];
  for (const { href } of flattenLinks(items)) {
    if (!order.includes(href)) order.push(href);
  }
  for (const sidebar of sidebars) {
    for (const { href } of flattenLinks(sidebar.items)) {
      if (!order.includes(href)) order.push(href);
    }
  }
  return order;
}

export function llmsTxt(language: string, pages: readonly DocPage[]): string {
  const { siteTitle, siteDescription } = getLanguage(language);
  const lines: string[] = [];
  for (const section of llmsSections(language, pages)) {
    const entries = section.pages
      .filter((page) => page.route !== '/')
      .map(
        (page) =>
          `- [${page.title}](${page.markdownPath})${page.description ? `: ${page.description}` : ''}`,
      );
    if (entries.length > 0) lines.push(`\n## ${section.title}\n`, ...entries);
  }
  return `# ${siteTitle}\n\n> ${siteDescription}\n${lines.join('\n')}`;
}

export function llmsFullTxt(
  language: string,
  pages: readonly DocPage[],
): string {
  const parts: string[] = [];
  for (const section of llmsSections(language, pages)) {
    for (const page of section.pages) {
      parts.push(
        `---\nurl: ${page.markdownPath}\n---\n`,
        markdownCopy(page, pages),
        '\n',
      );
    }
  }
  return parts.join('\n');
}
