import { localizePath } from '../../shared/languages.ts';
import { routeKey } from '../../shared/routes.ts';
import { findPage, type DocPage } from './pages.ts';
import { uiText } from './ui-text.ts';

/**
 * The sidebar, built from the `_meta.json` files next to the pages they order — the same files and the same entry
 * types the Rspress site read, so `check-meta-alignment.mjs` and `normalize-doc-links.mjs` keep checking what the
 * site renders.
 *
 * Every top-level directory gets its own sidebar from its `_meta.json`. Each capability module listed as a `dir` in
 * `capabilities/_meta.json` additionally gets a sidebar of its own, rooted at the module's `_meta.json` and headed by
 * a link back to the capability list, so a module's pages show only that module's navigation.
 */
export type SidebarItem =
  | { type: 'link'; text: string; href: string; newTab: boolean }
  | {
      type: 'group';
      text: string;
      href?: string;
      newTab?: boolean;
      items: SidebarItem[];
      collapsed: boolean;
    }
  | { type: 'section'; text: string }
  | { type: 'divider'; dashed: boolean };

interface MetaEntry {
  type?: string;
  name?: string;
  label?: string;
  link?: string;
  items?: unknown[];
  collapsed?: boolean;
  collapsible?: boolean;
  dashed?: boolean;
  /** `false` opens the link in a new tab instead of navigating the documentation. */
  proxy?: boolean;
}

const metaFiles = import.meta.glob<unknown>('/docs/*/**/_meta.json', {
  eager: true,
  import: 'default',
});

function readMeta(
  language: string,
  directory: string,
): MetaEntry[] | undefined {
  const meta = metaFiles[`/docs/${language}${directory}/_meta.json`];
  return Array.isArray(meta) ? (meta as MetaEntry[]) : undefined;
}

function isIndex(source: string): boolean {
  return /(^|\/)index\.mdx?$/.test(source);
}

class SidebarBuilder {
  constructor(
    private readonly language: string,
    private readonly pages: readonly DocPage[],
  ) {}

  /** Resolve a language-neutral link from `_meta.json` to the page's public URL, keeping any fragment. */
  href(link: string): string {
    if (/^[a-z][a-z\d+.-]*:/i.test(link)) return link;
    const hashIndex = link.indexOf('#');
    const route = hashIndex >= 0 ? link.slice(0, hashIndex) || '/' : link;
    const hash = hashIndex >= 0 ? link.slice(hashIndex) : '';
    const page = findPage(this.pages, this.language, route);
    return localizePath(this.language, page ? page.route : route) + hash;
  }

  link(text: string, link: string, entry?: MetaEntry): SidebarItem {
    const external = /^https?:\/\//i.test(link);
    return {
      type: 'link',
      text,
      href: this.href(link),
      newTab: external || entry?.proxy === false,
    };
  }

  entries(directory: string, entries: unknown[]): SidebarItem[] {
    const items: SidebarItem[] = [];
    for (const raw of entries) {
      if (typeof raw === 'string') {
        items.push(
          this.link(raw, raw === 'index' ? directory : `${directory}/${raw}`),
        );
        continue;
      }
      if (!raw || typeof raw !== 'object') continue;
      const entry = raw as MetaEntry;
      const label = entry.label ?? entry.name ?? '';

      if (entry.type === 'section-header') {
        if (Array.isArray(entry.items)) {
          items.push({
            type: 'group',
            text: label,
            items: this.entries(directory, entry.items),
            collapsed: entry.collapsed !== false,
          });
        } else {
          items.push({ type: 'section', text: label });
        }
      } else if (entry.type === 'divider') {
        items.push({ type: 'divider', dashed: Boolean(entry.dashed) });
      } else if (entry.type === 'file' && entry.name) {
        items.push(
          this.link(
            label,
            entry.name === 'index'
              ? directory || '/'
              : `${directory}/${entry.name}`,
          ),
        );
      } else if (
        (entry.type === 'dir' || entry.type === 'custom-link') &&
        entry.name &&
        !Array.isArray(entry.items)
      ) {
        items.push({
          type: 'group',
          text: label,
          items: this.directory(`${directory}/${entry.name}`),
          collapsed: entry.collapsed === true,
        });
      } else if (entry.type === 'dir-section-header' && entry.name) {
        items.push(
          { type: 'section', text: label },
          ...this.directory(`${directory}/${entry.name}`),
        );
      } else if (
        (entry.type === 'custom-link' || entry.type === 'dir') &&
        Array.isArray(entry.items)
      ) {
        const group: SidebarItem = {
          type: 'group',
          text: label,
          items: this.entries(directory, entry.items),
          collapsed: entry.collapsed === true,
        };
        if (entry.link) {
          const target = this.link(label, entry.link, entry) as Extract<
            SidebarItem,
            { type: 'link' }
          >;
          group.href = target.href;
          group.newTab = target.newTab;
        }
        items.push(group);
      } else if (entry.type === 'custom-link' && entry.link) {
        items.push(this.link(label, entry.link, entry));
      }
    }
    return items;
  }

  /** A directory's own `_meta.json`, or its pages in file order when it has none. */
  directory(directory: string): SidebarItem[] {
    const meta = readMeta(this.language, directory);
    if (meta) return this.entries(directory, meta);
    const prefix = `${directory.replace(/^\//, '')}/`;
    return this.pages
      .filter(
        (page) =>
          page.language === this.language && page.source.startsWith(prefix),
      )
      .filter((page) => !page.source.slice(prefix.length).includes('/'))
      .sort(
        (a, b) =>
          Number(isIndex(b.source)) - Number(isIndex(a.source)) ||
          a.source.localeCompare(b.source),
      )
      .map((page) =>
        this.link(
          page.source.slice(prefix.length).replace(/\.mdx?$/, ''),
          page.route,
        ),
      );
  }
}

export interface Sidebar {
  /** Language-neutral route prefix the sidebar applies to, such as `/capabilities` or `/capabilities/auth`. */
  root: string;
  items: SidebarItem[];
}

/** Every sidebar of a language, keyed by the route prefix it covers. */
export function buildSidebars(
  language: string,
  pages: readonly DocPage[],
): Sidebar[] {
  const builder = new SidebarBuilder(language, pages);
  const sidebars: Sidebar[] = [];
  const topLevel = new Set(
    pages
      .filter((page) => page.language === language && page.source.includes('/'))
      .map((page) => page.source.split('/')[0]),
  );
  for (const directory of [...topLevel].sort()) {
    sidebars.push({
      root: `/${directory}`,
      items: builder.directory(`/${directory}`),
    });
  }

  const modules = (readMeta(language, '/capabilities') ?? []).filter(
    (entry) => entry.type === 'dir' && typeof entry.name === 'string',
  );
  for (const module of modules) {
    const root = `/capabilities/${module.name}`;
    sidebars.push({
      root,
      items: [
        builder.link(uiText(language).backToCapabilities, '/#capabilities'),
        { type: 'divider', dashed: false },
        { type: 'section', text: module.label ?? module.name ?? '' },
        ...builder.directory(root),
      ],
    });
  }
  return sidebars;
}

/** The sidebar whose root is the longest prefix of the route, matched on whole path segments. */
export function sidebarFor(
  sidebars: readonly Sidebar[],
  route: string,
): Sidebar | undefined {
  const key = routeKey(route);
  return sidebars
    .filter(({ root }) => key === root || key.startsWith(`${root}/`))
    .sort((a, b) => b.root.length - a.root.length)[0];
}

/** Every page link in reading order, the sequence previous and next page links follow. */
export function flattenLinks(
  items: readonly SidebarItem[],
): { text: string; href: string }[] {
  const links: { text: string; href: string }[] = [];
  for (const item of items) {
    if (item.type === 'link' && !item.newTab) links.push(item);
    if (item.type === 'group') {
      if (item.href && !item.newTab)
        links.push({ text: item.text, href: item.href });
      links.push(...flattenLinks(item.items));
    }
  }
  // Links to a fragment of another page, such as the way back to the home page's capability list, are navigation
  // aids rather than pages in the sequence.
  return links.filter(
    (link, index) =>
      !link.href.includes('#') &&
      links.findIndex(({ href }) => href === link.href) === index,
  );
}

/** Whether a group contains the page at `path`, so it renders expanded. */
export function containsPath(
  items: readonly SidebarItem[],
  path: string,
): boolean {
  return items.some(
    (item) =>
      (item.type === 'link' && item.href === path) ||
      (item.type === 'group' &&
        (item.href === path || containsPath(item.items, path))),
  );
}
