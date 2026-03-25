/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { createRuntimeFieldDynamicHint, createRuntimeFieldModelSlotSchema, formItemStepParamsSchema } from '../shared';

export const formItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FormItemModel',
  title: 'Form item',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
  stepParamsSchema: formItemStepParamsSchema,
  subModelSlots: {
    field: createRuntimeFieldModelSlotSchema('form-item-field'),
  },
  skeleton: {
    uid: 'todo-form-item-uid',
    use: 'FormItemModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'nickname',
        },
      },
      editItemSettings: {
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
        'FormItemModel',
        'FormItemModel.subModels.field',
        ['form field bindings', 'collection metadata'],
        'runtime-form-item-field',
      ),
    ],
  },
};
