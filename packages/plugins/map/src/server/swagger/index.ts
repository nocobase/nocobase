export default {
  paths: {
    '/map-configuration:get': {
      get: {
        description: 'Get map configuration',
        tags: ['mapConfiguration'],
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Map type',
            required: true,
            schema: {
              type: 'string',
              default: 'amap',
              enum: ['amap', 'google'],
            },
          },
        ],
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/mapConfiguration',
                },
              },
            },
          },
        },
      },
    },
    '/map-configuration:set': {
      post: {
        description: '设置·地图配置',
        tags: ['mapConfiguration'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/mapConfiguration',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'ok',
          },
        },
      },
    },
  },
};
