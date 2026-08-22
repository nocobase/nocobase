/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DisplayItemModel, EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
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
}));

describe('SortFieldModel', () => {
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

  it('renders an input number with full width while preserving custom styles', () => {
    const model = Object.create(SortFieldModel.prototype) as SortFieldModel & {
      props: {
        value: number;
        disabled: boolean;
        style: React.CSSProperties;
      };
    };
    model.props = {
      value: 12,
      disabled: true,
      style: {
        minWidth: 120,
      },
    };

    render(model.render());

    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
    expect(input).toHaveValue('12');
    expect(input.closest('.ant-input-number')).toHaveStyle({
      width: '100%',
      minWidth: '120px',
    });
  });

  it('registers editable, display and filterable model bindings', () => {
    expect(EditableItemModel.bindModelToInterface).toHaveBeenCalledWith('SortFieldModel', ['sort'], {
      isDefault: true,
    });
    expect(DisplayItemModel.bindModelToInterface).toHaveBeenCalledWith('DisplayNumberFieldModel', ['sort'], {
      isDefault: true,
    });
    expect(FilterableItemModel.bindModelToInterface).toHaveBeenCalledWith('NumberFieldModel', ['sort'], {
      isDefault: true,
    });
  });
});
