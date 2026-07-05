/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginBlockMarkdownClient from '../';

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

describe('PluginBlockMarkdownClient legacy entry', () => {
  it('should expose the minimal plugin lifecycle shape', async () => {
    const plugin = new PluginBlockMarkdownClient({ name: 'block-markdown' });

    expect(plugin.options.name).toBe('block-markdown');
    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
  });

  it('should register markdown runtime and block model for existing legacy configurations', async () => {
    const context = createMarkdownContext();
    const registeredModels: Record<string, unknown> = {};
    const app = {
      requirejs: {
        require: Object.assign(() => {}, {
          config: () => {},
        }),
      },
      flowEngine: {
        context,
        registerModels(models: Record<string, unknown>) {
          Object.assign(registeredModels, models);
        },
      },
      getPublicPath: () => '/v/',
    };
    const plugin = new PluginBlockMarkdownClient({ name: 'block-markdown' }, app);

    await plugin.load();

    expect(context.markdown?.getEngine('vditor')).toBeDefined();
    expect(context.markdownVditor).toBeDefined();
    expect(context.markdownVditorDependencies).toBeDefined();
    expect(registeredModels.MarkdownBlockModel).toBeDefined();
  });
});
