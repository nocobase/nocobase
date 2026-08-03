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

function createPortalScope(portalUid: string): MultiPortalRouteScopeDescriptor {
  return {
    cacheKey: getMultiPortalRouteScopeCacheKey(portalUid),
    portalUid,
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
  uiLayoutUid: 'admin-layout-model',
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
    uiLayoutUid: 'admin-layout-model',
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

  it('should register the root landing when the public Portal list request fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createMockClient({
      plugins: [PluginMultiPortalClientV2],
    });
    app.apiMock.onGet('multiPortals:listEnabled').reply(500);

    await app.load();

    expect(app.router.get('root')).toMatchObject({
      path: '/',
      authCheck: false,
    });
    const RootComponent = app.router.get('root')?.Component;
    expect(RootComponent).toBeTypeOf('function');
    const rootElement = (RootComponent as React.FC)({});
    expect(React.isValidElement(rootElement)).toBe(true);
    expect((rootElement as React.ReactElement<{ runtimeRegistrationFailed?: boolean }>).props).toMatchObject({
      runtimeRegistrationFailed: true,
    });
    expect(errorSpy).toHaveBeenCalledWith('[NocoBase] Failed to register multi-portals.', expect.anything());
    errorSpy.mockRestore();
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
      skipAuth: true,
      skipNotify: true,
    });
  });

  it('should reject an invalid public Portal list response', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: null,
      },
    });

    await expect(fetchMultiPortals({ request })).rejects.toThrow(
      'multiPortals:listEnabled returned an invalid response',
    );
  });

  it('should keep the root landing available when runtime Portal registration fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createMockClient({
      plugins: [PluginMultiPortalClientV2],
    });
    app.apiMock.onGet('multiPortals:listEnabled').reply(200, {
      data: [
        {
          ...desktopPortal,
          uiLayoutUid: 'unsupported-layout-model',
        },
      ],
    });

    await expect(app.load()).resolves.toBeUndefined();

    const RootComponent = app.router.get('root')?.Component;
    expect(RootComponent).toBeTypeOf('function');
    const rootElement = (RootComponent as React.FC)({});
    expect(React.isValidElement(rootElement)).toBe(true);
    expect((rootElement as React.ReactElement<{ runtimeRegistrationFailed?: boolean }>).props).toMatchObject({
      runtimeRegistrationFailed: true,
    });
    expect(errorSpy).toHaveBeenCalledWith('[NocoBase] Failed to register multi-portals.', expect.anything());
    errorSpy.mockRestore();
  });

  it('should build registerLayout options from the two fixed layout uids', () => {
    expect(toMultiPortalLayoutRegisterOptions(desktopPortal)).toEqual({
      routeName: 'multiPortalLayout_desktop-portal-model',
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
        uiLayoutUid: 'mobile-layout-model',
      }),
    ).toEqual({
      routeName: 'multiPortalLayout_mobile-portal-model',
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
        uid: '__default_mobile__',
        portalName: 'mobile',
        routePath: '/mobile',
        uiLayoutUid: 'mobile-layout-model',
      }),
    ).toEqual({
      routeName: 'multiPortalLayout___default_mobile__',
      routePath: '/mobile',
      uid: '__default_mobile__',
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
      authCheck: true,
    });
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, enabled: false })).toBeNull();
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, portalType: 'ai' })).toBeNull();
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, uiLayoutUid: 'unknown-layout-model' })).toBeNull();
  });

  it('should register enabled portal routes returned by the API during plugin load', async () => {
    const mobilePortal: MultiPortalRuntimeRecord = {
      ...desktopPortal,
      uid: 'mobile-portal-model',
      title: 'Mobile portal',
      portalName: 'portalMobile',
      routePath: '/portal-mobile',
      authCheck: false,
      uiLayoutUid: 'mobile-layout-model',
    };
    const fixedMobilePortal: MultiPortalRuntimeRecord = {
      ...mobilePortal,
      uid: '__default_mobile__',
      portalName: 'mobile',
      routePath: '/mobile',
    };
    const addPermissionsTab = vi.fn();
    const registerAuthRouteScope = vi.fn();
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
        get: vi.fn((name: string) =>
          name === '@nocobase/plugin-auth'
            ? { registerAuthRouteScope }
            : {
                settingsUI: {
                  addPermissionsTab,
                },
              },
        ),
      },
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              desktopPortal,
              mobilePortal,
              fixedMobilePortal,
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
      skipAuth: true,
      skipNotify: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledTimes(3);
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(1, {
      routeName: 'multiPortalLayout_desktop-portal-model',
      routePath: '/portal-desktop',
      uid: 'desktop-portal-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(2, {
      routeName: 'multiPortalLayout_mobile-portal-model',
      routePath: '/portal-mobile',
      uid: 'mobile-portal-model',
      layoutModelClass: 'MultiPortalMobileLayoutModel',
      rootPageModelClass: 'MultiPortalMobileRootPageModel',
      childPageModelClass: 'MultiPortalMobileChildPageModel',
      authCheck: false,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(3, {
      routeName: 'multiPortalLayout___default_mobile__',
      routePath: '/mobile',
      uid: '__default_mobile__',
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
      authCheck: false,
    });
    expect(registerAuthRouteScope).toHaveBeenCalledTimes(3);
    expect(registerAuthRouteScope).toHaveBeenNthCalledWith(1, 'multiPortal_desktop-portal-model', '/portal-desktop', {
      signin: 'multiPortalSignin_desktop-portal-model',
      signup: 'multiPortalSignup_desktop-portal-model',
    });
    expect(registerAuthRouteScope).toHaveBeenNthCalledWith(2, 'multiPortal_mobile-portal-model', '/portal-mobile', {
      signin: 'multiPortalSignin_mobile-portal-model',
      signup: 'multiPortalSignup_mobile-portal-model',
    });
    expect(registerAuthRouteScope).toHaveBeenNthCalledWith(3, 'multiPortal___default_mobile__', '/mobile', {
      signin: 'multiPortalSignin___default_mobile__',
      signup: 'multiPortalSignup___default_mobile__',
    });
    expect(app.router.add).toHaveBeenCalledWith('root', {
      path: '/',
      Component: expect.any(Function),
      authCheck: false,
      skipAuthCheck: true,
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

  it('should attach the fixed Mobile Portal identity to root route requests', async () => {
    const { MultiPortalMobileRootPageModel } = await import('../models/MultiPortalMobilePageModels');
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: '__default_mobile__',
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
        portal: '__default_mobile__',
      },
      data: {
        enableTabs: true,
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/desktopRoutes:listAccessible',
      method: 'get',
      params: {
        portal: '__default_mobile__',
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
      createPortalScope('__default_mobile__'),
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

    const deactivateFixedMobilePortal = repository.activateLayout({ uid: '__default_mobile__' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['layout-page']);
    deactivateFixedMobilePortal();

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
        portal: '__default_mobile__',
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
        },
        {
          ...desktopPortal,
          uid: 'disabled-portal-model',
          portalName: 'disabledPortal',
          routePath: '/disabled-portal',
          enabled: false,
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

  it('should allow a portalName that is already used by another layout route', async () => {
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
    ).resolves.toEqual([desktopPortal]);

    expect(layoutManager.hasLayout).toHaveBeenCalledWith('multiPortalLayout_desktop-portal-model');
    expect(layoutManager.registerLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        routeName: 'multiPortalLayout_desktop-portal-model',
        routePath: '/portal-desktop',
      }),
    );
  });

  it('should abort before registration when the internal Portal layout route name is already registered', async () => {
    const layoutManager = createLayoutManager({
      registeredRouteNames: ['multiPortalLayout_desktop-portal-model'],
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
    ).rejects.toThrow("Duplicate portal layout route name 'multiPortalLayout_desktop-portal-model'.");

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
      hasLayout: vi.fn((routeName: string) => routeName === 'multiPortalLayout_admin-layout-model'),
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
    ).rejects.toThrow("Duplicate portal layout route name 'multiPortalLayout_admin-layout-model'.");

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
