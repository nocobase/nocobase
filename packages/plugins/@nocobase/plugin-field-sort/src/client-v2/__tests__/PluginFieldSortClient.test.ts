/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { SortFieldModel } from '../models/SortFieldModel';
import PluginFieldSortClient from '../plugin';
import { SortFieldInterface } from '../sort-interface';

vi.mock('@nocobase/client-v2', () => ({
  CollectionFieldInterface: class CollectionFieldInterface {},
  FieldModel: class FieldModel {
    static define = vi.fn();
  },
  Plugin: class Plugin {},
}));

vi.mock('@nocobase/flow-engine', () => ({
  DisplayItemModel: {
    bindModelToInterface: vi.fn(),
  },
  EditableItemModel: {
    bindModelToInterface: vi.fn(),
  },
  FilterableItemModel: {
    bindModelToInterface: vi.fn(),
  },
  tExpr: (value: string) => value,
  useFlowEngine: () => ({
    context: {
      t: (value: string) => value,
    },
  }),
}));

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
  useT: () => (value: string) => value,
}));

describe('PluginFieldSortClient', () => {
  it('registers the sort field interface and lazy model loader', async () => {
    const addFieldInterfaces = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldSortClient.prototype) as PluginFieldSortClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
      };
      flowEngine: {
        registerModelLoaders: typeof registerModelLoaders;
      };
    };
    plugin.app = {
      addFieldInterfaces,
    };
    plugin.flowEngine = {
      registerModelLoaders,
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([SortFieldInterface]);
    expect(registerModelLoaders).toHaveBeenCalledWith({
      SortFieldModel: {
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.SortFieldModel.loader()).resolves.toHaveProperty('SortFieldModel', SortFieldModel);
  });
});
