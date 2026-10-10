import { describe, expect, it } from 'vitest';

import { GUIDE_STEPS } from '../client/lib/guide.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';

describe('page guides', () => {
  for (const [name, locale] of [
    ['en-US', enUS],
    ['zh-CN', zhCN],
  ] as const)
    it(`gives every page a purpose and exactly its steps in ${name}`, () => {
      for (const [page, steps] of Object.entries(GUIDE_STEPS)) {
        const guide = (locale.guide as Record<string, Record<string, string>>)[
          page
        ];
        expect(Object.keys(guide ?? {}).sort()).toEqual(
          [
            'purpose',
            ...Array.from({ length: steps }, (_, i) => `step${String(i + 1)}`),
          ].sort(),
        );
      }
    });
});
