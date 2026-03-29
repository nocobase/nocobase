/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

const genericFilterSchemaId = 'urn:nocobase:schema:plugin-block-list:generic-filter';

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

const collectionResourceInitSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    dataSourceKey: { type: 'string' },
    collectionName: { type: 'string' },
    associationName: { type: 'string' },
    sourceId: { type: ['string', 'number'] as any },
    filterByTk: { type: ['string', 'number'] as any },
  },
  required: ['dataSourceKey', 'collectionName'],
  additionalProperties: true,
};

const collectionResourceSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    resourceSettings: {
      type: 'object',
      properties: {
        init: collectionResourceInitSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

const createCollectionResourceStepParams = (
  init: Partial<{
    dataSourceKey: string;
    collectionName: string;
    associationName: string;
    sourceId: string | number;
    filterByTk: string | number;
  }> = {},
  extraStepParams: Record<string, any> = {},
) => ({
  resourceSettings: {
    init: {
      dataSourceKey: 'main',
      collectionName: 'users',
      ...init,
    },
  },
  ...extraStepParams,
});

const createAssociatedCollectionPattern = (use: string, extraStepParams: Record<string, any> = {}) => ({
  title: 'Associated records in popup/new scene',
  description: 'Use associationName + sourceId when the block should load records through a parent relation.',
  snippet: {
    use,
    stepParams: createCollectionResourceStepParams(
      {
        collectionName: 'roles',
        associationName: 'users.roles',
        sourceId: '{{ctx.view.inputArgs.sourceId}}',
      },
      extraStepParams,
    ),
  },
});

const listItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
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

const listBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ListBlockModel',
  title: 'List block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      ...(((collectionResourceSettingsStepParamsSchema as any).properties || {}) as Record<string, any>),
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
    stepParams: createCollectionResourceStepParams(
      {},
      {
        listSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      },
    ),
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
      stepParams: createCollectionResourceStepParams(
        {},
        {
          listSettings: {
            pageSize: {
              pageSize: 20,
            },
          },
        },
      ),
      subModels: {
        item: {
          uid: 'list-item-users',
          use: 'ListItemModel',
        },
        actions: [],
      },
    },
    commonPatterns: [
      {
        title: 'Basic list block',
        snippet: {
          use: 'ListBlockModel',
          stepParams: createCollectionResourceStepParams(
            {},
            {
              listSettings: {
                pageSize: {
                  pageSize: 20,
                },
              },
            },
          ),
        },
      },
      createAssociatedCollectionPattern('ListBlockModel', {
        listSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      }),
    ],
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

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['ListBlockModel'],
  },
  models: [listItemModelInternalSchemaContribution, listBlockModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
