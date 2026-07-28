/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';

const packageRoot = path.resolve(__dirname, '../..');

describe('@nocobase/runjs package exports', () => {
  it('exposes only supported public entry points', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };

    expect(Object.keys(packageJson.exports).sort()).toEqual(
      [
        '.',
        './compiler',
        './compiler/build-identity',
        './compiler/portable',
        './package.json',
        './server',
        './settings',
      ].sort(),
    );
  });
});
