import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defineAppRoutes,
  definePersonalSettingsRoutes,
  defineSettingsCategories,
  defineSystemSettingsRoutes,
  isPersonalSettingsRoute,
  isSystemSettingsRoute,
  PERSONAL_SETTINGS_CATEGORIES,
  resolveAppClientContributions,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientContributions,
  type AppClientRegisteredRoute,
} from '../src/plugins.js';

const page = async () => ({ default: () => null });

const app: AppClientContributions = {
  packageName: '@example/app',
  source: 'application',
  routes: defineAppRoutes([
    { name: 'home', path: '/', authz: 'skip', componentLoader: page },
  ]),
};

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

function settingsPage(
  parent: string,
  name: string,
  order?: number,
): AppClientContributions['routes'] {
  return defineSystemSettingsRoutes([
    {
      parent,
      name,
      path: `/${name}`,
      navigation: { title: name, ...(order !== undefined ? { order } : {}) },
      componentLoader: page,
    },
  ]);
}

/** Each category of the system settings surface, in menu order, with the names of its children. */
function systemMenu(
  routes: readonly AppClientRegisteredRoute[],
): [string | undefined, string[]][] {
  return routes
    .filter(
      (route) => route.kind === 'category' && isSystemSettingsRoute(route),
    )
    .map((route) => [
      route.category,
      (route.children ?? []).map((child) => child.name),
    ]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('defineSystemSettingsRoutes', () => {
  it('mounts pages under /settings in the shared route tree, keeping the category out of the URL', () => {
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/plugin',
        routes: defineSystemSettingsRoutes([
          {
            parent: SYSTEM_SETTINGS_CATEGORIES.system,
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
    expect(routes[0]).toMatchObject({ id: '@example/app:home', path: '/' });
    const storage = flatten(routes).find((route) => route.name === 'storage');
    expect(storage).toMatchObject({
      id: '@example/plugin:storage',
      path: '/settings/storage',
      packageName: '@example/plugin',
      surface: 'systemSettings',
      auth: 'required',
      authz: 'unrestricted',
    });
    expect(storage?.children?.[0]).toMatchObject({
      path: '/settings/storage/:id',
      surface: 'systemSettings',
      authz: 'unrestricted',
    });
    expect(isSystemSettingsRoute(storage!)).toBe(true);
    expect(isSystemSettingsRoute(routes[0]!)).toBe(false);
  });

  it('starts with the built-in categories, titled in the application namespace and in a fixed order', () => {
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/plugin',
        routes: settingsPage(SYSTEM_SETTINGS_CATEGORIES.ai, 'models'),
      },
    ]);
    const categories = routes.filter((route) => route.kind === 'category');
    expect(
      categories.map((route) => [
        route.id,
        route.category,
        route.path,
        route.navigation?.title,
        route.navigation?.order,
      ]),
    ).toEqual([
      [
        '@example/app:systemSettings.account',
        'account',
        '/settings',
        'settings.categories.account',
        100,
      ],
      [
        '@example/app:systemSettings.automation',
        'automation',
        '/settings',
        'settings.categories.automation',
        200,
      ],
      [
        '@example/app:systemSettings.messages',
        'messages',
        '/settings',
        'settings.categories.messages',
        300,
      ],
      [
        '@example/app:systemSettings.ai',
        'ai',
        '/settings',
        'settings.categories.ai',
        400,
      ],
      [
        '@example/app:systemSettings.data',
        'data',
        '/settings',
        'settings.categories.data',
        500,
      ],
      [
        '@example/app:systemSettings.system',
        'system',
        '/settings',
        'settings.categories.system',
        600,
      ],
      [
        '@example/app:systemSettings.other',
        'other',
        '/settings',
        'settings.categories.other',
        900,
      ],
    ]);
    expect(Object.values(SYSTEM_SETTINGS_CATEGORIES)).toEqual(
      categories.map((route) => route.category),
    );
    // A surface nobody contributes to gets no categories.
    expect(routes.some(isPersonalSettingsRoute)).toBe(false);
  });

  it('lets a plugin add a category between built-in ones and rejects one that repeats a category', () => {
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/multi-app',
        routes: defineSystemSettingsRoutes([
          {
            name: 'multiApp',
            category: true,
            navigation: { title: 'multiApp.title', order: 650 },
            children: [],
          },
          {
            parent: 'multiApp',
            name: 'instances',
            path: '/instances',
            navigation: { title: 'Instances' },
            componentLoader: page,
          },
        ]),
      },
    ]);
    expect(systemMenu(routes).map(([id]) => id)).toEqual([
      'account',
      'automation',
      'messages',
      'ai',
      'data',
      'system',
      'multiApp',
      'other',
    ]);
    expect(
      flatten(routes).find((route) => route.name === 'multiApp'),
    ).toMatchObject({
      id: '@example/multi-app:multiApp',
      kind: 'category',
      category: 'multiApp',
    });
    expect(() =>
      resolveAppClientContributions([
        app,
        {
          packageName: '@example/plugin',
          routes: defineSystemSettingsRoutes([
            {
              name: 'system',
              category: true,
              navigation: { title: 'System' },
              children: [],
            },
          ]),
        },
      ]),
    ).toThrow(/System settings category "system".*is built in/);
    const finance = (packageName: string): AppClientContributions => ({
      packageName,
      routes: defineSystemSettingsRoutes([
        {
          name: 'finance',
          category: true,
          navigation: { title: 'Finance' },
          children: [],
        },
      ]),
    });
    expect(() =>
      resolveAppClientContributions([
        app,
        finance('@example/a'),
        finance('@example/b'),
      ]),
    ).toThrow(
      /System settings category "finance" from plugin "@example\/b" is already registered by "@example\/a"/,
    );
  });

  it('requires a settings group to be a root category or a module', () => {
    expect(() =>
      resolveAppClientContributions([
        app,
        {
          packageName: '@example/plugin',
          routes: defineSystemSettingsRoutes([
            {
              parent: 'account',
              name: 'permissions',
              navigation: { title: 'Permissions' },
              children: [],
            },
          ]),
        },
      ]),
    ).toThrow(/group "permissions".*category: true.*kind: 'module'/);
    expect(() =>
      resolveAppClientContributions([
        app,
        {
          packageName: '@example/plugin',
          routes: defineSystemSettingsRoutes([
            {
              parent: 'account',
              name: 'nested',
              category: true,
              navigation: { title: 'Nested' },
              children: [],
            },
          ]),
        },
      ]),
    ).toThrow(/category "nested".*at the root, without parent/);
    expect(() =>
      resolveAppClientContributions([
        app,
        {
          packageName: '@example/plugin',
          routes: defineSystemSettingsRoutes([
            {
              name: 'loose',
              kind: 'module',
              navigation: { title: 'Loose' },
              children: [],
            },
          ]),
        },
      ]),
    ).toThrow(/module "loose".*must name its category with parent/);
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@example/app',
          source: 'application',
          routes: defineAppRoutes([
            {
              name: 'tools',
              category: true,
              navigation: { title: 'Tools' },
              children: [],
            },
          ]),
        },
      ]),
    ).toThrow(/cannot declare category or kind/);
  });

  it('mounts a root page at /settings itself and keeps package-scoped modules addressable', () => {
    const { routes } = resolveAppClientContributions([
      {
        packageName: '@example/app',
        source: 'application',
        routes: defineSystemSettingsRoutes([
          {
            name: 'settingsHome',
            path: '/',
            authz: 'skip',
            componentLoader: page,
          },
          {
            parent: 'account',
            name: 'permissions',
            kind: 'module',
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
        ]),
      },
      {
        packageName: '@example/plugin',
        routes: defineSystemSettingsRoutes([
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
    const all = flatten(routes);
    expect(
      all
        .filter((route) => route.kind !== 'category')
        .map((route) => [route.name, route.path, route.kind]),
    ).toEqual([
      ['settingsHome', '/settings', undefined],
      ['permissions', '/settings/permissions', 'module'],
      ['roles', '/settings/permissions/roles', undefined],
      ['rules', '/settings/permissions/rules', undefined],
    ]);
    expect(systemMenu(routes)[0]).toEqual(['account', ['permissions']]);
  });

  it('orders a plugin page in its category regardless of registration order', () => {
    const plugin = {
      packageName: '@example/plugin',
      routes: settingsPage('account', 'apiKeys', 5),
    };
    const own = {
      packageName: '@example/app',
      source: 'application' as const,
      routes: settingsPage('account', 'users', 1),
    };
    for (const contributions of [
      [plugin, own],
      [own, plugin],
    ]) {
      const { routes } = resolveAppClientContributions(contributions);
      expect(systemMenu(routes)[0]).toEqual(['account', ['users', 'apiKeys']]);
    }
  });

  it('shows a page with an unknown category under other, with a development warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/sms',
        routes: settingsPage('sms', 'gateway'),
      },
    ]);
    expect(systemMenu(routes).at(-1)).toEqual(['other', ['gateway']]);
    expect(
      flatten(routes).find((route) => route.name === 'gateway')?.path,
    ).toBe('/settings/gateway');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /route "gateway" from "@example\/sms" references unknown category "sms"; showing it under "other"/,
      ),
    );
  });

  it('lets the application rename, reorder and hide a category without changing its id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/app',
        source: 'application',
        routes: defineSettingsCategories('systemSettings', {
          system: { title: 'settings.administration' },
          ai: { order: 50 },
          messages: { hidden: true },
          unknown: { order: 1 },
        }),
      },
      {
        packageName: '@example/plugin',
        routes: defineSystemSettingsRoutes([
          ...settingsPage('messages', 'mail').routes,
          ...settingsPage('system', 'plugins').routes,
          ...settingsPage('ai', 'models').routes,
        ]),
      },
    ]);
    const menu = systemMenu(routes);
    expect(menu.map(([id]) => id)).toEqual([
      'ai',
      'account',
      'automation',
      'data',
      'system',
      'other',
    ]);
    expect(menu.at(-1)).toEqual(['other', ['mail']]);
    expect(
      routes.find((route) => route.category === 'system')?.navigation?.title,
    ).toBe('settings.administration');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/category "unknown", which nobody declares/),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /route "mail" .* is in category "messages", which the application hides/,
      ),
    );
  });

  it('keeps category changes to the application and never hides other', () => {
    expect(() =>
      resolveAppClientContributions([
        app,
        {
          packageName: '@example/plugin',
          routes: defineSettingsCategories('systemSettings', {
            ai: { order: 1 },
          }),
        },
      ]),
    ).toThrow(/Plugin "@example\/plugin" cannot change settings categories/);
    expect(() =>
      defineSettingsCategories('systemSettings', { other: { hidden: true } }),
    ).toThrow(/category "other" cannot be hidden/);
  });

  it('rejects nesting across surfaces and a path claimed twice', () => {
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
          routes: defineSystemSettingsRoutes([
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
    expect(() =>
      resolveAppClientContributions([
        app,
        { packageName: '@example/a', routes: settingsPage('system', 'same') },
        { packageName: '@example/b', routes: settingsPage('account', 'same') },
      ]),
    ).toThrow(/Client route path "\/settings\/same".*conflicts/);
  });
});

describe('definePersonalSettingsRoutes', () => {
  it('mounts pages under /me, open to every signed-in person by default', () => {
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/plugin',
        routes: definePersonalSettingsRoutes([
          {
            parent: PERSONAL_SETTINGS_CATEGORIES.preferences,
            name: 'appearance',
            path: '/appearance',
            navigation: { title: 'Appearance' },
            componentLoader: page,
          },
        ]),
      },
    ]);
    const appearance = flatten(routes).find(
      (route) => route.name === 'appearance',
    );
    expect(appearance).toMatchObject({
      path: '/me/appearance',
      surface: 'personalSettings',
      auth: 'required',
      authz: 'skip',
    });
    expect(isPersonalSettingsRoute(appearance!)).toBe(true);
    expect(isSystemSettingsRoute(appearance!)).toBe(false);
    expect(
      routes
        .filter((route) => route.kind === 'category')
        .map((route) => [route.id, route.navigation?.title]),
    ).toEqual([
      [
        '@example/app:personalSettings.account',
        'settings.personal.categories.account',
      ],
      [
        '@example/app:personalSettings.preferences',
        'settings.personal.categories.preferences',
      ],
      [
        '@example/app:personalSettings.other',
        'settings.personal.categories.other',
      ],
    ]);
  });

  it('keeps a declared authz on a personal settings page', () => {
    const { routes } = resolveAppClientContributions([
      app,
      {
        packageName: '@example/plugin',
        routes: definePersonalSettingsRoutes([
          {
            parent: 'account',
            name: 'tokens',
            path: '/tokens',
            authz: {
              resource: { type: 'settings', id: 'tokens' },
              action: 'read',
            },
            componentLoader: page,
          },
        ]),
      },
    ]);
    expect(
      flatten(routes).find((route) => route.name === 'tokens')?.authz,
    ).toEqual({ resource: { type: 'settings', id: 'tokens' }, action: 'read' });
  });

  it("keeps each surface's categories apart", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // A personal settings page cannot name a system settings category: it lands in personal settings' other.
    const { routes } = resolveAppClientContributions([
      app,
      { packageName: '@example/plugin', routes: settingsPage('ai', 'models') },
      {
        packageName: '@example/plugin',
        routes: definePersonalSettingsRoutes([
          {
            parent: 'ai',
            name: 'misplaced',
            path: '/misplaced',
            componentLoader: page,
          },
        ]),
      },
    ]);
    expect(
      flatten(routes).find((route) => route.name === 'misplaced')?.path,
    ).toBe('/me/misplaced');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/Personal settings route "misplaced".*"ai"/),
    );
    expect(() =>
      resolveAppClientContributions([
        app,
        {
          packageName: '@example/app',
          routes: defineSystemSettingsRoutes([
            {
              parent: 'system',
              name: 'shared',
              kind: 'module',
              navigation: { title: 'Shared' },
              children: [],
            },
          ]),
        },
        {
          packageName: '@example/app',
          routes: definePersonalSettingsRoutes([
            {
              parent: '@example/app:shared',
              name: 'crossing',
              path: '/crossing',
              componentLoader: page,
            },
          ]),
        },
      ]),
    ).toThrow(
      /cannot join systemSettings group .*defineSystemSettingsRoutes\(\)/,
    );
  });
});
