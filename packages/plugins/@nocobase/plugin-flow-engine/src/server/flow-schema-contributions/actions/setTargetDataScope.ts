/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';
import { genericFilterSchema } from '../shared';

export const setTargetDataScopeSchemaContribution: FlowActionSchemaContribution = {
  name: 'setTargetDataScope',
  title: 'Set data scope',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      targetBlockUid: { type: 'string' },
      filter: genericFilterSchema,
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      targetBlockUid: 'table-users',
      filter: {
        logic: '$and',
        items: [],
      },
    },
  },
};
