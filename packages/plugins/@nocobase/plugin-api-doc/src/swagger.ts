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
    title: 'NocoBase API - API doc plugin',
  },
  paths: {
    '/swagger:getUrls': {
      get: {
        description: 'Get all api-doc destination',
        tags: ['swagger'],
        responses: {
          200: {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/responses/SwaggerUrls',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    responses: {
      SwaggerUrls: {
        type: 'array',
        items: {
          properties: {
            name: {
              type: 'string',
            },
            url: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};
