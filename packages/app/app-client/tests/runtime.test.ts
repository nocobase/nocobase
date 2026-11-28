import type { AppRuntimeContext } from '../src/runtime/index.js';
import {
  createElement,
  Fragment,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { ServiceProvider } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import {
  createAppClientConfig,
  defineAppConfig,
  defaultAppConfigs,
} from '../src/config.js';
import {
  defineAppRoutes,
  definePersonalSettingsRoutes,
  defineSystemSettingsRoutes,
  defineClientPlugin,
  defineClientPlugins,
  defineClientReactProviders,
} from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';
import { ClientApplication } from '../src/application.js';

function Wrapper({ children }: PropsWithChildren): ReactElement {
  return createElement(Fragment, undefined, children);
}

describe('app runtime', () => {
  const settingsPage = {
    name: 'example',
    path: '/example',
    authz: 'skip' as const,
    componentLoader: async () => ({ default: () => null }),
  };
  const settingsPlugin = defineClientPlugin({
    packageName: '@example/plugin',
    routes: [
      defineSystemSettingsRoutes([settingsPage]),
      definePersonalSettingsRoutes([{ ...settingsPage, name: 'personal' }]),
    ],
  });

  it.each([
    [{}, ['systemSettings', 'personalSettings']],
    [{ personalSettingsRoutes: false }, ['systemSettings']],
    [{ systemSettingsRoutes: false }, ['personalSettings']],
    [{ personalSettingsRoutes: false, systemSettingsRoutes: false }, []],
  ] as const)(
    'selects settings surfaces independently: %j',
    async (options, expected) => {
      const runtime = await resolveAppRuntime(
        defineAppRuntime({
          packageName: '@example/app',
          createAppConfig: createAppClientConfig,
          plugins: defineClientPlugins([settingsPlugin()]),
          ...options,
        }),
        { rawConfig: {} },
      );
      expect(new Set(runtime.routes.map((route) => route.surface))).toEqual(
        new Set(expected),
      );
    },
  );

  it('treats routes of a disabled settings surface like excluded routes', async () => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([settingsPlugin()]),
        systemSettingsRoutes: false,
        personalSettingsRoutes: false,
        excludedRouteIds: ['@example/app:unlisted'],
        headerActions: [
          {
            name: 'personalShortcut',
            routeId: '@example/plugin:personal',
            component: () => null,
          },
        ],
        routeComponentOverrides: [
          {
            routeId: '@example/plugin:personal',
            componentLoader: settingsPage.componentLoader,
          },
        ],
        routes: defineAppRoutes([
          { ...settingsPage, name: 'unlisted', path: '/unlisted' },
          // The application owns a path the disabled system settings page would have claimed.
          { ...settingsPage, path: '/settings/example' },
        ]),
      }),
      { rawConfig: {} },
    );
    expect(runtime.routes.map((route) => route.path)).toEqual([
      '/settings/example',
    ]);
    expect(runtime.headerActions).toEqual([]);
  });

  it.each(['option', 'excludedRouteIds'] as const)(
    'treats routes a plugin disables like excluded routes: %s',
    async (via) => {
      const page = {
        name: 'inbox',
        path: '/inbox',
        authz: 'skip' as const,
        componentLoader: async () => ({ default: () => null }),
      };
      const plugin = defineClientPlugin<{ inboxRoute?: boolean }>({
        packageName: '@example/inbox',
        routes: (options) =>
          defineAppRoutes([page], { disabled: options.inboxRoute === false }),
        headerActions: [
          {
            name: 'inboxButton',
            routeId: '@example/inbox:inbox',
            component: () => null,
          },
        ],
      });
      const runtime = await resolveAppRuntime(
        defineAppRuntime({
          packageName: '@example/app',
          createAppConfig: createAppClientConfig,
          plugins: defineClientPlugins([
            plugin(via === 'option' ? { inboxRoute: false } : {}),
          ]),
          ...(via === 'excludedRouteIds'
            ? { excludedRouteIds: ['@example/inbox:inbox'] }
            : {}),
          routeComponentOverrides: [
            {
              routeId: '@example/inbox:inbox',
              componentLoader: page.componentLoader,
            },
          ],
          routes: defineAppRoutes([{ ...page, name: 'ownInbox' }]),
        }),
        { rawConfig: {} },
      );
      expect(runtime.routes.map((route) => route.id)).toEqual([
        '@example/app:ownInbox',
      ]);
      expect(runtime.headerActions).toEqual([]);
    },
  );

  it.each(['option', 'excludedRouteIds'] as const)(
    "removes another package's pages under a disabled group: %s",
    async (via) => {
      const loader = async () => ({ default: () => null });
      const reports = defineClientPlugin<{ reports?: boolean }>({
        packageName: '@example/reports',
        routes: (options) =>
          defineAppRoutes(
            [
              {
                name: 'reports',
                path: '/reports',
                children: [
                  {
                    name: 'summary',
                    path: 'summary',
                    authz: 'skip',
                    componentLoader: loader,
                  },
                ],
              },
            ],
            { disabled: options.reports === false },
          ),
      });
      const sales = defineClientPlugin({
        packageName: '@example/sales',
        routes: defineAppRoutes([
          {
            name: 'salesReport',
            parent: '@example/reports:reports',
            path: 'sales',
            authz: 'skip',
            componentLoader: loader,
          },
        ]),
        headerActions: [
          {
            name: 'salesShortcut',
            routeId: '@example/sales:salesReport',
            component: () => null,
          },
        ],
      });
      const runtime = await resolveAppRuntime(
        defineAppRuntime({
          packageName: '@example/app',
          createAppConfig: createAppClientConfig,
          plugins: defineClientPlugins([
            reports(via === 'option' ? { reports: false } : {}),
            sales(),
          ]),
          ...(via === 'excludedRouteIds'
            ? { excludedRouteIds: ['@example/reports:reports'] }
            : {}),
          routes: defineAppRoutes([
            {
              name: 'ownReports',
              path: '/reports',
              authz: 'skip',
              componentLoader: loader,
            },
          ]),
        }),
        { rawConfig: {} },
      );
      expect(runtime.routes.map((route) => route.id)).toEqual([
        '@example/app:ownReports',
      ]);
      expect(runtime.headerActions).toEqual([]);
    },
  );

  it('excludes route groups and their cross-plugin children before claiming paths and applying overrides', async () => {
    const defaultLoader = vi.fn(async () => ({ default: () => null }));
    const applicationLoader = vi.fn(async () => ({ default: () => null }));
    const owner = defineClientPlugin({
      packageName: '@example/orders',
      routes: defineAppRoutes([
        {
          name: 'work',
          navigation: { title: 'work' },
          children: [
            {
              name: 'list',
              path: '/work',
              authz: 'skip',
              componentLoader: defaultLoader,
            },
          ],
        },
      ]),
    });
    const extra = defineClientPlugin({
      packageName: '@example/extra',
      headerActions: [
        {
          name: 'extra.link',
          component: () => null,
          routeId: '@example/extra:extra',
        },
      ],
      routes: defineAppRoutes([
        {
          name: 'extra',
          parent: '@example/orders:work',
          path: '/extra',
          authz: 'skip',
          componentLoader: defaultLoader,
        },
      ]),
      routeComponentOverrides: () => [
        { routeId: '@example/orders:list', componentLoader: defaultLoader },
      ],
    });
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([extra(), owner()]),
        excludedRouteIds: ['@example/orders:work'],
        routes: defineAppRoutes([
          {
            name: 'my-work',
            path: '/work',
            authz: 'skip',
            componentLoader: applicationLoader,
          },
        ]),
      }),
      { rawConfig: {} },
    );

    expect(runtime.routes.map(({ id, path }) => [id, path])).toEqual([
      ['@example/app:my-work', '/work'],
    ]);
    expect(runtime.headerActions).toEqual([]);
    expect(defaultLoader).not.toHaveBeenCalled();
    expect(applicationLoader).not.toHaveBeenCalled();
  });

  it('omits individually excluded toolbar actions and shortcuts whose pages are excluded', async () => {
    const component = () => null;
    const componentLoader = async () => ({ default: component });
    const plugin = defineClientPlugin({
      packageName: '@example/tools',
      headerActions: [
        { name: 'tools.hidden', component },
        {
          name: 'tools.removed-link',
          component,
          routeId: '@example/tools:removed',
        },
        { name: 'tools.link', component, routeId: '@example/tools:kept' },
      ],
      routes: defineAppRoutes([
        { name: 'kept', path: '/kept', authz: 'skip', componentLoader },
        { name: 'removed', path: '/removed', authz: 'skip', componentLoader },
      ]),
    });
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([plugin()]),
        excludedRouteIds: ['@example/tools:removed'],
        headerActionOverrides: [{ name: 'tools.hidden', hidden: true }],
      }),
      { rawConfig: {} },
    );
    expect(runtime.headerActions?.map(({ name }) => name)).toEqual([
      'tools.link',
    ]);
  });

  it.each([
    ['typo', [], 'references missing route'],
    ['typo', ['@example/tools:typo'], 'references missing route'],
    ['group', [], 'cannot target route group'],
    ['group', ['@example/tools:group'], 'cannot target route group'],
  ] as const)(
    'reports invalid shortcut targets %s with exclusions %j',
    async (target, excludedRouteIds, error) => {
      const component = () => null;
      const routeId = `@example/tools:${target}`;
      const plugin = defineClientPlugin({
        packageName: '@example/tools',
        headerActions: [{ name: 'tools.link', component, routeId }],
        routes: defineAppRoutes([
          {
            name: 'group',
            navigation: { title: 'Tools' },
            children: [
              {
                name: 'page',
                path: '/tools',
                authz: 'skip',
                componentLoader: async () => ({ default: component }),
              },
            ],
          },
        ]),
      });
      const definition = defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([plugin()]),
        excludedRouteIds,
      });
      await expect(
        resolveAppRuntime(definition, { rawConfig: {} }),
      ).rejects.toThrow(`Header action "tools.link" ${error} "${routeId}".`);
    },
  );

  it('warns once about missing exclusion IDs from registered packages only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      await resolveAppRuntime(
        defineAppRuntime({
          packageName: '@example/app',
          createAppConfig: createAppClientConfig,
          plugins: defineClientPlugins([
            defineClientPlugin({ packageName: '@example/tools' })(),
          ]),
          excludedRouteIds: [
            ' @example/tools:missing ',
            '@example/tools:missing',
            '@example/absent:page',
          ],
        }),
        { rawConfig: {} },
      );
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'excludedRouteIds references missing route "@example/tools:missing" from registered package "@example/tools".',
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('assembles complete configuration before the application is created', async () => {
    const callback = vi.fn();
    const configure = vi.fn((context: AppRuntimeContext) => ({
      enabled: true,
      callback: () => callback(context.app),
    }));
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        defaultConfigs: defaultAppConfigs({ auth: defineAppConfig(configure) }),
        plugins: defineClientPlugins([]),
      }),
      { rawConfig: { auth: { enabled: false } } },
    );
    expect(runtime.app).toBeUndefined();
    const app = new ClientApplication({
      runtime,
      createRenderConfig: () => ({ routes: null }),
    });
    runtime.app = app;
    expect(app.config).toBe(runtime.config);
    expect(runtime.config.get('auth.enabled')).toBe(false);
    runtime.config.get<() => void>('auth.callback')!();
    expect(callback).toHaveBeenCalledWith(runtime.app);
    expect(configure).toHaveBeenCalledOnce();
  });

  it('runs with the i18n runtime it is given instead of building one from the locales', async () => {
    const loadLocale = vi.fn(() => Promise.resolve({ title: 'Orders' }));
    const i18n = await createTestI18nRuntime({
      namespaces: { '@example/plugin': { title: 'Strict orders' } },
    });
    const plugin = defineClientPlugin({
      packageName: '@example/plugin',
      locales: { 'en-US': loadLocale },
    });

    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([plugin()]),
      }),
      { rawConfig: {}, i18n },
    );

    expect(runtime.i18n).toBe(i18n);
    expect(runtime.registeredPlugins).toEqual([
      { packageName: '@example/plugin' },
    ]);
    expect(Object.isFrozen(runtime.registeredPlugins)).toBe(true);
    expect(Object.isFrozen(runtime.registeredPlugins?.[0])).toBe(true);
    expect(loadLocale).not.toHaveBeenCalled();
  });

  it('defines immutable static declarations without activating them', () => {
    const serviceProviders = vi.fn(() => []);
    const definition = defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      serviceProviders,
      plugins: defineClientPlugins([]),
      routeComponentOverrides: [],
      sourceExtensions: [],
    });

    expect(serviceProviders).not.toHaveBeenCalled();
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.plugins)).toBe(true);
    expect(Object.isFrozen(definition.plugins.plugins)).toBe(true);
    expect(Object.isFrozen(definition.plugins.routeComponentOverrides)).toBe(
      true,
    );
    expect(Object.isFrozen(definition.routeComponentOverrides)).toBe(true);
    expect(Object.isFrozen(definition.sourceExtensions)).toBe(true);
  });

  it('resolves config, ServiceProviders, React Providers, and routes without activating providers', async () => {
    class Provider extends ServiceProvider<ClientApplication> {
      public readonly name: string = '@example/plugin/provider';
    }
    const Page: ComponentType = () => null;
    const OverridePage: ComponentType = () => null;
    const ApplicationOverridePage: ComponentType = () => null;
    const plugin = defineClientPlugin({
      packageName: '@example/plugin',
      serviceProviders: [Provider],
      reactProviders: defineClientReactProviders([
        { name: 'feature', component: Wrapper },
      ]),
      routeComponentOverrides: () => [
        {
          routeId: '@example/app:home',
          componentLoader: async () => ({ default: OverridePage }),
        },
      ],
    });
    const definition = defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      routes: defineAppRoutes([
        {
          name: 'home',
          path: '/',
          authz: { resource: { type: 'page', id: 'home' }, action: 'access' },
          componentLoader: async () => ({ default: Page }),
        },
        {
          name: 'about',
          path: '/about',
          authz: { resource: { type: 'page', id: 'about' }, action: 'access' },
          componentLoader: async () => ({ default: Page }),
        },
      ]),
      plugins: defineClientPlugins([plugin()]),
      routeComponentOverrides: [
        {
          routeId: '@example/app:about',
          componentLoader: async () => ({ default: ApplicationOverridePage }),
        },
      ],
    });

    const runtime = await resolveAppRuntime(definition, {
      rawConfig: { app: { basePath: '/crm' }, feature: { enabled: true } },
    });

    expect(runtime.basename).toBe('/crm');
    expect(runtime.config.get('feature.enabled')).toBe(true);
    expect(runtime.serviceProviders[0]).toMatchObject({
      Provider,
      context: {
        packageName: '@example/plugin',
        source: 'plugin',
      },
    });
    expect(runtime.reactProviders[0]).toMatchObject({
      id: '@example/plugin:feature',
      source: 'plugin',
    });
    expect(runtime.routes[0]).toMatchObject({
      id: '@example/app:home',
      path: '/',
      source: 'application',
    });
    await expect(runtime.routes[0].componentLoader()).resolves.toEqual({
      default: OverridePage,
    });
    await expect(runtime.routes[1].componentLoader()).resolves.toEqual({
      default: ApplicationOverridePage,
    });
    expect(Object.isFrozen(runtime.serviceProviders)).toBe(true);
  });

  it('does not run application validation while resolving runtime', async () => {
    const validate = vi.fn();
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([]),
        validate,
      }),
    );

    expect(validate).not.toHaveBeenCalled();
    expect(runtime.validate).toBe(validate);
  });
});
