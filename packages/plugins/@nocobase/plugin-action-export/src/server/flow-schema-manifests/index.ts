/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

const confirmStepParamsSchema = {
  type: 'object',
  properties: {
    enable: { type: 'boolean' },
    title: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const exportColumnSchema = {
  type: 'object',
  properties: {
    dataIndex: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    title: { type: 'string' },
  },
  required: ['dataIndex'],
  additionalProperties: false,
} as const;

const exportActionModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'ExportActionModel',
  title: 'Export action',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      exportSettings: {
        type: 'object',
        properties: {
          confirm: confirmStepParamsSchema,
        },
        additionalProperties: true,
      },
      exportActionSetting: {
        type: 'object',
        properties: {
          exportableFields: {
            type: 'object',
            properties: {
              exportSettings: {
                type: 'array',
                items: exportColumnSchema as any,
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
  skeleton: {
    uid: 'todo-export-action-uid',
    use: 'ExportActionModel',
    stepParams: {
      exportSettings: {
        confirm: {
          enable: true,
          title: 'Export',
          content: 'Export warning',
        },
      },
      exportActionSetting: {
        exportableFields: {
          exportSettings: [],
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'export-users',
      use: 'ExportActionModel',
      stepParams: {
        exportActionSetting: {
          exportableFields: {
            exportSettings: [],
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'ExportActionModel.stepParams.exportActionSetting.exportableFields.exportSettings',
        message: 'Exportable field options depend on the runtime collection field tree.',
        'x-flow': {
          contextRequirements: ['collection fields'],
          unresolvedReason: 'runtime-exportable-fields',
          recommendedFallback: [],
        },
      },
    ],
  },
};

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['ExportActionModel'],
  },
  models: [exportActionModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};
