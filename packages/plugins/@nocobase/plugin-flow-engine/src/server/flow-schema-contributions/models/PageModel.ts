/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import { pageTabUses } from '../shared';

export const pageModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'PageModel',
  title: 'Page',
  source: 'official',
  strict: false,
  subModelSlots: {
    tabs: {
      type: 'array',
      uses: pageTabUses,
      description: 'Page tabs.',
    },
  },
  stepParamsSchema: {
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
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'PageModel',
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
      uid: 'page-users',
      use: 'PageModel',
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
        title: 'Single page without tabs',
        snippet: {
          stepParams: {
            pageSettings: {
              general: {
                title: 'Users',
                displayTitle: true,
                enableTabs: false,
              },
            },
          },
        },
      },
      {
        title: 'Page with tabs enabled',
        snippet: {
          stepParams: {
            pageSettings: {
              general: {
                title: 'Dashboard',
                displayTitle: true,
                enableTabs: true,
              },
            },
          },
          subModels: {
            tabs: [
              {
                uid: 'page-tab-1',
                use: 'RootPageTabModel',
              },
            ],
          },
        },
      },
    ],
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'PageModel.subModels.tabs',
        message: 'Tab models are usually created from runtime route context.',
        'x-flow': {
          slotRules: {
            slotKey: 'tabs',
            type: 'array',
            allowedUses: pageTabUses,
          },
          contextRequirements: ['route context', 'page tab model class'],
          unresolvedReason: 'runtime-page-tabs',
        },
      },
    ],
  },
};
