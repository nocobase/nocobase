/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaContribution } from '@nocobase/flow-engine';
import {
  coreFieldBindingContextContributions,
  coreFieldBindingContributions,
  coreFieldModelContributions,
} from './field-models';
import { flowSchemaActionContributions } from './actions';
import { flowSchemaModelContributions } from './models';
import { publicBlockRootUses } from './shared';

export * from './actions';
export * from './field-models';
export * from './models';

export const flowSchemaContribution: FlowSchemaContribution = {
  actions: flowSchemaActionContributions,
  models: [...flowSchemaModelContributions, ...coreFieldModelContributions],
  fieldBindingContexts: coreFieldBindingContextContributions,
  fieldBindings: coreFieldBindingContributions,
  inventory: {
    slotUseExpansions: [
      {
        parentUse: 'BlockGridModel',
        slotKey: 'items',
        uses: Array.from(new Set(publicBlockRootUses)).sort(),
      },
    ],
  },
  defaults: {
    source: 'official',
  },
};
