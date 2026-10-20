import { describe, expect, it } from 'vitest';
import {
  resolveAppClientContributions,
  defineAppRoutes,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import applicationRoutes from '../../client/routes.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import {
  pagePermissionResources,
  pagePermissionTitle,
} from '../../client/pages/settings/page-permissions.js';
import { pagePermissionTitles } from '../../client/pages/settings/page-permission-titles.js';

const flatten = (
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] =>
  routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
const localized = (resource: unknown, key: string): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object'
          ? Reflect.get(value, part)
          : undefined,
      resource,
    );
const application = resolveAppClientContributions([
  {
    packageName: 'title-check-app',
    source: 'application',
    routes: applicationRoutes,
  },
]);
const pages = flatten(application.routes).filter(
  (route) =>
    route.source === 'application' &&
    route.componentLoader &&
    typeof route.authz === 'object' &&
    route.authz.resource.type === 'page',
);

describe('page permission labels', () => {
  it('names every application page permission and translates it in both languages', () => {
    const missing = pages
      .filter((route) => !pagePermissionTitle(route, pagePermissionTitles))
      .map((route) => route.name);
    expect(
      missing,
      'Add a navigation/breadcrumb title or a page-permission-titles entry; never rename authorization ids to fix labels.',
    ).toEqual([]);
    for (const route of pages) {
      const title = pagePermissionTitle(route, pagePermissionTitles);
      if (!title || typeof title === 'string')
        throw new Error(`Missing permission title: ${route.name}`);
      for (const locale of [enUS, zhCN]) {
        const value = localized(locale, title.key);
        expect(value, `${route.name}: ${title.key}`).toBeTypeOf('string');
        expect(String(value).trim()).not.toBe('');
        expect(value).not.toBe(title.key);
        expect(value).not.toBe(route.id);
        expect(String(value)).not.toContain('{{');
      }
    }
    const names = new Set(
      flatten(application.routes).map((route) => route.name),
    );
    for (const name of Object.keys(pagePermissionTitles))
      expect(names.has(name), `Stale permission title: ${name}`).toBe(true);
  });

  it('preserves each unique application page-resource identity', () => {
    const expected = pages.map((route) => {
      if (typeof route.authz !== 'object')
        throw new Error('Expected page authorization');
      return { type: 'page', id: route.authz.resource.id, actions: ['access'] };
    });
    expect(
      pagePermissionResources(
        application.routes,
        pagePermissionTitles,
        (path) => `Unnamed (${path})`,
      ).map(({ type, id, actions }) => ({
        type,
        id,
        actions: actions.map((action) => action.name),
      })),
    ).toEqual([
      ...new Map(expected.map((resource) => [resource.id, resource])).values(),
    ]);
  });

  const fixture = () =>
    resolveAppClientContributions([
      {
        packageName: 'private-app',
        source: 'application',
        routes: [
          {
            parent: 'app',
            routes: [
              {
                name: 'expenses',
                path: '/expenses',
                auth: 'required',
                authz: {
                  resource: { type: 'page', id: 'legacy-expenses' },
                  action: 'access',
                },
                navigation: { title: 'expenses.title' },
                componentLoader: async () => ({ default: () => null }),
                children: [
                  {
                    name: 'expenseEdit',
                    path: ':id/edit',
                    authz: {
                      resource: { type: 'page', id: 'legacy-edit' },
                      action: 'access',
                    },
                    componentLoader: async () => ({ default: () => null }),
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

  it('names an overlay without adding navigation/breadcrumbs or changing resources', () => {
    const input = fixture();
    const route = input.routes[0]!.children![0]!;
    const identities = flatten(input.routes).map(
      ({ id, name, path, authz }) => ({ id, name, path, authz }),
    );
    const result = pagePermissionResources(
      input.routes,
      { expenseEdit: 'expenses.editTitle' },
      (path) => `Unnamed (${path})`,
    );
    expect(result.map(({ id, actions }) => ({ id, actions }))).toEqual([
      {
        id: 'legacy-expenses',
        actions: [{ name: 'access', title: { key: 'settings.access' } }],
      },
      {
        id: 'legacy-edit',
        actions: [{ name: 'access', title: { key: 'settings.access' } }],
      },
    ]);
    expect(result[1]!.title).toEqual({
      key: 'expenses.editTitle',
      ns: 'private-app',
    });
    expect(route.navigation).toBeUndefined();
    expect(route.breadcrumb).toBeUndefined();
    expect(
      flatten(input.routes).map(({ id, name, path, authz }) => ({
        id,
        name,
        path,
        authz,
      })),
    ).toEqual(identities);
    expect(
      pagePermissionResources(
        input.routes,
        { expenseEdit: 'expenses.editTitle' },
        (path) => `Unnamed (${path})`,
      ),
    ).toEqual(result);
  });

  it('reports missing metadata and renders a localized fallback without dropping the permission', () => {
    const input = fixture();
    const overlay = input.routes[0]!.children![0]!;
    expect(pagePermissionTitle(overlay, {})).toBeUndefined();
    const resources = pagePermissionResources(
      input.routes,
      {},
      (path) => `未命名页面（${path}）`,
    );
    expect(resources[1]!.id).toBe('legacy-edit');
    expect(resources[1]!.title).toBe('未命名页面（/expenses/:id/edit）');
    expect(resources[1]!.title).not.toContain('private-app:');
  });

  it('does not treat object prototype properties as configured labels', () => {
    const route = fixture().routes[0]!.children![0]!;
    expect(
      pagePermissionTitle({ ...route, name: 'constructor' }, {}),
    ).toBeUndefined();
    expect(
      pagePermissionTitle({ ...route, name: 'toString' }, {}),
    ).toBeUndefined();
  });

  it('does not apply application-name overrides to plugin routes or expose non-page resources', () => {
    const input = fixture();
    const overlay = input.routes[0]!.children![0]!;
    expect(
      pagePermissionTitle(
        { ...overlay, source: 'plugin', packageName: 'plugin' },
        { expenseEdit: 'expenses.editTitle' },
      ),
    ).toBeUndefined();
    expect(
      pagePermissionResources(
        [
          { ...overlay, authz: 'skip' },
          {
            ...overlay,
            authz: {
              resource: { type: 'settings', id: 'members' },
              action: 'read',
            },
          },
        ],
        {},
        () => 'Unnamed',
      ),
    ).toEqual([]);
  });
});

it('lists inherited and repeated page resources once while retaining independent child grants', () => {
  const input = resolveAppClientContributions([
    {
      packageName: 'shared-pages',
      source: 'application',
      routes: defineAppRoutes([
        {
          name: 'repairs',
          path: '/repairs',
          authz: {
            resource: { type: 'page', id: 'repairs' },
            action: 'access',
          },
          navigation: { title: 'repairs.mine' },
          componentLoader: async () => ({ default: () => null }),
          children: [
            {
              name: 'repairCreate',
              path: 'create',
              componentLoader: async () => ({ default: () => null }),
            },
            {
              name: 'repairDetail',
              path: ':id',
              componentLoader: async () => ({ default: () => null }),
              children: [
                {
                  name: 'repairConfirm',
                  path: 'confirm',
                  componentLoader: async () => ({ default: () => null }),
                },
              ],
            },
            {
              name: 'repairAudit',
              path: 'audit',
              authz: {
                resource: { type: 'page', id: 'repair-audit' },
                action: 'access',
              },
              navigation: { title: 'repairs.audit' },
              componentLoader: async () => ({ default: () => null }),
            },
          ],
        },
        {
          name: 'repairsAlias',
          path: '/repairs-alias',
          authz: {
            resource: { type: 'page', id: 'repairs' },
            action: 'access',
          },
          componentLoader: async () => ({ default: () => null }),
        },
      ]),
    },
  ]);
  const before = flatten(input.routes).map(({ id, name, authz }) => ({
    id,
    name,
    authz,
  }));
  const result = pagePermissionResources(
    input.routes,
    {},
    (path) => `Unnamed (${path})`,
  );
  expect(result.map(({ id }) => id)).toEqual(['repairs', 'repair-audit']);
  expect(result[0]!.title).toEqual({ key: 'repairs.mine', ns: 'shared-pages' });
  expect(
    flatten(input.routes).map(({ id, name, authz }) => ({ id, name, authz })),
  ).toEqual(before);
  expect(
    pagePermissionResources(input.routes, {}, (path) => `Unnamed (${path})`),
  ).toEqual(result);
});
