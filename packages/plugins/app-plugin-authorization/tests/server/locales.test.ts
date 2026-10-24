import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import locales from '../../client/locales/index.js';
import zhCN from '../../client/locales/zh-CN.js';
import serverEnUS from '../../server/locales/en-US.js';
import serverLocales from '../../server/locales/index.js';
import serverZhCN from '../../server/locales/zh-CN.js';

/** Every leaf, as a dotted path, so a missing or extra key names itself. */
function keys(value: unknown, prefix: string = ''): readonly string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([name, child]) =>
    keys(child, prefix ? `${prefix}.${name}` : name),
  );
}

function read(catalogue: unknown, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        typeof node === 'object' && node !== null
          ? Reflect.get(node, part)
          : undefined,
      catalogue,
    );
  return typeof value === 'string' ? value : '';
}

describe.each([
  ['client', enUS, zhCN, locales],
  ['server', serverEnUS, serverZhCN, serverLocales],
] as const)('%s locales', (_runtime, english, chinese, modules) => {
  it('declares the same keys in both languages', () => {
    expect(keys(chinese).toSorted()).toEqual(keys(english).toSorted());
  });

  it('translates rather than copying the English', () => {
    // A leaf whose two languages are identical is either untranslated or a
    // placeholder-only string, such as an interpolation with no words of its own.
    const copied = keys(english).filter((key) => {
      const value = read(english, key);
      return (
        value === read(chinese, key) &&
        /\p{L}/u.test(value.replace(/\{\{\w+\}\}/gu, ''))
      );
    });
    expect(copied).toEqual([]);
  });

  it('loads one module per locale', () => {
    expect(Object.keys(modules).toSorted()).toEqual([
      'de-DE',
      'en-US',
      'es-ES',
      'fr-FR',
      'id-ID',
      'ja-JP',
      'pt-BR',
      'vi-VN',
      'zh-CN',
      'zh-TW',
    ]);
  });
});

// Both runtimes share option vocabulary without copying translation strings.
it('makes option vocabulary available on the client', () => {
  expect(enUS.options).toBe(serverEnUS.options);
  expect(zhCN.options).toBe(serverZhCN.options);
});
