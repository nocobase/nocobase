/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../../Plugin';
import { getRequireJs } from '../../utils/requirejs';
import {
  configRequirejs,
  defineDevPlugins,
  definePluginClient,
  getPlugins,
  getRemotePlugins,
  processRemotePlugins,
} from '../../utils/remotePlugins';

describe('remotePlugins', () => {
  afterEach(() => {
    window.define = undefined;
  });

  describe('defineDevPlugins()', () => {
    it('should define plugins', () => {
      class DemoPlugin extends Plugin {}

      const plugins = {
        '@nocobase/demo': DemoPlugin,
      };

      const mockDefine: any = vi.fn();
      window.define = mockDefine;

      defineDevPlugins(plugins);

      expect(mockDefine).toBeCalledTimes(1);
      expect(mockDefine).toBeCalledWith('@nocobase/demo/client', expect.any(Function));
    });

    it('should return Plugin', () => {
      class DemoPlugin extends Plugin {}
      const plugins = {
        '@nocobase/demo': DemoPlugin,
      };
      const define: any = function (packageName: string, load: any) {
        expect(packageName).toEqual('@nocobase/demo/client');
        expect(load()).toEqual(DemoPlugin);
      };
      window.define = define;

      defineDevPlugins(plugins);
    });
  });

  describe('definePluginClient()', () => {
    it('should define plugins', () => {
      const mockDefine: any = vi.fn();
      window.define = mockDefine;

      definePluginClient('@nocobase/demo');

      expect(mockDefine).toBeCalledTimes(1);
      expect(mockDefine).toBeCalledWith('@nocobase/demo/client', ['exports', '@nocobase/demo'], expect.any(Function));
    });

    it('should proxy', () => {
      const mockDefine: any = vi.fn();
      window.define = mockDefine;

      definePluginClient('@nocobase/demo');

      const exports: any = {
        a: 'a',
      };
      const pluginExports = {
        a: 1,
        b: 2,
      };
      const proxy = mockDefine.mock.calls[0][2];
      proxy(exports, pluginExports);

      expect(exports.__esModule).toBe(true);
      expect(exports.a).toBe(1);
      expect(exports.b).toBe(2);
    });
  });

  test('should config requirejs', () => {
    const requirejs = {
      requirejs: {
        config: vi.fn(),
      },
    };
    const pluginData: any = [
      {
        packageName: '@nocobase/demo',
        url: 'https://demo.com',
      },
    ];
    configRequirejs(requirejs, pluginData);

    expect(requirejs.requirejs.config).toBeCalledTimes(1);
    expect(requirejs.requirejs.config).toBeCalledWith({
      waitSeconds: 120,
      paths: {
        '@nocobase/demo': 'https://demo.com',
      },
    });
  });

  test('should register /client-v2 path only when server provides clientV2Url', () => {
    const requirejs = {
      requirejs: {
        config: vi.fn(),
      },
    };
    const pluginData: any = [
      {
        packageName: '@nocobase/demo',
        url: '/static/plugins/@nocobase/demo/dist/client/index.js?hash=v1hash',
        clientV2Url: '/static/plugins/@nocobase/demo/dist/client-v2/index.js?hash=v2hash',
      },
      {
        packageName: '@nocobase/legacy',
        url: '/static/plugins/@nocobase/legacy/dist/client/index.js?hash=v1hash',
      },
    ];
    configRequirejs(requirejs, pluginData);

    expect(requirejs.requirejs.config).toBeCalledWith({
      waitSeconds: 120,
      paths: {
        '@nocobase/demo': '/static/plugins/@nocobase/demo/dist/client/index.js?hash=v1hash',
        '@nocobase/demo/client-v2': '/static/plugins/@nocobase/demo/dist/client-v2/index.js?hash=v2hash',
        '@nocobase/legacy': '/static/plugins/@nocobase/legacy/dist/client/index.js?hash=v1hash',
      },
    });
  });

  test('should not append duplicate .js for plugin URLs without query strings', () => {
    const requirejs = getRequireJs();

    requirejs.requirejs.config({
      paths: {
        '@nocobase/demo': '/static/plugins/@nocobase/demo/dist/client/index.js',
      },
    });

    expect(requirejs.requirejs.toUrl('@nocobase/demo')).toBe('/static/plugins/@nocobase/demo/dist/client/index.js');
  });

  test('should keep hashed plugin URLs unchanged', () => {
    const requirejs = getRequireJs();

    requirejs.requirejs.config({
      paths: {
        '@nocobase/demo': '/static/plugins/@nocobase/demo/dist/client/index.js?hash=12345678',
      },
    });

    expect(requirejs.requirejs.toUrl('@nocobase/demo')).toBe(
      '/static/plugins/@nocobase/demo/dist/client/index.js?hash=12345678',
    );
  });

  describe('processRemotePlugins()', () => {
    it('should resolve', () => {
      const pluginData: any = [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo.com',
        },
      ];
      const resolve = vi.fn();
      const process = processRemotePlugins(pluginData, resolve);

      const pluginModules: any = [
        {
          default: 'default',
        },
      ];
      process(...pluginModules);

      expect(resolve).toBeCalledTimes(1);
      expect(resolve).toBeCalledWith([['@nocobase/demo', 'default']]);
    });

    it('should filter', () => {
      const pluginData: any = [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo.com',
        },
      ];
      const resolve = vi.fn();
      const process = processRemotePlugins(pluginData, resolve);

      const pluginModules: any = [null];
      process(...pluginModules);

      expect(resolve).toBeCalledTimes(1);
      expect(resolve).toBeCalledWith([]);
    });
  });

  describe('getRemotePlugins()', () => {
    it('should get remote plugins', async () => {
      const mockPluginsModules = (pluginData, resolve) => {
        resolve({ default: 'default' });
      };

      const requirejs: any = {
        requirejs: mockPluginsModules,
      };

      requirejs.requirejs.config = vi.fn();
      requirejs.requirejs.requirejs = vi.fn();
      const pluginData: any = [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo.com',
        },
      ];
      const mockDefine: any = vi.fn();
      window.define = mockDefine;
      const plugins = await getRemotePlugins(requirejs, pluginData);
      expect(plugins).toEqual([['@nocobase/demo', 'default']]);
    });
  });

  describe('getPlugins()', () => {
    it('If there is no devDynamicImport, all plugins are obtained through API requests', async () => {
      const remoteFn = vi.fn();
      const mockPluginsModules = (pluginData, resolve) => {
        remoteFn();
        resolve({ default: 'default' }, { default: 'default' });
      };

      const requirejs: any = {
        requirejs: mockPluginsModules,
      };

      requirejs.requirejs.config = vi.fn();
      requirejs.requirejs.requirejs = vi.fn();
      const pluginData: any = [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo1.com',
        },
        {
          name: '@nocobase/demo2',
          packageName: '@nocobase/demo2',
          url: 'https://demo2.com',
        },
      ];
      const mockDefine: any = vi.fn();
      window.define = mockDefine;

      const plugins = await getPlugins({ requirejs, pluginData });
      expect(plugins).toEqual([
        ['@nocobase/demo', 'default'],
        ['@nocobase/demo2', 'default'],
      ]);
      expect(remoteFn).toBeCalledTimes(1);
      expect(mockDefine).toBeCalledTimes(2);
      expect(requirejs.requirejs.config).toBeCalledWith({
        waitSeconds: 120,
        paths: {
          '@nocobase/demo': 'https://demo1.com',
          '@nocobase/demo2': 'https://demo2.com',
        },
      });
    });

    it('If there is devDynamicImport and devDynamicImport returns all, remote API will not be requested', async () => {
      const remoteFn = vi.fn();
      const mockPluginsModules = (pluginData, resolve) => {
        remoteFn();
        resolve({ default: 'default' }, { default: 'default' });
      };

      const requirejs: any = {
        requirejs: mockPluginsModules,
      };

      requirejs.requirejs.config = vi.fn();
      requirejs.requirejs.requirejs = vi.fn();
      const pluginData: any = [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo1.com',
        },
        {
          name: '@nocobase/demo2',
          packageName: '@nocobase/demo2',
          url: 'https://demo2.com',
        },
      ];
      const mockDefine: any = vi.fn();
      window.define = mockDefine;

      const plugins = await getPlugins({
        requirejs,
        pluginData,
        devDynamicImport: (() => {
          return Promise.resolve({ default: 'default' });
        }) as any,
      });
      expect(plugins).toEqual([
        ['@nocobase/demo', 'default'],
        ['@nocobase/demo2', 'default'],
      ]);
      expect(remoteFn).toBeCalledTimes(0);
      expect(mockDefine).toBeCalledTimes(2);
      expect(requirejs.requirejs.config).toBeCalledTimes(0);
    });

    it('If there is devDynamicImport and devDynamicImport returns partial, remote API will be requested', async () => {
      const remoteFn = vi.fn();
      const mockPluginsModules = (pluginData, resolve) => {
        remoteFn();
        resolve({ default: 'default' });
      };

      const requirejs: any = {
        requirejs: mockPluginsModules,
      };

      requirejs.requirejs.config = vi.fn();
      requirejs.requirejs.requirejs = vi.fn();
      const pluginData: any = [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo1.com',
        },
        {
          name: '@nocobase/demo2',
          packageName: '@nocobase/demo2',
          url: 'https://demo2.com',
        },
      ];
      const mockDefine: any = vi.fn();
      window.define = mockDefine;

      const plugins = await getPlugins({
        requirejs,
        pluginData,
        devDynamicImport: ((packageName) => {
          if (packageName === '@nocobase/demo') {
            return Promise.resolve({ default: 'default' });
          }
          return Promise.resolve(null);
        }) as any,
      });
      expect(plugins).toEqual([
        ['@nocobase/demo', 'default'],
        ['@nocobase/demo2', 'default'],
      ]);
      expect(remoteFn).toBeCalled();
      expect(mockDefine).toBeCalledTimes(2);
      expect(requirejs.requirejs.config).toBeCalledWith({
        waitSeconds: 120,
        paths: {
          '@nocobase/demo2': 'https://demo2.com',
        },
      });
    });
  });
});
