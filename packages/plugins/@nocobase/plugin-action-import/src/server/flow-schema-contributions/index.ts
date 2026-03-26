/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

const importColumnSchema = {
  type: 'object',
  properties: {
    dataIndex: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    title: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['dataIndex'],
  additionalProperties: false,
} as const;

const importActionModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ImportActionModel',
  title: 'Import action',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      importActionSetting: {
        type: 'object',
        properties: {
          importSetting: {
            type: 'object',
            properties: {
              explain: { type: 'string' },
              importColumns: {
                type: 'array',
                items: importColumnSchema as any,
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
    uid: 'todo-import-action-uid',
    use: 'ImportActionModel',
    stepParams: {
      importActionSetting: {
        importSetting: {
          explain: '',
          importColumns: [],
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'import-users',
      use: 'ImportActionModel',
      stepParams: {
        importActionSetting: {
          importSetting: {
            explain: '',
            importColumns: [],
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'ImportActionModel.stepParams.importActionSetting.importSetting.importColumns',
        message: 'Importable field options depend on the runtime collection field tree.',
        'x-flow': {
          contextRequirements: ['collection fields'],
          unresolvedReason: 'runtime-importable-fields',
          recommendedFallback: [],
        },
      },
    ],
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  models: [importActionModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
