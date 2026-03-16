/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { tableColumnStepParamsSchema } from '../shared';

export const tableCustomColumnModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'TableCustomColumnModel',
  title: 'Table custom column',
  source: 'official',
  strict: true,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      tableColumnSettings: (tableColumnStepParamsSchema.properties as any)?.tableColumnSettings,
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-custom-column-uid',
    use: 'TableCustomColumnModel',
    stepParams: {
      tableColumnSettings: {
        title: {
          title: 'Custom column',
        },
        width: {
          width: 150,
        },
      },
    },
  },
};
