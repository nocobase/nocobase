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
  defineClientPlugin,
  defineClientPlugins,
  defineClientReactProviders,
} from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';
import { ClientApplication } from '../src/application.js';
import { appHeaderActionsToken } from '../src/app-header-action-registry.js';

function Wrapper({ children }: PropsWithChildren): ReactElement {
  return createElement(Fragment, undefined, children);
}

describe('app runtime', () => {
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
    expect(defaultLoader).not.toHaveBeenCalled();
    expect(applicationLoader).not.toHaveBeenCalled();
  });

  it('omits individually excluded toolbar actions and shortcuts whose pages are excluded', async () => {
    const component = () => null;
    const componentLoader = async () => ({ default: component });
    class HeaderProvider extends ServiceProvider<ClientApplication> {
      public readonly name = '@example/tools/header';

      public override boot(): Promise<void> {
        const header = this.app.services.resolve(appHeaderActionsToken);
        header.add({ id: '@example/tools/hidden', component });
        header.add({
          id: '@example/tools/removed-link',
          component,
          routeId: '@example/tools:removed',
        });
        header.add({
          id: '@example/tools/link',
          component,
          routeId: '@example/tools:kept',
        });
        return Promise.resolve();
      }
    }
    const plugin = defineClientPlugin({
      packageName: '@example/tools',
      serviceProviders: [HeaderProvider],
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
        excludedHeaderActionIds: ['@example/tools/hidden'],
      }),
      { rawConfig: {} },
    );
    const app = new ClientApplication({
      runtime,
      createRenderConfig: () => ({ routes: null }),
    });
    await app.start();
    try {
      expect(
        app.services
          .resolve(appHeaderActionsToken)
          .list()
          .map(({ id }) => id),
      ).toEqual(['@example/tools/link']);
    } finally {
      await app.shutdown();
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
