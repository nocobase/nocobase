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

const sortingRuleParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    sort: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          direction: { type: 'string', enum: ['asc', 'desc'] },
        },
        required: ['field', 'direction'],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const layoutParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    layout: {
      type: 'string',
      enum: ['vertical', 'horizontal'],
    },
    labelAlign: {
      type: 'string',
      enum: ['left', 'right'],
    },
    labelWidth: { type: ['number', 'string', 'null'] as any },
    labelWrap: { type: 'boolean' },
    colon: { type: 'boolean' },
  },
  required: ['layout'],
  additionalProperties: false,
};

const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

const listItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'ListItemModel',
  title: 'List item',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'DetailsGridModel',
      description: 'Per-record details grid.',
    },
  },
  skeleton: {
    uid: 'todo-list-item-uid',
    use: 'ListItemModel',
    subModels: {
      grid: {
        uid: 'todo-list-item-grid-uid',
        use: 'DetailsGridModel',
      },
    },
  },
};

const listBlockModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'ListBlockModel',
  title: 'List block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      resourceSettings2: {
        type: 'object',
        additionalProperties: true,
      },
      listSettings: {
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
          defaultSorting: sortingRuleParamsSchema,
          layout: layoutParamsSchema,
        },
        additionalProperties: true,
      },
      paginationChange: {
        type: 'object',
        properties: {
          linkageRulesRefresh: {
            type: 'object',
            properties: {
              actionName: { type: 'string' },
              flowKey: { type: 'string' },
              stepKey: { type: 'string' },
            },
            required: ['actionName', 'flowKey'],
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    item: {
      type: 'object',
      use: 'ListItemModel',
      description: 'List item layout.',
    },
    actions: {
      type: 'array',
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'List actions depend on runtime collection-action registries.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'ListBlockModel',
    stepParams: {
      listSettings: {
        pageSize: {
          pageSize: 20,
        },
      },
    },
    subModels: {
      item: {
        uid: 'todo-list-item-uid',
        use: 'ListItemModel',
      },
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'list-users',
      use: 'ListBlockModel',
      stepParams: {
        listSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      },
      subModels: {
        item: {
          uid: 'list-item-users',
          use: 'ListItemModel',
        },
        actions: [],
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'ListBlockModel.subModels.actions',
        message: 'List actions depend on runtime collection-action registries.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
          },
          contextRequirements: ['collection action registry'],
          unresolvedReason: 'runtime-list-actions',
        },
      },
    ],
  },
};

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['ListBlockModel'],
  },
  models: [listItemModelInternalSchemaManifest, listBlockModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};
