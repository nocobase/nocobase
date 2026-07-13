/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MarkdownFieldInterface } from '@nocobase/client-v2';
import { DisplayItemModel, EditableItemModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownVditorFieldInterface } from '../interface';
import { PluginMarkdownClient } from '../plugin';
import '../models/VditorFieldModel';
import '../models/DisplayVditorFieldModel';

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
  FieldModel: class FieldModel {
    static define = vi.fn();
    static registerFlow = vi.fn();
  },
  MarkdownFieldInterface: class MarkdownFieldInterface {
    hidden = true;
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

describe('Markdown v2 field entry', () => {
  it('exposes only the Markdown field interface as the product entry', async () => {
    const context = createMarkdownContext();
    const registeredInterfaces: unknown[] = [];
    const flowEngine = {
      context,
      registerModelLoaders() {},
    };
    const app = {
      requirejs: {
        require: Object.assign(() => {}, {
          config: () => {},
        }),
      },
      addComponents() {},
      addFieldInterfaces(interfaces: unknown[]) {
        registeredInterfaces.push(...interfaces);
      },
      flowEngine,
      getPublicPath: () => '/v/',
    };
    const plugin = new PluginMarkdownClient({}, app as ConstructorParameters<typeof PluginMarkdownClient>[1]);

    await plugin.load();

    expect(registeredInterfaces).toEqual([MarkdownVditorFieldInterface]);
    const fieldInterface = new MarkdownVditorFieldInterface(
      {} as ConstructorParameters<typeof MarkdownVditorFieldInterface>[0],
    );
    expect(fieldInterface.name).toBe('markdown');
    expect(fieldInterface.default.interface).toBe('markdown');
    expect(fieldInterface.title).toBe('Markdown');
    expect(fieldInterface.configure?.items?.[0]).toMatchObject({
      name: 'uiSchema.x-component-props.fileCollection',
      required: true,
      description: expect.not.stringContaining('default: attachments'),
    });
    expect(fieldInterface.configure?.items?.[0]).not.toHaveProperty('defaultValue');
    expect(fieldInterface.configure?.items?.[1]?.options).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'both' })]),
    );
    expect(fieldInterface.configure?.items?.[1]?.options).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'preview' })]),
    );

    const legacyMarkdownFieldInterface = new MarkdownFieldInterface(
      {} as ConstructorParameters<typeof MarkdownFieldInterface>[0],
    );
    expect(legacyMarkdownFieldInterface.hidden).toBe(true);
  });

  it('keeps historical markdown fields bound to the same Vditor models', () => {
    expect(EditableItemModel.bindings.get('vditor')).toEqual(
      expect.arrayContaining([expect.objectContaining({ modelName: 'VditorFieldModel', isDefault: true })]),
    );
    expect(EditableItemModel.bindings.get('markdown')).toEqual(
      expect.arrayContaining([expect.objectContaining({ modelName: 'VditorFieldModel', isDefault: true })]),
    );
    expect(DisplayItemModel.bindings.get('vditor')).toEqual(
      expect.arrayContaining([expect.objectContaining({ modelName: 'DisplayVditorFieldModel', isDefault: true })]),
    );
    expect(DisplayItemModel.bindings.get('markdown')).toEqual(
      expect.arrayContaining([expect.objectContaining({ modelName: 'DisplayVditorFieldModel', isDefault: true })]),
    );
  });
});
