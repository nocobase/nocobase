/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  '/app:getLang': {
    get: {
      tags: ['app'],
      summary: 'Get the current application language',
      description: 'Return the current locale used by the server.',
      parameters: [],
      responses: {
        200: {
          description: 'OK',
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
  '/app:getInfo': {
    get: {
      tags: ['app'],
      summary: 'Get application metadata',
      description: 'Return basic application information, including version and environment-related metadata.',
      parameters: [],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
  },
  '/app:getPlugins': {
    get: {
      tags: ['app'],
      summary: 'List loaded plugins',
      description: 'Return plugin metadata for the current application runtime.',
      parameters: [],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
        },
      },
    },
  },
  '/app:restart': {
    post: {
      tags: ['app'],
      summary: 'Restart the application',
      description: 'Trigger an application restart asynchronously.',
      parameters: [],
      responses: {
        200: {
          description: 'OK',
        },
      },
    },
  },
  '/app:clearCache': {
    post: {
      tags: ['app'],
      summary: 'Clear application cache',
      description: 'Clear server-side caches used by the current application instance.',
      parameters: [],
      responses: {
        200: {
          description: 'OK',
        },
      },
    },
  },
} as const;
