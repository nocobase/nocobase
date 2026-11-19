import { describe, expect, it } from 'vitest';
import {
  defineAppRoutes,
  defineSettingsRoutes,
  isSettingsRoute,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '../src/plugins.js';

const page = async () => ({ default: () => null });

const categories = {
  packageName: '@example/app',
  source: 'application' as const,
  routes: defineSettingsRoutes([
    {
      name: 'account',
      navigation: { title: 'settings.account', order: 10 },
      children: [],
    },
    {
      name: 'system',
      navigation: { title: 'settings.system', order: 20 },
      children: [],
    },
  ]),
};

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

describe('defineSettingsRoutes', () => {
  it('mounts pages under /settings in the shared route tree, keeping the category out of the URL', () => {
    const { routes } = resolveAppClientContributions([
      {
        packageName: '@example/app',
        source: 'application',
        routes: defineAppRoutes([
          { name: 'home', path: '/', authz: 'skip', componentLoader: page },
        ]),
      },
      categories,
      {
        packageName: '@example/plugin',
        routes: defineSettingsRoutes([
          {
            parent: 'system',
            name: 'storage',
            path: '/storage',
            navigation: { title: 'Storage' },
            componentLoader: page,
            children: [
              { name: 'storageItem', path: ':id', componentLoader: page },
            ],
          },
        ]),
      },
    ]);
    expect(
      routes.map((route) => [route.id, route.path, route.surface]),
    ).toEqual([
      ['@example/app:home', '/', undefined],
      ['@example/app:account', '/settings', 'settings'],
      ['@example/app:system', '/settings', 'settings'],
    ]);
    const storage = flatten(routes).find((route) => route.name === 'storage');
    expect(storage).toMatchObject({
      id: '@example/plugin:storage',
      path: '/settings/storage',
      packageName: '@example/plugin',
      surface: 'settings',
      auth: 'required',
      authz: 'unrestricted',
    });
    expect(storage?.children?.[0]).toMatchObject({
      path: '/settings/storage/:id',
      surface: 'settings',
      authz: 'unrestricted',
    });
    expect(isSettingsRoute(storage!)).toBe(true);
    expect(isSettingsRoute(routes[0]!)).toBe(false);
  });

  it('mounts a root page at /settings itself and keeps package-scoped groups addressable', () => {
    const { routes } = resolveAppClientContributions([
      {
        packageName: '@example/app',
        source: 'application',
        routes: defineSettingsRoutes([
          {
            name: 'settingsHome',
            path: '/',
            authz: 'skip',
            componentLoader: page,
          },
          {
            name: 'account',
            navigation: { title: 'Account' },
            children: [
              {
                name: 'permissions',
                path: '/permissions',
                navigation: { title: 'Permissions' },
                children: [
                  {
                    name: 'roles',
                    path: 'roles',
                    navigation: { title: 'Roles' },
                    componentLoader: page,
                  },
                ],
              },
            ],
          },
        ]),
      },
      {
        packageName: '@example/plugin',
        routes: defineSettingsRoutes([
          {
            parent: '@example/app:permissions',
            name: 'rules',
            path: 'rules',
            navigation: { title: 'Rules' },
            componentLoader: page,
          },
        ]),
      },
    ]);
    const paths = flatten(routes).map((route) => [route.name, route.path]);
    expect(paths).toEqual([
      ['settingsHome', '/settings'],
      ['account', '/settings'],
      ['permissions', '/settings/permissions'],
      ['roles', '/settings/permissions/roles'],
      ['rules', '/settings/permissions/rules'],
    ]);
  });

  it('orders a plugin page in its category regardless of registration order', () => {
    const plugin = {
      packageName: '@example/plugin',
      routes: defineSettingsRoutes([
        {
          parent: 'account',
          name: 'apiKeys',
          path: '/api-keys',
          navigation: { title: 'API keys', order: 5 },
          componentLoader: page,
        },
      ]),
    };
    for (const contributions of [
      [plugin, categories],
      [categories, plugin],
    ]) {
      const { routes } = resolveAppClientContributions(contributions);
      expect(routes[0]?.children?.map((route) => route.path)).toEqual([
        '/settings/api-keys',
      ]);
    }
  });

  it('rejects a missing category, a duplicate category and nesting across surfaces', () => {
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@example/plugin',
          routes: defineSettingsRoutes([
            {
              parent: 'missing',
              name: 'orphan',
              path: '/orphan',
              componentLoader: page,
            },
          ]),
        },
      ]),
    ).toThrow(/missing settings category "missing"/);
    expect(() =>
      resolveAppClientContributions([
        categories,
        {
          packageName: '@example/plugin',
          routes: defineSettingsRoutes([
            { name: 'system', navigation: { title: 'System' }, children: [] },
          ]),
        },
      ]),
    ).toThrow(/Settings category "system".*already registered/);
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@example/app',
          routes: defineAppRoutes([
            { name: 'tools', navigation: { title: 'Tools' }, children: [] },
          ]),
        },
        {
          packageName: '@example/app',
          routes: defineSettingsRoutes([
            {
              parent: '@example/app:tools',
              name: 'misplaced',
              path: '/misplaced',
              componentLoader: page,
            },
          ]),
        },
      ]),
    ).toThrow(/cannot join app group .*defineAppRoutes\(\)/);
  });

  it('rejects a path claimed by both surfaces', () => {
    expect(() =>
      resolveAppClientContributions([
        categories,
        {
          packageName: '@example/a',
          routes: defineSettingsRoutes([
            {
              parent: 'system',
              name: 'one',
              path: '/same',
              componentLoader: page,
            },
          ]),
        },
        {
          packageName: '@example/b',
          routes: defineSettingsRoutes([
            {
              parent: 'account',
              name: 'two',
              path: '/same',
              componentLoader: page,
            },
          ]),
        },
      ]),
    ).toThrow(/Client route path "\/settings\/same".*conflicts/);
  });
});
