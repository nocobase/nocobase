/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { createRuntimeFieldDynamicHint, formItemStepParamsSchema, runtimeFieldModelSlotSchema } from '../shared';

export const formItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'FormItemModel',
  title: 'Form item',
  source: 'official',
  strict: true,
  exposure: 'internal',
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
  stepParamsSchema: formItemStepParamsSchema,
  subModelSlots: {
    field: runtimeFieldModelSlotSchema,
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
        'FormItemModel',
        'FormItemModel.subModels.field',
        ['form field bindings', 'collection metadata'],
        'runtime-form-item-field',
      ),
    ],
  },
};
