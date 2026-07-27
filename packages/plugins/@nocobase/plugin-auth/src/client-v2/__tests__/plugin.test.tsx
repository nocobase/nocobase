/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
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

  it('should use the existing v2 signin document for a Settings runtime 401', async () => {
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

    expect(replace).toHaveBeenCalledWith('/v/signin?redirect=%2Fsettings%2Fworkflow%3Ftab%3Dlist%23recent');
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
