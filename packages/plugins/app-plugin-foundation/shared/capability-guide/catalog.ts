/**
 * The capability catalog of one application. What is listed comes from the application's own `package.json`: every
 * declared plugin (examples and Skill-only plugins included) and the core modules the guide introduces on their own.
 * `GUIDE_ENTRIES` only adds wording to packages it knows; a declared plugin it does not know still gets an entry.
 */
import { GUIDE_ENTRIES } from './entries.js';
import type {
  GuideEntryDefinition,
  GuideGroupId,
  GuidePluginRole,
  GuideSource,
  GuideSourceFilter,
} from './types.js';

export { GUIDE_ENTRIES };

export type GuideEntryId = keyof typeof GUIDE_ENTRIES;

/** The prompt ids one known entry declares. */
export type PromptIdOf<K extends GuideEntryId> =
  (typeof GUIDE_ENTRIES)[K]['prompts'][number];

/**
 * Core packages that are not listed on their own: the application frame (`app-client`, `app-server`,
 * `service-provider`) and those introduced inside the plugin built on them.
 */
export const KERNEL_NOT_LISTED: Readonly<Record<string, string>> = {
  '@nocobase/app-client': 'frame',
  '@nocobase/app-server': 'frame',
  '@nocobase/service-provider': 'frame',
  '@nocobase/authorization': 'app-plugin-authorization',
  '@nocobase/drive': 'app-plugin-file',
};

/** The fields of a `package.json` the catalog reads. */
export interface DependencyManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

export interface CatalogEntry {
  /** Stable id used in the URL: the package name without the `@nocobase/` scope. */
  readonly id: string;
  /** 1-based position in the full catalog, shown before each row. */
  readonly index: number;
  readonly packageName: string;
  /** Sort key and the name shown in the list: the module or plugin name. */
  readonly name: string;
  readonly source: GuideSource;
  readonly role?: GuidePluginRole;
  readonly group?: GuideGroupId;
  /** Covered core packages the application declares. */
  readonly covers: readonly string[];
  /** Related entries present in this catalog. */
  readonly related: readonly string[];
  readonly demo?: string;
  readonly docs?: string;
  readonly featured: boolean;
  readonly sourcePath?: string;
  readonly skills: readonly string[];
  readonly prompts: readonly string[];
  /** `false` for a declared plugin the guide has no wording for yet. */
  readonly known: boolean;
}

export interface CapabilityCatalog {
  readonly entries: readonly CatalogEntry[];
  readonly find: (id: string) => CatalogEntry | undefined;
  readonly featured: readonly CatalogEntry[];
}

const PLUGIN_NAME = /^(?:@[^/]+\/)?app-plugin-/;

function idOf(packageName: string): string {
  return packageName.startsWith('@nocobase/')
    ? packageName.slice('@nocobase/'.length)
    : packageName.replace(/^@/, '').replace('/', '--');
}

/** Builds the catalog for the dependencies an application declares. */
export function createCapabilityCatalog(
  manifest: DependencyManifest,
): CapabilityCatalog {
  const declared = new Set(
    [
      manifest.dependencies,
      manifest.devDependencies,
      manifest.optionalDependencies,
      manifest.peerDependencies,
    ].flatMap((section) => Object.keys(section ?? {})),
  );
  const known = new Map<string, [string, GuideEntryDefinition]>(
    Object.entries(
      GUIDE_ENTRIES as Readonly<Record<string, GuideEntryDefinition>>,
    ).map(([id, definition]) => [definition.packageName, [id, definition]]),
  );
  const listed = [...declared].filter((name) => {
    if (KERNEL_NOT_LISTED[name]) return false;
    if (PLUGIN_NAME.test(name)) return true;
    return known.get(name)?.[1].source === 'kernel';
  });
  const ids = new Set(listed.map((name) => known.get(name)?.[0] ?? idOf(name)));
  const rows = listed
    .map((packageName) => {
      const match = known.get(packageName);
      const id = match?.[0] ?? idOf(packageName);
      const definition = match?.[1];
      return {
        id,
        packageName,
        name: id,
        source: definition?.source ?? 'plugin',
        role:
          definition?.role ?? (/-example$/.test(id) ? 'example' : undefined),
        group: definition?.group,
        covers: (definition?.covers ?? []).filter((name) => declared.has(name)),
        related: (definition?.related ?? []).filter((other) => ids.has(other)),
        demo: definition?.demo,
        docs: definition?.docs,
        featured: definition?.featured === true,
        sourcePath: definition?.sourcePath,
        skills: definition?.skills ?? [],
        prompts: definition?.prompts ?? ['main'],
        known: Boolean(definition),
      } satisfies Omit<CatalogEntry, 'index'>;
    })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const entries: readonly CatalogEntry[] = rows.map((row, position) =>
    Object.freeze({ ...row, index: position + 1 }),
  );
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return {
    entries,
    find: (id) => byId.get(id),
    featured: entries.filter((entry) => entry.featured),
  };
}

/** Narrows the catalog by source and keywords; every keyword must appear in the entry's searchable text. */
export function filterCatalog(
  entries: readonly CatalogEntry[],
  filter: { readonly source: GuideSourceFilter; readonly query: string },
  searchableText: (entry: CatalogEntry) => string,
): readonly CatalogEntry[] {
  const terms = filter.query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter(
    (entry) =>
      (filter.source === 'all' || entry.source === filter.source) &&
      (terms.length === 0 ||
        terms.every((term) =>
          searchableText(entry).toLowerCase().includes(term),
        )),
  );
}

/** Reads the guide's filter from URL search parameters, so a detail page can return to the same list. */
export function readGuideFilter(params: URLSearchParams): {
  readonly source: GuideSourceFilter;
  readonly query: string;
} {
  const source = params.get('source');
  return {
    source: source === 'kernel' || source === 'plugin' ? source : 'all',
    query: params.get('q') ?? '',
  };
}

/** App-relative path of the guide, and of one entry in it. */
export const CAPABILITY_GUIDE_PATH = '/capabilities';
export function capabilityPath(id: string, search = ''): string {
  return `${CAPABILITY_GUIDE_PATH}/${encodeURIComponent(id)}${search}`;
}

/** Absolute documentation URL for a page path, in the closest documented language. */
export function docsUrl(path: string, locale: string): string {
  const prefix = locale.startsWith('zh') ? '/zh-CN' : '';
  return `https://docs.nocobase.com${prefix}${path}`;
}

/** Source link for the developer reference. */
export function sourceUrl(path: string): string {
  return `https://github.com/nocobase/nocobase/tree/v3-develop/${path}`;
}
