export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Collection manager plugin',
  },
  tags: [
    {
      name: 'collections',
    },
    {
      name: 'collections.fields',
    },
    {
      name: 'collectionCategories',
    },
    {
      name: 'dbViews',
      description: 'manager db views',
    },
  ],
  paths: {
    '/collections:list': {
      get: {
        tags: ['collections'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections:get': {
      get: {
        tags: ['collections'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections:create': {
      post: {
        tags: ['collections'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections:update': {
      post: {
        tags: ['collections'],
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections/{collectionName}/fields:list': {
      get: {
        tags: ['collections.fields'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections/{collectionName}/fields:create': {
      post: {
        tags: ['collections.fields'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections/{collectionName}/fields:update': {
      post: {
        tags: ['collections.fields'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collections/{collectionName}/fields:destroy': {
      post: {
        tags: ['collections.fields'],
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collectionCategories:get': {
      post: {
        tags: ['collectionCategories'],
        description: '',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/collectionCategories:create': {
      post: {
        tags: ['collectionCategories'],
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        description: '',
        parameters: [],
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
        summary: 'get db view fields',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'view name in database',
            schema: {
              type: 'string',
            },
            required: true,
            example: 'posts_view',
          },
          {
            name: 'schema',
            in: 'query',
            description: 'postgres schema of view in database',
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
                              name: { type: 'string', description: 'field name' },
                              type: { type: 'string', description: 'field type' },
                              source: { type: 'string', required: false, description: 'source field of view field' },
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
        summary: 'list views that not connected to collections in database',
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
                          name: { type: 'string', description: 'name of view' },
                          definition: { type: 'string', description: 'definition of view' },
                          schema: { type: 'string', description: 'schema of view' },
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
        summary: 'query db view data',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'view name in database',
            schema: {
              type: 'string',
            },
            required: true,
            example: 'posts_view',
          },
          {
            name: 'schema',
            in: 'query',
            description: 'postgres schema of view in database',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'page number',
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'page size',
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
                        description: 'row data of view',
                        additionalProperties: {
                          type: 'object',
                          description: "row data's field value",
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
};
