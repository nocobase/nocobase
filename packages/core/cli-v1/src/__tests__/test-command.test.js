/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const testCommandModule = require('../commands/test');

const { buildVitestNodeArgs, requiresNoNodeSnapshot } = testCommandModule._test;

describe('cli-v1 test command helpers', () => {
  test('requiresNoNodeSnapshot enables the Node 20+ compatibility flag', () => {
    expect(requiresNoNodeSnapshot('18.20.8')).toBe(false);
    expect(requiresNoNodeSnapshot('20.19.5')).toBe(true);
    expect(requiresNoNodeSnapshot('22.22.2')).toBe(true);
  });

  test('buildVitestNodeArgs prefixes no-node-snapshot on Node 20+', () => {
    expect(buildVitestNodeArgs(['foo.test.ts', '--single-thread=true'], '20.19.5')).toEqual([
      '--no-node-snapshot',
      '--max_old_space_size=14096',
      './node_modules/vitest/vitest.mjs',
      'foo.test.ts',
    ]);
  });

  test('buildVitestNodeArgs leaves older Node versions unchanged', () => {
    expect(buildVitestNodeArgs(['foo.test.ts'], '18.20.8')).toEqual([
      '--max_old_space_size=14096',
      './node_modules/vitest/vitest.mjs',
      'foo.test.ts',
    ]);
  });
});
