/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../../flow-compat';
import {
  findFirstAccessiblePageRoute,
  findFirstV2LandingRoute,
  isV2MenuRoute,
  resolveAdminRouteRuntimeTarget,
  toRouterNavigationPath,
} from './resolveAdminRouteRuntimeTarget';

const app = {
  getPublicPath: () => '/nocobase/v2/',
  router: {
    getBasename: () => '/nocobase/v2',
  },
} as any;

// These fixtures mount the modern client under the `v2` segment; tell the
// runtime-prefix helper so `isV2AdminRuntime` detects it (the server injects
// this in production).
beforeAll(() => {
  (window as any).__nocobase_modern_client_prefix__ = 'v2';
});

afterAll(() => {
  delete (window as any).__nocobase_modern_client_prefix__;
});

describe('resolveAdminRouteRuntimeTarget', () => {
  it('should resolve flowPage to v2 spa runtime target', () => {
    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        route: {
          type: NocoBaseDesktopRouteType.flowPage,
          schemaUid: 'flow-page-1',
        },
      }),
    ).toEqual({
      runtimePath: '/nocobase/v2/admin/flow-page-1',
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'ok',
    });
  });

  it('should resolve flowPage under a custom admin layout route path', () => {
    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        layout: {
          routePath: '/admin2',
        },
        route: {
          type: NocoBaseDesktopRouteType.flowPage,
          schemaUid: 'flow-page-1',
        },
      }),
    ).toEqual({
      runtimePath: '/nocobase/v2/admin2/flow-page-1',
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'ok',
    });
  });

  it('should mark page unsupported in v2 admin runtime', () => {
    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        route: {
          type: NocoBaseDesktopRouteType.page,
          schemaUid: 'legacy-page-1',
        },
      }),
    ).toEqual({
      runtimePath: null,
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'unsupportedV2Runtime',
    });
  });

  it('should keep page inside spa when current runtime is not under /v2/', () => {
    const subApp = {
      getPublicPath: () => '/apps/demo/',
      router: {
        getBasename: () => '/apps/demo',
      },
    } as any;

    expect(
      resolveAdminRouteRuntimeTarget({
        app: subApp,
        route: {
          type: NocoBaseDesktopRouteType.page,
          schemaUid: 'legacy-page-1',
        },
      }),
    ).toEqual({
      runtimePath: '/apps/demo/admin/legacy-page-1',
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'ok',
    });
  });

  it('should not preserve current search and hash when direct legacy page is unsupported', () => {
    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        route: {
          type: NocoBaseDesktopRouteType.page,
          schemaUid: 'legacy-page-1',
        },
        location: {
          pathname: '/nocobase/v2/admin/legacy-page-1/tab/tab-1/view/detail',
          search: '?from=direct',
          hash: '#dialog',
        },
        preserveLocationState: true,
      }),
    ).toEqual({
      runtimePath: null,
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'unsupportedV2Runtime',
    });
  });

  it('should resolve group by DFS first v2 landing route in v2 runtime', () => {
    const route: NocoBaseDesktopRoute = {
      type: NocoBaseDesktopRouteType.group,
      children: [
        {
          type: NocoBaseDesktopRouteType.tabs,
          schemaUid: 'tabs-1',
        },
        {
          type: NocoBaseDesktopRouteType.group,
          children: [
            {
              type: NocoBaseDesktopRouteType.page,
              schemaUid: 'legacy-page-2',
            },
            {
              type: NocoBaseDesktopRouteType.flowPage,
              schemaUid: 'flow-page-2',
            },
          ],
        },
      ],
    };

    expect(resolveAdminRouteRuntimeTarget({ app, route })).toEqual({
      runtimePath: '/nocobase/v2/admin/flow-page-2',
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'ok',
    });
  });

  it('should skip tabs hidden and hideInMenu routes during DFS', () => {
    const route = findFirstAccessiblePageRoute([
      {
        type: NocoBaseDesktopRouteType.tabs,
        schemaUid: 'tabs-1',
      },
      {
        type: NocoBaseDesktopRouteType.page,
        schemaUid: 'hidden-page',
        hidden: true,
      },
      {
        type: NocoBaseDesktopRouteType.page,
        schemaUid: 'menu-hidden-page',
        hideInMenu: true,
      },
      {
        type: NocoBaseDesktopRouteType.flowPage,
        schemaUid: 'visible-flow-page',
      },
    ]);

    expect(route).toMatchObject({
      type: NocoBaseDesktopRouteType.flowPage,
      schemaUid: 'visible-flow-page',
    });
  });

  it('should find v2 landing route and skip legacy page routes', () => {
    const routes = [
      {
        type: NocoBaseDesktopRouteType.page,
        schemaUid: 'legacy-page',
      },
      {
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            type: NocoBaseDesktopRouteType.page,
            schemaUid: 'nested-legacy-page',
          },
          {
            type: NocoBaseDesktopRouteType.flowPage,
            schemaUid: 'nested-flow-page',
          },
        ],
      },
    ];

    expect(findFirstV2LandingRoute(routes)).toMatchObject({
      type: NocoBaseDesktopRouteType.flowPage,
      schemaUid: 'nested-flow-page',
    });
    expect(isV2MenuRoute(routes[0])).toBe(false);
    expect(isV2MenuRoute(routes[1])).toBe(true);
  });

  it('should return empty target when group has no accessible landing page', () => {
    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        route: {
          type: NocoBaseDesktopRouteType.group,
          children: [
            {
              type: NocoBaseDesktopRouteType.tabs,
              schemaUid: 'tabs-1',
            },
            {
              type: NocoBaseDesktopRouteType.page,
              schemaUid: 'hidden-page',
              hideInMenu: true,
            },
          ],
        },
      }),
    ).toEqual({
      runtimePath: null,
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'emptyGroup',
    });
  });

  it('should not guess route path when schemaUid is missing and should log', () => {
    const log = vi.fn();

    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        route: {
          type: NocoBaseDesktopRouteType.page,
        },
        log,
      }),
    ).toEqual({
      runtimePath: null,
      navigationMode: 'spa',
      isLegacy: false,
      reason: 'missingSchemaUid',
    });
    expect(log).toHaveBeenCalledWith(
      '[NocoBase] Admin route runtime target:',
      'Missing schemaUid.',
      expect.objectContaining({ type: NocoBaseDesktopRouteType.page }),
    );
  });

  it('should convert root-relative path to router internal path under basename', () => {
    expect(toRouterNavigationPath('/nocobase/v2/admin/page-1', '/nocobase/v2')).toBe('/admin/page-1');
    expect(toRouterNavigationPath('/admin/page-1', '/nocobase/v2')).toBe('/admin/page-1');
  });

  describe('v2 sub-app context (router basename contains /apps/<id>/)', () => {
    const subApp = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2/apps/test-app/',
      },
    } as any;

    it('should resolve flowPage runtime path under sub-app basename', () => {
      expect(
        resolveAdminRouteRuntimeTarget({
          app: subApp,
          route: {
            type: NocoBaseDesktopRouteType.flowPage,
            schemaUid: 'fp1',
          },
        }),
      ).toEqual({
        runtimePath: '/nocobase/v2/apps/test-app/admin/fp1',
        navigationMode: 'spa',
        isLegacy: false,
        reason: 'ok',
      });
    });

    it('should resolve group DFS to first flowPage under sub-app basename', () => {
      const route: NocoBaseDesktopRoute = {
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            type: NocoBaseDesktopRouteType.tabs,
            schemaUid: 'tabs-1',
          },
          {
            type: NocoBaseDesktopRouteType.group,
            children: [
              {
                type: NocoBaseDesktopRouteType.page,
                schemaUid: 'legacy-2',
              },
              {
                type: NocoBaseDesktopRouteType.flowPage,
                schemaUid: 'nested-fp',
              },
            ],
          },
        ],
      };

      expect(resolveAdminRouteRuntimeTarget({ app: subApp, route })).toEqual({
        runtimePath: '/nocobase/v2/apps/test-app/admin/nested-fp',
        navigationMode: 'spa',
        isLegacy: false,
        reason: 'ok',
      });
    });

    it('should strip sub-app basename when converting to router internal path', () => {
      expect(toRouterNavigationPath('/nocobase/v2/apps/test-app/admin/page-1', '/nocobase/v2/apps/test-app')).toBe(
        '/admin/page-1',
      );
      expect(toRouterNavigationPath('/nocobase/v2/apps/test-app/admin/page-1', '/nocobase/v2/apps/test-app/')).toBe(
        '/admin/page-1',
      );
    });
  });

  describe('fallback when router basename is missing', () => {
    it('should fall back to publicPath when router is undefined', () => {
      const appNoRouter = {
        getPublicPath: () => '/nocobase/v2/',
        router: undefined,
      } as any;

      expect(
        resolveAdminRouteRuntimeTarget({
          app: appNoRouter,
          route: {
            type: NocoBaseDesktopRouteType.flowPage,
            schemaUid: 'fp1',
          },
        }),
      ).toMatchObject({
        runtimePath: '/nocobase/v2/admin/fp1',
        reason: 'ok',
      });
    });

    it('should fall back to publicPath when getBasename returns undefined', () => {
      const appNoBasename = {
        getPublicPath: () => '/nocobase/v2/',
        router: {
          getBasename: () => undefined,
        },
      } as any;

      expect(
        resolveAdminRouteRuntimeTarget({
          app: appNoBasename,
          route: {
            type: NocoBaseDesktopRouteType.flowPage,
            schemaUid: 'fp1',
          },
        }),
      ).toMatchObject({
        runtimePath: '/nocobase/v2/admin/fp1',
        reason: 'ok',
      });
    });
  });
});
