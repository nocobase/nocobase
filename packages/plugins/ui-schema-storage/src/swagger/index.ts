export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - UI schema storage plugin',
  },
  tags: [],
  paths: {
    '/uiSchemas:getJsonSchema/{uid}': {
      get: {
        tags: ['uiSchemas'],
        description: '',
        parameters: [
          {
            $ref: '#/components/parameters/uid',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/uiSchema',
                },
              },
            },
          },
        },
      },
    },
    '/uiSchemas:getProperties/{uid}': {
      get: {
        tags: ['uiSchemas'],
        description: '获取ui schema的properties属性',
        parameters: [
          {
            $ref: '#/components/parameters/uid',
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
                    type: {
                      type: 'string',
                    },
                    properties: {
                      type: 'object',
                      additionalProperties: {
                        $ref: '#/components/schemas/uiSchema',
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
    '/uiSchemas:insert': {
      post: {
        tags: ['uiSchemas'],
        description: 'insert ui schema as root node',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/uiSchema',
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
                  $ref: '#/components/schemas/uiSchema',
                },
              },
            },
          },
        },
      },
    },
    '/uiSchemas:remove/{uid}': {
      post: {
        tags: ['uiSchemas'],
        description: 'remove an ui schema node by uid',
        parameters: [
          {
            $ref: '#/components/parameters/uid',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/uiSchemas:patch': {
      post: {
        tags: ['uiSchemas'],
        description: 'update an ui schema node by an new ui schema',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/uiSchema',
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
                  $ref: '#/components/schemas/uiSchema',
                },
              },
            },
          },
        },
      },
    },
    '/uiSchemas:batchPatch': {
      post: {
        tags: ['uiSchemas'],
        description: 'batch update ui schema nodes by an new ui schema item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/uiSchema',
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/uiSchemas:clearAncestor/{uid}': {
      post: {
        tags: ['uiSchemas'],
        description: 'Removes all ancestors of a given node',
        parameters: [
          {
            $ref: '#/components/parameters/uid',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/uiSchemas:insertAdjacent/{uid}': {
      post: {
        tags: ['uiSchemas'],
        description: 'insert a node adjacent to another node',
        parameters: [
          {
            $ref: '#/components/parameters/uid',
          },
          {
            name: 'position',
            in: 'query',
            required: true,
            description: 'position',
            schema: {
              type: 'string',
              enum: ['beforeBegin', 'afterBegin', 'beforeEnd', 'afterEnd'],
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  schema: {
                    $ref: '#/components/schemas/uiSchema',
                  },
                  wrap: {
                    $ref: '#/components/schemas/uiSchema',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/uiSchemas:saveAsTemplate': {
      post: {
        tags: ['uiSchemas'],
        description: 'save an ui schema as template',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'filterByTk',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  key: {
                    type: 'string',
                  },

                  collectionName: {
                    type: 'string',
                  },
                  componentName: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                    description: "template's name",
                  },
                  resourceName: {
                    type: 'string',
                    description: "template's resourceName",
                  },
                  uid: {
                    type: 'string',
                    description: 'ui schema id',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
  },
  components: {
    parameters: {
      uid: {
        name: 'uid',
        in: 'path',
        required: true,
        description: 'x-uid',
        schema: {
          type: 'string',
        },
      },
    },
    schemas: {
      uiSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            example: 'void',
          },
          title: {
            type: 'string',
            example: '{{ t("Actions") }}',
            description: "ui schema's title",
          },
          'x-uid': {
            type: 'string',
            example: 'ygdvvfnw3h8',
            description: 'unique id of ui schema node',
          },
          'x-index': {
            type: 'integer',
            exmaple: 1,
            description: "ui schema's order index",
          },
          'x-async': {
            type: 'boolean',
            example: false,
            description: 'async or not',
          },
          name: {
            type: 'string',
            name: '2qakvs173rs',
            description: "ui schema's name",
          },
          properties: {
            type: 'object',
            additionalProperties: {
              $ref: '#/components/schemas/uiSchema',
            },
          },
        },
      },
    },
  },
};
