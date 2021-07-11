import { TableOptions } from '@nocobase/database';

export default {
  name: 'tabs',
  title: '标签配置',
  internal: true,
  sortable: true,
  model: 'TabModel',
  developerMode: true,
  fields: [
    {
      interface: 'sort',
      type: 'sort',
      name: 'sort',
      scope: ['collection'],
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
        showInTable: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '名称',
      required: true,
      component: {
        type: 'string',
        className: 'drag-visible',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '标识',
      component: {
        type: 'string',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '类型',
      required: true,
      dataSource: [
        { label: '详情数据', value: 'details' },
        { label: '相关数据', value: 'association' },
        { label: '模块组合', value: 'module', disabled: true },
      ],
      component: {
        type: 'radio',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        "x-linkages": [
          // {
          //   "type": "value:visible",
          //   "target": "association",
          //   "condition": "{{ $self.value === 'association' }}"
          // },
          {
            type: "value:visible",
            target: "associationField",
            condition: "{{ $self.value === 'association' }}"
          },
          {
            type: "value:visible",
            target: "displayFields",
            condition: "{{ $self.value === 'details' }}",
          },
          {
            type: "value:visible",
            target: "displayFormFields",
            condition: "{{ $self.value === 'details' }}",
          },
          // {
          //   type: "value:schema",
          //   target: "association",
          //   condition: "{{ $self.value === 'association' }}",
          //   schema: {
          //     "x-component-props": {
          //       "associatedKey": "{{ $form.values && $form.values.associatedKey }}"
          //     },
          //   },
          // },
          {
            type: "value:schema",
            target: "displayFields",
            condition: "{{ $self.value === 'details' }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $form.values && $form.values.associatedKey }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "displayFormFields",
            condition: "{{ $self.value === 'details' }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $form.values && $form.values.associatedKey }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "associationField",
            condition: "{{ $self.value === 'association' }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $form.values && $form.values.associatedKey }}"
              },
            },
          },
        ],
      },
    },
    // {
    //   interface: 'string',
    //   type: 'string',
    //   name: 'association',
    //   title: '相关数据',
    //   component: {
    //     type: 'remoteSelect',
    //     showInDetail: true,
    //     showInForm: true,
    //     'x-component-props': {
    //       resourceName: 'collections.fields',
    //       labelField: 'title',
    //       valueField: 'name',
    //       filter: {
    //         interface: 'linkTo',
    //       },
    //     },
    //   },
    // },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'associationField',
      target: 'fields',
      title: '相关数据表',
      labelField: 'title',
      required: true,
      // valueField: 'name',
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections.fields',
          labelField: 'title',
          // valueField: 'name',
          objectValue: true,
          filter: {
            interface: 'linkTo',
          },
        },
        "x-linkages": [
          {
            type: "value:visible",
            target: "viewName",
            condition: "{{ !!$self.value }}"
          },
          {
            type: "value:schema",
            target: "viewName",
            condition: "{{ !!$self.value }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $self.value.target }}"
              },
            },
          },
        ],
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'displayFields',
      title: '显示在详情中的字段',
      labelField: 'title',
      // valueField: 'name',
      component: {
        type: 'draggableTable',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
          mode: 'showInDetail',
          fields: [
            // {
            //   interface: 'sort',
            //   name: 'sort',
            //   title: '排序',
            //   type: 'sort',
            //   dataIndex: ['sort'],
            //   className: 'drag-visible',
            // },
            {
              interface: 'string',
              name: 'title',
              title: '字段名称',
              type: 'string',
              className: 'drag-visible',
              dataIndex: ['title'],
            }
          ],
        },
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'displayFormFields',
      title: '当前标签页可编辑字段',
      labelField: 'title',
      // valueField: 'name',
      component: {
        type: 'draggableTable',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
          mode: 'showInForm',
          fields: [
            // {
            //   interface: 'sort',
            //   name: 'sort',
            //   title: '排序',
            //   type: 'sort',
            //   dataIndex: ['sort'],
            //   className: 'drag-visible',
            // },
            {
              interface: 'string',
              name: 'title',
              title: '字段名称',
              type: 'string',
              className: 'drag-visible',
              dataIndex: ['title'],
            }
          ],
        },
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'viewName',
      title: '视图',
      labelField: 'title',
      required: true,
      // valueField: 'name',
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections.views',
          labelField: 'title',
          valueField: 'name',
        },
      },
    },
    {
      interface: 'boolean',
      type: 'radio',
      name: 'default',
      title: '作为默认标签页',
      defaultValue: false,
      scope: ['collection'],
      component: {
        type: 'checkbox',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'enabled',
      title: '启用',
      defaultValue: true,
      component: {
        type: 'checkbox',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '所属数据表',
      target: 'collections',
      targetKey: 'name',
      component: {
        type: 'drawerSelect',
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
      filter: {
        default: false
      }
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
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
      developerMode: true,
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
      developerMode: true,
    },
    {
      type: 'table',
      name: 'simple',
      title: '简易模式',
      template: 'Table',
      mode: 'simple',
      default: true,
      actionNames: ['destroy', 'create'],
      detailsViewName: 'details',
      updateViewName: 'form',
      paginated: false,
      draggable: true,
    },
  ],
} as TableOptions;
