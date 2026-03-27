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
  createActionStepParamsSchema,
  createCollectionResourceStepParams,
  createPopupActionExample,
  createPopupActionPattern,
  createPopupPageSlotSchema,
  popupActionAntiPatterns,
  popupActionSettingsStepParamsSchema,
} from '../shared';

const popupCollectionTableBlock = {
  uid: 'popup-collection-table',
  use: 'TableBlockModel',
  stepParams: createCollectionResourceStepParams(
    {},
    {
      tableSettings: {
        pageSize: {
          pageSize: 20,
        },
        showRowNumbers: {
          showIndex: true,
        },
        dataScope: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
      },
    },
  ),
  subModels: {
    columns: [],
    actions: [],
  },
};

export const popupCollectionActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'PopupCollectionActionModel',
  title: 'Popup collection action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel', 'TableActionsColumnModel', 'DetailsBlockModel'],
  subModelSlots: {
    page: createPopupPageSlotSchema(),
  },
  stepParamsSchema: createActionStepParamsSchema({
    popupSettings: popupActionSettingsStepParamsSchema,
  }),
  skeleton: createPopupActionExample({
    uid: 'todo-popup-collection-action-uid',
    use: 'PopupCollectionActionModel',
    title: 'Popup collection',
    prefix: 'todo-popup-collection-action',
    tabTitle: 'Collection popup',
    items: [popupCollectionTableBlock],
    openView: {
      dataSourceKey: 'main',
      collectionName: 'users',
    },
  }),
  docs: {
    minimalExample: createPopupActionExample({
      uid: 'popup-collection-users',
      use: 'PopupCollectionActionModel',
      title: 'Popup collection',
      prefix: 'popup-collection-users',
      tabTitle: 'Collection popup',
      items: [popupCollectionTableBlock],
      openView: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    }),
    commonPatterns: [
      createPopupActionPattern({
        title: 'Collection popup with a table block',
        description: 'Open a popup ChildPageModel tree that hosts collection-backed blocks.',
        use: 'PopupCollectionActionModel',
        buttonTitle: 'Popup collection',
        prefix: 'popup-collection-pattern',
        tabTitle: 'Collection popup',
        items: [popupCollectionTableBlock],
        openView: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      }),
    ],
    antiPatterns: popupActionAntiPatterns,
  },
};
