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
import { resolveSettingsAppScopeWithinPublicPath } from './settingsDocumentPath';

function isSettingsOwnedRoute(name: string) {
  return (
    name === 'not-found' ||
    name === 'settings' ||
    name.startsWith('settings.') ||
    name === 'settingsDetails' ||
    name.startsWith('settingsDetails.') ||
    name === 'auth' ||
    name.startsWith('auth.') ||
    name === '2fa' ||
    name.startsWith('2fa.')
  );
}

function isSettingsAuthenticationRoute(name: string) {
  return name === 'auth' || name.startsWith('auth.') || name === '2fa' || name.startsWith('2fa.');
}

export class SettingsRouterManager<
  TApp extends BaseApplication<any> = BaseApplication<any>,
> extends RouterManager<TApp> {
  private rebaseScopedSettingsRoute(route: RouteType) {
    const appScope = resolveSettingsAppScopeWithinPublicPath(this.app.getPublicPath(), this.getBasename());
    if (!route.path?.startsWith('/') || !appScope) {
      return route;
    }
    if (route.path === '/settings') {
      return {
        ...route,
        path: '/',
      };
    }
    if (!route.path.startsWith('/settings/')) {
      return route;
    }
    return {
      ...route,
      path: route.path.slice('/settings'.length),
    };
  }

  private rebaseAuthenticationRoute(route: RouteType) {
    if (!route.path?.startsWith('/')) {
      return route;
    }

    const settingsRoot = this.app.pluginSettingsManager.getRoutePath('').replace(/\/+$/, '');
    if (!settingsRoot) {
      return route;
    }
    if (route.path === settingsRoot || route.path.startsWith(`${settingsRoot}/`)) {
      return route;
    }

    return {
      ...route,
      path: `${settingsRoot}/${route.path.replace(/^\/+/, '')}`,
    };
  }

  add(name: string, route: RouteType) {
    if (!isSettingsOwnedRoute(name)) {
      return;
    }

    const scopedRoute = this.rebaseScopedSettingsRoute(route);
    const ownedRoute = isSettingsAuthenticationRoute(name) ? this.rebaseAuthenticationRoute(scopedRoute) : scopedRoute;

    super.add(
      name,
      name === 'settingsDetails' || name.startsWith('settingsDetails.')
        ? {
            ...ownedRoute,
            authCheck: true,
          }
        : ownedRoute,
    );
  }
}
