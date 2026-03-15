/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { createRuntimeFieldDynamicHint, filterFormItemStepParamsSchema, runtimeFieldModelSlotSchema } from '../shared';

export const filterFormItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'FilterFormItemModel',
  title: 'Filter form item',
  source: 'official',
  strict: true,
  exposure: 'internal',
  allowDirectUse: false,
  suggestedUses: ['FilterFormBlockModel'],
  stepParamsSchema: filterFormItemStepParamsSchema,
  subModelSlots: {
    field: runtimeFieldModelSlotSchema,
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
    subModels: {
      field: {
        uid: 'runtime-field-uid',
        use: 'RuntimeFieldModel',
      },
    },
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
