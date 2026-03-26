/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';

export const refreshTargetBlocksSchemaContribution: FlowActionSchemaContribution = {
  name: 'refreshTargetBlocks',
  title: 'Refresh target blocks',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      targets: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      targets: ['target-block-uid'],
    },
  },
};
