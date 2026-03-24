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
  assignFormItemStepParamsSchema,
  createRuntimeFieldDynamicHint,
  createRuntimeFieldModelSlotSchema,
} from '../shared';

export const assignFormItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'AssignFormItemModel',
  title: 'Assign form item',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['UpdateRecordActionModel'],
  stepParamsSchema: assignFormItemStepParamsSchema,
  subModelSlots: {
    field: createRuntimeFieldModelSlotSchema('assign-form-item-field'),
  },
  skeleton: {
    uid: 'todo-assign-item-uid',
    use: 'AssignFormItemModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'nickname',
        },
        assignValue: {
          value: 'Alice',
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
        'AssignFormItemModel',
        'AssignFormItemModel.subModels.field',
        ['editable field bindings', 'assignment value editor'],
        'runtime-assign-form-item-field',
      ),
    ],
  },
};
