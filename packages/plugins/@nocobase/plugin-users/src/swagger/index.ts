/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - User plugin',
  },
  paths: {
    '/users:list': {
      get: {
        tags: ['users'],
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
                    $ref: '#/components/schemas/user',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/users:get': {
      get: {
        tags: ['users'],
        description: '',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'user id',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/user',
                },
              },
            },
          },
        },
      },
    },
    '/users:create': {
      post: {
        tags: ['users'],
        description: '',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/user',
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
                  $ref: '#/components/schemas/user',
                },
              },
            },
          },
        },
      },
    },
    '/users:update': {
      post: {
        tags: ['users'],
        description: '',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'user id',
            required: true,
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/user',
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
                  $ref: '#/components/schemas/user',
                },
              },
            },
          },
        },
      },
    },
    '/users:destroy': {
      post: {
        tags: ['users'],
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
  },
  components: {
    schemas: {
      user: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: '用户ID',
          },
          nickname: {
            type: 'string',
            description: '昵称',
          },
          username: {
            type: 'string',
            description: '用户名',
          },
          email: {
            type: 'string',
            description: 'email',
          },
          phone: {
            type: 'string',
            description: '手机号码',
          },
          password: {
            type: 'string',
            description: '密码',
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
