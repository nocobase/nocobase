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
    version: '1.0.11',
  },
  externalDocs: {
    description: 'Find out more about NocoBase',
    url: 'https://docs.nocobase.com/',
  },
  components: {
    securitySchemes: {
      'api-key': {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  security: [
    {
      'api-key': [],
    },
  ],
};
