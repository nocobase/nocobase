/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { getDefaultOperator, getFilterFormOperatorList } from '../utils';

describe('getDefaultOperator', () => {
  it('returns model.operator when it exists', () => {
    const getStepParams = vi.fn();
    const model = {
      operator: '$eq',
      getStepParams,
      subModels: { field: { operator: '$ne' } },
    } as any;

    const result = getDefaultOperator(model);

    expect(result).toBe('$eq');
    expect(getStepParams).not.toHaveBeenCalled();
  });

  it('reads default operator from filterFormItemSettings step params when operator is missing', () => {
    const getStepParams = vi.fn().mockReturnValue({ value: '$in' });
    const model = {
      operator: undefined,
      getStepParams,
      subModels: { field: { operator: '$ne' } },
    } as any;

    const result = getDefaultOperator(model);

    expect(result).toBe('$in');
    expect(getStepParams).toHaveBeenCalledWith('filterFormItemSettings', 'defaultOperator');
  });

  it('falls back to subModels.field.operator when no explicit operator is provided', () => {
    const getStepParams = vi.fn().mockReturnValue(undefined);
    const model = {
      operator: undefined,
      getStepParams,
      subModels: { field: { operator: '$contains' } },
    } as any;

    const result = getDefaultOperator(model);

    expect(result).toBe('$contains');
  });

  it('returns "$includes" when all operator sources are missing', () => {
    const getStepParams = vi.fn().mockReturnValue(undefined);
    const model = {
      operator: undefined,
      getStepParams,
      subModels: {},
    } as any;

    const result = getDefaultOperator(model);

    expect(result).toBe('$includes');
    expect(getStepParams).toHaveBeenCalledWith('filterFormItemSettings', 'defaultOperator');
  });

  it('falls back to field interface operators when field operators are empty', () => {
    const getStepParams = vi.fn().mockReturnValue(undefined);
    const model = {
      getStepParams,
      subModels: {},
      collectionField: {
        interface: 'id',
        type: 'bigInt',
        filterable: { operators: [] },
      },
      context: {
        dataSourceManager: {
          collectionFieldInterfaceManager: {
            getFieldInterface: vi.fn(() => ({
              filterable: {
                operators: [
                  { label: 'is', value: '$eq', selected: true },
                  {
                    label: 'is any of',
                    value: '$in',
                    schema: { 'x-component': 'MultipleKeywordsInput' },
                  },
                ],
              },
            })),
          },
        },
      },
    } as any;

    expect(getDefaultOperator(model)).toBe('$eq');
    expect(getFilterFormOperatorList(model).map((item) => item.value)).toEqual(['$eq', '$in']);
  });

  it('prefers non-empty field operators over field interface operators', () => {
    const model = {
      getStepParams: vi.fn().mockReturnValue(undefined),
      subModels: {},
      collectionField: {
        interface: 'input',
        type: 'string',
        filterable: {
          operators: [{ label: 'custom', value: '$custom' }],
        },
      },
      context: {
        dataSourceManager: {
          collectionFieldInterfaceManager: {
            getFieldInterface: vi.fn(() => ({
              filterable: {
                operators: [{ label: 'contains', value: '$includes' }],
              },
            })),
          },
        },
      },
    } as any;

    expect(getDefaultOperator(model)).toBe('$custom');
    expect(getFilterFormOperatorList(model).map((item) => item.value)).toEqual(['$custom']);
  });

  it('does not fall back when the current field is not filterable', () => {
    const model = {
      getStepParams: vi.fn().mockReturnValue(undefined),
      subModels: {},
      collectionField: {
        interface: 'input',
        type: 'string',
        filterable: false,
      },
      context: {
        dataSourceManager: {
          collectionFieldInterfaceManager: {
            getFieldInterface: vi.fn(() => ({
              filterable: {
                operators: [{ label: 'contains', value: '$includes' }],
              },
            })),
          },
        },
      },
    } as any;

    expect(getFilterFormOperatorList(model)).toEqual([]);
  });

  it('does not fall back when the field interface is not filterable', () => {
    const model = {
      getStepParams: vi.fn().mockReturnValue(undefined),
      subModels: {},
      collectionField: {
        interface: 'secret',
        type: 'string',
        filterable: { operators: [] },
      },
      context: {
        dataSourceManager: {
          collectionFieldInterfaceManager: {
            getFieldInterface: vi.fn(() => ({
              filterable: false,
            })),
          },
        },
      },
    } as any;

    expect(getFilterFormOperatorList(model)).toEqual([]);
  });

  it('uses interface fallback operators before storage type fallback operators', () => {
    const model = {
      getStepParams: vi.fn().mockReturnValue(undefined),
      subModels: {},
      collectionField: {
        interface: 'id',
        type: 'object',
        filterable: { operators: [] },
      },
    } as any;

    expect(getFilterFormOperatorList(model).map((item) => item.value)).toEqual(['$eq', '$ne', '$exists', '$notExists']);
  });
});
