/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BulkEditFieldV2 } from '../component/BulkEditFieldV2';
import { BulkEditFormItemValueType } from '../types';

vi.mock('antd', async () => {
  const ReactModule = await import('react');
  const Select = ({
    children,
    disabled,
    onChange,
    value,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    onChange?: (value: number) => void;
    value?: number;
  }) =>
    ReactModule.createElement(
      'select',
      {
        'aria-label': 'bulk-edit-value-type',
        disabled,
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange?.(Number(event.target.value)),
        value,
      },
      children,
    );
  Select.Option = ({ children, value }: { children?: React.ReactNode; value: number }) =>
    ReactModule.createElement('option', { value }, children);
  const Space = ({ children }: { children?: React.ReactNode }) => ReactModule.createElement('div', null, children);

  return {
    Select,
    Space,
  };
});

function createFormItemModel(options: { fieldUse?: string } = {}) {
  return {
    props: {
      name: 'title',
      rules: [
        {
          max: 20,
        },
      ],
    },
    context: {
      blockModel: {
        form: {
          setFieldValue: vi.fn(),
        },
      },
      t: (key: string) => key,
    },
    subModels: {
      field: {
        use: options.fieldUse,
      },
    },
    setProps: vi.fn(),
  };
}

describe('BulkEditFieldV2', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('syncs value type changes to the form item model and cloned field', async () => {
    const formItemModel = createFormItemModel();
    const onChange = vi.fn();

    render(
      <BulkEditFieldV2 formItemModel={formItemModel} field={<input aria-label="inner-field" />} onChange={onChange} />,
    );

    await waitFor(() => {
      expect(formItemModel.setProps).toHaveBeenCalledWith({ required: false, rules: [] });
    });

    fireEvent.change(screen.getByLabelText('bulk-edit-value-type'), {
      target: {
        value: String(BulkEditFormItemValueType.ChangedTo),
      },
    });

    expect(formItemModel.context.blockModel.form.setFieldValue).toHaveBeenCalledWith('title', null);
    await waitFor(() => {
      expect(formItemModel.setProps).toHaveBeenLastCalledWith({
        required: true,
        rules: [
          {
            required: true,
            message: 'The field value is required',
          },
          {
            max: 20,
          },
        ],
      });
    });

    fireEvent.change(screen.getByLabelText('inner-field'), {
      target: {
        value: 'Published',
      },
    });
    expect(onChange).toHaveBeenCalledWith('Published');

    fireEvent.change(screen.getByLabelText('bulk-edit-value-type'), {
      target: {
        value: String(BulkEditFormItemValueType.Clear),
      },
    });

    expect(formItemModel.context.blockModel.form.setFieldValue).toHaveBeenLastCalledWith('title', null);
  });

  it('emits false for checkbox fields when changed-to mode is selected', async () => {
    vi.useFakeTimers();
    const formItemModel = createFormItemModel({
      fieldUse: 'CheckboxFieldModel',
    });
    const onChange = vi.fn();

    render(
      <BulkEditFieldV2 formItemModel={formItemModel} field={<input aria-label="inner-field" />} onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText('bulk-edit-value-type'), {
      target: {
        value: String(BulkEditFormItemValueType.ChangedTo),
      },
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
