/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import { buildFlowSurfaceArtifact, getFlowSurfaceArtifactDir } from '../flowSurfaceArtifacts';

const tempDirs: string[] = [];
const captureLog = (logs: string[]) => (message: string, ...details: unknown[]) => {
  logs.push([message, ...details].filter((item) => typeof item !== 'undefined').join(' '));
};

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

async function createTempPackageDir() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-flow-surface-artifact-'));
  tempDirs.push(cwd);
  await fs.writeJson(path.join(cwd, 'package.json'), {
    name: '@nocobase/plugin-flow-surface-build-test',
    version: '1.0.0',
  });
  return cwd;
}

describe('flow surface build artifacts', () => {
  test('skips packages without flow surface signals without logging', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'export const plugin = {};');
    const logs: string[] = [];
    let called = false;

    const result = await buildFlowSurfaceArtifact(cwd, captureLog(logs), {
      runExtractor: async () => {
        called = true;
        return {
          ok: true,
          dryRun: false,
          exitCode: 0,
          results: [],
        };
      },
    });

    expect(result).toEqual({
      status: 'skipped-no-signals',
    });
    expect(called).toBe(false);
    expect(logs).toEqual([]);
  });

  test('generates plugin dist snapshot artifacts when flow surface signals exist', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(
      path.join(cwd, 'src/client-v2/index.ts'),
      [
        'class DemoBlockModel extends FlowModel {}',
        'DemoBlockModel.define({ createModelOptions: { use: "DemoBlockModel" } });',
        'engine.registerFlow("demoSettings", {});',
      ].join('\n'),
    );
    const logs: string[] = [];
    const targets: unknown[] = [];
    const outDirs: string[] = [];

    const result = await buildFlowSurfaceArtifact(cwd, captureLog(logs), {
      runExtractor: async (inputTargets, options) => {
        targets.push(...inputTargets);
        outDirs.push(String(options.outDir || ''));
        await fs.outputJson(path.join(String(options.outDir), '@nocobase__plugin-flow-surface-build-test.json'), {
          version: 1,
          plugin: '@nocobase/plugin-flow-surface-build-test',
        });
        return {
          ok: true,
          dryRun: false,
          exitCode: 0,
          results: [
            {
              ok: true,
              plugin: '@nocobase/plugin-flow-surface-build-test',
              snapshotPath: path.join(String(options.outDir), '@nocobase__plugin-flow-surface-build-test.json'),
              eventCount: 2,
              candidateCount: 1,
              warningCount: 0,
            },
          ],
        };
      },
    });

    expect(result.status).toBe('generated');
    expect(logs).toEqual(['flow surface snapshot artifact']);
    expect(targets).toEqual([
      {
        plugin: '@nocobase/plugin-flow-surface-build-test',
        packageRoot: cwd,
      },
    ]);
    expect(outDirs).toEqual([getFlowSurfaceArtifactDir(cwd)]);
    await expect(
      fs.pathExists(path.join(getFlowSurfaceArtifactDir(cwd), '@nocobase__plugin-flow-surface-build-test.json')),
    ).resolves.toBe(true);
  });

  test('does not fail plugin builds when extractor throws', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'registerFlow("demoSettings", {});');
    const logs: string[] = [];

    const result = await buildFlowSurfaceArtifact(cwd, captureLog(logs), {
      runExtractor: async () => {
        throw new Error('extractor failed');
      },
    });

    expect(result).toEqual({
      status: 'failed',
      error: 'extractor failed',
    });
    expect(logs).toEqual([
      'flow surface snapshot artifact',
      'flow surface snapshot artifact skipped: %s extractor failed',
    ]);
  });
});
