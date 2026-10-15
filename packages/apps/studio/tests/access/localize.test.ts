// @vitest-environment node
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import type { KeyScopeOptions } from '@nocobase/app-plugin-api-keys/shared/scopes';
import { describe, expect, it } from 'vitest';

import enUS from '../../server/locales/en-US.js';
import zhCN from '../../server/locales/zh-CN.js';
import {
  translateCatalog,
  translateKeyScopeOptions,
  translateRole,
} from '../../server/access/localize.js';
import { STUDIO_NAMESPACE, type Role } from '../../shared/access.js';

async function translator(locale: 'en-US' | 'zh-CN') {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: STUDIO_NAMESPACE,
      resources: locale === 'en-US' ? enUS : zhCN,
    },
    locale,
    strict: false,
  });
  return runtime.getFixedT(STUDIO_NAMESPACE, locale);
}

function role(title: Role['title']): Role {
  return {
    key: 'admin',
    title,
    builtIn: true,
    editable: true,
    pages: [],
    settings: {},
    abilities: {},
    holderIds: [],
    holderCount: 0,
  };
}

describe('localized access responses', () => {
  it.each([
    ['en-US', 'Admin'],
    ['zh-CN', '管理员'],
  ] as const)(
    'translates built-in role titles in %s',
    async (locale, title) => {
      const t = await translator(locale);
      expect(
        translateRole(t, role({ key: 'roles.admin', ns: STUDIO_NAMESPACE }))
          .title,
      ).toBe(title);
    },
  );

  it('keeps plain-text titles and falls back to the role key for missing translations', async () => {
    const t = await translator('en-US');
    expect(translateRole(t, role('Project reviewers')).title).toBe(
      'Project reviewers',
    );
    expect(
      translateRole(
        t,
        role({ key: 'roles.notTranslated', ns: STUDIO_NAMESPACE }),
      ).title,
    ).toBe('admin');
    expect(translateRole(t, role(null)).title).toBe('admin');
  });

  it('translates catalog titles and keeps plain text readable', async () => {
    const t = await translator('zh-CN');
    const localized = translateCatalog(t, {
      businesses: [],
      settings: [
        {
          id: 'studio.apiKeys',
          title: { key: 'roles.items.apiKeys', ns: STUDIO_NAMESPACE },
          actions: [
            {
              key: 'studio.apiKeys/read',
              name: 'read',
              title: 'Read access',
            },
          ],
        },
      ],
    });
    expect(localized.settings[0]?.title).toBe('API 密钥');
    expect(localized.settings[0]?.actions[0]?.title).toBe('Read access');
  });

  it.each([
    ['en-US', 'Knowledge search', 'Ones I created or in projects I can see'],
    ['zh-CN', '知识库检索', '我创建的或我能查看的项目里的'],
  ] as const)(
    'translates organization key scope options in %s without changing their shape',
    async (locale, groupTitle, presetTitle) => {
      const t = await translator(locale);
      const options: KeyScopeOptions = {
        groups: [
          {
            id: 'knowledge.read',
            category: 'business',
            title: { key: 'roles.items.knowledgeSearch', ns: STUDIO_NAMESPACE },
            description: {
              key: 'roles.related.knowledgeSeenHint',
              ns: STUDIO_NAMESPACE,
            },
            levels: ['read'],
            access: {},
            held: { read: true },
            objects: {
              business: 'kb.knowledge',
              title: {
                key: 'roles.related.knowledgeLed',
                ns: STUDIO_NAMESPACE,
              },
            },
          },
        ],
        presets: [
          {
            id: 'projects',
            title: { key: 'roles.related.appsSeen', ns: STUDIO_NAMESPACE },
            description: {
              key: 'roles.related.appsSeenHint',
              ns: STUDIO_NAMESPACE,
            },
            groups: {},
            expiresInDays: null,
          },
        ],
        maxScopedKeyDays: null,
        defaultExpiresInDays: 30,
      };
      const localized = translateKeyScopeOptions(t, options);
      expect(localized.groups[0]?.title).toBe(groupTitle);
      expect(localized.groups[0]?.description).toBe(
        locale === 'en-US'
          ? 'The system knowledge, and the spaces of projects I can see'
          : '系统知识，以及我能查看的项目的知识空间',
      );
      expect(localized.groups[0]?.objects?.title).toBe(
        locale === 'en-US' ? 'Projects I lead' : '我负责的项目的',
      );
      expect(localized.presets[0]?.title).toBe(presetTitle);
      expect(localized.presets[0]?.description).toBe(
        locale === 'en-US'
          ? 'Apps I created, Apps linked to projects I can see, and previews of issues I can see'
          : '我创建的应用、关联到我能查看的项目的应用，以及我能查看的任务的预览应用',
      );
      expect(localized.groups[0]?.held).toEqual({ read: true });
      expect(localized.groups[0]?.access).toEqual({});
    },
  );
});
