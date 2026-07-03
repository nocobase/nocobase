/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMBED_LAYOUT_MODEL_CLASS, EMBED_LAYOUT_MODEL_UID } from '../constants';

const { registerCopyEmbedLinkFlow } = vi.hoisted(() => ({
  registerCopyEmbedLinkFlow: vi.fn(),
}));

vi.mock('../copyEmbedLinkFlow', () => ({
  registerCopyEmbedLinkFlow,
}));

describe('PluginEmbedClientV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    window.name = '';
  });

  it('registers embed layout through layoutManager instead of manual page routes', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const app = {
      flowEngine: {
        registerModels: vi.fn(),
        registerModelLoaders: vi.fn(),
      },
      layoutManager: {
        registerLayout: vi.fn(),
      },
      router: {
        add: vi.fn(),
      },
      providers: [],
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    await plugin.load();

    expect(app.flowEngine.registerModels).not.toHaveBeenCalled();
    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith({
      [EMBED_LAYOUT_MODEL_CLASS]: {
        loader: expect.any(Function),
      },
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledWith({
      routeName: 'embed',
      routePath: '/embed',
      uid: EMBED_LAYOUT_MODEL_UID,
      layoutModelClass: EMBED_LAYOUT_MODEL_CLASS,
      authCheck: false,
    });
    expect(app.router.add).not.toHaveBeenCalled();
    expect(app.providers).toHaveLength(1);
    expect(registerCopyEmbedLinkFlow).toHaveBeenCalledTimes(1);
  });

  it('sets token for embed route under router basename', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const storage = {};
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
      apiClient: {
        storagePrefix: '',
        storage: null,
        createStorage: vi.fn(() => storage),
        auth: {
          getToken: vi.fn(() => null),
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid?token=test-token');

    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).toHaveBeenCalledWith('sessionStorage');
    expect(app.apiClient.storage).toBe(storage);
    expect(app.apiClient.storagePrefix).toMatch(/^NOCOBASE_EMBED_[0-9A-Z]+_[0-9A-Z]+_$/);
    expect(app.apiClient.auth.setToken).toHaveBeenCalledWith('test-token');
  });

  it('uses stable embed session storage when refreshing an embed route without token', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const storage = {};
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        storagePrefix: '',
        storage: null,
        createStorage: vi.fn(() => storage),
        auth: {
          getToken: vi.fn(() => 'test-token'),
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid?token=test-token');
    await plugin.beforeLoad();
    const firstStoragePrefix = app.apiClient.storagePrefix;

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid');
    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).toHaveBeenCalledTimes(2);
    expect(app.apiClient.storage).toBe(storage);
    expect(app.apiClient.storagePrefix).toBe(firstStoragePrefix);
    expect(app.apiClient.auth.setToken).toHaveBeenCalledTimes(1);
    expect(app.apiClient.auth.setToken).toHaveBeenCalledWith('test-token');
  });

  it('restores the embed URL token after the auth interceptor clears it', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const { restoreEmbedSessionToken } = await import('../embedSession');
    const values: Record<string, string> = {};
    const storage = {
      getItem: vi.fn((key: string) => values[key] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[key] = value;
      }),
    };
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
        },
        createStorage: vi.fn(() => storage),
        auth: {
          getToken: vi.fn(() => storage.getItem('token')),
          getAuthenticator: vi.fn(() => storage.getItem('auth')),
          setAuthenticator: vi.fn((authenticator: string | null) => storage.setItem('auth', authenticator || '')),
          setToken: vi.fn((token: string | null) => storage.setItem('token', token || '')),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid?token=111');
    await plugin.beforeLoad();
    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid');
    storage.setItem('token', '');

    expect(restoreEmbedSessionToken(app as any)).toBe(true);
    expect(values.token).toBe('111');
  });

  it('restores an existing embed session token after refreshing without a query token', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const { restoreEmbedSessionToken } = await import('../embedSession');
    const values: Record<string, string> = {
      auth: 'basic',
      token: '222',
    };
    const storage = {
      getItem: vi.fn((key: string) => values[key] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[key] = value;
      }),
    };
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
        },
        createStorage: vi.fn(() => storage),
        auth: {
          getToken: vi.fn(() => storage.getItem('token')),
          getAuthenticator: vi.fn(() => storage.getItem('auth')),
          setAuthenticator: vi.fn((authenticator: string | null) => storage.setItem('auth', authenticator || '')),
          setToken: vi.fn((token: string | null) => storage.setItem('token', token || '')),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid');
    await plugin.beforeLoad();
    storage.setItem('token', '');
    storage.setItem('auth', '');

    expect(restoreEmbedSessionToken(app as any)).toBe(true);
    expect(values.token).toBe('222');
    expect(values.auth).toBe('basic');
  });

  it('uses isolated embed session storage for embed route without query token', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const originalStorage = {};
    const embedStorage = {};
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: originalStorage,
        createStorage: vi.fn(() => embedStorage),
        auth: {
          getToken: vi.fn(() => null),
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid');
    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).toHaveBeenCalledWith('sessionStorage');
    expect(app.apiClient.auth.getToken).toHaveBeenCalledTimes(1);
    expect(app.apiClient.storagePrefix).toMatch(/^NOCOBASE_EMBED_[0-9A-Z]+_[0-9A-Z]+_$/);
    expect(app.apiClient.storage).toBe(embedStorage);
    expect(app.apiClient.auth.setToken).not.toHaveBeenCalled();
  });

  it('does not read the default login token for embed route without query token', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const originalStorage = {
      getItem: vi.fn(() => 'admin-token'),
      setItem: vi.fn(),
    };
    const embedStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    let activeStorage = originalStorage;
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: originalStorage,
        createStorage: vi.fn(() => {
          activeStorage = embedStorage;
          return embedStorage;
        }),
        auth: {
          getToken: vi.fn(() => activeStorage.getItem('token')),
          setToken: vi.fn((token: string | null) => activeStorage.setItem('token', token || '')),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid');
    await plugin.beforeLoad();

    expect(app.apiClient.storage).toBe(embedStorage);
    expect(app.apiClient.auth.getToken()).toBeNull();
    expect(embedStorage.getItem).toHaveBeenCalledWith('token');
    expect(originalStorage.getItem).not.toHaveBeenCalled();
    expect(app.apiClient.auth.setToken).not.toHaveBeenCalled();
  });

  it('restores default storage when leaving an embed route', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const originalStorage = {};
    const embedStorage = {};
    const dispatchEvent = vi.fn();
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      eventBus: {
        dispatchEvent,
      },
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: originalStorage,
        createStorage: vi.fn(() => embedStorage),
        auth: {
          getToken: vi.fn(() => 'admin-token'),
          getAuthenticator: vi.fn(() => 'basic'),
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid?token=test-token');
    await plugin.beforeLoad();

    expect(app.apiClient.storage).toBe(embedStorage);
    expect(app.apiClient.storagePrefix).toMatch(/^NOCOBASE_EMBED_[0-9A-Z]+_[0-9A-Z]+_$/);

    window.history.pushState({}, '', '/v2/apps/app1/admin');
    await plugin.beforeLoad();

    expect(app.apiClient.storagePrefix).toBe('NOCOBASE_');
    expect(app.apiClient.storage).toBe(originalStorage);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0].type).toBe('auth:tokenChanged');
    expect(dispatchEvent.mock.calls[0][0].detail).toEqual({
      token: 'admin-token',
      authenticator: 'basic',
    });
  });

  it('uses different embed storage prefixes for different router basenames', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const createApp = (basename: string) => ({
      router: {
        getBasename: () => basename,
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        storagePrefix: '',
        storage: null,
        createStorage: vi.fn(() => ({})),
        auth: {
          getToken: vi.fn(() => null),
          setToken: vi.fn(),
        },
      },
    });
    const app1 = createApp('/v2/apps/app1');
    const app2 = createApp('/v2/apps/app2');

    window.name = 'embed-frame';
    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid?token=test-token');
    await new PluginEmbedClientV2({} as any, app1 as any).beforeLoad();

    window.history.pushState({}, '', '/v2/apps/app2/embed/page-uid?token=test-token');
    await new PluginEmbedClientV2({} as any, app2 as any).beforeLoad();

    expect(app1.apiClient.storagePrefix).toMatch(/^NOCOBASE_EMBED_[0-9A-Z]+_[0-9A-Z]+_$/);
    expect(app2.apiClient.storagePrefix).toMatch(/^NOCOBASE_EMBED_[0-9A-Z]+_[0-9A-Z]+_$/);
    expect(app1.apiClient.storagePrefix).not.toBe(app2.apiClient.storagePrefix);
  });

  it('does not set token for non-embed route under router basename', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const app = {
      router: {
        getBasename: () => '/v2/apps/app1',
      },
      getPublicPath: () => '/v2/',
      apiClient: {
        createStorage: vi.fn(),
        auth: {
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/embed/page-uid?token=test-token');

    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).not.toHaveBeenCalled();
    expect(app.apiClient.auth.setToken).not.toHaveBeenCalled();
  });
});
