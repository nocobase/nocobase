import { TableOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  internal: true,
  sortable: true,
  draggable: true,
  model: 'CollectionModel',
  developerMode: true,
  createdAt: 'createdTime',
  updatedAt: 'updatedTime',
  fields: [
    // {
    //   interface: 'sort',
    //   type: 'sort',
    //   name: 'sort',
    //   title: '排序',
    //   component: {
    //     type: 'sort',
    //     className: 'drag-visible',
    //     width: 60,
    //     showInTable: true,
    //   },
    // },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '数据表名称',
      required: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      createOnly: true,
      title: '标识',
      unique: true,
      required: true,
      developerMode: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'textarea',
      type: 'text',
      name: 'description',
      title: '数据表描述',
      component: {
        type: 'textarea',
      },
    },
    // {
    //   interface: 'boolean',
    //   type: 'virtual',
    //   name: 'createdAt',
    //   title: '记录创建时间',
    //   developerMode: true,
    //   defaultValue: true,
    //   component: {
    //     type: 'checkbox',
    //     default: true,
    //     showInForm: true,
    //   },
    // },
    // {
    //   interface: 'boolean',
    //   type: 'virtual',
    //   name: 'updatedAt',
    //   title: '记录修改时间',
    //   developerMode: true,
    //   defaultValue: true,
    //   component: {
    //     type: 'checkbox',
    //     default: true,
    //     showInForm: true,
    //   },
    // },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'createdBy',
      title: '记录创建人信息',
      developerMode: true,
      component: {
        type: 'checkbox',
        default: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'updatedBy',
      title: '记录修改人信息',
      developerMode: true,
      component: {
        type: 'checkbox',
        default: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      developerMode: true,
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'internal',
      title: '系统内置',
      defaultValue: false,
      developerMode: true,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'fields',
      title: '字段',
      sourceKey: 'name',
      draggable: true,
      actions: {
        list: {
          sort: 'sort',
        },
        get: {
          fields: {
            appends: ['children'],
          },
        },
      },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'actions',
      title: '动作',
      sourceKey: 'name',
      draggable: true,
      actions: {
        list: {
          sort: 'sort',
        },
      },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'views_v2',
      target: 'views_v2',
      title: '视图',
      sourceKey: 'name',
      draggable: true,
      // actions: {
      //   list: {
      //     sort: 'sort',
      //   },
      //   destroy: {
      //     filter: {
      //       default: false
      //     }
      //   }
      // },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'scopes',
      target: 'scopes',
      title: '数据范围',
      sourceKey: 'name',
      actions: {
        list: {
          sort: 'id',
        },
        update: {
          filter: {
            locked: false
          }
        },
        destroy: {
          filter: {
            locked: false
          }
        }
      },
      component: {
        type: 'drawerSelect',
      },
    },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
    },
    {
      type: 'create',
      name: 'create',
      title: '新增',
      viewName: 'form',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
      viewName: 'form',
    },
  ],
  views_v2: [
    {
      developerMode: true,
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'title',
      actions: [
        {
          name: 'create',
          type: 'create',
          title: '新增',
          viewName: 'form',
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      fields: ['title', 'description'],
      detailsOpenMode: 'window', // window
      details: ['descriptions', 'fields', 'views'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['title', 'description'],
    },
    {
      developerMode: true,
      type: 'descriptions',
      name: 'descriptions',
      title: '详情',
      fields: ['title', 'description'],
      actions: [
        {
          name: 'update',
          type: 'update',
          title: '编辑',
          viewName: 'form',
        },
      ],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'permissions_table',
      title: '权限表格',
      labelField: 'title',
      actions: [],
      fields: ['title'],
      detailsOpenMode: 'drawer', // window
      details: ['permissions_form'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'permissions_form',
      title: '权限表单',
      fields: [
        {
          interface: 'json',
          type: 'json',
          title: '数据操作权限',
          name: 'actions',
          component: {
            "type": "permissions.actions",
            "title": "数据操作权限",
            "x-linkages": [{
              "type": "value:schema",
              "target": "actions",
              "schema": {
                "x-component-props": {
                  "resourceKey": "{{ $form.values && $form.values.resourceKey }}"
                }
              }
            }],
            "x-component-props": {
              "dataSource": []
            }
          },
        },
        {
          interface: 'json',
          type: 'json',
          title: '字段权限',
          name: 'fields',
          component: {
            "type": "permissions.fields",
            "x-linkages": [{
              "type": "value:schema",
              "target": "fields",
              "schema": {
                "x-component-props": {
                  "resourceKey": "{{ $form.values && $form.values.resourceKey }}"
                }
              }
            }],
            "x-component-props": {
              "dataSource": []
            }
          },
        },
      ],
    },
    {
      developerMode: true,
      type: 'table',
      dataSourceType: 'association',
      name: 'fields',
      title: '字段',
      targetViewName: 'table2',
      targetFieldName: 'fields',
    },
    {
      developerMode: true,
      type: 'table',
      dataSourceType: 'association',
      name: 'views',
      title: '视图',
      targetViewName: 'table',
      targetFieldName: 'views_v2',
    },
  ],
} as TableOptions;
