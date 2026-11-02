import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
  type AppClientRouteComponentLoader,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import { lifecycleRoutes } from '@nocobase/app-plugin-lifecycle-example/client';
import applicationRoutes from '../../client/routes.ts';
import { buildRouteNavigation } from '../../client/routing/route-navigation.ts';

describe('app client routes', () => {
  it('keeps procurement and customer relations as separate protected route trees', () => {
    const routes = resolveRoutes().routes;
    const procurement = routes.find((route) => route.name === 'procurement');
    expect(procurement).toMatchObject({
      path: '/procurement',
      auth: 'required',
      authz: {
        resource: { type: 'page', id: 'procurement' },
        action: 'access',
      },
    });
    expect(procurement?.children?.map((route) => route.name)).toEqual([
      'procurement-new',
      'procurement-detail',
    ]);
    expect(
      routes.find((route) => route.name === 'customer-contacts'),
    ).toMatchObject({
      path: '/customer-contacts',
      auth: 'required',
      authz: {
        resource: { type: 'page', id: 'customer-contacts' },
        action: 'access',
      },
    });
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

  it('groups the public Agents settings pages without weakening their authorization', () => {
    const group = resolveRoutes().routes.find(
      (route) => route.name === 'agentsNavigation',
    )!;
    expect(group.componentLoader).toBeUndefined();
    expect(group.navigation?.title).toBe('onlineAgent.group');
    expect(group.children?.map((route) => route.name)).toEqual([
      'agents',
      'runtimes',
      'skills',
      'models',
      'ai-translation',
      'ai-structured-extraction',
      'ai-form-fill',
    ]);
    for (const name of ['agents', 'runtimes', 'skills']) {
      expect(
        group.children?.find((route) => route.name === name),
      ).toMatchObject({
        name,
        path: `/${name}`,
        auth: 'required',
        navigation: { title: `onlineAgent.${name}` },
        breadcrumb: { title: `onlineAgent.${name}` },
        authz: { resource: { type: 'page', id: name }, action: 'access' },
      });
    }
    expect(
      group.children?.find((route) => route.name === 'runtimes')?.children,
    ).toEqual([
      expect.objectContaining({
        name: 'runtimes-connect',
        path: '/runtimes/connect',
        auth: 'required',
        componentLoader: expect.any(Function),
      }),
    ]);
    expect(
      group.children?.find((route) => route.name === 'models'),
    ).toMatchObject({
      name: 'models',
      path: '/models',
      auth: 'required',
      navigation: { title: 'onlineAgent.models' },
      breadcrumb: { title: 'onlineAgent.models' },
      authz: {
        resource: { type: 'settings', id: 'agents.services' },
        action: 'read',
      },
    });
    expect(
      group.children?.find((route) => route.name === 'ai-translation'),
    ).toMatchObject({
      path: '/ai-translation',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'aiTranslation.title', icon: expect.any(Object) },
      breadcrumb: { title: 'aiTranslation.title' },
      componentLoader: expect.any(Function),
    });
    expect(
      group.children?.find(
        (route) => route.name === 'ai-structured-extraction',
      ),
    ).toMatchObject({
      path: '/ai-structured-extraction',
      auth: 'required',
      authz: 'skip',
      navigation: {
        title: 'structuredExtraction.title',
        icon: expect.anything(),
      },
      componentLoader: expect.any(Function),
    });
  });
  it('retains the public Skills creation and detail routes under its protected library', () => {
    const group = resolveRoutes().routes.find(
      (route) => route.name === 'agentsNavigation',
    );
    const library = group?.children?.find((route) => route.name === 'skills');
    expect(library?.children).toEqual([
      expect.objectContaining({
        name: 'skills-new',
        path: '/skills/new',
        auth: 'required',
        componentLoader: expect.any(Function),
      }),
      expect.objectContaining({
        name: 'skills-detail',
        path: '/skills/:skillId',
        auth: 'required',
        componentLoader: expect.any(Function),
      }),
    ]);
    expect(library?.children?.every((child) => !child.navigation)).toBe(true);
  });

  it('keeps the inbox out of the application navigation', () => {
    // The inbox is reached from the header's inbox button, so it deliberately declares no menu entry.
    expect(
      applicationRoutes[0].routes.find((route) => route.name === 'inbox'),
    ).not.toHaveProperty('navigation');
  });

  it('keeps workflow, user and role management in one system navigation group', () => {
    const navigation = buildRouteNavigation(resolveRoutes().routes, new Set());
    expect(navigation.some(({ route }) => route.name === 'settings')).toBe(
      false,
    );
    const management = navigation.find(
      ({ route }) => route.name === 'systemManagement',
    );
    expect(management?.children.map(({ route }) => route.name)).toEqual([
      'knowledge',
      'knowledgeIndexing',
      'workflows',
      'settingsUsers',
      'permissionManagement',
    ]);
    expect(
      management?.children.find(
        ({ route }) => route.name === 'knowledgeIndexing',
      )?.route,
    ).toMatchObject({
      path: '/knowledge/indexing',
      navigation: { title: 'knowledge.indexing' },
      authz: {
        resource: { type: 'settings', id: 'kb.indexing' },
        action: 'read',
      },
    });
    const permissions = management?.children.find(
      ({ route }) => route.name === 'permissionManagement',
    );
    expect(permissions?.children).toEqual([]);
    expect(permissions?.route.path).toBe('/roles');
  });

  it('pins the page authorization of every signed-in page', () => {
    // A stored page grant records the page's `authz` resource id (`authorizedAs`), not its route `name`: changing an
    // id is a data change that has to migrate the grants that reference it, not a refactor — so changing this list
    // deliberately is the point. A new page that requires sign-in adds an entry here, because a page that checks
    // access is a new grant somebody has to be given.
    const resolved = resolveRoutes();

    expect(pageAuthorizations(resolved.routes)).toEqual([
      ...['onboarding', 'onboarding-new', 'onboarding-detail'].map((name) => ({
        name,
        authorizedAs: 'onboarding',
      })),
      ...['procurement', 'procurement-new', 'procurement-detail'].map(
        (name) => ({ name, authorizedAs: 'procurement' }),
      ),
      ...[
        'customer-contacts',
        'customer-contacts-batch',
        'customer-contacts-detail',
        'customer-contacts-edit',
        'customer-contacts-new-contact',
        'customer-contacts-edit-contact',
      ].map((name) => ({ name, authorizedAs: 'customer-contacts' })),
      { name: 'skill-projects', authorizedAs: 'skill-projects' },
      { name: 'skill-projects-new', authorizedAs: 'skill-projects' },
      { name: 'skill-projects-edit', authorizedAs: 'skill-projects' },
      // The landing page opted out of page authorization, so it is reachable by every signed-in user.
      { name: 'home', authorizedAs: null },
      { name: 'inbox', authorizedAs: null },
      { name: 'routeOverlays', authorizedAs: 'routeOverlays' },
      // Overlay children are nested under a page, so the parent's check is the only one.
      { name: 'routeDialogExample', authorizedAs: null },
      { name: 'routeDialogDrawerExample', authorizedAs: null },
      { name: 'routeDrawerExample', authorizedAs: null },
      { name: 'routeDrawerDialogExample', authorizedAs: null },
      { name: 'routeChildPages', authorizedAs: null },
      { name: 'routeChildPageQuotation', authorizedAs: null },
      { name: 'routeChildPageDialog', authorizedAs: null },
      { name: 'routeChildPageOnboarding', authorizedAs: null },
      { name: 'routeChildPageRenewal', authorizedAs: null },
      { name: 'articles', authorizedAs: null },
      { name: 'numeric-examples', authorizedAs: 'numeric-examples' },
      { name: 'i18n-examples', authorizedAs: 'i18n-examples' },
      { name: 'external-crm', authorizedAs: 'external-crm' },
      { name: 'agents', authorizedAs: 'agents' },
      { name: 'runtimes', authorizedAs: 'runtimes' },
      { name: 'runtimes-connect', authorizedAs: 'runtimes' },
      { name: 'skills', authorizedAs: 'skills' },
      { name: 'skills-new', authorizedAs: 'skills' },
      { name: 'skills-detail', authorizedAs: 'skills' },
      { name: 'models', authorizedAs: 'settings:agents.services' },
      { name: 'ai-translation', authorizedAs: null },
      { name: 'ai-structured-extraction', authorizedAs: null },
      { name: 'ai-form-fill', authorizedAs: null },
      { name: 'knowledge', authorizedAs: 'knowledge' },
      { name: 'knowledgeIndexing', authorizedAs: 'settings:kb.indexing' },
      { name: 'workflows', authorizedAs: 'settings:workflow-management' },
      {
        name: 'workflowDefinitions',
        authorizedAs: 'settings:workflow-management',
      },
      {
        name: 'workflowDefinition',
        authorizedAs: 'settings:workflow-management',
      },
      {
        name: 'workflowParameters',
        authorizedAs: 'settings:workflow-management',
      },
      {
        name: 'workflowExecutions',
        authorizedAs: 'settings:workflow-management',
      },
      {
        name: 'workflowExecution',
        authorizedAs: 'settings:workflow-management',
      },
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
    ]);
  });
});

/** This application's own contribution, registered the way the client runtime registers it. */
function resolveRoutes() {
  return resolveAppClientContributions([
    {
      packageName: '@nocobase/app-template-examples',
      routes: applicationRoutes,
      source: 'application',
    },
    {
      packageName: '@nocobase/app-plugin-lifecycle-example',
      routes: lifecycleRoutes.map((contribution) => ({
        ...contribution,
        routes: contribution.routes.map((group) => ({
          ...group,
          children: [],
        })),
      })),
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
