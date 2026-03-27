/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

const actionButtonGeneralStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    tooltip: { type: 'string' },
    type: {
      type: 'string',
      enum: ['default', 'primary', 'dashed', 'link', 'text'],
    },
    danger: { type: 'boolean' },
    icon: { type: ['string', 'null'] },
    color: { type: 'string' },
  },
  additionalProperties: true,
};

const actionButtonSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    buttonSettings: {
      type: 'object',
      properties: {
        general: actionButtonGeneralStepParamsSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

const actionPanelBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ActionPanelBlockModel',
  title: 'Action panel block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      actionPanelBlockSetting: {
        type: 'object',
        properties: {
          layout: {
            type: 'object',
            properties: {
              layout: {
                type: 'string',
                enum: ['grid', 'list'],
              },
            },
            required: ['layout'],
            additionalProperties: false,
          },
          ellipsis: {
            type: 'object',
            properties: {
              ellipsis: {
                type: 'boolean',
              },
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
    actions: {
      type: 'array',
      uses: ['PopupActionModel', 'LinkActionModel', 'JSActionModel', 'ActionPanelScanActionModel'],
      description: 'Action panel items are concrete action models rendered inside the panel.',
    },
  },
  skeleton: {
    uid: 'todo-action-panel-block-uid',
    use: 'ActionPanelBlockModel',
    stepParams: {
      actionPanelBlockSetting: {
        layout: {
          layout: 'grid',
        },
        ellipsis: {
          ellipsis: true,
        },
      },
    },
    subModels: {
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'action-panel-tools',
      use: 'ActionPanelBlockModel',
      stepParams: {
        actionPanelBlockSetting: {
          layout: {
            layout: 'grid',
          },
        },
      },
      subModels: {
        actions: [],
      },
    },
  },
};

const actionPanelScanActionModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ActionPanelScanActionModel',
  title: 'Action panel scan action',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['ActionPanelBlockModel'],
  stepParamsSchema: {
    ...actionButtonSettingsStepParamsSchema,
  },
  skeleton: {
    uid: 'todo-action-panel-scan-action-uid',
    use: 'ActionPanelScanActionModel',
    stepParams: {
      buttonSettings: {
        general: {
          title: 'Scan QR code',
          icon: 'ScanOutlined',
        },
      },
    },
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['ActionPanelBlockModel'],
  },
  models: [actionPanelScanActionModelSchemaContribution, actionPanelBlockModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
