/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { SequenceFieldInterface } from '../interface';
import PluginFieldSequenceClient from '../plugin';

vi.mock('@nocobase/client-v2', () => ({
  CollectionFieldInterface: class CollectionFieldInterface {},
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

describe('PluginFieldSequenceClient', () => {
  it('registers sequence field interface and binds client v2 models', async () => {
    const addFieldInterfaces = vi.fn();
    const registerTitleFieldInterface = vi.fn();
    const plugin = Object.create(PluginFieldSequenceClient.prototype) as PluginFieldSequenceClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
        pm: {
          get: ReturnType<typeof vi.fn>;
        };
      };
    };
    plugin.app = {
      addFieldInterfaces,
      pm: {
        get: vi.fn(() => ({
          registerTitleFieldInterface,
        })),
      },
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([SequenceFieldInterface]);
    expect(plugin.app.pm.get).toHaveBeenCalledWith('calendar');
    expect(registerTitleFieldInterface).toHaveBeenCalledWith('sequence');
    expect(EditableItemModel.bindModelToInterface).toHaveBeenCalledWith('InputFieldModel', ['sequence'], {
      isDefault: true,
    });
    expect(DisplayItemModel.bindModelToInterface).toHaveBeenCalledWith('DisplayTextFieldModel', ['sequence'], {
      isDefault: true,
    });
    expect(FilterableItemModel.bindModelToInterface).toHaveBeenCalledWith('InputFieldModel', ['sequence'], {
      isDefault: true,
    });
  });

  it('does not require the optional calendar plugin', async () => {
    const plugin = Object.create(PluginFieldSequenceClient.prototype) as PluginFieldSequenceClient & {
      app: {
        addFieldInterfaces: ReturnType<typeof vi.fn>;
        pm: {
          get: ReturnType<typeof vi.fn>;
        };
      };
    };
    plugin.app = {
      addFieldInterfaces: vi.fn(),
      pm: {
        get: vi.fn(() => undefined),
      },
    };

    await expect(plugin.load()).resolves.toBeUndefined();
  });
});
