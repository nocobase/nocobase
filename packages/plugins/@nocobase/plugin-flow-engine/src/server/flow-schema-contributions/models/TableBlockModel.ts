/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import {
  collectionResourceSettingsStepParamsSchema,
  collectionActionUses,
  createAssociatedCollectionPattern,
  createCollectionResourceStepParams,
  dataScopeParamsSchema,
  genericModelNodeSchema,
  sortingRuleParamsSchema,
  tableColumnUses,
} from '../shared';

export const tableBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'TableBlockModel',
  title: 'Table block',
  source: 'official',
  strict: false,
  subModelSlots: {
    columns: {
      type: 'array',
      uses: tableColumnUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Table columns or action columns.',
    },
    actions: {
      type: 'array',
      uses: collectionActionUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Collection actions depend on runtime action registries and table capabilities.',
    },
  },
  stepParamsSchema: {
    type: 'object',
    properties: {
      ...(((collectionResourceSettingsStepParamsSchema as any).properties || {}) as Record<string, any>),
      resourceSettings2: {
        type: 'object',
        additionalProperties: true,
      },
      tableSettings: {
        type: 'object',
        properties: {
          quickEdit: {
            type: 'object',
            properties: {
              editable: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          showRowNumbers: {
            type: 'object',
            properties: {
              showIndex: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          pageSize: {
            type: 'object',
            properties: {
              pageSize: {
                type: 'number',
                enum: [5, 10, 20, 50, 100, 200],
              },
            },
            additionalProperties: false,
          },
          dataScope: dataScopeParamsSchema,
          defaultSorting: sortingRuleParamsSchema,
          treeTable: {
            type: 'object',
            properties: {
              treeTable: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          defaultExpandAllRows: {
            type: 'object',
            properties: {
              defaultExpandAllRows: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          tableDensity: {
            type: 'object',
            properties: {
              size: {
                type: 'string',
                enum: ['large', 'middle', 'small'],
              },
            },
            additionalProperties: false,
          },
          dragSort: {
            type: 'object',
            additionalProperties: true,
          },
          dragSortBy: {
            type: 'object',
            additionalProperties: true,
          },
          refreshData: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'TableBlockModel',
    stepParams: createCollectionResourceStepParams(
      {},
      {
        tableSettings: {
          pageSize: {
            pageSize: 20,
          },
          showRowNumbers: {
            showIndex: true,
          },
          dataScope: {
            filter: {
              logic: '$and',
              items: [],
            },
          },
        },
      },
    ),
    subModels: {
      columns: [],
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'table-block-users',
      use: 'TableBlockModel',
      stepParams: createCollectionResourceStepParams(
        {},
        {
          tableSettings: {
            pageSize: {
              pageSize: 20,
            },
            showRowNumbers: {
              showIndex: true,
            },
            dataScope: {
              filter: {
                logic: '$and',
                items: [],
              },
            },
          },
        },
      ),
      subModels: {
        columns: [],
        actions: [],
      },
    },
    commonPatterns: [
      {
        title: 'Basic table with page size and sorting',
        snippet: {
          stepParams: createCollectionResourceStepParams(
            {},
            {
              tableSettings: {
                pageSize: { pageSize: 20 },
                defaultSorting: {
                  sort: [{ field: 'createdAt', direction: 'desc' }],
                },
              },
            },
          ),
        },
      },
      createAssociatedCollectionPattern('TableBlockModel', {
        tableSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      }),
    ],
    antiPatterns: [
      {
        title: 'Do not assume every column use is TableActionsColumnModel',
        description: 'The columns slot accepts multiple concrete column models.',
      },
    ],
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'TableBlockModel.subModels.columns',
        message: 'Column use values depend on collection field interfaces and runtime table column factories.',
        'x-flow': {
          slotRules: {
            slotKey: 'columns',
            type: 'array',
            allowedUses: tableColumnUses,
          },
          contextRequirements: ['collection fields', 'column factories'],
          unresolvedReason: 'runtime-table-columns',
        },
      },
      {
        kind: 'dynamic-children',
        path: 'TableBlockModel.subModels.actions',
        message: 'Collection actions depend on runtime action registries and collection capabilities.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
            allowedUses: collectionActionUses,
          },
          contextRequirements: ['collection action registry', 'collection capabilities'],
          unresolvedReason: 'runtime-table-collection-actions',
        },
      },
    ],
  },
};
