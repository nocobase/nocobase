/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const flowSurfaceExamples = {
  catalog: {
    target: {
      uid: 'table-block-uid',
    },
  },
  context: {
    target: {
      uid: 'details-block-uid',
    },
    path: 'record',
    maxDepth: 3,
  },
  getReactionMeta: {
    target: {
      uid: 'employees-form-uid',
    },
  },
  describeSurface: {
    locator: {
      pageSchemaUid: 'employees-page-schema',
    },
    bindKeys: [
      {
        key: 'employeesTable',
        locator: {
          uid: 'employees-table-uid',
        },
        expectedKind: 'block',
      },
    ],
  },
  applyBlueprint: {
    version: '1',
    mode: 'create',
    navigation: {
      group: {
        title: 'Workspace',
      },
      item: {
        title: 'Employees',
      },
    },
    page: {
      title: 'Employees',
      documentTitle: 'Employees workspace',
      enableHeader: true,
      displayTitle: true,
    },
    tabs: [
      {
        key: 'main',
        title: 'Overview',
        blocks: [
          {
            key: 'employeeForm',
            type: 'createForm',
            collection: 'employees',
            fields: ['nickname', 'status', 'amount', 'taxRate', 'subtotal', 'total'],
            actions: ['submit'],
          },
          {
            key: 'employeesTable',
            type: 'table',
            collection: 'employees',
            fields: ['nickname', 'status', 'total'],
            actions: [
              {
                key: 'refreshAction',
                type: 'refresh',
              },
            ],
          },
        ],
        layout: {
          rows: [['main.employeeForm'], ['main.employeesTable']],
        },
      },
    ],
    reaction: {
      items: [
        {
          type: 'setFieldValueRules',
          target: 'main.employeeForm',
          rules: [
            {
              key: 'defaultStatus',
              targetPath: 'status',
              mode: 'default',
              value: {
                source: 'literal',
                value: 'draft',
              },
            },
          ],
        },
        {
          type: 'setBlockLinkageRules',
          target: 'main.employeesTable',
          rules: [
            {
              key: 'hideTable',
              when: {
                logic: '$and',
                items: [
                  {
                    path: 'params.query.hideTable',
                    operator: '$isTruly',
                  },
                ],
              },
              then: [{ type: 'setBlockState', state: 'hidden' }],
            },
          ],
        },
        {
          type: 'setFieldLinkageRules',
          target: 'main.employeeForm',
          rules: [
            {
              key: 'recomputeTotals',
              when: {
                logic: '$and',
                items: [
                  {
                    path: 'formValues.amount',
                    operator: '$notEmpty',
                  },
                ],
              },
              then: [
                {
                  type: 'assignField',
                  items: [
                    {
                      targetPath: 'subtotal',
                      value: {
                        source: 'runjs',
                        version: 'v2',
                        code: 'const amount = Number(ctx.formValues?.amount || 0); return amount;',
                      },
                    },
                    {
                      targetPath: 'total',
                      value: {
                        source: 'runjs',
                        version: 'v2',
                        code: 'const amount = Number(ctx.formValues?.amount || 0); const taxRate = Number(ctx.formValues?.taxRate || 0); return amount + amount * taxRate;',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'setActionLinkageRules',
          target: 'main.employeesTable.refreshAction',
          rules: [
            {
              key: 'disableRefresh',
              when: {
                logic: '$and',
                items: [
                  {
                    path: 'params.query.readonly',
                    operator: '$isTruly',
                  },
                ],
              },
              then: [{ type: 'setActionState', state: 'disabled' }],
            },
          ],
        },
      ],
    },
  },
  applyBlueprintReplace: {
    version: '1',
    mode: 'replace',
    target: {
      pageSchemaUid: 'employees-page-schema',
    },
    page: {
      title: 'Employees workspace',
      documentTitle: 'Employees replace flow',
      displayTitle: false,
      enableTabs: true,
    },
    tabs: [
      {
        title: 'Overview',
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            collection: 'employees',
            fields: ['nickname', 'status', 'total'],
          },
        ],
      },
    ],
  },
  setFieldValueRules: {
    target: {
      uid: 'employees-form-uid',
    },
    rules: [
      {
        key: 'defaultStatus',
        targetPath: 'status',
        mode: 'default',
        value: {
          source: 'literal',
          value: 'draft',
        },
      },
    ],
    expectedFingerprint: 'field-value-fp-1',
  },
  setBlockLinkageRules: {
    target: {
      uid: 'employees-table-uid',
    },
    rules: [
      {
        key: 'hideTable',
        when: {
          logic: '$and',
          items: [
            {
              path: 'params.query.hideTable',
              operator: '$isTruly',
            },
          ],
        },
        then: [{ type: 'setBlockState', state: 'hidden' }],
      },
    ],
    expectedFingerprint: 'block-linkage-fp-1',
  },
  setFieldLinkageRules: {
    target: {
      uid: 'employees-form-uid',
    },
    rules: [
      {
        key: 'recomputeTotals',
        when: {
          logic: '$and',
          items: [
            {
              path: 'formValues.amount',
              operator: '$notEmpty',
            },
          ],
        },
        then: [
          {
            type: 'assignField',
            items: [
              {
                targetPath: 'subtotal',
                value: {
                  source: 'runjs',
                  version: 'v2',
                  code: 'const amount = Number(ctx.formValues?.amount || 0); return amount;',
                },
              },
              {
                targetPath: 'total',
                value: {
                  source: 'runjs',
                  version: 'v2',
                  code: 'const amount = Number(ctx.formValues?.amount || 0); const taxRate = Number(ctx.formValues?.taxRate || 0); return amount + amount * taxRate;',
                },
              },
            ],
          },
        ],
      },
    ],
    expectedFingerprint: 'field-linkage-fp-1',
  },
  setActionLinkageRules: {
    target: {
      uid: 'refresh-action-uid',
    },
    expectedFingerprint: 'action-linkage-fp-1',
    rules: [
      {
        key: 'disableRefresh',
        when: {
          logic: '$and',
          items: [
            {
              path: 'params.query.readonly',
              operator: '$isTruly',
            },
          ],
        },
        then: [{ type: 'setActionState', state: 'disabled' }],
      },
    ],
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
        actions: ['submit', 'reset', 'collapse'],
      },
      {
        key: 'table',
        type: 'table',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
        fields: ['username', 'nickname', { fieldPath: 'roles.title' }],
        actions: ['filter', 'addNew', 'refresh', 'bulkDelete', 'link'],
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
                    collectionName: 'users',
                  },
                  fields: ['username', 'nickname'],
                },
              ],
            },
          },
          'updateRecord',
          'delete',
        ],
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
          code: "ctx.render('<div>Hello from JS block</div>');",
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
  configureAssociationPopup: {
    target: {
      uid: 'roles-field-wrapper-uid',
    },
    changes: {
      clickToOpen: true,
      openView: {
        dataSourceKey: 'main',
        collectionName: 'roles',
        associationName: 'users.roles',
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
  createMenu: {
    title: 'Employees',
    type: 'item',
    parentMenuRouteId: 1001,
  },
  updateMenu: {
    menuRouteId: 1002,
    title: 'Employees Center',
    parentMenuRouteId: null,
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
      code: "ctx.render('<div>Users hero</div>');",
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
  configureJsItemAction: {
    target: {
      uid: 'js-item-action-uid',
    },
    changes: {
      title: 'Run item diagnostics',
      type: 'default',
      version: '1.0.1',
      code: 'await ctx.runjs(\'console.log("item diagnostics")\');',
    },
  },
  configureJsField: {
    target: {
      uid: 'js-field-wrapper-uid',
    },
    changes: {
      label: 'Custom renderer',
      version: '1.0.1',
      code: "ctx.render(String(ctx.record?.nickname?.toUpperCase?.() || ''));",
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
      code: "ctx.render(String(ctx.record?.username || ''));",
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
      code: "ctx.render(String(ctx.record?.nickname || ''));",
    },
  },
  configurePage: {
    target: {
      uid: 'employees-page-uid',
    },
    changes: {
      icon: 'UserOutlined',
      enableHeader: false,
    },
  },
  configureTableAdvanced: {
    target: {
      uid: 'tree-table-block-uid',
    },
    changes: {
      quickEdit: true,
      treeTable: true,
      defaultExpandAllRows: true,
      dragSort: true,
      dragSortBy: 'sort',
    },
  },
  configureEditForm: {
    target: {
      uid: 'edit-form-block-uid',
    },
    changes: {
      colon: false,
      dataScope: {
        logic: '$and',
        items: [
          {
            path: 'status',
            operator: '$eq',
            value: 'draft',
          },
        ],
      },
    },
  },
  configureDetailsCompatibility: {
    target: {
      uid: 'details-block-uid',
    },
    changes: {
      colon: true,
      linkageRules: [
        {
          when: {
            path: 'status',
            operator: '$eq',
            value: 'archived',
          },
          set: {
            hidden: true,
          },
        },
      ],
    },
  },
  composePopupCurrentRecord: {
    target: {
      uid: 'view-action-uid',
    },
    mode: 'replace',
    blocks: [
      {
        key: 'details',
        type: 'details',
        resource: {
          binding: 'currentRecord',
        },
        fields: ['nickname', 'department.title'],
      },
    ],
  },
  composePopupAssociatedRecords: {
    target: {
      uid: 'association-popup-action-uid',
    },
    mode: 'replace',
    blocks: [
      {
        key: 'employees',
        type: 'table',
        resource: {
          binding: 'associatedRecords',
          associationField: 'employee',
        },
        fields: ['nickname', 'status'],
        actions: ['refresh'],
        recordActions: ['view', 'edit'],
      },
    ],
  },
  configureActionModesCompatibility: {
    target: {
      uid: 'compose-email-action-uid',
    },
    changes: {
      linkageRules: [
        {
          when: {
            path: 'status',
            operator: '$eq',
            value: 'draft',
          },
          set: {
            disabled: true,
          },
        },
      ],
      editMode: 'drawer',
      updateMode: 'overwrite',
      duplicateMode: 'popup',
      collapsedRows: 2,
      defaultCollapsed: true,
      emailFieldNames: ['email', 'backupEmail'],
      defaultSelectAllRecords: true,
    },
  },
  createPage: {
    menuRouteId: 1002,
    title: 'Employees',
    tabTitle: 'Overview',
    enableTabs: true,
    displayTitle: true,
    documentTitle: 'Employees workspace',
    tabDocumentTitle: 'Employees overview',
  },
  addTab: {
    target: {
      uid: 'employees-page-uid',
    },
    title: 'Details',
    icon: 'TableOutlined',
    documentTitle: 'Employee details tab',
  },
  updateTab: {
    target: {
      uid: 'details-tab-schema',
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
  addPopupTab: {
    target: {
      uid: 'view-action-popup-page-uid',
    },
    title: 'Popup details',
    icon: 'TableOutlined',
    documentTitle: 'Popup details tab',
  },
  updatePopupTab: {
    target: {
      uid: 'popup-secondary-tab-uid',
    },
    title: 'Popup details updated',
    icon: 'AppstoreOutlined',
    documentTitle: 'Popup details updated tab',
    flowRegistry: {
      beforeRenderApply: {
        key: 'beforeRenderApply',
        on: 'beforeRender',
        steps: {},
      },
    },
  },
  movePopupTab: {
    sourceUid: 'popup-secondary-tab-uid',
    targetUid: 'popup-primary-tab-uid',
    position: 'before',
  },
  removePopupTab: {
    target: {
      uid: 'popup-secondary-tab-uid',
    },
  },
  addBlock: {
    target: {
      uid: 'view-action-uid',
    },
    type: 'details',
    resource: {
      binding: 'currentRecord',
    },
  },
  addPopupAssociatedBlock: {
    target: {
      uid: 'association-popup-action-uid',
    },
    type: 'table',
    resource: {
      binding: 'associatedRecords',
      associationField: 'employee',
    },
  },
  addPopupOtherRecordsBlock: {
    target: {
      uid: 'popup-action-uid',
    },
    type: 'table',
    resource: {
      binding: 'otherRecords',
      dataSourceKey: 'main',
      collectionName: 'departments',
    },
  },
  addJsBlock: {
    target: {
      uid: 'page-grid-uid',
    },
    type: 'jsBlock',
    settings: {
      title: 'Users banner',
      description: 'Custom JS rendered banner',
      version: '1.0.0',
      code: "ctx.render('<div>Users banner</div>');",
    },
  },
  addField: {
    target: {
      uid: 'create-form-block-uid',
    },
    fieldPath: 'nickname',
    renderer: 'js',
    settings: {
      label: 'Nickname (JS)',
      code: "ctx.render(String(ctx.value?.toUpperCase?.() || ctx.value || ''));",
      version: '1.0.0',
    },
  },
  addAssociationField: {
    target: {
      uid: 'table-block-uid',
    },
    fieldPath: 'title',
    associationPathName: 'department',
    settings: {
      title: 'Department title',
      width: 240,
    },
    popup: {
      mode: 'replace',
      blocks: [
        {
          key: 'departmentDetails',
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
          fields: ['title', 'manager.nickname'],
        },
      ],
    },
  },
  addJsColumn: {
    target: {
      uid: 'table-block-uid',
    },
    type: 'jsColumn',
    settings: {
      title: 'Runtime column',
      width: 240,
      version: '1.0.0',
      code: "ctx.render(String(ctx.record?.nickname || ''));",
    },
  },
  addJsItem: {
    target: {
      uid: 'create-form-grid-uid',
    },
    type: 'jsItem',
    settings: {
      label: 'Runtime item',
      showLabel: true,
      version: '1.0.0',
      code: "ctx.render(String(ctx.record?.nickname || ''));",
    },
  },
  addFieldPopupTemplate: {
    target: {
      uid: 'details-block-uid',
    },
    fieldPath: 'nickname',
    popup: {
      template: {
        uid: 'employee-popup-template',
        mode: 'reference',
      },
    },
  },
  addAction: {
    target: {
      uid: 'filter-form-block-uid',
    },
    type: 'submit',
    settings: {
      title: 'Apply filters',
      confirm: false,
    },
  },
  addLinkAction: {
    target: {
      uid: 'table-block-uid',
    },
    type: 'link',
    settings: {
      title: 'Open docs',
    },
  },
  addJsAction: {
    target: {
      uid: 'action-panel-uid',
    },
    type: 'js',
    settings: {
      title: 'Run JS',
      type: 'primary',
      version: '1.0.0',
      code: 'await ctx.runjs(\'console.log("hello")\');',
    },
  },
  addJsItemAction: {
    target: {
      uid: 'create-form-uid',
    },
    type: 'jsItem',
    settings: {
      title: 'Run item JS',
      type: 'default',
      version: '1.0.0',
      code: 'await ctx.runjs(\'console.log("item")\');',
    },
  },
  addRecordAction: {
    target: {
      uid: 'table-block-uid',
    },
    type: 'view',
    settings: {
      title: 'View user',
      openView: {
        dataSourceKey: 'main',
        collectionName: 'users',
        mode: 'drawer',
      },
    },
    popup: {
      mode: 'replace',
      blocks: [
        {
          key: 'details',
          type: 'details',
          resource: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
          fields: ['username', 'nickname'],
        },
      ],
    },
  },
  addRecordJsAction: {
    target: {
      uid: 'details-block-uid',
    },
    type: 'js',
    settings: {
      title: 'Inspect record',
      type: 'default',
      version: '1.0.0',
      code: 'return currentRecord?.id;',
    },
  },
  addBlocks: {
    target: {
      uid: 'page-grid-uid',
    },
    blocks: [
      {
        key: 'usersTable',
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
        settings: {
          title: 'Users table',
          pageSize: 50,
        },
      },
      {
        key: 'teamNotes',
        type: 'markdown',
        settings: {
          content: '# Team notes',
        },
      },
    ],
  },
  addFields: {
    target: {
      uid: 'table-block-uid',
    },
    fields: [
      {
        key: 'username',
        fieldPath: 'username',
        settings: {
          title: 'User name',
          width: 220,
        },
        popup: {
          mode: 'replace',
          blocks: [
            {
              key: 'details',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: ['username', 'nickname'],
            },
          ],
        },
      },
      {
        key: 'nickname',
        fieldPath: 'nickname',
        renderer: 'js',
        settings: {
          label: 'Nickname (JS)',
          code: 'return value;',
          version: '1.0.0',
        },
      },
    ],
  },
  addActions: {
    target: {
      uid: 'filter-form-block-uid',
    },
    actions: [
      {
        key: 'submit',
        type: 'submit',
        settings: {
          title: 'Search',
          confirm: false,
        },
      },
      {
        key: 'reset',
        type: 'reset',
        settings: {
          title: 'Reset filters',
        },
      },
    ],
  },
  addRecordActions: {
    target: {
      uid: 'table-block-uid',
    },
    recordActions: [
      {
        key: 'view',
        type: 'view',
        settings: {
          title: 'View user',
          openView: {
            dataSourceKey: 'main',
            collectionName: 'users',
            mode: 'drawer',
          },
        },
        popup: {
          mode: 'replace',
          blocks: [
            {
              key: 'details',
              type: 'details',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: ['username'],
            },
          ],
        },
      },
      {
        key: 'edit',
        type: 'edit',
        settings: {
          title: 'Edit user',
        },
      },
      {
        key: 'delete',
        type: 'delete',
        settings: {
          title: 'Delete user',
        },
      },
    ],
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
        opId: 'menu',
        type: 'createMenu',
        values: {
          title: 'Employees',
          type: 'item',
        },
      },
      {
        opId: 'page',
        type: 'createPage',
        values: {
          menuRouteId: {
            step: 'menu',
            path: 'routeId',
          },
          tabTitle: 'Overview',
        },
      },
      {
        opId: 'table',
        type: 'addBlock',
        values: {
          target: {
            uid: {
              step: 'page',
              path: 'tabSchemaUid',
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
              step: 'table',
              path: 'uid',
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
  getPageQuery: {
    pageSchemaUid: 'employees-page-schema',
  },
};
