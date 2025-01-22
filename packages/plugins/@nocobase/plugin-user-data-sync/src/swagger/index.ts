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
    title: 'NocoBase API - User data synchronization plugin',
  },
  paths: {
    '/userData:push': {
      post: {
        description: 'Push user data',
        tags: ['Push'],
        security: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/userData',
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
  },
  components: {
    schemas: {
      userData: {
        type: 'object',
        description: '用户数据',
        properties: {
          dataType: {
            type: 'string',
            description: '数据类型, 目前可选值为: user, department',
          },
          uniqueKey: {
            type: 'string',
            description: '唯一键',
          },
          records: {
            type: 'array',
            description:
              '数据, 若 dataType 为 user, 则为用户数据字段见schemas/user, 若 dataType 为 department, 则为部门数据字段见schemas/department',
            items: {
              type: 'object',
            },
          },
          sourceName: {
            type: 'string',
            description: '数据源名称',
          },
        },
      },
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
          departments: {
            type: 'array',
            description: '所属部门, 部门ID 数组',
            items: {
              type: 'string',
            },
          },
        },
      },
      department: {
        type: 'object',
        description: '部门',
        properties: {
          id: {
            type: 'string',
            description: 'ID',
          },
          name: {
            type: 'string',
            description: '名称',
          },
          parentId: {
            type: 'string',
            description: '父级部门ID',
          },
        },
      },
    },
  },
};

/*
/api/userData:push
*/
