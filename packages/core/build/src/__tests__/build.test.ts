/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Package } from '@lerna/package';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';

import { buildPackages } from '../build';

const tempDirs: string[] = [];
const originalArgv = [...process.argv];

afterEach(async () => {
  process.argv = [...originalArgv];
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

describe('buildPackages', () => {
  test('runs a package prebuild script before building its source', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-prebuild-'));
    tempDirs.push(cwd);
    await fs.outputJson(path.join(cwd, 'package.json'), {
      name: '@nocobase/test-prebuild',
      version: '1.0.0',
      license: 'Apache-2.0',
      scripts: {
        prebuild: 'node prebuild.js',
      },
    });
    await fs.outputFile(
      path.join(cwd, 'prebuild.js'),
      "require('fs').writeFileSync('prebuild-marker.txt', 'ready');\n",
    );

    process.argv = [...originalArgv, '--no-dts'];
    let markerExistsDuringBuild = false;
    await buildPackages(
      [{ name: '@nocobase/test-prebuild', location: cwd } as Package],
      'lib',
      async (packageDirectory) => {
        markerExistsDuringBuild = await fs.pathExists(path.join(packageDirectory, 'prebuild-marker.txt'));
        await fs.outputFile(path.join(packageDirectory, 'lib/index.js'), 'module.exports = {};\n');
      },
    );

    expect(markerExistsDuringBuild).toBe(true);
  });
});
