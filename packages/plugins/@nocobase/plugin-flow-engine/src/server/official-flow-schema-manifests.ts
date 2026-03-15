/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaManifest, FlowJsonSchema, FlowModelSchemaManifest } from '@nocobase/flow-engine';

const genericFilterSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
};

const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

const emptyObjectSchema: FlowJsonSchema = {
  type: 'object',
  additionalProperties: false,
};

const linkageRuleValueSchema: FlowJsonSchema = {
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

const layoutParamsSchema: FlowJsonSchema = {
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

const dataScopeParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    filter: genericFilterSchema,
  },
  additionalProperties: false,
};

const sortingRuleParamsSchema: FlowJsonSchema = {
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

const aclCheckRefreshParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    strategy: {
      type: 'string',
      enum: ['default', 'formItem'],
    },
  },
  additionalProperties: false,
};

const linkageRulesRefreshParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    actionName: { type: 'string' },
    flowKey: { type: 'string' },
    stepKey: { type: 'string' },
  },
  required: ['actionName', 'flowKey'],
  additionalProperties: false,
};

const openViewParamsSchema: FlowJsonSchema = {
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
    pageModelClass: { type: 'string' },
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

export const officialFlowActionSchemaManifests: FlowActionSchemaManifest[] = [
  {
    name: 'layout',
    title: 'Set block layout',
    source: 'official',
    strict: false,
    paramsSchema: layoutParamsSchema,
    docs: {
      minimalExample: {
        layout: 'vertical',
        colon: true,
      },
      commonPatterns: [
        {
          title: 'Vertical form layout',
          snippet: {
            layout: 'vertical',
            colon: true,
          },
        },
        {
          title: 'Horizontal form layout',
          snippet: {
            layout: 'horizontal',
            labelAlign: 'left',
            labelWidth: 120,
            labelWrap: true,
            colon: true,
          },
        },
      ],
    },
  },
  {
    name: 'dataScope',
    title: 'Data scope',
    source: 'official',
    strict: false,
    paramsSchema: dataScopeParamsSchema,
    docs: {
      minimalExample: {
        filter: {
          logic: '$and',
          items: [],
        },
      },
      commonPatterns: [
        {
          title: 'Empty filter group',
          snippet: {
            filter: {
              logic: '$and',
              items: [],
            },
          },
        },
      ],
      dynamicHints: [
        {
          kind: 'custom-component',
          path: 'actions.dataScope.filter',
          message: 'Filter builder depends on runtime collection metadata.',
          'x-flow': {
            contextRequirements: ['collection metadata', 'variable filter tree'],
            unresolvedReason: 'runtime-filter-builder',
            recommendedFallback: {
              filter: {
                logic: '$and',
                items: [],
              },
            },
          },
        },
      ],
    },
  },
  {
    name: 'sortingRule',
    title: 'Default sorting',
    source: 'official',
    strict: false,
    paramsSchema: sortingRuleParamsSchema,
    docs: {
      minimalExample: {
        sort: [],
      },
      commonPatterns: [
        {
          title: 'Sort by createdAt descending',
          snippet: {
            sort: [{ field: 'createdAt', direction: 'desc' }],
          },
        },
      ],
      dynamicHints: [
        {
          kind: 'dynamic-ui-schema',
          path: 'actions.sortingRule.sort[*].field',
          message: 'Sortable field candidates depend on the current collection.',
          'x-flow': {
            contextRequirements: ['collection fields', 'sortable interfaces'],
            unresolvedReason: 'runtime-sort-field-options',
          },
        },
      ],
    },
  },
  {
    name: 'formAssignRules',
    title: 'Field values',
    source: 'official',
    strict: false,
    paramsSchema: linkageRuleValueSchema,
    docs: {
      minimalExample: {
        value: [],
      },
      dynamicHints: [
        {
          kind: 'custom-component',
          path: 'actions.formAssignRules.value',
          message: 'Assign rule items depend on the current form field tree.',
          'x-flow': {
            contextRequirements: ['form field tree', 'collection metadata'],
            unresolvedReason: 'runtime-field-assign-rules',
            recommendedFallback: {
              value: [],
            },
          },
        },
      ],
    },
  },
  {
    name: 'fieldLinkageRules',
    title: 'Field linkage rules',
    source: 'official',
    strict: false,
    paramsSchema: linkageRuleValueSchema,
    docs: {
      minimalExample: {
        value: [],
      },
      dynamicHints: [
        {
          kind: 'custom-component',
          path: 'actions.fieldLinkageRules.value',
          message: 'Linkage rule actions depend on current scene and field metadata.',
          'x-flow': {
            contextRequirements: ['action scene', 'field metadata'],
            unresolvedReason: 'runtime-linkage-rules',
            recommendedFallback: {
              value: [],
            },
          },
        },
      ],
    },
  },
  {
    name: 'actionLinkageRules',
    title: 'Linkage rules',
    source: 'official',
    strict: false,
    paramsSchema: linkageRuleValueSchema,
    docs: {
      minimalExample: {
        value: [],
      },
    },
  },
  {
    name: 'aclCheck',
    title: 'ACL check',
    source: 'official',
    strict: false,
    paramsSchema: emptyObjectSchema,
    docs: {
      minimalExample: {},
    },
  },
  {
    name: 'aclCheckRefresh',
    title: 'ACL check refresh',
    source: 'official',
    strict: false,
    paramsSchema: aclCheckRefreshParamsSchema,
    docs: {
      minimalExample: {},
    },
  },
  {
    name: 'linkageRulesRefresh',
    title: 'Linkage rules refresh',
    source: 'official',
    strict: false,
    paramsSchema: linkageRulesRefreshParamsSchema,
    docs: {
      minimalExample: {
        actionName: 'actionLinkageRules',
        flowKey: 'buttonSettings',
        stepKey: 'linkageRules',
      },
    },
  },
  {
    name: 'openView',
    title: 'Edit popup',
    source: 'official',
    strict: false,
    paramsSchema: openViewParamsSchema,
    docs: {
      minimalExample: {
        mode: 'drawer',
        size: 'medium',
        pageModelClass: 'RootPageModel',
      },
      commonPatterns: [
        {
          title: 'Open a popup page in drawer mode',
          snippet: {
            mode: 'drawer',
            size: 'medium',
            pageModelClass: 'RootPageModel',
          },
        },
      ],
    },
  },
];

export const officialFlowModelSchemaManifests: FlowModelSchemaManifest[] = [
  {
    use: 'ActionModel',
    title: 'Action',
    source: 'official',
    strict: false,
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        tooltip: { type: 'string' },
        type: {
          type: 'string',
          enum: ['default', 'primary', 'dashed', 'link', 'text'],
        },
        danger: { type: 'boolean' },
        icon: { type: 'string' },
        color: { type: 'string' },
      },
      additionalProperties: true,
    },
    stepParamsSchema: {
      type: 'object',
      properties: {
        buttonSettings: {
          type: 'object',
          properties: {
            general: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                tooltip: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['default', 'primary', 'dashed', 'link', 'text'],
                },
                danger: { type: 'boolean' },
                icon: { type: 'string' },
                color: { type: 'string' },
              },
              additionalProperties: false,
            },
            linkageRules: linkageRuleValueSchema,
          },
          additionalProperties: true,
        },
        buttonAclSettings: {
          type: 'object',
          properties: {
            aclCheck: emptyObjectSchema,
          },
          additionalProperties: true,
        },
        paginationChange: {
          type: 'object',
          properties: {
            aclCheckRefresh: aclCheckRefreshParamsSchema,
            linkageRulesRefresh: linkageRulesRefreshParamsSchema,
          },
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    flowRegistrySchema: {
      type: 'object',
      properties: {
        buttonSettings: {
          type: 'object',
          properties: {
            key: { const: 'buttonSettings' },
            steps: {
              type: 'object',
              properties: {
                general: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                  },
                  additionalProperties: true,
                },
                linkageRules: {
                  type: 'object',
                  properties: {
                    use: { const: 'actionLinkageRules' },
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
      use: 'ActionModel',
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Action',
            type: 'default',
            danger: false,
          },
          linkageRules: {
            value: [],
          },
        },
      },
    },
    docs: {
      minimalExample: {
        uid: 'action-primary-save',
        use: 'ActionModel',
        props: {
          title: 'Save',
          type: 'primary',
        },
        stepParams: {
          buttonSettings: {
            general: {
              title: 'Save',
              type: 'primary',
              danger: false,
            },
            linkageRules: {
              value: [],
            },
          },
        },
      },
      commonPatterns: [
        {
          title: 'Primary submit action',
          snippet: {
            props: {
              title: 'Save',
              type: 'primary',
            },
            stepParams: {
              buttonSettings: {
                general: {
                  title: 'Save',
                  type: 'primary',
                },
              },
            },
          },
        },
        {
          title: 'Danger action',
          snippet: {
            props: {
              title: 'Delete',
              danger: true,
            },
            stepParams: {
              buttonSettings: {
                general: {
                  title: 'Delete',
                  danger: true,
                },
              },
            },
          },
        },
      ],
      antiPatterns: [
        {
          title: 'Do not depend on hidden dynamic fields',
          description:
            'buttonSettings.general fields are gated by model flags such as enableEditIcon / enableEditColor.',
        },
      ],
      dynamicHints: [
        {
          kind: 'dynamic-ui-schema',
          path: 'ActionModel.buttonSettings.general',
          message: 'Editable fields depend on ActionModel runtime flags such as enableEditTitle and enableEditIcon.',
          'x-flow': {
            contextRequirements: ['enableEditTitle', 'enableEditTooltip', 'enableEditIcon', 'enableEditColor'],
            unresolvedReason: 'runtime-action-editability-flags',
            recommendedFallback: {
              title: 'Action',
              type: 'default',
              danger: false,
            },
          },
        },
      ],
    },
  },
  {
    use: 'FormBlockModel',
    title: 'Form block',
    source: 'official',
    strict: false,
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        layout: {
          type: 'string',
          enum: ['vertical', 'horizontal'],
        },
        labelAlign: {
          type: 'string',
          enum: ['left', 'right'],
        },
        labelWidth: { type: ['number', 'string', 'null'] as any },
        colon: { type: 'boolean' },
      },
      additionalProperties: true,
    },
    subModelSlots: {
      grid: {
        type: 'object',
        schema: genericModelNodeSchema,
        description: 'Primary form grid container.',
      },
      actions: {
        type: 'array',
        schema: genericModelNodeSchema,
        uses: ['FormActionGroupModel', 'ActionModel'],
        description: 'Form action groups or action models.',
      },
    },
    stepParamsSchema: {
      type: 'object',
      properties: {
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
    },
    skeleton: {
      uid: 'todo-uid',
      use: 'FormBlockModel',
      stepParams: {
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
      subModels: {
        grid: {
          uid: 'todo-grid-uid',
          use: 'FormGridModel',
        },
        actions: [],
      },
    },
    docs: {
      minimalExample: {
        uid: 'form-block-users-edit',
        use: 'FormBlockModel',
        stepParams: {
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
        subModels: {
          grid: {
            uid: 'form-grid-users-edit',
            use: 'FormGridModel',
          },
          actions: [],
        },
      },
      commonPatterns: [
        {
          title: 'Empty editable form block shell',
          snippet: {
            stepParams: {
              formModelSettings: {
                layout: {
                  layout: 'vertical',
                  colon: true,
                },
              },
            },
            subModels: {
              grid: {
                uid: 'form-grid-uid',
                use: 'FormGridModel',
              },
            },
          },
        },
      ],
      antiPatterns: [
        {
          title: 'Do not omit grid when generating a complete form tree',
          description:
            'A form block can be persisted without subModels, but useful form payloads usually need a grid child.',
        },
      ],
      dynamicHints: [
        {
          kind: 'dynamic-children',
          path: 'FormBlockModel.subModels',
          message: 'Form block child models are assembled from runtime model classes and field metadata.',
          'x-flow': {
            slotRules: {
              slotKey: 'actions',
              type: 'array',
              allowedUses: ['FormActionGroupModel', 'ActionModel'],
            },
            contextRequirements: ['form field tree', 'collection metadata'],
            unresolvedReason: 'runtime-form-children',
          },
        },
      ],
    },
  },
  {
    use: 'TableBlockModel',
    title: 'Table block',
    source: 'official',
    strict: false,
    propsSchema: {
      type: 'object',
      properties: {
        editable: { type: 'boolean' },
        showIndex: { type: 'boolean' },
        pageSize: { type: 'number' },
        treeTable: { type: 'boolean' },
        defaultExpandAllRows: { type: 'boolean' },
        size: {
          type: 'string',
          enum: ['large', 'middle', 'small'],
        },
      },
      additionalProperties: true,
    },
    subModelSlots: {
      columns: {
        type: 'array',
        schema: genericModelNodeSchema,
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
  },
  {
    use: 'PageModel',
    title: 'Page',
    source: 'official',
    strict: false,
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        displayTitle: { type: 'boolean' },
        enableTabs: { type: 'boolean' },
        documentTitle: { type: 'string' },
      },
      additionalProperties: true,
    },
    subModelSlots: {
      tabs: {
        type: 'array',
        schema: genericModelNodeSchema,
        uses: ['BasePageTabModel', 'RootPageTabModel', 'PageTabModel'],
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
              allowedUses: ['BasePageTabModel', 'RootPageTabModel', 'PageTabModel'],
            },
            contextRequirements: ['route context', 'page tab model class'],
            unresolvedReason: 'runtime-page-tabs',
          },
        },
      ],
    },
  },
];
