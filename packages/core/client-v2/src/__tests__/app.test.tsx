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
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { escapeHTML, getAppVersionHTML } from '../utils';

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
      document.documentElement.removeAttribute('lang');
      delete window['__webpack_public_path__'];
      delete window['__nocobase_modern_client_prefix__'];
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

    it('should initialize shared jsonLogic operators', () => {
      const app = new Application({ router });

      expect(app.jsonLogic.apply({ $eq: [1, '1'] })).toBe(true);
      app.jsonLogic.addOperation('$testAlwaysTrue', () => true);
      expect(app.jsonLogic.apply({ $testAlwaysTrue: [] })).toBe(true);
    });

    it('should normalize publicPath and webpack public path with a single trailing slash', () => {
      const app = new Application({
        router,
        publicPath: '/admin//',
      });

      expect(app.getPublicPath()).toBe('/admin/');

      window['__webpack_public_path__'] = '/cdn/assets///';
      expect(app.getCdnUrl()).toBe('/cdn/assets/');

      delete window['__webpack_public_path__'];
      expect(app.getCdnUrl()).toBe('/admin/');
    });

    it('should normalize webpack public path without a trailing slash', () => {
      const app = new Application({
        router,
        publicPath: '/admin/',
      });

      window['__webpack_public_path__'] = '/cdn/assets';
      expect(app.getCdnUrl()).toBe('/cdn/assets/');
    });

    it('should remove the modern client prefix from the CDN fallback path', () => {
      const app = new Application({
        router,
        publicPath: '/v/',
      });

      expect(app.getCdnUrl()).toBe('/');
    });

    it('should preserve APP_PUBLIC_PATH when removing the modern client prefix', () => {
      const app = new Application({
        router,
        publicPath: '/nocobase/v/',
      });

      expect(app.getCdnUrl()).toBe('/nocobase/');
    });

    it('should support a custom modern client prefix', () => {
      window['__nocobase_modern_client_prefix__'] = 'modern';
      const app = new Application({
        router,
        publicPath: '/nocobase/modern/',
      });

      expect(app.getCdnUrl()).toBe('/nocobase/');
    });

    it('should apply the provided favicon immediately', () => {
      const app = new Application({ router });

      app.updateFavicon('/custom-favicon.ico');

      const favicon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      expect(favicon).toBeInTheDocument();
      expect(favicon.getAttribute('href')).toBe('/custom-favicon.ico');
    });

    it('should reset favicon to default when favicon is cleared', () => {
      const app = new Application({ router });

      app.updateFavicon('/custom-favicon.ico');
      app.updateFavicon(null);

      const favicon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      expect(favicon).toBeInTheDocument();
      expect(favicon.getAttribute('href')).toBe('/favicon/favicon.ico');
    });

    it('should reset favicon to default when favicon is explicitly undefined', () => {
      const app = new Application({ router });

      app.updateFavicon('/custom-favicon.ico');
      app.updateFavicon(undefined);

      const favicon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      expect(favicon).toBeInTheDocument();
      expect(favicon.getAttribute('href')).toBe('/favicon/favicon.ico');
    });

    it('should sync document language when app language changes', async () => {
      const app = new Application({ router });

      await app.i18n.changeLanguage('ja-JP');

      expect(document.documentElement.lang).toBe('ja-JP');
    });

    it('should escape app version html placeholder content', () => {
      expect(getAppVersionHTML('<script>alert(1)</script>&"')).toBe(
        '<span class="nb-app-version">v&lt;script&gt;alert(1)&lt;/script&gt;&amp;&quot;</span>',
      );
      expect(getAppVersionHTML(undefined)).toBe('');
      expect(escapeHTML("NocoBase <v2> & 'beta'")).toBe('NocoBase &lt;v2&gt; &amp; &#39;beta&#39;');
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

  it('should mount the base app with blank fallback route', async () => {
    const app = createMockClient();
    const element = document.createElement('div');
    act(() => {
      app.mount(element);
    });
    await waitFor(() => expect(element.querySelector('.ant-app')).not.toBeNull());
    expect(element.textContent).toBe('');
  });

  it('should render blank fallback route by default', async () => {
    const app = createMockClient();
    await renderApp(app);
    expect(screen.queryByText('Sorry, the page you visited does not exist.')).not.toBeInTheDocument();
  });

  it('should not render custom "Not Found" component before builtin routes are added', async () => {
    class PluginHelloClient extends Plugin {}
    const app = createMockClient({
      plugins: [PluginHelloClient],
      components: { AppNotFound: () => <div>Not Found2</div> },
    });
    await renderApp(app);
    expect(screen.queryByText('Not Found2')).not.toBeInTheDocument();
  });

  it('should render builtin "Not Found" view after builtin routes are added', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/missing'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });
    await renderApp(app);
    expect(screen.getByText('Sorry, the page you visited does not exist.')).toBeInTheDocument();
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
    expect(app.router.matchRoutes('/v2/demo/app-info')?.some((match) => match.route.path === '/demo/app-info')).toBe(
      true,
    );
    expect(app.router.matchRoutes('/demo/app-info')?.some((match) => match.route.path === '/demo/app-info')).toBe(true);
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

  it('should keep current content behind maintained dialog state', async () => {
    const CurrentPage = () => {
      const [count, setCount] = React.useState(0);
      return <button onClick={() => setCount((value) => value + 1)}>Current page count: {count}</button>;
    };

    class PluginHelloClient extends Plugin {
      async load() {
        this.router.add('root', { path: '/', Component: CurrentPage });
      }
    }
    const app = createMockClient({ plugins: [PluginHelloClient] });
    await renderApp(app);
    fireEvent.click(screen.getByRole('button', { name: 'Current page count: 0' }));
    expect(screen.getByRole('button', { name: 'Current page count: 1' })).toBeInTheDocument();

    act(() => {
      app.maintained = true;
      app.maintaining = true;
      app.error = { code: 'APP_COMMANDING', command: { name: 'pm.enable' }, message: 'starting sub applications...' };
    });

    expect(screen.getByRole('button', { name: 'Current page count: 1' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Enabling plugin')).toBeInTheDocument();
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
      // Aligned with v1: a routine maintaining→APP_RUNNING cycle does not
      // reload the page. Only `hasLoadError === true` (set when the initial
      // `app.load()` itself fails) triggers a recovery reload.
      expect(reloadMock).not.toHaveBeenCalled();
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
