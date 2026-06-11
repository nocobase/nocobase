/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../../../../plugin-ui-layout/src/constants';
import {
  fetchMultiPortals,
  registerMultiPortalsFromApi,
  toMultiPortalLayoutRegisterOptions,
  type MultiPortalRuntimeRecord,
} from '../layoutRegistration';
import PluginMultiPortalClientV2 from '../plugin';

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
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
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
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
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
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
      authCheck: false,
    });
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
});
