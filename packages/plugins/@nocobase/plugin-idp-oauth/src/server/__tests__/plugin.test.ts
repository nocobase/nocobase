/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginIdpOauthServer from '../plugin';

describe('plugin-idp-oauth > plugin', () => {
  test('registers client resolvers on the service', async () => {
    const resolver = {
      resolveClient: vi.fn().mockResolvedValue({
        client_id: 'app:alpha',
      }),
    };
    const app = {
      cacheManager: {
        createCache: vi.fn().mockResolvedValue({}),
      },
      use: vi.fn(),
      on: vi.fn(),
    };
    const plugin = new PluginIdpOauthServer(app as any, {
      name: 'idp-oauth',
    });

    plugin.service.registerClientResolver('app-supervisor', resolver);
    await plugin.load();

    await expect(plugin.service.resolveClient('app:alpha')).resolves.toEqual({
      client_id: 'app:alpha',
    });
    expect(resolver.resolveClient).toHaveBeenCalledWith('app:alpha', undefined);
  });
});
