/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stripModernClientPrefix } from '../authRedirect';
import type { BaseApplication } from '../BaseApplication';
import {
  resolveSettingsAppScope,
  resolveSettingsAppScopeWithinPublicPath,
  resolveSettingsDocumentPath,
} from './settingsDocumentPath';

type SettingsRuntimeApp = Pick<BaseApplication<any>, 'name'> & {
  getPublicPath?: () => string;
  router?: {
    basename?: string;
    getBasename?: () => string | undefined;
  };
};

const LEGACY_EMAIL_OAUTH_PATH = '/admin/settings/mail/oauth2';

const ROUTE_MAPPINGS = [
  { from: '/admin/workflow/executions', to: '/settings/workflow/executions' },
  { from: '/admin/workflow/workflows', to: '/settings/workflow/workflows' },
  { from: '/admin/settings', to: '/settings' },
  { from: '/settings', to: '/settings' },
] as const;

function normalizePathname(pathname?: string) {
  const normalized = `/${String(pathname || '/').trim()}`.replace(/\/{2,}/g, '/');
  return normalized === '/' ? normalized : normalized.replace(/\/+$/, '');
}

function splitPathSuffix(pathLike: string) {
  const match = String(pathLike || '').match(/^([^?#]*)(.*)$/);
  return {
    pathname: normalizePathname(match?.[1]),
    suffix: match?.[2] || '',
  };
}

function getRuntimeAppScope(app: SettingsRuntimeApp, pathname: string) {
  const basename = app.router?.getBasename?.() || app.router?.basename;
  const publicPath = app.getPublicPath?.() || '/';
  return (
    resolveSettingsAppScopeWithinPublicPath(publicPath, pathname) ||
    resolveSettingsAppScopeWithinPublicPath(publicPath, basename) ||
    (app.name && app.name !== 'main' ? resolveSettingsAppScope(`/apps/${app.name}`) : '')
  );
}

function getRootPublicPath(app: SettingsRuntimeApp, appScope: string) {
  const basename = app.router?.getBasename?.() || app.router?.basename || '';
  const publicPath = app.getPublicPath?.();
  if (publicPath) {
    return normalizePathname(stripModernClientPrefix(publicPath));
  }

  const normalizedBasename = normalizePathname(basename);
  const basenameWithoutAppScope =
    appScope && normalizedBasename.endsWith(appScope)
      ? normalizedBasename.slice(0, -appScope.length)
      : normalizedBasename;
  return normalizePathname(stripModernClientPrefix(basenameWithoutAppScope));
}

function findMappedRoute(pathname: string) {
  for (const mapping of ROUTE_MAPPINGS) {
    const index = pathname.indexOf(mapping.from);
    if (index < 0) {
      continue;
    }
    const tail = pathname.slice(index + mapping.from.length);
    if (tail && !tail.startsWith('/')) {
      continue;
    }
    return `${mapping.to}${tail}`;
  }
  return '/settings';
}

export function resolveStandaloneSettingsPath(app: SettingsRuntimeApp, pathLike: string, contextPathname?: string) {
  const { pathname, suffix } = splitPathSuffix(pathLike);
  const appScope = getRuntimeAppScope(app, contextPathname || pathname);
  const rootPublicPath = getRootPublicPath(app, appScope).replace(/\/+$/, '');
  const documentBasePath = `${rootPublicPath}${appScope}`;
  const oauthIndex = pathname.indexOf(LEGACY_EMAIL_OAUTH_PATH);

  if (oauthIndex >= 0) {
    const oauthTail = pathname.slice(oauthIndex + LEGACY_EMAIL_OAUTH_PATH.length);
    if (!oauthTail || oauthTail.startsWith('/')) {
      return `${documentBasePath}${LEGACY_EMAIL_OAUTH_PATH}${oauthTail}${suffix}`;
    }
  }

  return `${resolveSettingsDocumentPath(rootPublicPath, appScope, findMappedRoute(pathname))}${suffix}`;
}
