/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ClientAppPortalRecord = {
  enabled?: unknown;
  routePath?: unknown;
  frontend?: {
    type?: unknown;
  } | null;
};

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

type FetchClient = (
  input: string,
  init: {
    headers: Record<string, string>;
    signal: AbortSignal;
  },
) => Promise<FetchResponse>;

export type ClientAppDevProxyOptions = {
  apiBasePath: string;
  cacheTtlMs?: number;
  fetchClient?: FetchClient;
  gatewayTargetUrl: string;
  modernClientBasePath: string;
  modernClientTargetUrl: string;
  requestTimeoutMs?: number;
};

type ProxyRequest = {
  url?: string;
};

const DEFAULT_CACHE_TTL_MS = 1_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 1_000;

function splitPathSegments(value: string) {
  return value.split('/').filter(Boolean);
}

function pathFromSegments(segments: string[]) {
  return `/${segments.join('/')}`;
}

function parsePathname(value: string) {
  try {
    return decodeURIComponent(new URL(value, 'http://nocobase.local').pathname);
  } catch {
    return;
  }
}

function startsWithSegments(pathSegments: string[], prefixSegments: string[]) {
  return prefixSegments.every((segment, index) => pathSegments[index] === segment);
}

export function normalizeClientAppRouteRoot(routePath: string, modernClientBasePath: string) {
  const pathname = parsePathname(routePath);
  const modernClientPathname = parsePathname(modernClientBasePath);
  if (!pathname || !modernClientPathname) {
    return;
  }

  let routeSegments = splitPathSegments(pathname);
  const modernClientSegments = splitPathSegments(modernClientPathname);
  if (!routeSegments.length || !modernClientSegments.length) {
    return;
  }

  if (startsWithSegments(routeSegments, modernClientSegments)) {
    return pathFromSegments(routeSegments);
  }

  const modernClientPrefix = modernClientSegments[modernClientSegments.length - 1];
  const publicPathSegments = modernClientSegments.slice(0, -1);
  if (publicPathSegments.length && startsWithSegments(routeSegments, publicPathSegments)) {
    routeSegments = routeSegments.slice(publicPathSegments.length);
  }
  if (routeSegments[0] === modernClientPrefix) {
    routeSegments = routeSegments.slice(1);
  }

  return pathFromSegments([...modernClientSegments, ...routeSegments]);
}

function isPathAtOrBelow(pathname: string, routeRoot: string) {
  return pathname === routeRoot || pathname.startsWith(`${routeRoot}/`);
}

function readPortalRecords(payload: unknown): ClientAppPortalRecord[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) {
    return data as ClientAppPortalRecord[];
  }
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: ClientAppPortalRecord[] }).data;
  }
  return [];
}

function createPortalListUrl(gatewayTargetUrl: string, apiBasePath: string) {
  const url = new URL(gatewayTargetUrl);
  const targetPath = url.pathname.replace(/\/+$/u, '');
  const apiPath = `/${apiBasePath.replace(/^\/+|\/+$/gu, '')}`;
  url.pathname = `${targetPath}${apiPath}/multiPortals:listEnabled`.replace(/\/{2,}/gu, '/');
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function createClientAppDevProxyRouter(options: ClientAppDevProxyOptions) {
  const fetchClient = options.fetchClient || fetch;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const portalListUrl = createPortalListUrl(options.gatewayTargetUrl, options.apiBasePath);
  let cachedRouteRoots: string[] = [];
  let cacheExpiresAt = 0;
  let pendingRouteRoots: Promise<string[] | undefined> | undefined;

  const fetchRouteRoots = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetchClient(portalListUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        return [];
      }
      const records = readPortalRecords(await response.json());
      return records
        .filter((record) => record.enabled === true && record.frontend?.type === 'client-app')
        .map((record) =>
          typeof record.routePath === 'string'
            ? normalizeClientAppRouteRoot(record.routePath, options.modernClientBasePath)
            : undefined,
        )
        .filter((routeRoot): routeRoot is string => Boolean(routeRoot));
    } catch {
      return;
    } finally {
      clearTimeout(timeout);
    }
  };

  const getRouteRoots = async () => {
    if (Date.now() < cacheExpiresAt) {
      return cachedRouteRoots;
    }
    if (!pendingRouteRoots) {
      pendingRouteRoots = fetchRouteRoots();
    }
    try {
      const discoveredRouteRoots = await pendingRouteRoots;
      if (discoveredRouteRoots) {
        cachedRouteRoots = discoveredRouteRoots;
        cacheExpiresAt = Date.now() + cacheTtlMs;
      }
      return cachedRouteRoots;
    } finally {
      pendingRouteRoots = undefined;
    }
  };

  return async (request: ProxyRequest) => {
    const pathname = request.url ? parsePathname(request.url) : undefined;
    if (!pathname) {
      return options.modernClientTargetUrl;
    }
    const routeRoots = await getRouteRoots();
    return routeRoots.some((routeRoot) => isPathAtOrBelow(pathname, routeRoot))
      ? options.gatewayTargetUrl
      : options.modernClientTargetUrl;
  };
}
