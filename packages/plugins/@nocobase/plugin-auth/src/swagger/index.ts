/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  paths: {
    '/auth:check': {
      get: {
        description: 'Check if the user is logged in',
        tags: ['Auth'],
        parameters: [
          {
            name: 'X-Authenticator',
            description: '登录方式标识',
            in: 'header',
            schema: {
              type: 'string',
              default: 'basic',
            },
          },
        ],
        security: [],
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/user',
                    },
                    {
                      type: 'object',
                      properties: {
                        roles: {
                          $ref: '#/components/schemas/roles',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/auth:signIn': {
      post: {
        description: 'Sign in',
        tags: ['Basic auth'],
        security: [],
        parameters: [
          {
            name: 'X-Authenticator',
            description: '登录方式标识',
            in: 'header',
            schema: {
              type: 'string',
              default: 'basic',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    description: '邮箱',
                  },
                  password: {
                    type: 'string',
                    description: '密码',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                    },
                    user: {
                      $ref: '#/components/schemas/user',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/error',
                },
              },
            },
          },
        },
      },
    },
    '/auth:signUp': {
      post: {
        description: 'Sign up',
        tags: ['Basic auth'],
        security: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    description: '邮箱',
                  },
                  password: {
                    type: 'string',
                    description: '密码',
                  },
                  confirm_password: {
                    type: 'string',
                    description: '确认密码',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'ok',
          },
        },
      },
    },
    '/auth:signOut': {
      post: {
        description: 'Sign out',
        tags: ['Basic auth'],
        security: [],
        responses: {
          200: {
            description: 'ok',
          },
        },
      },
    },
    // '/auth:lostPassword': {
    //   post: {
    //     description: 'Lost password',
    //     tags: ['Basic auth'],
    //     security: [],
    //     requestBody: {
    //       content: {
    //         'application/json': {
    //           schema: {
    //             type: 'object',
    //             properties: {
    //               email: {
    //                 type: 'string',
    //                 description: '邮箱',
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     responses: {
    //       200: {
    //         description: 'successful operation',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               allOf: [
    //                 {
    //                   $ref: '#/components/schemas/user',
    //                 },
    //                 {
    //                   type: 'object',
    //                   properties: {
    //                     resetToken: {
    //                       type: 'string',
    //                       description: '重置密码的token',
    //                     },
    //                   },
    //                 },
    //               ],
    //             },
    //           },
    //         },
    //       },
    //       400: {
    //         description: 'Please fill in your email address',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               $ref: '#/components/schemas/error',
    //             },
    //           },
    //         },
    //       },
    //       401: {
    //         description: 'The email is incorrect, please re-enter',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               $ref: '#/components/schemas/error',
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    // '/auth:resetPassword': {
    //   post: {
    //     description: 'Reset password',
    //     tags: ['Basic auth'],
    //     security: [],
    //     requestBody: {
    //       content: {
    //         'application/json': {
    //           schema: {
    //             type: 'object',
    //             properties: {
    //               email: {
    //                 type: 'string',
    //                 description: '邮箱',
    //               },
    //               password: {
    //                 type: 'string',
    //                 description: '密码',
    //               },
    //               resetToken: {
    //                 type: 'string',
    //                 description: '重置密码的token',
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     responses: {
    //       200: {
    //         description: 'successful operation',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               $ref: '#/components/schemas/user',
    //             },
    //           },
    //         },
    //       },
    //       404: {
    //         description: 'User not found',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               $ref: '#/components/schemas/error',
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    // '/auth:getUserByResetToken': {
    //   get: {
    //     description: 'Get user by reset token',
    //     tags: ['Basic auth'],
    //     security: [],
    //     parameters: [
    //       {
    //         name: 'token',
    //         in: 'query',
    //         description: '重置密码的token',
    //         required: true,
    //         schema: {
    //           type: 'string',
    //         },
    //       },
    //     ],
    //     responses: {
    //       200: {
    //         description: 'ok',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               $ref: '#/components/schemas/user',
    //             },
    //           },
    //         },
    //       },
    //       401: {
    //         description: 'Unauthorized',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               $ref: '#/components/schemas/error',
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    '/auth:changePassword': {
      post: {
        description: 'Change password',
        tags: ['Basic auth'],
        security: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  oldPassword: {
                    type: 'string',
                    description: '旧密码',
                  },
                  newPassword: {
                    type: 'string',
                    description: '新密码',
                  },
                  confirmPassword: {
                    type: 'string',
                    description: '确认密码',
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
                  $ref: '#/components/schemas/user',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/error',
                },
              },
            },
          },
        },
      },
    },
    'authenticators:listTypes': {
      get: {
        description: 'List authenticator types',
        tags: ['Authenticator'],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    'authenticators:publicList': {
      get: {
        description: 'List enabled authenticators',
        tags: ['Authenticator'],
        security: [],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: '登录方式标识',
                      },
                      title: {
                        type: 'string',
                        description: '登录方式标题',
                      },
                      authType: {
                        type: 'string',
                        description: '登录方式类型',
                      },
                      options: {
                        type: 'object',
                        description: '登录方式公开配置',
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
    'authenticators:create': {
      post: {
        description: 'Create authenticator',
        tags: ['Authenticator'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: '登录方式标识',
                  },
                  authType: {
                    type: 'string',
                    description: '登录方式类型',
                  },
                  options: {
                    type: 'object',
                    description: '登录方式配置',
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
                  $ref: '#/components/schemas/authenticator',
                },
              },
            },
          },
        },
      },
    },
    'authenticators:list': {
      get: {
        description: 'List authenticators',
        tags: ['Authenticator'],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/authenticator',
                  },
                },
              },
            },
          },
        },
      },
    },
    'authenticators:get': {
      get: {
        description: 'Get authenticator',
        tags: ['Authenticator'],
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'ID',
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
                  $ref: '#/components/schemas/authenticator',
                },
              },
            },
          },
        },
      },
    },
    'authenticators:update': {
      post: {
        description: 'Update authenticator',
        tags: ['Authenticator'],
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'ID',
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
                $ref: '#/components/schemas/authenticator',
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
                  $ref: '#/components/schemas/authenticator',
                },
              },
            },
          },
        },
      },
    },
    'authenticators:destroy': {
      post: {
        description: 'Destroy authenticator',
        tags: ['Authenticator'],
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            description: 'ID',
            required: true,
            schema: {
              type: 'integer',
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
      user: {
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
      },
      roles: {
        type: 'array',
        description: '角色',
        items: {
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
      authenticator: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'ID',
          },
          authType: {
            type: 'string',
            description: '登录方式类型',
          },
          name: {
            type: 'string',
            description: '登录方式标识',
          },
          title: {
            type: 'string',
            description: '登录方式标题',
          },
          options: {
            type: 'object',
            description: '登录方式配置',
          },
          description: {
            type: 'string',
            description: '登录方式描述',
          },
          enabled: {
            type: 'boolean',
            description: '是否启用',
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
      },
    },
  },
};

/*
/api/auth:check
/api/auth:signIn
/api/auth:signUp
/api/auth:signOut
/api/auth:lostPassword
/api/auth:resetPassword
/api/auth:getUserByResetToken
/api/auth:changePassword
/api/authenticators:listTypes
/api/authenticators:publicList
/api/authenticators:create
/api/authenticators:list
/api/authenticators:get
/api/authenticators:update
/api/authenticators:destroy
*/
