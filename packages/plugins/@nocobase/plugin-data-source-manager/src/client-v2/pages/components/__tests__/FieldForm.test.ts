/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { filterConfigureSelectOption, resolveConfigureSelectControlBehavior } from '../FieldForm';

describe('resolveConfigureSelectControlBehavior', () => {
  it('enables search for relation target collections by default', () => {
    expect(resolveConfigureSelectControlBehavior('target', 'Select').showSearch).toBe(true);
  });

  it('respects an explicit relation target search setting', () => {
    expect(resolveConfigureSelectControlBehavior('target', 'Select', { showSearch: false }).showSearch).toBe(false);
  });

  it('applies ordinary select behavior from component props', () => {
    expect(
      resolveConfigureSelectControlBehavior('type', 'Select', {
        allowClear: false,
        autoSelectFirstOption: true,
        showSearch: true,
      }),
    ).toEqual({
      allowClear: false,
      autoSelectFirstOption: true,
      showSearch: true,
    });
  });

  it('applies the fixed source key component policy', () => {
    expect(
      resolveConfigureSelectControlBehavior('sourceKey', 'SourceKey', {
        allowClear: true,
        autoSelectFirstOption: false,
        showSearch: false,
      }),
    ).toEqual({
      allowClear: false,
      autoSelectFirstOption: true,
      showSearch: true,
    });
  });

  it('enables search for target key fields', () => {
    expect(resolveConfigureSelectControlBehavior('targetKey', 'TargetKey').showSearch).toBe(true);
  });
});

describe('filterConfigureSelectOption', () => {
  const option = { label: 'Customer Orders', value: 'customer_orders' };

  it('matches a collection display title case-insensitively', () => {
    expect(filterConfigureSelectOption('ORDERS', option)).toBe(true);
  });

  it('matches a collection internal name', () => {
    expect(filterConfigureSelectOption('customer_', option)).toBe(true);
  });

  it('rejects unrelated collection names', () => {
    expect(filterConfigureSelectOption('products', option)).toBe(false);
  });
});
