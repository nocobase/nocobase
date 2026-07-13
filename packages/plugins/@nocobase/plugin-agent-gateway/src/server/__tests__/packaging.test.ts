/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'child_process';
import { createRequire } from 'module';
import { mkdtemp, readFile, rm } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const PLUGIN_ROOT = path.resolve(__dirname, '../../..');
const REPOSITORY_ROOT = path.resolve(PLUGIN_ROOT, '../../../..');

interface PackedNodeLifecycleModule {
  readBootstrapScriptAsset: () => Promise<string>;
}

describe('agent gateway package contents', () => {
  it('loads the bootstrap runtime asset from a real packed install', async () => {
    const tempDirectory = await mkdtemp(path.resolve(PLUGIN_ROOT, '.packed-install-'));

    try {
      await execFileAsync('yarn', ['build', '@nocobase/plugin-agent-gateway'], {
        cwd: REPOSITORY_ROOT,
        maxBuffer: 16 * 1024 * 1024,
      });
      const { stdout } = await execFileAsync(
        'npm',
        ['pack', PLUGIN_ROOT, '--pack-destination', tempDirectory, '--json'],
        {
          cwd: PLUGIN_ROOT,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      const packResult = JSON.parse(stdout) as Array<{
        filename: string;
        files: Array<{ path: string }>;
      }>;
      const packageInfo = packResult[0];
      const packedPaths = packageInfo.files.map((file) => file.path);

      expect(packedPaths).toContain('dist/server/assets/install-agent-gateway-daemon.sh');
      expect(packedPaths.some((filePath) => filePath.startsWith('scripts/'))).toBe(false);
      expect(packedPaths).not.toContain('scripts/final-agent-gateway-acceptance.ts');

      await execFileAsync('tar', ['-xzf', path.resolve(tempDirectory, packageInfo.filename), '-C', tempDirectory]);

      const packedPackageRoot = path.resolve(tempDirectory, 'package');
      const nodeLifecyclePath = path.resolve(packedPackageRoot, 'dist/server/actions/nodeLifecycle.js');
      const packedRequire = createRequire(nodeLifecyclePath);
      const nodeLifecycle = packedRequire(nodeLifecyclePath) as PackedNodeLifecycleModule;
      const script = await nodeLifecycle.readBootstrapScriptAsset();

      expect(script).toMatch(/^#!\/usr\/bin\/env bash/);
      expect(script).toContain('/api/agent-gateway/daemon-package.tgz');
      expect(
        await readFile(path.resolve(packedPackageRoot, 'dist/server/assets/install-agent-gateway-daemon.sh'), 'utf8'),
      ).toBe(script);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }, 180_000);
});
