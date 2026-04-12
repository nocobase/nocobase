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
    title: 'NocoBase API - Core',
  },
  tags: [
    {
      name: '$collection',
      description: 'Data table',
    },
    {
      name: '$collection.$oneToOneAssociation',
      description: 'One to one relationship',
    },
    {
      name: '$collection.$manyToOneAssociation',
      description: 'Many to one relationship',
    },
    {
      name: '$collection.$oneToManyAssociation',
      description: 'One to many relationship',
    },
    {
      name: '$collection.$manyToManyAssociation',
      description: 'Many to many relationship',
    },
    {
      name: 'app',
      description: 'app',
    },
    {
      name: 'pm',
      description: 'pm',
    },
  ],
  components: {
    parameters: {
      collectionName: {
        required: true,
        name: 'collectionName',
        in: 'path',
        description: 'Collection name',
        schema: {
          type: 'string',
        },
      },
      collectionIndex: {
        required: true,
        name: 'collectionIndex',
        in: 'path',
        description: 'Collection index',
        schema: {
          type: 'integer',
          format: 'int64',
        },
      },
      oneToOneAssociation: {
        required: true,
        name: 'oneToOneAssociation',
        in: 'path',
        description: 'Association name',
        schema: {
          type: 'string',
        },
      },
      manyToOneAssociation: {
        required: true,
        name: 'manyToOneAssociation',
        in: 'path',
        description: 'Association name',
        schema: {
          type: 'string',
        },
      },
      oneToManyAssociation: {
        required: true,
        name: 'oneToManyAssociation',
        in: 'path',
        description: 'Association name',
        schema: {
          type: 'string',
        },
      },
      manyToManyAssociation: {
        required: true,
        name: 'manyToManyAssociation',
        in: 'path',
        description: 'Association name',
        schema: {
          type: 'string',
        },
      },
      page: {
        name: 'page',
        in: 'query',
        description: 'page number',
        required: false,
        schema: {
          type: 'integer',
        },
      },
      pageSize: {
        name: 'pageSize',
        in: 'query',
        description: 'page size',
        required: false,
        schema: {
          type: 'integer',
        },
      },
      filterByTk: {
        name: 'filterByTk',
        in: 'query',
        description: 'filter by TK(default by ID)',
        schema: {
          type: 'string',
        },
      },
      filterByTks: {
        name: 'filterByTks',
        in: 'query',
        description: 'filter by TKs(default by ID), example: `1,2,3`',
        schema: {
          type: 'string',
        },
      },
      filter: {
        name: 'filter',
        in: 'query',
        description: 'filter items',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      sort: {
        name: 'sort',
        in: 'query',
        description: 'sort items by fields, example: `-field1,-field2,field3`',
        schema: {
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['-id', 'createdAt'],
            },
            {
              type: 'string',
              example: '-id,createdAt',
            },
          ],
        },
      },
      fields: {
        name: 'fields',
        in: 'query',
        description: 'select fields, example: `field1,field2`',
        schema: {
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['id', 'createdAt'],
            },
            {
              type: 'string',
              example: 'id,createdAt',
            },
          ],
        },
      },
      except: {
        name: 'except',
        in: 'query',
        description: 'except fields in results, example: `field1,field2`',
        schema: {
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['id', 'createdAt'],
            },
            {
              type: 'string',
              example: 'id,createdAt',
            },
          ],
        },
      },
      appends: {
        name: 'appends',
        in: 'query',
        description: 'append associations in results, example: `assoc1,assoc2`',
        schema: {
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['id', 'createdAt'],
            },
            {
              type: 'string',
              example: 'id,createdAt',
            },
          ],
        },
      },
      whitelist: {
        name: 'whitelist',
        in: 'query',
        description: 'whitelist for fields changes, example: `field1,field2`',
        schema: {
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['id', 'createdAt'],
            },
            {
              type: 'string',
              example: 'id,createdAt',
            },
          ],
        },
      },
      blacklist: {
        name: 'blacklist',
        in: 'query',
        description: 'blacklist for fields changes, example: `field1,field2`',
        schema: {
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['id', 'createdAt'],
            },
            {
              type: 'string',
              example: 'id,createdAt',
            },
          ],
        },
      },
    },
  },
} as const;
