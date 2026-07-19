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
  it('declares the vsc-file dependency and keeps lifecycle hooks safe without a full app', async () => {
    expect(packageJson.peerDependencies['@nocobase/plugin-vsc-file']).toBe(packageJson.version);

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

  it('registers one Pull recovery listener across reloads and runs a one-shot scan after enable', async () => {
    const listRecoverablePullJobs = vi.fn(async () => []);
    const runtime = {
      getPullCoordinator: () => ({ listRecoverablePullJobs }),
    };
    const registrar = {
      registerPermissionHook: vi.fn(() => vi.fn()),
      getPermissionHookRegistry: () => ({}),
      getRunJSSourceAdapterRegistry: () => ({}),
      getRemoteSyncRuntime: () => runtime,
    };
    const afterStartListeners = new Set<() => Promise<void>>();
    const app = {
      db: {} as Database,
      acl: { allow: vi.fn(), registerSnippet: vi.fn() },
      resourceManager: { define: vi.fn(), options: {} },
      pm: {
        get: vi.fn(() => registrar),
        getPlugins: vi.fn(() => new Map([['vsc-file', registrar]])),
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
    await plugin.load();
    expect(afterStartListeners).toHaveLength(1);

    await plugin.afterEnable();
    expect(listRecoverablePullJobs).toHaveBeenCalledTimes(1);

    await plugin.afterDisable();
    expect(afterStartListeners).toHaveLength(0);
  });
});
