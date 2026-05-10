/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getPluginBrowserSourcePackages,
  getPackageNameFromString,
  getPackagesFromFiles,
  isValidPackageName,
} from '../../../../build/src/utils/buildPluginUtils';

describe('buildPluginUtils package extraction', () => {
  it('should treat dotted package names as valid runtime dependencies', () => {
    expect(isValidPackageName('big.js')).toBe(true);
    expect(isValidPackageName('@scope/pkg.name')).toBe(true);
    expect(getPackageNameFromString('big.js')).toBe('big.js');
    expect(getPackageNameFromString('@scope/pkg.name/subpath')).toBe('@scope/pkg.name');
  });

  it('should extract dotted package names from import and require statements', () => {
    const packages = getPackagesFromFiles([
      [
        "import Big from 'big.js';",
        "import foo from '@scope/pkg.name';",
        "const bar = require('json-pointer');",
      ].join('\n'),
    ]);

    expect(packages).toEqual(expect.arrayContaining(['big.js', '@scope/pkg.name', 'json-pointer']));
  });

  it('should discover client-v2 runtime packages for client lane relative imports', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-plugin-browser-source-'));

    try {
      fs.mkdirSync(path.join(tempRoot, 'src/client'), { recursive: true });
      fs.mkdirSync(path.join(tempRoot, 'src/client-v2/flow'), { recursive: true });
      fs.mkdirSync(path.join(tempRoot, 'src/server'), { recursive: true });

      fs.writeFileSync(
        path.join(tempRoot, 'src/client/index.tsx'),
        ["import React from 'react';", "import '../client-v2/flow/model';", 'export default React;'].join('\n'),
      );
      fs.writeFileSync(
        path.join(tempRoot, 'src/client-v2/flow/model.ts'),
        [
          "import { titleField } from '@nocobase/client-v2';",
          "import { defineAction } from '@nocobase/flow-engine';",
          'export const model = defineAction({ ...titleField, name: "bulkEditTitleField" });',
        ].join('\n'),
      );
      fs.writeFileSync(path.join(tempRoot, 'src/server/plugin.ts'), "import Koa from 'koa';\nexport default Koa;");

      const packages = getPluginBrowserSourcePackages([tempRoot], []);

      expect(packages).toEqual(expect.arrayContaining(['react', '@nocobase/client-v2', '@nocobase/flow-engine']));
      expect(packages).not.toContain('koa');
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
