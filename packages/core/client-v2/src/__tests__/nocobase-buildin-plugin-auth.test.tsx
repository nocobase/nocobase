/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, Plugin } from '@nocobase/client-v2';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { NocoBaseBuildInPlugin } from '../nocobase-buildin-plugin';

const TestingAppSpin = () => <div data-testid="app-spin">app spin</div>;

const TestingAppError = ({ error }: { error: Error }) => <div role="alert">{error.message}</div>;

class SkippedPublicRoutePlugin extends Plugin {
  async load() {
    this.router.add('public', {
      path: '/public',
      skipAuthCheck: true,
      Component: () => <div>public page</div>,
    });
  }
}

class DummySigninRoutePlugin extends Plugin {
  async load() {
    this.router.add('signin-test', {
      path: '/signin',
      skipAuthCheck: true,
      Component: () => <div>signin page</div>,
    });
  }
}

class AuthBootstrapRoutePlugin extends Plugin {
  async load() {
    this.router.add('secure', {
      path: '/secure',
      authCheck: true,
      Component: () => <div>secure page</div>,
    });
    this.router.add('guest', {
      path: '/guest',
      authCheck: false,
      Component: () => <div>guest page</div>,
    });
  }
}

describe('nocobase buildin plugin auth redirect', () => {
  const originalLocation = globalThis.window.location;

  beforeEach(() => {
    // These fixtures mount the modern client under the `v2` segment; tell the
    // runtime-prefix helper so v2-runtime detection matches (server injects it
    // in production).
    (globalThis.window as any).__nocobase_modern_client_prefix__ = 'v2';
    Object.defineProperty(globalThis.window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    delete (globalThis.window as any).__nocobase_modern_client_prefix__;
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('should navigate to v2 signin when /auth:check returns no user', async () => {
    // Aligns with v1: use react-router navigate (virtual) rather than
    // `window.location.replace`, so a `window.location.href` queued elsewhere
    // (e.g. 2FA's `code:302` response interceptor) can commit instead of being
    // overridden.
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/7vu4c2sdk6h'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: {} });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/v2/signin');
      expect(app.router.router.state.location.search).toBe('?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h');
    });
  });

  it('should short-circuit /auth:check when server returns code:302 instead of redirecting to signin', async () => {
    // When the server signals an intermediate redirect (typically 2FA verify),
    // CurrentUserProvider must NOT treat the missing `user.id` as "logged out"
    // and race the 2FA response interceptor with its own signin redirect.
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(200, {
      data: { code: 302, redirect: '/2fa?redirect=/admin' },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    // Give CurrentUserProvider time to process the response.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(app.router.router.state.location.pathname).toBe('/v2/admin');
    expect(app.router.router.state.location.search).toBe('');
  });

  it('should redirect unauthenticated v2 root access to v2 signin via <Navigate />', async () => {
    const app = createMockClient({
      publicPath: '/nocobase/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/nocobase/v2/'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/nocobase/v2/signin');
      expect(app.router.router.state.location.search).toBe('?redirect=%2Fnocobase%2Fv2%2Fadmin');
    });
  });

  it('should check current user after navigating from skipped route to v2 admin', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, SkippedPublicRoutePlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/public'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: {} });

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('public page')).toBeInTheDocument();
    const authCheckRequestsBeforeNavigation = app.apiMock.history.get.filter(
      (request) => request.url === '/auth:check',
    ).length;
    expect(authCheckRequestsBeforeNavigation).toBe(0);

    await act(async () => {
      await app.router.router.navigate('/v2/admin');
    });

    await waitFor(() => {
      expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check').length).toBeGreaterThan(
        authCheckRequestsBeforeNavigation,
      );
      expect(app.router.router.state.location.pathname).toBe('/v2/signin');
      expect(app.router.router.state.location.search).toBe('?redirect=%2Fv2%2Fadmin');
    });
  });

  it('should defer data source bootstrap until auth-required route is authenticated after signin redirect', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, DummySigninRoutePlugin as any, AuthBootstrapRoutePlugin as any],
      components: { AppSpin: TestingAppSpin },
      router: { type: 'memory', initialEntries: ['/v2/secure'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    const events: string[] = [];
    app.apiMock.onGet('/auth:check').replyOnce(() => {
      events.push('auth:first');
      return [200, { data: {} }];
    });
    app.apiMock.onGet('/auth:check').reply(() => {
      events.push('auth:second');
      return [200, { data: { id: 1 } }];
    });

    const ensureLoaded = vi.spyOn(app.dataSourceManager, 'ensureLoaded').mockImplementation(() => {
      if (!app.apiClient.auth.token) {
        const pending = new Promise<void>(() => undefined);
        app.dataSourceManager.loadingPromise = pending;
        return pending;
      }
      events.push('bootstrap');
      expect(events).toContain('auth:second');
      return Promise.resolve();
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/v2/signin');
      expect(app.router.router.state.location.search).toBe('?redirect=%2Fv2%2Fsecure');
    });
    expect(await screen.findByText('signin page')).toBeInTheDocument();
    expect(screen.queryByTestId('app-spin')).not.toBeInTheDocument();
    expect(ensureLoaded).not.toHaveBeenCalled();
    expect(app.dataSourceManager.loadingPromise).toBeNull();
    expect(events).toEqual(['auth:first']);

    act(() => {
      app.apiClient.auth.setToken('test-token');
    });

    await act(async () => {
      await app.router.router.navigate('/secure');
    });

    expect(await screen.findByText('secure page')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.ant-spin-spinning')).not.toBeInTheDocument();
    });
    expect(ensureLoaded).toHaveBeenCalledTimes(1);
  });

  it('should redirect on auth-required /auth:check 401 without bootstrapping data sources', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, DummySigninRoutePlugin as any, AuthBootstrapRoutePlugin as any],
      components: { AppSpin: TestingAppSpin },
      router: { type: 'memory', initialEntries: ['/v2/secure'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(401, { errors: [{ code: 'EMPTY_TOKEN' }] });
    const ensureLoaded = vi.spyOn(app.dataSourceManager, 'ensureLoaded').mockImplementation(() => {
      const pending = new Promise<void>(() => undefined);
      app.dataSourceManager.loadingPromise = pending;
      return pending;
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/v2/signin');
      expect(app.router.router.state.location.search).toBe('?redirect=%2Fv2%2Fsecure');
    });
    expect(await screen.findByText('signin page')).toBeInTheDocument();
    expect(screen.queryByTestId('app-spin')).not.toBeInTheDocument();
    expect(ensureLoaded).not.toHaveBeenCalled();
    expect(app.dataSourceManager.loadingPromise).toBeNull();
  });

  it('should surface non-auth /auth:check errors instead of leaving auth-required route spinning', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, AuthBootstrapRoutePlugin as any],
      components: { AppSpin: TestingAppSpin, AppError: TestingAppError },
      router: { type: 'memory', initialEntries: ['/v2/secure'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(500, { errors: [{ message: 'auth check failed' }] });
    const ensureLoaded = vi.spyOn(app.dataSourceManager, 'ensureLoaded').mockResolvedValue(undefined);

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status code 500');
    expect(screen.queryByTestId('app-spin')).not.toBeInTheDocument();
    expect(ensureLoaded).not.toHaveBeenCalled();
  });

  it.each(['/v2/signin', '/v2/public'])('should not bootstrap data sources on skipped auth route: %s', async (path) => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, DummySigninRoutePlugin as any, SkippedPublicRoutePlugin as any],
      components: { AppSpin: TestingAppSpin },
      router: { type: 'memory', initialEntries: [path] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    const ensureLoaded = vi.spyOn(app.dataSourceManager, 'ensureLoaded').mockResolvedValue(undefined);

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText(path === '/v2/signin' ? 'signin page' : 'public page')).toBeInTheDocument();
    expect(screen.queryByTestId('app-spin')).not.toBeInTheDocument();
    expect(ensureLoaded).not.toHaveBeenCalled();
    expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check')).toHaveLength(0);
  });

  it('should bootstrap data sources for authenticated auth-required route access', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, AuthBootstrapRoutePlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/secure'] },
    });
    app.apiClient.auth.setToken('test-token');
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1 } });
    const ensureLoaded = vi.spyOn(app.dataSourceManager, 'ensureLoaded').mockResolvedValue(undefined);

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('secure page')).toBeInTheDocument();
    expect(ensureLoaded).toHaveBeenCalledTimes(1);
  });

  it('should not auth-check or bootstrap authCheck false routes', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any, AuthBootstrapRoutePlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/guest'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    const ensureLoaded = vi.spyOn(app.dataSourceManager, 'ensureLoaded').mockResolvedValue(undefined);

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('guest page')).toBeInTheDocument();
    expect(ensureLoaded).not.toHaveBeenCalled();
    expect(app.apiMock.history.get.filter((request) => request.url === '/auth:check')).toHaveLength(0);
  });

  it('should render v2 admin root without redirecting away', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1 } });
    app.apiMock.onGet('systemSettings:get').reply(200, { data: {} });
    app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, {
      data: [
        {
          id: 1,
          title: 'Legacy page',
          schemaUid: 'legacy-page',
          type: 'page',
        },
      ],
    });

    const Root = app.getRootComponent();
    const { container } = render(<Root />);

    await waitFor(() => {
      expect(container.innerHTML).toContain('No pages yet, please configure first');
    });
    expect(app.router.router.state.location.pathname).toBe('/v2/admin');
    expect(container.innerHTML).not.toContain('Legacy page');
  });

  it.each(['/v2/admin/legacy-page/tab/tab-1', '/v2/admin/legacy-page/view/detail'])(
    'should show 404 for authenticated direct v1-style v2 page access: %s',
    async (pathname) => {
      const app = createMockClient({
        publicPath: '/v2/',
        plugins: [NocoBaseBuildInPlugin as any],
        router: { type: 'memory', initialEntries: [pathname] },
      });
      app.apiMock.onGet('app:getLang').reply(200, {
        data: { lang: 'en-US', resources: { client: {} }, cron: {} },
      });
      app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1 } });
      app.apiMock.onGet('systemSettings:get').reply(200, { data: {} });
      app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, {
        data: [
          {
            id: 1,
            title: 'Legacy page',
            schemaUid: 'legacy-page',
            type: 'page',
          },
        ],
      });

      const Root = app.getRootComponent();
      render(<Root />);

      expect(await screen.findByText('404')).toBeInTheDocument();
      expect(app.router.router.state.location.pathname).toBe(pathname);
    },
  );
});
