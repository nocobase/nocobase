/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
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
});
