/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { installMobileLayoutRouteRepository } from '../mobileRouteRepository';
import type { NocoBaseDesktopRoute } from '../models/mobileFlowCompat';

function createDeferredRoutes(routes: NocoBaseDesktopRoute[]) {
  let resolvePromise!: (value: { data: { data: NocoBaseDesktopRoute[] } }) => void;
  const promise = new Promise<{ data: { data: NocoBaseDesktopRoute[] } }>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: () => resolvePromise({ data: { data: routes } }),
  };
}

function createRouteRepository() {
  const routes: NocoBaseDesktopRoute[] = [];
  return {
    listAccessible: vi.fn(() => routes),
    setRoutes: vi.fn(),
    isAccessibleLoaded: vi.fn(() => false),
    activateLayout: vi.fn(() => vi.fn()),
  };
}

function createMobileLayoutModel(
  layoutUid: string,
  routeRepository: ReturnType<typeof createRouteRepository>,
  request: ReturnType<typeof vi.fn>,
) {
  return {
    layout: {
      uid: layoutUid,
    },
    flowEngine: {
      context: {
        api: {
          request,
        },
        routeRepository,
      },
    },
  };
}

describe('mobileRouteRepository', () => {
  it('should use the latest mobile layout model after reinstalling repository wrappers', async () => {
    const routeRepository = createRouteRepository();
    const firstRoutes = [{ id: 1, title: 'First route' }] as NocoBaseDesktopRoute[];
    const secondRoutes = [{ id: 2, title: 'Second route' }] as NocoBaseDesktopRoute[];
    const firstRequest = vi.fn(async () => ({ data: { data: firstRoutes } }));
    const secondRequest = vi.fn(async () => ({ data: { data: secondRoutes } }));
    const disposeFirst = installMobileLayoutRouteRepository(
      createMobileLayoutModel('first-mobile-layout', routeRepository, firstRequest),
      routeRepository,
    );
    const disposeSecond = installMobileLayoutRouteRepository(
      createMobileLayoutModel('second-mobile-layout', routeRepository, secondRequest),
      routeRepository,
    );

    await routeRepository.ensureAccessibleLoaded?.();

    expect(firstRequest).not.toHaveBeenCalled();
    expect(secondRequest).toHaveBeenCalledWith({
      url: '/desktopRoutes:listAccessible',
      params: {
        layout: 'second-mobile-layout',
        sort: 'sort',
        tree: true,
      },
    });
    expect(routeRepository.setRoutes).toHaveBeenCalledWith(secondRoutes);

    disposeSecond();
    disposeFirst();
  });

  it('should start a new request when the active mobile layout changes while a request is pending', async () => {
    const routeRepository = createRouteRepository();
    const firstRoutes = [{ id: 1, title: 'First route' }] as NocoBaseDesktopRoute[];
    const secondRoutes = [{ id: 2, title: 'Second route' }] as NocoBaseDesktopRoute[];
    const firstDeferred = createDeferredRoutes(firstRoutes);
    const secondDeferred = createDeferredRoutes(secondRoutes);
    const firstRequest = vi.fn(() => firstDeferred.promise);
    const secondRequest = vi.fn(() => secondDeferred.promise);
    const disposeFirst = installMobileLayoutRouteRepository(
      createMobileLayoutModel('first-mobile-layout', routeRepository, firstRequest),
      routeRepository,
    );
    const firstLoad = routeRepository.ensureAccessibleLoaded?.();
    const disposeSecond = installMobileLayoutRouteRepository(
      createMobileLayoutModel('second-mobile-layout', routeRepository, secondRequest),
      routeRepository,
    );
    const secondLoad = routeRepository.ensureAccessibleLoaded?.();

    expect(firstRequest).toHaveBeenCalledTimes(1);
    expect(secondRequest).toHaveBeenCalledTimes(1);

    firstDeferred.resolve();
    await firstLoad;
    expect(routeRepository.setRoutes).not.toHaveBeenCalledWith(firstRoutes);

    secondDeferred.resolve();
    await secondLoad;
    expect(routeRepository.setRoutes).toHaveBeenCalledWith(secondRoutes);

    disposeSecond();
    disposeFirst();
  });
});
