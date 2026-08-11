/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizePublicPath(value: string | undefined) {
  let normalized = value || '/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/{2,}/g, '/');
}

export function getPortalDevProxyBasePath(appPublicPath: string | undefined) {
  return `${normalizePublicPath(appPublicPath).replace(/\/$/, '')}/portals`;
}

export function isPortalDevProxyPath(url: string, appPublicPath: string | undefined) {
  const [pathname] = String(url || '/').split(/[?#]/, 1);
  const basePath = getPortalDevProxyBasePath(appPublicPath);
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function createPortalDevProxyOptions(appPublicPath: string | undefined, proxyTargetUrl: string) {
  return {
    context: (pathname: string) => isPortalDevProxyPath(pathname, appPublicPath),
    target: proxyTargetUrl,
    changeOrigin: true,
    ws: true,
    xfwd: true,
  };
}
