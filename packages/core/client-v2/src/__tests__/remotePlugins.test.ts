/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../Plugin';
import { defineDevPlugins, definePluginClient, getPlugins } from '../utils/remotePlugins';

describe('client-v2 remotePlugins', () => {
  afterEach(() => {
    window.define = undefined;
  });

  it('should define dev plugins with /client-v2 module ids', () => {
    class DemoPlugin extends Plugin {}

    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    defineDevPlugins({
      '@nocobase/demo': DemoPlugin,
    });

    expect(mockDefine).toHaveBeenCalledWith('@nocobase/demo/client-v2', expect.any(Function));
  });

  it('should define remote plugin proxies with /client-v2 module ids', () => {
    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    definePluginClient('@nocobase/demo');

    expect(mockDefine).toHaveBeenCalledWith(
      '@nocobase/demo/client-v2',
      ['exports', '@nocobase/demo'],
      expect.any(Function),
    );
  });

  it('should not define /client aliases when loading v2 plugins', async () => {
    class DemoPlugin extends Plugin {}

    const requirejs: any = {
      requirejs: vi.fn(),
    };
    requirejs.requirejs.config = vi.fn();
    requirejs.requirejs.requirejs = vi.fn();

    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    const plugins = await getPlugins({
      requirejs,
      pluginData: [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo.com/dist/client-v2/index.js',
        },
      ] as any,
      devDynamicImport: vi.fn().mockResolvedValue({ default: DemoPlugin }) as any,
    });

    expect(plugins).toEqual([['@nocobase/demo', DemoPlugin]]);
    expect(mockDefine).toHaveBeenCalledWith('@nocobase/demo/client-v2', expect.any(Function));
    expect(mockDefine).not.toHaveBeenCalledWith('@nocobase/demo/client', expect.any(Function));
  });
});
