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

describe('flow surface artifact build failures', () => {
  it('fails builds by default and keeps an explicit compatibility escape hatch', async () => {
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

    await expect(buildPackages([pkg], 'dist', doBuild)).rejects.toThrow(
      'Flow surface snapshot artifact generation failed: extractor failed',
    );

    vi.stubEnv('FLOW_SURFACE_ARTIFACT_OPTIONAL', 'true');
    await expect(buildPackages([pkg], 'dist', doBuild)).resolves.toBeUndefined();
  });
});
