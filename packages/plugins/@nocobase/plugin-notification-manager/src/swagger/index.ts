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
    name: 'sort',
    in: 'query',
    required: false,
    description: 'Sort fields, for example `-createdAt`.',
    schema: {
      oneOf: [
        { type: 'string' },
        {
          type: 'array',
          items: { type: 'string' },
        },
      ],
    },
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

const filterByTkParameter = {
  name: 'filterByTk',
  in: 'query',
  required: true,
  description: 'Primary key value. For notification channels this is the channel `name`.',
  schema: {
    type: 'string',
  },
};

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Notification manager plugin',
  },
  paths: {
    '/notificationChannels:list': {
      get: {
        tags: ['notificationChannels'],
        summary: 'List notification channels',
        description: 'List configured notification channels. Channel `name` is the primary key used by send APIs.',
        parameters: listParameters,
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NotificationChannelListResponse',
                },
              },
            },
          },
        },
      },
    },
    '/notificationChannels:get': {
      get: {
        tags: ['notificationChannels'],
        summary: 'Get one notification channel',
        parameters: [filterByTkParameter],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NotificationChannelResponse',
                },
              },
            },
          },
        },
      },
    },
    '/notificationChannels:create': {
      post: {
        tags: ['notificationChannels'],
        summary: 'Create a notification channel',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationChannelInput',
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
                  $ref: '#/components/schemas/NotificationChannelResponse',
                },
              },
            },
          },
        },
      },
    },
    '/notificationChannels:update': {
      post: {
        tags: ['notificationChannels'],
        summary: 'Update a notification channel',
        parameters: [filterByTkParameter],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationChannelInput',
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
                  $ref: '#/components/schemas/NotificationChannelResponse',
                },
              },
            },
          },
        },
      },
    },
    '/notificationChannels:destroy': {
      post: {
        tags: ['notificationChannels'],
        summary: 'Delete a notification channel',
        parameters: [filterByTkParameter],
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/notificationSendLogs:list': {
      get: {
        tags: ['notificationSendLogs'],
        summary: 'List notification send logs',
        description: 'List delivery records written by the notification manager after send attempts.',
        parameters: listParameters,
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NotificationSendLogListResponse',
                },
              },
            },
          },
        },
      },
    },
    '/notificationSendLogs:get': {
      get: {
        tags: ['notificationSendLogs'],
        summary: 'Get one notification send log',
        parameters: [
          {
            ...filterByTkParameter,
            description: 'Send log UUID.',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NotificationSendLogResponse',
                },
              },
            },
          },
        },
      },
    },
    '/messages:send': {
      post: {
        tags: ['notifications'],
        summary: 'Queue a notification send',
        description:
          'Send a notification through a configured channel. The manager may enqueue delivery and writes a `notificationSendLogs` record when the send attempt is processed.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationSendRequest',
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
                  $ref: '#/components/schemas/NotificationSendResponse',
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
      NotificationChannel: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Channel primary key, usually generated with the `s_` prefix.',
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          notificationType: {
            type: 'string',
            description: 'Registered notification channel type, for example `in-app-message` or `email`.',
          },
          options: jsonObjectSchema,
          meta: jsonObjectSchema,
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        additionalProperties: true,
      },
      NotificationChannelInput: {
        type: 'object',
        required: ['name', 'title', 'notificationType'],
        properties: {
          name: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          notificationType: {
            type: 'string',
          },
          options: jsonObjectSchema,
          meta: jsonObjectSchema,
        },
        additionalProperties: true,
      },
      NotificationChannelResponse: {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/NotificationChannel',
          },
        },
      },
      NotificationChannelListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/NotificationChannel',
            },
          },
          meta: jsonObjectSchema,
        },
      },
      NotificationSendLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          channelName: {
            type: 'string',
          },
          channelTitle: {
            type: 'string',
          },
          triggerFrom: {
            type: 'string',
          },
          notificationType: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['success', 'failure'],
          },
          message: jsonObjectSchema,
          reason: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        additionalProperties: true,
      },
      NotificationSendLogResponse: {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/NotificationSendLog',
          },
        },
      },
      NotificationSendLogListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/NotificationSendLog',
            },
          },
          meta: jsonObjectSchema,
        },
      },
      NotificationReceivers: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: {
                type: 'string',
                enum: ['userId'],
              },
              value: {
                type: 'array',
                items: {
                  type: 'integer',
                },
              },
            },
          },
          {
            type: 'object',
            required: ['type', 'channelType', 'value'],
            properties: {
              type: {
                type: 'string',
                enum: ['channel-self-defined'],
              },
              channelType: {
                type: 'string',
              },
              value: {},
            },
          },
        ],
      },
      NotificationSendRequest: {
        type: 'object',
        required: ['channelName', 'message', 'triggerFrom'],
        properties: {
          channelName: {
            type: 'string',
            description: 'Existing `notificationChannels.name`.',
          },
          message: jsonObjectSchema,
          receivers: {
            $ref: '#/components/schemas/NotificationReceivers',
          },
          triggerFrom: {
            type: 'string',
            example: 'workflow',
          },
          data: jsonObjectSchema,
        },
      },
      NotificationSendResult: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['success', 'failure'],
          },
          reason: {
            type: 'string',
          },
          triggerFrom: {
            type: 'string',
          },
          channelName: {
            type: 'string',
          },
          receivers: {
            $ref: '#/components/schemas/NotificationReceivers',
          },
          queued: {
            type: 'boolean',
          },
        },
        additionalProperties: true,
      },
      NotificationSendResponse: {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/NotificationSendResult',
          },
        },
      },
    },
  },
};
