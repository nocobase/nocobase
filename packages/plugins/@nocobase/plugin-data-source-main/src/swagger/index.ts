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
    title: 'NocoBase API - Collection manager plugin',
  },
  tags: [
    {
      name: 'collections',
      description: 'Collection modeling: CRUD, metadata inspection and bulk field synchronization',
    },
    {
      name: 'collections.fields',
      description: 'Field modeling under a collection: scalar fields, relations and ordering',
    },
    {
      name: 'collectionCategories',
      description: 'Collection category management',
    },
    {
      name: 'dbViews',
      description: 'Database view inspection for view-based collections',
    },
  ],
  paths: {
    '/collections:list': {
      get: {
        tags: ['collections'],
        summary: 'List collections',
        description: [
          'Get paginated collection records from the collection manager.',
          '',
          'Use this when you only need collection-level metadata. If you also need loaded field definitions,',
          'prefer `collections:listMeta`.',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/common/filter' },
          { $ref: '#/components/schemas/common/sort' },
          { $ref: '#/components/schemas/common/fields' },
          { $ref: '#/components/schemas/common/appends' },
          { $ref: '#/components/schemas/common/except' },
          { $ref: '#/components/schemas/common/page' },
          { $ref: '#/components/schemas/common/pageSize' },
          { $ref: '#/components/schemas/common/paginate' },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/collection/model' },
                    },
                    meta: { $ref: '#/components/schemas/common/paginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections:listMeta': {
      get: {
        tags: ['collections'],
        summary: 'List loaded collections with field metadata',
        description: [
          'Return the collections currently loaded in the application, including sorted field metadata.',
          '',
          'This is usually the best inspection endpoint before editing a schema because it exposes',
          'collection options, `filterTargetKey`, unavailable actions, and field definitions together.',
        ].join('\n'),
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/collection/model' },
                          {
                            type: 'object',
                            properties: {
                              filterTargetKey: {
                                type: 'string',
                                description: 'Field used by repository `filterByTk`, often `name` for collections',
                              },
                              unavailableActions: {
                                type: 'array',
                                items: { type: 'string' },
                              },
                              fields: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/field/model' },
                              },
                            },
                          },
                        ],
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
    '/collections:get': {
      get: {
        tags: ['collections'],
        summary: 'Get a collection',
        description: 'Get a single collection by collection name (`filterByTk`).',
        parameters: [
          { $ref: '#/components/schemas/collection/filterByTk' },
          { $ref: '#/components/schemas/common/filter' },
          { $ref: '#/components/schemas/common/appends' },
          { $ref: '#/components/schemas/common/except' },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/collection/model' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections:create': {
      post: {
        tags: ['collections'],
        summary: 'Create a collection',
        description: [
          'Create a new collection and optionally create fields in the same request.',
          '',
          'Request body uses collection values directly.',
          'Do not wrap the payload in an extra `values` object.',
        ].join('\n'),
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/collection/create' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/collection/model' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections:update': {
      post: {
        tags: ['collections'],
        summary: 'Update a collection',
        description: [
          'Update a collection by collection name (`filterByTk`).',
          '',
          'Request body uses collection values directly.',
          'Do not wrap the payload in an extra `values` object.',
        ].join('\n'),
        parameters: [{ $ref: '#/components/schemas/collection/filterByTk' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/collection/update' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections:destroy': {
      post: {
        tags: ['collections'],
        summary: 'Destroy a collection',
        description: [
          'Delete a collection by collection name (`filterByTk`).',
          '',
          'If `cascade` is true, dependent database objects such as related views can be removed together.',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/collection/filterByTk' },
          {
            name: 'cascade',
            in: 'query',
            description: 'Whether to cascade deletion to dependent database objects',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections:move': {
      post: {
        tags: ['collections'],
        summary: 'Move a collection',
        description: 'Reorder a collection inside collection manager sorting.',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/common/moveRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections:setFields': {
      post: {
        tags: ['collections'],
        summary: 'Replace a collection field set',
        description: [
          'Synchronize the complete field list of a collection.',
          '',
          'Server behavior:',
          '- fields present in request and already existing are updated',
          '- fields missing from request are destroyed',
          '- new fields are created',
          '',
          'This is the preferred bulk-sync endpoint for view collections after reading fresh metadata from `dbViews:get`.',
        ].join('\n'),
        parameters: [{ $ref: '#/components/schemas/collection/filterByTk' }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['values'],
                properties: {
                  values: {
                    type: 'object',
                    required: ['fields'],
                    properties: {
                      fields: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/field/write' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections/{collectionName}/fields:get': {
      get: {
        tags: ['collections.fields'],
        summary: 'Get a field in a collection',
        description: [
          'Get a single field by field name (`filterByTk`) under a collection.',
          '',
          'Use the logical field name, for example `title`, `company`, or `scheduledAt`.',
          'Do not use the field `key` here.',
          '',
          'If field-name lookup is ambiguous in client tooling, fall back to `fields:list` and filter by `name` or `key`.',
          'For MCP workflows, a reliable fallback is the generic CRUD tool with',
          '`resource: "collections.fields"`, `sourceId: "<collectionName>"`, `action: "get"`, and the same `filterByTk`.',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/field/collectionName' },
          { $ref: '#/components/schemas/field/filterByTk' },
          { $ref: '#/components/schemas/common/filter' },
          { $ref: '#/components/schemas/common/appends' },
          { $ref: '#/components/schemas/common/except' },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/field/model' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections/{collectionName}/fields:list': {
      get: {
        tags: ['collections.fields'],
        summary: 'List fields in a collection',
        description: 'List fields belonging to the specified collection.',
        parameters: [
          { $ref: '#/components/schemas/field/collectionName' },
          { $ref: '#/components/schemas/common/filter' },
          { $ref: '#/components/schemas/common/sort' },
          { $ref: '#/components/schemas/common/fields' },
          { $ref: '#/components/schemas/common/appends' },
          { $ref: '#/components/schemas/common/except' },
          { $ref: '#/components/schemas/common/page' },
          { $ref: '#/components/schemas/common/pageSize' },
          { $ref: '#/components/schemas/common/paginate' },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/field/model' },
                    },
                    meta: { $ref: '#/components/schemas/common/paginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections/{collectionName}/fields:create': {
      post: {
        tags: ['collections.fields'],
        summary: 'Create a field in a collection',
        description: [
          'Create a scalar field or relation field under `collectionName`.',
          '',
          'Pass `collectionName` as the path parameter, not inside the JSON body.',
          'The JSON body contains field values directly.',
          '',
          'Example path + body:',
          '```',
          'POST /api/collections/crm_companies/fields:create',
          '{ "name": "name", "type": "string", "interface": "input" }',
          '```',
          '',
          'Relation defaults are generated server-side when omitted:',
          '- `belongsTo`: infers `target` from field name pluralization and generates `foreignKey`',
          '- `hasMany`: infers `target`, `sourceKey`, `targetKey`, and generates `foreignKey`',
          '- `belongsToMany`: infers `target`, generates `through`, `foreignKey`, `otherKey`',
          '',
          'Relation creation may also create companion foreign-key fields such as `companyId` or `ownerId`.',
          '',
          'For stable automation, pass `target`, `foreignKey`, `sourceKey`, `targetKey`, and `through` explicitly.',
        ].join('\n'),
        parameters: [{ $ref: '#/components/schemas/field/collectionName' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/field/create' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/field/model' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections/{collectionName}/fields:update': {
      post: {
        tags: ['collections.fields'],
        summary: 'Update a field in a collection',
        description: [
          'Update an existing field in a collection.',
          '',
          'Pass `collectionName` as the path parameter.',
          'The JSON body contains field values directly.',
          'Do not wrap the payload in an extra `values` object.',
          '',
          'You can target the field either by `filterByTk` (recommended, field name in this association resource)',
          'or by a `filter` object such as `{ "key": "<field-key>" }`.',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/field/collectionName' },
          { $ref: '#/components/schemas/field/filterByTkOptional' },
          { $ref: '#/components/schemas/common/filter' },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/field/update' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/field/model' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collections/{collectionName}/fields:destroy': {
      post: {
        tags: ['collections.fields'],
        summary: 'Destroy a field in a collection',
        description: [
          'Delete a field in a collection.',
          '',
          'Use `filterByTk` with the field name for the common case.',
        ].join('\n'),
        parameters: [
          { $ref: '#/components/schemas/field/collectionName' },
          { $ref: '#/components/schemas/field/filterByTk' },
          { $ref: '#/components/schemas/common/filter' },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections/{collectionName}/fields:move': {
      post: {
        tags: ['collections.fields'],
        summary: 'Move a field in a collection',
        description: 'Reorder fields within a collection.',
        parameters: [{ $ref: '#/components/schemas/field/collectionName' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/common/moveRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collectionCategories:list': {
      post: {
        tags: ['collectionCategories'],
        summary: 'List collection categories',
        description: 'List collection category records.',
        parameters: [
          { $ref: '#/components/schemas/common/filter' },
          { $ref: '#/components/schemas/common/sort' },
          { $ref: '#/components/schemas/common/page' },
          { $ref: '#/components/schemas/common/pageSize' },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/collectionCategory/model' },
                    },
                    meta: { $ref: '#/components/schemas/common/paginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collectionCategories:get': {
      post: {
        tags: ['collectionCategories'],
        summary: 'Get a collection category',
        parameters: [{ $ref: '#/components/schemas/collectionCategory/filterByTk' }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/collectionCategory/model' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/collectionCategories:create': {
      post: {
        tags: ['collectionCategories'],
        summary: 'Create a collection category',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/collectionCategory/create' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collectionCategories:update': {
      post: {
        tags: ['collectionCategories'],
        summary: 'Update a collection category',
        parameters: [{ $ref: '#/components/schemas/collectionCategory/filterByTk' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/collectionCategory/update' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collectionCategories:destroy': {
      post: {
        tags: ['collectionCategories'],
        summary: 'Destroy a collection category',
        parameters: [{ $ref: '#/components/schemas/collectionCategory/filterByTk' }],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collectionCategories:move': {
      post: {
        tags: ['collectionCategories'],
        summary: 'Move a collection category',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/common/moveRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/dbViews:get': {
      get: {
        tags: ['dbViews'],
        summary: 'Get database view fields',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'View name in database',
            schema: {
              type: 'string',
            },
            required: true,
            example: 'posts_view',
          },
          {
            name: 'schema',
            in: 'query',
            description: 'PostgreSQL schema of the view',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        fields: {
                          type: 'object',
                          additionalProperties: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', description: 'Field name' },
                              type: { type: 'string', description: 'Field type' },
                              source: { type: 'string', description: 'Source field of the view field' },
                            },
                          },
                        },
                        sources: {
                          type: 'array',
                          items: { type: 'string' },
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
    },
    '/dbViews:list': {
      get: {
        tags: ['dbViews'],
        summary: 'List detached database views',
        description: 'List database views that are not yet connected to collection definitions.',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: 'View name' },
                          definition: { type: 'string', description: 'View definition SQL' },
                          schema: { type: 'string', description: 'Schema name' },
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
    },
    '/dbViews:query': {
      get: {
        tags: ['dbViews'],
        summary: 'Query database view rows',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'View name in database',
            schema: {
              type: 'string',
            },
            required: true,
            example: 'posts_view',
          },
          {
            name: 'schema',
            in: 'query',
            description: 'PostgreSQL schema of the view',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Page size',
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        description: 'Row data of the view',
                        additionalProperties: {
                          type: 'object',
                          description: 'Field value in the row',
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
    },
  },
  components: {
    schemas: {
      common: {
        filter: {
          name: 'filter',
          in: 'query',
          description: 'Structured NocoBase filter object',
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        sort: {
          name: 'sort',
          in: 'query',
          description: 'Sort fields. Prefix with `-` for descending',
          schema: {
            type: 'string',
          },
        },
        fields: {
          name: 'fields',
          in: 'query',
          description: 'Return only specified fields',
          schema: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        appends: {
          name: 'appends',
          in: 'query',
          description: 'Append association data',
          schema: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        except: {
          name: 'except',
          in: 'query',
          description: 'Exclude specified fields from response',
          schema: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        page: {
          name: 'page',
          in: 'query',
          description: 'Page number (1-based)',
          schema: {
            type: 'integer',
            default: 1,
          },
        },
        pageSize: {
          name: 'pageSize',
          in: 'query',
          description: 'Number of items per page',
          schema: {
            type: 'integer',
            default: 20,
          },
        },
        paginate: {
          name: 'paginate',
          in: 'query',
          description: 'Whether to return paginated result format',
          schema: {
            type: 'boolean',
            default: true,
          },
        },
        paginationMeta: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            totalPage: { type: 'integer' },
          },
        },
        moveRequest: {
          type: 'object',
          properties: {
            sourceId: {
              type: 'string',
              description: 'Source record identifier',
            },
            targetId: {
              type: 'string',
              description: 'Target record identifier',
            },
            method: {
              type: 'string',
              description: 'Move method, usually `insertAfter` or `insertBefore`',
              enum: ['insertAfter', 'insertBefore'],
            },
            sortField: {
              type: 'string',
              description: 'Sort field name, default is `sort`',
            },
            targetScope: {
              type: 'string',
              description: 'Target scope for scoped sorting',
            },
            sticky: {
              type: 'boolean',
              description: 'Whether to pin the source item to top',
            },
          },
        },
      },
      collection: {
        filterByTk: {
          name: 'filterByTk',
          in: 'query',
          description: 'Collection name',
          required: true,
          schema: { type: 'string' },
          example: 'posts',
        },
        model: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Collection manager primary key' },
            name: { type: 'string', description: 'Collection name / table name' },
            title: { type: 'string', description: 'Display title' },
            description: { type: 'string', nullable: true },
            inherit: { type: 'boolean' },
            hidden: { type: 'boolean' },
            sortable: {
              oneOf: [{ type: 'boolean' }, { type: 'string' }, { type: 'object', additionalProperties: true }],
              description: 'Sorting configuration',
            },
            autoGenId: { type: 'boolean' },
            createdBy: { type: 'boolean' },
            updatedBy: { type: 'boolean' },
            timestamps: { type: 'boolean' },
            logging: { type: 'boolean' },
            shared: { type: 'boolean' },
            schema: { type: 'string', nullable: true },
            view: { type: 'boolean' },
            template: { type: 'string', nullable: true },
            filterTargetKey: { type: 'string', nullable: true },
            titleField: { type: 'string', nullable: true },
            origin: { type: 'string', nullable: true },
            from: { type: 'string', nullable: true },
            options: {
              type: 'object',
              additionalProperties: true,
              description: 'Extra collection options not promoted to top-level properties',
            },
          },
        },
        create: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Collection name. Randomly generated if omitted.' },
            title: { type: 'string', description: 'Display title' },
            description: { type: 'string' },
            inherit: { type: 'boolean' },
            hidden: { type: 'boolean' },
            sortable: {
              oneOf: [{ type: 'boolean' }, { type: 'string' }, { type: 'object', additionalProperties: true }],
            },
            autoGenId: { type: 'boolean' },
            createdBy: { type: 'boolean' },
            updatedBy: { type: 'boolean' },
            timestamps: { type: 'boolean' },
            logging: { type: 'boolean' },
            schema: { type: 'string' },
            template: { type: 'string' },
            fields: {
              type: 'array',
              description: 'Optional initial fields created together with the collection',
              items: { $ref: '#/components/schemas/field/write' },
            },
          },
          additionalProperties: true,
        },
        update: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            inherit: { type: 'boolean' },
            hidden: { type: 'boolean' },
            sortable: {
              oneOf: [{ type: 'boolean' }, { type: 'string' }, { type: 'object', additionalProperties: true }],
            },
            createdBy: { type: 'boolean' },
            updatedBy: { type: 'boolean' },
            timestamps: { type: 'boolean' },
            logging: { type: 'boolean' },
            schema: { type: 'string' },
            template: { type: 'string' },
          },
          additionalProperties: true,
        },
      },
      field: {
        collectionName: {
          name: 'collectionName',
          in: 'path',
          description: 'Collection name',
          required: true,
          schema: { type: 'string' },
          example: 'posts',
        },
        filterByTk: {
          name: 'filterByTk',
          in: 'query',
          description: 'Field name in the target collection',
          required: true,
          schema: { type: 'string' },
          example: 'title',
        },
        filterByTkOptional: {
          name: 'filterByTk',
          in: 'query',
          description: 'Field name in the target collection',
          schema: { type: 'string' },
          example: 'title',
        },
        reverseField: {
          type: 'object',
          description: 'Reverse association field created or updated together with the current field',
          properties: {
            key: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            interface: { type: 'string' },
            uiSchema: {
              type: 'object',
              additionalProperties: true,
            },
            target: { type: 'string' },
            foreignKey: { type: 'string' },
            sourceKey: { type: 'string' },
            targetKey: { type: 'string' },
          },
          additionalProperties: true,
        },
        model: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            name: { type: 'string' },
            collectionName: { type: 'string' },
            type: { type: 'string', description: 'Field type, for example `string`, `integer`, `belongsTo`' },
            interface: {
              type: 'string',
              nullable: true,
              description: 'UI interface hint, for example `input`, `m2o`, `m2m`, `o2m`',
            },
            description: { type: 'string', nullable: true },
            source: { type: 'string', nullable: true, description: 'Source expression, mainly used by view fields' },
            field: { type: 'string', nullable: true, description: 'Underlying column name when different from `name`' },
            target: { type: 'string', nullable: true },
            through: { type: 'string', nullable: true },
            foreignKey: { type: 'string', nullable: true },
            otherKey: { type: 'string', nullable: true },
            sourceKey: { type: 'string', nullable: true },
            targetKey: { type: 'string', nullable: true },
            parentKey: { type: 'string', nullable: true },
            reverseKey: { type: 'string', nullable: true },
            onDelete: { type: 'string', nullable: true },
            sortBy: { type: 'string', nullable: true },
            sortable: { type: 'boolean', nullable: true },
            primaryKey: { type: 'boolean', nullable: true },
            autoIncrement: { type: 'boolean', nullable: true },
            unique: { type: 'boolean', nullable: true },
            allowNull: { type: 'boolean', nullable: true },
            defaultValue: {
              nullable: true,
            },
            enum: {
              type: 'array',
              description: 'Choice values.',
              items: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      value: {},
                      color: { type: 'string' },
                    },
                    required: ['label', 'value'],
                    additionalProperties: true,
                  },
                ],
              },
            },
            isForeignKey: { type: 'boolean', nullable: true },
            uiSchema: {
              type: 'object',
              description: 'UI schema payload.',
              additionalProperties: true,
            },
            options: {
              type: 'object',
              additionalProperties: true,
              description: 'Extra field options not promoted to top-level properties',
            },
            reverseField: { $ref: '#/components/schemas/field/reverseField' },
          },
          additionalProperties: true,
        },
        write: {
          type: 'object',
          description: [
            'Field write schema used by create/update/setFields.',
            '',
            'Use direct field values in the request body.',
            'Do not wrap the payload in an extra `values` object.',
          ].join('\n'),
          properties: {
            key: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            interface: { type: 'string' },
            description: { type: 'string' },
            field: { type: 'string' },
            source: { type: 'string' },
            target: { type: 'string' },
            through: { type: 'string' },
            foreignKey: { type: 'string' },
            otherKey: { type: 'string' },
            sourceKey: { type: 'string' },
            targetKey: { type: 'string' },
            parentKey: { type: 'string' },
            reverseKey: { type: 'string' },
            onDelete: { type: 'string', enum: ['CASCADE', 'RESTRICT', 'SET NULL', 'NO ACTION'] },
            sortBy: { type: 'string' },
            sortable: { type: 'boolean' },
            primaryKey: { type: 'boolean' },
            autoIncrement: { type: 'boolean' },
            unique: { type: 'boolean' },
            allowNull: { type: 'boolean' },
            defaultValue: {},
            enum: {
              type: 'array',
              description: 'Choice values.',
              items: {
                anyOf: [
                  { type: 'string' },
                  {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      value: {},
                      color: { type: 'string' },
                    },
                    required: ['label', 'value'],
                    additionalProperties: true,
                  },
                ],
              },
            },
            uiSchema: {
              type: 'object',
              description: 'UI schema payload.',
              additionalProperties: true,
            },
            reverseField: { $ref: '#/components/schemas/field/reverseField' },
          },
          additionalProperties: true,
        },
        create: {
          allOf: [{ $ref: '#/components/schemas/field/write' }],
        },
        update: {
          allOf: [{ $ref: '#/components/schemas/field/write' }],
        },
      },
      collectionCategory: {
        filterByTk: {
          name: 'filterByTk',
          in: 'query',
          description: 'Category id',
          required: true,
          schema: { type: 'integer' },
        },
        model: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            color: { type: 'string' },
          },
        },
        create: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            color: { type: 'string' },
          },
          additionalProperties: true,
        },
        update: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            color: { type: 'string' },
          },
          additionalProperties: true,
        },
      },
    },
  },
};
