/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginFieldMarkdownVditorClient } from '../plugin';

vi.mock('@nocobase/client-v2', () => ({
  Application: class Application {},
  BlockModel: class BlockModel {
    static define = vi.fn();
    static registerFlow = vi.fn();
  },
  CollectionFieldInterface: class CollectionFieldInterface {},
  DisplayTitleFieldModel: class DisplayTitleFieldModel {
    static define = vi.fn();
    static registerFlow = vi.fn();
  },
  editMarkdownFlow: {
    key: 'editMarkdownFlow',
  },
  FieldModel: class FieldModel {
    static define = vi.fn();
    static registerFlow = vi.fn();
  },
  Plugin: class Plugin {
    app: unknown;
    flowEngine: unknown;

    constructor(_options: unknown, app: { flowEngine?: unknown }) {
      this.app = app;
      this.flowEngine = app.flowEngine;
    }
  },
  getOrCreateMarkdownRegistry: (ctx: MarkdownContext) => {
    if (ctx.markdown) {
      return ctx.markdown;
    }
    const engines = new Map<string, unknown>();
    const registry = {
      register(engine: { name: string }, options?: { default?: boolean }) {
        engines.set(engine.name, engine);
        if (options?.default) {
          engines.set('__default__', engine);
        }
      },
      getEngine(name?: string) {
        return engines.get(name || '__default__');
      },
    };
    ctx.defineProperty('markdown', {
      get: () => registry,
    });
    return registry;
  },
  removeMarkdownIframes: (value: string) => value,
  stripMarkdownIframeTags: (value: string) => value,
  stripMarkdownIframes: (value: string) => value,
  stripModernClientPrefix: (path: string) => path.replace('/v/', '/'),
}));

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

describe('PluginFieldMarkdownVditorClient v2 compatibility entry', () => {
  it('should keep legacy Vditor field configurations resolvable', async () => {
    const context = createMarkdownContext();
    const registeredComponents: Record<string, unknown> = {};
    const registeredInterfaces: unknown[] = [];
    const registeredModels: Record<string, unknown> = {};
    const flowEngine = {
      context,
      registerModels(models: Record<string, unknown>) {
        Object.assign(registeredModels, models);
      },
    };
    const app = {
      requirejs: {
        require: Object.assign(() => {}, {
          config: () => {},
        }),
      },
      addComponents(components: Record<string, unknown>) {
        Object.assign(registeredComponents, components);
      },
      addFieldInterfaces(interfaces: unknown[]) {
        registeredInterfaces.push(...interfaces);
      },
      flowEngine,
      getPublicPath: () => '/v/',
    };
    const plugin = new PluginFieldMarkdownVditorClient(
      {},
      app as unknown as ConstructorParameters<typeof PluginFieldMarkdownVditorClient>[1],
    );

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
