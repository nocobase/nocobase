/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { fieldsToOptions } from '../fieldsToOptions';

describe('fieldsToOptions', () => {
  it('skips nested fields when target collection is unavailable', () => {
    const field = {
      name: 'space',
      type: 'belongsTo',
      target: 'spaces',
      title: 'Space',
      interface: 'm2o',
      filterable: true,
      uiSchema: {},
      getInterfaceOptions: () => ({
        filterable: {
          nested: true,
          operators: [{ value: '$eq', label: 'is' }],
        },
      }),
      getFields: () => {
        throw new Error('Target collection spaces not found for field space');
      },
    };

    expect(() => fieldsToOptions([field], 1, [], (key: string) => key)).not.toThrow();
    expect(fieldsToOptions([field], 1, [], (key: string) => key)).toEqual([
      {
        name: 'space',
        type: 'belongsTo',
        target: 'spaces',
        title: 'Space',
        schema: {},
        operators: [{ value: '$eq', label: 'is' }],
        children: [],
      },
    ]);
  });
});
