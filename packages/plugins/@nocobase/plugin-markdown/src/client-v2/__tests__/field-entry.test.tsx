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
import { describe, expect, it } from 'vitest';
import { MarkdownVditorFieldInterface } from '../interface';
import { PluginMarkdownClient } from '../plugin';
import '../models/VditorFieldModel';
import '../models/DisplayVditorFieldModel';

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
  it('exposes only the Vditor field interface as the product entry', async () => {
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
    expect(fieldInterface.name).toBe('vditor');
    expect(fieldInterface.default.interface).toBe('vditor');
    expect(fieldInterface.title).toBe('Markdown(Vditor)');

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
