/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const { toPosixPath } = require('../commands/app-dev-utils');

describe('cli-v1 app-dev utils', () => {
  test('toPosixPath normalizes Windows paths for generated browser imports', () => {
    expect(toPosixPath('C:\\Users\\tester\\app\\packages\\plugins\\demo\\src\\client\\index.tsx')).toBe(
      'C:/Users/tester/app/packages/plugins/demo/src/client/index.tsx',
    );
  });

  test('toPosixPath keeps POSIX paths unchanged', () => {
    expect(toPosixPath('/Users/tester/app/packages/plugins/demo/src/client/index.tsx')).toBe(
      '/Users/tester/app/packages/plugins/demo/src/client/index.tsx',
    );
  });
});
