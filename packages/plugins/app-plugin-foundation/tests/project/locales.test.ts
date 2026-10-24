import { describe, expect, it } from 'vitest';
import { I18nRuntime } from '@nocobase/i18n';

import enUS from '../../client/locales/en-US.js';
import locales from '../../client/locales/index.js';

function leaves(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      typeof child === 'string'
        ? [[`${prefix}${key}`, child]]
        : Object.entries(leaves(child, `${prefix}${key}.`)),
    ),
  );
}

function parameters(value: string): string[] {
  return [...value.matchAll(/{{(\w+)}}/g)]
    .map((match) => match[1] ?? '')
    .sort();
}

describe('Foundation translations', () => {
  it('ships all ten locales with complete resources and matching interpolation parameters', async () => {
    expect(Object.keys(locales)).toEqual([
      'en-US',
      'zh-CN',
      'zh-TW',
      'ja-JP',
      'es-ES',
      'pt-BR',
      'fr-FR',
      'de-DE',
      'vi-VN',
      'id-ID',
    ]);
    const source = leaves(enUS);
    for (const [locale, loader] of Object.entries(locales)) {
      const module = await loader();
      const translated = leaves(module.default);
      for (const key of Object.keys(translated)) {
        const sourceKey = key.replace(/_(zero|two|few|many)$/, '_other');
        expect(sourceKey in source, `${locale}: unexpected key ${key}`).toBe(
          true,
        );
        expect(parameters(translated[key] ?? ''), `${locale}: ${key}`).toEqual(
          parameters(source[sourceKey] ?? ''),
        );
      }
      for (const [key, value] of Object.entries(source)) {
        expect(translated[key], `${locale}: ${key}`).toBeTruthy();
        expect(parameters(translated[key] ?? ''), `${locale}: ${key}`).toEqual(
          parameters(value),
        );
      }
    }
  });
  it('resolves plural counts in every locale without falling back to English', async () => {
    const namespace = '@nocobase/app-plugin-foundation';
    const runtime = new I18nRuntime({
      defaultLocale: 'en-US',
      locales: Object.keys(locales),
    });
    runtime.registerNamespace(namespace, locales);
    await runtime.init('en-US');
    try {
      for (const locale of Object.keys(locales)) {
        await runtime.changeLanguage(locale);
        for (const key of Object.keys(leaves(enUS)).filter((key) =>
          key.endsWith('_other'),
        )) {
          const base = key.slice(0, -6);
          for (const count of [0, 1, 2, 5, 1_000_000]) {
            const result = runtime.i18n.t(base, {
              lng: locale,
              ns: namespace,
              count,
              returnDetails: true,
            });
            expect(result.usedLng, `${locale}:${base}:${count}`).toBe(locale);
            expect(result.exactUsedKey).toBe(
              `${base}_${new Intl.PluralRules(locale).select(count)}`,
            );
          }
        }
      }
    } finally {
      runtime.i18n.off();
    }
  });
});
