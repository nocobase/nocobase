/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registerCopyEmbedLinkFlow } = vi.hoisted(() => ({
  registerCopyEmbedLinkFlow: vi.fn(),
}));

vi.mock('@nocobase/client', () => ({
  PageTabs: vi.fn(),
  Plugin: class {
    app: { apiClient: unknown; router: unknown; schemaSettingsManager: unknown };
    router: unknown;
    schemaSettingsManager: unknown;

    constructor(_options: unknown, app: { apiClient: unknown; router: unknown; schemaSettingsManager: unknown }) {
      this.app = app;
      this.router = app.router;
      this.schemaSettingsManager = app.schemaSettingsManager;
    }
  },
}));

vi.mock('../EmbedLayout', () => ({
  EmbedLayout: vi.fn(),
  EmbedPage: vi.fn(),
  useBlockSettingProps: vi.fn(),
}));

vi.mock('../../client-v2/copyEmbedLinkFlow', () => ({
  registerCopyEmbedLinkFlow,
}));

describe('PluginEmbedClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    window.name = '';
  });

  function createApp() {
    const rejectedHandlers: Array<(error: unknown) => unknown> = [];
    const app = {
      apiClient: {
        axios: {
          interceptors: {
            response: {
              use: vi.fn((_fulfilled, rejected) => {
                rejectedHandlers.push(rejected);
                return rejectedHandlers.length - 1;
              }),
            },
          },
        },
      },
      getPublicPath: () => '/',
      router: {
        add: vi.fn(),
      },
      schemaSettingsManager: {
        addItem: vi.fn(),
      },
    };

    return {
      app,
      rejectedHandlers,
    };
  }

  it('registers the v2 copy embed action for flow pages rendered by the v1 admin route', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const { app } = createApp();
    const plugin = new PluginEmbedClient({} as never, app as never);

    await plugin.load();

    expect(app.router.add).toHaveBeenCalledWith(
      'embed',
      expect.objectContaining({
        path: '/embed',
        skipAuthCheck: true,
      }),
    );
    expect(app.router.add).toHaveBeenCalledWith(
      'embed.page',
      expect.objectContaining({
        path: '/embed/:name',
        skipAuthCheck: true,
      }),
    );
    expect(app.router.add).toHaveBeenCalledWith(
      'embed.page.flowTab',
      expect.objectContaining({
        path: '/embed/:name/tab/:tabUid',
        skipAuthCheck: true,
      }),
    );
    expect(app.router.add).toHaveBeenCalledWith(
      'embed.page.view',
      expect.objectContaining({
        path: '/embed/:name/view/*',
        skipAuthCheck: true,
      }),
    );
    expect(app.router.add).toHaveBeenCalledWith(
      'embed.page.flowTabView',
      expect.objectContaining({
        path: '/embed/:name/tab/:tabUid/view/*',
        skipAuthCheck: true,
      }),
    );
    expect(app.schemaSettingsManager.addItem).toHaveBeenCalledWith('PageSettings', 'embed', {
      type: 'item',
      useComponentProps: expect.any(Function),
    });
    expect(registerCopyEmbedLinkFlow).toHaveBeenCalledTimes(1);
  });

  it('sets token in isolated embed session storage for embed route', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const embedStorage = {};
    const app = {
      getPublicPath: () => '/',
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: {},
        createStorage: vi.fn(() => embedStorage),
        auth: {
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClient({} as never, app as never);

    window.history.pushState({}, '', '/embed/page-uid?token=test-token');
    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).toHaveBeenCalledWith('sessionStorage');
    expect(app.apiClient.storagePrefix).toMatch(/^NOCOBASE_EMBED_[0-9A-Z]+_[0-9A-Z]+_$/);
    expect(app.apiClient.storage).toBe(embedStorage);
    expect(app.apiClient.auth.setToken).toHaveBeenCalledWith('test-token');
  });

  it('uses isolated embed session storage for embed route without query token', async () => {
    const { default: PluginEmbedClient } = await import('../index');
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
      getPublicPath: () => '/',
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
    const plugin = new PluginEmbedClient({} as never, app as never);

    window.history.pushState({}, '', '/embed/page-uid');
    await plugin.beforeLoad();

    expect(app.apiClient.storage).toBe(embedStorage);
    expect(app.apiClient.auth.getToken()).toBeNull();
    expect(embedStorage.getItem).toHaveBeenCalledWith('token');
    expect(originalStorage.getItem).not.toHaveBeenCalled();
    expect(app.apiClient.auth.setToken).not.toHaveBeenCalled();
  });

  it('does not switch storage outside embed routes', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const app = {
      getPublicPath: () => '/',
      apiClient: {
        storagePrefix: 'NOCOBASE_',
        storage: {},
        createStorage: vi.fn(),
        auth: {
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClient({} as never, app as never);

    window.history.pushState({}, '', '/admin/page-uid?token=test-token');
    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).not.toHaveBeenCalled();
    expect(app.apiClient.auth.setToken).not.toHaveBeenCalled();
  });

  it('lets embed routes render 403 after auth-check returns 401', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const { isEmbedUnauthorizedUser } = await import('../embedAuth');
    const { app, rejectedHandlers } = createApp();
    const plugin = new PluginEmbedClient({} as never, app as never);
    window.history.pushState({}, '', '/embed/page-uid');

    await plugin.load();
    const response = rejectedHandlers[0]({
      config: {
        url: '/auth:check',
      },
      response: {
        status: 401,
      },
    }) as { data?: { data?: unknown } };

    expect(isEmbedUnauthorizedUser(response?.data?.data)).toBe(true);
  });

  it('keeps the embed URL token in session storage after auth-check returns 401', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const values: Record<string, string> = {};
    const originalStorage = {
      getItem: vi.fn((key: string) => values[`original:${key}`] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[`original:${key}`] = value;
      }),
    };
    const embedStorage = {
      getItem: vi.fn((key: string) => values[key] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[key] = value;
      }),
    };
    let activeStorage = originalStorage;
    const rejectedHandlers: Array<(error: unknown) => unknown> = [];
    const app = {
      apiClient: {
        axios: {
          interceptors: {
            response: {
              use: vi.fn((_fulfilled, rejected) => {
                rejectedHandlers.push(rejected);
                return rejectedHandlers.length - 1;
              }),
            },
          },
        },
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
      getPublicPath: () => '/',
      router: {
        add: vi.fn(),
      },
      schemaSettingsManager: {
        addItem: vi.fn(),
      },
    };
    const plugin = new PluginEmbedClient({} as never, app as never);

    window.history.pushState({}, '', '/embed/page-uid?token=111');
    await plugin.beforeLoad();
    await plugin.load();
    window.history.pushState({}, '', '/embed/page-uid');
    embedStorage.setItem('token', '');

    const response = rejectedHandlers[0]({
      config: {
        url: '/auth:check',
      },
      response: {
        status: 401,
      },
    }) as { data?: { data?: unknown } };

    expect(values.token).toBe('111');
    expect(response?.data?.data).toEqual(
      expect.objectContaining({
        id: '__nocobase_embed_unauthorized__',
      }),
    );
  });

  it('keeps an existing embed session token after refresh without a query token', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const values: Record<string, string> = {
      auth: 'basic',
      token: '222',
    };
    const originalStorage = {
      getItem: vi.fn((key: string) => values[`original:${key}`] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[`original:${key}`] = value;
      }),
    };
    const embedStorage = {
      getItem: vi.fn((key: string) => values[key] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[key] = value;
      }),
    };
    let activeStorage = originalStorage;
    const rejectedHandlers: Array<(error: unknown) => unknown> = [];
    const app = {
      apiClient: {
        axios: {
          interceptors: {
            response: {
              use: vi.fn((_fulfilled, rejected) => {
                rejectedHandlers.push(rejected);
                return rejectedHandlers.length - 1;
              }),
            },
          },
        },
        storagePrefix: 'NOCOBASE_',
        storage: originalStorage,
        createStorage: vi.fn(() => {
          activeStorage = embedStorage;
          return embedStorage;
        }),
        auth: {
          getToken: vi.fn(() => activeStorage.getItem('token')),
          getAuthenticator: vi.fn(() => activeStorage.getItem('auth')),
          setAuthenticator: vi.fn((authenticator: string | null) => activeStorage.setItem('auth', authenticator || '')),
          setToken: vi.fn((token: string | null) => activeStorage.setItem('token', token || '')),
        },
      },
      getPublicPath: () => '/',
      router: {
        add: vi.fn(),
      },
      schemaSettingsManager: {
        addItem: vi.fn(),
      },
    };
    const plugin = new PluginEmbedClient({} as never, app as never);

    window.history.pushState({}, '', '/embed/page-uid');
    await plugin.beforeLoad();
    await plugin.load();
    embedStorage.setItem('token', '');
    embedStorage.setItem('auth', '');

    const response = rejectedHandlers[0]({
      config: {
        url: '/auth:check',
      },
      response: {
        status: 401,
      },
    }) as { data?: { data?: unknown } };

    expect(values.token).toBe('222');
    expect(values.auth).toBe('basic');
    expect(response?.data?.data).toEqual(
      expect.objectContaining({
        id: '__nocobase_embed_unauthorized__',
      }),
    );
  });

  it('restores the embed URL token for other 401 requests without swallowing the error', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const values: Record<string, string> = {};
    const originalStorage = {
      getItem: vi.fn((key: string) => values[`original:${key}`] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[`original:${key}`] = value;
      }),
    };
    const embedStorage = {
      getItem: vi.fn((key: string) => values[key] || null),
      setItem: vi.fn((key: string, value = '') => {
        values[key] = value;
      }),
    };
    let activeStorage = originalStorage;
    const rejectedHandlers: Array<(error: unknown) => unknown> = [];
    const app = {
      apiClient: {
        axios: {
          interceptors: {
            response: {
              use: vi.fn((_fulfilled, rejected) => {
                rejectedHandlers.push(rejected);
                return rejectedHandlers.length - 1;
              }),
            },
          },
        },
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
      getPublicPath: () => '/',
      router: {
        add: vi.fn(),
      },
      schemaSettingsManager: {
        addItem: vi.fn(),
      },
    };
    const plugin = new PluginEmbedClient({} as never, app as never);
    const error = {
      config: {
        url: '/blockTemplates:list',
      },
      response: {
        status: 401,
      },
    };

    window.history.pushState({}, '', '/embed/page-uid?token=111');
    await plugin.beforeLoad();
    await plugin.load();
    window.history.pushState({}, '', '/embed/page-uid');
    embedStorage.setItem('token', '');

    let thrown: unknown;
    try {
      rejectedHandlers[0](error);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBe(error);
    expect(values.token).toBe('111');
  });

  it('does not swallow auth-check errors outside embed routes', async () => {
    const { default: PluginEmbedClient } = await import('../index');
    const { app, rejectedHandlers } = createApp();
    const plugin = new PluginEmbedClient({} as never, app as never);
    const error = {
      config: {
        url: '/auth:check',
      },
      response: {
        status: 401,
      },
    };
    window.history.pushState({}, '', '/admin/page-uid');

    await plugin.load();

    let thrown: unknown;
    try {
      rejectedHandlers[0](error);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBe(error);
  });
});
