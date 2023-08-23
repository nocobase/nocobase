import { Collection } from '@nocobase/database';
import { parse } from '@nocobase/utils';
import { hasSortField } from './index';

export function ListActionTemplate(options: any) {
  const template = parse({
    get: {
      tags: ['{{target}}'],
      description: `list {{target}}`,
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'page number',
          required: false,
          schema: {
            type: 'integer',
          },
        },
        {
          name: 'pageSize',
          in: 'query',
          description: 'page size',
          required: false,
          schema: {
            type: 'integer',
          },
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
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/{{collectionName}}',
                    },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      count: {
                        type: 'integer',
                        description: 'total count',
                      },
                      page: {
                        type: 'integer',
                        description: 'current page',
                      },
                      pageSize: {
                        type: 'integer',
                        description: 'items count per page',
                      },
                      totalPage: {
                        type: 'integer',
                        description: 'total page',
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
  });

  return template(options);
}

export function GetActionTemplate(options: any) {
  const template = parse({
    get: {
      tags: ['{{target}}'],
      description: `get {{target}}`,
      parameters: [
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
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/{{collectionName}}`,
              },
            },
          },
        },
      },
    },
  });

  return template(options);
}

export function CreateActionTemplate(options: any) {
  const template = parse({
    post: {
      tags: ['{{target}}'],
      description: `create {{target}}`,
      parameters: [
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
              $ref: `#/components/schemas/{{collectionName}}.form`,
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/{{collectionName}}`,
              },
            },
          },
        },
      },
    },
  });

  return template(options);
}

export function UpdateActionTemplate(options: any) {
  const template = parse({
    post: {
      tags: ['{{target}}'],
      description: `update {{target}}`,
      parameters: [
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
              $ref: `#/components/schemas/{{collectionName}}.form`,
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/{{collectionName}}`,
              },
            },
          },
        },
      },
    },
  });

  return template(options);
}

export function DestroyActionTemplate(options: any) {
  const template = parse({
    post: {
      tags: ['{{target}}'],
      description: `destroy {{target}}`,
      parameters: [
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
  });

  return template(options);
}

export function MoveActionTemplate(options: any) {
  const template = parse({
    post: {
      tags: ['{{target}}'],
      description: `move {{target}}`,
      parameters: [
        {
          name: 'sourceId',
          in: 'query',
          description: 'source id',
          schema: { type: 'string' },
        },
        {
          name: 'targetId',
          in: 'query',
          description: 'move target id',
          schema: { type: 'string' },
        },

        {
          name: 'method',
          in: 'query',
          description: 'move method, insertAfter or insertBefore',
          schema: { type: 'string' },
        },
        {
          name: 'sortField',
          in: 'query',
          description: 'sort field name, default is sort',
          schema: { type: 'string' },
        },
        {
          name: 'targetScope',
          in: 'query',
          description: 'move target scope',
          schema: { type: 'string' },
        },
        {
          name: 'sticky',
          in: 'query',
          description: 'sticky to top',
          schema: { type: 'boolean' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  });
  return template(options);
}

export default (collection: Collection) => {
  const apiDoc = {
    [`/${collection.name}:list`]: ListActionTemplate({
      collectionName: collection.name,
      target: collection.name,
    }),
    [`/${collection.name}:get`]: GetActionTemplate({
      collectionName: collection.name,
      target: collection.name,
    }),
    [`/${collection.name}:create`]: CreateActionTemplate({
      collectionName: collection.name,
      target: collection.name,
    }),
    [`/${collection.name}:update`]: UpdateActionTemplate({
      collectionName: collection.name,
      target: collection.name,
    }),
    [`/${collection.name}:destroy`]: DestroyActionTemplate({
      collectionName: collection.name,
      target: collection.name,
    }),
  };

  if (hasSortField(collection)) {
    apiDoc[`/${collection.name}:move`] = MoveActionTemplate({
      collectionName: collection.name,
      target: collection.name,
    });
  }
  return apiDoc;
};
