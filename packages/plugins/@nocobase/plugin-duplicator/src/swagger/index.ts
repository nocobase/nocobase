export default {
  info: {
    title: 'NocoBase API - Backup & Restore plugin',
  },
  tags: [],
  paths: {
    '/backupFiles:create': {
      post: {
        summary: 'Create a new backup file',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DumpOptions',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Dump successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    key: {
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
    '/backupFiles:get': {
      get: {},
    },
  },

  components: {
    schemas: {
      DumpDataType: {
        type: 'string',
        enum: ['meta', 'config', 'business'],
      },
      DumpOptions: {
        type: 'object',
        properties: {
          dataTypes: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/DumpDataType',
            },
            uniqueItems: true,
          },
        },
        required: ['dataTypes'],
      },
    },
  },
};
