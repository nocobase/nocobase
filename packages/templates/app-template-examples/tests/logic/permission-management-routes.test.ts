import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { expect, it } from 'vitest';
import settings from '../../client/pages/settings/routes.js';
import {
  buildRouteNavigation,
  routeKey,
} from '../../client/routing/route-navigation.js';
it('groups existing permission pages without changing their URLs or authorization and hides inaccessible children', () => {
  const { routes } = resolveAppClientContributions([
    { packageName: 'test', source: 'application', routes: [settings] },
  ]);
  const group = routes[0].children!.find(
    (route) => route.name === 'permissionManagement',
  )!;
  expect(group.componentLoader).toBeUndefined();
  expect(
    group.children!.map((route) => [route.name, route.path, route.authz]),
  ).toEqual([
    [
      'settingsRoles',
      '/settings/roles',
      {
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        action: 'read',
      },
    ],
    [
      'settingsDefaultAccess',
      '/settings/default-access',
      {
        resource: { type: 'settings', id: 'authorization.default-access' },
        action: 'read',
      },
    ],
  ]);
  const denied = new Set([routeKey(group.children![1])]);
  expect(
    buildRouteNavigation(routes, denied)[0]
      .children.find(({ route }) => route.name === 'permissionManagement')
      ?.children.map(({ route }) => route.name),
  ).toEqual(['settingsRoles']);
  denied.add(routeKey(group.children![0]));
  expect(
    buildRouteNavigation(routes, denied)[0].children.map(
      ({ route }) => route.name,
    ),
  ).toEqual(['settingsUsers']);
});
