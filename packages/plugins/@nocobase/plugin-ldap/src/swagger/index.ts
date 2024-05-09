/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const user = {
  type: 'object',
  description: '用户',
  properties: {
    id: {
      type: 'integer',
      description: 'ID',
    },
    nickname: {
      type: 'string',
      description: '昵称',
    },
    email: {
      type: 'string',
      description: '邮箱',
    },
    phone: {
      type: 'string',
      description: '手机号',
    },
    appLang: {
      type: 'string',
      description: '用户使用语言',
    },
    systemSettings: {
      type: 'object',
      description: '系统设置',
      properties: {
        theme: {
          type: 'string',
          description: '用户使用主题',
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
    createdById: {
      type: 'integer',
      description: '创建人',
    },
    updatedById: {
      type: 'integer',
      description: '更新人',
    },
  },
};

export default {
  info: {
    title: 'NocoBase API - LDAP Plugin',
  },
  paths: {
    '/ldap:getAuthUrl': {
      security: [],
      get: {
        descriptions: 'Get LDAP authorization url',
        tags: ['LDAP'],
        parameters: [
          {
            name: 'X-Authenticator',
            description: '登录方式标识',
            in: 'header',
            schema: {
              type: 'string',
            },
            required: true,
          },
        ],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/auth:signIn': {
      security: [],
      post: {
        descriptions: 'LDAP Sign in',
        tags: ['LDAP'],
        parameters: [
          {
            name: 'X-Authenticator',
            description: '登录方式标识',
            in: 'header',
            schema: {
              type: 'string',
            },
            required: true,
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ldapResponse: {
                    type: 'string',
                  },
                },
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
                  type: 'object',
                  properties: {
                    user,
                    token: {
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
  },
};
