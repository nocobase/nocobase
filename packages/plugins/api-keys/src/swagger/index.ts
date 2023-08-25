export default {
  info: {
    title: 'NocoBase API - API keys plugin',
  },
  tags: [],
  paths: {
    '/apiKeys:create': {
      post: {
        description: 'Create api key',
        tags: ['apiKeys'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/apiKeys',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/apiKeys:list': {
      get: {
        description: 'get api keys',
        tags: ['apiKeys'],
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/apiKeys',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/apiKeys:destroy/{filterByTk}': {
      delete: {
        description: 'Create api key',
        tags: ['apiKeys'],
        parameters: [
          {
            name: 'filterByTk',
            description: 'primary key',
            required: true,
            in: 'path',
            schema: {
              type: 'integer',
              example: 1,
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      apiKeys: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
            example: 'key-name',
          },
          role: {
            type: 'object',
            // $ref: '#/components/schemas/roles'
          },
          expiresIn: {
            type: 'string',
            enum: ['1d', '7d', '30d', '90d', 'never'],
          },
        },
      },
    },
  },
};
/*

/api/apiKeys:create
/api/apiKeys:list
/api/apiKeys:destroy

*/
