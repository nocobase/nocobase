import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppClientConfig } from '../src/config.js';
import {
  createAppI18nRuntime,
  readStoredLocale,
  writeStoredLocale,
} from '../src/i18n.js';
import { defineClientPlugins } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

const locales = {
  'en-US': async () => ({ greeting: 'Hello' }),
  'zh-CN': async () => ({ greeting: '你好' }),
};
const definition = defineAppRuntime({
  packageName: '@example/app',
  createAppConfig: createAppClientConfig,
  plugins: defineClientPlugins([]),
  locales,
});

function mount(basePath: string): void {
  document.body.innerHTML = `<script id="nocobase-runtime-config" type="application/json">${JSON.stringify(
    {
      version: 1,
      config: { app: { basePath } },
    },
  )}</script>`;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '/');
});

describe('application locale storage', () => {
  it('ignores the old shared choice in both startup paths and leaves it untouched', async () => {
    mount('/crm');
    localStorage.setItem('nocobase.locale', 'zh-CN');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const runtime = await resolveAppRuntime(definition);
    const standalone = await createAppI18nRuntime({
      defaultLocale: 'en-US',
      contributions: [
        { packageName: '@example/app', source: 'application', locales },
      ],
    });

    expect(runtime.i18n.getLocale()).toBe('en-US');
    expect(standalone.getLocale()).toBe('en-US');
    expect(getItem.mock.calls).toEqual([
      ['nocobase.locale:/crm/'],
      ['nocobase.locale:/crm/'],
    ]);
    expect(setItem).not.toHaveBeenCalled();
    writeStoredLocale('en-US');
    expect(setItem).toHaveBeenCalledExactlyOnceWith(
      'nocobase.locale:/crm/',
      'en-US',
    );
    expect(localStorage.getItem('nocobase.locale')).toBe('zh-CN');
  });

  it('keeps root and nested applications separate across switches and reloads', async () => {
    for (const [base, locale] of [
      ['/', 'zh-CN'],
      ['/apps/crm', 'en-US'],
      ['/other/crm', 'zh-CN'],
    ] as const) {
      mount(base);
      writeStoredLocale(locale);
    }
    for (const [base, expected] of [
      ['/', 'zh-CN'],
      ['/apps/crm', 'en-US'],
      ['/other/crm', 'zh-CN'],
    ] as const) {
      mount(base);
      expect((await resolveAppRuntime(definition)).i18n.getLocale()).toBe(
        expected,
      );
    }
    mount('/apps/crm');
    writeStoredLocale('zh-CN');
    mount('/');
    writeStoredLocale('en-US');
    mount('/apps/crm');
    expect((await resolveAppRuntime(definition)).i18n.getLocale()).toBe(
      'zh-CN',
    );
    mount('/other/crm');
    expect(readStoredLocale()).toBe('zh-CN');
  });

  it.each([
    ['', 'nocobase.locale:/'],
    ['/', 'nocobase.locale:/'],
    ['crm', 'nocobase.locale:/crm/'],
    ['/crm/', 'nocobase.locale:/crm/'],
    ['///apps/crm//', 'nocobase.locale:/apps/crm/'],
  ])('normalizes mount %s independently of the current route', (base, key) => {
    mount(base);
    window.history.replaceState(
      null,
      '',
      '/apps/crm/orders/42?view=list#details',
    );
    writeStoredLocale('zh-CN');
    expect(localStorage.getItem(key)).toBe('zh-CN');
    window.history.replaceState(null, '', '/unrelated');
    expect(readStoredLocale()).toBe('zh-CN');
    expect(localStorage.length).toBe(1);
  });

  it('uses the configured default when the application stores an unsupported language', async () => {
    mount('/crm');
    localStorage.setItem('nocobase.locale:/crm/', 'invalid');
    expect(
      (
        await resolveAppRuntime(definition, {
          rawPublicConfig: { i18n: { defaultLocale: 'zh-CN' } },
        })
      ).i18n.getLocale(),
    ).toBe('zh-CN');
  });

  it('keeps the default and language switching working when storage refuses access', async () => {
    mount('/crm');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const runtime = await resolveAppRuntime(definition);
    expect(runtime.i18n.getLocale()).toBe('en-US');
    await runtime.i18n.changeLanguage('zh-CN');
    expect(() => writeStoredLocale('zh-CN')).not.toThrow();
    expect(runtime.i18n.getLocale()).toBe('zh-CN');
  });

  it('does not guess a scope or touch the old key without server configuration', () => {
    localStorage.setItem('nocobase.locale', 'zh-CN');
    expect(readStoredLocale()).toBeUndefined();
    writeStoredLocale('en-US');
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem('nocobase.locale')).toBe('zh-CN');
  });
});
