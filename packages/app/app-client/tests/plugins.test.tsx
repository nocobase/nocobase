import type { PropsWithChildren, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  applyClientRouteComponentOverrides,
  defineAppRoutes,
  defineClientPlugin,
  defineClientPlugins,
  defineClientReactProviders,
  defineClientRouteComponentOverrides,
  defineClientSourceExtension,
  resolveAppClientContributions,
  type AppClientPluginFactory,
} from '../src/plugins.js';

function FirstWrapper({ children }: PropsWithChildren): ReactElement {
  return <>{children}</>;
}

function SecondWrapper({ children }: PropsWithChildren): ReactElement {
  return <>{children}</>;
}

describe('client plugin definitions', () => {
  it('uses void options when AppClientPluginFactory omits its type argument', () => {
    const plugin: AppClientPluginFactory = defineClientPlugin({
      packageName: '@nocobase/app-plugin-no-options',
    });

    expect(plugin()).toMatchObject({
      packageName: '@nocobase/app-plugin-no-options',
      options: {},
    });
  });

  it('freezes source extension route overrides', () => {
    const extension = defineClientSourceExtension({
      name: 'authentication-ui',
      routeComponentOverrides: [
        {
          routeId: '@nocobase/app-plugin-authentication:login',
          componentLoader: async () => ({ default: () => null }),
        },
      ],
    });

    expect(extension.name).toBe('authentication-ui');
    expect(Object.isFrozen(extension)).toBe(true);
    expect(Object.isFrozen(extension.routeComponentOverrides)).toBe(true);
    expect(Object.isFrozen(extension.routeComponentOverrides?.[0])).toBe(true);
  });

  it('freezes route and reactProvider definitions', () => {
    const routes = defineAppRoutes([
      {
        name: 'index',
        path: '/example',
        authz: { resource: { type: 'page', id: 'index' }, action: 'access' },
        componentLoader: async () => ({ default: () => null }),
      },
    ]);
    const reactProviders = defineClientReactProviders([
      {
        name: 'first',
        component: FirstWrapper,
        before: ['@nocobase/app-plugin-example:second'],
      },
    ]);

    expect(Object.isFrozen(routes)).toBe(true);
    expect(Object.isFrozen(routes[0])).toBe(true);
    expect(Object.isFrozen(reactProviders)).toBe(true);
    expect(Object.isFrozen(reactProviders[0].before)).toBe(true);
  });

  it('resolves routes and sorts reactProviders from outer to inner', () => {
    const resolved = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-feature',
        routes: defineAppRoutes([
          {
            name: 'index',
            path: '/feature/',
            authz: {
              resource: { type: 'page', id: 'feature.dashboard' },
              action: 'access',
            },
            componentLoader: async () => ({ default: () => null }),
          },
        ]),
        reactProviders: defineClientReactProviders([
          {
            name: 'second',
            component: SecondWrapper,
            after: ['@nocobase/app-plugin-foundation:first'],
          },
        ]),
      },
      {
        packageName: '@nocobase/app-plugin-foundation',
        reactProviders: defineClientReactProviders([
          { name: 'first', component: FirstWrapper },
        ]),
      },
    ]);

    expect(resolved.routes[0]).toMatchObject({
      auth: 'required',
      id: '@nocobase/app-plugin-feature:index',
      path: '/feature',
      source: 'plugin',
      authz: {
        resource: { type: 'page', id: 'feature.dashboard' },
        action: 'access',
      },
    });
    expect(
      resolved.reactProviders.map((reactProvider) => reactProvider.id),
    ).toEqual([
      '@nocobase/app-plugin-foundation:first',
      '@nocobase/app-plugin-feature:second',
    ]);
  });

  it('normalizes skipped and default authorization during registration', () => {
    const resolved = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-feature',
        routes: defineAppRoutes([
          {
            name: 'landing',
            path: '/feature/landing',
            authz: 'skip',
            componentLoader: async () => ({ default: () => null }),
          },
          {
            name: 'reports',
            path: '/feature/reports',
            authz: {
              resource: { type: 'page', id: 'reports' },
              action: 'access',
            },
            componentLoader: async () => ({ default: () => null }),
          },
        ]),
      },
    ]);

    expect(resolved.routes[0].authz).toBe('skip');
    expect(resolved.routes[1].authz).toEqual({
      resource: { type: 'page', id: 'reports' },
      action: 'access',
    });
  });

  it('supports guest and optional routes while protecting reserved paths', () => {
    const resolved = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-authentication',
        routes: defineAppRoutes([
          {
            name: 'login',
            path: '/login',
            auth: 'guest',
            authz: 'skip',
            componentLoader: async () => ({ default: () => null }),
          },
          {
            name: 'help',
            path: '/help',
            auth: 'optional',
            authz: 'skip',
            componentLoader: async () => ({ default: () => null }),
          },
        ]),
      },
    ]);

    expect(resolved.routes.map((route) => route.auth)).toEqual([
      'guest',
      'optional',
    ]);
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-feature',
          routes: defineAppRoutes([
            {
              name: 'login',
              path: '/login',
              authz: {
                resource: { type: 'page', id: 'login' },
                action: 'access',
              },
              componentLoader: async () => ({ default: () => null }),
            },
          ]),
        },
      ]),
    ).toThrow('unless auth is "guest"');

    const application = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-template-default',
        source: 'application',
        routes: defineAppRoutes([
          {
            name: 'home',
            path: '/',
            authz: { resource: { type: 'page', id: 'home' }, action: 'access' },
            componentLoader: async () => ({ default: () => null }),
          },
        ]),
      },
    ]);
    expect(application.routes[0]).toMatchObject({
      id: '@nocobase/app-template-default:home',
      path: '/',
      source: 'application',
    });
  });

  it('overrides only a registered route component loader', async () => {
    const PluginPage = (): null => null;
    const ApplicationPage = (): null => null;
    const [route] = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-authentication',
        routes: defineAppRoutes([
          {
            name: 'login',
            path: '/login',
            auth: 'guest',
            authz: 'skip',
            componentLoader: async () => ({ default: PluginPage }),
          },
        ]),
      },
    ]).routes;
    const overridden = applyClientRouteComponentOverrides(
      [route],
      defineClientRouteComponentOverrides([
        {
          routeId: '@nocobase/app-plugin-authentication:login',
          componentLoader: async () => ({ default: ApplicationPage }),
        },
      ]),
    );

    expect(overridden[0]).toMatchObject({
      auth: 'guest',
      id: '@nocobase/app-plugin-authentication:login',
      name: 'login',
      packageName: '@nocobase/app-plugin-authentication',
      path: '/login',
    });
    await expect(overridden[0].componentLoader()).resolves.toEqual({
      default: ApplicationPage,
    });
    expect(Object.isFrozen(overridden)).toBe(true);
    expect(Object.isFrozen(overridden[0])).toBe(true);
  });

  it('validates route component override targets and loaders', async () => {
    const [route] = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-example',
        routes: defineAppRoutes([
          {
            name: 'index',
            path: '/example',
            authz: {
              resource: { type: 'page', id: 'index' },
              action: 'access',
            },
            componentLoader: async () => ({ default: () => null }),
          },
        ]),
      },
    ]).routes;
    const routeId = '@nocobase/app-plugin-example:index';

    expect(() =>
      applyClientRouteComponentOverrides(
        [route],
        [
          {
            routeId: '@nocobase/app-plugin-missing:index',
            componentLoader: async () => ({ default: () => null }),
          },
        ],
      ),
    ).toThrow('references missing route');
    expect(() =>
      applyClientRouteComponentOverrides(
        [route],
        [
          { routeId, componentLoader: async () => ({ default: () => null }) },
          { routeId, componentLoader: async () => ({ default: () => null }) },
        ],
      ),
    ).toThrow('is overridden more than once');

    const overridden = applyClientRouteComponentOverrides(
      [route],
      [
        {
          routeId,
          componentLoader: async () => {
            throw new Error('Application page failed.');
          },
        },
      ],
    );
    await expect(overridden[0].componentLoader()).rejects.toThrow(
      `Failed to load client route "${routeId}".`,
    );
  });

  it('keeps registration order when reactProviders have no constraints', () => {
    const resolved = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-example',
        reactProviders: defineClientReactProviders([
          { name: 'first', component: FirstWrapper },
          { name: 'second', component: SecondWrapper },
        ]),
      },
    ]);

    expect(
      resolved.reactProviders.map((reactProvider) => reactProvider.name),
    ).toEqual(['first', 'second']);
    expect(
      resolved.reactProviders.map((reactProvider) => reactProvider.layer),
    ).toEqual(['extension', 'extension']);
  });

  it('sorts reactProvider layers before applying same-layer constraints', () => {
    const resolved = resolveAppClientContributions([
      {
        packageName: '@nocobase/app-plugin-feature',
        reactProviders: defineClientReactProviders([
          { name: 'extension', component: SecondWrapper },
        ]),
      },
      {
        packageName: '@nocobase/app-template-default',
        source: 'application',
        reactProviders: defineClientReactProviders([
          {
            name: 'workspace',
            component: SecondWrapper,
            layer: 'application',
          },
          {
            name: 'theme',
            component: FirstWrapper,
            layer: 'root',
          },
        ]),
      },
    ]);

    expect(
      resolved.reactProviders.map(({ id, layer, source }) => ({
        id,
        layer,
        source,
      })),
    ).toEqual([
      {
        id: '@nocobase/app-template-default:theme',
        layer: 'root',
        source: 'application',
      },
      {
        id: '@nocobase/app-template-default:workspace',
        layer: 'application',
        source: 'application',
      },
      {
        id: '@nocobase/app-plugin-feature:extension',
        layer: 'extension',
        source: 'plugin',
      },
    ]);
  });

  it('rejects invalid reactProvider layers and cross-layer constraints', () => {
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-feature',
          reactProviders: defineClientReactProviders([
            {
              name: 'feature',
              component: FirstWrapper,
              layer: 'root',
            },
          ]),
        },
      ]),
    ).toThrow('plugin reactProviders must use layer "extension"');

    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@nocobase/app-template-default',
          source: 'application',
          reactProviders: defineClientReactProviders([
            {
              name: 'theme',
              component: FirstWrapper,
              layer: 'root',
            },
            {
              name: 'workspace',
              component: SecondWrapper,
              layer: 'application',
              after: ['@nocobase/app-template-default:theme'],
            },
          ]),
        },
      ]),
    ).toThrow(
      'before/after constraints may only reference reactProviders in the same layer',
    );
  });

  it('rejects missing references and circular reactProvider ordering', () => {
    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-example',
          reactProviders: defineClientReactProviders([
            {
              name: 'first',
              component: FirstWrapper,
              after: ['@nocobase/app-plugin-missing:reactProvider'],
            },
          ]),
        },
      ]),
    ).toThrow('references missing reactProvider');

    expect(() =>
      resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-example',
          reactProviders: defineClientReactProviders([
            {
              name: 'first',
              component: FirstWrapper,
              after: ['@nocobase/app-plugin-example:second'],
            },
            {
              name: 'second',
              component: SecondWrapper,
              after: ['@nocobase/app-plugin-example:first'],
            },
          ]),
        },
      ]),
    ).toThrow('Circular client reactProvider order detected');
  });
});

describe('client modules', () => {
  const loadComponent = async () => ({ default: () => null });
  const routes = defineAppRoutes([
    {
      name: 'index',
      path: '/example',
      authz: { resource: { type: 'page', id: 'index' }, action: 'access' },
      componentLoader: loadComponent,
    },
  ]);

  it('forwards options and exposes the declared entries', () => {
    const example = defineClientPlugin<{ readonly label?: string }>({
      packageName: '@nocobase/app-plugin-example',
      routes,
      reactProviders: (options) =>
        options.label ? [{ name: options.label, component: FirstWrapper }] : [],
    });

    const registration = example({ label: 'custom' });

    expect(registration.packageName).toBe('@nocobase/app-plugin-example');
    expect(registration.routes).toEqual([routes]);
    expect(registration.reactProviders[0]?.name).toBe('custom');
    expect(registration.options).toEqual({ label: 'custom' });
    expect(registration.routeComponentOverrides).toEqual([]);
  });

  it('defaults options to an empty object when called with none', () => {
    const example = defineClientPlugin({
      packageName: '@nocobase/app-plugin-example',
    });

    expect(example().options).toEqual({});
  });

  it('derives route component overrides from options', () => {
    const example = defineClientPlugin<{
      readonly loginPage?: typeof loadComponent;
    }>({
      packageName: '@nocobase/app-plugin-example',
      routeComponentOverrides: (options) =>
        options.loginPage
          ? [
              {
                routeId: '@nocobase/app-plugin-example:login',
                componentLoader: options.loginPage,
              },
            ]
          : [],
    });

    expect(example().routeComponentOverrides).toEqual([]);
    expect(
      example({ loginPage: loadComponent }).routeComponentOverrides,
    ).toEqual([
      expect.objectContaining({
        routeId: '@nocobase/app-plugin-example:login',
      }),
    ]);
  });

  it('collects plugins in order and merges their route overrides', () => {
    const first = defineClientPlugin({
      packageName: '@nocobase/app-plugin-first',
      routeComponentOverrides: () => [
        {
          routeId: '@nocobase/app-plugin-second:login',
          componentLoader: loadComponent,
        },
      ],
    });
    const second = defineClientPlugin({
      packageName: '@nocobase/app-plugin-second',
      routes,
    });

    const modules = defineClientPlugins([first(), second()]);

    expect(modules.plugins.map((plugin) => plugin.packageName)).toEqual([
      '@nocobase/app-plugin-first',
      '@nocobase/app-plugin-second',
    ]);
    expect(modules.routeComponentOverrides).toHaveLength(1);
  });

  it('rejects the same package registered twice', () => {
    const example = defineClientPlugin({
      packageName: '@nocobase/app-plugin-example',
    });

    expect(() => defineClientPlugins([example(), example()])).toThrow(
      'is registered more than once',
    );
  });

  it('rejects an empty package name', () => {
    expect(() => defineClientPlugin({ packageName: '  ' })).toThrow(
      'must define a package name',
    );
  });
});

describe('route contributions', () => {
  it('rejects a contribution to a surface other than app routes', () => {
    // A plugin built against an earlier release can still hand over `{ parent: 'settings' }`; name the fix.
    const contribution = {
      packageName: '@nocobase/app-plugin-legacy',
      routes: { parent: 'settings', routes: [] },
    } as unknown as Parameters<typeof resolveAppClientContributions>[0][0];
    expect(() => resolveAppClientContributions([contribution])).toThrow(
      'Plugin "@nocobase/app-plugin-legacy" contributed routes to unsupported parent "settings"; declare them with defineAppRoutes().',
    );
  });
});
