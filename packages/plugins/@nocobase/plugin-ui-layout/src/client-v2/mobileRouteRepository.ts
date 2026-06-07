/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';

type MobileLayoutApiClient = {
  request: (options: { url: string; params?: Record<string, unknown> }) => Promise<{
    data?: {
      data?: NocoBaseDesktopRoute[];
    };
  }>;
};

type MobileLayoutRouteRepository = {
  listAccessible?: () => NocoBaseDesktopRoute[];
  setRoutes?: (routes: NocoBaseDesktopRoute[]) => void;
  ensureAccessibleLoaded?: () => Promise<NocoBaseDesktopRoute[]>;
};

type MobileLayoutRouteModel = {
  layout?: {
    uid?: unknown;
  };
  flowEngine: {
    context: {
      api?: MobileLayoutApiClient;
      routeRepository?: MobileLayoutRouteRepository;
    };
  };
};

function getMobileLayoutUid(model: MobileLayoutRouteModel) {
  const uid = model.layout?.uid;
  return typeof uid === 'string' && uid.trim() ? uid : undefined;
}

function normalizeRoutes(routes: unknown): NocoBaseDesktopRoute[] {
  return Array.isArray(routes) ? routes : [];
}

export async function refreshMobileLayoutAccessibleRoutes(
  model?: MobileLayoutRouteModel,
  routeRepository = model?.flowEngine.context.routeRepository,
) {
  const layoutUid = model ? getMobileLayoutUid(model) : undefined;
  const fallbackRoutes = normalizeRoutes(routeRepository?.listAccessible?.());

  if (!routeRepository || !layoutUid) {
    return fallbackRoutes;
  }

  const api = model.flowEngine.context.api;
  if (!api?.request || !routeRepository.setRoutes) {
    if (routeRepository.ensureAccessibleLoaded) {
      return routeRepository.ensureAccessibleLoaded();
    }

    return fallbackRoutes;
  }

  const response = await api.request({
    url: '/desktopRoutes:listAccessible',
    params: {
      tree: true,
      sort: 'sort',
      layout: layoutUid,
    },
  });
  const routes = normalizeRoutes(response?.data?.data);

  routeRepository.setRoutes(routes);

  return routes;
}
