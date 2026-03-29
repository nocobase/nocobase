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
  createFormGridDynamicHints,
  createGridLayoutDocs,
  createGridLayoutStepParamsSchema,
  formGridItemUses,
  genericModelNodeSchema,
} from '../shared';

export const formGridModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FormGridModel',
  title: 'Form grid',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
  stepParamsSchema: createGridLayoutStepParamsSchema(),
  subModelSlots: {
    items: {
      type: 'array',
      uses: formGridItemUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Form grid items are resolved from the runtime field tree and custom item registries.',
    },
  },
  skeleton: {
    uid: 'todo-form-grid-uid',
    use: 'FormGridModel',
    subModels: {
      items: [],
    },
  },
  docs: createGridLayoutDocs({
    use: 'FormGridModel',
    itemUses: formGridItemUses,
    prefix: 'form-grid',
    dynamicHints: createFormGridDynamicHints(),
  }),
};
