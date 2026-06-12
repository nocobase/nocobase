/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocoBaseDesktopRoute } from './models/mobileFlowCompat';

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
  isAccessibleLoaded?: () => boolean;
  refreshAccessible?: () => Promise<NocoBaseDesktopRoute[]>;
  ensureAccessibleLoaded?: () => Promise<NocoBaseDesktopRoute[]>;
  activateLayout?: (layout?: { uid?: unknown }) => () => void;
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

type MobileLayoutRouteRepositoryState = {
  refs: number;
  layoutUid: string;
  loadedLayoutUid?: string;
  loadingPromise?: Promise<NocoBaseDesktopRoute[]>;
  requestId: number;
  originalEnsureAccessibleLoaded?: MobileLayoutRouteRepository['ensureAccessibleLoaded'];
  originalRefreshAccessible?: MobileLayoutRouteRepository['refreshAccessible'];
  deactivateLayout?: () => void;
};

const mobileLayoutRouteRepositoryStates = new WeakMap<MobileLayoutRouteRepository, MobileLayoutRouteRepositoryState>();
const MOBILE_ROUTE_PORTAL_SCOPE_PREFIX = 'portal:';

function getMobileLayoutUid(model: MobileLayoutRouteModel) {
  const uid = model.layout?.uid;
  return typeof uid === 'string' && uid.trim() ? uid : undefined;
}

function getMobileRouteScopeParams(layoutUid: string) {
  if (layoutUid.startsWith(MOBILE_ROUTE_PORTAL_SCOPE_PREFIX)) {
    const portalUid = layoutUid.slice(MOBILE_ROUTE_PORTAL_SCOPE_PREFIX.length);
    if (portalUid) {
      return {
        portal: portalUid,
      };
    }
  }

  return {
    layout: layoutUid,
  };
}

function normalizeRoutes(routes: unknown): NocoBaseDesktopRoute[] {
  return Array.isArray(routes) ? routes : [];
}

async function requestMobileLayoutAccessibleRoutes(
  model?: MobileLayoutRouteModel,
  routeRepository = model?.flowEngine.context.routeRepository,
  requestId?: number,
) {
  const layoutUid = model ? getMobileLayoutUid(model) : undefined;
  const api = model?.flowEngine.context.api;
  if (!routeRepository || !layoutUid || !api?.request || !routeRepository.setRoutes) {
    return getFallbackAccessibleRoutes(routeRepository);
  }

  const response = await api.request({
    url: '/desktopRoutes:listAccessible',
    params: {
      tree: true,
      sort: 'sort',
      ...getMobileRouteScopeParams(layoutUid),
    },
  });
  const routes = normalizeRoutes(response?.data?.data);
  const state = mobileLayoutRouteRepositoryStates.get(routeRepository);
  const canWriteRoutes =
    requestId === undefined
      ? !state || state.layoutUid === layoutUid
      : !!state && state.requestId === requestId && state.layoutUid === layoutUid;

  if (canWriteRoutes) {
    routeRepository.setRoutes(routes);
    if (state) {
      state.loadedLayoutUid = layoutUid;
    }
  }

  return routes;
}

function canRequestMobileLayoutRoutes(
  model: MobileLayoutRouteModel | undefined,
  routeRepository: MobileLayoutRouteRepository | undefined,
) {
  const layoutUid = model ? getMobileLayoutUid(model) : undefined;
  const api = model?.flowEngine.context.api;

  return !!routeRepository && !!layoutUid && !!api?.request && !!routeRepository.setRoutes;
}

function getFallbackAccessibleRoutes(routeRepository: MobileLayoutRouteRepository | undefined) {
  return normalizeRoutes(routeRepository?.listAccessible?.());
}

function startMobileLayoutRouteRequest(
  model: MobileLayoutRouteModel,
  routeRepository: MobileLayoutRouteRepository,
  options: { force?: boolean } = {},
) {
  const state = mobileLayoutRouteRepositoryStates.get(routeRepository);
  if (state?.loadingPromise && !options.force) {
    return state.loadingPromise;
  }

  const requestId = state ? state.requestId + 1 : undefined;
  if (state) {
    state.requestId = requestId as number;
  }
  const requestPromise = requestMobileLayoutAccessibleRoutes(model, routeRepository, requestId);
  if (state) {
    const loadingPromise = requestPromise.finally(() => {
      if (state.loadingPromise === loadingPromise) {
        state.loadingPromise = undefined;
      }
    });
    state.loadingPromise = loadingPromise;
    return state.loadingPromise;
  }

  return requestPromise;
}

export async function ensureMobileLayoutAccessibleRoutes(
  model?: MobileLayoutRouteModel,
  routeRepository = model?.flowEngine.context.routeRepository,
) {
  if (!routeRepository || !model || !canRequestMobileLayoutRoutes(model, routeRepository)) {
    if (routeRepository?.ensureAccessibleLoaded) {
      return routeRepository.ensureAccessibleLoaded();
    }

    return getFallbackAccessibleRoutes(routeRepository);
  }

  const layoutUid = getMobileLayoutUid(model);
  const state = mobileLayoutRouteRepositoryStates.get(routeRepository);
  if (
    layoutUid &&
    state?.loadedLayoutUid === layoutUid &&
    routeRepository.isAccessibleLoaded?.() &&
    !state.loadingPromise
  ) {
    return getFallbackAccessibleRoutes(routeRepository);
  }

  return startMobileLayoutRouteRequest(model, routeRepository);
}

export async function refreshMobileLayoutAccessibleRoutes(
  model?: MobileLayoutRouteModel,
  routeRepository = model?.flowEngine.context.routeRepository,
) {
  if (!routeRepository || !model || !canRequestMobileLayoutRoutes(model, routeRepository)) {
    if (routeRepository?.ensureAccessibleLoaded) {
      return routeRepository.ensureAccessibleLoaded();
    }

    return getFallbackAccessibleRoutes(routeRepository);
  }

  return startMobileLayoutRouteRequest(model, routeRepository, { force: true });
}

export function installMobileLayoutRouteRepository(
  model?: MobileLayoutRouteModel,
  routeRepository = model?.flowEngine.context.routeRepository,
) {
  const layoutUid = model ? getMobileLayoutUid(model) : undefined;
  if (!routeRepository || !model || !layoutUid || !canRequestMobileLayoutRoutes(model, routeRepository)) {
    return () => {};
  }

  const existingState = mobileLayoutRouteRepositoryStates.get(routeRepository);
  if (existingState) {
    existingState.refs += 1;
    if (existingState.layoutUid !== layoutUid) {
      existingState.deactivateLayout?.();
      existingState.deactivateLayout = routeRepository.activateLayout?.(model.layout);
      existingState.layoutUid = layoutUid;
    }
    return () => {
      existingState.refs -= 1;
      if (existingState.refs > 0) {
        return;
      }

      routeRepository.ensureAccessibleLoaded = existingState.originalEnsureAccessibleLoaded;
      routeRepository.refreshAccessible = existingState.originalRefreshAccessible;
      existingState.deactivateLayout?.();
      mobileLayoutRouteRepositoryStates.delete(routeRepository);
    };
  }

  const state: MobileLayoutRouteRepositoryState = {
    refs: 1,
    layoutUid,
    requestId: 0,
    originalEnsureAccessibleLoaded: routeRepository.ensureAccessibleLoaded,
    originalRefreshAccessible: routeRepository.refreshAccessible,
    deactivateLayout: routeRepository.activateLayout?.(model.layout),
  };
  mobileLayoutRouteRepositoryStates.set(routeRepository, state);
  routeRepository.ensureAccessibleLoaded = () => ensureMobileLayoutAccessibleRoutes(model, routeRepository);
  routeRepository.refreshAccessible = () => refreshMobileLayoutAccessibleRoutes(model, routeRepository);

  return () => {
    state.refs -= 1;
    if (state.refs > 0) {
      return;
    }

    routeRepository.ensureAccessibleLoaded = state.originalEnsureAccessibleLoaded;
    routeRepository.refreshAccessible = state.originalRefreshAccessible;
    state.deactivateLayout?.();
    mobileLayoutRouteRepositoryStates.delete(routeRepository);
  };
}
