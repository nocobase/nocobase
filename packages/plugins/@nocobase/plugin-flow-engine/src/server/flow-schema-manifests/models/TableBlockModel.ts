/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { dataScopeParamsSchema, sortingRuleParamsSchema } from '../shared';

export const tableBlockModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'TableBlockModel',
  title: 'Table block',
  source: 'official',
  strict: false,
  subModelSlots: {
    columns: {
      type: 'array',
      uses: ['TableColumnModel', 'TableActionsColumnModel', 'JSColumnModel', 'TableCustomColumnModel'],
      description: 'Table columns or action columns.',
    },
  },
  stepParamsSchema: {
    type: 'object',
    properties: {
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
    stepParams: {
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
    subModels: {
      columns: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'table-block-users',
      use: 'TableBlockModel',
      stepParams: {
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
      subModels: {
        columns: [],
      },
    },
    commonPatterns: [
      {
        title: 'Basic table with page size and sorting',
        snippet: {
          stepParams: {
            tableSettings: {
              pageSize: { pageSize: 20 },
              defaultSorting: {
                sort: [{ field: 'createdAt', direction: 'desc' }],
              },
            },
          },
        },
      },
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
            allowedUses: ['TableColumnModel', 'TableActionsColumnModel', 'JSColumnModel', 'TableCustomColumnModel'],
          },
          contextRequirements: ['collection fields', 'column factories'],
          unresolvedReason: 'runtime-table-columns',
        },
      },
    ],
  },
};
