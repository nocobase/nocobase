export default {
  info: {
    title: 'NocoBase API - Multi-app manager plugin',
  },
  tags: [],
  paths: {
    '/applications:list': {
      get: {
        tags: ['applications'],
        description: 'List all applications',
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/application',
                },
              },
            },
          },
        },
      },
    },
    '/applications:create': {
      post: {
        tags: ['applications'],
        description: 'Update application',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/applicationFrom',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/application',
                },
              },
            },
          },
        },
      },
    },
    '/applications:update': {
      post: {
        tags: ['applications'],
        description: 'Update application',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'application name',
            required: true,
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
                $ref: '#/components/schemas/applicationFrom',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/application',
                },
              },
            },
          },
        },
      },
    },
    '/applications:destroy': {
      post: {
        tags: ['applications'],
        description: 'Delete application',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'application name',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'ok',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      applicationFrom: {
        allOf: [
          {
            $ref: '#/components/schemas/application',
          },
          {
            type: 'object',
            properties: {
              createdAt: {
                readOnly: true,
              },
              updatedAt: {
                readOnly: true,
              },
              status: {
                readOnly: true,
              },
            },
          },
        ],
      },
      application: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'app-1',
            description: "The application's name",
          },
          displayName: {
            type: 'string',
            example: 'first application',
            description: "The application's display name",
          },
          pinned: {
            type: 'boolean',
            example: true,
            description: '是否在菜单上显示',
          },
          cname: {
            type: 'string',
            example: 'app-1.example.com',
            description: 'custom domain of the application',
          },
          status: {
            type: 'string',
            example: 'running',
            description: 'application status',
          },
          options: {
            type: 'object',
            properties: {
              // standaloneDeployment: {
              //   type: 'boolean',
              //   example: true,
              //   description: '是否为独立部署的子应用',
              // },
              autoStart: {
                type: 'boolean',
                example: true,
                description: '应用是否默认跟随主应用启动',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '创建时间',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '更新时间',
          },
        },
      },
    },
  },
};
