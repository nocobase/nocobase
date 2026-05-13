/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../Plugin';
import { getRequireJs } from '../utils/requirejs';
import { configRequirejs, defineDevPlugins, getPlugins } from '../utils/remotePlugins';

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

  it('should request remote plugins when devDynamicImport only resolves some plugins', async () => {
    class DemoPlugin extends Plugin {}

    const remoteFn = vi.fn();
    const requirejs: any = {
      requirejs: (pluginData, resolve) => {
        remoteFn();
        resolve({ default: DemoPlugin });
      },
    };
    requirejs.requirejs.config = vi.fn();

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
        {
          name: '@nocobase/remote',
          packageName: '@nocobase/remote',
          url: 'https://remote.com/dist/client-v2/index.js',
        },
      ] as any,
      devDynamicImport: ((packageName) => {
        if (packageName === '@nocobase/demo') {
          return Promise.resolve({ default: DemoPlugin });
        }
        return Promise.resolve(null);
      }) as any,
    });

    expect(plugins).toEqual([
      ['@nocobase/demo', DemoPlugin],
      ['@nocobase/remote', DemoPlugin],
    ]);
    expect(remoteFn).toHaveBeenCalledTimes(1);
    expect(mockDefine).toHaveBeenCalledTimes(1);
    expect(requirejs.requirejs.config).toHaveBeenCalledWith({
      waitSeconds: 120,
      paths: {
        '@nocobase/remote/client-v2': 'https://remote.com/dist/client-v2/index.js',
      },
    });
  });

  it('should configure remote plugin paths with /client-v2 module ids', () => {
    const requirejs: any = {
      requirejs: {
        config: vi.fn(),
      },
    };

    configRequirejs(requirejs, [
      {
        packageName: '@nocobase/demo',
        url: '/static/plugins/@nocobase/demo/dist/client-v2/index.js',
      },
    ] as any);

    expect(requirejs.requirejs.config).toHaveBeenCalledWith({
      waitSeconds: 120,
      paths: {
        '@nocobase/demo/client-v2': '/static/plugins/@nocobase/demo/dist/client-v2/index.js',
      },
    });
  });

  it('should not append duplicate .js for plugin URLs without query strings', () => {
    const requirejs = getRequireJs();

    requirejs.requirejs.config({
      paths: {
        '@nocobase/demo/client-v2': '/static/plugins/@nocobase/demo/dist/client-v2/index.js',
      },
    });

    expect(requirejs.requirejs.toUrl('@nocobase/demo/client-v2')).toBe(
      '/static/plugins/@nocobase/demo/dist/client-v2/index.js',
    );
  });

  it('should keep hashed plugin URLs unchanged', () => {
    const requirejs = getRequireJs();

    requirejs.requirejs.config({
      paths: {
        '@nocobase/demo/client-v2': '/static/plugins/@nocobase/demo/dist/client-v2/index.js?hash=12345678',
      },
    });

    expect(requirejs.requirejs.toUrl('@nocobase/demo/client-v2')).toBe(
      '/static/plugins/@nocobase/demo/dist/client-v2/index.js?hash=12345678',
    );
  });
});
