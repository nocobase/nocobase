import {
  defineAppRoutes,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';
import foundation from '@nocobase/app-plugin-foundation/client/routes';
import settings from '../../client/pages/settings/routes.js';
import shell from '../../client/pages/settings/shell-routes.js';
import { createApplicationRoutes } from '../../client/routes.js';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
  filterRouteTree,
  selectedNavigationId,
  routeKey,
} from '../../client/routing/route-navigation.js';

const componentLoader = async () => ({ default: () => null });
const app = '@nocobase/app-template-default';

function resolve(...extra: ReturnType<typeof defineAppRoutes>[]) {
  return resolveAppClientContributions([
    {
      packageName: app,
      source: 'application',
      routes: [shell, settings, ...extra],
    },
  ]).routes;
}

function find(
  routes: readonly AppClientRegisteredRoute[],
  name: string,
): AppClientRegisteredRoute {
  for (const route of routes) {
    if (route.name === name) return route;
    const nested = route.children && find(route.children, name);
    if (nested) return nested;
  }
  return undefined as unknown as AppClientRegisteredRoute;
}

const catalog = (
  routes: readonly AppClientRegisteredRoute[],
  denied = new Set<string>(),
) =>
  buildSettingsCatalog(routes, denied).map((category) => [
    category.route.name,
    category.modules.map((module) => [module.route.name, module.target.path]),
  ]);

describe('System settings navigation', () => {
  it('keeps the existing URLs and authorization of the settings pages', () => {
    const routes = resolve();
    expect(
      [
        'settingsHome',
        'settingsUsers',
        'settingsRoles',
        'settingsDefaultAccess',
      ].map((name) => {
        const route = find(routes, name);
        return [name, route.path, route.authz];
      }),
    ).toEqual([
      ['settingsHome', '/settings', 'skip'],
      [
        'settingsUsers',
        '/settings/users',
        { resource: { type: 'user', id: '*' }, action: 'read' },
      ],
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
    expect(find(routes, 'settingsUsers').id).toBe(`${app}:settingsUsers`);
  });

  it('shows one sidebar entry that opens the home and stays selected on every settings page', () => {
    const routes = resolve();
    const menu = buildRouteNavigation(routes, new Set());
    expect(menu.map(({ route }) => [route.name, route.path])).toEqual([
      ['settingsHome', '/settings'],
    ]);
    expect(menu[0].children).toEqual([]);
    expect(menu[0].route.navigation?.title).toBe('settings.title');
    const entry = routeKey(menu[0].route);
    for (const path of [
      '/settings',
      '/settings/users',
      '/settings/users/create',
      '/settings/roles/member/edit',
      '/settings/default-access',
    ])
      expect(selectedNavigationId(routes, path)).toBe(entry);
  });

  it('groups modules into categories, opens a tabbed module on its first readable tab and hides empty categories', () => {
    const routes = resolve();
    expect(catalog(routes)).toEqual([
      [
        'settingsAccount',
        [
          ['settingsUsers', '/settings/users'],
          ['permissionManagement', '/settings/roles'],
        ],
      ],
    ]);
    const roles = find(routes, 'settingsRoles');
    expect(catalog(routes, new Set([routeKey(roles)]))).toEqual([
      [
        'settingsAccount',
        [
          ['settingsUsers', '/settings/users'],
          ['permissionManagement', '/settings/default-access'],
        ],
      ],
    ]);
    const denied = new Set(
      ['settingsUsers', 'settingsRoles', 'settingsDefaultAccess'].map((name) =>
        routeKey(find(routes, name)),
      ),
    );
    expect(catalog(routes, denied)).toEqual([]);
    // Without a module to open, the sidebar entry disappears too.
    expect(buildRouteNavigation(routes, denied)).toEqual([]);
  });

  it('adds a later module with several views to its category without another sidebar entry', () => {
    const routes = resolve(
      defineAppRoutes([
        {
          parent: 'settingsSystem',
          name: 'notificationManagement',
          navigation: {
            title: 'Notifications',
            description: 'Channels and delivery records.',
          },
          breadcrumb: { title: 'Notifications' },
          children: [
            {
              name: 'notificationLogs',
              path: '/notifications/logs',
              authz: {
                resource: { type: 'page', id: 'notification.logs' },
                action: 'access',
              },
              navigation: { title: 'Delivery logs' },
              componentLoader,
            },
          ],
        },
      ]),
    );
    expect(find(routes, 'notificationLogs').path).toBe(
      '/settings/notifications/logs',
    );
    expect(catalog(routes).at(-1)).toEqual([
      'settingsSystem',
      [['notificationManagement', '/settings/notifications/logs']],
    ]);
    expect(buildRouteNavigation(routes, new Set())).toHaveLength(1);
    expect(selectedNavigationId(routes, '/settings/notifications/logs')).toBe(
      routeKey(buildRouteNavigation(routes, new Set())[0].route),
    );
  });

  it('places a plugin module registered outside the categories under System', () => {
    const routes = resolveAppClientContributions([
      { packageName: app, source: 'application', routes: [shell] },
      {
        packageName: '@nocobase/app-plugin-foundation',
        source: 'plugin',
        routes: foundation,
      },
    ]).routes;
    // The bare shell: only App Foundation, which only an unrestricted administrator may open.
    const menu = buildRouteNavigation(routes, new Set());
    expect(menu.map(({ route }) => route.name)).toEqual(['settingsHome']);
    expect(catalog(routes)).toEqual([
      ['settingsSystem', [['foundation', '/foundation']]],
    ]);
    // The signed-in shell receives the tree filtered to its pages; empty categories keep their titles there.
    const signedIn = filterRouteTree(
      routes,
      (route) => route.auth === 'required',
    );
    expect(catalog(signedIn)).toEqual([
      ['settingsSystem', [['foundation', '/foundation']]],
    ]);
    const page = find(routes, 'foundation');
    expect(page.navigation?.description).toBe('nav.foundationDescription');
    expect(buildRouteNavigation(routes, new Set([routeKey(page)]))).toEqual([]);
  });

  it('shows the notification template view as a System card once an invitation mailer is configured', () => {
    const routes = resolveAppClientContributions([
      {
        packageName: app,
        source: 'application',
        routes: createApplicationRoutes({
          notificationTemplates: { invitationConfigured: true },
        }),
      },
    ]).routes;
    expect(catalog(routes)).toEqual([
      [
        'settingsSystem',
        [['notificationManagement', '/settings/notifications/templates']],
      ],
    ]);
    expect(
      buildRouteNavigation(routes, new Set()).map(({ route }) => route.name),
    ).toEqual(['home', 'settingsHome']);
  });
});
