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
  createFormBlockMinimalExample,
  createPopupActionExample,
  createPopupActionPattern,
  createPopupPageSlotSchema,
  popupActionAntiPatterns,
  popupActionSettingsStepParamsSchema,
} from '../shared';

const addNewFormBlock = createFormBlockMinimalExample('CreateFormModel');

export const addNewActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'AddNewActionModel',
  title: 'Add new action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel'],
  subModelSlots: {
    page: createPopupPageSlotSchema(),
  },
  stepParamsSchema: createActionStepParamsSchema({
    popupSettings: popupActionSettingsStepParamsSchema,
  }),
  skeleton: createPopupActionExample({
    uid: 'todo-add-new-action-uid',
    use: 'AddNewActionModel',
    title: 'Add new',
    prefix: 'todo-add-new-action',
    tabTitle: 'Create form',
    items: [addNewFormBlock],
    openView: {
      dataSourceKey: 'main',
      collectionName: 'users',
    },
  }),
  docs: {
    minimalExample: createPopupActionExample({
      uid: 'add-new-users',
      use: 'AddNewActionModel',
      title: 'Add new',
      prefix: 'add-new-users',
      tabTitle: 'Create form',
      items: [addNewFormBlock],
      openView: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    }),
    commonPatterns: [
      createPopupActionPattern({
        title: 'AddNewActionModel + CreateForm popup',
        description: 'Build a complete popup action with a ChildPageModel tree that hosts a CreateFormModel block.',
        use: 'AddNewActionModel',
        buttonTitle: 'Add new',
        prefix: 'add-new-pattern',
        tabTitle: 'Create form',
        items: [addNewFormBlock],
        openView: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      }),
    ],
    antiPatterns: popupActionAntiPatterns,
  },
};
