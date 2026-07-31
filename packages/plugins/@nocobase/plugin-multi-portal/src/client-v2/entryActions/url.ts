/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getModernClientPrefix, getV2EffectiveBasePath } from '@nocobase/client-v2';

import { getMultiPortalRouteUrl } from '../routeUrl';
import type { AppPortalActionAppLike, AppPortalAppItem, AppPortalItem } from './types';

function normalizeRootPath(pathname?: string) {
  const trimmed = pathname?.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return `/${trimmed.replace(/^\/+/, '')}`;
}

function normalizeBasePath(pathname?: string) {
  const normalized = normalizeRootPath(pathname).replace(/\/+$/, '');
  return normalized === '' || normalized === '/' ? '' : normalized;
}

function joinRoutePath(basePath: string | undefined, pathname: string) {
  const base = normalizeBasePath(basePath);
  const path = normalizeRootPath(pathname);
  if (!base) {
    return path;
  }
  if (path === base || path.startsWith(`${base}/`)) {
    return path;
  }
  return `${base}${path}`;
}

function stripCurrentAppSegment(pathname: string) {
  return pathname.replace(/\/(?:apps|_app)\/[^/]+$/, '') || '';
}

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

function isPortalRoutePrefixSlug(routePath: string) {
  const normalizedRoutePath = normalizeRootPath(routePath);
  return [getModernClientPrefix(), 'v', 'x'].some(
    (routePrefix) => normalizedRoutePath === normalizeRootPath(routePrefix),
  );
}

function getRoutePathSuffix(routePath: string, basePath: string) {
  const normalizedRoutePath = normalizeRootPath(routePath);
  const normalizedBasePath = normalizeBasePath(basePath);
  if (!normalizedBasePath) {
    return undefined;
  }
  if (normalizedRoutePath === normalizedBasePath) {
    return '/';
  }
  if (normalizedRoutePath.startsWith(`${normalizedBasePath}/`)) {
    return normalizedRoutePath.slice(normalizedBasePath.length) || '/';
  }
  return undefined;
}

function getEntryPortalRouteUrl(
  app: AppPortalActionAppLike | undefined,
  routePath: string,
  portalType?: string | null,
) {
  const normalizedRoutePath = routePath.trim();
  if (isAbsoluteUrl(normalizedRoutePath)) {
    return normalizedRoutePath;
  }
  const portalBasePath = getMultiPortalRouteUrl(app, '/', portalType);
  if (isPortalRoutePrefixSlug(normalizedRoutePath)) {
    return joinUrl(portalBasePath, normalizedRoutePath);
  }

  const normalizedRootRoutePath = normalizeRootPath(normalizedRoutePath);
  if (getRoutePathSuffix(normalizedRootRoutePath, portalBasePath) !== undefined) {
    return normalizedRootRoutePath;
  }

  const alternativePortalType = portalType === 'ai' ? 'no-code' : 'ai';
  const alternativeBasePath = getMultiPortalRouteUrl(app, '/', alternativePortalType);
  const alternativeRoutePathSuffix = getRoutePathSuffix(normalizedRootRoutePath, alternativeBasePath);
  if (alternativeRoutePathSuffix !== undefined) {
    return joinUrl(portalBasePath, alternativeRoutePathSuffix);
  }

  return getMultiPortalRouteUrl(app, normalizedRootRoutePath, portalType);
}

function hasPublicPath(app?: AppPortalActionAppLike): app is AppPortalActionAppLike & { getPublicPath: () => string } {
  return typeof app?.getPublicPath === 'function';
}

function getRuntimeBasePath(app?: AppPortalActionAppLike) {
  if (hasPublicPath(app)) {
    return normalizeBasePath(
      getV2EffectiveBasePath({
        getPublicPath: app.getPublicPath,
        router: {
          getBasename: () => app.router?.getBasename?.() || app.router?.basename,
        },
      }),
    );
  }

  const basename = app?.router?.getBasename?.() || app?.router?.basename;
  return normalizeBasePath(basename || app?.getPublicPath?.());
}

function getCrossAppBasePath(app?: AppPortalActionAppLike) {
  return normalizeBasePath(stripCurrentAppSegment(getRuntimeBasePath(app)));
}

function getRootRouteUrl(app: AppPortalActionAppLike | undefined, routePath: string, portalType?: string | null) {
  const normalizedRoutePath = routePath.trim();
  if (isAbsoluteUrl(normalizedRoutePath)) {
    return normalizedRoutePath;
  }
  const rootBasePath = getCrossAppBasePath(app);
  return getEntryPortalRouteUrl({ router: { basename: rootBasePath } }, normalizedRoutePath, portalType);
}

function normalizeCname(cname: string) {
  return /^https?:\/\//i.test(cname) || cname.startsWith('//') ? cname : `//${cname}`;
}

function joinUrl(base: string, pathname: string) {
  return `${base.replace(/\/+$/, '')}${normalizeRootPath(pathname)}`;
}

function getCrossAppRouteUrl(app: AppPortalActionAppLike | undefined, pathname: string) {
  if (app?.getRouteUrl) {
    return app.getRouteUrl(pathname);
  }
  return joinRoutePath(getCrossAppBasePath(app), pathname);
}

function getDirectCrossAppPortalUrl(app: AppPortalActionAppLike | undefined, portal: AppPortalItem) {
  const targetBasePath = joinRoutePath(getCrossAppBasePath(app), `/apps/${portal.appName}`);
  return getEntryPortalRouteUrl({ router: { basename: targetBasePath } }, portal.routePath, portal.portalType);
}

export function getPortalEntryUrl(
  app: AppPortalActionAppLike | undefined,
  portal: AppPortalItem,
  portalApp?: AppPortalAppItem,
) {
  if (portal.appName === 'main') {
    return getRootRouteUrl(app, portal.routePath, portal.portalType);
  }

  const routePath = normalizeRootPath(portal.routePath);
  const ssoEnabled = portalApp?.ssoEnabled === true;
  const isCurrentApp = portal.appName === (app?.name || 'main');
  if (portalApp?.cname) {
    const normalizedRoutePath = portal.routePath.trim();
    if (isAbsoluteUrl(normalizedRoutePath)) {
      return normalizedRoutePath;
    }
    const cnameUrl = normalizeCname(portalApp.cname);
    let cnameRoutePath = routePath;
    if (portal.portalType === 'ai') {
      cnameRoutePath = getDirectCrossAppPortalUrl(app, portal);
    } else if (isPortalRoutePrefixSlug(routePath)) {
      cnameRoutePath = getEntryPortalRouteUrl(undefined, routePath, portal.portalType);
    }
    if (ssoEnabled) {
      return `${cnameUrl.replace(/\/+$/, '')}/app-sso?redirect=${encodeURIComponent(cnameRoutePath)}`;
    }
    return joinUrl(cnameUrl, cnameRoutePath);
  }

  if (isCurrentApp && !ssoEnabled) {
    return getEntryPortalRouteUrl(app, portal.routePath, portal.portalType);
  }

  if (!ssoEnabled) {
    return getDirectCrossAppPortalUrl(app, portal);
  }

  const path = `/apps/${portal.appName}/app-sso?redirect=${encodeURIComponent(routePath)}`;
  return getCrossAppRouteUrl(app, path);
}
