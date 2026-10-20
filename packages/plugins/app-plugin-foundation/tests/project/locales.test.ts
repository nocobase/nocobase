import { describe, expect, it } from 'vitest';

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
      expect({ locale, keys: Object.keys(translated) }).toEqual({
        locale,
        keys: Object.keys(source),
      });
      for (const [key, value] of Object.entries(source)) {
        expect(translated[key], `${locale}: ${key}`).toBeTruthy();
        expect(parameters(translated[key] ?? ''), `${locale}: ${key}`).toEqual(
          parameters(value),
        );
      }
    }
  });
});
