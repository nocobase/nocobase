/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import { childPageSettingsStepParamsSchema, createPopupChildPageTree } from '../shared';

export const childPageModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'ChildPageModel',
  title: 'Popup child page',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: [
    'PopupActionModel',
    'AddNewActionModel',
    'EditActionModel',
    'ViewActionModel',
    'PopupCollectionActionModel',
    'BulkEditActionModel',
  ],
  stepParamsSchema: childPageSettingsStepParamsSchema,
  subModelSlots: {
    tabs: {
      type: 'array',
      uses: ['ChildPageTabModel'],
      required: true,
      minItems: 1,
      description: 'Popup child page tabs.',
    },
  },
  skeleton: createPopupChildPageTree({
    prefix: 'todo-popup-child-page',
  }),
  docs: {
    minimalExample: createPopupChildPageTree({
      prefix: 'popup-child-page',
    }),
    commonPatterns: [
      {
        title: 'Single popup page with one tab',
        description: 'Use one popup tab backed by a block grid when the popup only needs one content area.',
        snippet: {
          use: 'ChildPageModel',
          stepParams: {
            pageSettings: {
              general: {
                displayTitle: false,
                enableTabs: true,
              },
            },
          },
          subModels: {
            tabs: [
              {
                uid: 'popup-child-page-tab',
                use: 'ChildPageTabModel',
                subModels: {
                  grid: {
                    uid: 'popup-child-page-tab-grid',
                    use: 'BlockGridModel',
                  },
                },
              },
            ],
          },
        },
      },
    ],
    antiPatterns: [
      {
        title: 'Do not omit popup tabs',
        description: 'ChildPageModel requires at least one ChildPageTabModel child.',
      },
    ],
  },
};
