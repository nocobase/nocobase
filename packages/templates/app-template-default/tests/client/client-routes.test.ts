import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteComponentLoader,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import systemSettingsRoutes from '../../client/pages/settings/routes.js';
import applicationRoutes, {
  createApplicationRoutes,
} from '../../client/routes.ts';
import { includeNotificationTemplateRoutes } from '../../client/pages/settings/notification-routes.js';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

const explorer = databaseExplorer({
  parent: '@nocobase/app-template-default:settingsSystem',
});

describe('app client routes', () => {
  it('joins the settings system category across contributions without moving the log URL', () => {
    const shell = defineAppRoutes([
      {
        name: 'settings',
        path: '/settings',
        navigation: { title: 'Settings' },
        children: [
          {
            name: 'settingsSystem',
            navigation: { title: 'System' },
            children: [],
          },
        ],
      },
    ]);
    const logs = defineAppRoutes([
      {
        name: 'notificationManagement',
        parent: 'settingsSystem',
        navigation: { title: 'Notifications' },
        children: [
          {
            name: 'notificationLogs',
            path: '/notifications/logs',
            auth: 'required',
            authz: {
              resource: { type: 'page', id: 'notification.logs' },
              action: 'access',
            },
            componentLoader: () =>
              import('../../client/pages/settings/notification-templates.js'),
          },
        ],
      },
    ]);
    const routes = includeNotificationTemplateRoutes([shell, logs], true);
    const built = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-template-default',
        source: 'application',
        routes,
      },
    ]);
    expect(pagePaths(built.routes)).toEqual([
      '/settings/notifications/logs',
      '/settings/notifications/templates',
      '/settings/notifications/templates/:templateId',
    ]);
    expect(built.routes[0].children[0].children).toHaveLength(1);
    const created = includeNotificationTemplateRoutes([shell], true);
    expect(
      created
        .flatMap((part) => part.routes)
        .find((route) => route.name === 'notificationManagement')?.parent,
    ).toBe('settingsSystem');
  });

  it('exposes configured invitation templates through the real application route factory', async () => {
    const built = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-template-default',
        source: 'application',
        routes: createApplicationRoutes({
          notificationTemplates: { invitationConfigured: true },
        }),
      },
    ]);
    expect(pagePaths(built.routes)).toContain(
      '/settings/notifications/templates',
    );
    expect(pageAuthorizations(built.routes)).toContainEqual({
      name: 'notificationTemplates',
      authorizedAs: 'notification.templates',
    });
    for (const loader of componentLoadersIn(built.routes))
      await expect(loader()).resolves.toMatchObject({
        default: expect.any(Function),
      });
  });

  it('reuses the notification module and preserves its logs and existing grants', () => {
    const existing = defineAppRoutes([
      {
        name: 'settings',
        path: '/settings',
        navigation: { title: 'Settings' },
        children: [
          {
            name: 'notificationManagement',
            navigation: { title: 'Notifications' },
            children: [
              {
                name: 'notificationLogs',
                path: '/notification-logs',
                auth: 'required',
                authz: {
                  resource: { type: 'page', id: 'existing.notification.logs' },
                  action: 'access',
                },
                componentLoader: () =>
                  import('../../client/pages/settings/notification-templates.js'),
              },
            ],
          },
        ],
      },
    ]);
    const once = includeNotificationTemplateRoutes([existing], false);
    expect(includeNotificationTemplateRoutes(once, true)).toBe(once);
    const built = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-template-default',
        source: 'application',
        routes: once,
      },
    ]);
    expect(pagePaths(built.routes)).toEqual([
      '/settings/notification-logs',
      '/settings/notifications/templates',
      '/settings/notifications/templates/:templateId',
    ]);
    expect(pageAuthorizations(built.routes)).toEqual([
      { name: 'notificationLogs', authorizedAs: 'existing.notification.logs' },
      { name: 'notificationTemplates', authorizedAs: 'notification.templates' },
      // A template's own address keeps the list page's grant.
      { name: 'notificationTemplate', authorizedAs: 'notification.templates' },
    ]);
    expect(built.routes[0].children).toHaveLength(1);
  });

  it('keeps the landing page and the authentication pages', () => {
    // The authentication plugin and this application have to agree on these paths: it sends an unknown visitor to
    // /login, sends a signed-in user who opens a guest page back to /, and mails a reset link to /reset-password,
    // while the sign-in form links to /register and /forgot-password. Only their presence is asserted, so a page the
    // application adds is not a defect. Whether these four are guest pages is not checked here either: app-client
    // refuses any route that claims one of those paths without `auth: 'guest'`.
    expect(pagePaths(resolveRoutes().routes)).toEqual(
      expect.arrayContaining([
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        // The page `deviceAuthorization()`'s verificationUri names, where a CLI's sign-in is approved.
        '/device',
      ]),
    );
  });

  it('loads every page component', async () => {
    const resolved = resolveRoutes();
    const loaders = componentLoadersIn(resolved.routes);
    // The tree above is filtered by loader, so an empty list would make the loop below pass without loading
    // anything at all.
    expect(loaders).not.toHaveLength(0);

    for (const componentLoader of loaders) {
      // The registered loader is already the wrapped one, so awaiting it holds every page to the contract that its
      // module default-exports a component. A page that moved or lost its default export fails here.
      await expect(componentLoader()).resolves.toMatchObject({
        default: expect.any(Function),
      });
    }
  });

  it('preserves the template page authorization as the app adds routes', () => {
    const resolved = resolveRoutes();

    // The landing page and the inbox opted out of page authorization, so they are reachable by every signed-in user.
    const expected = [
      { name: 'home', authorizedAs: null },
      { name: 'inbox', authorizedAs: null },
      { name: 'settingsHome', authorizedAs: null },
      { name: 'workflowDefinitions', authorizedAs: 'unrestricted' },
      { name: 'workflowExecutions', authorizedAs: 'unrestricted' },
      { name: 'databaseExplorer', authorizedAs: 'database-explorer' },
    ];
    expect(pageAuthorizations(resolved.routes)).toEqual(
      expect.arrayContaining(expected),
    );
  });

  it('includes database browsing and supports business settings registration', async () => {
    const hasUserManagement = applicationRoutes.some((contribution) =>
      contribution.routes.some((route) => route.name === 'settingsUsers'),
    );
    const built = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-template-default',
        routes: hasUserManagement
          ? applicationRoutes
          : [...applicationRoutes, systemSettingsRoutes],
        source: 'application',
      },
      {
        packageName: explorer.packageName,
        source: 'plugin',
        routes: explorer.routes,
      },
    ]);
    expect(pagePaths(built.routes)).toEqual(
      expect.arrayContaining(['/settings', '/settings/database-explorer']),
    );
    const expected = [
      { name: 'settingsUsers', authorizedAs: 'user:*' },
      { name: 'settingsUserCreate', authorizedAs: 'user:*' },
      { name: 'settingsUser', authorizedAs: 'user:*' },
      { name: 'settingsUserEdit', authorizedAs: 'user:*' },
      {
        name: 'settingsRoles',
        authorizedAs: 'settings:authorization.permission-sets',
      },
      {
        name: 'settingsRoleCreate',
        authorizedAs: 'settings:authorization.permission-sets',
      },
      {
        name: 'settingsRoleEdit',
        authorizedAs: 'settings:authorization.permission-sets',
      },
      ...[
        'settingsDefaultAccess',
        'settingsDefaultAccessCreate',
        'settingsDefaultAccessEdit',
      ].map((name) => ({
        name,
        authorizedAs: 'settings:authorization.default-access',
      })),
    ];
    expect(pageAuthorizations(built.routes)).toEqual(
      expect.arrayContaining(expected),
    );
    for (const loader of componentLoadersIn(built.routes))
      await expect(loader()).resolves.toMatchObject({
        default: expect.any(Function),
      });
  });

  it('keeps the inbox out of the application navigation', () => {
    // The inbox is reached from the header's inbox button, so it deliberately declares no menu entry.
    expect(
      applicationRoutes[0].routes.find((route) => route.name === 'inbox'),
    ).not.toHaveProperty('navigation');
  });
});

/** This application's own contribution, registered the way the client runtime registers it. */
function resolveRoutes() {
  return resolveAppClientContributions([
    {
      packageName: explorer.packageName,
      source: 'plugin',
      routes: explorer.routes,
    },
    {
      packageName: '@nocobase/app-template-default',
      routes: applicationRoutes,
      source: 'application',
    },
  ]);
}

/**
 * The paths of the pages a route tree registers. A menu group names no component, so it carries no path of its own
 * and inherits its parent's — filtering on `componentLoader` is what keeps that inherited path out of the list.
 */
function pagePaths(routes: readonly AppClientRegisteredRoute[]): string[] {
  return routes.flatMap((route) => [
    ...(route.componentLoader ? [route.path] : []),
    ...pagePaths(route.children ?? []),
  ]);
}

/** Every page loader in a tree, at any depth. */
function componentLoadersIn(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRouteComponentLoader[] {
  return routes.flatMap((route) => [
    ...(route.componentLoader ? [route.componentLoader] : []),
    ...componentLoadersIn(route.children ?? []),
  ]);
}

/** Page authorization comes directly from the registered tree. */
function pageAuthorizations(
  routes: readonly AppClientRegisteredRoute[],
): { name: string; authorizedAs: string | null }[] {
  return routes.flatMap((route) => [
    ...(route.componentLoader && route.auth === 'required'
      ? [
          {
            name: route.name,
            authorizedAs:
              route.authz === 'skip'
                ? null
                : route.authz === 'unrestricted'
                  ? 'unrestricted'
                  : route.authz.resource.type === 'page'
                    ? route.authz.resource.id
                    : `${route.authz.resource.type}:${route.authz.resource.id}`,
          },
        ]
      : []),
    ...pageAuthorizations(route.children ?? []),
  ]);
}
