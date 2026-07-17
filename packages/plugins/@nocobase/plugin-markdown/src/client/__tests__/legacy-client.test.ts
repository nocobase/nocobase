/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginMarkdownClient from '../';

vi.mock('../../client-v2', () => {
  class MarkdownVditorRuntime {
    name = 'vditor';

    getCDN() {
      return 'https://cdn.jsdelivr.net/npm/vditor@3.11.2';
    }

    initVditorDependency() {}
  }

  function getMarkdownRegistry(ctx: MarkdownContext) {
    const registry = {
      register: vi.fn(),
    };
    ctx.defineProperty('markdown', {
      get: () => registry,
    });
    return registry;
  }

  function registerMarkdownVditorContext(ctx: MarkdownContext) {
    ctx.defineProperty('markdownVditor', { get: () => ({}) });
    ctx.defineProperty('markdownVditorDependencies', { get: () => ({}) });
  }

  return {
    DisplayVditorFieldModel: class DisplayVditorFieldModel {},
    getMarkdownRegistry,
    MarkdownBlockModel: class MarkdownBlockModel {},
    MarkdownVditorRuntime,
    registerMarkdownVditorContext,
    VditorFieldModel: class VditorFieldModel {},
  };
});

type MarkdownContext = {
  defineProperty: (key: string, options: { get?: () => unknown }) => void;
};

describe('PluginMarkdownClient legacy entry', () => {
  it('should expose the minimal plugin lifecycle shape', async () => {
    const plugin = new PluginMarkdownClient({ name: 'markdown' });

    expect(plugin.options.name).toBe('markdown');
    expect(plugin.getCDN()).toBeUndefined();
    expect(plugin.initVditorDependency()).toBeUndefined();
    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
  });

  it('should register embedded v2 models without registering legacy field interfaces', async () => {
    const registeredInterfaces: unknown[] = [];
    const registeredModels: Record<string, unknown> = {};
    const context: MarkdownContext = {
      defineProperty(key, options) {
        Object.defineProperty(this, key, {
          configurable: true,
          get: options.get,
        });
      },
    };
    const app = {
      dataSourceManager: {
        addFieldInterfaces(interfaces: unknown[]) {
          registeredInterfaces.push(...interfaces);
        },
      },
      flowEngine: {
        context,
        registerModels(models: Record<string, unknown>) {
          Object.assign(registeredModels, models);
        },
      },
      getPublicPath: () => '/v/',
    };
    const plugin = new PluginMarkdownClient({ name: 'markdown' }, app);

    await plugin.load();

    expect(registeredInterfaces).toEqual([]);
    expect(registeredModels).toEqual({
      MarkdownBlockModel: expect.any(Function),
      VditorFieldModel: expect.any(Function),
      DisplayVditorFieldModel: expect.any(Function),
    });
  });
});
