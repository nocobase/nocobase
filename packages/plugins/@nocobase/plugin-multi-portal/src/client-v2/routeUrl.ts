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
const SETTINGS_ROUTE_PREFIX = '/settings';

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

function joinPortalRoutePath(basePath: string | undefined, pathname: string) {
  const path = normalizeRootPath(pathname);
  // A prefix-shaped routePath is a portal slug, so it must remain as a child segment instead of being deduplicated.
  if (getPortalRoutePrefixes().includes(path)) {
    return `${normalizeBasePath(basePath)}${path}`;
  }
  return joinRoutePath(basePath, path);
}

function getPortalTypeBasePath(basePath: string | undefined, portalType?: string | null, useTrailingAppScope = true) {
  const base = normalizeBasePath(basePath);
  const portalRoutePrefix = getPortalRoutePrefix(portalType);
  if (!base) {
    return portalRoutePrefix;
  }

  const appScopeMatch = useTrailingAppScope ? base.match(/^(.*)\/(apps|_app)\/([^/]+)$/) : null;
  if (appScopeMatch) {
    let publicPath = appScopeMatch[1] || '';
    for (const prefix of [...getPortalRoutePrefixes(), SETTINGS_ROUTE_PREFIX]) {
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

function normalizePortalRoutePath(
  routePath: string,
  basePath: string | undefined,
  portalType?: string | null,
  useTrailingAppScope = true,
) {
  let path = normalizeRootPath(routePath);
  const portalRoutePrefixes = getPortalRoutePrefixes();
  const portalTypeBasePaths = [
    getPortalTypeBasePath(basePath, portalType, useTrailingAppScope),
    getPortalTypeBasePath(basePath, getAlternativePortalType(portalType), useTrailingAppScope),
  ];
  // A resolved root URL can come from either client prefix; preserve its prefix-shaped slug while switching types.
  for (const portalTypeBasePath of portalTypeBasePaths) {
    const pathWithoutPortalTypeBase = stripBasePath(path, portalTypeBasePath);
    if (pathWithoutPortalTypeBase !== path && portalRoutePrefixes.includes(pathWithoutPortalTypeBase)) {
      return pathWithoutPortalTypeBase;
    }
  }
  // routePath stores the portal slug. Preserve prefix-shaped slugs so they remain the second URL segment.
  if (portalRoutePrefixes.includes(path)) {
    return path;
  }
  for (const base of [...portalTypeBasePaths, ...portalRoutePrefixes]) {
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

function shouldUseTrailingAppScope(app: MultiPortalAppLike | undefined, basePath: string | undefined) {
  const publicPath = app?.getPublicPath?.();
  const appName = app && 'name' in app && typeof app.name === 'string' ? app.name : undefined;
  return !(appName === 'main' && publicPath && normalizeBasePath(publicPath) === normalizeBasePath(basePath));
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
    const useTrailingAppScope = shouldUseTrailingAppScope(app, basePath);
    return joinPortalRoutePath(
      getPortalTypeBasePath(basePath, portalType, useTrailingAppScope),
      normalizePortalRoutePath(normalizedRoutePath, basePath, portalType, useTrailingAppScope),
    );
  }

  if (app?.getRouteUrl) {
    const routeUrl = app.getRouteUrl(normalizedRoutePath);
    const routeUrlBasePath = getBasePathFromRouteUrl(routeUrl, normalizedRoutePath);
    if (routeUrlBasePath !== undefined) {
      const useTrailingAppScope = shouldUseTrailingAppScope(app, routeUrlBasePath);
      return joinPortalRoutePath(
        getPortalTypeBasePath(routeUrlBasePath, portalType, useTrailingAppScope),
        normalizePortalRoutePath(normalizedRoutePath, routeUrlBasePath, portalType, useTrailingAppScope),
      );
    }
    return normalizeRootPath(routeUrl);
  }

  const publicPath = app?.getPublicPath?.();
  const useTrailingAppScope = shouldUseTrailingAppScope(app, publicPath);
  return joinPortalRoutePath(
    getPortalTypeBasePath(publicPath, portalType, useTrailingAppScope),
    normalizePortalRoutePath(normalizedRoutePath, publicPath, portalType, useTrailingAppScope),
  );
}

function getSettingsBasePath(basePath?: string) {
  const base = normalizeBasePath(basePath);
  const modernPrefixes = Array.from(
    new Set([getPortalRoutePrefix(DEFAULT_PORTAL_TYPE), DEFAULT_MODERN_PORTAL_ROUTE_PREFIX]),
  );

  for (const prefix of modernPrefixes) {
    if (base === prefix) {
      return SETTINGS_ROUTE_PREFIX;
    }

    const scopedMatch = base.match(new RegExp(`^(.*)${prefix}/(apps|_app)/([^/]+)$`));
    if (scopedMatch) {
      return `${scopedMatch[1]}${SETTINGS_ROUTE_PREFIX}/${scopedMatch[2]}/${scopedMatch[3]}`;
    }

    if (base.endsWith(prefix)) {
      return `${base.slice(0, -prefix.length)}${SETTINGS_ROUTE_PREFIX}`;
    }
  }

  return joinRoutePath(base, SETTINGS_ROUTE_PREFIX);
}

export function getMultiPortalSettingsUrl(app?: MultiPortalAppLike) {
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
    return getSettingsBasePath(basePath);
  }

  return getSettingsBasePath(app?.getPublicPath?.());
}
