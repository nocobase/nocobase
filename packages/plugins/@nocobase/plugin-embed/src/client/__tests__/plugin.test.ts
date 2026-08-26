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
