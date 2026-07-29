/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizePublicPath(value: string) {
  let normalized = value || '/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/{2,}/g, '/');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createSettingsPathPattern(appPublicPath: string) {
  const publicPath = normalizePublicPath(appPublicPath);
  return new RegExp(`^${escapeRegExp(publicPath)}settings(?:/|$)`);
}

export function isSettingsDevPath(url: string, appPublicPath: string) {
  const [pathname] = String(url || '/').split(/[?#]/, 1);
  return createSettingsPathPattern(appPublicPath).test(pathname);
}

export function rewriteSettingsDevProxyPath(url: string, appPublicPath: string) {
  const publicPath = normalizePublicPath(appPublicPath);
  const settingsRoot = `${publicPath}settings`;
  const settingsRootWithoutTrailingSlash = new RegExp(`^${escapeRegExp(settingsRoot)}(?=[?#]|$)`);

  return url.replace(settingsRootWithoutTrailingSlash, `${settingsRoot}/`);
}

export function createSettingsDevProxyOptions(appPublicPath: string, settingsPort: number) {
  return {
    context: (pathname: string) => isSettingsDevPath(pathname, appPublicPath),
    target: `http://127.0.0.1:${settingsPort}`,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    pathRewrite: (pathname: string) => rewriteSettingsDevProxyPath(pathname, appPublicPath),
  };
}
