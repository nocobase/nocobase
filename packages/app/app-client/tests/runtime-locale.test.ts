import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppClientConfig } from '../src/config.js';
import { createAppI18nRuntime } from '../src/i18n.js';
import { defineClientPlugins, defineClientPlugin } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

const definition = defineAppRuntime({
  packageName: '@example/app',
  createAppConfig: createAppClientConfig,
  plugins: defineClientPlugins([]),
  locales: {
    'en-US': async () => ({ greeting: 'Hello' }),
    'zh-CN': async () => ({ greeting: '你好' }),
  },
});

/** A plugin translating a language the application itself does not offer. */
const japanesePlugin = defineClientPlugin({
  packageName: '@example/plugin',
  locales: {
    'en-US': async () => ({ plugin: 'Plugin' }),
    'ja-JP': async () => ({ plugin: 'プラグイン' }),
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runtime default locale', () => {
  it.each([
    [undefined, undefined, 'en-US'],
    [undefined, 'zh-CN', 'zh-CN'],
    ['en-US', 'zh-CN', 'en-US'],
    ['zh-CN', undefined, 'zh-CN'],
    ['invalid', 'zh-CN', 'zh-CN'],
    ['invalid', 'invalid', 'en-US'],
    [undefined, 12, 'en-US'],
    [undefined, 'fr-FR', 'en-US'],
    [undefined, 'zh', 'zh-CN'],
    ['zh-Hans-CN', 'en-US', 'zh-CN'],
  ])(
    'resolves stored %s and configured %s to %s',
    async (stored, configured, expected) => {
      const setItem = vi.fn();
      vi.stubGlobal('localStorage', { getItem: () => stored ?? null, setItem });

      const runtime = await resolveAppRuntime(definition, {
        rawConfig:
          configured === undefined
            ? {}
            : { i18n: { defaultLocale: configured } },
      });

      expect(runtime.i18n.getLocale()).toBe(expected);
      expect(runtime.i18n.getLocales()).toEqual(['en-US', 'zh-CN']);
      expect(runtime.i18n.getFixedT('@example/app')('greeting')).toBe(
        expected === 'zh-CN' ? '你好' : 'Hello',
      );
      expect(setItem).not.toHaveBeenCalled();
    },
  );

  it('ignores the browser language entirely', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('navigator', { language: 'zh-CN' });

    const runtime = await resolveAppRuntime(definition, { rawConfig: {} });

    expect(runtime.i18n.getLocale()).toBe('en-US');
  });

  it('offers only the languages the application itself declares', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const withPlugin = defineAppRuntime({
      ...definition,
      plugins: defineClientPlugins([japanesePlugin()]),
    });

    const runtime = await resolveAppRuntime(withPlugin, { rawConfig: {} });

    expect(runtime.i18n.getLocales()).toEqual(['en-US', 'zh-CN']);
    // The plugin's translations still reach the languages the application does offer.
    expect(runtime.i18n.getFixedT('@example/plugin')('plugin')).toBe('Plugin');
  });

  it('accepts a function importing the locales module as well as the module itself', async () => {
    vi.stubGlobal('localStorage', { getItem: () => 'zh-CN' });
    const lazyPlugin = defineClientPlugin({
      packageName: '@example/lazy',
      locales: () =>
        Promise.resolve({
          default: {
            'en-US': async () => ({ lazy: 'Lazy' }),
            'zh-CN': async () => ({ lazy: '懒' }),
          },
        }),
    });
    const lazy = defineAppRuntime({
      ...definition,
      locales: () => Promise.resolve({ default: definition.locales! }),
      plugins: defineClientPlugins([lazyPlugin()]),
    });

    const runtime = await resolveAppRuntime(lazy, { rawConfig: {} });

    expect(runtime.i18n.getLocales()).toEqual(['en-US', 'zh-CN']);
    expect(runtime.i18n.getLocale()).toBe('zh-CN');
    expect(runtime.i18n.getFixedT('@example/lazy')('lazy')).toBe('懒');
  });

  it('refuses a configured default the application does not translate', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const withPlugin = defineAppRuntime({
      ...definition,
      plugins: defineClientPlugins([japanesePlugin()]),
    });

    const runtime = await resolveAppRuntime(withPlugin, {
      rawConfig: { i18n: { defaultLocale: 'ja-JP' } },
    });

    expect(runtime.i18n.getDefaultLocale()).toBe('en-US');
    expect(runtime.i18n.getLocales()).toEqual(['en-US', 'zh-CN']);
  });

  it('keeps the default locale in the list even with no application locales', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    const runtime = await createAppI18nRuntime({
      contributions: [],
      defaultLocale: 'fr-FR',
    });

    expect(runtime.getLocales()).toEqual(['fr-FR']);
    expect(runtime.getDefaultLocale()).toBe('fr-FR');
  });

  it('uses the configured default when storage is unavailable and still switches languages', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
    });
    const runtime = await resolveAppRuntime(definition, {
      rawConfig: { i18n: { defaultLocale: 'zh-CN' } },
    });
    expect(runtime.i18n.getLocale()).toBe('zh-CN');
    await runtime.i18n.changeLanguage('en-US');
    expect(runtime.i18n.getLocale()).toBe('en-US');
  });

  it('preserves explicit initial and fallback locale options on the i18n factory', async () => {
    vi.stubGlobal('localStorage', { getItem: () => 'en-US' });
    const runtime = await createAppI18nRuntime({
      contributions: [],
      defaultLocale: 'fr-FR',
      locales: ['en-US', 'zh-CN'],
      initialLocale: 'zh-CN',
    });
    expect(runtime.getLocale()).toBe('zh-CN');
    expect(runtime.getDefaultLocale()).toBe('fr-FR');
  });
});
