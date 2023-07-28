export default {
  info: {
    title: 'NocoBase API - API doc plugin',
  },
  paths: {
    '/swagger:getUrls': {
      get: {
        description: 'Get all api-doc destination',
        tags: ['swagger'],
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/responses/SwaggerUrls',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    responses: {
      SwaggerUrls: {
        type: 'array',
        items: {
          properties: {
            name: {
              type: 'string',
            },
            url: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};
