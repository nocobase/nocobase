/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type SettingsAppScope = '' | `/${'apps' | '_app'}/${string}`;

function ensureLeadingSlash(value: string) {
  return value.startsWith('/') ? value : `/${value}`;
}

export function normalizeSettingsRootPublicPath(value?: string) {
  const normalized = ensureLeadingSlash(String(value || '/').trim() || '/').replace(/\/{2,}/g, '/');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function resolveSettingsAppScope(pathname?: string): SettingsAppScope {
  const match = /\/(apps|_app)\/([^/?#]+)(?=\/|[?#]|$)/.exec(ensureLeadingSlash(String(pathname || '/')));
  return match ? (`/${match[1]}/${match[2]}` as SettingsAppScope) : '';
}

export function resolveSettingsAppScopeWithinPublicPath(publicPath: string, pathname?: string): SettingsAppScope {
  const root = normalizeSettingsRootPublicPath(publicPath).replace(/\/+$/, '');
  const path = ensureLeadingSlash(String(pathname || '/').split(/[?#]/)[0]).replace(/\/{2,}/g, '/');
  const relativePath = root && (path === root || path.startsWith(`${root}/`)) ? path.slice(root.length) || '/' : path;
  const match = /^\/(?:settings\/)?(apps|_app)\/([^/]+)(?=\/|$)/.exec(relativePath);
  return match ? (`/${match[1]}/${match[2]}` as SettingsAppScope) : '';
}

function normalizeSettingsRoutePath(value: string) {
  const normalized = ensureLeadingSlash(String(value || '/settings')).replace(/\/{2,}/g, '/');
  return normalized === '/' ? '/settings' : normalized.replace(/\/+$/, '');
}

function removeSettingsRouteRoot(settingsRoute: string) {
  if (settingsRoute === '/settings') {
    return '';
  }
  return settingsRoute.replace(/^\/settings(?=\/|$)/, '');
}

export function resolveSettingsDocumentPath(
  rootPublicPath: string,
  appScope: SettingsAppScope,
  settingsRoutePath: string,
) {
  const root = normalizeSettingsRootPublicPath(rootPublicPath);
  const rootPrefix = root === '/' ? '' : root.replace(/\/+$/, '');
  const settingsRoute = normalizeSettingsRoutePath(settingsRoutePath);
  if (!appScope) {
    return `${rootPrefix}${settingsRoute}`;
  }
  return `${rootPrefix}/settings${appScope}${removeSettingsRouteRoot(settingsRoute)}`;
}

export function resolveSettingsDocumentBasename(rootPublicPath: string, appScope: SettingsAppScope) {
  const root = normalizeSettingsRootPublicPath(rootPublicPath);
  if (!appScope) {
    return root;
  }
  return normalizeSettingsRootPublicPath(`${root}settings${appScope}`);
}
