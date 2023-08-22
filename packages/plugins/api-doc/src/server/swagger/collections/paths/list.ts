import { Collection } from '@nocobase/database';

export default (collection: Collection) => {
  return {
    [`/${collection.name}:list`]: {
      get: {
        tags: [collection.name],
        description: `list ${collection.name}`,
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
                        $ref: `#/components/schemas/${collection.name}`,
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
    },
    [`/${collection.name}:get`]: {
      get: {
        tags: [collection.name],
        description: `get ${collection.name}`,
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
                  $ref: `#/components/schemas/${collection.name}`,
                },
              },
            },
          },
        },
      },
    },
  };
};
