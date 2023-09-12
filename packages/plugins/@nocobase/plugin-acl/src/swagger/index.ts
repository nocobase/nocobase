export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - ACL plugin',
  },
  paths: {
    '/roles:list': {
      get: {
        tags: ['roles'],
        description: '',
        parameters: [],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/role',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/roles:get': {
      get: {
        tags: ['roles'],
        description: '',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'role name',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:create': {
      post: {
        tags: ['roles'],
        description: '',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/role',
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
                  $ref: '#/components/schemas/role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:update': {
      post: {
        tags: ['roles'],
        description: '',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'role name',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/role',
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
                  $ref: '#/components/schemas/role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:destroy': {
      post: {
        tags: ['roles'],
        description: '',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'role name',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/roles:check': {
      get: {
        tags: ['roles'],
        description: 'return current user role',
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/role',
                },
              },
            },
          },
        },
      },
    },
    '/roles:setDefaultRole': {
      post: {
        tags: ['roles'],
        description: 'set default role for new user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roleName: {
                    type: 'string',
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
    '/roles/{roleName}/collections:list': {
      get: {
        tags: ['roles.collections'],
        description: 'list permissions of collections for role by roleName',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'role name',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'collection',
                      },
                      name: {
                        type: 'string',
                        description: 'collection name',
                      },
                      collectionName: {
                        type: 'string',
                        description: 'collection name',
                      },
                      title: {
                        type: 'string',
                        description: 'collection title',
                      },
                      roleName: {
                        type: 'string',
                        description: 'role name',
                      },
                      usingConfig: {
                        type: 'string',
                        enum: ['resourceAction', 'strategy'],
                        description: 'resourceAction: 单独配置, strategy: 全局策略',
                      },
                      exists: {
                        type: 'boolean',
                        description: '是否存在单独配置的权限',
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
    '/availableActions:list': {
      get: {
        tags: ['availableActions'],
        description: 'available actions of resource in current system',
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Action名称',
                      },
                      displayName: {
                        type: 'string',
                        description: 'Action显示名称',
                      },
                      allowConfigureFields: {
                        type: 'boolean',
                        description: '是否允许配置字段',
                      },
                      onNewRecord: {
                        type: 'string',
                        description: '是否是新记录的Action',
                      },
                      type: {
                        type: 'string',
                        description: 'new-data 或者 old-data',
                      },
                      aliases: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                        description: '别名',
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
  },
  components: {
    schemas: {
      role: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '角色名称',
          },
          name: {
            type: 'string',
            description: '角色标识',
          },
          description: {
            type: 'string',
            description: '角色描述',
          },
          hidden: {
            type: 'boolean',
            description: '是否隐藏',
          },
          default: {
            type: 'boolean',
            description: '是否默认',
          },
          allowConfigure: {
            type: 'boolean',
            description: '是否允许配置',
          },
          allowNewMenu: {
            type: 'boolean',
            description: '是否允许新建菜单',
          },
          snippets: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: '接口权限',
          },
          strategy: {
            type: 'array',
            description: '数据表权限策略',
            items: {
              type: 'object',
              properties: {
                actions: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: '操作',
                },
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
