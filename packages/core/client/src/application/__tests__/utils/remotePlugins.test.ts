import { Plugin } from '../../Plugin';
import {
  configRequirejs,
  defineDevPlugins,
  definePluginClient,
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
    it('should get plugins', async () => {
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
});
