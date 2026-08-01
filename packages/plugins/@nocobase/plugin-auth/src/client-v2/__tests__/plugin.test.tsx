/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, Plugin } from '@nocobase/client-v2';
import PluginAuthClientV2 from '../plugin';

describe('plugin-auth client-v2', () => {
  const originalLocation = globalThis.window.location;
  const originalModernClientPrefix = window.__nocobase_modern_client_prefix__;
  let debounceClock = Date.now();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockImplementation(() => debounceClock);
  });

  afterEach(() => {
    debounceClock += 3001;
    vi.advanceTimersByTime(3001);
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    if (originalModernClientPrefix === undefined) {
      delete window.__nocobase_modern_client_prefix__;
    } else {
      window.__nocobase_modern_client_prefix__ = originalModernClientPrefix;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should register a scoped signin route under the shared auth layout', async () => {
    const app = createMockClient({
      plugins: [PluginAuthClientV2 as unknown as typeof Plugin],
    });
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();

    const plugin = app.pm.get(PluginAuthClientV2);
    plugin.registerSignInRoute('customerPortalSignin', '/customer/signin');

    expect(app.router.get('auth.customerPortalSignin')).toMatchObject({
      path: '/customer/signin',
      skipAuthCheck: true,
    });
    expect(app.router.matchRoutes('/customer/signin')?.map((match) => match.route.id)).toEqual([
      'auth',
      'auth.customerPortalSignin',
    ]);
  });

  it('should register and resolve scoped signin and signup routes', async () => {
    const app = createMockClient({
      plugins: [PluginAuthClientV2 as unknown as typeof Plugin],
    });
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();

    const plugin = app.pm.get(PluginAuthClientV2);
    plugin.registerAuthRouteScope('customerPortal', '/customer/');
    plugin.registerAuthRouteScope('legacyPortal', '/legacy', {
      signin: 'legacyPortalSignin',
      signup: 'legacyPortalSignup',
    });

    expect(app.router.get('auth.customerPortalSignin')).toMatchObject({
      path: '/customer/signin',
      skipAuthCheck: true,
    });
    expect(app.router.get('auth.customerPortalSignup')).toMatchObject({
      path: '/customer/signup',
      skipAuthCheck: true,
    });
    expect(app.router.get('auth.legacyPortalSignin')?.path).toBe('/legacy/signin');
    expect(app.router.get('auth.legacyPortalSignup')?.path).toBe('/legacy/signup');
    expect(app.router.matchRoutes('/customer/signup')?.map((match) => match.route.id)).toEqual([
      'auth',
      'auth.customerPortalSignup',
    ]);
    expect(plugin.getAuthRoutePath('/customer/signin', 'auth.signup')).toBe('/customer/signup');
    expect(plugin.getAuthRoutePath('/customer/signup', 'auth.signin')).toBe('/customer/signin');
    expect(plugin.getAuthRoutePath('/signin', 'auth.signup')).toBe('/signup');
    expect(plugin.isScopedAuthRoute('/customer/signin')).toBe(true);
    expect(plugin.isScopedAuthRoute('/customer/signup')).toBe(true);
    expect(plugin.isScopedAuthRoute('/signin')).toBe(false);
    expect(plugin.getAuthRedirectFallbackPath('/customer/signin')).toBe('/customer');
    expect(plugin.getAuthRedirectFallbackPath('/signin')).toBe('/');
  });

  it('should keep runtime 401 redirects inside an explicitly registered Portal signin route', async () => {
    const navigateSpy = vi.fn();
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginAuthClientV2 as unknown as typeof Plugin],
      router: { type: 'memory', initialEntries: ['/v2/customer/dashboard?tab=overview#panel'] },
    });
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();
    app.pm.get(PluginAuthClientV2).registerSignInRoute('customerPortalSignin', '/customer/signin');
    app.router.add('customerPortal', { path: '/customer/*', authCheck: true });
    app.router.router = {
      basename: '/v2',
      navigate: navigateSpy,
      state: {
        location: {
          pathname: '/v2/customer/dashboard',
          search: '?tab=overview',
          hash: '#panel',
        },
      },
    } as unknown as typeof app.router.router;

    const error = {
      response: { status: 401, data: { errors: [{ code: 'EXPIRED_SESSION' }] } },
      config: {},
    };

    // @ts-ignore
    app.apiClient.axios.interceptors.response.handlers[0].rejected(error);

    await vi.waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(
        '/customer/signin?redirect=%2Fv2%2Fcustomer%2Fdashboard%3Ftab%3Doverview%23panel',
        {
          replace: true,
        },
      );
    });
  });

  it('should navigate to v2 signin on runtime 401 with EXPIRED_SESSION', async () => {
    // Aligns with v1: use react-router (data router) `navigate` rather than
    // `window.location.replace`, so a `window.location.href` queued by a sibling
    // response interceptor (e.g. plugin-two-factor-authentication's `code:302`
    // handler) can win the race instead of being clobbered.
    const navigateSpy = vi.fn();

    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/7vu4c2sdk6h?tab=overview#panel'] },
    });
    // `addPageTabItem({ menuKey: 'security' })` in plugin-auth's `load()` requires the parent menu to exist. In production, the v2 buildin plugin registers it; `createMockClient` does not load that plugin, so the test registers the menu directly before `app.load()`.
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();
    app.router.router = {
      basename: '/v2',
      navigate: navigateSpy,
      state: {
        location: {
          pathname: '/v2/admin/7vu4c2sdk6h',
          search: '?tab=overview',
          hash: '#panel',
        },
      },
    } as any;

    const error = {
      response: {
        status: 401,
        data: {
          errors: [{ code: 'EXPIRED_SESSION' }],
        },
      },
      config: {},
    } as any;

    // @ts-ignore
    app.apiClient.axios.interceptors.response.handlers[0].rejected(error);

    await vi.waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(
        '/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h%3Ftab%3Doverview%23panel',
        {
          replace: true,
        },
      );
    });
  });

  it('should clear auth token on runtime 401 with EXPIRED_SESSION', async () => {
    // The redirect uses navigate (no full-page reload), so the auth token must be
    // wiped explicitly — otherwise downstream requests on the in-memory page would
    // re-send the now-invalid token before the signin page mounts.
    const navigateSpy = vi.fn();
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/anywhere'] },
    });
    // `addPageTabItem({ menuKey: 'security' })` in plugin-auth's `load()` requires the parent menu to exist. In production, the v2 buildin plugin registers it; `createMockClient` does not load that plugin, so the test registers the menu directly before `app.load()`.
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();
    app.apiClient.auth.setToken('stale-token');
    app.router.router = {
      basename: '/v2',
      navigate: navigateSpy,
      state: { location: { pathname: '/v2/admin/anywhere', search: '', hash: '' } },
    } as any;

    const error = {
      response: { status: 401, data: { errors: [{ code: 'EXPIRED_SESSION' }] } },
      config: {},
    } as any;

    // @ts-ignore
    app.apiClient.axios.interceptors.response.handlers[0].rejected(error);

    await vi.waitFor(() => {
      expect(app.apiClient.auth.token).toBe('');
    });
  });

  it('should use the standalone Settings signin document for a Settings runtime 401', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    window.__nocobase_modern_client_prefix__ = 'v';
    const app = createMockClient({
      publicPath: '/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/settings/workflow?tab=list#recent'] },
    });
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();
    const getRoutePath = app.pluginSettingsManager.getRoutePath.bind(app.pluginSettingsManager);
    const getRouteName = app.pluginSettingsManager.getRouteName.bind(app.pluginSettingsManager);
    vi.spyOn(app.pluginSettingsManager, 'getRouteName').mockImplementation((name) => {
      return name === '' ? 'settings.' : getRouteName(name);
    });
    vi.spyOn(app.pluginSettingsManager, 'getRoutePath').mockImplementation((name) => {
      return name === '' ? '/settings/' : getRoutePath(name);
    });
    app.router.router = {
      basename: '/',
      navigate: vi.fn(),
      state: {
        location: {
          pathname: '/settings/workflow',
          search: '?tab=list',
          hash: '#recent',
        },
      },
    } as any;

    const error = {
      response: { status: 401, data: { errors: [{ code: 'EXPIRED_SESSION' }] } },
      config: {},
    } as any;

    // @ts-ignore
    app.apiClient.axios.interceptors.response.handlers[0].rejected(error);

    expect(replace).toHaveBeenCalledWith('/settings/signin?redirect=%2Fsettings%2Fworkflow%3Ftab%3Dlist%23recent');
  });

  it('should keep a sub-app Settings runtime in its document scope after a 401', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    const app = createMockClient({
      publicPath: '/nocobase/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/settings/workflow?tab=list#recent'] },
    });
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();
    const getRoutePath = app.pluginSettingsManager.getRoutePath.bind(app.pluginSettingsManager);
    const getRouteName = app.pluginSettingsManager.getRouteName.bind(app.pluginSettingsManager);
    vi.spyOn(app.pluginSettingsManager, 'getRouteName').mockImplementation((name) => {
      return name === '' ? 'settings.' : getRouteName(name);
    });
    vi.spyOn(app.pluginSettingsManager, 'getRoutePath').mockImplementation((name) => {
      return name === '' ? '/' : getRoutePath(name);
    });
    app.router.setBasename('/nocobase/settings/apps/demo/');
    app.router.router = {
      basename: '/nocobase/settings/apps/demo/',
      navigate: vi.fn(),
      state: {
        location: {
          pathname: '/nocobase/settings/apps/demo/workflow',
          search: '?tab=list',
          hash: '#recent',
        },
      },
    } as any;

    const error = {
      response: { status: 401, data: { errors: [{ code: 'EXPIRED_SESSION' }] } },
      config: {},
    } as any;

    // @ts-ignore
    app.apiClient.axios.interceptors.response.handlers[0].rejected(error);

    expect(replace).toHaveBeenCalledWith(
      '/nocobase/settings/apps/demo/signin?redirect=%2Fnocobase%2Fsettings%2Fapps%2Fdemo%2Fworkflow%3Ftab%3Dlist%23recent',
    );
  });

  it('should not redirect skipped auth routes on runtime 401', async () => {
    const navigateSpy = vi.fn();
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/signin'] },
    });
    // `addPageTabItem({ menuKey: 'security' })` in plugin-auth's `load()` requires the parent menu to exist. In production, the v2 buildin plugin registers it; `createMockClient` does not load that plugin, so the test registers the menu directly before `app.load()`.
    app.pluginSettingsManager.addMenuItem({ key: 'security', title: 'Security' });
    await app.load();
    app.router.router = {
      basename: '/v2',
      navigate: navigateSpy,
      state: {
        location: {
          pathname: '/v2/signin',
          search: '',
          hash: '',
        },
      },
    } as any;

    const error = {
      response: {
        status: 401,
        data: {
          errors: [{ code: 'EXPIRED_SESSION' }],
        },
      },
      config: {},
    } as any;

    try {
      // @ts-ignore
      await app.apiClient.axios.interceptors.response.handlers[0].rejected(error);
      throw new Error('expected interceptor to throw');
    } catch (thrownError) {
      expect(thrownError).toBe(error);
    }
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
