/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from '../BaseApplication';
import { RouterManager, type RouteType } from '../RouterManager';

function isSettingsOwnedRoute(name: string) {
  return (
    name === 'not-found' ||
    name === 'settings' ||
    name.startsWith('settings.') ||
    name === 'settingsDetails' ||
    name.startsWith('settingsDetails.')
  );
}

export class SettingsRouterManager<
  TApp extends BaseApplication<any> = BaseApplication<any>,
> extends RouterManager<TApp> {
  add(name: string, route: RouteType) {
    if (!isSettingsOwnedRoute(name)) {
      return;
    }

    super.add(
      name,
      name === 'settingsDetails' || name.startsWith('settingsDetails.')
        ? {
            ...route,
            authCheck: true,
          }
        : route,
    );
  }
}
