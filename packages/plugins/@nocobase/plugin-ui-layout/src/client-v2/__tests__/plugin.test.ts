/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, type Application } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { UI_LAYOUT_TYPE_DESKTOP } from '../../constants';

function createPluginApp(settingsRootPath = '/admin/settings/') {
  const addPermissionsTab = vi.fn();

  return {
    i18n: {
      t: vi.fn((key: string) => key),
    },
    pluginSettingsManager: {
      addMenuItem: vi.fn(),
      addPageTabItem: vi.fn(),
      setPluginSettingsLink: vi.fn(),
      getRoutePath: vi.fn((name: string) => `${settingsRootPath}${name}`),
    },
    apiClient: {
      request: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              uid: 'workspace-layout-model',
              layoutType: UI_LAYOUT_TYPE_DESKTOP,
              routeName: 'workspace',
              routePath: '/workspace',
              authCheck: true,
              enabled: true,
            },
          ],
        },
      }),
    },
    getHref: vi.fn((pathname: string) => `/v/${pathname.replace(/^\/+/, '')}`),
    pm: {
      get: vi.fn(() => ({
        settingsUI: {
          addPermissionsTab,
        },
      })),
    },
    layoutManager: {
      hasLayout: vi.fn(() => false),
      registerLayout: vi.fn(),
    },
    flowEngine: {
      registerModelLoaders: vi.fn(),
      registerActions: vi.fn(),
      flowSettings: {
        registerComponents: vi.fn(),
      },
    },
  };
}

describe('PluginUiLayoutClientV2', () => {
  it('should register mobile models without legacy settings shortcuts, permission tabs, or runtime routes', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = createPluginApp();
    const plugin = new PluginUiLayoutClientV2({} as Record<string, never>, app as unknown as Application);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'ui-layout',
      }),
    );
    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'mobile' }));
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({ menuKey: 'mobile' }),
    );
    expect(app.getHref).not.toHaveBeenCalled();
    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'routes',
      }),
    );
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'routes',
      }),
    );
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'ui-layout',
        key: 'routes',
      }),
    );
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'ui-layout',
        key: 'mobile',
      }),
    );
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        menuKey: 'ui-layout',
        key: 'index',
      }),
    );
    expect(app.pluginSettingsManager.setPluginSettingsLink).not.toHaveBeenCalled();
    expect(app.pm.get).not.toHaveBeenCalled();
    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith({
      MobileLayoutModel: {
        loader: expect.any(Function),
      },
      MobileLayoutMenuItemModel: {
        loader: expect.any(Function),
      },
      MobileRootPageModel: {
        loader: expect.any(Function),
      },
      MobileChildPageModel: {
        loader: expect.any(Function),
      },
    });
    expect(app.flowEngine.registerActions).toHaveBeenCalledWith({
      openView: expect.objectContaining({
        name: 'openView',
        handler: expect.any(Function),
      }),
    });
    const registeredFlowSettingsComponents = app.flowEngine.flowSettings.registerComponents.mock.calls[0]?.[0];
    expect(registeredFlowSettingsComponents?.MobileMenuSettingsIconPicker).toBeDefined();
    expect(app.apiClient.request).not.toHaveBeenCalled();
    expect(app.layoutManager.registerLayout).not.toHaveBeenCalled();
  });

  it('should omit the Mobile shortcut and Routes page from the standalone settings app', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = createPluginApp('/settings/');
    const plugin = new PluginUiLayoutClientV2({} as Record<string, never>, app as unknown as Application);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'mobile' }));
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({ menuKey: 'mobile' }),
    );
    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'routes' }));
    expect(app.pluginSettingsManager.addPageTabItem).not.toHaveBeenCalledWith(
      expect.objectContaining({ menuKey: 'routes' }),
    );
    expect(app.pm.get).not.toHaveBeenCalled();
  });

  it('should not add a legacy Mobile settings shortcut in a sub-app', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = createMockClient({
      name: 'portal',
      publicPath: '/nocobase/v/',
      plugins: [PluginUiLayoutClientV2],
    });
    app.apiMock.onGet('uiLayouts:listEnabled').reply(200, { data: [] });

    await app.load();

    expect(app.pluginSettingsManager.get('mobile', false)).toBeNull();
  });

  it('should not register custom layout routes during plugin load', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = createMockClient({
      publicPath: '/v/',
      plugins: [PluginUiLayoutClientV2],
      router: { type: 'memory', initialEntries: ['/v/admin2/odx187kzx2d'] },
    });
    app.apiMock.onGet('uiLayouts:listEnabled').reply(200, {
      data: [
        {
          uid: 'admin2-layout-model',
          layoutType: UI_LAYOUT_TYPE_DESKTOP,
          routeName: 'admin2',
          routePath: '/admin2',
          authCheck: true,
          enabled: true,
        },
      ],
    });

    await app.load();

    expect(app.apiMock.history.get.some((request) => request.url === 'uiLayouts:listEnabled')).toBe(false);
    expect(app.layoutManager.hasLayout('admin2')).toBe(false);
  });
});
