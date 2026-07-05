/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFieldMarkdownVditorClient from '../';

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

describe('PluginFieldMarkdownVditorClient legacy entry', () => {
  it('should expose the minimal plugin lifecycle shape', async () => {
    const plugin = new PluginFieldMarkdownVditorClient({ name: 'field-markdown-vditor' });

    expect(plugin.options.name).toBe('field-markdown-vditor');
    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
  });

  it('should register markdown runtime, field components, interface, and models for existing configurations', async () => {
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
    const plugin = new PluginFieldMarkdownVditorClient({ name: 'field-markdown-vditor' }, app);

    await plugin.load();

    expect(context.markdown?.getEngine('vditor')).toBeDefined();
    expect(context.markdownVditor).toBeDefined();
    expect(context.markdownVditorDependencies).toBeDefined();
    expect(registeredComponents.MarkdownVditor).toBeDefined();
    expect(registeredInterfaces).toHaveLength(1);
    expect(registeredModels.VditorFieldModel).toBeDefined();
    expect(registeredModels.DisplayVditorFieldModel).toBeDefined();
  });
});
