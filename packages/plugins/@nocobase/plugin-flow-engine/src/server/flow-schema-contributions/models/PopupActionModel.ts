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
  createPopupActionExample,
  createPopupActionPattern,
  createPopupPageSlotSchema,
  popupActionAntiPatterns,
  popupActionSettingsStepParamsSchema,
} from '../shared';

const popupJsBlock = {
  uid: 'popup-js-block',
  use: 'JSBlockModel',
  stepParams: {
    jsSettings: {
      runJs: {
        version: 'v2',
        code: "ctx.render('<div>Popup content</div>');",
      },
    },
  },
};

export const popupActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'PopupActionModel',
  title: 'Popup action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['ActionPanelBlockModel'],
  subModelSlots: {
    page: createPopupPageSlotSchema(),
  },
  stepParamsSchema: createActionStepParamsSchema({
    popupSettings: popupActionSettingsStepParamsSchema,
  }),
  skeleton: createPopupActionExample({
    uid: 'todo-popup-action-uid',
    use: 'PopupActionModel',
    title: 'Popup',
    prefix: 'todo-popup-action',
    tabTitle: 'Popup',
    items: [popupJsBlock],
  }),
  docs: {
    minimalExample: createPopupActionExample({
      uid: 'popup-action-example',
      use: 'PopupActionModel',
      title: 'Popup',
      prefix: 'popup-action-example',
      tabTitle: 'Popup',
      items: [popupJsBlock],
    }),
    commonPatterns: [
      createPopupActionPattern({
        title: 'Generic popup with a JS block',
        description: 'Use a ChildPageModel popup tree when the action opens a self-contained popup UI.',
        use: 'PopupActionModel',
        buttonTitle: 'Popup',
        prefix: 'popup-generic-pattern',
        tabTitle: 'Popup',
        items: [popupJsBlock],
      }),
    ],
    antiPatterns: popupActionAntiPatterns,
  },
};
