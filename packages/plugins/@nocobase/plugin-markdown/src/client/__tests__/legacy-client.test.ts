/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginMarkdownClient from '../';

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
