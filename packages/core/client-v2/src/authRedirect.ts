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

function trimLeadingSlashes(value = '') {
  return value.replace(/^\/+/, '');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePublicPath(value?: string) {
  return ensureTrailingSlash(ensureLeadingSlash(String(value || '/').trim() || '/'));
}

function normalizePathname(value?: string) {
  const normalized = ensureLeadingSlash(String(value || '/').trim() || '/').replace(/\/{2,}/g, '/');
  if (normalized !== '/' && normalized.endsWith('/')) {
    return trimTrailingSlashes(normalized);
  }
  return normalized;
}

function normalizeSearch(value = '') {
  if (!value) {
    return '';
  }
  return value.startsWith('?') ? value : `?${value}`;
}

function normalizeHash(value = '') {
  if (!value) {
    return '';
  }
  return value.startsWith('#') ? value : `#${value}`;
}

function splitPathLike(value: string | LocationLike): LocationLike {
  if (typeof value !== 'string') {
    return {
      pathname: value?.pathname || '/',
      search: value?.search || '',
      hash: value?.hash || '',
    };
  }

  const hashIndex = value.indexOf('#');
  const searchIndex = value.indexOf('?');
  const hasSearch = searchIndex >= 0;
  const hasHash = hashIndex >= 0;
  const pathnameEnd = hasSearch ? searchIndex : hasHash ? hashIndex : value.length;
  const searchEnd = hasHash ? hashIndex : value.length;

  return {
    pathname: value.slice(0, pathnameEnd) || '/',
    search: hasSearch ? value.slice(searchIndex, searchEnd) : '',
    hash: hasHash ? value.slice(hashIndex) : '',
  };
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

function getV2BasePath(app: AppLike) {
  return trimTrailingSlashes(getV2PublicPath(app)) || '/';
}

type ModernClientWindow = {
  __nocobase_modern_client_prefix__?: string;
  __nocobase_public_path__?: string;
};

function getModernClientWindow(): ModernClientWindow | undefined {
  return typeof window !== 'undefined' ? (window as unknown as ModernClientWindow) : undefined;
}

/**
 * The runtime URL segment under which the modern (v2) client is served.
 * Injected by the server as `window.__nocobase_modern_client_prefix__`. Falls
 * back to the trailing segment of `window.__nocobase_public_path__`, then to
 * the default `v`. Returns a bare segment (no slashes).
 */
export function getModernClientPrefix(): string {
  const win = getModernClientWindow();
  const fromWindow = win?.__nocobase_modern_client_prefix__;
  if (typeof fromWindow === 'string' && fromWindow.trim()) {
    return trimLeadingSlashes(trimTrailingSlashes(fromWindow.trim()));
  }
  const publicPath = win?.__nocobase_public_path__;
  if (typeof publicPath === 'string' && publicPath.trim()) {
    const segments = trimTrailingSlashes(publicPath.trim()).split('/');
    const last = segments[segments.length - 1];
    if (last) {
      return last;
    }
  }
  return 'v';
}

/**
 * Strip the trailing modern-client prefix segment from a public path,
 * recovering the app root public path (e.g. `/nocobase/v/` -> `/nocobase/`).
 */
export function stripModernClientPrefix(publicPath?: string): string {
  const normalized = normalizePublicPath(publicPath);
  const prefix = getModernClientPrefix();
  const suffixPattern = new RegExp(`/${escapeRegExp(prefix)}/?$`);
  return normalizePublicPath(normalized.replace(suffixPattern, '/'));
}

export function getV2EffectiveBasePath(app: AppLike): string {
  const basename = app.router?.getBasename?.();
  if (basename) {
    return normalizePublicPath(basename);
  }
  return getV2PublicPath(app);
}

function joinRootRelativePath(basePath: string, pathname: string) {
  const normalizedBasePath = normalizePublicPath(basePath);
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedBasePath === '/') {
    return normalizedPathname;
  }

  if (normalizedPathname === '/') {
    return trimTrailingSlashes(normalizedBasePath) || '/';
  }

  return normalizePathname(`/${trimLeadingSlashes(normalizedBasePath)}/${trimLeadingSlashes(normalizedPathname)}`);
}

function getV2SigninPath(app: AppLike) {
  return joinRootRelativePath(getV2EffectiveBasePath(app), '/signin');
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
  return joinRootRelativePath(getV2EffectiveBasePath(app), '/admin');
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
  const search = normalizeSearch(locationLike?.search || '');
  const hash = normalizeHash(locationLike?.hash || '');
  return `${joinRootRelativePath(getV2EffectiveBasePath(app), pathname)}${search}${hash}`;
}

/**
 * 构造跳转到 v2 登录页的完整 href。
 *
 * @param app 当前 v2 应用实例
 * @param targetPath 登录后回跳地址
 * @returns 指向 v2 登录页的 href
 */
export function buildV2SigninHref(app: AppLike, targetPath: string) {
  return `${getV2SigninPath(app)}?redirect=${encodeURIComponent(targetPath)}`;
}

/**
 * 通过整页跳转进入 v2 登录页。
 *
 * @param app 当前 v2 应用实例
 * @param targetPath 登录后回跳地址
 * @param options 跳转选项
 */
export function redirectToV2Signin(app: AppLike, targetPath: string, options?: { replace?: boolean }) {
  const href = buildV2SigninHref(app, targetPath);
  if (options?.replace === false) {
    window.location.href = href;
    return;
  }
  window.location.replace(href);
}

/**
 * 解析并校验服务端返回的 v2 登录页地址。
 *
 * @param value 服务端返回的 redirect
 * @param app 当前 v2 应用实例
 * @returns 合法时返回完整同源 URL,否则返回 null
 */
export function resolveV2SigninRedirect(value: string | undefined | null, app: AppLike) {
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

  const validPathnames = new Set(['/signin', getV2SigninPath(app)]);
  if (!validPathnames.has(url.pathname)) {
    return null;
  }

  return url.toString();
}

export { getDefaultV2AdminRedirectPath };
