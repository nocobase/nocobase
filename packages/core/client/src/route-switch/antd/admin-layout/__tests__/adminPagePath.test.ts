/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { matchRoutes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  ADMIN_V1_PAGE_PREFIX,
  ADMIN_V2_PAGE_PREFIX,
  buildLegacyAdminRedirectPath,
  getAdminPagePathByRoute,
  getAdminPagePathBySchemaUid,
} from '../adminPagePath';
import { NocoBaseDesktopRouteType } from '../convertRoutesToSchema';

describe('adminPagePath', () => {
  it('should route page type to v1', () => {
    expect(getAdminPagePathBySchemaUid('page-uid', NocoBaseDesktopRouteType.page)).toBe('/admin/v1/page-uid');
  });

  it('should route flowPage type to v2', () => {
    expect(getAdminPagePathBySchemaUid('flow-uid', NocoBaseDesktopRouteType.flowPage)).toBe('/admin/v2/flow-uid');
  });

  it('should fallback to v1 without warning when type is missing', () => {
    const logger = { warn: vi.fn() };
    const path = getAdminPagePathBySchemaUid('missing-type', undefined, { logger });

    expect(path).toBe('/admin/v1/missing-type');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should fallback to v1 and warn when type is unknown', () => {
    const logger = { warn: vi.fn() };
    const path = getAdminPagePathBySchemaUid('unknown-type', NocoBaseDesktopRouteType.flowRoute, { logger });

    expect(path).toBe('/admin/v1/unknown-type');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should keep suffix and query when building legacy redirect target', () => {
    const target = buildLegacyAdminRedirectPath({
      pathname: '/admin/menu-uid/tabs/tab-1/popups/dialog',
      search: '?foo=bar',
      currentPageUid: 'menu-uid',
      route: {
        schemaUid: 'page-uid',
        type: NocoBaseDesktopRouteType.page,
      },
    });

    expect(target).toBe('/admin/v1/page-uid/tabs/tab-1/popups/dialog?foo=bar');
  });

  it('should keep v2 suffix for flowPage legacy redirect target', () => {
    const target = buildLegacyAdminRedirectPath({
      pathname: '/admin/menu-uid/tab/tab-1/view/dialog',
      search: '?foo=bar',
      currentPageUid: 'menu-uid',
      route: {
        schemaUid: 'page-uid',
        type: NocoBaseDesktopRouteType.flowPage,
      },
    });

    expect(target).toBe('/admin/v2/page-uid/tab/tab-1/view/dialog?foo=bar');
  });

  it('should drop incompatible legacy suffix when route type and suffix family mismatch', () => {
    const logger = { warn: vi.fn() };
    const target = buildLegacyAdminRedirectPath({
      pathname: '/admin/menu-uid/tabs/tab-1',
      search: '',
      currentPageUid: 'menu-uid',
      route: {
        schemaUid: 'page-uid',
        type: NocoBaseDesktopRouteType.flowPage,
      },
      logger,
    });

    expect(target).toBe('/admin/v2/page-uid');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should fallback to v1 and drop incompatible suffix for unknown type in legacy redirect', () => {
    const logger = { warn: vi.fn() };
    const target = buildLegacyAdminRedirectPath({
      pathname: '/admin/menu-uid/view/child',
      search: '',
      currentPageUid: 'menu-uid',
      route: {
        schemaUid: 'page-uid',
        type: NocoBaseDesktopRouteType.flowRoute,
      },
      logger,
    });

    expect(target).toBe('/admin/v1/page-uid');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should return empty redirect target when route schemaUid is missing', () => {
    const target = buildLegacyAdminRedirectPath({
      pathname: '/admin/menu-uid',
      search: '',
      currentPageUid: 'menu-uid',
      route: {
        type: NocoBaseDesktopRouteType.page,
      },
    });

    expect(target).toBe('');
  });

  it('should keep non-schema admin paths out of the legacy dynamic route', () => {
    const routes = [
      { id: 'legacy', path: '/admin/:name' },
      { id: 'settings', path: '/admin/settings/*' },
      { id: 'pm', path: '/admin/pm/*' },
      { id: 'plugins', path: '/admin/plugins/*' },
      { id: 'v1', path: '/admin/v1/:name' },
      { id: 'v2', path: '/admin/v2/:name' },
    ];

    const getLeafRouteId = (pathname: string) => {
      const matches = matchRoutes(routes, pathname);
      return matches?.[matches.length - 1]?.route?.id;
    };

    expect(getLeafRouteId('/admin/settings/users')).toBe('settings');
    expect(getLeafRouteId('/admin/pm/list')).toBe('pm');
    expect(getLeafRouteId('/admin/plugins/block-templates/key')).toBe('plugins');
    expect(getLeafRouteId(`${ADMIN_V1_PAGE_PREFIX}/page-uid`)).toBe('v1');
    expect(getLeafRouteId(`${ADMIN_V2_PAGE_PREFIX}/flow-uid`)).toBe('v2');
    expect(getLeafRouteId('/admin/legacy-uid')).toBe('legacy');
  });

  it('should support route-based helper', () => {
    expect(
      getAdminPagePathByRoute({
        schemaUid: 'page-uid',
        type: NocoBaseDesktopRouteType.page,
      }),
    ).toBe('/admin/v1/page-uid');
  });
});
