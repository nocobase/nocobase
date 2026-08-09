/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AuthRouteName = 'auth.signin' | 'auth.signup' | 'auth.forgotPassword' | 'auth.resetPassword';

const authRouteFallbacks: Record<AuthRouteName, string> = {
  'auth.signin': '/signin',
  'auth.signup': '/signup',
  'auth.forgotPassword': '/forgot-password',
  'auth.resetPassword': '/reset-password',
};

type PluginSettingsRouteApplication = {
  pluginSettingsManager: {
    getRouteName: (name: string) => string;
    getRoutePath: (name: string) => string;
  };
};

type AuthRouteApplication = PluginSettingsRouteApplication & {
  router: {
    get: (name: string) => { path?: string } | undefined;
  };
};

export function getAuthRoutePath(app: AuthRouteApplication, name: AuthRouteName) {
  const routePath = app.router.get(name)?.path;
  return typeof routePath === 'string' ? routePath : authRouteFallbacks[name];
}

export function isStandaloneSettingsApplication(app: PluginSettingsRouteApplication) {
  return app.pluginSettingsManager.getRouteName('') === 'settings.';
}

export function getDefaultAuthRedirectPath(app: PluginSettingsRouteApplication) {
  return isStandaloneSettingsApplication(app) ? app.pluginSettingsManager.getRoutePath('') : '/';
}
