/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, RootPageTabModel, RouteRepository } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../../../../plugin-ui-layout/src/constants';
import {
  fetchMultiPortals,
  getMultiPortalRouteScopeCacheKey,
  registerMultiPortalsFromApi,
  toMultiPortalLayoutRegisterOptions,
  type MultiPortalRuntimeRecord,
} from '../layoutRegistration';
import PluginMultiPortalClientV2 from '../plugin';
import { installMultiPortalRouteRepositoryScope } from '../routeRepositoryScope';

const desktopPortal: MultiPortalRuntimeRecord = {
  uid: 'desktop-portal-model',
  title: 'Desktop portal',
  routeName: 'portalDesktop',
  routePath: '/portal-desktop',
  authCheck: true,
  enabled: true,
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
    registerLayout: vi.fn(),
  };
}

describe('PluginMultiPortalClientV2', () => {
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
        routeName: 'portalMobile',
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
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, enabled: false })).toBeNull();
    expect(toMultiPortalLayoutRegisterOptions({ ...desktopPortal, uiLayout: { layoutType: 'unknown' } })).toBeNull();
  });

  it('should register enabled portal routes returned by the API during plugin load', async () => {
    const mobilePortal: MultiPortalRuntimeRecord = {
      ...desktopPortal,
      uid: 'mobile-portal-model',
      title: 'Mobile portal',
      routeName: 'portalMobile',
      routePath: '/portal-mobile',
      authCheck: false,
      uiLayout: {
        layoutType: UI_LAYOUT_TYPE_MOBILE,
        routeName: 'mobile',
        routePath: '/mobile',
      },
    };
    const addPermissionsTab = vi.fn();
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
      },
      flowEngine: {
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
            data: [desktopPortal, mobilePortal, { ...desktopPortal, uid: 'disabled-portal', enabled: false }],
          },
        }),
      },
      layoutManager: createLayoutManager(),
    };

    const plugin = new PluginMultiPortalClientV2({}, app as never);

    await plugin.load();

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
    });
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'multi-portal',
      title: 'Multi-portal',
      icon: 'PartitionOutlined',
      aclSnippet: 'pm.multi-portal',
      showTabs: true,
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledTimes(1);
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'multi-portal',
      key: 'index',
      title: 'Multi-portal',
      aclSnippet: 'pm.multi-portal',
      componentLoader: expect.any(Function),
    });
    expect(addPermissionsTab).toHaveBeenCalledWith({
      key: 'multi-portals',
      label: 'Multi-portal',
      sort: 22,
      componentLoader: expect.any(Function),
    });
    await expect(addPermissionsTab.mock.calls[0][0].componentLoader()).resolves.toHaveProperty('default');
    expect(app.apiClient.request).toHaveBeenCalledWith({
      url: 'multiPortals:listEnabled',
      method: 'get',
      skipNotify: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledTimes(2);
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
  });

  it('should scope mobile portal page tabs to the current portal owner', async () => {
    const { MultiPortalMobileRootPageModel, MultiPortalMobileChildPageModel } = await import(
      '../models/MultiPortalMobilePageModels'
    );
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('layout', {
      value: {
        uid: 'portal:mobile-portal-model-tab-test',
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

    expect(rootTabOptions.props?.route).toMatchObject({
      parentId: 'mobile-portal-root-route',
      type: 'tabs',
      params: [],
      hideInMenu: false,
      enableTabs: false,
      multiPortals: ['mobile-portal-model-tab-test'],
    });
    expect(rootTabOptions.props?.route).toHaveProperty('schemaUid');
    expect(rootTabOptions.props?.route).toHaveProperty('tabSchemaName');
    expect(rootTabOptions.props?.route).not.toHaveProperty('uiLayouts');
    expect(childTabOptions.props?.route).toMatchObject({
      multiPortals: ['mobile-portal-model-tab-test'],
    });
    expect(childTabOptions.props?.route).not.toHaveProperty('uiLayouts');

    const tabModel = new RootPageTabModel({
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
        data: expect.objectContaining({
          schemaUid: rootTabOptions.props?.route?.schemaUid,
          multiPortals: ['mobile-portal-model-tab-test'],
        }),
      }),
    );
    expect(request.mock.calls[0][0].data).not.toHaveProperty('uiLayouts');
  });

  it('should request portal scoped routes and keep route caches isolated', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: [{ schemaUid: 'portal-page' }] } })
      .mockResolvedValueOnce({ data: { data: [{ schemaUid: 'layout-page' }] } });
    const create = vi.fn().mockResolvedValue({ data: { data: {} } });
    const repository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(() => ({
          create,
        })),
      },
    } as never);

    installMultiPortalRouteRepositoryScope(repository, () => ['customer-portal']);

    const deactivatePortal = repository.activateLayout({ uid: 'customer-portal' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['portal-page']);
    await repository.createRoute({ title: 'Portal page' }, { refreshAfterMutation: false });
    deactivatePortal();

    const deactivateLayout = repository.activateLayout({ uid: 'mobile-layout-model' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['layout-page']);
    deactivateLayout();

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
        layout: 'mobile-layout-model',
      },
    });
    expect(create).toHaveBeenCalledWith({
      values: {
        title: 'Portal page',
      },
      portal: 'customer-portal',
    });
  });

  it('should unwrap prefixed mobile portal route scope keys before requesting routes', async () => {
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

    installMultiPortalRouteRepositoryScope(repository, () => ['mobile-portal']);

    const deactivatePortal = repository.activateLayout({ uid: 'portal:mobile-portal' });
    await repository.refreshAccessible();
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['mobile-portal-page']);
    await repository.createRoute({ title: 'Mobile portal page' }, { refreshAfterMutation: false });
    deactivatePortal();

    const reactivatePortal = repository.activateLayout({ uid: 'portal:mobile-portal' });
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

    installMultiPortalRouteRepositoryScope(repository, () => ['customer-portal']);

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
          routeName: 'disabledPortal',
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

  it('should not register a portal routeName that is already registered', async () => {
    const layoutManager = createLayoutManager({
      registeredRouteNames: ['portalDesktop'],
    });

    await registerMultiPortalsFromApi({
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [desktopPortal],
          },
        }),
      },
      layoutManager,
    });

    expect(layoutManager.hasLayout).toHaveBeenCalledWith('portalDesktop');
    expect(layoutManager.registerLayout).not.toHaveBeenCalled();
  });

  it('should not let skipped or failed portal registrations pollute route repository scopes', async () => {
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
      registerLayout: vi.fn((options) => {
        if (options.uid === 'failed-portal-model') {
          throw new Error('uid conflict');
        }
      }),
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await registerMultiPortalsFromApi({
        apiClient: {
          request: vi.fn().mockResolvedValue({
            data: {
              data: [
                {
                  ...desktopPortal,
                  uid: 'admin-layout-model',
                  routeName: 'existingPortal',
                  routePath: '/existing-portal',
                },
                {
                  ...desktopPortal,
                  uid: 'failed-portal-model',
                  routeName: 'failedPortal',
                  routePath: '/failed-portal',
                },
                {
                  ...desktopPortal,
                  uid: 'customer-portal',
                  routeName: 'customerPortal',
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
      });
    } finally {
      warnSpy.mockRestore();
    }

    expect(layoutManager.registerLayout).toHaveBeenCalledTimes(2);
    expect(layoutManager.registerLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'failed-portal-model',
      }),
    );
    expect(layoutManager.registerLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'customer-portal',
      }),
    );

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
        portal: 'customer-portal',
      },
    });
  });
});
