/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type PublicFormAppLike = {
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

export function getPublicFormRoutePath(app: PublicFormAppLike | undefined, pathname: string) {
  const basename = app?.router?.getBasename?.();

  if (basename) {
    return joinRoutePath(basename, pathname);
  }

  if (app?.getRouteUrl) {
    return normalizeRootPath(app.getRouteUrl(pathname));
  }

  return joinRoutePath(app?.getPublicPath?.(), pathname);
}
