/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SelectFieldModel } from '../SelectFieldModel';

function mockT(text: string) {
  if (text === '{{t("Yes")}}') return '是';
  if (text === '{{t("No")}}') return '否';
  return text;
}

describe('SelectFieldModel', () => {
  it('uses current enum values when persisted options retain an old identifier', () => {
    const model = {
      props: {
        options: [{ label: 'On sale', value: 'generated-value' }],
        value: 'generated-value',
      },
      context: {
        collectionField: {
          uiSchema: {
            enum: [{ label: 'On sale', value: 'on_sale' }],
          },
        },
      },
      translate: mockT,
    } as unknown as SelectFieldModel;

    const element = SelectFieldModel.prototype.render.call(model) as React.ReactElement;

    expect(element.props.options).toEqual([{ label: 'On sale', value: 'on_sale' }]);
    expect(element.props.value).toEqual({ label: 'On sale', value: 'on_sale' });
  });

  it('keeps an old value when the current enum label is ambiguous', () => {
    const model = {
      props: {
        options: [{ label: 'Active', value: 'old-active' }],
        value: 'old-active',
      },
      context: {
        collectionField: {
          uiSchema: {
            enum: [
              { label: 'Active', value: 'active' },
              { label: 'Active', value: 'enabled' },
            ],
          },
        },
      },
      translate: mockT,
    } as unknown as SelectFieldModel;

    const element = SelectFieldModel.prototype.render.call(model) as React.ReactElement;

    expect(element.props.options).toEqual([{ label: 'Active', value: 'old-active' }]);
    expect(element.props.value).toEqual({ label: 'old-active', value: 'old-active' });
  });

  it('translates enum fallback labels for selected values', () => {
    const model = {
      props: {
        value: true,
      },
      context: {
        collectionField: {
          uiSchema: {
            enum: [
              { label: '{{t("Yes")}}', value: true },
              { label: '{{t("No")}}', value: false },
            ],
          },
        },
      },
      translate: mockT,
    } as unknown as SelectFieldModel;

    const element = SelectFieldModel.prototype.render.call(model) as React.ReactElement;

    expect(element.props.value).toEqual({ label: '是', value: true });
  });

  it('keeps the quick edit popover open while the dropdown is open', () => {
    vi.useFakeTimers();
    try {
      const update = vi.fn();
      const onDropdownVisibleChange = vi.fn();
      const model = {
        props: { value: undefined, onDropdownVisibleChange },
        parent: { use: 'QuickEditFormModel', viewContainer: { update } },
        context: { collectionField: { uiSchema: { enum: [] } } },
        translate: mockT,
      } as unknown as SelectFieldModel;

      const element = SelectFieldModel.prototype.render.call(model) as React.ReactElement;

      element.props.onDropdownVisibleChange(true);
      expect(update).toHaveBeenCalledWith({ preventClose: true });
      expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);

      element.props.onDropdownVisibleChange(false);
      expect(onDropdownVisibleChange).toHaveBeenCalledWith(false);
      expect(update).toHaveBeenCalledTimes(1);
      vi.runAllTimers();
      expect(update).toHaveBeenLastCalledWith({ preventClose: false });
    } finally {
      vi.useRealTimers();
    }
  });
});
