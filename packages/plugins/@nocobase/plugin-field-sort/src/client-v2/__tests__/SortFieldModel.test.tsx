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

vi.mock('@nocobase/client-v2', () => ({
  FieldModel: class FieldModel {
    static define = vi.fn();
  },
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
}));

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

describe('SortFieldModel', () => {
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
