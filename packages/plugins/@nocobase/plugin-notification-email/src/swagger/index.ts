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
    title: 'NocoBase API - Notification email plugin',
  },
  paths: {},
  components: {
    schemas: {
      EmailNotificationChannelOptions: {
        type: 'object',
        required: ['transport', 'host', 'port', 'secure', 'account', 'password', 'from'],
        properties: {
          transport: {
            type: 'string',
            enum: ['smtp'],
            default: 'smtp',
          },
          host: {
            type: 'string',
            example: 'smtp.example.com',
          },
          port: {
            type: 'integer',
            minimum: 1,
            maximum: 65535,
            default: 465,
          },
          secure: {
            type: 'boolean',
            default: true,
            description: 'Usually true for port 465; verify with the SMTP provider for other ports.',
          },
          account: {
            type: 'string',
            example: 'example@domain.com',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'SMTP password or provider app password. Do not expose this value in logs.',
          },
          from: {
            type: 'string',
            example: 'noreply <example@domain.com>',
          },
        },
        additionalProperties: true,
      },
      EmailNotificationMessage: {
        type: 'object',
        required: ['to', 'subject', 'contentType'],
        properties: {
          to: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
          },
          cc: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
          },
          bcc: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
          },
          subject: {
            type: 'string',
          },
          contentType: {
            type: 'string',
            enum: ['html', 'text'],
            default: 'html',
          },
          html: {
            type: 'string',
            description: 'Required when `contentType` is `html`.',
          },
          text: {
            type: 'string',
            description: 'Required when `contentType` is `text`.',
          },
        },
        additionalProperties: true,
      },
      EmailNotificationChannel: {
        type: 'object',
        required: ['name', 'title', 'notificationType', 'options'],
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
            enum: ['email'],
          },
          options: {
            $ref: '#/components/schemas/EmailNotificationChannelOptions',
          },
        },
        additionalProperties: true,
      },
    },
  },
};
