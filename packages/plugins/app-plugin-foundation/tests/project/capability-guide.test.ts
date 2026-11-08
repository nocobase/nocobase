import { describe, expect, it } from 'vitest';

import defaultManifest from '../../../../templates/app-template-default/package.json' with { type: 'json' };
import examplesManifest from '../../../../templates/app-template-examples/package.json' with { type: 'json' };
import {
  createCapabilityCatalog,
  entryContent,
  filterCatalog,
  GUIDE_ENTRIES,
  GUIDE_GROUP_IDS,
  guideContent,
  searchableText,
  type DependencyManifest,
} from '../../shared/capability-guide/index.js';

const LISTED_KERNEL = [
  'concurrency',
  'db',
  'i18n',
  'jobs',
  'lifecycle',
  'queue',
  'realtime',
];

function declaredPlugins(manifest: DependencyManifest): string[] {
  return Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })
    .filter((name) => /app-plugin-/.test(name))
    .sort();
}

function blankStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    blankStrings(child, path ? `${path}.${key}` : key),
  );
}

describe('capability catalog', () => {
  it.each([
    ['Default', defaultManifest],
    ['Examples', examplesManifest],
  ] as const)(
    'lists every plugin the %s template declares and the core modules introduced on their own',
    (_name, manifest) => {
      const { entries } = createCapabilityCatalog(manifest);
      expect(
        entries
          .filter((entry) => entry.source === 'plugin')
          .map((entry) => entry.packageName)
          .sort(),
      ).toEqual(declaredPlugins(manifest));
      expect(
        entries
          .filter((entry) => entry.source === 'kernel')
          .map((entry) => entry.name),
      ).toEqual(LISTED_KERNEL);
      for (const hidden of [
        '@nocobase/app-client',
        '@nocobase/app-server',
        '@nocobase/service-provider',
        '@nocobase/authorization',
        '@nocobase/drive',
      ])
        expect(entries.map((entry) => entry.packageName)).not.toContain(hidden);
      expect(entries.map((entry) => entry.name)).toEqual(
        entries.map((entry) => entry.name).toSorted(),
      );
      expect(entries.map((entry) => entry.index)).toEqual(
        entries.map((_entry, position) => position + 1),
      );
      // Every entry the templates list has its own wording; none falls back to the generic text.
      expect(entries.filter((entry) => !entry.known)).toEqual([]);
    },
  );

  it('gives the two templates different catalogs, examples only where they are declared', () => {
    const defaults = createCapabilityCatalog(defaultManifest).entries;
    const examples = createCapabilityCatalog(examplesManifest).entries;
    expect(defaults.filter((entry) => entry.role === 'example')).toEqual([]);
    expect(
      examples.filter((entry) => entry.role === 'example').length,
    ).toBeGreaterThan(0);
    expect(defaults.length).toBeLessThan(examples.length);
    expect(
      defaults.find((entry) => entry.id === 'app-plugin-file')?.related,
    ).not.toContain('app-plugin-file-example');
  });

  it('lists a declared plugin it has no wording for, with the generic wording', () => {
    const catalog = createCapabilityCatalog({
      dependencies: {
        '@acme/app-plugin-crm': '1.0.0',
        '@nocobase/db': '1.0.0',
      },
    });
    expect(catalog.entries.map((entry) => entry.id)).toEqual([
      'acme--app-plugin-crm',
      'db',
    ]);
    const unknown = catalog.find('acme--app-plugin-crm');
    if (!unknown) throw new Error('missing entry');
    expect(unknown.known).toBe(false);
    expect(entryContent(guideContent('en-US'), unknown).title).toBe(
      '@acme/app-plugin-crm',
    );
  });

  it('combines the source filter with keywords', () => {
    const content = guideContent('zh-CN');
    const { entries } = createCapabilityCatalog(examplesManifest);
    const text = (entry: (typeof entries)[number]) =>
      searchableText(content, entry);
    const kernelFiles = filterCatalog(
      entries,
      { source: 'kernel', query: '附件' },
      text,
    );
    const pluginFiles = filterCatalog(
      entries,
      { source: 'plugin', query: '附件' },
      text,
    );
    expect(kernelFiles).toEqual([]);
    expect(pluginFiles.map((entry) => entry.id)).toContain('app-plugin-file');
  });

  it('declares known groups, real related entries and demos only on examples', () => {
    const definitions = Object.entries(GUIDE_ENTRIES) as [
      string,
      (typeof GUIDE_ENTRIES)[keyof typeof GUIDE_ENTRIES],
    ][];
    for (const [id, definition] of definitions) {
      expect(GUIDE_GROUP_IDS).toContain(definition.group);
      for (const related of definition.related)
        expect(Object.keys(GUIDE_ENTRIES)).toContain(related);
      if ('demo' in definition)
        expect({
          id,
          role: 'role' in definition ? definition.role : undefined,
        }).toEqual({ id, role: 'example' });
    }
  });

  it.each(['en-US', 'zh-CN'])(
    'words every known entry and prompt in %s, with nothing extra or blank',
    (locale) => {
      const content = guideContent(locale);
      expect(Object.keys(content.entries).toSorted()).toEqual(
        Object.keys(GUIDE_ENTRIES).toSorted(),
      );
      for (const [id, definition] of Object.entries(GUIDE_ENTRIES)) {
        const prompts = (
          content.entries as Record<string, { prompts: object }>
        )[id]?.prompts;
        expect({ id, prompts: Object.keys(prompts ?? {}).toSorted() }).toEqual({
          id,
          prompts: [...definition.prompts].toSorted(),
        });
      }
      expect(blankStrings(content)).toEqual([]);
    },
  );
});
