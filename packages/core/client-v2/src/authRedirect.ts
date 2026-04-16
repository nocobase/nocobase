/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from './BaseApplication';

type AppLike = Pick<BaseApplication<any>, 'getPublicPath'> & {
  router?: {
    getBasename?: () => string | undefined;
  };
};

type LocationLike = {
  pathname: string;
  search?: string;
  hash?: string;
};

const V2_PUBLIC_PATH_SUFFIX = '/v2/';

function ensureLeadingSlash(value = '') {
  if (!value) {
    return '/';
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function ensureTrailingSlash(value = '') {
  if (!value) {
    return '/';
  }
  return value.endsWith('/') ? value : `${value}/`;
}

function trimTrailingSlashes(value = '') {
  return value.replace(/\/+$/g, '');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePublicPath(value?: string) {
  return ensureTrailingSlash(ensureLeadingSlash(String(value || '/').trim() || '/'));
}

function normalizePathname(value?: string) {
  return ensureLeadingSlash(String(value || '/').trim() || '/');
}

function removeBasename(pathname: string, basename?: string) {
  if (!basename || basename === '/') {
    return pathname;
  }
  const escapedBasename = escapeRegExp(basename);
  const regex = new RegExp(`^${escapedBasename.replace(/\/?$/, '')}(\\/|$)`);
  return pathname.replace(regex, '/') || pathname;
}

function getV2PublicPath(app: AppLike) {
  return normalizePublicPath(app.getPublicPath());
}

function getRootPublicPath(app: AppLike) {
  const publicPath = getV2PublicPath(app);
  if (!publicPath.endsWith(V2_PUBLIC_PATH_SUFFIX)) {
    return normalizePublicPath(publicPath.replace(/\/v2\/?$/, '/') || '/');
  }
  return normalizePublicPath(publicPath.slice(0, -V2_PUBLIC_PATH_SUFFIX.length) || '/');
}

function getV2BasePath(app: AppLike) {
  return trimTrailingSlashes(getV2PublicPath(app)) || '/';
}

function getLegacySigninPath(app: AppLike) {
  const rootPublicPath = trimTrailingSlashes(getRootPublicPath(app));
  return `${rootPublicPath}/signin`;
}

function stripCurrentV2Basename(app: AppLike, pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  const candidates = [app.router?.getBasename?.(), getV2BasePath(app)];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const strippedPathname = normalizePathname(removeBasename(normalizedPathname, candidate));
    if (strippedPathname !== normalizedPathname) {
      return strippedPathname;
    }
  }

  return normalizedPathname;
}

function getDefaultV2AdminRedirectPath(app: AppLike) {
  return `${getV2BasePath(app)}/admin`;
}

/**
 * 将当前 v2 页面地址转换为根相对 redirect 路径。
 *
 * @param app 当前 v2 应用实例
 * @param locationLike 当前路由地址
 * @returns 根相对的 v2 redirect
 */
export function getCurrentV2RedirectPath(app: AppLike, locationLike: LocationLike) {
  const pathname = stripCurrentV2Basename(app, locationLike?.pathname || '/');
  const search = locationLike?.search || '';
  const hash = locationLike?.hash || '';
  return `${getV2BasePath(app)}${pathname === '/' ? '' : pathname}${search}${hash}`;
}

/**
 * 构造跳转到 v1 登录页的完整 href。
 *
 * @param app 当前 v2 应用实例
 * @param targetPath 登录后回跳地址
 * @returns 指向 v1 登录页的 href
 */
export function buildLegacySigninHref(app: AppLike, targetPath: string) {
  return `${getLegacySigninPath(app)}?redirect=${encodeURIComponent(targetPath)}`;
}

/**
 * 通过整页跳转进入 v1 登录页。
 *
 * @param app 当前 v2 应用实例
 * @param targetPath 登录后回跳地址
 * @param options 跳转选项
 */
export function redirectToLegacySignin(app: AppLike, targetPath: string, options?: { replace?: boolean }) {
  const href = buildLegacySigninHref(app, targetPath);
  if (options?.replace === false) {
    window.location.href = href;
    return;
  }
  window.location.replace(href);
}

/**
 * 解析并校验服务端返回的 v1 登录页地址。
 *
 * @param value 服务端返回的 redirect
 * @param app 当前 v2 应用实例
 * @returns 合法时返回完整同源 URL，否则返回 null
 */
export function resolveLegacySigninRedirect(value: string | undefined | null, app: AppLike) {
  if (!value) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value, window.location.origin);
  } catch (_error) {
    return null;
  }

  if (url.origin !== window.location.origin) {
    return null;
  }

  const validPathnames = new Set(['/signin', getLegacySigninPath(app)]);
  if (!validPathnames.has(url.pathname)) {
    return null;
  }

  return url.toString();
}

export { getDefaultV2AdminRedirectPath };
