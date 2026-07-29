/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type NocoBaseDesktopRoute = {
  children?: NocoBaseDesktopRoute[];
  enableTabs?: boolean;
  hidden?: boolean;
  hideInMenu?: boolean;
  icon?: string;
  id?: number;
  menuSchemaUid?: string;
  multiPortals?: unknown;
  options?: Record<string, unknown>;
  pageSchemaUid?: string;
  parentId?: number;
  schemaUid?: string;
  sort?: number;
  tabSchemaName?: string;
  title?: string;
  tooltip?: string;
  type?: string;
  uiLayouts?: unknown;
};

export type MultiPortalRouteScopeDescriptor = {
  cacheKey: string;
  portalUid: string;
};

type UiLayoutRouteScope = {
  cacheKey: string;
  portalUid?: undefined;
  uiLayoutUid: string;
};

type RouteScope = MultiPortalRouteScopeDescriptor | UiLayoutRouteScope;

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
  deleteRoute: (
    filterByTk: unknown,
    options?: {
      refreshAfterMutation?: boolean;
    },
  ) => Promise<unknown>;
  moveRoute: (options: {
    sourceId: string | number;
    targetId?: string | number;
    targetScope?: unknown;
    sortField?: string;
    sticky?: boolean;
    method?: 'insertBefore' | 'insertAfter' | 'prepend';
    refreshAfterMove?: boolean;
  }) => Promise<unknown>;
  refreshAccessible: () => Promise<NocoBaseDesktopRoute[]>;
  setRoutes: (routes: NocoBaseDesktopRoute[], layoutUid?: string) => void;
  updateRoute: (
    filterByTk: unknown,
    values: Partial<NocoBaseDesktopRoute>,
    options?: {
      refreshAfterMutation?: boolean;
    },
  ) => Promise<unknown>;
};

type RouteRepositoryApi = {
  request: (options: RouteRepositoryApiRequestOptions) => Promise<unknown>;
  resource: (name: string) => {
    create: (options: Record<string, unknown>) => Promise<unknown>;
    destroy: (options: Record<string, unknown>) => Promise<unknown>;
    move: (options: Record<string, unknown>) => Promise<unknown>;
    update: (options: Record<string, unknown>) => Promise<unknown>;
  };
};

type RouteRepositoryApiRequestOptions = Record<string, unknown> & {
  params?: unknown;
  url?: unknown;
};

type RouteRepositoryWithApi = RouteRepositoryLike & {
  getAPIClient: () => RouteRepositoryApi;
};

type MultiPortalRouteRepositoryState = {
  loadingPromises: Map<string, Promise<NocoBaseDesktopRoute[]>>;
  originalActivateLayout: RouteRepositoryLike['activateLayout'];
  originalApiRequest: RouteRepositoryApi['request'];
  originalCreateRoute: RouteRepositoryLike['createRoute'];
  originalDeleteRoute: RouteRepositoryLike['deleteRoute'];
  originalEnsureAccessibleLoaded: RouteRepositoryLike['ensureAccessibleLoaded'];
  originalMoveRoute: RouteRepositoryLike['moveRoute'];
  originalRefreshAccessible: RouteRepositoryLike['refreshAccessible'];
  originalUpdateRoute: RouteRepositoryLike['updateRoute'];
  layoutScopes: Map<string, UiLayoutRouteScope>;
  portalScopes: () => MultiPortalRouteScopeDescriptor[];
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

function normalizeUid(uid: unknown) {
  return typeof uid === 'string' && uid.trim() ? uid : 'admin-layout-model';
}

function normalizePortalScopes(portalScopes: () => MultiPortalRouteScopeDescriptor[]) {
  return new Map(
    portalScopes()
      .filter(
        (scope) =>
          typeof scope?.portalUid === 'string' &&
          !!scope.portalUid.trim() &&
          typeof scope.cacheKey === 'string' &&
          !!scope.cacheKey.trim(),
      )
      .map((scope) => [scope.portalUid, scope]),
  );
}

function getUiLayoutScope(
  uid: string,
  portalScopes: Map<string, MultiPortalRouteScopeDescriptor>,
  layoutScopes: Map<string, UiLayoutRouteScope>,
): UiLayoutRouteScope {
  const portalCacheKeys = new Set([...portalScopes.values()].map((scope) => scope.cacheKey));
  const otherLayoutCacheKeys = new Set(
    [...layoutScopes.entries()].filter(([layoutUid]) => layoutUid !== uid).map(([, scope]) => scope.cacheKey),
  );
  const existingScope = layoutScopes.get(uid);
  if (
    existingScope &&
    !portalCacheKeys.has(existingScope.cacheKey) &&
    !otherLayoutCacheKeys.has(existingScope.cacheKey)
  ) {
    return existingScope;
  }

  let cacheKey = uid;
  while (portalCacheKeys.has(cacheKey) || otherLayoutCacheKeys.has(cacheKey)) {
    cacheKey = `layout:${cacheKey}`;
  }
  const scope = {
    cacheKey,
    uiLayoutUid: uid,
  };
  layoutScopes.set(uid, scope);
  return scope;
}

function getScopeForUid(
  uid: string,
  portalScopes: () => MultiPortalRouteScopeDescriptor[],
  layoutScopes: Map<string, UiLayoutRouteScope>,
): RouteScope {
  const normalizedPortalScopes = normalizePortalScopes(portalScopes);
  const portalScope = normalizedPortalScopes.get(uid);
  if (portalScope) {
    return portalScope;
  }

  return getUiLayoutScope(uid, normalizedPortalScopes, layoutScopes);
}

function getCurrentScope(state: MultiPortalRouteRepositoryState): RouteScope {
  return (
    state.scopeStack[state.scopeStack.length - 1]?.scope || {
      cacheKey: 'admin-layout-model',
      uiLayoutUid: 'admin-layout-model',
    }
  );
}

function getRepositoryApi(routeRepository: RouteRepositoryLike) {
  return (routeRepository as RouteRepositoryWithApi).getAPIClient();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isMultiPortalRouteScope(scope: RouteScope): scope is MultiPortalRouteScopeDescriptor {
  return typeof scope.portalUid === 'string';
}

function isDesktopRoutesRequest(options: RouteRepositoryApiRequestOptions) {
  return typeof options.url === 'string' && options.url.replace(/^\/+/, '').startsWith('desktopRoutes:');
}

function withCurrentPortalIdentity(options: RouteRepositoryApiRequestOptions, state: MultiPortalRouteRepositoryState) {
  const scope = getCurrentScope(state);
  if (!scope.portalUid || !isDesktopRoutesRequest(options)) {
    return options;
  }

  const params = isRecord(options.params) ? { ...options.params } : {};
  delete params.layout;
  delete params.portal;

  return {
    ...options,
    params: {
      ...params,
      portal: scope.portalUid,
    },
  };
}

function withoutRouteOwnership(values: Partial<NocoBaseDesktopRoute>): Partial<NocoBaseDesktopRoute> {
  const { children, multiPortals: _multiPortals, uiLayouts: _uiLayouts, ...routeValues } = values;

  return {
    ...routeValues,
    ...(Array.isArray(children) ? { children: children.map((child) => withoutRouteOwnership(child)) } : {}),
  };
}

async function refreshPortalAccessibleRoutes(
  routeRepository: RouteRepositoryLike,
  scope: MultiPortalRouteScopeDescriptor,
  state: MultiPortalRouteRepositoryState,
) {
  const requestId = (state.refreshRequestIds.get(scope.cacheKey) || 0) + 1;
  state.refreshRequestIds.set(scope.cacheKey, requestId);
  const response = (await getRepositoryApi(routeRepository).request({
    url: '/desktopRoutes:listAccessible',
    params: {
      tree: true,
      sort: 'sort',
      portal: scope.portalUid,
    },
  })) as {
    data?: {
      data?: NocoBaseDesktopRoute[];
    };
  };
  const routes = Array.isArray(response?.data?.data) ? response.data.data : [];
  if (state.refreshRequestIds.get(scope.cacheKey) === requestId) {
    routeRepository.setRoutes(routes, scope.cacheKey);
  }
  return routes;
}

export function installMultiPortalRouteRepositoryScope(
  routeRepository: unknown,
  portalScopes: () => MultiPortalRouteScopeDescriptor[],
) {
  if (!routeRepository || typeof routeRepository !== 'object') {
    return;
  }

  const repository = routeRepository as RouteRepositoryLike & {
    [MULTI_PORTAL_ROUTE_REPOSITORY_STATE]?: MultiPortalRouteRepositoryState;
  };
  if (repository[MULTI_PORTAL_ROUTE_REPOSITORY_STATE]) {
    repository[MULTI_PORTAL_ROUTE_REPOSITORY_STATE].portalScopes = portalScopes;
    return;
  }

  const api = getRepositoryApi(repository);
  const state: MultiPortalRouteRepositoryState = {
    loadingPromises: new Map(),
    layoutScopes: new Map(),
    originalActivateLayout: repository.activateLayout.bind(repository),
    originalApiRequest: api.request.bind(api),
    originalCreateRoute: repository.createRoute.bind(repository),
    originalDeleteRoute: repository.deleteRoute.bind(repository),
    originalEnsureAccessibleLoaded: repository.ensureAccessibleLoaded.bind(repository),
    originalMoveRoute: repository.moveRoute.bind(repository),
    originalRefreshAccessible: repository.refreshAccessible.bind(repository),
    originalUpdateRoute: repository.updateRoute.bind(repository),
    portalScopes,
    refreshRequestIds: new Map(),
    scopeStack: [],
  };
  repository[MULTI_PORTAL_ROUTE_REPOSITORY_STATE] = state;
  api.request = (options) => state.originalApiRequest(withCurrentPortalIdentity(options, state));

  repository.activateLayout = (layout) => {
    const scope = getScopeForUid(normalizeUid(layout?.uid), state.portalScopes, state.layoutScopes);
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
    if (!isMultiPortalRouteScope(scope)) {
      return state.originalRefreshAccessible();
    }

    return refreshPortalAccessibleRoutes(repository, scope, state);
  };

  repository.ensureAccessibleLoaded = async () => {
    const scope = getCurrentScope(state);
    if (!isMultiPortalRouteScope(scope)) {
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
    if (!scope.portalUid) {
      return state.originalCreateRoute(values, options);
    }

    const { refreshAfterMutation = true } = options;
    const response = await getRepositoryApi(repository)
      .resource('desktopRoutes')
      .create({
        values: withoutRouteOwnership(values),
        portal: scope.portalUid,
      });
    if (refreshAfterMutation) {
      await repository.refreshAccessible();
    }
    return response;
  };

  repository.updateRoute = async (filterByTk, values, options = {}) => {
    const scope = getCurrentScope(state);
    if (!scope.portalUid) {
      return state.originalUpdateRoute(filterByTk, values, options);
    }

    const { refreshAfterMutation = true } = options;
    const scopedValues = withoutRouteOwnership(values);
    const response = await getRepositoryApi(repository)
      .resource('desktopRoutes')
      .update(
        Array.isArray(filterByTk)
          ? {
              filter: {
                id: {
                  $in: filterByTk,
                },
              },
              values: scopedValues,
              portal: scope.portalUid,
            }
          : {
              filterByTk,
              values: scopedValues,
              portal: scope.portalUid,
            },
      );
    if (refreshAfterMutation) {
      await repository.refreshAccessible();
    }
    return response;
  };

  repository.deleteRoute = async (filterByTk, options = {}) => {
    const scope = getCurrentScope(state);
    if (!scope.portalUid) {
      return state.originalDeleteRoute(filterByTk, options);
    }

    const { refreshAfterMutation = true } = options;
    const response = await getRepositoryApi(repository).resource('desktopRoutes').destroy({
      filterByTk,
      portal: scope.portalUid,
    });
    if (refreshAfterMutation) {
      await repository.refreshAccessible();
    }
    return response;
  };

  repository.moveRoute = async (options) => {
    const scope = getCurrentScope(state);
    if (!scope.portalUid) {
      return state.originalMoveRoute(options);
    }

    const { refreshAfterMove = true, ...moveOptions } = options;
    const response = await getRepositoryApi(repository)
      .resource('desktopRoutes')
      .move({
        ...moveOptions,
        portal: scope.portalUid,
      });
    if (refreshAfterMove) {
      await repository.refreshAccessible();
    }
    return response;
  };
}
