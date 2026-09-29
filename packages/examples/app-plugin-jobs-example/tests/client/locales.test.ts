import { expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
}

it('translates every message into both languages', () => {
  expect(keys(zhCN).sort()).toEqual(keys(enUS).sort());
});
