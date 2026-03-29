/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Data source manager plugin',
  },
  paths: {
    '/dataSources:listEnabled': {
      get: {
        tags: ['dataSources'],
        summary: 'List enabled external data sources',
        description: 'Return enabled non-main data sources, optionally including loaded collections.',
        parameters: [
          {
            name: 'appends',
            in: 'query',
            description: 'Append related data, for example `collections`.',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/DataSourceInfo',
                      },
                    },
                    meta: {
                      type: 'object',
                      additionalProperties: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      DataSourceInfo: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
          },
          displayName: {
            type: 'string',
          },
          status: {
            type: 'string',
          },
          type: {
            type: 'string',
          },
          isDBInstance: {
            type: 'boolean',
          },
          options: {
            type: 'object',
            additionalProperties: true,
          },
          errorMessage: {
            type: 'string',
          },
          collections: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/DataSourceCollectionInfo',
            },
          },
        },
        additionalProperties: true,
      },
      DataSourceCollectionInfo: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          availableActions: {
            type: 'object',
            additionalProperties: true,
          },
          unavailableActions: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
  },
};
