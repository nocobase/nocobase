/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowDynamicHint,
  FlowJsonSchema,
  FlowModelSchemaContribution,
  FlowSchemaContribution,
} from '../../flow-schema-registry';

const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

const gridRowsSchema: FlowJsonSchema = {
  type: 'object',
  description:
    'Map of row ids to column definitions. Each row value is a string[][] where every inner array lists the child model UIDs rendered inside one column.',
  additionalProperties: {
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

const gridSizesSchema: FlowJsonSchema = {
  type: 'object',
  description:
    'Map of row ids to column widths. Each width array uses the 24-column grid system, for example [12, 12] or [8, 8, 8].',
  additionalProperties: {
    type: 'array',
    items: {
      type: 'number',
    },
  },
};

const gridRowOrderSchema: FlowJsonSchema = {
  type: 'array',
  description: 'Optional explicit row order. When omitted, the persisted row key order is used.',
  items: {
    type: 'string',
  },
};

const createGridLayoutStepParamsSchema = (): FlowJsonSchema => ({
  type: 'object',
  properties: {
    gridSettings: {
      type: 'object',
      properties: {
        grid: {
          type: 'object',
          description: 'Persisted multi-row, multi-column grid layout.',
          properties: {
            rows: gridRowsSchema,
            sizes: gridSizesSchema,
            rowOrder: gridRowOrderSchema,
          },
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
});

const createGridLayoutStepParamsValue = (
  rows: Record<string, string[][]>,
  sizes: Record<string, number[]>,
  rowOrder: string[],
) => ({
  gridSettings: {
    grid: {
      rows,
      sizes,
      rowOrder,
    },
  },
});

const createGridLayoutItems = (itemUses: string[], prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    uid: `${prefix}-item-${index + 1}`,
    use: itemUses[index % itemUses.length],
  }));

const createGridLayoutDocs = (options: {
  use: string;
  itemUses: string[];
  prefix: string;
  dynamicHints?: FlowDynamicHint[];
}): FlowModelSchemaContribution['docs'] => {
  const minimalItems = createGridLayoutItems(options.itemUses, `${options.prefix}-minimal`, 1);
  const standardItems = createGridLayoutItems(options.itemUses, `${options.prefix}-standard`, 5);
  const customSizeItems = createGridLayoutItems(options.itemUses, `${options.prefix}-sizes`, 5);

  return {
    minimalExample: {
      uid: `${options.prefix}-grid`,
      use: options.use,
      stepParams: createGridLayoutStepParamsValue({ rowMain: [[minimalItems[0].uid]] }, { rowMain: [24] }, ['rowMain']),
      subModels: {
        items: minimalItems,
      },
    },
    commonPatterns: [
      {
        title: 'Single row with one column',
        description: 'Use one row with a single 24-column slot when the grid only needs one child model.',
        snippet: {
          use: options.use,
          stepParams: createGridLayoutStepParamsValue({ rowMain: [[minimalItems[0].uid]] }, { rowMain: [24] }, [
            'rowMain',
          ]),
          subModels: {
            items: minimalItems,
          },
        },
      },
      {
        title: 'Two rows with 2 + 3 columns',
        description: 'The first row has 2 columns and the second row has 3 columns with equal widths.',
        snippet: {
          use: options.use,
          stepParams: createGridLayoutStepParamsValue(
            {
              rowTop: [[standardItems[0].uid], [standardItems[1].uid]],
              rowBottom: [[standardItems[2].uid], [standardItems[3].uid], [standardItems[4].uid]],
            },
            {
              rowTop: [12, 12],
              rowBottom: [8, 8, 8],
            },
            ['rowTop', 'rowBottom'],
          ),
          subModels: {
            items: standardItems,
          },
        },
      },
      {
        title: 'Two rows with custom column sizes',
        description: 'Use sizes to express non-equal column widths while keeping the rows definition stable.',
        snippet: {
          use: options.use,
          stepParams: createGridLayoutStepParamsValue(
            {
              rowTop: [[customSizeItems[0].uid], [customSizeItems[1].uid]],
              rowBottom: [[customSizeItems[2].uid], [customSizeItems[3].uid], [customSizeItems[4].uid]],
            },
            {
              rowTop: [8, 16],
              rowBottom: [6, 10, 8],
            },
            ['rowTop', 'rowBottom'],
          ),
          subModels: {
            items: customSizeItems,
          },
        },
      },
    ],
    dynamicHints: options.dynamicHints || [],
  };
};

const bulkEditBlockGridModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'BulkEditBlockGridModel',
  title: 'Bulk edit block grid',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['BulkEditActionModel'],
  stepParamsSchema: createGridLayoutStepParamsSchema(),
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
  docs: createGridLayoutDocs({
    use: 'BulkEditBlockGridModel',
    itemUses: ['TableBlockModel', 'JSBlockModel', 'MarkdownBlockModel'],
    prefix: 'bulk-edit-grid',
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
  }),
};

const bulkEditChildPageTabModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'BulkEditChildPageTabModel',
  title: 'Bulk edit child page tab',
  source: 'plugin',
  strict: false,
  exposure: 'internal',
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

const bulkEditActionModelSchemaContribution: FlowModelSchemaContribution = {
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

export const flowSchemaContribution: FlowSchemaContribution = {
  models: [
    bulkEditBlockGridModelInternalSchemaContribution,
    bulkEditChildPageTabModelInternalSchemaContribution,
    bulkEditActionModelSchemaContribution,
  ],
  defaults: {
    source: 'plugin',
  },
};
