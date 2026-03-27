/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import { createPopupBlockGrid, pageTabSettingsStepParamsSchema } from '../shared';

export const childPageTabModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'ChildPageTabModel',
  title: 'Popup child page tab',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['ChildPageModel', 'PopupActionModel', 'BulkEditActionModel'],
  stepParamsSchema: pageTabSettingsStepParamsSchema,
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'BlockGridModel',
      required: true,
      description: 'Popup tab content block grid.',
    },
  },
  skeleton: {
    uid: 'todo-popup-child-page-tab',
    use: 'ChildPageTabModel',
    stepParams: {
      pageTabSettings: {
        tab: {
          title: 'Popup',
        },
      },
    },
    subModels: {
      grid: createPopupBlockGrid({
        prefix: 'todo-popup-child-page-tab',
      }),
    },
  },
  docs: {
    minimalExample: {
      uid: 'popup-child-page-tab',
      use: 'ChildPageTabModel',
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Popup',
          },
        },
      },
      subModels: {
        grid: createPopupBlockGrid({
          prefix: 'popup-child-page-tab',
        }),
      },
    },
    commonPatterns: [
      {
        title: 'Popup tab with a block grid',
        snippet: {
          use: 'ChildPageTabModel',
          stepParams: {
            pageTabSettings: {
              tab: {
                title: 'Popup',
              },
            },
          },
          subModels: {
            grid: {
              uid: 'popup-tab-grid',
              use: 'BlockGridModel',
            },
          },
        },
      },
    ],
    antiPatterns: [
      {
        title: 'Do not omit grid from popup tabs',
        description: 'ChildPageTabModel requires a BlockGridModel child in the grid slot.',
      },
    ],
  },
};
