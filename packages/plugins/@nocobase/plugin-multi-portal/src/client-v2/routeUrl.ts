/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getModernClientPrefix, getV2EffectiveBasePath } from '@nocobase/client-v2';

export type MultiPortalAppLike = {
  router?: {
    basename?: string;
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
  getRouteUrl?: (pathname: string) => string;
};

export type MultiPortalType = 'no-code' | 'ai';

const DEFAULT_PORTAL_TYPE: MultiPortalType = 'no-code';
const AI_PORTAL_ROUTE_PREFIX = '/x';
const DEFAULT_MODERN_PORTAL_ROUTE_PREFIX = '/v';

const normalizeRootPath = (pathname?: string) => {
  const trimmed = pathname?.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return `/${trimmed.replace(/^\/+/, '')}`;
};

const normalizeBasePath = (pathname?: string) => {
  const normalized = normalizeRootPath(pathname).replace(/\/+$/, '');
  return normalized === '' || normalized === '/' ? '' : normalized;
};

const joinRoutePath = (basePath: string | undefined, pathname: string) => {
  const base = normalizeBasePath(basePath);
  const path = normalizeRootPath(pathname);
  if (!base) {
    return path;
  }
  if (path === base || path.startsWith(`${base}/`)) {
    return path;
  }
  return `${base}${path}`;
};

function normalizePortalType(value?: string | null): MultiPortalType {
  return value === 'ai' ? 'ai' : DEFAULT_PORTAL_TYPE;
}

function getPortalRoutePrefix(portalType?: string | null) {
  return normalizePortalType(portalType) === 'ai' ? AI_PORTAL_ROUTE_PREFIX : `/${getModernClientPrefix()}`;
}

function getPortalRoutePrefixes() {
  return Array.from(
    new Set([getPortalRoutePrefix(DEFAULT_PORTAL_TYPE), AI_PORTAL_ROUTE_PREFIX, DEFAULT_MODERN_PORTAL_ROUTE_PREFIX]),
  );
}

function getPortalTypeBasePath(basePath: string | undefined, portalType?: string | null) {
  const base = normalizeBasePath(basePath);
  const portalRoutePrefix = getPortalRoutePrefix(portalType);
  if (!base) {
    return portalRoutePrefix;
  }

  const appScopeMatch = base.match(/^(.*)\/(apps|_app)\/([^/]+)$/);
  if (appScopeMatch) {
    let publicPath = appScopeMatch[1] || '';
    for (const prefix of getPortalRoutePrefixes()) {
      if (publicPath === prefix) {
        publicPath = '';
        break;
      }
      if (publicPath.endsWith(prefix)) {
        publicPath = publicPath.slice(0, -prefix.length);
        break;
      }
    }
    const appScope = normalizePortalType(portalType) === 'ai' ? 'apps' : appScopeMatch[2];
    return `${publicPath}${portalRoutePrefix}/${appScope}/${appScopeMatch[3]}`;
  }

  for (const prefix of getPortalRoutePrefixes()) {
    if (base === prefix) {
      return portalRoutePrefix;
    }
    if (base.endsWith(prefix)) {
      return `${base.slice(0, -prefix.length)}${portalRoutePrefix}`;
    }
  }
  return `${base}${portalRoutePrefix}`;
}

function stripBasePath(pathname: string, basePath: string | undefined) {
  const base = normalizeBasePath(basePath);
  const path = normalizeRootPath(pathname);
  if (!base) {
    return path;
  }
  if (path === base) {
    return '/';
  }
  if (path.startsWith(`${base}/`)) {
    return path.slice(base.length) || '/';
  }
  return path;
}

function getAlternativePortalType(portalType?: string | null): MultiPortalType {
  return normalizePortalType(portalType) === 'ai' ? 'no-code' : 'ai';
}

function normalizePortalRoutePath(routePath: string, basePath: string | undefined, portalType?: string | null) {
  let path = normalizeRootPath(routePath);
  for (const base of [
    getPortalTypeBasePath(basePath, portalType),
    getPortalTypeBasePath(basePath, getAlternativePortalType(portalType)),
    ...getPortalRoutePrefixes(),
  ]) {
    path = stripBasePath(path, base);
  }
  return path;
}

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

function hasPublicPath(app?: MultiPortalAppLike): app is MultiPortalAppLike & { getPublicPath: () => string } {
  return typeof app?.getPublicPath === 'function';
}

function getBasePathFromRouteUrl(routeUrl: string, routePath: string) {
  const normalizedRouteUrl = normalizeRootPath(routeUrl);
  const normalizedRoutePath = normalizeRootPath(routePath);
  if (normalizedRouteUrl === normalizedRoutePath) {
    return '';
  }
  if (normalizedRouteUrl.endsWith(normalizedRoutePath)) {
    return normalizeBasePath(normalizedRouteUrl.slice(0, -normalizedRoutePath.length));
  }
  return undefined;
}

export function getMultiPortalRouteUrl(
  app: MultiPortalAppLike | undefined,
  routePath: string,
  portalType?: string | null,
) {
  const normalizedRoutePath = routePath.trim();
  if (isAbsoluteUrl(normalizedRoutePath)) {
    return normalizedRoutePath;
  }

  const basename = app?.router?.getBasename?.() || app?.router?.basename;
  if (basename) {
    const basePath = hasPublicPath(app)
      ? getV2EffectiveBasePath({
          getPublicPath: app.getPublicPath,
          router: {
            getBasename: () => app.router?.getBasename?.() || app.router?.basename,
          },
        })
      : basename;
    return joinRoutePath(
      getPortalTypeBasePath(basePath, portalType),
      normalizePortalRoutePath(normalizedRoutePath, basePath, portalType),
    );
  }

  if (app?.getRouteUrl) {
    const routeUrl = app.getRouteUrl(normalizedRoutePath);
    const routeUrlBasePath = getBasePathFromRouteUrl(routeUrl, normalizedRoutePath);
    if (routeUrlBasePath !== undefined) {
      return joinRoutePath(
        getPortalTypeBasePath(routeUrlBasePath, portalType),
        normalizePortalRoutePath(normalizedRoutePath, routeUrlBasePath, portalType),
      );
    }
    return normalizeRootPath(routeUrl);
  }

  const publicPath = app?.getPublicPath?.();
  return joinRoutePath(
    getPortalTypeBasePath(publicPath, portalType),
    normalizePortalRoutePath(normalizedRoutePath, publicPath, portalType),
  );
}
