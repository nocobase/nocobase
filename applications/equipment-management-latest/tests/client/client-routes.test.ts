import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteComponentLoader,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import applicationRoutes from '../../client/routes.ts';

describe('app client routes', () => {
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

  it('pins the page authorization of every signed-in page', () => {
    // A stored page grant records the page's `authz` resource id (`authorizedAs`), not its route `name`: changing an
    // id is a data change that has to migrate the grants that reference it, not a refactor — so changing this list
    // deliberately is the point. A new page that requires sign-in adds an entry here, because a page that checks
    // access is a new grant somebody has to be given.
    const resolved = resolveRoutes();

    const assetPages = (prefix: string) => [
      prefix + 'Asset', prefix + 'AssetEdit', prefix + 'AssetAction', prefix + 'AssetRequest',
    ];
    const group = (authorizedAs: string | null, names: string[]) => names.map((name) => ({name, authorizedAs}));
    const expected = [
      ...group(null, ['home', ...assetPages('home'), 'inbox']),
      ...group('equipment', ['equipment', 'equipmentDirectEdit', 'equipmentNew', 'equipmentImport', ...assetPages('equipment')]),
      ...group('myEquipment', ['myEquipment', 'myEquipmentDirectEdit', ...assetPages('myEquipment')]),
      ...group('operations', ['operations', 'operationsNew', 'operationsDetail', 'operationsHandle', ...assetPages('operations')]),
      ...group('maintenance', ['maintenance', 'maintenanceNew', 'maintenanceDetail', 'maintenanceHandle', ...assetPages('maintenance')]),
      ...group('stocktakes', ['stocktakes', 'stocktakesNew', 'stocktakesDetail', 'stocktakesHandle', 'stocktakesObserve', ...assetPages('stocktakes')]),
      ...group('referenceData', ['referenceData', 'referenceNew', 'referenceEdit']),
      ...group('settings:equipment.workflows', ['workflows', 'workflowDefinitions', 'workflowDefinitionDetail', 'workflowExecutions', 'workflowExecutionDetail']),
      ...group('user:*', ['settingsUsers', 'settingsUserCreate', 'settingsUser', 'settingsUserEdit']),
      ...group('settings:authorization.permission-sets', ['settingsRoles', 'settingsRoleCreate', 'settingsRoleEdit']),
      ...group('settings:authorization.default-access', ['settingsDefaultAccess', 'settingsDefaultAccessCreate', 'settingsDefaultAccessEdit']),
    ];
    const byName = (a: {name: string}, b: {name: string}) => a.name.localeCompare(b.name);
    expect(pageAuthorizations(resolved.routes).sort(byName)).toEqual(expected.sort(byName));
  });

  it('registers business and administration entries once with inherited child grants', () => {
    const paths = pagePaths(resolveRoutes().routes);
    expect(paths).toEqual(expect.arrayContaining([
      '/equipment', '/myEquipment', '/operations', '/maintenance', '/stocktakes', '/referenceData',
      '/settings/users', '/settings/roles', '/settings/default-access', '/settings/workflows/definitions', '/settings/workflows/executions',
    ]));
    expect(new Set(paths).size).toBe(paths.length);
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
