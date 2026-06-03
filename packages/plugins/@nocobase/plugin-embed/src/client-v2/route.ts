/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type EmbedAppLike = {
  router?: {
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
  getRouteUrl?: (pathname: string) => string;
};

const normalizeRootPath = (pathname?: string) => {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return `/${pathname.replace(/^\/+/, '')}`;
};

const normalizeBasePath = (pathname?: string) => {
  const normalized = normalizeRootPath(pathname).replace(/\/+$/, '');
  return normalized === '' || normalized === '/' ? '' : normalized;
};

const joinRoutePath = (basePath: string | undefined, pathname: string) => {
  const base = normalizeBasePath(basePath);
  const path = normalizeRootPath(pathname);
  return base ? `${base}${path}` : path;
};

const removeBasePath = (pathname: string, basePath?: string) => {
  const base = normalizeBasePath(basePath);
  const normalizedPathname = normalizeRootPath(pathname);

  if (!base) {
    return normalizedPathname;
  }

  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedBase}(\\/|$)`);
  return normalizedPathname.replace(regex, '/') || '/';
};

function getRouterBasename(app?: EmbedAppLike) {
  return app?.router?.getBasename?.();
}

export function getEmbedRoutePath(app: EmbedAppLike | undefined, pathname: string) {
  const basename = getRouterBasename(app);

  if (basename) {
    return joinRoutePath(basename, pathname);
  }

  if (app?.getRouteUrl) {
    return normalizeRootPath(app.getRouteUrl(pathname));
  }

  return joinRoutePath(app?.getPublicPath?.(), pathname);
}

export function isEmbedRoutePathname(app: EmbedAppLike | undefined, pathname: string) {
  const basename = getRouterBasename(app);
  const publicPath = app?.getPublicPath?.();
  const relativePathname = basename || publicPath ? removeBasePath(pathname, basename || publicPath) : pathname;
  const embedPathname = normalizeRootPath(relativePathname).replace(/\/+$/, '');

  if (embedPathname === '/embed') {
    return true;
  }

  return embedPathname.startsWith('/embed/');
}
