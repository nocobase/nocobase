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

describe('plugin-light-extension bootstrap', () => {
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
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: { allow: vi.fn(), registerSnippet: vi.fn() },
      resourceManager: { define: vi.fn(), options: {} },
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

    await plugin.load();
    expect(afterStartListeners).toHaveLength(1);
    await plugin.load();
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
