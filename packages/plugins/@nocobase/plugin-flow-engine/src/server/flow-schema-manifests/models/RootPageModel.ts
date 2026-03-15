/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';

const pageSettingsStepParamsSchema = {
  type: 'object',
  properties: {
    pageSettings: {
      type: 'object',
      properties: {
        general: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            documentTitle: { type: 'string' },
            displayTitle: { type: 'boolean' },
            enableTabs: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    },
    rootPageSettings: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const rootPageModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'RootPageModel',
  title: 'Root page',
  source: 'official',
  strict: false,
  stepParamsSchema: pageSettingsStepParamsSchema,
  subModelSlots: {
    tabs: {
      type: 'array',
      uses: ['RootPageTabModel'],
      description: 'Root page tabs.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'RootPageModel',
    stepParams: {
      pageSettings: {
        general: {
          title: 'Page title',
          displayTitle: true,
          enableTabs: false,
        },
      },
    },
    subModels: {
      tabs: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'root-page-users',
      use: 'RootPageModel',
      stepParams: {
        pageSettings: {
          general: {
            title: 'Users',
            displayTitle: true,
            enableTabs: false,
          },
        },
      },
      subModels: {
        tabs: [],
      },
    },
    commonPatterns: [
      {
        title: 'Root page with a single tab container',
        snippet: {
          subModels: {
            tabs: [
              {
                uid: 'root-tab-users',
                use: 'RootPageTabModel',
              },
            ],
          },
        },
      },
    ],
  },
};
