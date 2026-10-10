import { describe, expectTypeOf, it } from 'vitest';

import type {
  LocaleResource,
  PartialLocaleResource,
} from '../src/core/keys.js';

// Stands in for a locale file, which exports the wording as a value and derives its type from it.
export const enUS = {
  language: {
    label: 'Language',
    switchError: 'Unable to switch language.',
  },
  actions: {
    save: 'Save',
  },
};

export type AppResource = LocaleResource<typeof enUS>;

describe('LocaleResource', () => {
  it('accepts a complete translation', () => {
    const zhCN: AppResource = {
      language: { label: '语言', switchError: '无法切换语言。' },
      actions: { save: '保存' },
    };

    expectTypeOf(zhCN).toMatchTypeOf<AppResource>();
  });

  it('widens leaves to string, so a translation is not tied to the English wording', () => {
    expectTypeOf<AppResource['language']['label']>().toEqualTypeOf<string>();
  });

  it('rejects a key the source locale does not have', () => {
    const zhCN: AppResource = {
      language: {
        label: '语言',
        switchError: '无法切换语言。',
        // @ts-expect-error a key absent from en-US is a typo, not a translation
        typo: '拼错的键',
      },
      actions: { save: '保存' },
    };

    expectTypeOf(zhCN).toMatchTypeOf<AppResource>();
  });

  it('rejects an omitted key', () => {
    // @ts-expect-error 'actions' is missing, which would silently fall back at runtime
    const zhCN: AppResource = {
      language: { label: '语言', switchError: '无法切换语言。' },
    };

    expectTypeOf(zhCN).toMatchTypeOf<AppResource>();
  });

  // The one key an application adds that the source locale does not declare: it reroutes a plugin's wording rather
  // than translating the application's own.
  it('accepts an overrides block keyed by a plugin package name', () => {
    const zhCN: AppResource = {
      language: { label: '语言', switchError: '无法切换语言。' },
      actions: { save: '保存' },
      overrides: {
        '@nocobase/app-plugin-scheduler': { nav: { title: '计划任务' } },
      },
    };

    expectTypeOf(zhCN).toMatchTypeOf<AppResource>();
  });

  it('keeps overrides to the top level', () => {
    const zhCN: AppResource = {
      language: {
        label: '语言',
        switchError: '无法切换语言。',
        // @ts-expect-error a nested overrides block is a misplacement, not a translation
        overrides: {},
      },
      actions: { save: '保存' },
    };

    expectTypeOf(zhCN).toMatchTypeOf<AppResource>();
  });
});

describe('PartialLocaleResource', () => {
  it('allows an incomplete translation', () => {
    const zhCN: PartialLocaleResource<typeof enUS> = {
      language: { label: '语言' },
    };

    expectTypeOf(zhCN).toMatchTypeOf<PartialLocaleResource<typeof enUS>>();
  });

  it('still rejects a key the source locale does not have', () => {
    const zhCN: PartialLocaleResource<typeof enUS> = {
      // @ts-expect-error an unknown key is a typo whether or not the locale is complete
      typo: '拼错的键',
    };

    expectTypeOf(zhCN).toMatchTypeOf<PartialLocaleResource<typeof enUS>>();
  });

  it('accepts an overrides block too', () => {
    const zhCN: PartialLocaleResource<typeof enUS> = {
      overrides: {
        '@nocobase/app-plugin-scheduler': { nav: { title: '计划任务' } },
      },
    };

    expectTypeOf(zhCN).toMatchTypeOf<PartialLocaleResource<typeof enUS>>();
  });
});
