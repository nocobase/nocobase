/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

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
    icon: { type: 'string' },
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

const actionPanelBlockModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'ActionPanelBlockModel',
  title: 'Action panel block',
  source: 'plugin',
  strict: true,
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

const actionPanelScanActionModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'ActionPanelScanActionModel',
  title: 'Action panel scan action',
  source: 'plugin',
  strict: true,
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

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['ActionPanelBlockModel'],
    publicTreeRoots: ['ActionPanelBlockModel'],
    expectedDescendantModels: ['ActionPanelScanActionModel'],
  },
  models: [actionPanelScanActionModelSchemaManifest, actionPanelBlockModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};
