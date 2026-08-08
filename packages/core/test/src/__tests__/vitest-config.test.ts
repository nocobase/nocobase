/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, test } from 'vitest';

import { defineConfig, getFilterInclude } from '../../vitest.mjs';

const originalArgv = [...process.argv];
const originalTestEnv = process.env.TEST_ENV;

afterEach(() => {
  process.argv = [...originalArgv];

  if (originalTestEnv === undefined) {
    delete process.env.TEST_ENV;
    return;
  }

  process.env.TEST_ENV = originalTestEnv;
});

describe('vitest test routing', () => {
  test('server-side config excludes plugin client-v2 tests', () => {
    process.env.TEST_ENV = 'server-side';
    process.argv = ['node', 'vitest'];

    const config = defineConfig();

    expect(config.test.exclude).toContain('packages/**/src/client-v2/**/*');
  });

  test('client-side package filter includes plugin client-v2 tests', () => {
    process.argv = ['node', 'vitest', 'packages/plugins/@nocobase/plugin-acl'];

    expect(getFilterInclude(false).include).toContain(
      'packages/plugins/@nocobase/plugin-acl/src/client-v2/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    );
  });

  test('client-side config includes the mixed RunJS workspace package', () => {
    process.env.TEST_ENV = 'client-side';
    process.argv = ['node', 'vitest'];

    const config = defineConfig();

    expect(config.test.exclude).toContain('packages/core/!(sdk|client|client-v2|flow-engine|runjs-workspace)/**/*');
    expect(config.test.exclude).toContain('packages/**/src/server/**/*');
  });

  test('an explicit __tests__ directory includes its test files directly', () => {
    process.argv = ['node', 'vitest', 'packages/core/runjs-workspace/src/client-v2/__tests__'];

    expect(getFilterInclude(false).include).toEqual([
      'packages/core/runjs-workspace/src/client-v2/__tests__/**/*.{test,spec}.{ts,tsx}',
    ]);
  });
});
