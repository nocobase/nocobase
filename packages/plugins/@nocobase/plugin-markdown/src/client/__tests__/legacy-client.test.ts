/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

vi.mock('../../client-v2', () => {
  class MarkdownVditorRuntime {
    name = 'vditor';

    getCDN() {
      return 'https://cdn.jsdelivr.net/npm/vditor@3.11.2';
    }

    initVditorDependency() {}
  }

  function getMarkdownRegistry(ctx: MarkdownContext) {
    if (ctx.markdown) {
      return ctx.markdown;
    }
    const engines = new Map<string, unknown>();
    const registry = {
      register(engine: { name: string }) {
        engines.set(engine.name, engine);
      },
      getEngine(name?: string) {
        return engines.get(name || 'vditor');
      },
    };
    ctx.defineProperty('markdown', {
      get: () => registry,
    });
    return registry;
  }

  function registerMarkdownVditorContext(ctx: MarkdownContext, runtime: MarkdownVditorRuntime) {
    ctx.defineProperty('markdownVditor', {
      get: () => runtime,
    });
    ctx.defineProperty('markdownVditorDependencies', {
      get: () => ({
        getCDN: () => runtime.getCDN(),
        initVditorDependency: () => runtime.initVditorDependency(),
      }),
    });
  }

  return {
    DisplayVditorFieldModel: class DisplayVditorFieldModel {},
    getMarkdownRegistry,
    MarkdownBlockModel: class MarkdownBlockModel {},
    MarkdownVditor: () => null,
    MarkdownVditorFieldInterface: class MarkdownVditorFieldInterface {},
    MarkdownVditorRuntime,
    registerMarkdownVditorContext,
    VditorFieldModel: class VditorFieldModel {},
  };
});

import PluginMarkdownClient, { MarkdownBlockModel } from '../';

type MarkdownContext = {
  markdown?: {
    getEngine: (name?: string) => unknown;
  };
  markdownVditor?: unknown;
  markdownVditorDependencies?: unknown;
  defineProperty: (key: string, options: { get?: () => unknown }) => void;
};

function createMarkdownContext(): MarkdownContext {
  return {
    defineProperty(key, options) {
      Object.defineProperty(this, key, {
        configurable: true,
        get: options.get,
      });
    },
  };
}

describe('PluginMarkdownClient legacy entry', () => {
  it('should expose the minimal plugin lifecycle shape', async () => {
    const plugin = new PluginMarkdownClient({ name: 'markdown' });

    expect(plugin.options.name).toBe('markdown');
    expect(MarkdownBlockModel).toBeDefined();
    expect(plugin.getCDN()).toBe('https://cdn.jsdelivr.net/npm/vditor@3.11.2');
    expect(plugin.initVditorDependency()).toBeUndefined();
    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
  });

  it('should register legacy components, interfaces, markdown runtime, and models', async () => {
    const context = createMarkdownContext();
    const registeredComponents: Record<string, unknown> = {};
    const registeredInterfaces: unknown[] = [];
    const registeredModels: Record<string, unknown> = {};
    const app = {
      requirejs: {
        require: Object.assign(() => {}, {
          config: () => {},
        }),
      },
      addComponents(components: Record<string, unknown>) {
        Object.assign(registeredComponents, components);
      },
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

    expect(context.markdown?.getEngine('vditor')).toBeDefined();
    expect(context.markdownVditor).toBeDefined();
    expect(context.markdownVditorDependencies).toBeDefined();
    expect(registeredComponents.MarkdownVditor).toBeDefined();
    expect(registeredInterfaces).toHaveLength(1);
    expect(registeredModels.MarkdownBlockModel).toBeDefined();
    expect(registeredModels.VditorFieldModel).toBeDefined();
    expect(registeredModels.DisplayVditorFieldModel).toBeDefined();
  });
});
