/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getV2EffectiveBasePath } from '@nocobase/client-v2';

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

function getRootRouteUrl(app: AppPortalActionAppLike | undefined, routePath: string) {
  const normalizedRoutePath = routePath.trim();
  if (isAbsoluteUrl(normalizedRoutePath)) {
    return normalizedRoutePath;
  }
  return joinRoutePath(getCrossAppBasePath(app), normalizedRoutePath);
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

export function getPortalEntryUrl(
  app: AppPortalActionAppLike | undefined,
  portal: AppPortalItem,
  portalApp?: AppPortalAppItem,
) {
  if (portal.appName === 'main') {
    return getRootRouteUrl(app, portal.routePath);
  }

  const routePath = normalizeRootPath(portal.routePath);
  const ssoEnabled = portalApp?.ssoEnabled === true;
  const isCurrentApp = portal.appName === (app?.name || 'main');
  if (portalApp?.cname) {
    const cnameUrl = normalizeCname(portalApp.cname);
    if (ssoEnabled) {
      return `${cnameUrl.replace(/\/+$/, '')}/app-sso?redirect=${encodeURIComponent(routePath)}`;
    }
    return joinUrl(cnameUrl, routePath);
  }

  if (isCurrentApp && !ssoEnabled) {
    return getMultiPortalRouteUrl(app, portal.routePath, portal.developmentMode);
  }

  const path = ssoEnabled
    ? `/apps/${portal.appName}/app-sso?redirect=${encodeURIComponent(routePath)}`
    : `/apps/${portal.appName}${routePath}`;
  return getCrossAppRouteUrl(app, path);
}
