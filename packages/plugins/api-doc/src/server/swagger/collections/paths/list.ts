import { Collection } from '@nocobase/database';
import { parse } from '@nocobase/utils';

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
  return {
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
};
