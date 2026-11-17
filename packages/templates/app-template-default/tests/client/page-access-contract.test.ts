import { describe, expect, it } from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { createApplicationRoutes } from '../../client/routes.js';
import {
  pagePermissionNavigation,
  pagePermissionResources,
} from '../../client/pages/settings/page-permissions.js';
import { pagePermissionTitles } from '../../client/pages/settings/page-permission-titles.js';

// Every exemption must remain intentional and reviewable when a generated app adds business pages.
const authenticatedOnly = {
  inbox: 'Self-service notifications are checked by their owning API.',
} as const;

// Add sibling route names here only when they intentionally share one stored page grant.
const sharedPageGrants: Readonly<Record<string, readonly string[]>> = {};

function pageAccessIssues(
  routes: readonly AppClientRegisteredRoute[],
): string[] {
  const issues: string[] = [];
  const seenExemptions = new Set<string>();
  const pageOwners = new Map<string, string>();
  const visit = (
    items: readonly AppClientRegisteredRoute[],
    inSettings = false,
    protectedAncestor = false,
    ancestorPageId?: string,
  ): void => {
    for (const route of items) {
      const settings =
        inSettings ||
        (route.source === 'application' &&
          ['settings', 'systemManagement'].includes(route.name));
      const pageResource =
        typeof route.authz === 'object' && route.authz.resource.type === 'page';
      const protectedPage = pageResource && route.authz.action === 'access';
      const pageId = pageResource ? route.authz.resource.id : undefined;
      if (pageResource && !protectedPage)
        issues.push(`${route.name}: page permission must use access`);
      if (
        route.source === 'application' &&
        route.auth === 'required' &&
        route.componentLoader &&
        pageId &&
        pageId !== ancestorPageId
      ) {
        const owner = pageOwners.get(pageId);
        if (
          owner &&
          ![owner, route.name].every((name) =>
            sharedPageGrants[pageId]?.includes(name),
          )
        )
          issues.push(
            `${route.name}: page id ${pageId} is already owned by ${owner}`,
          );
        else if (!owner) pageOwners.set(pageId, route.name);
      }
      if (
        route.source === 'application' &&
        route.auth === 'required' &&
        route.componentLoader &&
        !settings
      ) {
        if (Object.hasOwn(authenticatedOnly, route.name)) {
          seenExemptions.add(route.name);
          if (route.authz !== 'skip')
            issues.push(`${route.name}: obsolete authenticated-only exemption`);
        } else if (
          route.authz === 'unrestricted' ||
          (!protectedPage && !protectedAncestor)
        ) {
          issues.push(
            `${route.name}: business entry ${route.path} needs page access or a documented exemption`,
          );
        }
      }
      visit(
        route.children ?? [],
        settings,
        protectedAncestor || protectedPage,
        pageId ?? ancestorPageId,
      );
    }
  };
  visit(routes);
  for (const name of Object.keys(authenticatedOnly)) {
    if (!seenExemptions.has(name)) issues.push(`${name}: stale exemption`);
  }
  return issues;
}

function businessPageIds(
  routes: readonly AppClientRegisteredRoute[],
): string[] {
  const ids = new Set<string>();
  const visit = (
    items: readonly AppClientRegisteredRoute[],
    inSettings = false,
  ) => {
    for (const route of items) {
      const settings =
        inSettings ||
        (route.source === 'application' &&
          ['settings', 'systemManagement'].includes(route.name));
      if (
        !settings &&
        route.source === 'application' &&
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page'
      )
        ids.add(route.authz.resource.id);
      visit(route.children ?? [], settings);
    }
  };
  visit(routes);
  return [...ids];
}

function pageRowIds(
  nodes: ReturnType<typeof pagePermissionNavigation>,
): string[] {
  return nodes.flatMap((node) => [
    ...(node.rowId ? [node.rowId] : []),
    ...pageRowIds(node.children ?? []),
  ]);
}

const resolve = (routes: ReturnType<typeof createApplicationRoutes>) =>
  resolveAppClientContributions([
    {
      packageName: '@nocobase/app-template-default',
      source: 'application',
      routes,
    },
  ]).routes;

describe('generated application page access contract', () => {
  it('keeps every business entry in Page access across optional route configurations', () => {
    for (const invitationConfigured of [false, true]) {
      const routes = resolve(
        createApplicationRoutes({
          notificationTemplates: { invitationConfigured },
        }),
      );
      expect(pageAccessIssues(routes)).toEqual([]);
      const pages = pagePermissionResources(
        routes,
        pagePermissionTitles,
        (path) => path,
      );
      expect(pages.filter((page) => page.id === 'home')).toHaveLength(1);
      const rows = pageRowIds(
        pagePermissionNavigation(
          routes,
          pagePermissionTitles,
          (path) => path,
          (title) => (typeof title === 'string' ? title : title.key),
        ),
      );
      for (const id of businessPageIds(routes))
        expect(
          rows.filter((row) => row === JSON.stringify(['page', id, 'access'])),
        ).toHaveLength(1);
    }
  });

  it('fails when a newly built business page silently skips page access', () => {
    const routes = resolve([
      ...createApplicationRoutes({}),
      defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'orders.title' },
          componentLoader: async () => ({ default: () => null }),
        },
      ]),
    ]);
    expect(pageAccessIssues(routes)).toContain(
      'orders: business entry /orders needs page access or a documented exemption',
    );
  });

  it('fails when unrelated business entries accidentally share one control', () => {
    const routes = resolve([
      ...createApplicationRoutes({}),
      defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          auth: 'required',
          authz: { resource: { type: 'page', id: 'home' }, action: 'access' },
          navigation: { title: 'orders.title' },
          componentLoader: async () => ({ default: () => null }),
        },
      ]),
    ]);
    expect(pageAccessIssues(routes)).toContain(
      'orders: page id home is already owned by home',
    );
  });

  it('fails when a business page reuses a configuration page control', () => {
    const routes = resolve([
      ...createApplicationRoutes({
        notificationTemplates: { invitationConfigured: true },
      }),
      defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          auth: 'required',
          authz: {
            resource: { type: 'page', id: 'notification.templates' },
            action: 'access',
          },
          navigation: { title: 'orders.title' },
          componentLoader: async () => ({ default: () => null }),
        },
      ]),
    ]);
    expect(pageAccessIssues(routes)).toEqual([
      expect.stringContaining(
        'page id notification.templates is already owned by',
      ),
    ]);
  });

  it('fails when a nested page checks an action absent from the page editor', () => {
    const routes = resolve([
      ...createApplicationRoutes({}),
      defineAppRoutes([
        {
          name: 'orders',
          path: '/orders',
          auth: 'required',
          authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
          navigation: { title: 'orders.title' },
          componentLoader: async () => ({ default: () => null }),
          children: [
            {
              name: 'orderDetail',
              path: ':id',
              auth: 'required',
              authz: {
                resource: { type: 'page', id: 'orderDetail' },
                action: 'read',
              },
              componentLoader: async () => ({ default: () => null }),
            },
          ],
        },
      ]),
    ]);
    expect(pageAccessIssues(routes)).toContain(
      'orderDetail: page permission must use access',
    );
  });
});
