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
    window.__nocobase_app_dev_plugins__ = undefined;
  });

  const createModuleUrl = (code: string) => `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;

  it('should define dev plugins with /client-v2 module ids', () => {
    class DemoPlugin extends Plugin {}

    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    defineDevPlugins({
      '@nocobase/demo': DemoPlugin,
    });

    expect(mockDefine).toHaveBeenCalledWith('@nocobase/demo/client-v2', expect.any(Function));
  });

  it('should preserve named exports from dev plugin modules', () => {
    class DemoPlugin extends Plugin {}
    class DemoActionModel {}

    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    const pluginModule = {
      default: DemoPlugin,
      DemoActionModel,
    };
    defineDevPlugins({
      '@nocobase/demo': pluginModule,
    });

    const moduleFactory = mockDefine.mock.calls[0]?.[1];
    expect(mockDefine).toHaveBeenCalledWith('@nocobase/demo/client-v2', expect.any(Function));
    expect(moduleFactory()).toBe(pluginModule);
    expect(window.__nocobase_app_dev_plugins__['@nocobase/demo/client-v2']).toBe(pluginModule);
  });

  it('should expose named exports from devDynamicImport modules to RequireJS consumers', async () => {
    class DemoPlugin extends Plugin {}
    class DemoActionModel {}

    const requirejs: any = {
      requirejs: vi.fn(),
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
      ] as any,
      devDynamicImport: vi.fn().mockResolvedValue({ default: DemoPlugin, DemoActionModel }) as any,
    });

    const moduleFactory = mockDefine.mock.calls.find((call) => call[0] === '@nocobase/demo/client-v2')?.[1];

    expect(plugins).toEqual([['@nocobase/demo', DemoPlugin]]);
    expect(moduleFactory()).toEqual({ default: DemoPlugin, DemoActionModel });
    expect(window.__nocobase_app_dev_plugins__['@nocobase/demo/client-v2']).toEqual({
      default: DemoPlugin,
      DemoActionModel,
    });
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

  it('should register ESM dev plugins before importing dependent plugins', async () => {
    const requirejs: any = {
      requirejs: vi.fn(),
    };
    requirejs.requirejs.config = vi.fn();

    const mockDefine: any = vi.fn();
    window.define = mockDefine;

    const plugins = await getPlugins({
      requirejs,
      pluginData: [
        {
          name: '@nocobase/dependent',
          packageName: '@nocobase/dependent',
          url: createModuleUrl(`
              const dependency = window.__nocobase_app_dev_plugins__ && window.__nocobase_app_dev_plugins__['@nocobase/dependency/client-v2'];
            export default class DependentPlugin extends dependency.default {
              static SharedBase = dependency.SharedBase;
            }
          `),
          devMode: 'esm',
          appDevDependencies: ['@nocobase/dependency'],
        },
        {
          name: '@nocobase/dependency',
          packageName: '@nocobase/dependency',
          url: createModuleUrl('export class SharedBase {}; export default class DependencyPlugin {}'),
          devMode: 'esm',
        },
      ] as any,
    });

    const dependencyModule = window.__nocobase_app_dev_plugins__['@nocobase/dependency/client-v2'] as {
      default?: unknown;
      SharedBase?: unknown;
    };
    const dependentPlugin = plugins[1][1] as (typeof plugins)[number][1] & { SharedBase?: unknown };

    expect(plugins.map(([name]) => name)).toEqual(['@nocobase/dependency', '@nocobase/dependent']);
    expect(dependencyModule.SharedBase).toBeDefined();
    expect(plugins[0][1]).toBe(dependencyModule.default);
    expect(dependentPlugin.SharedBase).toBe(dependencyModule.SharedBase);
    expect(mockDefine).toHaveBeenCalledWith('@nocobase/dependency/client-v2', expect.any(Function));
    expect(requirejs.requirejs.config).not.toHaveBeenCalled();
  });

  it('should load RequireJS dependencies before ESM dev plugins', async () => {
    class DependencyPlugin extends Plugin {}
    const SharedBase = { source: 'remote' };
    const dependencyModule = {
      SharedBase,
      default: DependencyPlugin,
    };
    const requirejs: any = {
      requirejs: vi.fn((packageNames, resolve) => {
        expect(packageNames).toEqual(['@nocobase/remote-dependency/client-v2']);
        resolve(dependencyModule);
      }),
    };
    requirejs.requirejs.config = vi.fn();

    window.define = vi.fn();

    const plugins = await getPlugins({
      requirejs,
      pluginData: [
        {
          name: '@nocobase/dependent',
          packageName: '@nocobase/dependent',
          url: createModuleUrl(`
            const dependency = window.__nocobase_app_dev_plugins__ && window.__nocobase_app_dev_plugins__['@nocobase/remote-dependency/client-v2'];
            export default class DependentPlugin extends dependency.default {
              static SharedBase = dependency.SharedBase;
            }
          `),
          devMode: 'esm',
          appDevDependencies: ['@nocobase/remote-dependency'],
        },
        {
          name: '@nocobase/remote-dependency',
          packageName: '@nocobase/remote-dependency',
          url: 'https://dependency.com',
        },
      ] as any,
    });

    const dependentPlugin = plugins[1][1] as (typeof plugins)[number][1] & { SharedBase?: unknown };

    expect(plugins.map(([name]) => name)).toEqual(['@nocobase/remote-dependency', '@nocobase/dependent']);
    expect(window.__nocobase_app_dev_plugins__['@nocobase/remote-dependency/client-v2']).toBe(dependencyModule);
    expect(dependentPlugin.SharedBase).toBe(SharedBase);
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
