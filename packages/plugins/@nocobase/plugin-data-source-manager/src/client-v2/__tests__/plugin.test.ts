/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginDataSourceManagerClientV2 from '../plugin';

function ManagerAction() {
  return null;
}

function createPlugin() {
  const existingDataSource = {
    patchOptions: vi.fn(),
    setCollections: vi.fn(),
  };
  const addedDataSource = {
    patchOptions: vi.fn(),
    setCollections: vi.fn(),
  };
  const runtimeDataSources = new Map<string, typeof existingDataSource>();
  runtimeDataSources.set('main', existingDataSource);
  const app = {
    apiClient: {
      request: vi.fn(() =>
        Promise.resolve({
          data: {
            data: [
              {
                key: 'external',
                displayName: 'External',
                collections: [{ name: 'orders' }],
              },
            ],
          },
        }),
      ),
    },
    dataSourceManager: {
      addDataSource: vi.fn((options: { key: string }) => {
        runtimeDataSources.set(options.key, addedDataSource);
      }),
      collectionFieldInterfaceManager: {
        registerFieldInterfaceConfigure: vi.fn(),
      },
      getDataSource: vi.fn((key: string) => runtimeDataSources.get(key)),
      registerLoader: vi.fn(),
    },
    i18n: {
      t: vi.fn((key: string) => `t:${key}`),
    },
    pluginSettingsManager: {
      addMenuItem: vi.fn(),
      addPageTabItem: vi.fn(),
    },
    pm: {
      get: vi.fn(() => ({
        settingsUI: {
          addPermissionsTab: vi.fn(),
        },
      })),
    },
  };

  const plugin = new PluginDataSourceManagerClientV2(
    {
      packageName: '@nocobase/plugin-data-source-manager',
    },
    app as never,
  );

  return {
    addedDataSource,
    app,
    existingDataSource,
    plugin,
  };
}

describe('PluginDataSourceManagerClientV2', () => {
  it('registers and reads extension options through public plugin APIs', () => {
    const { app, plugin } = createPlugin();

    plugin.registerType('external', {
      label: 'External',
    });
    plugin.registerFieldInterfaceConfigure({
      name: 'input',
      properties: {},
    });
    plugin.extensionManager.registerManagerAction({
      order: 20,
      component: ManagerAction,
    });
    plugin.extensionManager.registerManagerAction({
      order: 10,
      component: ManagerAction,
    });
    plugin.registerCollectionTemplate('late', {
      title: 'Late',
      order: 20,
    });
    plugin.registerCollectionTemplate({
      name: 'early',
      title: 'Early',
      order: 10,
    });
    plugin.registerCollectionPresetField({
      order: 20,
      value: {
        name: 'title',
      },
    });
    plugin.addCollectionPresetField({
      order: 10,
      value: {
        name: 'id',
      },
    });
    plugin.removeCollectionPresetField('title');
    plugin.registerPermissionTab({
      key: 'custom',
      label: 'Custom',
      componentLoader: async () => ({ default: ManagerAction }),
    });

    expect(plugin.getType('external')).toMatchObject({
      name: 'external',
      label: 'External',
    });
    expect(plugin.getType()).toBeUndefined();
    expect(app.dataSourceManager.collectionFieldInterfaceManager.registerFieldInterfaceConfigure).toHaveBeenCalledWith({
      name: 'input',
      properties: {},
    });
    expect(plugin.extensionManager.getManagerActions().map((item) => item.order)).toEqual([10, 20]);
    expect(plugin.getCollectionTemplates().map((item) => item.name)).toEqual(['early', 'late']);
    expect(plugin.getCollectionTemplate('early')).toMatchObject({
      title: 'Early',
    });
    expect(plugin.getCollectionPresetFields().map((item) => item.name)).toEqual(['id']);
    expect(
      plugin.getPermissionTabs({
        activeRole: null,
        availableActions: [],
        dataSource: {
          key: 'main',
        },
        t: (key) => key,
      }),
    ).toMatchObject([
      {
        key: 'custom',
      },
    ]);
  });

  it('loads built-in templates, settings pages, permissions tab, and runtime loader', async () => {
    const { addedDataSource, app, plugin } = createPlugin();

    await plugin.load();

    expect(plugin.getCollectionPresetFields().map((item) => item.name)).toEqual([
      'id',
      'createdAt',
      'createdBy',
      'updatedAt',
      'updatedBy',
    ]);
    expect(plugin.getCollectionTemplates().map((item) => item.name)).toEqual(['general', 'view']);
    expect(plugin.getCollectionTemplate('view')).toMatchObject({
      capabilities: {
        recordUniqueKey: true,
        simplePaginate: true,
      },
      presetFields: {
        disabled: true,
      },
    });

    const aclPlugin = app.pm.get.mock.results[0].value;
    expect(aclPlugin.settingsUI.addPermissionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'dataSource',
        label: 't:Data sources',
        sort: 15,
      }),
    );
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'data-source-manager',
        title: 't:Data sources',
      }),
    );
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledTimes(2);
    expect(app.dataSourceManager.registerLoader).toHaveBeenCalledWith('*', expect.any(Function));

    const loader = app.dataSourceManager.registerLoader.mock.calls[0][1];
    await expect(loader()).resolves.toEqual({
      dataSources: [
        {
          key: 'external',
          displayName: 'External',
          collections: [{ name: 'orders' }],
        },
      ],
    });

    expect(app.apiClient.request).toHaveBeenCalledWith({
      resource: 'dataSources',
      action: 'listEnabled',
      params: {
        paginate: false,
        appends: ['collections'],
      },
    });
    expect(app.dataSourceManager.addDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'external',
      }),
    );
    expect(addedDataSource.setCollections).toHaveBeenCalledWith([{ name: 'orders' }], {
      clearFields: true,
    });
  });
});
