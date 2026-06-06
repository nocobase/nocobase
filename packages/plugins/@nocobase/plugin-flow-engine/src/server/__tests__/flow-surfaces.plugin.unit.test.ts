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

const FLOW_SURFACE_PLUGIN_TEST_DATE = '2026-06-04T00:00:00.000Z';

type FlowSurfaceAutoSnapshotRefreshInternals = {
  flowSurfaceAutoSnapshotRefreshPromise?: Promise<readonly FlowSurfaceAutoSnapshot[]>;
  flowSurfaceAutoSnapshotRefreshCacheKey?: string;
  flowSurfaceAutoSnapshotCacheKey?: string;
};

class TestPluginFlowEngineServer extends PluginFlowEngineServer {
  constructor(options: Record<string, unknown> = {}) {
    super({} as Application, options);
  }

  get refreshPromiseForTest() {
    return (this as unknown as FlowSurfaceAutoSnapshotRefreshInternals).flowSurfaceAutoSnapshotRefreshPromise;
  }

  get refreshCacheKeyForTest() {
    return (this as unknown as FlowSurfaceAutoSnapshotRefreshInternals).flowSurfaceAutoSnapshotRefreshCacheKey;
  }

  get snapshotCacheKeyForTest() {
    return (this as unknown as FlowSurfaceAutoSnapshotRefreshInternals).flowSurfaceAutoSnapshotCacheKey;
  }
}

class ControlledRefreshPluginFlowEngineServer extends TestPluginFlowEngineServer {
  loadCalls = 0;

  constructor(
    private readonly cacheKeys: string[],
    private readonly loaders: Array<() => Promise<readonly FlowSurfaceAutoSnapshot[]>>,
  ) {
    super();
  }

  protected async getFlowSurfaceAutoSnapshotCacheKey() {
    return this.cacheKeys.shift() || 'fallback-cache-key';
  }

  protected loadFlowSurfaceAutoSnapshotsFromStorage() {
    this.loadCalls += 1;
    return this.loaders.shift()?.() || Promise.resolve([]);
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

describe('PluginFlowEngineServer flow surface auto snapshot cache', () => {
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

  function createPluginSnapshot(plugin: string, sourceHash: string) {
    return {
      ...createSnapshot(sourceHash),
      plugin,
    };
  }

  it('should refresh snapshots when an existing snapshot file is overwritten in place', async () => {
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

      await expect(plugin.refreshFlowSurfaceAutoSnapshots(outDir)).resolves.toMatchObject([
        {
          sourceHash: 'first-source-hash',
        },
      ]);
      const firstCacheKey = plugin.snapshotCacheKeyForTest;

      const secondSnapshot = createSnapshot('second-source-hash-with-different-size');
      await writeFile(snapshotPath, `${JSON.stringify(secondSnapshot, null, 2)}\n`, 'utf8');

      await expect(plugin.refreshFlowSurfaceAutoSnapshots(outDir)).resolves.toMatchObject([
        {
          sourceHash: 'second-source-hash-with-different-size',
        },
      ]);
      expect(plugin.snapshotCacheKeyForTest).not.toBe(firstCacheKey);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should load packaged plugin snapshot artifacts and let storage snapshots override them', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-packaged-plugin-'));
    const storageOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-storage-override-'));
    try {
      const pluginName = '@nocobase/plugin-packaged-snapshot-test';
      const packagedSnapshot = createPluginSnapshot(pluginName, 'packaged-source-hash');
      await writeFlowSurfaceAutoSnapshot({
        snapshot: packagedSnapshot,
        outDir: join(packageRoot, 'dist', 'flow-surfaces-capabilities'),
        fileName: getFlowSurfaceAutoSnapshotFileName(pluginName),
      });
      await writeFlowSurfaceAutoSnapshot({
        snapshot: createPluginSnapshot(pluginName, 'storage-source-hash'),
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

      await expect(plugin.refreshFlowSurfaceAutoSnapshots(storageOutDir, { force: true })).resolves.toEqual([
        expect.objectContaining({
          plugin: pluginName,
          sourceHash: 'storage-source-hash',
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

  it('should refresh packaged plugin snapshots when packaged artifacts are overwritten', async () => {
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

      await expect(plugin.refreshFlowSurfaceAutoSnapshots(storageOutDir, { force: true })).resolves.toEqual([
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

      await expect(plugin.refreshFlowSurfaceAutoSnapshots(storageOutDir)).resolves.toEqual([
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

  it('should reuse only same-key in-flight snapshot refreshes and reload after changed keys', async () => {
    const firstSnapshot = createSnapshot('first-source-hash');
    const secondSnapshot = createSnapshot('second-source-hash');
    let resolveSameKeyRefresh: (snapshots: readonly FlowSurfaceAutoSnapshot[]) => void;
    const sameKeyPlugin = new ControlledRefreshPluginFlowEngineServer(
      ['same-key', 'same-key'],
      [
        () =>
          new Promise((resolve) => {
            resolveSameKeyRefresh = resolve;
          }),
      ],
    );

    const firstSameKeyRefresh = sameKeyPlugin.refreshFlowSurfaceAutoSnapshots('snapshots');
    const secondSameKeyRefresh = sameKeyPlugin.refreshFlowSurfaceAutoSnapshots('snapshots');

    await Promise.resolve();
    expect(sameKeyPlugin.loadCalls).toBe(1);
    if (!resolveSameKeyRefresh) {
      throw new Error('same-key snapshot refresh did not start');
    }
    resolveSameKeyRefresh([firstSnapshot]);
    await expect(Promise.all([firstSameKeyRefresh, secondSameKeyRefresh])).resolves.toEqual([
      [firstSnapshot],
      [firstSnapshot],
    ]);
    expect(sameKeyPlugin.refreshPromiseForTest).toBeUndefined();
    expect(sameKeyPlugin.refreshCacheKeyForTest).toBeUndefined();

    let resolveOldKeyRefresh: (snapshots: readonly FlowSurfaceAutoSnapshot[]) => void;
    const changedKeyPlugin = new ControlledRefreshPluginFlowEngineServer(
      ['old-key', 'new-key', 'new-key'],
      [
        () =>
          new Promise((resolve) => {
            resolveOldKeyRefresh = resolve;
          }),
        () => Promise.resolve([secondSnapshot]),
      ],
    );

    const oldKeyRefresh = changedKeyPlugin.refreshFlowSurfaceAutoSnapshots('snapshots');
    const newKeyRefresh = changedKeyPlugin.refreshFlowSurfaceAutoSnapshots('snapshots');

    await Promise.resolve();
    expect(changedKeyPlugin.loadCalls).toBe(1);
    if (!resolveOldKeyRefresh) {
      throw new Error('old-key snapshot refresh did not start');
    }
    resolveOldKeyRefresh([firstSnapshot]);
    await expect(oldKeyRefresh).resolves.toEqual([firstSnapshot]);
    await expect(newKeyRefresh).resolves.toEqual([secondSnapshot]);
    expect(changedKeyPlugin.loadCalls).toBe(2);
    expect(changedKeyPlugin.flowSurfaceAutoSnapshots).toEqual([secondSnapshot]);
    expect(changedKeyPlugin.refreshPromiseForTest).toBeUndefined();
    expect(changedKeyPlugin.refreshCacheKeyForTest).toBeUndefined();
  });

  it('should clear the in-flight snapshot refresh key after loader failures', async () => {
    const plugin = new ControlledRefreshPluginFlowEngineServer(
      ['failed-key'],
      [
        async () => {
          throw new Error('snapshot loader failed');
        },
      ],
    );

    await expect(plugin.refreshFlowSurfaceAutoSnapshots('snapshots')).rejects.toThrow('snapshot loader failed');
    expect(plugin.refreshPromiseForTest).toBeUndefined();
    expect(plugin.refreshCacheKeyForTest).toBeUndefined();
  });
});
