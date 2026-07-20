/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ClientAppPortalRecord = {
  appName?: unknown;
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
  headers?: Record<string, string | string[] | undefined>;
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
  if (!data || typeof data !== 'object') {
    return [];
  }
  const portals = (data as { portals?: unknown }).portals;
  return Array.isArray(portals) ? (portals as ClientAppPortalRecord[]) : [];
}

function getClientAppRouteRoot(record: ClientAppPortalRecord, modernClientBasePath: string) {
  if (typeof record.appName !== 'string' || typeof record.routePath !== 'string') {
    return;
  }
  const appName = record.appName.trim();
  const routeRoot = normalizeClientAppRouteRoot(record.routePath, modernClientBasePath);
  if (!appName || !routeRoot || appName === 'main') {
    return appName === 'main' ? routeRoot : undefined;
  }
  const modernClientPathname = parsePathname(modernClientBasePath);
  if (!modernClientPathname) {
    return;
  }
  const modernClientSegments = splitPathSegments(modernClientPathname);
  const routeSegments = splitPathSegments(routeRoot);
  return pathFromSegments([
    ...modernClientSegments,
    'apps',
    appName,
    ...routeSegments.slice(modernClientSegments.length),
  ]);
}

function createPortalListUrl(gatewayTargetUrl: string, apiBasePath: string) {
  const url = new URL(gatewayTargetUrl);
  const targetPath = url.pathname.replace(/\/+$/u, '');
  const apiPath = `/${apiBasePath.replace(/^\/+|\/+$/gu, '')}`;
  url.pathname = `${targetPath}${apiPath}/app:getPortals`.replace(/\/{2,}/gu, '/');
  url.search = '';
  url.hash = '';
  return url.toString();
}

function readRequestHeader(request: ProxyRequest, name: string) {
  const value = request.headers?.[name];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value;
}

function createPortalListHeaders(request: ProxyRequest) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  for (const name of ['authorization', 'cookie', 'x-app', 'x-authenticator', 'x-role', 'x-locale']) {
    const value = readRequestHeader(request, name);
    if (value) {
      headers[name] = value;
    }
  }
  return headers;
}

export function createClientAppDevProxyRouter(options: ClientAppDevProxyOptions) {
  const fetchClient = options.fetchClient || fetch;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const portalListUrl = createPortalListUrl(options.gatewayTargetUrl, options.apiBasePath);
  let cachedRouteRoots: string[] = [];
  let cacheExpiresAt = 0;
  let pendingRouteRoots: Promise<string[] | undefined> | undefined;

  const fetchRouteRoots = async (request: ProxyRequest) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetchClient(portalListUrl, {
        headers: createPortalListHeaders(request),
        signal: controller.signal,
      });
      if (!response.ok) {
        return;
      }
      const records = readPortalRecords(await response.json());
      return records
        .filter((record) => record.frontend?.type === 'client-app')
        .map((record) => getClientAppRouteRoot(record, options.modernClientBasePath))
        .filter((routeRoot): routeRoot is string => Boolean(routeRoot));
    } catch {
      return;
    } finally {
      clearTimeout(timeout);
    }
  };

  const getRouteRoots = async (request: ProxyRequest) => {
    if (Date.now() < cacheExpiresAt) {
      return cachedRouteRoots;
    }
    if (!pendingRouteRoots) {
      pendingRouteRoots = fetchRouteRoots(request);
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
    const routeRoots = await getRouteRoots(request);
    return routeRoots.some((routeRoot) => isPathAtOrBelow(pathname, routeRoot))
      ? options.gatewayTargetUrl
      : options.modernClientTargetUrl;
  };
}
