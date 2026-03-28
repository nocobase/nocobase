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
  createFormBlockMinimalExample,
  createPopupActionExample,
  createPopupActionPattern,
  createPopupPageSlotSchema,
  popupActionAntiPatterns,
  popupActionSettingsStepParamsSchema,
} from '../shared';

const editFormBlock = createFormBlockMinimalExample('EditFormModel');

export const editActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'EditActionModel',
  title: 'Edit action',
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
    uid: 'todo-edit-action-uid',
    use: 'EditActionModel',
    title: 'Edit',
    prefix: 'todo-edit-action',
    tabTitle: 'Edit form',
    items: [editFormBlock],
    openView: {
      dataSourceKey: 'main',
      collectionName: 'users',
    },
  }),
  docs: {
    minimalExample: createPopupActionExample({
      uid: 'edit-users',
      use: 'EditActionModel',
      title: 'Edit',
      prefix: 'edit-users',
      tabTitle: 'Edit form',
      items: [editFormBlock],
      openView: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    }),
    commonPatterns: [
      createPopupActionPattern({
        title: 'EditActionModel + EditForm popup',
        description: 'Use a ChildPageModel popup tree to host an EditFormModel block for record editing.',
        use: 'EditActionModel',
        buttonTitle: 'Edit',
        prefix: 'edit-pattern',
        tabTitle: 'Edit form',
        items: [editFormBlock],
        openView: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      }),
    ],
    antiPatterns: popupActionAntiPatterns,
  },
};
