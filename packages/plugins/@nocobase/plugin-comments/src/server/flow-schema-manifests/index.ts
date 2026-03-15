/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

const genericFilterSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
};

const commentItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'CommentItemModel',
  title: 'Comment item',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
};

const commentsBlockModelSchemaManifest: FlowModelSchemaManifest = {
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

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['CommentsBlockModel'],
  },
  models: [commentItemModelInternalSchemaManifest, commentsBlockModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};
