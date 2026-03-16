/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { createRuntimeFieldDynamicHint, detailItemStepParamsSchema, runtimeFieldModelSlotSchema } from '../shared';

export const detailsItemModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'DetailsItemModel',
  title: 'Details item',
  source: 'official',
  strict: true,
  exposure: 'internal',
  suggestedUses: ['DetailsBlockModel'],
  stepParamsSchema: detailItemStepParamsSchema,
  subModelSlots: {
    field: runtimeFieldModelSlotSchema,
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
        'DetailsItemModel',
        'DetailsItemModel.subModels.field',
        ['details field bindings', 'collection metadata'],
        'runtime-details-item-field',
      ),
    ],
  },
};
