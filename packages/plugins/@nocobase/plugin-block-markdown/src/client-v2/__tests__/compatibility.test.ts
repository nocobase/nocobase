/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginBlockMarkdownClient } from '../plugin';

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

describe('PluginBlockMarkdownClient v2 compatibility entry', () => {
  it('should keep legacy MarkdownBlockModel configurations resolvable', async () => {
    const context = createMarkdownContext();
    const registeredModelLoaders: Record<string, unknown> = {};
    const flowEngine = {
      context,
      registerModelLoaders(loaders: Record<string, unknown>) {
        Object.assign(registeredModelLoaders, loaders);
      },
    };
    const app = {
      requirejs: {
        require: Object.assign(() => {}, {
          config: () => {},
        }),
      },
      flowEngine,
      getPublicPath: () => '/v/',
    };
    const plugin = new PluginBlockMarkdownClient(
      {},
      app as unknown as ConstructorParameters<typeof PluginBlockMarkdownClient>[1],
    );

    await plugin.load();

    expect(context.markdown?.getEngine('vditor')).toBeDefined();
    expect(context.markdownVditor).toBeDefined();
    expect(context.markdownVditorDependencies).toBeDefined();
    expect(registeredModelLoaders.MarkdownBlockModel).toBeDefined();
  });
});
