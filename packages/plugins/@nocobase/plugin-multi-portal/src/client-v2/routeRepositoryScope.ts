/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';

type RouteScopeKind = 'layout' | 'portal';

type RouteScope = {
  cacheKey: string;
  kind: RouteScopeKind;
  uid: string;
};

type RouteRepositoryLike = {
  activateLayout: (layout?: { uid?: unknown }) => () => void;
  createRoute: (
    values: Partial<NocoBaseDesktopRoute>,
    options?: {
      refreshAfterMutation?: boolean;
    },
  ) => Promise<unknown>;
  ensureAccessibleLoaded: () => Promise<NocoBaseDesktopRoute[]>;
  isAccessibleLoaded: () => boolean;
  listAccessible: () => NocoBaseDesktopRoute[];
  refreshAccessible: () => Promise<NocoBaseDesktopRoute[]>;
  setRoutes: (routes: NocoBaseDesktopRoute[], layoutUid?: string) => void;
};

type RouteRepositoryApi = {
  request: (options: { params?: Record<string, unknown>; url: string }) => Promise<{
    data?: {
      data?: NocoBaseDesktopRoute[];
    };
  }>;
  resource: (name: string) => {
    create: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

type RouteRepositoryWithApi = RouteRepositoryLike & {
  getAPIClient: () => RouteRepositoryApi;
};

type MultiPortalRouteRepositoryState = {
  loadingPromises: Map<string, Promise<NocoBaseDesktopRoute[]>>;
  originalActivateLayout: RouteRepositoryLike['activateLayout'];
  originalCreateRoute: RouteRepositoryLike['createRoute'];
  originalEnsureAccessibleLoaded: RouteRepositoryLike['ensureAccessibleLoaded'];
  originalRefreshAccessible: RouteRepositoryLike['refreshAccessible'];
  portalUids: () => string[];
  refreshRequestIds: Map<string, number>;
  scopeStack: Array<{
    deactivate: () => void;
    scope: RouteScope;
    token: symbol;
  }>;
};

const MULTI_PORTAL_ROUTE_REPOSITORY_STATE = Symbol('multiPortalRouteRepositoryState');
const MULTI_PORTAL_ROUTE_SCOPE_PREFIX = 'portal:';

export function getMultiPortalRouteScopeCacheKey(portalUid: string) {
  return `${MULTI_PORTAL_ROUTE_SCOPE_PREFIX}${portalUid}`;
}

export function getMultiPortalUidFromRouteScopeCacheKey(cacheKey: string) {
  return cacheKey.startsWith(MULTI_PORTAL_ROUTE_SCOPE_PREFIX)
    ? cacheKey.slice(MULTI_PORTAL_ROUTE_SCOPE_PREFIX.length) || undefined
    : undefined;
}

function normalizeUid(uid: unknown) {
  return typeof uid === 'string' && uid.trim() ? uid : 'admin-layout-model';
}

function normalizePortalUids(portalUids: () => string[]) {
  return new Set(portalUids().filter((uid) => typeof uid === 'string' && uid.trim()));
}

function getScopeForUid(uid: string, portalUids: () => string[]): RouteScope {
  const portalUidFromCacheKey = getMultiPortalUidFromRouteScopeCacheKey(uid);
  const portalUid = portalUidFromCacheKey || uid;

  if (normalizePortalUids(portalUids).has(portalUid)) {
    return {
      cacheKey: getMultiPortalRouteScopeCacheKey(portalUid),
      kind: 'portal',
      uid: portalUid,
    };
  }

  return {
    cacheKey: uid,
    kind: 'layout',
    uid,
  };
}

function getCurrentScope(state: MultiPortalRouteRepositoryState): RouteScope {
  return (
    state.scopeStack[state.scopeStack.length - 1]?.scope || {
      cacheKey: 'admin-layout-model',
      kind: 'layout',
      uid: 'admin-layout-model',
    }
  );
}

function getRepositoryApi(routeRepository: RouteRepositoryLike) {
  return (routeRepository as RouteRepositoryWithApi).getAPIClient();
}

async function refreshPortalAccessibleRoutes(
  routeRepository: RouteRepositoryLike,
  scope: RouteScope,
  state: MultiPortalRouteRepositoryState,
) {
  const requestId = (state.refreshRequestIds.get(scope.cacheKey) || 0) + 1;
  state.refreshRequestIds.set(scope.cacheKey, requestId);
  const response = await getRepositoryApi(routeRepository).request({
    url: '/desktopRoutes:listAccessible',
    params: {
      tree: true,
      sort: 'sort',
      portal: scope.uid,
    },
  });
  const routes = Array.isArray(response?.data?.data) ? response.data.data : [];
  if (state.refreshRequestIds.get(scope.cacheKey) === requestId) {
    routeRepository.setRoutes(routes, scope.cacheKey);
  }
  return routes;
}

export function installMultiPortalRouteRepositoryScope(routeRepository: unknown, portalUids: () => string[]) {
  if (!routeRepository || typeof routeRepository !== 'object') {
    return;
  }

  const repository = routeRepository as RouteRepositoryLike & {
    [MULTI_PORTAL_ROUTE_REPOSITORY_STATE]?: MultiPortalRouteRepositoryState;
  };
  if (repository[MULTI_PORTAL_ROUTE_REPOSITORY_STATE]) {
    repository[MULTI_PORTAL_ROUTE_REPOSITORY_STATE].portalUids = portalUids;
    return;
  }

  const state: MultiPortalRouteRepositoryState = {
    loadingPromises: new Map(),
    originalActivateLayout: repository.activateLayout.bind(repository),
    originalCreateRoute: repository.createRoute.bind(repository),
    originalEnsureAccessibleLoaded: repository.ensureAccessibleLoaded.bind(repository),
    originalRefreshAccessible: repository.refreshAccessible.bind(repository),
    portalUids,
    refreshRequestIds: new Map(),
    scopeStack: [],
  };
  repository[MULTI_PORTAL_ROUTE_REPOSITORY_STATE] = state;

  repository.activateLayout = (layout) => {
    const scope = getScopeForUid(normalizeUid(layout?.uid), state.portalUids);
    const token = Symbol('multi-portal-route-scope');
    const deactivate = state.originalActivateLayout({
      ...layout,
      uid: scope.cacheKey,
    });
    state.scopeStack.push({
      deactivate,
      scope,
      token,
    });

    return () => {
      const index = state.scopeStack.findIndex((item) => item.token === token);
      if (index >= 0) {
        state.scopeStack.splice(index, 1);
      }
      deactivate();
    };
  };

  repository.refreshAccessible = async () => {
    const scope = getCurrentScope(state);
    if (scope.kind !== 'portal') {
      return state.originalRefreshAccessible();
    }

    return refreshPortalAccessibleRoutes(repository, scope, state);
  };

  repository.ensureAccessibleLoaded = async () => {
    const scope = getCurrentScope(state);
    if (scope.kind !== 'portal') {
      return state.originalEnsureAccessibleLoaded();
    }

    if (repository.isAccessibleLoaded()) {
      return repository.listAccessible();
    }

    const existingLoadingPromise = state.loadingPromises.get(scope.cacheKey);
    if (existingLoadingPromise) {
      return existingLoadingPromise;
    }

    const loadingPromise = refreshPortalAccessibleRoutes(repository, scope, state).finally(() => {
      if (state.loadingPromises.get(scope.cacheKey) === loadingPromise) {
        state.loadingPromises.delete(scope.cacheKey);
      }
    });
    state.loadingPromises.set(scope.cacheKey, loadingPromise);

    return loadingPromise;
  };

  repository.createRoute = async (values, options = {}) => {
    const scope = getCurrentScope(state);
    if (scope.kind !== 'portal') {
      return state.originalCreateRoute(values, options);
    }

    const { refreshAfterMutation = true } = options;
    const response = await getRepositoryApi(repository).resource('desktopRoutes').create({
      values,
      portal: scope.uid,
    });
    if (refreshAfterMutation) {
      await repository.refreshAccessible();
    }
    return response;
  };
}
