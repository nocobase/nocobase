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
  it('should register base layout settings and enabled layouts from the API', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
        setPluginSettingsLink: vi.fn(),
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

    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'ui-layout',
      }),
    );
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'mobile',
      title: 'Mobile',
      icon: 'MobileOutlined',
      aclSnippet: 'pm.mobile',
      link: '/v/mobile',
    });
    expect(app.getHref).toHaveBeenCalledWith('/mobile');
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'mobile',
      key: 'index',
      title: 'Mobile',
      aclSnippet: 'pm.mobile',
      Component: expect.any(Function),
    });
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'routes',
      title: 'Routes',
      icon: 'ApartmentOutlined',
      aclSnippet: 'pm.routes',
      showTabs: true,
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'routes',
      key: 'index',
      title: 'Desktop routes',
      aclSnippet: 'pm.routes',
      componentLoader: expect.any(Function),
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'routes',
      key: 'mobile',
      title: 'Mobile routes',
      aclSnippet: 'pm.routes',
      componentLoader: expect.any(Function),
    });
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
    expect(app.pluginSettingsManager.setPluginSettingsLink).toHaveBeenCalledWith('ui-layout', 'routes');
    const settingsApp = createMockClient();
    for (const [menuItem] of app.pluginSettingsManager.addMenuItem.mock.calls) {
      settingsApp.pluginSettingsManager.addMenuItem(menuItem);
    }
    for (const [pageTab] of app.pluginSettingsManager.addPageTabItem.mock.calls) {
      settingsApp.pluginSettingsManager.addPageTabItem(pageTab);
    }
    const mobileSetting = settingsApp.pluginSettingsManager.get('mobile', false);
    expect(mobileSetting).toMatchObject({
      name: 'mobile',
      link: '/v/mobile',
    });
    expect(mobileSetting?.children?.[0]).toMatchObject({
      name: 'mobile.index',
      path: '/admin/settings/mobile',
      Component: expect.any(Function),
    });
    expect(mobileSetting?.children?.[0]).not.toHaveProperty('link');
    settingsApp.pluginSettingsManager.setAclSnippets(['pm.*', '!pm.routes']);
    expect(settingsApp.pluginSettingsManager.get('ui-layout')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('ui-layout.index')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('mobile')).not.toBeNull();
    expect(settingsApp.pluginSettingsManager.get('mobile.index')).not.toBeNull();
    expect(settingsApp.pluginSettingsManager.get('routes')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('routes.index')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('routes.mobile')).toBeNull();
    settingsApp.pluginSettingsManager.setAclSnippets(['pm.*', '!pm.mobile']);
    expect(settingsApp.pluginSettingsManager.get('mobile')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('mobile.index')).toBeNull();
    expect(settingsApp.pluginSettingsManager.get('routes')).not.toBeNull();
    expect(settingsApp.pluginSettingsManager.get('routes.index')).not.toBeNull();
    expect(settingsApp.pluginSettingsManager.get('routes.mobile')).not.toBeNull();
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
      MobileJSPageModel: {
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

  it('should preserve the current sub-app path in the mobile settings link', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = createMockClient({
      name: 'portal',
      publicPath: '/nocobase/v/',
      plugins: [PluginUiLayoutClientV2],
    });
    app.apiMock.onGet('uiLayouts:listEnabled').reply(200, { data: [] });

    await app.load();

    expect(app.pluginSettingsManager.get('mobile', false)).toMatchObject({
      link: '/nocobase/v/apps/portal/mobile',
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
