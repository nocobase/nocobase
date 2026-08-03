/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stripModernClientPrefix } from '@nocobase/client-v2';

type MapSettingsApp = {
  name?: string;
  getPublicPath: () => string;
  pluginSettingsManager: {
    getRoutePath: (name: string) => string;
  };
};

function getAppScope(publicPath: string, pathname: string, appName?: string) {
  const root = `/${publicPath}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  const path = `/${pathname}`.replace(/\/{2,}/g, '/').split(/[?#]/)[0];
  const relativePath = root && (path === root || path.startsWith(`${root}/`)) ? path.slice(root.length) || '/' : path;
  const pathScope = /^\/(?:apps|_app)\/[^/]+(?=\/|$)/.exec(relativePath)?.[0];
  if (pathScope) {
    return pathScope;
  }
  return appName && appName !== 'main' ? `/apps/${appName}` : '';
}

export function resolveMapSettingsHref(app: MapSettingsApp, pathname: string, suffix = '') {
  const publicPath = app.getPublicPath();
  const rootPublicPath = stripModernClientPrefix(publicPath).replace(/\/+$/, '');
  const appScope = getAppScope(publicPath, pathname, app.name);
  const managerPath = app.pluginSettingsManager.getRoutePath('map');
  const settingsPath = managerPath.replace(/^\/admin\/settings(?=\/|$)/, '/settings');
  const scopedSettingsPath = settingsPath.replace(/^\/settings(?=\/|$)/, '');

  return appScope
    ? `${rootPublicPath}/settings${appScope}${scopedSettingsPath}${suffix}`
    : `${rootPublicPath}${settingsPath}${suffix}`;
}
