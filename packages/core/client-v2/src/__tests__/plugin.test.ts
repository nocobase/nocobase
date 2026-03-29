/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, Plugin } from '@nocobase/client-v2';

describe('PluginManager', () => {
  it('should request remote plugins from pm:listEnabledV2', async () => {
    const app = createMockClient({
      loadRemotePlugins: true,
    });
    app.apiMock.onGet('pm:listEnabledV2').reply(200, { data: [] });

    await app.load();

    expect(app.apiMock.history.get).toHaveLength(1);
    expect(app.apiMock.history.get[0]?.url).toBe('pm:listEnabledV2');
  });

  it('should not request remote plugins from pm:listEnabled', async () => {
    const app = createMockClient({
      loadRemotePlugins: true,
    });
    app.apiMock.onGet('pm:listEnabledV2').reply(200, { data: [] });

    await app.load();

    expect(app.apiMock.history.get.some((request) => request.url === 'pm:listEnabled')).toBe(false);
  });

  it('should define client-v2 module ids for dev plugins', async () => {
    class DemoPlugin extends Plugin {}

    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    const app = createMockClient({
      loadRemotePlugins: true,
      devDynamicImport: vi.fn().mockResolvedValue({ default: DemoPlugin }) as any,
    });
    app.apiMock.onGet('pm:listEnabledV2').reply(200, {
      data: [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo.com/dist/client-v2/index.js',
        },
      ],
    });

    await app.load();

    expect(mockDefine).toHaveBeenCalledWith('@nocobase/demo/client-v2', expect.any(Function));
    expect(mockDefine).not.toHaveBeenCalledWith('@nocobase/demo/client', expect.any(Function));
  });
});
