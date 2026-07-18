/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, Gateway, type GatewayRequestHandler, type IncomingRequest } from '@nocobase/server';
import type { ServerResponse } from 'http';
import { parse } from 'node:url';

import { normalizeAppPortalFrontend, type AppPortalItem, type StoredAppPortalItem } from './appPortals';

const MULTI_PORTAL_MANIFEST_NAMESPACE = 'multi-portal';
const DEFAULT_API_BASE_PATH = '/api';
const DEFAULT_MODERN_CLIENT_PREFIX = 'v';

type ClientAppPortalMatch = {
  portalUid: string;
  relativePath: string;
  portalRouteSegments: string[];
};

function normalizeAbsolutePath(value: string | undefined, fallback: string) {
  const normalized = String(value || fallback).trim() || fallback;
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function normalizeModernClientPrefix(value: string | undefined) {
  const normalized = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return normalized || DEFAULT_MODERN_CLIENT_PREFIX;
}

function isPathAtOrBelow(pathname: string, prefix: string) {
  const normalizedPrefix = normalizeAbsolutePath(prefix, '/');
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`);
}

function joinAbsolutePath(prefix: string, suffix: string) {
  const normalizedPrefix = normalizeAbsolutePath(prefix, '/');
  const normalizedSuffix = suffix.replace(/^\/+|\/+$/g, '');
  return `${normalizedPrefix === '/' ? '' : normalizedPrefix}/${normalizedSuffix}`;
}

function getModernClientRoot() {
  return joinAbsolutePath(
    normalizeAbsolutePath(process.env.APP_PUBLIC_PATH, '/'),
    normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX),
  );
}

function isInfrastructurePath(pathname: string) {
  const apiBasePath = normalizeAbsolutePath(process.env.API_BASE_PATH, DEFAULT_API_BASE_PATH);
  if (isPathAtOrBelow(pathname, apiBasePath)) {
    return true;
  }

  const wsPath = process.env.WS_PATH;
  if (wsPath && isPathAtOrBelow(pathname, wsPath)) {
    return true;
  }

  if (pathname === '/__health_check' || pathname.endsWith('/__health_check')) {
    return true;
  }

  const appPublicPath = normalizeAbsolutePath(process.env.APP_PUBLIC_PATH, '/');
  const reservedPaths = [
    joinAbsolutePath(appPublicPath, 'files'),
    joinAbsolutePath(appPublicPath, 'storage/uploads'),
    joinAbsolutePath(appPublicPath, 'dist'),
    joinAbsolutePath(appPublicPath, 'static'),
    joinAbsolutePath(getModernClientRoot(), 'assets'),
    joinAbsolutePath(getModernClientRoot(), 'static'),
    '/files',
    '/static',
  ];
  if (process.env.PLUGIN_STATICS_PATH) {
    reservedPaths.push(process.env.PLUGIN_STATICS_PATH);
  }

  return reservedPaths.some((reservedPath) => isPathAtOrBelow(pathname, reservedPath));
}

function isPotentialModernClientPath(pathname: string) {
  return isPathAtOrBelow(pathname, getModernClientRoot());
}

function splitPathSegments(pathname: string) {
  return pathname.split('/').filter(Boolean);
}

function hasUnsafeDecodedPath(pathname: string) {
  return pathname.includes('\\') || pathname.includes('\0') || splitPathSegments(pathname).includes('..');
}

function stripLeadingSegments(segments: string[], prefix: string[]) {
  if (prefix.some((segment, index) => segments[index] !== segment)) {
    return;
  }
  return segments.slice(prefix.length);
}

function getAppLocalRoute(pathname: string) {
  const publicPathSegments = splitPathSegments(normalizeAbsolutePath(process.env.APP_PUBLIC_PATH, '/'));
  const publicPathRelativeSegments = stripLeadingSegments(splitPathSegments(pathname), publicPathSegments);
  if (!publicPathRelativeSegments) {
    return;
  }

  const modernClientPrefix = normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);
  if (publicPathRelativeSegments[0] !== modernClientPrefix) {
    return;
  }
  const requestRootSegments = [...publicPathSegments, modernClientPrefix];

  const modernClientSegments = publicPathRelativeSegments.slice(1);
  if (modernClientSegments[0] === 'apps' && modernClientSegments[1]) {
    return {
      appName: modernClientSegments[1],
      routeSegments: modernClientSegments.slice(2),
      requestRootSegments: [...requestRootSegments, 'apps', modernClientSegments[1]],
      appNameFromPath: true,
    };
  }

  return {
    routeSegments: modernClientSegments,
    requestRootSegments,
    appNameFromPath: false,
  };
}

function normalizePortalRouteSegments(routePath: string, appName: string) {
  if (!routePath.startsWith('/')) {
    return;
  }

  const rawPathname = parse(routePath).pathname || '/';
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch (error) {
    return;
  }
  if (hasUnsafeDecodedPath(pathname)) {
    return;
  }

  let segments = splitPathSegments(pathname);
  const publicPathSegments = splitPathSegments(normalizeAbsolutePath(process.env.APP_PUBLIC_PATH, '/'));
  const publicPathRelativeSegments = stripLeadingSegments(segments, publicPathSegments);
  if (publicPathSegments.length > 0 && publicPathRelativeSegments) {
    segments = publicPathRelativeSegments;
  }

  const modernClientPrefix = normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);
  if (segments[0] === modernClientPrefix) {
    segments = segments.slice(1);
  }
  if (segments[0] === 'apps' && segments[1] === appName) {
    segments = segments.slice(2);
  }

  return segments.length > 0 ? segments : undefined;
}

function normalizeOpaqueId(value: unknown) {
  if (typeof value !== 'string') {
    return;
  }
  const normalized = value.trim();
  if (
    !normalized ||
    normalized === '..' ||
    normalized.includes('/') ||
    normalized.includes('\\') ||
    normalized.includes('\0')
  ) {
    return;
  }
  return normalized;
}

function startsWithSegments(pathSegments: string[], prefixSegments: string[]) {
  return prefixSegments.every((segment, index) => pathSegments[index] === segment);
}

function findClientAppPortalMatch(
  appName: string,
  routeSegments: string[],
  portals: StoredAppPortalItem[],
): ClientAppPortalMatch | undefined {
  let match:
    | (ClientAppPortalMatch & {
        routeLength: number;
        segmentCount: number;
      })
    | undefined;

  for (const portal of portals) {
    if (!portal || typeof portal.routePath !== 'string') {
      continue;
    }
    const frontend = normalizeAppPortalFrontend(portal as Pick<AppPortalItem, 'frontend' | 'layout'>);
    const portalUid = normalizeOpaqueId(portal.uid);
    const entryId = frontend?.type === 'client-app' ? normalizeOpaqueId(frontend.entryId) : undefined;
    if (!portalUid || !entryId) {
      continue;
    }

    const portalRouteSegments = normalizePortalRouteSegments(portal.routePath, appName);
    if (!portalRouteSegments || !startsWithSegments(routeSegments, portalRouteSegments)) {
      continue;
    }

    const routeLength = portalRouteSegments.join('/').length;
    if (
      match &&
      (match.segmentCount > portalRouteSegments.length ||
        (match.segmentCount === portalRouteSegments.length && match.routeLength >= routeLength))
    ) {
      continue;
    }

    match = {
      portalUid,
      relativePath: routeSegments.slice(portalRouteSegments.length).join('/'),
      portalRouteSegments,
      routeLength,
      segmentCount: portalRouteSegments.length,
    };
  }

  if (!match) {
    return;
  }
  return {
    portalUid: match.portalUid,
    relativePath: match.relativePath,
    portalRouteSegments: match.portalRouteSegments,
  };
}

function pathFromSegments(segments: string[]) {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function rejectUnsafePath(res: ServerResponse) {
  res.statusCode = 400;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Bad Request');
  return true;
}

export const clientAppGatewayRequestHandler: GatewayRequestHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  const originalRequestUrl = req.url;
  const parsedUrl = parse(originalRequestUrl);
  const rawPathname = parsedUrl.pathname || '/';
  if (isInfrastructurePath(rawPathname) || !isPotentialModernClientPath(rawPathname)) {
    return false;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPathname);
  } catch (error) {
    return rejectUnsafePath(res);
  }
  if (isInfrastructurePath(pathname)) {
    return false;
  }
  if (hasUnsafeDecodedPath(pathname)) {
    return rejectUnsafePath(res);
  }

  const appLocalRoute = getAppLocalRoute(pathname);
  if (!appLocalRoute || appLocalRoute.routeSegments.length === 0) {
    return false;
  }

  let appName = appLocalRoute.appName;
  if (!appName) {
    try {
      appName = await Gateway.getInstance().getRequestHandleAppName(req as IncomingRequest);
    } catch (error) {
      return false;
    }
  }

  let portals: StoredAppPortalItem[];
  try {
    portals = await AppSupervisor.getInstance().getAppManifestItems<StoredAppPortalItem>(
      appName,
      MULTI_PORTAL_MANIFEST_NAMESPACE,
    );
  } catch (error) {
    return false;
  }
  const match = findClientAppPortalMatch(appName, appLocalRoute.routeSegments, portals);
  if (!match) {
    return false;
  }

  const query = new URLSearchParams(parsedUrl.query || '');
  query.delete('clientAppPath');
  query.append('clientAppPath', match.relativePath);
  const apiBasePath = normalizeAbsolutePath(process.env.API_BASE_PATH, DEFAULT_API_BASE_PATH);
  const workspacePath = pathFromSegments([...appLocalRoute.requestRootSegments, ...match.portalRouteSegments]);
  const signinPath = pathFromSegments([...appLocalRoute.requestRootSegments, 'signin']);
  const apiBaseUrl = appLocalRoute.appNameFromPath
    ? joinAbsolutePath(apiBasePath, `__app/${encodeURIComponent(appName)}`)
    : apiBasePath;
  req.headers['x-nocobase-client-app-request-url'] = originalRequestUrl;
  req.headers['x-nocobase-client-app-workspace-root'] = workspacePath;
  req.headers['x-nocobase-client-app-public-path'] = normalizeAbsolutePath(process.env.APP_PUBLIC_PATH, '/');
  req.headers['x-nocobase-client-app-api-base-url'] = apiBaseUrl;
  req.headers['x-nocobase-client-app-signin-path'] = signinPath;
  req.url = `${apiBasePath}/multiPortals:serveClientApp/${encodeURIComponent(match.portalUid)}?${query.toString()}`;
  if (appLocalRoute.appNameFromPath) {
    req.headers['x-app'] = appName;
  }

  return false;
};

let clientAppGatewayRegistrationCount = 0;

export function registerClientAppGatewayRequestHandler() {
  clientAppGatewayRegistrationCount += 1;
  if (clientAppGatewayRegistrationCount === 1) {
    Gateway.registerRequestHandler(clientAppGatewayRequestHandler);
  }
}

export function unregisterClientAppGatewayRequestHandler() {
  if (clientAppGatewayRegistrationCount === 0) {
    return;
  }
  clientAppGatewayRegistrationCount -= 1;
  if (clientAppGatewayRegistrationCount === 0) {
    Gateway.unregisterRequestHandler(clientAppGatewayRequestHandler);
  }
}
