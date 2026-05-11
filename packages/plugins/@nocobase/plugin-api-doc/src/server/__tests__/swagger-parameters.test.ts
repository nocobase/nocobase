/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import buildParameters from '../swagger/collections/components/parameters';

describe('plugin-api-doc > swagger parameters', () => {
  test('should generate distinct filterByTk and filterByTks query parameter names', () => {
    const collection: any = {
      name: 'posts',
      model: {
        primaryKeyAttribute: 'id',
      },
      fields: new Map([
        [
          'id',
          {
            dataType: 'bigint',
          },
        ],
      ]),
    };

    const { parameters } = buildParameters(collection);

    expect(parameters.filterByTk.name).toBe('filterByTk');
    expect(parameters.filterByTks.name).toBe('filterByTks');
    expect(parameters.filterByTks.schema).toEqual({
      type: 'array',
      items: {
        type: 'integer',
        format: 'int64',
      },
    });
  });

  test('should describe filter as a deepObject query parameter', () => {
    const collection: any = {
      name: 'posts',
      model: {},
      fields: new Map(),
    };

    const { parameters } = buildParameters(collection);

    expect(parameters.filter).toMatchObject({
      name: 'filter',
      in: 'query',
      style: 'deepObject',
      explode: true,
      schema: {
        type: 'object',
        additionalProperties: true,
      },
    });
    expect(parameters.filter.content).toBeUndefined();
  });
});
