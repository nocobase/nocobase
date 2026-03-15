/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';

export const routeModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'RouteModel',
  title: 'Route',
  source: 'official',
  strict: false,
  subModelSlots: {
    page: {
      type: 'object',
      use: 'RootPageModel',
      description: 'Route root page.',
    },
  },
  flowRegistrySchema: {
    type: 'object',
    properties: {
      popupSettings: {
        type: 'object',
        properties: {
          key: { const: 'popupSettings' },
          on: {
            anyOf: [{ type: 'string' }, { type: 'object', properties: { eventName: { type: 'string' } } }],
          },
          steps: {
            type: 'object',
            properties: {
              openView: {
                type: 'object',
                properties: {
                  use: { const: 'openView' },
                },
                additionalProperties: true,
              },
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
    use: 'RouteModel',
    flowRegistry: {
      popupSettings: {
        key: 'popupSettings',
        steps: {
          openView: {
            use: 'openView',
          },
        },
      },
    },
    subModels: {
      page: {
        uid: 'todo-page-uid',
        use: 'RootPageModel',
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'route-users',
      use: 'RouteModel',
      subModels: {
        page: {
          uid: 'root-page-users',
          use: 'RootPageModel',
        },
      },
    },
    commonPatterns: [
      {
        title: 'Route hosting a root page',
        snippet: {
          subModels: {
            page: {
              use: 'RootPageModel',
            },
          },
        },
      },
    ],
  },
};
