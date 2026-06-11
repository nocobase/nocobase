/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const jsonObjectSchema = {
  type: 'object',
  additionalProperties: true,
};

const listParameters = [
  {
    name: 'filter',
    in: 'query',
    required: false,
    description: 'Filter object encoded as JSON.',
    schema: jsonObjectSchema,
  },
  {
    name: 'page',
    in: 'query',
    required: false,
    schema: {
      type: 'integer',
    },
  },
  {
    name: 'pageSize',
    in: 'query',
    required: false,
    schema: {
      type: 'integer',
    },
  },
];

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Notification in-app message plugin',
  },
  paths: {
    '/myInAppMessages:list': {
      get: {
        tags: ['myInAppMessages'],
        summary: 'List current user in-app messages',
        description:
          'List messages for the current user. The server always scopes results to `ctx.state.currentUser.id`.',
        parameters: listParameters,
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MyInAppMessagesResponse',
                },
              },
            },
          },
        },
      },
    },
    '/myInAppMessages:count': {
      get: {
        tags: ['myInAppMessages'],
        summary: 'Count current user unread in-app messages',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/myInAppChannels:list': {
      get: {
        tags: ['myInAppChannels'],
        summary: 'List current user in-app message channels',
        description:
          'List channels that have messages for the current user, including unread counts and latest message metadata.',
        parameters: [
          ...listParameters,
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              default: 30,
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MyInAppChannelsResponse',
                },
              },
            },
          },
        },
      },
    },
    '/notificationInAppMessages:list': {
      get: {
        tags: ['notificationInAppMessages'],
        summary: 'List in-app message records',
        parameters: listParameters,
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/InAppMessage',
                      },
                    },
                    meta: jsonObjectSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/notificationInAppMessages:get': {
      get: {
        tags: ['notificationInAppMessages'],
        summary: 'Get one in-app message record',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: true,
            description: 'In-app message UUID.',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/InAppMessage',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/notificationInAppMessages:updateMyOwn': {
      post: {
        tags: ['notificationInAppMessages'],
        summary: 'Update current user own in-app message',
        description:
          'Update only the current user own message. The action merges `filter.userId` from the current user and whitelists `status`.',
        parameters: [
          {
            name: 'filterByTk',
            in: 'query',
            required: false,
            description: 'In-app message UUID.',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'filter',
            in: 'query',
            required: false,
            schema: jsonObjectSchema,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['read', 'unread'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/InAppMessage',
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
      InAppMessage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          userId: {
            type: 'integer',
          },
          channelName: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          content: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['read', 'unread'],
          },
          receiveTimestamp: {
            type: 'integer',
            format: 'int64',
          },
          options: jsonObjectSchema,
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        additionalProperties: true,
      },
      MyInAppMessagesResponse: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/InAppMessage',
            },
          },
        },
      },
      MyInAppChannel: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          userId: {
            type: 'integer',
          },
          unreadMsgCnt: {
            type: 'integer',
          },
          totalMsgCnt: {
            type: 'integer',
          },
          latestMsgReceiveTimestamp: {
            type: 'integer',
            format: 'int64',
          },
          latestMsgTitle: {
            type: 'string',
          },
        },
        additionalProperties: true,
      },
      MyInAppChannelsResponse: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/MyInAppChannel',
            },
          },
          count: {
            type: 'integer',
          },
        },
      },
      InAppNotificationMessageInput: {
        type: 'object',
        required: ['receivers', 'title', 'content'],
        properties: {
          receivers: {
            type: 'array',
            description: 'User ids or workflow variables resolving to user ids.',
            items: {
              oneOf: [{ type: 'integer' }, { type: 'string' }],
            },
          },
          title: {
            type: 'string',
          },
          content: {
            type: 'string',
          },
          options: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
              },
              mobileUrl: {
                type: 'string',
              },
              duration: {
                type: 'number',
              },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
  },
};
