// @vitest-environment node
/**
 * The catalog a Studio role is made of, read from what the assembled plugins register with the authorization plugin:
 * every business with its actions and levels, every settings item, a title for each, and Studio's annotation of every
 * action for API keys and agents.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  createApiKeyScopes,
  ScopedApiKeys,
} from '@nocobase/app-plugin-api-keys/server';
import * as agents from '@nocobase/app-plugin-agents/shared/access';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization';
import * as knowledge from '@nocobase/app-plugin-knowledge/shared/access';
import * as projects from '@nocobase/app-plugin-projects/shared/access';
import * as releases from '@nocobase/app-plugin-releases/shared/access';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.ts';
import zhCN from '../../client/locales/zh-CN.ts';
import { pageText } from '../../client/pages/config/members/roles-model.ts';
import { STUDIO_NAMESPACE, type CatalogText } from '../../shared/access.ts';
import { PAGES } from '../../shared/pages.ts';
import { ACTION_POLICIES } from '../../server/access/action-policy.ts';
import { readCatalog, type Catalog } from '../../server/access/catalog.ts';
import {
  translateCatalog,
  translateKeyScopeOptions,
} from '../../server/access/localize.ts';
import { registerStudioKeyScopes } from '../../server/access/key-scopes.ts';
import { agentActionOptions } from '../../server/agents/capabilities.ts';
import { registerAccess } from './registry.ts';
import studioEnUS from '../../server/locales/en-US.ts';
import studioZhCN from '../../server/locales/zh-CN.ts';

const require = createRequire(import.meta.url);
const pluginFile = async (name: string, file: string) =>
  (
    (await import(
      pathToFileURL(
        path.join(path.dirname(require.resolve(`${name}/package.json`)), file),
      ).href
    )) as { default: unknown }
  ).default;

/** Looks a key up the way i18next does here: flat dotted keys (`roles.items.agents`) and nested groups mixed. */
function lookup(resource: unknown, parts: readonly string[]): unknown {
  if (parts.length === 0) return resource;
  if (!resource || typeof resource !== 'object') return undefined;
  for (let i = parts.length; i > 0; i -= 1) {
    const value = (resource as Record<string, unknown>)[
      parts.slice(0, i).join('.')
    ];
    const found =
      value === undefined ? undefined : lookup(value, parts.slice(i));
    if (found !== undefined) return found;
  }
  return undefined;
}

let testDatabase: TestDatabase;
let catalog: Catalog;
/** Each namespace's English and Chinese resources. */
let locales: Map<string, readonly unknown[]>;

beforeAll(async () => {
  testDatabase = await createTestDatabase();
  const authz = createAppAuthorization({ connection: testDatabase.connection });
  registerAccess(authz);
  catalog = readCatalog(authz);
  const access = (name: string) =>
    Promise.all([
      pluginFile(name, 'shared/locales/access.en-US.ts'),
      pluginFile(name, 'shared/locales/access.zh-CN.ts'),
    ]);
  locales = new Map<string, readonly unknown[]>([
    [projects.ACCESS_NAMESPACE, await access(projects.ACCESS_NAMESPACE)],
    [releases.ACCESS_NAMESPACE, await access(releases.ACCESS_NAMESPACE)],
    [agents.ACCESS_NAMESPACE, await access(agents.ACCESS_NAMESPACE)],
    [
      knowledge.ACCESS_NAMESPACE,
      await Promise.all([
        pluginFile(knowledge.ACCESS_NAMESPACE, 'client/locales/en-US.ts'),
        pluginFile(knowledge.ACCESS_NAMESPACE, 'client/locales/zh-CN.ts'),
      ]),
    ],
    [STUDIO_NAMESPACE, [enUS, zhCN]],
  ]);
});
afterAll(() => testDatabase.destroy());

function localeModule(enUSResource: unknown, zhCNResource: unknown) {
  return {
    'en-US': () => Promise.resolve({ default: enUSResource }),
    'zh-CN': () => Promise.resolve({ default: zhCNResource }),
  };
}

/** The keys of `texts` some locale of their namespace does not word. */
function untranslated(texts: readonly (CatalogText | undefined)[]): string[] {
  return texts.flatMap((text) => {
    if (text === undefined || typeof text === 'string') return [];
    const resources = locales.get(text.ns) ?? [];
    return resources.length > 0 &&
      resources.every(
        (resource) => typeof lookup(resource, text.key.split('.')) === 'string',
      )
      ? []
      : [`${text.ns}:${text.key}`];
  });
}

describe('the catalog', () => {
  it.each([
    ['en-US', 'Knowledge', 'System and projects I can see'],
    ['zh-CN', '知识', '系统和我能查看的项目的'],
  ] as const)(
    'returns the complete real catalog and key scope options as readable text for %s callers',
    async (locale, knowledgeTitle, relatedLabel) => {
      const serverLocales = new Map<string, readonly unknown[]>([
        [STUDIO_NAMESPACE, [studioEnUS, studioZhCN]],
        ...(await Promise.all(
          [projects, releases, agents, knowledge].map(
            async (plugin) =>
              [
                plugin.ACCESS_NAMESPACE,
                await Promise.all([
                  pluginFile(
                    plugin.ACCESS_NAMESPACE,
                    'server/locales/en-US.ts',
                  ),
                  pluginFile(
                    plugin.ACCESS_NAMESPACE,
                    'server/locales/zh-CN.ts',
                  ),
                ]),
              ] as const,
          ),
        )),
      ]);
      const namespaces = Object.fromEntries(
        [...serverLocales.entries()]
          .filter(([namespace]) => namespace !== STUDIO_NAMESPACE)
          .map(([namespace, resources]) => [
            namespace,
            localeModule(resources[0], resources[1]),
          ]),
      );
      const runtime = await createTestI18nRuntime({
        application: {
          namespace: STUDIO_NAMESPACE,
          resources: localeModule(studioEnUS, studioZhCN),
        },
        namespaces,
        locale,
      });
      const t = runtime.getFixedT(STUDIO_NAMESPACE, locale);
      // Use the registered groups and the real options service, including every plugin preset.
      const scopes = createApiKeyScopes();
      registerStudioKeyScopes(scopes, {}, () => catalog);
      const keys = new ScopedApiKeys({
        scopes,
        connection: () => testDatabase.connection,
        auth: {
          pluginApi: () => {
            throw new Error(
              'Scope options must not call authentication endpoints',
            );
          },
        },
      });
      const options = await keys.scopeOptions('scope-options-reader');
      const localizedOptions = translateKeyScopeOptions(t, options);
      const checkText = (
        original: CatalogText | null,
        translated: CatalogText | null,
      ) => {
        if (original === null || typeof original === 'string') {
          expect(translated).toBe(original);
        } else {
          const resource = serverLocales.get(original.ns)?.[
            locale === 'en-US' ? 0 : 1
          ];
          const expected = lookup(resource, original.key.split('.'));
          expect(
            expected,
            `${locale} ${original.ns}:${original.key}`,
          ).toBeTypeOf('string');
          expect(translated).toBe(expected);
          expect(translated).not.toBe(original.key);
        }
      };
      expect(localizedOptions.groups).toHaveLength(options.groups.length);
      for (const [index, group] of options.groups.entries()) {
        const translated = localizedOptions.groups[index]!;
        checkText(group.title, translated.title);
        checkText(group.description, translated.description);
        if (group.objects)
          checkText(group.objects.title, translated.objects!.title);
        expect(translated).toEqual({
          ...group,
          title: translated.title,
          description: translated.description,
          objects: group.objects
            ? { ...group.objects, title: translated.objects!.title }
            : null,
        });
      }
      expect(localizedOptions.presets).toHaveLength(options.presets.length);
      for (const [index, preset] of options.presets.entries()) {
        const translated = localizedOptions.presets[index]!;
        checkText(preset.title, translated.title);
        checkText(preset.description, translated.description);
        expect(translated).toEqual({
          ...preset,
          title: translated.title,
          description: translated.description,
        });
      }
      expect(localizedOptions.maxScopedKeyDays).toBe(options.maxScopedKeyDays);
      expect(localizedOptions.defaultExpiresInDays).toBe(
        options.defaultExpiresInDays,
      );
      const localized = translateCatalog(t, {
        businesses: catalog.businesses,
        settings: catalog.settings,
      });
      const text = [
        ...localized.businesses.flatMap((business) => [
          business.title,
          business.description,
          business.section?.title,
          ...business.actions.flatMap((action) => [
            action.title,
            action.description,
            ...action.levels.flatMap((level) => [
              level.title,
              level.label,
              level.description,
            ]),
          ]),
        ]),
        ...localized.settings.flatMap((item) => [
          item.title,
          item.description,
          item.section?.title,
          ...item.actions.map((action) => action.title),
        ]),
      ].filter((value): value is string => typeof value === 'string');

      expect(text).toContain(knowledgeTitle);
      expect(text).toContain(relatedLabel);
      expect(text.some((value) => /^(access|roles)\./.test(value))).toBe(false);
    },
  );

  it('lists the plugins’ businesses in order, each action at the levels its records allow', () => {
    expect(catalog.businesses.map(({ type, id }) => `${type}:${id}`)).toEqual([
      'pm:pm.projects',
      'pm:pm.issues',
      'pm:pm.attachments',
      'agents:agents.agents',
      'rel:rel.apps',
      'kb:kb.knowledge',
    ]);
    expect(catalog.businessKeys).toEqual([
      ...projects.BUSINESS_KEYS.map(({ key }) => key),
      ...agents.BUSINESS_KEYS.map(({ key }) => key),
      ...releases.BUSINESS_KEYS.map(({ key }) => key),
      ...knowledge.BUSINESS_KEYS.map(({ key }) => key),
    ]);
    expect(catalog.action('pm.issues/edit')?.levels).toEqual([
      expect.objectContaining({ level: 'related', action: 'edit.related' }),
      expect.objectContaining({ level: 'all', action: 'edit.all' }),
    ]);
    expect(catalog.levelsOf('pm.issues/close')).toEqual([
      'none',
      'related',
      'all',
    ]);
    // Without related records an action is held or not, under its own name.
    expect(catalog.levelsOf('pm.projects/create')).toEqual(['none', 'all']);
    expect(catalog.action('rel.apps/create')?.levels).toEqual([
      expect.objectContaining({ level: 'all', action: 'create' }),
    ]);
    expect(
      catalog.grantOf({ type: 'kb', id: 'kb.knowledge' }, 'read.related'),
    ).toEqual({ key: 'kb.knowledge/read', level: 'related' });
  });

  it('lists the plugins’ and Studio’s settings items, no other plugin’s', () => {
    expect(catalog.settings.map(({ id }) => id)).toEqual([
      'pm.general',
      'pm.labels',
      'pm.members',
      'agents.agents',
      'agents.runners',
      'agents.prices',
      'agents.services',
      'rel.environments',
      'studio.apiKeys',
      'studio.personalApiKeys',
      'studio.git',
      'studio.knowledgeSearch',
    ]);
  });

  it('words every business, action, level and settings item in English and Chinese, and every page', () => {
    expect(
      untranslated([
        ...catalog.businesses.flatMap((business) => [
          business.title,
          business.description,
          business.section?.title,
          ...business.actions.flatMap((action) => [
            action.title,
            action.description,
            ...action.levels.flatMap((level) => [
              level.title,
              level.label,
              level.description,
            ]),
          ]),
        ]),
        ...catalog.settings.flatMap((item) => [
          item.title,
          item.section?.title,
          ...item.actions.map((action) => action.title),
        ]),
      ]),
    ).toEqual([]);
    expect(catalog.businesses.every((business) => business.description)).toBe(
      true,
    );
    expect(
      catalog.businesses.every((business) =>
        business.actions.every((action) => action.title && action.description),
      ),
    ).toBe(true);
    // Every `related` level says what it reaches, in a short label and one line.
    expect(
      catalog.businesses.every((business) =>
        business.actions.every((action) =>
          action.levels.every(
            (level) =>
              level.level !== 'related' || (level.label && level.description),
          ),
        ),
      ),
    ).toBe(true);
    expect(
      untranslated(
        PAGES.map((page) => ({ key: pageText(page), ns: STUDIO_NAMESPACE })),
      ),
    ).toEqual([]);
  });
});

describe('Studio’s annotations', () => {
  it('word the related level where Studio decides the relation, and keep the plugin’s wording elsewhere', () => {
    const related = (key: string) =>
      catalog.action(key)?.levels.find((level) => level.level === 'related');
    expect(related('kb.knowledge/read')).toMatchObject({
      label: { key: 'roles.related.knowledgeSeen', ns: STUDIO_NAMESPACE },
      description: {
        key: 'roles.related.knowledgeSeenHint',
        ns: STUDIO_NAMESPACE,
      },
    });
    expect(related('rel.apps/deploy')?.label).toEqual({
      key: 'roles.related.appsLed',
      ns: STUDIO_NAMESPACE,
    });
    expect(related('pm.issues/view')).toMatchObject({
      label: {
        key: 'access.businesses.issues.actions.view.relatedLabel',
        ns: projects.ACCESS_NAMESPACE,
      },
      description: {
        key: 'access.businesses.issues.actions.view.relatedHint',
        ns: projects.ACCESS_NAMESPACE,
      },
    });
  });

  it('annotate every registered action for keys and agents, and nothing else', () => {
    const registered = [...catalog.businessKeys, ...catalog.settingsKeys];
    expect(registered.filter((key) => !(key in ACTION_POLICIES))).toEqual([]);
    expect(
      Object.keys(ACTION_POLICIES).filter((key) => !registered.includes(key)),
    ).toEqual([]);
    // Settings are never an agent's.
    expect(
      catalog.settingsKeys.filter(
        (key) => ACTION_POLICIES[key]?.agents.grantable,
      ),
    ).toEqual([]);
  });

  it('offer to keys exactly what a permission group covers', () => {
    const scopes = createApiKeyScopes();
    registerStudioKeyScopes(scopes, {}, () => catalog);
    const covered = new Set<string>();
    for (const group of scopes.groups.list())
      for (const { resource, actions } of scopes.accessOf(group, 'admin'))
        for (const action of actions) {
          if (resource.type === 'page') continue;
          const held = catalog.grantOf(resource, action);
          covered.add(held ? held.key : `${resource.id}/${action}`);
        }
    const offered = Object.entries(ACTION_POLICIES)
      .filter(([, policy]) => policy.keys === true)
      .map(([key]) => key);
    expect([...covered].sort()).toEqual([...offered].sort());
  });

  it('give the agent editor every grantable action and a reason for the rest, all worded', () => {
    const options = agentActionOptions(catalog);
    expect(
      options.filter((option) => option.defaultOn).map(({ key }) => key),
    ).toEqual([
      'pm.issues/view',
      'pm.issues/comment',
      'rel.apps/view',
      'rel.apps/read-logs',
      'kb.knowledge/read',
      'kb.knowledge/propose',
      'studio.git/open-pr',
      'studio.previews/manage',
    ]);
    expect(
      options.find(({ key }) => key === 'pm.attachments/upload'),
    ).toMatchObject({ group: 'pm.issues' });
    expect(
      options
        .filter((option) => option.grantable === false)
        .map(({ key }) => key),
    ).toEqual(
      expect.arrayContaining([
        'kb.knowledge/edit',
        'rel.apps/deploy-protected',
        'pm.members',
        'studio.apiKeys',
      ]),
    );
    expect(
      untranslated(
        options.flatMap((option) => [
          option.title,
          option.groupTitle,
          option.description,
          option.reason,
        ]),
      ),
    ).toEqual([]);
  });
});
