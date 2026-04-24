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
  resolveAdminRouteRuntimeTarget,
  toRouterNavigationPath,
} from './resolveAdminRouteRuntimeTarget';

const app = {
  getPublicPath: () => '/nocobase/v2/',
  router: {
    getBasename: () => '/nocobase/v2',
  },
} as any;

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
    });
  });

  it('should resolve page to legacy document runtime target', () => {
    expect(
      resolveAdminRouteRuntimeTarget({
        app,
        route: {
          type: NocoBaseDesktopRouteType.page,
          schemaUid: 'legacy-page-1',
        },
      }),
    ).toEqual({
      runtimePath: '/nocobase/admin/legacy-page-1',
      navigationMode: 'document',
      isLegacy: true,
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
    });
  });

  it('should preserve current search and hash for direct legacy correction', () => {
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
      runtimePath: '/nocobase/admin/legacy-page-1/tabs/tab-1/popups/detail?from=direct#dialog',
      navigationMode: 'document',
      isLegacy: true,
    });
  });

  it('should resolve group by DFS first accessible route', () => {
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
      runtimePath: '/nocobase/admin/legacy-page-2',
      navigationMode: 'document',
      isLegacy: true,
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
});
