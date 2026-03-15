/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

const bulkEditBlockGridModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'BulkEditBlockGridModel',
  title: 'Bulk edit block grid',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  allowDirectUse: false,
  suggestedUses: ['BulkEditActionModel'],
  subModelSlots: {
    items: {
      type: 'array',
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Bulk edit grid items depend on runtime block registries.',
    },
  },
  skeleton: {
    uid: 'todo-bulk-edit-grid-uid',
    use: 'BulkEditBlockGridModel',
    subModels: {
      items: [],
    },
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'BulkEditBlockGridModel.subModels.items',
        message: 'Bulk edit page blocks depend on runtime block registries and collection context.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
          },
          contextRequirements: ['block registry', 'collection context'],
          unresolvedReason: 'runtime-bulk-edit-grid-items',
        },
      },
    ],
  },
};

const bulkEditChildPageTabModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'BulkEditChildPageTabModel',
  title: 'Bulk edit child page tab',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  allowDirectUse: false,
  suggestedUses: ['BulkEditActionModel'],
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'BulkEditBlockGridModel',
      description: 'Bulk edit tab content grid.',
    },
  },
  skeleton: {
    uid: 'todo-bulk-edit-tab-uid',
    use: 'BulkEditChildPageTabModel',
    subModels: {
      grid: {
        uid: 'todo-bulk-edit-tab-grid-uid',
        use: 'BulkEditBlockGridModel',
      },
    },
  },
};

const bulkEditActionModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'BulkEditActionModel',
  title: 'Bulk edit action',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      bulkEditSettings: {
        type: 'object',
        properties: {
          editMode: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                enum: ['selected', 'all'],
              },
            },
            required: ['value'],
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    page: {
      type: 'object',
      use: 'ChildPageModel',
      description: 'Popup child page used to host bulk edit tabs.',
      childSchemaPatch: {
        subModelSlots: {
          tabs: {
            type: 'array',
            uses: ['BulkEditChildPageTabModel'],
            description: 'Bulk edit tabs.',
          },
        },
      },
    },
  },
  skeleton: {
    uid: 'todo-bulk-edit-action-uid',
    use: 'BulkEditActionModel',
    stepParams: {
      bulkEditSettings: {
        editMode: {
          value: 'selected',
        },
      },
    },
    subModels: {
      page: {
        uid: 'todo-bulk-edit-page-uid',
        use: 'ChildPageModel',
        stepParams: {
          pageSettings: {
            general: {
              displayTitle: false,
              enableTabs: true,
            },
          },
        },
        subModels: {
          tabs: [
            {
              uid: 'todo-bulk-edit-tab-uid',
              use: 'BulkEditChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: 'Bulk edit',
                  },
                },
              },
              subModels: {
                grid: {
                  uid: 'todo-bulk-edit-grid-uid',
                  use: 'BulkEditBlockGridModel',
                },
              },
            },
          ],
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'bulk-edit-users',
      use: 'BulkEditActionModel',
      stepParams: {
        bulkEditSettings: {
          editMode: {
            value: 'selected',
          },
        },
      },
      subModels: {
        page: {
          uid: 'bulk-edit-users-page',
          use: 'ChildPageModel',
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'BulkEditActionModel.subModels.page.subModels.tabs[*].subModels.grid.subModels.items',
        message: 'Bulk edit blocks inside the popup grid depend on runtime block registries.',
        'x-flow': {
          contextRequirements: ['block registry', 'collection context'],
          unresolvedReason: 'runtime-bulk-edit-grid-items',
        },
      },
    ],
  },
};

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['BulkEditActionModel'],
  },
  models: [
    bulkEditBlockGridModelInternalSchemaManifest,
    bulkEditChildPageTabModelInternalSchemaManifest,
    bulkEditActionModelSchemaManifest,
  ],
  defaults: {
    source: 'plugin',
  },
};
