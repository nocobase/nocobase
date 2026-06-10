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

describe('PluginUiLayoutClientV2', () => {
  it('should register settings page and enabled layouts from the API', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
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
    const plugin = new PluginUiLayoutClientV2({} as Record<string, never>, app as unknown as Application);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'ui-layout',
      title: 'UI layout',
      icon: 'LayoutOutlined',
      aclSnippet: 'pm.ui-layout',
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'ui-layout',
      key: 'index',
      title: 'UI layout',
      aclSnippet: 'pm.ui-layout',
      componentLoader: expect.any(Function),
    });
    const settingsApp = createMockClient();
    settingsApp.pluginSettingsManager.addMenuItem(app.pluginSettingsManager.addMenuItem.mock.calls[0][0]);
    settingsApp.pluginSettingsManager.addPageTabItem(app.pluginSettingsManager.addPageTabItem.mock.calls[0][0]);
    settingsApp.pluginSettingsManager.setAclSnippets(['pm.*', '!pm.ui-layout']);
    expect(settingsApp.pluginSettingsManager.get('ui-layout')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('ui-layout.index')).toBeNull();
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
    expect(app.apiClient.request).toHaveBeenCalledWith({
      url: 'uiLayouts:listEnabled',
      method: 'get',
      skipNotify: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledWith({
      routeName: 'workspace',
      routePath: '/workspace',
      uid: 'workspace-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
  });

  it('should register custom layout routes during plugin load', async () => {
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

    const matches = app.router.matchRoutes('/v/admin2/odx187kzx2d') || [];
    expect(matches.some((match) => match.route.path === '/admin2' && match.route.authCheck === true)).toBe(true);
    expect(matches.some((match) => match.route.path === ':name')).toBe(true);
    expect(matches.some((match) => match.route.path === ':uiLayoutRouteName/*')).toBe(false);
  });
});
