import { ServiceProvider } from '@nocobase/service-provider';
import {
  act,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Fragment,
  StrictMode,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  apiClientToken,
  ClientApplication,
  realtimeClientToken,
  type ClientApplicationRenderConfigFactory,
} from '../src/application.js';
import { queryClientToken, useApiClient } from '../src/index.js';
import { ClientApplicationContext } from '../src/application-context.js';
import { AppClientProviders, AppClientRoot } from '../src/app-client.js';
import {
  createAppClientConfig,
  defineAppClientRenderConfig,
  normalizeAppClientBasename,
} from '../src/config.js';
import { defineClientPlugins } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

async function createTestApplication(
  createRenderConfig: ClientApplicationRenderConfigFactory,
): Promise<ClientApplication> {
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
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

  it('provides the application query cache to its pages', async () => {
    const read: QueryClient[] = [];
    function ReadCache(): null {
      read.push(useQueryClient());
      return null;
    }
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: <ReadCache /> }),
    );

    render(<AppClientRoot app={app} />);

    expect(read).toHaveLength(1);
    expect(read[0]).toBe(app.queryClient);
    expect(app.services.resolve(queryClientToken).current).toBe(read[0]);
    await app.shutdown();
  });

  it('keeps the application query cache for pages under a React provider that mounts a cache of its own', async () => {
    const providerCache = new QueryClient();
    let providerRead: QueryClient | undefined;
    let pageRead: QueryClient | undefined;
    function ProviderReader(): null {
      providerRead = useQueryClient();
      return null;
    }
    function PageReader(): null {
      pageRead = useQueryClient();
      return null;
    }
    function OwnCache({ children }: { readonly children?: ReactNode }) {
      return (
        <QueryClientProvider client={providerCache}>
          <ProviderReader />
          {children}
        </QueryClientProvider>
      );
    }
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({
        routes: <PageReader />,
        reactProviders: [OwnCache],
      }),
    );

    render(<AppClientRoot app={app} />);

    expect(providerRead).toBe(providerCache);
    expect(pageRead).toBe(app.queryClient);
    expect(pageRead).not.toBe(providerCache);
    await app.shutdown();
  });

  it('gives the routes an empty query cache each time a React provider remounts them, as for a new session', async () => {
    let remount: (() => void) | undefined;
    function Session({ children }: { readonly children?: ReactNode }) {
      const [key, setKey] = useState(0);
      remount = () => setKey((value) => value + 1);
      return <Fragment key={key}>{children}</Fragment>;
    }
    const read: QueryClient[] = [];
    function PageReader(): null {
      read.push(useQueryClient());
      return null;
    }
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({
        routes: <PageReader />,
        reactProviders: [Session],
      }),
    );
    render(<AppClientRoot app={app} />);
    const first = read.at(-1)!;
    first.setQueryData(['orders'], ['first session']);

    act(() => remount!());
    await Promise.resolve();

    const second = read.at(-1)!;
    expect(second).not.toBe(first);
    expect(second.getQueryData(['orders'])).toBeUndefined();
    expect(first.getQueryData(['orders'])).toBeUndefined();
    expect(app.queryClient).toBe(second);
    expect(app.services.resolve(queryClientToken).current).toBe(second);
    await app.shutdown();
  });

  it('keeps the query cache through the development double mount of Strict Mode', async () => {
    const read: QueryClient[] = [];
    function PageReader(): null {
      read.push(useQueryClient());
      return null;
    }
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: <PageReader /> }),
    );

    render(
      <StrictMode>
        <AppClientRoot app={app} />
      </StrictMode>,
    );
    const client = read.at(-1)!;
    client.setQueryData(['orders'], ['kept']);
    await Promise.resolve();

    expect(app.queryClient).toBe(client);
    expect(client.getQueryData(['orders'])).toEqual(['kept']);
    await app.shutdown();
  });

  it('hands the first mount the cache code read before rendering', async () => {
    const read: QueryClient[] = [];
    function PageReader(): null {
      read.push(useQueryClient());
      return null;
    }
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: <PageReader /> }),
    );
    const before = app.services.resolve(queryClientToken).current;

    render(<AppClientRoot app={app} />);

    expect(read.at(-1)).toBe(before);
    await app.shutdown();
  });

  it('keeps the query defaults the application had under Refine', async () => {
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: null }),
    );

    expect(app.queryClient.getDefaultOptions().queries).toMatchObject({
      refetchOnWindowFocus: false,
      placeholderData: keepPreviousData,
    });
    await app.shutdown();
  });

  it('gives each application its own query cache and empties it on shutdown', async () => {
    const first = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: null }),
    );
    const second = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: null }),
    );
    const cache = first.queryClient;
    cache.setQueryData(['orders'], ['first']);

    expect(second.queryClient).not.toBe(cache);
    expect(second.queryClient.getQueryData(['orders'])).toBeUndefined();

    await first.shutdown();
    expect(cache.getQueryData(['orders'])).toBeUndefined();
    await second.shutdown();
  });

  it('provides the application and its React providers around other children under a router of the caller', async () => {
    function Provided({ children }: { readonly children?: ReactNode }) {
      return <section aria-label='provided'>{children}</section>;
    }
    function Page(): ReactElement {
      const api = useApiClient();
      const location = useLocation();
      return (
        <p>
          {typeof api.request} at {location.pathname}
        </p>
      );
    }
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({
        routes: 'Default application routes',
        reactProviders: [Provided],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/orders']}>
        <AppClientProviders app={app}>
          <Page />
        </AppClientProviders>
      </MemoryRouter>,
    );

    expect(
      within(screen.getByRole('region', { name: 'provided' })).getByText(
        'function at /orders',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Default application routes'),
    ).not.toBeInTheDocument();
    await app.shutdown();
  });

  it('leaves React DOM root ownership to the host', async () => {
    const app = await createTestApplication(() =>
      defineAppClientRenderConfig({ routes: 'Hosted application' }),
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
