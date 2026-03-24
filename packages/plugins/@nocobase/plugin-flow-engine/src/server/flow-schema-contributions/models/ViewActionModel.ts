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
  createActionStepParamsSchema,
  createCollectionResourceStepParams,
  createPopupActionExample,
  createPopupActionPattern,
  createPopupPageSlotSchema,
  popupActionAntiPatterns,
  popupActionSettingsStepParamsSchema,
} from '../shared';

const detailsPopupBlock = {
  uid: 'details-popup-block',
  use: 'DetailsBlockModel',
  stepParams: createCollectionResourceStepParams(
    {},
    {
      detailsSettings: {
        layout: {
          layout: 'vertical',
          colon: true,
        },
        dataScope: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
        linkageRules: {
          value: [],
        },
      },
    },
  ),
  subModels: {
    grid: {
      uid: 'details-popup-grid',
      use: 'DetailsGridModel',
    },
    actions: [],
  },
};

export const viewActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'ViewActionModel',
  title: 'View action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableActionsColumnModel', 'DetailsBlockModel'],
  subModelSlots: {
    page: createPopupPageSlotSchema(),
  },
  stepParamsSchema: createActionStepParamsSchema({
    popupSettings: popupActionSettingsStepParamsSchema,
  }),
  skeleton: createPopupActionExample({
    uid: 'todo-view-action-uid',
    use: 'ViewActionModel',
    title: 'View',
    prefix: 'todo-view-action',
    tabTitle: 'Details',
    items: [detailsPopupBlock],
    openView: {
      dataSourceKey: 'main',
      collectionName: 'users',
    },
  }),
  docs: {
    minimalExample: createPopupActionExample({
      uid: 'view-users',
      use: 'ViewActionModel',
      title: 'View',
      prefix: 'view-users',
      tabTitle: 'Details',
      items: [detailsPopupBlock],
      openView: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    }),
    commonPatterns: [
      createPopupActionPattern({
        title: 'ViewActionModel + Details popup',
        description: 'Render a record details block inside a ChildPageModel popup tree.',
        use: 'ViewActionModel',
        buttonTitle: 'View',
        prefix: 'view-pattern',
        tabTitle: 'Details',
        items: [detailsPopupBlock],
        openView: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      }),
    ],
    antiPatterns: popupActionAntiPatterns,
  },
};
