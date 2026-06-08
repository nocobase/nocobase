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

class SkippedPublicRoutePlugin extends Plugin {
  async load() {
    this.router.add('public', {
      path: '/public',
      skipAuthCheck: true,
      Component: () => <div>public page</div>,
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
