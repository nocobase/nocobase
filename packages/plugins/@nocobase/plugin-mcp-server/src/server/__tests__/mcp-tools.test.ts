/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { sanitizeJsonSchemaForOpenAITools } from '../schema-utils';

describe('sanitizeJsonSchemaForOpenAITools', () => {
  it('should remove null type and nullable markers recursively', () => {
    const schema = sanitizeJsonSchemaForOpenAITools({
      type: 'object',
      properties: {
        requestBody: {
          type: null,
          nullable: true,
          properties: {
            actions: {
              type: 'array',
              items: {
                type: null,
                nullable: true,
                properties: {
                  scope: {
                    type: 'null',
                    nullable: true,
                    properties: {
                      id: {
                        type: ['integer', 'null'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(schema).toEqual({
      type: 'object',
      properties: {
        requestBody: {
          type: 'object',
          properties: {
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scope: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});
