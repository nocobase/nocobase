/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { McpToolsManager } from '@nocobase/ai';
import { sanitizeJsonSchemaForOpenAITools } from '../schema-utils';
import { normalizeMcpToolName, parseResourceActionFromPath } from '../mcp-tools';

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

  it('should parse resource and action names from action paths', () => {
    expect(parseResourceActionFromPath('/collections:list')).toEqual({
      resourceName: 'collections',
      actionName: 'list',
    });

    expect(parseResourceActionFromPath('/collections/{filterByTk}/fields:list')).toEqual({
      resourceName: 'collections.fields',
      actionName: 'list',
    });
  });

  it('should apply registered post processors by resource and action', async () => {
    const manager = new McpToolsManager();

    manager.registerToolResultPostProcessor('collections', 'list', (result) => {
      return {
        ...result,
        compressed: true,
      };
    });

    const output = await manager.postProcessToolResult(
      {
        name: 'collections_list',
        description: 'list collections',
        resourceName: 'collections',
        actionName: 'list',
        call: async () => null,
      },
      {
        data: [],
      },
      {
        args: {},
      },
    );

    expect(output).toEqual({
      data: [],
      compressed: true,
    });
  });

  it('should normalize generated tool names without method prefixes', () => {
    expect(
      normalizeMcpToolName({
        name: 'PostCollectionsFields_destroy',
        pathTemplate: '/collections/{filterByTk}/fields:destroy',
      }),
    ).toBe('collections_fields_destroy');

    expect(
      normalizeMcpToolName({
        name: 'GetCollections_listMeta',
        pathTemplate: '/collections:listMeta',
      }),
    ).toBe('collections_list_meta');
  });
});
