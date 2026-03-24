/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { tableColumnStepParamsSchema } from '../shared';

export const jsColumnModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'JSColumnModel',
  title: 'JS column',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      tableColumnSettings: (tableColumnStepParamsSchema.properties as any)?.tableColumnSettings,
      jsSettings: {
        type: 'object',
        properties: {
          runJs: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              version: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-js-column-uid',
    use: 'JSColumnModel',
    stepParams: {
      tableColumnSettings: {
        title: {
          title: 'JS column',
        },
      },
      jsSettings: {
        runJs: {
          version: 'v2',
          code: '',
        },
      },
    },
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'JSColumnModel.stepParams.jsSettings.runJs',
        message: 'JS column code editor embeds runtime globals such as record, collection and navigator.',
        'x-flow': {
          contextRequirements: ['record context', 'collection metadata', 'runjs runtime'],
          unresolvedReason: 'runtime-js-column-context',
          recommendedFallback: {
            version: 'v2',
            code: '',
          },
        },
      },
    ],
  },
};
