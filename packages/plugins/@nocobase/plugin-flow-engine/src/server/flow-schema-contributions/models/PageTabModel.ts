/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { pageTabSettingsStepParamsSchema } from '../shared';

export const pageTabModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'PageTabModel',
  title: 'Page tab',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['PageModel'],
  stepParamsSchema: pageTabSettingsStepParamsSchema,
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'BlockGridModel',
      description: 'Tab content block grid.',
    },
  },
  skeleton: {
    uid: 'todo-page-tab-uid',
    use: 'PageTabModel',
    stepParams: {
      pageTabSettings: {
        tab: {
          title: 'Tab',
        },
      },
    },
    subModels: {
      grid: {
        uid: 'todo-grid-uid',
        use: 'BlockGridModel',
      },
    },
  },
};
