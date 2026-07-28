/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RouteRepository } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import {
  getMultiPortalRouteScopeCacheKey,
  installMultiPortalRouteRepositoryScope,
  type MultiPortalRouteScopeDescriptor,
} from '../routeRepositoryScope';

type RequestOptions = {
  action?: string;
  data?: Record<string, unknown>;
  method?: string;
  params?: Record<string, unknown>;
  resource?: string;
  url?: string;
};

function createRouteRuntime() {
  const request = vi.fn(async (_options: RequestOptions) => ({ data: { data: {} } }));
  const api = {
    request,
    resource: vi.fn(() => ({})),
  };
  const repository = new RouteRepository({ api } as never);

  return { api, repository, request };
}

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

describe('desktop portal route identity', () => {
  it('treats a Portal UID containing the cache prefix as an opaque identity', async () => {
    const { api, repository, request } = createRouteRuntime();
    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('portal:customer')]);
    const deactivatePortal = repository.activateLayout({ uid: 'portal:customer' });

    await api.request({
      method: 'get',
      url: '/desktopRoutes:listAccessible',
    });

    deactivatePortal();

    expect(request).toHaveBeenCalledWith({
      method: 'get',
      url: '/desktopRoutes:listAccessible',
      params: {
        portal: 'portal:customer',
      },
    });
  });

  it('does not interpret an ordinary Layout UID as a Portal cache key', async () => {
    const { api, repository, request } = createRouteRuntime();
    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('customer')]);
    const deactivateLayout = repository.activateLayout({ uid: 'portal:customer' });

    await api.request({
      method: 'get',
      url: '/desktopRoutes:listAccessible',
      params: {
        layout: 'portal:customer',
      },
    });

    deactivateLayout();

    expect(request).toHaveBeenCalledWith({
      method: 'get',
      url: '/desktopRoutes:listAccessible',
      params: {
        layout: 'portal:customer',
      },
    });
  });

  it('isolates an ordinary Layout whose UID equals a Portal cache key', () => {
    const { repository } = createRouteRuntime();
    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('customer')]);

    const deactivatePortal = repository.activateLayout({ uid: 'customer' });
    repository.setRoutes([{ schemaUid: 'portal-page' }]);
    deactivatePortal();

    const deactivateLayout = repository.activateLayout({ uid: 'portal:customer' });
    repository.setRoutes([{ schemaUid: 'layout-page' }]);
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['layout-page']);
    deactivateLayout();

    const reactivatePortal = repository.activateLayout({ uid: 'customer' });
    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['portal-page']);
    reactivatePortal();
  });

  it('replaces an inherited Mobile layout scope with the active Portal identity', async () => {
    const { api, repository, request } = createRouteRuntime();
    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('mobile-layout-model', 'layout')]);
    const deactivatePortal = repository.activateLayout({ uid: 'mobile-layout-model' });

    await api.request({
      method: 'get',
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'mobile-layout-model',
        portal: 'forged-portal',
      },
    });

    deactivatePortal();

    expect(request).toHaveBeenCalledWith({
      method: 'get',
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        portal: 'mobile-layout-model',
      },
    });
  });

  it('attaches the active Portal UID to direct PageModel desktop route mutations', async () => {
    const { api, repository, request } = createRouteRuntime();
    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('customer-portal')]);
    const deactivatePortal = repository.activateLayout({ uid: 'customer-portal' });

    await api.request({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=11',
      data: { enableTabs: true },
    });
    await api.request({
      method: 'post',
      url: 'desktopRoutes:updateOrCreate',
      params: { filterKeys: ['schemaUid'] },
      data: { schemaUid: 'tab-1' },
    });
    await api.request({
      method: 'post',
      url: 'desktopRoutes:destroy',
      params: { filter: { schemaUid: 'tab-1' }, portal: 'forged-portal' },
    });
    await api.request({
      method: 'post',
      url: '/desktopRoutes:move',
      params: { sourceId: 11, targetId: 12, sortField: 'sort' },
    });
    await api.request({
      resource: 'users',
      action: 'list',
      params: { pageSize: 20 },
    });

    deactivatePortal();

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=11',
      params: { portal: 'customer-portal' },
      data: { enableTabs: true },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'post',
      url: 'desktopRoutes:updateOrCreate',
      params: { filterKeys: ['schemaUid'], portal: 'customer-portal' },
      data: { schemaUid: 'tab-1' },
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      method: 'post',
      url: 'desktopRoutes:destroy',
      params: { filter: { schemaUid: 'tab-1' }, portal: 'customer-portal' },
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      method: 'post',
      url: '/desktopRoutes:move',
      params: { sourceId: 11, targetId: 12, sortField: 'sort', portal: 'customer-portal' },
    });
    expect(request).toHaveBeenNthCalledWith(5, {
      resource: 'users',
      action: 'list',
      params: { pageSize: 20 },
    });
  });

  it('keeps non-Portal and uninstalled Settings API requests unchanged', async () => {
    const { api, repository, request } = createRouteRuntime();
    installMultiPortalRouteRepositoryScope(repository, () => [createPortalScope('customer-portal')]);
    const deactivateLayout = repository.activateLayout({ uid: 'standalone-layout' });

    await api.request({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=11',
      params: { source: 'layout' },
      data: { enableTabs: true },
    });
    deactivateLayout();

    expect(request).toHaveBeenCalledWith({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=11',
      params: { source: 'layout' },
      data: { enableTabs: true },
    });

    const settingsRequest = vi.fn(async (_options: RequestOptions) => ({ data: { data: {} } }));
    const settingsApi = { request: settingsRequest };
    await settingsApi.request({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=11',
      params: { source: 'settings' },
    });
    expect(settingsRequest).toHaveBeenCalledWith({
      method: 'post',
      url: 'desktopRoutes:update?filter[id]=11',
      params: { source: 'settings' },
    });
  });
});
