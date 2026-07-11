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
import { afterEach, describe, expect, it, vi } from 'vitest';

const buildFlowSurfaceArtifact = vi.hoisted(() => vi.fn());

vi.mock('../flowSurfaceArtifacts', () => ({ buildFlowSurfaceArtifact }));

import { buildPackages } from '../build';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  const noDtsIndex = process.argv.indexOf('--no-dts');
  if (noDtsIndex >= 0) {
    process.argv.splice(noDtsIndex, 1);
  }
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe('flow surface artifact build lifecycle', () => {
  it('generates artifacts after afterBuild hooks', async () => {
    const location = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-flow-surface-order-'));
    tempDirs.push(location);
    await fs.writeJson(path.join(location, 'package.json'), {
      name: '@example/plugin-flow-surface-order',
      version: '1.0.0',
    });
    await fs.outputFile(
      path.join(location, 'build.config.js'),
      `module.exports = { afterBuild: async () => require('fs/promises').writeFile(${JSON.stringify(
        path.join(location, 'after-build'),
      )}, '') };`,
    );
    const pkg = { name: '@example/plugin-flow-surface-order', location } as Package;
    process.argv.push('--no-dts');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    buildFlowSurfaceArtifact.mockImplementation(async () => {
      await expect(fs.pathExists(path.join(location, 'after-build'))).resolves.toBe(true);
      return { status: 'generated' };
    });

    await expect(buildPackages([pkg], 'dist', async () => undefined)).resolves.toBeUndefined();
    expect(buildFlowSurfaceArtifact).toHaveBeenCalledOnce();
  });

  it('does not fail the package build when extraction fails', async () => {
    const location = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-flow-surface-'));
    tempDirs.push(location);
    await fs.writeJson(path.join(location, 'package.json'), {
      name: '@example/plugin-flow-surface-failure',
      version: '1.0.0',
    });
    const pkg = { name: '@example/plugin-flow-surface-failure', location } as Package;
    const doBuild = vi.fn(async () => undefined);
    process.argv.push('--no-dts');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    buildFlowSurfaceArtifact.mockResolvedValue({ status: 'failed', error: 'extractor failed' });

    await expect(buildPackages([pkg], 'dist', doBuild)).resolves.toBeUndefined();
    expect(buildFlowSurfaceArtifact).toHaveBeenCalledOnce();
  });
});
