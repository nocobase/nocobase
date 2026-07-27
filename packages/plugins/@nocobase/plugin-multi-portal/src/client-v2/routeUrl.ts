/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getV2EffectiveBasePath } from '@nocobase/client-v2';

export type MultiPortalAppLike = {
  router?: {
    basename?: string;
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
  getRouteUrl?: (pathname: string) => string;
};

export type MultiPortalDevelopmentMode = 'no-code' | 'ai';

const DEFAULT_DEVELOPMENT_MODE: MultiPortalDevelopmentMode = 'no-code';
const PORTAL_ROUTE_PREFIX_BY_DEVELOPMENT_MODE: Record<MultiPortalDevelopmentMode, string> = {
  'no-code': '/v',
  ai: '/x',
};
const PORTAL_ROUTE_PREFIXES = Object.values(PORTAL_ROUTE_PREFIX_BY_DEVELOPMENT_MODE);

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

function normalizeDevelopmentMode(value?: string | null): MultiPortalDevelopmentMode {
  return value === 'ai' ? 'ai' : DEFAULT_DEVELOPMENT_MODE;
}

function getPortalRoutePrefix(developmentMode?: string | null) {
  return PORTAL_ROUTE_PREFIX_BY_DEVELOPMENT_MODE[normalizeDevelopmentMode(developmentMode)];
}

function getDevelopmentModeBasePath(basePath: string | undefined, developmentMode?: string | null) {
  const base = normalizeBasePath(basePath);
  const portalRoutePrefix = getPortalRoutePrefix(developmentMode);
  if (!base) {
    return portalRoutePrefix;
  }
  if (PORTAL_ROUTE_PREFIXES.some((prefix) => base.endsWith(prefix))) {
    return base.replace(/\/(?:v|x)$/, portalRoutePrefix);
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

function getAlternativeDevelopmentMode(developmentMode?: string | null): MultiPortalDevelopmentMode {
  return normalizeDevelopmentMode(developmentMode) === 'ai' ? 'no-code' : 'ai';
}

function normalizePortalRoutePath(routePath: string, basePath: string | undefined, developmentMode?: string | null) {
  let path = normalizeRootPath(routePath);
  for (const base of [
    getDevelopmentModeBasePath(basePath, developmentMode),
    getDevelopmentModeBasePath(basePath, getAlternativeDevelopmentMode(developmentMode)),
    ...PORTAL_ROUTE_PREFIXES,
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
  developmentMode?: string | null,
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
      getDevelopmentModeBasePath(basePath, developmentMode),
      normalizePortalRoutePath(normalizedRoutePath, basePath, developmentMode),
    );
  }

  if (app?.getRouteUrl) {
    const routeUrl = app.getRouteUrl(normalizedRoutePath);
    const routeUrlBasePath = getBasePathFromRouteUrl(routeUrl, normalizedRoutePath);
    if (routeUrlBasePath !== undefined) {
      return joinRoutePath(
        getDevelopmentModeBasePath(routeUrlBasePath, developmentMode),
        normalizePortalRoutePath(normalizedRoutePath, routeUrlBasePath, developmentMode),
      );
    }
    return normalizeRootPath(routeUrl);
  }

  const publicPath = app?.getPublicPath?.();
  return joinRoutePath(
    getDevelopmentModeBasePath(publicPath, developmentMode),
    normalizePortalRoutePath(normalizedRoutePath, publicPath, developmentMode),
  );
}
