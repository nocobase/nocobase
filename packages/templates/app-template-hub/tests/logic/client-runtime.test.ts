import { createApp } from '../../client/app.js';
import { ServiceProvider } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import { ClientApplication, toasterToken } from '@nocobase/app-client';
import {
  createAppClientConfig,
  defineAppClientRenderConfig,
  defineClientPlugins,
} from '@nocobase/app-client';
import {
  defineAppRuntime,
  resolveAppRuntime,
  type AppRuntimeDefinition,
} from '@nocobase/app-client/runtime';
import type { ClientApplication as ClientApplicationType } from '@nocobase/app-client';

import appRuntime from '../../client/runtime.ts';

describe('app client runtime', () => {
  it('resolves static contributions without running ServiceProvider lifecycle', async () => {
    const calls: string[] = [];
    class Provider extends ServiceProvider<ClientApplicationType> {
      public readonly name: string = '@example/provider';

      public override boot(): Promise<void> {
        calls.push('boot');
        return Promise.resolve();
      }
    }
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        serviceProviders: [Provider],
        reactProviders: [],
        routes: [],
        plugins: defineClientPlugins([]),
      }),
    );

    expect(runtime.serviceProviders[0]).toMatchObject({
      Provider,
      context: { packageName: '@example/app', source: 'application' },
    });
    expect(runtime.reactProviders).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('runs provider lifecycle and exposes Refine config through ClientApplication', async () => {
    const authProvider = {
      check: vi.fn(),
      getIdentity: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      onError: vi.fn(),
    };
    class Provider extends ServiceProvider<ClientApplicationType> {
      public readonly name: string = '@example/provider';

      public override boot(): Promise<void> {
        this.app.refine.setAuthProvider(authProvider);
        return Promise.resolve();
      }
    }
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        serviceProviders: [Provider],
        plugins: defineClientPlugins([]),
      }),
    );
    const app = new ClientApplication({
      runtime,
      createRenderConfig: () => defineAppClientRenderConfig({ routes: null }),
    });

    await app.start();
    expect(app.refineConfig.authProvider).toBe(authProvider);
    await app.shutdown();
  });

  it('uses the default template Application and static plugin declarations', async () => {
    const runtime = await resolveAppRuntime(appRuntime, {
      rawConfig: { app: { title: 'Configured application' } },
    });
    const app = createApp(runtime);

    expect(app).toBeInstanceOf(ClientApplication);
    await expect(app.start()).resolves.toBeUndefined();
    expect(app.config.get('app.title')).toBe('Configured application');
    expect(app.refineConfig.options?.title).toEqual({
      text: 'Configured application',
    });
    // Plugins and pages report through the registered toaster, and the mounted Toaster renders what it forwards.
    // Without either half, toasts disappear.
    expect(app.services.has(toasterToken)).toBe(true);
    expect(runtime.reactProviders).toContainEqual(
      expect.objectContaining({ name: 'toaster', layer: 'application' }),
    );
    expect(
      runtime.routes
        .filter((route) => route.navigation)
        .map((route) => ({
          name: route.name,
          path: route.path,
          authz: route.authz,
          title: route.navigation?.title,
        })),
    ).toEqual([
      {
        name: 'hub',
        path: '/apps',
        authz: { resource: { type: 'page', id: 'hub' }, action: 'access' },
        title: 'navigation.applications',
      },
      {
        name: 'hub-roles',
        path: '/roles',
        authz: { resource: { type: 'page', id: 'users' }, action: 'access' },
        title: 'navigation.roles',
      },
      {
        name: 'hub-api-keys',
        path: '/api-keys',
        authz: {
          resource: { type: 'hub.app', id: '*' },
          action: 'manage-api-keys',
        },
        title: 'navigation.apiKeys',
      },
      {
        name: 'users',
        path: '/users',
        authz: { resource: { type: 'page', id: 'users' }, action: 'access' },
        title: 'nav.users',
      },
    ]);
    await app.shutdown();
  });

  it('requires a Client config factory in the breaking static Runtime protocol', async () => {
    const { createAppConfig: _createAppConfig, ...withoutConfig } = appRuntime;
    await expect(
      resolveAppRuntime(withoutConfig as AppRuntimeDefinition),
    ).rejects.toThrow();
  });
});
