import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import authentication from '@nocobase/app-plugin-authentication/client/plugin';
import { describe, expect, it } from 'vitest';

import { createApplicationRoutes } from '../../client/routes.js';
import {
  buildPersonalSettingsNavigation,
  buildSettingsCatalog,
  firstNavigationPage,
  routeKey,
} from '../../client/routing/route-navigation.js';

// The application declares no authentication page of its own: both come from the plugin it registers.
function resolve() {
  const plugin = authentication();
  return resolveAppClientContributions([
    {
      packageName: '@nocobase/app-template-default',
      source: 'application',
      routes: createApplicationRoutes(),
    },
    {
      packageName: plugin.packageName,
      source: 'plugin',
      routes: plugin.routes,
    },
  ]).routes;
}

describe('the authentication plugin’s settings pages in the application', () => {
  it('lists Sign-in and authentication under Accounts and permissions, and hides it when denied', () => {
    const routes = resolve();
    const accounts = (denied: Set<string>) =>
      buildSettingsCatalog(routes, denied)
        .find(({ route }) => route.name === 'systemSettings.account')
        ?.modules.map(({ target }) => target.path) ?? [];
    expect(accounts(new Set())).toContain('/settings/authentication');
    const page = buildSettingsCatalog(routes, new Set())
      .flatMap(({ modules }) => modules)
      .find(({ target }) => target.path === '/settings/authentication')!;
    expect(accounts(new Set([routeKey(page.route)]))).not.toContain(
      '/settings/authentication',
    );
  });

  it('opens Account and security first from /me', () => {
    const menu = buildPersonalSettingsNavigation(resolve(), new Set());
    expect(menu.map(({ route }) => route.name)).toEqual([
      'personalSettings.account',
      'personalSettings.preferences',
    ]);
    expect(firstNavigationPage(menu)?.path).toBe('/me/security');
  });
});
