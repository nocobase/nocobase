/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import swagger from '../swagger/index.json';

describe('core swagger parameters', () => {
  test('should describe filter as a deepObject query parameter', () => {
    expect(swagger.components.parameters.filter).toMatchObject({
      name: 'filter',
      in: 'query',
      style: 'deepObject',
      explode: true,
      schema: {
        type: 'object',
        additionalProperties: true,
      },
    });
  });

  test('should describe comma-separated query parameters as strings', () => {
    for (const key of ['sort', 'fields', 'except', 'appends', 'whitelist', 'blacklist']) {
      expect(swagger.components.parameters[key].schema).toMatchObject({
        type: 'string',
      });
      expect(swagger.components.parameters[key].schema.oneOf).toBeUndefined();
    }
  });
});
