/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, createMockClient, NocoBaseBuildInPlugin, Plugin } from '@nocobase/client-v2';
import { useFlowEngineContext } from '@nocobase/flow-engine';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Outlet } from 'react-router-dom';

const waitForAppReady = async () => {
  await waitFor(() => {
    expect(document.querySelector('.ant-spin-spinning')).not.toBeInTheDocument();
  });
};

const renderApp = async (app: Application) => {
  const Root = app.getRootComponent();
  render(<Root />);
  await waitForAppReady();
  return Root;
};

describe('app', () => {
  describe('base application helpers', () => {
    const router = { type: 'memory' as const, initialEntries: ['/'] };

    afterEach(() => {
      document.querySelectorAll('link[rel="shortcut icon"]').forEach((node) => node.remove());
      vi.restoreAllMocks();
    });

    it('should normalize helper urls when pathname starts with slash', () => {
      const app = new Application({
        apiClient: {
          baseURL: 'https://123.1.2.3:13000/foo/api',
        },
      });

      expect(() => app.getApiUrl('/test/bar')).not.toThrow();
      expect(app.getApiUrl('/test/bar')).toBe('https://123.1.2.3:13000/foo/api/test/bar');
      expect(app.getRouteUrl('/test')).toBe('/test');
      expect(app.getHref('/test')).toBe('/test');
    });

    it('should apply the provided favicon immediately', () => {
      const app = new Application({ router });

      app.updateFavicon('/custom-favicon.ico');

      const favicon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      expect(favicon).toBeInTheDocument();
      expect(favicon.getAttribute('href')).toBe('/custom-favicon.ico');
    });

    it('should reject invalid component objects but keep valid exotic components', () => {
      const app = new Application({ router });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const ForwardRefComponent = React.forwardRef<HTMLDivElement, { label?: string }>((props, ref) => {
        return <div ref={ref}>{props.label || 'forward ref'}</div>;
      });
      ForwardRefComponent.displayName = 'ForwardRefComponent';

      expect(app.getComponent(ForwardRefComponent)).toBe(ForwardRefComponent);
      expect(app.getComponent({} as any)).toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it('should mount the app and display "Not Found"', async () => {
    const app = createMockClient();
    const element = document.createElement('div');
    act(() => {
      app.mount(element);
    });
    await waitFor(() => expect(element.textContent).toContain('Sorry, the page you visited does not exist.'));
  });

  it('should render default "Not Found" view', async () => {
    const app = createMockClient();
    await renderApp(app);
    expect(screen.getByText('Sorry, the page you visited does not exist.')).toBeInTheDocument();
  });

  it('should render custom "Not Found" component', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({
      plugins: [PluginHelloClient],
      components: { AppNotFound: () => <div>Not Found2</div> },
    });
    await renderApp(app);
    expect(screen.getByText('Not Found2')).toBeInTheDocument();
  });

  it('should support app provider functionality', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        this.app.use(() => <div>Hello Provider</div>);
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('Hello Provider')).toBeInTheDocument();
  });

  it('should expose notification and theme globals through flow context', async () => {
    const GlobalsProbe = () => {
      const ctx = useFlowEngineContext();
      return (
        <div>
          <div>{`notification:${Boolean(ctx.notification?.open)}`}</div>
          <div>{`themeToken:${Boolean(ctx.themeToken?.colorBgHeader)}`}</div>
          <div>{`antdConfig:${Boolean(ctx.antdConfig?.theme)}`}</div>
        </div>
      );
    };

    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('root', { path: '/', Component: GlobalsProbe });
      }
    }

    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('notification:true')).toBeInTheDocument();
    expect(screen.getByText('themeToken:true')).toBeInTheDocument();
    expect(screen.getByText('antdConfig:true')).toBeInTheDocument();
  });

  it('should support router functionality', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('root', { path: '/', Component: () => <div>Hello Route</div> });
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('Hello Route')).toBeInTheDocument();
  });

  it('should support router componentLoader lazy functionality', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('root', {
          path: '/',
          componentLoader: async () => ({
            default: () => <div>Hello Lazy Route</div>,
          }),
        });
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(await screen.findByText('Hello Lazy Route')).toBeInTheDocument();
  });

  it('should support publicPath basename for plugin routes', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('demo.route', {
          path: '/demo/app-info',
          componentLoader: async () => ({
            default: () => <div>Hello Basename Route</div>,
          }),
        });
      }
    }
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginHelloClient],
      router: { type: 'memory', initialEntries: ['/v2/demo/app-info'] },
    });
    await renderApp(app);
    expect(await screen.findByText('Hello Basename Route')).toBeInTheDocument();
  });

  it('should support plugin settings componentLoader lazy functionality', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        const pluginSettingsManager = this.pluginSettingsManager as any;
        pluginSettingsManager.addMenuItem({
          key: 'demo',
          title: 'Demo',
        });
        pluginSettingsManager.addPageTabItem({
          menuKey: 'demo',
          key: 'index',
          title: 'Demo',
          componentLoader: async () => ({
            default: () => <div>Hello Lazy Settings</div>,
          }),
        });
      }
    }
    const app = createMockClient({
      plugins: [PluginHelloClient],
      router: { type: 'memory', initialEntries: ['/admin/settings/demo'] },
    });
    app.router.add('admin', {
      path: '/admin',
      Component: Outlet,
    });
    app.router.add('admin.settings', {
      path: '/admin/settings',
      Component: Outlet,
    });
    await renderApp(app);
    expect(await screen.findByText('Hello Lazy Settings')).toBeInTheDocument();
  });

  it('should show maintaining state', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({ plugins: [PluginHelloClient] });
    app.maintained = false;
    app.maintaining = true;
    app.error = { code: 'APP_INITIALIZING', message: 'maintaining message' } as any;
    await renderApp(app);
    expect(screen.getByText('App initializing')).toBeInTheDocument();
    expect(screen.getByText('maintaining message')).toBeInTheDocument();
  });

  it('should show maintained dialog state', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({ plugins: [PluginHelloClient] });
    app.maintained = true;
    app.maintaining = true;
    app.error = { code: 'APP_INITIALIZING', message: 'maintaining dialog message' } as any;
    await renderApp(app);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('App initializing')).toBeInTheDocument();
    expect(screen.getByText('maintaining dialog message')).toBeInTheDocument();
  });

  it('should handle long loading state gracefully', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
  });

  it('should handle WebSocket maintaining and running states', async () => {
    const originalLocation = globalThis.window.location;
    const reloadMock = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    });

    try {
      class PluginHelloClient extends Plugin {
        async load() {
          this.router.add('root', { path: '/', Component: () => <div>Hello</div> });
        }
      }

      const app = createMockClient({
        plugins: [PluginHelloClient],
        ws: { url: 'ws://localhost:3000/ws' },
      });

      await renderApp(app);

      act(() => {
        app.ws.emit('message', {
          type: 'maintaining',
          payload: { code: 'APP_ERROR', message: 'maintaining error message' },
        });
      });

      expect(screen.getByText('maintaining error message')).toBeInTheDocument();

      act(() => {
        app.ws.emit('message', {
          type: 'maintaining',
          payload: { code: 'APP_RUNNING', message: 'app running message' },
        });
      });

      await waitFor(() => expect(screen.queryByText('maintaining error message')).not.toBeInTheDocument());
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(reloadMock).toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis.window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should handle plugin load error gracefully', async () => {
    class PluginHelloClient extends Plugin {
      async load() {
        throw new Error('plugin load error');
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    expect(screen.getByText('plugin load error')).toBeInTheDocument();
  });

  it('should keep providers mounted when app rerenders', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/7vu4c2sdk6h'] },
    });

    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Super Admin' } });
    app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, { data: [] });
    app.apiMock.onGet(/flowModels:findOne.*/).reply(200, { data: { uid: 'page-model' } });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check')).toHaveLength(1);
    });

    act(() => {
      app.maintaining = true;
      app.maintaining = false;
    });

    await waitFor(() => {
      expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check')).toHaveLength(1);
    });
  });

  it('should not recheck current user when switching admin pages', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/7vu4c2sdk6h'] },
    });

    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Super Admin' } });
    app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, { data: [] });
    app.apiMock.onGet(/flowModels:findOne.*/).reply(200, { data: { uid: 'page-model' } });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check')).toHaveLength(1);
    });

    await act(async () => {
      await app.router.navigate('/v2/admin/e4qpeoh8suv');
    });

    await waitFor(() => {
      expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check')).toHaveLength(1);
    });
  });
});
