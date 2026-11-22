import { authorizationPages } from '../helpers/plugin-routes.js';
import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import usersRoutes from '@nocobase/app-plugin-users/client/routes';
import applicationRoutes from '../../client/routes.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  buildRouteNavigation,
  buildSettingsCatalog,
  routeKey,
  selectedNavigationId,
} from '../../client/routing/route-navigation.js';

function resolve() {
  return resolveAppClientContributions([
    {
      packageName: packageMetadata.name,
      source: 'application',
      routes: applicationRoutes,
    },
    // User management joins Accounts and permissions from its plugin, as client/plugins.ts registers it.
    {
      packageName: '@nocobase/app-plugin-users',
      source: 'plugin',
      routes: usersRoutes,
    },
    authorizationPages(),
  ]).routes;
}

const categoryModules = (
  category: string,
  routes: readonly AppClientRegisteredRoute[],
  denied = new Set<string>(),
) =>
  buildSettingsCatalog(routes, denied)
    .find(({ route }) => route.name === `systemSettings.${category}`)
    ?.modules.map(({ route, target }) => [route.name, target.path]) ?? [];

function expectSettingsEntry(routes: readonly AppClientRegisteredRoute[]) {
  const menu = buildRouteNavigation(routes, new Set());
  expect(
    menu.filter(
      ({ route }) =>
        route.path === '/settings' || route.path.startsWith('/settings/'),
    ),
  ).toMatchObject([{ route: { name: 'settingsHome' }, children: [] }]);
  expect(
    selectedNavigationId(routes, '/settings/notifications/templates'),
  ).toBe(
    routeKey(menu.find(({ route }) => route.name === 'settingsHome')!.route),
  );
}

describe('System settings navigation with application menus', () => {
  it('keeps user management and permission management in Settings alongside business navigation', () => {
    const routes = resolve();
    const account = buildSettingsCatalog(routes, new Set()).find(
      ({ route }) => route.name === 'systemSettings.account',
    );
    expect(account?.modules.map(({ target }) => target.path)).toEqual(
      expect.arrayContaining(['/settings/users', '/settings/roles']),
    );
    expectSettingsEntry(routes);
  });

  it('opens Notifications from Messages and Database Explorer from Data and files', () => {
    const routes = resolve();
    expect(categoryModules('messages', routes)).toContainEqual([
      'notificationManagement',
      '/settings/notifications/templates',
    ]);
    const explorer = ['databaseExplorer', '/settings/database-explorer'];
    expect(categoryModules('data', routes)).toContainEqual(explorer);
    const page = buildSettingsCatalog(routes, new Set())
      .flatMap(({ modules }) => modules)
      .find(({ route }) => route.name === 'databaseExplorer')?.route;
    expect(page).toMatchObject({
      path: '/settings/database-explorer',
      auth: 'required',
      authz: {
        resource: { type: 'page', id: 'database-explorer' },
        action: 'access',
      },
    });
    expect(
      categoryModules('data', routes, new Set([routeKey(page!)])),
    ).not.toContainEqual(explorer);
  });
});
