/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { mkdtemp, realpath, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import PluginFlowEngineServer from '../plugin';
import {
  buildFlowSurfaceAutoSnapshot,
  getFlowSurfaceAutoSnapshotFileName,
  writeFlowSurfaceAutoSnapshot,
  type FlowSurfaceAutoSnapshot,
} from '../flow-surfaces/extractor';
import { FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION } from '../flow-surfaces/extractor/types';

const FLOW_SURFACE_PLUGIN_TEST_DATE = '2026-06-04T00:00:00.000Z';
const FLOW_SURFACE_PLUGIN_OLDER_TEST_DATE = '2026-06-03T00:00:00.000Z';
const FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE = '2026-06-05T00:00:00.000Z';

class TestPluginFlowEngineServer extends PluginFlowEngineServer {
  constructor(options: Record<string, unknown> = {}) {
    super({} as Application, options);
  }

  loadSnapshotsForTest(snapshotDir: string) {
    return this.loadFlowSurfaceAutoSnapshots(snapshotDir);
  }
}

class PackagedSnapshotPluginFlowEngineServer extends TestPluginFlowEngineServer {
  constructor(
    private readonly packageRoots: Record<string, string>,
    options: Record<string, unknown> = {},
  ) {
    super(options);
  }

  protected async resolveEnabledPluginPackageNamesForAutoSnapshots() {
    return Object.keys(this.packageRoots);
  }

  protected resolveFlowSurfaceAutoSnapshotPackageRoot(packageName: string) {
    return this.packageRoots[packageName];
  }
}

describe('PluginFlowEngineServer flow surface auto snapshots', () => {
  function createSnapshot(sourceHash: string) {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-cache-test',
      generatedAt: FLOW_SURFACE_PLUGIN_TEST_DATE,
      sourceHash,
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'CacheTestBlockModel',
          className: 'CacheTestBlockModel',
          source: 'src/client-v2/plugin.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
      ],
    });
  }

  function createPluginSnapshot(
    plugin: string,
    sourceHash: string,
    options: { pluginVersion?: string; generatedAt?: string } = {},
  ) {
    return {
      ...createSnapshot(sourceHash),
      plugin,
      ...(options.pluginVersion ? { pluginVersion: options.pluginVersion } : {}),
      ...(options.generatedAt ? { generatedAt: options.generatedAt } : {}),
    };
  }

  function createInferredAuthoringSnapshot(plugin: string, sourceHash: string, options: { currentContract?: boolean }) {
    const snapshot = createPluginSnapshot(plugin, sourceHash);
    snapshot.inferredAuthoring = {
      ...(options.currentContract ? { contractVersion: FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION } : {}),
      capabilities: [
        {
          kind: 'block',
          publicType: 'cacheTest',
          ownerPlugin: plugin,
          modelUse: 'CacheTestBlockModel',
          label: 'Cache test',
          confidence: {
            discovery: 'high',
            placement: 'high',
            tree: 'high',
            settings: 'high',
            write: 'high',
          },
          evidence: [
            {
              type: 'model',
              ref: 'CacheTestBlockModel',
            },
          ],
        },
      ],
    };
    return snapshot;
  }

  it('should keep loaded storage snapshots until a new plugin instance starts', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-plugin-cache-'));
    try {
      const firstSnapshot = createSnapshot('first-source-hash');
      const snapshotPath = await writeFlowSurfaceAutoSnapshot({
        snapshot: firstSnapshot,
        outDir,
        fileName: getFlowSurfaceAutoSnapshotFileName(firstSnapshot.plugin),
      });
      const plugin = new TestPluginFlowEngineServer({
        flowSurfaceCapabilities: {
          extractorSnapshotDir: outDir,
        },
      });

      await expect(plugin.loadSnapshotsForTest(outDir)).resolves.toMatchObject([
        {
          sourceHash: 'first-source-hash',
        },
      ]);
      const secondSnapshot = createSnapshot('second-source-hash-with-different-size');
      await writeFile(snapshotPath, `${JSON.stringify(secondSnapshot, null, 2)}\n`, 'utf8');

      expect(plugin.flowSurfaceAutoSnapshots).toMatchObject([
        {
          sourceHash: 'first-source-hash',
        },
      ]);

      const restartedPlugin = new TestPluginFlowEngineServer({
        flowSurfaceCapabilities: {
          extractorSnapshotDir: outDir,
        },
      });
      await expect(restartedPlugin.loadSnapshotsForTest(outDir)).resolves.toMatchObject([
        {
          sourceHash: 'second-source-hash-with-different-size',
        },
      ]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should let newer storage snapshots override packaged artifacts only for the same source', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-packaged-plugin-'));
    const storageOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-storage-override-'));
    try {
      const pluginName = '@nocobase/plugin-packaged-snapshot-test';
      const packagedSnapshot = createPluginSnapshot(pluginName, 'same-source-hash', {
        pluginVersion: '2.0.0',
      });
      await writeFlowSurfaceAutoSnapshot({
        snapshot: packagedSnapshot,
        outDir: join(packageRoot, 'dist', 'flow-surfaces-capabilities'),
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });
      await writeFlowSurfaceAutoSnapshot({
        snapshot: createPluginSnapshot(pluginName, 'same-source-hash', {
          pluginVersion: '2.0.0',
          generatedAt: FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE,
        }),
        outDir: storageOutDir,
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });
      await writeFlowSurfaceAutoSnapshot({
        snapshot: createPluginSnapshot('@nocobase/plugin-storage-only-snapshot-test', 'storage-only-source-hash'),
        outDir: storageOutDir,
      });
      const plugin = new PackagedSnapshotPluginFlowEngineServer({
        [pluginName]: packageRoot,
      });

      await expect(plugin.loadSnapshotsForTest(storageOutDir)).resolves.toEqual([
        expect.objectContaining({
          plugin: pluginName,
          sourceHash: 'same-source-hash',
        }),
        expect.objectContaining({
          plugin: '@nocobase/plugin-storage-only-snapshot-test',
          sourceHash: 'storage-only-source-hash',
        }),
      ]);
    } finally {
      await Promise.all([
        rm(packageRoot, { recursive: true, force: true }),
        rm(storageOutDir, { recursive: true, force: true }),
      ]);
    }
  });

  it('should load the core client-v2 auto snapshot artifact', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-core-client-'));
    const storageOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-core-storage-'));
    try {
      const corePackageName = '@nocobase/client-v2';
      await writeFlowSurfaceAutoSnapshot({
        snapshot: createPluginSnapshot(corePackageName, 'core-client-source-hash', {
          pluginVersion: '2.0.0',
        }),
        outDir: join(packageRoot, 'es', 'flow-surfaces-capabilities'),
        fileName: getFlowSurfaceAutoSnapshotFileName(corePackageName),
      });
      const plugin = new PackagedSnapshotPluginFlowEngineServer({
        [corePackageName]: packageRoot,
      });

      await expect(plugin.loadSnapshotsForTest(storageOutDir)).resolves.toEqual([
        expect.objectContaining({
          plugin: corePackageName,
          sourceHash: 'core-client-source-hash',
        }),
      ]);
    } finally {
      await Promise.all([
        rm(packageRoot, { recursive: true, force: true }),
        rm(storageOutDir, { recursive: true, force: true }),
      ]);
    }
  });

  it('should keep packaged snapshots when storage snapshots are incompatible or not newer', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-packaged-precedence-'));
    const storageOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-storage-precedence-'));
    try {
      const packagedNewerPlugin = '@nocobase/plugin-packaged-newer-snapshot-test';
      const sourceConflictPlugin = '@nocobase/plugin-source-conflict-snapshot-test';
      const versionMismatchPlugin = '@nocobase/plugin-version-mismatch-snapshot-test';
      const extractorMismatchPlugin = '@nocobase/plugin-extractor-mismatch-snapshot-test';
      const packagedOutDir = join(packageRoot, 'dist', 'flow-surfaces-capabilities');
      const cases = [
        {
          plugin: packagedNewerPlugin,
          packaged: createPluginSnapshot(packagedNewerPlugin, 'packaged-newer-source-hash', {
            pluginVersion: '2.0.0',
            generatedAt: FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE,
          }),
          storage: createPluginSnapshot(packagedNewerPlugin, 'storage-older-source-hash', {
            pluginVersion: '2.0.0',
            generatedAt: FLOW_SURFACE_PLUGIN_OLDER_TEST_DATE,
          }),
        },
        {
          plugin: sourceConflictPlugin,
          packaged: createPluginSnapshot(sourceConflictPlugin, 'packaged-current-source-hash', {
            pluginVersion: '2.0.0',
          }),
          storage: createPluginSnapshot(sourceConflictPlugin, 'storage-conflicting-source-hash', {
            pluginVersion: '2.0.0',
            generatedAt: FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE,
          }),
        },
        {
          plugin: versionMismatchPlugin,
          packaged: createPluginSnapshot(versionMismatchPlugin, 'packaged-installed-version-source-hash', {
            pluginVersion: '2.0.0',
          }),
          storage: createPluginSnapshot(versionMismatchPlugin, 'storage-old-version-source-hash', {
            pluginVersion: '1.0.0',
            generatedAt: FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE,
          }),
        },
        {
          plugin: extractorMismatchPlugin,
          packaged: createPluginSnapshot(extractorMismatchPlugin, 'same-extractor-source-hash', {
            pluginVersion: '2.0.0',
          }),
          storage: {
            ...createPluginSnapshot(extractorMismatchPlugin, 'same-extractor-source-hash', {
              pluginVersion: '2.0.0',
              generatedAt: FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE,
            }),
            extractorVersion: 'older-extractor',
          },
        },
      ];
      for (const snapshotCase of cases) {
        await writeFlowSurfaceAutoSnapshot({
          snapshot: snapshotCase.packaged,
          outDir: packagedOutDir,
          fileName: getFlowSurfaceAutoSnapshotFileName(snapshotCase.plugin),
        });
        await writeFlowSurfaceAutoSnapshot({
          snapshot: snapshotCase.storage,
          outDir: storageOutDir,
          fileName: getFlowSurfaceAutoSnapshotFileName(snapshotCase.plugin),
        });
      }
      const plugin = new PackagedSnapshotPluginFlowEngineServer(
        Object.fromEntries(cases.map((snapshotCase) => [snapshotCase.plugin, packageRoot])),
      );

      await expect(plugin.loadSnapshotsForTest(storageOutDir)).resolves.toEqual(
        [...cases]
          .sort((left, right) => left.plugin.localeCompare(right.plugin))
          .map((snapshotCase) =>
            expect.objectContaining({
              plugin: snapshotCase.plugin,
              sourceHash: snapshotCase.packaged.sourceHash,
            }),
          ),
      );
    } finally {
      await Promise.all([
        rm(packageRoot, { recursive: true, force: true }),
        rm(storageOutDir, { recursive: true, force: true }),
      ]);
    }
  });

  it('should prefer current packaged inferred authoring artifacts over stale storage snapshots', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-packaged-current-'));
    const storageOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-storage-stale-'));
    try {
      const pluginName = '@nocobase/plugin-packaged-current-snapshot-test';
      await writeFlowSurfaceAutoSnapshot({
        snapshot: createInferredAuthoringSnapshot(pluginName, 'same-source-hash', { currentContract: true }),
        outDir: join(packageRoot, 'dist', 'flow-surfaces-capabilities'),
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });
      await writeFlowSurfaceAutoSnapshot({
        snapshot: {
          ...createInferredAuthoringSnapshot(pluginName, 'same-source-hash', { currentContract: false }),
          generatedAt: FLOW_SURFACE_PLUGIN_NEWER_TEST_DATE,
        },
        outDir: storageOutDir,
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });
      const plugin = new PackagedSnapshotPluginFlowEngineServer({
        [pluginName]: packageRoot,
      });

      await expect(plugin.loadSnapshotsForTest(storageOutDir)).resolves.toEqual([
        expect.objectContaining({
          plugin: pluginName,
          inferredAuthoring: expect.objectContaining({
            contractVersion: FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION,
          }),
        }),
      ]);
    } finally {
      await Promise.all([
        rm(packageRoot, { recursive: true, force: true }),
        rm(storageOutDir, { recursive: true, force: true }),
      ]);
    }
  });

  it('should keep loaded packaged snapshots until a new plugin instance starts', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-packaged-refresh-'));
    const storageOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-packaged-refresh-storage-'));
    try {
      const pluginName = '@nocobase/plugin-packaged-refresh-test';
      await writeFlowSurfaceAutoSnapshot({
        snapshot: createPluginSnapshot(pluginName, 'first-packaged-source-hash'),
        outDir: join(packageRoot, 'dist', 'flow-surfaces-capabilities'),
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });
      const plugin = new PackagedSnapshotPluginFlowEngineServer({
        [pluginName]: packageRoot,
      });

      await expect(plugin.loadSnapshotsForTest(storageOutDir)).resolves.toEqual([
        expect.objectContaining({
          plugin: pluginName,
          sourceHash: 'first-packaged-source-hash',
        }),
      ]);

      await writeFlowSurfaceAutoSnapshot({
        snapshot: createPluginSnapshot(pluginName, 'second-packaged-source-hash'),
        outDir: join(packageRoot, 'dist', 'flow-surfaces-capabilities'),
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });

      expect(plugin.flowSurfaceAutoSnapshots).toEqual([
        expect.objectContaining({
          plugin: pluginName,
          sourceHash: 'first-packaged-source-hash',
        }),
      ]);

      const restartedPlugin = new PackagedSnapshotPluginFlowEngineServer({
        [pluginName]: packageRoot,
      });
      await expect(restartedPlugin.loadSnapshotsForTest(storageOutDir)).resolves.toEqual([
        expect.objectContaining({
          plugin: pluginName,
          sourceHash: 'second-packaged-source-hash',
        }),
      ]);
    } finally {
      await Promise.all([
        rm(packageRoot, { recursive: true, force: true }),
        rm(storageOutDir, { recursive: true, force: true }),
      ]);
    }
  });

  it('should preserve inferred authoring generated with the snapshot artifact', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-current-inference-'));
    try {
      const snapshot = createInferredAuthoringSnapshot('@nocobase/plugin-cache-test', 'source-hash', {
        currentContract: true,
      });
      await writeFlowSurfaceAutoSnapshot({
        snapshot,
        outDir,
        fileName: getFlowSurfaceAutoSnapshotFileName(snapshot.plugin),
      });

      const [loadedSnapshot] = await new TestPluginFlowEngineServer().loadSnapshotsForTest(outDir);

      expect(loadedSnapshot.inferredAuthoring).toEqual(snapshot.inferredAuthoring);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
