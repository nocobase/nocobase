/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { BACKUP_RESTORE_RUNTIME_KEY, BackupRestoreRuntime } from '../constants';
import { PluginBackupsClientV2 } from '../plugin';

function createPlugin(app: Record<string, unknown> = {}) {
  let runtime: BackupRestoreRuntime | undefined;
  const defineProperty = vi.fn((key: string, descriptor: { value: BackupRestoreRuntime }) => {
    if (key === BACKUP_RESTORE_RUNTIME_KEY) {
      runtime = descriptor.value;
    }
  });
  const addMenuItem = vi.fn();
  const addPageTabItem = vi.fn();
  const plugin = Object.create(PluginBackupsClientV2.prototype) as PluginBackupsClientV2 & {
    app: Record<string, unknown>;
    flowEngine: {
      context: {
        defineProperty: typeof defineProperty;
      };
    };
    pluginSettingsManager: {
      addMenuItem: typeof addMenuItem;
      addPageTabItem: typeof addPageTabItem;
    };
    t: (key: string) => string;
  };

  Object.defineProperties(plugin, {
    app: { value: app, configurable: true },
    flowEngine: {
      value: {
        context: {
          defineProperty,
        },
      },
      configurable: true,
    },
    pluginSettingsManager: {
      value: {
        addMenuItem,
        addPageTabItem,
      },
      configurable: true,
    },
    t: { value: (key: string) => key, configurable: true },
  });

  return { plugin, defineProperty, addMenuItem, addPageTabItem, getRuntime: () => runtime };
}

describe('PluginBackupsClientV2', () => {
  it('registers settings menu tabs and backup restore runtime', async () => {
    const setMaintaining = vi.fn();
    const app = { error: undefined, maintaining: false, setMaintaining };
    const { plugin, defineProperty, addMenuItem, addPageTabItem, getRuntime } = createPlugin(app);

    await plugin.load();

    expect(defineProperty).toHaveBeenCalledWith(BACKUP_RESTORE_RUNTIME_KEY, { value: expect.any(Object) });
    expect(addMenuItem).toHaveBeenCalledWith({
      key: 'backups',
      title: 'Backup manager',
      icon: 'CloudServerOutlined',
      showTabs: true,
    });
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'backups',
        key: 'list',
        title: 'Backup list',
        aclSnippet: 'pm.backups',
        componentLoader: expect.any(Function),
      }),
    );
    expect(addPageTabItem).toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'backups',
        key: 'settings',
        title: 'Settings',
        aclSnippet: 'pm.backups.settings',
        componentLoader: expect.any(Function),
      }),
    );
    const [listTab, settingsTab] = addPageTabItem.mock.calls.map(([tab]) => tab);
    await expect(listTab.componentLoader()).resolves.toHaveProperty('default');
    await expect(settingsTab.componentLoader()).resolves.toHaveProperty('default');

    getRuntime()?.showCheckBackupMessage();
    expect(setMaintaining).toHaveBeenCalledWith(true);
    expect(app.error).toEqual({
      command: { name: 'APP Restoring' },
      message: 'checking backup...',
      code: 'APP_COMMANDING',
    });

    getRuntime()?.hideCheckBackupMessage();
    expect(setMaintaining).toHaveBeenCalledWith(false);
  });

  it('updates the app maintaining flag directly when no setter is available', async () => {
    const app = { error: undefined, maintaining: false };
    const { plugin, getRuntime } = createPlugin(app);

    await plugin.load();

    getRuntime()?.showCheckBackupMessage();
    expect(app.maintaining).toBe(true);

    getRuntime()?.hideCheckBackupMessage();
    expect(app.maintaining).toBe(false);
  });
});
