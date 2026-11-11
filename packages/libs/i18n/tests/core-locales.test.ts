import { describe, expect, it } from 'vitest';

import {
  getLocaleDirection,
  getLocaleLabel,
  parseAcceptLanguage,
  resolveSupportedLocale,
} from '../src/core/locales.js';

describe('getLocaleDirection', () => {
  it('reports right-to-left languages', () => {
    expect(getLocaleDirection('ar-EG')).toBe('rtl');
    expect(getLocaleDirection('he')).toBe('rtl');
  });

  it('reports everything else as left-to-right', () => {
    expect(getLocaleDirection('en-US')).toBe('ltr');
    expect(getLocaleDirection('zh-CN')).toBe('ltr');
  });

  it('does not mistake a language that merely starts with those letters', () => {
    // 'her' and 'urd' are not the RTL codes 'he' and 'ur'.
    expect(getLocaleDirection('her')).toBe('ltr');
    expect(getLocaleDirection('urd-Latn')).toBe('ltr');
  });
});

describe('resolveSupportedLocale', () => {
  const supported = ['en-US', 'zh-CN'];

  it('matches exactly, ignoring case', () => {
    expect(resolveSupportedLocale('zh-cn', supported)).toBe('zh-CN');
  });

  it('matches on the language subtag alone', () => {
    expect(resolveSupportedLocale('zh', supported)).toBe('zh-CN');
    expect(resolveSupportedLocale('zh-Hans-CN', supported)).toBe('zh-CN');
  });

  it('keeps the Chinese script when both Simplified and Traditional are offered', () => {
    const both = ['en-US', 'zh-CN', 'zh-TW'];
    expect(resolveSupportedLocale('zh-HK', both)).toBe('zh-TW');
    expect(resolveSupportedLocale('zh-Hant-TW', both)).toBe('zh-TW');
    expect(resolveSupportedLocale('zh-Hant', both)).toBe('zh-TW');
    expect(resolveSupportedLocale('zh-Hans-TW', both)).toBe('zh-CN');
    expect(resolveSupportedLocale('zh-SG', both)).toBe('zh-CN');
    expect(resolveSupportedLocale('zh', both)).toBe('zh-CN');
    expect(resolveSupportedLocale('zh-HK', supported)).toBe('zh-CN');
  });

  it('returns undefined when nothing matches', () => {
    expect(resolveSupportedLocale('fr-FR', supported)).toBeUndefined();
    expect(resolveSupportedLocale(undefined, supported)).toBeUndefined();
  });
});

describe('parseAcceptLanguage', () => {
  it('orders entries by quality, most preferred first', () => {
    expect(parseAcceptLanguage('en-US;q=0.8,zh-CN;q=0.9,fr;q=0.1')).toEqual([
      'zh-CN',
      'en-US',
      'fr',
    ]);
  });

  it('treats an entry without a quality as most preferred', () => {
    expect(parseAcceptLanguage('zh-CN,en-US;q=0.9')).toEqual([
      'zh-CN',
      'en-US',
    ]);
  });

  it('drops entries the client explicitly refuses', () => {
    expect(parseAcceptLanguage('zh-CN,en-US;q=0')).toEqual(['zh-CN']);
  });

  it('drops the wildcard', () => {
    expect(parseAcceptLanguage('zh-CN,*')).toEqual(['zh-CN']);
  });

  it('returns nothing for a missing or empty header', () => {
    expect(parseAcceptLanguage(undefined)).toEqual([]);
    expect(parseAcceptLanguage('')).toEqual([]);
  });
});

describe('getLocaleLabel', () => {
  it('names a locale in its own language, without the region', () => {
    expect(getLocaleLabel('zh-CN', ['en-US', 'zh-CN'])).toBe('中文');
    expect(getLocaleLabel('en-US', ['en-US', 'zh-CN'])).toBe('English');
  });

  it('keeps the region when another locale shares the language', () => {
    // 'zh-CN' and 'zh-TW' are both "中文"; the region is what tells them apart.
    const locales = ['zh-CN', 'zh-TW'];
    expect(getLocaleLabel('zh-CN', locales)).toContain('中国');
    expect(getLocaleLabel('zh-TW', locales)).toContain('台');
  });

  it('shortens when asked about a locale on its own', () => {
    expect(getLocaleLabel('ja-JP')).toBe('日本語');
  });
});
