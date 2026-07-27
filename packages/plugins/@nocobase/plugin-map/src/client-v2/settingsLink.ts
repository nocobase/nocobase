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

function getAppScope(pathname: string, appName?: string) {
  const pathScope = /\/(?:apps|_app)\/[^/]+(?=\/|$)/.exec(pathname)?.[0];
  if (pathScope) {
    return pathScope;
  }
  return appName && appName !== 'main' ? `/apps/${appName}` : '';
}

export function resolveMapSettingsHref(app: MapSettingsApp, pathname: string, suffix = '') {
  const rootPublicPath = stripModernClientPrefix(app.getPublicPath()).replace(/\/+$/, '');
  const appScope = getAppScope(pathname, app.name);
  const managerPath = app.pluginSettingsManager.getRoutePath('map');
  const settingsPath = managerPath.replace(/^\/admin\/settings(?=\/|$)/, '/settings');

  return `${rootPublicPath}${appScope}${settingsPath}${suffix}`;
}
