/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowDynamicHint, FlowJsonSchema, FlowSubModelSlotSchema } from '@nocobase/flow-engine';

export const genericFilterSchema: FlowJsonSchema = {
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

export const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

export const emptyObjectSchema: FlowJsonSchema = {
  type: 'object',
  additionalProperties: false,
};

export const linkageRuleValueSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    value: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  additionalProperties: false,
};

export const layoutParamsSchema: FlowJsonSchema = {
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
    labelWidth: {
      type: ['number', 'string', 'null'] as any,
    },
    labelWrap: {
      type: 'boolean',
    },
    colon: {
      type: 'boolean',
    },
  },
  required: ['layout'],
  additionalProperties: false,
};

export const dataScopeParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    filter: genericFilterSchema,
  },
  additionalProperties: false,
};

export const sortingRuleParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    sort: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          direction: {
            type: 'string',
            enum: ['asc', 'desc'],
          },
        },
        required: ['field', 'direction'],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

export const aclCheckRefreshParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    strategy: {
      type: 'string',
      enum: ['default', 'formItem'],
    },
  },
  additionalProperties: false,
};

export const linkageRulesRefreshParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    actionName: { type: 'string' },
    flowKey: { type: 'string' },
    stepKey: { type: 'string' },
  },
  required: ['actionName', 'flowKey'],
  additionalProperties: false,
};

export const openViewParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    uid: { type: 'string' },
    mode: {
      type: 'string',
      enum: ['drawer', 'dialog', 'embed'],
    },
    size: {
      type: 'string',
      enum: ['small', 'medium', 'large'],
    },
    pageModelClass: { type: 'string' },
    filterByTk: { type: ['string', 'number', 'object'] as any },
    sourceId: { type: ['string', 'number'] as any },
    dataSourceKey: { type: 'string' },
    collectionName: { type: 'string' },
    associationName: { type: 'string' },
    preventClose: { type: 'boolean' },
    navigation: { type: 'boolean' },
    tabUid: { type: 'string' },
  },
  additionalProperties: true,
};

export const formBlockActionUses = ['FormActionGroupModel', 'ActionModel'];

export const formBlockBaseStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    formModelSettings: {
      type: 'object',
      properties: {
        layout: layoutParamsSchema,
        assignRules: linkageRuleValueSchema,
      },
      additionalProperties: true,
    },
    eventSettings: {
      type: 'object',
      properties: {
        linkageRules: linkageRuleValueSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export function createFormGridDynamicHints(): FlowDynamicHint[] {
  return [
    {
      kind: 'dynamic-children',
      path: 'FormGridModel.subModels.items',
      message: 'Form grid items depend on the form field tree and runtime field model factories.',
      'x-flow': {
        slotRules: {
          slotKey: 'items',
          type: 'array',
        },
        contextRequirements: ['form field tree', 'field model factories'],
        unresolvedReason: 'runtime-form-grid-items',
      },
    },
  ];
}

export function createFormBlockSubModelSlots(): Record<string, FlowSubModelSlotSchema> {
  return {
    grid: {
      type: 'object',
      use: 'FormGridModel',
      description: 'Primary form grid container.',
      childSchemaPatch: {
        subModelSlots: {
          items: {
            type: 'array',
            dynamic: true,
            schema: genericModelNodeSchema,
            description: 'Form grid items are resolved from runtime field model registries.',
          },
        },
        dynamicHints: createFormGridDynamicHints(),
      },
    },
    actions: {
      type: 'array',
      uses: formBlockActionUses,
      description: 'Form action groups or action models.',
    },
  };
}

export function createFormBlockSkeleton(use: string) {
  return {
    uid: 'todo-uid',
    use,
    stepParams: {
      formModelSettings: {
        layout: {
          layout: 'vertical',
          colon: true,
        },
        assignRules: {
          value: [],
        },
      },
      eventSettings: {
        linkageRules: {
          value: [],
        },
      },
    },
    subModels: {
      grid: {
        uid: 'todo-grid-uid',
        use: 'FormGridModel',
      },
      actions: [],
    },
  };
}

export function createFormBlockMinimalExample(use: string) {
  return {
    uid: `${use}-users`.toLowerCase(),
    use,
    stepParams: {
      formModelSettings: {
        layout: {
          layout: 'vertical',
          colon: true,
        },
        assignRules: {
          value: [],
        },
      },
      eventSettings: {
        linkageRules: {
          value: [],
        },
      },
    },
    subModels: {
      grid: {
        uid: `${use}-grid-users`.toLowerCase(),
        use: 'FormGridModel',
      },
      actions: [],
    },
  };
}

export function createFormBlockCommonPatterns(use: string) {
  return [
    {
      title: 'Empty editable form block shell',
      snippet: {
        use,
        stepParams: {
          formModelSettings: {
            layout: {
              layout: 'vertical',
              colon: true,
            },
          },
        },
        subModels: {
          grid: {
            uid: 'form-grid-uid',
            use: 'FormGridModel',
          },
        },
      },
    },
  ];
}

export const formBlockAntiPatterns = [
  {
    title: 'Do not omit grid when generating a complete form tree',
    description: 'A form block can be persisted without subModels, but useful form payloads usually need a grid child.',
  },
];

export function createFormBlockDynamicHints(use: string): FlowDynamicHint[] {
  return [
    {
      kind: 'dynamic-children',
      path: `${use}.subModels`,
      message: 'Form block child models are assembled from runtime model classes and field metadata.',
      'x-flow': {
        slotRules: {
          slotKey: 'actions',
          type: 'array',
          allowedUses: formBlockActionUses,
        },
        contextRequirements: ['form field tree', 'collection metadata'],
        unresolvedReason: 'runtime-form-children',
      },
    },
  ];
}
