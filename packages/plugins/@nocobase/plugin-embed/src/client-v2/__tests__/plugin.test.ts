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
          setToken: vi.fn(),
        },
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    window.history.pushState({}, '', '/v2/apps/app1/embed/page-uid?token=test-token');

    await plugin.beforeLoad();

    expect(app.apiClient.createStorage).toHaveBeenCalledWith('sessionStorage');
    expect(app.apiClient.storage).toBe(storage);
    expect(app.apiClient.auth.setToken).toHaveBeenCalledWith('test-token');
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
