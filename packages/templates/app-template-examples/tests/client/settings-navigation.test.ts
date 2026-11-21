import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

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
  ]).routes;
}

const systemModules = (
  routes: readonly AppClientRegisteredRoute[],
  denied = new Set<string>(),
) =>
  buildSettingsCatalog(routes, denied)
    .find(({ route }) => route.name === 'settingsSystem')
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
      ({ route }) => route.name === 'settingsAccount',
    );
    expect(account?.modules.map(({ target }) => target.path)).toEqual(
      expect.arrayContaining(['/settings/users', '/settings/roles']),
    );
    expectSettingsEntry(routes);
  });

  it('opens Notifications and Database Explorer from the System category', () => {
    const routes = resolve();
    expect(systemModules(routes)).toContainEqual([
      'notificationManagement',
      '/settings/notifications/templates',
    ]);
    const explorer = ['databaseExplorer', '/settings/database-explorer'];
    expect(systemModules(routes)).toContainEqual(explorer);
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
      systemModules(routes, new Set([routeKey(page!)])),
    ).not.toContainEqual(explorer);
  });
});
