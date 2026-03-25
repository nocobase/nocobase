/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import {
  createRuntimeFieldDynamicHint,
  createRuntimeFieldModelSlotSchema,
  tableColumnStepParamsSchema,
} from '../shared';

export const tableColumnModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'TableColumnModel',
  title: 'Table column',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel'],
  stepParamsSchema: tableColumnStepParamsSchema,
  subModelSlots: {
    field: createRuntimeFieldModelSlotSchema('table-column-field'),
  },
  skeleton: {
    uid: 'todo-table-column-uid',
    use: 'TableColumnModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'nickname',
        },
      },
      tableColumnSettings: {
        width: {
          width: 150,
        },
      },
    },
    subModels: {},
  },
  docs: {
    dynamicHints: [
      createRuntimeFieldDynamicHint(
        'TableColumnModel',
        'TableColumnModel.subModels.field',
        ['table column bindings', 'collection field metadata'],
        'runtime-table-column-field',
      ),
    ],
  },
};
