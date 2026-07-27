/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from '../BaseApplication';
import { PluginSettingsManager } from '../PluginSettingsManager';

const SETTINGS_ROUTE_PREFIX = 'settings.';
const SETTINGS_PATH_PREFIX = '/settings/';

export class SettingsPluginSettingsManager<
  TApp extends BaseApplication<any> = BaseApplication<any>,
> extends PluginSettingsManager<TApp> {
  getRouteName(name: string) {
    return `${SETTINGS_ROUTE_PREFIX}${name}`;
  }

  getRoutePath(name: string) {
    const separatorIndex = name.indexOf('.');
    const menuName = separatorIndex < 0 ? name : name.slice(0, separatorIndex);
    const pageName = separatorIndex < 0 ? undefined : name.slice(separatorIndex + 1);
    const menuPath = `${SETTINGS_PATH_PREFIX}${menuName}`;

    if (!pageName || pageName === 'index') {
      return menuPath;
    }

    return `${menuPath}/${pageName}`;
  }
}
