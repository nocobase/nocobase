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

const gridCardItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'GridCardItemModel',
  title: 'Grid card item',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'DetailsGridModel',
      description: 'Grid card details grid.',
    },
  },
  skeleton: {
    uid: 'todo-grid-card-item-uid',
    use: 'GridCardItemModel',
    subModels: {
      grid: {
        uid: 'todo-grid-card-item-grid-uid',
        use: 'DetailsGridModel',
      },
    },
  },
};

const gridCardBlockModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'GridCardBlockModel',
  title: 'Grid card block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      resourceSettings2: {
        type: 'object',
        additionalProperties: true,
      },
      GridCardSettings: {
        type: 'object',
        properties: {
          columnCount: {
            type: 'object',
            properties: {
              xs: { type: 'number' },
              sm: { type: 'number' },
              md: { type: 'number' },
              lg: { type: 'number' },
              xl: { type: 'number' },
              xxl: { type: 'number' },
            },
            additionalProperties: false,
          },
          rowCount: {
            type: 'object',
            properties: {
              rowCount: { type: 'number' },
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
    },
    additionalProperties: true,
  },
  subModelSlots: {
    item: {
      type: 'object',
      use: 'GridCardItemModel',
      description: 'Grid card item layout.',
    },
    actions: {
      type: 'array',
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Grid card actions depend on runtime collection-action registries.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'GridCardBlockModel',
    stepParams: {
      GridCardSettings: {
        columnCount: {
          xs: 1,
          md: 2,
          lg: 3,
          xxl: 4,
        },
        rowCount: {
          rowCount: 3,
        },
      },
    },
    subModels: {
      item: {
        uid: 'todo-grid-card-item-uid',
        use: 'GridCardItemModel',
      },
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'grid-card-users',
      use: 'GridCardBlockModel',
      stepParams: {
        GridCardSettings: {
          columnCount: {
            xs: 1,
            md: 2,
            lg: 3,
            xxl: 4,
          },
          rowCount: {
            rowCount: 3,
          },
        },
      },
      subModels: {
        item: {
          uid: 'grid-card-item-users',
          use: 'GridCardItemModel',
        },
        actions: [],
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'GridCardBlockModel.subModels.actions',
        message: 'Grid card actions depend on runtime collection-action registries.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
          },
          contextRequirements: ['collection action registry'],
          unresolvedReason: 'runtime-grid-card-actions',
        },
      },
    ],
  },
};

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['GridCardBlockModel'],
  },
  models: [gridCardItemModelInternalSchemaManifest, gridCardBlockModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};
