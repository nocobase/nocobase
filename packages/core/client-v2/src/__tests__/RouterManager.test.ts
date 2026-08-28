/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from '../BaseApplication';
import { RouterManager, shouldOpenAdminRouteInNewWindow } from '../RouterManager';

describe('RouterManager', () => {
  describe('shouldOpenAdminRouteInNewWindow', () => {
    it('opens admin route in a new window from a non-admin portal', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/test',
          targetPathname: '/admin/settings',
          basePath: '/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(true);
    });

    it('supports target pathname with the v2 base path', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/nocobase/v/test',
          targetPathname: '/nocobase/v/admin/settings',
          basePath: '/nocobase/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(true);
    });

    it('supports custom portal routes in sub-apps', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/apps/a_9xlild35jir/crm-amd/ekeisumx1zu',
          targetPathname: '/v/apps/a_9xlild35jir/admin/settings',
          basePath: '/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(true);
    });

    it('keeps admin route navigation in the current window when already in sub-app admin', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/apps/a_9xlild35jir/admin',
          targetPathname: '/v/apps/a_9xlild35jir/admin/settings',
          basePath: '/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(false);
    });

    it('keeps admin route navigation in the current window when already in admin', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/admin',
          targetPathname: '/admin/settings',
          basePath: '/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(false);
    });

    it('keeps non-admin portal navigation in the current window', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/test',
          targetPathname: '/test/page',
          basePath: '/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(false);
    });

    it('does not intercept replace navigation or relative paths', () => {
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/test',
          targetPathname: '/admin/settings',
          basePath: '/v',
          adminRoutePath: '/admin',
          replace: true,
        }),
      ).toBe(false);
      expect(
        shouldOpenAdminRouteInNewWindow({
          currentPathname: '/v/test',
          targetPathname: 'admin/settings',
          basePath: '/v',
          adminRoutePath: '/admin',
        }),
      ).toBe(false);
    });
  });

  it('opens admin route in a new window through the underlying router navigate from a sub-app portal', async () => {
    const app = {
      name: 'a_9xlild35jir',
      getPublicPath: () => '/v/',
      getHref: (pathname: string) => `/v/apps/a_9xlild35jir/${pathname.replace(/^\/+/, '')}`,
      layoutManager: {
        getLayout: () => ({ routePath: '/admin' }),
      },
      renderComponent: () => null,
    } as unknown as BaseApplication<unknown>;
    const manager = new RouterManager({ type: 'browser' }, app);
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    window.history.pushState({}, '', '/v/apps/a_9xlild35jir/crm-amd/ekeisumx1zu');
    manager.getRouterComponent();
    await manager.router.navigate('/admin/settings/version-control/list');

    expect(open).toHaveBeenCalledWith(
      '/v/apps/a_9xlild35jir/admin/settings/version-control/list',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
