/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

const genericFilterSchemaId = 'urn:nocobase:schema:plugin-comments:generic-filter';

const emptyObjectSchema: FlowJsonSchema = {
  type: 'object',
  additionalProperties: false,
};

const genericFilterSchema: FlowJsonSchema = {
  $id: genericFilterSchemaId,
  definitions: {
    filterCondition: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
        },
        operator: {
          type: 'string',
        },
        value: {},
        noValue: {
          type: 'boolean',
        },
      },
      required: ['path'],
      additionalProperties: true,
      allOf: [
        {
          not: {
            required: ['logic'],
          },
        },
        {
          not: {
            required: ['items'],
          },
        },
      ],
    },
    filterGroup: {
      type: 'object',
      properties: {
        logic: {
          type: 'string',
          enum: ['$and', '$or'],
        },
        items: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: `${genericFilterSchemaId}#/definitions/filterCondition` },
              { $ref: `${genericFilterSchemaId}#/definitions/filterGroup` },
            ],
          },
        },
      },
      required: ['logic', 'items'],
      additionalProperties: true,
      allOf: [
        {
          not: {
            required: ['path'],
          },
        },
        {
          not: {
            required: ['operator'],
          },
        },
        {
          not: {
            required: ['value'],
          },
        },
        {
          not: {
            required: ['noValue'],
          },
        },
      ],
    },
  },
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: `${genericFilterSchemaId}#/definitions/filterCondition` },
          { $ref: `${genericFilterSchemaId}#/definitions/filterGroup` },
        ],
      },
    },
  },
  required: ['logic', 'items'],
  additionalProperties: true,
  allOf: [
    {
      not: {
        required: ['path'],
      },
    },
    {
      not: {
        required: ['operator'],
      },
    },
    {
      not: {
        required: ['value'],
      },
    },
    {
      not: {
        required: ['noValue'],
      },
    },
  ],
};

const commentItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'CommentItemModel',
  title: 'Comment item',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  stepParamsSchema: emptyObjectSchema,
  skeleton: {
    uid: 'comment-item-uid',
    use: 'CommentItemModel',
  },
  docs: {
    minimalExample: {
      uid: 'comment-item-1',
      use: 'CommentItemModel',
    },
  },
};

const commentsBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'CommentsBlockModel',
  title: 'Comments block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      commentsSettings: {
        type: 'object',
        properties: {
          pageSize: {
            type: 'object',
            properties: {
              pageSize: {
                type: 'number',
                enum: [5, 10, 20, 50, 100, 200],
              },
            },
            additionalProperties: false,
          },
          dataScope: {
            type: 'object',
            properties: {
              filter: genericFilterSchema,
            },
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    items: {
      type: 'array',
      uses: ['CommentItemModel'],
      description: 'Comment item renderers.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'CommentsBlockModel',
    stepParams: {
      commentsSettings: {
        pageSize: {
          pageSize: 20,
        },
      },
    },
    subModels: {
      items: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'comments-users',
      use: 'CommentsBlockModel',
      stepParams: {
        commentsSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      },
      subModels: {
        items: [],
      },
    },
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['CommentsBlockModel'],
  },
  models: [commentItemModelInternalSchemaContribution, commentsBlockModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
