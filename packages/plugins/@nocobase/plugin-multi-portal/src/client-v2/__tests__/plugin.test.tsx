/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp, ConfigProvider, type ThemeConfig } from 'antd';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { BlockModel, createMockClient, RootPageTabModel, RouteRepository } from '@nocobase/client-v2';
import { buildSubModelItems, FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import React from 'react';
import {
  fetchMultiPortals,
  getMultiPortalRouteScopeCacheKey,
  registerMultiPortalsFromApi,
  toMultiPortalLayoutRegisterOptions,
  type MultiPortalRuntimeRecord,
} from '../layoutRegistration';
import PluginMultiPortalClientV2 from '../plugin';
import { installMultiPortalRouteRepositoryScope, type MultiPortalRouteScopeDescriptor } from '../routeRepositoryScope';
import packageJson from '../../../package.json';

const UI_LAYOUT_TYPE_DESKTOP = 'desktop';
const UI_LAYOUT_TYPE_MOBILE = 'mobile';

function createPortalScope(
  portalUid: string,
  routePermissionMode: MultiPortalRouteScopeDescriptor['routePermissionMode'] = 'portal',
): MultiPortalRouteScopeDescriptor {
  return {
    cacheKey: getMultiPortalRouteScopeCacheKey(portalUid),
    portalUid,
    routePermissionMode,
  };
}

const desktopPortal: MultiPortalRuntimeRecord = {
  uid: 'desktop-portal-model',
  title: 'Desktop portal',
  portalType: 'no-code',
  portalName: 'portalDesktop',
  routePath: '/portal-desktop',
  authCheck: true,
  enabled: true,
  routePermissionMode: 'portal',
  uiLayout: {
    layoutType: UI_LAYOUT_TYPE_DESKTOP,
    routeName: 'admin',
    routePath: '/admin',
  },
};

function createLayoutManager(options: { registeredRouteNames?: string[] } = {}) {
  const registeredRouteNames = new Set(options.registeredRouteNames || []);
  return {
    hasLayout: vi.fn((routeName: string) => registeredRouteNames.has(routeName)),
    listLayouts: vi.fn(() =>
      Array.from(registeredRouteNames, (routeName, index) => ({
        routeName,
        uid: `existing-layout-${index}`,
      })),
    ),
    registerLayout: vi.fn(),
  };
}

function makeAccessiblePortal(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'customer-portal',
    title: 'Customer portal',
    icon: 'HomeOutlined',
    portalName: 'customerPortal',
    routePath: '/customer-portal',
    authCheck: true,
    enabled: true,
    uiLayout: {
      layoutType: UI_LAYOUT_TYPE_DESKTOP,
    },
    ...overrides,
  };
}

async function renderMultiPortalBlock(records: Array<Record<string, unknown>>, options: { theme?: ThemeConfig } = {}) {
  const { MultiPortalBlockModel } = await import('../models/MultiPortalBlockModel');
  const app = createMockClient({
    publicPath: '/nocobase/v/',
    router: {
      type: 'memory',
      initialEntries: ['/nocobase/v/admin'],
    },
  });
  app.flowEngine.registerModels({ MultiPortalBlockModel });
  app.apiMock.onGet('multiPortals:listAccessible').reply(200, {
    data: records,
  });

  const model = app.flowEngine.createModel({
    uid: 'multi-portal-block',
    use: 'MultiPortalBlockModel',
  });

  const content = (
    <AntdApp>
      <FlowEngineProvider engine={app.flowEngine}>{model.render()}</FlowEngineProvider>
    </AntdApp>
  );

  render(options.theme ? <ConfigProvider theme={options.theme}>{content}</ConfigProvider> : content);

  await waitFor(() => {
    expect(app.apiMock.history.get.some((request) => request.url === 'multiPortals:listAccessible')).toBe(true);
  });

  return app;
}

describe('PluginMultiPortalClientV2', () => {
  afterEach(() => {
    cleanup();
  });

  it('should describe multi-portal management consistently', () => {
    expect(packageJson.description).toBe(
      'Provides built-in Portal registration, entry access, and route permissions for Client V2.',
    );
    expect(packageJson['description.zh-CN']).toBe('为 Client V2 提供内置 Portal 注册、入口访问与路由权限管理。');
  });

  it('should depend on the stable plugin-ui-layout client-v2 package entry', () => {
    const modelSources = import.meta.glob('../models/*.{ts,tsx}', {
      as: 'raw',
      eager: true,
    }) as Record<string, string>;
    const sourceText = Object.values(modelSources).join('\n');

    expect(sourceText).toContain('@nocobase/plugin-ui-layout/client-v2');
    expect(sourceText).not.toContain('plugin-ui-layout/src/');
  });

  it('should load as an isolated client-v2 plugin', async () => {
    const app = createMockClient({
      plugins: [PluginMultiPortalClientV2],
    });
    app.apiMock.onGet('multiPortals:listEnabled').reply(200, {
      data: [],
    });

    await app.load();

    expect(app.pm.get(PluginMultiPortalClientV2)).toBeInstanceOf(PluginMultiPortalClientV2);
  });

  it('should fetch enabled multi portals for runtime registration', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [desktopPortal],
      },
    });

    await expect(fetchMultiPortals({ request })).resolves.toEqual([desktopPortal]);
    expect(request).toHaveBeenCalledWith({
      url: 'multiPortals:listEnabled',
      method: 'get',
      skipNotify: true,
    });
  });

  it('should build registerLayout options from portal fields and related layout type', () => {
    expect(toMultiPortalLayoutRegisterOptions(desktopPortal)).toEqual({
      routeName: 'portalDesktop',
      routePath: '/portal-desktop',
      uid: 'desktop-portal-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
    expect(
      toMultiPortalLayoutRegisterOptions({
        ...desktopPortal,
        uid: 'mobile-portal-model',
        portalName: 'portalMobile',
        routePath: '/portal-mobile',
        authCheck: false,
        uiLayout: {
          layoutType: UI_LAYOUT_TYPE_MOBILE,
          routeName: 'mobile',
          routePath: '/mobile',
        },
      }),
    ).toEqual({
      routeName: 'portalMobile',
      routePath: '/portal-mobile',
      uid: 'mobile-portal-model',
      layoutModelClass: 'MultiPortalMobileLayoutModel',
      rootPageModelClass: 'MultiPortalMobileRootPageModel',
      childPageModelClass: 'MultiPortalMobileChildPageModel',
      authCheck: false,
    });
    expect(
      toMultiPortalLayoutRegisterOptions({
        ...desktopPortal,
        uid: 'mobile-layout-model',
        portalName: 'mobile',
        routePath: '/mobile',
        routePermissionMode: 'layout',
        uiLayout: {
          layoutType: UI_LAYOUT_TYPE_MOBILE,
          routeName: 'mobile',
          routePath: '/mobile',
        },
      }),
    ).toEqual({
      routeName: 'mobile',
      routePath: '/mobile',
      uid: 'mobile-layout-model',
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
      authCheck: true,
    });
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, enabled: false })).toBeNull();
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, portalType: 'ai' })).toBeNull();
    expect(
      toMultiPortalLayoutRegisterOptions({ ...desktopPortal, routePermissionMode: 'invalid' as never }),
    ).toBeNull();
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, uiLayout: { layoutType: 'unknown' } })).toBeNull();
  });

  it('should register enabled portal routes returned by the API during plugin load', async () => {
    const mobilePortal: MultiPortalRuntimeRecord = {
      ...desktopPortal,
      uid: 'mobile-portal-model',
      title: 'Mobile portal',
      portalName: 'portalMobile',
      routePath: '/portal-mobile',
      authCheck: false,
      uiLayout: {
        layoutType: UI_LAYOUT_TYPE_MOBILE,
        routeName: 'mobile',
        routePath: '/mobile',
      },
    };
    const layoutModeMobilePortal: MultiPortalRuntimeRecord = {
      ...mobilePortal,
      uid: 'mobile-layout-model',
      portalName: 'mobile',
      routePath: '/mobile',
      routePermissionMode: 'layout',
    };
    const addPermissionsTab = vi.fn();
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
        getRouteName: vi.fn(() => 'admin.settings.'),
      },
      flowEngine: {
        registerModels: vi.fn(),
        registerModelLoaders: vi.fn(),
      },
      pm: {
        get: vi.fn(() => ({
          settingsUI: {
            addPermissionsTab,
          },
        })),
      },
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              desktopPortal,
              mobilePortal,
              layoutModeMobilePortal,
              { ...desktopPortal, uid: 'ai-portal', portalType: 'ai' },
              { ...desktopPortal, uid: 'disabled-portal', enabled: false },
            ],
          },
        }),
      },
      layoutManager: createLayoutManager(),
      router: {
        add: vi.fn(),
      },
    };

    const plugin = new PluginMultiPortalClientV2({}, app as never);

    await plugin.load();

    expect(app.flowEngine.registerModels).toHaveBeenCalledWith({
      MultiPortalBlockModel: expect.any(Function),
    });
    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith({
      MultiPortalMobileLayoutModel: {
        loader: expect.any(Function),
      },
      MultiPortalMobileRootPageModel: {
        loader: expect.any(Function),
      },
      MultiPortalMobileChildPageModel: {
        loader: expect.any(Function),
      },
      MultiPortalMobileRootPageTabModel: {
        loader: expect.any(Function),
      },
      MultiPortalMobileChildPageTabModel: {
        loader: expect.any(Function),
      },
    });
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'multi-portal',
      title: 'Portal manager',
      icon: 'PartitionOutlined',
      aclSnippet: 'pm.multi-portal',
      showTabs: true,
      sort: -300,
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledTimes(1);
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'multi-portal',
      key: 'index',
      title: 'Portal manager',
      aclSnippet: 'pm.multi-portal',
      componentLoader: expect.any(Function),
    });
    expect(addPermissionsTab).toHaveBeenCalledWith({
      key: 'multi-portals',
      label: 'Portals',
      sort: 22,
      componentLoader: expect.any(Function),
    });
    await expect(addPermissionsTab.mock.calls[0][0].componentLoader()).resolves.toHaveProperty('default');
    expect(app.apiClient.request).toHaveBeenCalledWith({
      url: 'multiPortals:listEnabled',
      method: 'get',
      skipNotify: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledTimes(3);
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(1, {
      routeName: 'portalDesktop',
      routePath: '/portal-desktop',
      uid: 'desktop-portal-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(2, {
      routeName: 'portalMobile',
      routePath: '/portal-mobile',
      uid: 'mobile-portal-model',
      layoutModelClass: 'MultiPortalMobileLayoutModel',
      rootPageModelClass: 'MultiPortalMobileRootPageModel',
      childPageModelClass: 'MultiPortalMobileChildPageModel',
      authCheck: false,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(3, {
      routeName: 'mobile',
      routePath: '/mobile',
      uid: 'mobile-layout-model',
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
      authCheck: false,
    });
    expect(app.router.add).toHaveBeenCalledWith('root', {
      path: '/',
      Component: expect.any(Function),
      authCheck: true,
    });
  });

  it('should keep scoped Settings registration without loading runtime portals', async () => {
    const addPermissionsTab = vi.fn();
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
        getRouteName: vi.fn(() => 'settings.'),
        getRoutePath: vi.fn(() => '/'),
      },
      flowEngine: {
        registerModels: vi.fn(),
        registerModelLoaders: vi.fn(),
      },
      pm: {
        get: vi.fn(() => ({
          settingsUI: {
            addPermissionsTab,
          },
        })),
      },
      apiClient: {
        request: vi.fn(),
      },
      layoutManager: createLayoutManager(),
      router: {
        add: vi.fn(),
      },
    };

    const plugin = new PluginMultiPortalClientV2({}, app as never);
    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'multi-portal' }),
    );
    expect(addPermissionsTab).toHaveBeenCalledWith(expect.objectContaining({ key: 'multi-portals' }));
    expect(app.apiClient.request).not.toHaveBeenCalled();
    expect(app.layoutManager.registerLayout).not.toHaveBeenCalled();
    expect(app.router.add).not.toHaveBeenCalled();
  });

  it('should register the portal block model while keeping it hidden from the add block menu', async () => {
    const app = createMockClient({
      plugins: [PluginMultiPortalClientV2],
    });
    app.apiMock.onGet('multiPortals:listEnabled').reply(200, {
      data: [],
    });

    await app.load();

    const ModelClass = app.flowEngine.getModelClass('MultiPortalBlockModel');
    expect(ModelClass).toBeDefined();
    expect(ModelClass?.prototype).toBeInstanceOf(BlockModel);
    expect(ModelClass?.meta).toMatchObject({
      hide: true,
      label: '{{t("Portals", {"ns":["@nocobase/plugin-multi-portal","client"]})}}',
      createModelOptions: {
        use: 'MultiPortalBlockModel',
        stepParams: {
          cardSettings: {
            titleDescription: {
              title: '{{t("Portals", {"ns":["@nocobase/plugin-multi-portal","client"]})}}',
            },
          },
        },
      },
    });

    const items = await buildSubModelItems(BlockModel)(app.flowEngine.context);
    expect(items.some((item) => item.createModelOptions?.use === 'MultiPortalBlockModel')).toBe(false);
  });

  it('should render accessible portals from listAccessible without frontend filtering', async () => {
    const app = await renderMultiPortalBlock([
      makeAccessiblePortal(),
      makeAccessiblePortal({
        uid: 'zeta-portal',
        title: '',
        icon: null,
        portalName: 'zetaPortal',
        routePath: '/zeta-portal',
        enabled: false,
      }),
    ]);

    const customerLink = await screen.findByRole('link', { name: /Customer portal/ });
    expect(customerLink).toHaveAttribute('href', '/nocobase/v/customer-portal');
    expect(customerLink).toHaveAttribute('target', '_blank');
    expect(customerLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(customerLink.querySelector('.anticon-home')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /zeta-portal/ })).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
    expect(app.apiMock.history.get[0]).toMatchObject({
      url: 'multiPortals:listAccessible',
      method: 'get',
    });
    expect((app.apiMock.history.get[0] as Record<string, unknown>).skipNotify).toBe(true);
  });

  it('should render AI portal cards with the x route prefix', async () => {
    await renderMultiPortalBlock([
      makeAccessiblePortal({
        portalType: 'ai',
      }),
    ]);

    expect(await screen.findByRole('link', { name: /Customer portal/ })).toHaveAttribute(
      'href',
      '/nocobase/x/customer-portal',
    );
  });

  it('should keep portal cards visually scoped and usable', async () => {
    await renderMultiPortalBlock([makeAccessiblePortal()]);

    const customerLink = await screen.findByRole('link', { name: /Customer portal/ });
    const grid = customerLink.closest('[data-testid="multi-portal-block-grid"]');
    const card = customerLink.closest('[data-testid="multi-portal-block-card"]');

    expect(grid).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
    });
    expect(card).toHaveStyle({
      height: '96px',
    });
    expect(customerLink.querySelector('.anticon-home')?.closest('.ant-avatar')).toHaveStyle({
      height: '56px',
      width: '56px',
    });
    expect(customerLink.querySelector('.ant-card')).not.toBeInTheDocument();
    expect(document.head.textContent).toContain('transform:translateY(-');
    expect(document.head.textContent).toContain('box-shadow:');
    expect(within(customerLink).getByText('Customer portal')).toBeInTheDocument();
  });

  it('should derive portal card metrics from antd theme tokens', async () => {
    await renderMultiPortalBlock([makeAccessiblePortal()], {
      theme: {
        token: {
          borderRadiusLG: 10,
          controlHeightLG: 48,
          fontSizeHeading3: 22,
          lineWidth: 4,
          marginSM: 20,
          marginXXS: 5,
          paddingLG: 28,
          paddingSM: 12,
          paddingXXS: 3,
        },
      },
    });

    const customerLink = await screen.findByRole('link', { name: /Customer portal/ });
    const grid = customerLink.closest('[data-testid="multi-portal-block-grid"]');
    const card = customerLink.closest('[data-testid="multi-portal-block-card"]');
    const avatar = customerLink.querySelector('.anticon-home')?.closest('.ant-avatar');
    const icon = customerLink.querySelector('.anticon-home');

    expect(grid).toHaveStyle({
      gap: '20px',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 432px), 1fr))',
    });
    expect(card).toHaveStyle({
      borderRadius: '10px',
      borderWidth: '4px',
      gap: '20px',
      height: '113px',
      padding: '25px 28px',
    });
    expect(avatar).toHaveStyle({
      height: '63px',
      width: '63px',
    });
    expect(icon).toHaveStyle({
      fontSize: '27px',
    });
  });

  it('should render empty and error states without removing the block', async () => {
    await renderMultiPortalBlock([]);
    expect(await screen.findByText('No portals')).toBeInTheDocument();
    cleanup();

    const { MultiPortalBlockModel } = await import('../models/MultiPortalBlockModel');
    const app = createMockClient();
    app.flowEngine.registerModels({ MultiPortalBlockModel });
    app.apiMock.onGet('multiPortals:listAccessible').reply(500, {
      errors: [{ message: 'bad request' }],
    });
    const model = app.flowEngine.createModel({
      uid: 'multi-portal-block-error',
      use: 'MultiPortalBlockModel',
    });

    render(
      <AntdApp>
        <FlowEngineProvider engine={app.flowEngine}>{model.render()}</FlowEngineProvider>
      </AntdApp>,
    );

    expect(await screen.findByText('Failed to load portals')).toBeInTheDocument();
  });

  it('should scope mobile page tab creation by portal identity without client-owned route relations', async () => {
    const { MultiPortalMobileRootPageModel, MultiPortalMobileChildPageModel } = await import(
      '../models/MultiPortalMobilePageModels'
    );
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: 'mobile-portal-model-tab-test',
      },
    });
    const request = vi.fn().mockResolvedValue({});
    flowEngine.context.defineProperty('api', {
      value: { request },
    });
    flowEngine.context.defineProperty('t', {
      value: (value: string) => value,
    });
    const rootPageModel = new MultiPortalMobileRootPageModel({
      flowEngine,
      props: {
        routeId: 'mobile-portal-root-route',
      },
    } as never);
    const childPageModel = new MultiPortalMobileChildPageModel({ flowEngine } as never);
    const rootTabOptions = rootPageModel.createPageTabModelOptions();
    const childTabOptions = childPageModel.createPageTabModelOptions();

    expect(rootTabOptions.use).toBe('MultiPortalMobileRootPageTabModel');
    expect(childTabOptions.use).toBe('MultiPortalMobileChildPageTabModel');
    expect(rootTabOptions.props?.route).toMatchObject({
      parentId: 'mobile-portal-root-route',
      type: 'tabs',
      params: [],
      hideInMenu: false,
      enableTabs: false,
    });
    expect(rootTabOptions.props?.route).toHaveProperty('schemaUid');
    expect(rootTabOptions.props?.route).toHaveProperty('tabSchemaName');
    expect(rootTabOptions.props?.route).not.toHaveProperty('uiLayouts');
    expect(rootTabOptions.props?.route).not.toHaveProperty('multiPortals');
    expect(childTabOptions.props?.route).not.toHaveProperty('uiLayouts');
    expect(childTabOptions.props?.route).not.toHaveProperty('multiPortals');

    const models = (await import('../models/MultiPortalMobilePageModels')) as Record<string, unknown>;
    const RootTabModel = models[rootTabOptions.use as string] as typeof RootPageTabModel;
    const tabModel = new RootTabModel({
      flowEngine,
      uid: rootTabOptions.uid,
      props: rootTabOptions.props,
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Overview',
          },
        },
      },
    } as never);

    await tabModel.save();

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'desktopRoutes:updateOrCreate',
        params: {
          filterKeys: ['schemaUid'],
          portal: 'mobile-portal-model-tab-test',
        },
        data: expect.objectContaining({
          schemaUid: rootTabOptions.props?.route?.schemaUid,
        }),
      }),
    );
    expect(request.mock.calls[0][0].data).not.toHaveProperty('uiLayouts');
    expect(request.mock.calls[0][0].data).not.toHaveProperty('multiPortals');
  });

  it('should keep portal tab route ownership clean across repeated saves', async () => {
    const { MultiPortalMobileRootPageModel } = await import('../models/MultiPortalMobilePageModels');
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: 'mobile-portal-model-tab-test',
      },
    });
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 991,
          schemaUid: 'portal-tab-schema',
          uiLayouts: ['mobile-layout-model-tab-test'],
          options: {
            flowRegistry: {},
          },
        },
      },
    });
    flowEngine.context.defineProperty('api', {
      value: { request },
    });
    flowEngine.context.defineProperty('t', {
      value: (value: string) => value,
    });
    const rootPageModel = new MultiPortalMobileRootPageModel({
      flowEngine,
      props: {
        routeId: 'mobile-portal-root-route',
      },
    } as never);
    const rootTabOptions = rootPageModel.createPageTabModelOptions();
    const models = (await import('../models/MultiPortalMobilePageModels')) as Record<string, unknown>;
    const RootTabModel = models[rootTabOptions.use as string] as typeof RootPageTabModel;
    const tabModel = new RootTabModel({
      flowEngine,
      uid: rootTabOptions.uid,
      props: rootTabOptions.props,
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Overview',
          },
        },
      },
    } as never);

    await tabModel.save();
    await tabModel.save();

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        url: 'desktopRoutes:updateOrCreate',
        params: {
          filterKeys: ['schemaUid'],
          portal: 'mobile-portal-model-tab-test',
        },
      }),
    );
    expect(request.mock.calls[0][0].data).not.toHaveProperty('uiLayouts');
    expect(request.mock.calls[0][0].data).not.toHaveProperty('multiPortals');
    expect(request.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        url: 'desktopRoutes:update?filter[id]=991',
        params: {
          portal: 'mobile-portal-model-tab-test',
        },
        data: expect.objectContaining({
          schemaUid: 'portal-tab-schema',
        }),
      }),
    );
    expect(request.mock.calls[1][0].data).not.toHaveProperty('multiPortals');
    expect(request.mock.calls[1][0].data).not.toHaveProperty('uiLayouts');
    expect(tabModel.props.route).not.toHaveProperty('multiPortals');
    expect(tabModel.props.route).not.toHaveProperty('uiLayouts');
  });

  it('should attach portal identity to layout-mode mobile root route requests', async () => {
    const { MultiPortalMobileRootPageModel } = await import('../models/MultiPortalMobilePageModels');
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: 'mobile-layout-model',
      },
    });
    const request = vi.fn().mockResolvedValue({});
    flowEngine.context.defineProperty('api', {
      value: { request },
    });
    flowEngine.context.defineProperty('t', {
      value: (value: string) => value,
    });
    const rootPageModel = new MultiPortalMobileRootPageModel({
      flowEngine,
      props: {
        routeId: 'mobile-layout-root-route',
      },
    } as never);
    rootPageModel.stepParams = {
      pageSettings: {
        general: {
          enableTabs: true,
        },
      },
    };

    await rootPageModel.saveStepParams();
    await rootPageModel.context.api.request({
      url: '/desktopRoutes:listAccessible',
      method: 'get',
      params: {
        layout: 'mobile-layout-model',
        portal: 'forged-portal',
      },
    });

    expect(request).toHaveBeenNthCalledWith(1, {
      url: 'desktopRoutes:update?filter[id]=mobile-layout-root-route',
      method: 'post',
      params: {
        portal: 'mobile-layout-model',
      },
      data: {
        enableTabs: true,
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/desktopRoutes:listAccessible',
      method: 'get',
      params: {
        portal: 'mobile-layout-model',
      },
    });
  });

  it('should scope every route operation by portal and keep route caches isolated', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: [{ schemaUid: 'portal-page' }] } })
      .mockResolvedValueOnce({ data: { data: [{ schemaUid: 'layout-page' }] } });
    const create = vi.fn().mockResolvedValue({ data: { data: {} } });
    const update = vi.fn().mockResolvedValue({ data: { data: {} } });
    const destroy = vi.fn().mockResolvedValue({ data: { data: {} } });
    const move = vi.fn().mockResolvedValue({ data: { data: {} } });
    const repository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(() => ({
          create,
          update,
          destroy,
          move,
        })),
      },
    } as never);

    installMultiPortalRouteRepositoryScope(repository, () => [
      createPortalScope('customer-portal'),
      createPortalScope('mobile-layout-model', 'layout'),
    ]);

    const deactivatePortal = repository.activateLayout({ uid: 'customer-portal' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['portal-page']);
    await repository.createRoute(
      {
        title: 'Portal page',
        uiLayouts: ['forged-layout'],
        multiPortals: ['forged-portal'],
      } as never,
      { refreshAfterMutation: false },
    );
    await repository.updateRoute(
      11,
      {
        title: 'Updated portal page',
        uiLayouts: ['forged-layout'],
        multiPortals: ['forged-portal'],
      } as never,
      { refreshAfterMutation: false },
    );
    await repository.deleteRoute(12, { refreshAfterMutation: false });
    await repository.moveRoute({ sourceId: 13, targetId: 14, refreshAfterMove: false });
    deactivatePortal();

    const deactivateLayoutModePortal = repository.activateLayout({ uid: 'mobile-layout-model' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['layout-page']);
    deactivateLayoutModePortal();

    const reactivatePortal = repository.activateLayout({ uid: 'customer-portal' });
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['portal-page']);
    reactivatePortal();

    expect(request).toHaveBeenNthCalledWith(1, {
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        portal: 'customer-portal',
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        portal: 'mobile-layout-model',
      },
    });
    expect(create).toHaveBeenCalledWith({
      values: {
        title: 'Portal page',
      },
      portal: 'customer-portal',
    });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 11,
      values: {
        title: 'Updated portal page',
      },
      portal: 'customer-portal',
    });
    expect(destroy).toHaveBeenCalledWith({
      filterByTk: 12,
      portal: 'customer-portal',
    });
    expect(move).toHaveBeenCalledWith({
      sourceId: 13,
      targetId: 14,
      portal: 'customer-portal',
    });
  });

  it('should keep the raw mobile Portal UID separate from its route cache key', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: [{ schemaUid: 'mobile-portal-page' }] } });
    const create = vi.fn().mockResolvedValue({ data: { data: {} } });
    const repository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(() => ({
          create,
        })),
      },
    } as never);

    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('mobile-portal')]);

    const deactivatePortal = repository.activateLayout({ uid: 'mobile-portal' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['mobile-portal-page']);
    await repository.createRoute({ title: 'Mobile portal page' }, { refreshAfterMutation: false });
    deactivatePortal();

    const reactivatePortal = repository.activateLayout({ uid: 'mobile-portal' });
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['mobile-portal-page']);
    reactivatePortal();

    expect(request).toHaveBeenCalledWith({
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        portal: 'mobile-portal',
      },
    });
    expect(request.mock.calls[0][0].params).not.toHaveProperty('layout');
    expect(create).toHaveBeenCalledWith({
      values: {
        title: 'Mobile portal page',
      },
      portal: 'mobile-portal',
    });
  });

  it('should ignore stale portal route refresh responses', async () => {
    const firstRefresh = Promise.withResolvers<{ data: { data: Array<{ schemaUid: string }> } }>();
    const secondRefresh = Promise.withResolvers<{ data: { data: Array<{ schemaUid: string }> } }>();
    const request = vi.fn().mockReturnValueOnce(firstRefresh.promise).mockReturnValueOnce(secondRefresh.promise);
    const repository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(() => ({
          create: vi.fn(),
        })),
      },
    } as never);

    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('customer-portal')]);

    const deactivatePortal = repository.activateLayout({ uid: 'customer-portal' });
    const olderRefresh = repository.refreshAccessible();
    const newerRefresh = repository.refreshAccessible();

    secondRefresh.resolve({ data: { data: [{ schemaUid: 'newer-route' }] } });
    await newerRefresh;
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['newer-route']);

    firstRefresh.resolve({ data: { data: [{ schemaUid: 'older-route' }] } });
    await olderRefresh;
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['newer-route']);
    deactivatePortal();
  });

  it('should use a distinct cache key for portal scoped routes', () => {
    expect(getMultiPortalRouteScopeCacheKey('customer-portal')).toBe('portal:customer-portal');
  });

  it('should register portal routes in the router during plugin load', async () => {
    const app = createMockClient({
      publicPath: '/v/',
      plugins: [PluginMultiPortalClientV2],
      router: {
        type: 'memory',
        initialEntries: ['/v/portal-desktop/desktop-page'],
      },
    });
    app.apiMock.onGet('multiPortals:listEnabled').reply(200, {
      data: [
        {
          ...desktopPortal,
          routePath: '/portal-desktop',
          uiLayout: {
            layoutType: UI_LAYOUT_TYPE_DESKTOP,
            routeName: 'admin',
            routePath: '/admin',
          },
        },
        {
          ...desktopPortal,
          uid: 'disabled-portal-model',
          portalName: 'disabledPortal',
          routePath: '/disabled-portal',
          enabled: false,
          uiLayout: {
            layoutType: UI_LAYOUT_TYPE_DESKTOP,
            routeName: 'admin',
            routePath: '/admin',
          },
        },
      ],
    });

    await app.load();

    const portalMatches = app.router.matchRoutes('/v/portal-desktop/desktop-page') || [];
    const disabledMatches = app.router.matchRoutes('/v/disabled-portal/desktop-page') || [];
    expect(
      portalMatches.some((match) => match.route.path === '/portal-desktop' && match.route.authCheck === true),
    ).toBe(true);
    expect(portalMatches.some((match) => match.route.path === ':name')).toBe(true);
    expect(portalMatches.some((match) => match.route.path === '/admin')).toBe(false);
    expect(disabledMatches.some((match) => match.route.path === '/disabled-portal')).toBe(false);
  });

  it('should abort before registration when a portalName is already registered', async () => {
    const layoutManager = createLayoutManager({
      registeredRouteNames: ['portalDesktop'],
    });

    await expect(
      registerMultiPortalsFromApi({
        apiClient: {
          request: vi.fn().mockResolvedValue({
            data: {
              data: [desktopPortal],
            },
          }),
        },
        layoutManager,
      }),
    ).rejects.toThrow("Duplicate portal route name 'portalDesktop'.");

    expect(layoutManager.hasLayout).toHaveBeenCalledWith('portalDesktop');
    expect(layoutManager.registerLayout).not.toHaveBeenCalled();
  });

  it('should abort a conflicting batch before registration without polluting route repository scopes', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: [{ schemaUid: 'admin-layout-page' }] } })
      .mockResolvedValueOnce({ data: { data: [{ schemaUid: 'customer-portal-page' }] } });
    const repository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(() => ({
          create: vi.fn(),
        })),
      },
    } as never);
    const layoutManager = {
      hasLayout: vi.fn((routeName: string) => routeName === 'existingPortal'),
      listLayouts: vi.fn((): Array<{ routeName: string; uid: string }> => []),
      registerLayout: vi.fn(),
    };

    await expect(
      registerMultiPortalsFromApi({
        apiClient: {
          request: vi.fn().mockResolvedValue({
            data: {
              data: [
                {
                  ...desktopPortal,
                  uid: 'admin-layout-model',
                  portalName: 'existingPortal',
                  routePath: '/existing-portal',
                },
                {
                  ...desktopPortal,
                  uid: 'failed-portal-model',
                  portalName: 'failedPortal',
                  routePath: '/failed-portal',
                },
                {
                  ...desktopPortal,
                  uid: 'customer-portal',
                  portalName: 'customerPortal',
                  routePath: '/customer-portal',
                },
              ],
            },
          }),
        },
        flowEngine: {
          context: {
            routeRepository: repository,
          },
        },
        layoutManager,
      }),
    ).rejects.toThrow("Duplicate portal route name 'existingPortal'.");

    expect(layoutManager.registerLayout).not.toHaveBeenCalled();

    const deactivateAdminLayout = repository.activateLayout({ uid: 'admin-layout-model' });
    await repository.refreshAccessible();
    deactivateAdminLayout();

    const deactivateRegisteredPortal = repository.activateLayout({ uid: 'customer-portal' });
    await repository.refreshAccessible();
    deactivateRegisteredPortal();

    expect(request).toHaveBeenNthCalledWith(1, {
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'admin-layout-model',
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'customer-portal',
      },
    });
  });
});
