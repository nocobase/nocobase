/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import { pageTabSettingsStepParamsSchema } from '../shared';

export const basePageTabModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'BasePageTabModel',
  title: 'Base page tab',
  source: 'official',
  strict: false,
  exposure: 'internal',
  abstract: true,
  allowDirectUse: false,
  suggestedUses: ['PageModel', 'RootPageModel'],
  stepParamsSchema: pageTabSettingsStepParamsSchema,
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'BlockGridModel',
      description: 'Tab content block grid.',
    },
  },
  skeleton: {
    uid: 'todo-base-tab-uid',
    use: 'BasePageTabModel',
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
