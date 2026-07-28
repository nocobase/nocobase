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

function normalizeSettingsRoutePath(value: string) {
  const normalized = ensureLeadingSlash(String(value || '/settings')).replace(/\/{2,}/g, '/');
  return normalized === '/' ? '/settings' : normalized.replace(/\/+$/, '');
}

export function resolveSettingsDocumentPath(
  rootPublicPath: string,
  appScope: SettingsAppScope,
  settingsRoutePath: string,
) {
  const root = normalizeSettingsRootPublicPath(rootPublicPath);
  const rootPrefix = root === '/' ? '' : root.replace(/\/+$/, '');
  const settingsRoute = normalizeSettingsRoutePath(settingsRoutePath);
  const scopePrefix = appScope ? `/settings${appScope}` : '';
  return `${rootPrefix}${scopePrefix}${settingsRoute}`;
}

export function resolveSettingsDocumentBasename(rootPublicPath: string, appScope: SettingsAppScope) {
  const root = normalizeSettingsRootPublicPath(rootPublicPath);
  if (!appScope) {
    return root;
  }
  return normalizeSettingsRootPublicPath(`${root}settings${appScope}`);
}
