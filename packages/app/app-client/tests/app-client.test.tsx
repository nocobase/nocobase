import { useGo } from '@refinedev/core';
import { ServiceProvider } from '@nocobase/service-provider';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  apiClientToken,
  ClientApplication,
  realtimeClientToken,
  type ClientApplicationRenderConfigFactory,
} from '../src/application.js';
import { useApiClient } from '../src/index.js';
import { ClientApplicationContext } from '../src/application-context.js';
import { AppClientRoot } from '../src/app-client.js';
import {
  createAppClientConfig,
  defineAppClientRenderConfig,
  normalizeAppClientBasename,
} from '../src/config.js';
import { defineClientPlugins } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

function RouterConsumer(): ReactElement {
  const go = useGo();
  return <button onClick={() => go({ to: '/configured' })}>Navigate</button>;
}

async function createTestApplication(
  createRenderConfig: ClientApplicationRenderConfigFactory,
  refine?: (app: ClientApplication) => void,
): Promise<ClientApplication> {
  class TestProvider extends ServiceProvider<ClientApplication> {
    public readonly name: string = '@example/test';

    public override boot(): Promise<void> {
      refine?.(this.app);
      return Promise.resolve();
    }
  }

  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      serviceProviders: [TestProvider],
      plugins: defineClientPlugins([]),
    }),
    // What the server renders into the page: without it the API client has no mount path to resolve against.
    {
      rawConfig: { app: { basePath: '/main' }, api: { baseURL: '/main/api' } },
    },
  );
  const app = new ClientApplication({ runtime, createRenderConfig });
  await app.start();
  return app;
}

describe('app client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves the current application API client and preserves its identity', async () => {
    const first = await createTestApplication(() =>
      defineAppClientRenderConfig({}),
    );
    const second = await createTestApplication(() =>
      defineAppClientRenderConfig({}),
    );
    let current = first;
    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <ClientApplicationContext.Provider value={current}>
        {children}
      </ClientApplicationContext.Provider>
    );
    const { result, rerender, unmount } = renderHook(() => useApiClient(), {
      wrapper,
    });
    try {
      expect(result.current).toBe(first.services.resolve(apiClientToken));
      rerender();
      expect(result.current).toBe(first.services.resolve(apiClientToken));
      current = second;
      rerender();
      expect(result.current).toBe(second.services.resolve(apiClientToken));
      expect(result.current).not.toBe(first.services.resolve(apiClientToken));
    } finally {
      unmount();
      await first.shutdown();
      await second.shutdown();
    }
  });

  it('requires application context for useApiClient', () => {
    expect(() => renderHook(() => useApiClient())).toThrow(
      'useClientApplication() must be used inside AppClientRoot.',
    );
  });

  it.each([
    [{}, 'wss://ui.example.com/main/ws'],
    [
      { baseURL: 'https://api.example.com/apps/demo/api/' },
      'wss://api.example.com/apps/demo/ws',
    ],
    [{ baseURL: '/apps/demo/api' }, 'wss://ui.example.com/apps/demo/ws'],
    [
      { baseURL: '/apps/demo/api', realtimeURL: '/custom/realtime' },
      'wss://ui.example.com/custom/realtime',
    ],
    [
      { realtimeURL: 'wss://events.example.com/socket' },
      'wss://events.example.com/socket',
    ],
  ])(
    'resolves the realtime service endpoint from API config %j',
    async (api, expected) => {
      const urls: string[] = [];
      class MockWebSocket {
        public static readonly CONNECTING = 0;
        public static readonly OPEN = 1;
        public readonly readyState = MockWebSocket.CONNECTING;
        public constructor(url: string) {
          urls.push(url);
        }
        public close(): void {}
      }
      vi.stubGlobal('WebSocket', MockWebSocket);
      document.body.innerHTML =
        '<script id="nocobase-runtime-config" type="application/json">{"version":1,"config":{"app":{"basePath":"/main"}}}</script>';
      vi.stubGlobal('window', {
        location: {
          href: 'https://ui.example.com/main/',
          origin: 'https://ui.example.com',
        },
      });
      const runtime = await resolveAppRuntime(
        defineAppRuntime({
          packageName: '@example/app',
          createAppConfig: createAppClientConfig,
          plugins: defineClientPlugins([]),
        }),
        { rawConfig: { api } },
      );
      const app = new ClientApplication({
        runtime,
        createRenderConfig: () => ({ routes: null }),
      });
      await app.start();
      expect(urls).toHaveLength(0);
      app.services
        .resolve(realtimeClientToken)
        .subscribe('test:topic', vi.fn());
      expect(urls).toEqual([expected]);
      await app.shutdown();
    },
  );

  it('normalizes router basenames', () => {
    expect(normalizeAppClientBasename(undefined)).toBeUndefined();
    expect(normalizeAppClientBasename('/')).toBeUndefined();
    expect(normalizeAppClientBasename('/portal/')).toBe('/portal');
  });

  it('uses a configured Refine router provider', async () => {
    const go = vi.fn();
    const app = await createTestApplication(
      () =>
        defineAppClientRenderConfig({
          routes: <RouterConsumer />,
        }),
      (current) => current.refine.setRouterProvider({ go: () => go }),
    );

    render(<AppClientRoot app={app} />);
    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));

    expect(go).toHaveBeenCalledExactlyOnceWith({ to: '/configured' });
    await app.shutdown();
  });

  it('uses configured Refine children instead of default routes', async () => {
    const app = await createTestApplication(
      () =>
        defineAppClientRenderConfig({
          routes: 'Default application routes',
        }),
      (current) => {
        current.refine.setChildren('Configured Refine content');
        current.refine.setRouterProvider({});
      },
    );

    render(<AppClientRoot app={app} />);

    expect(screen.getByText('Configured Refine content')).toBeInTheDocument();
    expect(
      screen.queryByText('Default application routes'),
    ).not.toBeInTheDocument();
    await app.shutdown();
  });

  it('leaves React DOM root ownership to the host', async () => {
    const app = await createTestApplication(
      () => defineAppClientRenderConfig({ routes: 'Hosted application' }),
      (current) => current.refine.setRouterProvider({}),
    );

    expect(app).not.toHaveProperty('mount');
    expect(app).not.toHaveProperty('unmount');

    const view = render(<AppClientRoot app={app} />);
    expect(screen.getByText('Hosted application')).toBeInTheDocument();

    view.unmount();
    await app.shutdown();
  });

  it('closes the core realtime client during application shutdown', async () => {
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: null }),
    );
    expect(app.services.resolve(apiClientToken)).toBeDefined();
    const realtime = app.services.resolve(realtimeClientToken);
    const close = vi.spyOn(realtime, 'close');

    await app.shutdown();

    expect(close).toHaveBeenCalledOnce();
  });

  it('synchronizes the document locale before rendering and until shutdown', async () => {
    const element = document.documentElement;
    const previousLanguage = element.lang;
    const previousDirection = element.dir;
    vi.stubGlobal('localStorage', { getItem: () => null });
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([]),
        locales: {
          'en-US': async () => ({ title: 'Application' }),
          'ar-SA': async () => ({ title: 'التطبيق' }),
        },
      }),
      { rawConfig: { i18n: { defaultLocale: 'ar-SA' } } },
    );
    const app = new ClientApplication({
      runtime,
      createRenderConfig: () => ({ routes: null }),
    });

    try {
      await app.start();
      expect(element.lang).toBe('ar-SA');
      expect(element.dir).toBe('rtl');

      await runtime.i18n.changeLanguage('en-US');
      expect(element.lang).toBe('en-US');
      expect(element.dir).toBe('ltr');

      await app.shutdown();
      element.lang = 'after-shutdown';
      await runtime.i18n.changeLanguage('ar-SA');
      expect(element.lang).toBe('after-shutdown');
    } finally {
      await app.shutdown();
      element.lang = previousLanguage;
      element.dir = previousDirection;
    }
  });

  it('requires startup before rendering and shuts providers down in reverse order', async () => {
    const calls: string[] = [];
    const createProvider = (name: string) =>
      class extends ServiceProvider<ClientApplication> {
        public readonly name: string = name;

        public override register(): void {
          calls.push(`register:${name}`);
        }

        public override boot(): Promise<void> {
          calls.push(`boot:${name}`);
          return Promise.resolve();
        }

        public override start(): Promise<void> {
          calls.push(`start:${name}`);
          return Promise.resolve();
        }

        public override ready(): Promise<void> {
          calls.push(`ready:${name}`);
          return Promise.resolve();
        }

        public override shutdown(): Promise<void> {
          calls.push(`shutdown:${name}`);
          return Promise.resolve();
        }
      };
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: '@example/app',
        createAppConfig: createAppClientConfig,
        serviceProviders: [createProvider('first'), createProvider('second')],
        plugins: defineClientPlugins([]),
      }),
    );
    const app = new ClientApplication({
      runtime,
      createRenderConfig: () => ({ routes: null }),
    });

    expect(() => app.renderConfig).toThrow('must be started');
    await app.start();
    await app.shutdown();

    expect(calls).toEqual([
      'register:first',
      'register:second',
      'boot:first',
      'boot:second',
      'start:first',
      'start:second',
      'ready:first',
      'ready:second',
      'shutdown:second',
      'shutdown:first',
    ]);
  });
});
