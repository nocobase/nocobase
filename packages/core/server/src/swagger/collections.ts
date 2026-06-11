/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  '/{collectionName}:list': {
    get: {
      tags: ['$collection'],
      summary: 'Returns a list of the collection',
      description: 'A list of the collection',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
        {
          $ref: '#/components/parameters/page',
        },
        {
          $ref: '#/components/parameters/pageSize',
        },
        {
          $ref: '#/components/parameters/sort',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}:get': {
    get: {
      tags: ['$collection'],
      summary: 'Returns a record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/sort',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}:create': {
    post: {
      tags: ['$collection'],
      summary: 'Create record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
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
  '/{collectionName}:update': {
    post: {
      tags: ['$collection'],
      summary: 'Update record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
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
  '/{collectionName}:destroy': {
    post: {
      tags: ['$collection'],
      summary: 'Delete record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}:move': {
    post: {
      tags: ['$collection'],
      summary: 'Move record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          name: 'sourceId',
          in: 'query',
          description: 'source id',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'targetId',
          in: 'query',
          description: 'move target id',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'method',
          in: 'query',
          description: 'move method, insertAfter or insertBefore',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'sortField',
          in: 'query',
          description: 'sort field name, default is sort',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'targetScope',
          in: 'query',
          description: 'move target scope',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'sticky',
          in: 'query',
          description: 'sticky to top',
          schema: {
            type: 'boolean',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToOneAssociation}:get': {
    get: {
      tags: ['$collection.$oneToOneAssociation'],
      summary: 'Returns the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToOneAssociation',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToOneAssociation}:create': {
    post: {
      tags: ['$collection.$oneToOneAssociation'],
      summary: 'Create and associate a record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToOneAssociation',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToOneAssociation}:update': {
    post: {
      tags: ['$collection.$oneToOneAssociation'],
      summary: 'Update the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToOneAssociation',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToOneAssociation}:destroy': {
    post: {
      tags: ['$collection.$oneToOneAssociation'],
      summary: 'Delete and disassociate the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToOneAssociation',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToOneAssociation}:set': {
    post: {
      tags: ['$collection.$oneToOneAssociation'],
      summary: 'Associate a record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToOneAssociation',
        },
        {
          name: 'filterByTk',
          in: 'query',
          required: true,
          description: 'filter by tk',
          schema: {
            type: 'integer',
            format: 'int64',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToOneAssociation}:remove': {
    post: {
      tags: ['$collection.$oneToOneAssociation'],
      summary: 'Disassociate the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToOneAssociation',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToOneAssociation}:get': {
    get: {
      tags: ['$collection.$manyToOneAssociation'],
      summary: 'Returns the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToOneAssociation',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToOneAssociation}:create': {
    post: {
      tags: ['$collection.$manyToOneAssociation'],
      summary: 'Create and associate a record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToOneAssociation',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToOneAssociation}:update': {
    post: {
      tags: ['$collection.$manyToOneAssociation'],
      summary: 'Update the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToOneAssociation',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToOneAssociation}:destroy': {
    post: {
      tags: ['$collection.$manyToOneAssociation'],
      summary: 'Delete and disassociate the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToOneAssociation',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToOneAssociation}:set': {
    post: {
      tags: ['$collection.$manyToOneAssociation'],
      summary: 'Associate a record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToOneAssociation',
        },
        {
          name: 'filterByTk',
          in: 'query',
          required: true,
          description: 'filter by tk',
          schema: {
            type: 'integer',
            format: 'int64',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToOneAssociation}:remove': {
    post: {
      tags: ['$collection.$manyToOneAssociation'],
      summary: 'Disassociate the relationship record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToOneAssociation',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:list': {
    get: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Returns a list of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
        {
          $ref: '#/components/parameters/page',
        },
        {
          $ref: '#/components/parameters/pageSize',
        },
        {
          $ref: '#/components/parameters/sort',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:get': {
    get: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Returns a record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
        {
          $ref: '#/components/parameters/sort',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:create': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Create and attach record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:update': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Update record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:destroy': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Delete and detach record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:move': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Move record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          name: 'sourceId',
          in: 'query',
          description: 'source id',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'targetId',
          in: 'query',
          description: 'move target id',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'method',
          in: 'query',
          description: 'move method, insertAfter or insertBefore',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'sortField',
          in: 'query',
          description: 'sort field name, default is sort',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'targetScope',
          in: 'query',
          description: 'move target scope',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'sticky',
          in: 'query',
          description: 'sticky to top',
          schema: {
            type: 'boolean',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:set': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Set or reset associations',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filterByTks',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:add': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Attach record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filterByTks',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{oneToManyAssociation}:remove': {
    post: {
      tags: ['$collection.$oneToManyAssociation'],
      summary: 'Detach record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/oneToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filterByTks',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:list': {
    get: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Returns a list of the many-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
        {
          $ref: '#/components/parameters/page',
        },
        {
          $ref: '#/components/parameters/pageSize',
        },
        {
          $ref: '#/components/parameters/sort',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:get': {
    get: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Returns a record of the many-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
        {
          $ref: '#/components/parameters/sort',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:create': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Create and attach record of the many-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:update': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Update record of the many-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:destroy': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Delete and detach record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:move': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Move record of the one-to-many relationship',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          name: 'sourceId',
          in: 'query',
          description: 'source id',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'targetId',
          in: 'query',
          description: 'move target id',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'method',
          in: 'query',
          description: 'move method, insertAfter or insertBefore',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'sortField',
          in: 'query',
          description: 'sort field name, default is sort',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'targetScope',
          in: 'query',
          description: 'move target scope',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'sticky',
          in: 'query',
          description: 'sticky to top',
          schema: {
            type: 'boolean',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:set': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Set or reset associations',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filterByTks',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:add': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Attach record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filterByTks',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:remove': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Detach record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filterByTks',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
  '/{collectionName}/{collectionIndex}/{manyToManyAssociation}:toggle': {
    post: {
      tags: ['$collection.$manyToManyAssociation'],
      summary: 'Attach or detach record',
      parameters: [
        {
          $ref: '#/components/parameters/collectionName',
        },
        {
          $ref: '#/components/parameters/collectionIndex',
        },
        {
          $ref: '#/components/parameters/manyToManyAssociation',
        },
        {
          $ref: '#/components/parameters/filterByTk',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  },
} as const;
