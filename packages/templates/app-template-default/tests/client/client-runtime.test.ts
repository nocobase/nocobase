import { createApp } from '../../client/app.js';
import { ServiceProvider } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

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

  it('runs provider lifecycle through ClientApplication', async () => {
    const calls: string[] = [];
    class Provider extends ServiceProvider<ClientApplicationType> {
      public readonly name: string = '@example/provider';

      public override boot(): Promise<void> {
        calls.push('boot');
        return Promise.resolve();
      }

      public override shutdown(): Promise<void> {
        calls.push('shutdown');
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
    expect(calls).toEqual(['boot']);
    await app.shutdown();
    expect(calls).toEqual(['boot', 'shutdown']);
  });

  it('uses the default template Application and static plugin declarations', async () => {
    const runtime = await resolveAppRuntime(appRuntime, {
      rawConfig: { app: { title: 'Configured application' } },
    });
    const app = createApp(runtime);

    expect(app).toBeInstanceOf(ClientApplication);
    await expect(app.start()).resolves.toBeUndefined();
    expect(app.config.get('app.title')).toBe('Configured application');
    // Plugins and pages report through the registered toaster, and the mounted Toaster renders what it forwards.
    // Without either half, toasts disappear.
    expect(app.services.has(toasterToken)).toBe(true);
    expect(runtime.reactProviders).toContainEqual(
      expect.objectContaining({ name: 'toaster', layer: 'application' }),
    );
    await app.shutdown();
  });

  it('requires a Client config factory in the breaking static Runtime protocol', async () => {
    const { createAppConfig: _createAppConfig, ...withoutConfig } = appRuntime;
    await expect(
      resolveAppRuntime(withoutConfig as AppRuntimeDefinition),
    ).rejects.toThrow();
  });
});
