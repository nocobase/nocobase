/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaManifest } from '@nocobase/flow-engine';

export const confirmSchemaManifest: FlowActionSchemaManifest = {
  name: 'confirm',
  title: 'Confirmation',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      enable: { type: 'boolean' },
      title: { type: 'string' },
      content: { type: 'string' },
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      enable: false,
      title: 'Please Confirm',
      content: 'Are you sure you want to perform the action?',
    },
    dynamicHints: [
      {
        kind: 'custom-component',
        path: 'actions.confirm.title',
        message: 'Confirmation text supports runtime variables resolved from the current flow context.',
        'x-flow': {
          contextRequirements: ['flow context variables'],
          unresolvedReason: 'runtime-template-resolution',
          recommendedFallback: {
            enable: false,
            title: 'Please Confirm',
            content: 'Are you sure you want to perform the action?',
          },
        },
      },
    ],
  },
};
