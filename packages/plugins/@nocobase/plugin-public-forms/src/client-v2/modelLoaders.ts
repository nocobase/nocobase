/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import {
  PUBLIC_FORM_LAYOUT_MODEL,
  PUBLIC_FORM_PAGE_MODEL,
  PUBLIC_FORM_SUBMIT_ACTION_MODEL,
  PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL,
} from './constants';

export function registerPublicFormV2ModelLoaders(flowEngine: Pick<FlowEngine, 'registerModelLoaders'>) {
  flowEngine.registerModelLoaders({
    [PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL]: {
      loader: () => import('./models/PublicFormsSettingsLayoutModel'),
    },
    [PUBLIC_FORM_LAYOUT_MODEL]: {
      loader: () => import('./models/PublicFormLayoutModel'),
    },
    [PUBLIC_FORM_PAGE_MODEL]: {
      loader: () => import('./models/PublicFormPageModel'),
    },
    [PUBLIC_FORM_SUBMIT_ACTION_MODEL]: {
      loader: () => import('./models/PublicFormSubmitActionModel'),
    },
  });
}
