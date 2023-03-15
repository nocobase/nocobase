module.exports = {
  swagger: '2.0',
  info: {
    description:
      'This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.',
    version: '0.9.1-alpha.2',
    title: 'NocoBase API',
    termsOfService: 'http://swagger.io/terms/',
    contact: { email: 'apiteam@swagger.io' },
    license: { name: 'Apache 2.0', url: 'http://www.apache.org/licenses/LICENSE-2.0.html' },
  },
  tags: [
    {
      name: 'pet',
      description: 'Everything about your Pets',
      externalDocs: { description: 'Find out more', url: 'http://swagger.io' },
    },
  ],
  schemes: [
    // 'https',
    'http',
  ],
  paths: {
    '/pet': {
      post: {
        tags: ['pet'],
        summary: 'Add a new pet to the store',
        description: '',
        operationId: 'addPet',
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [
          {
            in: 'body',
            name: 'body',
            description: 'Pet object that needs to be added to the store',
            required: true,
            schema: { $ref: '#/definitions/Pet' },
          },
        ],
        responses: { 405: { description: 'Invalid input' } },
        security: [{ petstore_auth: ['write:pets', 'read:pets'] }],
      },
      put: {
        tags: ['pet'],
        summary: 'Update an existing pet',
        description: '',
        operationId: 'updatePet',
        consumes: ['application/json', 'application/xml'],
        produces: ['application/json', 'application/xml'],
        parameters: [
          {
            in: 'body',
            name: 'body',
            description: 'Pet object that needs to be added to the store',
            required: true,
            schema: { $ref: '#/definitions/Pet' },
          },
        ],
        responses: {
          400: { description: 'Invalid ID supplied' },
          404: { description: 'Pet not found' },
          405: { description: 'Validation exception' },
        },
        security: [{ petstore_auth: ['write:pets', 'read:pets'] }],
      },
    },
  },
  securityDefinitions: {
    api_key: { type: 'apiKey', name: 'api_key', in: 'header' },
    petstore_auth: {
      type: 'oauth2',
      authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
      flow: 'implicit',
      scopes: { 'read:pets': 'read your pets', 'write:pets': 'modify pets in your account' },
    },
  },
  definitions: {
    ApiResponse: {
      type: 'object',
      properties: {
        code: { type: 'integer', format: 'int32' },
        type: { type: 'string' },
        message: { type: 'string' },
      },
    },
    Category: {
      type: 'object',
      properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' } },
      xml: { name: 'Category' },
    },
    Pet: {
      type: 'object',
      required: ['name', 'photoUrls'],
      properties: {
        id: { type: 'integer', format: 'int64' },
        category: { $ref: '#/definitions/Category' },
        name: { type: 'string', example: 'doggie' },
        photoUrls: {
          type: 'array',
          xml: { wrapped: true },
          items: { type: 'string', xml: { name: 'photoUrl' } },
        },
        tags: {
          type: 'array',
          xml: { wrapped: true },
          items: { xml: { name: 'tag' }, $ref: '#/definitions/Tag' },
        },
        status: {
          type: 'string',
          description: 'pet status in the store',
          enum: ['available', 'pending', 'sold'],
        },
      },
      xml: { name: 'Pet' },
    },
    Tag: {
      type: 'object',
      properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' } },
      xml: { name: 'Tag' },
    },
    Order: {
      type: 'object',
      properties: {
        id: { type: 'integer', format: 'int64' },
        petId: { type: 'integer', format: 'int64' },
        quantity: { type: 'integer', format: 'int32' },
        shipDate: { type: 'string', format: 'date-time' },
        status: { type: 'string', description: 'Order Status', enum: ['placed', 'approved', 'delivered'] },
        complete: { type: 'boolean' },
      },
      xml: { name: 'Order' },
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'integer', format: 'int64' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        phone: { type: 'string' },
        userStatus: { type: 'integer', format: 'int32', description: 'User Status' },
      },
      xml: { name: 'User' },
    },
  },
  externalDocs: { description: 'Find out more about Swagger', url: 'http://swagger.io' },
};
