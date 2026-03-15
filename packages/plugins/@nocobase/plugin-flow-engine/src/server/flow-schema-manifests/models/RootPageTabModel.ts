/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';

const pageTabStepParamsSchema = {
  type: 'object',
  properties: {
    pageTabSettings: {
      type: 'object',
      properties: {
        tab: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            documentTitle: { type: 'string' },
            icon: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const rootPageTabModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'RootPageTabModel',
  title: 'Root page tab',
  source: 'official',
  strict: false,
  exposure: 'internal',
  stepParamsSchema: pageTabStepParamsSchema,
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'BlockGridModel',
      description: 'Tab content block grid.',
    },
  },
  skeleton: {
    uid: 'todo-tab-uid',
    use: 'RootPageTabModel',
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
