/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizeBasePath(value: string) {
  let normalized = value || '/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/{2,}/g, '/');
  return normalized === '/' ? normalized : normalized.replace(/\/+$/g, '');
}

export function isClientDevProxyPath(url: string, basePath: string) {
  const [pathname] = String(url || '/').split(/[?#]/, 1);
  const normalizedBasePath = normalizeBasePath(basePath);
  return pathname === normalizedBasePath || pathname.startsWith(`${normalizedBasePath}/`);
}

export function rewriteClientDevProxyRootPath(url: string, basePath: string) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const [pathname] = String(url || '/').split(/[?#]/, 1);
  if (pathname !== normalizedBasePath || normalizedBasePath === '/') {
    return url;
  }
  return `${normalizedBasePath}/${url.slice(pathname.length)}`;
}
