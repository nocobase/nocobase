// @vitest-environment node
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { describe, expect, it } from 'vitest';

import enUS from '../../server/locales/en-US.js';
import zhCN from '../../server/locales/zh-CN.js';
import {
  translateCatalog,
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
});
