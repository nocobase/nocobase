import {
  ClientApplication,
  resolveAppUrl,
  useApiClient,
  useService,
  useToaster,
} from '@nocobase/app-client';
import { defineClientPlugin } from '@nocobase/app-client/plugins';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createServiceToken,
  ServiceProvider,
} from '@nocobase/service-provider';
// The shared React setup installs these matchers at run time; importing them here types them for `pnpm typecheck`.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { answerApi, renderWithApp } from '../../src/client/index.js';

interface Greeter {
  greet(name: string): string;
}

const greeterToken = createServiceToken<Greeter>('@example/plugin/greeter');

class GreeterProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@example/plugin/greeter';

  public override register(): void {
    this.app.container.instance(greeterToken, {
      greet: (name) => `Hello, ${name}`,
    });
  }
}

/** What the application did with `LifecycleProvider`, so a later test can see that an earlier one's app shut down. */
const lifecycle: string[] = [];

class LifecycleProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@example/lifecycle';

  public override start(): Promise<void> {
    lifecycle.push('start');
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    lifecycle.push('shutdown');
    return Promise.resolve();
  }
}

const lifecyclePlugin = defineClientPlugin({
  packageName: '@example/lifecycle',
  serviceProviders: [LifecycleProvider],
});

const examplePlugin = defineClientPlugin({
  packageName: '@example/plugin',
  serviceProviders: [GreeterProvider],
  locales: {
    'en-US': () => Promise.resolve({ title: 'Orders', saved: 'Saved' }),
  },
});

/** Loads `orders` through the API client, as a plugin page does. */
function OrdersPage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const toaster = useToaster();
  const location = useLocation();
  const [names, setNames] = useState<readonly string[]>([]);
  useEffect(() => {
    void api
      .request<{ data: { name: string }[] }>({ path: 'orders' })
      .then((body) => setNames(body.data.map((order) => order.name)));
  }, [api]);
  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{location.pathname}</p>
      <ul>
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <button
        type='button'
        onClick={() => toaster.show({ type: 'success', title: t('saved') })}
      >
        Save
      </button>
    </main>
  );
}

function GreetingPage(): ReactElement {
  return <p>{useService(greeterToken).greet('Ada')}</p>;
}

describe('renderWithApp', () => {
  it('preserves services, translations, router state and component state when rerendering', async () => {
    const starts = vi.fn();
    const fetch = vi.fn(() => Response.json({ data: [] }));
    function Probe({ name }: { name: string }): ReactElement {
      const api = useApiClient();
      const greeter = useService(greeterToken);
      const { t } = useTranslation();
      const location = useLocation();
      const [count, setCount] = useState(0);
      useEffect(() => {
        void api.request({ path: 'orders' });
      }, [api]);
      return (
        <>
          <h1>
            {t('title')}: {greeter.greet(name)}
          </h1>
          <p>{location.pathname}</p>
          <Link to='/next'>Next</Link>
          <button onClick={() => setCount(count + 1)}>Count {count}</button>
        </>
      );
    }
    const view = await renderWithApp(<Probe name='Ada' />, {
      plugins: [examplePlugin()],
      namespace: '@example/plugin',
      route: '/orders',
      fetch,
      services: starts,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Count 0' }));
    fireEvent.click(screen.getByRole('link', { name: 'Next' }));
    view.rerender(<Probe name='Grace' />);
    expect(
      screen.getByRole('heading', { name: 'Orders: Hello, Grace' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
    expect(screen.getByText('/next')).toBeInTheDocument();
    expect(starts).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it.each(['', '/', '/main', '/main/'])(
    'keeps router links and navigation under mount path %j',
    async (basePath) => {
      function Page(): ReactElement {
        const location = useLocation();
        return (
          <>
            <p>
              {location.pathname}
              {location.search}
              {location.hash}
            </p>
            <Link to='/next?tab=all#top'>Next</Link>
          </>
        );
      }
      await renderWithApp(<Page />, {
        route: '/orders?tab=open#list',
        server: { publicBasePath: basePath, fetch: () => Response.json({}) },
      });
      expect(screen.getByText('/orders?tab=open#list')).toBeInTheDocument();
      const prefix = basePath.replace(/\/$/u, '');
      expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
        'href',
        `${prefix}/next?tab=all#top`,
      );
      fireEvent.click(screen.getByRole('link', { name: 'Next' }));
      expect(screen.getByText('/next?tab=all#top')).toBeInTheDocument();
    },
  );

  it('uses a configured basename for the default initial route', async () => {
    await renderWithApp(<Link to='/orders'>Orders</Link>, {
      config: { app: { basePath: '/configured/' } },
    });
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/configured/orders',
    );
  });

  it.each(['locales', 'i18n', 'runtime'] as const)(
    'cleans configuration immediately when %s initialization fails',
    async (stage) => {
      const broken = defineClientPlugin({
        packageName: '@example/broken',
        locales:
          stage === 'locales'
            ? () => Promise.reject(new Error('locales failed'))
            : { 'en-US': () => Promise.reject(new Error('i18n failed')) },
      });
      await expect(
        renderWithApp(<p>Never rendered</p>, {
          plugins:
            stage === 'runtime'
              ? [examplePlugin(), examplePlugin()]
              : [broken()],
          server: { publicBasePath: '/stale', fetch: () => Response.json({}) },
        }),
      ).rejects.toThrow();
      expect(document.getElementById('nocobase-runtime-config')).toBeNull();
      function OrdersLink(): ReactElement {
        return <a href={resolveAppUrl('/orders')}>Orders</a>;
      }
      await renderWithApp(<OrdersLink />);
      expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
        'href',
        '/orders',
      );
    },
  );

  it('preserves a caller-owned configuration block when initialization fails', async () => {
    const block = document.createElement('script');
    block.id = 'nocobase-runtime-config';
    block.type = 'application/json';
    block.textContent = JSON.stringify({
      version: 1,
      config: { app: { basePath: '/owned' } },
    });
    document.head.append(block);
    try {
      await expect(
        renderWithApp(<p>Never rendered</p>, {
          plugins: [examplePlugin(), examplePlugin()],
        }),
      ).rejects.toThrow();
      expect(document.getElementById(block.id)).toBe(block);
    } finally {
      block.remove();
    }
  });

  it('renders a page in a client application, with its translations, router, API client and toaster', async () => {
    const fetch = vi.fn((request: Request) =>
      Response.json({ data: [{ name: `${request.method} ${request.url}` }] }),
    );

    const view = await renderWithApp(<OrdersPage />, {
      plugins: [examplePlugin()],
      namespace: '@example/plugin',
      route: '/orders',
      fetch,
    });

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByText('/orders')).toBeInTheDocument();
    expect(
      await screen.findByText('GET http://localhost/api/orders'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      screen.getByText('Saved').closest('[data-toast-type]'),
    ).toHaveAttribute('data-toast-type', 'success');
    expect(view.toasts()).toMatchObject([{ type: 'success', title: 'Saved' }]);
    expect(view.app).toBeInstanceOf(ClientApplication);
  });

  it('runs the services the plugins register', async () => {
    await renderWithApp(<GreetingPage />, { plugins: [examplePlugin()] });

    expect(screen.getByText('Hello, Ada')).toBeInTheDocument();
  });

  it('takes a stand-in for a service in place of the plugin that provides it', async () => {
    await renderWithApp(<GreetingPage />, {
      services: (app) =>
        app.container.instance(greeterToken, {
          greet: (name) => `Stand-in greets ${name}`,
        }),
    });

    expect(screen.getByText('Stand-in greets Ada')).toBeInTheDocument();
  });

  it('sends requests to a server in process, under its base path, with the session cookie', async () => {
    const requests: { url: string; cookie: string | null }[] = [];
    const server = {
      publicBasePath: '/main',
      fetch: (request: Request): Response => {
        requests.push({
          url: request.url,
          cookie: request.headers.get('cookie'),
        });
        return Response.json({ data: [{ name: 'From the server' }] });
      },
    };

    await renderWithApp(<OrdersPage />, {
      plugins: [examplePlugin()],
      namespace: '@example/plugin',
      server,
      cookie: 'session=abc',
    });

    expect(await screen.findByText('From the server')).toBeInTheDocument();
    expect(requests).toEqual([
      { url: 'http://localhost/main/api/orders', cookie: 'session=abc' },
    ]);
  });

  it("loads a plugin's locales given as a function importing its module", async () => {
    const loadingPlugin = defineClientPlugin({
      packageName: '@example/loading',
      locales: () =>
        Promise.resolve({
          'en-US': () => Promise.resolve({ title: 'Loaded orders' }),
        }),
    });
    function Title(): ReactElement {
      return <h1>{useTranslation().t('title')}</h1>;
    }

    await renderWithApp(<Title />, {
      plugins: [loadingPlugin()],
      namespace: '@example/loading',
    });

    expect(
      screen.getByRole('heading', { name: 'Loaded orders' }),
    ).toBeInTheDocument();
  });

  it('resolves URLs against the mount path, as a page the server rendered does', async () => {
    function Link(): ReactElement {
      return <a href={resolveAppUrl('/files/report.pdf')}>Report</a>;
    }
    const server = {
      publicBasePath: '/main',
      fetch: (): Response => Response.json({ data: [] }),
    };

    await renderWithApp(<Link />, { server });

    expect(screen.getByRole('link', { name: 'Report' })).toHaveAttribute(
      'href',
      '/main/files/report.pdf',
    );
  });

  it('removes the configuration it wrote into the document when the test finishes', () => {
    expect(document.getElementById('nocobase-runtime-config')).toBeNull();
  });

  it('shuts the application down when the page throws while rendering', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken(): ReactElement {
      throw new Error('broken page');
    }

    await expect(
      renderWithApp(<Broken />, { plugins: [lifecyclePlugin()] }),
    ).rejects.toThrow('broken page');
  });

  it('leaves no application running after a page that threw while rendering', () => {
    expect(lifecycle).toEqual(['start', 'shutdown']);
  });

  it.each(['startup', 'render'] as const)(
    'preserves the %s failure when shutdown also fails',
    async (stage) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const primaryError = new Error(`${stage} failed`);
      const cleanupError = new Error('shutdown failed');
      class BrokenProvider extends ServiceProvider<ClientApplication> {
        public readonly name: string = '@example/broken-cleanup';

        public override register(): void {
          if (stage === 'startup') throw primaryError;
        }

        public override shutdown(): Promise<void> {
          return Promise.reject(cleanupError);
        }
      }
      const plugin = defineClientPlugin({
        packageName: '@example/broken-cleanup',
        serviceProviders: [BrokenProvider],
      });
      function Page(): ReactElement {
        if (stage === 'render') throw primaryError;
        return <p>Never rendered</p>;
      }

      const error = await renderWithApp(<Page />, {
        plugins: [plugin()],
      }).catch((error: unknown) => error);

      expect(error).toBeInstanceOf(AggregateError);
      expect(error).toMatchObject({
        cause: cleanupError,
        errors: [
          stage === 'startup'
            ? expect.objectContaining({ errors: [primaryError, cleanupError] })
            : primaryError,
          cleanupError,
        ],
      });
      expect(document.getElementById('nocobase-runtime-config')).toBeNull();
      // The test-finished hook must not report the cleanup failure again after this assertion handles it.
    },
  );

  it('fails a request nothing answers instead of sending it anywhere', async () => {
    const errors: unknown[] = [];
    function Probe(): ReactElement {
      const api = useApiClient();
      useEffect(() => {
        api.request({ path: 'orders' }).catch((error: unknown) => {
          errors.push(error);
        });
      }, [api]);
      return <p>Probe</p>;
    }

    await renderWithApp(<Probe />);

    await waitFor(() => expect(errors).toHaveLength(1));
    expect(String(errors[0])).toContain(
      'Nothing answers GET http://localhost/api/orders',
    );
  });

  it('answers the API from calls rather than responses, and fails a call whose handler throws', async () => {
    const api = vi.fn((call: { path: string }) => {
      if (call.path === 'orders') return { data: [{ name: 'Answered' }] };
      throw new Error('No such route');
    });
    const errors: unknown[] = [];
    function Probe(): ReactElement {
      const client = useApiClient();
      useEffect(() => {
        void client
          .request({
            path: 'orders/export',
            method: 'POST',
            query: { format: 'csv', ids: [1, 2] },
            json: { all: true },
          })
          .catch((error: unknown) => {
            errors.push(error);
          });
      }, [client]);
      return <OrdersPage />;
    }

    await renderWithApp(<Probe />, {
      plugins: [examplePlugin()],
      namespace: '@example/plugin',
      fetch: answerApi(api),
    });

    expect(await screen.findByText('Answered')).toBeInTheDocument();
    await waitFor(() => expect(errors).toHaveLength(1));
    expect(String(errors[0])).toContain('No such route');
    expect(api).toHaveBeenCalledWith({
      method: 'POST',
      path: 'orders/export',
      query: { format: 'csv', ids: ['1', '2'] },
      json: { all: true },
    });
    expect(api).toHaveBeenCalledWith({ method: 'GET', path: 'orders' });
  });

  it('answers a request whose JSON body cannot be parsed with status 500 instead of failing the fetch', async () => {
    const api = vi.fn(() => ({ data: [] }));
    const errors: unknown[] = [];
    function Probe(): ReactElement {
      const client = useApiClient();
      useEffect(() => {
        void client
          .request({
            path: 'orders',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
          })
          .catch((error: unknown) => {
            errors.push(error);
          });
      }, [client]);
      return <p>Probe</p>;
    }

    await renderWithApp(<Probe />, { fetch: answerApi(api) });

    await waitFor(() => expect(errors).toHaveLength(1));
    expect(String(errors[0])).toContain('JSON');
    expect(api).not.toHaveBeenCalled();
  });
});
