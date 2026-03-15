/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { createFormGridDynamicHints, formGridItemUses, genericModelNodeSchema } from '../shared';

export const formGridModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'FormGridModel',
  title: 'Form grid',
  source: 'official',
  strict: true,
  exposure: 'internal',
  allowDirectUse: false,
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
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
  docs: {
    dynamicHints: createFormGridDynamicHints(),
  },
};
