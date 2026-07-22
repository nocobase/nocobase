/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import type { Database } from '@nocobase/database';
import { vi } from 'vitest';

import { NAMESPACE } from '../../constants';
import packageJson from '../../../package.json';
import PluginLightExtensionServer from '../plugin';
import { GenericRunJSHardDeleteMigrationService } from '../services/GenericRunJSHardDeleteMigrationService';

describe('plugin-light-extension bootstrap', () => {
  it('distinguishes a fresh install from a partially initialized migration schema', async () => {
    const existingTables = new Set<string>();
    const fakeDb = {
      hasCollection: vi.fn(() => true),
      getCollection: vi.fn((name: string) => ({ getTableNameWithSchema: () => name })),
      sequelize: {
        getQueryInterface: () => ({ tableExists: vi.fn(async (name: string) => existingTables.has(name)) }),
      },
    } as unknown as Database;
    const service = new GenericRunJSHardDeleteMigrationService(fakeDb);

    existingTables.add('flowModels');
    await expect(service.isAvailable()).resolves.toBe(false);

    existingTables.add('lightExtensionEntries');
    await expect(service.isAvailable()).rejects.toMatchObject({
      details: expect.objectContaining({
        reasonCode: 'migration-schema-incomplete',
        existingTables: ['lightExtensionEntries'],
        missingTables: expect.arrayContaining(['lightExtensionReferences', 'vscFileSyncJobs']),
      }),
    });
  });

  it('migrates before the invariant while enabling, but only asserts on normal startup', async () => {
    const plugin = new PluginLightExtensionServer({} as Application, {
      name: 'light-extension',
      packageName: NAMESPACE,
      enabled: false,
    });
    const order: string[] = [];
    const gate = plugin as unknown as {
      createGenericRunJSMigrationService: () => {
        migrate: () => Promise<void>;
        assertNoLegacyData: () => Promise<void>;
      };
      runGenericRunJSMigrationGate: () => Promise<void>;
    };
    vi.spyOn(gate, 'createGenericRunJSMigrationService').mockReturnValue({
      async migrate() {
        order.push('migrate');
      },
      async assertNoLegacyData() {
        order.push('assert');
      },
    });

    await gate.runGenericRunJSMigrationGate();
    expect(order).toEqual(['migrate', 'assert']);

    order.length = 0;
    plugin.enabled = true;
    await gate.runGenericRunJSMigrationGate();
    expect(order).toEqual(['assert']);
  });

  it('keeps lifecycle hooks safe without a full app', async () => {
    expect(packageJson.peerDependencies).not.toHaveProperty('@nocobase/plugin-vsc-file');
    expect(packageJson.peerDependencies).toHaveProperty('@nocobase/client');
    expect(packageJson.peerDependencies).toHaveProperty('@nocobase/plugin-environment-variables');
    expect(packageJson.peerDependencies).not.toHaveProperty('@nocobase/plugin-file-manager');

    const plugin = new PluginLightExtensionServer({} as Application, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });

    expect(plugin.afterAdd()).toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
    await expect(plugin.install()).resolves.toBeUndefined();
    expect(plugin.getName()).toBe('light-extension');
    expect('createRepository' in plugin).toBe(false);
  });

  it('hosts VSC capabilities and recovers Push before Pull with one listener across reloads', async () => {
    const afterStartListeners = new Set<() => Promise<void>>();
    const defineResource = vi.fn();
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: { allow: vi.fn(), registerSnippet: vi.fn() },
      resourceManager: { define: defineResource, options: {} },
      auditManager: {
        registerActions: vi.fn(),
        log: vi.fn(),
      },
      use: vi.fn(),
      on: vi.fn((eventName: string, listener: () => Promise<void>) => {
        if (eventName === 'afterStart') {
          afterStartListeners.add(listener);
        }
      }),
      off: vi.fn((eventName: string, listener: () => Promise<void>) => {
        if (eventName === 'afterStart') {
          afterStartListeners.delete(listener);
        }
      }),
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });
    const migrationGate = vi
      .spyOn(plugin as unknown as { runGenericRunJSMigrationGate: () => Promise<void> }, 'runGenericRunJSMigrationGate')
      .mockResolvedValue();

    await plugin.load();
    expect(migrationGate).toHaveBeenCalledTimes(1);
    expect(migrationGate.mock.invocationCallOrder[0]).toBeLessThan(defineResource.mock.invocationCallOrder[0]);
    expect(afterStartListeners).toHaveLength(1);
    await plugin.load();
    expect(migrationGate).toHaveBeenCalledTimes(2);
    expect(afterStartListeners).toHaveLength(1);
    const order: string[] = [];
    const runtime = plugin.getRemoteSyncRuntime();
    vi.spyOn(runtime, 'recoverPushJobs').mockImplementation(async () => {
      order.push('push');
    });
    const listRecoverablePullJobs = vi
      .spyOn(runtime.getPullCoordinator(), 'listRecoverablePullJobs')
      .mockImplementation(async () => {
        order.push('pull');
        return [];
      });

    await plugin.afterEnable();
    expect(listRecoverablePullJobs).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['push', 'pull']);
    await Promise.all([...afterStartListeners].map((listener) => listener()));
    expect(listRecoverablePullJobs).toHaveBeenCalledTimes(2);
    expect(order).toEqual(['push', 'pull', 'push', 'pull']);

    await plugin.afterDisable();
    expect(afterStartListeners).toHaveLength(0);
    expect(() => plugin.getRemoteSyncRuntime()).toThrow('Remote sync runtime is not loaded');
  });
});
