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
    '/backupFiles:list': {
      get: {
        summary: 'Get backup file list',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number of item to retrieve',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              default: 1,
            },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Number of item to retrieve per page',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              default: 10,
            },
          },
        ],

        responses: {
          '200': {
            description: 'A paged array of backup statuses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        oneOf: [
                          {
                            $ref: '#/components/schemas/BackUpStatusOk',
                          },
                          {
                            $ref: '#/components/schemas/BackUpStatusDoing',
                          },
                        ],
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: {
                          type: 'integer',
                          format: 'int32',
                        },
                        pageSize: {
                          type: 'integer',
                          format: 'int32',
                        },
                        count: {
                          type: 'integer',
                          format: 'int64',
                        },
                        totalPage: {
                          type: 'integer',
                          format: 'int32',
                        },
                      },
                    },
                  },
                  required: ['data', 'meta'],
                },
              },
            },
          },
        },
      },
    },
    '/backupFiles:get': {
      get: {
        summary: 'Get backup file info',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],

        responses: {
          '200': {
            description: 'Status of the backup operation',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      $ref: '#/components/schemas/BackUpStatusOk',
                    },
                    {
                      $ref: '#/components/schemas/BackUpStatusDoing',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/backupFiles:download': {
      get: {
        summary: 'Download a backup file',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Download successful',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
    },
    '/backupFiles:destroy': {
      post: {
        summary: 'Destroy a backup file',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Destroy successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
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
    '/backupFiles:upload': {
      post: {
        summary: 'Upload a backup file',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description: 'Upload successful',
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

    '/backupFiles:restore': {
      post: {
        summary: 'Restore from a backup file',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  filterByTk: {
                    type: 'string',
                  },
                  dataTypes: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/DumpDataType',
                    },
                    uniqueItems: true,
                  },
                  key: {
                    type: 'string',
                  },
                },
                oneOf: [
                  {
                    required: ['filterByTk', 'dataTypes'],
                  },
                  {
                    required: ['key', 'dataTypes'],
                  },
                ],
              },
            },
          },
        },

        responses: {
          '200': {
            description: 'Restore successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
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
    '/backupFiles:dumpableCollections': {
      get: {
        summary: 'Get dumpable collections',
        responses: {
          '200': {
            description: 'A list of dumpable collections',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meta: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                          },
                          title: {
                            type: 'string',
                          },
                        },
                      },
                    },
                    config: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                          },
                          title: {
                            type: 'string',
                          },
                        },
                      },
                    },
                    business: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                          },
                          title: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                  required: ['meta', 'config', 'business'],
                },
              },
            },
          },
        },
      },
    },
  },

  components: {
    schemas: {
      BackUpStatusOk: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          fileSize: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['ok'],
          },
        },
        required: ['name', 'createdAt', 'fileSize', 'status'],
      },

      BackUpStatusDoing: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          inProgress: {
            type: 'boolean',
            enum: [true],
          },
          status: {
            type: 'string',
            enum: ['in_progress'],
          },
        },
        required: ['name', 'inProgress', 'status'],
      },

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
