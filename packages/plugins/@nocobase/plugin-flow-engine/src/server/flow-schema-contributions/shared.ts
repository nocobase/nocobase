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
  FlowSubModelSlotSchema,
} from '@nocobase/flow-engine';

const genericFilterSchemaId = 'urn:nocobase:schema:plugin-flow-engine:generic-filter';

export const genericFilterSchema: FlowJsonSchema = {
  $id: genericFilterSchemaId,
  definitions: {
    filterCondition: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
        },
        operator: {
          type: 'string',
        },
        value: {},
        noValue: {
          type: 'boolean',
        },
      },
      required: ['path'],
      additionalProperties: true,
      allOf: [
        {
          not: {
            required: ['logic'],
          },
        },
        {
          not: {
            required: ['items'],
          },
        },
      ],
    },
    filterGroup: {
      type: 'object',
      properties: {
        logic: {
          type: 'string',
          enum: ['$and', '$or'],
        },
        items: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: `${genericFilterSchemaId}#/definitions/filterCondition` },
              { $ref: `${genericFilterSchemaId}#/definitions/filterGroup` },
            ],
          },
        },
      },
      required: ['logic', 'items'],
      additionalProperties: true,
      allOf: [
        {
          not: {
            required: ['path'],
          },
        },
        {
          not: {
            required: ['operator'],
          },
        },
        {
          not: {
            required: ['value'],
          },
        },
        {
          not: {
            required: ['noValue'],
          },
        },
      ],
    },
  },
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: `${genericFilterSchemaId}#/definitions/filterCondition` },
          { $ref: `${genericFilterSchemaId}#/definitions/filterGroup` },
        ],
      },
    },
  },
  required: ['logic', 'items'],
  additionalProperties: true,
  allOf: [
    {
      not: {
        required: ['path'],
      },
    },
    {
      not: {
        required: ['operator'],
      },
    },
    {
      not: {
        required: ['value'],
      },
    },
    {
      not: {
        required: ['noValue'],
      },
    },
  ],
};

export const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

export const emptyObjectSchema: FlowJsonSchema = {
  type: 'object',
  additionalProperties: false,
};

export const linkageRuleValueSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    value: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  additionalProperties: false,
};

export const layoutParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    layout: {
      type: 'string',
      enum: ['vertical', 'horizontal'],
    },
    labelAlign: {
      type: 'string',
      enum: ['left', 'right'],
    },
    labelWidth: {
      type: ['number', 'string', 'null'] as any,
    },
    labelWrap: {
      type: 'boolean',
    },
    colon: {
      type: 'boolean',
    },
  },
  required: ['layout'],
  additionalProperties: false,
};

export const dataScopeParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    filter: genericFilterSchema,
  },
  additionalProperties: false,
};

export const sortingRuleParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    sort: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          direction: {
            type: 'string',
            enum: ['asc', 'desc'],
          },
        },
        required: ['field', 'direction'],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

export const aclCheckRefreshParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    strategy: {
      type: 'string',
      enum: ['default', 'formItem'],
    },
  },
  additionalProperties: false,
};

export const linkageRulesRefreshParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    actionName: { type: 'string' },
    flowKey: { type: 'string' },
    stepKey: { type: 'string' },
  },
  required: ['actionName', 'flowKey'],
  additionalProperties: false,
};

export const openViewParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    uid: { type: 'string' },
    mode: {
      type: 'string',
      enum: ['drawer', 'dialog', 'embed'],
    },
    size: {
      type: 'string',
      enum: ['small', 'medium', 'large'],
    },
    pageModelClass: {
      type: 'string',
      enum: ['ChildPageModel', 'RootPageModel'],
    },
    filterByTk: { type: ['string', 'number', 'object'] as any },
    sourceId: { type: ['string', 'number'] as any },
    dataSourceKey: { type: 'string' },
    collectionName: { type: 'string' },
    associationName: { type: 'string' },
    preventClose: { type: 'boolean' },
    navigation: { type: 'boolean' },
    tabUid: { type: 'string' },
  },
  additionalProperties: true,
};

export const gridRowsSchema: FlowJsonSchema = {
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

export const gridSizesSchema: FlowJsonSchema = {
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

export const gridRowOrderSchema: FlowJsonSchema = {
  type: 'array',
  description: 'Optional explicit row order. When omitted, the persisted row key order is used.',
  items: {
    type: 'string',
  },
};

export function createGridLayoutStepParamsSchema(): FlowJsonSchema {
  return {
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
  };
}

function createGridLayoutStepParamsValue(
  rows: Record<string, string[][]>,
  sizes: Record<string, number[]>,
  rowOrder: string[],
) {
  return {
    gridSettings: {
      grid: {
        rows,
        sizes,
        rowOrder,
      },
    },
  };
}

function createGridLayoutItems(itemUses: string[], prefix: string, count: number) {
  const uses = itemUses.length > 0 ? itemUses : ['FlowModel'];
  return Array.from({ length: count }, (_, index) => ({
    uid: `${prefix}-item-${index + 1}`,
    use: uses[index % uses.length],
  }));
}

export function createGridLayoutDocs(options: {
  use: string;
  itemUses: string[];
  prefix: string;
  dynamicHints?: FlowDynamicHint[];
}): FlowModelSchemaContribution['docs'] {
  const minimalItems = createGridLayoutItems(options.itemUses, `${options.prefix}-minimal`, 1);
  const standardItems = createGridLayoutItems(options.itemUses, `${options.prefix}-standard`, 5);
  const customSizeItems = createGridLayoutItems(options.itemUses, `${options.prefix}-sizes`, 5);

  const minimalRows = {
    rowMain: [[minimalItems[0].uid]],
  };
  const standardRows = {
    rowTop: [[standardItems[0].uid], [standardItems[1].uid]],
    rowBottom: [[standardItems[2].uid], [standardItems[3].uid], [standardItems[4].uid]],
  };
  const customSizeRows = {
    rowTop: [[customSizeItems[0].uid], [customSizeItems[1].uid]],
    rowBottom: [[customSizeItems[2].uid], [customSizeItems[3].uid], [customSizeItems[4].uid]],
  };

  return {
    minimalExample: {
      uid: `${options.prefix}-grid`,
      use: options.use,
      stepParams: createGridLayoutStepParamsValue(minimalRows, { rowMain: [24] }, ['rowMain']),
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
          stepParams: createGridLayoutStepParamsValue(minimalRows, { rowMain: [24] }, ['rowMain']),
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
            standardRows,
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
            customSizeRows,
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
}

export const publicBlockRootUses = [
  'CreateFormModel',
  'DetailsBlockModel',
  'EditFormModel',
  'FilterFormBlockModel',
  'JSBlockModel',
  'TableBlockModel',
];

export const pageTabUses = ['RootPageTabModel', 'PageTabModel'];

export const tableColumnUses = [
  'TableColumnModel',
  'TableActionsColumnModel',
  'JSColumnModel',
  'TableCustomColumnModel',
];

export const coreBlockGridItemUses = [...publicBlockRootUses];

export const collectionActionUses = [
  'AddNewActionModel',
  'BulkDeleteActionModel',
  'ExpandCollapseActionModel',
  'FilterActionModel',
  'JSCollectionActionModel',
  'LinkActionModel',
  'PopupCollectionActionModel',
  'RefreshActionModel',
];

export const recordActionUses = [
  'AddChildActionModel',
  'DeleteActionModel',
  'EditActionModel',
  'JSRecordActionModel',
  'LinkActionModel',
  'PopupCollectionActionModel',
  'UpdateRecordActionModel',
  'ViewActionModel',
];

export const formBlockActionUses = ['FormSubmitActionModel', 'JSFormActionModel'];

export const filterFormActionUses = [
  'FilterFormSubmitActionModel',
  'FilterFormResetActionModel',
  'FilterFormCollapseActionModel',
  'FilterFormJSActionModel',
];

export const formGridItemUses = ['FormItemModel', 'FormAssociationItemModel', 'JSItemModel'];

export const detailsGridItemUses = ['DetailsItemModel'];

export const filterFormGridItemUses = ['FilterFormItemModel', 'FilterFormCustomFieldModel'];

export const fieldBindingInitSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    dataSourceKey: { type: 'string' },
    collectionName: { type: 'string' },
    fieldPath: { type: 'string' },
    associationPathName: { type: 'string' },
  },
  required: ['dataSourceKey', 'collectionName', 'fieldPath'],
  additionalProperties: true,
};

export const filterFieldMetadataSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    title: { type: 'string' },
    interface: { type: 'string' },
    type: { type: 'string' },
  },
  additionalProperties: true,
};

export function createRuntimeFieldModelSlotSchema(
  fieldBindingContext: string,
  description = 'Field renderer model is resolved from runtime field bindings.',
): FlowSubModelSlotSchema {
  return {
    type: 'object',
    dynamic: true,
    fieldBindingContext,
    schema: genericModelNodeSchema,
    description,
  };
}

export const showLabelStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    showLabel: { type: 'boolean' },
  },
  additionalProperties: false,
};

export const labelStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    title: { type: 'string' },
  },
  additionalProperties: false,
};

export const tooltipStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    tooltip: { type: 'string' },
  },
  additionalProperties: false,
};

export const descriptionStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
  },
  additionalProperties: false,
};

export const defaultValueStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    defaultValue: {},
  },
  additionalProperties: false,
};

export const tableColumnWidthStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    width: {
      type: 'number',
    },
  },
  additionalProperties: false,
};

export const tableColumnEditableStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    editable: { type: 'boolean' },
  },
  additionalProperties: false,
};

export const tableColumnSorterStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    sorter: { type: 'boolean' },
  },
  additionalProperties: false,
};

export const filterFormItemInitStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    filterField: filterFieldMetadataSchema,
    defaultTargetUid: { type: 'string' },
  },
  additionalProperties: true,
};

export const actionButtonGeneralStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    tooltip: { type: 'string' },
    type: {
      type: 'string',
      enum: ['default', 'primary', 'dashed', 'link', 'text'],
    },
    danger: { type: 'boolean' },
    icon: { type: ['string', 'null'] },
    color: { type: 'string' },
  },
  additionalProperties: true,
};

export const actionButtonSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    buttonSettings: {
      type: 'object',
      properties: {
        general: actionButtonGeneralStepParamsSchema,
        linkageRules: linkageRuleValueSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export function createActionStepParamsSchema(extraProperties: Record<string, FlowJsonSchema> = {}): FlowJsonSchema {
  return {
    type: 'object',
    properties: {
      ...(actionButtonSettingsStepParamsSchema.properties || {}),
      ...extraProperties,
    },
    additionalProperties: true,
  };
}

export const confirmStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    enable: { type: 'boolean' },
    title: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
};

export const popupActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    openView: openViewParamsSchema,
  },
  additionalProperties: true,
};

export const runJsActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    runJs: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        code: { type: 'string' },
      },
      required: ['code'],
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const deleteActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    confirm: confirmStepParamsSchema,
  },
  additionalProperties: true,
};

export const refreshActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    refresh: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const expandCollapseActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    expandCollapse: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const filterActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    position: {
      type: 'object',
      properties: {
        position: {
          type: 'string',
          enum: ['left', 'right'],
        },
      },
      additionalProperties: false,
    },
    filterableFieldNames: {
      type: 'object',
      properties: {
        filterableFieldNames: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      additionalProperties: false,
    },
    defaultFilter: {
      type: 'object',
      properties: {
        defaultFilter: genericFilterSchema,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: true,
};

export const linkActionSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    editLink: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        searchParams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
        openInNewWindow: { type: 'boolean' },
      },
      required: ['url'],
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const formSubmitSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    confirm: {
      type: 'object',
      properties: {
        enable: { type: 'boolean' },
        title: { type: 'string' },
        content: { type: 'string' },
      },
      additionalProperties: true,
    },
    saveResource: {
      type: 'object',
      additionalProperties: true,
    },
    refreshAndClose: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const filterFormCollapseSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    toggle: {
      type: 'object',
      properties: {
        collapsedRows: {
          type: 'number',
        },
      },
      additionalProperties: false,
    },
    defaultCollapsed: {
      type: 'object',
      properties: {
        value: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: true,
};

export const pageTabSettingsStepParamsSchema: FlowJsonSchema = {
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
            icon: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const childPageSettingsStepParamsSchema: FlowJsonSchema = {
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
};

export function createPopupActionOpenViewParams(
  overrides: Partial<{
    uid: string;
    mode: 'drawer' | 'dialog' | 'embed';
    size: 'small' | 'medium' | 'large';
    pageModelClass: 'ChildPageModel' | 'RootPageModel';
    filterByTk: string | number;
    sourceId: string | number;
    dataSourceKey: string;
    collectionName: string;
    associationName: string;
    preventClose: boolean;
    navigation: boolean;
    tabUid: string;
  }> = {},
) {
  return {
    mode: 'drawer',
    size: 'medium',
    pageModelClass: 'ChildPageModel' as const,
    ...overrides,
  };
}

export function createPopupBlockGrid(options: { prefix: string; items?: any[] }) {
  return {
    uid: `${options.prefix}-grid`,
    use: 'BlockGridModel',
    subModels: {
      items: options.items || [],
    },
  };
}

export function createPopupChildPageTree(options: { prefix: string; tabTitle?: string; items?: any[] }) {
  return {
    uid: `${options.prefix}-page`,
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
          uid: `${options.prefix}-tab`,
          use: 'ChildPageTabModel',
          stepParams: {
            pageTabSettings: {
              tab: {
                title: options.tabTitle || 'Popup',
              },
            },
          },
          subModels: {
            grid: createPopupBlockGrid({
              prefix: `${options.prefix}-tab`,
              items: options.items,
            }),
          },
        },
      ],
    },
  };
}

export function createPopupPageSlotSchema(): FlowSubModelSlotSchema {
  return {
    type: 'object',
    use: 'ChildPageModel',
    description: 'Popup child page.',
    childSchemaPatch: {
      subModelSlots: {
        tabs: {
          type: 'array',
          uses: ['ChildPageTabModel'],
          required: true,
          minItems: 1,
          description: 'Popup child page tabs.',
        },
      },
    },
  };
}

export const popupActionAntiPatterns = [
  {
    title: 'Do not treat openView parameters alone as a complete popup',
    description:
      'A usable popup action should provide a popup child page tree instead of relying only on runtime defaults.',
  },
  {
    title: 'Do not use arbitrary pageModelClass values',
    description: 'pageModelClass is restricted to ChildPageModel or RootPageModel.',
  },
];

export function createPopupActionStepParams(title: string, overrides: Record<string, any> = {}) {
  return {
    buttonSettings: {
      general: {
        title,
        type: 'default',
      },
    },
    popupSettings: {
      openView: createPopupActionOpenViewParams(overrides),
    },
  };
}

export function createPopupActionExample(options: {
  uid: string;
  use: string;
  title: string;
  prefix: string;
  tabTitle?: string;
  items?: any[];
  openView?: Record<string, any>;
}) {
  return {
    uid: options.uid,
    use: options.use,
    stepParams: createPopupActionStepParams(options.title, options.openView),
    subModels: {
      page: createPopupChildPageTree({
        prefix: options.prefix,
        tabTitle: options.tabTitle,
        items: options.items,
      }),
    },
  };
}

export function createPopupActionPattern(options: {
  title: string;
  description?: string;
  use: string;
  buttonTitle: string;
  prefix: string;
  tabTitle?: string;
  items?: any[];
  openView?: Record<string, any>;
}) {
  return {
    title: options.title,
    description: options.description,
    snippet: {
      use: options.use,
      stepParams: createPopupActionStepParams(options.buttonTitle, options.openView),
      subModels: {
        page: createPopupChildPageTree({
          prefix: options.prefix,
          tabTitle: options.tabTitle,
          items: options.items,
        }),
      },
    },
  };
}

export const detailItemStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    fieldSettings: {
      type: 'object',
      properties: {
        init: fieldBindingInitSchema,
      },
      additionalProperties: true,
    },
    detailItemSettings: {
      type: 'object',
      properties: {
        showLabel: showLabelStepParamsSchema,
        label: labelStepParamsSchema,
        aclCheck: emptyObjectSchema,
        init: emptyObjectSchema,
        tooltip: tooltipStepParamsSchema,
        description: descriptionStepParamsSchema,
        model: {
          type: 'object',
          additionalProperties: true,
        },
        fieldNames: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    paginationChange: {
      type: 'object',
      properties: {
        aclCheckRefresh: aclCheckRefreshParamsSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const formItemStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    fieldSettings: {
      type: 'object',
      properties: {
        init: fieldBindingInitSchema,
      },
      additionalProperties: true,
    },
    editItemSettings: {
      type: 'object',
      properties: {
        showLabel: showLabelStepParamsSchema,
        label: labelStepParamsSchema,
        aclCheck: emptyObjectSchema,
        init: emptyObjectSchema,
        tooltip: tooltipStepParamsSchema,
        description: descriptionStepParamsSchema,
        initialValue: defaultValueStepParamsSchema,
        validation: {
          type: 'object',
          additionalProperties: true,
        },
        required: {
          type: 'object',
          additionalProperties: true,
        },
        model: {
          type: 'object',
          additionalProperties: true,
        },
        pattern: {
          type: 'object',
          additionalProperties: true,
        },
        titleField: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    paginationChange: {
      type: 'object',
      properties: {
        aclCheckRefresh: aclCheckRefreshParamsSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const assignFormItemStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    fieldSettings: {
      type: 'object',
      properties: {
        init: fieldBindingInitSchema,
        assignValue: {
          type: 'object',
          properties: {
            value: {},
          },
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    editItemSettings: {
      type: 'object',
      properties: {
        showLabel: showLabelStepParamsSchema,
        label: labelStepParamsSchema,
        init: emptyObjectSchema,
        tooltip: tooltipStepParamsSchema,
        description: descriptionStepParamsSchema,
        validation: {
          type: 'object',
          additionalProperties: true,
        },
        required: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const filterFormItemStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    fieldSettings: {
      type: 'object',
      properties: {
        init: fieldBindingInitSchema,
      },
      additionalProperties: true,
    },
    filterFormItemSettings: {
      type: 'object',
      properties: {
        init: filterFormItemInitStepParamsSchema,
        label: labelStepParamsSchema,
        showLabel: showLabelStepParamsSchema,
        tooltip: tooltipStepParamsSchema,
        description: descriptionStepParamsSchema,
        initialValue: defaultValueStepParamsSchema,
        model: {
          type: 'object',
          additionalProperties: true,
        },
        connectFields: {
          type: 'object',
          additionalProperties: true,
        },
        defaultOperator: {
          type: 'object',
          additionalProperties: true,
        },
        operatorComponentProps: {
          type: 'object',
          additionalProperties: true,
        },
        customizeFilterRender: {
          type: 'object',
          additionalProperties: true,
        },
        initField: emptyObjectSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const tableColumnStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    fieldSettings: {
      type: 'object',
      properties: {
        init: fieldBindingInitSchema,
      },
      additionalProperties: true,
    },
    tableColumnSettings: {
      type: 'object',
      properties: {
        init: emptyObjectSchema,
        title: {
          type: 'object',
          properties: {
            title: { type: 'string' },
          },
          additionalProperties: false,
        },
        tooltip: tooltipStepParamsSchema,
        width: tableColumnWidthStepParamsSchema,
        aclCheck: emptyObjectSchema,
        quickEdit: tableColumnEditableStepParamsSchema,
        model: {
          type: 'object',
          additionalProperties: true,
        },
        sorter: tableColumnSorterStepParamsSchema,
        fixed: {
          type: 'object',
          additionalProperties: true,
        },
        fieldNames: {
          type: 'object',
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export function createFieldBoundStepParamsSchema(
  bindingFlowKey: string,
  bindingFlowSchema: FlowJsonSchema,
  extraProperties: Record<string, FlowJsonSchema> = {},
): FlowJsonSchema {
  return {
    type: 'object',
    properties: {
      fieldSettings: {
        type: 'object',
        properties: {
          init: fieldBindingInitSchema,
          ...(bindingFlowKey === 'fieldSettings' ? extraProperties : {}),
        },
        additionalProperties: true,
      },
      ...(bindingFlowKey === 'fieldSettings' ? {} : { [bindingFlowKey]: bindingFlowSchema }),
      ...(bindingFlowKey === 'fieldSettings' ? {} : extraProperties),
    },
    additionalProperties: true,
  };
}

export function createRuntimeFieldDynamicHint(
  modelUse: string,
  path: string,
  contextRequirements: string[],
  unresolvedReason: string,
): FlowDynamicHint {
  return {
    kind: 'dynamic-children',
    path,
    message: `${modelUse} field renderer depends on runtime field bindings and collection metadata.`,
    'x-flow': {
      slotRules: {
        slotKey: 'field',
        type: 'object',
      },
      contextRequirements,
      unresolvedReason,
    },
  };
}

export function createFieldModelStepParamsSchema(extraFieldSettingsProperties: Record<string, FlowJsonSchema> = {}) {
  return {
    type: 'object',
    properties: {
      fieldSettings: {
        type: 'object',
        properties: {
          init: fieldBindingInitSchema,
          ...extraFieldSettingsProperties,
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  } as FlowJsonSchema;
}

export function createFieldModelSkeleton(
  use: string,
  init: Partial<{
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    associationPathName: string;
  }> = {},
) {
  return {
    uid: `todo-${use}`.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(),
    use,
    ...(Object.keys(init).length > 0
      ? {
          stepParams: {
            fieldSettings: {
              init: {
                ...init,
              },
            },
          },
        }
      : {}),
  };
}

export function createFieldModelSchemaContribution(options: {
  use: string;
  title?: string;
  source?: 'official' | 'plugin' | 'third-party';
  strict?: boolean;
  exposure?: 'public' | 'internal';
  abstract?: boolean;
  allowDirectUse?: boolean;
  suggestedUses?: string[];
  stepParamsSchema?: FlowJsonSchema;
  skeleton?: any;
}) {
  const contribution: FlowModelSchemaContribution = {
    use: options.use,
    title: options.title,
    source: options.source ?? 'official',
    strict: options.strict ?? false,
    exposure: options.exposure ?? 'internal',
    abstract: options.abstract,
    allowDirectUse: options.allowDirectUse,
    suggestedUses: options.suggestedUses,
    stepParamsSchema: options.stepParamsSchema || createFieldModelStepParamsSchema(),
    skeleton: options.skeleton || createFieldModelSkeleton(options.use),
  };

  return contribution;
}

export const collectionResourceInitSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    dataSourceKey: { type: 'string' },
    collectionName: { type: 'string' },
    associationName: { type: 'string' },
    sourceId: { type: ['string', 'number'] as any },
    filterByTk: { type: ['string', 'number'] as any },
  },
  required: ['dataSourceKey', 'collectionName'],
  additionalProperties: true,
};

export const collectionResourceSettingsStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    resourceSettings: {
      type: 'object',
      properties: {
        init: collectionResourceInitSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export function createCollectionResourceInit(
  init: Partial<{
    dataSourceKey: string;
    collectionName: string;
    associationName: string;
    sourceId: string | number;
    filterByTk: string | number;
  }> = {},
) {
  return {
    dataSourceKey: 'main',
    collectionName: 'users',
    ...init,
  };
}

export function createCollectionResourceStepParams(
  init: Partial<{
    dataSourceKey: string;
    collectionName: string;
    associationName: string;
    sourceId: string | number;
    filterByTk: string | number;
  }> = {},
  extraStepParams: Record<string, any> = {},
) {
  return {
    resourceSettings: {
      init: createCollectionResourceInit(init),
    },
    ...extraStepParams,
  };
}

export function createCurrentRecordCollectionPattern(use: string, extraStepParams: Record<string, any> = {}) {
  return {
    title: 'Current record mode',
    description: 'Bind the block to the current record when the page or popup provides filterByTk.',
    snippet: {
      use,
      stepParams: createCollectionResourceStepParams(
        {
          filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
        },
        extraStepParams,
      ),
    },
  };
}

export function createAssociatedCollectionPattern(use: string, extraStepParams: Record<string, any> = {}) {
  return {
    title: 'Associated records in popup/new scene',
    description: 'Use associationName + sourceId when the block should load records through a parent relation.',
    snippet: {
      use,
      stepParams: createCollectionResourceStepParams(
        {
          collectionName: 'roles',
          associationName: 'users.roles',
          sourceId: '{{ctx.view.inputArgs.sourceId}}',
        },
        extraStepParams,
      ),
    },
  };
}

export const formBlockBaseStepParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    ...(((collectionResourceSettingsStepParamsSchema as any).properties || {}) as Record<string, any>),
    formModelSettings: {
      type: 'object',
      properties: {
        layout: layoutParamsSchema,
        assignRules: linkageRuleValueSchema,
      },
      additionalProperties: true,
    },
    eventSettings: {
      type: 'object',
      properties: {
        linkageRules: linkageRuleValueSchema,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export function createFormGridDynamicHints(): FlowDynamicHint[] {
  return [
    {
      kind: 'dynamic-children',
      path: 'FormGridModel.subModels.items',
      message: 'Form grid items depend on the form field tree and runtime field model factories.',
      'x-flow': {
        slotRules: {
          slotKey: 'items',
          type: 'array',
          allowedUses: formGridItemUses,
        },
        contextRequirements: ['form field tree', 'field model factories'],
        unresolvedReason: 'runtime-form-grid-items',
      },
    },
  ];
}

export function createFormBlockSubModelSlots(): Record<string, FlowSubModelSlotSchema> {
  return {
    grid: {
      type: 'object',
      use: 'FormGridModel',
      description: 'Primary form grid container.',
    },
    actions: {
      type: 'array',
      uses: formBlockActionUses,
      schema: genericModelNodeSchema,
      description: 'Form actions are resolved from the runtime form action registry.',
    },
  };
}

export function createFormBlockSkeleton(use: string) {
  return {
    uid: 'todo-uid',
    use,
    stepParams: createCollectionResourceStepParams(
      {},
      {
        formModelSettings: {
          layout: {
            layout: 'vertical',
            colon: true,
          },
          assignRules: {
            value: [],
          },
        },
        eventSettings: {
          linkageRules: {
            value: [],
          },
        },
      },
    ),
    subModels: {
      grid: {
        uid: 'todo-grid-uid',
        use: 'FormGridModel',
      },
      actions: [],
    },
  };
}

export function createFormBlockMinimalExample(use: string) {
  return {
    uid: `${use}-users`.toLowerCase(),
    use,
    stepParams: createCollectionResourceStepParams(
      {},
      {
        formModelSettings: {
          layout: {
            layout: 'vertical',
            colon: true,
          },
          assignRules: {
            value: [],
          },
        },
        eventSettings: {
          linkageRules: {
            value: [],
          },
        },
      },
    ),
    subModels: {
      grid: {
        uid: `${use}-grid-users`.toLowerCase(),
        use: 'FormGridModel',
      },
      actions: [],
    },
  };
}

export function createFormBlockCommonPatterns(use: string) {
  return [
    {
      title: 'Empty editable form block shell',
      snippet: {
        use,
        stepParams: createCollectionResourceStepParams(
          {},
          {
            formModelSettings: {
              layout: {
                layout: 'vertical',
                colon: true,
              },
            },
          },
        ),
        subModels: {
          grid: {
            uid: 'form-grid-uid',
            use: 'FormGridModel',
          },
        },
      },
    },
  ];
}

export const formBlockAntiPatterns = [
  {
    title: 'Do not omit grid when generating a complete form tree',
    description: 'A form block can be persisted without subModels, but useful form payloads usually need a grid child.',
  },
];

export function createFormBlockDynamicHints(use: string): FlowDynamicHint[] {
  return [
    {
      kind: 'dynamic-children',
      path: `${use}.subModels`,
      message: 'Form block child models are assembled from runtime model classes and field metadata.',
      'x-flow': {
        slotRules: {
          slotKey: 'actions',
          type: 'array',
          allowedUses: formBlockActionUses,
        },
        contextRequirements: ['form field tree', 'collection metadata'],
        unresolvedReason: 'runtime-form-children',
      },
    },
  ];
}
