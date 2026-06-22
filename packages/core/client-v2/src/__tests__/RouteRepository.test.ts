/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type { NocoBaseDesktopRoute } from '../flow-compat';
import { RouteRepository } from '../RouteRepository';

function createRouteRepository() {
  const request = vi.fn().mockResolvedValue({
    data: {
      data: [],
    },
  });
  const create = vi.fn().mockResolvedValue({
    data: {
      data: {},
    },
  });
  const resource = vi.fn(() => ({
    create,
  }));
  const repository = new RouteRepository({
    api: {
      request,
      resource,
    },
  } as never);

  return {
    create,
    repository,
    request,
    resource,
  };
}

function route(schemaUid: string): NocoBaseDesktopRoute {
  return { schemaUid } as NocoBaseDesktopRoute;
}

describe('RouteRepository', () => {
  it('should pass the default admin layout when loading accessible routes', async () => {
    const { repository, request } = createRouteRepository();

    await repository.refreshAccessible();

    expect(request).toHaveBeenCalledWith({
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'admin-layout-model',
      },
    });
  });

  it('should pass the active client-v2 layout when loading accessible routes', async () => {
    const { repository, request } = createRouteRepository();
    const deactivateLayout = repository.activateLayout({
      uid: 'custom-desktop-layout-model',
    });

    await repository.refreshAccessible();
    deactivateLayout();

    expect(request).toHaveBeenCalledWith({
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'custom-desktop-layout-model',
      },
    });
  });

  it('should reload accessible routes when the active client-v2 layout changes', async () => {
    const { repository, request } = createRouteRepository();
    const deactivateFirstLayout = repository.activateLayout({
      uid: 'first-layout-model',
    });
    await repository.ensureAccessibleLoaded();
    deactivateFirstLayout();

    const deactivateSecondLayout = repository.activateLayout({
      uid: 'second-layout-model',
    });
    await repository.ensureAccessibleLoaded();
    deactivateSecondLayout();

    expect(request).toHaveBeenNthCalledWith(1, {
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'first-layout-model',
      },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      url: '/desktopRoutes:listAccessible',
      params: {
        tree: true,
        sort: 'sort',
        layout: 'second-layout-model',
      },
    });
  });

  it('should report accessible routes as unloaded when the active layout changes', () => {
    const { repository } = createRouteRepository();

    repository.setRoutes([], 'first-layout-model');
    const deactivateLayout = repository.activateLayout({
      uid: 'second-layout-model',
    });

    expect(repository.isAccessibleLoaded()).toBe(false);
    deactivateLayout();
  });

  it('should keep accessible route caches isolated by active layout', () => {
    const { repository } = createRouteRepository();

    repository.setRoutes([route('admin-page')], 'admin-layout-model');
    const deactivateLayout = repository.activateLayout({
      uid: 'custom-desktop-layout-model',
    });
    repository.setRoutes([route('custom-page')], 'custom-desktop-layout-model');

    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['custom-page']);
    expect(repository.getRouteBySchemaUid('admin-page')).toBeUndefined();
    deactivateLayout();

    expect(repository.listAccessible().map((route) => route.schemaUid)).toEqual(['admin-page']);
    expect(repository.getRouteBySchemaUid('custom-page')).toBeUndefined();
  });

  it('should notify only subscribers for the changed layout cache', () => {
    const { repository } = createRouteRepository();
    const adminEvents: string[][] = [];
    const customEvents: string[][] = [];

    const unsubscribeAdmin = repository.subscribe(() => {
      adminEvents.push(repository.listAccessible().map((route) => route.schemaUid || ''));
    });
    const deactivateLayout = repository.activateLayout({
      uid: 'custom-desktop-layout-model',
    });
    const unsubscribeCustom = repository.subscribe(() => {
      customEvents.push(repository.listAccessible().map((route) => route.schemaUid || ''));
    });

    repository.setRoutes([route('custom-page')], 'custom-desktop-layout-model');

    expect(adminEvents).toEqual([]);
    expect(customEvents).toEqual([['custom-page']]);

    deactivateLayout();
    repository.setRoutes([route('admin-page')], 'admin-layout-model');

    expect(adminEvents).toEqual([['admin-page']]);
    expect(customEvents).toEqual([['custom-page']]);

    unsubscribeAdmin();
    unsubscribeCustom();
  });

  it('should pass the default admin layout when creating a route', async () => {
    const { repository, create } = createRouteRepository();

    await repository.createRoute(
      {
        title: 'Admin page',
      },
      {
        refreshAfterMutation: false,
      },
    );

    expect(create).toHaveBeenCalledWith({
      values: {
        title: 'Admin page',
      },
      layout: 'admin-layout-model',
    });
  });

  it('should pass the active client-v2 layout when creating a route', async () => {
    const { repository, create } = createRouteRepository();
    const deactivateLayout = repository.activateLayout({
      uid: 'custom-desktop-layout-model',
    });

    await repository.createRoute(
      {
        title: 'Custom page',
      },
      {
        refreshAfterMutation: false,
      },
    );
    deactivateLayout();

    expect(create).toHaveBeenCalledWith({
      values: {
        title: 'Custom page',
      },
      layout: 'custom-desktop-layout-model',
    });
  });
});
