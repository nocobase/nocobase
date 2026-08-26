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
    '/dataSources/{associatedIndex}/collections:list': {
      get: {
        tags: ['dataSources.collections'],
        summary: 'List external data source collections',
        description: [
          'List loaded collections in one external data source, including field metadata.',
          '',
          'Use this endpoint to discover external table names before applying relation field metadata.',
        ].join('\n'),
        parameters: [
          {
            name: 'associatedIndex',
            in: 'path',
            required: true,
            description: 'External data source key, for example `external`.',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'filter',
            in: 'query',
            required: false,
            description: 'Filter object matched against collection options.',
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'paginate',
            in: 'query',
            required: false,
            schema: {
              type: 'boolean',
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
                        $ref: '#/components/schemas/DataSourceCollectionInfo',
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
    '/dataSourcesCollections/{associatedIndex}/fields:list': {
      get: {
        tags: ['dataSourcesCollections.fields'],
        summary: 'List external data source collection fields',
        description: [
          'List loaded field metadata for one external data source collection.',
          '',
          'The associatedIndex path parameter is `<dataSourceKey>.<collectionName>`.',
        ].join('\n'),
        parameters: [
          {
            name: 'associatedIndex',
            in: 'path',
            required: true,
            description: 'External data source collection locator, for example `external.orders`.',
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
                  type: 'array',
                  items: {
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
    '/dataSourcesCollections/{associatedIndex}/fields:apply': {
      post: {
        tags: ['dataSourcesCollections.fields'],
        summary: 'Create or update an external data source field',
        description: [
          'Upsert one external data source field from a compact request body.',
          '',
          'Use this endpoint for external data source field metadata, including relation fields.',
          'The associatedIndex path parameter is `<dataSourceKey>.<collectionName>`.',
          '',
          'Relation fields may use compact interfaces such as `m2o`, `o2m`, `oho`, and `m2m`.',
          'The server fills readable relation key defaults when explicit keys are omitted.',
        ].join('\n'),
        parameters: [
          {
            name: 'associatedIndex',
            in: 'path',
            required: true,
            description: 'External data source collection locator, for example `external.orders`.',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DataSourceFieldApplyInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/DataSourceFieldApplyResult',
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
      DataSourceFieldApplyInput: {
        type: 'object',
        required: ['name'],
        properties: {
          dataSourceKey: {
            type: 'string',
            description: 'Optional when the path associatedIndex supplies the data source key.',
          },
          collectionName: {
            type: 'string',
            description: 'Optional when the path associatedIndex supplies the collection name.',
          },
          name: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          interface: {
            type: 'string',
            description: 'Compact field interface, for example `input`, `m2o`, `o2m`, `oho`, or `m2m`.',
          },
          type: {
            type: 'string',
            description:
              'Raw field type. Relation types include `belongsTo`, `hasMany`, `hasOne`, and `belongsToMany`.',
          },
          target: {
            type: 'string',
          },
          foreignKey: {
            type: 'string',
          },
          sourceKey: {
            type: 'string',
          },
          targetKey: {
            type: 'string',
          },
          through: {
            type: 'string',
          },
          otherKey: {
            type: 'string',
          },
          targetTitleField: {
            type: 'string',
          },
          titleField: {
            type: 'string',
          },
          uiSchema: {
            type: 'object',
            additionalProperties: true,
          },
          settings: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
      DataSourceFieldApplyResult: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
  },
};
