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
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildFlowSurfaceArtifact, getFlowSurfaceArtifactDir } from '../flowSurfaceArtifacts';

const tempDirs: string[] = [];
const captureLog =
  (logs: string[]) =>
  (message: string, ...details: unknown[]) => {
    logs.push([message, ...details].filter((item) => typeof item !== 'undefined').join(' '));
  };

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.map((dir) => fs.remove(dir)));
  tempDirs.length = 0;
});

async function createTempPackageDir(name = '@nocobase/plugin-flow-surface-build-test') {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-flow-surface-artifact-'));
  tempDirs.push(cwd);
  await fs.writeJson(path.join(cwd, 'package.json'), {
    name,
    version: '1.0.0',
  });
  return cwd;
}

describe('flow surface build artifacts', () => {
  test('skips packages without flow surface signals without logging', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'export const plugin = {};');
    const staleArtifact = path.join(getFlowSurfaceArtifactDir(cwd), 'stale.json');
    await fs.outputJson(staleArtifact, { stale: true });
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
    await expect(fs.pathExists(staleArtifact)).resolves.toBe(false);
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
    const generatedAts: Array<string | undefined> = [];

    const result = await buildFlowSurfaceArtifact(cwd, captureLog(logs), {
      runExtractor: async (inputTargets, options) => {
        targets.push(...inputTargets);
        outDirs.push(String(options.outDir || ''));
        generatedAts.push(options.generatedAt);
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
    expect(generatedAts).toEqual(['1970-01-01T00:00:00.000Z']);
    await expect(
      fs.pathExists(path.join(getFlowSurfaceArtifactDir(cwd), '@nocobase__plugin-flow-surface-build-test.json')),
    ).resolves.toBe(true);
  });

  test('ignores excluded test sources when checking for extraction signals', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(
      path.join(cwd, 'src/client-v2/__tests__/FakeBlockModel.test.ts'),
      'class FakeBlockModel extends FlowModel {}',
    );
    let called = false;

    const result = await buildFlowSurfaceArtifact(cwd, captureLog([]), {
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

    expect(result.status).toBe('skipped-no-signals');
    expect(called).toBe(false);
  });

  test('generates deterministic core client-v2 artifacts from its source root', async () => {
    vi.stubEnv('SOURCE_DATE_EPOCH', '0');
    const cwd = await createTempPackageDir('@nocobase/client-v2');
    await fs.outputFile(
      path.join(cwd, 'src/index.ts'),
      "flowEngine.bindModelToInterface('sequence', SequenceFieldModel);",
    );
    const calls: Array<{ targets: unknown; options: Record<string, unknown> }> = [];

    const result = await buildFlowSurfaceArtifact(cwd, captureLog([]), {
      runExtractor: async (targets, options) => {
        calls.push({ targets, options });
        return {
          ok: true,
          dryRun: false,
          exitCode: 0,
          results: [],
        };
      },
    });

    expect(result.status).toBe('generated');
    expect(calls).toEqual([
      {
        targets: [
          {
            plugin: '@nocobase/client-v2',
            packageRoot: cwd,
            sourceEntry: 'src/index.ts',
            sourceRoot: 'src',
          },
        ],
        options: {
          outDir: getFlowSurfaceArtifactDir(cwd, '@nocobase/client-v2'),
          preferMode: 'source',
          generatedAt: '1970-01-01T00:00:00.000Z',
          extractorVersion: '@nocobase/build:flow-surfaces-artifact@1',
        },
      },
    ]);
  });

  test('resolves the extractor from an installed plugin-flow-engine package', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'registerFlow("demoSettings", {});');
    const extractorRoot = path.join(cwd, 'node_modules/@nocobase/plugin-flow-engine');
    await fs.outputJson(path.join(extractorRoot, 'package.json'), {
      name: '@nocobase/plugin-flow-engine',
      version: '1.0.0',
    });
    await fs.outputFile(
      path.join(extractorRoot, 'dist/server/flow-surfaces/extractor/cli.js'),
      `exports.runFlowSurfaceExtractorCli = async (targets) => ({
        ok: true,
        dryRun: false,
        exitCode: 0,
        results: [{
          ok: true,
          plugin: targets[0].plugin,
          eventCount: 7,
          candidateCount: 3,
          warningCount: 0
        }]
      });`,
    );

    const result = await buildFlowSurfaceArtifact(cwd, captureLog([]));

    expect(result).toMatchObject({
      status: 'generated',
      summary: {
        ok: true,
        results: [
          {
            plugin: '@nocobase/plugin-flow-surface-build-test',
            eventCount: 7,
            candidateCount: 3,
          },
        ],
      },
    });
  });

  test('resolves the extractor from plugin-flow-engine itself in standalone layouts', async () => {
    const cwd = await createTempPackageDir('@nocobase/plugin-flow-engine');
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'registerFlow("demoSettings", {});');
    await fs.outputFile(
      path.join(cwd, 'dist/server/flow-surfaces/extractor/cli.js'),
      `exports.runFlowSurfaceExtractorCli = async (targets) => ({
        ok: true,
        dryRun: false,
        exitCode: 0,
        results: [{
          ok: true,
          plugin: targets[0].plugin,
          eventCount: 1,
          candidateCount: 1,
          warningCount: 0
        }]
      });`,
    );

    const result = await buildFlowSurfaceArtifact(cwd, captureLog([]));

    expect(result).toMatchObject({
      status: 'generated',
      summary: {
        results: [{ plugin: '@nocobase/plugin-flow-engine', eventCount: 1, candidateCount: 1 }],
      },
    });
  });

  test('removes partial artifacts when the extractor reports failure', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'registerFlow("demoSettings", {});');
    const partialArtifact = path.join(getFlowSurfaceArtifactDir(cwd), 'partial.json');

    const result = await buildFlowSurfaceArtifact(cwd, captureLog([]), {
      runExtractor: async () => {
        await fs.outputJson(partialArtifact, { partial: true });
        return {
          ok: false,
          dryRun: false,
          exitCode: 1,
          results: [
            {
              ok: false,
              plugin: '@nocobase/plugin-flow-surface-build-test',
              eventCount: 1,
              candidateCount: 1,
              warningCount: 0,
              errors: [{ code: 'write-failed', message: 'write failed' }],
            },
          ],
        };
      },
    });

    expect(result.status).toBe('failed');
    await expect(fs.pathExists(partialArtifact)).resolves.toBe(false);
  });

  test('returns a failed result when the extractor throws', async () => {
    const cwd = await createTempPackageDir();
    await fs.outputFile(path.join(cwd, 'src/client-v2/index.ts'), 'registerFlow("demoSettings", {});');
    const staleArtifact = path.join(getFlowSurfaceArtifactDir(cwd), 'stale.json');
    await fs.outputJson(staleArtifact, { stale: true });
    const logs: string[] = [];

    const result = await buildFlowSurfaceArtifact(cwd, captureLog(logs), {
      runExtractor: async (_targets, options) => {
        await fs.outputJson(path.join(String(options.outDir), 'partial.json'), { partial: true });
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
    await expect(fs.pathExists(staleArtifact)).resolves.toBe(false);
    await expect(fs.pathExists(getFlowSurfaceArtifactDir(cwd))).resolves.toBe(false);
  });
});
