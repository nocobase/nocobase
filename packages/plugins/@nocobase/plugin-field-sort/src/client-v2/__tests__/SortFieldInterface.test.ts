/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { SortFieldConfigureForm } from '../SortFieldConfigureForm';
import { SortFieldInterface } from '../sort-interface';

vi.mock('@nocobase/client-v2', () => ({
  CollectionFieldInterface: class CollectionFieldInterface {},
}));

vi.mock('@nocobase/flow-engine', () => ({
  tExpr: (value: string) => value,
  useFlowEngine: () => ({
    context: {
      t: (value: string) => value,
    },
  }),
}));

describe('SortFieldInterface', () => {
  it('defines the sort field schema and grouped sorting configuration', () => {
    const fieldInterface = new SortFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'sort',
      type: 'object',
      group: 'advanced',
      order: 1,
      title: 'Sort',
      sortable: true,
      titleUsable: true,
      default: {
        type: 'sort',
        uiSchema: {
          type: 'number',
          'x-component': 'InputNumber',
          'x-component-props': {
            stringMode: true,
            step: '1',
          },
          'x-validator': 'integer',
        },
      },
      availableTypes: ['sort'],
      hasDefaultValue: false,
      filterable: {
        operators: 'number',
      },
    });
    expect(fieldInterface.configure.items).toEqual([
      {
        name: 'scopeKey',
        Component: SortFieldConfigureForm,
      },
    ]);
  });
});
