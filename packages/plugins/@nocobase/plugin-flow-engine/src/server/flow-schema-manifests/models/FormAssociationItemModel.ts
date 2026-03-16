/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import {
  createRuntimeFieldDynamicHint,
  createRuntimeFieldModelSlotSchema,
  detailItemStepParamsSchema,
} from '../shared';

export const formAssociationItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'FormAssociationItemModel',
  title: 'Form association item',
  source: 'official',
  strict: true,
  exposure: 'internal',
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
  stepParamsSchema: detailItemStepParamsSchema,
  subModelSlots: {
    field: createRuntimeFieldModelSlotSchema('form-association-item-field'),
  },
  skeleton: {
    uid: 'todo-form-association-item-uid',
    use: 'FormAssociationItemModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'profile.nickname',
          associationPathName: 'profile',
        },
      },
      detailItemSettings: {
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
        'FormAssociationItemModel',
        'FormAssociationItemModel.subModels.field',
        ['association title field', 'target collection bindings'],
        'runtime-form-association-item-field',
      ),
    ],
  },
};
