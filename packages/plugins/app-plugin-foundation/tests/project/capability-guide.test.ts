import { describe, expect, it } from 'vitest';

import {
  createCapabilityCatalog,
  entryContent,
  filterCatalog,
  GUIDE_ENTRIES,
  GUIDE_GROUP_IDS,
  guideContent,
  searchableText,
} from '../../shared/capability-guide/index.js';
import { SAMPLE_MANIFEST } from '../fixtures/capability-manifest.js';

function blankStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    blankStrings(child, path ? `${path}.${key}` : key),
  );
}

describe('capability catalog', () => {
  it('lists every declared plugin and only the core modules introduced on their own, sorted and numbered', () => {
    const { entries } = createCapabilityCatalog(SAMPLE_MANIFEST);
    expect(
      entries.map((entry) => [entry.index, entry.name, entry.source]),
    ).toEqual([
      [1, 'acme--app-plugin-crm', 'plugin'],
      [2, 'app-plugin-authorization', 'plugin'],
      [3, 'app-plugin-file', 'plugin'],
      [4, 'app-plugin-lifecycle-example', 'plugin'],
      [5, 'app-plugin-template-print', 'plugin'],
      [6, 'db', 'kernel'],
      [7, 'jobs', 'kernel'],
      [8, 'lifecycle', 'kernel'],
    ]);
    const roles = Object.fromEntries(
      entries.map((entry) => [entry.id, entry.role]),
    );
    expect(roles['app-plugin-lifecycle-example']).toBe('example');
    expect(roles['app-plugin-template-print']).toBe('skill');
    // Folded core modules show inside the plugin built on them.
    expect(
      entries.find((entry) => entry.id === 'app-plugin-file')?.covers,
    ).toEqual(['@nocobase/drive']);
    expect(
      entries.find((entry) => entry.id === 'app-plugin-authorization')?.covers,
    ).toEqual(['@nocobase/authorization']);
  });

  it('folds the concurrency core into its plugin and finds it by either package name', () => {
    const catalog = createCapabilityCatalog({
      dependencies: {
        '@nocobase/concurrency': '*',
        '@nocobase/app-plugin-concurrency': '*',
      },
    });
    expect(catalog.entries.map((entry) => entry.id)).toEqual([
      'app-plugin-concurrency',
    ]);
    expect(catalog.find('concurrency')).toBeUndefined();
    expect(catalog.find('app-plugin-concurrency')?.covers).toEqual([
      '@nocobase/concurrency',
    ]);
    const content = guideContent('zh-CN');
    for (const query of [
      '@nocobase/concurrency',
      '@nocobase/app-plugin-concurrency',
    ]) {
      expect(
        filterCatalog(catalog.entries, { source: 'all', query }, (entry) =>
          searchableText(content, entry),
        ).map((entry) => entry.id),
      ).toEqual(['app-plugin-concurrency']);
    }
  });

  it('links only related entries the application also lists', () => {
    const catalog = createCapabilityCatalog(SAMPLE_MANIFEST);
    const ids = new Set(catalog.entries.map((entry) => entry.id));
    for (const entry of catalog.entries)
      for (const related of entry.related) expect(ids.has(related)).toBe(true);
    expect(catalog.find('app-plugin-file')?.related).not.toContain(
      'app-plugin-file-example',
    );
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
    const { entries } = createCapabilityCatalog(SAMPLE_MANIFEST);
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

it('merges i18n into one searchable plugin entry and resolves the old core id', () => {
  const catalog = createCapabilityCatalog({
    dependencies: {
      '@nocobase/i18n': '*',
      '@nocobase/app-plugin-i18n': '*',
    },
  });
  expect(catalog.entries.map((entry) => entry.id)).toEqual(['app-plugin-i18n']);
  expect(catalog.find('i18n')).toBe(catalog.find('app-plugin-i18n'));
  expect(catalog.find('i18n')?.covers).toEqual(['@nocobase/i18n']);
  for (const query of [
    '@nocobase/i18n',
    '@nocobase/app-plugin-i18n',
    '多语言',
  ]) {
    expect(
      filterCatalog(catalog.entries, { source: 'all', query }, (entry) =>
        searchableText(guideContent('zh-CN'), entry),
      ),
    ).toHaveLength(1);
  }
});

it('retains i18n for applications with only the core dependency', () => {
  const catalog = createCapabilityCatalog({
    dependencies: { '@nocobase/i18n': '*' },
  });
  expect(catalog.entries.map((entry) => entry.id)).toEqual(['i18n']);
  expect(catalog.find('i18n')?.source).toBe('kernel');
  expect(catalog.find('app-plugin-i18n')).toBeUndefined();
});
