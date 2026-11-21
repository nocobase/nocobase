import {
  defineSystemSettingsRoutes,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';
import foundation from '@nocobase/app-plugin-foundation/client/routes';
import usersRoutes from '@nocobase/app-plugin-users/client/routes';
import settings from '../../client/pages/settings/routes.js';
import shell from '../../client/pages/settings/shell-routes.js';
import { createApplicationRoutes } from '../../client/routes.js';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
  buildSettingsNavigation,
  filterRouteTree,
  selectedNavigationId,
  routeKey,
} from '../../client/routing/route-navigation.js';

const componentLoader = async () => ({ default: () => null });
const app = '@nocobase/app-template-default';
// User management joins Accounts and permissions from its plugin, as the application's client/plugins.ts registers it.
const users = {
  packageName: '@nocobase/app-plugin-users',
  source: 'plugin',
  routes: usersRoutes,
} as const;

function resolve(...extra: AppClientRouteContribution[]) {
  return resolveAppClientContributions([
    {
      packageName: app,
      source: 'application',
      routes: [shell, settings, ...extra],
    },
    users,
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
    expect(find(routes, 'settingsUsers').id).toBe(
      '@nocobase/app-plugin-users:settingsUsers',
    );
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

  it('lists the settings navigation by category, one entry per module selected on all of its pages', () => {
    const routes = resolve();
    const menu = buildSettingsNavigation(routes, new Set());
    expect(
      menu.map(({ route, children }) => [
        route.name,
        children.map((child) => [
          child.route.path,
          child.route.navigation?.title,
        ]),
      ]),
    ).toEqual([
      [
        'systemSettings.account',
        [
          ['/settings/users', 'management.users'],
          // A module of several views opens its first view and carries the module's title.
          ['/settings/roles', 'settings.permissionManagement'],
        ],
      ],
    ]);
    const [users, permissions] = menu[0].children;
    for (const [path, entry] of [
      ['/settings/users', users],
      ['/settings/users/create', users],
      ['/settings/users/42/edit', users],
      ['/settings/roles', permissions],
      ['/settings/roles/member/edit', permissions],
      ['/settings/default-access', permissions],
    ] as const)
      expect(selectedNavigationId(routes, path, new Set(), menu)).toBe(
        routeKey(entry.route),
      );
    // A denied view leaves the module on the view still open to the viewer.
    const roles = routeKey(find(routes, 'settingsRoles'));
    expect(
      buildSettingsNavigation(routes, new Set([roles]))[0].children[1].route
        .path,
    ).toBe('/settings/default-access');
  });

  it('groups modules into categories, opens a tabbed module on its first readable tab and hides empty categories', () => {
    const routes = resolve();
    expect(catalog(routes)).toEqual([
      [
        'systemSettings.account',
        [
          ['settingsUsers', '/settings/users'],
          ['permissionManagement', '/settings/roles'],
        ],
      ],
    ]);
    const roles = find(routes, 'settingsRoles');
    expect(catalog(routes, new Set([routeKey(roles)]))).toEqual([
      [
        'systemSettings.account',
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
      defineSystemSettingsRoutes([
        {
          parent: 'messages',
          name: 'notificationManagement',
          kind: 'module',
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
      'systemSettings.messages',
      [['notificationManagement', '/settings/notifications/logs']],
    ]);
    expect(buildRouteNavigation(routes, new Set())).toHaveLength(1);
    expect(selectedNavigationId(routes, '/settings/notifications/logs')).toBe(
      routeKey(buildRouteNavigation(routes, new Set())[0].route),
    );
  });

  it('places a plugin module in its built-in System category', () => {
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
      ['systemSettings.system', [['foundation', '/settings/foundation']]],
    ]);
    // The signed-in shell receives the tree filtered to its pages; empty categories keep their titles there.
    const signedIn = filterRouteTree(
      routes,
      (route) => route.auth === 'required',
    );
    expect(catalog(signedIn)).toEqual([
      ['systemSettings.system', [['foundation', '/settings/foundation']]],
    ]);
    const page = find(routes, 'foundation');
    expect(page.navigation?.description).toBe('nav.foundationDescription');
    expect(buildRouteNavigation(routes, new Set([routeKey(page)]))).toEqual([]);
  });

  it('shows the notification template view as a Messages card once an invitation mailer is configured', () => {
    const routes = resolveAppClientContributions([
      {
        packageName: app,
        source: 'application',
        routes: createApplicationRoutes({
          notificationTemplates: { invitationConfigured: true },
        }),
      },
      users,
    ]).routes;
    expect(catalog(routes)).toEqual([
      [
        'systemSettings.account',
        [
          ['settingsUsers', '/settings/users'],
          ['permissionManagement', '/settings/roles'],
        ],
      ],
      [
        'systemSettings.messages',
        [['notificationManagement', '/settings/notifications/templates']],
      ],
      [
        'systemSettings.data',
        [['databaseExplorer', '/settings/database-explorer']],
      ],
    ]);
    expect(
      buildRouteNavigation(routes, new Set()).map(({ route }) => route.name),
    ).toEqual(['home', 'settingsHome']);
  });
});

it('places database browsing in Data and files and hides its card when access is denied', () => {
  const routes = resolveAppClientContributions([
    {
      packageName: app,
      source: 'application',
      routes: createApplicationRoutes({}),
    },
    users,
  ]).routes;
  const page = find(routes, 'databaseExplorer');
  expect(page.path).toBe('/settings/database-explorer');
  expect(page.auth).toBe('required');
  expect(page.authz).toEqual({
    resource: { type: 'page', id: 'database-explorer' },
    action: 'access',
  });
  const account = [
    'systemSettings.account',
    [
      ['settingsUsers', '/settings/users'],
      ['permissionManagement', '/settings/roles'],
    ],
  ];
  expect(catalog(routes)).toEqual([
    account,
    [
      'systemSettings.data',
      [['databaseExplorer', '/settings/database-explorer']],
    ],
  ]);
  // The empty Data and files category is hidden; Accounts and permissions stays.
  expect(catalog(routes, new Set([routeKey(page)]))).toEqual([account]);
});
