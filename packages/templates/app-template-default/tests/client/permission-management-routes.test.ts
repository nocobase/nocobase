import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { expect, it } from 'vitest';
import settings from '../../client/pages/settings/routes.js';
import {
  buildRouteNavigation,
  selectedNavigationId,
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
  const visible = buildRouteNavigation(routes, new Set())[0].children.find(
    ({ route }) => route.name === 'permissionManagement',
  )!;
  expect(visible.children).toEqual([]);
  expect(visible.route.path).toBe('/settings/roles');
  expect(visible.route.navigation?.title).toBe('settings.permissionManagement');
  expect(selectedNavigationId(routes, '/settings/roles/member/edit')).toBe(
    routeKey(visible.route),
  );
  expect(selectedNavigationId(routes, '/settings/default-access')).toBe(
    routeKey(visible.route),
  );
  const denied = new Set([routeKey(group.children![0])]);
  const onlyDefault = buildRouteNavigation(routes, denied)[0].children.find(
    ({ route }) => route.name === 'permissionManagement',
  )!;
  expect(onlyDefault.children).toEqual([]);
  expect(onlyDefault.route.path).toBe('/settings/default-access');
  expect(selectedNavigationId(routes, '/settings/default-access', denied)).toBe(
    routeKey(onlyDefault.route),
  );
  denied.add(routeKey(group.children![1]));
  expect(
    buildRouteNavigation(routes, denied)[0].children.map(
      ({ route }) => route.name,
    ),
  ).toEqual(['settingsUsers']);
});
