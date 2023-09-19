export default {
  openapi: '3.0.3',
  info: {
    title: 'NocoBase API documentation',
    description: '',
    contact: {
      url: 'https://github.com/nocobase/nocobase/issues',
    },
    license: {
      name: 'Core packages are Apache 2.0 & Plugins packages are AGPL 3.0 licensed.',
      url: 'https://github.com/nocobase/nocobase#license',
    },
  },
  externalDocs: {
    description: 'Find out more about NocoBase',
    url: 'https://docs.nocobase.com/api/http',
  },
  components: {
    securitySchemes: {
      'api-key': {
        type: 'http',
        scheme: 'bearer',
      },
    },
    schemas: {
      error: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                message: {
                  description: '错误信息',
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      'api-key': [],
    },
  ],
};
