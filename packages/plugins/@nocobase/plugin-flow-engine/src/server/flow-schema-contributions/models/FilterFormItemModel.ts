/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import {
  createRuntimeFieldDynamicHint,
  createRuntimeFieldModelSlotSchema,
  filterFormItemStepParamsSchema,
} from '../shared';

export const filterFormItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FilterFormItemModel',
  title: 'Filter form item',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['FilterFormBlockModel'],
  stepParamsSchema: filterFormItemStepParamsSchema,
  subModelSlots: {
    field: createRuntimeFieldModelSlotSchema('filter-form-item-field'),
  },
  skeleton: {
    uid: 'todo-filter-form-item-uid',
    use: 'FilterFormItemModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'nickname',
        },
      },
      filterFormItemSettings: {
        showLabel: {
          showLabel: true,
        },
      },
    },
    subModels: {},
  },
  docs: {
    dynamicHints: [
      createRuntimeFieldDynamicHint(
        'FilterFormItemModel',
        'FilterFormItemModel.subModels.field',
        ['filter target block', 'filter operator bindings', 'field metadata'],
        'runtime-filter-form-item-field',
      ),
    ],
  },
};
