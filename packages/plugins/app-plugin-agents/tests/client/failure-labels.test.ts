/** Every reason a run can fail with has wording in each locale, so a failed run's notice never shows a raw key. */
import { FAILURE_REASONS } from '@nocobase/agent-protocol';
import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

describe('run failure wording', () => {
  for (const [locale, resource] of [
    ['en-US', enUS],
    ['zh-CN', zhCN],
  ] as const)
    it(`names every failure reason in ${locale}`, () => {
      const failures = resource.failures as Record<string, unknown>;
      expect(
        FAILURE_REASONS.filter(
          (reason) => typeof failures[reason] !== 'string',
        ),
      ).toEqual([]);
    });
});
