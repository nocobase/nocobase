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
  detailItemStepParamsSchema,
} from '../shared';

export const detailsItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'DetailsItemModel',
  title: 'Details item',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['DetailsBlockModel'],
  stepParamsSchema: detailItemStepParamsSchema,
  subModelSlots: {
    field: createRuntimeFieldModelSlotSchema('details-item-field'),
  },
  skeleton: {
    uid: 'todo-details-item-uid',
    use: 'DetailsItemModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath: 'nickname',
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
        'DetailsItemModel',
        'DetailsItemModel.subModels.field',
        ['details field bindings', 'collection metadata'],
        'runtime-details-item-field',
      ),
    ],
  },
};
