/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  resolveSettingsDocumentBasename,
  type SettingsAppScope,
} from '../../../client-v2/src/settings-app/settingsDocumentPath';

function ensurePublicPath(value: string) {
  let normalized = value.trim() || '/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/{2,}/g, '/');
}

export function resolveSettingsRuntimeScope(configuredPublicPath: string, pathname: string) {
  const rootPublicPath = ensurePublicPath(configuredPublicPath);
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const relativePathname = normalizedPathname.startsWith(rootPublicPath)
    ? normalizedPathname.slice(rootPublicPath.length)
    : normalizedPathname.replace(/^\/+/, '');
  const match = /^settings\/(apps|_app)\/([^/]+)(?:\/|$)/.exec(relativePathname);

  if (!match) {
    return {
      appName: undefined,
      basename: rootPublicPath,
      rootPublicPath,
    };
  }

  const [, scope, appName] = match;
  const appScope = `/${scope}/${appName}` as SettingsAppScope;
  return {
    appName,
    basename: resolveSettingsDocumentBasename(rootPublicPath, appScope),
    rootPublicPath,
  };
}
