/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { genericModelNodeSchema } from '../shared';

export const pageModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'PageModel',
  title: 'Page',
  source: 'official',
  strict: false,
  subModelSlots: {
    tabs: {
      type: 'array',
      uses: ['BasePageTabModel', 'RootPageTabModel', 'PageTabModel'],
      description: 'Page tabs.',
      childSchemaPatch: {
        BasePageTabModel: {
          subModelSlots: {
            grid: {
              type: 'object',
              use: 'BlockGridModel',
              description: 'Tab content grid container.',
            },
          },
        },
        RootPageTabModel: {
          subModelSlots: {
            grid: {
              type: 'object',
              use: 'BlockGridModel',
              description: 'Tab content grid container.',
            },
          },
        },
        PageTabModel: {
          subModelSlots: {
            grid: {
              type: 'object',
              use: 'BlockGridModel',
              description: 'Tab content grid container.',
            },
          },
        },
      },
      descendantSchemaPatches: [
        {
          path: [
            {
              slotKey: 'grid',
              use: 'BlockGridModel',
            },
          ],
          patch: {
            subModelSlots: {
              items: {
                type: 'array',
                dynamic: true,
                schema: genericModelNodeSchema,
                description: 'Page tab grid items are resolved from runtime block registries.',
              },
            },
            dynamicHints: [
              {
                kind: 'dynamic-children',
                path: 'BlockGridModel.subModels.items',
                message: 'Grid items depend on runtime block registries and collection-aware factories.',
                'x-flow': {
                  slotRules: {
                    slotKey: 'items',
                    type: 'array',
                  },
                  contextRequirements: ['block registry', 'collection metadata'],
                  unresolvedReason: 'runtime-block-grid-items',
                },
              },
            ],
          },
        },
      ],
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
            allowedUses: ['BasePageTabModel', 'RootPageTabModel', 'PageTabModel'],
          },
          contextRequirements: ['route context', 'page tab model class'],
          unresolvedReason: 'runtime-page-tabs',
        },
      },
    ],
  },
};
