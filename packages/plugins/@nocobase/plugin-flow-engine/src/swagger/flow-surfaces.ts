/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FLOW_SURFACES_ACTION_METHODS,
  FLOW_SURFACES_ACTION_NAMES,
  type FlowSurfacesActionName,
} from '../server/flow-surfaces/constants';

const FLOW_SURFACES_TAG = 'flowSurfaces';
const ANY_OBJECT_SCHEMA = {
  type: 'object',
  additionalProperties: true,
};
const FILTER_GROUP_EXAMPLE = {
  logic: '$and',
  items: [],
};
const STRING_OR_INTEGER_SCHEMA = {
  oneOf: [{ type: 'string' }, { type: 'integer' }],
};

function ref(name: string) {
  return {
    $ref: `#/components/schemas/${name}`,
  };
}

function parameterRef(name: string) {
  return {
    $ref: `#/components/parameters/${name}`,
  };
}

function dataEnvelope(schema: Record<string, any>) {
  return {
    type: 'object',
    required: ['data'],
    properties: {
      data: schema,
    },
  };
}

function jsonContent(schema: Record<string, any>, example?: Record<string, any>) {
  return {
    'application/json': {
      schema,
      ...(example ? { example } : {}),
    },
  };
}

function requestBody(schemaName: string, example?: Record<string, any>, description?: string) {
  return {
    required: true,
    ...(description ? { description } : {}),
    content: jsonContent(ref(schemaName), example),
  };
}

function responses(schemaName: string, includeValidationError = true) {
  return {
    200: {
      description: 'OK',
      content: jsonContent(dataEnvelope(ref(schemaName))),
    },
    ...(includeValidationError
      ? {
          500: {
            description: 'Business validation error',
            content: jsonContent(ref('FlowSurfaceErrorResponse')),
          },
        }
      : {}),
  };
}

function valuesCompatibilityNote(description: string) {
  return [
    description,
    '',
    'SDK 兼容说明：`resource("flowSurfaces").action({ values: payload })` 仍可用。',
    '本 Swagger 文档中的 request schema 描述的是最终业务 payload，而不是 SDK 外层的 `values` 包装。',
  ].join('\n');
}

const examples = {
  catalog: {
    target: {
      uid: 'table-block-uid',
    },
  },
  compose: {
    target: {
      uid: 'page-grid-uid',
    },
    mode: 'append',
    blocks: [
      {
        key: 'filter',
        type: 'filterForm',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
        fields: [
          {
            fieldPath: 'username',
            target: 'table',
          },
          {
            fieldPath: 'nickname',
            target: 'table',
          },
        ],
        actions: ['submit', 'reset'],
      },
      {
        key: 'table',
        type: 'table',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
        fields: ['username', 'nickname', { fieldPath: 'roles.title' }],
        actions: ['addNew', 'view', 'edit', 'delete'],
      },
    ],
    layout: {
      rows: [
        [
          {
            key: 'filter',
            span: 3,
          },
          {
            key: 'table',
            span: 7,
          },
        ],
      ],
    },
  },
  composeStatic: {
    target: {
      uid: 'page-grid-uid',
    },
    blocks: [
      {
        key: 'markdown',
        type: 'markdown',
        settings: {
          content: '# Team handbook',
        },
      },
      {
        key: 'iframe',
        type: 'iframe',
        settings: {
          mode: 'url',
          url: 'https://example.com/embed',
          height: 360,
        },
      },
      {
        key: 'panel',
        type: 'actionPanel',
        settings: {
          layout: 'list',
          ellipsis: false,
        },
      },
    ],
    layout: {
      rows: [['markdown', 'iframe'], ['panel']],
    },
  },
  composeListRich: {
    target: {
      uid: 'page-grid-uid',
    },
    blocks: [
      {
        key: 'employeesList',
        type: 'list',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        fields: [
          'nickname',
          {
            fieldPath: 'department.name',
          },
        ],
        actions: ['addNew', 'refresh'],
        recordActions: [
          'view',
          'edit',
          {
            type: 'popup',
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'details',
                  type: 'details',
                  resource: {
                    dataSourceKey: 'main',
                    collectionName: 'employees',
                  },
                  fields: ['nickname'],
                },
              ],
            },
          },
          'delete',
        ],
        settings: {
          pageSize: 20,
          layout: 'vertical',
        },
      },
    ],
  },
  composeGridCardRich: {
    target: {
      uid: 'page-grid-uid',
    },
    blocks: [
      {
        key: 'employeeCards',
        type: 'gridCard',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        fields: [
          'nickname',
          {
            fieldPath: 'department.name',
          },
        ],
        actions: ['addNew', 'refresh'],
        recordActions: ['view', 'edit', 'updateRecord', 'delete'],
        settings: {
          columns: 3,
          rowCount: 2,
          layout: 'vertical',
        },
      },
    ],
  },
  composeJsBlock: {
    target: {
      uid: 'page-grid-uid',
    },
    blocks: [
      {
        key: 'customHero',
        type: 'jsBlock',
        settings: {
          title: 'Custom hero',
          description: 'Rendered by JS block runtime',
          className: 'hero-shell',
          version: '1.0.0',
          code: "return { type: 'div', children: ['Hello from JS block'] };",
        },
      },
    ],
  },
  configure: {
    target: {
      uid: 'details-field-uid',
    },
    changes: {
      clickToOpen: true,
      openView: {
        dataSourceKey: 'main',
        collectionName: 'departments',
        associationName: 'users.department',
        mode: 'drawer',
      },
    },
  },
  configureRelationPopup: {
    target: {
      uid: 'roles-field-wrapper-uid',
    },
    changes: {
      clickToOpen: true,
      openView: {
        dataSourceKey: 'main',
        collectionName: 'roles',
        mode: 'drawer',
      },
    },
  },
  configureBlock: {
    target: {
      uid: 'list-block-uid',
    },
    changes: {
      pageSize: 50,
      dataScope: {
        logic: '$and',
        items: [
          {
            path: 'nickname',
            operator: '$eq',
            value: 'beta',
          },
        ],
      },
      sorting: [
        {
          field: 'username',
          direction: 'asc',
        },
      ],
      layout: 'vertical',
    },
  },
  configureAction: {
    target: {
      uid: 'update-record-action-uid',
    },
    changes: {
      title: 'Quick update',
      type: 'primary',
      color: 'gold',
      htmlType: 'button',
      position: 'end',
      confirm: {
        enable: true,
        title: 'Confirm update',
        content: 'Apply assigned values?',
      },
      assignValues: {
        status: 'active',
      },
    },
  },
  configureJsBlock: {
    target: {
      uid: 'js-block-uid',
    },
    changes: {
      title: 'Users hero',
      description: 'Rendered from FlowSurfaces configure',
      className: 'users-hero',
      version: '1.0.1',
      code: "return { type: 'div', children: ['Users hero'] };",
    },
  },
  configureJsAction: {
    target: {
      uid: 'js-action-uid',
    },
    changes: {
      title: 'Run diagnostics',
      type: 'primary',
      version: '1.0.1',
      code: 'await ctx.runjs(\'console.log("diagnostics")\');',
    },
  },
  configureJsField: {
    target: {
      uid: 'js-field-wrapper-uid',
    },
    changes: {
      label: 'Custom renderer',
      version: '1.0.1',
      code: "return record.nickname?.toUpperCase?.() || '';",
    },
  },
  configureJsColumn: {
    target: {
      uid: 'js-column-uid',
    },
    changes: {
      title: 'JS column',
      width: 240,
      fixed: 'left',
      version: '1.0.1',
      code: 'return record.username;',
    },
  },
  configureJsItem: {
    target: {
      uid: 'js-item-uid',
    },
    changes: {
      label: 'JS item',
      showLabel: true,
      labelWidth: 120,
      version: '1.0.1',
      code: 'return record.nickname;',
    },
  },
  createPage: {
    title: 'Employees',
    tabTitle: 'Overview',
    enableTabs: true,
    displayTitle: true,
    documentTitle: 'Employees workspace',
    tabDocumentTitle: 'Employees overview',
  },
  addTab: {
    target: {
      pageSchemaUid: 'employees-page-schema',
    },
    title: 'Details',
    icon: 'TableOutlined',
    documentTitle: 'Employee details tab',
  },
  updateTab: {
    target: {
      tabSchemaUid: 'details-tab-schema',
    },
    title: 'Details',
    icon: 'TableOutlined',
    documentTitle: 'Employee details tab',
    flowRegistry: {
      beforeRenderApply: {
        key: 'beforeRenderApply',
        on: 'beforeRender',
        steps: {},
      },
    },
  },
  addBlock: {
    target: {
      uid: 'roles-field-uid',
    },
    type: 'details',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'roles',
    },
  },
  addJsBlock: {
    target: {
      uid: 'page-grid-uid',
    },
    type: 'jsBlock',
    decoratorProps: {
      title: 'Users banner',
      description: 'Custom JS rendered banner',
    },
    stepParams: {
      jsSettings: {
        runJs: {
          version: '1.0.0',
          code: "return { type: 'div', children: ['Users banner'] };",
        },
      },
    },
  },
  addField: {
    target: {
      uid: 'create-form-block-uid',
    },
    fieldPath: 'nickname',
    renderer: 'js',
  },
  addRelationField: {
    target: {
      uid: 'table-block-uid',
    },
    fieldPath: 'title',
    associationPathName: 'department',
  },
  addJsColumn: {
    target: {
      uid: 'table-block-uid',
    },
    type: 'jsColumn',
    props: {
      title: 'Runtime column',
      width: 240,
    },
    stepParams: {
      jsSettings: {
        runJs: {
          version: '1.0.0',
          code: 'return record.nickname;',
        },
      },
    },
  },
  addJsItem: {
    target: {
      uid: 'create-form-grid-uid',
    },
    type: 'jsItem',
    props: {
      label: 'Runtime item',
      showLabel: true,
    },
    stepParams: {
      jsSettings: {
        runJs: {
          version: '1.0.0',
          code: 'return record.nickname;',
        },
      },
    },
  },
  addAction: {
    target: {
      uid: 'table-actions-column-uid',
    },
    type: 'view',
    props: {
      title: 'View',
    },
  },
  addJsAction: {
    target: {
      uid: 'action-panel-uid',
    },
    type: 'js',
    props: {
      title: 'Run JS',
      type: 'primary',
    },
    stepParams: {
      clickSettings: {
        runJs: {
          version: '1.0.0',
          code: 'return await ctx.runjs(\'console.log("hello")\');',
        },
      },
    },
  },
  updateSettings: {
    target: {
      uid: 'table-block-uid',
    },
    stepParams: {
      tableSettings: {
        pageSize: {
          pageSize: 50,
        },
        tableDensity: {
          size: 'middle',
        },
      },
    },
    flowRegistry: {
      beforeRenderApply: {
        key: 'beforeRenderApply',
        on: 'beforeRender',
        steps: {},
      },
    },
  },
  setEventFlows: {
    target: {
      uid: 'view-action-uid',
    },
    flowRegistry: {
      popupSettings: {
        key: 'popupSettings',
        on: 'click',
        steps: {
          openView: {
            params: {
              title: 'Employee details',
              size: 'large',
            },
          },
        },
      },
    },
  },
  setLayout: {
    target: {
      uid: 'page-grid-uid',
    },
    rows: {
      row1: [['block-a'], ['block-b']],
    },
    sizes: {
      row1: [12, 12],
    },
    rowOrder: ['row1'],
  },
  moveNode: {
    sourceUid: 'block-b',
    targetUid: 'block-a',
    position: 'before',
  },
  removeNode: {
    target: {
      uid: 'obsolete-block-uid',
    },
  },
  mutate: {
    atomic: true,
    ops: [
      {
        opId: 'page',
        type: 'createPage',
        values: {
          pageSchemaUid: 'employee-page',
          tabSchemaUid: 'employee-main-tab',
          title: 'Employees',
          tabTitle: 'Overview',
        },
      },
      {
        opId: 'table',
        type: 'addBlock',
        values: {
          target: {
            uid: {
              $ref: 'page.tabSchemaUid',
            },
          },
          type: 'table',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      },
      {
        type: 'addField',
        values: {
          target: {
            uid: {
              $ref: 'table.uid',
            },
          },
          fieldPath: 'nickname',
        },
      },
    ],
  },
  apply: {
    target: {
      uid: 'page-grid-uid',
    },
    mode: 'replace',
    spec: {
      subModels: {
        items: [
          {
            clientKey: 'table-a',
            use: 'TableBlockModel',
            stepParams: {
              resourceSettings: {
                init: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
              },
            },
          },
          {
            clientKey: 'markdown-a',
            use: 'MarkdownBlockModel',
            props: {
              content: 'Employee handbook',
            },
          },
        ],
      },
    },
  },
  getPopupQuery: {
    uid: 'view-action-uid',
  },
};

const actionDocs: Record<FlowSurfacesActionName, any> = {
  catalog: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'List capabilities available in the current surface context',
    description: valuesCompatibilityNote(
      '返回当前 target 上下文下可创建的 block / field / action 能力，以及当前节点可编辑的 settings contract、事件能力和布局能力。',
    ),
    requestBody: requestBody('FlowSurfaceCatalogRequest', examples.catalog),
    responses: responses('FlowSurfaceCatalogResponse'),
  },
  get: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Read normalized surface tree and route metadata',
    description: [
      '读取标准化后的 Flow surface 读回结果，作为 CLI / 编排工具的稳定读口。',
      '',
      'target 使用 query 参数表达；以下 4 个字段共同组成定位器。',
      '',
      `示例：GET /api/flowSurfaces:get?uid=${examples.getPopupQuery.uid}`,
    ].join('\n'),
    parameters: [
      parameterRef('flowSurfaceTargetUid'),
      parameterRef('flowSurfaceTargetPageSchemaUid'),
      parameterRef('flowSurfaceTargetTabSchemaUid'),
      parameterRef('flowSurfaceTargetRouteId'),
    ],
    responses: responses('FlowSurfaceGetResponse'),
  },
  compose: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Compose blocks, fields, actions and simple layout under an existing surface',
    description: valuesCompatibilityNote(
      '在已有 page/tab/grid/popup 下按公开 block/action/field 语义组织内容。适合作为 AI 的首选创建入口，不需要调用方传 raw `use`、`fieldUse` 或 `stepParams`。',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceComposeRequest'),
          examples: {
            filterTable: {
              summary: 'Compose a filter-form and table with a simple 3:7 row layout',
              value: examples.compose,
            },
            staticBlocks: {
              summary: 'Compose markdown, iframe and action-panel blocks with simple settings',
              value: examples.composeStatic,
            },
            listRich: {
              summary: 'Compose a list block with item fields, block actions and record actions',
              value: examples.composeListRich,
            },
            gridCardRich: {
              summary: 'Compose a grid-card block with item fields, block actions and record actions',
              value: examples.composeGridCardRich,
            },
            jsBlock: {
              summary: 'Compose a JS block with simple code/version/title settings',
              value: examples.composeJsBlock,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceComposeResult'),
  },
  configure: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Apply simple semantic changes to a page, tab, block, field or action',
    description: valuesCompatibilityNote(
      '用简单 `changes` 修改高频配置，例如 page/tab 标题、table pageSize、字段 clickToOpen、action openView/confirm，而不要求调用方知道内部 path。',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceConfigureRequest'),
          examples: {
            fieldOpenView: {
              summary: 'Configure a field to click and open a popup view',
              value: examples.configure,
            },
            relationFieldPopup: {
              summary: 'Configure a to-many relation display field to open the clicked related record in a popup',
              value: examples.configureRelationPopup,
            },
            blockSettings: {
              summary: 'Configure a list block with simple pageSize/dataScope/sorting/layout changes',
              value: examples.configureBlock,
            },
            actionSettings: {
              summary: 'Configure an action with button appearance, confirm dialog and assign values',
              value: examples.configureAction,
            },
            jsBlockSettings: {
              summary: 'Configure a JS block with decorator props and runJs code/version',
              value: examples.configureJsBlock,
            },
            jsActionSettings: {
              summary: 'Configure a JS action with button text and runJs code/version',
              value: examples.configureJsAction,
            },
            jsFieldSettings: {
              summary: 'Configure a JS field wrapper and inner JS field with code/version',
              value: examples.configureJsField,
            },
            jsColumnSettings: {
              summary: 'Configure a JS column with width/fixed/code/version',
              value: examples.configureJsColumn,
            },
            jsItemSettings: {
              summary: 'Configure a JS item with label and runJs code/version',
              value: examples.configureJsItem,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceConfigureResult'),
  },
  createPage: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Create a modern top-level page',
    description: valuesCompatibilityNote(
      '创建 modern page(v2)，同时写入 page route、默认 tab route、RootPageModel anchor 和默认 BlockGridModel。',
    ),
    requestBody: requestBody('FlowSurfaceCreatePageRequest', examples.createPage),
    responses: responses('FlowSurfaceCreatePageResult'),
  },
  destroyPage: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Destroy a modern page and its anchors',
    description: valuesCompatibilityNote('删除 page route、tab route 和对应的 FlowModel subtree。'),
    requestBody: requestBody('FlowSurfaceDestroyPageRequest', {
      pageSchemaUid: 'employees-page-schema',
    }),
    responses: responses('FlowSurfaceDestroyPageResult'),
  },
  addTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a tab under a page',
    description: valuesCompatibilityNote('在 page 下新增 route-backed tab，并补齐对应 grid anchor。'),
    requestBody: requestBody('FlowSurfaceAddTabRequest', examples.addTab),
    responses: responses('FlowSurfaceAddTabResult'),
  },
  updateTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Update tab title, icon, document title and flow registry',
    description: valuesCompatibilityNote('修改 tab route 与对应 synthetic RootPageTabModel 的 route-backed 字段。'),
    requestBody: requestBody('FlowSurfaceUpdateTabRequest', examples.updateTab),
    responses: responses('FlowSurfaceUpdateTabResult'),
  },
  moveTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Reorder sibling tabs under the same page',
    description: valuesCompatibilityNote('调整同一 page 下 tab 的排序。'),
    requestBody: requestBody('FlowSurfaceMoveTabRequest', {
      sourceTabSchemaUid: 'details-tab',
      targetTabSchemaUid: 'overview-tab',
      position: 'before',
    }),
    responses: responses('FlowSurfaceMoveTabResult'),
  },
  removeTab: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Remove a tab route and its anchor tree',
    description: valuesCompatibilityNote('删除 tab route 及对应 FlowModel subtree。'),
    requestBody: requestBody('FlowSurfaceRemoveTabRequest', {
      tabSchemaUid: 'details-tab',
    }),
    responses: responses('FlowSurfaceRemoveTabResult'),
  },
  addBlock: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a block under a surface or grid container',
    description: valuesCompatibilityNote(
      '按 catalog key 或显式支持的 block use 创建 block；对于 popup-capable 宿主节点会自动补齐 popup shell。',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddBlockRequest'),
          examples: {
            popupDetails: {
              summary: 'Create a details block under a popup-capable host node',
              value: examples.addBlock,
            },
            jsBlock: {
              summary: 'Create a JS block directly under a page/tab/grid container',
              value: examples.addJsBlock,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddBlockResult'),
  },
  addField: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add a field wrapper and inner field under a field container',
    description: valuesCompatibilityNote(
      '根据容器 use 和字段 interface 自动推导 wrapper/inner field 组合；`fieldUse` 仅作为兼容校验值，不再作为任意创建入口。',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddFieldRequest'),
          examples: {
            directField: {
              summary: 'Create a JS renderer bound field under a create form',
              value: examples.addField,
            },
            relationField: {
              summary: 'Create a relation-path field under a table block',
              value: examples.addRelationField,
            },
            jsColumn: {
              summary: 'Create a standalone JS column under a table field container',
              value: examples.addJsColumn,
            },
            jsItem: {
              summary: 'Create a standalone JS item under a form field container',
              value: examples.addJsItem,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddFieldResult'),
  },
  addAction: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Add an action under an allowed action container',
    description: valuesCompatibilityNote(
      '只允许创建 catalog 中公开且当前容器可见的 action。典型场景包括 table row action、form submit、filter-form reset。',
    ),
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: ref('FlowSurfaceAddActionRequest'),
          examples: {
            view: {
              summary: 'Create a normal view action under a table row action container',
              value: examples.addAction,
            },
            js: {
              summary: 'Create a JS action under an action-panel container',
              value: examples.addJsAction,
            },
          },
        },
      },
    },
    responses: responses('FlowSurfaceAddActionResult'),
  },
  updateSettings: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Update controlled props, decoratorProps, stepParams or flowRegistry',
    description: valuesCompatibilityNote(
      '按 catalog 暴露的 path-level contract 修改指定 domain；不会接受任意原始树字段 patch。',
    ),
    requestBody: requestBody('FlowSurfaceUpdateSettingsRequest', examples.updateSettings),
    responses: responses('FlowSurfaceUpdateSettingsResult'),
  },
  setEventFlows: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace instance-level event flow definitions on a node',
    description: valuesCompatibilityNote(
      '全量替换当前节点的实例级 event flow；服务端会校验 eventName、flowKey、stepKey 与节点上下文是否合法。',
    ),
    requestBody: requestBody('FlowSurfaceSetEventFlowsRequest', examples.setEventFlows),
    responses: responses('FlowSurfaceSetEventFlowsResult'),
  },
  setLayout: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Write rows, sizes and rowOrder for a grid',
    description: valuesCompatibilityNote('全量写入 grid 布局，服务端会严格校验所有 child 是否被完整且唯一覆盖。'),
    requestBody: requestBody('FlowSurfaceSetLayoutRequest', examples.setLayout),
    responses: responses('FlowSurfaceSetLayoutResult'),
  },
  moveNode: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Move a node before or after a sibling under the same parent',
    description: valuesCompatibilityNote('只支持同一 parent/subKey 下的兄弟节点排序调整。'),
    requestBody: requestBody('FlowSurfaceMoveNodeRequest', examples.moveNode),
    responses: responses('FlowSurfaceMoveNodeResult'),
  },
  removeNode: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Remove a block, field wrapper, action or nested popup node',
    description: valuesCompatibilityNote('删除指定节点及其 subtree。'),
    requestBody: requestBody('FlowSurfaceRemoveNodeRequest', examples.removeNode),
    responses: responses('FlowSurfaceRemoveNodeResult'),
  },
  mutate: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Execute multiple operations atomically',
    description: valuesCompatibilityNote(
      '按顺序执行 `ops[]`，支持 `opId` 和 `{$ref:"<opId>.<field>"}` 引用前一步结果。V1 仅支持 `atomic=true`。',
    ),
    requestBody: requestBody('FlowSurfaceMutateRequest', examples.mutate),
    responses: responses('FlowSurfaceMutationResponse'),
  },
  apply: {
    tags: [FLOW_SURFACES_TAG],
    summary: 'Replace the target subtree from a complete spec',
    description: valuesCompatibilityNote(
      '接收完整 subtree spec，并编译成与 `mutate` 同构的操作序列。V1 仅支持 `mode="replace"`。',
    ),
    requestBody: requestBody('FlowSurfaceApplyRequest', examples.apply),
    responses: responses('FlowSurfaceMutationResponse'),
  },
};

const parameters = {
  flowSurfaceTargetUid: {
    name: 'uid',
    in: 'query',
    description: 'Target node uid',
    required: false,
    schema: {
      type: 'string',
    },
    example: examples.getPopupQuery.uid,
  },
  flowSurfaceTargetPageSchemaUid: {
    name: 'pageSchemaUid',
    in: 'query',
    description: 'Top-level page schema uid',
    required: false,
    schema: {
      type: 'string',
    },
    example: 'employees-page-schema',
  },
  flowSurfaceTargetTabSchemaUid: {
    name: 'tabSchemaUid',
    in: 'query',
    description: 'Tab schema uid',
    required: false,
    schema: {
      type: 'string',
    },
    example: 'details-tab-schema',
  },
  flowSurfaceTargetRouteId: {
    name: 'routeId',
    in: 'query',
    description: 'Desktop route id',
    required: false,
    schema: STRING_OR_INTEGER_SCHEMA,
    example: 101,
  },
};

const schemas = {
  FlowSurfaceOpReference: {
    type: 'object',
    required: ['$ref'],
    properties: {
      $ref: {
        type: 'string',
        description: 'Reference to a previous mutate op result field, for example `page.tabSchemaUid`.',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceResolvableString: {
    oneOf: [{ type: 'string' }, ref('FlowSurfaceOpReference')],
  },
  FlowSurfaceResolvableIdentifier: {
    oneOf: [{ type: 'string' }, { type: 'integer' }, ref('FlowSurfaceOpReference')],
  },
  FlowSurfaceTarget: {
    type: 'object',
    minProperties: 1,
    properties: {
      uid: {
        type: 'string',
      },
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      routeId: STRING_OR_INTEGER_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateTarget: {
    type: 'object',
    minProperties: 1,
    properties: {
      uid: ref('FlowSurfaceResolvableString'),
      pageSchemaUid: ref('FlowSurfaceResolvableString'),
      tabSchemaUid: ref('FlowSurfaceResolvableString'),
      routeId: ref('FlowSurfaceResolvableIdentifier'),
    },
    additionalProperties: false,
  },
  FlowSurfaceResolvedTarget: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      kind: {
        type: 'string',
        enum: ['page', 'tab', 'grid', 'block', 'field-container', 'action-container', 'node'],
      },
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      routeId: STRING_OR_INTEGER_SCHEMA,
      route: ref('FlowSurfaceRouteMeta'),
      pageRoute: ref('FlowSurfaceRouteMeta'),
      tabRoute: ref('FlowSurfaceRouteMeta'),
    },
    additionalProperties: true,
  },
  FlowSurfaceNodeDomain: {
    type: 'string',
    enum: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  },
  FlowSurfaceMergeStrategy: {
    type: 'string',
    enum: ['deep', 'replace'],
  },
  FlowSurfaceFilterCondition: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
      },
      operator: {
        type: 'string',
      },
      value: {},
    },
    required: ['path', 'operator'],
    additionalProperties: true,
  },
  FlowSurfaceFilterGroup: {
    type: 'object',
    properties: {
      logic: {
        type: 'string',
        enum: ['$and', '$or'],
      },
      items: {
        type: 'array',
        items: {
          oneOf: [ref('FlowSurfaceFilterCondition'), ref('FlowSurfaceFilterGroup')],
        },
      },
    },
    required: ['logic', 'items'],
    additionalProperties: false,
    example: FILTER_GROUP_EXAMPLE,
  },
  FlowSurfaceEventCapabilities: {
    type: 'object',
    properties: {
      direct: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      object: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceLayoutCapabilities: {
    type: 'object',
    properties: {
      supported: {
        type: 'boolean',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDomainGroupContract: {
    type: 'object',
    properties: {
      allowedPaths: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      clearable: {
        type: 'boolean',
      },
      mergeStrategy: ref('FlowSurfaceMergeStrategy'),
      schema: ANY_OBJECT_SCHEMA,
      eventBindingSteps: {
        oneOf: [
          {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          {
            type: 'string',
            enum: ['*'],
          },
        ],
      },
      pathSchemas: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceDomainContract: {
    type: 'object',
    properties: {
      allowedKeys: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      wildcard: {
        type: 'boolean',
      },
      mergeStrategy: ref('FlowSurfaceMergeStrategy'),
      schema: ANY_OBJECT_SCHEMA,
      groups: {
        type: 'object',
        additionalProperties: ref('FlowSurfaceDomainGroupContract'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceNodeContract: {
    type: 'object',
    properties: {
      editableDomains: {
        type: 'array',
        items: ref('FlowSurfaceNodeDomain'),
      },
      domains: {
        type: 'object',
        properties: {
          props: ref('FlowSurfaceDomainContract'),
          decoratorProps: ref('FlowSurfaceDomainContract'),
          stepParams: ref('FlowSurfaceDomainContract'),
          flowRegistry: ref('FlowSurfaceDomainContract'),
        },
        additionalProperties: false,
      },
      eventCapabilities: ref('FlowSurfaceEventCapabilities'),
      layoutCapabilities: ref('FlowSurfaceLayoutCapabilities'),
      eventBindings: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogItem: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      label: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      kind: {
        type: 'string',
        enum: ['page', 'tab', 'block', 'field', 'action'],
      },
      scene: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
      },
      wrapperUse: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
        nullable: true,
      },
      defaultTargetUid: {
        type: 'string',
      },
      targetBlockUid: {
        type: 'string',
      },
      requiredInitParams: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      allowedContainerUses: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      editableDomains: {
        type: 'array',
        items: ref('FlowSurfaceNodeDomain'),
      },
      settingsSchema: ANY_OBJECT_SCHEMA,
      settingsContract: {
        type: 'object',
        properties: {
          props: ref('FlowSurfaceDomainContract'),
          decoratorProps: ref('FlowSurfaceDomainContract'),
          stepParams: ref('FlowSurfaceDomainContract'),
          flowRegistry: ref('FlowSurfaceDomainContract'),
        },
        additionalProperties: false,
      },
      eventCapabilities: ref('FlowSurfaceEventCapabilities'),
      layoutCapabilities: ref('FlowSurfaceLayoutCapabilities'),
      createSupported: {
        type: 'boolean',
      },
    },
    additionalProperties: true,
  },
  FlowSurfaceGetTreeNode: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      subType: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
      },
      schemaUid: {
        type: 'string',
      },
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
      subModels: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            ref('FlowSurfaceGetTreeNode'),
            {
              type: 'array',
              items: ref('FlowSurfaceGetTreeNode'),
            },
          ],
        },
      },
    },
    additionalProperties: true,
  },
  FlowSurfaceNodeMap: {
    type: 'object',
    additionalProperties: ref('FlowSurfaceGetTreeNode'),
  },
  FlowSurfaceRouteMeta: {
    type: 'object',
    properties: {
      id: STRING_OR_INTEGER_SCHEMA,
      type: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
        nullable: true,
      },
      schemaUid: {
        type: 'string',
      },
      tabSchemaName: {
        type: 'string',
      },
      enableTabs: {
        type: 'boolean',
      },
      hidden: {
        type: 'boolean',
      },
      displayTitle: {
        type: 'boolean',
      },
      sort: {
        type: 'number',
      },
      options: ANY_OBJECT_SCHEMA,
      children: {
        type: 'array',
        items: ref('FlowSurfaceRouteMeta'),
      },
    },
    additionalProperties: true,
  },
  FlowSurfaceTabReadback: {
    type: 'object',
    properties: {
      route: ref('FlowSurfaceRouteMeta'),
      tree: ref('FlowSurfaceGetTreeNode'),
    },
    additionalProperties: false,
  },
  FlowSurfaceNodeSpec: {
    type: 'object',
    required: ['use'],
    properties: {
      uid: {
        type: 'string',
      },
      clientKey: {
        type: 'string',
      },
      use: {
        type: 'string',
      },
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
      subModels: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            ref('FlowSurfaceNodeSpec'),
            {
              type: 'array',
              items: ref('FlowSurfaceNodeSpec'),
            },
          ],
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplySpec: {
    type: 'object',
    properties: {
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
      subModels: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            ref('FlowSurfaceNodeSpec'),
            {
              type: 'array',
              items: ref('FlowSurfaceNodeSpec'),
            },
          ],
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceClientKeyMap: {
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  },
  FlowSurfaceResourceInit: {
    type: 'object',
    properties: {
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      associationName: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
      },
      sourceId: STRING_OR_INTEGER_SCHEMA,
      filterByTk: STRING_OR_INTEGER_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateResourceInit: {
    type: 'object',
    properties: {
      dataSourceKey: ref('FlowSurfaceResolvableString'),
      collectionName: ref('FlowSurfaceResolvableString'),
      associationName: ref('FlowSurfaceResolvableString'),
      associationPathName: ref('FlowSurfaceResolvableString'),
      sourceId: ref('FlowSurfaceResolvableIdentifier'),
      filterByTk: ref('FlowSurfaceResolvableIdentifier'),
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogRequest: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceTarget'),
    },
    additionalProperties: false,
  },
  FlowSurfaceCatalogResponse: {
    type: 'object',
    properties: {
      target: {
        allOf: [ref('FlowSurfaceResolvedTarget')],
        nullable: true,
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceCatalogItem'),
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceCatalogItem'),
      },
      actions: {
        type: 'array',
        items: ref('FlowSurfaceCatalogItem'),
      },
      editableDomains: {
        type: 'array',
        items: ref('FlowSurfaceNodeDomain'),
      },
      settingsSchema: ANY_OBJECT_SCHEMA,
      settingsContract: {
        type: 'object',
        properties: {
          props: ref('FlowSurfaceDomainContract'),
          decoratorProps: ref('FlowSurfaceDomainContract'),
          stepParams: ref('FlowSurfaceDomainContract'),
          flowRegistry: ref('FlowSurfaceDomainContract'),
        },
        additionalProperties: false,
      },
      eventCapabilities: ref('FlowSurfaceEventCapabilities'),
      layoutCapabilities: ref('FlowSurfaceLayoutCapabilities'),
    },
    additionalProperties: false,
  },
  FlowSurfaceGetResponse: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceResolvedTarget'),
      tree: ref('FlowSurfaceGetTreeNode'),
      nodeMap: ref('FlowSurfaceNodeMap'),
      pageRoute: ref('FlowSurfaceRouteMeta'),
      route: ref('FlowSurfaceRouteMeta'),
      tabs: {
        type: 'array',
        items: ref('FlowSurfaceRouteMeta'),
      },
      tabTrees: {
        type: 'array',
        items: ref('FlowSurfaceTabReadback'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeLayoutCell: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        required: ['key'],
        properties: {
          key: {
            type: 'string',
          },
          span: {
            type: 'number',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceComposeLayout: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'array',
          items: ref('FlowSurfaceComposeLayoutCell'),
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeFieldSpec: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        required: ['fieldPath'],
        properties: {
          key: {
            type: 'string',
          },
          fieldPath: {
            type: 'string',
          },
          renderer: {
            type: 'string',
            enum: ['js'],
            description: 'Optional public renderer variant for a bound field.',
          },
          associationPathName: {
            type: 'string',
          },
          target: {
            type: 'string',
            description: 'Reference to another compose block key, typically used by filter-form fields.',
          },
          settings: ANY_OBJECT_SCHEMA,
        },
        additionalProperties: false,
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: ['jsColumn', 'jsItem'],
            description: 'Standalone synthetic public field capability. Does not accept fieldPath.',
          },
          settings: ANY_OBJECT_SCHEMA,
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceComposeActionPopup: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockSpec'),
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeActionSpec: {
    oneOf: [
      {
        type: 'string',
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          key: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: [
              'addNew',
              'refresh',
              'bulkDelete',
              'view',
              'edit',
              'popup',
              'delete',
              'updateRecord',
              'submit',
              'reset',
              'js',
            ],
          },
          scope: {
            type: 'string',
            enum: ['block', 'row'],
          },
          settings: ANY_OBJECT_SCHEMA,
          popup: ref('FlowSurfaceComposeActionPopup'),
        },
        additionalProperties: false,
      },
    ],
  },
  FlowSurfaceComposeBlockSpec: {
    type: 'object',
    required: ['key', 'type'],
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: [
          'table',
          'createForm',
          'editForm',
          'details',
          'filterForm',
          'list',
          'gridCard',
          'markdown',
          'iframe',
          'chart',
          'actionPanel',
          'jsBlock',
        ],
      },
      resource: ref('FlowSurfaceResourceInit'),
      settings: ANY_OBJECT_SCHEMA,
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldSpec'),
      },
      actions: {
        type: 'array',
        items: ref('FlowSurfaceComposeActionSpec'),
      },
      recordActions: {
        type: 'array',
        description:
          'Only valid for list/gridCard blocks. Creates item-level record actions under the generated item node.',
        items: ref('FlowSurfaceComposeActionSpec'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
        default: 'append',
      },
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockSpec'),
      },
      layout: ref('FlowSurfaceComposeLayout'),
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeFieldResult: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      fieldPath: {
        type: 'string',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
      },
      uid: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
        nullable: true,
      },
      target: {
        type: 'string',
      },
      wrapperUid: {
        type: 'string',
      },
      fieldUid: {
        type: 'string',
      },
      innerFieldUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeActionResult: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: [
          'addNew',
          'refresh',
          'bulkDelete',
          'view',
          'edit',
          'popup',
          'delete',
          'updateRecord',
          'submit',
          'reset',
          'js',
        ],
      },
      scope: {
        type: 'string',
      },
      uid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      assignFormUid: {
        type: 'string',
      },
      assignFormGridUid: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeBlockResult: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: [
          'table',
          'createForm',
          'editForm',
          'details',
          'filterForm',
          'list',
          'gridCard',
          'markdown',
          'iframe',
          'chart',
          'actionPanel',
          'jsBlock',
        ],
      },
      uid: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
      itemUid: {
        type: 'string',
      },
      itemGridUid: {
        type: 'string',
      },
      actionsColumnUid: {
        type: 'string',
      },
      fields: {
        type: 'array',
        items: ref('FlowSurfaceComposeFieldResult'),
      },
      actions: {
        type: 'array',
        items: ref('FlowSurfaceComposeActionResult'),
      },
      recordActions: {
        type: 'array',
        items: ref('FlowSurfaceComposeActionResult'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceComposeResult: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceTarget'),
      mode: {
        type: 'string',
        enum: ['append', 'replace'],
      },
      keyToUid: ref('FlowSurfaceClientKeyMap'),
      blocks: {
        type: 'array',
        items: ref('FlowSurfaceComposeBlockResult'),
      },
      layout: ref('FlowSurfaceSetLayoutResult'),
    },
    additionalProperties: false,
  },
  FlowSurfaceConfigureRequest: {
    type: 'object',
    required: ['target', 'changes'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      changes: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceConfigureResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      updated: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceCreatePageRequest: {
    type: 'object',
    properties: {
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabSchemaName: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      tabTitle: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      tabIcon: {
        type: 'string',
      },
      enableTabs: {
        type: 'boolean',
      },
      enableHeader: {
        type: 'boolean',
      },
      displayTitle: {
        type: 'boolean',
      },
      documentTitle: {
        type: 'string',
      },
      tabDocumentTitle: {
        type: 'string',
      },
      tabFlowRegistry: ANY_OBJECT_SCHEMA,
      routeOptions: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceCreatePageResult: {
    type: 'object',
    properties: {
      routeId: STRING_OR_INTEGER_SCHEMA,
      pageSchemaUid: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabRouteId: STRING_OR_INTEGER_SCHEMA,
      tabSchemaName: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDestroyPageRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      pageSchemaUid: {
        type: 'string',
      },
      schemaUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceDestroyPageResult: {
    type: 'object',
    properties: {
      pageSchemaUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddTabRequest: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceTarget'),
      pageSchemaUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabSchemaName: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceAddTabResult: {
    type: 'object',
    properties: {
      pageUid: {
        type: 'string',
      },
      tabSchemaUid: {
        type: 'string',
      },
      tabRouteId: STRING_OR_INTEGER_SCHEMA,
      tabSchemaName: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateTabRequest: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceTarget'),
      tabSchemaUid: {
        type: 'string',
      },
      uid: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateTabResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      routeId: STRING_OR_INTEGER_SCHEMA,
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveTabRequest: {
    type: 'object',
    properties: {
      sourceTabSchemaUid: {
        type: 'string',
      },
      sourceUid: {
        type: 'string',
      },
      targetTabSchemaUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveTabResult: {
    type: 'object',
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveTabRequest: {
    type: 'object',
    properties: {
      tabSchemaUid: {
        type: 'string',
      },
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveTabResult: {
    type: 'object',
    properties: {
      tabSchemaUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddBlockRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      type: {
        type: 'string',
        enum: [
          'table',
          'createForm',
          'editForm',
          'details',
          'filterForm',
          'list',
          'gridCard',
          'markdown',
          'iframe',
          'chart',
          'actionPanel',
          'jsBlock',
        ],
      },
      use: {
        type: 'string',
      },
      resourceInit: ref('FlowSurfaceResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceAddBlockResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      gridUid: {
        type: 'string',
      },
      blockGridUid: {
        type: 'string',
      },
      itemUid: {
        type: 'string',
      },
      itemGridUid: {
        type: 'string',
      },
      actionsColumnUid: {
        type: 'string',
      },
      pageUid: {
        type: 'string',
      },
      tabUid: {
        type: 'string',
      },
      popupPageUid: {
        type: 'string',
      },
      popupTabUid: {
        type: 'string',
      },
      popupGridUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      fieldPath: {
        type: 'string',
        description: 'Required for bound fields. Omit when using synthetic standalone types such as jsColumn/jsItem.',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
        description: 'Public JS renderer variant for a bound field.',
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
        description: 'Public standalone field capability. Does not accept fieldPath.',
      },
      associationPathName: {
        type: 'string',
      },
      dataSourceKey: {
        type: 'string',
      },
      collectionName: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
        description: 'Optional compatibility check. The server infers the actual field use from catalog capabilities.',
      },
      defaultTargetUid: {
        type: 'string',
      },
      targetBlockUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
        description: 'Legacy alias used by filter-form target selection. This is not the same field as `target.uid`.',
      },
      wrapperProps: ANY_OBJECT_SCHEMA,
      fieldProps: ANY_OBJECT_SCHEMA,
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceAddFieldResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      wrapperUid: {
        type: 'string',
      },
      fieldUid: {
        type: 'string',
      },
      innerFieldUid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      fieldUse: {
        type: 'string',
      },
      renderer: {
        type: 'string',
        enum: ['js'],
      },
      type: {
        type: 'string',
        enum: ['jsColumn', 'jsItem'],
      },
      defaultTargetUid: {
        type: 'string',
      },
      associationPathName: {
        type: 'string',
        nullable: true,
      },
      fieldPath: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      type: {
        type: 'string',
        enum: [
          'addNew',
          'refresh',
          'bulkDelete',
          'view',
          'edit',
          'popup',
          'delete',
          'updateRecord',
          'submit',
          'reset',
          'js',
        ],
      },
      use: {
        type: 'string',
      },
      resourceInit: ref('FlowSurfaceResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceAddActionResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      parentUid: {
        type: 'string',
      },
      subKey: {
        type: 'string',
      },
      assignFormUid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateSettingsRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceUpdateSettingsResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      updated: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceSetEventFlowsRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      flowRegistry: ANY_OBJECT_SCHEMA,
      flows: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceSetEventFlowsResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceSetLayoutRequest: {
    type: 'object',
    required: ['target'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      rows: ANY_OBJECT_SCHEMA,
      sizes: ANY_OBJECT_SCHEMA,
      rowOrder: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceSetLayoutResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      rows: ANY_OBJECT_SCHEMA,
      sizes: ANY_OBJECT_SCHEMA,
      rowOrder: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveNodeRequest: {
    type: 'object',
    required: ['sourceUid', 'targetUid'],
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMoveNodeResult: {
    type: 'object',
    properties: {
      sourceUid: {
        type: 'string',
      },
      targetUid: {
        type: 'string',
      },
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveNodeRequest: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceTarget'),
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceRemoveNodeResult: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddTabValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      pageSchemaUid: ref('FlowSurfaceResolvableString'),
      tabSchemaUid: ref('FlowSurfaceResolvableString'),
      tabSchemaName: ref('FlowSurfaceResolvableString'),
      title: ref('FlowSurfaceResolvableString'),
      icon: ref('FlowSurfaceResolvableString'),
      documentTitle: ref('FlowSurfaceResolvableString'),
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateUpdateTabValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      tabSchemaUid: ref('FlowSurfaceResolvableString'),
      uid: ref('FlowSurfaceResolvableString'),
      title: ref('FlowSurfaceResolvableString'),
      icon: ref('FlowSurfaceResolvableString'),
      documentTitle: ref('FlowSurfaceResolvableString'),
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateMoveTabValues: {
    type: 'object',
    properties: {
      sourceTabSchemaUid: ref('FlowSurfaceResolvableString'),
      sourceUid: ref('FlowSurfaceResolvableString'),
      targetTabSchemaUid: ref('FlowSurfaceResolvableString'),
      targetUid: ref('FlowSurfaceResolvableString'),
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateRemoveTabValues: {
    type: 'object',
    properties: {
      tabSchemaUid: ref('FlowSurfaceResolvableString'),
      uid: ref('FlowSurfaceResolvableString'),
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddBlockValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      type: ref('FlowSurfaceResolvableString'),
      use: ref('FlowSurfaceResolvableString'),
      resourceInit: ref('FlowSurfaceMutateResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddFieldValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      fieldPath: ref('FlowSurfaceResolvableString'),
      associationPathName: ref('FlowSurfaceResolvableString'),
      dataSourceKey: ref('FlowSurfaceResolvableString'),
      collectionName: ref('FlowSurfaceResolvableString'),
      fieldUse: ref('FlowSurfaceResolvableString'),
      defaultTargetUid: ref('FlowSurfaceResolvableString'),
      targetBlockUid: ref('FlowSurfaceResolvableString'),
      targetUid: ref('FlowSurfaceResolvableString'),
      wrapperProps: ANY_OBJECT_SCHEMA,
      fieldProps: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateAddActionValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      type: ref('FlowSurfaceResolvableString'),
      use: ref('FlowSurfaceResolvableString'),
      resourceInit: ref('FlowSurfaceMutateResourceInit'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateUpdateSettingsValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      props: ANY_OBJECT_SCHEMA,
      decoratorProps: ANY_OBJECT_SCHEMA,
      stepParams: ANY_OBJECT_SCHEMA,
      flowRegistry: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateSetEventFlowsValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      flowRegistry: ANY_OBJECT_SCHEMA,
      flows: ANY_OBJECT_SCHEMA,
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateSetLayoutValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      rows: ANY_OBJECT_SCHEMA,
      sizes: ANY_OBJECT_SCHEMA,
      rowOrder: {
        type: 'array',
        items: ref('FlowSurfaceResolvableString'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateMoveNodeValues: {
    type: 'object',
    properties: {
      sourceUid: ref('FlowSurfaceResolvableString'),
      targetUid: ref('FlowSurfaceResolvableString'),
      position: {
        type: 'string',
        enum: ['before', 'after'],
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateRemoveNodeValues: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceMutateTarget'),
      uid: ref('FlowSurfaceResolvableString'),
    },
    additionalProperties: false,
  },
  FlowSurfaceMutateOpBase: {
    type: 'object',
    properties: {
      opId: {
        type: 'string',
      },
      target: ref('FlowSurfaceMutateTarget'),
    },
  },
  FlowSurfaceMutateOpCreatePage: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['createPage'],
          },
          values: ref('FlowSurfaceCreatePageRequest'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpDestroyPage: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['destroyPage'],
          },
          values: ref('FlowSurfaceDestroyPageRequest'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpAddTab: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['addTab'],
          },
          values: ref('FlowSurfaceMutateAddTabValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpUpdateTab: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['updateTab'],
          },
          values: ref('FlowSurfaceMutateUpdateTabValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpMoveTab: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['moveTab'],
          },
          values: ref('FlowSurfaceMutateMoveTabValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpRemoveTab: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['removeTab'],
          },
          values: ref('FlowSurfaceMutateRemoveTabValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpAddBlock: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['addBlock'],
          },
          values: ref('FlowSurfaceMutateAddBlockValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpAddField: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['addField'],
          },
          values: ref('FlowSurfaceMutateAddFieldValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpAddAction: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['addAction'],
          },
          values: ref('FlowSurfaceMutateAddActionValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpUpdateSettings: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['updateSettings'],
          },
          values: ref('FlowSurfaceMutateUpdateSettingsValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpSetEventFlows: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['setEventFlows'],
          },
          values: ref('FlowSurfaceMutateSetEventFlowsValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpSetLayout: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['setLayout'],
          },
          values: ref('FlowSurfaceMutateSetLayoutValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpMoveNode: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['moveNode'],
          },
          values: ref('FlowSurfaceMutateMoveNodeValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOpRemoveNode: {
    allOf: [
      ref('FlowSurfaceMutateOpBase'),
      {
        type: 'object',
        required: ['type', 'values'],
        properties: {
          type: {
            type: 'string',
            enum: ['removeNode'],
          },
          values: ref('FlowSurfaceMutateRemoveNodeValues'),
        },
      },
    ],
  },
  FlowSurfaceMutateOp: {
    oneOf: [
      ref('FlowSurfaceMutateOpCreatePage'),
      ref('FlowSurfaceMutateOpDestroyPage'),
      ref('FlowSurfaceMutateOpAddTab'),
      ref('FlowSurfaceMutateOpUpdateTab'),
      ref('FlowSurfaceMutateOpMoveTab'),
      ref('FlowSurfaceMutateOpRemoveTab'),
      ref('FlowSurfaceMutateOpAddBlock'),
      ref('FlowSurfaceMutateOpAddField'),
      ref('FlowSurfaceMutateOpAddAction'),
      ref('FlowSurfaceMutateOpUpdateSettings'),
      ref('FlowSurfaceMutateOpSetEventFlows'),
      ref('FlowSurfaceMutateOpSetLayout'),
      ref('FlowSurfaceMutateOpMoveNode'),
      ref('FlowSurfaceMutateOpRemoveNode'),
    ],
  },
  FlowSurfaceMutateRequest: {
    type: 'object',
    properties: {
      target: ref('FlowSurfaceTarget'),
      atomic: {
        type: 'boolean',
        enum: [true],
        default: true,
      },
      ops: {
        type: 'array',
        items: ref('FlowSurfaceMutateOp'),
      },
    },
    additionalProperties: false,
  },
  FlowSurfaceApplyRequest: {
    type: 'object',
    required: ['target', 'spec'],
    properties: {
      target: ref('FlowSurfaceTarget'),
      mode: {
        type: 'string',
        enum: ['replace'],
        default: 'replace',
      },
      spec: ref('FlowSurfaceApplySpec'),
    },
    additionalProperties: false,
  },
  FlowSurfaceMutationResult: {
    oneOf: [
      ref('FlowSurfaceCreatePageResult'),
      ref('FlowSurfaceDestroyPageResult'),
      ref('FlowSurfaceAddTabResult'),
      ref('FlowSurfaceUpdateTabResult'),
      ref('FlowSurfaceMoveTabResult'),
      ref('FlowSurfaceRemoveTabResult'),
      ref('FlowSurfaceAddBlockResult'),
      ref('FlowSurfaceAddFieldResult'),
      ref('FlowSurfaceAddActionResult'),
      ref('FlowSurfaceUpdateSettingsResult'),
      ref('FlowSurfaceSetEventFlowsResult'),
      ref('FlowSurfaceSetLayoutResult'),
      ref('FlowSurfaceMoveNodeResult'),
      ref('FlowSurfaceRemoveNodeResult'),
    ],
  },
  FlowSurfaceMutationResponse: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: ref('FlowSurfaceMutationResult'),
      },
      clientKeyToUid: ref('FlowSurfaceClientKeyMap'),
    },
    additionalProperties: false,
  },
  FlowSurfaceErrorResponse: {
    type: 'object',
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: [
                'addNew',
                'view',
                'edit',
                'popup',
                'refresh',
                'bulkDelete',
                'delete',
                'updateRecord',
                'submit',
                'reset',
                'js',
              ],
            },
          },
          required: ['message'],
          additionalProperties: true,
        },
      },
    },
    additionalProperties: true,
  },
};

const paths = Object.fromEntries(
  FLOW_SURFACES_ACTION_NAMES.map((actionName) => [
    `/flowSurfaces:${actionName}`,
    {
      [FLOW_SURFACES_ACTION_METHODS[actionName]]: actionDocs[actionName],
    },
  ]),
);

export default {
  tags: [
    {
      name: FLOW_SURFACES_TAG,
      description: 'Atomic and declarative FlowModel surface orchestration for external CLI and automation tools',
    },
  ],
  paths,
  components: {
    parameters,
    schemas,
  },
};
